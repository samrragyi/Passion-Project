/*
  Print test: English prints on ONE page; every other language on exactly TWO (page 1 in her language, page 2 the English summary for the doctor), in colour, on both A4 and US Letter.
  Usage:  node tools/print_test.js <code> [<code> ...]      (default: every language in languages.js)
  For each language it answers every question with the worst case (all "Extremely": the longest flagged lists), opens the
  results page, saves it as a PDF exactly like a browser's default Save-as-PDF (no background graphics) and counts pages.
  Exit code 1 if any PDF has the wrong number of pages or the wrong language on a page. Needs: pdfinfo (poppler). PDFs are written to /tmp/print_test/.
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
    const res = []; const native = code !== 'en'; const want = native ? 2 : 1;
    const info = await p.evaluate(c => ({ nat: [T[c].ui.scoreExplainTitle, T[c].ui.myAnswersTitle, T[c].bands[2]], mild: T[c].ui.scoreExplainMild, en: [T.en.ui.scoreExplainTitle, T.en.bands[2]] }), code);
    const squash = t => t.replace(/\s+/g, ' ');
    const latinScript = ['fr', 'de', 'es', 'pt', 'pt-br', 'ro', 'pl', 'sq', 'tl', 'vi'].includes(code);   // pdftotext is reliable for these
    for (const size of ['A4', 'Letter']) {
      const file = path.join(OUT, `${code}_${size}.pdf`);
      await p.pdf({ path: file, format: size, printBackground: false, preferCSSPageSize: true });
      const pages = parseInt(cp.execSync('pdfinfo ' + file).toString().match(/Pages:\s+(\d+)/)[1], 10);
      const page = n => squash(cp.execSync(`pdftotext -f ${n} -l ${n} ${file} -`).toString());
      let note = '';
      if (pages !== want) { bad++; note = ` (expected ${want})`; }
      else if (native) {
        const p1 = page(1), p2 = page(2);
        const ok1 = !p1.includes('Patient Symptom Summary') && p1.includes('/ 45') && (!latinScript || (info.nat.slice(0, 2).every(x => p1.includes(squash(x))) && p1.includes(squash(info.mild))));   // her explanation box is closed on screen but must print in full
        const ok2 = p2.includes('Patient Symptom Summary') && p2.includes('Data Confidentiality') &&   // the English Notice is closed on screen but must print in full
           info.en.every(x => p2.includes(squash(x))) && !info.nat.some(x => x && !info.en.includes(x) && p2.includes(squash(x)));
        if (!ok1 || !ok2) { bad++; note = ' PROBLEM: ' + (!ok1 ? 'page 1 is not her language summary. ' : '') + (!ok2 ? 'page 2 is not the clean English summary.' : ''); }
      } else if (!info.en.every(x => page(1).includes(squash(x))) || !page(1).includes('Data Confidentiality')) { bad++; note = ' PROBLEM: English top section or Notice missing'; }
      res.push(`${size}=${pages} page${pages > 1 ? 's' : ''}${note}`);
    }
    console.log(`${code.padEnd(6)} ${res.join('   ')}   ${native ? '(page 1 her language, page 2 English)' : '(English only)'}`); await p.close();
  }
  await browser.close();
  console.log(bad ? `\n${bad} print problem(s): fix @media print in index.html.` : `\nAll prints are as expected (English 1 page; other languages 2 pages).`); process.exit(bad ? 1 : 0);
})().catch(e => { console.error('ERR', e.message); process.exit(1); });
