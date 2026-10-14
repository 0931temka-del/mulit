// Снимает по одному кадру на стиль: node render_styles.mjs out_dir style1 style2 ...  (нужен сервер на 8123)
import { chromium } from 'playwright-core';
import fs from 'fs';
const [out, ...styles] = process.argv.slice(2);
fs.mkdirSync(out, { recursive: true });
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--no-sandbox'] });
const page = await browser.newPage({ viewport: { width: 640, height: 360 }, deviceScaleFactor: 2 });
page.on('console', m => { if (['error', 'warning'].includes(m.type())) console.log('[page]', m.text()); });
page.on('pageerror', e => console.log('[pageerror]', e.message));
for (const s of styles) {
  await page.goto(`http://127.0.0.1:8123/web/styles/index.html?style=${s}`);
  await page.waitForFunction('window.READY === true', null, { timeout: 120000 });
  await page.screenshot({ path: `${out}/${s}.png` });
  console.log('ok', s);
}
await browser.close();
