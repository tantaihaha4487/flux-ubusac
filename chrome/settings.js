(function (global) {
  "use strict";

  const defaults = Object.freeze({
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
    manualRadius: "",
    panelLanguage: "en"
  });

  const configKeys = Object.freeze(Object.keys(defaults));
  const statusKey = "runtimeStatus";

  function toInt(value, fallback, min) {
    const number = Math.trunc(Number(value));

    if (!Number.isFinite(number)) {
      return fallback;
    }

    return Math.max(min, number);
  }

  function toBool(value, fallback) {
    if (typeof value === "boolean") {
      return value;
    }

    if (value === "true") {
      return true;
    }

    if (value === "false") {
      return false;
    }

    return fallback;
  }

  function normalizeOrigin(value) {
    const trimmed = String(value == null ? "" : value).trim();

    if (!trimmed) {
      return defaults.targetOrigin;
    }

    try {
      const url = new URL(trimmed);

      if (url.protocol !== "http:" && url.protocol !== "https:") {
        throw new Error("Unsupported origin protocol");
      }

      return url.origin;
    } catch (error) {
      return defaults.targetOrigin;
    }
  }

  function normalizeOptionalNumber(value, min) {
    if (value == null) {
      return "";
    }

    const text = String(value).trim();

    if (!text) {
      return "";
    }

    const number = Number(text);

    if (!Number.isFinite(number)) {
      return "";
    }

    return String(min == null ? number : Math.max(min, number));
  }

  function normalizeConfig(input) {
    const source = input || {};
    const config = {
      accuracyMin: toInt(source.accuracyMin, defaults.accuracyMin, 0),
      accuracyMax: toInt(source.accuracyMax, defaults.accuracyMax, 0),
      randomLocationInRange: toBool(source.randomLocationInRange, defaults.randomLocationInRange),
      targetOrigin: normalizeOrigin(source.targetOrigin),
      scanIntervalMs: toInt(source.scanIntervalMs, defaults.scanIntervalMs, 50),
      scanTimeoutMs: toInt(source.scanTimeoutMs, defaults.scanTimeoutMs, 500),
      debugLogs: toBool(source.debugLogs, defaults.debugLogs),
      manualFallbackEnabled: toBool(source.manualFallbackEnabled, defaults.manualFallbackEnabled),
      manualLatitude: normalizeOptionalNumber(source.manualLatitude),
      manualLongitude: normalizeOptionalNumber(source.manualLongitude),
      manualRadius: normalizeOptionalNumber(source.manualRadius, 0),
      panelLanguage: source.panelLanguage === "th" ? "th" : defaults.panelLanguage
    };

    if (config.accuracyMin > config.accuracyMax) {
      const previousMin = config.accuracyMin;
      config.accuracyMin = config.accuracyMax;
      config.accuracyMax = previousMin;
    }

    if (config.scanIntervalMs > config.scanTimeoutMs) {
      config.scanIntervalMs = Math.min(config.scanIntervalMs, config.scanTimeoutMs);
    }

    return config;
  }

  function pickConfig(stored) {
    return normalizeConfig(Object.assign({}, defaults, stored || {}));
  }

  global.FluxUbusacSettings = {
    defaults,
    configKeys,
    statusKey,
    normalizeConfig,
    pickConfig
  };
}(window));
