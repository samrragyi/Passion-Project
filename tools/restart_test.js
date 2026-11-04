// Regression test: every return to the language screen is a clean start (answers + consent cleared, hints re-armed), and the "Start again?" prompt guards Home / Back / Restart.
// Usage: node tools/restart_test.js
const chromium = require('@sparticuz/chromium').default || require('@sparticuz/chromium');
const puppeteer = require('puppeteer-core');
const ROOT = require('path').resolve(__dirname, '..');
const w = ms => new Promise(r => setTimeout(r, ms));
let fails = 0; const ok = (n, c, x) => { console.log((c ? 'PASS ' : 'FAIL ') + n + (x ? '  ' + x : '')); if (!c) fails++; };
(async () => {
  const b = await puppeteer.launch({ args: chromium.args.concat(['--allow-file-access-from-files']), executablePath: await chromium.executablePath(), headless: 'shell' });
  const p = await b.newPage(); await p.setViewport({ width: 390, height: 800 });
  const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto('file://' + ROOT + '/index.html', { waitUntil: 'load' }); await w(700);
  const pick = async c => { await p.evaluate(c => { const l = window.LANGUAGES.find(x => x.code === c); [...document.querySelectorAll('.lang-card')].find(k => k.querySelector('.lang-native').textContent === l.name && k.querySelector('.lang-gloss').textContent === l.gloss).click(); }, c); await p.waitForFunction('currentStep === 1', { timeout: 8000 }); };   // the app waits ~0.26 s before page 2: never act before it has arrived
  const tick = () => p.evaluate(() => { const c = document.getElementById('consentCheck'); c.checked = true; c.dispatchEvent(new Event('change')); });
  const begin = async () => { await tick(); await p.evaluate(() => document.getElementById('instrContinueBtn').click()); await w(500); };
  const answerAll = () => p.evaluate(() => { document.querySelectorAll('.q-block').forEach(q => { const n = q.dataset.qidx; const e = document.querySelector('.q-block[data-qidx="' + n + '"] .scale-opt[data-level="2"]'); e && e.click(); }); });
  const sel = () => p.evaluate(() => document.querySelectorAll('.scale-opt.selected').length);
  const dlg = () => p.evaluate(() => { const bd = document.getElementById('confirmBackdrop'); return { open: !bd.hidden, msg: document.getElementById('confirmMsg').textContent, yes: document.getElementById('confirmYes').textContent, no: document.getElementById('confirmNo').textContent, focus: document.activeElement && document.activeElement.id }; });
  const onScreen = () => p.evaluate(() => [...document.querySelectorAll('.screen.active')].map(s => s.id).join());
  const click = id => p.evaluate(id => document.getElementById(id).click(), id);
  const hint = () => p.evaluate(() => ({ pulse: document.querySelectorAll('.voice-icon-btn.voice-hint').length, nextHint: !document.getElementById('nextHint').hidden, nextPulse: document.getElementById('nextBtn').classList.contains('next-pulse') }));

  await pick('en'); await w(900);
  await click('homeBtn'); await w(400); ok('1 Home with no answers: no prompt, language screen', !(await dlg()).open && (await onScreen()) === 'screen-language');
  await pick('en'); await w(900);
  ok('2 page 2 audio button glows at start', (await hint()).pulse > 0, JSON.stringify(await hint()));
  await p.evaluate(() => document.querySelector('.voice-icon-btn[data-voice-key="instructions"]').click()); await w(300);
  ok('3 glow stops after tapping audio', (await hint()).pulse === 0);
  await begin(); await answerAll(); await w(300);
  await click('homeBtn'); await w(300); let d = await dlg();
  ok('4 Home with answers opens prompt', d.open && d.msg.startsWith('Start again?'), JSON.stringify(d));
  ok('5 safe option has focus', d.focus === 'confirmNo');
  await click('confirmNo'); await w(300);
  ok('6 No: prompt closed, still on questions, answers kept', !(await dlg()).open && (await onScreen()) === 'screen-question' && (await sel()) > 0);
  await click('homeBtn'); await w(300); await p.keyboard.press('Escape'); await w(200);
  ok('7 Escape closes prompt', !(await dlg()).open && (await sel()) > 0);
  await click('homeBtn'); await w(300); await p.evaluate(() => document.getElementById('confirmBackdrop').dispatchEvent(new MouseEvent('click', { bubbles: true }))); await w(200);
  ok('8 tapping outside closes prompt', !(await dlg()).open && (await sel()) > 0);
  await click('prevBtn'); await w(400); ok('9 prevBtn lands on page 2 with answers kept', (await onScreen()) === 'screen-instructions');
  await click('instrBackBtn'); await w(300); ok('10 Back from page 2 with answers asks first', (await dlg()).open);
  await click('confirmYes'); await w(500);
  ok('11 Yes: language screen', (await onScreen()) === 'screen-language' && !(await dlg()).open);
  await pick('ko'); await w(900);
  ok('12 glow is back for the next person', (await hint()).pulse > 0, JSON.stringify(await hint()));
  d = await p.evaluate(() => ({ ticked: document.getElementById('consentCheck').checked, dis: document.getElementById('instrContinueBtn').disabled }));
  ok('13 consent box cleared', !d.ticked && d.dis, JSON.stringify(d));
  await begin(); ok('14 blank questions', (await sel()) === 0);
  await answerAll(); await w(400);
  ok('15 Next hint shows again after the first page is answered', (await hint()).nextHint && (await hint()).nextPulse, JSON.stringify(await hint()));
  await click('homeBtn'); await w(300); d = await dlg(); ok('16 Korean prompt is in Korean', d.open && /[가-힣]/.test(d.msg + d.yes + d.no), d.msg + ' | ' + d.yes + ' | ' + d.no);
  await click('confirmYes'); await w(500);
  await pick('ar-eg'); await w(900); await begin();
  for (let s = 0; s < 6; s++) { await answerAll(); await w(250); await click('nextBtn'); await w(300); }
  await w(400); ok('17 reached results', (await onScreen()) === 'screen-results', await onScreen());
  await click('restartBtn'); await w(300); d = await dlg(); ok('18 Restart asks first (Arabic text)', d.open && /[\u0600-\u06FF]/.test(d.msg), d.msg);
  await p.screenshot({ path: '/tmp/prompt_ar.png' });
  await click('confirmYes'); await w(500); ok('19 Restart Yes: language screen', (await onScreen()) === 'screen-language');
  ok('20 no script errors', errs.length === 0, errs.join('|'));
  const q = await b.newPage(); await q.setViewport({ width: 320, height: 640 }); await q.goto('file://' + ROOT + '/index.html', { waitUntil: 'load' }); await w(600);
  await q.evaluate(() => { const l = window.LANGUAGES.find(x => x.code === 'de'); [...document.querySelectorAll('.lang-card')].find(k => k.querySelector('.lang-native').textContent === l.name && k.querySelector('.lang-gloss').textContent === l.gloss).click(); }); await w(900);
  await q.evaluate(() => { const c = document.getElementById('consentCheck'); c.checked = true; c.dispatchEvent(new Event('change')); document.getElementById('instrContinueBtn').click(); }); await w(500);
  await q.evaluate(() => { document.querySelectorAll('.q-block').forEach(b => b.querySelector('.scale-opt[data-level="1"]').click()); document.getElementById('homeBtn').click(); }); await w(300);
  const m = await q.evaluate(() => ({ docW: document.documentElement.scrollWidth, vw: innerWidth, boxW: Math.round(document.querySelector('.confirm-box').getBoundingClientRect().width) }));
  ok('21 prompt fits a 320px screen', m.docW <= m.vw && m.boxW <= m.vw, JSON.stringify(m));
  await q.screenshot({ path: '/tmp/prompt_de320.png' });
  await b.close(); console.log(fails ? fails + ' FAILED' : 'all passed'); process.exit(fails ? 1 : 0);
})();
