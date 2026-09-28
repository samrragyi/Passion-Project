# The Menopause Conversation — MVP (EN/HI/YUE)

## What's in this package

Just one file: **`index.html`**.

That's not an oversight — this app was built as a single self-contained HTML file on purpose (it's what Claude's artifact environment requires). Everything lives inside it:

- All CSS (inline `<style>` block)
- All JavaScript (inline `<script>` block)
- All 15 question icons (inline SVG)
- All 10 language flags (inline SVG, including a stylized Hong Kong flag for Cantonese)
- All recorded audio — English, Hindi, and Cantonese (embedded as base64 `data:audio/mpeg;base64,...` strings)

There is no `style.css`, no `script.js`, no `/audio` folder, no `/icons` folder — they don't exist as separate files. Nothing to forget to upload.

## Current audio coverage (EN + HI + YUE, all complete)

- **Questions:** all 15, all three languages
- **Section headings:** all 6, all three languages
- **Page 2 (instructions):** one combined "listen to the whole page" clip, all three languages
- Anything not listed above (the other 7 languages on the master 10-language build) falls back to browser TTS automatically — no broken buttons, just a different voice.
- Cantonese answer-button labels ("Not at all / A little / Quite a bit / Extremely") were derived, not directly supplied — worth a native-speaker check before this goes live.

## Deploying to GitHub Pages

1. Push this repo (or just `index.html`) to a GitHub repository.
2. In the repo's **Settings → Pages**, set the source to the branch/folder containing `index.html` (root, or `/docs` if you move it there).
3. GitHub Pages will serve `index.html` directly — no build step needed.

## A heads-up on file size — this is now urgent, not hypothetical

This file is **~13.1 MB**, almost entirely audio (EN + HI + YUE complete). Still fine for GitHub Pages and a single commit, but the headroom is gone:

- Each fully-audio'd language adds roughly **3.5 MB** to this file.
- **A 4th language on this same model will exceed the 16 MB ceiling** used in the Claude prototyping environment this was built in — and would be bad practice for a real site regardless of any ceiling (nobody should download 15+ MB of audio for languages they didn't select).
- Every audio addition so far has meant re-committing this *entire* file, and git diffs on it are unreadable — a one-line base64 swap shows up as "entire file changed."

### Before adding a 4th language: do the refactor

Move audio out of the HTML entirely — real files on disk (`audio/en/q1.mp3`, `audio/hi/q1.mp3`, `audio/yue/q1.mp3`, etc.), loaded via normal `<audio src="...">` on demand, rather than base64-embedded. That keeps this HTML file small permanently (well under 1 MB) no matter how many languages get added — each new language becomes a folder of `.mp3` files dropped in, with zero re-encoding or re-publishing of the whole app. This hasn't been done yet. It's the next thing to build, not a someday item.
