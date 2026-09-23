# The Menopause Conversation — MVP (EN/HI)

## What's in this package

Just one file: **`index.html`**.

That's not an oversight — this app was built as a single self-contained HTML file on purpose (it's what Claude's artifact environment requires). Everything lives inside it:

- All CSS (inline `<style>` block)
- All JavaScript (inline `<script>` block)
- All 15 question icons (inline SVG)
- All 10 language flags (inline SVG)
- All recorded audio, English and Hindi (embedded as base64 `data:audio/mpeg;base64,...` strings)

There is no `style.css`, no `script.js`, no `/audio` folder, no `/icons` folder — they don't exist as separate files. Nothing to forget to upload.

## Current audio coverage (EN + HI, complete)

- **Questions:** all 15, both languages
- **Section headings:** all 6, both languages
- **Page 2 (instructions):** one combined "listen to the whole page" clip, both languages
- Anything not listed above (other 8 languages, on the master 10-language build) falls back to browser TTS automatically — no broken buttons, just a different voice.

## Deploying to GitHub Pages

1. Push this repo (or just `index.html`) to a GitHub repository.
2. In the repo's **Settings → Pages**, set the source to the branch/folder containing `index.html` (root, or `/docs` if you move it there).
3. GitHub Pages will serve `index.html` directly — no build step needed.

## A heads-up on file size, and why this architecture won't scale past a few languages

This file is now **~8.8 MB**, almost entirely audio (EN + HI complete). That's still fine for GitHub Pages and fine as a single commit. But the math is worth knowing:

- Each fully-audio'd language adds roughly **3.5 MB** to this file.
- Every future audio addition means re-committing this *entire* file, not just the new clip.
- Git diffs on this file are unreadable — a one-line base64 audio swap shows up as "entire file changed."
- **At this rate, a 3rd or 4th language pushes this file toward and past 16 MB** — which is a hard ceiling in the Claude prototyping environment this was built in, and just bad practice for a real site regardless (nobody should download 15+ MB of audio for languages they didn't select).

### Recommended next step before adding more languages

Move audio out of the HTML entirely: real files on disk (`audio/en/q1.mp3`, `audio/hi/q1.mp3`, etc.), loaded via normal `<audio src="...">` on demand, rather than base64-embedded. That keeps this HTML file small permanently (well under 1 MB) no matter how many languages get added — each new language is just a folder of `.mp3` files dropped in, with zero re-encoding or re-publishing of the whole app. This restructuring hasn't been done yet; flagging it now so it happens before, not after, the file becomes unmanageable.
