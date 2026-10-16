#!/usr/bin/env python3
"""Apply the results-page strings in tools/results_strings.json to the language packs in lang/:
the patient-facing top of the results page (title, intro, overall score label, 'Understanding your score' and its three
explanations, 'Most noticeable today', the 'nothing severe' line, 'Highest-severity items', 'None'), the NEW label
ui.assessmentDate, and the three band names (pack['bands']). Hindi keeps its translator's text (its entry only holds the
two strings that changed). Safe to run again; keeps key order (a new key is inserted right after ui.none).
Run it after building any NEW language (the builder inherits English for these keys).
Usage: python3 tools/apply_results_strings.py [--check]"""
import sys, os, json
HERE = os.path.dirname(os.path.abspath(__file__)); REPO = os.path.dirname(HERE); sys.path.insert(0, HERE)
import lang_schema as S
data = json.load(open(os.path.join(HERE, "results_strings.json"), encoding="utf-8")); tr = data["languages"]
check = "--check" in sys.argv; changed = []; missing = []
for fn in sorted(os.listdir(os.path.join(REPO, "lang"))):
    if not fn.endswith(".js"): continue
    code = fn[:-3]; path = os.path.join(REPO, "lang", fn); pack = S.load_pack(path)
    if code not in tr: missing.append(code); continue
    t = tr[code]; ui = pack["ui"]; new = {}
    for k, v in ui.items():
        new[k] = t[k] if (k in t and k != "bands") else v
        if k == "none" and "assessmentDate" in t and "assessmentDate" not in ui: new["assessmentDate"] = t["assessmentDate"]
    if "none" not in ui:
        for k in t:
            if k != "bands": new[k] = t[k]
    bands = t["bands"] if "bands" in t else pack["bands"]
    if new != ui or list(new) != list(ui) or bands != pack["bands"]:
        changed.append(code)
        if not check:
            pack["ui"] = new; pack["bands"] = list(bands)
            open(path, "w", encoding="utf-8").write(f"/* Language pack: {pack['name']} ({code}). Loaded on demand by index.html. */\nwindow.registerLanguage({json.dumps(pack, ensure_ascii=False, indent=2)});\n")
print(("would change" if check else "updated"), len(changed), "pack(s):", ", ".join(changed) or "none")
if missing: print("no entry in results_strings.json for:", ", ".join(missing))
sys.exit(1 if (check and changed) else 0)
