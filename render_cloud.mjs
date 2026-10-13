// render_cloud.mjs - съёмка кадров сцены в облачной среде (Linux, браузер /opt/pw-browsers/chromium, расчёт на процессоре).
// Тот же интерфейс, что у render.mjs:
//   node render_cloud.mjs stills out_dir t1 t2 ...        (отдельные кадры)
//   node render_cloud.mjs all out_dir workers worker_idx  (все кадры, 24 к/с)
// Переменные окружения (все необязательные):
//   PAGE  - страница сцены в папке web (по умолчанию index.html; улучшенная - index_hq.html, её создаёт make_hq.mjs)
//   SCALE - масштаб картинки (1 = 1280x720, 1.5 = 1920x1080; в облаке начинать с 1)
//   FMT   - jpeg или png (по умолчанию jpeg, качество 95)
//   CHROME_PATH, PORT - путь к браузеру и порт сервера (по умолчанию /opt/pw-browsers/chromium и 8123)
// Перед запуском должен работать сервер из корня проекта: python3 -m http.server 8123 --bind 127.0.0.1 &
import { chromium } from 'playwright-core';
import fs from 'fs';
const [mode, out, ...rest] = process.argv.slice(2);
fs.mkdirSync(out, { recursive: true });
const chrome = process.env.CHROME_PATH || '/opt/pw-browsers/chromium';
const port = process.env.PORT || 8123;
const PAGE = process.env.PAGE || 'index.html';
const SCALE = +(process.env.SCALE || 1);
const FMT = process.env.FMT === 'png' ? 'png' : 'jpeg';
const ext = FMT === 'png' ? 'png' : 'jpg';
const browser = await chromium.launch({ executablePath: chrome, args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--no-sandbox'] });
const page = await browser.newPage({ viewport: { width: 1280, height: 720 }, deviceScaleFactor: SCALE });
page.on('console', m => { if (['error', 'warning'].includes(m.type())) console.log('[page]', m.text()); });
page.on('pageerror', e => console.log('[pageerror]', e.message));
await page.goto(`http://127.0.0.1:${port}/web/${PAGE}`);
await page.waitForFunction('window.READY === true', null, { timeout: 120000 });
const shot = async (t, file) => {
  await page.evaluate(t => window.seek(t), t);
  await page.screenshot(FMT === 'png' ? { path: file, type: 'png' } : { path: file, type: 'jpeg', quality: 95 });
};
if (mode === 'stills') { for (const t of rest.map(Number)) await shot(t, `${out}/t${t.toFixed(1)}.${ext}`); }
else {
  const fps = 24; const total = await page.evaluate(() => fetch('timeline.json').then(r => r.json()).then(j => j.total));
  const N = Math.ceil(total * fps), W = +rest[0], k = +rest[1];
  for (let i = k; i < N; i += W) { const f = `${out}/${String(i).padStart(5, '0')}.${ext}`; if (fs.existsSync(f)) continue; await shot(i / fps, f); if (i % 120 === k) console.log('frame', i, '/', N); }
}
await browser.close();
