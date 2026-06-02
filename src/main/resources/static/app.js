(function() {

const deviceId = 'web-' + Date.now();
let conversationId = null;
let isStreaming = false;

const $ = sel => document.querySelector(sel);
const chatArea = $('#chatArea');
const chatEmpty = $('#chatEmpty');
const msgInput = $('#msgInput');
const sendBtn = $('#sendBtn');
const voiceBtn = $('#voiceBtn');
const quickBtns = document.querySelectorAll('.quick-btn');
const toast = $('#toast');

// ===== Init =====
async function init() {
  try {
    const res = await fetch('/api/tourist/scenic-spots');
    const body = await res.json();
    if (body.code === 200 && body.data && body.data.length > 0) {
      const spot = body.data[0];
      $('#guideName').textContent = spot.name || '灵灵';
    }
  } catch(e) {
    console.log('加载景区信息失败', e);
  }
  await ensureConversation();
}

async function ensureConversation() {
  if (conversationId) return;
  try {
    const res = await fetch('/api/tourist/conversation/start?deviceId=' + deviceId + '&attractionId=1', { method: 'POST' });
    const body = await res.json();
    if (body.code === 200) {
      conversationId = body.data;
    }
  } catch(e) {
    console.log('创建对话失败', e);
  }
}

// ===== Send Message =====
async function sendMessage(text) {
  if (!text.trim() || isStreaming) return;
  await ensureConversation();
  if (!conversationId) return;

  // Hide empty state
  chatEmpty.style.display = 'none';

  // Add user bubble
  addBubble('user', text);

  // Add AI bubble placeholder
  const aiBubble = addBubble('ai', '', true);

  // Send + stream
  isStreaming = true;
  let hasContent = false;
  try {
    const res = await fetch('/api/tourist/conversation/' + conversationId + '/message/stream', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: text })
    });

    if (!res.ok) {
      throw new Error('HTTP ' + res.status);
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (line.startsWith('data:')) {
          let content = line.substring(5);
          if (content) {
            hasContent = true;
            appendToBubble(aiBubble, content);
          }
        }
      }
    }

    // Flush remaining buffer (final incomplete line after stream ends)
    if (buffer && buffer.startsWith('data:')) {
      let content = buffer.substring(5);
      if (content) {
        hasContent = true;
        appendToBubble(aiBubble, content);
      }
    }
  } catch(e) {
    // Only show error if NO content was received (real network failure)
    if (!hasContent) {
      appendToBubble(aiBubble, ' [网络异常，请重试]');
    }
    console.error('SSE stream ended:', e.message);
  }

  // Remove typing dots
  const dots = aiBubble.querySelector('.typing-dots');
  if (dots) dots.remove();

  isStreaming = false;

  // Fetch latest message to check for TTS audio
  try {
    const msgRes = await fetch('/api/tourist/conversation/' + conversationId + '/messages');
    const msgBody = await msgRes.json();
    if (msgBody.code === 200 && msgBody.data && msgBody.data.length > 0) {
      const lastMsg = msgBody.data[msgBody.data.length - 1];
      if (lastMsg.audioUrl) {
        playAudio(lastMsg.audioUrl, aiBubble);
      }
    }
  } catch(e) {
    console.log('获取音频失败', e);
  }
}

// ===== DOM Helpers =====
function addBubble(role, content, streaming) {
  const div = document.createElement('div');
  div.className = 'message ' + role;

  const avatar = document.createElement('div');
  avatar.className = 'bubble-avatar';
  avatar.textContent = role === 'user' ? '我' : '灵';

  const bubble = document.createElement('div');
  bubble.className = 'bubble';

  if (streaming) {
    const dots = document.createElement('div');
    dots.className = 'typing-dots';
    dots.innerHTML = '<span></span><span></span><span></span>';
    bubble.appendChild(dots);
  } else {
    bubble.textContent = content;
  }

  div.appendChild(avatar);
  div.appendChild(bubble);
  chatArea.appendChild(div);
  scrollToBottom();
  return bubble;
}

function appendToBubble(bubble, text) {
  // Remove dots if present (first content chunk)
  const dots = bubble.querySelector('.typing-dots');
  if (dots) dots.remove();

  // Append text node or add to existing text
  const lastChild = bubble.lastChild;
  if (lastChild && lastChild.nodeType === Node.TEXT_NODE) {
    lastChild.textContent += text;
  } else {
    bubble.appendChild(document.createTextNode(text));
  }
  scrollToBottom();
}

function scrollToBottom() {
  requestAnimationFrame(() => {
    chatArea.scrollTop = chatArea.scrollHeight;
  });
}

function playAudio(url, bubble) {
  const audio = new Audio(url);
  // Add replay button if not already in bubble
  if (bubble && !bubble.querySelector('.play-audio')) {
    const btn = document.createElement('button');
    btn.className = 'play-audio';
    btn.textContent = '🔊 播报';
    btn.addEventListener('click', () => {
      setDHState('speaking');
      audio.currentTime = 0;
      audio.play();
    });
    bubble.appendChild(btn);
  }
  setDHState('speaking');
  audio.play().catch(e => console.log('音频播放失败', e));
  audio.addEventListener('ended', () => setDHState('idle'));
  audio.addEventListener('error', () => setDHState('idle'));
}

function setDHState(state) {
  const dh = document.getElementById('digitalHuman');
  if (!dh) return;
  dh.className = 'digital-human dh-state-' + state;
}

// ===== Toast =====
function showToast(msg) {
  toast.textContent = msg;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 2000);
}

// ===== Event Listeners =====
sendBtn.addEventListener('click', () => {
  const text = msgInput.value.trim();
  if (!text) return;
  msgInput.value = '';
  sendMessage(text);
});

msgInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    sendBtn.click();
  }
});

// ===== Voice Recording (push-to-talk) =====
let mediaRecorder = null;
let audioChunks = [];

async function startRecording() {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
      ? 'audio/webm;codecs=opus' : 'audio/webm';
    mediaRecorder = new MediaRecorder(stream, { mimeType });
    audioChunks = [];
    mediaRecorder.ondataavailable = e => audioChunks.push(e.data);
    mediaRecorder.start();
    voiceBtn.classList.add('recording');
    setDHState('listening');
    showToast('正在聆听...');
  } catch(e) {
    showToast('无法访问麦克风');
    console.error(e);
  }
}

async function stopRecording() {
  if (!mediaRecorder || mediaRecorder.state === 'inactive') return;
  return new Promise(resolve => {
    mediaRecorder.onstop = async () => {
      voiceBtn.classList.remove('recording');
      mediaRecorder.stream.getTracks().forEach(t => t.stop());
      if (audioChunks.length === 0) { resolve(); return; }
      showToast('识别中...');
      try {
        const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
        const formData = new FormData();
        formData.append('audio', audioBlob, 'recording.webm');
        const res = await fetch('/api/tourist/conversation/voice/recognize', {
          method: 'POST', body: formData
        });
        const body = await res.json();
        if (body.code === 200 && body.data) {
          sendMessage(body.data);
        } else {
          showToast('语音识别失败，请重试');
        }
      } catch(e) {
        showToast('语音识别失败');
        console.error(e);
      }
      resolve();
    };
    mediaRecorder.stop();
  });
}

voiceBtn.addEventListener('pointerdown', e => { e.preventDefault(); startRecording(); });
voiceBtn.addEventListener('pointerup', e => { e.preventDefault(); stopRecording(); });
voiceBtn.addEventListener('pointerleave', e => { if (mediaRecorder?.state === 'recording') stopRecording(); });
// Touch events for mobile
voiceBtn.addEventListener('touchstart', e => { e.preventDefault(); startRecording(); });
voiceBtn.addEventListener('touchend', e => { e.preventDefault(); stopRecording(); });

quickBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    sendMessage(btn.dataset.q);
    // Collapse avatar area after first message to save space
    $('#avatarStage').classList.add('collapsed');
    $('#quickActions').style.display = 'none';
  });
});

// Collapse avatar when user types
msgInput.addEventListener('focus', () => {
  if (chatArea.children.length > 0) {
    $('#avatarStage').classList.add('collapsed');
    $('#quickActions').style.display = 'none';
  }
});

// ===== Start =====
init();

})();
