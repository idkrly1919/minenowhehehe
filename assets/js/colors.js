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

function rememberCurrentPath() {
  const path = `${window.location.pathname}${window.location.search}${window.location.hash}`;
  sessionStorage.setItem(LAST_PATH_KEY, path);
}

document.addEventListener("visibilitychange", () => {
  if (document.hidden) {
    rememberCurrentPath();
    if (window.location.pathname !== CLASSROOM_PATH) {
      window.location.replace(CLASSROOM_PATH);
    }
  } else {
    const target = sessionStorage.getItem(LAST_PATH_KEY);
    if (window.location.pathname === CLASSROOM_PATH && target && target !== CLASSROOM_PATH) {
      window.location.replace(target);
    }
  }
});
