"use strict";
const platforms = [
  [
    "Android",
    "ARC-Android-test.apk",
    "APK nội bộ, ký bằng khóa ARC; xác nhận cài trên thiết bị.",
  ],
  [
    "Windows",
    "ARC-Windows-test.zip",
    "Giải nén và chạy ARC.exe; bản portable chưa ký.",
  ],
  ["macOS", "ARC-macOS-test.zip", "Bản thử nghiệm chưa notarize."],
  ["iOS", "ARC-iOS-signed-test.ipa", "Chứng chỉ ký iOS hiện đã bị thu hồi; dùng ARC Web trong lúc chờ chứng chỉ hợp lệ."],
];
const platformDetails = {
  Android: {specs: ["APK · Điện thoại / máy tính bảng", "Camera + vị trí cho điểm danh"], steps: ["Tải APK trên thiết bị Android.", "Mở tệp, cấp quyền cài từ nguồn này nếu hệ điều hành yêu cầu.", "Đăng nhập bằng tài khoản BCN/Admin cấp."]},
  Windows: {specs: ["Windows 10/11 · x64", "Bản portable · không cần trình cài"], steps: ["Tải ZIP và giải nén toàn bộ vào một thư mục.", "Mở ARC.exe, giữ nguyên các tệp DLL và thư mục data đi kèm.", "Nếu báo thiếu MSVCP140/VCRUNTIME140, cài Visual C++ Redistributable x64 từ Microsoft. Nếu bị chính sách thiết bị chặn, liên hệ người quản trị."]},
  macOS: {specs: ["macOS 12 trở lên", "Intel x86_64 + Apple Silicon arm64"], steps: ["Tải ZIP và giải nén ARC.app.", "Di chuyển ứng dụng vào Applications.", "Bản chưa notarize có thể bị Gatekeeper chặn; dùng bản web nếu không mở được."]},
  iOS: {specs: ["iOS 15 trở lên", "Cần chứng chỉ + provisioning hợp lệ"], steps: ["Bản unsigned dành cho quy trình ký, không phải bản cài trực tiếp.", "Trong lúc chờ bản ký hợp lệ, mở ARC Web bằng Safari.", "Có thể thêm website vào Màn hình chính từ menu Chia sẻ."]},
};
async function loadDownloads() {
  const results = await Promise.allSettled([
    fetch("assets/release.json", {cache: "no-store"}).then(readJson),
    fetch("assets/qr-release.json", { cache: "no-store" }).then(readJson),
  ]);
  let release = results[0].status === "fulfilled" ? results[0].value : null;
  if (!release) {
    try {
      release = await fetchLatestRelease();
    } catch {}
  }
  render(release, results[1].status === "fulfilled" ? results[1].value : null);
}
async function fetchLatestRelease() {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);
  try {
    return await fetch(
      "https://api.github.com/repos/HYowshi/ARC-Downloads/releases/latest",
      { signal: controller.signal },
    ).then(readJson);
  } finally {
    clearTimeout(timeout);
  }
}
function readJson(response) {
  if (!response.ok) throw new Error("Không tải được danh sách");
  return response.json();
}
loadDownloads();
function el(tag, text, cls) {
  const n = document.createElement(tag);
  if (text) n.textContent = text;
  if (cls) n.className = cls;
  return n;
}
function render(release, qrManifest) {
  document.getElementById("status").textContent = release
    ? "Bản thử nghiệm hiện tại: " + release.tag_name
    : "Chưa tải được danh sách. Kiểm tra tại mục Releases.";
  for (const [name, file, note] of platforms) {
    const card = el("article", "", "card");
    const asset = file && release?.assets.find((x) => x.name === file);
    const platformIcon = el("div", "", "platform-icon " + name.toLowerCase());
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("aria-hidden", "true");
    svg.setAttribute("focusable", "false");
    const use = document.createElementNS("http://www.w3.org/2000/svg", "use");
    use.setAttribute(
      "href",
      "assets/platforms/platforms.svg#" + name.toLowerCase(),
    );
    svg.append(use);
    platformIcon.append(svg);
    card.append(
      platformIcon,
      el("span", asset ? "BẢN THỬ NGHIỆM" : "CHƯA PHÁT HÀNH", "badge"),
      el("h3", name),
      el("p", note, "note"),
    );
    const details = platformDetails[name];
    const specs = el("ul", "", "platform-specs");
    details.specs.forEach((text) => specs.append(el("li", text)));
    card.append(specs);
    if (
      asset &&
      asset.browser_download_url.startsWith(
        "https://github.com/HYowshi/ARC-Downloads/releases/download/",
      )
    ) {
      const a = el("a", "Tải trực tiếp ↗", "download");
      a.href = asset.browser_download_url;
      a.addEventListener("click", () => {
        a.textContent = "Đã mở liên kết ✓";
        a.classList.add("download-opened");
        setTimeout(() => {
          a.textContent = "Tải trực tiếp ↗";
          a.classList.remove("download-opened");
        }, 2400);
      });
      card.append(a, el("p", (asset.size / 1048576).toFixed(1) + " MB"));
      if (
        release.tag_name === qrManifest?.release &&
        qrManifest.assets?.[name] === asset.browser_download_url
      ) {
        const b = el("button", "Quét QR để tải", "qr-button");
        b.type = "button";
        b.setAttribute("aria-expanded", "false");
        b.onclick = () => {
          let qr = card.querySelector(".qr");
          if (qr) {
            qr.remove();
            b.textContent = "Quét QR để tải";
            b.setAttribute("aria-expanded", "false");
            return;
          }
          qr = el("div", "", "qr");
          const img = el("img");
          img.src = "assets/qr-" + name.toLowerCase() + ".png?v=" + encodeURIComponent(release.tag_name);
          img.alt = "QR tải ARC " + name + " " + release.tag_name;
          img.width = 180;
          img.height = 180;
          qr.append(img);
          card.append(qr);
          b.textContent = "Ẩn QR";
          b.setAttribute("aria-expanded", "true");
        };
        card.append(b);
      }
    } else {
      card.append(el("p", "Chưa có tệp cài đặt phù hợp."));
      const web = el("a", "Dùng ARC Web ↗", "secondary");
      web.href = "https://airoboticsclub.pages.dev/";
      card.append(web);
    }
    const guide = el("details", "", "install-guide");
    guide.append(el("summary", "Hướng dẫn cài đặt"));
    const steps = el("ol");
    details.steps.forEach((text) => steps.append(el("li", text)));
    guide.append(steps);
    card.append(guide);
    document.getElementById("downloads-list").append(card);
  }
}
