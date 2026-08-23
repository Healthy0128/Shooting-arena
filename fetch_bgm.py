from pathlib import Path
from urllib.request import Request, urlopen
import json, sys, time

ROOT = Path(__file__).resolve().parent
OUT = ROOT / "assets" / "audio" / "bgm"
OUT.mkdir(exist_ok=True)

tracks = json.loads((ROOT / "tracks.json").read_text(encoding="utf-8"))

for t in tracks:
    target = OUT / t["file"]
    print(f'Downloading: {t["title"]}')
    req = Request(
        t["download"],
        headers={"User-Agent": "Mozilla/5.0 DuelArenaAssetFetcher/1.0"}
    )
    try:
        with urlopen(req, timeout=60) as r, open(target, "wb") as f:
            while True:
                chunk = r.read(1024 * 1024)
                if not chunk:
                    break
                f.write(chunk)
        print(f"  -> {target.name} ({target.stat().st_size:,} bytes)")
    except Exception as e:
        print(f"FAILED: {t['title']}: {e}", file=sys.stderr)
        raise
    time.sleep(0.5)

print("\nAll BGM files downloaded.")
