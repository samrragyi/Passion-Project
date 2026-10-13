#!/usr/bin/env python3
"""Add the interface strings in tools/new_ui_strings.json (myAnswersTitle, myAnswersNote, multiSymptomHint) to the
language packs in lang/. Safe to run again: it only sets the three keys, keeps the key order (they sit right after
ui.privacyBadge) and writes with the same writer as build_language.py.  Run it after building a new language
(e.g. pt-br, pt): the builder inherits English for these keys until you do.
Usage: python3 tools/apply_new_ui_strings.py [--check]"""
import sys, os, json
HERE = os.path.dirname(os.path.abspath(__file__)); REPO = os.path.dirname(HERE); sys.path.insert(0, HERE)
import lang_schema as S
data = json.load(open(os.path.join(HERE, "new_ui_strings.json"), encoding="utf-8")); keys = data["keys"]; tr = data["languages"]
check = "--check" in sys.argv; changed = []; missing = []
for fn in sorted(os.listdir(os.path.join(REPO, "lang"))):
    if not fn.endswith(".js"): continue
    code = fn[:-3]; path = os.path.join(REPO, "lang", fn); pack = S.load_pack(path)
    if code not in tr: missing.append(code); continue
    ui = pack["ui"]; new = {}
    for k, v in ui.items():
        new[k] = v
        if k == "privacyBadge":
            for kk in keys: new[kk] = tr[code][kk]
    if "privacyBadge" not in ui:
        new = dict(ui); [new.__setitem__(kk, tr[code][kk]) for kk in keys]
    if new != ui or list(new) != list(ui):
        changed.append(code)
        if not check:
            pack["ui"] = new
            open(path, "w", encoding="utf-8").write(f"/* Language pack: {pack['name']} ({code}). Loaded on demand by index.html. */\nwindow.registerLanguage({json.dumps(pack, ensure_ascii=False, indent=2)});\n")
print(("would change" if check else "updated"), len(changed), "pack(s):", ", ".join(changed) or "none")
if missing: print("no translation in new_ui_strings.json for:", ", ".join(missing))
sys.exit(1 if (check and changed) else 0)
