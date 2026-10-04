#!/usr/bin/env python3
"""
Makes flags/<code>.svg for every language in languages_registry.json that doesn't have one yet,
from the free 'flag-icons' collection (MIT licence).

  python3 tools/fetch_flags.py            # only what's missing
  python3 tools/fetch_flags.py --force    # redo all (overwrites)

Needs: node/npm on PATH (it downloads flag-icons into a temporary folder).
"""
import os, shutil, subprocess, sys, tempfile
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import lang_schema as S

def main():
    force = "--force" in sys.argv; langs = S.registry()["languages"]
    todo = [l for l in langs if force or not os.path.exists(os.path.join(S.ROOT, "flags", l["code"] + ".svg"))]
    if not todo: print("All flags already present."); return
    tmp = tempfile.mkdtemp(); subprocess.run(["npm", "install", "--prefix", tmp, "flag-icons", "--silent"], check=True)
    src = os.path.join(tmp, "node_modules", "flag-icons", "flags", "4x3")
    os.makedirs(os.path.join(S.ROOT, "flags"), exist_ok=True)
    for l in todo:
        f = os.path.join(src, l["flag"] + ".svg")
        if not os.path.exists(f): print(f"  MISSING flag '{l['flag']}' for {l['code']}"); continue
        svg = open(f, encoding="utf-8").read()
        if "xlink:" in svg and "xmlns:xlink" not in svg: svg = svg.replace("<svg ", '<svg xmlns:xlink="http://www.w3.org/1999/xlink" ', 1)
        open(os.path.join(S.ROOT, "flags", l["code"] + ".svg"), "w", encoding="utf-8").write(svg)
        print(f"  flags/{l['code']}.svg  <- {l['flag']}  ({os.path.getsize(os.path.join(S.ROOT,'flags',l['code']+'.svg'))//1024} KB)")
    shutil.rmtree(tmp, ignore_errors=True)

if __name__ == "__main__": main()
