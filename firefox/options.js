(function () {
  "use strict";

  const settings = window.FluxUbusacSettings;

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

  function fill(config) {
    minInput.value = config.accuracyMin;
    maxInput.value = config.accuracyMax;
  }

  browser.storage.local.get(settings.configKeys).then(function (stored) {
    fill(settings.pickConfig(stored));
  });

  form.addEventListener("submit", function (event) {
    event.preventDefault();

    browser.storage.local.get(settings.configKeys).then(function (stored) {
      const config = settings.pickConfig(Object.assign({}, stored, {
        accuracyMin: minInput.value,
        accuracyMax: maxInput.value
      }));

      browser.storage.local.set(config).then(function () {
        fill(config);
        setStatus("Saved");
      });
    });
  });
}());
