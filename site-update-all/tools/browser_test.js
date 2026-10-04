#!/usr/bin/env node
/*
 Real-browser test of ONE language, as a phone-sized visitor would use it.

   cd tools && npm install            (once per chat/computer; downloads a headless Chromium)
   node tools/browser_test.js ko      [--root /path/to/repo] [--shots /path/for/pngs]

 Checks: home tile + flag, the language loads (text, direction, tag), page 2, every section heading and
 question vs the pack, every recording (right file, loads, decodes to its true length) or the text-to-speech
 fallback when a clip is not there, no sideways overflow at 390px and 320px, right-to-left layout, the
 results page; saves screenshots. Exit code 1 if anything fails.
*/
const path = require('path'), fs = require('fs'), { execSync } = require('child_process');
const chromium = require('@sparticuz/chromium').default || require('@sparticuz/chromium');
const puppeteer = require('puppeteer-core');

const args = process.argv.slice(2);
const code = args.find(a => !a.startsWith('--'));
const opt = n => { const i = args.indexOf('--' + n); return i >= 0 ? args[i + 1] : null; };
if (!code) { console.error('usage: node tools/browser_test.js <code> [--root DIR] [--shots DIR]'); process.exit(2); }
const ROOT = path.resolve(opt('root') || path.join(__dirname, '..'));
const SHOTS = path.resolve(opt('shots') || path.join(ROOT, 'dist', 'shots'));
fs.mkdirSync(SHOTS, { recursive: true });

const wait = ms => new Promise(r => setTimeout(r, ms));
let pass = 0, fail = 0;
const ok = (c, m) => { console.log((c ? 'PASS  ' : 'FAIL  ') + m); c ? pass++ : fail++; };
const dur = f => parseFloat(execSync(`ffprobe -v error -show_entries format=duration -of default=nw=1:nk=1 "${f}"`).toString());
const SEC = [[0, 1], [2, 3], [4, 5, 6], [7, 8, 9], [10, 11, 12], [13, 14]];

(async () => {
  const browser = await puppeteer.launch({ args: chromium.args.concat(['--allow-file-access-from-files', '--autoplay-policy=no-user-gesture-required']), executablePath: await chromium.executablePath(), headless: 'shell' });

  async function open(width, withAudioSpies) {
    const p = await browser.newPage(); await p.setViewport({ width, height: 900, deviceScaleFactor: 2 });
    p.__failed = []; p.on('requestfailed', r => p.__failed.push(r.url()));
    await p.evaluateOnNewDocument(() => {
      window.__spoken = []; window.__audios = [];
      if (window.speechSynthesis) window.speechSynthesis.speak = u => window.__spoken.push(u.text);
      const A = window.Audio; window.Audio = function (u) { const a = new A(u); a.muted = true; window.__audios.push(a); return a; };
    });
    await p.goto('file://' + ROOT + '/index.html', { waitUntil: 'load' }); await wait(700);
    return p;
  }
  const choose = async (p) => {
    await p.evaluate(c => { const l = window.LANGUAGES.find(x => x.code === c); [...document.querySelectorAll('.lang-card')].find(k => k.querySelector('.lang-native').textContent === l.name && k.querySelector('.lang-gloss').textContent === l.gloss).click(); }, code);
    await p.waitForFunction(() => currentStep === 1, { timeout: 20000 }); await wait(500);
  };
  const overflow = p => p.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);

  // ------------------------------------------------------------ home page
  let p = await open(390);
  const meta = await p.evaluate(c => window.LANGUAGES.find(x => x.code === c) || null, code);
  ok(!!meta, `'${code}' is listed in languages.js`); if (!meta) { await browser.close(); process.exit(1); }
  const tiles = await p.evaluate(() => [...document.querySelectorAll('.lang-card')].map(c => ({ n: c.querySelector('.lang-native').textContent, g: c.querySelector('.lang-gloss').textContent, ok: c.querySelector('img').naturalWidth > 0 })));
  const mine = tiles.find(t => t.g === meta.gloss && t.n === meta.name);
  ok(!!mine && mine.ok, `home tile shows "${meta.name}" / "${meta.gloss}" with its flag loaded`);
  ok(tiles.length === (await p.evaluate(() => window.LANGUAGES.length)) && tiles.every(t => t.ok), `all ${tiles.length} tiles have working flags`);
  const expectOrder = await p.evaluate(() => window.LANGUAGES.slice().sort((a, b) => (a.group || a.gloss).localeCompare(b.group || b.gloss, 'en') || a.gloss.localeCompare(b.gloss, 'en')).map(l => l.gloss));
  ok(JSON.stringify(tiles.map(t => t.g)) === JSON.stringify(expectOrder), 'tiles are ordered by country A-Z, then by English name A-Z inside each country');
  await p.screenshot({ path: `${SHOTS}/${code}_1_home.png` });

  // ------------------------------------------------------------ language loads, page 2
  await choose(p);
  const pk = await p.evaluate(c => JSON.parse(JSON.stringify(T[c])), code);
  const page2 = await p.evaluate(() => ({ lang: document.documentElement.lang, dir: document.documentElement.dir, steps: [...document.querySelectorAll('#howItWorksList li')].map(l => l.textContent), legend: document.querySelectorAll('#severityLegend .legend-row').length, head: document.getElementById('disclaimerHeading').textContent, notice: document.getElementById('formalDisclaimerText').textContent, consent: document.getElementById('consentLabelText').textContent, intro: document.getElementById('introBodyText').textContent, startDisabled: document.getElementById('instrContinueBtn').disabled, start: document.getElementById('instrContinueBtn').textContent }));
  ok(page2.lang === pk.tag && page2.dir === pk.dir, `page lang="${page2.lang}" dir="${page2.dir}" match the pack`);
  ok(page2.intro === pk.ui.introBody && page2.steps.join('|') === pk.howItWorks.join('|') && page2.legend === 4 && page2.head === pk.ui.beforeYouBegin && page2.notice === pk.ui.formalDisclaimer && page2.consent === pk.ui.consentLabel, 'page 2 shows the pack text (intro, 3 steps, 4 legend rows, notice, checkbox)');
  ok(page2.startDisabled && page2.start === pk.ui.startButton, 'Start button is locked until the checkbox is ticked');
  const homeTxt = await p.evaluate(() => { const g = k => (document.querySelector(`[data-i18n="${k}"]`) || {}).textContent; return { appTitle: g('appTitle'), appSubtitle: g('appSubtitle'), privacyBadge: g('privacyBadge'), languagePageTitle: g('languagePageTitle') }; });
  const homeBad = Object.keys(homeTxt).filter(k => homeTxt[k] !== pk.ui[k]);
  ok(homeBad.length === 0, 'home-page headline, subtitle, privacy badge and language prompt are read from the pack (wiring only: untranslated text is caught by the builder identical-to-English warning)' + (homeBad.length ? ': ' + homeBad.join(', ') : ''));
  await wait(600); await p.screenshot({ path: `${SHOTS}/${code}_2_page2.png`, fullPage: true });
  const o2 = [['page 2', await overflow(p)]];

  // helper: press a voice button, then verify what happened
  const voice = async (selector, slot, textStart) => {
    await p.evaluate(() => { window.__audios.length = 0; window.__spoken.length = 0; });
    p.__failed.length = 0;
    await p.evaluate(s => document.querySelector(s).click(), selector); await wait(900);
    const r = await p.evaluate(() => ({ a: window.__audios[0] ? { src: window.__audios[0].src.split('/').pop().split('?')[0], d: window.__audios[0].duration, e: !!window.__audios[0].error } : null, spoken: window.__spoken.slice() }));
    const file = path.join(ROOT, 'audio', code, slot + '.mp3'); const exists = fs.existsSync(file);
    if (meta.audio && exists) {
      const good = r.a && !r.a.e && r.a.src === slot + '.mp3' && Math.abs(r.a.d - dur(file)) < 0.3 && r.spoken.length === 0;
      return { good, how: 'recording', detail: JSON.stringify(r) };
    }
    const good = r.spoken.length === 1 && r.spoken[0].startsWith(textStart.slice(0, 6)); // falls back to the phone's voice
    return { good, how: 'text-to-speech fallback', detail: JSON.stringify(r) };
  };
  const results = { rec: 0, tts: 0, bad: [] };
  const tally = (name, v) => { if (!v.good) results.bad.push(`${name}: ${v.detail}`); else v.how === 'recording' ? results.rec++ : results.tts++; };
  tally('intro', await voice('.voice-icon-btn[data-voice-key="instructions"]', 'intro', pk.ui.introBody));

  // ------------------------------------------------------------ walk all sections
  await p.evaluate(() => { const c = document.getElementById('consentCheck'); c.checked = true; c.dispatchEvent(new Event('change')); document.getElementById('instrContinueBtn').click(); });
  await p.waitForFunction(() => currentStep === 2, { timeout: 5000 });
  let textBad = [], iconBad = 0, rtlBad = false;
  for (let s = 0; s < 6; s++) {
    await wait(350);
    const sec = await p.evaluate(() => document.getElementById('qSection').textContent);
    if (sec !== pk.ui.sectionPrefix.replace('{n}', s + 1) + ' · ' + pk.sections[s]) textBad.push(`section ${s + 1} heading shows "${sec}"`);
    tally(`s${s + 1}`, await voice('#sectionVoiceBtn', `s${s + 1}`, pk.sections[s]));
    for (const qi of SEC[s]) {
      const q = await p.evaluate(n => { const b = document.querySelector('.q-block[data-qidx="' + n + '"]'); const img = b.querySelector('.q-icon'); const ttl = b.querySelector('.q-title'); return { t: ttl.textContent, q: b.querySelector('.q-text').textContent, c: b.querySelector('.q-subcount').textContent, sc: [...b.querySelectorAll('.scale-opt span')].map(x => x.textContent), icon: !!img && img.complete && img.naturalWidth > 0, iconRight: img ? img.getBoundingClientRect().left > ttl.getBoundingClientRect().left : null }; }, qi);
      if (q.t !== pk.questions[qi].t || q.q !== pk.questions[qi].q || q.c !== pk.ui.questionCounter.replace('{n}', qi + 1) || q.sc.join('|') !== pk.scale.join('|')) textBad.push(`question ${qi + 1} text differs from the pack`);
      if (!q.icon) iconBad++;
      if (pk.dir === 'rtl' && q.iconRight === false) rtlBad = true;
      tally(`q${String(qi + 1).padStart(2, '0')}`, await voice(`.q-block[data-qidx="${qi}"] .voice-icon-btn`, `q${String(qi + 1).padStart(2, '0')}`, pk.questions[qi].t));
    }
    o2.push([`section ${s + 1}`, await overflow(p)]);
    if (s === 0) await p.screenshot({ path: `${SHOTS}/${code}_3_questions.png` });
    if (s === 5) await p.screenshot({ path: `${SHOTS}/${code}_4_last_section.png`, fullPage: true });
    await p.evaluate(() => { document.querySelectorAll('.q-block').forEach(b => { const n = b.dataset.qidx; const e = document.querySelector('.q-block[data-qidx="' + n + '"] .scale-opt[data-level="1"]'); e && e.click(); }); document.getElementById('nextBtn').click(); });
  }
  ok(textBad.length === 0, 'all 6 section headings + 15 questions + answer labels match the pack' + (textBad.length ? ': ' + textBad.slice(0, 3).join('; ') : ''));
  ok(iconBad === 0, 'all 15 question icons load');
  ok(results.bad.length === 0, `all 22 voice buttons behave (${results.rec} play a real recording, ${results.tts} use the phone's voice because no clip exists)` + (results.bad.length ? ' PROBLEMS: ' + results.bad.slice(0, 3).join(' || ') : ''));
  if (pk.dir === 'rtl') ok(!rtlBad, 'right-to-left: the question icon sits on the right of its title');
  ok(!p.__failed.some(u => /\/(flags|icons|lang)\//.test(u)), 'no failed requests for flags, icons or text');

  // ------------------------------------------------------------ results
  const res = await p.evaluate(en => ({ active: document.getElementById('screen-results').classList.contains('active'), title: document.getElementById('resultsTitle').textContent, note: document.getElementById('gpSummaryNote').textContent, print: document.getElementById('printBtn').textContent }), null);
  const enPack = await p.evaluate(() => JSON.parse(JSON.stringify(T.en)));
  ok(res.active && res.title === enPack.ui.resultsTitle && res.note.includes(pk.name), 'results page appears, in English, and records the patient\'s language');
  o2.push(['results', await overflow(p)]);
  await p.close();

  // ------------------------------------------------------------ narrow phone: overflow on every screen
  p = await open(320); await choose(p); const o3 = [['page 2', await overflow(p)]];
  await p.evaluate(() => { const c = document.getElementById('consentCheck'); c.checked = true; c.dispatchEvent(new Event('change')); document.getElementById('instrContinueBtn').click(); });
  await p.waitForFunction(() => currentStep === 2, { timeout: 5000 });
  for (let s = 0; s < 6; s++) { await wait(200); o3.push([`section ${s + 1}`, await overflow(p)]); await p.evaluate(() => { document.querySelectorAll('.q-block').forEach(b => { const n = b.dataset.qidx; const e = document.querySelector('.q-block[data-qidx="' + n + '"] .scale-opt[data-level="3"]'); e && e.click(); }); document.getElementById('nextBtn').click(); }); }
  await p.close();
  const over = [...o2.map(x => ['390px ' + x[0], x[1]]), ...o3.map(x => ['320px ' + x[0], x[1]])].filter(x => x[1] > 0);
  ok(over.length === 0, 'no sideways overflow on any screen at 390px and 320px' + (over.length ? ': ' + over.map(x => x.join('=')).join(', ') : ''));

  console.log(`\n${code}: ${pass} passed, ${fail} failed.  Screenshots in ${SHOTS}`);
  console.log('Note: the test browser may lack fonts for some scripts, so judge how the text LOOKS on a real phone.');
  await browser.close(); process.exit(fail ? 1 : 0);
})().catch(e => { console.error('TEST CRASHED:', e.message); process.exit(2); });
