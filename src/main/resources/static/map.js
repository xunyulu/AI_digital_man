/**
 * 高德地图模块 — 景点标记 + GPS定位 + 模拟定位 + 步行路线
 * 最佳实践: JS API 2.0 security config + 按景区过滤 + 自定义Marker + 信息窗交互
 */
(function() {

  let map = null;
  let markers = [];
  let markersMap = {};
  let walkingPlugin = null;
  let walkingRoute = null;
  let userMarker = null;
  let userLocation = null;
  let simMarker = null;
  let simulatedLocation = null;
  let simulationMode = false;
  let currentScenicSpotId = null;

  const $ = sel => document.querySelector(sel);

  // 景点分类配色
  const CATEGORY_COLORS = {
    '建筑': '#e74c3c', '寺庙': '#e67e22', '广场景观': '#2ecc71',
    '自然': '#27ae60', '文化': '#8e44ad', '历史': '#c0392b',
    '体验': '#3498db', '服务': '#1abc9c', 'default': '#2e8b57'
  };
  function getColor(index, total) {
    const hue = (index / Math.max(total, 1)) * 360;
    return `hsl(${hue}, 65%, 45%)`;
  }

  // ===== Init =====
  async function init() {
    try {
      // JS API 2.0 安全配置（必须在加载脚本前设置）
      window._AMapSecurityConfig = {};

      const configRes = await fetch('/api/amap/config');
      const config = await configRes.json();

      // 加载高德地图 JS API 2.0
      await loadScript('https://webapi.amap.com/maps?v=2.0&key=' + config.data.jsApiKey + '&plugin=AMap.Walking,AMap.Scale,AMap.ToolBar');

      map = new AMap.Map('amapContainer', {
        zoom: 15,
        center: [120.1045, 31.4220],
        resizeEnable: true,
        viewMode: '2D'
      });

      // 添加控件
      map.addControl(new AMap.Scale({ position: 'LB' }));
      map.addControl(new AMap.ToolBar({ position: 'RT', visible: false }));

      console.log('🗺️ Map initialized');

      // 加载活跃景区的景点
      await loadActiveAttractions();

      // GPS定位
      locateUser();

      updateStatus('就绪 (' + markers.length + '个景点)');
    } catch (e) {
      console.error('地图初始化失败:', e);
      updateStatus('加载失败：' + e.message);
    }

    // 事件监听
    document.addEventListener('click', function(e) {
      const btn = e.target.closest && e.target.closest('.map-ask-btn');
      if (!btn) return;
      const name = btn.getAttribute('data-attr-name');
      if (name) {
        window.dispatchEvent(new CustomEvent('chat:ask-about', {
          detail: { attractionName: name }
        }));
        map.clearInfoWindow();
      }
    });

    $('#locateBtn').addEventListener('click', locateUser);
    $('#simulateBtn').addEventListener('click', toggleSimulation);
    $('#resetMapBtn').addEventListener('click', resetMap);
    $('#mapInfoClose').addEventListener('click', hideInfoBar);

    map.on('click', function(e) {
      if (!simulationMode) return;
      setSimulatedPosition(e.lnglat.getLng(), e.lnglat.getLat());
    });

    window.addEventListener('map:draw-route', handleDrawRoute);
    window.addEventListener('map:focus-attraction', handleFocusAttraction);
    window.addEventListener('map:switch-scenic', handleSwitchScenic);

    // 面板折叠/窗口变化时更新地图大小
    const panelLeft = $('#panelLeft');
    if (panelLeft) {
      const observer = new MutationObserver(() => {
        setTimeout(() => { if (map) map.resize(); }, 350);
      });
      observer.observe(panelLeft, { attributes: true, attributeFilter: ['class'] });
    }
    window.addEventListener('resize', () => { if (map) map.resize(); });

    window.__tourGuideState = window.__tourGuideState || {};
  }

  // ===== Script loader =====
  function loadScript(url) {
    return new Promise(function(resolve, reject) {
      if (window.AMap) { resolve(); return; }
      const s = document.createElement('script');
      s.src = url;
      s.onload = function() { console.log('AMap loaded'); resolve(); };
      s.onerror = function() { reject(new Error('AMap load failed')); };
      document.head.appendChild(s);
    });
  }

  // ===== Load Attractions =====
  async function loadActiveAttractions() {
    // 先获取活跃景区ID
    try {
      const spotRes = await fetch('/api/tourist/active-scenic-spot');
      const spotBody = await spotRes.json();
      if (spotBody.code === 200 && spotBody.data && spotBody.data.id > 0) {
        currentScenicSpotId = spotBody.data.id;
      }
    } catch(e) {}

    // 加载景点标记
    const url = currentScenicSpotId
      ? '/api/amap/attractions?scenicSpotId=' + currentScenicSpotId
      : '/api/amap/active-attractions';

    const res = await fetch(url);
    const json = await res.json();
    const attractions = json.data || [];
    window.__tourGuideState.attractions = attractions;

    // 清除旧标记
    clearMarkers();

    // 添加新标记
    attractions.forEach(function(attr, i) {
      addMarker(attr, i, attractions.length);
    });

    if (markers.length > 0 && map) {
      map.setFitView(null, false, [80, 60, 80, 60]);
    }
    updateStatus('已加载 ' + markers.length + ' 个景点');
  }

  function clearMarkers() {
    markers.forEach(function(m) { map.remove(m); });
    markers = [];
    markersMap = {};
  }

  // ===== Custom Marker =====
  function addMarker(attr, index, total) {
    const color = getColor(index, total);
    // 创建自定义标记内容（圆形数字标签）
    const labelContent = document.createElement('div');
    labelContent.style.cssText = `
      background:${color};color:#fff;width:28px;height:28px;
      border-radius:50%;display:flex;align-items:center;justify-content:center;
      font-size:12px;font-weight:700;border:2px solid #fff;
      box-shadow:0 2px 6px rgba(0,0,0,0.3);cursor:pointer;
      transition:transform 0.2s;
    `;
    labelContent.textContent = index + 1;
    labelContent.addEventListener('mouseenter', () => { labelContent.style.transform = 'scale(1.2)'; });
    labelContent.addEventListener('mouseleave', () => { labelContent.style.transform = 'scale(1)'; });

    const marker = new AMap.Marker({
      position: [attr.longitude, attr.latitude],
      title: attr.name,
      content: labelContent,
      offset: new AMap.Pixel(-14, -14),
      zIndex: 50 + index
    });

    marker.on('click', function() { onMarkerClick(attr, marker); });
    map.add(marker);
    markers.push(marker);
    markersMap[attr.name] = { lng: attr.longitude, lat: attr.latitude, id: attr.id };
  }

  // ===== Marker Click → InfoWindow =====
  function onMarkerClick(attr, marker) {
    map.clearInfoWindow();
    const distText = userLocation
      ? ' 📍 距您约 ' + Math.round(haversine(userLocation[1], userLocation[0], attr.latitude, attr.longitude)) + 'm'
      : '';
    const html = `
      <div style="max-width:240px;font-family:-apple-system,sans-serif">
        <strong style="font-size:15px;color:#333">${attr.name}</strong>
        <span style="font-size:11px;color:#999;margin-left:4px">${distText}</span>
        <p style="font-size:12px;color:#666;line-height:1.6;margin:6px 0">${attr.description || '暂无介绍'}</p>
        <div style="display:flex;gap:6px">
          <button class="map-ask-btn" data-attr-name="${attr.name}"
            style="flex:1;padding:6px 0;border-radius:8px;background:#2e8b57;color:#fff;border:none;font-size:12px;cursor:pointer">
            💬 问一问
          </button>
          <button class="map-nav-btn" data-lng="${attr.longitude}" data-lat="${attr.latitude}" data-name="${attr.name}"
            style="flex:1;padding:6px 0;border-radius:8px;background:#fff;color:#2e8b57;border:1px solid #2e8b57;font-size:12px;cursor:pointer">
            🚶 导航去
          </button>
        </div>
      </div>`;
    const iw = new AMap.InfoWindow({
      content: html,
      offset: new AMap.Pixel(0, -35),
      closeWhenClickMap: true
    });
    iw.open(map, marker.getPosition());

    // "导航去"按钮事件
    setTimeout(() => {
      const navBtn = document.querySelector('.map-nav-btn');
      if (navBtn) {
        navBtn.addEventListener('click', function(e) {
          e.stopPropagation();
          const lng = parseFloat(this.dataset.lng);
          const lat = parseFloat(this.dataset.lat);
          const name = this.dataset.name;
          if (userLocation) {
            window.dispatchEvent(new CustomEvent('map:draw-route', {
              detail: { originLng: userLocation[0], originLat: userLocation[1],
                        destLng: lng, destLat: lat, destName: name }
            }));
          } else {
            updateStatus('请点击 🎯 模拟定位后使用导航');
            var t = document.getElementById('toast');
          if (t) { t.textContent = '请先开启模拟定位（点击地图右侧 🎯 按钮）'; t.classList.add('show'); setTimeout(function() { t.classList.remove('show'); }, 3000); }
          }
          map.clearInfoWindow();
        });
      }
    }, 100);
  }

  // ===== GPS Location =====
  function locateUser() {
    if (!navigator.geolocation) {
      updateStatus('浏览器不支持定位');
      return;
    }
    navigator.geolocation.getCurrentPosition(function(pos) {
      if (simulationMode) { updateStatus('模拟模式中'); return; }
      userLocation = [pos.coords.longitude, pos.coords.latitude];
      window.__tourGuideState.userLocation = userLocation;
      console.log('📍 GPS定位成功:', userLocation);
      reportLocation(pos.coords.longitude, pos.coords.latitude);

      // 更新用户标记
      updateUserMarker();

      // 自动将地图中心移到用户位置
      map.setCenter(userLocation);
    }, function(err) {
      updateStatus('定位失败，可开启模拟');
      console.log('GPS error:', err.message);
    }, { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 });
  }

  function updateUserMarker() {
    if (!userLocation) return;
    if (userMarker) {
      userMarker.setPosition(userLocation);
    } else {
      // 自定义用户位置标记（蓝色圆点+脉冲）
      const content = document.createElement('div');
      content.innerHTML = `
        <div style="position:relative;width:20px;height:20px">
          <div style="position:absolute;width:20px;height:20px;background:#4A90D9;border-radius:50%;border:3px solid #fff;box-shadow:0 2px 8px rgba(0,0,0,0.3)"></div>
          <div style="position:absolute;width:20px;height:20px;background:rgba(74,144,217,0.3);border-radius:50%;animation:map-pulse 2s infinite"></div>
        </div>`;
      userMarker = new AMap.Marker({
        position: userLocation,
        content: content,
        offset: new AMap.Pixel(-10, -10),
        zIndex: 200
      });
      map.add(userMarker);
    }
  }

  // ===== Simulation Mode =====
  function toggleSimulation() {
    simulationMode = !simulationMode;
    const btn = $('#simulateBtn');
    if (simulationMode) {
      btn.style.background = '#ff9800'; btn.style.color = '#fff';
      btn.textContent = '🎯 模拟中'; btn.title = '点击退出模拟';
      updateStatus('模拟模式：点击地图设置位置');
      if (!simulatedLocation) {
        setSimulatedPosition(120.1050, 31.4220);
      }
    } else {
      btn.style.background = ''; btn.style.color = ''; btn.textContent = '🎯';
      btn.title = '模拟定位';
      if (simMarker) { map.remove(simMarker); simMarker = null; }
      simulatedLocation = null;
      if (userMarker) {
        const pos = userMarker.getPosition();
        userLocation = [pos.getLng(), pos.getLat()];
      }
      window.__tourGuideState.userLocation = userLocation;
      updateStatus(userLocation ? 'GPS定位中' : '就绪');
    }
  }

  function setSimulatedPosition(lng, lat) {
    simulatedLocation = [lng, lat];
    userLocation = [lng, lat];
    window.__tourGuideState.userLocation = userLocation;
    reportLocation(lng, lat);

    if (simMarker) {
      simMarker.setPosition([lng, lat]);
    } else {
      const content = document.createElement('div');
      content.innerHTML = `
        <div style="position:relative;width:36px;height:36px">
          <div style="width:36px;height:36px;background:#ff9800;border-radius:50%;display:flex;align-items:center;justify-content:center;border:3px solid #fff;box-shadow:0 3px 10px rgba(255,152,0,0.4);font-size:16px">📍</div>
        </div>`;
      simMarker = new AMap.Marker({
        position: [lng, lat],
        content: content,
        offset: new AMap.Pixel(-18, -18),
        zIndex: 250,
        draggable: true
      });
      simMarker.on('dragend', function() {
        const p = simMarker.getPosition();
        simulatedLocation = [p.getLng(), p.getLat()];
        userLocation = [p.getLng(), p.getLat()];
        window.__tourGuideState.userLocation = userLocation;
        reportLocation(p.getLng(), p.getLat());
        updateStatus('位置已更新');
      });
      map.add(simMarker);
    }
    updateStatus('模拟位置: ' + lng.toFixed(5) + ', ' + lat.toFixed(5));
  }

  // ===== Route Drawing =====
  function handleDrawRoute(e) {
    const d = e.detail;
    console.log('🗺️ draw-route:', d.originLng, d.originLat, '→', d.destLng, d.destLat);

    // 清除旧路线
    if (walkingRoute) { walkingRoute.clear(); walkingRoute = null; }

    if (window.AMap && AMap.Walking) {
      const walking = new AMap.Walking({
        map: map,
        panel: null,
        hideMarkers: true  // 不显示默认起终点标记，我们自己画
      });
      walking.search([d.originLng, d.originLat], [d.destLng, d.destLat], function(status, result) {
        if (status === 'complete' && result.routes && result.routes[0]) {
          const r = result.routes[0];
          walkingRoute = { clear: function() { walking.clear(); } };

          // 添加起点/终点图标
          addRouteEndpoints(d);

          const distKm = (r.distance / 1000).toFixed(1);
          const min = Math.ceil(r.time / 60);
          showInfoBar(`🚶 <b>步行前往${d.destName}</b>：${r.distance}m（${distKm}km），约${min}分钟`);
          map.setFitView(null, false, [80, 250, 80, 60]);

          // 输出路线步骤到控制台
          if (r.steps) {
            console.log('🚶 步行路线步骤:');
            r.steps.forEach((s, i) => console.log(`  ${i+1}. ${s.instruction} (${s.distance}m)`));
          }
        } else {
          // 步行失败 → 直线
          fallbackStraightLine(d);
        }
      });
      return;
    }

    // 插件未加载 → 直线
    fallbackStraightLine(d);
  }

  function fallbackStraightLine(d) {
    const line = new AMap.Polyline({
      path: [[d.originLng, d.originLat], [d.destLng, d.destLat]],
      strokeColor: '#2e8b57', strokeWeight: 4, strokeStyle: 'dashed',
      strokeOpacity: 0.7, lineJoin: 'round'
    });
    map.add(line);
    if (walkingRoute) walkingRoute.clear();
    walkingRoute = { clear: function() { map.remove(line); } };
    addRouteEndpoints(d);
    showInfoBar('📍 到 <b>' + d.destName + '</b> 的直线距离');
    map.setFitView(null, false, [80, 250, 80, 60]);
  }

  function addRouteEndpoints(d) {
    // 起点
    const startMarker = new AMap.Marker({
      position: [d.originLng, d.originLat],
      content: `<div style="width:12px;height:12px;background:#4A90D9;border-radius:50%;border:2px solid #fff;box-shadow:0 1px 4px rgba(0,0,0,0.3)"></div>`,
      offset: new AMap.Pixel(-6, -6), zIndex: 300
    });
    map.add(startMarker);
    // 终点
    const endMarker = new AMap.Marker({
      position: [d.destLng, d.destLat],
      content: `<div style="width:16px;height:16px;background:#e74c3c;border-radius:50%;border:3px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,0.4)"></div>`,
      offset: new AMap.Pixel(-8, -8), zIndex: 300
    });
    map.add(endMarker);
    // 自动清除（10秒后）
    // Route endpoints persist for 1 minute, or clear on reset
    setTimeout(function() {
      if (walkingRoute) { map.remove(startMarker); map.remove(endMarker); }
    }, 60000);
  }

  function handleFocusAttraction(e) {
    map.setCenter([e.detail.lng, e.detail.lat]);
    map.setZoom(17);
  }

  // ===== Scenic Spot Switch =====
  function handleSwitchScenic(e) {
    loadActiveAttractions();
  }

  // ===== Reset =====
  function resetMap() {
    if (walkingRoute) { walkingRoute.clear(); walkingRoute = null; }
    hideInfoBar(); map.clearInfoWindow();
    if (simulationMode) toggleSimulation();
    if (markers.length > 0) {
      map.setFitView(null, false, [80, 60, 80, 60]);
    }
    updateStatus('已重置 (' + markers.length + '个景点)');
  }

  // ===== UI Helpers =====
  function showInfoBar(html) {
    $('#mapInfoContent').innerHTML = html;
    $('#mapInfoBar').style.display = 'flex';
  }
  function hideInfoBar() { $('#mapInfoBar').style.display = 'none'; }
  function updateStatus(msg) {
    const el = $('#mapStatus');
    if (el) el.textContent = msg;
  }

  // ===== Utils =====
  function haversine(lat1, lng1, lat2, lng2) {
    const R = 6371000;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI/180) * Math.cos(lat2 * Math.PI/180) *
              Math.sin(dLng/2) * Math.sin(dLng/2);
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  }

  function reportLocation(lng, lat) {
    const did = window.__tourGuideState && window.__tourGuideState.deviceId;
    if (!did) { console.warn('reportLocation: no deviceId'); return; }
    fetch('/api/tourist/location?deviceId=' + did + '&lng=' + lng + '&lat=' + lat, { method: 'POST' })
      .catch(function(e) { console.log('Location report failed:', e); });
  }

  // Expose
  window.__reportLocation = reportLocation;
  window.__setSimPos = setSimulatedPosition;
  window.__getSimMode = function() { return simulationMode; };
  window.__reloadAttractions = loadActiveAttractions;

  // ===== Highlight Attraction on Map =====
  // Called by app.js when user asks about going to a place
  var highlightMarker = null;
  window.__highlightAttraction = function(name) {
    var target = markersMap[name];
    if (!target) {
      console.log('Highlight: attraction not found in markersMap:', name);
      return;
    }
    // Clear previous highlight
    if (highlightMarker) { map.remove(highlightMarker); highlightMarker = null; }
    map.clearInfoWindow();

    // Create a prominent pulsing marker
    var pulseEl = document.createElement('div');
    pulseEl.style.cssText =
      'width:40px;height:40px;border-radius:50%;' +
      'background:rgba(255,76,76,0.35);' +
      'border:3px solid #ff2d2d;' +
      'box-shadow:0 0 20px rgba(255,44,44,0.6);' +
      'animation: map-pulse 1.2s infinite;';

    var pinEl = document.createElement('div');
    pinEl.style.cssText =
      'position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);' +
      'width:16px;height:16px;border-radius:50%;' +
      'background:#ff2d2d;border:2px solid #fff;';

    var container = document.createElement('div');
    container.style.cssText = 'position:relative;width:40px;height:40px;';
    container.appendChild(pulseEl);
    container.appendChild(pinEl);

    highlightMarker = new AMap.Marker({
      position: [target.lng, target.lat],
      content: container,
      offset: new AMap.Pixel(-20, -20),
      zIndex: 999
    });
    map.add(highlightMarker);

    // Center map on the highlighted location
    map.setCenter([target.lng, target.lat]);
    map.setZoom(17);

    // Show info window
    var iw = new AMap.InfoWindow({
      content: '<div style="font-family:-apple-system,sans-serif;padding:4px">' +
               '<strong style="font-size:14px;color:#333">📍 ' + name + '</strong>' +
               '<p style="font-size:12px;color:#666;margin:4px 0 0">你想去的地方在这里</p>' +
               '</div>',
      offset: new AMap.Pixel(0, -45),
      closeWhenClickMap: true
    });
    iw.open(map, [target.lng, target.lat]);

    // Auto-remove highlight after 15 seconds
    setTimeout(function() {
      if (highlightMarker) {
        map.remove(highlightMarker);
        highlightMarker = null;
      }
    }, 15000);
  };

  init();
})();
