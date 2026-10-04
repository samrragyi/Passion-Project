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
window.ASSET_VERSION = "2026-10-04-7";

window.LANGUAGES = [
  { code: "en", name: "English", gloss: "English", group: "United Kingdom", audio: true },
  { code: "hi", name: "हिन्दी", gloss: "Hindi", group: "India", audio: true },
  { code: "yue", name: "廣東話", gloss: "Cantonese", group: "China", audio: true },
  { code: "ko", name: "한국어", gloss: "Korean", group: "South Korea", audio: true },
  { code: "bn", name: "বাংলা", gloss: "Bengali", group: "India", audio: true },
  { code: "pa", name: "ਪੰਜਾਬੀ", gloss: "Punjabi", group: "India", audio: true }
];
