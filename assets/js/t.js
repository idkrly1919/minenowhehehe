document.addEventListener("DOMContentLoaded", function () {
  const overlay = document.getElementById("overlay");

  let toastContainer = document.querySelector(".toast-container");
  if (!toastContainer) {
    toastContainer = document.createElement("div");
    toastContainer.className = "toast-container";
    document.body.appendChild(toastContainer);
  }

  const activeToasts = new Map();
  let hoverTimeout;

  toastContainer.addEventListener("mouseenter", () => {
    clearTimeout(hoverTimeout);
    activeToasts.forEach((controller) => controller.pause());
    updateToastPositions(true);
  });

  toastContainer.addEventListener("mouseleave", () => {
    hoverTimeout = setTimeout(() => {
      activeToasts.forEach((controller) => controller.start());
      updateToastPositions(false);
    }, 100);
  });

  const updateToastPositions = (isHovered = false) => {
    const toasts = Array.from(
      toastContainer.querySelectorAll(".toast:not(.is-hiding)")
    );
    const visibleStackedCount = 5;

    toasts.forEach((toast, index) => {
      toast.style.zIndex = toasts.length - index;

      if (isHovered) {
        const toastHeight = toast.offsetHeight + 10;
        toast.style.transform = `translateY(-${
          index * toastHeight
        }px) scale(1)`;
        toast.style.opacity = "1";
      } else {
        if (index < visibleStackedCount) {
          const scale = 1 - index * 0.05;
          const translateY = index * -12;
          toast.style.transform = `translateY(${translateY}px) scale(${scale})`;
          toast.style.opacity = "1";
        } else {
          const lastVisibleIndex = visibleStackedCount - 1;
          const scale = 1 - lastVisibleIndex * 0.05;
          const translateY = lastVisibleIndex * -12;
          toast.style.transform = `translateY(${translateY}px) scale(${scale})`;
          toast.style.opacity = "0";
        }
      }
    });
  };

  window.showToast = function (type, message, iconName) {
    const maxToasts = 5;

    const currentToasts = toastContainer.querySelectorAll(
      ".toast:not(.is-hiding)"
    );

    if (currentToasts.length >= maxToasts) {
      const oldestToast = currentToasts[currentToasts.length - 1];
      hideToast(oldestToast);
    }

    const toast = document.createElement("div");
    toast.className = `toast ${type}`;

    toast.style.opacity = "0";
    toast.style.transform = "translateY(100%)";

    const icons = {
      success: "fa-solid check-circle",
      error: "fa-solid times-circle",
      info: "fa-solid info-circle"
    };
    const iconClass = iconName
      ? `fa-solid fa-${iconName}`
      : icons[type] || "fa-solid fa-info-circle";

    const content = document.createElement("div");
    content.className = "toast-content";
    content.innerHTML = `<i class="${iconClass}"></i><span>${message}</span>`;
    toast.appendChild(content);

    const controller = {
      id: null,
      remaining: 6000,
      startTime: null,
      pause: function () {
        if (this.id) {
          clearTimeout(this.id);
          this.id = null;
          this.remaining -= Date.now() - this.startTime;
        }
      },
      start: function () {
        if (this.id || this.remaining <= 0) return;
        this.startTime = Date.now();
        this.id = setTimeout(() => hideToast(toast), this.remaining);
      },
      clear: function () {
        clearTimeout(this.id);
      },
    };

    activeToasts.set(toast, controller);

    toastContainer.prepend(toast);

    setTimeout(() => {
      updateToastPositions(toastContainer.matches(":hover"));
    }, 0);

    controller.start();
  };

  function hideToast(toast) {
    if (!toast || !toast.parentNode || toast.classList.contains("is-hiding")) {
      return;
    }

    if (activeToasts.has(toast)) {
      activeToasts.get(toast).clear();
      activeToasts.delete(toast);
    }

    toast.style.zIndex = "-1";
    toast.classList.add("is-hiding");

    toast.addEventListener(
      "transitionend",
      () => {
        toast.remove();
      },
      { once: true }
    );

    updateToastPositions(toastContainer.matches(":hover"));
  }
});

(() => {
  const BLOCKER_Z_INDEX = String(Number.MAX_SAFE_INTEGER);
  const PRINT_SCREEN_KEY = "PrintScreen";
  const BLOCKER_TIMEOUT_MS = 750;
  const BLOCKER_FORCE_FLAG = "1";
  const ua = navigator.userAgent || "";
  const isGStreamer = /gstreamer/i.test(ua);
  let blocker;

  const ensureBlocker = () => {
    if (blocker) return blocker;
    blocker = document.createElement("div");
    blocker.id = "capture-veil";
    blocker.style.position = "fixed";
    blocker.style.inset = "0";
    blocker.style.background = "#000";
    blocker.style.pointerEvents = "none";
    blocker.style.zIndex = BLOCKER_Z_INDEX;
    blocker.style.opacity = "0";
    blocker.style.transition = "opacity 120ms ease";
    document.body.appendChild(blocker);
    return blocker;
  };

  const setBlockerVisible = (visible) => {
    if (!blocker || blocker.dataset.force === BLOCKER_FORCE_FLAG) return;
    blocker.style.opacity = visible ? "1" : "0";
  };

  const writeBlankClipboard = async () => {
    if (
      !navigator.clipboard ||
      !navigator.clipboard.write ||
      typeof ClipboardItem === "undefined"
    )
      return;
    try {
      const canvas = document.createElement("canvas");
      canvas.width = 1;
      canvas.height = 1;
      const ctx = canvas.getContext("2d");
      ctx.fillStyle = "#000";
      ctx.fillRect(0, 0, 1, 1);
      const blob = await new Promise((resolve) =>
        canvas.toBlob(resolve, "image/png")
      );
      if (!blob) return;
      const item = new ClipboardItem({ "image/png": blob });
      await navigator.clipboard.write([item]);
    } catch (err) {
      console.debug("capture guard: failed to blank clipboard", err);
    }
  };

  const handlePrintScreen = (e) => {
    if (e && typeof e.preventDefault === "function") {
      e.preventDefault();
    }
    ensureBlocker();
    setBlockerVisible(true);
    writeBlankClipboard();
    setTimeout(() => setBlockerVisible(false), BLOCKER_TIMEOUT_MS);
  };

  const setupGuards = () => {
    ensureBlocker();
    if (isGStreamer && blocker) {
      blocker.dataset.force = BLOCKER_FORCE_FLAG;
      blocker.style.opacity = "1";
      return;
    }

    window.addEventListener("blur", () => setBlockerVisible(true));
    window.addEventListener("focus", () => setBlockerVisible(false));
    document.addEventListener("visibilitychange", () =>
      setBlockerVisible(document.hidden)
    );
    document.addEventListener("keydown", (e) => {
      if (e.key !== PRINT_SCREEN_KEY) return;
      handlePrintScreen(e);
    });
  };

  if (
    document.readyState === "complete" ||
    document.readyState === "interactive"
  ) {
    setupGuards();
  } else {
    document.addEventListener("DOMContentLoaded", setupGuards);
  }
})();
