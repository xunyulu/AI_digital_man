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

  // ===== Init =====
  async function init() {
    try {
      const configRes = await fetch('/api/amap/config');
      const config = await configRes.json();
      await loadScript('https://webapi.amap.com/maps?v=2.0&key=' + config.data.jsApiKey);

      map = new AMap.Map('amapContainer', {
        zoom: 15,
        center: [120.1045, 31.4220],
        resizeEnable: true
      });
      console.log('Map created');

      await loadAttractions();
      loadPluginsAsync();
      locateUser();

      $('#mapStatus').textContent = '就绪 (' + markers.length + '个景点)';
    } catch (e) {
      console.error('地图初始化失败:', e);
      $('#mapStatus').textContent = '加载失败';
    }

    document.addEventListener('click', function(e) {
      var btn = e.target.closest && e.target.closest('.map-ask-btn');
      if (!btn) return;
      var name = btn.getAttribute('data-attr-name');
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

    window.__tourGuideState = window.__tourGuideState || {};
  }

  function loadScript(url) {
    return new Promise(function(resolve, reject) {
      if (window.AMap) { resolve(); return; }
      var s = document.createElement('script');
      s.src = url;
      s.onload = function() { console.log('AMap loaded'); resolve(); };
      s.onerror = function() { reject(new Error('AMap load failed')); };
      document.head.appendChild(s);
    });
  }

  function loadPluginsAsync() {
    try {
      AMap.plugin(['AMap.Walking'], function() {
        walkingPlugin = new AMap.Walking({ map: map, hideMarkers: false });
        console.log('Walking plugin ready');
      });
    } catch (e) {
      console.warn('Plugin loading skipped:', e.message);
    }
  }

  async function loadAttractions() {
    var res = await fetch('/api/amap/attractions');
    var json = await res.json();
    var attractions = json.data || [];
    window.__tourGuideState.attractions = attractions;
    attractions.forEach(function(attr) { addMarker(attr); });
    if (markers.length > 0) {
      map.setFitView(null, false, [80, 60, 80, 60]);
    }
  }

  function addMarker(attr) {
    var marker = new AMap.Marker({
      position: [attr.longitude, attr.latitude],
      title: attr.name,
      label: {
        content: '<div style="background:#2e8b57;color:#fff;padding:2px 6px;border-radius:3px;font-size:11px;white-space:nowrap">' + attr.name + '</div>',
        direction: 'top',
        offset: new AMap.Pixel(0, -5)
      }
    });
    marker.on('click', function() { onMarkerClick(attr, marker); });
    map.add(marker);
    markers.push(marker);
    markersMap[attr.name] = { lng: attr.longitude, lat: attr.latitude, id: attr.id };
  }

  function onMarkerClick(attr, marker) {
    map.clearInfoWindow();
    var html = '<div class="map-info-window">' +
      '<strong>' + attr.name + '</strong>' +
      '<p>' + (attr.description || '灵山胜境景点') + '</p>' +
      '<button class="map-ask-btn" data-attr-name="' + attr.name + '">💬 问一问灵灵</button>' +
      '</div>';
    var iw = new AMap.InfoWindow({ content: html, offset: new AMap.Pixel(0, -30) });
    iw.open(map, marker.getPosition());
  }

  // ===== Report Location =====
  function reportLocation(lng, lat) {
    var did = window.__tourGuideState && window.__tourGuideState.deviceId;
    if (!did) { console.warn('reportLocation: no deviceId yet'); return; }
    console.log('📍 上报位置 lng=' + lng + ' lat=' + lat + ' deviceId=' + did);
    fetch('/api/tourist/location?deviceId=' + did + '&lng=' + lng + '&lat=' + lat, {
      method: 'POST'
    }).catch(function(e) { console.log('Location report failed:', e); });
  }

  // ===== GPS =====
  function locateUser() {
    if (!navigator.geolocation) {
      $('#mapStatus').textContent = '浏览器不支持定位';
      return;
    }
    navigator.geolocation.getCurrentPosition(function(pos) {
      if (simulationMode) { $('#mapStatus').textContent = '模拟模式中，GPS已忽略'; return; }
      userLocation = [pos.coords.longitude, pos.coords.latitude];
      window.__tourGuideState.userLocation = userLocation;
      console.log('GPS定位成功: ' + userLocation);
      reportLocation(pos.coords.longitude, pos.coords.latitude);
      if (userMarker) {
        userMarker.setPosition(userLocation);
      } else {
        userMarker = new AMap.Marker({
          position: userLocation,
          icon: new AMap.Icon({
            size: new AMap.Size(20, 20),
            image: 'https://webapi.amap.com/theme/v1.3/markers/n/mark_bs.png',
            imageSize: new AMap.Size(20, 20)
          }),
          offset: new AMap.Pixel(-10, -10),
          zIndex: 100
        });
        map.add(userMarker);
      }
      $('#mapStatus').textContent = '已定位';
    }, function() {
      $('#mapStatus').textContent = '定位失败';
    }, { enableHighAccuracy: true, timeout: 10000 });
  }

  // ===== Simulation =====
  function toggleSimulation() {
    simulationMode = !simulationMode;
    var btn = $('#simulateBtn');
    if (simulationMode) {
      btn.style.background = '#ff9800';
      btn.style.color = '#fff';
      btn.style.borderColor = '#ff9800';
      btn.textContent = '🎯 模拟中';
      $('#mapStatus').textContent = '模拟模式：点击地图设置虚拟位置';
      if (!simulatedLocation) {
        setSimulatedPosition(120.1050, 31.4220);
      }
    } else {
      btn.style.background = '';
      btn.style.color = '';
      btn.style.borderColor = '';
      btn.textContent = '🎯 模拟';
      if (simMarker) { map.remove(simMarker); simMarker = null; }
      simulatedLocation = null;
      if (userMarker) {
        var pos = userMarker.getPosition();
        userLocation = [pos.getLng(), pos.getLat()];
      }
      window.__tourGuideState.userLocation = userLocation;
      $('#mapStatus').textContent = userLocation ? '已恢复GPS定位' : '就绪 (' + markers.length + '个景点)';
    }
  }

  function setSimulatedPosition(lng, lat) {
    simulatedLocation = [lng, lat];
    userLocation = [lng, lat];
    window.__tourGuideState.userLocation = userLocation;
    console.log('模拟定位: ' + userLocation);
    reportLocation(lng, lat);
    if (simMarker) {
      simMarker.setPosition([lng, lat]);
    } else {
      simMarker = new AMap.Marker({
        position: [lng, lat],
        icon: new AMap.Icon({
          size: new AMap.Size(32, 32),
          image: 'https://webapi.amap.com/theme/v1.3/markers/n/mark_b.png',
          imageSize: new AMap.Size(32, 32)
        }),
        offset: new AMap.Pixel(-16, -16),
        zIndex: 200,
        draggable: true,
        title: '模拟位置（可拖动）'
      });
      simMarker.on('dragend', function() {
        var p = simMarker.getPosition();
        simulatedLocation = [p.getLng(), p.getLat()];
        userLocation = [p.getLng(), p.getLat()];
        window.__tourGuideState.userLocation = userLocation;
        reportLocation(p.getLng(), p.getLat());
        $('#mapStatus').textContent = '模拟位置已更新';
      });
      map.add(simMarker);
    }
    $('#mapStatus').textContent = '模拟位置已设置（可拖动调整）';
  }

  // ===== Route Drawing =====
  function handleDrawRoute(e) {
    var d = e.detail;
    console.log('draw-route:', d);
    if (walkingPlugin) {
      walkingPlugin.search(
        [d.originLng, d.originLat], [d.destLng, d.destLat],
        function(status, result) {
          if (status === 'complete' && result.routes && result.routes[0]) {
            var r = result.routes[0];
            if (walkingRoute) walkingRoute.clear();
            walkingRoute = r;
            showInfoBar('🚶 到<b>' + d.destName + '</b>：' + r.distance + 'm，约' + Math.ceil(r.time / 60) + '分钟');
            map.setFitView(null, false, [80, 250, 80, 60]);
          }
        }
      );
      return;
    }
    var line = new AMap.Polyline({
      path: [[d.originLng, d.originLat], [d.destLng, d.destLat]],
      strokeColor: '#2e8b57', strokeWeight: 4, strokeStyle: 'dashed', strokeOpacity: 0.7
    });
    map.add(line);
    if (walkingRoute) walkingRoute = { clear: function() { map.remove(line); } };
    showInfoBar('📍 到<b>' + d.destName + '</b>的直线方向');
    map.setFitView(null, false, [80, 250, 80, 60]);
  }

  function handleFocusAttraction(e) {
    map.setCenter([e.detail.lng, e.detail.lat]);
    map.setZoom(17);
  }

  function resetMap() {
    if (walkingRoute) { walkingRoute.clear(); walkingRoute = null; }
    hideInfoBar();
    map.clearInfoWindow();
    if (simulationMode) { toggleSimulation(); }
    if (markers.length > 0) {
      map.setFitView(null, false, [80, 60, 80, 60]);
    }
    $('#mapStatus').textContent = '就绪 (' + markers.length + '个景点)';
  }

  function showInfoBar(html) {
    $('#mapInfoContent').innerHTML = html;
    $('#mapInfoBar').style.display = 'flex';
  }
  function hideInfoBar() {
    $('#mapInfoBar').style.display = 'none';
  }

  function $(sel) { return document.querySelector(sel); }

  window.__reportLocation = reportLocation;
  window.__setSimPos = setSimulatedPosition;
  window.__getSimMode = function(){ return simulationMode; };
  init();

})();
