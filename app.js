// Splash controls (mobile-first startup experience)
const splash = document.getElementById("splash");
function hideSplash(ms = 260) {
  const s = splash;
  if (!s || s.dataset.hiding === "1") return;
  s.dataset.hiding = "1";
  s.classList.add("hidden");
  const cleanup = () => {
    if (s.parentNode) s.parentNode.removeChild(s);
  };
  s.addEventListener("transitionend", cleanup, { once: true });
  setTimeout(cleanup, ms + 120);
}
window.addEventListener('DOMContentLoaded', () => setTimeout(hideSplash, 900), { once: true });
window.addEventListener('load', () => setTimeout(hideSplash, 520), { once: true });
window.addEventListener('pageshow', () => setTimeout(hideSplash, 220), { once: true });
setTimeout(() => hideSplash(180), 2800);
splash?.addEventListener('click', () => hideSplash(150));
document.addEventListener('touchstart', () => hideSplash(150), { once: true });

// Install Prompt (beter gecontroleerde PWA-installatie)
let deferredPrompt = null;
const installBtn = document.getElementById('installBtn');
const dashboardToggleBtn = document.getElementById("dashboardToggleBtn");
const iosInstallHintEl = document.getElementById("iosInstallHint");
const settingsPanelEl = document.getElementById("settingsPanel");
const settingsBackdropEl = document.getElementById("settingsBackdrop");
const settingsToggleBtn = document.getElementById("settingsToggleBtn");
const settingsCloseBtn = document.getElementById("settingsCloseBtn");
const settingsInfoBtn = document.getElementById("settingsInfoBtn");
const favoritesBackdropEl = document.getElementById("favoritesBackdrop");
const favoritesToggleBtn = document.getElementById("favoritesToggleBtn");
const favoritesPanelEl = document.getElementById("favoritesPanel");
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredPrompt = e;
  installBtn.classList.add('show');
});
installBtn.addEventListener('click', async () => {
  if (deferredPrompt) {
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    console.log(`Gebruiker antwoord: ${outcome}`);
    deferredPrompt = null;
    installBtn.classList.remove('show');
  } else if (isIosInstallable()) {
    iosInstallHintEl.hidden = false;
  }
});
window.addEventListener('appinstalled', () => {
  console.log('App succesvol geinstalleerd');
  installBtn.classList.remove('show');
  iosInstallHintEl.hidden = true;
  deferredPrompt = null;
});

// Constants
const BASE_URL = "https://pub-611b5bc156eb455ba86d9bcece9aea1c.r2.dev";
const API_URL = "https://busbibliotheek95.pages.dev/api";
const PYTHON_MAIN_DOWNLOAD_URL = "https://busbibliotheek95.pages.dev/python/script.py";
const APK_DOWNLOAD_URL = `${window.location.origin}/android/app/release/app-release.apk`;
const NETWORK_CHECK_URL = `${window.location.origin}/manifest.json?network-check=1`;
const NETWORK_CHECK_TIMEOUT_MS = 5000;
const NETWORK_CHECK_INTERVAL_MS = 15000;
const NETWORK_CHECK_CACHE_MS = 10000;
const FAVORITES_KEY = "bb_favorites_v1";
const SETTINGS_KEY = "bb_settings_v1";
let updateIntervalMs = 10000;

const voertuigInput = document.getElementById("voertuignummer");
const suggestieLijst = document.getElementById("suggestielijst");
const realtimeEl = document.getElementById("realtime");
const vasteDataEl = document.getElementById("vasteData");
const resultsWrapEl = document.querySelector(".results-wrap");
const resultsGridEl = document.getElementById("resultsGrid");
const closeBtnEl = document.getElementById("closeBtn");
const mapEl = document.getElementById("map");
const searchBtn = document.getElementById("searchBtn");
const favoritesListEl = document.getElementById("favoritesList");
const metaDescriptionEl = document.querySelector('meta[name="description"]');
const intervalSelect = document.getElementById("intervalSelect");
const themeSelect = document.getElementById("themeSelect");
const colorThemeSelect = document.getElementById("colorThemeSelect");
const languageSelect = document.getElementById("languageSelect");
const intervalOpt10El = document.getElementById("intervalOpt10");
const intervalOpt15El = document.getElementById("intervalOpt15");
const intervalOpt30El = document.getElementById("intervalOpt30");
const themeAutoOptEl = document.getElementById("themeAutoOpt");
const themeLightOptEl = document.getElementById("themeLightOpt");
const themeDarkOptEl = document.getElementById("themeDarkOpt");
const colorThemeLabelEl = document.getElementById("colorThemeLabel");
const colorClassicOptEl = document.getElementById("colorClassicOpt");
const colorYellowOptEl = document.getElementById("colorYellowOpt");
const colorGreenOptEl = document.getElementById("colorGreenOpt");
const colorBlueOptEl = document.getElementById("colorBlueOpt");
const colorOrangeOptEl = document.getElementById("colorOrangeOpt");
const colorRedOptEl = document.getElementById("colorRedOpt");
const colorPurpleOptEl = document.getElementById("colorPurpleOpt");
const themeColorMetaEls = Array.from(document.querySelectorAll('meta[name="theme-color"]'));
const colorSchemeMetaEl = document.querySelector('meta[name="color-scheme"]');
const prefersDarkScheme = window.matchMedia("(prefers-color-scheme: dark)");
const stalkModeMediaQuery = window.matchMedia("(min-width: 981px)");
const lastUpdateEl = document.getElementById("lastUpdate");
const appTitleBtnEl = document.getElementById("appTitleBtn");
const appTitleEl = document.getElementById("appTitle");
const appSubtitleEl = document.getElementById("appSubtitle");
const appContextLineEl = document.getElementById("appContextLine");
const splashCreditEl = document.getElementById("splashCredit");
const menuToggleTextEl = document.getElementById("menuToggleText");
const morePanelSubtitleEl = document.getElementById("morePanelSubtitle");
const moreFunctionsTitleEl = document.getElementById("moreFunctionsTitle");
const closeBtnTextEl = document.getElementById("closeBtnText");
const favoritesTitleEl = document.getElementById("favoritesTitle");
const settingsTitleEl = document.getElementById("settingsTitle");
const intervalLabelEl = document.getElementById("intervalLabel");
const themeLabelEl = document.getElementById("themeLabel");
const languageLabelEl = document.getElementById("languageLabel");
const dashboardTitleEl = document.getElementById("dashboardTitle");
const staticCardTitleEl = document.getElementById("staticCardTitle");
const realtimeCardTitleEl = document.getElementById("realtimeCardTitle");
const photoCardTitleEl = document.getElementById("photoCardTitle");
const vehiclePhotoCardEl = document.getElementById("vehiclePhotoCard");
const vehiclePhotoImgEl = document.getElementById("vehiclePhotoImg");
const vehiclePhotoPrevBtn = document.getElementById("vehiclePhotoPrevBtn");
const vehiclePhotoNextBtn = document.getElementById("vehiclePhotoNextBtn");
const vehiclePhotoCounterEl = document.getElementById("vehiclePhotoCounter");
const vehiclePhotoMetaEl = document.getElementById("vehiclePhotoMeta");
const vehiclePhotoCaptionEl = document.getElementById("vehiclePhotoCaption");
const disclaimerTitleEl = document.getElementById("disclaimerTitle");
const disclaimerTextEl = document.getElementById("disclaimerText");
const currentYearEl = document.getElementById("currentYear");
const infoModalEl = document.getElementById("infoModal");
const infoModalTitleEl = document.getElementById("infoModalTitle");
const infoModalBodyEl = document.getElementById("infoModalBody");
const infoModalSummaryEl = document.getElementById("infoModalSummary");
const infoModalCloseBtn = document.getElementById("infoModalCloseBtn");
const infoModalOkBtn = document.getElementById("infoModalOkBtn");
const feedStatusEl = document.getElementById("feedStatus");
const funnyModalEl = document.getElementById("funnyModal");
const funnyModalTitleEl = document.getElementById("funnyModalTitle");
const funnyModalBodyEl = document.getElementById("funnyModalBody");
const funnyModalCloseBtn = document.getElementById("funnyModalCloseBtn");
const pageLoadingOverlayEl = document.getElementById("pageLoadingOverlay");
const pageLoadingTextEl = document.getElementById("pageLoadingText");
const offlineOverlayEl = document.getElementById("offlineOverlay");
const offlinePillEl = document.getElementById("offlinePill");
const offlineTitleEl = document.getElementById("offlineTitle");
const offlineTextPrimaryEl = document.getElementById("offlineTextPrimary");
const offlineTextSecondaryEl = document.getElementById("offlineTextSecondary");
const offlineRetryBtn = document.getElementById("offlineRetryBtn");
const pdfModalEl = document.getElementById("pdfModal");
const pdfModalTitleEl = document.getElementById("pdfModalTitle");
const pdfModalSummaryEl = document.getElementById("pdfModalSummary");
const pdfThemeFieldLabelEl = document.getElementById("pdfThemeFieldLabel");
const pdfModalNoteEl = document.getElementById("pdfModalNote");
const pdfThemeSelectEl = document.getElementById("pdfThemeSelect");
const pdfModalCloseBtn = document.getElementById("pdfModalCloseBtn");
const pdfModalCancelBtn = document.getElementById("pdfModalCancelBtn");
const pdfModalConfirmBtn = document.getElementById("pdfModalConfirmBtn");
const compareCardEl = document.getElementById("compareCard");
const compareContentEl = document.getElementById("compareContent");
const compareCardTitleEl = document.getElementById("compareCardTitle");
const compareCardSummaryEl = document.getElementById("compareCardSummary");
const compareClearBtn = document.getElementById("compareClearBtn");
const compareModalEl = document.getElementById("compareModal");
const compareModalTitleEl = document.getElementById("compareModalTitle");
const compareModalSummaryEl = document.getElementById("compareModalSummary");
const compareFieldLabelEl = document.getElementById("compareFieldLabel");
const compareVehicleInputEl = document.getElementById("compareVehicleInput");
const compareModalCloseBtn = document.getElementById("compareModalCloseBtn");
const compareModalCancelBtn = document.getElementById("compareModalCancelBtn");
const compareModalConfirmBtn = document.getElementById("compareModalConfirmBtn");
const dashboardPanelEl = document.getElementById("dashboardPanel");
const dashboardGridEl = document.getElementById("dashboardGrid");
const dashboardSummaryEl = document.getElementById("dashboardSummary");
const dashboardMapWrapEl = document.getElementById("dashboardMapWrap");
const dashboardMapEl = document.getElementById("dashboardMap");
const dashboardLoadingStateEl = document.getElementById("dashboardLoadingState");
const dashboardLoadingTextEl = document.getElementById("dashboardLoadingText");
const dashboardEditBtn = document.getElementById("dashboardEditBtn");
const dashboardCloseBtn = document.getElementById("dashboardCloseBtn");
const dashboardSetupModalEl = document.getElementById("dashboardSetupModal");
const dashboardSetupTitleEl = document.getElementById("dashboardSetupTitle");
const dashboardSetupGridEl = document.getElementById("dashboardSetupGrid");
const dashboardSetupSummaryEl = document.getElementById("dashboardSetupSummary");
const dashboardSetupCloseBtn = document.getElementById("dashboardSetupCloseBtn");
const dashboardSetupCancelBtn = document.getElementById("dashboardSetupCancelBtn");
const dashboardSetupConfirmBtn = document.getElementById("dashboardSetupConfirmBtn");
const morePanelTitleEl = document.getElementById("morePanelTitle");
const haltModuleTitleEl = document.getElementById("haltModuleTitle");
const haltModuleDescriptionEl = document.getElementById("haltModuleDescription");
const haltecodeInputEl = document.getElementById("haltecodeInput");
const haltecodeSearchBtn = document.getElementById("haltecodeSearchBtn");
const haltecodeErrorEl = document.getElementById("haltecodeError");
const haltSearchResultsContainerEl = document.getElementById("haltSearchResultsContainer");
const haltSearchResultsTitleEl = document.getElementById("haltSearchResultsTitle");
const haltSearchResultsListEl = document.getElementById("haltSearchResultsList");
const lastCodesContainerEl = document.getElementById("lastCodesContainer");
const lastCodesTitleEl = document.getElementById("lastCodesTitle");
const lastCodesListEl = document.getElementById("lastCodesList");

let voertuigen = [];
let trips = [];
let routes = [];
let stops = [];
const stopsById = new Map();
const tripsById = new Map();
const tripsByRouteId = new Map();
const tripsByRouteKey = new Map();
const routesById = new Map();
const routesByKey = new Map();
let map, marker, refresh;
let trailLine = null;
let routeTrail = [];
let delayMinutes = 0;
let currentVehicleId = "";
let compareVehicleId = "";
let dashboardVehicleIds = [];
let dashboardRefreshHandle = null;
let dashboardMap = null;
let dashboardMapMarkers = null;
let currentPhotoVehicleId = "";
let currentVehiclePhotoEntries = [];
let currentVehiclePhotoIndex = 0;
let favorites = [];
let settingsOpen = false;
let favoritesPanelOpen = false;
let feedEndDateValue = "";
let vehiclePhotoLookupToken = 0;
let vehiclePhotoDescriptions = null;
let vehiclePhotoDescriptionsPromise = null;
let vehiclePlateFieldKey = "";
let oldVehicleNumbersFieldKey = "";
let oldLicensePlatesFieldKey = "";
let vehicleHideVinFieldKey = "";
const INACTIVITY_LIMIT_MS = 5 * 60 * 1000;
const INACTIVITY_CHECK_MS = 15000;
let lastUserInteractionAt = Date.now();
let realtimePausedByInactivity = false;
let deeplinkHandled = false;
const APP_VERSION = "2026.04.06-1";
const dataLoadTimestamps = {
  vehicles: 0,
  trips: 0,
  routes: 0,
  stops: 0,
  feedInfo: 0,
  realtime: 0
};
if (currentYearEl) currentYearEl.textContent = String(new Date().getFullYear());
let inactivityCheckHandle = null;
let networkCheckHandle = null;
let pdfModalVehicleId = "";
let tripsLoadPromise = null;
let routesLoadPromise = null;
let stopsLoadPromise = null;
let jsPdfLoadPromise = null;
let html2CanvasLoadPromise = null;
let lastVerifiedInternetAt = 0;
let lastVerifiedInternetState = true;
let realtimeRequestToken = 0;
let dashboardRequestToken = 0;
let latestSearchToken = 0;
let activeVehicleSuggestionInput = null;
let settings = {
  intervalMs: 10000,
  theme: "auto",
  colorTheme: "classic",
  language: "nl"
};
const platformUserAgent = window.navigator.userAgent || "";
const isAndroidPlatform = /Android/i.test(platformUserAgent);
const isAndroidWebView = isAndroidPlatform && /\bwv\b|Version\/[\d.]+/i.test(platformUserAgent);
const LAST_HALTES_KEY = "lastHaltes";
const HALTE_CODE_REGEX = /^[1-5]\d{5}$/;
const HALTE_SEARCH_LIMIT = 8;
let halteSearchRequestToken = 0;

const translationsConfig = window.BB_TRANSLATIONS || {};
const i18n = translationsConfig.i18n || { nl: {} };
const localWordLabels = translationsConfig.localWordLabels || {};
const vehicleFieldLabels = translationsConfig.vehicleFieldLabels || {};
const localeMap = translationsConfig.localeMap || { nl: "nl-NL" };
const delayLexicon = translationsConfig.delayLexicon || {};

const DEFAULT_LANG = "nl";
const FALLBACK_LANG = "en";
const ALLOWED_COLOR_THEMES = ["classic", "yellow", "green", "blue", "orange", "red", "purple"];
const ALLOWED_UPDATE_INTERVALS = [10000, 15000, 30000];
const REQUEST_TIMEOUT_MS = 12000;
const PDF_EXPORT_THEMES = {
  wit: {
    pageBg: "#f8fafc",
    badgeBg: "linear-gradient(135deg, #e5e7eb, #f8fafc)",
    badgeFg: "#374151",
    accent: "#d1d5db",
    accentSoft: "#e5e7eb",
    cardLine: "#e5e7eb"
  },
  geel: {
    pageBg: "#fff8db",
    badgeBg: "linear-gradient(135deg, #fde68a, #fef3c7)",
    badgeFg: "#92400e",
    accent: "#f4d67a",
    accentSoft: "#f3e2a5",
    cardLine: "#f8edbf"
  },
  groen: {
    pageBg: "#eefbf2",
    badgeBg: "linear-gradient(135deg, #bbf7d0, #dcfce7)",
    badgeFg: "#166534",
    accent: "#86efac",
    accentSoft: "#bbf7d0",
    cardLine: "#d9fbe4"
  },
  blauw: {
    pageBg: "#eff6ff",
    badgeBg: "linear-gradient(135deg, #93c5fd, #dbeafe)",
    badgeFg: "#1d4ed8",
    accent: "#93c5fd",
    accentSoft: "#bfdbfe",
    cardLine: "#dbeafe"
  },
  oranje: {
    pageBg: "#fff3e8",
    badgeBg: "linear-gradient(135deg, #fdba74, #ffedd5)",
    badgeFg: "#9a3412",
    accent: "#fdba74",
    accentSoft: "#fed7aa",
    cardLine: "#ffe5c8"
  },
  rood: {
    pageBg: "#fff1f2",
    badgeBg: "linear-gradient(135deg, #fda4af, #ffe4e6)",
    badgeFg: "#9f1239",
    accent: "#fda4af",
    accentSoft: "#fecdd3",
    cardLine: "#ffe0e4"
  },
  paars: {
    pageBg: "#f6f0ff",
    badgeBg: "linear-gradient(135deg, #d8b4fe, #f3e8ff)",
    badgeFg: "#6b21a8",
    accent: "#d8b4fe",
    accentSoft: "#e9d5ff",
    cardLine: "#efe3ff"
  }
};
const VEHICLE_DISPLAY_FIELD_MAP = {
  vehicle_id: "Voertuignummer",
  bus: "Type",
  license_plate: "Nummerplaat",
  id_date: "In dienst",
  ud_date: "Uit dienst",
  owner: "Eigenaar",
  spotted: "Gespot?",
  hansea_id: "Hansea nummer",
  intern_id: "Intern nummer",
  vin: "VIN",
  "hide-vin": "hide-vin",
  old_vehicle_id: "Oude voertuignummers",
  old_license_plate: "Oude nummerplaten",
  operator: "Vervoersmaatschappij",
  notes: "Opmerkingen"
};
const VEHICLE_FIELD_TRANSLATION_FALLBACKS = {
  voertuignummer: {
    nl: "Voertuignummer",
    fr: "Numero de vehicule",
    en: "Vehicle number",
    de: "Fahrzeugnummer",
    pl: "Numer pojazdu",
    es: "Numero de vehiculo",
    ru: "ÐÐ¾Ð¼ÐµÑ€ Ñ‚Ñ€Ð°Ð½ÑÐ¿Ð¾Ñ€Ñ‚Ð°"
  },
  "gespot?": {
    nl: "Gespot?",
    fr: "Repere ?",
    en: "Spotted?",
    de: "Gesichtet?",
    pl: "Zauwazony?",
    es: "Visto?",
    ru: "Ð—Ð°Ð¼ÐµÑ‡ÐµÐ½?"
  },
  "intern nummer": {
    nl: "Intern nummer",
    fr: "Numero interne",
    en: "Internal number",
    de: "Interne Nummer",
    pl: "Numer wewnetrzny",
    es: "Numero interno",
    ru: "Ð’Ð½ÑƒÑ‚Ñ€ÐµÐ½Ð½Ð¸Ð¹ Ð½Ð¾Ð¼ÐµÑ€"
  },
  vin: {
    nl: "VIN",
    fr: "VIN",
    en: "VIN",
    de: "FIN",
    pl: "VIN",
    es: "VIN",
    ru: "VIN"
  },
  opmerkingen: {
    nl: "Opmerkingen",
    fr: "Remarques",
    en: "Notes",
    de: "Notizen",
    pl: "Uwagi",
    es: "Notas",
    ru: "Ð—Ð°Ð¼ÐµÑ‚ÐºÐ¸"
  }
};

function normalizeUpdateIntervalMs(intervalMs) {
  const value = Number(intervalMs);
  return ALLOWED_UPDATE_INTERVALS.includes(value) ? value : 10000;
}

async function fetchWithTimeout(url, options = {}, timeoutMs = REQUEST_TIMEOUT_MS) {
  const controller = new AbortController();
  const timeoutHandle = setTimeout(() => controller.abort("timeout"), timeoutMs);

  try {
    const response = await fetch(url, { ...options, signal: controller.signal });
    if (!response.ok) {
      throw new Error(`HTTP ${response.status} voor ${url}`);
    }
    return response;
  } catch (error) {
    if (error?.name === "AbortError") {
      throw new Error(`Timeout na ${timeoutMs}ms voor ${url}`);
    }
    throw error;
  } finally {
    clearTimeout(timeoutHandle);
  }
}

function translateKey(key, language = settings.language) {
  return (
    i18n[language]?.[key] ??
    i18n[FALLBACK_LANG]?.[key] ??
    i18n[DEFAULT_LANG]?.[key] ??
    key
  );
}

const t = (key) => translateKey(key);
const localWord = (key) =>
  localWordLabels[key]?.[settings.language] ??
  localWordLabels[key]?.[FALLBACK_LANG] ??
  localWordLabels[key]?.[DEFAULT_LANG] ??
  key;

function normalizeFieldKey(key) {
  return (key || "")
    .toString()
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function translateVehicleFieldLabel(key) {
  const normalized = normalizeFieldKey(key);
  return (
    VEHICLE_FIELD_TRANSLATION_FALLBACKS[normalized]?.[settings.language] ||
    VEHICLE_FIELD_TRANSLATION_FALLBACKS[normalized]?.[FALLBACK_LANG] ||
    VEHICLE_FIELD_TRANSLATION_FALLBACKS[normalized]?.[DEFAULT_LANG] ||
    vehicleFieldLabels[settings.language]?.[normalized] ||
    vehicleFieldLabels[FALLBACK_LANG]?.[normalized] ||
    vehicleFieldLabels[DEFAULT_LANG]?.[normalized] ||
    key
  );
}

const localeForLanguage = (lang) => localeMap[lang] || localeMap[FALLBACK_LANG] || localeMap[DEFAULT_LANG] || "nl-NL";

function escapeHtml(value) {
  return (value ?? "")
    .toString()
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function translateTemplate(key, fallback) {
  const translated = t(key);
  return translated === key ? fallback : translated;
}

function fillTemplate(template, id) {
  return template.includes("{id}") ? template.replace("{id}", id) : `${template} ${id}`;
}

function getLabel(key, fallback) {
  const translated = t(key);
  return translated === key ? fallback : translated;
}

function normalizeSearchText(value) {
  return (value || "")
    .toString()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/"/g, "")
    .trim();
}

function sanitizeFileName(value, fallback = "bus") {
  const cleaned = (value || "")
    .toString()
    .replace(/[<>:"/\\|?*\x00-\x1f]/g, "_")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/[. ]+$/g, "");
  return cleaned || fallback;
}

function formatInfoTimestamp(timestamp) {
  if (!timestamp) return getLabel("notLoadedYet", "Nog niet geladen");
  return new Date(timestamp).toLocaleString(localeForLanguage(settings.language), {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit"
  });
}

function showInfoModal() {
  if (!infoModalEl || !infoModalBodyEl) return;
  const rows = [
    [getLabel("infoWebsiteVersion", "Websiteversie"), APP_VERSION],
    [getLabel("infoVehicles", "Voertuigen (vehicles.txt)"), formatInfoTimestamp(dataLoadTimestamps.vehicles)],
    [getLabel("infoTrips", "Ritten (trips.txt)"), formatInfoTimestamp(dataLoadTimestamps.trips)],
    [getLabel("infoRoutes", "Lijnen (routes.txt)"), formatInfoTimestamp(dataLoadTimestamps.routes)],
    [getLabel("infoStops", "Haltes (stops.txt)"), formatInfoTimestamp(dataLoadTimestamps.stops)],
    [getLabel("infoFeed", "Feed-info"), formatInfoTimestamp(dataLoadTimestamps.feedInfo)],
    [getLabel("infoRealtimeApi", "Realtime API"), formatInfoTimestamp(dataLoadTimestamps.realtime)]
  ];
  infoModalBodyEl.innerHTML = `
    <div class="info-list">
      ${rows.map(([label, value]) => `
        <div class="info-row">
          <span class="info-label">${escapeHtml(label)}</span>
          <span class="info-value">${escapeHtml(value)}</span>
        </div>
      `).join("")}
    </div>
  `;
  infoModalEl.hidden = false;
  document.body.classList.add("pdf-modal-open");
}

function hideInfoModal() {
  if (!infoModalEl) return;
  infoModalEl.hidden = true;
  document.body.classList.remove("pdf-modal-open");
}

function updateUrlState() {
  const url = new URL(window.location.href);
  if (currentVehicleId) url.searchParams.set("bus", currentVehicleId);
  else url.searchParams.delete("bus");

  if (compareVehicleId) url.searchParams.set("compare", compareVehicleId);
  else url.searchParams.delete("compare");

  const nextUrl = `${url.pathname}${url.search}${url.hash}`;
  window.history.replaceState({}, "", nextUrl);
}

function updateDocumentTitle(vehicleId = "") {
  const normalizedVehicleId = normalize(vehicleId || currentVehicleId);
  document.title = normalizedVehicleId
    ? `Voertuig ${normalizedVehicleId} – Busbibliotheek`
    : "Busbibliotheek";
}

function getVehicleDisplayValue(bus, fieldKey, rawValue) {
  const value = rawValue == null ? "" : rawValue.toString().trim();
  const key = fieldKey.toLowerCase();
  if (key.includes("in dienst")) {
    if (!value || value === "/") return "Bus nog niet in dienst";
    return formatDateForUi(value, { year: "numeric", month: "long", day: "numeric" });
  }
  if (key.includes("uit dienst")) {
    if (!value || value === "/") return t("notOutOfService");
    return formatDateForUi(value, { year: "numeric", month: "long", day: "numeric" });
  }
  if (key.includes("datum")) {
    if (!value || value === "/") return "";
    return formatDateForUi(value, { weekday: "long", year: "numeric", month: "long", day: "numeric" });
  }
  if (!value || value === "/") return "";
  return value;
}

function collectVehicleDisplayRows(bus) {
  const rows = [];
  if (!bus) return rows;
  const shouldHideVin = getVehicleField(bus, vehicleHideVinFieldKey) === "1" && normalize(getVehicleField(bus, "VIN")) !== "/";

  for (const [fieldKey, rawValue] of Object.entries(bus)) {
    if (fieldKey === "Vervoersmaatschappij" || fieldKey === "Voertuignummer" || fieldKey === "Type" || fieldKey === vehicleHideVinFieldKey) continue;
    if (fieldKey === "VIN" && shouldHideVin) continue;
    if (fieldKey === "Gespot?" || fieldKey === "Opmerkingen") continue;

    const displayValue = getVehicleDisplayValue(bus, fieldKey, rawValue);
    if (!displayValue) continue;

    rows.push({
      key: normalizeFieldKey(fieldKey),
      label: translateVehicleFieldLabel(fieldKey),
      value: displayValue,
      isHansea: normalizeFieldKey(fieldKey) === "hansea nummer"
    });
  }

  return rows;
}

function getBusPdfThemeOptionsMarkup(selectedTheme = "geel") {
  return Object.keys(PDF_EXPORT_THEMES).map((themeKey) => {
    const selected = themeKey === selectedTheme ? " selected" : "";
    const label = getLabel(`pdfTheme${themeKey.charAt(0).toUpperCase()}${themeKey.slice(1)}`, themeKey.charAt(0).toUpperCase() + themeKey.slice(1));
    return `<option value="${themeKey}"${selected}>${label}</option>`;
  }).join("");
}

function getPreferredPdfThemeKey(colorTheme) {
  const themeMap = {
    classic: "wit",
    yellow: "geel",
    green: "groen",
    blue: "blauw",
    orange: "oranje",
    red: "rood",
    purple: "paars"
  };
  return themeMap[normalizeColorTheme(colorTheme)] || "geel";
}

function formatBusFieldValueForDisplay(bus, fieldKey, rawValue) {
  const value = rawValue == null ? "" : rawValue.toString().trim();
  const key = fieldKey.toLowerCase();

  if (key.includes("in dienst")) {
    if (!value || value === "/") return "Bus nog niet in dienst";
    return formatDateForUi(value, { year: "numeric", month: "long", day: "numeric" });
  }

  if (key.includes("uit dienst")) {
    if (!value || value === "/") return t("notOutOfService");
    return formatDateForUi(value, { year: "numeric", month: "long", day: "numeric" });
  }

  if (key.includes("datum")) {
    if (!value || value === "/") return "";
    return formatDateForUi(value, { weekday: "long", year: "numeric", month: "long", day: "numeric" });
  }

  if (!value || value === "/") return "";
  return value;
}

function getBusPdfRows(bus) {
  const rows = [];
  const shouldHideVin = getVehicleField(bus, vehicleHideVinFieldKey) === "1" && normalize(getVehicleField(bus, "VIN")) !== "/";

  for (const [fieldKey, rawValue] of Object.entries(bus)) {
    if (fieldKey === "Vervoersmaatschappij" || fieldKey === "Voertuignummer" || fieldKey === "Type" || fieldKey === vehicleHideVinFieldKey) continue;
    if (fieldKey === "VIN" && shouldHideVin) continue;
    if (fieldKey === "Gespot?" || fieldKey === "Opmerkingen") continue;

    const formattedValue = formatBusFieldValueForDisplay(bus, fieldKey, rawValue);
    if (!formattedValue) continue;

    rows.push({
      label: translateVehicleFieldLabel(fieldKey),
      value: formattedValue,
      isHansea: normalizeFieldKey(fieldKey) === "hansea nummer"
    });
  }

  return rows;
}

function showPdfModal(vehicleId) {
  const bus = findBusById(vehicleId);
  if (!bus) return;

  pdfModalVehicleId = vehicleId;
  const preferredPdfTheme = getPreferredPdfThemeKey(settings.colorTheme);
  if (pdfThemeSelectEl) {
    pdfThemeSelectEl.innerHTML = getBusPdfThemeOptionsMarkup(preferredPdfTheme);
  }
  if (pdfModalSummaryEl) {
    const owner = getVehicleField(bus, "Eigenaar") || "-";
    pdfModalSummaryEl.textContent = `${bus.Voertuignummer} · ${bus.Type || getLabel("unknownType", "Onbekend type")} · ${owner}`;
  }
  if (!pdfModalEl) return;
  pdfModalEl.hidden = false;
  document.body.classList.add("pdf-modal-open");
}

function hidePdfModal() {
  pdfModalVehicleId = "";
  if (!pdfModalEl) return;
  pdfModalEl.hidden = true;
  document.body.classList.remove("pdf-modal-open");
}

function showCompareModal() {
  if (!currentVehicleId || !compareModalEl) return;
  compareVehicleInputEl.value = "";
  compareModalEl.hidden = false;
  document.body.classList.add("pdf-modal-open");
  bindVehicleSuggestions(compareVehicleInputEl, () => {
    compareModalConfirmBtn?.click();
  });
  window.setTimeout(() => compareVehicleInputEl?.focus(), 20);
}

function hideCompareModal() {
  if (!compareModalEl) return;
  compareModalEl.hidden = true;
  document.body.classList.remove("pdf-modal-open");
}

function clearComparison() {
  compareVehicleId = "";
  if (compareCardEl) {
    compareCardEl.hidden = true;
    compareCardEl.setAttribute("aria-hidden", "true");
  }
  if (compareContentEl) compareContentEl.innerHTML = "";
  if (compareCardSummaryEl) compareCardSummaryEl.textContent = getLabel("compareSummary", "Vergelijk twee voertuigen naast elkaar.");
  updateUrlState();
}

function renderComparison() {
  if (!compareCardEl || !compareContentEl || !currentVehicleId || !compareVehicleId) {
    clearComparison();
    return;
  }

  const baseBus = findBusById(currentVehicleId);
  const compareBus = findBusById(compareVehicleId);
  if (!baseBus || !compareBus) {
    clearComparison();
    return;
  }

  const baseRows = collectVehicleDisplayRows(baseBus);
  const compareRows = collectVehicleDisplayRows(compareBus);
  const rowMap = new Map();

  for (const row of baseRows) rowMap.set(row.key, { label: row.label, left: row, right: null });
  for (const row of compareRows) {
    const existing = rowMap.get(row.key);
    if (existing) existing.right = row;
    else rowMap.set(row.key, { label: row.label, left: null, right: row });
  }

  const renderCellValue = (row) => {
    if (!row) return '<span class="compare-empty">-</span>';
    const safeValue = escapeHtml(row.value);
    return row.isHansea ? `<span class="compare-hansea">${safeValue}</span>` : safeValue;
  };

  const rowsHtml = Array.from(rowMap.values()).map((row) => `
    <tr>
      <th scope="row">${escapeHtml(row.label)}</th>
      <td data-column="${escapeHtml(baseBus.Voertuignummer || currentVehicleId)}">${renderCellValue(row.left)}</td>
      <td data-column="${escapeHtml(compareBus.Voertuignummer || compareVehicleId)}">${renderCellValue(row.right)}</td>
    </tr>
  `).join("");

  compareContentEl.innerHTML = `
    <div class="compare-vehicles-head">
      <div class="compare-vehicle-pill">
        <strong>${escapeHtml(baseBus.Voertuignummer || currentVehicleId)}</strong>
        <span>${escapeHtml(baseBus.Type || getLabel("unknownType", "Onbekend type"))}</span>
      </div>
      <div class="compare-vs">vs</div>
      <div class="compare-vehicle-pill">
        <strong>${escapeHtml(compareBus.Voertuignummer || compareVehicleId)}</strong>
        <span>${escapeHtml(compareBus.Type || getLabel("unknownType", "Onbekend type"))}</span>
      </div>
    </div>
    <div class="compare-table-wrap">
      <table class="compare-table">
        <thead>
          <tr>
            <th class="compare-table-corner" aria-hidden="true"></th>
            <th scope="col">${escapeHtml(baseBus.Voertuignummer || currentVehicleId)}</th>
            <th scope="col">${escapeHtml(compareBus.Voertuignummer || compareVehicleId)}</th>
          </tr>
        </thead>
        <tbody>${rowsHtml}</tbody>
      </table>
    </div>
  `;

  compareCardSummaryEl.textContent = getLabel("compareActiveSummary", "{left} naast {right}")
    .replace("{left}", baseBus.Voertuignummer || currentVehicleId)
    .replace("{right}", compareBus.Voertuignummer || compareVehicleId);
  compareCardEl.hidden = false;
  compareCardEl.setAttribute("aria-hidden", "false");
  updateUrlState();
}

async function applyDeepLinkIfNeeded() {
  if (deeplinkHandled) return;
  deeplinkHandled = true;

  const params = new URLSearchParams(window.location.search);
  const busParam = params.get("bus") || "";
  const compareParam = params.get("compare") || "";
  if (!busParam) return;

  voertuigInput.value = busParam;
  await zoekAlles();

  if (compareParam) {
    const resolvedCompare = resolveVehicleSearch(compareParam);
    const compareId = resolvedCompare.vehicleId || normalize(compareParam);
    if (compareId && compareId !== currentVehicleId && resolvedCompare.bus) {
      compareVehicleId = compareId;
      renderComparison();
    }
  }
}

function renderDashboardSetupInputs() {
  if (!dashboardSetupGridEl) return;
  dashboardSetupGridEl.innerHTML = Array.from({ length: 9 }, (_, index) => {
    const currentValue = escapeHtml(dashboardVehicleIds[index] || "");
    return `
      <label class="dashboard-setup-field">
        <span>${getLabel("dashboardCardLabel", "Kaart")} ${index + 1}</span>
        <input class="dashboard-setup-input" type="text" inputmode="text" autocomplete="off" placeholder="${escapeHtml(getLabel("dashboardSetupPlaceholder", "Voertuignummer of plaat"))}" value="${currentValue}">
      </label>
    `;
  }).join("");

  dashboardSetupGridEl.querySelectorAll(".dashboard-setup-input").forEach((inputEl) => {
    bindVehicleSuggestions(inputEl, () => {});
  });
}

function showDashboardSetupModal() {
  if (!stalkModeMediaQuery.matches) return;
  renderDashboardSetupInputs();
  dashboardSetupModalEl.hidden = false;
  document.body.classList.add("pdf-modal-open");
  window.setTimeout(() => dashboardSetupGridEl?.querySelector("input")?.focus(), 20);
}

function hideDashboardSetupModal() {
  if (!dashboardSetupModalEl) return;
  dashboardSetupModalEl.hidden = true;
  document.body.classList.remove("pdf-modal-open");
}

function syncStalkModeAvailability() {
  const isAvailable = stalkModeMediaQuery.matches;
  if (dashboardToggleBtn) dashboardToggleBtn.hidden = !isAvailable;
  if (!isAvailable) {
    hideDashboardSetupModal();
    closeDashboardPanel();
  }
}

function stopDashboardRefresh() {
  if (dashboardRefreshHandle) {
    clearInterval(dashboardRefreshHandle);
    dashboardRefreshHandle = null;
  }
  dashboardRequestToken += 1;
}

function initDashboardMap() {
  if (!dashboardMapEl || dashboardMap) return;
  dashboardMap = L.map("dashboardMap", { zoomControl: true, preferCanvas: true }).setView([51.0, 4.4], 9);
  L.tileLayer("https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png", {
    attribution: '&copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors &amp; <a href="https://carto.com/">CARTO</a>'
  }).addTo(dashboardMap);
  dashboardMapMarkers = L.layerGroup().addTo(dashboardMap);
}

function buildDashboardMapTooltip(snapshot) {
  return `
    <div class="dashboard-map-tooltip-card">
      <span class="line-badge" style="--line-badge-bg:${snapshot.routeColor};--line-badge-fg:${snapshot.routeTextColor};">${escapeHtml(snapshot.routeShort)}</span>
      <strong>${escapeHtml(snapshot.vehicleId)}</strong>
      <span>${escapeHtml(snapshot.destinationText || "-")}</span>
    </div>
  `;
}

function renderDashboardMap(snapshots) {
  if (!dashboardMapWrapEl) return;
  const liveSnapshots = snapshots.filter((snapshot) =>
    snapshot.status === "live" &&
    Number.isFinite(snapshot.latitude) &&
    Number.isFinite(snapshot.longitude)
  );

  if (!liveSnapshots.length) {
    dashboardMapWrapEl.classList.add("hidden");
    if (dashboardMapMarkers) dashboardMapMarkers.clearLayers();
    return;
  }

  dashboardMapWrapEl.classList.remove("hidden");
  initDashboardMap();
  dashboardMapMarkers.clearLayers();

  const bounds = [];
  liveSnapshots.forEach((snapshot) => {
    const markerInstance = L.marker([snapshot.latitude, snapshot.longitude], { icon: busIcon }).addTo(dashboardMapMarkers);
    const markerEl = markerInstance.getElement && markerInstance.getElement();
    if (markerEl) {
      const img = markerEl.querySelector("img");
      if (img) img.style.transform = `rotate(${snapshot.bearing || 0}deg)`;
    }
    markerInstance.bindTooltip(buildDashboardMapTooltip(snapshot), {
      permanent: true,
      direction: "top",
      offset: [0, -26],
      className: "dashboard-map-tooltip"
    });
    bounds.push([snapshot.latitude, snapshot.longitude]);
  });

  window.setTimeout(() => {
    dashboardMap.invalidateSize();
    if (bounds.length === 1) {
      dashboardMap.setView(bounds[0], 15);
      return;
    }
    dashboardMap.fitBounds(bounds, { padding: [28, 28], maxZoom: 15 });
  }, 0);
}

function closeDashboardPanel() {
  stopDashboardRefresh();
  if (!dashboardPanelEl) return;
  setDashboardLoading(false);
  dashboardPanelEl.hidden = true;
  dashboardPanelEl.setAttribute("aria-hidden", "true");
  document.body.classList.remove("dashboard-open");
  renderDashboardMap([]);
}

function setDashboardLoading(active) {
  if (!dashboardLoadingStateEl) return;
  dashboardLoadingStateEl.hidden = !active;
  dashboardLoadingStateEl.setAttribute("aria-hidden", String(!active));
  dashboardPanelEl?.classList.toggle("is-loading", !!active);
  if (dashboardLoadingTextEl) {
    dashboardLoadingTextEl.textContent = getLabel("dashboardLoading", "Stalk modus wordt geladen...");
  }
}

function getRoutePresentationFromRealtime(id, entities, bus) {
  const normalizedRequestedId = cleanText(id);
  const gpsEntity = [...entities].reverse().find((entity) => {
    const vehiclePayload = getEntityVehiclePayload(entity);
    if (!vehiclePayload?.position) return false;
    const descriptor =
      vehiclePayload?.vehicle ||
      vehiclePayload?.vehicleDescriptor ||
      vehiclePayload?.vehicle_descriptor;
    const descriptorId = getVehicleDescriptorId(descriptor);
    return descriptorId === normalizedRequestedId;
  });
  const gps = gpsEntity ? { vehicle: getEntityVehiclePayload(gpsEntity) } : null;
  if (!gps) {
    return {
      status: "offline",
      vehicleId: id,
      type: bus?.Type || "",
      message: getLabel("dashboardNoRealtime", "Geen realtime beschikbaar")
    };
  }

  const v = gps.vehicle;
  const vehicleDescriptor = extractTripDescriptor(v);
  let tripUpdate = getTripUpdateForVehicle(entities, id, vehicleDescriptor.tripId);
  if (!tripUpdate) {
    const gpsEntityId = cleanText(gpsEntity?.id || gpsEntity?.entityId || gpsEntity?.entity_id || "");
    tripUpdate = getTripUpdateForEntityId(entities, gpsEntityId);
  }
  const tripUpdateDescriptor = extractTripDescriptor(tripUpdate);
  const descriptor = {
    tripId: vehicleDescriptor.tripId || tripUpdateDescriptor.tripId,
    routeId: vehicleDescriptor.routeId || tripUpdateDescriptor.routeId,
    routeShortName: vehicleDescriptor.routeShortName || tripUpdateDescriptor.routeShortName,
    headsign: vehicleDescriptor.headsign || tripUpdateDescriptor.headsign
  };

  const tripId = cleanText(descriptor.tripId);
  const provisionalRouteId = pickFirstText(cleanText(descriptor.routeId), getRouteKeyFromTripId(tripId));
  const tripData = findTripData(provisionalRouteId, tripId, descriptor.headsign);
  const routeId = pickFirstText(tripData?.route_id, provisionalRouteId, getRouteKeyFromTripId(tripId));
  const routeData = findRouteDataByRouteId(routeId, tripId);
  const routeShort = pickFirstText(routeData?.route_short_name, descriptor.routeShortName, routeId) || "?";
  const destinationText = pickFirstText(tripData?.trip_headsign, descriptor.headsign, tripData?.trip_short_name) || "-";
  const currentStopId = getCurrentStopIdFromTripUpdate(tripUpdate);
  const currentStop = getStopByStopId(currentStopId);
  const currentStopName = cleanText(currentStop?.stop_name || currentStopId || "") || getLabel("unknownStop", "Onbekende halte");
  const routeColorRaw = (routeData?.route_color || "").replace(/[^0-9a-fA-F]/g, "").slice(0, 6);
  const routeTextColorRaw = (routeData?.route_text_color || "").replace(/[^0-9a-fA-F]/g, "").slice(0, 6);

  let delaySeconds = getDelaySecondsFromTripUpdate(tripUpdate);
  if (typeof delaySeconds !== "number" && typeof gps.vehicle.trip?.delay === "number") delaySeconds = gps.vehicle.trip.delay;
  if (typeof delaySeconds !== "number" && typeof v.stopStatus?.delay === "number") delaySeconds = v.stopStatus.delay;
  if (typeof delaySeconds !== "number") delaySeconds = 0;
  const delayMins = delaySeconds < 0 ? -Math.round(Math.abs(delaySeconds) / 60) : Math.round(delaySeconds / 60);

  return {
    status: "live",
    vehicleId: id,
    type: bus?.Type || "",
    routeShort,
    destinationText,
    currentStopName,
    delayMessage: formatDelayMessage(delayMins),
    routeColor: routeColorRaw.length === 6 ? `#${routeColorRaw}` : "#2563eb",
    routeTextColor: routeTextColorRaw.length === 6 ? `#${routeTextColorRaw}` : "#ffffff",
    latitude: Number(v.position?.latitude),
    longitude: Number(v.position?.longitude),
    bearing: Number(v.position?.bearing || 0)
  };
}

async function refreshDashboardPanel() {
  const requestToken = ++dashboardRequestToken;
  if (!dashboardPanelEl || !dashboardGridEl || !dashboardVehicleIds.length) return;
  setDashboardLoading(true);
  try {
    const hasInternet = await verifyInternetConnection();
    if (requestToken !== dashboardRequestToken) return;
    if (!hasInternet) {
      renderDashboardMap([]);
      dashboardGridEl.innerHTML = `<div class="dashboard-empty">${escapeHtml(getLabel("dashboardNoInternet", "Geen internetverbinding voor live dashboard."))}</div>`;
      return;
    }

    if (voertuigen.length === 0) await laadVoertuigen();
    if (trips.length === 0) await laadTrips();
    if (routes.length === 0) await laadRoutes();
    if (stopsById.size === 0) await laadStops();

    const res = await fetchWithTimeout(API_URL);
    const data = await res.json();
    if (requestToken !== dashboardRequestToken || dashboardPanelEl.hidden) return;
    const entities = Array.isArray(data.entity) ? data.entity : [];

    const snapshots = [];
    const cardsHtml = dashboardVehicleIds.map((id) => {
      const bus = findBusById(id);
      if (!bus) {
        return `
          <article class="dashboard-card is-offline">
            <div class="dashboard-card-top">
              <strong>${escapeHtml(id)}</strong>
              <span class="dashboard-status">${escapeHtml(getLabel("dashboardNotFound", "Niet gevonden"))}</span>
            </div>
            <p class="dashboard-meta">${escapeHtml(getLabel("dashboardNoVehicleData", "Geen voertuigdata gevonden."))}</p>
          </article>
        `;
      }

      if (isOutOfService(bus)) {
        return `
          <article class="dashboard-card is-offline">
            <div class="dashboard-card-top">
              <strong>${escapeHtml(bus.Voertuignummer || id)}</strong>
              <span class="dashboard-status">${escapeHtml(getLabel("dashboardOutOfService", "Uit dienst"))}</span>
            </div>
            <p class="dashboard-type">${escapeHtml(bus.Type || "")}</p>
            <p class="dashboard-meta">${escapeHtml(getLabel("dashboardNoRealtimeWithPeriod", "Geen realtime beschikbaar."))}</p>
          </article>
        `;
      }

      const snapshot = getRoutePresentationFromRealtime(id, entities, bus);
      snapshots.push(snapshot);
      if (snapshot.status !== "live") {
        return `
          <article class="dashboard-card is-offline">
            <div class="dashboard-card-top">
              <strong>${escapeHtml(bus.Voertuignummer || id)}</strong>
              <span class="dashboard-status">${escapeHtml(getLabel("dashboardOffline", "Offline"))}</span>
            </div>
            <p class="dashboard-type">${escapeHtml(bus.Type || "")}</p>
            <p class="dashboard-meta">${escapeHtml(snapshot.message || getLabel("dashboardNoRealtime", "Geen realtime beschikbaar"))}</p>
          </article>
        `;
      }

      return `
        <article class="dashboard-card is-live">
          <div class="dashboard-card-top">
            <strong>${escapeHtml(bus.Voertuignummer || id)}</strong>
            <span class="line-badge" style="--line-badge-bg:${snapshot.routeColor};--line-badge-fg:${snapshot.routeTextColor};">${escapeHtml(snapshot.routeShort)}</span>
          </div>
          <p class="dashboard-type">${escapeHtml(bus.Type || "")}</p>
          <p class="dashboard-destination">${escapeHtml(snapshot.destinationText)}</p>
          <p class="dashboard-meta">${escapeHtml(getLabel("dashboardStopPrefix", "Halte:"))} ${escapeHtml(snapshot.currentStopName)}</p>
          <p class="dashboard-meta">${escapeHtml(snapshot.delayMessage)}</p>
        </article>
      `;
    }).join("");

    renderDashboardMap(snapshots);
    dashboardGridEl.innerHTML = cardsHtml;
    const liveCount = snapshots.filter((snapshot) => snapshot.status === "live").length;
    dashboardSummaryEl.textContent = getLabel("dashboardLiveSummary", "{live} van {total} voertuigen live op kaart")
      .replace("{live}", String(liveCount))
      .replace("{total}", String(dashboardVehicleIds.length));
  } finally {
    if (requestToken === dashboardRequestToken) {
      setDashboardLoading(false);
    }
  }
}

async function openDashboardPanel() {
  if (!stalkModeMediaQuery.matches) return;
  if (!dashboardVehicleIds.length) {
    showDashboardSetupModal();
    return;
  }
  dashboardPanelEl.hidden = false;
  dashboardPanelEl.setAttribute("aria-hidden", "false");
  document.body.classList.add("dashboard-open");
  initDashboardMap();
  await refreshDashboardPanel();
  stopDashboardRefresh();
  dashboardRefreshHandle = window.setInterval(() => {
    refreshDashboardPanel().catch((error) => console.warn("Dashboard refresh mislukt", error));
  }, updateIntervalMs);
}


function hexToRgb(hexValue) {
  const normalized = (hexValue || "").replace("#", "").trim();
  if (normalized.length !== 6) return [17, 24, 39];
  return [
    Number.parseInt(normalized.slice(0, 2), 16),
    Number.parseInt(normalized.slice(2, 4), 16),
    Number.parseInt(normalized.slice(4, 6), 16)
  ];
}

function inferImageFormat(dataUrl) {
  if (!dataUrl) return "PNG";
  if (dataUrl.startsWith("data:image/jpeg") || dataUrl.startsWith("data:image/jpg")) return "JPEG";
  if (dataUrl.startsWith("data:image/webp")) return "WEBP";
  return "PNG";
}

function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result?.toString() || "");
    reader.onerror = () => reject(reader.error || new Error("Bestand kon niet gelezen worden"));
    reader.readAsDataURL(file);
  });
}

async function loadImageAsDataUrl(src) {
  try {
    const response = await fetch(src, { cache: "force-cache" });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const blob = await response.blob();
    const objectUrl = URL.createObjectURL(blob);
    try {
      const image = await new Promise((resolve, reject) => {
        const element = new Image();
        element.onload = () => resolve(element);
        element.onerror = () => reject(new Error("Afbeelding kon niet worden geladen"));
        element.src = objectUrl;
      });

      const canvas = document.createElement("canvas");
      canvas.width = image.naturalWidth || image.width;
      canvas.height = image.naturalHeight || image.height;
      const context = canvas.getContext("2d");
      if (!context) throw new Error("Canvas-context niet beschikbaar");

      context.fillStyle = "#ffffff";
      context.fillRect(0, 0, canvas.width, canvas.height);
      context.drawImage(image, 0, 0);
      return canvas.toDataURL("image/jpeg", 0.92);
    } finally {
      URL.revokeObjectURL(objectUrl);
    }
  } catch (_) {
    return null;
  }
}

async function loadJsPdfLibrary() {
  if (window.jspdf?.jsPDF) return window.jspdf.jsPDF;
  if (jsPdfLoadPromise) return jsPdfLoadPromise;

  jsPdfLoadPromise = new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = "https://cdn.jsdelivr.net/npm/jspdf@2.5.1/dist/jspdf.umd.min.js";
    script.async = true;
    script.onload = () => {
      if (window.jspdf?.jsPDF) resolve(window.jspdf.jsPDF);
      else reject(new Error("jsPDF kon niet geladen worden"));
    };
    script.onerror = () => reject(new Error("jsPDF-script kon niet geladen worden"));
    document.head.appendChild(script);
  });

  return jsPdfLoadPromise;
}

async function loadHtml2CanvasLibrary() {
  if (window.html2canvas) return window.html2canvas;
  if (html2CanvasLoadPromise) return html2CanvasLoadPromise;

  html2CanvasLoadPromise = new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = "https://cdn.jsdelivr.net/npm/html2canvas@1.4.1/dist/html2canvas.min.js";
    script.async = true;
    script.onload = () => {
      if (window.html2canvas) resolve(window.html2canvas);
      else reject(new Error("html2canvas kon niet geladen worden"));
    };
    script.onerror = () => reject(new Error("html2canvas-script kon niet geladen worden"));
    document.head.appendChild(script);
  });

  return html2CanvasLoadPromise;
}

function drawPdfRoundedCard(doc, x, y, w, h, fillHex, strokeHex) {
  const [fillR, fillG, fillB] = hexToRgb(fillHex);
  const [strokeR, strokeG, strokeB] = hexToRgb(strokeHex);
  doc.setFillColor(fillR, fillG, fillB);
  doc.setDrawColor(strokeR, strokeG, strokeB);
  doc.roundedRect(x, y, w, h, 5, 5, "FD");
}

function buildBusPdfHtml(bus, vehicleId, themeKey = "geel") {
  const vehicleNumber = escapeHtml(bus.Voertuignummer || vehicleId || "");
  const busType = escapeHtml(bus.Type || getLabel("unknownType", "Onbekend type"));
  const plate = escapeHtml(getVehicleField(bus, "Nummerplaat") || "-");
  const owner = escapeHtml(getVehicleField(bus, "Eigenaar") || "-");
  const hansea = getVehicleField(bus, "Hansea nummer");
  const intern = getVehicleField(bus, "Intern nummer");
  const inDienst = escapeHtml(formatBusFieldValueForDisplay(bus, "Datum in dienst", getVehicleField(bus, "Datum in dienst")) || getLabel("notInServiceYet", "Bus nog niet in dienst"));
  const uitDienst = escapeHtml(formatBusFieldValueForDisplay(bus, "Uit dienst", getVehicleField(bus, "Uit dienst")) || t("notOutOfService"));
  const exportDate = escapeHtml(new Date().toLocaleDateString(localeForLanguage(settings.language), { day: "numeric", month: "long", year: "numeric" }));
  const logoHtml = `<img class="logo" src="media/logo.png" alt="Busbibliotheek 95 logo">`;

  const extraParts = [];
  if (hansea && hansea !== "/") {
    extraParts.push(`<span><span class="label">${escapeHtml(getLabel("pdfHansea", "Hansea"))}</span> <span class="hansea">${escapeHtml(hansea)}</span></span>`);
  }
  if (intern && intern !== "/") {
    extraParts.push(`<span><span class="label">${escapeHtml(getLabel("pdfInternal", "Intern"))}</span> ${escapeHtml(intern)}</span>`);
  }
  const extraHtml = extraParts.length ? `<div class="meta-right">${extraParts.join('<span class="sep">|</span>')}</div>` : "";

  return `
    <div class="pdf-render-root" data-pdf-theme="${escapeHtml(themeKey)}">
      <section class="page">
        <div class="page-inner">
          <div class="header hero">
            <div class="hero-band">
              <div class="hero-copy">
                <div class="eyebrow">Busbibliotheek 95</div>
                <h1>${vehicleNumber}</h1>
                <div class="sub">${busType}</div>
              </div>
              ${logoHtml}
            </div>
            <div class="meta-strip">
              <span class="meta-label">${escapeHtml(getLabel("pdfExportDate", "Exportdatum"))}</span>
              <span class="meta-value">${exportDate}</span>
            </div>
          </div>
          <div class="kaarten">
            <div class="buskaart">
              <div class="regel-boven">
                <div class="main">
                  <span class="nummer">${vehicleNumber}</span>
                  <span class="type">${busType}</span>
                  <span class="plaat">${plate}</span>
                </div>
                ${extraHtml}
              </div>
              <div class="eigenaar-lijn"><span class="label">${escapeHtml(getLabel("pdfOwner", "Eigenaar"))}</span> ${owner}</div>
              <div class="regel-onder">
                <span><span class="label">${escapeHtml(getLabel("pdfInService", "In dienst"))}</span> ${inDienst}</span>
                <span class="sep">|</span>
                <span><span class="label">${escapeHtml(getLabel("pdfOutOfService", "Uit dienst"))}</span> ${uitDienst}</span>
              </div>
            </div>
            ${getBusPdfRows(bus).map((row) => `
              <div class="buskaart">
                <div class="regel-boven">
                  <div class="main">
                    <span class="nummer">${escapeHtml(row.label)}</span>
                    <span class="type">${row.isHansea ? `<span class="hansea">${escapeHtml(row.value)}</span>` : escapeHtml(row.value)}</span>
                  </div>
                </div>
              </div>
            `).join("")}
          </div>
          <div class="page-footer">
            <span>Busbibliotheek 95</span>
            <span>${escapeHtml(getLabel("pdfPageCount", "Pagina 1 / 1"))}</span>
          </div>
        </div>
      </section>
    </div>
  `;
}

async function renderHtmlToPdfDownload(htmlMarkup, fileName) {
  const jsPDF = await loadJsPdfLibrary();
  const html2canvas = await loadHtml2CanvasLibrary();

  const host = document.createElement("div");
  host.className = "pdf-render-host";
  host.innerHTML = htmlMarkup;
  document.body.appendChild(host);

  try {
    const pageEls = Array.from(host.querySelectorAll(".page"));
    const pdf = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
      compress: true
    });

    for (let index = 0; index < pageEls.length; index += 1) {
      if (index > 0) pdf.addPage();
      const canvas = await html2canvas(pageEls[index], {
        scale: 2,
        useCORS: true,
      });
      const imgData = canvas.toDataURL("image/jpeg", 0.94);
      pdf.addImage(imgData, "JPEG", 0, 0, 210, 297, undefined, "FAST");
    }

    pdf.save(fileName);
  } finally {
    host.remove();
  }
}

async function exportBusPdf(vehicleId, themeKey = "geel") {
  const bus = findBusById(vehicleId);
  if (!bus) return;
  const htmlMarkup = buildBusPdfHtml(bus, vehicleId, themeKey);
  const fileName = sanitizeFileName(`Bus ${vehicleId}`) + ".pdf";
  await renderHtmlToPdfDownload(htmlMarkup, fileName);
}

function updateVehiclePhotoTexts() {
  if (!photoCardTitleEl || !vehiclePhotoImgEl || !vehiclePhotoCaptionEl) return;
  photoCardTitleEl.textContent = translateTemplate("photoCard", "Voertuigfoto");
  renderActiveVehiclePhoto();
}

function formatPhotoMetaDate(rawValue) {
  if (!rawValue) return "";
  return formatDateForUi(rawValue, { day: "numeric", month: "long", year: "numeric" });
}

function getPhotoDescriptionsLookup() {
  if (!vehiclePhotoDescriptions || typeof vehiclePhotoDescriptions !== "object") return {};
  return vehiclePhotoDescriptions;
}

async function loadVehiclePhotoDescriptions() {
  if (vehiclePhotoDescriptions) return vehiclePhotoDescriptions;
  if (vehiclePhotoDescriptionsPromise) return vehiclePhotoDescriptionsPromise;

  vehiclePhotoDescriptionsPromise = fetch(`photo-descriptions.json?v=${APP_VERSION}`, { cache: "no-store" })
    .then((response) => {
      if (!response.ok) throw new Error(`photo-descriptions ${response.status}`);
      return response.json();
    })
    .then((data) => {
      vehiclePhotoDescriptions = data && typeof data === "object" ? data : {};
      return vehiclePhotoDescriptions;
    })
    .catch((error) => {
      console.warn("Fotobeschrijvingen laden mislukt", error);
      vehiclePhotoDescriptions = {};
      return vehiclePhotoDescriptions;
    })
    .finally(() => {
      vehiclePhotoDescriptionsPromise = null;
    });

  return vehiclePhotoDescriptionsPromise;
}

function normalizePhotoEntry(entry, fallbackVehicleId, index = 0) {
  if (!entry) return null;
  if (typeof entry === "string") {
    return {
      src: entry,
      caption: "",
      meta: "",
      alt: "",
      sortOrder: index
    };
  }
  if (typeof entry !== "object") return null;
  const rawSrc = (entry.file || entry.src || "").toString().trim();
  if (!rawSrc) return null;
  const src = /^[a-z]+:|^\//i.test(rawSrc) || rawSrc.startsWith("media/")
    ? rawSrc
    : `media/${rawSrc}`;
  const dateText = formatPhotoMetaDate(entry.date || entry.datum || "");
  const makerText = (entry.maker || entry.fotograaf || entry.author || "").toString().trim();
  const placeText = (entry.place || entry.plaats || entry.location || "").toString().trim();
  const creditText = (entry.credit || entry.credits || "").toString().trim();
  const descriptionText = (entry.description || entry.caption || entry.beschrijving || entry.title || "").toString().trim();
  const metaParts = [makerText, placeText, dateText, creditText].filter(Boolean);
  return {
    src,
    caption: descriptionText,
    meta: metaParts.join(" • "),
    alt: (entry.alt || "").toString().trim(),
    sortOrder: Number.isFinite(Number(entry.order)) ? Number(entry.order) : index
  };
}

function getConfiguredPhotoEntries(vehicleId) {
  const lookup = getPhotoDescriptionsLookup();
  const bus = findBusById(vehicleId);
  const aliases = new Set([
    normalize(vehicleId),
    normalize(bus?.Voertuignummer)
  ]);

  splitLegacyValues(getVehicleField(bus, oldVehicleNumbersFieldKey), true).forEach((alias) => aliases.add(normalize(alias)));

  const entries = [];
  aliases.forEach((alias) => {
    const directEntries = lookup[alias];
    if (Array.isArray(directEntries)) {
      directEntries.forEach((entry, index) => {
        const normalizedEntry = normalizePhotoEntry(entry, alias, index);
        if (normalizedEntry) entries.push(normalizedEntry);
      });
    }
  });

  return entries
    .filter(Boolean)
    .sort((left, right) => left.sortOrder - right.sortOrder);
}

function getFallbackPhotoEntries(vehicleId) {
  const bus = findBusById(vehicleId);
  const aliases = new Set([
    normalize(vehicleId),
    normalize(bus?.Voertuignummer)
  ]);
  splitLegacyValues(getVehicleField(bus, oldVehicleNumbersFieldKey), true).forEach((alias) => aliases.add(normalize(alias)));
  const extensions = ["jpeg", "jpg", "png", "webp"];
  const fallbackEntries = [];
  aliases.forEach((alias) => {
    if (!alias) return;
    extensions.forEach((extension) => {
      fallbackEntries.push({ src: `media/${encodeURIComponent(alias)}.${extension}`, caption: "", meta: "", alt: "", sortOrder: fallbackEntries.length });
    });
  });
  return fallbackEntries;
}

function probePhotoEntry(entry) {
  return new Promise((resolve) => {
    const probe = new Image();
    probe.decoding = "async";
    probe.loading = "eager";
    probe.onload = () => resolve(entry);
    probe.onerror = () => resolve(null);
    probe.src = entry.src;
  });
}

async function resolveVehiclePhotoEntries(vehicleId) {
  await loadVehiclePhotoDescriptions();
  const configuredEntries = getConfiguredPhotoEntries(vehicleId);
  const candidates = configuredEntries.length ? configuredEntries : getFallbackPhotoEntries(vehicleId);
  const resolvedEntries = [];
  for (const entry of candidates) {
    const resolved = await probePhotoEntry(entry);
    if (resolved) resolvedEntries.push(resolved);
  }
  return resolvedEntries;
}

function buildVehiclePhotoCopy(entry, vehicleId) {
  const altTemplate = translateTemplate("photoAlt", "Foto van voertuig {id}");
  const captionTemplate = translateTemplate("photoCaption", "Voertuig {id}");
  return {
    alt: entry?.alt || fillTemplate(altTemplate, vehicleId),
    caption: entry?.caption || fillTemplate(captionTemplate, vehicleId),
    meta: entry?.meta || ""
  };
}

function updateVehiclePhotoNavigation() {
  const hasMultiplePhotos = currentVehiclePhotoEntries.length > 1;
  if (vehiclePhotoPrevBtn) vehiclePhotoPrevBtn.hidden = !hasMultiplePhotos;
  if (vehiclePhotoNextBtn) vehiclePhotoNextBtn.hidden = !hasMultiplePhotos;
  if (vehiclePhotoCounterEl) {
    if (!hasMultiplePhotos) {
      vehiclePhotoCounterEl.hidden = true;
      vehiclePhotoCounterEl.textContent = "";
    } else {
      vehiclePhotoCounterEl.hidden = false;
      vehiclePhotoCounterEl.textContent = `${currentVehiclePhotoIndex + 1} / ${currentVehiclePhotoEntries.length}`;
    }
  }
}

function renderActiveVehiclePhoto() {
  if (!vehiclePhotoImgEl || !vehiclePhotoCaptionEl) return;
  if (!currentPhotoVehicleId || !currentVehiclePhotoEntries.length) {
    vehiclePhotoImgEl.alt = "";
    vehiclePhotoCaptionEl.textContent = "";
    if (vehiclePhotoMetaEl) {
      vehiclePhotoMetaEl.hidden = true;
      vehiclePhotoMetaEl.textContent = "";
    }
    updateVehiclePhotoNavigation();
    return;
  }

  const safeIndex = Math.min(Math.max(currentVehiclePhotoIndex, 0), currentVehiclePhotoEntries.length - 1);
  currentVehiclePhotoIndex = safeIndex;
  const activeEntry = currentVehiclePhotoEntries[safeIndex];
  const copy = buildVehiclePhotoCopy(activeEntry, currentPhotoVehicleId);
  vehiclePhotoImgEl.src = activeEntry.src;
  vehiclePhotoImgEl.alt = copy.alt;
  vehiclePhotoCaptionEl.textContent = copy.caption;
  if (vehiclePhotoMetaEl) {
    vehiclePhotoMetaEl.textContent = copy.meta;
    vehiclePhotoMetaEl.hidden = !copy.meta;
  }
  updateVehiclePhotoNavigation();
}

function setPageLoading(active) {
  if (!pageLoadingOverlayEl || !pageLoadingTextEl) return;
  pageLoadingTextEl.textContent = t("loading");
  pageLoadingOverlayEl.hidden = !active;
  pageLoadingOverlayEl.setAttribute("aria-hidden", String(!active));
  document.body.classList.toggle("page-loading", !!active);
}

function setOfflineOverlayVisible(visible) {
  if (!offlineOverlayEl) return;
  offlineOverlayEl.hidden = !visible;
  offlineOverlayEl.setAttribute("aria-hidden", String(!visible));
  document.body.classList.toggle("offline-active", !!visible);
}

async function hasVerifiedInternetConnection() {
  const controller = new AbortController();
  const timeoutHandle = setTimeout(() => controller.abort("timeout"), NETWORK_CHECK_TIMEOUT_MS);

  try {
    const response = await fetch(`${NETWORK_CHECK_URL}&ts=${Date.now()}`, {
      method: "GET",
      cache: "no-store",
      headers: {
        "Cache-Control": "no-store, no-cache, max-age=0",
        Pragma: "no-cache"
      },
      signal: controller.signal
    });
    return response.ok;
  } catch (_) {
    return false;
  } finally {
    clearTimeout(timeoutHandle);
  }
}

async function verifyInternetConnection(force = false) {
  const now = Date.now();
  if (!force && now - lastVerifiedInternetAt < NETWORK_CHECK_CACHE_MS) {
    setOfflineOverlayVisible(!lastVerifiedInternetState);
    return lastVerifiedInternetState;
  }
  const online = await hasVerifiedInternetConnection();
  lastVerifiedInternetAt = now;
  lastVerifiedInternetState = online;
  setOfflineOverlayVisible(!online);
  return online;
}

function startInternetChecks() {
  if (networkCheckHandle) clearInterval(networkCheckHandle);
  networkCheckHandle = window.setInterval(() => {
    if (!document.hidden) {
      verifyInternetConnection(true).catch(() => {});
    }
  }, NETWORK_CHECK_INTERVAL_MS);
}

function hideVehiclePhotoCard() {
  vehiclePhotoLookupToken += 1;
  currentPhotoVehicleId = "";
  currentVehiclePhotoEntries = [];
  currentVehiclePhotoIndex = 0;
  if (!vehiclePhotoCardEl || !vehiclePhotoImgEl || !vehiclePhotoCaptionEl) return;
  vehiclePhotoCardEl.hidden = true;
  vehiclePhotoCardEl.setAttribute("aria-hidden", "true");
  vehiclePhotoImgEl.onload = null;
  vehiclePhotoImgEl.onerror = null;
  vehiclePhotoImgEl.removeAttribute("src");
  vehiclePhotoImgEl.alt = "";
  vehiclePhotoCaptionEl.textContent = "";
  if (vehiclePhotoMetaEl) {
    vehiclePhotoMetaEl.hidden = true;
    vehiclePhotoMetaEl.textContent = "";
  }
  if (vehiclePhotoCounterEl) {
    vehiclePhotoCounterEl.hidden = true;
    vehiclePhotoCounterEl.textContent = "";
  }
}

async function updateVehiclePhotoCard(vehicleId) {
  if (!vehiclePhotoCardEl || !vehiclePhotoImgEl || !vehiclePhotoCaptionEl) return;
  const normalizedVehicleId = normalize(vehicleId);
  if (!normalizedVehicleId) {
    hideVehiclePhotoCard();
    return;
  }

  const lookupToken = ++vehiclePhotoLookupToken;
  currentPhotoVehicleId = "";
  currentVehiclePhotoEntries = [];
  currentVehiclePhotoIndex = 0;
  vehiclePhotoCardEl.hidden = true;
  vehiclePhotoCardEl.setAttribute("aria-hidden", "true");
  vehiclePhotoImgEl.removeAttribute("src");
  vehiclePhotoImgEl.alt = "";
  vehiclePhotoCaptionEl.textContent = "";
  vehiclePhotoImgEl.onload = null;
  vehiclePhotoImgEl.onerror = null;

  if (vehiclePhotoMetaEl) {
    vehiclePhotoMetaEl.hidden = true;
    vehiclePhotoMetaEl.textContent = "";
  }
  if (vehiclePhotoCounterEl) {
    vehiclePhotoCounterEl.hidden = true;
    vehiclePhotoCounterEl.textContent = "";
  }

  const photoEntries = await resolveVehiclePhotoEntries(normalizedVehicleId);
  if (lookupToken !== vehiclePhotoLookupToken) return;
  if (!photoEntries.length) {
    hideVehiclePhotoCard();
    return;
  }

  currentPhotoVehicleId = normalizedVehicleId;
  currentVehiclePhotoEntries = photoEntries;
  currentVehiclePhotoIndex = 0;
  renderActiveVehiclePhoto();
  vehiclePhotoCardEl.hidden = false;
  vehiclePhotoCardEl.setAttribute("aria-hidden", "false");
}

function parseFlexibleDateParts(rawValue) {
  const value = (rawValue || "").toString().trim().replace(/^"|"$/g, "");
  if (!value || value === "/") return null;

  const toValidParts = (year, month, day) => {
    if (month < 1 || month > 12 || day < 1 || day > 31) return null;
    const check = new Date(Date.UTC(year, month - 1, day));
    if (
      check.getUTCFullYear() !== year ||
      check.getUTCMonth() !== month - 1 ||
      check.getUTCDate() !== day
    ) return null;
    return { year, month, day };
  };

  let match = value.match(/^(\d{4})(\d{2})(\d{2})$/);
  if (match) return toValidParts(Number(match[1]), Number(match[2]), Number(match[3]));

  match = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (match) return toValidParts(Number(match[1]), Number(match[2]), Number(match[3]));

  match = value.match(/^(\d{1,2})[\/.-](\d{1,2})[\/.-](\d{4})$/);
  if (match) return toValidParts(Number(match[3]), Number(match[2]), Number(match[1]));

  return null;
}

function formatDateForUi(rawValue, options, language = settings.language) {
  const parts = parseFlexibleDateParts(rawValue);
  if (parts) {
    const utcDate = new Date(Date.UTC(parts.year, parts.month - 1, parts.day));
    if (!Number.isNaN(utcDate.getTime())) {
      return new Intl.DateTimeFormat(localeForLanguage(language), { ...options, timeZone: "UTC" }).format(utcDate);
    }
  }

  const parsed = new Date(rawValue);
  if (!Number.isNaN(parsed.getTime())) {
    return new Intl.DateTimeFormat(localeForLanguage(language), options).format(parsed);
  }

  return rawValue;
}

function formatDelayMessage(delayMinutes) {
  const lex =
    delayLexicon[settings.language] ||
    delayLexicon[FALLBACK_LANG] ||
    delayLexicon[DEFAULT_LANG] ||
    { minute: "min", early: "early", late: "delay", onTime: "On time" };
  if (delayMinutes < 0) return `${Math.abs(delayMinutes)} ${lex.minute} ${lex.early}`;
  if (delayMinutes > 0) return `${delayMinutes} ${lex.minute} ${lex.late}`;
  return lex.onTime;
}

function isIosInstallable() {
  const ua = window.navigator.userAgent;
  const isIos = /iPhone|iPad|iPod/.test(ua);
  const isStandalone = window.matchMedia("(display-mode: standalone)").matches || window.navigator.standalone;
  return isIos && !isStandalone;
}

function loadSettings() {
  try {
    if (!window.localStorage) return;
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return;
    const parsed = JSON.parse(raw);
    settings = { ...settings, ...parsed };
    settings.theme = settings.theme === "light" || settings.theme === "dark" || settings.theme === "auto" ? settings.theme : "auto";
    settings.colorTheme = normalizeColorTheme(settings.colorTheme);
    window.settings = settings;
  } catch (e) {
    console.warn("Settings laden mislukt", e);
  }
}

function saveSettings() {
  try {
    if (!window.localStorage) return;
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    window.settings = settings;
  } catch (e) {
    console.warn("Settings opslaan mislukt", e);
  }
}

function applyTheme(theme) {
  const root = document.documentElement;
  if (theme === "auto") root.removeAttribute("data-theme");
  else root.setAttribute("data-theme", theme);
  updateSystemUiThemeColor();
}

function getResolvedThemeMode() {
  if (settings.theme === "dark") return "dark";
  if (settings.theme === "light") return "light";
  return prefersDarkScheme.matches ? "dark" : "light";
}

function normalizeColorTheme(colorTheme) {
  const value = (colorTheme || "").toString().toLowerCase();
  return ALLOWED_COLOR_THEMES.includes(value) ? value : "classic";
}

function applyColorTheme(colorTheme) {
  const root = document.documentElement;
  const normalized = normalizeColorTheme(colorTheme);
  root.setAttribute("data-color-theme", normalized);
  updateSystemUiThemeColor();
}

function updateSystemUiThemeColor() {
  const css = getComputedStyle(document.documentElement);
  const resolvedTheme = getResolvedThemeMode();
  const nextThemeColor =
    css.getPropertyValue("--bg-gradient-top").trim() ||
    css.getPropertyValue("--bg").trim() ||
    "#f4f7fb";
  themeColorMetaEls.forEach((metaEl) => {
    metaEl.setAttribute("content", nextThemeColor);
  });
  if (colorSchemeMetaEl) colorSchemeMetaEl.setAttribute("content", resolvedTheme);
}

window.updateSystemUiThemeColor = updateSystemUiThemeColor;
prefersDarkScheme.addEventListener?.("change", () => {
  if (settings.theme === "auto") updateSystemUiThemeColor();
});

function applyTranslations() {
  document.documentElement.lang = settings.language || DEFAULT_LANG;
  updateDocumentTitle();
  if (metaDescriptionEl) metaDescriptionEl.setAttribute("content", getLabel("metaDescription", "Busbibliotheek voor bussen van De Lijn: zoek een voertuig en volg het live."));
  splash?.setAttribute("aria-label", getLabel("splashAria", "Busbibliotheek laden"));
  appTitleEl.textContent = getLabel("appTitle", "Busbibliotheek");
  appSubtitleEl.textContent = t("subtitle");
  appContextLineEl.textContent = t("appContextLine");
  if (splashCreditEl) splashCreditEl.textContent = getLabel("madeBy", "Made by Busspotter 95");
  installBtn.textContent = t("install");
  const moreLabel = getLabel("more", "Meer");
  const menuLabel = getLabel("menu", "Menu");
  favoritesToggleBtn.title = menuLabel;
  favoritesToggleBtn.setAttribute("aria-label", menuLabel);
  if (menuToggleTextEl) menuToggleTextEl.textContent = menuLabel;
  if (morePanelTitleEl) morePanelTitleEl.textContent = moreLabel;
  if (morePanelSubtitleEl) morePanelSubtitleEl.textContent = getLabel("moreSubtitle", "Snelle functies en extra tools.");
  if (moreFunctionsTitleEl) moreFunctionsTitleEl.textContent = getLabel("functions", "Functies");
  settingsToggleBtn.title = t("settings");
  settingsToggleBtn.setAttribute("aria-label", t("settings"));
  settingsToggleBtn.textContent = t("settings");
  iosInstallHintEl.textContent = t("iosHint");
  searchBtn.title = t("search");
  searchBtn.setAttribute("aria-label", t("search"));
  voertuigInput.placeholder = t("vehiclePlaceholder");
  favoritesTitleEl.textContent = t("favorites");
  settingsTitleEl.textContent = t("settings");
  if (settingsInfoBtn) settingsInfoBtn.textContent = getLabel("infoTitle", "Info");
  intervalLabelEl.textContent = t("interval");
  themeLabelEl.textContent = t("theme");
  colorThemeLabelEl.textContent = t("colorTheme");
  languageLabelEl.textContent = t("language");
  intervalOpt10El.textContent = `10 ${t("intervalSeconds")}`;
  intervalOpt15El.textContent = `15 ${t("intervalSeconds")}`;
  intervalOpt30El.textContent = `30 ${t("intervalSeconds")}`;
  themeAutoOptEl.textContent = t("themeAuto");
  themeLightOptEl.textContent = t("themeLight");
  themeDarkOptEl.textContent = t("themeDark");
  colorClassicOptEl.textContent = t("colorClassic");
  colorYellowOptEl.textContent = t("colorYellow");
  colorGreenOptEl.textContent = t("colorGreen");
  colorBlueOptEl.textContent = t("colorBlue");
  colorOrangeOptEl.textContent = getLabel("colorOrange", "Oranje");
  colorRedOptEl.textContent = t("colorRed");
  colorPurpleOptEl.textContent = t("colorPurple");
  if (dashboardTitleEl) dashboardTitleEl.textContent = getLabel("dashboard", "Stalk modus");
  dashboardToggleBtn.textContent = getLabel("dashboard", "Stalk modus");
  dashboardToggleBtn.title = getLabel("dashboardButtonTitle", "Stalk modus");
  if (dashboardEditBtn) dashboardEditBtn.textContent = getLabel("dashboardEdit", "Aanpassen");
  if (dashboardCloseBtn) dashboardCloseBtn.setAttribute("aria-label", getLabel("dashboardClose", "Stalk modus sluiten"));
  if (dashboardMapEl) dashboardMapEl.setAttribute("aria-label", getLabel("dashboardMapAria", "Kaart met live voertuigen"));
  staticCardTitleEl.textContent = t("staticCard");
  realtimeCardTitleEl.textContent = t("realtimeCard");
  if (compareCardTitleEl) compareCardTitleEl.textContent = getLabel("compareTitle", "Vergelijking");
  if (compareCardSummaryEl && compareCardEl?.hidden) compareCardSummaryEl.textContent = getLabel("compareSummary", "Vergelijk twee voertuigen naast elkaar.");
  if (compareClearBtn) compareClearBtn.setAttribute("aria-label", getLabel("compareClose", "Vergelijking sluiten"));
  if (haltModuleTitleEl) haltModuleTitleEl.textContent = getLabel("haltSearch", "Halte zoeken");
  if (haltModuleDescriptionEl) haltModuleDescriptionEl.textContent = getLabel("haltSearchDescription", "Voer een haltecode of haltenaam in om een halte van De Lijn te zoeken.");
  if (haltecodeInputEl) haltecodeInputEl.placeholder = getLabel("haltCodePlaceholder", "Haltecode of naam");
  if (haltecodeSearchBtn) haltecodeSearchBtn.textContent = getLabel("haltSearchOpen", "Zoek halte");
  if (haltSearchResultsTitleEl) haltSearchResultsTitleEl.textContent = getLabel("haltSearchResultsTitle", "Gevonden haltes");
  if (lastCodesTitleEl) lastCodesTitleEl.textContent = getLabel("haltSearchRecent", "Laatste haltecodes");
  if (!haltecodeErrorEl?.hidden) {
    haltecodeErrorEl.textContent = getLabel("haltSearchInvalid", "Voer een haltecode of haltenaam in.");
  }
  if (vehiclePhotoPrevBtn) vehiclePhotoPrevBtn.setAttribute("aria-label", getLabel("photoPrevious", "Vorige foto"));
  if (vehiclePhotoNextBtn) vehiclePhotoNextBtn.setAttribute("aria-label", getLabel("photoNext", "Volgende foto"));
  updateVehiclePhotoTexts();
  disclaimerTitleEl.textContent = t("disclaimerTitle");
  disclaimerTextEl.textContent = t("disclaimerText");
  closeBtnEl.title = getLabel("back", "Terug");
  closeBtnEl.setAttribute("aria-label", getLabel("back", "Terug"));
  if (closeBtnTextEl) closeBtnTextEl.textContent = getLabel("back", "Terug");
  settingsCloseBtn.setAttribute("title", getLabel("settingsClose", "Sluit instellingen"));
  settingsCloseBtn.setAttribute("aria-label", getLabel("settingsClose", "Sluit instellingen"));
  if (offlinePillEl) offlinePillEl.textContent = getLabel("offlinePill", "Offline");
  if (offlineTitleEl) offlineTitleEl.textContent = getLabel("offlineTitle", "Geen internetverbinding");
  if (offlineTextPrimaryEl) offlineTextPrimaryEl.textContent = getLabel("offlineTextPrimary", "Busbibliotheek kon geen werkende internetverbinding bevestigen.");
  if (offlineTextSecondaryEl) offlineTextSecondaryEl.textContent = getLabel("offlineTextSecondary", "Realtimegegevens en live-opzoekingen zijn tijdelijk niet beschikbaar.");
  if (offlineRetryBtn) offlineRetryBtn.textContent = getLabel("offlineRetry", "Opnieuw proberen");
  if (funnyModalTitleEl) funnyModalTitleEl.textContent = getLabel("funnyTitle", "Buswijsheid");
  if (funnyModalBodyEl) funnyModalBodyEl.textContent = getLabel("funnyBody", "De beste bussen komen van Mercedes-Benz.");
  if (funnyModalCloseBtn) funnyModalCloseBtn.textContent = getLabel("funnyClose", "Haha, oke");
  if (pdfModalTitleEl) pdfModalTitleEl.textContent = getLabel("pdfTitle", "PDF downloaden");
  if (pdfThemeFieldLabelEl) pdfThemeFieldLabelEl.textContent = t("colorTheme");
  if (pdfModalNoteEl) pdfModalNoteEl.textContent = getLabel("pdfNote", "Na bevestigen wordt de PDF rechtstreeks als bestand gedownload.");
  pdfModalCloseBtn.setAttribute("aria-label", getLabel("close", "Sluiten"));
  pdfModalCancelBtn.textContent = getLabel("cancel", "Annuleren");
  pdfModalConfirmBtn.textContent = getLabel("pdfConfirm", "PDF downloaden");
  if (compareModalTitleEl) compareModalTitleEl.textContent = getLabel("compareModalTitle", "Voertuig vergelijken");
  if (compareModalSummaryEl) compareModalSummaryEl.textContent = getLabel("compareModalSummary", "Kies een tweede voertuig om naast de huidige bus te zetten.");
  if (compareFieldLabelEl) compareFieldLabelEl.textContent = getLabel("compareFieldLabel", "Voertuignummer of nummerplaat");
  if (compareVehicleInputEl) compareVehicleInputEl.placeholder = getLabel("compareFieldPlaceholder", "Bijvoorbeeld 5292");
  if (compareModalNoteEl) compareModalNoteEl.textContent = getLabel("compareModalNote", "De vergelijking toont vaste voertuiggegevens van beide bussen.");
  compareModalCloseBtn.setAttribute("aria-label", getLabel("close", "Sluiten"));
  compareModalCancelBtn.textContent = getLabel("cancel", "Annuleren");
  compareModalConfirmBtn.textContent = getLabel("compareConfirm", "Vergelijken");
  if (dashboardSetupTitleEl) dashboardSetupTitleEl.textContent = getLabel("dashboardSetupTitle", "Stalk modus instellen");
  if (dashboardSetupSummaryEl) dashboardSetupSummaryEl.textContent = getLabel("dashboardSetupSummary", "Vul tot negen voertuigen in. Alleen bussen met realtime verschijnen live.");
  dashboardSetupCloseBtn.setAttribute("aria-label", getLabel("close", "Sluiten"));
  dashboardSetupCancelBtn.textContent = getLabel("cancel", "Annuleren");
  dashboardSetupConfirmBtn.textContent = getLabel("dashboardSetupConfirm", "Stalk modus openen");
  if (infoModalTitleEl) infoModalTitleEl.textContent = getLabel("infoTitle", "Site-info");
  if (infoModalSummaryEl) infoModalSummaryEl.textContent = getLabel("infoSummary", "Versie en laatste updates van de databronnen.");
  infoModalCloseBtn.setAttribute("aria-label", getLabel("close", "Sluiten"));
  infoModalOkBtn.textContent = getLabel("close", "Sluiten");
  if (pageLoadingTextEl) pageLoadingTextEl.textContent = t("loading");
  lastUpdateEl.textContent = `${t("lastUpdate")}: -`;
  lastUpdateEl.hidden = true;
  if (dashboardSummaryEl && dashboardPanelEl?.hidden) {
    dashboardSummaryEl.textContent = getLabel("dashboardSummary", "Volg negen voertuigen tegelijk.");
  }
  if (!currentVehicleId) {
    realtimeEl.innerHTML = t("noData");
    vasteDataEl.innerHTML = t("noneSelected");
  }
  updateFeedStatusText();
  updateFavoriteButtonState();
  if (compareVehicleId) renderComparison();
  if (!dashboardSetupModalEl?.hidden) renderDashboardSetupInputs();
  if (!dashboardPanelEl?.hidden && dashboardVehicleIds.length) {
    void refreshDashboardPanel();
  }
  if (!infoModalEl?.hidden) showInfoModal();
  if (realtimePausedByInactivity && currentVehicleId) {
    realtimeEl.textContent = t("idlePaused");
  }
  if (currentVehicleId) {
    toonVasteData(currentVehicleId);
    if (!realtimePausedByInactivity) {
      void updateRealtime(currentVehicleId);
    }
  }
}

function loadLastHaltes() {
  try {
    const raw = localStorage.getItem(LAST_HALTES_KEY);
    const parsed = JSON.parse(raw || "[]");
    return Array.isArray(parsed) ? parsed.filter((code) => /^\d+$/.test(String(code))) : [];
  } catch (_) {
    return [];
  }
}

function saveLastHaltes(codes) {
  try {
    localStorage.setItem(LAST_HALTES_KEY, JSON.stringify(codes));
  } catch (_) {
    // Local storage is optional here.
  }
}

function renderLastHaltes() {
  if (!lastCodesContainerEl || !lastCodesListEl) return;
  const lastHaltes = loadLastHaltes();
  lastCodesListEl.innerHTML = "";
  lastCodesContainerEl.hidden = lastHaltes.length === 0;
  if (!lastHaltes.length) return;

  lastHaltes.forEach((code) => {
    const chip = document.createElement("button");
    chip.type = "button";
    chip.className = "chip";
    chip.textContent = code;
    chip.addEventListener("click", () => {
      if (haltecodeInputEl) haltecodeInputEl.value = code;
      openHalteRealtime(code);
    });
    lastCodesListEl.appendChild(chip);
  });
}

function setHalteStatus(message = "") {
  if (!haltecodeErrorEl) return;
  haltecodeErrorEl.hidden = !message;
  haltecodeErrorEl.textContent = message;
}

function clearHalteSearchResults() {
  if (!haltSearchResultsContainerEl || !haltSearchResultsListEl) return;
  haltSearchResultsListEl.innerHTML = "";
  haltSearchResultsContainerEl.hidden = true;
}

function getGroupedHalteBaseName(rawName = "") {
  const value = cleanText(rawName);
  if (!value) return "";
  return value
    .replace(/\s*[-,]?\s*perron\s+[a-z0-9]+$/i, "")
    .replace(/\s+/g, " ")
    .trim();
}

function getHalteRealtimeLink(codes = []) {
  const normalizedCodes = [...new Set(
    (Array.isArray(codes) ? codes : [codes])
      .map((code) => String(code || "").trim())
      .filter((code) => HALTE_CODE_REGEX.test(code))
  )];
  if (!normalizedCodes.length) return "";
  return `https://www.delijn.be/realtime/${normalizedCodes.join("+")}/20`;
}

function renderHalteSearchResults(haltes = []) {
  if (!haltSearchResultsContainerEl || !haltSearchResultsListEl) return;
  haltSearchResultsListEl.innerHTML = "";
  haltSearchResultsContainerEl.hidden = haltes.length === 0;
  if (!haltes.length) return;

  haltes.forEach((halte) => {
    const halteCodes = Array.isArray(halte?.haltenummers)
      ? halte.haltenummers
      : [String(halte?.haltenummer || "").trim()];
    const validCodes = halteCodes.filter((code) => HALTE_CODE_REGEX.test(code));
    if (!validCodes.length) return;

    const primaryCode = validCodes[0];
    const omschrijving = String(halte?.omschrijvingLang || halte?.omschrijving || primaryCode).trim();
    const gemeente = String(halte?.omschrijvingGemeente || "").trim();
    const chip = document.createElement("button");
    chip.type = "button";
    chip.className = "chip";
    chip.innerHTML = `
      <span class="chip-title">${escapeHtml(omschrijving)}</span>
      <span class="chip-subtitle">${escapeHtml(gemeente ? `${gemeente} · ${validCodes.join(" + ")}` : validCodes.join(" + "))}</span>
    `;
    chip.addEventListener("click", () => {
      if (haltecodeInputEl) haltecodeInputEl.value = omschrijving;
      openHalteRealtime(validCodes);
    });
    haltSearchResultsListEl.appendChild(chip);
  });

  haltSearchResultsContainerEl.hidden = haltSearchResultsListEl.childElementCount === 0;
}

function scoreLocalHalteMatch(stop, normalizedQuery) {
  const stopCode = cleanText(stop?.stop_code || stop?.stop_id);
  const stopName = cleanText(stop?.stop_name);
  const stopDesc = cleanText(stop?.stop_desc);
  const normalizedCode = normalizeSearchText(stopCode);
  const normalizedName = normalizeSearchText(stopName);
  const normalizedDesc = normalizeSearchText(stopDesc);
  const combined = `${normalizedName} ${normalizedDesc}`.trim();

  if (!normalizedCode && !normalizedName && !normalizedDesc) return Number.POSITIVE_INFINITY;
  if (normalizedCode === normalizedQuery) return 0;
  if (normalizedName === normalizedQuery) return 1;
  if (combined === normalizedQuery) return 2;
  if (normalizedCode.startsWith(normalizedQuery)) return 3;
  if (normalizedName.startsWith(normalizedQuery)) return 4;
  if (combined.startsWith(normalizedQuery)) return 5;
  if (normalizedCode.includes(normalizedQuery)) return 6;
  if (normalizedName.includes(normalizedQuery)) return 7;
  if (combined.includes(normalizedQuery)) return 8;
  return Number.POSITIVE_INFINITY;
}

async function searchHaltesLocal(zoekTerm) {
  await laadStops();
  const normalizedQuery = normalizeSearchText(zoekTerm);
  if (!normalizedQuery) return [];

  const groupedMatches = new Map();

  stops
    .map((stop) => {
      const stopCode = cleanText(stop?.stop_code || stop?.stop_id);
      return {
        stop,
        stopCode,
        score: scoreLocalHalteMatch(stop, normalizedQuery)
      };
    })
    .filter(({ stopCode, score }) => HALTE_CODE_REGEX.test(stopCode) && Number.isFinite(score))
    .sort((a, b) => {
      if (a.score !== b.score) return a.score - b.score;
      return cleanText(a.stop?.stop_name).localeCompare(cleanText(b.stop?.stop_name), "nl");
    })
    .forEach(({ stop, stopCode, score }) => {
      const stopName = cleanText(stop?.stop_name) || stopCode;
      const groupName = getGroupedHalteBaseName(stopName) || stopName;
      const municipality = cleanText(stop?.stop_desc);
      const groupKey = `${normalizeSearchText(groupName)}|${normalizeSearchText(municipality)}`;

      if (!groupedMatches.has(groupKey)) {
        groupedMatches.set(groupKey, {
          haltenummers: [],
          omschrijving: groupName,
          omschrijvingLang: groupName,
          omschrijvingGemeente: municipality,
          score
        });
      }

      const group = groupedMatches.get(groupKey);
      if (!group.haltenummers.includes(stopCode)) {
        group.haltenummers.push(stopCode);
      }
      if (score < group.score) {
        group.score = score;
      }
    });

  return Array.from(groupedMatches.values())
    .sort((a, b) => {
      if (a.score !== b.score) return a.score - b.score;
      return a.omschrijving.localeCompare(b.omschrijving, "nl");
    })
    .slice(0, HALTE_SEARCH_LIMIT);
}

function openHalteRealtime(codeOverride = "") {
  const haltecodes = Array.isArray(codeOverride)
    ? codeOverride
    : [(codeOverride || haltecodeInputEl?.value || "").trim()];
  const validCodes = [...new Set(haltecodes.filter((code) => HALTE_CODE_REGEX.test(code)))];
  if (!validCodes.length) {
    setHalteStatus(getLabel("haltSearchInvalid", "Voer een haltecode of haltenaam in."));
    clearHalteSearchResults();
    if (navigator.vibrate) navigator.vibrate(160);
    return false;
  }

  halteSearchRequestToken += 1;
  setHalteStatus("");
  clearHalteSearchResults();
  const primaryCode = validCodes[0];
  const lastHaltes = loadLastHaltes().filter((code) => code !== primaryCode);
  lastHaltes.unshift(primaryCode);
  saveLastHaltes(lastHaltes.slice(0, 5));
  renderLastHaltes();
  window.open(getHalteRealtimeLink(validCodes), "_blank", "noopener,noreferrer");
  return true;
}

async function searchHaltes() {
  const zoekTerm = (haltecodeInputEl?.value || "").trim();
  if (!zoekTerm) {
    setHalteStatus(getLabel("haltSearchInvalid", "Voer een haltecode of haltenaam in."));
    clearHalteSearchResults();
    if (navigator.vibrate) navigator.vibrate(160);
    return;
  }

  if (HALTE_CODE_REGEX.test(zoekTerm)) {
    openHalteRealtime(zoekTerm);
    return;
  }

  const requestToken = ++halteSearchRequestToken;
  setHalteStatus(getLabel("haltSearchLoading", "Haltes worden gezocht..."));
  clearHalteSearchResults();

  try {
    const haltes = await searchHaltesLocal(zoekTerm);
    if (requestToken !== halteSearchRequestToken) return;
    renderHalteSearchResults(haltes);
    if (!haltes.length) {
      setHalteStatus(getLabel("haltSearchNoResults", "Geen haltes gevonden."));
      if (navigator.vibrate) navigator.vibrate(120);
      return;
    }

    setHalteStatus("");
  } catch (error) {
    if (requestToken !== halteSearchRequestToken) return;
    console.error("Haltezoekopdracht mislukt", error);
    clearHalteSearchResults();
    setHalteStatus(getLabel("haltSearchFailed", "Haltes konden niet worden opgehaald."));
    if (navigator.vibrate) navigator.vibrate(160);
  }
}

function updateFeedStatusText() {
  if (!feedStatusEl) return;
  if (!feedEndDateValue) {
    feedStatusEl.hidden = true;
    feedStatusEl.textContent = "";
    return;
  }

  const formattedDate = formatDateForUi(feedEndDateValue, {
    day: "numeric",
    month: "long",
    year: "numeric"
  });

  const templateRaw = t("feedCurrentUntil");
  const template = templateRaw === "feedCurrentUntil" ? "Data actueel tot {date}." : templateRaw;
  feedStatusEl.textContent = template.includes("{date}")
    ? template.replace("{date}", formattedDate)
    : `${template} ${formattedDate}`;
  feedStatusEl.hidden = false;
}

async function loadFeedStatus() {
  try {
    const res = await fetchWithTimeout(`${BASE_URL}/feed_info.txt`, { cache: "no-store" });
    const text = await res.text();
    const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
    if (lines.length < 2) throw new Error("feed_info bevat te weinig regels");

    const headers = parseCSVLine(lines[0]);
    const values = parseCSVLine(lines[1]);
    const index = headers.indexOf("feed_end_date");
    if (index < 0) throw new Error("feed_end_date niet gevonden");

    feedEndDateValue = (values[index] || "").trim();
    dataLoadTimestamps.feedInfo = Date.now();
  } catch (e) {
    console.warn("feed_info laden mislukt", e);
    feedEndDateValue = "";
  }

  updateFeedStatusText();
}

function setSettingsPanel(open) {
  if (open) setFavoritesPanel(false);
  settingsOpen = !!open;
  document.body.classList.toggle("settings-open", settingsOpen);
  settingsPanelEl.hidden = !settingsOpen;
  settingsPanelEl.setAttribute("aria-hidden", String(!settingsOpen));
  if ("inert" in settingsPanelEl) settingsPanelEl.inert = !settingsOpen;
  settingsToggleBtn.setAttribute("aria-expanded", String(settingsOpen));
  settingsToggleBtn.classList.toggle("active", settingsOpen);
}

function setFavoritesPanel(open) {
  const shouldOpen = !!open;
  if (shouldOpen && settingsOpen) setSettingsPanel(false);
  favoritesPanelOpen = shouldOpen;
  favoritesPanelEl.hidden = !favoritesPanelOpen;
  favoritesPanelEl.setAttribute("aria-hidden", String(!favoritesPanelOpen));
  if ("inert" in favoritesPanelEl) favoritesPanelEl.inert = !favoritesPanelOpen;
  favoritesToggleBtn.setAttribute("aria-expanded", String(favoritesPanelOpen));
  favoritesToggleBtn.classList.toggle("active", favoritesPanelOpen);
  document.body.classList.toggle("more-open", favoritesPanelOpen);
}

function showFunnyModal() {
  if (!funnyModalEl) return;
  funnyModalEl.hidden = false;
  document.body.classList.add("funny-open");
}

function hideFunnyModal() {
  if (!funnyModalEl) return;
  funnyModalEl.hidden = true;
  document.body.classList.remove("funny-open");
}

function triggerDirectDownload(url, fileName) {
  const downloadLink = document.createElement("a");
  downloadLink.href = url;
  downloadLink.download = fileName;
  downloadLink.rel = "noopener";
  downloadLink.style.display = "none";
  document.body.appendChild(downloadLink);
  downloadLink.click();
  downloadLink.remove();
}

function startPythonDownload() {
  triggerDirectDownload(PYTHON_MAIN_DOWNLOAD_URL, "script.py");
  window.alert(getLabel("pythonDownloadStarted", "De download van script.py is gestart."));
}

function startApkDownload() {
  triggerDirectDownload(APK_DOWNLOAD_URL, "Busbibliotheek.apk");
  window.alert(getLabel("apkDownloadStarted", "De download van Busbibliotheek.apk is gestart."));
}

function loadFavorites() {
  try {
    if (!window.localStorage) {
      favorites = [];
      return;
    }
    favorites = JSON.parse(localStorage.getItem(FAVORITES_KEY) || "[]");
    if (!Array.isArray(favorites)) favorites = [];
  } catch (e) {
    console.warn("Favorites laden mislukt", e);
    favorites = [];
  }
}

function saveFavorites() {
  try {
    if (!window.localStorage) return;
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites));
  } catch (e) {
    console.warn("Favorites opslaan mislukt", e);
  }
}

function renderFavorites() {
  favoritesListEl.innerHTML = "";
  if (!favorites.length) {
    const empty = document.createElement("div");
    empty.className = "favorites-empty-state";
    empty.textContent = t("noFavoritesYet");
    favoritesListEl.appendChild(empty);
    return;
  }
  favorites.forEach((id) => {
    const bus = findBusById(id);
    const vehicleType = normalize(bus?.Type);
    const item = document.createElement("div");
    item.className = "favorite-item";
    item.dataset.id = id;
    item.innerHTML = `
      <button class="chip favorite-chip" type="button">
        <span class="chip-title">${escapeHtml(id)}</span>
        ${vehicleType ? `<span class="chip-subtitle">${escapeHtml(vehicleType)}</span>` : ""}
      </button>
      <div class="favorite-item-actions">
        <button class="favorite-action-btn" type="button" data-action="up" aria-label="${escapeHtml(getLabel("favoriteMoveUp", "Favoriet omhoog"))}">&#8593;</button>
        <button class="favorite-action-btn" type="button" data-action="down" aria-label="${escapeHtml(getLabel("favoriteMoveDown", "Favoriet omlaag"))}">&#8595;</button>
        <button class="favorite-action-btn favorite-action-btn--danger" type="button" data-action="remove" aria-label="${escapeHtml(t("favoriteRemove"))}">&times;</button>
      </div>
    `;
    item.querySelector(".favorite-chip")?.addEventListener("click", () => {
      voertuigInput.value = id;
      setFavoritesPanel(false);
      zoekAlles();
    });
    favoritesListEl.appendChild(item);
  });
}

function updateFavoriteButtonState() {
  const inlineFavoriteBtn = document.getElementById("favoriteInlineBtn");
  if (!inlineFavoriteBtn) {
    return;
  }

  const id = (inlineFavoriteBtn.dataset.id || currentVehicleId || voertuigInput.value || "").trim();
  if (!id) return;

  const isFav = favorites.includes(id);
  const label = isFav ? t("favoriteRemove") : t("favoriteAdd");
  inlineFavoriteBtn.textContent = isFav ? "\u2605" : "\u2606";
  inlineFavoriteBtn.title = label;
  inlineFavoriteBtn.setAttribute("aria-label", label);
  inlineFavoriteBtn.setAttribute("aria-pressed", String(isFav));
  inlineFavoriteBtn.classList.toggle("is-favorite", isFav);
}

function toggleFavorite(explicitId = "") {
  const id = (explicitId || currentVehicleId || voertuigInput.value || "").trim();
  if (!id) return;
  if (favorites.includes(id)) {
    favorites = favorites.filter((x) => x !== id);
  } else {
    favorites.unshift(id);
    favorites = [...new Set(favorites)].slice(0, 20);
  }
  saveFavorites();
  renderFavorites();
  updateFavoriteButtonState();
}

function moveFavorite(id, direction) {
  const index = favorites.indexOf(id);
  if (index < 0) return;
  const nextIndex = direction === "up" ? index - 1 : index + 1;
  if (nextIndex < 0 || nextIndex >= favorites.length) return;
  const nextFavorites = [...favorites];
  [nextFavorites[index], nextFavorites[nextIndex]] = [nextFavorites[nextIndex], nextFavorites[index]];
  favorites = nextFavorites;
  saveFavorites();
  renderFavorites();
  updateFavoriteButtonState();
}

function removeFavorite(id) {
  if (!id) return;
  favorites = favorites.filter((favoriteId) => favoriteId !== id);
  saveFavorites();
  renderFavorites();
  updateFavoriteButtonState();
}

function restartRealtimeRefresh() {
  if (refresh) clearInterval(refresh);
  if (!currentVehicleId || realtimePausedByInactivity) return;
  refresh = setInterval(() => updateRealtime(currentVehicleId), updateIntervalMs);
}

function markUserInteraction(event) {
  lastUserInteractionAt = Date.now();
  if (!realtimePausedByInactivity || !currentVehicleId) return;
  const eventTarget = event?.target;
  const isSearchFieldKeyInteraction =
    event?.type === "keydown" &&
    eventTarget instanceof Element &&
    eventTarget === voertuigInput;
  realtimePausedByInactivity = false;
  restartRealtimeRefresh();
  if (!isSearchFieldKeyInteraction) {
    updateRealtime(currentVehicleId);
  }
}

function pauseRealtimeForInactivity() {
  if (!currentVehicleId || realtimePausedByInactivity) return;
  realtimePausedByInactivity = true;
  if (refresh) {
    clearInterval(refresh);
    refresh = null;
  }
  realtimeEl.textContent = t("idlePaused");
}

function initInactivityMonitor() {
  if (inactivityCheckHandle) return;
  inactivityCheckHandle = setInterval(() => {
    if (!currentVehicleId || realtimePausedByInactivity) return;
    const idleMs = Date.now() - lastUserInteractionAt;
    if (idleMs >= INACTIVITY_LIMIT_MS) {
      pauseRealtimeForInactivity();
    }
  }, INACTIVITY_CHECK_MS);

  ["pointerdown", "touchstart", "wheel", "scroll", "mousedown"].forEach((eventName) => {
    document.addEventListener(eventName, markUserInteraction, { passive: true });
  });
  document.addEventListener("keydown", markUserInteraction);
  window.addEventListener("focus", markUserInteraction);
  document.addEventListener("visibilitychange", () => {
    if (!document.hidden) markUserInteraction();
  });
}

function initAppPreferences() {
  loadSettings();
  window.settings = settings;
  document.body.classList.toggle("platform-android", isAndroidPlatform);
  document.body.classList.toggle("platform-android-webview", isAndroidWebView);
  loadFavorites();
  settings.intervalMs = normalizeUpdateIntervalMs(settings.intervalMs);
  updateIntervalMs = settings.intervalMs;
  intervalSelect.value = String(updateIntervalMs);
  themeSelect.value = settings.theme;
  settings.colorTheme = normalizeColorTheme(settings.colorTheme);
  colorThemeSelect.value = settings.colorTheme;
  languageSelect.value = settings.language;
  applyTheme(settings.theme);
  applyColorTheme(settings.colorTheme);
  applyTranslations();
  syncStalkModeAvailability();
  setSettingsPanel(false);
  setFavoritesPanel(false);
  hideVehiclePhotoCard();
  renderFavorites();
  renderLastHaltes();
  loadFeedStatus();
  updateFavoriteButtonState();
  resultsWrapEl.classList.remove("show");
  resultsGridEl.classList.remove("show");
  closeBtnEl.style.display = "none";
  mapEl.classList.add("hidden");
  lastUpdateEl.hidden = true;
  lastUpdateEl.textContent = `${t("lastUpdate")}: -`;

  if (isIosInstallable()) {
    iosInstallHintEl.hidden = false;
  }
  initInactivityMonitor();
}

searchBtn.addEventListener("click", zoekAlles);
closeBtnEl?.addEventListener("click", terug);
appTitleBtnEl?.addEventListener("click", () => {
  setFavoritesPanel(false);
  setSettingsPanel(false);
  hideDashboardSetupModal();
  closeDashboardPanel();
  hidePdfModal();
  hideCompareModal();
  hideInfoModal();
  hideFunnyModal();
  terug();
});
bindVehicleSuggestions(voertuigInput, () => {
  voertuigInput.blur();
  zoekAlles();
});
voertuigInput.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    event.preventDefault();
    zoekAlles();
  }
});
dashboardToggleBtn?.addEventListener("click", () => {
  if (!stalkModeMediaQuery.matches) return;
  setFavoritesPanel(false);
  showDashboardSetupModal();
});
dashboardEditBtn?.addEventListener("click", showDashboardSetupModal);
dashboardCloseBtn?.addEventListener("click", closeDashboardPanel);
voertuigInput.addEventListener("input", updateFavoriteButtonState);
favoritesToggleBtn.addEventListener("click", (event) => {
  event.stopPropagation();
  setFavoritesPanel(!favoritesPanelOpen);
});
favoritesPanelEl.addEventListener("click", (event) => {
  event.stopPropagation();
});
favoritesListEl?.addEventListener("click", (event) => {
  const target = event.target;
  if (!(target instanceof Element)) return;
  const actionBtn = target.closest(".favorite-action-btn");
  if (!actionBtn) return;
  const favoriteItem = actionBtn.closest(".favorite-item");
  const id = favoriteItem?.getAttribute("data-id") || "";
  const action = actionBtn.getAttribute("data-action");
  if (action === "up") moveFavorite(id, "up");
  if (action === "down") moveFavorite(id, "down");
  if (action === "remove") removeFavorite(id);
});
haltecodeSearchBtn?.addEventListener("click", () => searchHaltes());
haltecodeInputEl?.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    event.preventDefault();
    searchHaltes();
  }
});
haltecodeInputEl?.addEventListener("input", () => {
  setHalteStatus("");
});
favoritesBackdropEl?.addEventListener("click", () => setFavoritesPanel(false));
vasteDataEl.addEventListener("click", (event) => {
  const target = event.target;
  if (!(target instanceof Element)) return;
  const inlineFavoriteBtn = target.closest("#favoriteInlineBtn");
  if (inlineFavoriteBtn) {
    const id = inlineFavoriteBtn.getAttribute("data-id") || "";
    toggleFavorite(id);
    return;
  }

  const pdfButton = target.closest("#vehiclePdfBtn");
  if (pdfButton) {
    const id = pdfButton.getAttribute("data-id") || currentVehicleId || "";
    showPdfModal(id);
    return;
  }

  const compareButton = target.closest("#vehicleCompareBtn");
  if (compareButton) {
    showCompareModal();
  }
});
intervalSelect.addEventListener("change", () => {
  settings.intervalMs = normalizeUpdateIntervalMs(intervalSelect.value);
  intervalSelect.value = String(settings.intervalMs);
  updateIntervalMs = settings.intervalMs;
  saveSettings();
  restartRealtimeRefresh();
  if (dashboardVehicleIds.length && !dashboardPanelEl.hidden) {
    void openDashboardPanel();
  }
});
themeSelect.addEventListener("change", () => {
  settings.theme = themeSelect.value;
  saveSettings();
  applyTheme(settings.theme);
});
colorThemeSelect.addEventListener("change", () => {
  settings.colorTheme = normalizeColorTheme(colorThemeSelect.value);
  colorThemeSelect.value = settings.colorTheme;
  saveSettings();
  applyColorTheme(settings.colorTheme);
});
languageSelect.addEventListener("change", () => {
  settings.language = languageSelect.value;
  saveSettings();
  applyTranslations();
  renderFavorites();
  if (currentVehicleId) toonVasteData(currentVehicleId);
  if (compareVehicleId) renderComparison();
});
funnyModalCloseBtn?.addEventListener("click", hideFunnyModal);
funnyModalEl?.addEventListener("click", (event) => {
  if (event.target === funnyModalEl) hideFunnyModal();
});
pdfModalCloseBtn?.addEventListener("click", hidePdfModal);
pdfModalCancelBtn?.addEventListener("click", hidePdfModal);
compareModalCloseBtn?.addEventListener("click", hideCompareModal);
compareModalCancelBtn?.addEventListener("click", hideCompareModal);
compareClearBtn?.addEventListener("click", clearComparison);
vehiclePhotoPrevBtn?.addEventListener("click", () => {
  if (currentVehiclePhotoEntries.length < 2) return;
  currentVehiclePhotoIndex = (currentVehiclePhotoIndex - 1 + currentVehiclePhotoEntries.length) % currentVehiclePhotoEntries.length;
  renderActiveVehiclePhoto();
});
vehiclePhotoNextBtn?.addEventListener("click", () => {
  if (currentVehiclePhotoEntries.length < 2) return;
  currentVehiclePhotoIndex = (currentVehiclePhotoIndex + 1) % currentVehiclePhotoEntries.length;
  renderActiveVehiclePhoto();
});
pdfModalConfirmBtn?.addEventListener("click", async () => {
  if (!pdfModalVehicleId) return;
  const voertuigId = pdfModalVehicleId;
  const themeKey = pdfThemeSelectEl?.value || "geel";
  const oorspronkelijkeTekst = pdfModalConfirmBtn.textContent;
  pdfModalConfirmBtn.disabled = true;
  pdfModalConfirmBtn.textContent = getLabel("pdfGenerating", "PDF wordt gemaakt...");
  try {
    await exportBusPdf(voertuigId, themeKey);
    hidePdfModal();
  } catch (error) {
    console.error("PDF downloaden mislukt", error);
    window.alert(getLabel("pdfDownloadFailed", "De PDF kon niet worden gedownload. Probeer het opnieuw."));
  } finally {
    pdfModalConfirmBtn.disabled = false;
    pdfModalConfirmBtn.textContent = oorspronkelijkeTekst;
  }
});
compareModalConfirmBtn?.addEventListener("click", async () => {
  const query = compareVehicleInputEl?.value.trim() || "";
  if (!query) return;
  if (voertuigen.length === 0) await laadVoertuigen();
  const resolved = resolveVehicleSearch(query);
  const resolvedId = resolved.vehicleId || normalize(query);
  if (!resolved.bus) {
    window.alert(getLabel("compareNoSecondFound", "Geen tweede voertuig gevonden."));
    return;
  }
  if (resolvedId === currentVehicleId) {
    window.alert(getLabel("compareChooseDifferent", "Kies een ander voertuig om te vergelijken."));
    return;
  }
  compareVehicleId = resolvedId;
  hideCompareModal();
  renderComparison();
});
compareVehicleInputEl?.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    event.preventDefault();
    compareModalConfirmBtn?.click();
  }
});
dashboardSetupCloseBtn?.addEventListener("click", hideDashboardSetupModal);
dashboardSetupCancelBtn?.addEventListener("click", hideDashboardSetupModal);
dashboardSetupModalEl?.addEventListener("click", (event) => {
  if (event.target === dashboardSetupModalEl) hideDashboardSetupModal();
});
dashboardSetupConfirmBtn?.addEventListener("click", async () => {
  if (!stalkModeMediaQuery.matches) {
    hideDashboardSetupModal();
    return;
  }
  const inputs = Array.from(dashboardSetupGridEl?.querySelectorAll(".dashboard-setup-input") || []);
  const nextIds = inputs
    .map((input) => input.value.trim())
    .filter(Boolean)
    .map((query) => {
      const resolved = resolveVehicleSearch(query);
      return resolved.vehicleId || normalize(query);
    })
    .filter(Boolean)
    .slice(0, 9);

  dashboardVehicleIds = [...new Set(nextIds)];
  hideDashboardSetupModal();
  if (!dashboardVehicleIds.length) {
    closeDashboardPanel();
    return;
  }
  await openDashboardPanel();
});
stalkModeMediaQuery.addEventListener?.("change", syncStalkModeAvailability);
pdfModalEl?.addEventListener("click", (event) => {
  if (event.target === pdfModalEl) hidePdfModal();
});
compareModalEl?.addEventListener("click", (event) => {
  if (event.target === compareModalEl) hideCompareModal();
});
infoModalCloseBtn?.addEventListener("click", hideInfoModal);
infoModalOkBtn?.addEventListener("click", hideInfoModal);
infoModalEl?.addEventListener("click", (event) => {
  if (event.target === infoModalEl) hideInfoModal();
});
offlineRetryBtn?.addEventListener("click", () => {
  verifyInternetConnection(true).catch(() => {});
});
settingsToggleBtn.addEventListener("click", () => {
  setFavoritesPanel(false);
  setSettingsPanel(!settingsOpen);
});
settingsInfoBtn?.addEventListener("click", () => {
  setSettingsPanel(false);
  showInfoModal();
});
settingsCloseBtn.addEventListener("click", () => setSettingsPanel(false));
settingsBackdropEl.addEventListener("click", () => setSettingsPanel(false));
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && !dashboardSetupModalEl?.hidden) {
    hideDashboardSetupModal();
    return;
  }
  if (event.key === "Escape" && !infoModalEl?.hidden) {
    hideInfoModal();
    return;
  }
  if (event.key === "Escape" && !compareModalEl?.hidden) {
    hideCompareModal();
    return;
  }
  if (event.key === "Escape" && !pdfModalEl?.hidden) {
    hidePdfModal();
    return;
  }
  if (event.key === "Escape" && !funnyModalEl?.hidden) {
    hideFunnyModal();
    return;
  }
  if (event.key === "Escape" && favoritesPanelOpen) {
    setFavoritesPanel(false);
    return;
  }
  if (event.key === "Escape" && settingsOpen) {
    setSettingsPanel(false);
  }
});
window.addEventListener("online", () => {
  verifyInternetConnection(true).catch(() => {});
});
window.addEventListener("offline", () => {
  lastVerifiedInternetAt = Date.now();
  lastVerifiedInternetState = false;
  setOfflineOverlayVisible(true);
});
document.addEventListener("visibilitychange", () => {
  if (!document.hidden) {
    verifyInternetConnection(true).catch(() => {});
  }
});

// Helper: CSV parser that respects quoted fields
function parseCSVLine(line, delimiter = ','){
  const fields = [];
  let cur = "";
  let inQuotes = false;
  for(let i=0;i<line.length;i++){
    const ch = line[i];
    if(ch === '"'){
      if(inQuotes && line[i+1] === '"') { cur += '"'; i++; }
      else { inQuotes = !inQuotes; }
    } else if(ch === delimiter && !inQuotes){
      fields.push(cur);
      cur = "";
    } else { cur += ch; }
  }
  fields.push(cur);
  return fields.map(f => f.trim().replace(/^"|"$/g, ''));
}

// Helper: normalize ids/strings for matching
const normalize = s => (s||"").toString().replace(/"/g, "").trim();
const cleanText = (value) => {
  const normalized = normalize(value);
  return normalized === "/" ? "" : normalized;
};
function pickFirstText(...values) {
  for (const value of values) {
    const cleaned = cleanText(value);
    if (cleaned) return cleaned;
  }
  return "";
}
function getRouteKey(routeId) {
  const normalized = cleanText(routeId);
  if (!normalized) return "";
  return cleanText(normalized.split("_")[0]);
}
function getRouteKeyFromTripId(tripId) {
  const normalized = cleanText(tripId);
  if (!normalized) return "";
  return cleanText(normalized.split("_")[0]);
}
function findTripDataByTripId(tripId) {
  const normalizedTripId = cleanText(tripId);
  if (!normalizedTripId) return null;
  const exact = tripsById.get(normalizedTripId);
  if (exact) return exact;

  return trips.find((trip) => {
    const currentTripId = normalize(trip.trip_id);
    return currentTripId && (
      currentTripId.endsWith(normalizedTripId) ||
      normalizedTripId.endsWith(currentTripId) ||
      currentTripId.includes(normalizedTripId) ||
      normalizedTripId.includes(currentTripId)
    );
  }) || null;
}
function addTripToLookup(map, key, trip) {
  if (!key) return;
  if (!map.has(key)) map.set(key, []);
  map.get(key).push(trip);
}
function getTripsForRoute(routeId, fallbackTripId = "") {
  const normalizedRouteId = cleanText(routeId);
  if (normalizedRouteId && tripsByRouteId.has(normalizedRouteId)) {
    return tripsByRouteId.get(normalizedRouteId);
  }

  const routeKey = getRouteKey(normalizedRouteId) || getRouteKeyFromTripId(fallbackTripId);
  if (routeKey && tripsByRouteKey.has(routeKey)) {
    return tripsByRouteKey.get(routeKey);
  }
  return [];
}
function findTripData(routeId, tripId, headsign) {
  const byTripId = findTripDataByTripId(tripId);
  if (byTripId) return byTripId;

  const normalizedHeadsign = cleanText(headsign).toLowerCase();
  if (!normalizedHeadsign) return null;

  const candidates = getTripsForRoute(routeId, tripId);
  if (!candidates.length) return null;

  const exact = candidates.find((trip) => cleanText(trip.trip_headsign).toLowerCase() === normalizedHeadsign);
  if (exact) return exact;

  return candidates.find((trip) => {
    const currentHeadsign = cleanText(trip.trip_headsign).toLowerCase();
    return currentHeadsign && (
      currentHeadsign.includes(normalizedHeadsign) ||
      normalizedHeadsign.includes(currentHeadsign)
    );
  }) || null;
}
function findRouteDataByRouteId(routeId, tripId = "") {
  const normalizedRouteId = cleanText(routeId);
  if (normalizedRouteId) {
    const exact = routesById.get(normalizedRouteId);
    if (exact) return exact;

    const fuzzy = routes.find((route) => {
      const currentRouteId = normalize(route.route_id);
      return currentRouteId && (
        currentRouteId === normalizedRouteId ||
        currentRouteId.includes(normalizedRouteId) ||
        normalizedRouteId.includes(currentRouteId)
      );
    });
    if (fuzzy) return fuzzy;
  }

  const routeKey = getRouteKey(normalizedRouteId) || getRouteKeyFromTripId(tripId);
  if (routeKey && routesByKey.has(routeKey)) return routesByKey.get(routeKey);
  return null;
}
const normalizeLookup = s => normalize(s).toLowerCase();
const normalizePlateLookup = s => normalizeLookup(s).replace(/[^a-z0-9]/g, "");

function getVehicleField(vehicle, fieldKey) {
  if (!vehicle || !fieldKey) return "";
  const value = vehicle[fieldKey];
  return value == null ? "" : value.toString().trim();
}

function normalizeVehicleSourceKey(key) {
  return normalizeFieldKey(key).replace(/\s+/g, "_");
}

function mapVehicleRecord(headers, values) {
  const rawRecord = {};
  headers.forEach((header, index) => {
    rawRecord[header] = values[index] || "/";
  });

  const mappedRecord = {};
  headers.forEach((header) => {
    const normalizedHeader = normalizeVehicleSourceKey(header);
    const targetKey = VEHICLE_DISPLAY_FIELD_MAP[normalizedHeader];
    if (!targetKey) return;
    mappedRecord[targetKey] = rawRecord[header] || "/";
  });

  return mappedRecord;
}

function splitLegacyValues(rawValue, splitOnSpaces = false) {
  const value = normalize(rawValue);
  if (!value || value === "/") return [];
  const pattern = splitOnSpaces ? /[,;| ]+/ : /[,;|]+/;
  return value.split(pattern).map((part) => part.trim()).filter((part) => part && part !== "/");
}

function resolveVehicleSearch(query) {
  const normalizedQuery = normalizeLookup(query);
  const normalizedPlateQuery = normalizePlateLookup(query);
  if (!normalizedQuery && !normalizedPlateQuery) {
    return { bus: null, vehicleId: "" };
  }

  const bus = voertuigen.find((vehicle) => {
    const vehicleNumber = normalizeLookup(vehicle.Voertuignummer);
    if (vehicleNumber && vehicleNumber === normalizedQuery) return true;

    const plate = normalizePlateLookup(getVehicleField(vehicle, vehiclePlateFieldKey));
    if (normalizedPlateQuery && plate && plate === normalizedPlateQuery) return true;

    const hanseaId = normalizeLookup(getVehicleField(vehicle, "Hansea nummer"));
    if (hanseaId && hanseaId === normalizedQuery) return true;

    const oldVehicleNumbers = splitLegacyValues(getVehicleField(vehicle, oldVehicleNumbersFieldKey), true);
    if (oldVehicleNumbers.some((value) => normalizeLookup(value) === normalizedQuery)) return true;

    const oldPlates = splitLegacyValues(getVehicleField(vehicle, oldLicensePlatesFieldKey), false);
    if (normalizedPlateQuery && oldPlates.some((value) => normalizePlateLookup(value) === normalizedPlateQuery)) return true;

    return false;
  });

  return {
    bus: bus || null,
    vehicleId: bus ? normalize(bus.Voertuignummer) : ""
  };
}

function matchesSuggestionQuery(vehicle, normalizedQuery, normalizedPlateQuery) {
  const vehicleNumber = normalizeLookup(vehicle.Voertuignummer);
  if (normalizedQuery && vehicleNumber.startsWith(normalizedQuery)) return true;

  const plate = normalizePlateLookup(getVehicleField(vehicle, vehiclePlateFieldKey));
  if (normalizedPlateQuery && plate && plate.startsWith(normalizedPlateQuery)) return true;

  const hanseaId = normalizeLookup(getVehicleField(vehicle, "Hansea nummer"));
  if (normalizedQuery && hanseaId && hanseaId.startsWith(normalizedQuery)) return true;

  const oldVehicleNumbers = splitLegacyValues(getVehicleField(vehicle, oldVehicleNumbersFieldKey), true);
  if (normalizedQuery && oldVehicleNumbers.some((value) => normalizeLookup(value).startsWith(normalizedQuery))) return true;

  const oldPlates = splitLegacyValues(getVehicleField(vehicle, oldLicensePlatesFieldKey), false);
  if (normalizedPlateQuery && oldPlates.some((value) => normalizePlateLookup(value).startsWith(normalizedPlateQuery))) return true;

  return false;
}

function buildSuggestionLabel(vehicle) {
  const vehicleNumber = normalize(vehicle.Voertuignummer);
  const vehicleType = normalize(vehicle.Type);
  const plate = normalize(getVehicleField(vehicle, vehiclePlateFieldKey));
  const oldVehicleNumbers = splitLegacyValues(getVehicleField(vehicle, oldVehicleNumbersFieldKey), true).slice(0, 2);
  const hanseaId = normalize(getVehicleField(vehicle, "Hansea nummer"));
  const parts = [`${vehicleNumber}`];
  if (vehicleType && vehicleType !== "/") parts.push(vehicleType);
  if (plate && plate !== "/") parts.push(plate);
  if (hanseaId && hanseaId !== "/") parts.push(`Hansea ${hanseaId}`);
  if (oldVehicleNumbers.length) parts.push(`oud ${oldVehicleNumbers.join(", ")}`);
  return parts.join(" - ");
}

function getSuggestionResults(query = "", limit = 8) {
  const normalizedQuery = normalizeLookup(query);
  const normalizedPlateQuery = normalizePlateLookup(query);

  if (!normalizedQuery && !normalizedPlateQuery) {
    return favorites
      .map((id) => findBusById(id))
      .filter(Boolean)
      .slice(0, limit);
  }

  return voertuigen
    .filter((vehicle) => matchesSuggestionQuery(vehicle, normalizedQuery, normalizedPlateQuery))
    .slice(0, limit);
}

function hideSuggestionList(listEl) {
  if (!listEl) return;
  listEl.innerHTML = "";
  listEl.hidden = true;
}

function renderSuggestionList(listEl, inputEl, onSelect) {
  if (!listEl || !inputEl) return;
  const results = getSuggestionResults(inputEl.value.trim());
  listEl.innerHTML = "";

  if (!results.length) {
    listEl.hidden = true;
    return;
  }

  results.forEach((vehicle) => {
    const li = document.createElement("li");
    li.className = "vehicle-suggestion-item";
    li.dataset.id = normalize(vehicle.Voertuignummer);
    li.innerHTML = `
      <span class="vehicle-suggestion-primary">${escapeHtml(normalize(vehicle.Voertuignummer))}</span>
      <span class="vehicle-suggestion-secondary">${escapeHtml(buildSuggestionLabel(vehicle))}</span>
    `;
    li.addEventListener("mousedown", (event) => {
      event.preventDefault();
    });
    li.addEventListener("click", () => {
      const vehicleId = normalize(vehicle.Voertuignummer);
      inputEl.value = vehicleId;
      hideSuggestionList(listEl);
      onSelect(vehicleId);
    });
    listEl.appendChild(li);
  });

  listEl.hidden = false;
}

function ensureInlineSuggestionList(inputEl) {
  if (!inputEl) return null;
  let listEl = inputEl.parentElement?.querySelector(".inline-suggestion-list");
  if (listEl) return listEl;
  listEl = document.createElement("ul");
  listEl.className = "inline-suggestion-list";
  listEl.hidden = true;
  inputEl.insertAdjacentElement("afterend", listEl);
  return listEl;
}

function bindVehicleSuggestions(inputEl, onSelect) {
  if (!inputEl || inputEl.dataset.vehicleSuggestionsBound === "1") return;
  inputEl.dataset.vehicleSuggestionsBound = "1";

  const listEl = inputEl.id === "voertuignummer" ? suggestieLijst : ensureInlineSuggestionList(inputEl);
  if (!listEl) return;

  const render = () => {
    activeVehicleSuggestionInput = inputEl;
    renderSuggestionList(listEl, inputEl, onSelect);
  };

  inputEl.addEventListener("input", render);
  inputEl.addEventListener("focus", render);
  inputEl.addEventListener("blur", () => {
    window.setTimeout(() => {
      if (activeVehicleSuggestionInput === inputEl) activeVehicleSuggestionInput = null;
      hideSuggestionList(listEl);
    }, 120);
  });
}

// Custom bus pin as DivIcon so we can rotate the image based on bearing
const busIcon = L.divIcon({
  className: 'bus-div-icon',
  html: '<img class="bus-div-icon__img" src="media/navicon.png" alt="Bus"/>',
  iconSize: [36,36],
  iconAnchor: [18,36]
});

async function laadVoertuigen() {
  const res = await fetchWithTimeout(`${BASE_URL}/vehicles.txt`, { cache: "no-store" });
  const text = await res.text();
  const regels = text
    .split(/\r?\n/)
    .map((regel) => regel.trim())
    .filter((regel) => regel && !regel.startsWith("#"));
  const headers = parseCSVLine(regels[0], ";").map((header) => header.trim());
  vehiclePlateFieldKey = "Nummerplaat";
  oldVehicleNumbersFieldKey = "Oude voertuignummers";
  oldLicensePlatesFieldKey = "Oude nummerplaten";
  vehicleHideVinFieldKey = "hide-vin";

  voertuigen = regels.slice(1)
    .filter((regel) => regel.trim())
    .map((regel) => mapVehicleRecord(headers, parseCSVLine(regel, ";")));
  dataLoadTimestamps.vehicles = Date.now();
  renderFavorites();
}

async function laadTrips() {
  if (trips.length) return;
  if (tripsLoadPromise) return tripsLoadPromise;
  tripsLoadPromise = (async () => {
  const res = await fetchWithTimeout(`${BASE_URL}/trips.txt`, { cache: "no-store" });
  const text = await res.text();
  const regels = text.trim().split(/\r?\n/);
  const headers = parseCSVLine(regels[0]).map(h => h.trim());

  trips = regels.slice(1).map(r => {
    const values = parseCSVLine(r);
    const obj = {};
    headers.forEach((h, i) => obj[h] = values[i] || "/");
    return obj;
  });

  tripsById.clear();
  tripsByRouteId.clear();
  tripsByRouteKey.clear();
  trips.forEach((trip) => {
    const tripId = normalize(trip.trip_id);
    if (tripId) tripsById.set(tripId, trip);
    const routeId = normalize(trip.route_id);
    addTripToLookup(tripsByRouteId, routeId, trip);
    const routeKey = getRouteKey(routeId);
    addTripToLookup(tripsByRouteKey, routeKey, trip);
  });
  dataLoadTimestamps.trips = Date.now();
  })();
  try {
    await tripsLoadPromise;
  } finally {
    tripsLoadPromise = null;
  }
}

async function laadRoutes() {
  if (routes.length) return;
  if (routesLoadPromise) return routesLoadPromise;
  routesLoadPromise = (async () => {
  const res = await fetchWithTimeout(`${BASE_URL}/routes.txt`, { cache: "no-store" });
  const text = await res.text();
  const regels = text.trim().split(/\r?\n/);
  const headers = parseCSVLine(regels[0]).map(h => h.trim());

  routes = regels.slice(1).map(r => {
    const values = parseCSVLine(r);
    const obj = {};
    headers.forEach((h, i) => obj[h] = values[i] || "/");
    return obj;
  });

  routesById.clear();
  routesByKey.clear();
  routes.forEach((route) => {
    const routeId = normalize(route.route_id);
    if (routeId) routesById.set(routeId, route);
    const routeKey = getRouteKey(routeId);
    if (routeKey && !routesByKey.has(routeKey)) routesByKey.set(routeKey, route);
  });
  dataLoadTimestamps.routes = Date.now();
  })();
  try {
    await routesLoadPromise;
  } finally {
    routesLoadPromise = null;
  }
}

async function laadStops() {
  if (stopsById.size) return;
  if (stopsLoadPromise) return stopsLoadPromise;
  stopsLoadPromise = (async () => {
  const res = await fetchWithTimeout(`${BASE_URL}/stops.txt`, { cache: "no-store" });
  const text = await res.text();
  const regels = text.trim().split(/\r?\n/);
  const headers = parseCSVLine(regels[0]).map(h => h.trim());

  stops = regels.slice(1).map(r => {
    const values = parseCSVLine(r);
    const obj = {};
    headers.forEach((h, i) => obj[h] = values[i] || "/");
    return obj;
  });

  stopsById.clear();
  stops.forEach((stop) => {
    const stopId = normalize(stop.stop_id);
    const stopCode = normalize(stop.stop_code);
    if (stopId) stopsById.set(stopId, stop);
    if (stopCode) stopsById.set(stopCode, stop);
  });
  dataLoadTimestamps.stops = Date.now();
  })();
  try {
    await stopsLoadPromise;
  } finally {
    stopsLoadPromise = null;
  }
}

initAppPreferences();
void laadVoertuigen()
  .then(() => applyDeepLinkIfNeeded())
  .catch((e) => console.warn("Warm-up voertuigen mislukt", e));

function toonSuggesties() {
  renderSuggestionList(suggestieLijst, voertuigInput, () => {
    voertuigInput.blur();
    zoekAlles();
  });
}

async function zoekAlles() {
  const searchToken = ++latestSearchToken;
  markUserInteraction();
  const query = voertuigInput.value.trim();
  if(!query) return;
  const hasInternet = await verifyInternetConnection();
  if (searchToken !== latestSearchToken) return;
  if (!hasInternet) {
    suggestieLijst.innerHTML = "";
    return;
  }
  setPageLoading(true);
  setFavoritesPanel(false);
  if (query.toLowerCase() === "python") {
    hideSuggestionList(suggestieLijst);
    startPythonDownload();
    setPageLoading(false);
    return;
  }
  if (query.toLowerCase() === "android" || query.toLowerCase() === "apk") {
    hideSuggestionList(suggestieLijst);
    startApkDownload();
    setPageLoading(false);
    return;
  }
  if (query.toLowerCase() === "info") {
    hideSuggestionList(suggestieLijst);
    showInfoModal();
    setPageLoading(false);
    return;
  }
  if (query.toLowerCase() === "best") {
    hideSuggestionList(suggestieLijst);
    showFunnyModal();
    setPageLoading(false);
    return;
  }
  if (query.toLowerCase() === "bus beih") {
    hideSuggestionList(suggestieLijst);
    window.open("https://salajev.github.io/bus.be-fcl/index.html", "_blank", "noopener,noreferrer");
    setPageLoading(false);
    return;
  }
  if (voertuigen.length === 0) await laadVoertuigen();
  if (searchToken !== latestSearchToken) return;
  const resolved = resolveVehicleSearch(query);
  const activeVehicleId = resolved.vehicleId || normalize(query);
  const bus = resolved.bus;
  currentVehicleId = activeVehicleId;
  realtimePausedByInactivity = false;
  if (compareVehicleId === currentVehicleId) compareVehicleId = "";
  if (resolved.vehicleId && activeVehicleId !== query) {
    voertuigInput.value = activeVehicleId;
  }
  updateFavoriteButtonState();

  hideSuggestionList(suggestieLijst);
  resultsWrapEl.classList.add("show");
  resultsGridEl.classList.add("show");
  closeBtnEl.style.display = "inline-flex";
  updateUrlState();
  updateDocumentTitle(activeVehicleId);

  toonVasteData(activeVehicleId);
  renderComparison();
  lastUpdateEl.hidden = true;
  lastUpdateEl.textContent = `${t("lastUpdate")}: -`;

  if (isOutOfService(bus)) {
    realtimeEl.innerHTML = t("outOfServiceNoRealtime");
    mapEl.classList.add("hidden");
    routeTrail = [];
    if (trailLine && map) {
      map.removeLayer(trailLine);
      trailLine = null;
    }
    if (marker && map) {
      map.removeLayer(marker);
      marker = null;
    }
    lastUpdateEl.textContent = `${t("lastUpdate")}: -`;
    lastUpdateEl.hidden = true;
    if(refresh) {
      clearInterval(refresh);
      refresh = null;
    }
    setPageLoading(false);
    return;
  }

  realtimeEl.innerHTML = `<span class='spinner'></span><span class='loading'>${t("loading")}</span>`;
  routeTrail = [];
  if (trailLine && map) {
    map.removeLayer(trailLine);
    trailLine = null;
  }

  updateRealtime(activeVehicleId);
  restartRealtimeRefresh();
}

function terug() {
  resultsGridEl.classList.remove("show");
  resultsWrapEl.classList.remove("show");
  closeBtnEl.style.display = "none";
  realtimeEl.innerHTML = t("noData");
  vasteDataEl.innerHTML = t("noneSelected");
  hideVehiclePhotoCard();
  voertuigInput.value = "";
  currentVehicleId = "";
  realtimePausedByInactivity = false;
  compareVehicleId = "";
  routeTrail = [];
  if(refresh) {
    clearInterval(refresh);
    refresh = null;
  }
  if (trailLine && map) {
    map.removeLayer(trailLine);
    trailLine = null;
  }
  lastUpdateEl.textContent = `${t("lastUpdate")}: -`;
  lastUpdateEl.hidden = true;
  mapEl.classList.add("hidden");
  if(marker){ map.removeLayer(marker); marker=null; }
  clearComparison();
  updateFavoriteButtonState();
  updateUrlState();
  updateDocumentTitle("");
  hideSuggestionList(suggestieLijst);
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function findBusById(id) {
  return resolveVehicleSearch(id).bus;
}

function isOutOfService(bus) {
  if (!bus) return false;
  const outOfServiceDate = getVehicleField(bus, "Uit dienst");
  return !!outOfServiceDate && outOfServiceDate !== "/";
}

function toonVasteData(id){
  const bus = findBusById(id);

  if(!bus){
    vasteDataEl.innerHTML=t("noFixed");
    hideVehiclePhotoCard();
    return;
  }

  updateVehiclePhotoCard(id);

  const favoriteLabel = favorites.includes(id) ? t("favoriteRemove") : t("favoriteAdd");
  const favoriteStateSymbol = favorites.includes(id) ? "\u2605" : "\u2606";
  const safeFavoriteId = id.replace(/"/g, "&quot;");
  const favoriteClass = favorites.includes(id) ? "vehicle-favorite-btn is-favorite" : "vehicle-favorite-btn";

  let html=`<div class="vehicle-title-row"><p class="voertuignummer-display">${bus.Voertuignummer}</p><button id="favoriteInlineBtn" class="${favoriteClass}" type="button" title="${favoriteLabel}" aria-label="${favoriteLabel}" aria-pressed="${favorites.includes(id)}" data-id="${safeFavoriteId}">${favoriteStateSymbol}</button></div>`;
  if(bus.Type) html += `<p class="vehicle-type">${bus.Type}</p>`;
  html+="<table>";
  for (const row of collectVehicleDisplayRows(bus)) {
    let waardeMarkup = escapeHtml(row.value);
    if (row.isHansea) {
      waardeMarkup = `
        <span class="hansea-number-display">
          <img src="media/hansea.png" alt="Hansea" class="hansea-logo" loading="lazy" decoding="async">
          <span>${escapeHtml(row.value)}</span>
        </span>
      `;
    }
    html+=`<tr><th>${escapeHtml(row.label)}</th><td>${waardeMarkup}</td></tr>`;
  }
  html+="</table>";

  const operatorValue = normalizeFieldKey(getVehicleField(bus, "Vervoersmaatschappij"));
  let instagramPrefix = "#dl";
  if (operatorValue.includes("Le TEC")) {
    instagramPrefix = "#tec";
  } else if (operatorValue.includes("MIVB")) {
    instagramPrefix = "#mivb";
  } else if (operatorValue.includes("De Lijn")) {
    instagramPrefix = "#dl";
  }
  const igUrl = 'https://www.instagram.com/explore/search/keyword/?q=' + encodeURIComponent(instagramPrefix + id);
  const links = [
    `<a class="btn btn--instagram" href="${igUrl}" target="_blank" rel="noopener">${localWord("instagramSearch")}</a>`,
    `<button id="vehiclePdfBtn" class="btn btn--pdf" type="button" data-id="${safeFavoriteId}">${getLabel("pdfConfirm", "PDF downloaden")}</button>`,
    `<button id="vehicleCompareBtn" class="btn btn--compare" type="button" data-id="${safeFavoriteId}">${getLabel("compareConfirm", "Vergelijken")}</button>`
  ];
  const idNum = Number(id);
  if (Number.isInteger(idNum) && idNum >= 4404 && idNum <= 4459) {
    links.push(`<a class="btn btn--story" href="https://sites.google.com/view/delijn-busspotter/dampkap" target="_blank" rel="noopener">${t("story44xx")}</a>`);
  }
  html += `<div class="ig-btn-wrap">${links.join("")}</div>`;
  vasteDataEl.innerHTML=html;
  updateFavoriteButtonState();
}

function initMap(lat,lon){
  if(!map){
    map=L.map("map").setView([lat,lon],14);

    // Cleaner base map suitable for transit (CartoDB Positron)
    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors &amp; <a href="https://carto.com/">CARTO</a>'
    }).addTo(map);

  }
}

function getEntityVehiclePayload(entity) {
  return entity?.vehicle || entity?.vehiclePosition || entity?.vehicle_position || null;
}

function getEntityTripUpdatePayload(entity) {
  return entity?.tripUpdate || entity?.trip_update || null;
}

function extractTripDescriptor(...sources) {
  for (const source of sources) {
    if (!source || typeof source !== "object") continue;
    const candidates = [
      source.trip,
      source.tripDescriptor,
      source.trip_descriptor,
      source.tripUpdate,
      source.trip_update,
      source
    ];
    for (const candidate of candidates) {
      if (!candidate || typeof candidate !== "object") continue;
      const tripId = cleanText(candidate.tripId || candidate.trip_id || candidate.tripID || "");
      const routeId = cleanText(candidate.routeId || candidate.route_id || candidate.lineId || candidate.line_id || "");
      const routeShortName = cleanText(candidate.routeShortName || candidate.route_short_name || candidate.lineShortName || candidate.line_short_name || "");
      const headsign = cleanText(candidate.tripHeadsign || candidate.trip_headsign || candidate.headsign || candidate.destination || "");
      if (tripId || routeId || routeShortName || headsign) {
        return { tripId, routeId, routeShortName, headsign };
      }
    }
  }
  return { tripId: "", routeId: "", routeShortName: "", headsign: "" };
}

function getVehicleDescriptorId(vehicleDescriptor) {
  return cleanText(
    vehicleDescriptor?.id ||
    vehicleDescriptor?.vehicleId ||
    vehicleDescriptor?.vehicle_id ||
    vehicleDescriptor?.label ||
    ""
  );
}

function getVehicleIdFromTripUpdate(tripUpdate) {
  if (!tripUpdate || typeof tripUpdate !== "object") return "";
  const descriptor =
    tripUpdate?.vehicle ||
    tripUpdate?.vehicleDescriptor ||
    tripUpdate?.vehicle_descriptor;
  return getVehicleDescriptorId(descriptor);
}

function getTripUpdateForVehicle(entities, vehicleId, tripId = "") {
  const normalizedVehicleId = cleanText(vehicleId);
  const normalizedTripId = cleanText(tripId);
  if (!Array.isArray(entities)) return null;

  const byVehicleId = entities.find((entity) => {
    const tripUpdate = getEntityTripUpdatePayload(entity);
    const descriptor =
      tripUpdate?.vehicle ||
      tripUpdate?.vehicleDescriptor ||
      tripUpdate?.vehicle_descriptor;
    return getVehicleDescriptorId(descriptor) === normalizedVehicleId;
  });
  if (byVehicleId) return getEntityTripUpdatePayload(byVehicleId);

  if (normalizedTripId) {
    const byTripId = entities.find((entity) => {
      const descriptor = extractTripDescriptor(getEntityTripUpdatePayload(entity));
      return descriptor.tripId === normalizedTripId;
    });
    if (byTripId) return getEntityTripUpdatePayload(byTripId);
  }

  return null;
}

function getTripUpdateForEntityId(entities, entityId) {
  const normalizedEntityId = cleanText(entityId);
  if (!normalizedEntityId || !Array.isArray(entities)) return null;
  const match = entities.find((entity) => {
    const currentEntityId = cleanText(entity?.id || entity?.entityId || entity?.entity_id || "");
    return currentEntityId === normalizedEntityId && !!getEntityTripUpdatePayload(entity);
  });
  return match ? getEntityTripUpdatePayload(match) : null;
}

function getDelaySecondsFromTripUpdate(tripUpdate) {
  const updates = tripUpdate?.stopTimeUpdate || tripUpdate?.stop_time_update;
  if (!Array.isArray(updates) || updates.length === 0) return null;
  const now = Math.floor(Date.now() / 1000);
  let best = null;

  for (const stop of updates) {
    const candidates = [stop.departure, stop.arrival];
    for (const c of candidates) {
      if (!c) continue;
      const delay = typeof c.delay === "number" ? c.delay : (typeof c.delay_seconds === "number" ? c.delay_seconds : null);
      if (typeof delay !== "number") continue;
      const eventTime = typeof c.time === "number" ? c.time : (typeof c.timestamp === "number" ? c.timestamp : null);
      const score = typeof eventTime === "number" ? Math.abs(eventTime - now) : Number.MAX_SAFE_INTEGER;
      if (!best || score < best.score) {
        best = { delay, score };
      }
    }
  }
  return best ? best.delay : null;
}

function getCurrentStopIdFromTripUpdate(tripUpdate) {
  const updates = tripUpdate?.stopTimeUpdate || tripUpdate?.stop_time_update;
  if (!Array.isArray(updates) || updates.length === 0) return "";

  const now = Math.floor(Date.now() / 1000);
  let best = null;

  updates.forEach((stop, index) => {
    const stopId = cleanText(stop?.stopId || stop?.stop_id || stop?.assignedStopId || stop?.assigned_stop_id || "");
    if (!stopId) return;

    const candidates = [stop.departure?.time, stop.arrival?.time, stop.departure?.timestamp, stop.arrival?.timestamp]
      .filter((t) => typeof t === "number");
    const score = candidates.length
      ? Math.min(...candidates.map((t) => Math.abs(t - now)))
      : Number.MAX_SAFE_INTEGER;

    if (!best || score < best.score || (score === best.score && index < best.index)) {
      best = { stopId, score, index };
    }
  });

  return best?.stopId || "";
}

function getStopByStopId(stopId) {
  const normalized = normalize(stopId);
  if (!normalized) return null;
  return stopsById.get(normalized) || null;
}

async function updateRealtime(id){
  const requestToken = ++realtimeRequestToken;
  try{
    const res = await fetchWithTimeout(API_URL);
    const data = await res.json();
    if (requestToken !== realtimeRequestToken || id !== currentVehicleId) return;
    dataLoadTimestamps.realtime = Date.now();
    const entities = Array.isArray(data.entity) ? data.entity : [];
    const normalizedRequestedId = cleanText(id);
    const gpsEntity = [...entities].reverse().find((entity) => {
      const vehiclePayload = getEntityVehiclePayload(entity);
      if (!vehiclePayload?.position) return false;
      const descriptor =
        vehiclePayload?.vehicle ||
        vehiclePayload?.vehicleDescriptor ||
        vehiclePayload?.vehicle_descriptor;
      const descriptorId = getVehicleDescriptorId(descriptor);
      return descriptorId === normalizedRequestedId;
    });
    const gps = gpsEntity ? { vehicle: getEntityVehiclePayload(gpsEntity) } : null;

    if(!gps){
      realtimeEl.innerHTML=t("noData");
      mapEl.classList.add("hidden");
      lastUpdateEl.textContent = `${t("lastUpdate")}: -`;
      lastUpdateEl.hidden = true;
      return;
    }

    const v=gps.vehicle;
    const vehicleDescriptor = extractTripDescriptor(v);
    let tripUpdate = getTripUpdateForVehicle(entities, id, vehicleDescriptor.tripId);
    if (!tripUpdate) {
      const gpsEntityId = cleanText(gpsEntity?.id || gpsEntity?.entityId || gpsEntity?.entity_id || "");
      tripUpdate = getTripUpdateForEntityId(entities, gpsEntityId);
    }
    const tripUpdateDescriptor = extractTripDescriptor(tripUpdate);
    const descriptor = {
      tripId: vehicleDescriptor.tripId || tripUpdateDescriptor.tripId,
      routeId: vehicleDescriptor.routeId || tripUpdateDescriptor.routeId,
      routeShortName: vehicleDescriptor.routeShortName || tripUpdateDescriptor.routeShortName,
      headsign: vehicleDescriptor.headsign || tripUpdateDescriptor.headsign
    };
    const tripid = descriptor.tripId;

    // Zorg dat trips/routes geladen zijn
    if(trips.length===0) await laadTrips();
    if(routes.length===0) await laadRoutes();
    if(stopsById.size===0) await laadStops();
    if (requestToken !== realtimeRequestToken || id !== currentVehicleId) return;
    const tripUpdateVehicleId = getVehicleIdFromTripUpdate(tripUpdate);
    const sameVehicleTripUpdate = !!tripUpdate && tripUpdateVehicleId === normalizedRequestedId;
    const sameTripTripUpdate = !!tripUpdate && !!vehicleDescriptor.tripId && !!tripUpdateDescriptor.tripId && vehicleDescriptor.tripId === tripUpdateDescriptor.tripId;
    const canUseTripUpdateStop = sameVehicleTripUpdate || sameTripTripUpdate;
    const currentStopId = canUseTripUpdateStop ? getCurrentStopIdFromTripUpdate(tripUpdate) : "";
    const currentStop = getStopByStopId(currentStopId);
    const currentStopName = (currentStop?.stop_name || currentStopId || "-").toString().trim() || "-";
    const currentStopUrlRaw = (currentStop?.stop_url || "").toString().trim();
    const currentStopUrl = /^https?:\/\//i.test(currentStopUrlRaw) ? currentStopUrlRaw : "";

    // Robuuste matching: normaliseer en probeer exact / endsWith / includes
    const nTripId = cleanText(tripid);
    const provisionalRouteId = pickFirstText(cleanText(descriptor.routeId), getRouteKeyFromTripId(nTripId));
    const tripData = findTripData(provisionalRouteId, nTripId, descriptor.headsign);
    
    const routeId = pickFirstText(
      tripData?.route_id,
      provisionalRouteId,
      getRouteKeyFromTripId(nTripId)
    );
    const routeData = findRouteDataByRouteId(routeId, nTripId);

    const routeShortRaw = pickFirstText(
      routeData?.route_short_name,
      descriptor.routeShortName,
      routeId
    );
    const routeShort = routeShortRaw || "?";
    const tripHeadsign = pickFirstText(
      tripData?.trip_headsign,
      descriptor.headsign,
      tripData?.trip_short_name
    );
    const destinationText = tripHeadsign || "-";
    if (routeShort === "?" || destinationText === "-") {
      console.warn("[busbibliotheek] lijn/bestemming niet gevonden", {
        vehicleId: normalizedRequestedId,
        gpsEntityId: cleanText(gpsEntity?.id || ""),
        currentStopId,
        canUseTripUpdateStop,
        tripUpdateVehicleId,
        descriptorHeadsign: cleanText(descriptor.headsign),
        provisionalRouteId,
        vehicleDescriptor,
        tripUpdateDescriptor,
        tripId: nTripId,
        routeId,
        hasTripData: !!tripData,
        hasRouteData: !!routeData,
        hasTripUpdate: !!tripUpdate
      });
    }
    const routeUrlRaw = (routeData?.route_url || "").toString().trim();
    const routeUrl = /^https?:\/\//i.test(routeUrlRaw) ? routeUrlRaw : "";
    const routeColorRaw = (routeData?.route_color || "").replace(/[^0-9a-fA-F]/g, "").slice(0, 6);
    const routeTextColorRaw = (routeData?.route_text_color || "").replace(/[^0-9a-fA-F]/g, "").slice(0, 6);
    const routeColor = routeColorRaw.length === 6 ? `#${routeColorRaw}` : "#2563eb";
    const routeTextColor = routeTextColorRaw.length === 6 ? `#${routeTextColorRaw}` : "#ffffff";

    // Delay from trip updates is authoritative; fallback to vehicle payload
    let delaySeconds = canUseTripUpdateStop ? getDelaySecondsFromTripUpdate(tripUpdate) : null;
    if (typeof delaySeconds !== "number" && typeof gps.vehicle.trip?.delay === "number") {
      delaySeconds = gps.vehicle.trip.delay;
    }
    if (typeof delaySeconds !== "number" && typeof v.stopStatus?.delay === "number") {
      delaySeconds = v.stopStatus.delay;
    }
    if (typeof delaySeconds !== "number") delaySeconds = 0;
    delayMinutes = delaySeconds < 0
      ? -Math.round(Math.abs(delaySeconds) / 60)
      : Math.round(delaySeconds / 60);
    
    const msgDelay = formatDelayMessage(delayMinutes);
    const delayClass = delayMinutes < 0 ? "delay-early" : delayMinutes > 0 ? "delay-late" : "delay-ontime";
    const routeRowInner = `
      <span class="line-badge" style="--line-badge-bg:${routeColor};--line-badge-fg:${routeTextColor};">${escapeHtml(routeShort)}</span>
      <span class="destination-text">${escapeHtml(destinationText)}</span>
    `;
    const routeRowMarkup = routeUrl
      ? `<a class="route-destination-row route-link" href="${escapeHtml(routeUrl)}" target="_blank" rel="noopener noreferrer">${routeRowInner}</a>`
      : `<div class="route-destination-row">${routeRowInner}</div>`;
    const currentStopValueMarkup = currentStopUrl
      ? `<a class="current-stop-link" href="${escapeHtml(currentStopUrl)}" target="_blank" rel="noopener noreferrer">${escapeHtml(currentStopName)}</a>`
      : `<span class="current-stop-link">${escapeHtml(currentStopName)}</span>`;

    realtimeEl.innerHTML=`
      ${routeRowMarkup}
      <div class="current-stop-row">
        <span class="current-stop-label">${escapeHtml(t("currentStop"))}:</span>
        ${currentStopValueMarkup}
      </div>
      <span class="delay-status ${delayClass}">${escapeHtml(msgDelay)}</span>
    `;
    mapEl.classList.remove("hidden");
    lastUpdateEl.textContent = `${t("lastUpdate")}: ${new Date().toLocaleTimeString(localeForLanguage(settings.language))}`;
    lastUpdateEl.hidden = false;

    initMap(v.position.latitude,v.position.longitude);
    routeTrail.push([v.position.latitude, v.position.longitude]);
    if (routeTrail.length > 35) routeTrail.shift();
    if (routeTrail.length >= 2) {
      if (!trailLine) {
        trailLine = L.polyline(routeTrail, { color: "#ef4444", weight: 4, opacity: 0.75 }).addTo(map);
      } else {
        trailLine.setLatLngs(routeTrail);
      }
    }

    map.setView([v.position.latitude,v.position.longitude],15);

    const bearing = v.position.bearing || 0;

    if(marker) {
      marker.setLatLng([v.position.latitude,v.position.longitude]);
      // update rotation of img inside divIcon
      const el = marker.getElement && marker.getElement();
      if(el){
        const img = el.querySelector('img');
        if(img) img.style.transform = `rotate(${bearing}deg)`;
      }
    } else {
      marker = L.marker([v.position.latitude,v.position.longitude], { icon: busIcon })
        .addTo(map);
      // set initial rotation
      const el = marker.getElement && marker.getElement();
      if(el){
        const img = el.querySelector('img');
        if(img) img.style.transform = `rotate(${bearing}deg)`;
      }
    }

  }catch(e){
    if (requestToken !== realtimeRequestToken || id !== currentVehicleId) return;
    console.error(e);
    realtimeEl.innerHTML = t("realtimeError");
    mapEl.classList.add("hidden");
    lastUpdateEl.textContent = `${t("lastUpdate")}: -`;
    lastUpdateEl.hidden = true;
  } finally {
    if (requestToken === realtimeRequestToken && id === currentVehicleId) {
      setPageLoading(false);
    }
  }
}

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('sw.js')
    .catch(err => console.error('Service Worker registratie mislukt:', err));
}

verifyInternetConnection(true).catch(() => {});
startInternetChecks();

// Dark scheme preference listener
const prefersColorScheme = window.matchMedia("(prefers-color-scheme: dark)");
if (prefersColorScheme?.addEventListener) {
  prefersColorScheme.addEventListener("change", () => {
    if (window.settings && window.settings.theme === "auto") {
      if (window.updateSystemUiThemeColor) window.updateSystemUiThemeColor();
    }
  });
} else if (prefersColorScheme?.addListener) {
  prefersColorScheme.addListener(() => {
    if (window.settings && window.settings.theme === "auto") {
      if (window.updateSystemUiThemeColor) window.updateSystemUiThemeColor();
    }
  });
}
