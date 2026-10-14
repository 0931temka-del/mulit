// node render.mjs out_dir t1 t2 ...   |   node render.mjs out_dir all  (24 к/с, 1080x1920). Нужен сервер: python3 -m http.server 8123 в корне проекта
import { chromium } from 'playwright-core';
import fs from 'fs';
const [out, ...rest] = process.argv.slice(2); fs.mkdirSync(out, { recursive: true });
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--no-sandbox'] });
const page = await browser.newPage({ viewport: { width: 540, height: 960 }, deviceScaleFactor: 2 });
page.on('pageerror', e => console.log('[pageerror]', e.message)); page.on('console', m => { if (m.type() === 'error') console.log('[page]', m.text()); });
await page.goto('http://127.0.0.1:8123/money/web/index.html?cur=' + (process.env.CUR || 'rub')); await page.waitForFunction('window.READY === true');
const total = await page.evaluate(() => fetch('../timing.json').then(r => r.json()).then(j => j.total));
const shot = async (t, f) => { await page.evaluate(t => window.seek(t), t); await page.screenshot({ path: f, type: 'jpeg', quality: 93 }); };
if (rest[0] === 'all') { const N = Math.ceil(total * 24); for (let i = 0; i < N; i++) { const f = `${out}/${String(i).padStart(5, '0')}.jpg`; if (fs.existsSync(f)) continue; await shot(i / 24, f); if (i % 120 === 0) console.log('frame', i, '/', N); } }
else for (const t of rest.map(Number)) await shot(t, `${out}/t${t.toFixed(1)}.jpg`);
await browser.close();
