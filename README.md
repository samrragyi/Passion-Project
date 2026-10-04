# The Menopause Conversation

A multilingual menopause symptom check-in. Static site: no build step, no server, no data collected.
Works on GitHub Pages and also by double-clicking `index.html` locally.

## What's in the repo

```
index.html          the app (code + layout, ~60 KB — you rarely touch this)
languages.js        the list of languages + ASSET_VERSION   <- edit when adding a language
lang/<code>.js      one text file per language (questions, steps, notice, buttons)
flags/<code>.svg    one flag per language
audio/<code>/       one folder of recordings per language
icons/q01..q15.webp the 15 question illustrations (same for every language)
tools/CLAUDE_PROJECT_GUIDE.md   the routine + rules for working on this project with Claude
tools/languages_registry.json  every planned language: code, name, voice tag, direction, flag, status
tools/make_template.py         builds the translator spreadsheet (one per language)
tools/build_language.py        filled spreadsheet + audio  ->  the exact files to upload (dist/<code>-update.zip)
tools/browser_test.js          real-browser test of one language (needs `npm install` in tools/)
tools/check_languages.py       pre-publish checker (languages + icons)
tools/fetch_flags.py           makes flags/<code>.svg from the free flag-icons collection
tools/make_icons.py            rebuilds icons/ from the original artwork
tools/lang_schema.py           what a translator fills in, and where it goes (shared by the tools)
```

Only the language the visitor picks is downloaded, and audio files are fetched only when
they tap a Listen button. Adding languages does **not** make the app heavier for anyone.

## Adding a language: the fast way (recommended)

1. **Spreadsheet.** `python3 tools/make_template.py --code fr` makes `fr_French_template.xlsx` with the English filled in
   and the settings (code, voice tag, direction, flag) pre-filled from `tools/languages_registry.json`.
   (A language not in the registry: add it there first.) The translator fills the yellow cells; the same file lists the
   22 recordings to make, with the exact file names and the exact script to read.
2. **Recordings.** Named with the language code in front: `fr_intro.mp3`, `fr_s1.mp3` ... `fr_s6.mp3`, `fr_q01.mp3` ... `fr_q15.mp3`.
   MP3, mono, 96 kbps (the tool converts anything else). Zip them as `fr_audio.zip`.
3. **Build.** `python3 tools/build_language.py --template fr_template.xlsx --audio fr_audio.zip`
   writes `lang/fr.js`, prepares `audio/fr/`, adds the language to `languages.js`, bumps `ASSET_VERSION`,
   runs the checker and produces **`dist/fr-update.zip`**: exactly the files to upload. It stops, and makes no package,
   if anything is wrong. Audio can come later: run it again when more recordings arrive.
4. **Test.** `cd tools && npm install` (once), then `node tools/browser_test.js fr`. It plays the language in a real
   headless browser at phone size and checks text, every recording, layout and the results page.
5. **Upload** the contents of `dist/fr-update.zip` to GitHub (Add file -> Upload files), commit, wait two minutes, test on a phone.

Needs: Python 3 with `pip install openpyxl`, `ffmpeg`, and Node.js for the browser test.

## Adding a language by hand (the manual way, about 10 minutes)

Use a short code, e.g. `fr`, `ar`, `pa`, or `yue` for Cantonese.

1. **Text** — copy `lang/en.js` to `lang/<code>.js` and translate the values (not the keys).
   Set `"code"`, `"name"` (the language's own name), `"gloss"` (English name), `"tag"`
   (e.g. `fr-FR`, used for the fallback voice) and `"dir"` (`"rtl"` for Arabic/Urdu/Hebrew, otherwise `"ltr"`).
   Everything must be a complete list: 15 questions, 6 sections, 4 answer labels (`scale`),
   3 steps (`howItWorks`), 4 legend rows (`severityLegend`).
   Keep it valid: straight quotes `"`, commas between items, none after the last item.
2. **Flag** — save as `flags/<code>.svg`.
3. **Audio (optional)** — put recordings in `audio/<code>/` with exactly these names:

   | File | Content |
   |---|---|
   | `intro.mp3` | whole of page 2 (welcome, steps, colour legend, notice) |
   | `s1.mp3` … `s6.mp3` | the six section headings |
   | `q01.mp3` … `q15.mp3` | the fifteen questions (title + question) |

   96 kbps mono MP3 is plenty (≈ 3 MB per language). Any clip that is missing falls back to
   the browser's text-to-speech, so you can add audio gradually.
4. **Register it** — add one line to `languages.js`:
   `{ code: "fr", name: "Français", gloss: "French", audio: true },`
   (use `audio: false` if you have no recordings yet). Tiles on the home screen sort themselves A–Z by `gloss`.
5. **Check** — run `python3 tools/check_languages.py`. It lists anything missing or malformed.
6. **Publish** — commit, push. Bump `ASSET_VERSION` in `languages.js` if you *replaced* an existing file
   (otherwise phones may keep showing the cached old one).

## Replacing a recording or fixing text

Overwrite the file with the same name, bump `ASSET_VERSION`, push.

## Question icons

Each question shows an illustration (`icons/q01.webp` … `q15.webp`, in question order). They are the same in
every language, so adding a language never involves icons.

The originals you supplied are 2000 × 2000 px and about 5 MB each (75 MB in total), which is far too heavy for a
phone. `tools/make_icons.py` turns them into 256 px WebP files of 10–20 KB each, and also makes the area outside each
frame transparent so the icons sit cleanly on the page. The originals are **not** stored in the repo.

**To change an icon:** put the new original (any size, PNG) in a folder, update its file name in `SOURCES` at the top of
`tools/make_icons.py` if it changed, then run

```
pip install pillow numpy scipy
python3 tools/make_icons.py  /path/to/folder/with/the/originals
```

and bump `ASSET_VERSION` in `languages.js`. The checker will refuse an icon that is not a WebP or is suspiciously large,
so an un-shrunk original can't slip in by accident.

**Question 15 has two candidate icons.** The icon guide listed both with "OR", so I picked the bladder-and-toilet-door
one (`q15.webp`): it stays readable at small size and can't be mistaken for a stomach ache. The other (woman holding
her belly) is saved as `icons/q15-alt.webp`. To switch, rename `q15.webp` to something else and `q15-alt.webp` to `q15.webp`
(or point `SOURCES["q15"]` at the other file and re-run the script), then bump `ASSET_VERSION`.

To make the icons bigger or smaller, change `72px` in the `.q-icon` rule in `index.html` (it shrinks to 60 px on very
narrow phones).

## Things to know

- The results page and clinician summary are **always English**, whatever language the patient used,
  so `lang/en.js` must always exist and stay complete.
- The Hindi and Cantonese packs still contain English text for the results-page labels
  (only English is shown there, so this has no effect).
- Cantonese answer-button labels (完全冇 / 有少少 / 幾嚴重 / 非常嚴重) were written by us, not supplied
  by the translator: get a native speaker to confirm.
- The `disclaimer` footer text exists in every language pack but is not currently displayed
  (the page reads it from the wrong place). Decide whether you want it shown before enabling it.

## Repo size

About 3 MB of audio per fully-recorded language, so 25 more languages ≈ 80 MB. The icons add about 0.25 MB once.
That is well inside GitHub's limits. Each commit only stores the files that changed.
