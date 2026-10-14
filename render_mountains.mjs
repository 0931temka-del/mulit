// node render_mountains.mjs out.png [t] [w] [h]  — нужен сервер на 8123
import { chromium } from 'playwright-core';
const [out, t = '0.3', w = '720', h = '1280'] = process.argv.slice(2);
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--no-sandbox'] });
const p = await b.newPage({ viewport: { width: +w, height: +h } }); p.on('pageerror', e => console.log('[pageerror]', e.message)); p.on('console', m => { if (m.type() === 'error') console.log('[page]', m.text()); });
await p.goto(`http://127.0.0.1:8123/web/mountains/index.html?t=${t}&w=${w}&h=${h}`); await p.waitForFunction('window.READY === true', null, { timeout: 180000 }); await p.screenshot({ path: out }); await b.close(); console.log('ok', out);
