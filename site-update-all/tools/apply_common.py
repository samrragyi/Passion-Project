#!/usr/bin/env python3
"""
Fills the standard wording (tools/common_strings.json) into LIVE language packs where a field is missing or still English.
Never overwrites text a translator supplied. Run from the repo root:

  python3 tools/apply_common.py            # all live packs (lang/*.js except en)
  python3 tools/apply_common.py --code bn  # one language
  python3 tools/apply_common.py --dry-run  # report only

Writes lang/<code>.js in the same format the builder uses, bumps ASSET_VERSION, and lists exactly what changed.
"""
import argparse, json, os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import lang_schema as S

ap = argparse.ArgumentParser(); ap.add_argument("--code"); ap.add_argument("--dry-run", action="store_true"); a = ap.parse_args()
en = S.load_pack(os.path.join(S.ROOT, "lang", "en.js")); F = {f[1]: f for f in S.FIELDS}; M = S.load_common()
codes = [a.code] if a.code else sorted(f[:-3] for f in os.listdir(os.path.join(S.ROOT, "lang")) if f.endswith(".js") and f != "en.js")
changed = []
for code in codes:
    path = os.path.join(S.ROOT, "lang", f"{code}.js"); pack = S.load_pack(path); strings = M["languages"].get(code)
    if not strings: print(f"{code}: nothing in common_strings.json, skipped"); continue
    done = []
    for fid in M["fields"]:
        p = F[fid][3]
        try: cur = S.get_path(pack, p)
        except (KeyError, IndexError, TypeError): cur = None
        if (cur is None or cur == "" or cur == S.get_path(en, p)) and strings[fid] != S.get_path(en, p):
            S.set_path(pack, p, strings[fid]); done.append(fid)
    sens = [f for f in done if f in M["sensitive"]]
    print(f"{code}: {len(done)} filled" + (f"  [need native check: {', '.join(sens)}]" if sens else "") + (f"\n      {', '.join(done)}" if done else ""))
    if done and not a.dry_run:
        open(path, "w", encoding="utf-8").write(f"/* Language pack: {pack['name']} ({code}). Loaded on demand by index.html. */\nwindow.registerLanguage({json.dumps(pack, ensure_ascii=False, indent=2)});\n"); changed.append(code)
if changed and not a.dry_run:
    old, new = S.bump_asset_version(S.ROOT); print(f"ASSET_VERSION {old} -> {new}; changed: {', '.join(changed)}")
elif not changed: print("Nothing to change.")
