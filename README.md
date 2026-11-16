# flux-ubusac

Geolocation override tools for `https://dev.ubu.ac.th/`.

## Variants

- `chrome/` - Chrome Manifest V3 extension.
- `firefox/` - Firefox Manifest V2 add-on.
- `console/` - standalone browser-console hook.

## CI Packaging

GitHub Actions validates the JavaScript files and manifests, then builds browser packages separately:

- Chrome artifact: `flux-ubusac-chrome-zip`
- Firefox artifact: `flux-ubusac-firefox-zip`

The generated archives are not committed to the repository. Download them from the workflow run artifacts.

The sidebar panels bundle Kanit locally and use Kanit 200 for the title plus Kanit 300 for supporting text so the header stays readable.

## Registration page already open

For a map that already shows the original GPS location, use [`console/regisprompt-location.js`](console/regisprompt-location.js). Wait for the activity and map to load, then paste the whole file into DevTools Console. It reads the current activity coordinates and radius, stops the previous GPS watch, and restarts tracking with the selected position. It does not submit registration.

All variants use the same sampler: a random bearing and `sqrt(random) * radius`, projected over the Earth. This distributes points across the circle's area. The selected latitude, longitude, and accuracy stay fixed during that hook run. Set `randomLocationInRange` to `false` to use the center; extension settings take effect on the next page load. Accuracy defaults to an integer from 1–10 m because the current page ignores zero accuracy.

The dedicated late-injection helper can be removed with `window.fluxRegispromptLocation.restore()`. Reload afterward to request real GPS again. Reload before switching between different hook variants.

Run regression checks with `node tests/geolocation.cjs`.

## Console Version - Ready to Copy

Open a page on `https://dev.ubu.ac.th/`, open DevTools Console, paste this whole block, then press Enter.

```js
(function () {
  "use strict";

  const stateKey = "__fluxUbusacConsoleApplied";

  if (window[stateKey]) {
    console.info("[flux-ubusac] console hook already applied");
    return;
  }

  window[stateKey] = true;

  const targetOrigin = "https://dev.ubu.ac.th";
  const scanIntervalMs = 250;
  const scanTimeoutMs = 10000;
  const config = {
    accuracyMin: 1,
    accuracyMax: 10,
    randomLocationInRange: true
  };

  const originalConsole = {
    debug: console.debug,
    error: console.error,
    info: console.info,
    log: console.log,
    warn: console.warn
  };

  const position = {
    lat: null,
    lng: null,
    radius: null,
    source: null,
    accuracy: randomAccuracy()
  };

  let overridden = false;
  let scanTimer = null;
  let scanStartedAt = 0;
  let watchId = 0;
  const nativeClearWatch = navigator.geolocation && navigator.geolocation.clearWatch;
  const watchers = new Map();
  const pendingSuccesses = new Set();
  let pendingPageCoords = null;
  let pendingConsoleCoords = null;
  let pendingConsoleTimer = null;

  if (window.location.origin !== targetOrigin) {
    originalConsole.warn("[flux-ubusac] current page is not the configured target origin", {
      current: window.location.origin,
      target: targetOrigin
    });
  }

  function randomAccuracy() {
    return Math.floor(Math.random() * (config.accuracyMax - config.accuracyMin + 1)) + config.accuracyMin;
  }

  function hasPosition() {
    return Number.isFinite(position.lat) && Number.isFinite(position.lng);
  }

  function createPosition() {
    return {
      coords: {
        latitude: position.lat,
        longitude: position.lng,
        accuracy: position.accuracy,
        altitude: null,
        altitudeAccuracy: null,
        heading: null,
        speed: null
      },
      timestamp: Date.now()
    };
  }

  function getRand() {
    return new URLSearchParams(window.location.search).get("rand");
  }

  function numberFromRequired(value) {
    if (value == null || value === "") {
      return NaN;
    }

    if (typeof value === "string" && value.trim() === "") {
      return NaN;
    }

    return Number(value);
  }

  function numberFromOptional(value) {
    if (value == null || value === "") {
      return null;
    }

    if (typeof value === "string" && value.trim() === "") {
      return null;
    }

    const number = Number(value);
    return Number.isFinite(number) ? number : null;
  }

  function normalizeCoords(lat, lng, radius) {
    const nextLat = numberFromRequired(lat);
    const nextLng = numberFromRequired(lng);
    const nextRadius = numberFromOptional(radius);

    if (!Number.isFinite(nextLat) || !Number.isFinite(nextLng)) {
      return null;
    }

    if (nextLat < -90 || nextLat > 90 || nextLng < -180 || nextLng > 180) {
      return null;
    }

    return {
      lat: nextLat,
      lng: nextLng,
      radius: nextRadius
    };
  }

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

  function coordsFromObject(value) {
    if (!value || typeof value !== "object") {
      return null;
    }

    if ("lat" in value && "lng" in value) {
      return normalizeCoords(value.lat, value.lng, value.gps_radius ?? value.radius);
    }

    if ("latitude" in value && "longitude" in value) {
      return normalizeCoords(value.latitude, value.longitude, value.gps_radius ?? value.radius);
    }

    if ("department_latitude" in value && "department_longitude" in value) {
      return normalizeCoords(value.department_latitude, value.department_longitude, value.gps_radius ?? value.radius);
    }

    return null;
  }

  function hasUsableRadius(coords) {
    return coords && Number.isFinite(coords.radius) && coords.radius > 0;
  }

  function coordsFromString(value) {
    if (typeof value !== "string") {
      return null;
    }

    const objectLike = value.match(/"?lat"?\s*:\s*"?(-?\d+(?:\.\d+)?)"?[\s\S]*?"?lng"?\s*:\s*"?(-?\d+(?:\.\d+)?)"?/i);

    if (objectLike) {
      const radius = value.match(/"?(?:gps_radius|radius)"?\s*:\s*"?(\d+(?:\.\d+)?)"?/i);
      return normalizeCoords(objectLike[1], objectLike[2], radius ? radius[1] : null);
    }

    const pair = value.match(/(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)/);

    if (pair) {
      return normalizeCoords(pair[1], pair[2]);
    }

    return null;
  }

  function parseCoords(value, depth, seen) {
    if (depth > 4 || value == null) {
      return null;
    }

    const stringCoords = coordsFromString(value);

    if (stringCoords) {
      return stringCoords;
    }

    if (typeof value !== "object") {
      return null;
    }

    if (seen.has(value)) {
      return null;
    }

    seen.add(value);

    const directCoords = coordsFromObject(value);

    if (directCoords) {
      return directCoords;
    }

    for (const key of Object.keys(value)) {
      const coords = parseCoords(value[key], depth + 1, seen);

      if (coords) {
        return coords;
      }
    }

    return null;
  }

  function callSuccess(success) {
    if (typeof success !== "function") {
      return;
    }

    if (!hasPosition()) {
      pendingSuccesses.add(success);
      startScanner();
      return;
    }

    setTimeout(function () {
      success(createPosition());
    }, 0);
  }

  function flushSuccesses() {
    for (const success of pendingSuccesses) {
      callSuccess(success);
    }

    pendingSuccesses.clear();

    for (const success of watchers.values()) {
      callSuccess(success);
    }
  }

  function updatePosition(coords, source) {
    if (!coords || !Number.isFinite(coords.lat) || !Number.isFinite(coords.lng)) {
      return false;
    }

    const appliedCoords = randomPointInRadius(coords);

    position.lat = appliedCoords.lat;
    position.lng = appliedCoords.lng;
    position.radius = appliedCoords.radius;
    position.source = source;

    originalConsole.info("[flux-ubusac] location applied", {
      lat: position.lat,
      lng: position.lng,
      radius: position.radius,
      source: position.source,
      randomLocationInRange: config.randomLocationInRange,
      distanceFromCenter: appliedCoords.distanceFromCenter == null ? 0 : Math.round(appliedCoords.distanceFromCenter * 100) / 100,
      center: appliedCoords.centerLat == null ? null : {
        lat: appliedCoords.centerLat,
        lng: appliedCoords.centerLng
      }
    });

    flushSuccesses();
    stopScanner();
    restartPageTracking();
    return true;
  }

  // A console injection can happen after the page has started a native watch.
  // Restart only that active page watch; early injections use the normal startup.
  function restartPageTracking() {
    const root = document.getElementById("__nuxt");
    const stack = [window.$nuxt, root && root.__vue__];
    const seen = new WeakSet();
    const rand = getRand();
    while (stack.length) {
      const current = stack.pop();
      if (!current || typeof current !== "object" || seen.has(current)) continue;
      seen.add(current);
      if (Array.isArray(current.$children)) stack.push(...current.$children);
      if (rand && current.rand === rand && current.watchID != null &&
          !watchers.has(current.watchID) && typeof current.todo === "function" &&
          typeof current.stopGpsTracking === "function") {
        current.todo();
        return;
      }
    }
  }

  function findTargetInValue(value) {
    const rand = getRand();

    if (!value || typeof value !== "object") {
      return null;
    }

    if (value.circle && typeof value.circle.getLatLng === "function") {
      const latLng = value.circle.getLatLng();
      const radius = typeof value.circle.getRadius === "function" ? value.circle.getRadius() : null;
      const coords = normalizeCoords(latLng.lat, latLng.lng, radius);

      if (coords) {
        return coords;
      }
    }

    const departmentCoords = normalizeCoords(
      value.department_latitude,
      value.department_longitude,
      value.gps_radius
    );

    if (departmentCoords) {
      return departmentCoords;
    }

    if (rand && Array.isArray(value.title)) {
      const match = value.title.find(function (item) {
        return item && item.r_rand === rand;
      });

      const coords = coordsFromObject(match);

      if (coords) {
        return coords;
      }
    }

    return null;
  }

  function scanVueState() {
    const roots = [];
    const nuxtEl = document.getElementById("__nuxt");

    if (window.$nuxt) {
      roots.push(window.$nuxt);
    }

    if (nuxtEl && nuxtEl.__vue__) {
      roots.push(nuxtEl.__vue__);
    }

    const stack = roots.slice();
    const seen = new WeakSet();
    let fallbackCoords = null;

    while (stack.length) {
      const current = stack.pop();

      if (!current || typeof current !== "object" || seen.has(current)) {
        continue;
      }

      seen.add(current);

      const coords = findTargetInValue(current) || findTargetInValue(current.$data) || findTargetInValue(current._data);

      if (coords) {
        if (hasUsableRadius(coords)) {
          return coords;
        }

        fallbackCoords = fallbackCoords || coords;
      }

      if (Array.isArray(current.$children)) {
        stack.push.apply(stack, current.$children);
      }

      if (current.$data && typeof current.$data === "object") {
        stack.push(current.$data);
      }

      if (current._data && typeof current._data === "object") {
        stack.push(current._data);
      }
    }

    return fallbackCoords;
  }

  function scanPage() {
    if (hasPosition()) {
      return true;
    }

    const coords = scanVueState();

    if (coords) {
      pendingPageCoords = coords;

      if (config.randomLocationInRange && !hasUsableRadius(coords) && Date.now() - scanStartedAt <= scanTimeoutMs) {
        return false;
      }

      return updatePosition(coords, "page-state");
    }

    if (pendingPageCoords && Date.now() - scanStartedAt > scanTimeoutMs) {
      return updatePosition(pendingPageCoords, "page-state");
    }

    return false;
  }

  function startScanner() {
    if (scanTimer || hasPosition()) {
      return;
    }

    scanStartedAt = Date.now();
    scanPage();

    scanTimer = setInterval(function () {
      if (scanPage() || Date.now() - scanStartedAt > scanTimeoutMs) {
        stopScanner();
      }
    }, scanIntervalMs);
  }

  function stopScanner() {
    if (!scanTimer) {
      return;
    }

    clearInterval(scanTimer);
    scanTimer = null;
  }

  function overrideGeolocation() {
    if (overridden || !navigator.geolocation) {
      return;
    }

    try {
      Object.defineProperties(navigator.geolocation, {
        getCurrentPosition: {
          configurable: true,
          value: function (success) {
            callSuccess(success);
          }
        },
        watchPosition: {
          configurable: true,
          value: function (success) {
            const id = --watchId;
            watchers.set(id, success);
            callSuccess(success);
            return id;
          }
        },
        clearWatch: {
          configurable: true,
          value: function (id) {
            if (!watchers.delete(id) && typeof nativeClearWatch === "function") {
              nativeClearWatch.call(navigator.geolocation, id);
            }
          }
        }
      });
    } catch (error) {
      window[stateKey] = false;
      originalConsole.error("[flux-ubusac] failed to override geolocation", error);
      return;
    }

    overridden = true;
    originalConsole.info("[flux-ubusac] geolocation overridden");
  }

  function scheduleConsoleFallback(coords) {
    pendingConsoleCoords = pendingConsoleCoords || coords;

    if (pendingConsoleTimer) {
      return;
    }

    pendingConsoleTimer = setTimeout(function () {
      pendingConsoleTimer = null;

      if (!hasPosition() && pendingConsoleCoords) {
        updatePosition(pendingConsoleCoords, "console");
      }
    }, 500);
  }

  function applyConsoleCoords(coords) {
    if (!coords) {
      return false;
    }

    if (hasUsableRadius(coords) || !config.randomLocationInRange) {
      if (pendingConsoleTimer) {
        clearTimeout(pendingConsoleTimer);
        pendingConsoleTimer = null;
      }

      updatePosition(coords, "console");
      return true;
    }

    scheduleConsoleFallback(coords);
    return false;
  }

  function inspectConsoleArgs(args) {
    if (hasPosition()) {
      return;
    }

    for (const arg of args) {
      const coords = parseCoords(arg, 0, new WeakSet());

      if (applyConsoleCoords(coords)) {
        return;
      }
    }

    const combinedCoords = coordsFromString(args.map(String).join(" "));

    applyConsoleCoords(combinedCoords);
  }

  for (const method of Object.keys(originalConsole)) {
    console[method] = function (...args) {
      inspectConsoleArgs(args);

      return originalConsole[method].apply(this, args);
    };
  }

  overrideGeolocation();
  startScanner();
}());
```
