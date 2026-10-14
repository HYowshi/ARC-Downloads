"use strict";
const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)");
const themeButton = document.getElementById("theme-toggle");
const heroShot = document.getElementById("hero-shot");
const galleryImage = document.getElementById("gallery-shot");
const tabs = [...document.querySelectorAll("[data-shot]")];
const indicator = document.querySelector(".tab-indicator");
const dialog = document.getElementById("screenshot-dialog");
const largeShot = document.getElementById("large-shot");
let activeShot = "home";
const shots = {
  home: {
    title: "Các chức năng trong tầm tay",
    description:
      "Trang chủ phân bố theo vai trò. Thành viên và BCN/Admin có các chức năng phù hợp với tài khoản.",
    label: "Trang chủ ARC",
    layout: "phone",
  },
  calendar: {
    title: "Theo dõi lịch theo cách của bạn",
    description:
      "Chế độ ngày, tuần và tháng. Chọn thời gian cần xem để theo dõi sự kiện và đăng ký buổi trực.",
    label: "Lịch tháng ARC trên mobile",
    layout: "phone",
  },
  desktop: {
    title: "Không gian rộng cho màn hình lớn",
    description:
      "Sidebar riêng trên PC và lịch phân bố theo chiều ngang. Cùng dữ liệu CLB, bố cục phù hợp từng thiết bị.",
    label: "Lịch ARC trên PC",
    layout: "desktop",
  },
};
function isLight() {
  return document.documentElement.dataset.theme === "light";
}
function shotSource(name) {
  return (
    "assets/screenshots/" +
    (name === "home"
      ? "home-" + (isLight() ? "light" : "dark")
      : name === "calendar"
        ? "calendar-light"
        : "calendar-desktop") +
    ".png"
  );
}
function positionIndicator() {
  const selected = tabs.find((tab) => tab.dataset.shot === activeShot);
  indicator.style.width = selected.offsetWidth + "px";
  indicator.style.translate = selected.offsetLeft - 5 + "px 0";
}
function selectShot(name, animate = true) {
  const previousIndex = tabs.findIndex(
    (tab) => tab.dataset.shot === activeShot,
  );
  activeShot = name;
  tabs.forEach((tab) => {
    const selected = tab.dataset.shot === name;
    tab.setAttribute("aria-selected", String(selected));
    tab.tabIndex = selected ? 0 : -1;
  });
  const shot = shots[name];
  const index = tabs.findIndex((tab) => tab.dataset.shot === name);
  galleryImage.src = shotSource(name);
  galleryImage.alt = shot.label + ", ảnh chụp thực tế";
  document.getElementById("shot-title").textContent = shot.title;
  document.getElementById("shot-description").textContent = shot.description;
  document.getElementById("shot-number").textContent =
    "0" + (index + 1) + " / 03";
  document
    .getElementById("shot-panel")
    .setAttribute("aria-labelledby", "shot-" + name);
  const opener = document.getElementById("open-screenshot");
  opener.dataset.layout = shot.layout;
  opener.setAttribute("aria-label", "Mở ảnh " + shot.label);
  positionIndicator();
  if (
    animate &&
    !reducedMotion.matches &&
    typeof galleryImage.animate === "function"
  ) {
    galleryImage.animate(
      [
        {
          opacity: 0,
          transform:
            "translateX(" + (index >= previousIndex ? 12 : -12) + "px)",
        },
        { opacity: 1, transform: "translateX(0)" },
      ],
      { duration: 320, easing: "cubic-bezier(.22,1,.36,1)" },
    );
  }
}
function syncTheme() {
  themeButton.setAttribute(
    "aria-label",
    isLight() ? "Chuyển sang giao diện tối" : "Chuyển sang giao diện sáng",
  );
  themeButton.setAttribute("aria-pressed", String(isLight()));
  heroShot.src = shotSource("home");
  selectShot(activeShot, false);
}
themeButton.addEventListener("click", () => {
  document.documentElement.dataset.theme = isLight() ? "dark" : "light";
  try {
    localStorage.setItem(
      "arc-download-theme",
      document.documentElement.dataset.theme,
    );
  } catch {}
  syncTheme();
});
tabs.forEach((tab, index) => {
  tab.addEventListener("click", () => selectShot(tab.dataset.shot));
  tab.addEventListener("keydown", (event) => {
    let target;
    if (event.key === "ArrowRight") target = (index + 1) % tabs.length;
    if (event.key === "ArrowLeft")
      target = (index + tabs.length - 1) % tabs.length;
    if (event.key === "Home") target = 0;
    if (event.key === "End") target = tabs.length - 1;
    if (target !== undefined) {
      event.preventDefault();
      tabs[target].focus();
      selectShot(tabs[target].dataset.shot);
    }
  });
});
if ("ResizeObserver" in window) {
  new ResizeObserver(positionIndicator).observe(
    document.querySelector(".shot-tabs"),
  );
} else {
  window.addEventListener("resize", positionIndicator);
}
syncTheme();
document.getElementById("open-screenshot").addEventListener("click", () => {
  largeShot.src = galleryImage.src;
  largeShot.alt = galleryImage.alt;
  if (typeof dialog.showModal === "function") {
    dialog.showModal();
  } else {
    window.open(galleryImage.src, "_blank", "noopener,noreferrer");
  }
});
document
  .getElementById("close-screenshot")
  .addEventListener("click", () => dialog.close());
dialog.addEventListener("click", (event) => {
  if (event.target === dialog) dialog.close();
});
document.querySelectorAll(".faq-item > button").forEach((button) =>
  button.addEventListener("click", () => {
    const open = button.getAttribute("aria-expanded") !== "true";
    button.setAttribute("aria-expanded", String(open));
    button.parentElement.dataset.open = String(open);
    document
      .getElementById(button.getAttribute("aria-controls"))
      .setAttribute("aria-hidden", String(!open));
  }),
);
// Chỉ chạy entrance một lần khi phần nội dung đi vào màn hình.
if (!reducedMotion.matches && "IntersectionObserver" in window) {
  document.documentElement.classList.add("motion-enabled");
  const observer = new IntersectionObserver(
    (entries) =>
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("visible");
          observer.unobserve(entry.target);
        }
      }),
    { threshold: 0.12 },
  );
  document
    .querySelectorAll(".reveal, .feature-grid article, .trust article")
    .forEach((element) => {
      element.classList.add("reveal");
      observer.observe(element);
    });
  const onMotionChange = (event) => {
    if (event.matches) {
      document.documentElement.classList.remove("motion-enabled");
      observer.disconnect();
    }
  };
  if (typeof reducedMotion.addEventListener === "function") {
    reducedMotion.addEventListener("change", onMotionChange);
  } else {
    reducedMotion.addListener(onMotionChange);
  }
}
if (matchMedia("(hover: hover) and (pointer: fine)").matches) {
  const visual = document.querySelector("[data-tilt]");
  let pending = false;
  visual.addEventListener("pointermove", (event) => {
    if (pending || reducedMotion.matches) return;
    pending = true;
    requestAnimationFrame(() => {
      const bounds = visual.getBoundingClientRect();
      visual.style.setProperty(
        "--tilt-x",
        ((event.clientX - bounds.left) / bounds.width - 0.5) * 6 + "deg",
      );
      visual.style.setProperty(
        "--tilt-y",
        -((event.clientY - bounds.top) / bounds.height - 0.5) * 4 + "deg",
      );
      pending = false;
    });
  });
  visual.addEventListener("pointerleave", () => {
    visual.style.setProperty("--tilt-x", "0deg");
    visual.style.setProperty("--tilt-y", "0deg");
  });
}
