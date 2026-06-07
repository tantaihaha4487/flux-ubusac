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

The sidebar panels bundle Kanit locally and use lighter title weights so the header stays readable.

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

  if (window.location.origin !== targetOrigin) {
    console.warn("[flux-ubusac] current page is not the configured target origin", {
      current: window.location.origin,
      target: targetOrigin
    });
  }

  const position = {
    lat: 15.114926007239427,
    lng: 104.90221112966539
  };

  const config = {
    accuracyMin: 0,
    accuracyMax: 10
  };

  let overridden = false;
  let coordinatesLocked = false;
  let watchId = 0;
  const watchers = new Map();

  function randomAccuracy() {
    return Math.floor(Math.random() * (config.accuracyMax - config.accuracyMin + 1)) + config.accuracyMin;
  }

  function createPosition() {
    return {
      coords: {
        latitude: position.lat,
        longitude: position.lng,
        accuracy: randomAccuracy(),
        altitude: null,
        altitudeAccuracy: null,
        heading: null,
        speed: null
      },
      timestamp: Date.now()
    };
  }

  function normalizeCoords(lat, lng) {
    const nextLat = Number(lat);
    const nextLng = Number(lng);

    if (!Number.isFinite(nextLat) || !Number.isFinite(nextLng)) {
      return null;
    }

    if (nextLat < -90 || nextLat > 90 || nextLng < -180 || nextLng > 180) {
      return null;
    }

    return {
      lat: nextLat,
      lng: nextLng
    };
  }

  function parseCoords(value, depth) {
    if (depth > 4 || value == null) {
      return null;
    }

    if (typeof value === "string") {
      const match = value.match(/(-?\d+\.\d+)\s*,\s*(-?\d+\.\d+)/);

      if (!match) {
        return null;
      }

      return normalizeCoords(match[1], match[2]);
    }

    if (typeof value !== "object") {
      return null;
    }

    if ("lat" in value && "lng" in value) {
      const coords = normalizeCoords(value.lat, value.lng);

      if (coords) {
        return coords;
      }
    }

    for (const key of Object.keys(value)) {
      const coords = parseCoords(value[key], depth + 1);

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

    setTimeout(function () {
      success(createPosition());
    }, 0);
  }

  function updatePosition(coords) {
    if (!coords || coordinatesLocked) {
      return;
    }

    coordinatesLocked = true;
    position.lat = coords.lat;
    position.lng = coords.lng;

    console.info("[flux-ubusac] location updated", coords);

    for (const success of watchers.values()) {
      callSuccess(success);
    }
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
            const id = ++watchId;
            watchers.set(id, success);
            callSuccess(success);
            return id;
          }
        },
        clearWatch: {
          configurable: true,
          value: function (id) {
            watchers.delete(id);
          }
        }
      });
    } catch (error) {
      window[stateKey] = false;
      console.error("[flux-ubusac] failed to override geolocation", error);
      return;
    }

    overridden = true;

    console.info("[flux-ubusac] geolocation overridden");
  }

  const originalConsole = {
    debug: console.debug,
    info: console.info,
    log: console.log,
    warn: console.warn
  };

  function inspectConsoleArgs(args) {
    if (coordinatesLocked) {
      return;
    }

    for (const arg of args) {
      const coords = parseCoords(arg, 0);

      if (coords) {
        updatePosition(coords);
        break;
      }
    }

    const combinedCoords = parseCoords(args.map(String).join(" "), 0);

    if (combinedCoords) {
      updatePosition(combinedCoords);
    }
  }

  for (const method of Object.keys(originalConsole)) {
    console[method] = function (...args) {
      inspectConsoleArgs(args);

      return originalConsole[method].apply(this, args);
    };
  }

  overrideGeolocation();
}());
```
