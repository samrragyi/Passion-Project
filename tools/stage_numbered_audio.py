#!/usr/bin/env python3
"""Turn Narakeet-numbered recordings (0001.mp3 .. 0022.mp3) into <code>_intro/_s1..s6/_q01..q15.mp3 in a staging folder.
Fixed order: 0001 intro | 0002-0007 s1-s6 | 0008-0022 q01-q15.
Strict: stops unless exactly 0001..0022 are present (no gaps, no extras, no duplicates). Originals are never touched.
Use: python3 tools/stage_numbered_audio.py --code bn --src /mnt/user-data/uploads --dest /tmp/audio_bn
Then: build_language.py --audio /tmp/audio_bn ..."""
import argparse, os, re, shutil, sys
SLOTS = ["intro"] + [f"s{i}" for i in range(1, 7)] + [f"q{i:02d}" for i in range(1, 16)]   # index 0 -> 0001
ap = argparse.ArgumentParser(); ap.add_argument("--code", required=True); ap.add_argument("--src", required=True); ap.add_argument("--dest", required=True)
a = ap.parse_args()
nums = {}
for f in sorted(os.listdir(a.src)):
    m = re.fullmatch(r"(\d{4})\.mp3", f, re.I)
    if m: nums[int(m[1])] = f
missing = [n for n in range(1, 23) if n not in nums]; extra = sorted(n for n in nums if n > 22 or n < 1)
if missing or extra:
    sys.exit(f"ERROR: need exactly 0001..0022. Missing: {[f'{n:04d}' for n in missing]}. Unexpected: {[f'{n:04d}' for n in extra]}.")
shutil.rmtree(a.dest, ignore_errors=True); os.makedirs(a.dest)
for n, slot in enumerate(SLOTS, 1):
    shutil.copy2(os.path.join(a.src, nums[n]), os.path.join(a.dest, f"{a.code}_{slot}.mp3"))
print(f"OK: staged 22 files as {a.code}_*.mp3 in {a.dest}")
