"""Download the Turkish Piper voice model into backend/models/piper/.

Usage (from the backend folder):
    python scripts/download_model.py          # skip files that already exist
    python scripts/download_model.py --force  # re-download
"""

from __future__ import annotations

import argparse
import sys
import urllib.request
from pathlib import Path

BACKEND_DIR = Path(__file__).resolve().parents[1]
MODEL_DIR = BACKEND_DIR / "models" / "piper"
VOICE = "tr_TR-dfki-medium"
BASE_URL = "https://huggingface.co/rhasspy/piper-voices/resolve/main/tr/tr_TR/dfki/medium"
FILES = (f"{VOICE}.onnx", f"{VOICE}.onnx.json")


def download(url: str, target: Path) -> None:
    tmp = target.with_suffix(target.suffix + ".part")
    with urllib.request.urlopen(url, timeout=60) as response, tmp.open("wb") as out:
        total = int(response.headers.get("Content-Length") or 0)
        done = 0
        while chunk := response.read(1 << 16):
            out.write(chunk)
            done += len(chunk)
            if total:
                print(f"\r  {target.name}: {done * 100 // total}%", end="", flush=True)
    print()
    tmp.replace(target)


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--force", action="store_true", help="re-download existing files")
    args = parser.parse_args()

    MODEL_DIR.mkdir(parents=True, exist_ok=True)
    for name in FILES:
        target = MODEL_DIR / name
        if target.is_file() and target.stat().st_size > 0 and not args.force:
            print(f"  {name}: already present, skipping")
            continue
        print(f"  downloading {name} ...")
        try:
            download(f"{BASE_URL}/{name}", target)
        except Exception as exc:  # noqa: BLE001
            print(f"ERROR: could not download {name}: {exc}", file=sys.stderr)
            return 1
    print(f"Model ready in {MODEL_DIR}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
