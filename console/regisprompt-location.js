(() => {
  'use strict';
  if (location.origin !== 'https://dev.ubu.ac.th' ||
      location.pathname.replace(/\/$/, '') !== '/regisprompt/register') {
    throw new Error('Open the UBU registration page first.');
  }
  const config = { randomLocationInRange: true, accuracyMin: 1, accuracyMax: 10 };
  function randomPointInRadius(coords) {
    if (!config.randomLocationInRange || !coords || !Number.isFinite(coords.radius) || coords.radius <= 0) {
      return coords;
    }

    const earthRadius = 6378137;
    const distance = Math.sqrt(Math.random()) * coords.radius;
    const bearing = Math.random() * Math.PI * 2;
    const angularDistance = distance / earthRadius;
    const lat1 = coords.lat * Math.PI / 180;
    const lng1 = coords.lng * Math.PI / 180;

    const lat2 = Math.asin(
      Math.sin(lat1) * Math.cos(angularDistance) +
      Math.cos(lat1) * Math.sin(angularDistance) * Math.cos(bearing)
    );

    const lng2 = lng1 + Math.atan2(
      Math.sin(bearing) * Math.sin(angularDistance) * Math.cos(lat1),
      Math.cos(angularDistance) - Math.sin(lat1) * Math.sin(lat2)
    );

    return {
      lat: lat2 * 180 / Math.PI,
      lng: ((lng2 * 180 / Math.PI + 540) % 360) - 180,
      radius: coords.radius,
      distanceFromCenter: distance,
      centerLat: coords.lat,
      centerLng: coords.lng
    };
  }

  const rand = new URLSearchParams(location.search).get('rand');
  const stack = [window.$nuxt, document.getElementById('__nuxt')?.__vue__];
  const seen = new Set();
  let page, lat, lng;
  while (stack.length) {
    const vm = stack.pop();
    if (!vm || seen.has(vm)) continue;
    seen.add(vm);
    stack.push(...(vm.$children || []));
    if (vm.rand !== rand || !rand || typeof vm.todo !== 'function' ||
        typeof vm.stopGpsTracking !== 'function' ||
        typeof vm.onGpsPosition !== 'function') continue;
    const a = vm.department_latitude, b = vm.department_longitude;
    if (a == null || b == null || String(a).trim() === '' || String(b).trim() === '') continue;
    lat = Number(a); lng = Number(b);
    if (!Number.isFinite(lat) || !Number.isFinite(lng) || Math.abs(lat) > 90 || Math.abs(lng) > 180) continue;
    page = vm; break;
  }
  if (!page) throw new Error('Wait for the activity and map to load, then paste again.');
  const center = {lat, lng, radius: Number(page.gps_radius)};
  const sample = randomPointInRadius(center);
  lat = sample.lat; lng = sample.lng;
  const accuracy = Math.floor(Math.random() * (config.accuracyMax - config.accuracyMin + 1)) + config.accuracyMin;
  window.fluxRegispromptLocation?.restore();
  const geo = navigator.geolocation;
  if (!geo) throw new Error('Geolocation is unavailable in this browser.');
  const names = ['getCurrentPosition', 'watchPosition', 'clearWatch'];
  const descriptors = names.map(name => Object.getOwnPropertyDescriptor(geo, name));
  const timers = new Map();
  let sequence = 0, active = true;
  const position = () => ({coords: {latitude: lat, longitude: lng, accuracy,
    altitude: null, altitudeAccuracy: null, heading: null, speed: null}, timestamp: Date.now()});
  const send = success => {
    if (typeof success !== 'function') throw new TypeError('A success callback is required.');
    const id = ++sequence;
    timers.set(id, setTimeout(() => {
      timers.delete(id);
      if (active) success(position());
    }, 0));
    return id;
  };
  const restore = () => {
    if (!active) return;
    page.stopGpsTracking(); active = false;
    for (const timer of timers.values()) clearTimeout(timer);
    timers.clear();
    names.forEach((name, i) => {
      if (descriptors[i]) Object.defineProperty(geo, name, descriptors[i]);
      else delete geo[name];
    });
    delete window.fluxRegispromptLocation;
    console.info('[flux] Override removed. Reload to request your real location again.');
  };
  page.stopGpsTracking();
  try {
    Object.defineProperties(geo, {
      getCurrentPosition: {configurable: true, value: success => { send(success); }},
      watchPosition: {configurable: true, value: send},
      clearWatch: {configurable: true, value: id => {
        clearTimeout(timers.get(id)); timers.delete(id);
      }}
    });
    window.fluxRegispromptLocation = {latitude: lat, longitude: lng, accuracy, center, restore};
    page.todo();
    console.info('[flux] Activity location applied:', lat, lng, '(accuracy ' + accuracy + ' m)');
  } catch (error) { restore(); throw error; }
})();
