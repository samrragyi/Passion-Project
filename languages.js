/* ============================================================
   LANGUAGE MANIFEST — the only file you edit to add a language
   (besides dropping in its files). See README.md.

   code   : short code; must match lang/<code>.js, flags/<code>.svg, audio/<code>/
   name   : the language's own name, in its own script (shown big on the tile)
   gloss  : English name (shown small on the tile; tiles are sorted A-Z by this)
   audio  : true  = recorded clips exist in audio/<code>/
            false = no recordings yet, the browser's text-to-speech is used

   Bump ASSET_VERSION whenever you replace an existing clip or text file, so
   phones that cached the old one fetch the new one.
   ============================================================ */
window.ASSET_VERSION = "2026-10-04-3";

window.LANGUAGES = [
  { code: "en",  name: "English", gloss: "English",   audio: true },
  { code: "hi",  name: "हिन्दी",    gloss: "Hindi",     audio: true },
  { code: "yue", name: "廣東話",     gloss: "Cantonese", audio: true },
  { code: "ko",  name: "한국어",      gloss: "Korean",    audio: true }
];
