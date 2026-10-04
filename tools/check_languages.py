#!/usr/bin/env python3
"""
Checks every language listed in languages.js before you publish.
Run from the repo root:   python3 tools/check_languages.py
No installs needed (standard library only). Exits with an error if a language
is broken; missing audio is reported as a warning (the app falls back to
text-to-speech for any clip that isn't there).
"""
import json, os, re, sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
def p(*a): return os.path.join(ROOT, *a)

manifest = open(p("languages.js"), encoding="utf-8").read()
langs = re.findall(r'\{\s*code:\s*"([^"]+)"\s*,\s*name:\s*"([^"]+)"\s*,\s*gloss:\s*"([^"]+)"\s*,\s*audio:\s*(true|false)', manifest)
if not langs:
    sys.exit("Could not read any languages from languages.js")

SECTIONS, QUESTIONS, SCALE, STEPS, LEGEND = 6, 15, 4, 3, 4
REQUIRED_UI = ["appTitleShort","appTitle","appSubtitle","introBody","startButton","questionCounter","sectionPrefix",
               "listenLabel","pauseLabel","prevButton","nextButton","submitButton","printButton","restartButton",
               "beforeYouBegin","formalDisclaimer","consentLabel","languagePageTitle","privacyBadge","homeLabel"]
expected_audio = ["intro.mp3"] + [f"s{i}.mp3" for i in range(1, SECTIONS+1)] + [f"q{i:02d}.mp3" for i in range(1, QUESTIONS+1)]

errors, warnings = 0, 0
codes = [c for c, *_ in langs]
if "en" not in codes:
    print("ERROR: 'en' must be in languages.js (the results page is always English)"); errors += 1

for code, name, gloss, has_audio in langs:
    print(f"\n== {gloss} ({code}) ==")
    # ---- text pack
    path = p("lang", f"{code}.js")
    if not os.path.exists(path):
        print(f"  ERROR lang/{code}.js is missing"); errors += 1; continue
    src = open(path, encoding="utf-8").read()
    m = re.search(r'registerLanguage\((\{.*\})\);?\s*$', src, re.S)
    try:
        pack = json.loads(m.group(1))
    except Exception as e:
        print(f"  ERROR lang/{code}.js is not valid (check commas/quotes): {e}"); errors += 1; continue
    def need(cond, msg):
        global errors
        if not cond: print("  ERROR", msg); errors += 1
    need(pack.get("code") == code, f"pack code is '{pack.get('code')}', expected '{code}'")
    need(pack.get("tag"), "missing 'tag' (e.g. fr-FR); needed for text-to-speech")
    need(pack.get("dir") in ("ltr", "rtl"), "'dir' must be ltr or rtl")
    need(len(pack.get("sections", [])) == SECTIONS, f"needs exactly {SECTIONS} section names")
    qs = pack.get("questions", [])
    need(len(qs) == QUESTIONS, f"needs exactly {QUESTIONS} questions, has {len(qs)}")
    need(all(q.get("t") and q.get("q") for q in qs), "every question needs a title 't' and text 'q'")
    need(len(pack.get("scale", [])) == SCALE, f"needs {SCALE} answer-button labels in 'scale'")
    need(len(pack.get("howItWorks", [])) == STEPS, f"needs {STEPS} steps in 'howItWorks'")
    need(len(pack.get("severityLegend", [])) == LEGEND, f"needs {LEGEND} items in 'severityLegend'")
    ui = pack.get("ui", {})
    missing = [k for k in REQUIRED_UI if not ui.get(k)]
    need(not missing, f"missing ui text: {', '.join(missing)}")
    # ---- flag
    need(os.path.exists(p("flags", f"{code}.svg")), f"flags/{code}.svg is missing")
    # ---- audio
    folder = p("audio", code)
    present = set(os.listdir(folder)) if os.path.isdir(folder) else set()
    absent = [f for f in expected_audio if f not in present]
    extra = sorted(f for f in present if f not in expected_audio and not f.startswith("."))
    if has_audio == "true" and not os.path.isdir(folder):
        print(f"  ERROR audio:true in languages.js but audio/{code}/ does not exist"); errors += 1
    elif has_audio == "false" and present:
        print(f"  WARNING audio files exist but languages.js says audio:false, so they won't be used"); warnings += 1
    if has_audio == "true" and absent:
        print(f"  WARNING {len(absent)}/{len(expected_audio)} clips missing (will use text-to-speech): {', '.join(absent)}"); warnings += 1
    if extra:
        print(f"  WARNING unrecognised audio file names (ignored): {', '.join(extra)}"); warnings += 1
    if has_audio == "true" and not absent:
        print(f"  audio: all {len(expected_audio)} clips present")
    if not errors: pass


# ---- question icons (shared by every language) ----
print("\n== Question icons ==")
MAX_ICON_KB = 150
for i in range(1, QUESTIONS + 1):
    f = p("icons", f"q{i:02d}.webp")
    if not os.path.exists(f):
        print(f"  ERROR icons/q{i:02d}.webp is missing"); errors += 1; continue
    head = open(f, "rb").read(12)
    if not (head[:4] == b"RIFF" and head[8:12] == b"WEBP"):
        print(f"  ERROR icons/q{i:02d}.webp is not a WebP image (run tools/make_icons.py)"); errors += 1
    kb = os.path.getsize(f) // 1024
    if kb > MAX_ICON_KB:
        print(f"  WARNING icons/q{i:02d}.webp is {kb} KB - looks like an un-shrunk original (run tools/make_icons.py)"); warnings += 1
print(f"  {QUESTIONS} icons checked")

print(f"\n{len(langs)} language(s) + icons checked: {errors} error(s), {warnings} warning(s)")
sys.exit(1 if errors else 0)
