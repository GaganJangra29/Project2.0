// Robust initMap with live updates via watchPosition
function initMap() {
  const defaultPos = { lat: 28.6139, lng: 77.2090 };
  const mapEl = document.getElementById('map');
  const statusEl = document.getElementById('mapStatus');
  const markBtn = document.getElementById('markBtn');
  const stopBtn = document.getElementById('stopBtn');
  const markedLocationEl = document.getElementById('markedLocation');

  if (!mapEl) {
    console.error('Map element (#map) not found');
    return;
  }

  // Custom request-theme style (subtle blue-gray look)
  const requestTheme = [
    { elementType: 'geometry', stylers: [{ color: '#e9f2fb' }] },
    { elementType: 'labels.text.fill', stylers: [{ color: '#5a6b77' }] },
    { elementType: 'labels.text.stroke', stylers: [{ color: '#ffffff' }] },
    {
      featureType: 'water',
      elementType: 'geometry',
      stylers: [{ color: '#cfe9ff' }]
    },
    {
      featureType: 'road',
      elementType: 'geometry',
      stylers: [{ color: '#ffffff' }]
    }
  ];

  const map = new google.maps.Map(mapEl, {
    center: defaultPos,
    zoom: 14,
    styles: requestTheme,
    disableDefaultUI: false,
  });

  const marker = new google.maps.Marker({
    position: defaultPos,
    map: map,
    title: 'Default location'
  });

  // Marker used when user explicitly marks a location (different color)
  const userMarker = new google.maps.Marker({
    map: map,
    icon: {
      path: google.maps.SymbolPath.CIRCLE,
      scale: 8,
      fillColor: '#ff5722',
      fillOpacity: 1,
      strokeWeight: 1,
      strokeColor: '#fff'
    }
  });

  function setStatus(msg) {
    if (statusEl) statusEl.textContent = msg;
    console.log(msg);
  }

  // Check Permissions API if available to give immediate feedback
  if (navigator.permissions && navigator.permissions.query) {
    navigator.permissions.query({ name: 'geolocation' }).then((perm) => {
      setStatus('Geolocation permission state: ' + perm.state);
      perm.onchange = () => setStatus('Geolocation permission changed: ' + perm.state);
    }).catch(() => {
      // ignore permissions error
    });
  }

  if (!navigator.geolocation) {
    setStatus('Geolocation is not supported by your browser.');
    return;
  }

  // Use watchPosition to get live updates
  let watchId = navigator.geolocation.watchPosition(
    (position) => {
      const pos = { lat: position.coords.latitude, lng: position.coords.longitude };
      map.setCenter(pos);
      marker.setPosition(pos);
      marker.setTitle('You are here');
      setStatus('Location updated: ' + pos.lat.toFixed(5) + ', ' + pos.lng.toFixed(5));
    },
    (err) => {
      switch (err.code) {
        case err.PERMISSION_DENIED:
          setStatus('Permission denied. Please allow location access.');
          break;
        case err.POSITION_UNAVAILABLE:
          setStatus('Position unavailable.');
          break;
        case err.TIMEOUT:
          setStatus('Position request timed out.');
          break;
        default:
          setStatus('Error getting location: ' + err.message);
      }
    },
    {
      enableHighAccuracy: true,
      maximumAge: 2000,
      timeout: 10000,
    }
  );

  // Expose a method to stop watching (optional)
  initMap.stopWatching = function() {
    if (watchId != null) navigator.geolocation.clearWatch(watchId);
    watchId = null;
    setStatus('Stopped watching location.');
  };

  // Start watching if not running
  initMap.startWatching = function() {
    if (watchId) return; // already watching
    watchId = navigator.geolocation.watchPosition((position) => {
      const pos = { lat: position.coords.latitude, lng: position.coords.longitude };
      map.setCenter(pos);
      marker.setPosition(pos);
      setStatus('Location updated: ' + pos.lat.toFixed(5) + ', ' + pos.lng.toFixed(5));
    }, (err) => setStatus('Error: ' + err.message), { enableHighAccuracy: true });
  };

  // Clicking on map marks a location
  map.addListener('click', (e) => {
    const lat = e.latLng.lat();
    const lng = e.latLng.lng();
    userMarker.setPosition({ lat, lng });
    if (markedLocationEl) markedLocationEl.textContent = `Marked: ${lat.toFixed(5)}, ${lng.toFixed(5)}`;
  });

  // Mark button: place marker at current center (or current user position)
  if (markBtn) markBtn.addEventListener('click', () => {
    const center = map.getCenter();
    const lat = center.lat();
    const lng = center.lng();
    userMarker.setPosition({ lat, lng });
    if (markedLocationEl) markedLocationEl.textContent = `Marked: ${lat.toFixed(5)}, ${lng.toFixed(5)}`;
  });

  if (stopBtn) stopBtn.addEventListener('click', () => initMap.stopWatching());
}
