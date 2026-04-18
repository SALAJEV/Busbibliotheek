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
const installBtn = document.getElementById("footerInstallBtn");
const dashboardToggleBtn = document.getElementById("dashboardToggleBtn");
const halteSearchToggleBtn = document.getElementById("halteSearchToggleBtn");
const settingsInfoBtn = document.getElementById("settingsInfoBtn");
const appShellEl = document.querySelector(".app-shell");
const favoritesBackdropEl = document.getElementById("favoritesBackdrop");
const favoritesToggleBtn = document.getElementById("favoritesToggleBtn");
const favoritesPanelEl = document.getElementById("favoritesPanel");
const favoritesPanelCloseBtn = document.getElementById("favoritesPanelCloseBtn");
const favoritesTopEl = document.querySelector(".favorites-top");
const headerActionsEl = document.querySelector(".header-actions");
const headerSearchRowEl = document.querySelector(".search-row");
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredPrompt = e;
  syncInstallButtonVisibility();
});
installBtn?.addEventListener("click", async () => {
  if (isAndroid6OrLower) {
    syncInstallButtonVisibility();
    return;
  }
  if (isAndroidAbove6) {
    await confirmAndStartDownload({
      downloadType: "apk",
      fileLabel: "Busbibliotheek.apk",
      onConfirm: () => startApkDownload()
    });
  } else if (deferredPrompt) {
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    console.log(`Gebruiker antwoord: ${outcome}`);
    deferredPrompt = null;
  } else if (isIosInstallable()) {
    showInstallGuideModal();
  } else if (isAndroidPlatform && !isStandaloneDisplayMode()) {
    await showAppAlert(getLabel("androidInstallHint", "Open het browsermenu op Android en kies 'Installeren' of 'Toevoegen aan startscherm'."));
  }
  syncInstallButtonVisibility();
});
window.addEventListener('appinstalled', () => {
  console.log('App succesvol geinstalleerd');
  hideInstallGuideModal();
  deferredPrompt = null;
  syncPlatformBodyClasses();
  syncInstallButtonVisibility();
});

function syncHeaderActionPlacement() {
  if (!favoritesTopEl || !headerActionsEl || !headerSearchRowEl || !window.matchMedia) return;
  const shouldInlineMenu = true;
  const targetParent = shouldInlineMenu ? headerSearchRowEl : headerActionsEl;
  if (favoritesTopEl.parentElement !== targetParent) {
    targetParent.appendChild(favoritesTopEl);
  }
  document.body.classList.toggle("menu-inline-search", shouldInlineMenu);
}

// Constants
const BASE_URL = "https://pub-611b5bc156eb455ba86d9bcece9aea1c.r2.dev";
const API_URL = "https://busbibliotheek95.pages.dev/api";
const PYTHON_MAIN_DOWNLOAD_URL = "https://busbibliotheek95.pages.dev/python/script.py";
const APK_DOWNLOAD_URL = `${window.location.origin}/android/app/release/app-release.apk`;
const PHOTO_UPLOAD_FORM_URL = "https://forms.gle/MLzezhEKqxg6xagm9";
const ZONE01_HERCULES_SEARCH_URL = "https://www.zone01.be/hercules/resultaten";
const LEAFLET_CSS_URL = "https://unpkg.com/leaflet/dist/leaflet.css";
const LEAFLET_JS_URL = "https://unpkg.com/leaflet/dist/leaflet.js";
const NETWORK_CHECK_URL = `${window.location.origin}/manifest.json?network-check=1`;
const NETWORK_CHECK_TIMEOUT_MS = 5000;
const NETWORK_CHECK_INTERVAL_MS = 30000;
const NETWORK_CHECK_CACHE_MS = 20000;
const WEATHER_CACHE_MS = 5 * 60 * 1000;
const FAVORITES_KEY = "bb_favorites_v1";
const SETTINGS_KEY = "bb_settings_v1";
const DASHBOARD_MAX_VEHICLES = 9;
let updateIntervalMs = 10000;

const voertuigInput = document.getElementById("voertuignummer");
const suggestieLijst = document.getElementById("suggestielijst");
const realtimeEl = document.getElementById("realtime");
const weatherBlockEl = document.getElementById("weatherBlock");
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
const platformUserAgent = window.navigator.userAgent || "";
const appleTouchDesktopPlatform =
  /Mac/i.test(window.navigator.platform || "") &&
  (window.navigator.maxTouchPoints || 0) > 1;
const isIosPlatform = /iPhone|iPad|iPod/i.test(platformUserAgent) || appleTouchDesktopPlatform;
const isAndroidPlatform = /Android/i.test(platformUserAgent);
const isAndroidWebView = isAndroidPlatform && /\bwv\b|Version\/[\d.]+/i.test(platformUserAgent);
const isAndroidTvPlatform = isAndroidPlatform && /(TV|AFT|BRAVIA|GoogleTV|SmartTV|HbbTV)/i.test(platformUserAgent);
const androidVersionMatch = platformUserAgent.match(/Android\s+(\d+(?:\.\d+)?)/i);
const androidVersion = androidVersionMatch ? Number(androidVersionMatch[1]) : NaN;
const isAndroid6OrLower = isAndroidPlatform && Number.isFinite(androidVersion) && androidVersion <= 6;
const isAndroidAbove6 = isAndroidPlatform && Number.isFinite(androidVersion) && androidVersion > 6;
let androidHostThemeMode = (document.documentElement.dataset.androidTheme || "").toLowerCase();
const touchPointerMediaQuery = window.matchMedia ? window.matchMedia("(hover: none), (pointer: coarse)") : null;
touchPointerMediaQuery?.addEventListener?.("change", syncPlatformBodyClasses);

function isStandaloneDisplayMode() {
  if (window.matchMedia?.("(display-mode: standalone)")?.matches) return true;
  if (window.matchMedia?.("(display-mode: fullscreen)")?.matches) return true;
  return Boolean(window.navigator.standalone);
}

function isTouchPlatform() {
  return Boolean(touchPointerMediaQuery?.matches || window.navigator.maxTouchPoints > 0);
}

function getViewportWidth() {
  return window.visualViewport?.width || window.innerWidth || document.documentElement.clientWidth || window.screen?.width || 0;
}

function getViewportHeight() {
  return window.visualViewport?.height || window.innerHeight || document.documentElement.clientHeight || window.screen?.height || 0;
}

function isTabletLikeViewport() {
  const shortSide = Math.min(getViewportWidth(), getViewportHeight());
  const longSide = Math.max(getViewportWidth(), getViewportHeight());
  return shortSide >= 720 || (shortSide >= 600 && longSide >= 960);
}

function isAndroidHostApp() {
  try {
    return /BusbibliotheekApp\//i.test(platformUserAgent) || typeof window.Android?.downloadFile === "function";
  } catch (_) {
    return /BusbibliotheekApp\//i.test(platformUserAgent);
  }
}

function supportsEnhancedDialogs() {
  try {
    if (!window.CSS || typeof window.CSS.supports !== "function") return false;
    if (!window.CSS.supports("position", "fixed")) return false;
    if (isAndroid6OrLower || isAndroidTvPlatform) return false;
    return true;
  } catch (_) {
    return false;
  }
}

function syncPlatformBodyClasses() {
  if (!document.body) return;
  const isStandalone = isStandaloneDisplayMode();
  const isHostApp = isAndroidHostApp();
  const isTablet = isTabletLikeViewport();
  const isLandscape = getViewportWidth() > getViewportHeight();
  document.body.classList.toggle("platform-touch", isTouchPlatform());
  document.body.classList.toggle("platform-ios", isIosPlatform);
  document.body.classList.toggle("platform-android", isAndroidPlatform);
  document.body.classList.toggle("platform-android-webview", isAndroidWebView);
  document.body.classList.toggle("platform-android-host-app", isHostApp);
  document.body.classList.toggle("platform-android-tv", isAndroidTvPlatform);
  document.body.classList.toggle("platform-tablet", isTablet);
  document.body.classList.toggle("platform-phone", !isTablet);
  document.body.classList.toggle("platform-landscape", isLandscape);
  document.body.classList.toggle("platform-portrait", !isLandscape);
  document.body.classList.toggle("platform-standalone", isStandalone);
  document.body.classList.toggle("platform-ios-standalone", isIosPlatform && isStandalone);
  document.body.classList.toggle("platform-android-standalone", isAndroidPlatform && isStandalone);
  document.body.classList.toggle("dialog-fallback", !supportsEnhancedDialogs());
}

function syncInstallButtonVisibility() {
  if (!installBtn) return;
  const shouldShow =
    !isStandaloneDisplayMode() &&
    !isAndroidWebView &&
    !isAndroidHostApp() &&
    !isAndroidTvPlatform &&
    (isAndroidAbove6 || Boolean(deferredPrompt) || isIosInstallable());
  installBtn.hidden = !shouldShow;
}

function updateAndroidViewportMetrics() {
  const visualViewport = window.visualViewport;
  const viewportHeight = visualViewport?.height || window.innerHeight || document.documentElement.clientHeight || 0;
  const viewportOffsetTop = visualViewport?.offsetTop || 0;
  const keyboardOffset = Math.max(0, (window.innerHeight || viewportHeight) - viewportHeight - viewportOffsetTop);
  document.documentElement.style.setProperty("--app-height", `${Math.round(viewportHeight)}px`);
  document.documentElement.style.setProperty("--visual-viewport-height", `${Math.round(viewportHeight)}px`);
  document.documentElement.style.setProperty("--visual-viewport-offset-top", `${Math.round(viewportOffsetTop)}px`);
  document.documentElement.style.setProperty("--keyboard-offset", `${Math.round(keyboardOffset)}px`);
  document.body?.classList.toggle("keyboard-open", isAndroidPlatform && keyboardOffset > 120);
}

function scheduleAndroidFocusedFieldIntoView() {
  if (!isAndroidPlatform) return;
  window.clearTimeout(androidKeyboardFocusHandle);
  androidKeyboardFocusHandle = window.setTimeout(() => {
    const activeElement = document.activeElement;
    if (!(activeElement instanceof HTMLElement)) return;
    if (!activeElement.matches("input, textarea, select")) return;
    const viewportHeight = window.visualViewport?.height || window.innerHeight || document.documentElement.clientHeight || 0;
    if (!viewportHeight) return;
    const rect = activeElement.getBoundingClientRect();
    const topInset = 18;
    const bottomInset = 18;
    const isFullyVisible = rect.top >= topInset && rect.bottom <= viewportHeight - bottomInset;
    if (isFullyVisible) return;
    activeElement.scrollIntoView({
      block: rect.top < topInset ? "start" : "nearest",
      inline: "nearest",
      behavior: "smooth"
    });
  }, 180);
}

function initAndroidViewportSupport() {
  if (androidViewportSyncInitialized) return;
  androidViewportSyncInitialized = true;
  const handleViewportUpdate = () => updateAndroidViewportMetrics();
  updateAndroidViewportMetrics();
  window.addEventListener("resize", handleViewportUpdate, { passive: true });
  window.addEventListener("orientationchange", handleViewportUpdate, { passive: true });
  window.visualViewport?.addEventListener("resize", handleViewportUpdate, { passive: true });
  window.visualViewport?.addEventListener("scroll", handleViewportUpdate, { passive: true });
  document.addEventListener("focusin", scheduleAndroidFocusedFieldIntoView);
  document.addEventListener("focusout", () => window.setTimeout(updateAndroidViewportMetrics, 60));
}

window.matchMedia?.("(display-mode: standalone)")?.addEventListener?.("change", () => {
  syncPlatformBodyClasses();
  syncInstallButtonVisibility();
});
window.matchMedia?.("(display-mode: fullscreen)")?.addEventListener?.("change", () => {
  syncPlatformBodyClasses();
  syncInstallButtonVisibility();
});
window.addEventListener("resize", syncPlatformBodyClasses, { passive: true });
window.addEventListener("orientationchange", syncPlatformBodyClasses, { passive: true });

const lastUpdateEl = document.getElementById("lastUpdate");
const appTitleBtnEl = document.getElementById("appTitleBtn");
const appTitleEl = document.getElementById("appTitle");
const appSubtitleEl = document.getElementById("appSubtitle");
const splashTitleEl = document.getElementById("splashTitle");
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
const vehiclePhotoFrameEl = vehiclePhotoCardEl?.querySelector(".vehicle-photo-frame");
const vehiclePhotoInfoEl = vehiclePhotoCardEl?.querySelector(".vehicle-photo-info");
let vehiclePhotoImgEl = document.getElementById("vehiclePhotoImg");
const vehiclePhotoPrevBtn = document.getElementById("vehiclePhotoPrevBtn");
const vehiclePhotoNextBtn = document.getElementById("vehiclePhotoNextBtn");
const vehiclePhotoCounterEl = document.getElementById("vehiclePhotoCounter");
const vehiclePhotoMetaEl = document.getElementById("vehiclePhotoMeta");
const vehiclePhotoCaptionEl = document.getElementById("vehiclePhotoCaption");
const vehiclePhotoEmptyStateEl = document.getElementById("vehiclePhotoEmptyState");
const vehiclePhotoEmptyBadgeEl = document.getElementById("vehiclePhotoEmptyBadge");
const vehiclePhotoEmptyTitleEl = document.getElementById("vehiclePhotoEmptyTitle");
const vehiclePhotoEmptyTextEl = document.getElementById("vehiclePhotoEmptyText");
const vehiclePhotoUploadBtn = document.getElementById("vehiclePhotoUploadBtn");
const disclaimerTitleEl = document.getElementById("disclaimerTitle");
const disclaimerTextEl = document.getElementById("disclaimerText");
const footerReviewBtn = document.getElementById("footerReviewBtn");
const footerTermsBtn = document.getElementById("footerTermsBtn");
const currentYearEl = document.getElementById("currentYear");
const infoModalEl = document.getElementById("infoModal");
const infoModalTitleEl = document.getElementById("infoModalTitle");
const infoModalBodyEl = document.getElementById("infoModalBody");
const infoModalSummaryEl = document.getElementById("infoModalSummary");
const infoModalCloseBtn = document.getElementById("infoModalCloseBtn");
const infoModalOkBtn = document.getElementById("infoModalOkBtn");
const resetSiteDataBtn = document.getElementById("resetSiteDataBtn");
const installGuideModalEl = document.getElementById("installGuideModal");
const installGuideTitleEl = document.getElementById("installGuideTitle");
const installGuideSummaryEl = document.getElementById("installGuideSummary");
const installGuideBodyEl = document.getElementById("installGuideBody");
const installGuideCloseBtn = document.getElementById("installGuideCloseBtn");
const installGuideOkBtn = document.getElementById("installGuideOkBtn");
const appDialogModalEl = document.getElementById("appDialogModal");
const appDialogCardEl = document.getElementById("appDialogCard");
const appDialogTitleEl = document.getElementById("appDialogTitle");
const appDialogMessageEl = document.getElementById("appDialogMessage");
const appDialogCloseBtn = document.getElementById("appDialogCloseBtn");
const appDialogCancelBtn = document.getElementById("appDialogCancelBtn");
const appDialogConfirmBtn = document.getElementById("appDialogConfirmBtn");
const reviewModalEl = document.getElementById("reviewModal");
const reviewModalTitleEl = document.getElementById("reviewModalTitle");
const reviewModalSummaryEl = document.getElementById("reviewModalSummary");
const reviewModalCloseBtn = document.getElementById("reviewModalCloseBtn");
const reviewModalDoneBtn = document.getElementById("reviewModalDoneBtn");
const reviewMobileLinkEl = document.getElementById("reviewMobileLink");
const photoUploadModalEl = document.getElementById("photoUploadModal");
const photoUploadModalTitleEl = document.getElementById("photoUploadModalTitle");
const photoUploadModalSummaryEl = document.getElementById("photoUploadModalSummary");
const photoUploadModalBadgeEl = document.getElementById("photoUploadModalBadge");
const photoUploadModalNoteEl = document.getElementById("photoUploadModalNote");
const photoUploadStep1El = document.getElementById("photoUploadStep1");
const photoUploadStep2El = document.getElementById("photoUploadStep2");
const photoUploadStep3El = document.getElementById("photoUploadStep3");
const photoUploadModalCloseBtn = document.getElementById("photoUploadModalCloseBtn");
const photoUploadModalDoneBtn = document.getElementById("photoUploadModalDoneBtn");
const photoUploadOpenLinkEl = document.getElementById("photoUploadOpenLink");
const termsModalEl = document.getElementById("termsModal");
const termsModalTitleEl = document.getElementById("termsModalTitle");
const termsModalSummaryEl = document.getElementById("termsModalSummary");
const termsModalBodyEl = document.getElementById("termsModalBody");
const termsModalCloseBtn = document.getElementById("termsModalCloseBtn");
const termsModalDoneBtn = document.getElementById("termsModalDoneBtn");
const weatherModalEl = document.getElementById("weatherModal");
const weatherModalTitleEl = document.getElementById("weatherModalTitle");
const weatherModalSummaryEl = document.getElementById("weatherModalSummary");
const weatherModalBodyEl = document.getElementById("weatherModalBody");
const weatherModalCloseBtn = document.getElementById("weatherModalCloseBtn");
const weatherModalDoneBtn = document.getElementById("weatherModalDoneBtn");
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
const compareModalNoteEl = document.getElementById("compareModalNote");
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
const dashboardTvSettingsEl = document.getElementById("dashboardTvSettings");
const dashboardTvSettingsTitleEl = document.getElementById("dashboardTvSettingsTitle");
const dashboardTvSettingsSummaryEl = document.getElementById("dashboardTvSettingsSummary");
const dashboardThemeLabelEl = document.getElementById("dashboardThemeLabel");
const dashboardThemeSelectEl = document.getElementById("dashboardThemeSelect");
const dashboardThemeAutoOptEl = document.getElementById("dashboardThemeAutoOpt");
const dashboardThemeLightOptEl = document.getElementById("dashboardThemeLightOpt");
const dashboardThemeDarkOptEl = document.getElementById("dashboardThemeDarkOpt");
const dashboardColorThemeLabelEl = document.getElementById("dashboardColorThemeLabel");
const dashboardColorThemeSelectEl = document.getElementById("dashboardColorThemeSelect");
const dashboardColorClassicOptEl = document.getElementById("dashboardColorClassicOpt");
const dashboardColorBlueOptEl = document.getElementById("dashboardColorBlueOpt");
const dashboardColorGreenOptEl = document.getElementById("dashboardColorGreenOpt");
const dashboardColorYellowOptEl = document.getElementById("dashboardColorYellowOpt");
const dashboardColorOrangeOptEl = document.getElementById("dashboardColorOrangeOpt");
const dashboardColorRedOptEl = document.getElementById("dashboardColorRedOpt");
const dashboardColorPurpleOptEl = document.getElementById("dashboardColorPurpleOpt");
const dashboardSetupGridEl = document.getElementById("dashboardSetupGrid");
const dashboardSetupSummaryEl = document.getElementById("dashboardSetupSummary");
const dashboardSetupErrorEl = document.getElementById("dashboardSetupError");
const dashboardSetupCloseBtn = document.getElementById("dashboardSetupCloseBtn");
const dashboardSetupCancelBtn = document.getElementById("dashboardSetupCancelBtn");
const dashboardSetupConfirmBtn = document.getElementById("dashboardSetupConfirmBtn");
const morePanelTitleEl = document.getElementById("morePanelTitle");
const haltModuleTitleEl = document.getElementById("haltModuleTitle");
const haltModuleDescriptionEl = document.getElementById("haltModuleDescription");
const haltSearchHelpEl = document.getElementById("haltSearchHelp");
const halteSearchModalEl = document.getElementById("halteSearchModal");
const halteSearchCloseBtn = document.getElementById("halteSearchCloseBtn");
const haltecodeInputEl = document.getElementById("haltecodeInput");
const haltecodeSearchBtn = document.getElementById("haltecodeSearchBtn");
const haltecodeErrorEl = document.getElementById("haltecodeError");
const haltSearchResultsListEl = document.getElementById("haltSearchResultsList");

let voertuigen = [];
let trips = [];
let routes = [];
let stops = [];
let voertuigenLoadPromise = null;
const stopsById = new Map();
const tripsById = new Map();
const tripsByRouteId = new Map();
const tripsByRouteKey = new Map();
const routesById = new Map();
const routesByKey = new Map();
const vehicleLookupById = new Map();
const vehicleLookupByPlate = new Map();
const vehicleLookupByHansea = new Map();
const vehicleLookupByLegacyId = new Map();
const vehicleLookupByLegacyPlate = new Map();
let vehicleSuggestionIndex = [];
let map, marker, refresh;
let trailLine = null;
let routeTrail = [];
let delayMinutes = 0;
let currentVehicleId = "";
let compareVehicleId = "";
let compareEditTarget = "compare";
let dashboardVehicleIds = [];
let dashboardRefreshHandle = null;
let dashboardMap = null;
let dashboardMapMarkers = null;
let currentPhotoVehicleId = "";
let currentVehiclePhotoEntries = [];
let currentVehiclePhotoIndex = 0;
let favorites = [];
let favoritesPanelOpen = false;
let favoritesPanelRestoreFocusEl = null;
let feedEndDateValue = "";
let vehiclesSourceUpdatedAt = "";
let vehiclePhotoLookupToken = 0;
const photoCaptureDateCache = new Map();
const photoExifMetadataCache = new Map();
const photoReverseGeocodeCache = new Map();
const PHOTO_REVERSE_GEOCODE_URL = "https://nominatim.openstreetmap.org/reverse";
const PHOTO_TRANSIT_POI_URL = "https://overpass-api.de/api/interpreter";
const PHOTO_REVERSE_GEOCODE_TIMEOUT_MS = 5000;
const PHOTO_TRANSIT_POI_TIMEOUT_MS = 5000;
const PHOTO_TRANSIT_POI_RADIUS_METERS = 250;
const PHOTO_REVERSE_GEOCODE_MIN_INTERVAL_MS = 1100;
let photoReverseGeocodeQueue = Promise.resolve();
let photoReverseGeocodeLastRequestAt = 0;
let vehiclePlateFieldKey = "";
let oldVehicleNumbersFieldKey = "";
let oldLicensePlatesFieldKey = "";
let vehicleHideVinFieldKey = "";
const INACTIVITY_LIMIT_MS = 5 * 60 * 1000;
const INACTIVITY_CHECK_MS = 15000;
let lastUserInteractionAt = Date.now();
let realtimePausedByInactivity = false;
let deeplinkHandled = false;
let routeNavigationLocked = false;
let injectedInitialHomeHistoryState = false;
const APP_VERSION = "2026.04.17-1";
const dataLoadTimestamps = {
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
let lastVerifiedInternetAt = 0;
let lastVerifiedInternetState = true;
let realtimeRequestToken = 0;
let dashboardRequestToken = 0;
let latestSearchToken = 0;
let weatherRequestToken = 0;
let lastWeatherCacheKey = "";
let lastWeatherData = null;
let lastWeatherCoordinates = null;
let lastWeatherFetchedAt = 0;
let activeVehicleSuggestionInput = null;
let favoriteDragState = null;
let favoriteDragSuppressUntil = 0;
const overlayModalElements = [];
const overlayModalRestoreFocusMap = new WeakMap();
let interactiveOverlayStack = [];
let appDialogResolve = null;
const usesOverlayCompatibilityMode = () =>
  isAndroidHostApp() ||
  isAndroidWebView ||
  isAndroidTvPlatform;
const KNOWN_PHOTOGRAPHER_FOLDERS = [
  "Busspotter 95",
  "Robin Van de Ven",
  "@dln.spotter",
  "@delijn821",
  "@delijn_spotter",
  "@delijn_spotter_mori",
  "@spotter_ov",
  "Arno Janssens"
];
// Generated from the current contents of media/bus on 2026-04-10.
const PHOTO_LIBRARY_INDEX = {
  "2015": [
    "Robin Van de Ven/2015.jpeg",
  ],
  "2017": [
    "Robin Van de Ven/2017.jpeg",
  ],
  "2032": [
    "@delijn_spotter_mori/2032.jpeg",
  ],
  "2039": [
    "@delijn_spotter_mori/2039.jpeg",
  ],
  "2085": [
    "Robin Van de Ven/2085.jpeg",
  ],
  "2193": [
    "Robin Van de Ven/2193.jpeg",
  ],
  "2228": [
    "Robin Van de Ven/2228.jpeg",
  ],
  "2357": [
    "Robin Van de Ven/2357.jpeg",
  ],
  "2362": [
    "Robin Van de Ven/2362.jpeg",
  ],
  "2520": [
    "Robin Van de Ven/2520.jpeg",
  ],
  "2591": [
    "Robin Van de Ven/2591.jpeg",
  ],
  "2647": [
    "@delijn_spotter_mori/2647.jpeg",
  ],
  "2889": [
    "Busspotter 95/2889.jpeg",
  ],
  "2890": [
    "Busspotter 95/2890.jpeg",
  ],
  "2894": [
    "Busspotter 95/2894.jpeg",
  ],
  "2916": [
    "@delijn_spotter_mori/2916.jpeg",
  ],
  "2917": [
    "@delijn_spotter_mori/2917.jpeg",
  ],
  "2953": [
    "Robin Van de Ven/2953.jpeg",
  ],
  "2956": [
    "Robin Van de Ven/2956.jpeg",
  ],
  "2979": [
    "Robin Van de Ven/2979.jpeg",
  ],
  "2982": [
    "Robin Van de Ven/2982.jpeg",
  ],
  "3015": [
    "Robin Van de Ven/3015.jpeg",
  ],
  "3025": [
    "Robin Van de Ven/3025.jpeg",
  ],
  "3087": [
    "@delijn_spotter_mori/3087.jpeg",
  ],
  "3091": [
    "Robin Van de Ven/3091.jpeg",
  ],
  "3120": [
    "Robin Van de Ven/3120.jpeg",
  ],
  "441315": [
    "Robin Van de Ven/441315.jpeg",
  ],
  "4457": [
    "Robin Van de Ven/4457.jpeg",
  ],
  "4534": [
    "@delijn_spotter_mori/4534.jpeg",
  ],
  "4575": [
    "Robin Van de Ven/4575.jpeg",
  ],
  "4588": [
    "@delijn_spotter_mori/4588.jpeg",
  ],
  "4660": [
    "Robin Van de Ven/4660.jpeg",
  ],
  "4686": [
    "@delijn_spotter_mori/4686.jpeg",
  ],
  "4804": [
    "@delijn_spotter_mori/4804.jpeg",
  ],
  "4864": [
    "Robin Van de Ven/4864.jpeg",
  ],
  "4952": [
    "Robin Van de Ven/4952.jpeg",
  ],
  "4977": [
    "Robin Van de Ven/4977.jpeg",
  ],
  "5003": [
    "Robin Van de Ven/5003.jpeg",
  ],
  "5020": [
    "@delijn_spotter_mori/5020.jpeg",
  ],
  "502606": [
    "Busspotter 95/502606.jpeg",
  ],
  "5089": [
    "@delijn_spotter_mori/5089.jpeg",
  ],
  "5282": [
    "@delijn_spotter_mori/5282.jpeg",
  ],
  "5299": [
    "Robin Van de Ven/5299.jpeg",
  ],
  "5341": [
    "@delijn_spotter_mori/5341.jpeg",
  ],
  "5343": [
    "Robin Van de Ven/5343.jpeg",
  ],
  "5409": [
    "Robin Van de Ven/5409.jpeg",
  ],
  "550529": [
    "Busspotter 95/550529.jpeg",
  ],
  "5508": [
    "Robin Van de Ven/5508.jpeg",
  ],
  "550820": [
    "@dln.spotter/550820.jpeg",
  ],
  "550951": [
    "Busspotter 95/550951.jpeg",
  ],
  "5544": [
    "@delijn_spotter_mori/5544.jpeg",
  ],
  "5563": [
    "@delijn_spotter_mori/5563.jpeg",
  ],
  "5577": [
    "Robin Van de Ven/5577.jpeg",
  ],
  "5643": [
    "Robin Van de Ven/5643.jpeg",
  ],
  "5738": [
    "Robin Van de Ven/5738.jpeg",
  ],
  "5786": [
    "@delijn_spotter_mori/5786.jpeg",
  ],
  "5882": [
    "@delijn_spotter_mori/5882.jpeg",
  ],
  "5895": [
    "@delijn_spotter_mori/5895.jpeg",
  ],
  "5906": [
    "@delijn_spotter_mori/5906.jpeg",
  ],
  "618097": [
    "@dln.spotter/618097.jpeg",
  ],
  "6211": [
    "@delijn_spotter_mori/6211.jpeg",
  ],
  "643043": [
    "@dln.spotter/643043.jpeg",
  ],
  "644081": [
    "@dln.spotter/644081.jpeg",
  ],
  "646074": [
    "Busspotter 95/646074.jpeg",
  ],
  "646075": [
    "Robin Van de Ven/646075.jpeg",
  ],
  "646079": [
    "@dln.spotter/646079 (1).jpeg",
  ],
  "646086": [
    "@dln.spotter/646086.jpeg",
  ],
  "647017": [
    "Robin Van de Ven/647017.jpeg",
  ],
  "649014": [
    "Robin Van de Ven/649014.jpeg",
  ],
  "652034": [
    "@dln.spotter/652034.jpeg",
  ],
  "656087": [
    "Robin Van de Ven/656087.jpeg",
  ],
  "660044": [
    "Robin Van de Ven/660044.jpeg",
  ],
  "660045": [
    "Robin Van de Ven/660045.jpeg",
  ],
  "660046": [
    "@dln.spotter/660046.jpeg",
  ],
  "669018": [
    "Robin Van de Ven/669018.jpeg",
  ],
  "674113": [
    "Robin Van de Ven/674113.jpeg",
  ],
  "678115": [
    "Robin Van de Ven/678115.jpeg",
  ],
  "678130": [
    "Robin Van de Ven/678130.jpeg",
  ],
  "678132": [
    "Robin Van de Ven/678132.jpeg",
  ],
  "678163": [
    "Robin Van de Ven/678163.jpeg",
  ],
  "689029": [
    "Robin Van de Ven/689029.jpeg",
  ],
  "689040": [
    "Busspotter 95/689040.jpeg",
  ],
  "689043": [
    "Busspotter 95/689043.jpeg",
  ],
  "689047": [
    "@dln.spotter/689047 (1).jpeg",
  ],
  "7133": [
    "@delijn_spotter_mori/7133.jpeg",
  ],
  "7136": [
    "@delijn_spotter_mori/7136.jpeg",
  ],
  "7158": [
    "@delijn_spotter_mori/7158.jpeg",
  ],
  "7202": [
    "@delijn_spotter_mori/7202.jpeg",
  ],
  "7212": [
    "@delijn_spotter_mori/7212.jpeg",
  ],
  "7215": [
    "@delijn_spotter_mori/7215.jpeg",
  ],
  "7237": [
    "@delijn_spotter_mori/7237.jpeg",
  ],
  "7340": [
    "@delijn_spotter_mori/7340.jpeg",
  ],
};

function registerOverlayModal(modalEl) {
  if (!modalEl || overlayModalElements.includes(modalEl)) return;
  modalEl.setAttribute("aria-hidden", String(modalEl.hidden));
  if ("inert" in modalEl) {
    if (usesOverlayCompatibilityMode()) {
      modalEl.inert = false;
      modalEl.removeAttribute("inert");
    } else {
      modalEl.inert = !!modalEl.hidden;
    }
  }
  overlayModalElements.push(modalEl);
}

[
  pdfModalEl,
  compareModalEl,
  dashboardSetupModalEl,
  infoModalEl,
  installGuideModalEl,
  appDialogModalEl,
  halteSearchModalEl,
  reviewModalEl,
  photoUploadModalEl,
  termsModalEl,
  weatherModalEl,
  funnyModalEl
].forEach(registerOverlayModal);

if ("inert" in favoritesPanelEl) {
  if (usesOverlayCompatibilityMode()) {
    favoritesPanelEl.inert = false;
    favoritesPanelEl.removeAttribute("inert");
  } else {
    favoritesPanelEl.inert = true;
  }
}

function isOverlayOpen(overlayEl) {
  if (!overlayEl) return false;
  if (overlayEl === favoritesBackdropEl) return favoritesPanelOpen && !favoritesBackdropEl.hidden;
  return !overlayEl.hidden;
}

function pushInteractiveOverlay(overlayEl) {
  if (!overlayEl) return;
  interactiveOverlayStack = interactiveOverlayStack.filter((entry) => entry && entry !== overlayEl);
  interactiveOverlayStack.push(overlayEl);
}

function removeInteractiveOverlay(overlayEl) {
  if (!overlayEl) return;
  interactiveOverlayStack = interactiveOverlayStack.filter((entry) => entry && entry !== overlayEl);
}

function getTopInteractiveOverlay() {
  interactiveOverlayStack = interactiveOverlayStack.filter((overlayEl) => isOverlayOpen(overlayEl));
  return interactiveOverlayStack.length ? interactiveOverlayStack[interactiveOverlayStack.length - 1] : null;
}

function getInteractiveOverlayFocusScope(overlayEl) {
  if (!overlayEl) return null;
  if (overlayEl === favoritesBackdropEl) return favoritesPanelEl || favoritesBackdropEl;
  return overlayEl.querySelector(".pdf-modal-card, .funny-modal-card, .menu-sheet") || overlayEl.firstElementChild || overlayEl;
}

function isFocusableCandidate(element) {
  if (!(element instanceof HTMLElement)) return false;
  if (element.hasAttribute("disabled")) return false;
  if (element.getAttribute("aria-hidden") === "true") return false;
  if (element.hidden) return false;
  if (element.closest("[hidden], [inert]")) return false;
  return element.getClientRects().length > 0;
}

function getInteractiveOverlayFocusableElements(overlayEl) {
  const scopeEl = getInteractiveOverlayFocusScope(overlayEl);
  if (!scopeEl) return [];
  return Array.from(
    scopeEl.querySelectorAll("button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex='-1'])")
  ).filter((element) => isFocusableCandidate(element));
}

function focusInteractiveOverlay(overlayEl, preferredTarget = null) {
  const scopeEl = getInteractiveOverlayFocusScope(overlayEl);
  if (!(scopeEl instanceof HTMLElement)) return;
  const focusableElements = getInteractiveOverlayFocusableElements(overlayEl);
  const preferredIsValid =
    preferredTarget instanceof HTMLElement &&
    (preferredTarget === scopeEl || scopeEl.contains(preferredTarget)) &&
    isFocusableCandidate(preferredTarget);
  const nextFocusTarget = preferredIsValid
    ? preferredTarget
    : (focusableElements[0] instanceof HTMLElement ? focusableElements[0] : scopeEl);
  if (nextFocusTarget === scopeEl && !scopeEl.hasAttribute("tabindex")) {
    scopeEl.setAttribute("tabindex", "-1");
  }
  window.setTimeout(() => {
    try {
      nextFocusTarget.focus({ preventScroll: true });
    } catch (_) {
      nextFocusTarget.focus();
    }
  }, 30);
}

function syncOverlayModalBodyState() {
  const hasPdfStyleModalOpen = overlayModalElements.some((modalEl) =>
    modalEl &&
    !modalEl.hidden &&
    modalEl !== funnyModalEl
  );
  const hasFunnyModalOpen = Boolean(funnyModalEl && !funnyModalEl.hidden);
  document.body.classList.toggle("pdf-modal-open", hasPdfStyleModalOpen);
  document.body.classList.toggle("funny-open", hasFunnyModalOpen);
}

function syncInteractiveOverlayState() {
  const activeOverlayEl = getTopInteractiveOverlay();
  document.body.classList.toggle("overlay-open", !!activeOverlayEl);
  document.body.classList.toggle("overlay-compat-mode", usesOverlayCompatibilityMode());

  if (appShellEl) {
    Array.from(appShellEl.children).forEach((childEl) => {
      if (!(childEl instanceof HTMLElement) || !("inert" in childEl)) return;
      if (usesOverlayCompatibilityMode()) {
        childEl.inert = false;
        childEl.removeAttribute("inert");
      } else {
        childEl.inert = !!activeOverlayEl && childEl !== activeOverlayEl;
      }
    });
  }

  overlayModalElements.forEach((modalEl) => {
    if (!modalEl || !("inert" in modalEl)) return;
    if (usesOverlayCompatibilityMode()) {
      modalEl.inert = false;
      modalEl.removeAttribute("inert");
      return;
    }
    modalEl.inert = modalEl.hidden || modalEl !== activeOverlayEl;
  });

  if (favoritesPanelEl && "inert" in favoritesPanelEl) {
    if (usesOverlayCompatibilityMode()) {
      favoritesPanelEl.inert = false;
      favoritesPanelEl.removeAttribute("inert");
    } else {
      favoritesPanelEl.inert = !favoritesPanelOpen || activeOverlayEl !== favoritesBackdropEl;
    }
  }
}

function openOverlayModal(modalEl, options = {}) {
  if (!modalEl) return;
  const {
    focusTarget = null,
    closeMenu = true
  } = options;
  if (closeMenu) setFavoritesPanel(false);
  overlayModalRestoreFocusMap.set(
    modalEl,
    document.activeElement instanceof HTMLElement ? document.activeElement : null
  );
  modalEl.hidden = false;
  modalEl.setAttribute("aria-hidden", "false");
  modalEl.setAttribute("data-overlay-state", "open");
  modalEl.classList.add("is-open");
  modalEl.style.display = "grid";
  if (usesOverlayCompatibilityMode()) {
    modalEl.style.visibility = "visible";
    modalEl.style.opacity = "1";
    modalEl.style.pointerEvents = "auto";
  }
  if ("inert" in modalEl) modalEl.inert = false;
  pushInteractiveOverlay(modalEl);
  syncOverlayModalBodyState();
  syncInteractiveOverlayState();
  window.requestAnimationFrame(() => focusInteractiveOverlay(modalEl, focusTarget));
}

function closeOverlayModal(modalEl, options = {}) {
  if (!modalEl) return;
  const { onAfterClose = null, restoreFocus = true } = options;
  const restoreTarget = overlayModalRestoreFocusMap.get(modalEl);
  overlayModalRestoreFocusMap.delete(modalEl);
  modalEl.classList.remove("is-open");
  modalEl.setAttribute("aria-hidden", "true");
  modalEl.removeAttribute("data-overlay-state");
  modalEl.style.removeProperty("display");
  modalEl.style.removeProperty("visibility");
  modalEl.style.removeProperty("opacity");
  modalEl.style.removeProperty("pointer-events");
  modalEl.hidden = true;
  if ("inert" in modalEl) modalEl.inert = true;
  removeInteractiveOverlay(modalEl);
  syncOverlayModalBodyState();
  syncInteractiveOverlayState();
  if (typeof onAfterClose === "function") onAfterClose();
  if (restoreFocus && restoreTarget instanceof HTMLElement && restoreTarget.isConnected && isFocusableCandidate(restoreTarget)) {
    window.requestAnimationFrame(() => {
      try {
        restoreTarget.focus({ preventScroll: true });
      } catch (_) {
        restoreTarget.focus();
      }
    });
    return;
  }
  const activeOverlayEl = getTopInteractiveOverlay();
  if (activeOverlayEl) {
    window.requestAnimationFrame(() => focusInteractiveOverlay(activeOverlayEl));
    return;
  }
  if (restoreFocus && favoritesToggleBtn instanceof HTMLElement && isFocusableCandidate(favoritesToggleBtn)) {
    window.requestAnimationFrame(() => {
      try {
        favoritesToggleBtn.focus({ preventScroll: true });
      } catch (_) {
        favoritesToggleBtn.focus();
      }
    });
  }
}

function isDashboardPanelOpen() {
  return !!dashboardPanelEl && !dashboardPanelEl.hidden;
}

function closeTransientOverlays() {
  setFavoritesPanel(false);
  hideDashboardSetupModal();
  hidePdfModal();
  hideCompareModal();
  hideInfoModal();
  hideInstallGuideModal();
  closeAppDialog(false, { restoreFocus: false });
  hideWeatherModal();
  hideReviewModal();
  hidePhotoUploadModal();
  hideTermsModal();
  hideFunnyModal();
  hideHalteSearchModal();
}

function getRouteStateFromLocation() {
  const params = new URLSearchParams(window.location.search);
  const bus = normalize(params.get("bus") || "");
  const compare = normalize(params.get("compare") || "");
  const view = params.get("view") === "stalk" ? "stalk" : (bus ? "vehicle" : "home");
  return {
    view,
    bus,
    compare: bus ? compare : ""
  };
}

function getCurrentRouteState() {
  return {
    view: isDashboardPanelOpen() ? "stalk" : (currentVehicleId ? "vehicle" : "home"),
    bus: currentVehicleId || "",
    compare: currentVehicleId ? (compareVehicleId || "") : ""
  };
}

function buildUrlForRouteState(routeState = {}) {
  const normalizedState = {
    view: routeState.view === "stalk" ? "stalk" : routeState.bus ? "vehicle" : "home",
    bus: normalize(routeState.bus || ""),
    compare: normalize(routeState.compare || "")
  };
  const url = new URL(window.location.href);

  if (normalizedState.bus) url.searchParams.set("bus", normalizedState.bus);
  else url.searchParams.delete("bus");

  if (normalizedState.bus && normalizedState.compare) url.searchParams.set("compare", normalizedState.compare);
  else url.searchParams.delete("compare");

  if (normalizedState.view === "stalk") url.searchParams.set("view", "stalk");
  else url.searchParams.delete("view");

  return `${url.pathname}${url.search}${url.hash}`;
}

function routeStatesEqual(a, b) {
  return (
    (a?.view || "home") === (b?.view || "home") &&
    normalize(a?.bus || "") === normalize(b?.bus || "") &&
    normalize(a?.compare || "") === normalize(b?.compare || "")
  );
}

function updateUrlState(mode = "replace") {
  if (routeNavigationLocked) return;
  const currentState = getCurrentRouteState();
  const locationState = getRouteStateFromLocation();
  const nextUrl = buildUrlForRouteState(currentState);
  const historyState = {
    bbRoute: true,
    view: currentState.view,
    bus: currentState.bus,
    compare: currentState.compare
  };
  const shouldPush = mode === "push" && !routeStatesEqual(currentState, locationState);
  window.history[shouldPush ? "pushState" : "replaceState"](historyState, "", nextUrl);
}

function initializeRouteHistory() {
  if (injectedInitialHomeHistoryState) return;
  injectedInitialHomeHistoryState = true;
  const routeState = getRouteStateFromLocation();
  if (routeState.view === "home") {
    updateUrlState("replace");
    return;
  }

  const currentUrl = buildUrlForRouteState(routeState);
  const homeState = { bbRoute: true, view: "home", bus: "", compare: "" };
  window.history.replaceState(homeState, "", buildUrlForRouteState(homeState));
  window.history.pushState({
    bbRoute: true,
    view: routeState.view,
    bus: routeState.bus,
    compare: routeState.compare
  }, "", currentUrl);
}

let dashboardSetupValidation = [];
let dashboardSetupDraftValues = [];
let dashboardSetupDraftResolvedIds = [];
let dashboardAutoStarted = false;
let leafletLoadPromise = null;
let busIcon = null;
let androidViewportSyncInitialized = false;
let androidKeyboardFocusHandle = 0;
let settings = {
  intervalMs: 10000,
  theme: "auto",
  colorTheme: "classic",
  language: "nl",
  dashboardVehicleIds: []
};
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
const ALLOWED_COLOR_THEMES = ["classic", "blue", "green", "yellow", "orange", "red", "purple"];
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
  blauw: {
    pageBg: "#eff6ff",
    badgeBg: "linear-gradient(135deg, #93c5fd, #dbeafe)",
    badgeFg: "#1d4ed8",
    accent: "#93c5fd",
    accentSoft: "#bfdbfe",
    cardLine: "#dbeafe"
  },
  groen: {
    pageBg: "#eefbf2",
    badgeBg: "linear-gradient(135deg, #bbf7d0, #dcfce7)",
    badgeFg: "#166534",
    accent: "#86efac",
    accentSoft: "#bbf7d0",
    cardLine: "#d9fbe4"
  },
  geel: {
    pageBg: "#fff8db",
    badgeBg: "linear-gradient(135deg, #fde68a, #fef3c7)",
    badgeFg: "#92400e",
    accent: "#f4d67a",
    accentSoft: "#f3e2a5",
    cardLine: "#f8edbf"
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

function normalizeDashboardVehicleIds(ids) {
  if (!Array.isArray(ids)) return [];
  return ids
    .map((id) => normalize(id))
    .filter(Boolean)
    .slice(0, DASHBOARD_MAX_VEHICLES);
}

function persistDashboardVehicleIds(ids) {
  dashboardVehicleIds = normalizeDashboardVehicleIds(ids);
  settings.dashboardVehicleIds = [...dashboardVehicleIds];
  saveSettings();
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

function openExternalUrl(url, options = {}) {
  const {
    preferSameTab = false,
    forceSameTab = false
  } = options;
  const targetUrl = String(url || "").trim();
  if (!targetUrl) return false;

  const shouldUseSameTab =
    forceSameTab ||
    (preferSameTab && (
      isTouchPlatform() ||
      isStandaloneDisplayMode() ||
      isAndroidWebView ||
      isAndroidHostApp()
    ));

  if (shouldUseSameTab) {
    window.location.assign(targetUrl);
    return true;
  }

  const openedWindow = window.open(targetUrl, "_blank", "noopener,noreferrer");
  if (openedWindow && typeof openedWindow.focus === "function") {
    try {
      openedWindow.focus();
    } catch (_) {
      // Ignore focus errors from strict browser contexts.
    }
    return true;
  }

  window.location.assign(targetUrl);
  return true;
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

function parseVehiclesSourceUpdatedAt(text = "") {
  const firstLine = text.split(/\r?\n/, 1)[0]?.trim() || "";
  if (!firstLine.startsWith("#")) return "";
  const rawDate = firstLine.slice(1).trim();
  if (!rawDate) return "";
  return formatDateForUi(rawDate, {
    day: "numeric",
    month: "long",
    year: "numeric"
  });
}

function showInfoModal() {
  if (!infoModalEl || !infoModalBodyEl) return;
  const rows = [
    [getLabel("infoWebsiteVersion", "Websiteversie"), APP_VERSION],
    [getLabel("infoVehicles", "Voertuiginformatie"), vehiclesSourceUpdatedAt || getLabel("notLoadedYet", "Nog niet geladen")],
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
  openOverlayModal(infoModalEl, { focusTarget: infoModalCloseBtn });
}

function hideInfoModal() {
  closeOverlayModal(infoModalEl);
}

function renderInstallGuideModalContent() {
  if (!installGuideBodyEl) return;
  const steps = [
    getLabel("installGuideStep1", "Open deze site in Safari."),
    getLabel("installGuideStep2", "Tik onderaan op 'Deel'."),
    getLabel("installGuideStep3", "Scroll in het deelmenu en kies 'Zet op beginscherm'."),
    getLabel("installGuideStep4", "Tik rechtsboven op 'Voeg toe'.")
  ];
  const note = getLabel("installGuideNote", "Gebruik je een andere browser op iPhone? Open deze pagina dan eerst in Safari.");
  installGuideBodyEl.innerHTML = `
    <div class="install-guide-copy">
      <ol class="install-guide-steps">
        ${steps.map((step) => `<li>${escapeHtml(step)}</li>`).join("")}
      </ol>
      <p class="install-guide-note">${escapeHtml(note)}</p>
    </div>
  `;
}

function showInstallGuideModal() {
  if (!installGuideModalEl) {
    void showAppAlert(getLabel("iosHint", "Op iPhone/iPad: tik op 'Deel' en kies 'Zet op beginscherm'."));
    return;
  }
  renderInstallGuideModalContent();
  openOverlayModal(installGuideModalEl, { focusTarget: installGuideCloseBtn });
}

function hideInstallGuideModal() {
  closeOverlayModal(installGuideModalEl);
}

function resolveAppDialog(result = false) {
  const resolve = appDialogResolve;
  appDialogResolve = null;
  if (typeof resolve === "function") resolve(result);
}

function closeAppDialog(result = false, options = {}) {
  if (!appDialogModalEl) {
    resolveAppDialog(result);
    return;
  }
  if (appDialogModalEl.hidden) {
    resolveAppDialog(result);
    return;
  }
  closeOverlayModal(appDialogModalEl, {
    restoreFocus: options.restoreFocus ?? true,
    onAfterClose: () => resolveAppDialog(result)
  });
}

function showAppDialog(options = {}) {
  const {
    kind = "alert",
    title = getLabel(kind === "confirm" ? "dialogConfirmTitle" : "dialogInfoTitle", kind === "confirm" ? "Bevestiging" : "Melding"),
    message = "",
    confirmLabel = getLabel("dialogOk", "OK"),
    cancelLabel = getLabel("cancel", "Annuleren")
  } = options;

  if (!appDialogModalEl || !appDialogTitleEl || !appDialogMessageEl || !appDialogConfirmBtn || !appDialogCancelBtn) {
    if (kind === "confirm") return Promise.resolve(window.confirm(message));
    window.alert(message);
    return Promise.resolve(true);
  }

  if (appDialogResolve) resolveAppDialog(false);
  if (!appDialogModalEl.hidden) {
    closeOverlayModal(appDialogModalEl, { restoreFocus: false });
  }

  if (appDialogCardEl) appDialogCardEl.dataset.dialogKind = kind;
  appDialogTitleEl.textContent = title;
  appDialogMessageEl.textContent = message;
  appDialogCancelBtn.hidden = kind !== "confirm";
  appDialogCancelBtn.textContent = cancelLabel;
  appDialogConfirmBtn.textContent = confirmLabel;

  return new Promise((resolve) => {
    appDialogResolve = resolve;
    openOverlayModal(appDialogModalEl, {
      focusTarget: appDialogConfirmBtn
    });
  });
}

function showAppAlert(message, options = {}) {
  return showAppDialog({
    kind: "alert",
    message,
    ...options
  });
}

function showAppConfirm(message, options = {}) {
  return showAppDialog({
    kind: "confirm",
    message,
    ...options
  });
}

function showHalteSearchModal() {
  if (!halteSearchModalEl) return;
  halteSearchRequestToken += 1;
  setHalteStatus("");
  clearHalteSearchResults();
  openOverlayModal(halteSearchModalEl, { focusTarget: haltecodeInputEl });
  void laadStops().catch((error) => {
    console.warn("Haltes vooraf laden mislukt", error);
  });
}

function hideHalteSearchModal() {
  closeOverlayModal(halteSearchModalEl);
}

function shouldOpenExternalFormExperience() {
  return (
    isAndroidPlatform ||
    isTouchPlatform() ||
    (window.matchMedia?.("(max-width: 700px)")?.matches ?? false)
  );
}

function showReviewModal() {
  if (!reviewModalEl) return;
  const shouldOpenExternally = shouldOpenExternalFormExperience();

  if (shouldOpenExternally && reviewMobileLinkEl?.href) {
    openExternalUrl(reviewMobileLinkEl.href, { preferSameTab: true });
    return;
  }

  openOverlayModal(reviewModalEl, { focusTarget: reviewModalCloseBtn });
}

function hideReviewModal() {
  closeOverlayModal(reviewModalEl);
}

function showPhotoUploadModal() {
  if (!photoUploadModalEl) return;
  updatePhotoUploadCopy(currentPhotoVehicleId);
  if (shouldOpenExternalFormExperience()) {
    openExternalUrl(PHOTO_UPLOAD_FORM_URL, { preferSameTab: true });
    return;
  }
  openOverlayModal(photoUploadModalEl, { focusTarget: photoUploadOpenLinkEl || photoUploadModalCloseBtn });
}

function hidePhotoUploadModal() {
  closeOverlayModal(photoUploadModalEl);
}

function renderTermsModalContent() {
  if (!termsModalBodyEl) return;
  const sections = [
    {
      title: getLabel("termsSectionUse", "Gebruik van de website"),
      body: getLabel("termsUseBody", "Busbibliotheek is bedoeld voor informatief persoonlijk gebruik. Misbruik, overbelasting van de site of gebruik in strijd met de wet is niet toegestaan.")
    },
    {
      title: getLabel("termsSectionData", "Realtime en juistheid"),
      body: getLabel("termsDataBody", "Realtimegegevens, voertuiginfo en andere inhoud worden zo goed mogelijk getoond, maar kunnen vertragingen, fouten of onvolledigheden bevatten. Aan de inhoud kunnen geen rechten worden ontleend.")
    },
    {
      title: getLabel("termsSectionPhotos", "Externe links en media"),
      body: getLabel("termsPhotosBody", "Sommige knoppen openen externe websites zoals Instagram of Google Forms. Die diensten hebben hun eigen voorwaarden, kunnen anders werken op smartphone en kunnen vereisen dat je bent ingelogd.")
    },
    {
      title: getLabel("termsSectionPrivacy", "Privacy en contact"),
      body: getLabel("termsPrivacyBody", "Als je vrijwillig feedback of een review indient, gebeurt dat via externe formulieren. Deel geen gevoelige persoonsgegevens tenzij dat echt nodig is.")
    }
  ];
  termsModalBodyEl.innerHTML = `
    <div class="legal-copy">
      ${sections.map((section) => `
        <h4>${escapeHtml(section.title)}</h4>
        <p>${escapeHtml(section.body)}</p>
      `).join("")}
    </div>
  `;
}

function showTermsModal() {
  if (!termsModalEl) return;
  renderTermsModalContent();
  openOverlayModal(termsModalEl, { focusTarget: termsModalCloseBtn });
}

function hideTermsModal() {
  closeOverlayModal(termsModalEl);
}

function updateDocumentTitle(vehicleId = "") {
  const normalizedVehicleId = getVehicleDisplayId(vehicleId || currentVehicleId);
  document.title = normalizedVehicleId
    ? `${getLabel("vehicleTitlePrefix", "Voertuig")} ${normalizedVehicleId}`
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
      key: normalizeFieldKey(fieldKey),
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
    pdfModalSummaryEl.textContent = `${getVehicleDisplayId(bus) || bus.Voertuignummer} · ${bus.Type || getLabel("unknownType", "Onbekend type")} · ${owner}`;
  }
  openOverlayModal(pdfModalEl, { focusTarget: pdfModalCloseBtn });
}

function hidePdfModal() {
  pdfModalVehicleId = "";
  closeOverlayModal(pdfModalEl);
}

function showCompareModal() {
  if (!currentVehicleId || !compareModalEl) return;
  compareEditTarget = "compare";
  compareVehicleInputEl.value = "";
  setVehicleInputResolvedId(compareVehicleInputEl, "");
  openOverlayModal(compareModalEl, { focusTarget: compareVehicleInputEl });
  bindVehicleSuggestions(compareVehicleInputEl, () => {
    compareModalConfirmBtn?.click();
  });
}

function showComparePicker(target = "compare") {
  if (!currentVehicleId || !compareModalEl) return;
  compareEditTarget = target === "base" ? "base" : "compare";
  const initialVehicleId = compareEditTarget === "base" ? currentVehicleId : (compareVehicleId || "");
  compareVehicleInputEl.value = getVehicleDisplayId(initialVehicleId);
  setVehicleInputResolvedId(compareVehicleInputEl, initialVehicleId);
  openOverlayModal(compareModalEl, { focusTarget: compareVehicleInputEl });
  bindVehicleSuggestions(compareVehicleInputEl, () => {
    compareModalConfirmBtn?.click();
  });
  window.setTimeout(() => {
    compareVehicleInputEl?.focus();
    compareVehicleInputEl?.select();
  }, 20);
}

function hideCompareModal() {
  closeOverlayModal(compareModalEl);
}

function clearComparison() {
  compareVehicleId = "";
  if (compareCardEl) {
    compareCardEl.hidden = true;
    compareCardEl.setAttribute("aria-hidden", "true");
  }
  if (compareContentEl) compareContentEl.innerHTML = "";
  if (compareCardSummaryEl) {
    compareCardSummaryEl.textContent = "";
    compareCardSummaryEl.hidden = true;
  }
  updateUrlState();
}

function shouldHideComparisonField(fieldKey = "") {
  const normalizedKey = normalizeFieldKey(fieldKey).replace(/[-_]+/g, " ").replace(/\s+/g, " ").trim();
  return normalizedKey.includes("hansea nummer") ||
    normalizedKey.includes("intern nummer") ||
    normalizedKey === "vin" ||
    normalizedKey.includes("oude voertuignummers") ||
    normalizedKey.includes("oude voertuignummer") ||
    normalizedKey.includes("oude nummerplaten") ||
    normalizedKey.includes("oude nummerplaat");
}

function collectComparisonRows(bus) {
  const rows = [];
  if (!bus) return rows;

  const typeValue = cleanText(bus.Type || "");
  if (typeValue && typeValue !== "/") {
    rows.push({
      key: "__type__",
      label: translateVehicleFieldLabel("Type"),
      value: typeValue,
      isHansea: false
    });
  }

  for (const row of collectVehicleDisplayRows(bus)) {
    if (shouldHideComparisonField(row.key)) continue;
    rows.push(row);
  }

  return rows;
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

  const baseDisplayId = getVehicleDisplayId(baseBus) || currentVehicleId;
  const compareDisplayId = getVehicleDisplayId(compareBus) || compareVehicleId;
  const baseRows = collectComparisonRows(baseBus);
  const compareRows = collectComparisonRows(compareBus);
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
      <td data-column="${escapeHtml(baseDisplayId)}">${renderCellValue(row.left)}</td>
      <td data-column="${escapeHtml(compareDisplayId)}">${renderCellValue(row.right)}</td>
    </tr>
  `).join("");

  compareContentEl.innerHTML = `
    <div class="compare-vehicles-head">
      <button class="compare-vehicle-pill compare-vehicle-pill-btn" type="button" data-compare-target="base">
        <strong>${escapeHtml(baseDisplayId)}</strong>
        <span>${escapeHtml(getLabel("compareEditVehicle", "Klik om te wijzigen"))}</span>
      </button>
      <div class="compare-vs">vs</div>
      <button class="compare-vehicle-pill compare-vehicle-pill-btn" type="button" data-compare-target="compare">
        <strong>${escapeHtml(compareDisplayId)}</strong>
        <span>${escapeHtml(getLabel("compareEditVehicle", "Klik om te wijzigen"))}</span>
      </button>
    </div>
    <div class="compare-table-wrap">
      <table class="compare-table">
        <thead>
          <tr>
            <th class="compare-table-corner" aria-hidden="true"></th>
            <th scope="col">${escapeHtml(baseDisplayId)}</th>
            <th scope="col">${escapeHtml(compareDisplayId)}</th>
          </tr>
        </thead>
        <tbody>${rowsHtml}</tbody>
      </table>
    </div>
  `;

  if (compareCardSummaryEl) {
    compareCardSummaryEl.textContent = "";
    compareCardSummaryEl.hidden = true;
    compareCardSummaryEl.removeAttribute("data-active-summary");
  }
  compareCardEl.hidden = false;
  compareCardEl.setAttribute("aria-hidden", "false");
  updateUrlState();
}

async function applyDeepLinkIfNeeded() {
  if (deeplinkHandled) return;
  deeplinkHandled = true;
  await applyRouteStateFromLocation();
}

async function applyRouteStateFromLocation() {
  const routeState = getRouteStateFromLocation();
  routeNavigationLocked = true;
  closeTransientOverlays();

  try {
    if (routeState.bus) {
      const shouldLoadVehicle =
        currentVehicleId !== routeState.bus ||
        !resultsWrapEl.classList.contains("show");
      if (shouldLoadVehicle) {
        voertuigInput.value = routeState.bus;
        setVehicleInputResolvedId(voertuigInput, routeState.bus);
        await zoekAlles({
          queryOverride: routeState.bus,
          historyMode: "replace"
        });
      } else {
        updateDocumentTitle(routeState.bus);
      }
    } else if (currentVehicleId || resultsWrapEl.classList.contains("show")) {
      terug({ historyMode: "replace", scrollBehavior: "auto" });
    } else {
      compareVehicleId = "";
      updateDocumentTitle("");
    }

    if (routeState.bus) {
      const resolvedCompare = routeState.compare ? resolveVehicleSearch(routeState.compare) : null;
      compareVehicleId =
        resolvedCompare?.bus &&
        routeState.compare &&
        routeState.compare !== routeState.bus
          ? (resolvedCompare.vehicleId || routeState.compare)
          : "";
      renderComparison();
    } else {
      compareVehicleId = "";
      clearComparison();
    }

    if (routeState.view === "stalk") {
      await openDashboardPanel({ historyMode: "replace" });
    } else {
      closeDashboardPanel({ historyMode: "replace" });
    }
  } finally {
    routeNavigationLocked = false;
    updateUrlState("replace");
  }
}

function renderDashboardSetupInputs() {
  if (!dashboardSetupGridEl) return;
  dashboardSetupGridEl.innerHTML = Array.from({ length: DASHBOARD_MAX_VEHICLES }, (_, index) => {
    const internalValue = dashboardVehicleIds[index] || "";
    const draftValue = dashboardSetupDraftValues[index];
    const currentValue = escapeHtml(draftValue != null ? draftValue : getVisibleVehicleId(internalValue));
    const validation = dashboardSetupValidation[index] || {};
    const errorMessage = escapeHtml(validation.error || "");
    const resolvedId = dashboardSetupDraftResolvedIds[index] || internalValue;
    const resolvedAttr = resolvedId ? ` data-resolved-vehicle-id="${escapeHtml(resolvedId)}"` : "";
    return `
      <label class="dashboard-setup-field${validation.error ? " is-invalid" : ""}">
        <span>${getLabel("dashboardCardLabel", "Kaart")} ${index + 1}</span>
        <div class="suggestion-input-shell">
          <input class="dashboard-setup-input" type="text" inputmode="text" autocomplete="off" placeholder="${escapeHtml(getLabel("dashboardSetupPlaceholder", "Voertuignummer of plaat"))}" value="${currentValue}" data-index="${index}"${resolvedAttr}>
        </div>
        <span class="dashboard-setup-field-error"${validation.error ? "" : " hidden"}>${errorMessage}</span>
      </label>
    `;
  }).join("");

  dashboardSetupGridEl.querySelectorAll(".dashboard-setup-input").forEach((inputEl) => {
    bindVehicleSuggestions(inputEl, (vehicleId) => {
      const index = Number(inputEl.dataset.index || -1);
      if (Number.isInteger(index) && index >= 0) {
        dashboardSetupDraftResolvedIds[index] = vehicleId;
        dashboardSetupDraftValues[index] = inputEl.value;
      }
    });
    inputEl.addEventListener("input", () => {
      setVehicleInputResolvedId(inputEl, "");
      const index = Number(inputEl.dataset.index || -1);
      if (Number.isInteger(index) && index >= 0) {
        dashboardSetupDraftValues[index] = inputEl.value;
        dashboardSetupDraftResolvedIds[index] = "";
      }
      if (Number.isInteger(index) && index >= 0 && dashboardSetupValidation[index]?.error) {
        dashboardSetupValidation[index] = { error: "" };
        renderDashboardSetupInputs();
        dashboardSetupGridEl.querySelector(`.dashboard-setup-input[data-index="${index}"]`)?.focus();
      }
    });
  });
}

function setDashboardSetupError(message = "") {
  if (!dashboardSetupErrorEl) return;
  dashboardSetupErrorEl.hidden = !message;
  dashboardSetupErrorEl.textContent = message;
}

function validateDashboardSetupInputs() {
  const inputs = Array.from(dashboardSetupGridEl?.querySelectorAll(".dashboard-setup-input") || []);
  const nextValidation = [];
  const nextIds = [];
  const seenIds = new Set();

  inputs.forEach((inputEl, index) => {
    const query = inputEl.value.trim();
    dashboardSetupDraftValues[index] = query;
    const preferredVehicleId = getVehicleInputResolvedId(inputEl);
    const resolved = resolveVehicleQuery(query, preferredVehicleId);
    const resolvedVehicleId = resolved.vehicleId || "";
    const isDuplicate = !!resolvedVehicleId && seenIds.has(resolvedVehicleId);
    const error = getDashboardVehicleValidationMessage(query, resolvedVehicleId, resolved.bus, isDuplicate);
    nextValidation[index] = { error };
    if (query && !error && resolvedVehicleId) {
      nextIds.push(resolvedVehicleId);
      seenIds.add(resolvedVehicleId);
    }
  });

  dashboardSetupValidation = nextValidation;
  const hasErrors = nextValidation.some((item) => item?.error);
  const hasAnyInput = inputs.some((inputEl) => inputEl.value.trim());
  return {
    ids: nextIds,
    hasErrors,
    hasAnyInput
  };
}

function getSanitizedDashboardVehicleIds(ids = []) {
  const uniqueIds = [];
  const seenIds = new Set();
  normalizeDashboardVehicleIds(ids).forEach((id) => {
    const resolved = resolveVehicleSearch(id);
    const resolvedId = resolved.vehicleId || "";
    if (!resolved.bus || !resolvedId) return;
    if (!isDashboardEligibleVehicleId(resolvedId)) return;
    if (seenIds.has(resolvedId)) return;
    seenIds.add(resolvedId);
    uniqueIds.push(resolvedId);
  });
  return uniqueIds;
}

function showDashboardSetupModal() {
  if (!isStalkModeAvailable()) return;
  dashboardSetupValidation = [];
  dashboardSetupDraftValues = Array.from({ length: DASHBOARD_MAX_VEHICLES }, (_, index) => getVisibleVehicleId(dashboardVehicleIds[index] || ""));
  dashboardSetupDraftResolvedIds = Array.from({ length: DASHBOARD_MAX_VEHICLES }, (_, index) => dashboardVehicleIds[index] || "");
  if (dashboardTvSettingsEl) dashboardTvSettingsEl.hidden = !isAndroidTvPlatform;
  if (dashboardThemeSelectEl) dashboardThemeSelectEl.value = settings.theme;
  if (dashboardColorThemeSelectEl) dashboardColorThemeSelectEl.value = settings.colorTheme;
  setDashboardSetupError("");
  renderDashboardSetupInputs();
  openOverlayModal(dashboardSetupModalEl, {
    focusTarget:
      (isAndroidTvPlatform
        ? dashboardThemeSelectEl
        : null) ||
      dashboardSetupGridEl?.querySelector("input") ||
      dashboardSetupCloseBtn,
    closeMenu: false
  });
  document.body.classList.add("dashboard-setup-open");
}

function hideDashboardSetupModal() {
  closeOverlayModal(dashboardSetupModalEl);
  document.body.classList.remove("dashboard-setup-open");
  dashboardSetupValidation = [];
  dashboardSetupDraftValues = [];
  dashboardSetupDraftResolvedIds = [];
  setDashboardSetupError("");
}

function isStalkModeAvailable() {
  return stalkModeMediaQuery.matches || isAndroidTvPlatform;
}

function syncStalkModeAvailability() {
  const isAvailable = isStalkModeAvailable();
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

async function initDashboardMap() {
  if (!dashboardMapEl || dashboardMap) return;
  const L = await ensureLeafletLoaded();
  dashboardMap = L.map("dashboardMap", { zoomControl: true, preferCanvas: true }).setView([51.0, 4.4], 9);
  L.tileLayer("https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png", {
    attribution: '&copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors &amp; <a href="https://carto.com/">CARTO</a>'
  }).addTo(dashboardMap);
  dashboardMapMarkers = L.layerGroup().addTo(dashboardMap);
}

function buildDashboardMapTooltip(snapshot) {
  return `
    <div class="dashboard-map-tooltip-card">
      <strong>${escapeHtml(snapshot.displayVehicleId || snapshot.vehicleId)}</strong>
      <span class="line-badge" style="--line-badge-bg:${snapshot.routeColor};--line-badge-fg:${snapshot.routeTextColor};">${escapeHtml(snapshot.routeShort)}</span>
      <span>${escapeHtml(snapshot.destinationText || "-")}</span>
    </div>
  `;
}

async function renderDashboardMap(snapshots) {
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
  await initDashboardMap();
  if (!dashboardMapMarkers) return;
  dashboardMapMarkers.clearLayers();
  const L = window.L;

  const bounds = [];
  liveSnapshots.forEach((snapshot) => {
    const markerInstance = L.marker([snapshot.latitude, snapshot.longitude], { icon: getBusIcon() }).addTo(dashboardMapMarkers);
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

function closeDashboardPanel(options = {}) {
  const { historyMode = "replace" } = options;
  stopDashboardRefresh();
  if (!dashboardPanelEl) return;
  setDashboardLoading(false);
  dashboardPanelEl.hidden = true;
  dashboardPanelEl.setAttribute("aria-hidden", "true");
  document.body.classList.remove("dashboard-open");
  void renderDashboardMap([]);
  updateUrlState(historyMode);
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
  if (isHiddenAlphaVehicleId(id)) {
    return {
      status: "offline",
      vehicleId: id,
      displayVehicleId: getVehicleDisplayId(bus || id),
      type: bus?.Type || "",
      message: getLabel("dashboardNoRealtime", "Geen realtime beschikbaar")
    };
  }
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
      displayVehicleId: getVehicleDisplayId(bus || id),
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
    displayVehicleId: getVehicleDisplayId(bus || id),
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

async function refreshDashboardPanel(options = {}) {
  const { showLoading = true } = options;
  const requestToken = ++dashboardRequestToken;
  if (!dashboardPanelEl || !dashboardGridEl || !dashboardVehicleIds.length) return;
  if (showLoading) setDashboardLoading(true);
  try {
    const hasInternet = await verifyInternetConnection();
    if (requestToken !== dashboardRequestToken) return;
    if (!hasInternet) {
      await renderDashboardMap([]);
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
      const displayVehicleId = getVehicleDisplayId(bus || id) || id;
      if (!bus) {
        return `
          <article class="dashboard-card is-offline" tabindex="0">
            <div class="dashboard-card-top">
              <strong>${escapeHtml(displayVehicleId)}</strong>
              <span class="dashboard-status">${escapeHtml(getLabel("dashboardNotFound", "Niet gevonden"))}</span>
            </div>
            <p class="dashboard-meta">${escapeHtml(getLabel("dashboardNoVehicleData", "Geen voertuigdata gevonden."))}</p>
          </article>
        `;
      }

      if (isOutOfService(bus)) {
        return `
          <article class="dashboard-card is-offline" tabindex="0">
            <div class="dashboard-card-top">
              <strong>${escapeHtml(displayVehicleId)}</strong>
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
          <article class="dashboard-card is-offline" tabindex="0">
            <div class="dashboard-card-top">
              <strong>${escapeHtml(displayVehicleId)}</strong>
              <span class="dashboard-status">${escapeHtml(getLabel("dashboardOffline", "Offline"))}</span>
            </div>
            <p class="dashboard-type">${escapeHtml(bus.Type || "")}</p>
            <p class="dashboard-meta">${escapeHtml(snapshot.message || getLabel("dashboardNoRealtime", "Geen realtime beschikbaar"))}</p>
          </article>
        `;
      }

      return `
        <article class="dashboard-card is-live" tabindex="0">
          <div class="dashboard-card-top">
            <strong>${escapeHtml(displayVehicleId)}</strong>
          </div>
          <p class="dashboard-type">${escapeHtml(bus.Type || "")}</p>
          <p class="dashboard-destination"><span class="line-badge" style="--line-badge-bg:${snapshot.routeColor};--line-badge-fg:${snapshot.routeTextColor};">${escapeHtml(snapshot.routeShort)}</span><span class="dashboard-destination-text">${escapeHtml(snapshot.destinationText)}</span></p>
          <p class="dashboard-meta">${escapeHtml(getLabel("dashboardStopPrefix", "Halte:"))} ${escapeHtml(snapshot.currentStopName)}</p>
          <p class="dashboard-meta">${escapeHtml(snapshot.delayMessage)}</p>
        </article>
      `;
    }).join("");

    await renderDashboardMap(snapshots);
    dashboardGridEl.innerHTML = cardsHtml;
    const liveCount = snapshots.filter((snapshot) => snapshot.status === "live").length;
    dashboardSummaryEl.textContent = getLabel("dashboardLiveSummary", "{live} van {total} voertuigen live op kaart")
      .replace("{live}", String(liveCount))
      .replace("{total}", String(dashboardVehicleIds.length));
  } finally {
    if (showLoading && requestToken === dashboardRequestToken) {
      setDashboardLoading(false);
    }
  }
}

async function openDashboardPanel(options = {}) {
  const { historyMode = "push" } = options;
  if (!isStalkModeAvailable()) return;
  if (!dashboardVehicleIds.length) {
    showDashboardSetupModal();
    return;
  }
  setFavoritesPanel(false);
  dashboardPanelEl.hidden = false;
  dashboardPanelEl.setAttribute("aria-hidden", "false");
  document.body.classList.add("dashboard-open");
  if (dashboardCloseBtn) dashboardCloseBtn.hidden = isAndroidTvPlatform;
  await initDashboardMap();
  await refreshDashboardPanel({ showLoading: true });
  window.setTimeout(() => dashboardEditBtn?.focus(), 30);
  stopDashboardRefresh();
  dashboardRefreshHandle = window.setInterval(() => {
    refreshDashboardPanel({ showLoading: false }).catch((error) => console.warn("Dashboard refresh mislukt", error));
  }, updateIntervalMs);
  updateUrlState(historyMode);
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

function normalizePdfThemeKey(themeKey = "geel") {
  return Object.prototype.hasOwnProperty.call(PDF_EXPORT_THEMES, themeKey) ? themeKey : "geel";
}

function getPdfThemePalette(themeKey = "geel") {
  const baseTheme = PDF_EXPORT_THEMES[normalizePdfThemeKey(themeKey)] || PDF_EXPORT_THEMES.geel;
  return {
    ...baseTheme,
    surface: "#ffffff",
    text: "#0f172a",
    muted: "#475569",
    subtle: "#64748b",
    heroText: "#ffffff"
  };
}

function hexToRgb(hexValue, fallback = [15, 23, 42]) {
  const normalizedValue = (hexValue || "").toString().trim().replace(/^#/, "");
  const expandedValue = normalizedValue.length === 3
    ? normalizedValue.split("").map((part) => part + part).join("")
    : normalizedValue;
  if (!/^[\da-f]{6}$/i.test(expandedValue)) return fallback;
  return [
    Number.parseInt(expandedValue.slice(0, 2), 16),
    Number.parseInt(expandedValue.slice(2, 4), 16),
    Number.parseInt(expandedValue.slice(4, 6), 16)
  ];
}

function setPdfFillColor(doc, hexValue) {
  const [r, g, b] = hexToRgb(hexValue);
  doc.setFillColor(r, g, b);
}

function setPdfDrawColor(doc, hexValue) {
  const [r, g, b] = hexToRgb(hexValue);
  doc.setDrawColor(r, g, b);
}

function setPdfTextColor(doc, hexValue) {
  const [r, g, b] = hexToRgb(hexValue);
  doc.setTextColor(r, g, b);
}

function getPdfPageMetrics(doc) {
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const outerMargin = 12;
  const panelPadding = 6;
  const panelX = outerMargin;
  const panelY = outerMargin;
  const panelWidth = pageWidth - outerMargin * 2;
  const panelHeight = pageHeight - outerMargin * 2;
  const innerX = panelX + panelPadding;
  const innerY = panelY + panelPadding;
  const innerWidth = panelWidth - panelPadding * 2;
  const footerY = panelY + panelHeight - 5.5;
  const bottomLimit = footerY - 8;
  return {
    pageWidth,
    pageHeight,
    panelX,
    panelY,
    panelWidth,
    panelHeight,
    panelPadding,
    innerX,
    innerY,
    innerWidth,
    footerY,
    bottomLimit
  };
}

function getBusPdfSummaryItems(bus) {
  const owner = cleanText(getVehicleField(bus, "Eigenaar")) || "-";
  const plate = cleanText(getVehicleField(bus, "Nummerplaat")) || "-";
  const operator = cleanText(getVehicleField(bus, "Vervoersmaatschappij")) || "-";
  const inService = formatBusFieldValueForDisplay(bus, "Datum in dienst", getVehicleField(bus, "Datum in dienst")) || getLabel("notInServiceYet", "Bus nog niet in dienst");
  const outOfService = formatBusFieldValueForDisplay(bus, "Uit dienst", getVehicleField(bus, "Uit dienst")) || t("notOutOfService");
  const hansea = cleanText(getVehicleField(bus, "Hansea nummer"));
  const intern = cleanText(getVehicleField(bus, "Intern nummer"));

  return [
    { label: getLabel("pdfOwner", "Eigenaar"), value: owner },
    { label: translateVehicleFieldLabel("Nummerplaat"), value: plate },
    { label: translateVehicleFieldLabel("Vervoersmaatschappij"), value: operator },
    { label: getLabel("pdfInService", "In dienst"), value: inService },
    { label: getLabel("pdfOutOfService", "Uit dienst"), value: outOfService },
    ...(hansea ? [{ label: getLabel("pdfHansea", "Hansea"), value: hansea, emphasis: true }] : []),
    ...(intern ? [{ label: getLabel("pdfInternal", "Intern"), value: intern }] : [])
  ];
}

function getBusPdfDetailRows(bus) {
  const summaryFieldKeys = new Set([
    "nummerplaat",
    "eigenaar",
    "datum in dienst",
    "in dienst",
    "uit dienst",
    "hansea nummer",
    "intern nummer"
  ]);

  return getBusPdfRows(bus).filter((row) => !summaryFieldKeys.has(normalizeFieldKey(row.key || "")));
}

function drawPdfPageBase(doc, palette, metrics) {
  setPdfFillColor(doc, palette.pageBg);
  doc.rect(0, 0, metrics.pageWidth, metrics.pageHeight, "F");

  setPdfFillColor(doc, palette.surface);
  setPdfDrawColor(doc, palette.cardLine);
  doc.setLineWidth(0.35);
  doc.roundedRect(metrics.panelX, metrics.panelY, metrics.panelWidth, metrics.panelHeight, 6, 6, "FD");
}

function drawPdfFirstPageHeader(doc, palette, metrics, context) {
  const heroX = metrics.innerX;
  const heroY = metrics.innerY;
  const heroHeight = 35;
  const badgeWidth = 42;
  const badgeHeight = 8;

  setPdfFillColor(doc, palette.accent);
  doc.roundedRect(heroX, heroY, metrics.innerWidth, heroHeight, 5, 5, "F");

  setPdfFillColor(doc, palette.accentSoft);
  doc.roundedRect(heroX + metrics.innerWidth - badgeWidth - 4, heroY + 4, badgeWidth, badgeHeight, 3, 3, "F");
  setPdfTextColor(doc, palette.badgeFg);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.text("Busbibliotheek 95", heroX + metrics.innerWidth - badgeWidth / 2 - 4, heroY + 9.1, { align: "center" });

  setPdfTextColor(doc, palette.heroText);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(24);
  doc.text(context.vehicleTitle, heroX + 6, heroY + 13.4);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  doc.text(context.busType, heroX + 6, heroY + 21.4);

  doc.setFontSize(9.2);
  doc.text(`${getLabel("pdfExportDate", "Exportdatum")}: ${context.exportDate}`, heroX + 6, heroY + 28.6);

  return heroY + heroHeight + 8;
}

function drawPdfContinuingHeader(doc, palette, metrics, context) {
  const headerX = metrics.innerX;
  const headerY = metrics.innerY;
  setPdfTextColor(doc, palette.text);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.text(context.vehicleTitle, headerX, headerY + 5);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9.5);
  setPdfTextColor(doc, palette.subtle);
  doc.text(`${context.busType} • ${context.exportDate}`, headerX, headerY + 10.6);

  setPdfDrawColor(doc, palette.cardLine);
  doc.setLineWidth(0.3);
  doc.line(headerX, headerY + 14.5, headerX + metrics.innerWidth, headerY + 14.5);

  return headerY + 20;
}

function drawPdfSectionHeading(doc, palette, metrics, y, title) {
  setPdfTextColor(doc, palette.text);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11.5);
  doc.text(title, metrics.innerX, y);
  setPdfDrawColor(doc, palette.accentSoft);
  doc.setLineWidth(0.35);
  doc.line(metrics.innerX, y + 1.8, metrics.innerX + metrics.innerWidth, y + 1.8);
  return y + 7;
}

function measurePdfCardHeight(doc, width, value, options = {}) {
  const valueFontSize = options.valueFontSize || 11;
  doc.setFont("helvetica", options.valueFontStyle || "bold");
  doc.setFontSize(valueFontSize);
  const valueLines = doc.splitTextToSize(String(value || "-"), Math.max(30, width - 8));
  const baseHeight = options.baseHeight || 14;
  const lineHeight = options.lineHeight || 4.6;
  return {
    valueLines,
    height: Math.max(baseHeight, 9 + valueLines.length * lineHeight)
  };
}

function ensurePdfPageSpace(doc, palette, metrics, state, context, requiredHeight, repeatedSectionTitle = "") {
  if (state.y + requiredHeight <= metrics.bottomLimit) return;
  doc.addPage();
  state.pageNumber += 1;
  drawPdfPageBase(doc, palette, metrics);
  state.y = drawPdfContinuingHeader(doc, palette, metrics, context);
  if (repeatedSectionTitle) {
    state.y = drawPdfSectionHeading(doc, palette, metrics, state.y, repeatedSectionTitle);
  }
}

function drawPdfInfoCard(doc, palette, x, y, width, height, label, valueLines, options = {}) {
  setPdfFillColor(doc, palette.surface);
  setPdfDrawColor(doc, palette.cardLine);
  doc.setLineWidth(0.25);
  doc.roundedRect(x, y, width, height, 3.6, 3.6, "FD");

  setPdfTextColor(doc, palette.subtle);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.8);
  doc.text(String(label || ""), x + 4, y + 4.8);

  setPdfTextColor(doc, options.valueColor || palette.text);
  doc.setFont("helvetica", options.valueFontStyle || "bold");
  doc.setFontSize(options.valueFontSize || 11);
  doc.text(valueLines, x + 4, y + 9.6, { baseline: "top" });
}

function drawPdfSummaryCards(doc, palette, metrics, state, context, items) {
  if (!items.length) return;
  const cardGap = 4;
  const cardWidth = (metrics.innerWidth - cardGap) / 2;
  const sectionTitle = getLabel("pdfSummaryTitle", "Overzicht");

  for (let index = 0; index < items.length; index += 2) {
    const rowItems = items.slice(index, index + 2);
    const measuredCards = rowItems.map((item) => measurePdfCardHeight(doc, cardWidth, item.value, {
      valueColor: item.emphasis ? "#b91c1c" : palette.text
    }));
    const rowHeight = Math.max(...measuredCards.map((measurement) => measurement.height));
    ensurePdfPageSpace(doc, palette, metrics, state, context, rowHeight, sectionTitle);

    rowItems.forEach((item, itemIndex) => {
      const measurement = measuredCards[itemIndex];
      const cardX = metrics.innerX + itemIndex * (cardWidth + cardGap);
      drawPdfInfoCard(
        doc,
        palette,
        cardX,
        state.y,
        cardWidth,
        rowHeight,
        item.label,
        measurement.valueLines,
        {
          valueColor: item.emphasis ? "#b91c1c" : palette.text
        }
      );
    });

    state.y += rowHeight + cardGap;
  }
}

function drawPdfDetailCards(doc, palette, metrics, state, context, rows) {
  const sectionTitle = getLabel("pdfDetailsTitle", "Voertuiggegevens");
  const fullWidth = metrics.innerWidth;
  const rowGap = 3.4;
  const detailRows = rows.length
    ? rows
    : [{
      label: getLabel("pdfNoDetails", "Geen extra voertuiggegevens beschikbaar."),
      value: getLabel("pdfNoDetailsBody", "Voor dit voertuig waren er geen bijkomende gegevens om te exporteren."),
      isHansea: false
    }];

  detailRows.forEach((row) => {
    const valueColor = row.isHansea ? "#b91c1c" : palette.text;
    const measurement = measurePdfCardHeight(doc, fullWidth, row.value, {
      valueColor,
      valueFontStyle: row.isHansea ? "bold" : "normal",
      valueFontSize: row.isHansea ? 11.2 : 10.4,
      baseHeight: 16,
      lineHeight: 4.4
    });
    ensurePdfPageSpace(doc, palette, metrics, state, context, measurement.height, sectionTitle);
    drawPdfInfoCard(doc, palette, metrics.innerX, state.y, fullWidth, measurement.height, row.label, measurement.valueLines, {
      valueColor,
      valueFontStyle: row.isHansea ? "bold" : "normal",
      valueFontSize: row.isHansea ? 11.2 : 10.4
    });
    state.y += measurement.height + rowGap;
  });
}

function applyPdfFooters(doc, palette, metrics) {
  const totalPages = doc.getNumberOfPages();
  for (let pageIndex = 1; pageIndex <= totalPages; pageIndex += 1) {
    doc.setPage(pageIndex);
    setPdfDrawColor(doc, palette.accentSoft);
    doc.setLineWidth(0.3);
    doc.line(metrics.innerX, metrics.footerY - 4.2, metrics.innerX + metrics.innerWidth, metrics.footerY - 4.2);

    setPdfTextColor(doc, palette.subtle);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.6);
    doc.text("Busbibliotheek 95", metrics.innerX, metrics.footerY);
    doc.text(`Pagina ${pageIndex} / ${totalPages}`, metrics.innerX + metrics.innerWidth, metrics.footerY, { align: "right" });
  }
}

async function createBusPdfDocument(bus, vehicleId, themeKey = "geel") {
  const jsPDF = await loadJsPdfLibrary();
  const normalizedThemeKey = normalizePdfThemeKey(themeKey);
  const palette = getPdfThemePalette(normalizedThemeKey);
  const displayVehicleId = getVehicleDisplayId(bus) || bus.Voertuignummer || vehicleId || "";
  const context = {
    vehicleTitle: String(displayVehicleId || vehicleId || ""),
    busType: cleanText(bus.Type) || getLabel("unknownType", "Onbekend type"),
    exportDate: new Date().toLocaleDateString(localeForLanguage(settings.language), {
      day: "numeric",
      month: "long",
      year: "numeric"
    })
  };
  const summaryItems = getBusPdfSummaryItems(bus);
  const detailRows = getBusPdfDetailRows(bus);

  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
    compress: true,
    putOnlyUsedFonts: true
  });
  const metrics = getPdfPageMetrics(doc);
  const state = {
    pageNumber: 1,
    y: 0
  };

  drawPdfPageBase(doc, palette, metrics);
  state.y = drawPdfFirstPageHeader(doc, palette, metrics, context);
  state.y = drawPdfSectionHeading(doc, palette, metrics, state.y, getLabel("pdfSummaryTitle", "Overzicht"));
  drawPdfSummaryCards(doc, palette, metrics, state, context, summaryItems);
  state.y += 1.5;
  state.y = drawPdfSectionHeading(doc, palette, metrics, state.y, getLabel("pdfDetailsTitle", "Voertuiggegevens"));
  drawPdfDetailCards(doc, palette, metrics, state, context, detailRows);
  applyPdfFooters(doc, palette, metrics);

  doc.setProperties({
    title: `Busbibliotheek ${context.vehicleTitle}`,
    subject: context.busType,
    author: "Busbibliotheek 95",
    creator: "Busbibliotheek 95"
  });

  return doc;
}

async function saveGeneratedPdf(doc, fileName) {
  const safeFileName = sanitizeFileName((fileName || "").replace(/\.pdf$/i, ""), "Busbibliotheek") + ".pdf";
  if (isAndroidHostApp() && typeof window.Android?.processDownloadNamed === "function") {
    window.Android.processDownloadNamed(doc.output("datauristring"), safeFileName, "application/pdf");
    return;
  }
  if (isAndroidHostApp() && typeof window.Android?.processDownload === "function") {
    window.Android.processDownload(doc.output("datauristring"), "application/pdf");
    return;
  }

  const pdfBlob = doc.output("blob");
  const downloadUrl = URL.createObjectURL(pdfBlob);
  const downloadLink = document.createElement("a");
  downloadLink.href = downloadUrl;
  downloadLink.download = safeFileName;
  downloadLink.rel = "noopener";
  document.body.appendChild(downloadLink);
  downloadLink.click();
  downloadLink.remove();
  window.setTimeout(() => URL.revokeObjectURL(downloadUrl), 2500);
}

async function exportBusPdf(vehicleId, themeKey = "geel") {
  const bus = findBusById(vehicleId);
  if (!bus) return;
  const doc = await createBusPdfDocument(bus, vehicleId, themeKey);
  const displayVehicleId = getVehicleDisplayId(bus) || vehicleId || bus.Voertuignummer || "bus";
  const fileName = `Busbibliotheek_${displayVehicleId}`;
  await saveGeneratedPdf(doc, fileName);
}

function updateVehiclePhotoTexts() {
  if (!photoCardTitleEl || !vehiclePhotoCaptionEl) return;
  photoCardTitleEl.textContent = translateTemplate("photoCard", "Voertuigfoto");
  updatePhotoUploadCopy(currentPhotoVehicleId);
  renderActiveVehiclePhoto();
}

function updatePhotoUploadCopy(vehicleId = currentPhotoVehicleId) {
  const visibleVehicleId = getVehicleDisplayId(vehicleId);
  const hasSpecificVehicleId = !!visibleVehicleId;
  if (vehiclePhotoEmptyBadgeEl) vehiclePhotoEmptyBadgeEl.textContent = getLabel("photoUploadEmptyBadge", "Nog geen foto");
  if (vehiclePhotoEmptyTitleEl) {
    vehiclePhotoEmptyTitleEl.textContent = hasSpecificVehicleId
      ? fillTemplate(getLabel("photoUploadEmptyTitle", "Nog geen foto beschikbaar van voertuig {id}."), visibleVehicleId)
      : getLabel("photoUploadEmptyTitleGeneric", "Nog geen foto beschikbaar van dit voertuig.");
  }
  if (vehiclePhotoEmptyTextEl) {
    vehiclePhotoEmptyTextEl.textContent = hasSpecificVehicleId
      ? fillTemplate(getLabel("photoUploadEmptyText", "Heb jij wel een goede foto van voertuig {id}? Help Busbibliotheek aanvullen via het uploadformulier."), visibleVehicleId)
      : getLabel("photoUploadEmptyTextGeneric", "Heb jij wel een goede foto? Help Busbibliotheek aanvullen via het uploadformulier.");
  }
  if (vehiclePhotoUploadBtn) vehiclePhotoUploadBtn.textContent = getLabel("photoUploadCta", "Jouw foto hier? Upload hier.");
  if (photoUploadModalTitleEl) photoUploadModalTitleEl.textContent = getLabel("photoUploadTitle", "Foto uploaden");
  if (photoUploadModalSummaryEl) {
    photoUploadModalSummaryEl.textContent = hasSpecificVehicleId
      ? fillTemplate(getLabel("photoUploadSummary", "Help Busbibliotheek aanvullen met een foto van voertuig {id}."), visibleVehicleId)
      : getLabel("photoUploadSummaryGeneric", "Help Busbibliotheek aanvullen met een foto van dit voertuig.");
  }
  if (photoUploadModalBadgeEl) photoUploadModalBadgeEl.textContent = getLabel("photoUploadModalBadge", "Voertuigfoto ontbreekt");
  if (photoUploadModalNoteEl) {
    photoUploadModalNoteEl.textContent = hasSpecificVehicleId
      ? fillTemplate(getLabel("photoUploadNote", "We zoeken nog een duidelijke foto van voertuig {id}. Heb jij er eentje? Dan kan je die hieronder doorsturen."), visibleVehicleId)
      : getLabel("photoUploadNoteGeneric", "We zoeken nog een duidelijke foto van dit voertuig. Heb jij er eentje? Dan kan je die hieronder doorsturen.");
  }
  if (photoUploadStep1El) photoUploadStep1El.textContent = getLabel("photoUploadStep1", "Open het formulier in je browser.");
  if (photoUploadStep2El) {
    photoUploadStep2El.textContent = hasSpecificVehicleId
      ? fillTemplate(getLabel("photoUploadStep2", "Voeg je foto toe en vermeld voertuig {id}."), visibleVehicleId)
      : getLabel("photoUploadStep2Generic", "Voeg je foto toe en vermeld het voertuignummer.");
  }
  if (photoUploadStep3El) photoUploadStep3El.textContent = getLabel("photoUploadStep3", "Na controle kan de foto op Busbibliotheek verschijnen.");
  if (photoUploadOpenLinkEl) {
    photoUploadOpenLinkEl.textContent = getLabel("photoUploadOpen", "Open uploadformulier");
    photoUploadOpenLinkEl.href = PHOTO_UPLOAD_FORM_URL;
  }
}

function ensureVehiclePhotoImageElement() {
  if (vehiclePhotoImgEl?.isConnected) return vehiclePhotoImgEl;
  if (!vehiclePhotoFrameEl) return null;
  const imageEl = document.createElement("img");
  imageEl.id = "vehiclePhotoImg";
  imageEl.className = "vehicle-photo-image";
  imageEl.alt = "";
  imageEl.loading = "eager";
  imageEl.decoding = "async";
  vehiclePhotoFrameEl.insertBefore(imageEl, vehiclePhotoNextBtn || vehiclePhotoEmptyStateEl || null);
  vehiclePhotoImgEl = imageEl;
  return imageEl;
}

function clearVehiclePhotoImageElement(removeFromDom = false) {
  if (!vehiclePhotoImgEl) return;
  vehiclePhotoImgEl.onload = null;
  vehiclePhotoImgEl.onerror = null;
  vehiclePhotoImgEl.removeAttribute("src");
  vehiclePhotoImgEl.alt = "";
  if (removeFromDom) {
    if (vehiclePhotoImgEl.isConnected) vehiclePhotoImgEl.remove();
    vehiclePhotoImgEl = null;
  }
}

function setVehiclePhotoEmptyStateVisible(visible) {
  if (vehiclePhotoFrameEl) vehiclePhotoFrameEl.classList.toggle("is-empty", !!visible);
  if (visible) clearVehiclePhotoImageElement(true);
  if (visible) {
    if (vehiclePhotoPrevBtn) vehiclePhotoPrevBtn.hidden = true;
    if (vehiclePhotoNextBtn) vehiclePhotoNextBtn.hidden = true;
    if (vehiclePhotoCaptionEl) vehiclePhotoCaptionEl.hidden = true;
  }
  if (vehiclePhotoInfoEl) vehiclePhotoInfoEl.hidden = visible;
  if (vehiclePhotoEmptyStateEl) {
    vehiclePhotoEmptyStateEl.hidden = !visible;
    vehiclePhotoEmptyStateEl.setAttribute("aria-hidden", String(!visible));
  }
}

function showVehiclePhotoUploadPrompt(vehicleId) {
  currentPhotoVehicleId = normalize(vehicleId);
  currentVehiclePhotoEntries = [];
  currentVehiclePhotoIndex = 0;
  if (!vehiclePhotoCardEl || !vehiclePhotoCaptionEl) return;
  clearVehiclePhotoImageElement(true);
  vehiclePhotoCaptionEl.textContent = "";
  vehiclePhotoCaptionEl.hidden = true;
  if (vehiclePhotoMetaEl) {
    vehiclePhotoMetaEl.hidden = true;
    vehiclePhotoMetaEl.textContent = "";
  }
  if (vehiclePhotoCounterEl) {
    vehiclePhotoCounterEl.hidden = true;
    vehiclePhotoCounterEl.textContent = "";
  }
  updatePhotoUploadCopy(currentPhotoVehicleId);
  setVehiclePhotoEmptyStateVisible(true);
  vehiclePhotoCardEl.hidden = false;
  vehiclePhotoCardEl.setAttribute("aria-hidden", "false");
}

function formatPhotoMetaDate(rawValue) {
  if (!rawValue) return "";
  return formatDateForUi(rawValue, { day: "numeric", month: "long", year: "numeric" });
}

function readExifTextValue(view, offset) {
  if (!Number.isFinite(offset) || offset < 0 || offset >= view.byteLength) return "";
  let end = offset;
  while (end < view.byteLength && view.getUint8(end) !== 0) end += 1;
  const bytes = new Uint8Array(view.buffer, view.byteOffset + offset, end - offset);
  return new TextDecoder("ascii").decode(bytes).trim();
}

function readExifRationalValue(view, offset, littleEndian) {
  if (!Number.isFinite(offset) || offset < 0 || offset + 8 > view.byteLength) return NaN;
  const numerator = view.getUint32(offset, littleEndian);
  const denominator = view.getUint32(offset + 4, littleEndian);
  if (!denominator) return NaN;
  return numerator / denominator;
}

function formatPhotoGpsCoordinate(latitude, longitude) {
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return "";
  return `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`;
}

function buildPhotoGpsMapLink(latitude, longitude) {
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return "";
  return `https://www.google.com/maps?q=${encodeURIComponent(`${latitude},${longitude}`)}`;
}

function waitMs(duration) {
  return new Promise((resolve) => setTimeout(resolve, duration));
}

function buildPhotoReverseGeocodeCacheKey(latitude, longitude, language = settings.language) {
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return "";
  return `${latitude.toFixed(5)},${longitude.toFixed(5)}|${(language || DEFAULT_LANG).toLowerCase()}`;
}

function queuePhotoReverseGeocode(taskFactory) {
  const task = photoReverseGeocodeQueue
    .catch(() => null)
    .then(async () => {
      const elapsedMs = Date.now() - photoReverseGeocodeLastRequestAt;
      if (photoReverseGeocodeLastRequestAt && elapsedMs < PHOTO_REVERSE_GEOCODE_MIN_INTERVAL_MS) {
        await waitMs(PHOTO_REVERSE_GEOCODE_MIN_INTERVAL_MS - elapsedMs);
      }
      photoReverseGeocodeLastRequestAt = Date.now();
      return taskFactory();
    });

  photoReverseGeocodeQueue = task.catch(() => null);
  return task;
}

function toRadians(degrees) {
  return (Number(degrees) * Math.PI) / 180;
}

function getPhotoGpsDistanceMeters(latitudeA, longitudeA, latitudeB, longitudeB) {
  if (
    !Number.isFinite(latitudeA) ||
    !Number.isFinite(longitudeA) ||
    !Number.isFinite(latitudeB) ||
    !Number.isFinite(longitudeB)
  ) return Number.POSITIVE_INFINITY;
  const earthRadiusMeters = 6371000;
  const latitudeDelta = toRadians(latitudeB - latitudeA);
  const longitudeDelta = toRadians(longitudeB - longitudeA);
  const halfLatitudeDelta = Math.sin(latitudeDelta / 2);
  const halfLongitudeDelta = Math.sin(longitudeDelta / 2);
  const haversine =
    halfLatitudeDelta * halfLatitudeDelta +
    Math.cos(toRadians(latitudeA)) *
      Math.cos(toRadians(latitudeB)) *
      halfLongitudeDelta *
      halfLongitudeDelta;
  return 2 * earthRadiusMeters * Math.asin(Math.min(1, Math.sqrt(haversine)));
}

function getPhotoPlaceLocality(address = {}) {
  return pickFirstText(
    address.city,
    address.town,
    address.village,
    address.municipality,
    address.suburb,
    address.city_district,
    address.hamlet,
    address.county
  );
}

function buildPhotoNamedPlaceLabel(name = "", locality = "") {
  const cleanedName = cleanText(name);
  const cleanedLocality = cleanText(locality);
  if (!cleanedName) return "";
  if (
    cleanedLocality &&
    !normalizeSearchText(cleanedName).includes(normalizeSearchText(cleanedLocality))
  ) {
    return `${cleanedName}, ${cleanedLocality}`;
  }
  return cleanedName;
}

function mergePhotoPlaceLabels(primaryLabel = "", secondaryLabel = "") {
  const primary = cleanText(primaryLabel);
  const secondary = cleanText(secondaryLabel);
  if (!primary) return secondary;
  if (!secondary) return primary;

  const normalizedPrimary = normalizeSearchText(primary);
  const normalizedSecondary = normalizeSearchText(secondary);
  if (!normalizedPrimary || !normalizedSecondary) return primary || secondary;
  if (normalizedPrimary === normalizedSecondary) return primary;
  if (normalizedPrimary.includes(normalizedSecondary)) return primary;
  if (normalizedSecondary.includes(normalizedPrimary)) return secondary;
  return `${primary} • ${secondary}`;
}

function getPhotoPreferredNamedValue(payload = {}, address = {}, language = settings.language) {
  const namedetails = payload?.namedetails || {};
  const normalizedLanguage = (language || DEFAULT_LANG || "nl").toLowerCase();
  return pickFirstText(
    namedetails[`name:${normalizedLanguage}`],
    payload?.name,
    namedetails.name,
    namedetails[`official_name:${normalizedLanguage}`],
    namedetails.official_name,
    namedetails[`short_name:${normalizedLanguage}`],
    namedetails.short_name,
    namedetails[`alt_name:${normalizedLanguage}`],
    namedetails.alt_name,
    address.public_transport,
    address.station,
    address.railway,
    address.bus_station,
    address.bus_stop,
    address.tram_stop,
    address.platform,
    address.amenity,
    address.building
  );
}

function isTransitRelatedPhotoPayload(payload = {}, address = {}) {
  const transitCandidates = [
    payload?.category,
    payload?.type,
    payload?.addresstype,
    payload?.class,
    payload?.extratags?.public_transport,
    payload?.extratags?.station,
    payload?.extratags?.railway,
    address.public_transport,
    address.station,
    address.railway,
    address.bus_station,
    address.bus_stop,
    address.tram_stop,
    address.platform
  ].map((value) => cleanText(value));

  if (transitCandidates.some(Boolean)) return true;

  const keywordText = [
    payload?.display_name,
    payload?.name,
    payload?.namedetails?.name,
    payload?.namedetails?.official_name
  ].map((value) => cleanText(value).toLowerCase()).filter(Boolean).join(" ");

  return [
    "station",
    "halte",
    "busstation",
    "bus stop",
    "tram stop",
    "tramhalte",
    "metrostation",
    "railway station",
    "train station",
    "perron"
  ].some((keyword) => keywordText.includes(keyword));
}

function buildTransitPoiLabelFromReversePayload(payload = {}, language = settings.language) {
  const address = payload?.address || {};
  if (!isTransitRelatedPhotoPayload(payload, address)) return "";
  return buildPhotoNamedPlaceLabel(
    getPhotoPreferredNamedValue(payload, address, language),
    getPhotoPlaceLocality(address)
  );
}

function getPhotoTransitPoiRank(tags = {}) {
  if (!tags || typeof tags !== "object") return 99;
  if (tags.railway === "station" || tags.public_transport === "station") return 0;
  if (tags.amenity === "bus_station" || tags.railway === "halt") return 1;
  if (tags.public_transport === "stop_area") return 2;
  if (tags.highway === "bus_stop" || tags.railway === "tram_stop") return 3;
  if (tags.public_transport === "platform" || tags.railway === "platform") return 4;
  if (tags.public_transport === "stop_position") return 5;
  return 99;
}

function getPhotoTransitPoiLabel(tags = {}, language = settings.language, locality = "") {
  const normalizedLanguage = (language || DEFAULT_LANG || "nl").toLowerCase();
  const name = pickFirstText(
    tags[`name:${normalizedLanguage}`],
    tags.name,
    tags[`official_name:${normalizedLanguage}`],
    tags.official_name,
    tags[`short_name:${normalizedLanguage}`],
    tags.short_name
  );
  return buildPhotoNamedPlaceLabel(name, locality);
}

async function fetchNearbyPhotoTransitPoi(latitude, longitude, language = settings.language, locality = "") {
  const aroundClause = `around:${PHOTO_TRANSIT_POI_RADIUS_METERS},${latitude.toFixed(7)},${longitude.toFixed(7)}`;
  const query = `[out:json][timeout:6];
(
  node(${aroundClause})["railway"~"station|halt|tram_stop|platform"];
  way(${aroundClause})["railway"~"station|halt|tram_stop|platform"];
  relation(${aroundClause})["railway"~"station|halt|tram_stop|platform"];
  node(${aroundClause})["public_transport"~"station|platform|stop_position|stop_area"];
  way(${aroundClause})["public_transport"~"station|platform|stop_position|stop_area"];
  relation(${aroundClause})["public_transport"~"station|platform|stop_position|stop_area"];
  node(${aroundClause})["amenity"="bus_station"];
  way(${aroundClause})["amenity"="bus_station"];
  relation(${aroundClause})["amenity"="bus_station"];
  node(${aroundClause})["highway"="bus_stop"];
  way(${aroundClause})["highway"="bus_stop"];
  relation(${aroundClause})["highway"="bus_stop"];
);
out center tags;`;

  const response = await fetchWithTimeout(
    PHOTO_TRANSIT_POI_URL,
    {
      method: "POST",
      headers: {
        "Content-Type": "text/plain;charset=UTF-8"
      },
      body: query,
      cache: "no-store"
    },
    PHOTO_TRANSIT_POI_TIMEOUT_MS
  );
  const payload = await response.json();
  const bestCandidate = (Array.isArray(payload?.elements) ? payload.elements : [])
    .map((element) => {
      const tags = element?.tags || {};
      const label = getPhotoTransitPoiLabel(tags, language, locality);
      if (!label) return null;
      const elementLatitude = Number(element?.lat ?? element?.center?.lat);
      const elementLongitude = Number(element?.lon ?? element?.center?.lon);
      return {
        label,
        rank: getPhotoTransitPoiRank(tags),
        distanceMeters: getPhotoGpsDistanceMeters(latitude, longitude, elementLatitude, elementLongitude)
      };
    })
    .filter(Boolean)
    .sort((left, right) => {
      if (left.rank !== right.rank) return left.rank - right.rank;
      if (left.distanceMeters !== right.distanceMeters) return left.distanceMeters - right.distanceMeters;
      return left.label.localeCompare(right.label, "nl", { sensitivity: "base" });
    })[0];

  return bestCandidate?.label || "";
}

function formatPhotoReverseGeocodeLabel(payload = {}, nearbyTransitLabel = "", language = settings.language) {
  const address = payload?.address || {};
  const streetName = pickFirstText(
    address.road,
    address.pedestrian,
    address.footway,
    address.path,
    address.cycleway,
    address.residential,
    address.street,
    address.square
  );
  const houseNumber = cleanText(address.house_number);
  const streetLabel = [streetName, houseNumber].filter(Boolean).join(" ").trim();
  const locality = getPhotoPlaceLocality(address);
  const addressLabel = streetLabel && locality ? `${streetLabel}, ${locality}` : (streetLabel || locality);
  const reverseTransitLabel = buildTransitPoiLabelFromReversePayload(payload, language);
  const preferredTransitLabel = mergePhotoPlaceLabels(reverseTransitLabel, nearbyTransitLabel);

  if (preferredTransitLabel) {
    return mergePhotoPlaceLabels(preferredTransitLabel, addressLabel);
  }

  return addressLabel || cleanText(payload?.display_name || "");
}

async function getPhotoReverseGeocode(latitude, longitude) {
  const language = (settings.language || DEFAULT_LANG || "nl").toLowerCase();
  const cacheKey = buildPhotoReverseGeocodeCacheKey(latitude, longitude, language);
  const fallbackValue = {
    label: "",
    link: buildPhotoGpsMapLink(latitude, longitude)
  };
  if (!cacheKey) return fallbackValue;

  const cached = photoReverseGeocodeCache.get(cacheKey);
  if (cached && typeof cached === "object" && !(cached instanceof Promise)) return cached;
  if (cached) return cached;

  const pending = queuePhotoReverseGeocode(async () => {
    try {
      const requestUrl = new URL(PHOTO_REVERSE_GEOCODE_URL);
      requestUrl.searchParams.set("format", "jsonv2");
      requestUrl.searchParams.set("lat", latitude.toFixed(7));
      requestUrl.searchParams.set("lon", longitude.toFixed(7));
      requestUrl.searchParams.set("zoom", "18");
      requestUrl.searchParams.set("addressdetails", "1");
      requestUrl.searchParams.set("namedetails", "1");
      requestUrl.searchParams.set("extratags", "1");
      requestUrl.searchParams.set("accept-language", language);

      const response = await fetchWithTimeout(requestUrl.toString(), { cache: "force-cache" }, PHOTO_REVERSE_GEOCODE_TIMEOUT_MS);
      const payload = await response.json();
      const reverseTransitLabel = buildTransitPoiLabelFromReversePayload(payload, language);
      const nearbyTransitLabel = reverseTransitLabel
        ? ""
        : await fetchNearbyPhotoTransitPoi(
          latitude,
          longitude,
          language,
          getPhotoPlaceLocality(payload?.address || {})
        ).catch(() => "");
      const value = {
        label: formatPhotoReverseGeocodeLabel(
          payload || {},
          mergePhotoPlaceLabels(reverseTransitLabel, nearbyTransitLabel),
          language
        ),
        link: buildPhotoGpsMapLink(latitude, longitude)
      };
      photoReverseGeocodeCache.set(cacheKey, value);
      return value;
    } catch (_) {
      photoReverseGeocodeCache.set(cacheKey, fallbackValue);
      return fallbackValue;
    }
  });

  photoReverseGeocodeCache.set(cacheKey, pending);
  return pending;
}

function buildInstagramProfileLink(handle) {
  const trimmedHandle = (handle || "").toString().trim();
  if (!trimmedHandle.startsWith("@")) return "";
  const normalizedHandle = trimmedHandle.replace(/^@+/, "");
  if (!normalizedHandle) return "";
  return `https://www.instagram.com/${encodeURIComponent(normalizedHandle)}`;
}

function parseExifMetadataFromArrayBuffer(buffer) {
  try {
    const view = new DataView(buffer);
    if (view.byteLength < 4 || view.getUint16(0, false) !== 0xFFD8) {
      return { date: "", dateTimestamp: Number.NaN, latitude: NaN, longitude: NaN };
    }
    let offset = 2;

    const readIfd = (viewRef, tiffOffset, dirOffset, littleEndian) => {
      const absoluteDirOffset = tiffOffset + dirOffset;
      if (absoluteDirOffset + 2 > viewRef.byteLength) {
        return { date: "", dateTimestamp: Number.NaN, exifPointer: 0, gpsPointer: 0 };
      }
      const entryCount = viewRef.getUint16(absoluteDirOffset, littleEndian);
      let exifPointer = 0;
      let gpsPointer = 0;
      let date = "";
      let dateTimestamp = Number.NaN;

      for (let index = 0; index < entryCount; index += 1) {
        const entryOffset = absoluteDirOffset + 2 + index * 12;
        if (entryOffset + 12 > viewRef.byteLength) break;
        const tag = viewRef.getUint16(entryOffset, littleEndian);
        const type = viewRef.getUint16(entryOffset + 2, littleEndian);
        const count = viewRef.getUint32(entryOffset + 4, littleEndian);
        const valueOffset = viewRef.getUint32(entryOffset + 8, littleEndian);
        if (tag === 0x8769) exifPointer = valueOffset;
        if (tag === 0x8825) gpsPointer = valueOffset;
        if (type !== 2 || !count) continue;
        const textOffset = count <= 4 ? entryOffset + 8 : tiffOffset + valueOffset;
        if (tag === 0x0132 || tag === 0x9003 || tag === 0x9004) {
          const rawValue = readExifTextValue(viewRef, textOffset);
          const normalizedValue = rawValue.replace(/^(\d{4}):(\d{2}):(\d{2})/, "$1-$2-$3");
          const formatted = formatPhotoMetaDate(normalizedValue);
          const timestamp = getPhotoMetadataTimestamp(normalizedValue);
          if (formatted && !date) {
            date = formatted;
            dateTimestamp = timestamp;
          } else if (!Number.isFinite(dateTimestamp) && Number.isFinite(timestamp)) {
            dateTimestamp = timestamp;
          }
        }
      }

      return { date, dateTimestamp, exifPointer, gpsPointer };
    };

    const readGpsIfd = (viewRef, tiffOffset, dirOffset, littleEndian) => {
      const absoluteDirOffset = tiffOffset + dirOffset;
      if (absoluteDirOffset + 2 > viewRef.byteLength) return { latitude: NaN, longitude: NaN };
      const entryCount = viewRef.getUint16(absoluteDirOffset, littleEndian);
      let latitudeRef = "";
      let longitudeRef = "";
      let latitudeOffset = 0;
      let longitudeOffset = 0;

      for (let index = 0; index < entryCount; index += 1) {
        const entryOffset = absoluteDirOffset + 2 + index * 12;
        if (entryOffset + 12 > viewRef.byteLength) break;
        const tag = viewRef.getUint16(entryOffset, littleEndian);
        const type = viewRef.getUint16(entryOffset + 2, littleEndian);
        const count = viewRef.getUint32(entryOffset + 4, littleEndian);
        const valueOffset = viewRef.getUint32(entryOffset + 8, littleEndian);
        if (tag === 0x0001 && type === 2 && count) {
          latitudeRef = readExifTextValue(viewRef, count <= 4 ? entryOffset + 8 : tiffOffset + valueOffset).toUpperCase();
        } else if (tag === 0x0002 && count >= 3) {
          latitudeOffset = tiffOffset + valueOffset;
        } else if (tag === 0x0003 && type === 2 && count) {
          longitudeRef = readExifTextValue(viewRef, count <= 4 ? entryOffset + 8 : tiffOffset + valueOffset).toUpperCase();
        } else if (tag === 0x0004 && count >= 3) {
          longitudeOffset = tiffOffset + valueOffset;
        }
      }

      const latitudeParts = latitudeOffset
        ? [0, 1, 2].map((partIndex) => readExifRationalValue(viewRef, latitudeOffset + partIndex * 8, littleEndian))
        : [];
      const longitudeParts = longitudeOffset
        ? [0, 1, 2].map((partIndex) => readExifRationalValue(viewRef, longitudeOffset + partIndex * 8, littleEndian))
        : [];

      const toDecimal = (parts, ref) => {
        if (parts.length !== 3 || parts.some((part) => !Number.isFinite(part))) return NaN;
        const sign = ref === "S" || ref === "W" ? -1 : 1;
        return sign * (parts[0] + parts[1] / 60 + parts[2] / 3600);
      };

      return {
        latitude: toDecimal(latitudeParts, latitudeRef),
        longitude: toDecimal(longitudeParts, longitudeRef)
      };
    };

    while (offset + 4 <= view.byteLength) {
      if (view.getUint8(offset) !== 0xFF) break;
      const marker = view.getUint8(offset + 1);
      if (marker === 0xDA || marker === 0xD9) break;
      const segmentLength = view.getUint16(offset + 2, false);
      if (segmentLength < 2 || offset + 2 + segmentLength > view.byteLength) break;

      if (marker === 0xE1 && segmentLength >= 10) {
        const exifHeader = String.fromCharCode(
          view.getUint8(offset + 4),
          view.getUint8(offset + 5),
          view.getUint8(offset + 6),
          view.getUint8(offset + 7),
          view.getUint8(offset + 8),
          view.getUint8(offset + 9)
        );

        if (exifHeader === "Exif\u0000\u0000") {
          const tiffOffset = offset + 10;
          const byteOrder = view.getUint16(tiffOffset, false);
          const littleEndian = byteOrder === 0x4949;
          if (!littleEndian && byteOrder !== 0x4D4D) {
            return { date: "", dateTimestamp: Number.NaN, latitude: NaN, longitude: NaN };
          }
          const ifd0Offset = view.getUint32(tiffOffset + 4, littleEndian);
          const ifd0Result = readIfd(view, tiffOffset, ifd0Offset, littleEndian);
          let date = ifd0Result.date || "";
          let dateTimestamp = ifd0Result.dateTimestamp;
          if (ifd0Result.exifPointer) {
            const exifResult = readIfd(view, tiffOffset, ifd0Result.exifPointer, littleEndian);
            if (!date && exifResult.date) {
              date = exifResult.date;
              dateTimestamp = exifResult.dateTimestamp;
            } else if (!Number.isFinite(dateTimestamp) && Number.isFinite(exifResult.dateTimestamp)) {
              dateTimestamp = exifResult.dateTimestamp;
            }
          }
          let latitude = NaN;
          let longitude = NaN;
          if (ifd0Result.gpsPointer) {
            const gpsResult = readGpsIfd(view, tiffOffset, ifd0Result.gpsPointer, littleEndian);
            latitude = gpsResult.latitude;
            longitude = gpsResult.longitude;
          }
          return { date, dateTimestamp, latitude, longitude };
        }
      }

      offset += 2 + segmentLength;
    }
  } catch (_) {
    return { date: "", dateTimestamp: Number.NaN, latitude: NaN, longitude: NaN };
  }
  return { date: "", dateTimestamp: Number.NaN, latitude: NaN, longitude: NaN };
}

async function getPhotoExifMetadata(src) {
  const cacheKey = buildVehiclePhotoRequestUrl(src);
  if (!cacheKey) return { date: "", dateTimestamp: Number.NaN, latitude: NaN, longitude: NaN };
  const cached = photoExifMetadataCache.get(cacheKey);
  if (cached && typeof cached === "object" && !(cached instanceof Promise)) return cached;
  if (cached) return cached;

  const pending = fetch(cacheKey, { cache: "force-cache" })
    .then((response) => {
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return response.arrayBuffer();
    })
    .then((buffer) => parseExifMetadataFromArrayBuffer(buffer))
    .catch(() => ({ date: "", dateTimestamp: Number.NaN, latitude: NaN, longitude: NaN }))
    .then((value) => {
      photoExifMetadataCache.set(
        cacheKey,
        value || { date: "", dateTimestamp: Number.NaN, latitude: NaN, longitude: NaN }
      );
      return value || { date: "", dateTimestamp: Number.NaN, latitude: NaN, longitude: NaN };
    });

  photoExifMetadataCache.set(cacheKey, pending);
  return pending;
}

async function getPhotoCaptureDate(src) {
  const cacheKey = buildVehiclePhotoRequestUrl(src);
  if (!cacheKey) return "";
  const cached = photoCaptureDateCache.get(cacheKey);
  if (typeof cached === "string") return cached;
  if (cached) return cached;

  const pending = getPhotoExifMetadata(src)
    .then((metadata) => metadata?.date || "")
    .catch(() => "")
    .then((value) => {
      photoCaptureDateCache.set(cacheKey, value || "");
      return value || "";
    });

  photoCaptureDateCache.set(cacheKey, pending);
  return pending;
}

function buildVehiclePhotoEntry(src, maker = "", sortOrder = 0) {
  const normalizedMaker = (maker || "").toString().trim();
  return {
    src,
    caption: "",
    meta: normalizedMaker,
    metaFields: {
      maker: normalizedMaker,
      makerLink: normalizedMaker ? buildInstagramProfileLink(normalizedMaker) : "",
      place: "",
      placeLink: "",
      date: "",
      credit: ""
    },
    alt: "",
    dateSortTimestamp: Number.NaN,
    sortOrder
  };
}

function getVehiclePhotoAliases(vehicleId) {
  const bus = findBusById(vehicleId);
  const aliases = new Set([
    normalize(vehicleId),
    normalize(bus?.Voertuignummer)
  ]);
  splitLegacyValues(getVehicleField(bus, oldVehicleNumbersFieldKey), true).forEach((alias) => aliases.add(normalize(alias)));
  return Array.from(aliases).filter(Boolean);
}

function buildAppAssetPath(relativePath) {
  const normalizedPath = (relativePath || "").toString().replace(/^\/+/, "");
  if (!normalizedPath) return "";
  try {
    return new URL(normalizedPath, window.location.href).pathname;
  } catch (_) {
    return normalizedPath;
  }
}

function buildVehiclePhotoFolderPath(folderName, fileName) {
  const safeFolderName = encodeURIComponent((folderName || "").toString().trim());
  const safeFileName = encodeURIComponent((fileName || "").toString().trim());
  return buildAppAssetPath(`media/bus/${safeFolderName}/${safeFileName}`);
}

function getIndexedPhotoEntries(vehicleId) {
  const aliases = getVehiclePhotoAliases(vehicleId);
  const seen = new Set();
  const indexedEntries = [];

  aliases.forEach((alias) => {
    if (!alias) return;
    const indexedPaths = PHOTO_LIBRARY_INDEX[alias];
    if (!Array.isArray(indexedPaths) || !indexedPaths.length) return;

    indexedPaths.forEach((entryPath) => {
      const normalizedEntryPath = (entryPath || "").toString().trim();
      if (!normalizedEntryPath) return;
      const slashIndex = normalizedEntryPath.indexOf("/");
      if (slashIndex <= 0) return;
      const folderName = normalizedEntryPath.slice(0, slashIndex);
      const fileName = normalizedEntryPath.slice(slashIndex + 1);
      if (!folderName || !fileName) return;
      const src = buildVehiclePhotoFolderPath(folderName, fileName);
      if (!src || seen.has(src)) return;
      seen.add(src);
      indexedEntries.push(buildVehiclePhotoEntry(src, folderName, indexedEntries.length));
    });
  });

  return indexedEntries;
}

function getPhotoEntrySuffixOrder(entry) {
  const rawSrc = (entry?.src || "").toString();
  if (!rawSrc) return Number.MAX_SAFE_INTEGER;
  const encodedFileName = rawSrc.split("/").pop() || "";
  const fileName = decodeURIComponent(encodedFileName);
  const suffixMatch = fileName.match(/\s\((\d+)\)(?=\.[^.]+$)/);
  return suffixMatch ? Number(suffixMatch[1]) : 0;
}

function getPhotoEntryFileName(entry) {
  const rawSrc = (entry?.src || "").toString();
  if (!rawSrc) return "";
  const withoutQuery = rawSrc.split("?")[0] || "";
  const encodedFileName = withoutQuery.split("/").pop() || "";
  try {
    return decodeURIComponent(encodedFileName);
  } catch (_) {
    return encodedFileName;
  }
}

function getPhotoMetadataTimestamp(rawValue) {
  const value = (rawValue || "").toString().trim().replace(/^"|"$/g, "");
  if (!value || value === "/") return Number.NaN;

  const exifMatch = value.match(
    /^(\d{4})[:/-](\d{2})[:/-](\d{2})(?:[ T](\d{2}):(\d{2})(?::(\d{2}))?)?$/
  );
  if (exifMatch) {
    const year = Number(exifMatch[1]);
    const month = Number(exifMatch[2]);
    const day = Number(exifMatch[3]);
    const hours = Number(exifMatch[4] || 0);
    const minutes = Number(exifMatch[5] || 0);
    const seconds = Number(exifMatch[6] || 0);
    const parsedDate = new Date(Date.UTC(year, month - 1, day, hours, minutes, seconds));
    if (
      parsedDate.getUTCFullYear() === year &&
      parsedDate.getUTCMonth() === month - 1 &&
      parsedDate.getUTCDate() === day
    ) {
      return parsedDate.getTime();
    }
  }

  const flexibleDateParts = parseFlexibleDateParts(value);
  if (flexibleDateParts) {
    return Date.UTC(
      flexibleDateParts.year,
      flexibleDateParts.month - 1,
      flexibleDateParts.day
    );
  }

  const parsedTimestamp = Date.parse(value);
  return Number.isFinite(parsedTimestamp) ? parsedTimestamp : Number.NaN;
}

function hasKnownPhotoPhotographer(entry) {
  const makerValue = cleanText(entry?.metaFields?.maker || entry?.meta || "");
  if (!makerValue) return false;
  const normalizedMakerValue = makerValue.toLowerCase();
  return ![
    "onbekend",
    "unknown",
    "niet gekend",
    "niet bekend",
    "n/a",
    "na",
    "?"
  ].includes(normalizedMakerValue);
}

function compareVehiclePhotoEntries(left, right) {
  const leftHasKnownPhotographer = hasKnownPhotoPhotographer(left);
  const rightHasKnownPhotographer = hasKnownPhotoPhotographer(right);
  if (leftHasKnownPhotographer !== rightHasKnownPhotographer) {
    return leftHasKnownPhotographer ? -1 : 1;
  }

  const leftTimestamp = Number.isFinite(left?.dateSortTimestamp)
    ? left.dateSortTimestamp
    : getPhotoMetadataTimestamp(left?.metaFields?.date);
  const rightTimestamp = Number.isFinite(right?.dateSortTimestamp)
    ? right.dateSortTimestamp
    : getPhotoMetadataTimestamp(right?.metaFields?.date);
  const leftHasKnownDate = Number.isFinite(leftTimestamp);
  const rightHasKnownDate = Number.isFinite(rightTimestamp);

  if (leftHasKnownDate !== rightHasKnownDate) {
    return leftHasKnownDate ? -1 : 1;
  }

  if (leftHasKnownDate && rightHasKnownDate) {
    const dateDiff = rightTimestamp - leftTimestamp;
    if (dateDiff !== 0) return dateDiff;
  }

  const fileNameDiff = getPhotoEntryFileName(left).localeCompare(
    getPhotoEntryFileName(right),
    "nl",
    { numeric: true, sensitivity: "base" }
  );
  if (fileNameDiff !== 0) return fileNameDiff;

  const suffixOrderDiff = getPhotoEntrySuffixOrder(left) - getPhotoEntrySuffixOrder(right);
  if (suffixOrderDiff !== 0) return suffixOrderDiff;

  const photographerDiff = cleanText(left?.metaFields?.maker || left?.meta || "").localeCompare(
    cleanText(right?.metaFields?.maker || right?.meta || ""),
    "nl",
    { sensitivity: "base" }
  );
  if (photographerDiff !== 0) return photographerDiff;

  const sortOrderDiff = Number(left?.sortOrder || 0) - Number(right?.sortOrder || 0);
  if (sortOrderDiff !== 0) return sortOrderDiff;

  return String(left?.src || "").localeCompare(String(right?.src || ""), "nl");
}

function sortVehiclePhotoEntries(entries = []) {
  return [...entries].sort(compareVehiclePhotoEntries);
}

function mergeVehiclePhotoEntries(...entryGroups) {
  const mergedEntries = [];
  const seen = new Set();

  entryGroups
    .flat()
    .forEach((entry) => {
      if (!entry?.src || seen.has(entry.src)) return;
      seen.add(entry.src);
      mergedEntries.push(entry);
    });

  return sortVehiclePhotoEntries(mergedEntries);
}

function getFallbackPhotoEntries(vehicleId, suffixesOverride = null) {
  const aliases = getVehiclePhotoAliases(vehicleId);
  const extensions = ["jpeg", "jpg", "JPG", "png", "webp"];
  const suffixes = Array.isArray(suffixesOverride) && suffixesOverride.length
    ? suffixesOverride
    : ["", ...Array.from({ length: 12 }, (_, index) => ` (${index + 1})`)];
  const fallbackEntries = [];
  const seen = new Set();
  aliases.forEach((alias) => {
    if (!alias) return;
    suffixes.forEach((suffix) => {
      extensions.forEach((extension) => {
        const fileName = `${alias}${suffix}.${extension}`;
        KNOWN_PHOTOGRAPHER_FOLDERS.forEach((folderName) => {
          const src = buildVehiclePhotoFolderPath(folderName, fileName);
          if (seen.has(src)) return;
          seen.add(src);
          fallbackEntries.push(buildVehiclePhotoEntry(src, folderName, fallbackEntries.length));
        });
        const rootMediaSrc = buildAppAssetPath(`media/${encodeURIComponent(fileName)}`);
        if (seen.has(rootMediaSrc)) return;
        seen.add(rootMediaSrc);
        fallbackEntries.push(buildVehiclePhotoEntry(rootMediaSrc, "", fallbackEntries.length));
      });
    });
  });
  return fallbackEntries;
}

function syncVehiclePhotoEntryMeta(entry) {
  if (!entry) return entry;
  entry.meta = [
    entry.metaFields?.maker,
    entry.metaFields?.place,
    entry.metaFields?.date,
    entry.metaFields?.credit
  ].filter((value) => cleanText(value)).join(" • ");
  return entry;
}

async function enrichResolvedPhotoEntry(entry) {
  const exifMetadata = await getPhotoExifMetadata(entry.src);
  const hasExifGps =
    Number.isFinite(exifMetadata?.latitude) &&
    Number.isFinite(exifMetadata?.longitude);
  const nextMetaFields = {
    ...(entry.metaFields || {})
  };
  if (!cleanText(nextMetaFields.date) && cleanText(exifMetadata?.date)) {
    nextMetaFields.date = exifMetadata.date;
  }
  if (hasExifGps) {
    entry.gpsCoordinates = {
      latitude: exifMetadata.latitude,
      longitude: exifMetadata.longitude
    };
    if (!cleanText(nextMetaFields.place)) {
      nextMetaFields.place = formatPhotoGpsCoordinate(exifMetadata.latitude, exifMetadata.longitude);
      entry.placeDerivedFromGps = true;
    } else {
      entry.placeDerivedFromGps = false;
    }
    if (!cleanText(nextMetaFields.placeLink)) {
      nextMetaFields.placeLink = buildPhotoGpsMapLink(exifMetadata.latitude, exifMetadata.longitude);
    }
  } else {
    entry.gpsCoordinates = null;
    entry.placeDerivedFromGps = false;
  }
  entry.metaFields = nextMetaFields;
  entry.dateSortTimestamp = Number.isFinite(exifMetadata?.dateTimestamp)
    ? exifMetadata.dateTimestamp
    : getPhotoMetadataTimestamp(nextMetaFields.date);
  return syncVehiclePhotoEntryMeta(entry);
}

async function hydrateVehiclePhotoEntryLocation(entry) {
  const requestedLanguage = (settings.language || DEFAULT_LANG || "nl").toLowerCase();
  if (
    !entry?.gpsCoordinates ||
    !entry.placeDerivedFromGps ||
    (entry.locationResolved && entry.locationResolvedLanguage === requestedLanguage)
  ) return entry;
  if (entry.locationResolvePromise) return entry.locationResolvePromise;

  const { latitude, longitude } = entry.gpsCoordinates;
  entry.locationResolvePromise = getPhotoReverseGeocode(latitude, longitude)
    .then((locationInfo) => {
      entry.locationResolved = true;
      entry.locationResolvedLanguage = requestedLanguage;
      if (cleanText(locationInfo?.label)) {
        entry.metaFields = {
          ...(entry.metaFields || {}),
          place: locationInfo.label,
          placeLink: locationInfo.link || buildPhotoGpsMapLink(latitude, longitude)
        };
        syncVehiclePhotoEntryMeta(entry);
      }
      return entry;
    })
    .catch(() => {
      entry.locationResolved = true;
      entry.locationResolvedLanguage = requestedLanguage;
      return entry;
    })
    .finally(() => {
      entry.locationResolvePromise = null;
    });

  return entry.locationResolvePromise;
}

function probePhotoEntry(entry) {
  return new Promise((resolve) => {
    const probe = new Image();
    probe.decoding = "async";
    probe.loading = "eager";
    probe.onload = () => resolve(entry);
    probe.onerror = () => resolve(null);
    probe.src = buildVehiclePhotoRequestUrl(entry.src);
  });
}

function buildVehiclePhotoRequestUrl(src) {
  if (!src) return "";
  const separator = src.includes("?") ? "&" : "?";
  return `${src}${separator}v=${encodeURIComponent(APP_VERSION)}`;
}

async function resolvePhotoEntriesFromCandidates(candidates) {
  if (!Array.isArray(candidates) || !candidates.length) return [];
  const probedEntries = await Promise.all(candidates.map((entry) => probePhotoEntry(entry)));
  const matchedEntries = probedEntries.filter(Boolean);
  if (!matchedEntries.length) return [];
  const enrichedEntries = await Promise.all(matchedEntries.map((entry) => enrichResolvedPhotoEntry(entry)));
  return enrichedEntries.filter(Boolean);
}

async function resolveVehiclePhotoEntries(vehicleId) {
  const indexedEntries = getIndexedPhotoEntries(vehicleId);
  if (indexedEntries.length) {
    const resolvedIndexedEntries = await resolvePhotoEntriesFromCandidates(indexedEntries);
    const indexedSrcSet = new Set(
      resolvedIndexedEntries
        .map((entry) => (entry?.src || "").toString())
        .filter(Boolean)
    );
    const supplementalCandidates = getFallbackPhotoEntries(vehicleId).filter(
      (entry) => entry?.src && !indexedSrcSet.has(entry.src)
    );
    if (!supplementalCandidates.length) {
      return mergeVehiclePhotoEntries(resolvedIndexedEntries);
    }

    const supplementalEntries = await resolvePhotoEntriesFromCandidates(
      supplementalCandidates
    );
    return mergeVehiclePhotoEntries(
      resolvedIndexedEntries,
      supplementalEntries.filter(Boolean)
    );
  }

  const suffixes = ["", ...Array.from({ length: 12 }, (_, index) => ` (${index + 1})`)];
  const resolvedEntries = [];
  let foundAnyPhotos = false;

  for (const suffix of suffixes) {
    const nextEntries = await resolvePhotoEntriesFromCandidates(getFallbackPhotoEntries(vehicleId, [suffix]));
    if (nextEntries.length) {
      resolvedEntries.push(...nextEntries);
      foundAnyPhotos = true;
      continue;
    }
    if (foundAnyPhotos) break;
  }

  return sortVehiclePhotoEntries(resolvedEntries);
}

function buildVehiclePhotoCopy(entry, vehicleId) {
  const altTemplate = translateTemplate("photoAlt", "Foto van voertuig {id}");
  const visibleVehicleId = getVehicleDisplayId(vehicleId);
  return {
    alt: entry?.alt || fillTemplate(altTemplate, visibleVehicleId),
    caption: entry?.caption || "",
    meta: entry?.meta || "",
    metaFields: entry?.metaFields || {}
  };
}

function getPhotoMetaIconMarkup(iconKey) {
  const icons = {
    maker: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 12.2a4.1 4.1 0 1 0 0-8.2 4.1 4.1 0 0 0 0 8.2Z"></path><path d="M4.8 19.2a7.2 7.2 0 0 1 14.4 0"></path></svg>',
    place: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 20s6-5.7 6-10a6 6 0 1 0-12 0c0 4.3 6 10 6 10Z"></path><circle cx="12" cy="10" r="2.2"></circle></svg>',
    date: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 3.8v2.4M17 3.8v2.4"></path><rect x="4.5" y="6.2" width="15" height="13.3" rx="2"></rect><path d="M4.5 10.2h15"></path></svg>',
    credit: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 4.5 14 8.6l4.5.7-3.2 3.1.8 4.4-4.1-2.2-4.1 2.2.8-4.4-3.2-3.1 4.5-.7Z"></path></svg>'
  };
  return icons[iconKey] || icons.maker;
}

function buildVehiclePhotoMetaMarkup(copy) {
  const metaFields = copy?.metaFields || {};
  const metaItems = [
    ["maker", getLabel("photoPhotographer", "Fotograaf"), metaFields.maker, metaFields.makerLink],
    ["place", getLabel("photoPlace", "Plaats"), metaFields.place, metaFields.placeLink],
    ["date", getLabel("photoDate", "Datum"), metaFields.date, ""],
    ["credit", getLabel("photoCredit", "Credits"), metaFields.credit, ""]
  ].filter(([, , value]) => cleanText(value));

  if (!metaItems.length) return "";

  return `
    <div class="vehicle-photo-meta-card">
      ${metaItems.map(([iconKey, label, value, link]) => `
        <div class="vehicle-photo-meta-item">
          <span class="vehicle-photo-meta-icon" aria-hidden="true">${getPhotoMetaIconMarkup(iconKey)}</span>
          <div class="vehicle-photo-meta-copy">
            <span class="vehicle-photo-meta-label">${escapeHtml(label)}</span>
            ${cleanText(link)
              ? `<a class="vehicle-photo-meta-value vehicle-photo-meta-link" href="${escapeHtml(link)}" target="_blank" rel="noopener noreferrer">${escapeHtml(value)}</a>`
              : `<strong class="vehicle-photo-meta-value">${escapeHtml(value)}</strong>`}
          </div>
        </div>
      `).join("")}
    </div>
  `;
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

function renderVehiclePhotoMeta(copy) {
  if (!vehiclePhotoMetaEl) return;
  const metaMarkup = buildVehiclePhotoMetaMarkup(copy);
  vehiclePhotoMetaEl.innerHTML = metaMarkup;
  vehiclePhotoMetaEl.hidden = !metaMarkup;
  vehiclePhotoMetaEl.setAttribute("aria-hidden", String(!metaMarkup));
}

async function hydrateActiveVehiclePhotoLocation(entry, vehicleId, entryIndex) {
  if (!entry) return;
  await hydrateVehiclePhotoEntryLocation(entry);
  if (currentPhotoVehicleId !== vehicleId) return;
  if (currentVehiclePhotoEntries[entryIndex] !== entry) return;
  renderVehiclePhotoMeta(buildVehiclePhotoCopy(entry, vehicleId));
}

function renderActiveVehiclePhoto() {
  if (!vehiclePhotoCaptionEl) return;
  if (!currentPhotoVehicleId || !currentVehiclePhotoEntries.length) {
    clearVehiclePhotoImageElement(true);
    vehiclePhotoCaptionEl.textContent = "";
    if (vehiclePhotoMetaEl) {
      vehiclePhotoMetaEl.hidden = true;
      vehiclePhotoMetaEl.textContent = "";
    }
    updateVehiclePhotoNavigation();
    return;
  }

  setVehiclePhotoEmptyStateVisible(false);
  const photoImgEl = ensureVehiclePhotoImageElement();
  if (!photoImgEl) return;
  const safeIndex = Math.min(Math.max(currentVehiclePhotoIndex, 0), currentVehiclePhotoEntries.length - 1);
  currentVehiclePhotoIndex = safeIndex;
  const activeEntry = currentVehiclePhotoEntries[safeIndex];
  const copy = buildVehiclePhotoCopy(activeEntry, currentPhotoVehicleId);
  photoImgEl.src = buildVehiclePhotoRequestUrl(activeEntry.src);
  photoImgEl.alt = copy.alt;
  vehiclePhotoCaptionEl.textContent = copy.caption;
  vehiclePhotoCaptionEl.hidden = !copy.caption;
  renderVehiclePhotoMeta(copy);
  updateVehiclePhotoNavigation();
  void hydrateActiveVehiclePhotoLocation(activeEntry, currentPhotoVehicleId, safeIndex);
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
  if (!vehiclePhotoCardEl || !vehiclePhotoCaptionEl) return;
  vehiclePhotoCardEl.hidden = true;
  vehiclePhotoCardEl.setAttribute("aria-hidden", "true");
  clearVehiclePhotoImageElement(true);
  vehiclePhotoCaptionEl.textContent = "";
  vehiclePhotoCaptionEl.hidden = true;
  if (vehiclePhotoMetaEl) {
    vehiclePhotoMetaEl.hidden = true;
    vehiclePhotoMetaEl.textContent = "";
  }
  if (vehiclePhotoCounterEl) {
    vehiclePhotoCounterEl.hidden = true;
    vehiclePhotoCounterEl.textContent = "";
  }
  setVehiclePhotoEmptyStateVisible(false);
}

async function updateVehiclePhotoCard(vehicleId) {
  if (!vehiclePhotoCardEl || !vehiclePhotoCaptionEl) return;
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
  setVehiclePhotoEmptyStateVisible(false);
  clearVehiclePhotoImageElement(true);
  vehiclePhotoCaptionEl.textContent = "";
  vehiclePhotoCaptionEl.hidden = true;

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
    showVehiclePhotoUploadPrompt(normalizedVehicleId);
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

function resetWeatherBlock() {
  lastWeatherCacheKey = "";
  lastWeatherData = null;
  lastWeatherCoordinates = null;
  lastWeatherFetchedAt = 0;
  if (!weatherBlockEl) return;
  weatherBlockEl.hidden = true;
  weatherBlockEl.setAttribute("aria-hidden", "true");
  weatherBlockEl.innerHTML = "";
}

function getWeatherCurrentSnapshot(weatherData) {
  if (!weatherData || typeof weatherData !== "object") return null;

  const current = weatherData.current && typeof weatherData.current === "object"
    ? weatherData.current
    : null;
  if (current) return current;

  const fallbackCurrent = weatherData.current_weather && typeof weatherData.current_weather === "object"
    ? weatherData.current_weather
    : null;
  if (!fallbackCurrent) return null;

  return {
    temperature_2m: typeof fallbackCurrent.temperature === "number" ? fallbackCurrent.temperature : null,
    apparent_temperature: typeof fallbackCurrent.apparent_temperature === "number" ? fallbackCurrent.apparent_temperature : null,
    is_day: fallbackCurrent.is_day,
    precipitation: typeof fallbackCurrent.precipitation === "number" ? fallbackCurrent.precipitation : null,
    weather_code: fallbackCurrent.weather_code ?? fallbackCurrent.weathercode ?? null,
    wind_speed_10m: typeof fallbackCurrent.wind_speed === "number"
      ? fallbackCurrent.wind_speed
      : (typeof fallbackCurrent.windspeed === "number" ? fallbackCurrent.windspeed : null)
  };
}

function getWeatherPresentation(weatherCode, isDay = 1) {
  const code = Number(weatherCode);
  const daytime = Number(isDay) === 1;
  const weatherMap = {
    0: { iconKey: daytime ? "sun" : "moon", label: getLabel("weatherClear", "Helder") },
    1: { iconKey: daytime ? "partly" : "cloud", label: getLabel("weatherMainlyClear", "Licht bewolkt") },
    2: { iconKey: "partly", label: getLabel("weatherPartlyCloudy", "Half bewolkt") },
    3: { iconKey: "cloud", label: getLabel("weatherCloudy", "Bewolkt") },
    45: { iconKey: "fog", label: getLabel("weatherFog", "Mist") },
    48: { iconKey: "fog", label: getLabel("weatherFog", "Mist") },
    51: { iconKey: "drizzle", label: getLabel("weatherDrizzle", "Motregen") },
    53: { iconKey: "drizzle", label: getLabel("weatherDrizzle", "Motregen") },
    55: { iconKey: "rain", label: getLabel("weatherDrizzleHeavy", "Stevige motregen") },
    56: { iconKey: "snow", label: getLabel("weatherFreezingDrizzle", "Aanhoudende ijzel") },
    57: { iconKey: "snow", label: getLabel("weatherFreezingDrizzle", "Aanhoudende ijzel") },
    61: { iconKey: "rain", label: getLabel("weatherRain", "Regen") },
    63: { iconKey: "rain", label: getLabel("weatherRain", "Regen") },
    65: { iconKey: "rain", label: getLabel("weatherHeavyRain", "Stevige regen") },
    66: { iconKey: "snow", label: getLabel("weatherFreezingRain", "IJzel") },
    67: { iconKey: "snow", label: getLabel("weatherFreezingRain", "IJzel") },
    71: { iconKey: "snow", label: getLabel("weatherSnow", "Sneeuw") },
    73: { iconKey: "snow", label: getLabel("weatherSnow", "Sneeuw") },
    75: { iconKey: "snow", label: getLabel("weatherHeavySnow", "Stevige sneeuw") },
    77: { iconKey: "snow", label: getLabel("weatherSnowGrains", "Sneeuwkorrels") },
    80: { iconKey: "drizzle", label: getLabel("weatherShowers", "Buien") },
    81: { iconKey: "rain", label: getLabel("weatherShowers", "Buien") },
    82: { iconKey: "rain", label: getLabel("weatherHeavyShowers", "Zware buien") },
    85: { iconKey: "snow", label: getLabel("weatherSnowShowers", "Sneeuwbuien") },
    86: { iconKey: "snow", label: getLabel("weatherSnowShowers", "Sneeuwbuien") },
    95: { iconKey: "storm", label: getLabel("weatherThunder", "Onweer") },
    96: { iconKey: "storm", label: getLabel("weatherThunderHail", "Onweer met hagel") },
    99: { iconKey: "storm", label: getLabel("weatherThunderHail", "Onweer met hagel") }
  };
  return weatherMap[code] || { iconKey: "partly", label: getLabel("weatherUnknown", "Weer") };
}

function getWeatherIconMarkup(iconKey, extraClass = "") {
  const className = ["weather-svg", extraClass].filter(Boolean).join(" ");
  const icons = {
    sun: `<svg class="${className}" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="4.5"></circle><path d="M12 2.5v2.2M12 19.3v2.2M21.5 12h-2.2M4.7 12H2.5M18.7 5.3l-1.6 1.6M6.9 17.1l-1.6 1.6M18.7 18.7l-1.6-1.6M6.9 6.9 5.3 5.3"></path></svg>`,
    moon: `<svg class="${className}" viewBox="0 0 24 24" aria-hidden="true"><path d="M15.5 3.2a8.8 8.8 0 1 0 5.3 15.6A9.7 9.7 0 0 1 15.5 3.2Z"></path></svg>`,
    cloud: `<svg class="${className}" viewBox="0 0 24 24" aria-hidden="true"><path d="M7.2 18.5h9.3a4 4 0 0 0 .4-8 5.9 5.9 0 0 0-11.4-1.3 3.7 3.7 0 0 0 1.7 9.3Z"></path></svg>`,
    partly: `<svg class="${className}" viewBox="0 0 24 24" aria-hidden="true"><path d="M8.3 6.1A4.1 4.1 0 0 1 15 3.4"></path><path d="M10.8 3.1v1.5M6.6 4.9l1.1 1.1M15 7.2h-1.5"></path><path d="M7.2 18.5h9.3a4 4 0 0 0 .4-8 5.9 5.9 0 0 0-11.4-1.3 3.7 3.7 0 0 0 1.7 9.3Z"></path></svg>`,
    fog: `<svg class="${className}" viewBox="0 0 24 24" aria-hidden="true"><path d="M6.8 10.4h9.5a3.4 3.4 0 0 0 .2-6.8A5 5 0 0 0 7 5.2a3.2 3.2 0 0 0-.2 5.2Z"></path><path d="M4 14.5h16M6 17.5h12M4.5 20.5h10"></path></svg>`,
    drizzle: `<svg class="${className}" viewBox="0 0 24 24" aria-hidden="true"><path d="M7.2 14h9.3a4 4 0 0 0 .4-8 5.9 5.9 0 0 0-11.4-1.3A3.7 3.7 0 0 0 7.2 14Z"></path><path d="M9 17.2v.2M12 18v.2M15 17.2v.2"></path></svg>`,
    rain: `<svg class="${className}" viewBox="0 0 24 24" aria-hidden="true"><path d="M7.2 13.6h9.3a4 4 0 0 0 .4-8 5.9 5.9 0 0 0-11.4-1.3 3.7 3.7 0 0 0 1.7 9.3Z"></path><path d="M9 16.5l-1 3M12.5 16.5l-1 3M16 16.5l-1 3"></path></svg>`,
    snow: `<svg class="${className}" viewBox="0 0 24 24" aria-hidden="true"><path d="M7.2 13.6h9.3a4 4 0 0 0 .4-8 5.9 5.9 0 0 0-11.4-1.3 3.7 3.7 0 0 0 1.7 9.3Z"></path><path d="M9 17.5h.01M12 19h.01M15 17.5h.01"></path></svg>`,
    storm: `<svg class="${className}" viewBox="0 0 24 24" aria-hidden="true"><path d="M7.2 13.6h9.3a4 4 0 0 0 .4-8 5.9 5.9 0 0 0-11.4-1.3 3.7 3.7 0 0 0 1.7 9.3Z"></path><path d="m11 14.8-1.2 3.1h2l-.8 3.1 3-4.1h-2l1-2.1"></path></svg>`,
    status: `<svg class="${className}" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="7"></circle><path d="M12 8.8v3.7l2.2 1.3"></path></svg>`,
    thermometer: `<svg class="${className}" viewBox="0 0 24 24" aria-hidden="true"><path d="M10 5.5a2 2 0 1 1 4 0v7a4 4 0 1 1-4 0Z"></path><path d="M12 10.2v6"></path></svg>`,
    feels: `<svg class="${className}" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 20s-6.5-3.9-6.5-9.2A3.8 3.8 0 0 1 12 8.3a3.8 3.8 0 0 1 6.5 2.5C18.5 16.1 12 20 12 20Z"></path></svg>`,
    wind: `<svg class="${className}" viewBox="0 0 24 24" aria-hidden="true"><path d="M3 9.5h10.5a2.5 2.5 0 1 0-2.5-2.5"></path><path d="M3 14h13.5a2.5 2.5 0 1 1-2.5 2.5"></path><path d="M3 18.5h7.5a2.5 2.5 0 1 0-2.5 2.5"></path></svg>`,
    umbrella: `<svg class="${className}" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 12a8 8 0 0 1 16 0Z"></path><path d="M12 12v5.2a2.3 2.3 0 0 1-4.6 0"></path></svg>`,
    pin: `<svg class="${className}" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 20s6-5.8 6-10a6 6 0 1 0-12 0c0 4.2 6 10 6 10Z"></path><circle cx="12" cy="10" r="2.2"></circle></svg>`,
    arrow: `<svg class="${className}" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h11"></path><path d="m12 5 7 7-7 7"></path></svg>`
  };
  return icons[iconKey] || icons.cloud;
}

function formatWeatherMetric(value, suffix, digits = 0) {
  if (typeof value !== "number" || !Number.isFinite(value)) return "-";
  const formatted = digits > 0 ? value.toFixed(digits) : Math.round(value).toString();
  return `${formatted}${suffix}`;
}

function getWeatherSourceText() {
  return getLabel("weatherApiSource", "Bron: Open-Meteo via Busbibliotheek");
}

function renderWeatherModal(weatherData, latitude, longitude) {
  if (!weatherModalBodyEl) return;
  const current = getWeatherCurrentSnapshot(weatherData);
  if (!current) return;
  const presentation = getWeatherPresentation(current.weather_code, current.is_day);
  const rows = [
    ["status", getLabel("weatherNow", "Toestand"), presentation.label],
    ["thermometer", getLabel("weatherTemperature", "Temperatuur"), formatWeatherMetric(current.temperature_2m, "°C")],
    ["feels", getLabel("weatherFeelsLike", "Gevoelstemperatuur"), formatWeatherMetric(current.apparent_temperature, "°C")],
    ["wind", getLabel("weatherWind", "Wind"), formatWeatherMetric(current.wind_speed_10m, " km/u")],
    ["umbrella", getLabel("weatherRain", "Neerslag"), formatWeatherMetric(current.precipitation, " mm", 1)]
  ];
  weatherModalBodyEl.innerHTML = `
    <div class="weather-modal-hero">
      <span class="weather-icon weather-modal-icon" aria-hidden="true">${getWeatherIconMarkup(presentation.iconKey, "weather-svg--hero")}</span>
      <div class="weather-modal-hero-copy">
        <strong>${escapeHtml(presentation.label)}</strong>
        <span>${escapeHtml(getLabel("weatherModalSubtitle", "Huidige weersituatie"))}</span>
      </div>
      <div class="weather-modal-temp">
        <strong>${escapeHtml(formatWeatherMetric(current.temperature_2m, "°C"))}</strong>
        <span>${escapeHtml(getLabel("weatherTemperature", "Temperatuur"))}</span>
      </div>
    </div>
    <div class="weather-detail-grid">
      ${rows.map(([icon, label, value]) => `
        <div class="weather-detail-card">
          <span class="weather-detail-icon" aria-hidden="true">${getWeatherIconMarkup(icon, "weather-svg--detail")}</span>
          <span class="weather-detail-label">${escapeHtml(label)}</span>
          <strong class="weather-detail-value">${escapeHtml(value)}</strong>
        </div>
      `).join("")}
    </div>
    <p class="weather-modal-source">${escapeHtml(getWeatherSourceText())}</p>
  `;
}

function showWeatherModal() {
  if (!weatherModalEl || !lastWeatherData || !lastWeatherCoordinates) return;
  renderWeatherModal(lastWeatherData, lastWeatherCoordinates.latitude, lastWeatherCoordinates.longitude);
  openOverlayModal(weatherModalEl, { focusTarget: weatherModalCloseBtn });
}

function hideWeatherModal() {
  closeOverlayModal(weatherModalEl);
}

function renderWeatherBlock(weatherData, latitude, longitude) {
  if (!weatherBlockEl) {
    resetWeatherBlock();
    return;
  }

  const current = getWeatherCurrentSnapshot(weatherData);
  if (!current) {
    resetWeatherBlock();
    return;
  }
  const presentation = getWeatherPresentation(current.weather_code, current.is_day);
  const temperature = typeof current.temperature_2m === "number" ? `${Math.round(current.temperature_2m)}°C` : "-";

  weatherBlockEl.innerHTML = `
    <button class="weather-card weather-card-link" type="button" aria-label="${escapeHtml(getLabel("weatherOpenForecast", "Open weerdetails"))}">
      <div class="weather-card-main">
        <span class="weather-icon" aria-hidden="true">${getWeatherIconMarkup(presentation.iconKey)}</span>
        <div class="weather-copy">
          <div class="weather-headline-row">
            <strong class="weather-title">${escapeHtml(presentation.label)}</strong>
          </div>
          <span class="weather-source">${escapeHtml(getLabel("weatherSource", "Tik voor meer weerinfo"))}</span>
          <span class="weather-source weather-source-meta">${escapeHtml(getWeatherSourceText())}</span>
        </div>
        <span class="weather-temperature weather-temperature--inline" aria-hidden="true">${escapeHtml(temperature)}</span>
        <span class="weather-card-chevron" aria-hidden="true">${getWeatherIconMarkup("arrow", "weather-svg--arrow")}</span>
      </div>
    </button>
  `;
  weatherBlockEl.querySelector(".weather-card-link")?.addEventListener("click", showWeatherModal);
  weatherBlockEl.hidden = false;
  weatherBlockEl.setAttribute("aria-hidden", "false");
}

async function updateWeatherForCoordinates(latitude, longitude) {
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    resetWeatherBlock();
    return;
  }

  const cacheKey = `${latitude.toFixed(2)},${longitude.toFixed(2)}`;
  const cacheStillFresh =
    cacheKey === lastWeatherCacheKey &&
    lastWeatherData &&
    Date.now() - lastWeatherFetchedAt < WEATHER_CACHE_MS;

  if (cacheStillFresh) {
    renderWeatherBlock(lastWeatherData, latitude, longitude);
    return;
  }

  const requestToken = ++weatherRequestToken;
  try {
    const weatherUrl = `${API_URL}?resource=weather&latitude=${encodeURIComponent(latitude)}&longitude=${encodeURIComponent(longitude)}`;
    const response = await fetchWithTimeout(weatherUrl, { cache: "no-store" });
    const weatherData = await response.json();
    if (requestToken !== weatherRequestToken) return;
    lastWeatherCacheKey = cacheKey;
    lastWeatherData = weatherData;
    lastWeatherCoordinates = { latitude, longitude };
    lastWeatherFetchedAt = Date.now();
    renderWeatherBlock(weatherData, latitude, longitude);
  } catch (error) {
    if (requestToken !== weatherRequestToken) return;
    console.warn("Weer laden mislukt", error);
    resetWeatherBlock();
  }
}

function isIosInstallable() {
  const isStandalone = isStandaloneDisplayMode();
  return isIosPlatform && !isStandalone;
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
    settings.dashboardVehicleIds = normalizeDashboardVehicleIds(settings.dashboardVehicleIds);
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
  if (isAndroidWebView && (androidHostThemeMode === "dark" || androidHostThemeMode === "light")) {
    return androidHostThemeMode;
  }
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
  if (isAndroidHostApp() && typeof window.Android?.updateTheme === "function") {
    try {
      window.Android.updateTheme(nextThemeColor, resolvedTheme);
    } catch (error) {
      console.warn("Android theme-sync mislukt", error);
    }
  }
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
  if (splashTitleEl) splashTitleEl.textContent = getLabel("appTitle", "Busbibliotheek");
  appSubtitleEl.textContent = t("subtitle").replace(/\.\s*$/, "");
  if (splashCreditEl) splashCreditEl.textContent = getLabel("madeBy", "Made by @delijn_busspotter");
  if (installBtn) installBtn.textContent = t("install");
  const moreLabel = getLabel("more", "Meer");
  const menuLabel = getLabel("menu", "Menu");
  favoritesToggleBtn.title = menuLabel;
  favoritesToggleBtn.setAttribute("aria-label", menuLabel);
  if (menuToggleTextEl) menuToggleTextEl.textContent = menuLabel;
  if (morePanelTitleEl) morePanelTitleEl.textContent = moreLabel;
  if (morePanelSubtitleEl) morePanelSubtitleEl.textContent = getLabel("moreSubtitle", "Snelle functies en extra tools.");
  if (moreFunctionsTitleEl) moreFunctionsTitleEl.textContent = getLabel("moreFunctions", "Extra functies");
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
  if (halteSearchToggleBtn) {
    halteSearchToggleBtn.textContent = getLabel("haltSearch", "Halte zoeken");
    halteSearchToggleBtn.title = getLabel("haltSearch", "Halte zoeken");
    halteSearchToggleBtn.setAttribute("aria-label", getLabel("haltSearch", "Halte zoeken"));
  }
  if (dashboardEditBtn) dashboardEditBtn.textContent = getLabel("dashboardEdit", "Aanpassen");
  if (dashboardCloseBtn) {
    dashboardCloseBtn.setAttribute("aria-label", getLabel("dashboardClose", "Stalk modus sluiten"));
    dashboardCloseBtn.title = getLabel("close", "Sluiten");
    dashboardCloseBtn.hidden = isAndroidTvPlatform;
  }
  if (dashboardMapEl) dashboardMapEl.setAttribute("aria-label", getLabel("dashboardMapAria", "Kaart met live voertuigen"));
  staticCardTitleEl.textContent = t("staticCard");
  realtimeCardTitleEl.textContent = t("realtimeCard");
  if (compareCardTitleEl) compareCardTitleEl.textContent = getLabel("compareTitle", "Vergelijking");
  if (compareCardSummaryEl && compareCardEl?.hidden) {
    compareCardSummaryEl.textContent = "";
    compareCardSummaryEl.hidden = true;
  }
  if (compareClearBtn) compareClearBtn.setAttribute("aria-label", getLabel("compareClose", "Vergelijking sluiten"));
  if (haltModuleTitleEl) haltModuleTitleEl.textContent = getLabel("haltSearch", "Halte zoeken");
  if (haltModuleDescriptionEl) haltModuleDescriptionEl.textContent = getLabel("haltSearchDescription", "Voer een haltecode of haltenaam in om een halte van De Lijn te zoeken.");
  if (haltecodeInputEl) haltecodeInputEl.placeholder = getLabel("haltCodePlaceholder", "Haltecode of naam");
  if (haltecodeSearchBtn) haltecodeSearchBtn.textContent = getLabel("haltSearchOpen", "Zoek halte");
  if (haltSearchHelpEl) haltSearchHelpEl.textContent = getLabel("haltSearchHelp", "Als je op zoeken drukt, kom je op de site van De Lijn terecht.");
  if (!haltecodeErrorEl?.hidden) {
    haltecodeErrorEl.textContent = getLabel("haltSearchInvalid", "Voer een haltecode of haltenaam in.");
  }
  if (vehiclePhotoPrevBtn) vehiclePhotoPrevBtn.setAttribute("aria-label", getLabel("photoPrevious", "Vorige foto"));
  if (vehiclePhotoNextBtn) vehiclePhotoNextBtn.setAttribute("aria-label", getLabel("photoNext", "Volgende foto"));
  updateVehiclePhotoTexts();
  disclaimerTitleEl.textContent = t("disclaimerTitle");
  disclaimerTextEl.textContent = t("disclaimerText");
  if (footerReviewBtn) footerReviewBtn.textContent = getLabel("footerReview", "Review afleggen");
  if (footerTermsBtn) footerTermsBtn.textContent = getLabel("footerTerms", "Gebruiksvoorwaarden");
  closeBtnEl.title = getLabel("back", "Terug");
  closeBtnEl.setAttribute("aria-label", getLabel("back", "Terug"));
  if (closeBtnTextEl) closeBtnTextEl.textContent = getLabel("back", "Terug");
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
  if (pdfModalNoteEl) pdfModalNoteEl.textContent = getLabel("pdfNote", "De PDF wordt als echt document opgebouwd en meteen gedownload.");
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
  if (dashboardTvSettingsTitleEl) dashboardTvSettingsTitleEl.textContent = getLabel("dashboardTvSettingsTitle", "Weergave op tv");
  if (dashboardTvSettingsSummaryEl) dashboardTvSettingsSummaryEl.textContent = getLabel("dashboardTvSettingsSummary", "Pas het uitzicht aan zonder naar het gewone instellingenmenu te gaan.");
  if (dashboardThemeLabelEl) dashboardThemeLabelEl.textContent = t("theme");
  if (dashboardThemeAutoOptEl) dashboardThemeAutoOptEl.textContent = t("themeAuto");
  if (dashboardThemeLightOptEl) dashboardThemeLightOptEl.textContent = t("themeLight");
  if (dashboardThemeDarkOptEl) dashboardThemeDarkOptEl.textContent = t("themeDark");
  if (dashboardColorThemeLabelEl) dashboardColorThemeLabelEl.textContent = t("colorTheme");
  if (dashboardColorClassicOptEl) dashboardColorClassicOptEl.textContent = t("colorClassic");
  if (dashboardColorBlueOptEl) dashboardColorBlueOptEl.textContent = t("colorBlue");
  if (dashboardColorGreenOptEl) dashboardColorGreenOptEl.textContent = t("colorGreen");
  if (dashboardColorYellowOptEl) dashboardColorYellowOptEl.textContent = t("colorYellow");
  if (dashboardColorOrangeOptEl) dashboardColorOrangeOptEl.textContent = getLabel("colorOrange", "Oranje");
  if (dashboardColorRedOptEl) dashboardColorRedOptEl.textContent = t("colorRed");
  if (dashboardColorPurpleOptEl) dashboardColorPurpleOptEl.textContent = t("colorPurple");
  dashboardSetupCloseBtn.setAttribute("aria-label", getLabel("close", "Sluiten"));
  dashboardSetupCancelBtn.textContent = getLabel("cancel", "Annuleren");
  dashboardSetupConfirmBtn.textContent = getLabel("dashboardSetupConfirm", "Stalk modus openen");
  if (infoModalTitleEl) infoModalTitleEl.textContent = getLabel("infoTitle", "Site-info");
  if (infoModalSummaryEl) infoModalSummaryEl.textContent = getLabel("infoSummary", "Versie en laatste updates van de databronnen.");
  infoModalCloseBtn.setAttribute("aria-label", getLabel("close", "Sluiten"));
  infoModalOkBtn.textContent = getLabel("close", "Sluiten");
  if (resetSiteDataBtn) resetSiteDataBtn.textContent = getLabel("resetSiteData", "Reset website");
  if (installGuideTitleEl) installGuideTitleEl.textContent = getLabel("installGuideTitle", "Installeren op iPhone");
  if (installGuideSummaryEl) installGuideSummaryEl.textContent = getLabel("installGuideSummary", "Voeg Busbibliotheek toe aan je beginscherm via het deelmenu van Safari.");
  if (installGuideCloseBtn) installGuideCloseBtn.setAttribute("aria-label", getLabel("close", "Sluiten"));
  if (installGuideOkBtn) installGuideOkBtn.textContent = getLabel("close", "Sluiten");
  if (appDialogTitleEl && appDialogModalEl?.hidden) appDialogTitleEl.textContent = getLabel("dialogInfoTitle", "Melding");
  if (appDialogCloseBtn) appDialogCloseBtn.setAttribute("aria-label", getLabel("close", "Sluiten"));
  if (appDialogCancelBtn) appDialogCancelBtn.textContent = getLabel("cancel", "Annuleren");
  if (appDialogConfirmBtn) appDialogConfirmBtn.textContent = getLabel("dialogOk", "OK");
  if (halteSearchCloseBtn) halteSearchCloseBtn.setAttribute("aria-label", getLabel("close", "Sluiten"));
  if (reviewModalTitleEl) reviewModalTitleEl.textContent = getLabel("footerReview", "Review afleggen");
  if (reviewModalSummaryEl) reviewModalSummaryEl.textContent = getLabel("reviewSummary", "Laat weten wat beter kan of wat je goed vindt aan Busbibliotheek.");
  if (reviewModalCloseBtn) reviewModalCloseBtn.setAttribute("aria-label", getLabel("close", "Sluiten"));
  if (reviewModalDoneBtn) reviewModalDoneBtn.textContent = getLabel("close", "Sluiten");
  if (reviewMobileLinkEl) reviewMobileLinkEl.textContent = getLabel("reviewMobileOpen", "Open reviewformulier");
  if (photoUploadModalCloseBtn) photoUploadModalCloseBtn.setAttribute("aria-label", getLabel("close", "Sluiten"));
  if (photoUploadModalDoneBtn) photoUploadModalDoneBtn.textContent = getLabel("close", "Sluiten");
  if (termsModalTitleEl) termsModalTitleEl.textContent = getLabel("footerTerms", "Gebruiksvoorwaarden");
  if (termsModalSummaryEl) termsModalSummaryEl.textContent = getLabel("termsSummary", "Korte standaardvoorwaarden voor het gebruik van Busbibliotheek.");
  if (termsModalCloseBtn) termsModalCloseBtn.setAttribute("aria-label", getLabel("close", "Sluiten"));
  if (termsModalDoneBtn) termsModalDoneBtn.textContent = getLabel("close", "Sluiten");
  if (weatherModalTitleEl) weatherModalTitleEl.textContent = getLabel("weatherModalTitle", "Weer op locatie");
  if (weatherModalSummaryEl) weatherModalSummaryEl.textContent = getLabel("weatherModalSummary", "Weergegevens van dezelfde bron als de weerkaart.");
  if (weatherModalCloseBtn) weatherModalCloseBtn.setAttribute("aria-label", getLabel("close", "Sluiten"));
  if (weatherModalDoneBtn) weatherModalDoneBtn.textContent = getLabel("close", "Sluiten");
  if (!weatherModalEl?.hidden && lastWeatherData && lastWeatherCoordinates) {
    renderWeatherModal(lastWeatherData, lastWeatherCoordinates.latitude, lastWeatherCoordinates.longitude);
  }
  if (!installGuideModalEl?.hidden) renderInstallGuideModalContent();
  if (!termsModalEl?.hidden) renderTermsModalContent();
  if (pageLoadingTextEl) pageLoadingTextEl.textContent = t("loading");
  lastUpdateEl.textContent = `${t("lastUpdate")}: -`;
  lastUpdateEl.hidden = true;
  if (dashboardSummaryEl && dashboardPanelEl?.hidden) {
    dashboardSummaryEl.textContent = getLabel("dashboardSummary", "Volg negen voertuigen tegelijk.");
  }
  if (!currentVehicleId) {
    realtimeEl.innerHTML = t("noData");
    vasteDataEl.innerHTML = t("noneSelected");
    resetWeatherBlock();
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

function setHalteStatus(message = "") {
  if (!haltecodeErrorEl) return;
  haltecodeErrorEl.hidden = !message;
  haltecodeErrorEl.textContent = message;
}

function clearHalteSearchResults() {
  if (!haltSearchResultsListEl) return;
  haltSearchResultsListEl.innerHTML = "";
  haltSearchResultsListEl.hidden = true;
}

function getGroupedHalteBaseName(rawName = "") {
  const value = cleanText(rawName);
  if (!value) return "";
  return value
    .replace(/\s*[-,]?\s*perron\s+[a-z0-9]+$/i, "")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeHalteCode(value = "") {
  return String(value || "").replace(/\D+/g, "");
}

function isValidHalteCode(value = "") {
  return HALTE_CODE_REGEX.test(normalizeHalteCode(value));
}

function getHalteRealtimeLink(codes = []) {
  const normalizedCodes = [...new Set(
    (Array.isArray(codes) ? codes : [codes])
      .map((code) => normalizeHalteCode(code))
      .filter((code) => isValidHalteCode(code))
  )];
  if (!normalizedCodes.length) return "";
  return `https://www.delijn.be/realtime/${normalizedCodes.join("+")}/20`;
}

function getProvinceForHalteCode(code = "") {
  const firstDigit = String(code || "").trim().charAt(0);
  if (firstDigit === "1") return "Antwerpen";
  if (firstDigit === "2") return "Oost-Vlaanderen";
  if (firstDigit === "3") return "Vlaams-Brabant";
  if (firstDigit === "4") return "Limburg";
  if (firstDigit === "5") return "West-Vlaanderen";
  return "";
}

function renderHalteSearchResults(haltes = []) {
  if (!haltSearchResultsListEl) return;
  haltSearchResultsListEl.innerHTML = "";
  haltSearchResultsListEl.hidden = haltes.length === 0;
  if (!haltes.length) return;

  haltes.forEach((halte) => {
    const halteCodes = Array.isArray(halte?.haltenummers)
      ? halte.haltenummers
      : [String(halte?.haltenummer || "").trim()];
    const validCodes = [...new Set(halteCodes.map((code) => normalizeHalteCode(code)).filter((code) => isValidHalteCode(code)))];
    if (!validCodes.length) return;

    const primaryCode = validCodes[0];
    const omschrijving = String(halte?.omschrijvingLang || halte?.omschrijving || primaryCode).trim();
    const provincie = getProvinceForHalteCode(primaryCode);
    const item = document.createElement("li");
    item.className = "vehicle-suggestion-item halte-suggestion-item";
    item.innerHTML = `
      <span class="vehicle-suggestion-primary">${escapeHtml(omschrijving)}</span>
      <span class="vehicle-suggestion-secondary">${escapeHtml(provincie || getLabel("unknownProvince", "Onbekende provincie"))}</span>
    `;
    item.addEventListener("mousedown", (event) => {
      event.preventDefault();
    });
    item.addEventListener("click", () => {
      if (haltecodeInputEl) haltecodeInputEl.value = omschrijving;
      openHalteRealtime(validCodes);
    });
    haltSearchResultsListEl.appendChild(item);
  });

  haltSearchResultsListEl.hidden = haltSearchResultsListEl.childElementCount === 0;
}

async function updateHalteSuggestions() {
  const zoekTerm = (haltecodeInputEl?.value || "").trim();
  const requestToken = ++halteSearchRequestToken;
  const normalizedCodeQuery = normalizeHalteCode(zoekTerm);

  if (!zoekTerm) {
    setHalteStatus("");
    clearHalteSearchResults();
    return;
  }

  if (isValidHalteCode(normalizedCodeQuery)) {
    setHalteStatus("");
    clearHalteSearchResults();
    return;
  }

  try {
    const haltes = await searchHaltesLocal(zoekTerm);
    if (requestToken !== halteSearchRequestToken) return;
    renderHalteSearchResults(haltes);
    setHalteStatus(haltes.length ? "" : getLabel("haltSearchNoResults", "Geen haltes gevonden."));
  } catch (error) {
    if (requestToken !== halteSearchRequestToken) return;
    console.error("Haltesuggesties laden mislukt", error);
    clearHalteSearchResults();
    setHalteStatus("");
  }
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
  const validCodes = [...new Set(haltecodes.map((code) => normalizeHalteCode(code)).filter((code) => isValidHalteCode(code)))];
  if (!validCodes.length) {
    setHalteStatus(getLabel("haltSearchInvalid", "Voer een haltecode of haltenaam in."));
    clearHalteSearchResults();
    if (navigator.vibrate) navigator.vibrate(160);
    return false;
  }

  halteSearchRequestToken += 1;
  setHalteStatus("");
  clearHalteSearchResults();
  hideHalteSearchModal();
  return openExternalUrl(getHalteRealtimeLink(validCodes), { forceSameTab: true });
}

async function searchHaltes() {
  const zoekTerm = (haltecodeInputEl?.value || "").trim();
  const normalizedCodeQuery = normalizeHalteCode(zoekTerm);
  if (!zoekTerm) {
    setHalteStatus(getLabel("haltSearchInvalid", "Voer een haltecode of haltenaam in."));
    clearHalteSearchResults();
    if (navigator.vibrate) navigator.vibrate(160);
    return;
  }

  if (isValidHalteCode(normalizedCodeQuery)) {
    if (haltecodeInputEl) haltecodeInputEl.value = normalizedCodeQuery;
    openHalteRealtime(normalizedCodeQuery);
    return;
  }

  const requestToken = ++halteSearchRequestToken;
  setHalteStatus(getLabel("haltSearchLoading", "Haltes worden gezocht..."));
  clearHalteSearchResults();

  try {
    const haltes = await searchHaltesLocal(zoekTerm);
    if (requestToken !== halteSearchRequestToken) return;
    if (haltes.length === 1) {
      openHalteRealtime(haltes[0]?.haltenummers || haltes[0]?.haltenummer || "");
      return;
    }
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
  } catch (e) {
    console.warn("feed_info laden mislukt", e);
    feedEndDateValue = "";
  }

  updateFeedStatusText();
}

function setFavoritesPanel(open) {
  const shouldOpen = !!open;
  if (!favoritesBackdropEl || !favoritesPanelEl || !favoritesToggleBtn) {
    favoritesPanelOpen = false;
    document.body.classList.remove("more-open");
    removeInteractiveOverlay(favoritesBackdropEl);
    syncInteractiveOverlayState();
    return;
  }
  if (shouldOpen === favoritesPanelOpen) {
    if (!shouldOpen) {
      favoritesPanelEl.setAttribute("aria-hidden", "true");
      favoritesPanelEl.hidden = true;
      favoritesBackdropEl.setAttribute("aria-hidden", "true");
      favoritesBackdropEl.removeAttribute("data-overlay-state");
      favoritesBackdropEl.style.removeProperty("display");
      favoritesBackdropEl.style.removeProperty("visibility");
      favoritesBackdropEl.style.removeProperty("pointer-events");
      favoritesBackdropEl.hidden = true;
      favoritesToggleBtn.setAttribute("aria-expanded", "false");
      favoritesToggleBtn.classList.remove("active");
      document.body.classList.remove("more-open");
      removeInteractiveOverlay(favoritesBackdropEl);
      syncInteractiveOverlayState();
    }
    return;
  }
  favoritesPanelOpen = shouldOpen;
  if (favoritesPanelOpen) {
    favoritesPanelRestoreFocusEl = document.activeElement instanceof HTMLElement ? document.activeElement : favoritesToggleBtn;
    favoritesBackdropEl.hidden = false;
    favoritesBackdropEl.setAttribute("aria-hidden", "false");
    favoritesBackdropEl.setAttribute("data-overlay-state", "open");
    favoritesBackdropEl.style.display = "grid";
    favoritesBackdropEl.style.visibility = "visible";
    favoritesBackdropEl.style.pointerEvents = "auto";
    favoritesPanelEl.hidden = false;
    favoritesPanelEl.setAttribute("aria-hidden", "false");
    pushInteractiveOverlay(favoritesBackdropEl);
  } else {
    favoritesPanelEl.setAttribute("aria-hidden", "true");
    favoritesPanelEl.hidden = true;
    favoritesBackdropEl.setAttribute("aria-hidden", "true");
    favoritesBackdropEl.removeAttribute("data-overlay-state");
    favoritesBackdropEl.style.removeProperty("display");
    favoritesBackdropEl.style.removeProperty("visibility");
    favoritesBackdropEl.style.removeProperty("pointer-events");
    favoritesBackdropEl.hidden = true;
    removeInteractiveOverlay(favoritesBackdropEl);
  }
  favoritesToggleBtn.setAttribute("aria-expanded", String(favoritesPanelOpen));
  favoritesToggleBtn.classList.toggle("active", favoritesPanelOpen);
  document.body.classList.toggle("more-open", favoritesPanelOpen);
  syncInteractiveOverlayState();
  if (favoritesPanelOpen) {
    window.requestAnimationFrame(() => focusInteractiveOverlay(favoritesBackdropEl));
    return;
  }
  const restoreTarget = favoritesPanelRestoreFocusEl;
  favoritesPanelRestoreFocusEl = null;
  if (restoreTarget instanceof HTMLElement) {
    window.requestAnimationFrame(() => {
      try {
        restoreTarget.focus({ preventScroll: true });
      } catch (_) {
        restoreTarget.focus();
      }
    });
  }
}

function showFunnyModal() {
  openOverlayModal(funnyModalEl, { focusTarget: funnyModalCloseBtn });
}

function hideFunnyModal() {
  closeOverlayModal(funnyModalEl);
}

function closeInteractiveOverlay(overlayEl) {
  if (!overlayEl || !isOverlayOpen(overlayEl)) return false;
  if (overlayEl === favoritesBackdropEl) {
    setFavoritesPanel(false);
    return true;
  }
  if (overlayEl === halteSearchModalEl) {
    hideHalteSearchModal();
    return true;
  }
  if (overlayEl === dashboardSetupModalEl) {
    hideDashboardSetupModal();
    return true;
  }
  if (overlayEl === reviewModalEl) {
    hideReviewModal();
    return true;
  }
  if (overlayEl === photoUploadModalEl) {
    hidePhotoUploadModal();
    return true;
  }
  if (overlayEl === termsModalEl) {
    hideTermsModal();
    return true;
  }
  if (overlayEl === weatherModalEl) {
    hideWeatherModal();
    return true;
  }
  if (overlayEl === infoModalEl) {
    hideInfoModal();
    return true;
  }
  if (overlayEl === installGuideModalEl) {
    hideInstallGuideModal();
    return true;
  }
  if (overlayEl === appDialogModalEl) {
    closeAppDialog(false);
    return true;
  }
  if (overlayEl === compareModalEl) {
    hideCompareModal();
    return true;
  }
  if (overlayEl === pdfModalEl) {
    hidePdfModal();
    return true;
  }
  if (overlayEl === funnyModalEl) {
    hideFunnyModal();
    return true;
  }
  closeOverlayModal(overlayEl);
  return true;
}

function closeTopInteractiveOverlay() {
  return closeInteractiveOverlay(getTopInteractiveOverlay());
}

window.__BB_HAS_ACTIVE_OVERLAY__ = () => !!getTopInteractiveOverlay();
window.__BB_CLOSE_TOP_OVERLAY__ = () => closeTopInteractiveOverlay();
window.__BB_CLOSE_ACTIVE_VIEW__ = () => {
  if (isDashboardPanelOpen()) {
    closeDashboardPanel({ historyMode: "replace" });
    return true;
  }
  return false;
};

function trapInteractiveOverlayFocus(event, overlayEl) {
  if (!overlayEl || event.key !== "Tab") return false;
  const focusableElements = getInteractiveOverlayFocusableElements(overlayEl);
  const scopeEl = getInteractiveOverlayFocusScope(overlayEl);
  if (!(scopeEl instanceof HTMLElement)) return false;
  if (!focusableElements.length) {
    event.preventDefault();
    focusInteractiveOverlay(overlayEl);
    return true;
  }
  const firstFocusableEl = focusableElements[0];
  const lastFocusableEl = focusableElements[focusableElements.length - 1];
  const activeEl = document.activeElement instanceof HTMLElement ? document.activeElement : null;
  const isInsideOverlay = !!activeEl && (activeEl === scopeEl || scopeEl.contains(activeEl));
  if (!isInsideOverlay) {
    event.preventDefault();
    focusInteractiveOverlay(overlayEl, event.shiftKey ? lastFocusableEl : firstFocusableEl);
    return true;
  }
  if (event.shiftKey && activeEl === firstFocusableEl) {
    event.preventDefault();
    lastFocusableEl.focus({ preventScroll: true });
    return true;
  }
  if (!event.shiftKey && activeEl === lastFocusableEl) {
    event.preventDefault();
    firstFocusableEl.focus({ preventScroll: true });
    return true;
  }
  return false;
}

function triggerDirectDownload(url, fileName) {
  if (isAndroidHostApp() && typeof window.Android?.downloadFile === "function") {
    const lowerName = (fileName || "").toLowerCase();
    const mimeType = lowerName.endsWith(".apk")
      ? "application/vnd.android.package-archive"
      : lowerName.endsWith(".py")
        ? "text/x-python"
        : "application/octet-stream";
    try {
      window.Android.downloadFile(url, fileName || "", mimeType);
      return;
    } catch (error) {
      console.warn("Native Android-download mislukt, browserdownload wordt gebruikt", error);
    }
  }
  const downloadLink = document.createElement("a");
  downloadLink.href = url;
  downloadLink.download = fileName;
  downloadLink.rel = "noopener";
  downloadLink.style.display = "none";
  document.body.appendChild(downloadLink);
  downloadLink.click();
  downloadLink.remove();
}

async function confirmAndStartDownload(options = {}) {
  const {
    downloadType = "bestand",
    fileLabel = "",
    onConfirm = null
  } = options;
  const readableLabel = fileLabel || downloadType;
  const confirmed = await showAppConfirm(
    getLabel(
      `confirm${downloadType.charAt(0).toUpperCase()}${downloadType.slice(1)}Download`,
      `Download ${readableLabel} nu naar dit toestel?`
    ),
    {
      title: getLabel("dialogConfirmTitle", "Bevestiging"),
      confirmLabel: getLabel("dialogOk", "OK")
    }
  );
  if (!confirmed) return false;
  if (typeof onConfirm === "function") onConfirm();
  return true;
}

function startPythonDownload() {
  triggerDirectDownload(PYTHON_MAIN_DOWNLOAD_URL, "script.py");
  void showAppAlert(getLabel("pythonDownloadStarted", "De download van script.py is gestart."));
}

function startApkDownload() {
  triggerDirectDownload(APK_DOWNLOAD_URL, "Busbibliotheek.apk");
  void showAppAlert(getLabel("apkDownloadStarted", "De download van Busbibliotheek.apk is gestart."));
}

async function resetSiteData() {
  if (!(await showAppConfirm(
    getLabel("resetSiteDataConfirm", "Alles van Busbibliotheek op dit toestel resetten?"),
    {
      title: getLabel("dialogConfirmTitle", "Bevestiging"),
      confirmLabel: getLabel("dialogOk", "OK")
    }
  ))) return;

  try {
    localStorage.removeItem(FAVORITES_KEY);
    localStorage.removeItem(SETTINGS_KEY);
  } catch (_) {
    // Storage is optional.
  }

  favorites = [];
  dashboardVehicleIds = [];
  settings = {
    intervalMs: 10000,
    theme: "auto",
    colorTheme: "classic",
    language: "nl",
    dashboardVehicleIds: []
  };
  window.settings = settings;

  try {
    if ("caches" in window) {
      const cacheKeys = await caches.keys();
      await Promise.all(cacheKeys.map((key) => caches.delete(key)));
    }
  } catch (_) {
    // Cache cleanup is best effort.
  }

  try {
    if ("serviceWorker" in navigator) {
      const registrations = await navigator.serviceWorker.getRegistrations();
      await Promise.all(registrations.map((registration) => registration.unregister()));
    }
  } catch (_) {
    // Service worker cleanup is best effort.
  }

  window.location.replace(window.location.pathname);
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
    const displayId = getVehicleDisplayId(bus || id) || id;
    const item = document.createElement("div");
    item.className = "favorite-item";
    item.dataset.id = id;
    item.setAttribute("role", "button");
    item.setAttribute("tabindex", "0");
    item.innerHTML = `
      <div class="favorite-chip">
        <span class="chip-title">${escapeHtml(displayId)}</span>
        ${vehicleType ? `<span class="chip-subtitle">${escapeHtml(vehicleType)}</span>` : ""}
      </div>
      <button class="favorite-action-btn favorite-action-btn--remove" type="button" data-action="remove" aria-label="${escapeHtml(t("favoriteRemove"))}">&times;</button>
    `;
    item.addEventListener("click", (event) => {
      if (Date.now() < favoriteDragSuppressUntil) return;
      const target = event.target;
      if (target instanceof Element && target.closest(".favorite-action-btn")) return;
      setVehicleInputResolvedId(voertuigInput, id);
      voertuigInput.value = displayId;
      setFavoritesPanel(false);
      zoekAlles();
    });
    item.addEventListener("keydown", (event) => {
      if (event.key !== "Enter" && event.key !== " ") return;
      event.preventDefault();
      setVehicleInputResolvedId(voertuigInput, id);
      voertuigInput.value = displayId;
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

function saveFavoriteOrderFromDom() {
  if (!favoritesListEl) return;
  const nextFavorites = Array.from(favoritesListEl.querySelectorAll(".favorite-item"))
    .map((item) => item.getAttribute("data-id") || "")
    .filter(Boolean);
  if (!nextFavorites.length) return;
  favorites = nextFavorites;
  saveFavorites();
  updateFavoriteButtonState();
}

function beginFavoriteDrag(pointerEvent, item) {
  if (!(pointerEvent instanceof PointerEvent) || !item || !favoritesListEl) return;
  if (pointerEvent.button !== 0) return;
  if (pointerEvent.target instanceof Element && pointerEvent.target.closest(".favorite-action-btn")) return;
  favoriteDragState = {
    pointerId: pointerEvent.pointerId,
    item,
    started: false,
    startX: pointerEvent.clientX,
    startY: pointerEvent.clientY
  };
}

function updateFavoriteDrag(pointerEvent) {
  if (!favoriteDragState || !(pointerEvent instanceof PointerEvent) || !favoritesListEl) return;
  if (pointerEvent.pointerId !== favoriteDragState.pointerId) return;

  const moveDistance = Math.hypot(pointerEvent.clientX - favoriteDragState.startX, pointerEvent.clientY - favoriteDragState.startY);
  if (!favoriteDragState.started && moveDistance < 8) return;

  favoriteDragState.started = true;
  favoriteDragState.item.classList.add("is-dragging");
  const hoveredItem = document.elementFromPoint(pointerEvent.clientX, pointerEvent.clientY)?.closest(".favorite-item");
  if (!(hoveredItem instanceof HTMLElement) || hoveredItem === favoriteDragState.item || hoveredItem.parentElement !== favoritesListEl) return;

  const bounds = hoveredItem.getBoundingClientRect();
  const insertAfter = pointerEvent.clientY > bounds.top + bounds.height / 2;
  favoritesListEl.insertBefore(
    favoriteDragState.item,
    insertAfter ? hoveredItem.nextElementSibling : hoveredItem
  );
}

function endFavoriteDrag(pointerEvent) {
  if (!favoriteDragState || (pointerEvent instanceof PointerEvent && pointerEvent.pointerId !== favoriteDragState.pointerId)) return;
  const dragState = favoriteDragState;
  favoriteDragState = null;
  dragState.item.classList.remove("is-dragging");
  if (dragState.started) {
    favoriteDragSuppressUntil = Date.now() + 250;
    saveFavoriteOrderFromDom();
    window.setTimeout(() => {
      dragState.item.classList.remove("is-dragging");
    }, 0);
  }
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
  initializeRouteHistory();
  syncPlatformBodyClasses();
  syncHeaderActionPlacement();
  initAndroidViewportSupport();
  loadFavorites();
  settings.intervalMs = normalizeUpdateIntervalMs(settings.intervalMs);
  updateIntervalMs = settings.intervalMs;
  dashboardVehicleIds = normalizeDashboardVehicleIds(settings.dashboardVehicleIds);
  intervalSelect.value = String(updateIntervalMs);
  themeSelect.value = settings.theme;
  settings.colorTheme = normalizeColorTheme(settings.colorTheme);
  colorThemeSelect.value = settings.colorTheme;
  languageSelect.value = settings.language;
  applyTheme(settings.theme);
  applyColorTheme(settings.colorTheme);
  applyTranslations();
  syncStalkModeAvailability();
  setFavoritesPanel(false);
  hideVehiclePhotoCard();
  renderFavorites();
  loadFeedStatus();
  updateFavoriteButtonState();
  resultsWrapEl.classList.remove("show");
  resultsGridEl.classList.remove("show");
  closeBtnEl.style.display = "none";
  mapEl.classList.add("hidden");
  lastUpdateEl.hidden = true;
  lastUpdateEl.textContent = `${t("lastUpdate")}: -`;

  syncInstallButtonVisibility();
  initInactivityMonitor();
}

searchBtn.addEventListener("click", zoekAlles);
closeBtnEl?.addEventListener("click", () => {
  if (getCurrentRouteState().view !== "home") {
    window.history.back();
    return;
  }
  terug({ historyMode: "replace" });
});
appTitleBtnEl?.addEventListener("click", () => {
  const routeState = getCurrentRouteState();
  closeTransientOverlays();
  if (routeState.view === "home") {
    window.scrollTo({ top: 0, behavior: "smooth" });
    return;
  }
  closeDashboardPanel({ historyMode: "replace" });
  terug({ historyMode: "push" });
});
bindVehicleSuggestions(voertuigInput, () => {
  dismissPrimaryVehicleSearchInput({ closeKeyboard: true });
  zoekAlles();
});
voertuigInput.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    const hasActiveSuggestion =
      !!suggestieLijst &&
      !suggestieLijst.hidden &&
      Number(suggestieLijst.dataset.activeIndex || -1) >= 0;
    if (hasActiveSuggestion) return;
    event.preventDefault();
    dismissPrimaryVehicleSearchInput({ closeKeyboard: true });
    zoekAlles();
  }
});
dashboardToggleBtn?.addEventListener("click", () => {
  if (!isStalkModeAvailable()) return;
  setFavoritesPanel(false);
  showDashboardSetupModal();
});
dashboardEditBtn?.addEventListener("click", showDashboardSetupModal);
dashboardCloseBtn?.addEventListener("click", () => {
  if (getCurrentRouteState().view === "stalk") {
    window.history.back();
    return;
  }
  closeDashboardPanel({ historyMode: "replace" });
});
voertuigInput.addEventListener("input", updateFavoriteButtonState);
favoritesToggleBtn.addEventListener("click", (event) => {
  event.stopPropagation();
  setFavoritesPanel(!favoritesPanelOpen);
});
favoritesPanelEl.addEventListener("click", (event) => {
  event.stopPropagation();
});
favoritesPanelCloseBtn?.addEventListener("click", () => setFavoritesPanel(false));
favoritesListEl?.addEventListener("click", (event) => {
  const target = event.target;
  if (!(target instanceof Element)) return;
  const actionBtn = target.closest(".favorite-action-btn");
  if (!actionBtn) return;
  const favoriteItem = actionBtn.closest(".favorite-item");
  const id = favoriteItem?.getAttribute("data-id") || "";
  const action = actionBtn.getAttribute("data-action");
  if (action === "remove") removeFavorite(id);
});
favoritesListEl?.addEventListener("pointerdown", (event) => {
  const item = event.target instanceof Element ? event.target.closest(".favorite-item") : null;
  if (!(item instanceof HTMLElement)) return;
  beginFavoriteDrag(event, item);
});
document.addEventListener("pointermove", (event) => {
  updateFavoriteDrag(event);
});
document.addEventListener("pointerup", (event) => {
  endFavoriteDrag(event);
});
document.addEventListener("pointercancel", (event) => {
  endFavoriteDrag(event);
});
halteSearchToggleBtn?.addEventListener("click", (event) => {
  event.preventDefault();
  event.stopPropagation();
  showHalteSearchModal();
});
haltecodeSearchBtn?.addEventListener("click", () => searchHaltes());
haltecodeInputEl?.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    event.preventDefault();
    searchHaltes();
  }
});
haltecodeInputEl?.addEventListener("input", () => {
  void updateHalteSuggestions();
});
favoritesBackdropEl?.addEventListener("click", (event) => {
  const target = event.target;
  if (!(target instanceof Element)) return;
  if (target === favoritesBackdropEl || target.closest("[data-menu-close='true']")) {
    setFavoritesPanel(false);
  }
});
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
  if (dashboardThemeSelectEl) dashboardThemeSelectEl.value = settings.theme;
});
colorThemeSelect.addEventListener("change", () => {
  settings.colorTheme = normalizeColorTheme(colorThemeSelect.value);
  colorThemeSelect.value = settings.colorTheme;
  saveSettings();
  applyColorTheme(settings.colorTheme);
  if (dashboardColorThemeSelectEl) dashboardColorThemeSelectEl.value = settings.colorTheme;
});
dashboardThemeSelectEl?.addEventListener("change", () => {
  settings.theme = dashboardThemeSelectEl.value;
  themeSelect.value = settings.theme;
  saveSettings();
  applyTheme(settings.theme);
});
dashboardColorThemeSelectEl?.addEventListener("change", () => {
  settings.colorTheme = normalizeColorTheme(dashboardColorThemeSelectEl.value);
  dashboardColorThemeSelectEl.value = settings.colorTheme;
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
footerReviewBtn?.addEventListener("click", showReviewModal);
footerTermsBtn?.addEventListener("click", showTermsModal);
reviewModalCloseBtn?.addEventListener("click", hideReviewModal);
reviewModalDoneBtn?.addEventListener("click", hideReviewModal);
reviewModalEl?.addEventListener("click", (event) => {
  if (event.target === reviewModalEl) hideReviewModal();
});
vehiclePhotoUploadBtn?.addEventListener("click", showPhotoUploadModal);
photoUploadModalCloseBtn?.addEventListener("click", hidePhotoUploadModal);
photoUploadModalDoneBtn?.addEventListener("click", hidePhotoUploadModal);
photoUploadModalEl?.addEventListener("click", (event) => {
  if (event.target === photoUploadModalEl) hidePhotoUploadModal();
});
termsModalCloseBtn?.addEventListener("click", hideTermsModal);
termsModalDoneBtn?.addEventListener("click", hideTermsModal);
termsModalEl?.addEventListener("click", (event) => {
  if (event.target === termsModalEl) hideTermsModal();
});
weatherModalCloseBtn?.addEventListener("click", hideWeatherModal);
weatherModalDoneBtn?.addEventListener("click", hideWeatherModal);
weatherModalEl?.addEventListener("click", (event) => {
  if (event.target === weatherModalEl) hideWeatherModal();
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
    await showAppAlert(getLabel("pdfDownloadFailed", "De PDF kon niet worden gedownload. Probeer het opnieuw."));
  } finally {
    pdfModalConfirmBtn.disabled = false;
    pdfModalConfirmBtn.textContent = oorspronkelijkeTekst;
  }
});
compareModalConfirmBtn?.addEventListener("click", async () => {
  const query = compareVehicleInputEl?.value.trim() || "";
  if (!query) return;
  if (voertuigen.length === 0) await laadVoertuigen();
  const resolved = resolveVehicleQuery(query, getVehicleInputResolvedId(compareVehicleInputEl));
  const resolvedId = resolved.vehicleId || normalize(query);
  if (!resolved.bus) {
    await showAppAlert(getLabel("compareNoSecondFound", "Geen tweede voertuig gevonden."));
    return;
  }
  if (compareEditTarget === "compare" && resolvedId === currentVehicleId) {
    await showAppAlert(getLabel("compareChooseDifferent", "Kies een ander voertuig om te vergelijken."));
    return;
  }
  if (compareEditTarget === "base") {
    if (resolvedId === compareVehicleId) {
      await showAppAlert(getLabel("compareChooseDifferent", "Kies een ander voertuig om te vergelijken."));
      return;
    }
    const nextCompareId = compareVehicleId;
    hideCompareModal();
    setVehicleInputResolvedId(voertuigInput, resolvedId);
    voertuigInput.value = getVehicleDisplayId(resolvedId);
    await zoekAlles();
    if (nextCompareId && nextCompareId !== currentVehicleId) {
      compareVehicleId = nextCompareId;
      renderComparison();
    }
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
  if (!isStalkModeAvailable()) {
    hideDashboardSetupModal();
    return;
  }
  const validationResult = validateDashboardSetupInputs();
  renderDashboardSetupInputs();
  if (validationResult.hasErrors) {
    setDashboardSetupError(getLabel("dashboardSetupInvalid", "Controleer de rood gemarkeerde velden."));
    dashboardSetupGridEl?.querySelector(".dashboard-setup-field.is-invalid .dashboard-setup-input")?.focus();
    return;
  }
  if (!validationResult.hasAnyInput) {
    persistDashboardVehicleIds([]);
    hideDashboardSetupModal();
    closeDashboardPanel();
    return;
  }
  persistDashboardVehicleIds(validationResult.ids);
  hideDashboardSetupModal();
  await openDashboardPanel();
});
stalkModeMediaQuery.addEventListener?.("change", syncStalkModeAvailability);
pdfModalEl?.addEventListener("click", (event) => {
  if (event.target === pdfModalEl) hidePdfModal();
});
compareModalEl?.addEventListener("click", (event) => {
  if (event.target === compareModalEl) hideCompareModal();
});
compareContentEl?.addEventListener("click", (event) => {
  const target = event.target;
  if (!(target instanceof Element)) return;
  const pill = target.closest(".compare-vehicle-pill-btn");
  if (!pill) return;
  const compareTarget = pill.getAttribute("data-compare-target") || "compare";
  showComparePicker(compareTarget);
});
infoModalCloseBtn?.addEventListener("click", hideInfoModal);
infoModalOkBtn?.addEventListener("click", hideInfoModal);
resetSiteDataBtn?.addEventListener("click", () => {
  void resetSiteData();
});
infoModalEl?.addEventListener("click", (event) => {
  if (event.target === infoModalEl) hideInfoModal();
});
installGuideCloseBtn?.addEventListener("click", hideInstallGuideModal);
installGuideOkBtn?.addEventListener("click", hideInstallGuideModal);
installGuideModalEl?.addEventListener("click", (event) => {
  if (event.target === installGuideModalEl) hideInstallGuideModal();
});
appDialogCloseBtn?.addEventListener("click", () => closeAppDialog(false));
appDialogCancelBtn?.addEventListener("click", () => closeAppDialog(false));
appDialogConfirmBtn?.addEventListener("click", () => closeAppDialog(true));
appDialogModalEl?.addEventListener("click", (event) => {
  if (event.target === appDialogModalEl) closeAppDialog(false);
});
halteSearchCloseBtn?.addEventListener("click", hideHalteSearchModal);
halteSearchModalEl?.addEventListener("click", (event) => {
  if (event.target === halteSearchModalEl) hideHalteSearchModal();
});
offlineRetryBtn?.addEventListener("click", () => {
  verifyInternetConnection(true).catch(() => {});
});
settingsInfoBtn?.addEventListener("click", () => {
  showInfoModal();
});
document.addEventListener("keydown", (event) => {
  const activeOverlayEl = getTopInteractiveOverlay();
  if (activeOverlayEl && event.key === "Tab" && trapInteractiveOverlayFocus(event, activeOverlayEl)) {
    return;
  }
  const isBackKey = event.key === "Escape" || event.key === "GoBack" || event.key === "BrowserBack";
  if (isBackKey && activeOverlayEl) {
    event.preventDefault();
    closeInteractiveOverlay(activeOverlayEl);
    return;
  }
  if (isTvSuggestionNavigationActive()) {
    return;
  }
  if (isAndroidTvPlatform && (event.key === "ArrowRight" || event.key === "ArrowDown") && (!dashboardSetupModalEl?.hidden || !dashboardPanelEl?.hidden)) {
    event.preventDefault();
    moveDashboardFocus(1);
    return;
  }
  if (isAndroidTvPlatform && (event.key === "ArrowLeft" || event.key === "ArrowUp") && (!dashboardSetupModalEl?.hidden || !dashboardPanelEl?.hidden)) {
    event.preventDefault();
    moveDashboardFocus(-1);
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
window.addEventListener("popstate", () => {
  void applyRouteStateFromLocation();
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

function parseDelimitedTable(text, options = {}) {
  const {
    delimiter = ",",
    commentPrefix = "",
    sourceLabel = "bestand"
  } = options;
  const lines = String(text || "")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line && (!commentPrefix || !line.startsWith(commentPrefix)));

  if (!lines.length) {
    throw new Error(`${sourceLabel} bevat geen bruikbare gegevens`);
  }

  const headers = parseCSVLine(lines[0], delimiter).map((header) => header.trim());
  const rows = lines.slice(1).map((line) => {
    const values = parseCSVLine(line, delimiter);
    const record = {};
    headers.forEach((header, index) => {
      record[header] = values[index] || "/";
    });
    return record;
  });

  return { headers, rows };
}

// Helper: normalize ids/strings for matching
const normalize = s => (s||"").toString().replace(/"/g, "").trim();
function isHiddenAlphaVehicleId(value = "") {
  return /^A\d{4,6}$/i.test(normalize(value));
}
function getVisibleVehicleId(value = "") {
  const normalized = normalize(value);
  return isHiddenAlphaVehicleId(normalized) ? normalized.slice(1) : normalized;
}
function getVehicleDisplayId(vehicleOrId) {
  if (vehicleOrId && typeof vehicleOrId === "object") {
    return getVisibleVehicleId(vehicleOrId.Voertuignummer || "");
  }
  return getVisibleVehicleId(vehicleOrId || "");
}
function getVehicleInputResolvedId(inputEl) {
  if (!inputEl) return "";
  return normalize(inputEl.dataset.resolvedVehicleId || "");
}
function setVehicleInputResolvedId(inputEl, vehicleId = "") {
  if (!inputEl) return;
  const normalized = normalize(vehicleId);
  if (normalized) inputEl.dataset.resolvedVehicleId = normalized;
  else delete inputEl.dataset.resolvedVehicleId;
}
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

function getTripIdParts(tripId) {
  return cleanText(tripId)
    .split(/[^a-zA-Z0-9]+/)
    .map((part) => cleanText(part))
    .filter(Boolean);
}

function getTripIdMatchScore(candidateTripId, requestedTripId) {
  const candidate = cleanText(candidateTripId);
  const requested = cleanText(requestedTripId);
  if (!candidate || !requested) return Number.POSITIVE_INFINITY;
  if (candidate === requested) return 0;

  const candidateParts = getTripIdParts(candidate);
  const requestedParts = getTripIdParts(requested);
  const candidateTail = candidateParts.at(-1) || "";
  const requestedTail = requestedParts.at(-1) || "";
  if (candidateTail && requestedTail && candidateTail === requestedTail) {
    return 1 + Math.abs(candidate.length - requested.length);
  }

  if (candidate.endsWith(requested) || requested.endsWith(candidate)) {
    return 100 + Math.abs(candidate.length - requested.length);
  }

  return Number.POSITIVE_INFINITY;
}

function normalizeHeadsignLookup(value) {
  return cleanText(value).toLowerCase().replace(/\s+/g, " ").trim();
}

function getHeadsignMatchScore(candidateHeadsign, requestedHeadsign) {
  const candidate = normalizeHeadsignLookup(candidateHeadsign);
  const requested = normalizeHeadsignLookup(requestedHeadsign);
  if (!candidate || !requested) return Number.POSITIVE_INFINITY;
  if (candidate === requested) return 0;
  if (candidate.startsWith(requested) || requested.startsWith(candidate)) return 1;
  if (candidate.includes(requested) || requested.includes(candidate)) return 2;
  return Number.POSITIVE_INFINITY;
}

function findTripDataByTripId(tripId) {
  const normalizedTripId = cleanText(tripId);
  if (!normalizedTripId) return null;
  const exact = tripsById.get(normalizedTripId);
  if (exact) return exact;

  let bestTrip = null;
  let bestScore = Number.POSITIVE_INFINITY;
  for (const trip of trips) {
    const score = getTripIdMatchScore(trip.trip_id, normalizedTripId);
    if (score < bestScore) {
      bestScore = score;
      bestTrip = trip;
    }
  }
  return Number.isFinite(bestScore) ? bestTrip : null;
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

  const candidates = getTripsForRoute(routeId, tripId);
  if (!candidates.length) return null;

  const normalizedHeadsign = normalizeHeadsignLookup(headsign);
  if (normalizedHeadsign) {
    let bestTrip = null;
    let bestScore = Number.POSITIVE_INFINITY;
    candidates.forEach((trip) => {
      const score = getHeadsignMatchScore(trip.trip_headsign, normalizedHeadsign);
      if (score < bestScore) {
        bestScore = score;
        bestTrip = trip;
      }
    });
    if (Number.isFinite(bestScore)) return bestTrip;
  }

  const uniqueHeadsigns = [...new Set(candidates.map((trip) => cleanText(trip.trip_headsign)).filter(Boolean))];
  if (uniqueHeadsigns.length === 1) {
    return candidates.find((trip) => cleanText(trip.trip_headsign) === uniqueHeadsigns[0]) || null;
  }

  return null;
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

function buildVehicleSearchEntry(vehicle) {
  const primaryId = normalize(vehicle.Voertuignummer);
  const visiblePrimaryId = getVisibleVehicleId(primaryId);
  const prefixes = [];
  const exactIds = [];
  const exactPlates = [];

  const pushPrefix = (value) => {
    const normalizedValue = normalizeLookup(value);
    if (normalizedValue) prefixes.push(normalizedValue);
  };
  const pushExactId = (value) => {
    const normalizedValue = normalizeLookup(value);
    if (normalizedValue) exactIds.push(normalizedValue);
  };
  const pushExactPlate = (value) => {
    const normalizedValue = normalizePlateLookup(value);
    if (normalizedValue) exactPlates.push(normalizedValue);
  };

  pushPrefix(vehicle.Voertuignummer);
  pushExactId(vehicle.Voertuignummer);
  if (visiblePrimaryId && visiblePrimaryId !== primaryId) {
    pushPrefix(visiblePrimaryId);
  }
  pushPrefix(getVehicleField(vehicle, "Hansea nummer"));
  pushExactId(getVehicleField(vehicle, "Hansea nummer"));

  const plateValue = getVehicleField(vehicle, vehiclePlateFieldKey);
  if (plateValue) {
    pushPrefix(plateValue);
    pushExactPlate(plateValue);
  }

  splitLegacyValues(getVehicleField(vehicle, oldVehicleNumbersFieldKey), true).forEach((value) => {
    pushPrefix(value);
    pushExactId(value);
  });

  splitLegacyValues(getVehicleField(vehicle, oldLicensePlatesFieldKey), false).forEach((value) => {
    pushPrefix(value);
    pushExactPlate(value);
  });

  return {
    vehicle,
    primaryId,
    visiblePrimaryId,
    prefixes: [...new Set(prefixes)],
    exactIds: [...new Set(exactIds)],
    exactPlates: [...new Set(exactPlates)]
  };
}

function rebuildVehicleIndexes() {
  vehicleLookupById.clear();
  vehicleLookupByPlate.clear();
  vehicleLookupByHansea.clear();
  vehicleLookupByLegacyId.clear();
  vehicleLookupByLegacyPlate.clear();
  vehicleSuggestionIndex = [];

  voertuigen.forEach((vehicle) => {
    const entry = buildVehicleSearchEntry(vehicle);
    const [primaryId = ""] = entry.exactIds;
    if (primaryId) vehicleLookupById.set(primaryId, vehicle);

    const hanseaId = normalizeLookup(getVehicleField(vehicle, "Hansea nummer"));
    if (hanseaId) vehicleLookupByHansea.set(hanseaId, vehicle);

    const plate = normalizePlateLookup(getVehicleField(vehicle, vehiclePlateFieldKey));
    if (plate) vehicleLookupByPlate.set(plate, vehicle);

    splitLegacyValues(getVehicleField(vehicle, oldVehicleNumbersFieldKey), true).forEach((value) => {
      const normalizedValue = normalizeLookup(value);
      if (normalizedValue) vehicleLookupByLegacyId.set(normalizedValue, vehicle);
    });

    splitLegacyValues(getVehicleField(vehicle, oldLicensePlatesFieldKey), false).forEach((value) => {
      const normalizedValue = normalizePlateLookup(value);
      if (normalizedValue) vehicleLookupByLegacyPlate.set(normalizedValue, vehicle);
    });

    vehicleSuggestionIndex.push(entry);
  });
}

function resolveVehicleSearch(query) {
  const normalizedQuery = normalizeLookup(query);
  const normalizedPlateQuery = normalizePlateLookup(query);
  if (!normalizedQuery && !normalizedPlateQuery) {
    return { bus: null, vehicleId: "" };
  }

  const bus =
    vehicleLookupById.get(normalizedQuery) ||
    vehicleLookupByHansea.get(normalizedQuery) ||
    vehicleLookupByLegacyId.get(normalizedQuery) ||
    vehicleLookupByPlate.get(normalizedPlateQuery) ||
    vehicleLookupByLegacyPlate.get(normalizedPlateQuery) ||
    null;

  return {
    bus: bus || null,
    vehicleId: bus ? normalize(bus.Voertuignummer) : ""
  };
}

function resolveVehicleQuery(query, preferredVehicleId = "") {
  const preferredId = normalize(preferredVehicleId);
  if (preferredId) {
    const preferredBus = resolveVehicleSearch(preferredId).bus;
    if (preferredBus) {
      return {
        bus: preferredBus,
        vehicleId: normalize(preferredBus.Voertuignummer)
      };
    }
  }
  return resolveVehicleSearch(query);
}

function isDashboardEligibleVehicleId(vehicleId = "") {
  return /^\d{4}$|^\d{6}$/.test(getVisibleVehicleId(vehicleId));
}

function getDashboardVehicleValidationMessage(query, resolvedVehicleId, resolvedBus, isDuplicate) {
  const trimmedQuery = normalize(query);
  if (!trimmedQuery) return "";
  if (!resolvedBus || !resolvedVehicleId) {
    return getLabel("dashboardVehicleUnknown", "Dit voertuignummer bestaat niet.");
  }
  if (!isDashboardEligibleVehicleId(resolvedVehicleId)) {
    return getLabel("dashboardVehicleFormat", "Alleen bestaande voertuignummers met 4 of 6 cijfers zijn geldig.");
  }
  if (isDuplicate) {
    return getLabel("dashboardVehicleDuplicate", "Dit voertuig staat al in de stalkmodus.");
  }
  return "";
}

function buildSuggestionLabel(vehicle) {
  const vehicleType = normalize(vehicle.Type);
  const plate = normalize(getVehicleField(vehicle, vehiclePlateFieldKey));
  const oldVehicleNumbers = splitLegacyValues(getVehicleField(vehicle, oldVehicleNumbersFieldKey), true).slice(0, 2);
  const hanseaId = normalize(getVehicleField(vehicle, "Hansea nummer"));
  const parts = [];
  if (vehicleType && vehicleType !== "/") parts.push(vehicleType);
  if (plate && plate !== "/") parts.push(plate);
  if (hanseaId && hanseaId !== "/") parts.push(`Hansea ${hanseaId}`);
  if (oldVehicleNumbers.length) parts.push(`oud ${oldVehicleNumbers.join(", ")}`);
  return parts.join(" - ");
}

function buildSuggestionDisplayLabel(vehicle) {
  const primary = getVehicleDisplayId(vehicle);
  return primary || normalize(vehicle?.Voertuignummer);
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

  const matches = [];
  for (const entry of vehicleSuggestionIndex) {
    const hasMatch = entry.prefixes.some((value) => {
      if (normalizedQuery && value.startsWith(normalizedQuery)) return true;
      if (normalizedPlateQuery && value.startsWith(normalizedPlateQuery)) return true;
      return false;
    });
    if (!hasMatch) continue;
    matches.push(entry.vehicle);
    if (matches.length >= limit) break;
  }
  return matches;
}

function buildZone01HerculesSearchUrl(query = "") {
  const params = new URLSearchParams();
  params.set("q", normalize(query));
  return `${ZONE01_HERCULES_SEARCH_URL}?${params.toString()}`;
}

function getMissingVehicleSuggestionCopy(query = "") {
  const normalizedQuery = normalize(query);
  return {
    badge: getLabel("missingVehicleBadge", "Niet gevonden"),
    title: getLabel("missingVehicleTitle", "Dit voertuig ontbreekt in onze database."),
    text: getLabel("missingVehicleText", "Meld het ons via het formulier onderaan en zoek dit voertuig in Hercules op Zone 01."),
    reportCta: getLabel("missingVehicleReportCta", "Meld via formulier"),
    zone01Cta: normalizedQuery
      ? fillTemplate(getLabel("missingVehicleZone01Cta", "Zoek {id} op Zone 01"), normalizedQuery)
      : getLabel("missingVehicleZone01CtaGeneric", "Zoek op Zone 01"),
    zone01Url: buildZone01HerculesSearchUrl(normalizedQuery)
  };
}

function createMissingVehicleCallout(query = "", options = {}) {
  const { compact = false, onReport = null } = options;
  const copy = getMissingVehicleSuggestionCopy(query);
  const wrapper = document.createElement("div");
  wrapper.className = compact ? "missing-vehicle-callout missing-vehicle-callout--compact" : "missing-vehicle-callout";

  const badgeEl = document.createElement("span");
  badgeEl.className = "missing-vehicle-badge";
  badgeEl.textContent = copy.badge;

  const titleEl = document.createElement("strong");
  titleEl.className = "missing-vehicle-title";
  titleEl.textContent = copy.title;

  const textEl = document.createElement("p");
  textEl.className = "missing-vehicle-text";
  textEl.textContent = copy.text;

  const actionsEl = document.createElement("div");
  actionsEl.className = "missing-vehicle-actions";

  const reportBtn = document.createElement("button");
  reportBtn.type = "button";
  reportBtn.className = "missing-vehicle-action";
  reportBtn.textContent = copy.reportCta;
  reportBtn.addEventListener("mousedown", (event) => {
    event.preventDefault();
  });
  reportBtn.addEventListener("click", (event) => {
    event.preventDefault();
    if (typeof onReport === "function") onReport();
  });

  const zone01Link = document.createElement("a");
  zone01Link.className = "missing-vehicle-action missing-vehicle-action--external";
  zone01Link.href = copy.zone01Url;
  zone01Link.target = "_blank";
  zone01Link.rel = "noopener noreferrer";
  zone01Link.textContent = copy.zone01Cta;
  zone01Link.addEventListener("mousedown", (event) => {
    event.preventDefault();
  });

  actionsEl.append(reportBtn, zone01Link);
  wrapper.append(badgeEl, titleEl, textEl, actionsEl);
  return wrapper;
}

function renderMissingVehicleSuggestionList(listEl, inputEl, query = "") {
  if (!listEl || !inputEl) return;
  listEl.innerHTML = "";
  listEl.dataset.activeIndex = "-1";
  listEl.setAttribute("role", "group");
  listEl.setAttribute("aria-live", "polite");
  const rowEl = document.createElement("li");
  rowEl.className = "vehicle-suggestion-empty-row";
  rowEl.tabIndex = -1;
  rowEl.setAttribute("role", "presentation");
  rowEl.appendChild(createMissingVehicleCallout(query, {
    compact: true,
    onReport: () => {
      hideSuggestionList(listEl);
      showReviewModal();
    }
  }));
  listEl.appendChild(rowEl);
  listEl.hidden = false;
  positionSuggestionList(listEl, inputEl);
}

function renderMissingVehicleStaticState(query = "") {
  if (!vasteDataEl) return;
  vasteDataEl.innerHTML = "";
  vasteDataEl.appendChild(createMissingVehicleCallout(query, {
    onReport: () => {
      showReviewModal();
    }
  }));
}

function hideSuggestionList(listEl) {
  if (!listEl) return;
  listEl.innerHTML = "";
  listEl.hidden = true;
  listEl.removeAttribute("aria-live");
  if (listEl.dataset.floating === "1") {
    listEl.style.removeProperty("top");
    listEl.style.removeProperty("left");
    listEl.style.removeProperty("width");
  }
}

function dismissPrimaryVehicleSearchInput(options = {}) {
  const { closeKeyboard = false } = options;
  activeVehicleSuggestionInput = null;
  hideSuggestionList(suggestieLijst);
  if (!voertuigInput || !closeKeyboard) return;

  const shouldForceKeyboardDismiss = isTouchPlatform() || isAndroidPlatform;
  if (shouldForceKeyboardDismiss && !voertuigInput.readOnly) {
    voertuigInput.readOnly = true;
    window.setTimeout(() => {
      voertuigInput.readOnly = false;
    }, 140);
  }

  voertuigInput.blur();
  if (document.activeElement instanceof HTMLElement) {
    document.activeElement.blur();
  }
}

function scheduleNonCriticalTask(callback, timeout = 800) {
  if (typeof window.requestIdleCallback === "function") {
    return window.requestIdleCallback(callback, { timeout });
  }
  return window.setTimeout(() => callback(), Math.min(timeout, 350));
}

function loadStylesheetOnce(href) {
  if (document.querySelector(`link[rel="stylesheet"][href="${href}"]`)) {
    return Promise.resolve();
  }
  return new Promise((resolve, reject) => {
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = href;
    link.onload = () => resolve();
    link.onerror = () => reject(new Error(`Stylesheet kon niet geladen worden: ${href}`));
    document.head.appendChild(link);
  });
}

function loadScriptOnce(src) {
  const existing = document.querySelector(`script[src="${src}"]`);
  if (existing && existing.dataset.loaded === "1") return Promise.resolve();
  if (existing) {
    return new Promise((resolve, reject) => {
      existing.addEventListener("load", () => resolve(), { once: true });
      existing.addEventListener("error", () => reject(new Error(`Script kon niet geladen worden: ${src}`)), { once: true });
    });
  }

  return new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = src;
    script.async = true;
    script.onload = () => {
      script.dataset.loaded = "1";
      resolve();
    };
    script.onerror = () => reject(new Error(`Script kon niet geladen worden: ${src}`));
    document.head.appendChild(script);
  });
}

async function ensureLeafletLoaded() {
  if (window.L) return window.L;
  if (!leafletLoadPromise) {
    leafletLoadPromise = Promise.all([
      loadStylesheetOnce(LEAFLET_CSS_URL),
      loadScriptOnce(LEAFLET_JS_URL)
    ]).then(() => {
      if (!window.L) throw new Error("Leaflet niet beschikbaar na laden");
      return window.L;
    }).finally(() => {
      if (!window.L) leafletLoadPromise = null;
    });
  }
  return leafletLoadPromise;
}

function getBusIcon() {
  if (busIcon || !window.L) return busIcon;
  busIcon = window.L.divIcon({
    className: "bus-div-icon",
    html: '<img class="bus-div-icon__img" src="media/navicon.png" alt="Bus"/>',
    iconSize: [36, 36],
    iconAnchor: [18, 36]
  });
  return busIcon;
}

function renderSuggestionList(listEl, inputEl, onSelect) {
  if (!listEl || !inputEl) return;
  const query = inputEl.value.trim();
  const results = getSuggestionResults(query);
  listEl.innerHTML = "";
  listEl.dataset.activeIndex = "-1";
  listEl.removeAttribute("aria-live");
  listEl.setAttribute("role", "listbox");

  if (!results.length) {
    if (inputEl.id === "voertuignummer" && query && vehicleSuggestionIndex.length) {
      renderMissingVehicleSuggestionList(listEl, inputEl, query);
      return;
    }
    listEl.hidden = true;
    return;
  }

  results.forEach((vehicle) => {
    const secondaryLabel = buildSuggestionLabel(vehicle);
    const visibleVehicleId = buildSuggestionDisplayLabel(vehicle);
    const actualVehicleId = normalize(vehicle.Voertuignummer);
    const li = document.createElement("li");
    li.className = "vehicle-suggestion-item";
    li.dataset.id = actualVehicleId;
    li.dataset.index = String(listEl.children.length);
    li.tabIndex = isAndroidTvPlatform ? 0 : -1;
    li.setAttribute("role", "option");
    li.setAttribute("aria-selected", "false");
    li.innerHTML = `
      <span class="vehicle-suggestion-primary">${escapeHtml(visibleVehicleId)}</span>
      ${secondaryLabel ? `<span class="vehicle-suggestion-secondary">${escapeHtml(secondaryLabel)}</span>` : ""}
    `;
    li.addEventListener("mousedown", (event) => {
      event.preventDefault();
    });
    li.addEventListener("click", () => {
      setVehicleInputResolvedId(inputEl, actualVehicleId);
      inputEl.value = visibleVehicleId;
      hideSuggestionList(listEl);
      onSelect(actualVehicleId);
    });
    li.addEventListener("focus", () => {
      const index = Number(li.dataset.index || -1);
      if (index >= 0) setSuggestionActiveItem(listEl, index);
    });
    li.addEventListener("keydown", (event) => {
      const index = Number(li.dataset.index || -1);
      if (event.key === "ArrowDown") {
        event.preventDefault();
        const nextItem = li.nextElementSibling instanceof HTMLElement
          ? li.nextElementSibling
          : listEl.querySelector("li");
        const nextIndex = Number(nextItem?.getAttribute("data-index") || index + 1);
        setSuggestionActiveItem(listEl, nextIndex);
        nextItem?.focus();
        return;
      }
      if (event.key === "ArrowUp") {
        event.preventDefault();
        const prevItem = li.previousElementSibling instanceof HTMLElement
          ? li.previousElementSibling
          : listEl.querySelector("li:last-child");
        const prevIndex = Number(prevItem?.getAttribute("data-index") || index - 1);
        setSuggestionActiveItem(listEl, prevIndex);
        prevItem?.focus();
        return;
      }
      if (event.key === "Enter" || event.key === " " || event.key === "OK" || event.key === "Select") {
        event.preventDefault();
        li.click();
        return;
      }
      if (event.key === "Escape" || event.key === "BrowserBack" || event.key === "GoBack") {
        event.preventDefault();
        inputEl.focus();
        hideSuggestionList(listEl);
      }
    });
    listEl.appendChild(li);
  });

  listEl.hidden = false;
  if (isAndroidTvPlatform) {
    setSuggestionActiveItem(listEl, 0);
  }
}

function setSuggestionActiveItem(listEl, nextIndex) {
  if (!listEl) return;
  const items = Array.from(listEl.querySelectorAll("li"));
  if (!items.length) {
    listEl.dataset.activeIndex = "-1";
    return;
  }
  const normalizedIndex = ((nextIndex % items.length) + items.length) % items.length;
  listEl.dataset.activeIndex = String(normalizedIndex);
  items.forEach((item, index) => {
    const isActive = index === normalizedIndex;
    item.classList.toggle("is-active", isActive);
    item.setAttribute("aria-selected", String(isActive));
  });
  items[normalizedIndex].scrollIntoView({ block: "nearest", inline: "nearest" });
}

function ensureInlineSuggestionList(inputEl) {
  if (!inputEl) return null;
  const shellEl = inputEl.closest(".suggestion-input-shell") || inputEl.parentElement;
  const shouldFloat = !!inputEl.closest(".pdf-modal");
  let listEl = shellEl?.querySelector(".inline-suggestion-list");
  if (listEl) return listEl;
  listEl = document.createElement("ul");
  listEl.className = shouldFloat ? "inline-suggestion-list floating-suggestion-list" : "inline-suggestion-list";
  listEl.dataset.floating = shouldFloat ? "1" : "0";
  listEl.hidden = true;
  (shouldFloat ? document.body : shellEl)?.appendChild(listEl);
  return listEl;
}

function ensurePrimarySuggestionList() {
  if (!suggestieLijst) return null;
  suggestieLijst.classList.add("inline-suggestion-list", "floating-suggestion-list", "primary-suggestion-list");
  suggestieLijst.dataset.floating = "1";
  if (suggestieLijst.parentElement !== document.body) {
    document.body.appendChild(suggestieLijst);
  }
  return suggestieLijst;
}

function positionSuggestionList(listEl, inputEl) {
  if (!listEl || !inputEl || listEl.dataset.floating !== "1") return;
  const rect = inputEl.getBoundingClientRect();
  const viewportWidth = window.innerWidth || document.documentElement.clientWidth || rect.width;
  const left = Math.max(12, Math.min(rect.left, viewportWidth - rect.width - 12));
  listEl.style.top = `${Math.round(rect.bottom + 6)}px`;
  listEl.style.left = `${Math.round(left)}px`;
  listEl.style.width = `${Math.round(Math.min(rect.width, viewportWidth - 24))}px`;
}

function bindVehicleSuggestions(inputEl, onSelect) {
  if (!inputEl || inputEl.dataset.vehicleSuggestionsBound === "1") return;
  inputEl.dataset.vehicleSuggestionsBound = "1";

  const listEl = inputEl.id === "voertuignummer" ? ensurePrimarySuggestionList() : ensureInlineSuggestionList(inputEl);
  if (!listEl) return;

  const render = () => {
    if (getVehicleInputResolvedId(inputEl) && inputEl.value.trim() !== getVehicleDisplayId(getVehicleInputResolvedId(inputEl))) {
      setVehicleInputResolvedId(inputEl, "");
    }
    if (!voertuigen.length) {
      void laadVoertuigen()
        .then(() => {
          if (activeVehicleSuggestionInput === inputEl || document.activeElement === inputEl) {
            renderSuggestionList(listEl, inputEl, onSelect);
          }
        })
        .catch((error) => console.warn("Voertuigsuggesties laden mislukt", error));
    }
    activeVehicleSuggestionInput = inputEl;
    renderSuggestionList(listEl, inputEl, onSelect);
    positionSuggestionList(listEl, inputEl);
  };

  inputEl.addEventListener("input", render);
  inputEl.addEventListener("focus", render);
  inputEl.addEventListener("keydown", (event) => {
    const items = Array.from(listEl.querySelectorAll("li"));
    if (!items.length || listEl.hidden) return;
    const currentIndex = Number(listEl.dataset.activeIndex || -1);
    if (event.key === "ArrowDown") {
      event.preventDefault();
      const nextIndex = currentIndex < 0 ? 0 : currentIndex + 1;
      setSuggestionActiveItem(listEl, nextIndex);
      if (isAndroidTvPlatform) items[((nextIndex % items.length) + items.length) % items.length]?.focus();
      return;
    }
    if (event.key === "ArrowUp") {
      event.preventDefault();
      const nextIndex = currentIndex < 0 ? items.length - 1 : currentIndex - 1;
      setSuggestionActiveItem(listEl, nextIndex);
      if (isAndroidTvPlatform) items[((nextIndex % items.length) + items.length) % items.length]?.focus();
      return;
    }
    if (event.key === "Enter" && currentIndex >= 0) {
      event.preventDefault();
      items[currentIndex]?.click();
      return;
    }
    if (event.key === "Escape") {
      hideSuggestionList(listEl);
    }
  });
  inputEl.addEventListener("blur", () => {
    window.setTimeout(() => {
      if (activeVehicleSuggestionInput === inputEl) activeVehicleSuggestionInput = null;
      if (document.activeElement instanceof Element && listEl.contains(document.activeElement)) return;
      hideSuggestionList(listEl);
    }, 120);
  });
  listEl.addEventListener("focusout", () => {
    window.setTimeout(() => {
      const active = document.activeElement;
      if (active === inputEl) return;
      if (active instanceof Element && listEl.contains(active)) return;
      hideSuggestionList(listEl);
    }, 120);
  });
  const syncFloatingListPosition = () => {
    if (listEl.hidden) return;
    positionSuggestionList(listEl, inputEl);
  };
  window.addEventListener("resize", syncFloatingListPosition);
  window.addEventListener("scroll", syncFloatingListPosition, true);
}

async function laadVoertuigen() {
  if (voertuigen.length) return;
  if (voertuigenLoadPromise) return voertuigenLoadPromise;
  voertuigenLoadPromise = (async () => {
    const res = await fetchWithTimeout(`${BASE_URL}/vehicles.txt`, { cache: "no-store" });
    const text = await res.text();
    vehiclesSourceUpdatedAt = parseVehiclesSourceUpdatedAt(text);
    const { headers, rows } = parseDelimitedTable(text, {
      delimiter: ";",
      commentPrefix: "#",
      sourceLabel: "vehicles.txt"
    });
    vehiclePlateFieldKey = "Nummerplaat";
    oldVehicleNumbersFieldKey = "Oude voertuignummers";
    oldLicensePlatesFieldKey = "Oude nummerplaten";
    vehicleHideVinFieldKey = "hide-vin";
    voertuigen = rows.map((record) => mapVehicleRecord(headers, headers.map((header) => record[header] || "/")));
    rebuildVehicleIndexes();
    renderFavorites();
  })();
  try {
    await voertuigenLoadPromise;
  } finally {
    voertuigenLoadPromise = null;
  }
}

async function laadTrips() {
  if (trips.length) return;
  if (tripsLoadPromise) return tripsLoadPromise;
  tripsLoadPromise = (async () => {
    const res = await fetchWithTimeout(`${BASE_URL}/trips.txt`, { cache: "no-store" });
    const text = await res.text();
    trips = parseDelimitedTable(text, { sourceLabel: "trips.txt" }).rows;

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
    routes = parseDelimitedTable(text, { sourceLabel: "routes.txt" }).rows;

    routesById.clear();
    routesByKey.clear();
    routes.forEach((route) => {
      const routeId = normalize(route.route_id);
      if (routeId) routesById.set(routeId, route);
      const routeKey = getRouteKey(routeId);
      if (routeKey && !routesByKey.has(routeKey)) routesByKey.set(routeKey, route);
    });
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
    stops = parseDelimitedTable(text, { sourceLabel: "stops.txt" }).rows;

    stopsById.clear();
    stops.forEach((stop) => {
      const stopId = normalize(stop.stop_id);
      const stopCode = normalize(stop.stop_code);
      if (stopId) stopsById.set(stopId, stop);
      if (stopCode) stopsById.set(stopCode, stop);
    });
  })();
  try {
    await stopsLoadPromise;
  } finally {
    stopsLoadPromise = null;
  }
}

initAppPreferences();

window.addEventListener("resize", syncHeaderActionPlacement);

async function maybeAutoStartDashboardForAndroidTv() {
  if (!isAndroidTvPlatform || dashboardAutoStarted || window.location.search.includes("bus=")) return;
  dashboardAutoStarted = true;
  if (voertuigen.length === 0) await laadVoertuigen();
  const sanitizedIds = getSanitizedDashboardVehicleIds(settings.dashboardVehicleIds);
  if (sanitizedIds.length !== settings.dashboardVehicleIds.length) {
    persistDashboardVehicleIds(sanitizedIds);
  } else {
    dashboardVehicleIds = sanitizedIds;
  }

  if (dashboardVehicleIds.length) {
    await openDashboardPanel();
    window.setTimeout(() => dashboardEditBtn?.focus(), 40);
    return;
  }

  showDashboardSetupModal();
}

function getDashboardFocusables() {
  const focusScope = !dashboardSetupModalEl?.hidden ? dashboardSetupModalEl : !dashboardPanelEl?.hidden ? dashboardPanelEl : null;
  if (!focusScope) return [];
  return Array.from(focusScope.querySelectorAll('button:not([hidden]):not([disabled]), input:not([hidden]):not([disabled]), select:not([hidden]):not([disabled]), [tabindex="0"]'))
    .filter((element) => element instanceof HTMLElement && !element.hasAttribute("hidden"));
}

function isTvSuggestionNavigationActive() {
  if (!isAndroidTvPlatform) return false;
  const activeElement = document.activeElement;
  if (!(activeElement instanceof Element)) return false;
  if (activeElement.matches(".inline-suggestion-list li, #suggestielijst li")) return true;
  if (!activeElement.matches("input")) return false;
  const shell = activeElement.closest(".suggestion-input-shell") || activeElement.parentElement;
  const listEl = shell?.querySelector(".inline-suggestion-list") || (activeElement.id === "voertuignummer" ? suggestieLijst : null);
  return !!listEl && !listEl.hidden && listEl.querySelectorAll("li").length > 0;
}

function moveDashboardFocus(step) {
  const focusables = getDashboardFocusables();
  if (!focusables.length) return;
  const activeIndex = focusables.findIndex((element) => element === document.activeElement);
  const nextIndex = activeIndex === -1 ? 0 : (activeIndex + step + focusables.length) % focusables.length;
  focusables[nextIndex]?.focus();
}

function warmUpVehiclesAndDeepLinks() {
  void laadVoertuigen()
    .then(async () => {
      await applyDeepLinkIfNeeded();
      await maybeAutoStartDashboardForAndroidTv();
    })
    .catch((e) => console.warn("Warm-up voertuigen mislukt", e));
}

if (window.location.search.includes("bus=") || isAndroidTvPlatform) {
  warmUpVehiclesAndDeepLinks();
} else {
  scheduleNonCriticalTask(warmUpVehiclesAndDeepLinks, 1400);
}

async function zoekAlles(options = {}) {
  const {
    queryOverride = "",
    historyMode = routeNavigationLocked ? "replace" : "push"
  } = options;
  const searchToken = ++latestSearchToken;
  markUserInteraction();
  const query = (queryOverride || voertuigInput.value || "").trim();
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
    await confirmAndStartDownload({
      downloadType: "python",
      fileLabel: "script.py",
      onConfirm: () => startPythonDownload()
    });
    setPageLoading(false);
    return;
  }
  if (query.toLowerCase() === "android" || query.toLowerCase() === "apk") {
    hideSuggestionList(suggestieLijst);
    await confirmAndStartDownload({
      downloadType: "apk",
      fileLabel: "Busbibliotheek.apk",
      onConfirm: () => startApkDownload()
    });
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
  const resolved = resolveVehicleQuery(query, getVehicleInputResolvedId(voertuigInput));
  const activeVehicleId = resolved.vehicleId || normalize(query);
  const bus = resolved.bus;
  currentVehicleId = activeVehicleId;
  realtimePausedByInactivity = false;
  if (compareVehicleId === currentVehicleId) compareVehicleId = "";
  if (resolved.vehicleId) {
    setVehicleInputResolvedId(voertuigInput, activeVehicleId);
    voertuigInput.value = getVehicleDisplayId(activeVehicleId);
  }
  updateFavoriteButtonState();

  hideSuggestionList(suggestieLijst);
  resultsWrapEl.classList.add("show");
  resultsGridEl.classList.add("show");
  closeBtnEl.style.display = "inline-flex";
  updateUrlState(historyMode);
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

function terug(options = {}) {
  const {
    historyMode = routeNavigationLocked ? "replace" : "replace",
    scrollBehavior = "smooth"
  } = options;
  resultsGridEl.classList.remove("show");
  resultsWrapEl.classList.remove("show");
  closeBtnEl.style.display = "none";
  realtimeEl.innerHTML = t("noData");
  vasteDataEl.innerHTML = t("noneSelected");
  hideVehiclePhotoCard();
  resetWeatherBlock();
  voertuigInput.value = "";
  setVehicleInputResolvedId(voertuigInput, "");
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
  updateUrlState(historyMode);
  updateDocumentTitle("");
  hideSuggestionList(suggestieLijst);
  window.scrollTo({ top: 0, behavior: scrollBehavior });
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
    renderMissingVehicleStaticState(id);
    hideVehiclePhotoCard();
    return;
  }

  updateVehiclePhotoCard(id);

  const favoriteLabel = favorites.includes(id) ? t("favoriteRemove") : t("favoriteAdd");
  const favoriteStateSymbol = favorites.includes(id) ? "\u2605\uFE0E" : "\u2606\uFE0E";
  const safeFavoriteId = id.replace(/"/g, "&quot;");
  const favoriteClass = favorites.includes(id) ? "vehicle-favorite-btn is-favorite" : "vehicle-favorite-btn";

  let html=`<div class="vehicle-title-row"><p class="voertuignummer-display">${escapeHtml(getVehicleDisplayId(bus) || bus.Voertuignummer)}</p><button id="favoriteInlineBtn" class="${favoriteClass}" type="button" title="${favoriteLabel}" aria-label="${favoriteLabel}" aria-pressed="${favorites.includes(id)}" data-id="${safeFavoriteId}">${favoriteStateSymbol}</button></div>`;
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
    `<a class="btn btn--instagram" href="${igUrl}" target="_blank" rel="noopener"><span class="btn-label">${localWord("instagramSearch")}</span></a>`,
    `<button id="vehiclePdfBtn" class="btn btn--pdf" type="button" data-id="${safeFavoriteId}">${getLabel("pdfConfirm", "PDF downloaden")}</button>`,
    `<button id="vehicleCompareBtn" class="btn btn--compare" type="button" data-id="${safeFavoriteId}">${getLabel("compareConfirm", "Vergelijken")}</button>`
  ];
  const idNum = Number(id);
  if (Number.isInteger(idNum) && idNum >= 4404 && idNum <= 4459) {
    links.push(`<a class="btn btn--story" href="https://sites.google.com/view/delijn-busspotter/dampkap" target="_blank" rel="noopener">${t("story44xx")}</a>`);
  }
  html += `<div class="ig-btn-wrap">${links.join("")}</div>`;
  html += `<p class="instagram-help-text">${escapeHtml(getLabel("instagramHelp", "Instagram zoeken werkt niet altijd goed op smartphone. Via de browser werkt het doorgaans wel, maar je moet meestal ingelogd zijn."))}</p>`;
  vasteDataEl.innerHTML=html;
  updateFavoriteButtonState();
}

async function initMap(lat,lon){
  const L = await ensureLeafletLoaded();
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
    const matchingTripUpdates = entities.filter((entity) => {
      const descriptor = extractTripDescriptor(getEntityTripUpdatePayload(entity));
      return descriptor.tripId === normalizedTripId;
    });
    if (matchingTripUpdates.length === 1) {
      return getEntityTripUpdatePayload(matchingTripUpdates[0]);
    }

    const withoutVehicleDescriptor = matchingTripUpdates.find((entity) => {
      const tripUpdate = getEntityTripUpdatePayload(entity);
      const descriptor =
        tripUpdate?.vehicle ||
        tripUpdate?.vehicleDescriptor ||
        tripUpdate?.vehicle_descriptor;
      return !getVehicleDescriptorId(descriptor);
    });
    if (withoutVehicleDescriptor) return getEntityTripUpdatePayload(withoutVehicleDescriptor);
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
  const graceWindowSeconds = 120;
  const normalizedUpdates = updates.map((stop, index) => {
    const stopId = cleanText(stop?.stopId || stop?.stop_id || stop?.assignedStopId || stop?.assigned_stop_id || "");
    const arrivalTime =
      typeof stop?.arrival?.time === "number" ? stop.arrival.time :
      (typeof stop?.arrival?.timestamp === "number" ? stop.arrival.timestamp : null);
    const departureTime =
      typeof stop?.departure?.time === "number" ? stop.departure.time :
      (typeof stop?.departure?.timestamp === "number" ? stop.departure.timestamp : null);
    const eventTime =
      typeof departureTime === "number" ? departureTime :
      (typeof arrivalTime === "number" ? arrivalTime : null);
    return {
      stopId,
      arrivalTime,
      departureTime,
      eventTime,
      index
    };
  }).filter((stop) => stop.stopId);

  if (!normalizedUpdates.length) return "";

  const upcomingStop = normalizedUpdates
    .filter((stop) => typeof stop.eventTime === "number" && stop.eventTime >= now - graceWindowSeconds)
    .sort((a, b) => {
      if (a.eventTime !== b.eventTime) return a.eventTime - b.eventTime;
      return a.index - b.index;
    })[0];
  if (upcomingStop) return upcomingStop.stopId;

  const latestPastStop = normalizedUpdates
    .filter((stop) => typeof stop.eventTime === "number")
    .sort((a, b) => {
      if (a.eventTime !== b.eventTime) return b.eventTime - a.eventTime;
      return b.index - a.index;
    })[0];
  if (latestPastStop) return latestPastStop.stopId;

  return normalizedUpdates[0]?.stopId || "";
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
      resetWeatherBlock();
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
      <div class="realtime-summary-card">
        ${routeRowMarkup}
        <div class="realtime-meta-stack">
          <div class="current-stop-row">
            <span class="current-stop-label">${escapeHtml(t("currentStop"))}:</span>
            ${currentStopValueMarkup}
          </div>
          <span class="delay-status ${delayClass}">${escapeHtml(msgDelay)}</span>
        </div>
      </div>
    `;
    void updateWeatherForCoordinates(Number(v.position.latitude), Number(v.position.longitude));
    mapEl.classList.remove("hidden");
    lastUpdateEl.textContent = `${t("lastUpdate")}: ${new Date().toLocaleTimeString(localeForLanguage(settings.language))}`;
    lastUpdateEl.hidden = false;

    await initMap(v.position.latitude,v.position.longitude);
    if (requestToken !== realtimeRequestToken || id !== currentVehicleId || !map) return;
    const L = window.L;
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
      marker = L.marker([v.position.latitude,v.position.longitude], { icon: getBusIcon() })
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
    resetWeatherBlock();
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

window.addEventListener("bb-android-theme-change", (event) => {
  const detailTheme = event?.detail?.theme;
  androidHostThemeMode = typeof detailTheme === "string" ? detailTheme.toLowerCase() : "";
  if (settings.theme === "auto") {
    applyTheme("auto");
    updateSystemUiThemeColor();
  }
});
