(function () {
  "use strict";

  const settings = window.FluxUbusacSettings;

  const form = document.getElementById("options-form");
  const minInput = document.getElementById("accuracy-min");
  const maxInput = document.getElementById("accuracy-max");
  const status = document.getElementById("status");

  function storageGet(keys, callback) {
    chrome.storage.local.get(keys, function (stored) {
      callback(stored || {});
    });
  }

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

  storageGet(settings.configKeys, function (stored) {
    fill(settings.pickConfig(stored));
  });

  form.addEventListener("submit", function (event) {
    event.preventDefault();

    storageGet(settings.configKeys, function (stored) {
      const config = settings.pickConfig(Object.assign({}, stored, {
        accuracyMin: minInput.value,
        accuracyMax: maxInput.value
      }));

      chrome.storage.local.set(config, function () {
        fill(config);
        setStatus("Saved");
      });
    });
  });
}());
