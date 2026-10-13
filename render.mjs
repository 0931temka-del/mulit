// usage: node render.mjs stills out_dir t1 t2 ...   |   node render.mjs all out_dir workers worker_idx
import { chromium } from 'playwright-core';
import fs from 'fs';
const [mode, out, ...rest] = process.argv.slice(2);
fs.mkdirSync(out, { recursive: true });
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--no-sandbox'] });
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
page.on('console', m => { if (['error', 'warning'].includes(m.type())) console.log('[page]', m.text()); });
page.on('pageerror', e => console.log('[pageerror]', e.message));
await page.goto('http://localhost:8123/web/index.html');
await page.waitForFunction('window.READY === true', null, { timeout: 30000 });
const shot = async (t, file) => { await page.evaluate(t => window.seek(t), t); await page.screenshot({ path: file, type: 'jpeg', quality: 92 }); };
if (mode === 'stills') { for (const t of rest.map(Number)) await shot(t, `${out}/t${t.toFixed(1)}.jpg`); }
else {
  const fps = 24; const total = await page.evaluate(() => fetch('timeline.json').then(r => r.json()).then(j => j.total));
  const N = Math.ceil(total * fps), W = +rest[0], k = +rest[1];
  for (let i = k; i < N; i += W) { const f = `${out}/${String(i).padStart(5, '0')}.jpg`; if (fs.existsSync(f)) continue; await shot(i / fps, f); if (i % 120 === k) console.log('frame', i, '/', N); }
}
await browser.close();
