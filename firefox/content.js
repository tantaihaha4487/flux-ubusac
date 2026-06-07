(function () {
  "use strict";

  const targetOrigin = "https://dev.ubu.ac.th";
  const stateKey = "__fluxUbusacContentApplied";

  if (window.location.origin !== targetOrigin || window[stateKey]) {
    return;
  }

  window[stateKey] = true;

  const defaultConfig = {
    accuracyMin: 0,
    accuracyMax: 10
  };

  let hookReady = false;
  let latestConfig = defaultConfig;

  function sendConfig(config) {
    window.postMessage({
      source: "flux-ubusac",
      type: "config",
      config
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
    };

    (document.documentElement || document.head).appendChild(script);
  }

  if (document.readyState === "complete") {
    injectHook();
  } else {
    window.addEventListener("load", injectHook, { once: true });
  }

  browser.storage.local.get(defaultConfig).then(applyConfig, function () {
    applyConfig(defaultConfig);
  });

  browser.storage.onChanged.addListener(function (changes, areaName) {
    if (areaName !== "local" || (!changes.accuracyMin && !changes.accuracyMax)) {
      return;
    }

    browser.storage.local.get(defaultConfig).then(applyConfig, function () {
      applyConfig(defaultConfig);
    });
  });
}());
