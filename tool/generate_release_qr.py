"""Regenerate QR images and their release manifest together before publishing."""
import argparse
import json
import re
from pathlib import Path
import qrcode

parser = argparse.ArgumentParser()
parser.add_argument("release")
args = parser.parse_args()
if not re.fullmatch(r"v[0-9A-Za-z._-]+", args.release):
    parser.error("Invalid release tag")
root = Path(__file__).resolve().parents[1]
assets = {}
for platform, filename in [("Android", "ARC-Android-test.apk"),
                           ("Windows", "ARC-Windows-test.zip"),
                           ("macOS", "ARC-macOS-test.zip")]:
    url = f"https://github.com/HYowshi/ARC-Downloads/releases/download/{args.release}/{filename}"
    qrcode.make(url).save(root / "assets" / f"qr-{platform.lower()}.png")
    assets[platform] = url
(root / "assets" / "qr-release.json").write_text(
    json.dumps({"release": args.release, "assets": assets}, indent=2), encoding="utf-8")
print("QR images and manifest updated for", args.release)
