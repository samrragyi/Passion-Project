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
  const expectOrder = await p.evaluate(() => window.LANGUAGES.slice().sort((a, b) => (b.code === 'en') - (a.code === 'en') || (a.group || a.gloss).localeCompare(b.group || b.gloss, 'en') || a.gloss.localeCompare(b.gloss, 'en')).map(l => l.gloss));
  ok(JSON.stringify(tiles.map(t => t.g)) === JSON.stringify(expectOrder), 'tiles: English first, then countries A-Z, then English name A-Z inside each country');
  await p.screenshot({ path: `${SHOTS}/${code}_1_home.png` });

  // ------------------------------------------------------------ language loads, page 2
  await choose(p);
  const pk = await p.evaluate(c => JSON.parse(JSON.stringify(T[c])), code);
  const page2 = await p.evaluate(() => ({ lang: document.documentElement.lang, dir: document.documentElement.dir, steps: [...document.querySelectorAll('#howItWorksList li')].map(l => l.textContent), legend: document.querySelectorAll('#severityLegend .legend-row').length, head: document.getElementById('disclaimerHeading').textContent, notice: document.getElementById('formalDisclaimerText').textContent, consent: document.getElementById('consentLabelText').textContent, intro: document.getElementById('introBodyText').textContent, startDisabled: document.getElementById('instrContinueBtn').disabled, start: document.getElementById('instrContinueBtn').textContent }));
  ok(page2.lang === pk.tag && page2.dir === pk.dir, `page lang="${page2.lang}" dir="${page2.dir}" match the pack`);
  ok(page2.intro === pk.ui.introBody && page2.steps.join('|') === pk.howItWorks.join('|') && page2.legend === 4 && page2.head === pk.ui.beforeYouBegin && page2.notice === pk.ui.formalDisclaimer && page2.consent === pk.ui.consentLabel, 'page 2 shows the pack text (intro, 3 steps, 4 legend rows, notice, checkbox)');
  ok(page2.startDisabled && page2.start === pk.ui.startButton, 'Start button is locked until the checkbox is ticked');
  const sp = await p.evaluate(() => ({ shown: !document.getElementById('speedBar').hidden, rates: [...document.querySelectorAll('#speedBar .speed-btn')].map(b => b.dataset.rate + ':' + b.getAttribute('aria-pressed')), hint: document.getElementById('multiSymptomHint').textContent }));
  ok(sp.shown && sp.rates.join('|') === '0.75:false|1:true|1.25:false', 'speed control (0.75x / 1x / 1.25x, default 1x) shows on page 2');
  ok(sp.hint === pk.ui.multiSymptomHint && sp.hint.length > 20, 'page 2 shows the "even one is enough" line from the pack');
  const rate = await p.evaluate(async () => { document.querySelector('#speedBar [data-rate="1.25"]').click(); const b = document.querySelector('.voice-icon-btn[data-voice-key="instructions"]'); b.click(); await new Promise(r => setTimeout(r, 400)); const out = { global: audioRate, playing: activeAudioEl ? activeAudioEl.playbackRate : null }; stopAllPlayback(); document.querySelector('#speedBar [data-rate="1"]').click(); voiceDiscovered = false; return out; });
  ok(rate.global === 1.25 && (rate.playing === null || rate.playing === 1.25), 'the speed control changes the playback rate of the clip that is playing (1.25x)');
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
  ok(res.active && res.title === pk.ui.resultsTitle && res.note.includes(pk.name), 'results page appears in the patient\'s language and the English doctor summary records that language');
  const top = await p.evaluate(() => { const q = (sel) => document.querySelector(sel); const dir = (el) => el ? getComputedStyle(el).direction : null; return {
    idx: (() => { const t = answers.reduce((a, v) => a + (v === null ? 0 : v), 0); return t <= 11 ? 0 : (t <= 26 ? 1 : 2); })(), severe: answers.filter(a => a === 3).length,
    band: (q('#scoreBadge .score-band') || {}).textContent, bandEn: (q('#printHeroEn .score-band') || {}).textContent,
    explainTitle: (q('#scoreExplain .score-explain-title') || {}).textContent, line: ((q('#patientSummary .quick-line') || {}).textContent || '').trim(),
    scoreDir: dir(q('#scoreBadge .score-number bdi')), rangeDir: dir(q('#scoreExplain bdi')), gpDir: dir(q('#gpPanel')), noticeDir: dir(q('#finalNoticeBlock')), printDir: dir(q('#printHeroEn')),
    enBoxesTitle: (q('#enTopBoxes .score-explain-title') || {}).textContent, enBoxesLine: ((q('#enTopBoxes .quick-line') || {}).textContent || '').trim(), enBoxesShown: getComputedStyle(q('#enTopBoxes')).display, enBoxesDir: dir(q('#enTopBoxes')), enBoxesAlign: getComputedStyle(q('#enTopBoxes')).textAlign,
    printShown: getComputedStyle(q('#printHeroEn')).display, ma: [...document.querySelectorAll('#myAnswers .ma-line')].map(e => e.textContent), intro: (q('#resultsIntro') || {}).textContent }; });
  ok(top.band === pk.bands[top.idx] && top.explainTitle === pk.ui.scoreExplainTitle && (top.severe ? top.line.startsWith(pk.ui.mostNoticeable) : top.line === pk.ui.noSevereSymptoms) && top.intro === pk.ui.resultsIntro, 'results page top (score band, "Understanding your score", quick summary line, intro) is in the patient\'s language');
  if (code !== 'en') ok(pk.ui.scoreExplainTitle !== enPack.ui.scoreExplainTitle && pk.ui.mostNoticeable !== enPack.ui.mostNoticeable && pk.ui.noSevereSymptoms !== enPack.ui.noSevereSymptoms && pk.bands[top.idx] !== enPack.bands[top.idx] && pk.ui.assessmentDate !== enPack.ui.assessmentDate, 'those results strings are translated, not copies of the English');
  ok(top.bandEn === enPack.bands[top.idx] && top.printShown === 'none', 'the English print copy of the top section exists and is hidden on screen');
  ok(top.enBoxesTitle === enPack.ui.scoreExplainTitle && (top.severe ? top.line.length > 0 && top.enBoxesLine.startsWith(enPack.ui.mostNoticeable) : top.enBoxesLine === enPack.ui.noSevereSymptoms), 'the two English boxes for the doctor (score explanation, quick summary) are in English');
  ok(code === 'en' ? top.enBoxesShown === 'none' : (top.enBoxesShown !== 'none' && top.enBoxesDir === 'ltr' && top.enBoxesAlign === 'left'), code === 'en' ? 'English: the English boxes are hidden on screen (they would repeat the boxes above)' : 'the two English boxes are visible on screen for the doctor, left-to-right and left-aligned');
  ok(top.scoreDir === 'ltr' && top.rangeDir === 'ltr', 'score "31 / 45" and ranges "0–11" are isolated left-to-right (never flipped in a right-to-left page)');
  ok(top.gpDir === 'ltr' && top.noticeDir === 'ltr' && top.printDir === 'ltr', 'the English doctor summary, Notice and print copy are left-to-right in every language');
  if (code !== 'en') ok(top.ma.length === 2 && top.ma[0].includes(pk.ui.assessmentDate) && top.ma[0].includes(pk.ui.overallLabel) && top.ma[1].includes(pk.ui.flagged), '"Your answers" ends with the overall score / assessment date and highest-severity lines in the patient\'s language');
  const my = await p.evaluate(() => { const e = document.getElementById('myAnswers'); return { hidden: e.hidden, rows: e.querySelectorAll('.ma-row').length, secs: e.querySelectorAll('.ma-sec').length, title: (e.querySelector('.my-answers-title') || {}).textContent, printHidden: getComputedStyle(e).display }; });
  if (code === 'en') ok(my.hidden, 'English: the "Your answers" block is hidden (the English summary is the only one)');
  else ok(!my.hidden && my.rows === 15 && my.secs === 6 && my.title === pk.ui.myAnswersTitle, 'results page shows "Your answers" in the patient\'s language (6 sections, 15 rows)');
  const hdr = await p.evaluate(() => { const br = document.querySelector('.brandmark').getBoundingClientRect(), h = document.querySelector('.home-btn').getBoundingClientRect(); return br.left < h.left; });
  ok(hdr, 'header: the logo is on the left and the Home button on the right on the results page, in every language (same as English)');
  const engBad = await p.evaluate(() => { const out = []; document.querySelectorAll('#gpPanel, #gpPanel *, #finalNoticeBlock, #finalNoticeBlock *, #enTopBoxes, #enTopBoxes *').forEach(el => {     // the English-by-design blocks only (native text in Latin-script languages is allowed to be anywhere)
    const own = [...el.childNodes].filter(n => n.nodeType === 3).map(n => n.textContent).join(' ').trim(); if (!/[A-Za-z]{3,}/.test(own) || /[\u0600-\u06FF]/.test(own)) return;
    const cs = getComputedStyle(el), r = el.getBoundingClientRect(); if (!r.width || cs.display === 'none' || cs.visibility === 'hidden' || el.closest('.print-top')) return;
    const a = cs.textAlign, d = cs.direction; if (d !== 'ltr' || a === 'right' || (a === 'end' && d === 'ltr')) out.push((el.id || el.className || el.tagName) + ':' + d + '/' + a); }); return out; });
  ok(engBad.length === 0, 'every piece of English text in the doctor summary and the Notice is left-to-right and not right-aligned' + (engBad.length ? ': ' + engBad.slice(0, 3).join('; ') : ''));
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
