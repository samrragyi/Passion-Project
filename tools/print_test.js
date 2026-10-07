/*
  Print test: does the results page still print on ONE page, in colour, on both A4 and US Letter?
  Usage:  node tools/print_test.js <code> [<code> ...]      (default: every language in languages.js)
  For each language it answers every question with the worst case (all "Extremely": the longest flagged lists), opens the
  results page, saves it as a PDF exactly like a browser's default Save-as-PDF (no background graphics) and counts pages.
  Exit code 1 if any PDF is longer than one page. Needs: pdfinfo (poppler). PDFs are written to /tmp/print_test/.
*/
const fs = require('fs'), path = require('path'), cp = require('child_process');
const chromium = require('@sparticuz/chromium').default || require('@sparticuz/chromium');
const puppeteer = require('puppeteer-core');
const ROOT = path.resolve(__dirname, '..'), OUT = '/tmp/print_test'; fs.mkdirSync(OUT, { recursive: true });
const wait = ms => new Promise(r => setTimeout(r, ms));
const manifest = fs.readFileSync(path.join(ROOT, 'languages.js'), 'utf8');
const all = [...manifest.matchAll(/code:\s*"([^"]+)"/g)].map(m => m[1]);
const codes = process.argv.slice(2).length ? process.argv.slice(2) : all;
(async () => {
  const browser = await puppeteer.launch({ args: chromium.args.concat(['--allow-file-access-from-files']), executablePath: await chromium.executablePath(), headless: 'shell' });
  let bad = 0;
  for (const code of codes) {
    const p = await browser.newPage(); await p.setViewport({ width: 800, height: 1000 });
    await p.goto('file://' + ROOT + '/index.html', { waitUntil: 'load' }); await wait(800);
    await p.evaluate(c => { const l = window.LANGUAGES.find(x => x.code === c); [...document.querySelectorAll('.lang-card')].find(k => k.querySelector('.lang-gloss').textContent === l.gloss).click(); }, code);
    await p.waitForFunction(() => currentStep === 1, { timeout: 20000 }); await wait(500);
    await p.evaluate(() => { const c = document.getElementById('consentCheck'); c.checked = true; c.dispatchEvent(new Event('change')); document.getElementById('instrContinueBtn').click(); });
    await p.waitForFunction(() => currentStep === 2, { timeout: 5000 });
    for (let s = 0; s < 6; s++) {
      await wait(250);
      await p.evaluate(() => { [...document.querySelectorAll('.q-block')].map(b => b.dataset.qidx).forEach(n => { const e = document.querySelector('.q-block[data-qidx="' + n + '"] .scale-opt[data-level="3"]'); e && e.click(); }); document.getElementById('nextBtn').click(); });
    }
    await p.waitForFunction(() => document.getElementById('screen-results').classList.contains('active'), { timeout: 8000 }); await wait(400);
    await p.emulateMediaType('print');
    const res = [];
    for (const size of ['A4', 'Letter']) {
      const file = path.join(OUT, `${code}_${size}.pdf`);
      await p.pdf({ path: file, format: size, printBackground: false, preferCSSPageSize: true });
      const pages = parseInt(cp.execSync('pdfinfo ' + file).toString().match(/Pages:\s+(\d+)/)[1], 10);
      res.push(`${size}=${pages} page${pages > 1 ? 's' : ''}`); if (pages > 1) bad++;
    }
    console.log(`${code.padEnd(6)} ${res.join('   ')}`); await p.close();
  }
  await browser.close();
  console.log(bad ? `\n${bad} print(s) longer than one page: tighten @media print in index.html.` : `\nAll prints fit on one page.`); process.exit(bad ? 1 : 0);
})().catch(e => { console.error('ERR', e.message); process.exit(1); });
