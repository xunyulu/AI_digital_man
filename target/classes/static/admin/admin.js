(function() {

const token = localStorage.getItem('admin_token');
if (!token) { location.href = 'login.html'; return; }
document.getElementById('adminName').textContent = localStorage.getItem('admin_user') || '管理员';

const $ = sel => document.querySelector(sel);
const $$ = sel => document.querySelectorAll(sel);

async function api(url, opts = {}) {
  const res = await fetch(url, {
    ...opts,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + token,
      ...(opts.headers || {})
    }
  });
  return res.json();
}

// ===== Navigation =====
$$('.nav-item').forEach(item => {
  item.addEventListener('click', () => {
    $$('.nav-item').forEach(n => n.classList.remove('active'));
    item.classList.add('active');
    $$('.page').forEach(p => p.classList.remove('active'));
    const page = $('#page-' + item.dataset.page);
    if (page) page.classList.add('active');
    // Load data for page
    const loader = { dashboard: loadDashboard, attractions: loadAttractions,
      knowledge: loadKnowledge, routes: loadRoutes, config: loadConfig, reports: loadReports };
    if (loader[item.dataset.page]) loader[item.dataset.page]();
  });
});

function logout() { localStorage.clear(); location.href = 'login.html'; }

// ===== Dashboard =====
async function loadDashboard() {
  const res = await api('/api/admin/dashboard/stats');
  if (res.code === 200) {
    const d = res.data;
    document.getElementById('statConversations').textContent = d.totalConversations || 0;
    document.getElementById('statActive').textContent = d.activeConversations || 0;
    document.getElementById('statTourists').textContent = d.totalTourists || 0;
    document.getElementById('statAvgScore').textContent = d.averageScore || 0;
    document.getElementById('statSpots').textContent = d.totalScenicSpots || 0;
    document.getElementById('statRatings').textContent = d.totalRatings || 0;
  }
}

// ===== Attractions =====
async function loadAttractions() {
  const res = await api('/api/admin/attractions?scenicSpotId=1');
  const tbody = document.getElementById('attrTableBody');
  tbody.innerHTML = '';
  if (res.code === 200 && res.data) {
    res.data.forEach(a => {
      tbody.innerHTML += `<tr>
        <td>${a.id}</td><td>${a.name}</td><td>${a.sortOrder||''}</td>
        <td>${a.latitude||'-'},${a.longitude||'-'}</td>
        <td class="actions">
          <button class="btn-sm" onclick="editAttr(${a.id})">编辑</button>
          <button class="btn-sm danger" onclick="delAttr(${a.id})">删除</button>
        </td></tr>`;
    });
  }
}

window.editAttr = async function(id) {
  const res = await api('/api/admin/attractions?scenicSpotId=1');
  const attr = res.data?.find(a => a.id === id);
  if (!attr) return;
  document.getElementById('attrModalTitle').textContent = '编辑景点';
  document.getElementById('attrId').value = attr.id;
  document.getElementById('attrName').value = attr.name || '';
  document.getElementById('attrDesc').value = attr.description || '';
  document.getElementById('attrLat').value = attr.latitude || '';
  document.getElementById('attrLng').value = attr.longitude || '';
  document.getElementById('attrSort').value = attr.sortOrder || 99;
  document.getElementById('attrOpenTime').value = attr.openTime || '';
  document.getElementById('attrModal').classList.add('show');
};

window.showAttrForm = function() {
  document.getElementById('attrModalTitle').textContent = '新增景点';
  document.getElementById('attrForm').reset();
  document.getElementById('attrId').value = '';
  document.getElementById('attrModal').classList.add('show');
};

window.closeAttrModal = function() {
  document.getElementById('attrModal').classList.remove('show');
};

window.delAttr = async function(id) {
  if (!confirm('确认删除？')) return;
  await fetch('/api/admin/attractions/' + id, { method: 'DELETE', headers: { 'Authorization': 'Bearer ' + token } });
  loadAttractions();
};

document.getElementById('attrForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const id = document.getElementById('attrId').value;
  const body = JSON.stringify({
    id: id || null,
    scenicSpot: { id: 1 },
    name: document.getElementById('attrName').value,
    description: document.getElementById('attrDesc').value,
    latitude: document.getElementById('attrLat').value || null,
    longitude: document.getElementById('attrLng').value || null,
    sortOrder: parseInt(document.getElementById('attrSort').value) || 99,
    openTime: document.getElementById('attrOpenTime').value || null
  });
  const url = id ? '/api/admin/attractions/' + id : '/api/admin/attractions';
  const method = id ? 'PUT' : 'POST';
  await fetch(url, { method, headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token }, body });
  closeAttrModal();
  loadAttractions();
});

// ===== Knowledge Points =====
async function loadKnowledge() {
  const res = await api('/api/admin/knowledge-points?scenicSpotId=1');
  const tbody = document.getElementById('kpTableBody');
  tbody.innerHTML = '';
  if (res.code === 200 && res.data) {
    // Also load attractions for dropdown
    const aRes = await api('/api/admin/attractions?scenicSpotId=1');
    const attrs = aRes.data || [];
    const sel = document.getElementById('kpAttraction');
    sel.innerHTML = '<option value="">无(景区通用)</option>';
    attrs.forEach(a => sel.innerHTML += `<option value="${a.id}">${a.name}</option>`);

    res.data.forEach(k => {
      tbody.innerHTML += `<tr>
        <td>${k.id}</td><td>${k.title}</td><td>${k.category||''}</td>
        <td>${k.attraction?.name||'景区通用'}</td>
        <td class="actions">
          <button class="btn-sm" onclick="editKp(${k.id})">编辑</button>
          <button class="btn-sm danger" onclick="delKp(${k.id})">删除</button>
        </td></tr>`;
    });
  }
}

window.editKp = async function(id) {
  const res = await api('/api/admin/knowledge-points?scenicSpotId=1');
  const kp = res.data?.find(k => k.id === id);
  if (!kp) return;
  document.getElementById('kpModalTitle').textContent = '编辑知识点';
  document.getElementById('kpId').value = kp.id;
  document.getElementById('kpTitle').value = kp.title || '';
  document.getElementById('kpContent').value = kp.content || '';
  document.getElementById('kpCategory').value = kp.category || '';
  document.getElementById('kpTags').value = kp.tags || '';
  document.getElementById('kpAttraction').value = kp.attraction?.id || '';
  document.getElementById('kpModal').classList.add('show');
};

window.showKpForm = function() {
  document.getElementById('kpModalTitle').textContent = '新增知识点';
  document.getElementById('kpForm').reset();
  document.getElementById('kpId').value = '';
  document.getElementById('kpModal').classList.add('show');
};

window.closeKpModal = function() { document.getElementById('kpModal').classList.remove('show'); };

window.delKp = async function(id) {
  if (!confirm('确认删除？')) return;
  await fetch('/api/admin/knowledge-points/' + id, { method: 'DELETE', headers: { 'Authorization': 'Bearer ' + token } });
  loadKnowledge();
};

document.getElementById('kpForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const id = document.getElementById('kpId').value;
  const attrId = document.getElementById('kpAttraction').value;
  const body = JSON.stringify({
    id: id || null,
    scenicSpot: { id: 1 },
    attraction: attrId ? { id: parseInt(attrId) } : null,
    title: document.getElementById('kpTitle').value,
    content: document.getElementById('kpContent').value,
    category: document.getElementById('kpCategory').value,
    tags: document.getElementById('kpTags').value
  });
  const url = id ? '/api/admin/knowledge-points/' + id : '/api/admin/knowledge-points';
  const method = id ? 'PUT' : 'POST';
  await fetch(url, { method, headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token }, body });
  closeKpModal();
  loadKnowledge();
});

// ===== Routes =====
async function loadRoutes() {
  const res = await api('/api/admin/tour-routes?scenicSpotId=1');
  const tbody = document.getElementById('routeTableBody');
  tbody.innerHTML = '';
  if (res.code === 200 && res.data) {
    for (const r of res.data) {
      const attRes = await api('/api/admin/tour-routes/' + r.id + '/attractions');
      const count = attRes.data?.length || 0;
      tbody.innerHTML += `<tr>
        <td>${r.id}</td><td>${r.name}</td><td>${r.theme||''}</td>
        <td>${r.suggestedDuration||''}</td><td>${count}</td>
        <td class="actions">
          <button class="btn-sm" onclick="delRoute(${r.id})">删除</button>
        </td></tr>`;
    }
  }
}

window.delRoute = async function(id) {
  if (!confirm('确认删除？')) return;
  await fetch('/api/admin/tour-routes/' + id, { method: 'DELETE', headers: { 'Authorization': 'Bearer ' + token } });
  loadRoutes();
};

window.showRouteForm = function() {
  alert('新增路线功能：请通过API直接创建，或稍后完善表单');
};

// ===== Config =====
async function loadConfig() {
  const res = await api('/api/admin/config');
  if (res.code === 200 && res.data) {
    if (res.data.guideName) document.getElementById('cfgGuideName').value = res.data.guideName;
    if (res.data.welcomeMsg) document.getElementById('cfgWelcome').value = res.data.welcomeMsg;
    if (res.data.ttsVoice) document.getElementById('cfgVoice').value = res.data.ttsVoice;
    if (res.data.ttsSpeed) { document.getElementById('cfgSpeed').value = res.data.ttsSpeed; document.getElementById('speedVal').textContent = res.data.ttsSpeed + 'x'; }
  }
}

document.getElementById('cfgSpeed').addEventListener('input', function() {
  document.getElementById('speedVal').textContent = this.value + 'x';
});

document.getElementById('configForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const config = {
    guideName: document.getElementById('cfgGuideName').value,
    welcomeMsg: document.getElementById('cfgWelcome').value,
    ttsVoice: document.getElementById('cfgVoice').value,
    ttsSpeed: document.getElementById('cfgSpeed').value
  };
  const res = await api('/api/admin/config', { method: 'PUT', body: JSON.stringify(config) });
  alert(res.message || '保存成功');
});

// ===== Reports =====
async function loadReports() {
  const res = await api('/api/admin/reports/sentiment');
  if (res.code === 200) {
    const d = res.data;
    // Distribution
    let distHtml = '<table class="data-table"><thead><tr><th>评分</th><th>次数</th></tr></thead><tbody>';
    (d.ratingDistribution || []).forEach(item => {
      distHtml += `<tr><td>${'⭐'.repeat(item.score)}</td><td>${item.count}</td></tr>`;
    });
    distHtml += '</tbody></table>';
    document.getElementById('reportDist').innerHTML = distHtml;

    // Queries
    const ul = document.getElementById('reportQueries');
    ul.innerHTML = '';
    (d.recentQueries || []).forEach(q => {
      ul.innerHTML += `<li>${q}</li>`;
    });
  }
}

// ===== Init =====
loadDashboard();

})();
