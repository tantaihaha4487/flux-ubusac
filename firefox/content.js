(function () {
  "use strict";

  const stateKey = "__fluxUbusacContentApplied";
  const defaultConfig = {
    accuracyMin: 0,
    accuracyMax: 10,
    randomLocationInRange: true,
    targetOrigin: "https://dev.ubu.ac.th",
    scanIntervalMs: 250,
    scanTimeoutMs: 10000,
    debugLogs: true,
    manualFallbackEnabled: false,
    manualLatitude: "",
    manualLongitude: "",
    manualRadius: ""
  };

  const configKeys = Object.keys(defaultConfig);
  let hookReady = false;
  let latestConfig = defaultConfig;

  function writeStatus(status) {
    return browser.storage.local.set({
      runtimeStatus: Object.assign({
        pageOrigin: window.location.origin,
        configuredTargetOrigin: latestConfig.targetOrigin,
        updatedAt: Date.now()
      }, status)
    });
  }

  function sendConfig(config) {
    window.postMessage({
      source: "flux-ubusac",
      type: "config",
      config: config
    }, window.location.origin);
  }

  function applyConfig(config) {
    latestConfig = config;

    if (hookReady) {
      sendConfig(latestConfig);
    }
  }

  function injectHook() {
    const script = document.createElement("script");
    script.src = browser.runtime.getURL("page-hook.js");
    script.onload = function () {
      hookReady = true;
      script.remove();
      sendConfig(latestConfig);
      writeStatus({
        phase: "hook-injected",
        source: null,
        message: "Page hook injected"
      });
    };

    (document.documentElement || document.head).appendChild(script);
  }

  function start(stored) {
    if (window[stateKey]) {
      return;
    }

    applyConfig(Object.assign({}, defaultConfig, stored || {}));

    if (window.location.origin !== latestConfig.targetOrigin) {
      writeStatus({
        phase: "skipped-origin",
        source: null,
        message: "Current page origin does not match the configured target origin"
      });
      return;
    }

    window[stateKey] = true;

    writeStatus({
      phase: "content-ready",
      source: null,
      message: "Content script is ready"
    });

    if (document.readyState === "complete") {
      injectHook();
    } else {
      window.addEventListener("load", injectHook, { once: true });
    }
  }

  window.addEventListener("message", function (event) {
    if (event.source !== window || event.origin !== window.location.origin) {
      return;
    }

    if (!event.data || event.data.source !== "flux-ubusac") {
      return;
    }

    if (event.data.type === "status" && event.data.status) {
      writeStatus(event.data.status);
    }
  });

  browser.storage.local.get(configKeys).then(start, function () {
    start(defaultConfig);
  });

  browser.storage.onChanged.addListener(function (changes, areaName) {
    if (areaName !== "local") {
      return;
    }

    const changedConfig = configKeys.some(function (key) {
      return Object.prototype.hasOwnProperty.call(changes, key);
    });

    if (!changedConfig) {
      return;
    }

    browser.storage.local.get(configKeys).then(function (stored) {
      applyConfig(Object.assign({}, defaultConfig, stored || {}));
    }, function () {
      applyConfig(defaultConfig);
    });
  });
}());
