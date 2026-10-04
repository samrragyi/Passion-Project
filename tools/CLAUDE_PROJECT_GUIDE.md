# The Menopause Conversation: project guide for Claude

Read this first in every chat. Follow the routine in section 4. Keep replies short and practical.

## 1. What this is
A multilingual menopause symptom check-in. A woman answers 15 questions (4 smiley/colour answer buttons each, over the past month),
can have every question read aloud, and gets a one-page **English** summary to show her GP. Nothing is stored or sent anywhere (a promise:
never add anything that collects data). It is a static website on GitHub Pages: no server, no build step.
Each language = a text pack + a flag + 22 recordings. The owner adds languages over time, one per chat.

REPO_URL: https://github.com/samrragyi/Passion-Project        (public repo; GitHub Pages serves the site from it)

## 2. Getting the project at the start of a chat
```
git clone --depth 1 https://github.com/samrragyi/Passion-Project.git /home/claude/repo && cd /home/claude/repo && git log -1 --format=%cd
pip install openpyxl -q                       # usually already there
cd tools && npm install --silent && cd ..     # only before the browser test (about 10 seconds)
```
If the clone fails (private repo, network), ask the owner to upload the latest `menopause-conversation.zip`. Claude never pushes to GitHub:
Claude hands over a zip and the owner uploads it, so the owner stays in control.

## 3. Repo map
`index.html` (the app: rarely changed) | `languages.js` (language list + `ASSET_VERSION` cache version) | `lang/<code>.js` (text) |
`flags/<code>.svg` | `audio/<code>/` (intro, s1..s6, q01..q15 .mp3) | `icons/` (15 shared illustrations) | `tools/` (everything below) |
`README.md`. `tools/languages_registry.json` lists every planned language with code, name, voice tag, direction, flag and status.
Never put base64 audio inside the HTML (that design hit a 16 MB wall at three languages).

## 4. The routine for ONE new language (a fresh chat per language)
The owner's first message looks like: "New language: ko. Attached: filled template + audio zip." The registry already knows tag, direction and flag; don't ask.
1. Set up (section 2). Uploaded files are in `/mnt/user-data/uploads/`.
2. **Build:** `python3 tools/build_language.py --template <filled.xlsx> --audio <zip, or the uploads folder> --out /mnt/user-data/outputs`
   - It writes the pack, converts audio to MP3 mono 96 kbps, rejects files carrying another language's prefix, checks clip lengths against text,
     updates `languages.js` (and bumps `ASSET_VERSION`), runs the checker and makes `<code>-update.zip`.
   - ERROR means no package was made: fix it with the owner. Every WARN needs a decision or an explanation to the owner in plain words.
   - Text can come before audio (run without `--audio`; the tile then uses the phone's built-in voice). Run again when audio arrives.
3. **Test:** `node tools/browser_test.js <code> --shots /tmp/shots`. Look at at most two screenshots (page 2 and one question page);
   more only if something fails or it is a first (right-to-left, a new script). The test browser may lack fonts for some scripts: judge looks on a phone.
4. **Deliver:** present only `<code>-update.zip`, then give the owner the steps in section 6 and the list of warnings needing a human decision.
5. Corrections later: the owner sends the corrected spreadsheet; rerun step 2. Never hand-edit `lang/*.js`.
Not in the registry? Add an entry to `languages_registry.json`, run `python3 tools/fetch_flags.py`, then `python3 tools/make_template.py --code <code>`.
If the English text of the app ever changes: regenerate templates (`make_template.py --all`); the builder refuses a template whose English has drifted.

## 5. File names and audio (tell the owner and the recorder)
- Exactly `<code>_intro.mp3`, `<code>_s1.mp3` to `<code>_s6.mp3`, `<code>_q01.mp3` to `<code>_q15.mp3`: 22 files. The code prefix removes all doubt about which language a file is.
- `q01` is question 1: people count from 1, the code counts from 0, and the file names use the people numbers.
- intro = all of page 2 read in order (welcome, 3 steps, colour legend, notice); section = the section name only; question = its short title, then the question.
  The spreadsheet's Audio sheet shows the exact script, built from the translation.
- Export MP3, mono, 96 kbps. Sending a zip beats 22 separate uploads.

## 6. What the owner does with the zip (give these steps every time, adapted)
1. Unzip `<code>-update.zip`.
2. On the repo page on GitHub: **Add file, Upload files**; drag in the `audio`, `flags` and `lang` folders and `languages.js`. Commit with a note like "Add Korean". (The web uploader takes at most 100 files per batch; a language is about 25.)
3. Wait about two minutes, then close and reopen the site on a phone (phones cache).
4. Test on the phone: the tile (flag, native name, English name); the text; the page 2 speaker (should sound like a recording, not a robot); one question per section; the results page.
   **Listen to make sure each recording says the question shown on screen.** Claude cannot hear audio.
5. Report any problem with the question number; Claude fixes and sends one new zip.
6. A native speaker should read the medical wording; corrections come back as the corrected spreadsheet.

## 7. Rules and lessons (each one cost time once)
- The results page and the GP summary are English by design, in every language; `lang/en.js` must always exist and stay complete.
- A change is not done until it is in the delivered package AND passed the real-browser test. "Syntax OK" is not a test. (An edit once sat unpublished while the old text stayed live.)
- Files are checked by the code prefix and by length, not by guessing. The length check catches big mismatches (swapped long and short questions) but cannot catch a swap
  of two questions of similar length: only listening can. Say so to the owner.
- Uploads from earlier chats can linger with identical names: that is why a fresh chat per language and the prefix rule exist. If a file has no prefix, stop and ask.
- After tapping a language the app waits about 0.26 s before showing page 2. In tests, wait for `currentStep === 1`; never press Start early.
- Phones cache files: `build_language.py` bumps `ASSET_VERSION`; if anything is replaced by hand, bump it too.
- Language-specific CSS lives in `index.html`: Korean needs `word-break: keep-all` (already there under `:lang(ko)`). Japanese and Chinese wrap correctly by default.
  Urdu is traditionally written in Nastaliq; the default font is Naskh. Mention it, don't fix it unasked.
- Right-to-left (Persian, Urdu): set `dir` in the spreadsheet; the layout mirrors by itself. The English "PROTOTYPE" banner shows its full stop on the wrong side in RTL; cosmetic, vanishes when the banner is removed.
- Text the owner did not supply must not be invented silently: the spreadsheet covers every visible string, so blanks fall back to English with a WARN.
- **Build languages one at a time.** Each package replaces `languages.js` as a whole file, and a chat only knows the repo as it was when the chat started.
  So start a language's build chat only AFTER the previous language is committed to GitHub. Translators and recorders can work on many languages in parallel;
  only the build-and-upload step is one at a time. If two were built in parallel, merge by adding the missing language's line to `languages.js` by hand.
- Keep tool output short. Never print base64 or whole files. Re-use the scripts; do not rewrite them, and do not re-verify what they already check.

## 8. Open items (owner decisions: raise, don't fix unasked)
- The red "PROTOTYPE" banner is still on the page.
- The "Important Information & Privacy" box on the home page is English-only (it is in `index.html`, not in language packs).
- A footer disclaimer string exists in every pack but is never shown (the page reads it from the wrong place).
- Cantonese answer-button labels were written by us and need a native speaker's check; the Korean ones were reviewed via the spreadsheet only if the owner confirms.
- Q15 has two icon candidates; the bladder one is live, the other is `icons/q15-alt.webp`.
- Hong Kong flag (Cantonese) is a simplified drawing; the official artwork is available via `fetch_flags.py --force` if wanted.

## 9. Language registry (canonical file: `tools/languages_registry.json`)
Live: en, hi, yue (Cantonese), ko.
Planned (17): pa Punjabi (Gurmukhi, India flag) | bn Bengali (India flag) | bn-bd Bengali (Bangladesh flag: same text as bn, a second tile) | sq Albanian |
zh Mandarin (Simplified) | fr French | de German | ja Japanese | fa Persian (rtl, Iran flag) | pl Polish | pt-br Portuguese (Brazil) | pt Portuguese (Portugal) |
ro Romanian | es Spanish (Spain) | tl Tagalog (Philippines flag) | ur Urdu (rtl, Pakistan flag) | vi Vietnamese.
The owner has confirmed these choices (Simplified, Spain, Gurmukhi, Philippines flag, the Bangladesh tile): do not ask again.
Not yet translated on the home page: hi, yue and ko still show English for the home-page headline, subtitle, privacy badge and "Select your language"
(the newer template covers these). Offer a refresh only if the owner asks.
