"""
Single source of truth for what a translator fills in, and where each piece goes in lang/<code>.js.
Used by make_template.py (writes the spreadsheet) and build_language.py (reads it back).
Change this file only if the app itself gains or loses translatable text.
"""
import json, os, re

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
N_QUESTIONS, N_SECTIONS = 15, 6

# (sheet, id, where it appears, path into the pack, must_keep_placeholder)
FIELDS = [
 # ---------------- sheet "Page 2"
 ("Page 2", "introBody", "First paragraph on page 2: welcome + what this tool does", ("ui", "introBody"), False),
 ("Page 2", "how1", "Step 1 on page 2 (listening to the voice)", ("howItWorks", 0), False),
 ("Page 2", "how2", "Step 2 on page 2 (choosing how bad a symptom is)", ("howItWorks", 1), False),
 ("Page 2", "how3", "Step 3 on page 2 (the summary)", ("howItWorks", 2), False),
 ("Page 2", "legend1_label", "Colour name: GREEN (the 'no symptom' answer button)", ("severityLegend", 0, "label"), False),
 ("Page 2", "legend1_desc", "What GREEN means", ("severityLegend", 0, "desc"), False),
 ("Page 2", "legend2_label", "Colour name: YELLOW (mild)", ("severityLegend", 1, "label"), False),
 ("Page 2", "legend2_desc", "What YELLOW means", ("severityLegend", 1, "desc"), False),
 ("Page 2", "legend3_label", "Colour name: AMBER / orange (moderate)", ("severityLegend", 2, "label"), False),
 ("Page 2", "legend3_desc", "What AMBER means", ("severityLegend", 2, "desc"), False),
 ("Page 2", "legend4_label", "Colour name: RED (severe)", ("severityLegend", 3, "label"), False),
 ("Page 2", "legend4_desc", "What RED means", ("severityLegend", 3, "desc"), False),
 ("Page 2", "beforeYouBegin", "Heading of the Notice box", ("ui", "beforeYouBegin"), False),
 ("Page 2", "formalDisclaimer", "Text inside the Notice box", ("ui", "formalDisclaimer"), False),
 ("Page 2", "consentLabel", "Tick-box wording under the Notice", ("ui", "consentLabel"), False),
 # ---------------- sheet "Buttons & labels"
 ("Buttons & labels", "startButton", "Button on page 2 that starts the questions", ("ui", "startButton"), False),
 ("Buttons & labels", "prevButton", "Back button", ("ui", "prevButton"), False),
 ("Buttons & labels", "nextButton", "Next button", ("ui", "nextButton"), False),
 ("Buttons & labels", "submitButton", "Button on the very last question page", ("ui", "submitButton"), False),
 ("Buttons & labels", "scale1", "Answer button 1 (green): no symptom", ("scale", 0), False),
 ("Buttons & labels", "scale2", "Answer button 2 (yellow): a little", ("scale", 1), False),
 ("Buttons & labels", "scale3", "Answer button 3 (amber): quite a bit", ("scale", 2), False),
 ("Buttons & labels", "scale4", "Answer button 4 (red): extremely", ("scale", 3), False),
 ("Buttons & labels", "questionCounter", "Small text above each question. KEEP the {n}", ("ui", "questionCounter"), True),
 ("Buttons & labels", "sectionPrefix", "Small heading above each section. KEEP the {n}", ("ui", "sectionPrefix"), True),
 ("Buttons & labels", "listenLabel", "Speaker button name (read by screen readers)", ("ui", "listenLabel"), False),
 ("Buttons & labels", "pauseLabel", "Pause button name (read by screen readers)", ("ui", "pauseLabel"), False),
 ("Buttons & labels", "printButton", "Print button on the results page", ("ui", "printButton"), False),
 ("Buttons & labels", "restartButton", "Start-again button on the results page", ("ui", "restartButton"), False),
 ("Buttons & labels", "appTitle", "HOME PAGE: big headline", ("ui", "appTitle"), False),
 ("Buttons & labels", "appSubtitle", "HOME PAGE: line under the headline", ("ui", "appSubtitle"), False),
 ("Buttons & labels", "privacyBadge", "HOME PAGE: privacy badge", ("ui", "privacyBadge"), False),
 ("Buttons & labels", "languagePageTitle", "HOME PAGE: 'Select your language'", ("ui", "languagePageTitle"), False),
 ("Buttons & labels", "homeLabel", "Home button in the top bar", ("ui", "homeLabel"), False),
]
SECTION_IDS = [f"sec{i}" for i in range(1, N_SECTIONS + 1)]
QUESTION_IDS = [f"q{i:02d}" for i in range(1, N_QUESTIONS + 1)]

SETTINGS = [  # (id, label, notes)
 ("code", "Language code", "Short lowercase code, e.g. fr. Used in every file name."),
 ("name", "Name in its own language", "Shown big on the language tile, e.g. Français"),
 ("gloss", "Name in English", "Shown small on the tile; tiles are sorted A-Z by this"),
 ("tag", "Voice / locale tag", "e.g. fr-FR. Chooses the phone's built-in voice if a recording is missing"),
 ("dir", "Text direction", "ltr = left to right, rtl = right to left (Arabic, Persian, Urdu, Hebrew)"),
 ("flag", "Flag (country code)", "Two-letter country code of the flag to show, e.g. fr"),
 ("note", "Variant / script note", "e.g. Simplified vs Traditional, which country's speakers"),
 ("translator", "Translated by", ""),
 ("reviewer", "Reviewed by (native speaker)", "Medical wording should be read by a native speaker"),
 ("recorder", "Voice recorded by", ""),
]

def load_pack(path):
    src = open(path, encoding="utf-8").read()
    return json.loads(re.search(r"registerLanguage\((\{.*\})\);?\s*$", src, re.S).group(1))

def get_path(pack, path):
    for k in path: pack = pack[k]
    return pack

def set_path(pack, path, value):
    for k in path[:-1]: pack = pack[k]
    pack[path[-1]] = value

def registry():
    return json.load(open(os.path.join(ROOT, "tools", "languages_registry.json"), encoding="utf-8"))


# ---------------------------------------------------------------- standard wording (tools/common_strings.json)
def load_common():
    """The master list of the 20 standard fields: {'fields', 'sensitive', 'supplied', 'languages'}. See common_strings.json."""
    return json.load(open(os.path.join(ROOT, "tools", "common_strings.json"), encoding="utf-8"))

def common_for(code):
    """{field id: text} for one language ({} if the master has nothing for it)."""
    return load_common()["languages"].get(code, {})

def bump_asset_version(repo):
    """Same cache-version bump build_language.py does; returns (old, new)."""
    import datetime
    p = os.path.join(repo, "languages.js"); s = open(p, encoding="utf-8").read()
    old = re.search(r'window\.ASSET_VERSION\s*=\s*"([^"]*)"', s).group(1); today = datetime.date.today().isoformat()
    m = re.match(r"^(\d{4}-\d{2}-\d{2})-(\d+)$", old); date, n = (m[1], int(m[2])) if m else (today, 0)
    if date < today: date, n = today, 0
    new = f"{date}-{n+1}"; s = re.sub(r'(window\.ASSET_VERSION\s*=\s*)"[^"]*"', rf'\g<1>"{new}"', s)
    open(p, "w", encoding="utf-8").write(s); return old, new
