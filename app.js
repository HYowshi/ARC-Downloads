"use strict";
const platforms = [
  [
    "Android",
    "ARC-Android-test.apk",
    "APK thử nghiệm; cần xác nhận cài từ nguồn này.",
  ],
  [
    "Windows",
    "ARC-Windows-test.zip",
    "Giải nén và chạy ARC.exe; bản portable chưa ký.",
  ],
  ["macOS", "ARC-macOS-test.zip", "Bản thử nghiệm chưa notarize."],
  ["iOS", null, "Chờ IPA hợp lệ; build unsigned chưa thể cài trực tiếp."],
];
async function loadDownloads() {
  const results = await Promise.allSettled([
    fetch(
      "https://api.github.com/repos/HYowshi/ARC-Downloads/releases/latest",
    ).then(readJson),
    fetch("assets/qr-release.json").then(readJson),
  ]);
  render(
    results[0].status === "fulfilled" ? results[0].value : null,
    results[1].status === "fulfilled" ? results[1].value : null,
  );
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
    card.append(
      el("span", asset ? "BẢN THỬ NGHIỆM" : "CHƯA PHÁT HÀNH", "badge"),
      el("h3", name),
      el("p", note, "note"),
    );
    if (
      asset &&
      asset.browser_download_url.startsWith(
        "https://github.com/HYowshi/ARC-Downloads/releases/download/",
      )
    ) {
      const a = el("a", "Tải trực tiếp ↗", "download");
      a.href = asset.browser_download_url;
      card.append(a, el("p", (asset.size / 1048576).toFixed(1) + " MB"));
      if (
        release.tag_name === qrManifest?.release &&
        qrManifest.assets?.[name] === asset.browser_download_url
      ) {
        const b = el("button", "Hiện QR tải", "qr-button");
        b.type = "button";
        b.setAttribute("aria-expanded", "false");
        b.onclick = () => {
          let qr = card.querySelector(".qr");
          if (qr) {
            qr.remove();
            b.textContent = "Hiện QR tải";
            b.setAttribute("aria-expanded", "false");
            return;
          }
          qr = el("div", "", "qr");
          const img = el("img");
          img.src = "assets/qr-" + name.toLowerCase() + ".png";
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
    } else card.append(el("p", "Chưa có tệp cài đặt phù hợp."));
    document.getElementById("downloads-list").append(card);
  }
}
