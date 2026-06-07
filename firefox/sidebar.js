(function () {
  "use strict";

  const settings = window.FluxUbusacSettings;
  const form = document.getElementById("sidebar-form");
  const status = document.getElementById("status");
  const exportField = document.getElementById("settings-json");
  const languageSelect = document.getElementById("panel-language");

  const translations = {
    en: {
      heroEyebrow: "Location control",
      heroSubtitle: "Tune the spoofed location used on the UBU registration prompt.",
      locationTitle: "Location behavior",
      locationCopy: "Set the default behavior for generated coordinates.",
      randomizeTitle: "Randomize inside detected area",
      randomizeCopy: "Pick one point inside the detected radius. Turn this off to use the center point.",
      advancedTitle: "Advanced settings",
      accuracyMin: "Minimum accuracy",
      accuracyMax: "Maximum accuracy",
      targetOrigin: "Target origin",
      targetHint: "The page hook can only run on sites allowed by the extension manifest.",
      scanEvery: "Scan every",
      giveUpAfter: "Give up after",
      milliseconds: "Milliseconds",
      debugTitle: "Debug logs",
      debugCopy: "Show useful flux-ubusac messages in the page console.",
      fallbackTitle: "Manual fallback",
      fallbackCopy: "Use your fallback coordinates only when automatic detection fails.",
      fallbackLat: "Fallback latitude",
      fallbackLng: "Fallback longitude",
      fallbackRadius: "Fallback radius",
      meters: "Meters",
      saveChanges: "Save changes",
      restoreDefaults: "Restore defaults",
      statusTitle: "Live status",
      statusCopy: "Latest message from the page hook.",
      stateLabel: "State",
      sourceLabel: "Source",
      targetLabel: "Target",
      pageLabel: "Page",
      coordsLabel: "Coordinates",
      updatedLabel: "Updated",
      backupTitle: "Backup settings",
      backupCopy: "Export or apply settings as JSON.",
      settingsJson: "Settings JSON",
      exportJson: "Export to JSON",
      applyJson: "Apply JSON settings",
      waiting: "Waiting",
      noStatus: "No active page status yet.",
      noMessage: "No message.",
      saved: "Settings saved",
      defaults: "Defaults restored",
      exported: "Settings exported",
      imported: "Settings imported",
      invalidJson: "Invalid JSON",
      saveFailed: "Save failed",
      exportFailed: "Export failed",
      loadFailed: "Load failed"
    },
    th: {
      heroEyebrow: "ควบคุมตำแหน่ง",
      heroSubtitle: "ปรับตำแหน่งจำลองที่ใช้กับหน้าลงทะเบียน UBU",
      locationTitle: "พฤติกรรมตำแหน่ง",
      locationCopy: "ตั้งค่าการสร้างพิกัดจำลองเริ่มต้น",
      randomizeTitle: "สุ่มตำแหน่งในพื้นที่ที่ตรวจพบ",
      randomizeCopy: "เลือกจุดเดียวภายในรัศมีที่ตรวจพบ ปิดตัวเลือกนี้เพื่อใช้จุดกึ่งกลาง",
      advancedTitle: "ตั้งค่าขั้นสูง",
      accuracyMin: "ค่าความแม่นยำต่ำสุด",
      accuracyMax: "ค่าความแม่นยำสูงสุด",
      targetOrigin: "เว็บไซต์เป้าหมาย",
      targetHint: "Page hook ทำงานได้เฉพาะเว็บไซต์ที่อนุญาตไว้ใน manifest เท่านั้น",
      scanEvery: "สแกนทุก",
      giveUpAfter: "หยุดรอหลังจาก",
      milliseconds: "มิลลิวินาที",
      debugTitle: "บันทึก Debug",
      debugCopy: "แสดงข้อความช่วยตรวจสอบของ flux-ubusac ในคอนโซลของหน้าเว็บ",
      fallbackTitle: "พิกัดสำรอง",
      fallbackCopy: "ใช้พิกัดสำรองเฉพาะเมื่อระบบตรวจจับพิกัดอัตโนมัติไม่สำเร็จ",
      fallbackLat: "ละติจูดสำรอง",
      fallbackLng: "ลองจิจูดสำรอง",
      fallbackRadius: "รัศมีสำรอง",
      meters: "เมตร",
      saveChanges: "บันทึกการตั้งค่า",
      restoreDefaults: "คืนค่าเริ่มต้น",
      statusTitle: "สถานะล่าสุด",
      statusCopy: "ข้อความล่าสุดจาก page hook",
      stateLabel: "สถานะ",
      sourceLabel: "แหล่งที่มา",
      targetLabel: "เป้าหมาย",
      pageLabel: "หน้าเว็บ",
      coordsLabel: "พิกัด",
      updatedLabel: "อัปเดตเมื่อ",
      backupTitle: "สำรองการตั้งค่า",
      backupCopy: "ส่งออกหรือนำเข้าการตั้งค่าเป็น JSON",
      settingsJson: "JSON การตั้งค่า",
      exportJson: "ส่งออกเป็น JSON",
      applyJson: "ใช้การตั้งค่า JSON",
      waiting: "กำลังรอ",
      noStatus: "ยังไม่มีสถานะจากหน้าเว็บ",
      noMessage: "ไม่มีข้อความ",
      saved: "บันทึกการตั้งค่าแล้ว",
      defaults: "คืนค่าเริ่มต้นแล้ว",
      exported: "ส่งออกการตั้งค่าแล้ว",
      imported: "นำเข้าการตั้งค่าแล้ว",
      invalidJson: "JSON ไม่ถูกต้อง",
      saveFailed: "บันทึกไม่สำเร็จ",
      exportFailed: "ส่งออกไม่สำเร็จ",
      loadFailed: "โหลดไม่สำเร็จ"
    }
  };

  let currentLanguage = "en";

  const fields = {
    accuracyMin: document.getElementById("accuracy-min"),
    accuracyMax: document.getElementById("accuracy-max"),
    randomLocationInRange: document.getElementById("random-location-in-range"),
    targetOrigin: document.getElementById("target-origin"),
    scanIntervalMs: document.getElementById("scan-interval-ms"),
    scanTimeoutMs: document.getElementById("scan-timeout-ms"),
    debugLogs: document.getElementById("debug-logs"),
    manualFallbackEnabled: document.getElementById("manual-fallback-enabled"),
    manualLatitude: document.getElementById("manual-latitude"),
    manualLongitude: document.getElementById("manual-longitude"),
    manualRadius: document.getElementById("manual-radius"),
    panelLanguage: languageSelect
  };

  const runtimeFields = {
    phase: document.getElementById("runtime-phase"),
    source: document.getElementById("runtime-source"),
    targetOrigin: document.getElementById("runtime-target-origin"),
    pageOrigin: document.getElementById("runtime-page-origin"),
    coordinates: document.getElementById("runtime-coordinates"),
    updatedAt: document.getElementById("runtime-updated-at"),
    message: document.getElementById("runtime-message")
  };

  function t(key) {
    return (translations[currentLanguage] && translations[currentLanguage][key]) || translations.en[key] || key;
  }

  function applyLanguage(language) {
    currentLanguage = language === "th" ? "th" : "en";
    document.documentElement.lang = currentLanguage;
    languageSelect.value = currentLanguage;

    document.querySelectorAll("[data-i18n]").forEach(function (element) {
      element.textContent = t(element.dataset.i18n);
    });

    if (runtimeFields.phase.textContent === translations.en.waiting || runtimeFields.phase.textContent === translations.th.waiting) {
      runtimeFields.phase.textContent = t("waiting");
    }

    if (runtimeFields.message.textContent === translations.en.noStatus || runtimeFields.message.textContent === translations.th.noStatus) {
      runtimeFields.message.textContent = t("noStatus");
    }
  }

  function setStatus(message, tone) {
    status.textContent = message;
    status.className = tone || "";

    window.setTimeout(function () {
      if (status.textContent === message) {
        status.textContent = "";
        status.className = "";
      }
    }, 2200);
  }

  function fillForm(config) {
    fields.accuracyMin.value = config.accuracyMin;
    fields.accuracyMax.value = config.accuracyMax;
    fields.randomLocationInRange.checked = config.randomLocationInRange;
    fields.targetOrigin.value = config.targetOrigin;
    fields.scanIntervalMs.value = config.scanIntervalMs;
    fields.scanTimeoutMs.value = config.scanTimeoutMs;
    fields.debugLogs.checked = config.debugLogs;
    fields.manualFallbackEnabled.checked = config.manualFallbackEnabled;
    fields.manualLatitude.value = config.manualLatitude;
    fields.manualLongitude.value = config.manualLongitude;
    fields.manualRadius.value = config.manualRadius;
    applyLanguage(config.panelLanguage);
  }

  function readForm() {
    return settings.pickConfig({
      accuracyMin: fields.accuracyMin.value,
      accuracyMax: fields.accuracyMax.value,
      randomLocationInRange: fields.randomLocationInRange.checked,
      targetOrigin: fields.targetOrigin.value,
      scanIntervalMs: fields.scanIntervalMs.value,
      scanTimeoutMs: fields.scanTimeoutMs.value,
      debugLogs: fields.debugLogs.checked,
      manualFallbackEnabled: fields.manualFallbackEnabled.checked,
      manualLatitude: fields.manualLatitude.value,
      manualLongitude: fields.manualLongitude.value,
      manualRadius: fields.manualRadius.value,
      panelLanguage: fields.panelLanguage.value
    });
  }

  function renderStatus(runtimeStatus) {
    if (!runtimeStatus) {
      runtimeFields.phase.textContent = t("waiting");
      runtimeFields.source.textContent = "-";
      runtimeFields.targetOrigin.textContent = "-";
      runtimeFields.pageOrigin.textContent = "-";
      runtimeFields.coordinates.textContent = "-";
      runtimeFields.updatedAt.textContent = "-";
      runtimeFields.message.textContent = t("noStatus");
      return;
    }

    runtimeFields.phase.textContent = runtimeStatus.phase || "Waiting";
    runtimeFields.source.textContent = runtimeStatus.source || "-";
    runtimeFields.targetOrigin.textContent = runtimeStatus.configuredTargetOrigin || "-";
    runtimeFields.pageOrigin.textContent = runtimeStatus.pageOrigin || "-";
    runtimeFields.coordinates.textContent = Number.isFinite(runtimeStatus.lat) && Number.isFinite(runtimeStatus.lng)
      ? runtimeStatus.lat + ", " + runtimeStatus.lng + (runtimeStatus.radius == null ? "" : " | r=" + runtimeStatus.radius)
      : "-";
    runtimeFields.updatedAt.textContent = runtimeStatus.updatedAt
      ? new Date(runtimeStatus.updatedAt).toLocaleString()
      : "-";
    runtimeFields.message.textContent = runtimeStatus.message || t("noMessage");
  }

  function loadAll() {
    return browser.storage.local.get(settings.configKeys.concat(settings.statusKey)).then(function (stored) {
      fillForm(settings.pickConfig(stored));
      renderStatus(stored[settings.statusKey]);
    });
  }

  function saveConfig(config, message) {
    fillForm(config);
    return browser.storage.local.set(config).then(function () {
      setStatus(message || t("saved"), "success");
    }, function (error) {
      setStatus(error && error.message ? error.message : t("saveFailed"), "error");
    });
  }

  form.addEventListener("submit", function (event) {
    event.preventDefault();
    saveConfig(readForm(), t("saved"));
  });

  languageSelect.addEventListener("change", function () {
    const config = readForm();
    applyLanguage(config.panelLanguage);
    saveConfig(config, t("saved"));
  });

  document.getElementById("reset-defaults").addEventListener("click", function () {
    saveConfig(settings.pickConfig(Object.assign({}, settings.defaults, {
      panelLanguage: currentLanguage
    })), t("defaults"));
  });

  document.getElementById("export-settings").addEventListener("click", function () {
    browser.storage.local.get(settings.configKeys).then(function (stored) {
      exportField.value = JSON.stringify(settings.pickConfig(stored), null, 2);
      exportField.focus();
      exportField.select();
      setStatus(t("exported"), "success");
    }, function (error) {
      setStatus(error && error.message ? error.message : t("exportFailed"), "error");
    });
  });

  document.getElementById("import-settings").addEventListener("click", function () {
    let parsed;

    try {
      parsed = JSON.parse(exportField.value);
    } catch (error) {
      setStatus(t("invalidJson"), "error");
      return;
    }

    saveConfig(settings.pickConfig(parsed), t("imported"));
  });

  browser.storage.onChanged.addListener(function (changes, areaName) {
    if (areaName !== "local") {
      return;
    }

    if (changes[settings.statusKey]) {
      renderStatus(changes[settings.statusKey].newValue);
    }

    const changedConfig = settings.configKeys.some(function (key) {
      return Object.prototype.hasOwnProperty.call(changes, key);
    });

    if (changedConfig) {
      browser.storage.local.get(settings.configKeys).then(function (stored) {
        fillForm(settings.pickConfig(stored));
      });
    }
  });

  loadAll().catch(function (error) {
    setStatus(error && error.message ? error.message : t("loadFailed"), "error");
  });
}());
