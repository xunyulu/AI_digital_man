(function() {

const deviceId = 'web-' + Date.now();
// 暴露给 map.js 用于位置上报
window.__tourGuideState = window.__tourGuideState || {};
window.__tourGuideState.deviceId = deviceId;
let conversationId = null;
let activeScenicSpotId = null;
let isStreaming = false;

const $ = sel => document.querySelector(sel);
const chatArea = $('#chatArea');
const chatEmpty = $('#chatEmpty');
const msgInput = $('#msgInput');
const sendBtn = $('#sendBtn');
const voiceBtn = $('#voiceBtn');
const autoAudioBtn = $('#autoAudioBtn');
const quickBtns = document.querySelectorAll('.quick-btn');
const toast = $('#toast');

const STREAM_AUDIO_PREFIX = '__TOUR_AUDIO_URL__:';
let autoPlayAudio = localStorage.getItem('tourGuideAutoAudio') !== 'false';
let currentAudio = null;
let currentAudioControls = null;

// ===== Init =====
async function init() {
  let activeName = '灵灵';
  let activeId = null;
  const descEl = $('#scenicInfoDesc');
  try {
    // 优先读取管理员设置的活跃景区
    const activeRes = await fetch('/api/tourist/active-scenic-spot');
    const activeBody = await activeRes.json();
    if (activeBody.code === 200 && activeBody.data && activeBody.data.name) {
      activeName = activeBody.data.name;
      activeId = activeBody.data.id;
      activeScenicSpotId = activeBody.data.id;
    } else {
      // 回退到第一个景区
      const res = await fetch('/api/tourist/scenic-spots');
      const body = await res.json();
      if (body.code === 200 && body.data && body.data.length > 0) {
        activeName = body.data[0].name || '灵灵';
        activeId = body.data[0].id;
        activeScenicSpotId = body.data[0].id;
      }
    }
  } catch(e) {
    if (descEl) descEl.textContent = '景区信息加载失败，请确认后端服务已启动';
    showToast('景区信息加载失败');
    console.log('加载景区信息失败', e);
  }

  // 更新所有景区名称展示
  const guideEl = $('#guideName');
  if (guideEl) guideEl.textContent = activeName;
  const scenicNameEl = $('#scenicInfoName');
  if (scenicNameEl) scenicNameEl.textContent = activeName;

  // 加载景区详情
  if (activeId) {
    try {
      const detailRes = await fetch('/api/tourist/scenic-spots/' + activeId);
      const detailBody = await detailRes.json();
      if (detailBody.code === 200 && detailBody.data) {
        const spot = detailBody.data;
        if (descEl) descEl.textContent = spot.description || '暂无介绍';
      }
    } catch(e) {
      if (descEl) descEl.textContent = '景区详情加载失败';
      console.log('加载景区详情失败', e);
    }
  } else if (descEl && descEl.textContent === '加载中...') {
    descEl.textContent = '暂无景区信息';
  }

  await ensureConversation();
}

async function ensureConversation() {
  if (conversationId) return true;
  try {
    // 不传attractionId，让AI根据管理员设置的活跃景区来提供知识
    const res = await fetch('/api/tourist/conversation/start?deviceId=' + encodeURIComponent(deviceId), { method: 'POST' });
    if (!res.ok) throw new Error('HTTP ' + res.status);
    const body = await res.json();
    if (body.code === 200) {
      conversationId = body.data;
      return true;
    }
  } catch(e) {
    showToast('创建对话失败，请检查后端服务');
    console.log('创建对话失败', e);
  }
  return false;
}

// ===== Send Message =====
async function sendMessage(text) {
  if (!text.trim() || isStreaming) return;
  const ready = await ensureConversation();
  if (!ready || !conversationId) {
    showToast('对话未创建，暂时不能发送');
    return;
  }

  // Hide empty state
  chatEmpty.style.display = 'none';

  // Add user bubble
  addBubble('user', text);

  // Add AI bubble placeholder
  const aiBubble = addBubble('ai', '', true);

  // Send + stream
  isStreaming = true;
  let hasContent = false;
  let audioUrl = null;
  const handleStreamContent = content => {
    if (content.startsWith(STREAM_AUDIO_PREFIX)) {
      audioUrl = content.substring(STREAM_AUDIO_PREFIX.length).trim() || null;
      return;
    }
    if (content) {
      hasContent = true;
      appendToBubble(aiBubble, content);
    }
  };

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
          handleStreamContent(line.substring(5));
        }
      }
    }

    // Flush remaining buffer (final incomplete line after stream ends)
    if (buffer && buffer.startsWith('data:')) {
      handleStreamContent(buffer.substring(5));
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

  // Check if user/AI mentioned a place → highlight on map
  const aiText = aiBubble.textContent || '';
  checkAndHighlightOnMap(text + ' ' + aiText);

  if (audioUrl) {
    playAudio(audioUrl, aiBubble);
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
  if (!bubble) return;
  let controls = bubble.querySelector('.audio-controls');
  if (controls && controls._audio) {
    if (autoPlayAudio) startAudio(controls._audio, controls, true);
    return;
  }

  const audio = new Audio(url);
  controls = document.createElement('div');
  controls.className = 'audio-controls';
  controls._audio = audio;

  const replayBtn = createAudioButton('↻', '重播');
  const pauseBtn = createAudioButton(autoPlayAudio ? '⏸' : '▶', '暂停/继续');
  const stopBtn = createAudioButton('■', '停止');
  const status = document.createElement('span');
  status.className = 'audio-status';
  status.textContent = autoPlayAudio ? '准备播报' : '待播报';

  controls.appendChild(replayBtn);
  controls.appendChild(pauseBtn);
  controls.appendChild(stopBtn);
  controls.appendChild(status);
  bubble.appendChild(controls);

  replayBtn.addEventListener('click', () => startAudio(audio, controls, true));
  pauseBtn.addEventListener('click', () => {
    if (audio.paused) {
      startAudio(audio, controls, false);
    } else {
      audio.pause();
      status.textContent = '已暂停';
    }
  });
  stopBtn.addEventListener('click', () => stopAudio(audio, controls));

  audio.addEventListener('play', () => {
    pauseBtn.textContent = '⏸';
    status.textContent = '播报中';
    setDHState('speaking');
  });
  audio.addEventListener('pause', () => {
    if (!audio.ended) {
      pauseBtn.textContent = '▶';
      if (currentAudio === audio) setDHState('idle');
    }
  });
  audio.addEventListener('ended', () => {
    pauseBtn.textContent = '▶';
    status.textContent = '已结束';
    if (currentAudio === audio) {
      currentAudio = null;
      currentAudioControls = null;
      setDHState('idle');
    }
  });
  audio.addEventListener('error', () => {
    status.textContent = '播放失败';
    if (currentAudio === audio) setDHState('idle');
  });

  if (autoPlayAudio) startAudio(audio, controls, true);
  scrollToBottom();
}

function createAudioButton(text, title) {
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.textContent = text;
  btn.title = title;
  return btn;
}

function startAudio(audio, controls, restart) {
  if (currentAudio && currentAudio !== audio) {
    currentAudio.pause();
    currentAudio.currentTime = 0;
    if (currentAudioControls) {
      const status = currentAudioControls.querySelector('.audio-status');
      if (status) status.textContent = '已停止';
    }
  }
  if (restart) audio.currentTime = 0;
  currentAudio = audio;
  currentAudioControls = controls;
  audio.play().catch(e => {
    const status = controls.querySelector('.audio-status');
    const pauseBtn = controls.children[1];
    if (status) status.textContent = '点击播放';
    if (pauseBtn) pauseBtn.textContent = '▶';
    if (currentAudio === audio) {
      currentAudio = null;
      currentAudioControls = null;
      setDHState('idle');
    }
    console.log('音频播放失败', e);
  });
}

function stopAudio(audio, controls) {
  audio.pause();
  audio.currentTime = 0;
  if (!controls) {
    if (currentAudio === audio) {
      currentAudio = null;
      currentAudioControls = null;
      setDHState('idle');
    }
    return;
  }
  const status = controls.querySelector('.audio-status');
  const pauseBtn = controls.children[1];
  if (status) status.textContent = '已停止';
  if (pauseBtn) pauseBtn.textContent = '▶';
  if (currentAudio === audio) {
    currentAudio = null;
    currentAudioControls = null;
    setDHState('idle');
  }
}

function syncAutoAudioButton() {
  if (!autoAudioBtn) return;
  autoAudioBtn.classList.toggle('active', autoPlayAudio);
  autoAudioBtn.textContent = autoPlayAudio ? '🔊' : '🔇';
  autoAudioBtn.title = autoPlayAudio ? '自动播报：开' : '自动播报：关';
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

if (autoAudioBtn) {
  syncAutoAudioButton();
  autoAudioBtn.addEventListener('click', () => {
    autoPlayAudio = !autoPlayAudio;
    localStorage.setItem('tourGuideAutoAudio', String(autoPlayAudio));
    syncAutoAudioButton();
    showToast(autoPlayAudio ? '自动播报已开启' : '自动播报已关闭');
    if (!autoPlayAudio && currentAudio) {
      stopAudio(currentAudio, currentAudioControls);
    }
  });
}

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
  });
});

// Listen for "问一问" from map marker InfoWindow
window.addEventListener('chat:ask-about', (e) => {
  const name = e.detail && e.detail.attractionName;
  if (name && !isStreaming) {
    sendMessage('请给我详细介绍一下' + name + '，包括它的特色和游览建议');
  }
});

// Left panel toggle
const toggleLeft = $('#toggleLeft');
const panelLeft = $('#panelLeft');
if (toggleLeft && panelLeft) {
  toggleLeft.addEventListener('click', () => {
    panelLeft.classList.toggle('collapsed');
    toggleLeft.textContent = panelLeft.classList.contains('collapsed') ? '▶' : '◀';
    // Trigger map resize
    window.dispatchEvent(new Event('resize'));
  });
}

// ===== Rating =====
let ratingSubmitted = false;
const ratingStars = $('#ratingStars');
const ratingHint = $('#ratingHint');
const ratingDone = $('#ratingDone');

if (ratingStars) {
  const stars = ratingStars.querySelectorAll('.star');

  stars.forEach(star => {
    star.addEventListener('mouseenter', () => {
      if (ratingSubmitted) return;
      const score = parseInt(star.dataset.score);
      highlightStars(score);
      const hints = ['', '很差', '较差', '一般', '不错', '很棒'];
      ratingHint.textContent = hints[score];
    });

    star.addEventListener('mouseleave', () => {
      if (ratingSubmitted) return;
      highlightStars(0);
      ratingHint.textContent = '点击星星评分';
    });

    star.addEventListener('click', async () => {
      if (ratingSubmitted) return;
      const score = parseInt(star.dataset.score);
      highlightStars(score);
      ratingSubmitted = true;
      ratingStars.classList.add('readonly');
      ratingHint.style.display = 'none';
      ratingDone.style.display = 'block';

      // Submit to backend
      try {
        const activeConvId = conversationId;
        const res = await fetch('/api/tourist/rating?deviceId=' + deviceId, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            score: score,
            conversationId: activeConvId || null,
            scenicSpotId: activeScenicSpotId || null,
            comment: null
          })
        });
        const body = await res.json();
        if (body.code === 200) {
          console.log('评分提交成功:', score + '分');
        }
      } catch(e) {
        console.error('评分提交失败', e);
        // Still show as done even if network fails — user experience first
      }
    });
  });
}

function highlightStars(score) {
  const stars = ratingStars.querySelectorAll('.star');
  stars.forEach(s => {
    const sVal = parseInt(s.dataset.score);
    if (score >= sVal) {
      s.textContent = '★';
      s.classList.add('active');
    } else {
      s.textContent = '☆';
      s.classList.remove('active');
    }
  });
}

// ===== Map Highlight: detect "go to" intent =====
function checkAndHighlightOnMap(userText) {
  if (!userText || !window.__highlightAttraction) return;

  // Keywords indicating user wants to go somewhere
  var goKeywords = /去|想去|到|带我去|怎么去|导航|在哪|怎么走|在哪里/;
  if (!goKeywords.test(userText)) return;

  // Get attraction names from the map's data
  var attractions = (window.__tourGuideState && window.__tourGuideState.attractions) || [];
  if (attractions.length === 0) return;

  // Find the first attraction name mentioned in user's message
  // Sort by name length descending to match longer names first (e.g., "灵山大佛" before "灵山")
  var sorted = attractions.slice().sort(function(a, b) {
    return (b.name || '').length - (a.name || '').length;
  });

  for (var i = 0; i < sorted.length; i++) {
    var name = sorted[i].name;
    if (!name || name.length < 2) continue;
    if (userText.indexOf(name) !== -1) {
      console.log('Map: highlighting', name);
      window.__highlightAttraction(name);
      return;
    }
  }
}

// ===== Start =====
init();

})();
