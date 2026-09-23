# The Menopause Conversation — MVP (EN/HI)

## What's in this package

Just one file: **`index.html`**.

That's not an oversight — this app was built as a single self-contained HTML file on purpose (it's what Claude's artifact environment requires). Everything lives inside it:

- All CSS (inline `<style>` block)
- All JavaScript (inline `<script>` block)
- All 15 question icons (inline SVG)
- All 10 language flags (inline SVG)
- All recorded Hindi audio clips (embedded as base64 `data:audio/mpeg;base64,...` strings)

There is no `style.css`, no `script.js`, no `/audio` folder, no `/icons` folder — they don't exist as separate files. Nothing to forget to upload.

## Deploying to GitHub Pages

1. Push this repo (or just `index.html`) to a GitHub repository.
2. In the repo's **Settings → Pages**, set the source to the branch/folder containing `index.html` (root, or `/docs` if you move it there).
3. GitHub Pages will serve `index.html` directly — no build step needed.

## A heads-up on file size

This file is currently **~3.6 MB**, almost entirely audio. That's fine for GitHub Pages (no practical limit for a static file this size) and fine as a single commit. But it's worth knowing before it grows further:

- Every future audio addition means re-committing this *entire* file, not just the new clip.
- Git diffs on this file are unreadable — a one-line base64 audio swap shows up as "entire file changed."
- If the full English set gets added too, expect this file to land somewhere around 7–8 MB.

None of that breaks anything today. It just means standard git tooling (diffs, blame, PR review) won't be very useful on this particular file — you're versioning it more like a binary than like code.
