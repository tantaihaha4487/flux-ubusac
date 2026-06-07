(function () {
  "use strict";

  const defaults = {
    accuracyMin: 0,
    accuracyMax: 10
  };

  const form = document.getElementById("options-form");
  const minInput = document.getElementById("accuracy-min");
  const maxInput = document.getElementById("accuracy-max");
  const status = document.getElementById("status");

  function setStatus(message) {
    status.textContent = message;
    window.setTimeout(function () {
      if (status.textContent === message) {
        status.textContent = "";
      }
    }, 1600);
  }

  function normalize(min, max) {
    const nextMin = Math.trunc(min);
    const nextMax = Math.trunc(max);

    const config = {
      accuracyMin: Number.isFinite(nextMin) ? Math.max(0, nextMin) : defaults.accuracyMin,
      accuracyMax: Number.isFinite(nextMax) ? Math.max(0, nextMax) : defaults.accuracyMax
    };

    if (config.accuracyMin > config.accuracyMax) {
      const previousMin = config.accuracyMin;
      config.accuracyMin = config.accuracyMax;
      config.accuracyMax = previousMin;
    }

    return config;
  }

  browser.storage.local.get(defaults).then(function (stored) {
    const config = normalize(Number(stored.accuracyMin), Number(stored.accuracyMax));
    minInput.value = config.accuracyMin;
    maxInput.value = config.accuracyMax;
  });

  form.addEventListener("submit", function (event) {
    event.preventDefault();

    const config = normalize(Number(minInput.value), Number(maxInput.value));

    browser.storage.local.set(config).then(function () {
      minInput.value = config.accuracyMin;
      maxInput.value = config.accuracyMax;
      setStatus("Saved");
    });
  });
}());
