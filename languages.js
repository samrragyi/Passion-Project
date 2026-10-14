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
window.ASSET_VERSION = "2026-10-14-1";

window.LANGUAGES = [
  { code: "en", name: "English", gloss: "English", group: "United Kingdom", audio: true },
  { code: "hi", name: "हिन्दी", gloss: "Hindi", group: "India", audio: true },
  { code: "yue", name: "廣東話", gloss: "Cantonese", group: "China", audio: true },
  { code: "ko", name: "한국어", gloss: "Korean", group: "South Korea", audio: true },
  { code: "bn", name: "বাংলা", gloss: "Bengali", group: "India", audio: true },
  { code: "pa", name: "ਪੰਜਾਬੀ", gloss: "Punjabi", group: "India", audio: true },
  { code: "zh", name: "中文（普通话）", gloss: "Mandarin Chinese", group: "China", audio: true },
  { code: "fr", name: "Français", gloss: "French", group: "France", audio: true },
  { code: "de", name: "Deutsch", gloss: "German", group: "Germany", audio: true },
  { code: "es", name: "Español", gloss: "Spanish", group: "Spain", audio: true },
  { code: "pl", name: "Polski", gloss: "Polish", group: "Poland", audio: true },
  { code: "vi", name: "Tiếng Việt", gloss: "Vietnamese", group: "Vietnam", audio: true },
  { code: "tl", name: "Tagalog", gloss: "Tagalog", group: "Philippines", audio: true },
  { code: "sq", name: "Shqip", gloss: "Albanian", group: "Albania", audio: true },
  { code: "hak", name: "客家話", gloss: "Hakka", group: "China", audio: true },
  { code: "nan-cz", name: "潮州話", gloss: "Chaozhou (Teochew)", group: "China", audio: true },
  { code: "ja", name: "日本語", gloss: "Japanese", group: "Japan", audio: true },
  { code: "ro", name: "Română", gloss: "Romanian", group: "Romania", audio: true },
  { code: "yue-wt", name: "圍頭話", gloss: "Weitou (Waitau)", group: "China", audio: true },
  { code: "fa", name: "فارسی", gloss: "Persian", group: "Iran", audio: true },
  { code: "ne", name: "नेपाली", gloss: "Nepali", group: "Nepal", audio: true },
  { code: "bn-bd", name: "বাংলা (বাংলাদেশ)", gloss: "Bengali (Bangladesh)", group: "Bangladesh", audio: true },
  { code: "ur", name: "اردو", gloss: "Urdu", group: "Pakistan", audio: true },
  { code: "pt-br", name: "Português (Brasil)", gloss: "Portuguese (Brazil)", group: "Brazil", audio: true },
  { code: "ar-gulf", name: "العربية الخليجية", gloss: "Khaleeji Arabic", group: "United Arab Emirates", audio: true }
];
