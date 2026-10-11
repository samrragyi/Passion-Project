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
`README.md`. `tools/languages_registry.json` lists every planned language with code, name, voice tag, direction, flag and status. `tools/common_strings.json` is the master list of standard wording (see section 4a).
Never put base64 audio inside the HTML (that design hit a 16 MB wall at three languages).

## 4. The routine for ONE new language (a fresh chat per language)
The owner's first message looks like: "New language: ko. Attached: filled template + audio (0001-0022.mp3, or a zip of them)." The registry already knows tag, direction and flag; don't ask.
1. Set up (section 2). Uploaded files are in `/mnt/user-data/uploads/`.
2. **Stage the audio** (recordings come from Narakeet as `0001.mp3`..`0022.mp3`, see section 5; unzip first if sent as a zip):
   `python3 tools/stage_numbered_audio.py --code <code> --src /mnt/user-data/uploads --dest /tmp/audio_<code>`
   It stops unless exactly 0001-0022 are present (no gaps, extras or duplicates) and copies them to `<code>_intro / _s1.._s6 / _q01.._q15.mp3`. Originals untouched.
   Audio that already carries the `<code>_` prefix skips this step.
   **Build:** `python3 tools/build_language.py --template <filled.xlsx> --audio /tmp/audio_<code> --out /mnt/user-data/outputs`
   - It writes the pack, converts audio to MP3 mono 96 kbps, rejects files carrying another language's prefix, checks clip lengths against text,
     updates `languages.js` (and bumps `ASSET_VERSION`), runs the checker and makes `<code>-update.zip`.
   - ERROR means no package was made: fix it with the owner. Every WARN needs a decision or an explanation to the owner in plain words.
   - Text can come before audio (run without `--audio`; the tile then uses the phone's built-in voice). Run again when audio arrives.
3. **Test:** `node tools/browser_test.js <code> --shots /tmp/shots` and, after any change to the results page or its print CSS, `node tools/print_test.js <code>` (the summary must print on ONE page, A4 and Letter). Look at at most two screenshots (page 2 and one question page);
   more only if something fails or it is a first (right-to-left, a new script). The test browser may lack fonts for some scripts: judge looks on a phone.
4. **Deliver:** present only `<code>-update.zip`, then give the owner the steps in section 6 and the list of warnings needing a human decision.
5. Corrections later: the owner sends the corrected spreadsheet; rerun step 2. Never hand-edit `lang/*.js`.
Not in the registry? Add an entry to `languages_registry.json` (including its `group`, see section 7), run `python3 tools/fetch_flags.py`, then `python3 tools/make_template.py --code <code>`.
If the English text of the app ever changes: regenerate templates (`make_template.py --all`); the builder refuses a template whose English has drifted.

## 4a. Standard wording (the 20 "common" fields)
20 fields are the same kind of text in every language: consentLabel, the 4 buttons (start/back/next/finish), the 4 answer labels (scale1-4), questionCounter, sectionPrefix, listen/pause labels, print/restart buttons, and the home page (appTitle, appSubtitle, privacyBadge, languagePageTitle, homeLabel).
`tools/common_strings.json` holds a wording for each of them in every language we plan (hi, yue, ko = what a translator supplied; every other language = a DRAFT written by Claude, not native-reviewed).
- **Templates** (`make_template.py --code X`) come with these 20 pre-filled: BLUE = draft, PINK = draft that a native speaker MUST check (consentLabel, privacyBadge, scale1-4: consent / privacy / how bad a symptom is), plain yellow = supplied earlier. A Status column says which. Translators read and fix instead of translating from scratch.
- **Builder:** a blank cell, or a cell left as the pre-filled draft, uses the master wording and produces ONE warning listing them, naming the meaning-critical ones and whether a reviewer is named in Settings. Relay that warning to the owner every time. A cell the translator changed always wins.
- **Fixing one language after review:** the owner sends the corrected spreadsheet as usual (step 5); no master edit needed. Fixing a draft for everyone: edit `common_strings.json`, then rerun `make_template.py --all`. Live packs only get master text where a field is missing or still English: `python3 tools/apply_common.py` (never overwrites translator text; bumps ASSET_VERSION; hand over the changed `lang/*.js` plus `languages.js` as a zip).
- bn-bd shares bn's wording in the master.

## 5. File names and audio (tell the owner and the recorder)
Recordings come from Narakeet and are numbered `0001.mp3` to `0022.mp3`. The numbering is FIXED, the same for every language, and matches column A of the spreadsheet's Audio sheet (older templates have no numbers there: the owner may have typed them in column D):
- `0001` = intro (all of page 2 read in order: welcome, 3 steps, colour legend, notice)
- `0002` to `0007` = section names s1 to s6 (the section name only)
- `0008` to `0022` = questions q01 to q15 (short title, then the question). So question N is file `N + 7`, zero-padded: q01 = 0008, q15 = 0022.
The Audio sheet shows the exact script for each, built from the translation. The stager (section 4, step 2) renames them to `<code>_intro`, `<code>_s1`..`_s6`, `<code>_q01`..`_q15` for the builder.
- Export MP3, mono, 96 kbps. Send all 22 together (a zip is easiest). The stager refuses partial sets: if audio arrives in batches, wait for all 22, or build text-only meanwhile.
- Numbered files carry no language name, so a stale `0001.mp3` from another chat would look valid. Defence: one fresh chat per language, and the stager's exact-22 check. If the count or numbers look wrong, stop and ask.

## 6. What the owner does with the zip (give these steps every time, adapted)
1. Unzip `<code>-update.zip`.
2. On the repo page on GitHub: **Add file, Upload files**; open the unzipped folder and drag in what is INSIDE it, never the folder itself (once a whole `site-update-all` folder was uploaded by mistake and left a public duplicate of the site that had to be deleted by hand; the web uploader can add and overwrite files but never delete). Drag in the `audio`, `flags` and `lang` folders and `languages.js`. Commit with a note like "Add Korean". (The web uploader takes at most 100 files per batch; a language is about 25.)
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
- Uploads from earlier chats can linger with identical names: that is why a fresh chat per language, the prefix rule (for named files) and the exact 0001-0022 rule (for numbered files) exist. Any other unprefixed, unnumbered audio: stop and ask.
- After tapping a language the app waits about 0.26 s before showing page 2. In tests, wait for `currentStep === 1`; never press Start early.
- Phones cache files: `build_language.py` bumps `ASSET_VERSION`; if anything is replaced by hand, bump it too.
- Language-specific CSS lives in `index.html`: Korean needs `word-break: keep-all` (already there under `:lang(ko)`). Japanese and Chinese wrap correctly by default.
  Urdu is traditionally written in Nastaliq; the default font is Naskh. Mention it, don't fix it unasked.
- Right-to-left (Persian, Urdu): set `dir` in the spreadsheet; the layout mirrors by itself. The English "PROTOTYPE" banner shows its full stop on the wrong side in RTL; cosmetic, vanishes when the banner is removed.
- Text the owner did not supply must not be invented silently: the spreadsheet covers every visible string, so blanks fall back to English with a WARN.
- **Build languages one at a time.** Each package replaces `languages.js` as a whole file, and a chat only knows the repo as it was when the chat started.
  So start a language's build chat only AFTER the previous language is committed to GitHub. Translators and recorders can work on many languages in parallel;
  only the build-and-upload step is one at a time. If two were built in parallel, merge by adding the missing language's line to `languages.js` by hand.
- **Home-page tile order:** English is pinned first (code `en`, hard-coded in the sort in `index.html`); after it, tiles are grouped by country A-Z, then by English name A-Z inside a country (all of India's languages together; China: Cantonese, then Mandarin). The country is the `group` field of each language in `languages_registry.json`; the builder copies it into `languages.js` (`{ code, name, gloss, group, audio }`) and warns if it is missing (the tile then sorts by its English name alone). Every new registry entry needs a `group`. The home page is a GRID of country blocks (`.lang-group`, built in `buildLanguagePicker`): CSS columns (2 on a phone, 3 from 560px, 1 under 360px) with `break-inside:avoid`, so a country's languages always stay together (India's three, China's two) and read down the first column, then the next. A plain two-column grid was rejected earlier because it split groups across rows; a single-column list was used before this grid. Groups are only used for ordering and keeping blocks together; their names are not shown. Bengali (Bangladesh) is its own group (Bangladesh), apart from India's Bengali.
- Standard wording is a draft until a native speaker has seen it. Never describe it to the owner as translated or reviewed. The consent tick-box and privacy badge are the two to push for review.
- The browser test's home-page check is wiring only (the page reads the pack); it cannot tell a translation from an English fallback. The builder's "identical to English" warning does that.
- **Results-page notice strings** (`ui.finalNotice*`, e.g. the data-confidentiality note) are NOT in the translator template. New languages inherit them in English from `lang/en.js`; hi has its own translation. To change that wording, edit `en.js`, then every live pack with an exact-text replace that asserts the match (one line each), then bump `ASSET_VERSION`. When removing a word, search every script too (hi had it as "जीडीपीआर"; a search for the English word misses it).
- **Answer faces** (`faceSVG` in `index.html`) are our own line drawings: smile, neutral, mild frown, deeper frown, with worried (not angry) brows. Do not swap in the Wong-Baker FACES or FPS-R faces (licensed, pain-only, may not be altered or coloured), and Google's Material "very dissatisfied" face has X eyes (wrong for a symptom scale). Needs a native speaker's or patient's glance: the faces carry meaning in every language.
- **The printed summary fits ONE page** (A4 and US Letter): `@media print` in `index.html` uses a compact layout (12px root, tight padding, the long "Show the section below to your doctor" intro hidden). `tools/print_test.js` checks it with worst-case answers in every language. Headroom on Letter is only about 20px, so if the results page gets longer, recheck it.
- **Printing / PDF:** the results page is printed with the browser's own print (`window.print()`), and browsers drop all background colours by default. `@media print` therefore sets `print-color-adjust: exact` on everything (keep it); the paper stays white. To test, drive the page to the results screen, then `page.pdf({ printBackground: false })` and rasterize with `pdftoppm`: that is what a normal user's Save-as-PDF does.
- **Rewording English on a translator-facing field** (anything in `lang_schema.FIELDS`) makes every already-issued template fail the builder's English-drift check. Add the OLD wording to `LEGACY_ENGLISH` in `lang_schema.py`: the build is then accepted with a WARN to check the translator's text. (Done for `how3`: it used to say "GP"; the app now says "doctor", not "GP" or "NHS", anywhere.)
- **Long words:** `.q-title` and `.q-section-name` have `overflow-wrap:break-word; hyphens:auto` (needs the page `lang`, which the app sets from the pack tag). German compounds such as "Stimmungsschwankungen" once pushed the audio button off a 320px screen. The browser test's 320px overflow check catches this: run it for every new language.
- **Audio buttons** (`.voice-icon-btn`) are white with a blue outline and blue icon (#4A7BA6; no answer uses blue, a green button read as "Not at all"; berry while playing), no word on the button itself. They are deliberately quiet so the four answer colours stay the loudest thing on screen. The section button shares the right edge with the question buttons (`.q-section-row` space-between). Only the Page 2 intro button and question 1's button pulse (the halo breathes, an inner ring glows) and show a one-time dark bubble ABOVE the button with the word "Listen" from the pack's `ui.listenLabel` (so it is in her language, no new translation); both stop for good once she taps any audio button (`voiceDiscovered`, memory only). Page 2 has extra top space (`.intro-with-voice`) so the bubble clears the sticky header. `prefers-reduced-motion` turns the pulse off. Owner feedback: the pale button was not recognised as audio, dark green was heavy, and solid blue with halos was too loud.
- **Main buttons** (`.btn`: Begin, Next, Finish, Print) use `--btn` #5C7A59, a lighter muted version of the site green (white text 4.8:1), hover `--btn-dim` #4D6A4A; disabled = the same colour at 40% opacity. The dark `--forest` is kept for titles and text. Owner approved (option B of five).
- **Long words / unbreakable strings:** `.q-title`, `.q-section-name` and `.intro-body` may break mid-word (`overflow-wrap:break-word`, `min-width:0`). A translator's glued punctuation once pushed Tagalog's intro 25px off a 320px screen; the browser test's 320px check catches it: run it for every new language.
- **Language codes** must match `^[a-z]{2,3}(-[a-z]{2,4})?$` (e.g. `fr`, `pt-br`, `yue-wt`); the builder refuses longer ones.
- **Translators' Word files vary a lot** (English beside or after the text, numbered or not, legends as one paragraph or four, titles and questions on separate lines). Some text hides in content controls or tracked changes that `python-docx`'s `paragraph.text` skips (the Japanese file): read every `w:t` descendant of the body instead, and scan for `w:ins`/`w:sdt` before trusting a parse. Check a parser against languages already built by hand.
- **Dialects with no text-to-speech voice** (Hakka `hak`, Weitou `yue-wt`, Chaozhou `nan-cz`) need audio read aloud by a speaker. Their 20 standard strings are written-Chinese drafts (Weitou: the Cantonese wording), not dialect wording: have a speaker check them.
- Keep tool output short. Never print base64 or whole files. Re-use the scripts; do not rewrite them, and do not re-verify what they already check.

## 8. Open items (owner decisions: raise, don't fix unasked)
- The red "PROTOTYPE" banner is still on the page.
- The "Important Information & Privacy" box on the home page is English-only (it is in `index.html`, not in language packs).
- A footer disclaimer string exists in every pack but is never shown (the page reads it from the wrong place).
- Cantonese answer-button labels were written by us and need a native speaker's check; the Korean ones were reviewed via the spreadsheet only if the owner confirms.
- Q15 has two icon candidates; the bladder one is live, the other is `icons/q15-alt.webp`.
- Standard wording drafts (section 4a) are live in bn, pa, yue and ko (gaps only) without native review. Ask the owner to get consentLabel, privacyBadge and the 4 answer labels (scale1-4) checked per language. Cantonese answer labels (scale) were written by us, not by a translator.
- Bengali (bn): no native review recorded; check the intro's wording for "menopause" and the section 6 title.
- bn-bd (Bangladesh-flag tile) has no tested build procedure yet. Untested idea: reuse the bn spreadsheet and the same 22 recordings with code bn-bd (about 3 MB duplicate audio). Raise it with the owner, don't improvise.
- Build status: 13 languages were added from translators' Word files (Albanian, Japanese, Tagalog, Vietnamese, Romanian, Hakka, Chaozhou are live). Weitou (yue-wt) is live with the China flag (confirmed by the owner); its audio was recorded by a speaker and long pauses were capped at 0.7 s; the clips for questions 7 and 13 arrived swapped (`q07` held the sleep question and `q13` the exhaustion one): the owner confirmed it and they were swapped before building (length-vs-text score 0.32 -> 0.59; a later simulation showed no sign of any further swap). Dialect recordings are the likeliest to arrive mislabelled, so ask the speaker/owner to confirm any pair the builder's order warning points at. Still to build: bn-bd, fa, ne, ur, pt-br; no `pt` (Portugal) file has arrived. Open per language: Romanian question 4's title had two alternatives with an English "or"; the owner chose to keep both in proper Romanian: "Stări de nervozitate sau iritabilitate și dureri de cap". The clip `06_Chapter_4` was recorded saying "or" (English) in the title: harmless, but to make audio match, re-record it from `Stări de nervozitate sau iritabilitate și dureri de cap. Cât de neplăcute sunt furnicăturile fără motiv pe piele („ace pe piele”), durerile noi de cap, migrenele hormonale sau amețelile?` and rebuild with that one clip; Urdu's six section headings are missing from its document; the "Portuguese (Brazil)" file reads mostly as European Portuguese (secção, ligeiro, vaga de calor); Tagalog's legend labels mix English and Tagalog; Persian's intro has two spellings of "small"; Nepali's intro uses the English word "step"; Chaozhou's flag/country (China) is provisional. Hakka, Chaozhou and Weitou have no text-to-speech voice: speakers record them; their 20 standard strings are written-Chinese drafts. All new languages' 20 standard strings are still unreviewed drafts.
- Hong Kong flag (Cantonese) is a simplified drawing; the official artwork is available via `fetch_flags.py --force` if wanted.

## 9. Language registry (canonical file: `tools/languages_registry.json`)
Live: en, hi (Hindi), yue (Cantonese), ko (Korean), bn (Bengali), pa (Punjabi), zh (Mandarin Chinese), fr (French), de (German), es (Spanish), pl (Polish), vi (Vietnamese), tl (Tagalog), sq (Albanian), hak (Hakka), nan-cz (Chaozhou (Teochew)), ja (Japanese), ro (Romanian), yue-wt (Weitou (Waitau)).
Truth check: what is live is whatever `languages.js` in the cloned repo lists; if this section and `languages.js` disagree, trust `languages.js` and tell the owner.
Planned (6): bn-bd Bengali (Bangladesh flag: own translation, a second tile) | fa Persian (rtl, Iran flag) | pt-br Portuguese (Brazil: the file reads as European Portuguese, decide) | pt Portuguese (Portugal: no file yet) | ur Urdu (rtl, Pakistan flag: section headings missing) | ne Nepali (Nepal flag).
The owner has confirmed these choices (Simplified, Spain, Gurmukhi, Philippines flag, the Bangladesh tile): do not ask again.
