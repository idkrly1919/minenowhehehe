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
const MAX_Z_INDEX = "2147483647";

function getClassroomSearch() {
  return window.location.search;
}

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
  overlay.style.background = "#202124";
  overlay.style.display = "none";
  overlay.style.zIndex = MAX_Z_INDEX;
  overlay.style.color = "#e8eaed";

  overlay.innerHTML = `
      <div style="max-width: 520px; margin: 80px auto 0 auto; font-family: Arial, sans-serif; padding: 0 24px;">
        <h1 style="font-size: 28px; margin: 8px 0 12px 0; font-weight: 500; color: #e8eaed;">This site can’t be reached</h1>
        <p style="margin: 0 0 6px 0; color: #e8eaed;">Check if there is a typo in <b>verdis.eu.org</b>.</p>
        <p style="margin: 0 0 16px 0; color: #9aa0a6; font-size: 14px;">
          If spelling is correct, try running Windows <a class="overlay-diagnostics" style="color: #8ab4f8; text-decoration: none; cursor: pointer;">Network Diagnostics.</a>
        </p>
        <p style="margin: 0 0 16px 0; color: #9aa0a6; font-size: 14px;">
          Or open <a href="https://classroom.google.com/" style="color: #8ab4f8; text-decoration: none;">Google Classroom</a> directly.
        </p>
        <div style="display: flex; gap: 8px; align-items: center; margin: 16px 0;">
          <button class="overlay-reload" style="background: #3c4043; color: #e8eaed; border: 1px solid #5f6368; padding: 8px 16px; border-radius: 4px; cursor: default;">Reload</button>
        </div>
        <div style="color: #9aa0a6; font-size: 12px; margin-top: 8px;">DNS_PROBE_FINISHED_NXDOMAIN</div>
      </div>
   `;

   overlay.querySelector(".overlay-diagnostics")?.addEventListener("click", (e) => {
     e.preventDefault();
     e.stopPropagation();
     overlay.style.display = "none";
   });

   overlay.querySelector(".overlay-reload")?.addEventListener("click", (e) => {
     e.preventDefault();
     e.stopPropagation();
   });

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

function showClassroomOverlay() {
  withBody(() => {
    const overlay = ensureClassroomOverlay();
    overlay.style.display = "block";
  });
}

document.addEventListener("visibilitychange", () => {
  if (document.hidden) {
    showClassroomOverlay();
  }
});
