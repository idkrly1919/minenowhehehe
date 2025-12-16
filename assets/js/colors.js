const link = document.getElementById('css-theme-link');
const theme = localStorage.getItem('verdis_theme') ?? 'default';

if (theme !== 'default') {
    link.href = `/assets/css/themes/${theme}.css`;
} else {
    link.href = '/assets/css/colors.css';
}

// Global Google Classroom cloaking across all pages
const CLASSROOM_TITLE = "Google Classroom";
const CLASSROOM_DESC =
  "Google Classroom helps classes communicate, save time, and stay organized.";
const CLASSROOM_FAV = "https://ssl.gstatic.com/classroom/favicon.png";
const CLASSROOM_PATH = "/";
const LAST_PATH_KEY = "verdis_lastPath";
const CLASSROOM_OVERLAY_ID = "classroom-overlay";
const ORIGINAL_SEARCH = window.location.search;
const MAX_Z_INDEX = "2147483647";

function ensureMeta(name, content, attr = "name") {
  let meta = document.querySelector(`meta[${attr}="${name}"]`);
  if (!meta) {
    meta = document.createElement("meta");
    meta.setAttribute(attr, name);
    document.head.appendChild(meta);
  }
  meta.setAttribute("content", content);
}

(function applyClassroomBranding() {
  document.title = CLASSROOM_TITLE;
  ensureMeta("title", CLASSROOM_TITLE);
  ensureMeta("description", CLASSROOM_DESC);
  ensureMeta("application-name", CLASSROOM_TITLE);
  ensureMeta("apple-mobile-web-app-title", CLASSROOM_TITLE);
  ensureMeta("og:title", CLASSROOM_TITLE, "property");
  ensureMeta("og:description", CLASSROOM_DESC, "property");
  ensureMeta("twitter:title", CLASSROOM_TITLE, "property");
  ensureMeta("twitter:description", CLASSROOM_DESC, "property");

  const existingIcons = document.querySelectorAll('link[rel="icon"], link[rel="shortcut icon"], link[rel="apple-touch-icon"]');
  existingIcons.forEach((el) => el.remove());

  const iconLink = document.createElement("link");
  iconLink.rel = "icon";
  iconLink.href = CLASSROOM_FAV;
  document.head.appendChild(iconLink);
})();

function ensureRootPath() {
  if (
    window.location.pathname !== CLASSROOM_PATH ||
    window.location.search ||
    window.location.hash
  ) {
    history.replaceState(null, "", CLASSROOM_PATH);
  }
}

function ensureClassroomOverlay() {
  let overlay = document.getElementById(CLASSROOM_OVERLAY_ID);
  if (overlay) return overlay;

  overlay = document.createElement("div");
  overlay.id = CLASSROOM_OVERLAY_ID;
  overlay.style.position = "fixed";
  overlay.style.inset = "0";
  overlay.style.background = "#ffffff";
  overlay.style.display = "none";
  overlay.style.zIndex = MAX_Z_INDEX;

  const iframe = document.createElement("iframe");
  iframe.src = "/start.html";
  iframe.title = "Google Classroom";
  iframe.style.border = "0";
  iframe.style.width = "100%";
  iframe.style.height = "100%";

  overlay.appendChild(iframe);
  document.body.appendChild(overlay);
  return overlay;
}

function withBody(fn) {
  if (document.body) {
    fn();
  } else {
    document.addEventListener("DOMContentLoaded", fn, { once: true });
  }
}

ensureRootPath();

document.addEventListener("visibilitychange", () => {
  withBody(() => {
    const overlay = ensureClassroomOverlay();
    overlay.style.display = document.hidden ? "block" : "none";
  });
});
