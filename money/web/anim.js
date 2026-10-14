// «Как деньги зарабатывают деньги» — 2D моушн на canvas. window.seek(t) рисует кадр на время t (сек).
const cv = document.getElementById('c'), ctx = cv.getContext('2d'); const W = 540, H = 960;
const INK = '#1b1d29', OR = '#ff6a3d', GOLD = '#ffc83d', GRAY = '#9aa0ae';
const FONT = "'DejaVu Sans', Arial, sans-serif";
const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const easeOut = x => 1 - Math.pow(1 - clamp(x), 3), easeBack = x => { x = clamp(x); const c = 1.70158; return 1 + (c + 1) * Math.pow(x - 1, 3) + c * Math.pow(x - 1, 2); };
const lerp = (a, b, k) => a + (b - a) * k;
const R = (x, y, w, h, c) => { ctx.fillStyle = c; ctx.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h)); };
function rr(x, y, w, h, r, fill, stroke) { ctx.beginPath(); ctx.roundRect(x, y, w, h, r); if (fill) { ctx.fillStyle = fill; ctx.fill(); } if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = 2; ctx.stroke(); } }
function txt(s, x, y, size, color, align = 'center', weight = 'bold') { ctx.font = `${weight} ${size}px ${FONT}`; ctx.fillStyle = color; ctx.textAlign = align; ctx.textBaseline = 'middle'; ctx.fillText(s, x, y); }
const fmt = n => Math.round(n).toLocaleString('ru-RU').replace(/ /g, ' ');
let T = null;

// ---------- пиксельная монетка ----------
function coin(cx, cy, s, o = {}) {
  const mood = o.mood || 'happy', blink = o.blink; const x0 = cx - 7 * s, y0 = cy - 7 * s;
  for (let i = 0; i < 14; i++) for (let j = 0; j < 14; j++) {
    const r = Math.hypot(i - 6.5, j - 6.5); if (r > 6.9) continue;
    R(x0 + i * s, y0 + j * s, s, s, r > 6.0 ? '#c98a00' : (r > 4.7 ? GOLD : '#ffd95e'));
  }
  for (const [i, j] of [[3, 3], [4, 3], [3, 4]]) R(x0 + i * s, y0 + j * s, s, s, '#fff3b0');
  const ey = blink ? [7] : [6, 7];
  for (const ex of [4, 8]) for (const dx of [0, 1]) for (const j of ey) R(x0 + (ex + dx) * s, y0 + j * s, s, s, INK);
  const mouth = mood === 'sad' ? [[5, 10], [6, 9], [7, 9], [8, 10]] : mood === 'wow' ? [[6, 9], [7, 9], [6, 10], [7, 10]] : [[5, 9], [6, 10], [7, 10], [8, 9]];
  for (const [i, j] of mouth) R(x0 + i * s, y0 + j * s, s, s, INK);
  if (o.legs !== false) for (const lx of [4, 8]) { R(x0 + lx * s, y0 + 14 * s, 2 * s, 2 * s, INK); }
}
function miniCoin(cx, cy, s) { for (let i = 0; i < 6; i++) for (let j = 0; j < 6; j++) { const r = Math.hypot(i - 2.5, j - 2.5); if (r <= 3) R(cx - 3 * s + i * s, cy - 3 * s + j * s, s, s, r > 2.2 ? '#c98a00' : GOLD); } R(cx - 2 * s, cy - 2 * s, s, s, '#fff3b0'); }
function spark(x, y, s, a) { ctx.globalAlpha = a; R(x - s, y, 3 * s, s, '#fff'); R(x, y - s, s, 3 * s, '#fff'); ctx.globalAlpha = 1; }

// ---------- фоны ----------
const BG = ['#fff7ee', '#e8effc', '#f1ebfa', '#15161d', '#12141b', '#fff0e3', '#ffd84a'];
function bg(i, a = 1) {
  ctx.globalAlpha = a; ctx.fillStyle = BG[i]; ctx.fillRect(0, 0, W, H);
  const dark = i === 3 || i === 4;
  if (dark) { ctx.strokeStyle = 'rgba(255,255,255,.05)'; ctx.lineWidth = 1; for (let x = 0; x < W; x += 36) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); } for (let y = 0; y < H; y += 36) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); } }
  else { const g = ctx.createRadialGradient(80, 140, 10, 80, 140, 320); g.addColorStop(0, 'rgba(255,150,110,.30)'); g.addColorStop(1, 'rgba(255,150,110,0)'); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    const g2 = ctx.createRadialGradient(470, 620, 10, 470, 620, 300); g2.addColorStop(0, 'rgba(150,130,255,.22)'); g2.addColorStop(1, 'rgba(150,130,255,0)'); ctx.fillStyle = g2; ctx.fillRect(0, 0, W, H); }
  ctx.globalAlpha = 1;
}

// ---------- сцены ----------
function s0(t) { // монета-герой
  const k = easeBack(t / 0.6); const bob = Math.sin(t * 4) * 8; const cy = 330 + bob + (1 - k) * -300;
  coin(270, cy, 13, { blink: (t % 2.4) > 2.25, mood: 'happy' });
  for (let i = 0; i < 6; i++) { const a = clamp((t - 0.5 - i * 0.25) / 0.4); const x = 80 + i * 76, y = 520 - Math.sin(t * 2 + i) * 14 - a * 40; ctx.globalAlpha = a * 0.9; txt('₽', x, y, 34, GOLD); ctx.globalAlpha = 1; }
  for (let i = 0; i < 4; i++) spark(120 + i * 110, 200 + Math.sin(t * 3 + i * 2) * 20, 4, 0.5 + 0.5 * Math.sin(t * 5 + i));
  const q = clamp((t - 1.2) / 0.4); ctx.globalAlpha = q; rr(330, 150, 70, 60, 16, '#fff', '#e4d7c8'); txt('?', 365, 180, 38, OR); ctx.globalAlpha = 1;
}
function piggy(x, y) { const p = '#ff9db8', d = '#e0668c';
  R(x + 20, y + 30, 150, 100, p); R(x + 10, y + 40, 170, 80, p); R(x + 170, y + 55, 30, 40, d); R(x + 40, y + 20, 30, 20, d); R(x + 120, y + 20, 30, 20, d);
  R(x + 40, y + 130, 28, 24, d); R(x + 122, y + 130, 28, 24, d); R(x + 130, y + 60, 12, 12, INK); R(x + 70, y + 24, 60, 8, '#7a2744'); R(x - 4, y + 66, 18, 8, d); }
function s1(t) {
  const k = easeOut(t / 0.5); ctx.globalAlpha = k; rr(95, 110 - (1 - k) * 40, 350, 120, 22, '#fff', '#d8e2f7'); R(95, 110 - (1 - k) * 40, 350, 34, '#ff6a3d'); ctx.beginPath(); ctx.fillStyle = OR; ctx.globalAlpha = k;
  txt('КАЖДЫЙ МЕСЯЦ', 270, 128 - (1 - k) * 40, 18, '#fff'); txt('500 ₽', 270, 190 - (1 - k) * 40, 54, INK); ctx.globalAlpha = 1;
  piggy(170, 430); const per = 0.55;
  for (let n = 0; n < 6; n++) { const ts = t - 0.7 - n * per; if (ts < 0 || ts > 0.6) continue; const u = ts / 0.6; miniCoin(260 + n % 2 * 8, lerp(260, 480, u * u), 5); }
  coin(95, 520 + Math.sin(t * 3) * 6, 7, { mood: 'happy', blink: (t % 2.2) > 2.05, legs: true });
}
function s2(t) {
  const u = easeOut(t / 2.4); txt(fmt(6000 * u) + ' ₽', 270, 240, 78, INK); txt('за год', 270, 310, 32, GRAY, 'center', 'normal');
  for (let m = 0; m < 12; m++) { const a = easeOut((t - 0.3 - m * 0.12) / 0.4); const h = 18 + m * 5.5; R(60 + m * 36, 740 - h * a - 190, 26, h * a, GOLD); R(60 + m * 36, 740 - h * a - 190, 26, 4, '#c98a00'); }
  R(50, 552, 440, 4, INK); coin(270, 440, 9, { mood: 'sad', blink: (t % 2.4) > 2.25 });
}
function bank(x, y, w) { ctx.fillStyle = '#2d3142'; ctx.beginPath(); ctx.moveTo(x, y + 60); ctx.lineTo(x + w / 2, y); ctx.lineTo(x + w, y + 60); ctx.closePath(); ctx.fill(); for (let i = 0; i < 4; i++) R(x + 20 + i * ((w - 60) / 3), y + 72, 24, 100, '#3b4160'); R(x - 8, y + 180, w + 16, 22, '#2d3142'); R(x - 20, y + 204, w + 40, 16, '#2d3142'); }
function s3(t) {
  bank(140, 100, 260); txt('10% в год', 270, 425, 54, OR);
  const per = 1.4; const ph = (t % per) / per; // монета входит, выходят две
  const cx = lerp(60, 270, easeOut(clamp(ph / 0.35))); ctx.globalAlpha = ph < 0.4 ? 1 : 1 - (ph - 0.4) * 4; if (ph < 0.5) coin(cx, 290, 5, { legs: false }); ctx.globalAlpha = 1;
  if (ph > 0.45) { const o = easeOut((ph - 0.45) / 0.4); miniCoin(270 + o * 120, 290 + o * 50, 5); miniCoin(270 + o * 40, 290 + o * 100, 5); miniCoin(270 - o * 90, 290 + o * 60, 5); }
  const a = easeOut((t - 0.4) / 0.6); ctx.globalAlpha = a; txt('↑', 270, 510, 80, '#4de38b'); ctx.globalAlpha = 1;
  coin(270, 625 + Math.sin(t * 4) * 6, 5, { mood: 'wow', legs: false });
}
function s4(t) {
  txt('СЛОЖНЫЙ ПРОЦЕНТ', 270, 110, 34, GOLD);
  const p = easeOut(t / 3.0); R(60, 600, 420, 4, '#fff'); R(60, 220, 4, 384, '#fff'); ctx.strokeStyle = OR; ctx.lineWidth = 8; ctx.lineCap = 'round'; ctx.beginPath();
  const k = 4.2; for (let i = 0; i <= 60 * p; i++) { const u = i / 60; const y = 600 - 340 * (Math.exp(k * u) - 1) / (Math.exp(k) - 1); const x = 70 + u * 400; i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); } ctx.stroke();
  const u = p; const x = 70 + u * 400, y = 600 - 340 * (Math.exp(k * u) - 1) / (Math.exp(k) - 1); const r = 14 + u * 34;
  ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(x - r * 0.2, y - r, r, 0, 7); ctx.fill(); ctx.fillStyle = '#d9e2ff'; ctx.beginPath(); ctx.arc(x - r * 0.2 + r * 0.25, y - r + r * 0.2, r * 0.7, 0, 7); ctx.fill(); coin(x - r * 0.2, y - r, Math.max(3, r / 7), { legs: false });
  txt('ГОДЫ →', 270, 640, 22, '#9aa0ae', 'center', 'normal');
}
function s5(t) {
  const u = easeOut(t / 2.6); txt('≈ ' + fmt(380000 * u) + ' ₽', 270, 140, 62, OR); txt('через 20 лет', 270, 205, 30, GRAY, 'center', 'normal');
  const a = easeOut((t - 1.4) / 1.0); const bx = 60, by = 270, bw = 420, bh = 120, own = 120000 / 380000;
  rr(bx, by, bw, bh, 20, '#ffffff', '#f0d9c5'); ctx.save(); ctx.beginPath(); ctx.roundRect(bx, by, bw, bh, 20); ctx.clip();
  R(bx, by, bw * own * a, bh, '#aab0c0'); R(bx + bw * own * a, by, bw * (1 - own) * a, bh, OR); ctx.restore();
  ctx.globalAlpha = a; txt('твои взносы', bx + bw * own / 2, by + 60, 18, '#fff'); txt('120 000', bx + bw * own / 2, by + 86, 22, '#fff'); txt('доход от процентов', bx + bw * (own + (1 - own) / 2), by + 60, 22, '#fff'); txt('260 000 ₽', bx + bw * (own + (1 - own) / 2), by + 92, 30, '#fff'); ctx.globalAlpha = 1;
  txt('500 ₽ в месяц · 10% годовых', 270, 440, 26, INK, 'center', 'normal');
  coin(270, 560 + Math.sin(t * 4) * 6, 8, { mood: 'happy', blink: (t % 2.2) > 2.05 });
}
function s6(t) {
  const k = easeBack(t / 0.6); coin(270, 330 + (1 - k) * -250, 11, {});
  const a = easeOut((t - 0.5) / 0.5); ctx.globalAlpha = a; rr(120, 120, 300, 70, 14, '#fff', INK); txt('начни сегодня', 270, 155, 30, INK); R(266, 190, 8, 38, INK); ctx.globalAlpha = 1;
  const b = easeOut((t - 1.4) / 0.5); ctx.globalAlpha = b; rr(120, 520, 300, 74, 37, INK); txt('Подписаться', 270, 557, 30, '#fff'); ctx.globalAlpha = 1;
  const cx = lerp(420, 300, easeOut((t - 2) / 1)), cy = lerp(640, 570, easeOut((t - 2) / 1)); ctx.globalAlpha = b; ctx.fillStyle = '#fff'; ctx.strokeStyle = INK; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx, cy + 34); ctx.lineTo(cx + 9, cy + 26); ctx.lineTo(cx + 18, cy + 40); ctx.lineTo(cx + 24, cy + 36); ctx.lineTo(cx + 15, cy + 22); ctx.lineTo(cx + 26, cy + 20); ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.globalAlpha = 1;
  txt('Не является инвестиционной рекомендацией. Расчёт упрощённый.', 270, 935, 13, '#7a6a20', 'center', 'normal');
}
const SCENES = [s0, s1, s2, s3, s4, s5, s6];

// ---------- подписи ----------
function caption(line, t, dark) {
  const words = line.text.split(/\s+/); const total = words.reduce((a, w) => a + w.length + 1, 0); let acc = 0; const times = [];
  for (const w of words) { times.push(lerp(line.start, line.end, acc / total)); acc += w.length + 1; }
  ctx.font = `bold 34px ${FONT}`; const maxW = 480, sp = ctx.measureText(' ').width, rows = [[]]; let cur = 0;
  words.forEach((w, i) => { const ww = ctx.measureText(w).width; if (cur + ww > maxW && rows[rows.length - 1].length) { rows.push([]); cur = 0; } rows[rows.length - 1].push({ w, ww, i }); cur += ww + sp; });
  const lh = 48, y0 = 800 - (rows.length - 1) * lh / 2; const fadeIn = clamp((t - line.start + 0.1) / 0.25);
  rows.forEach((row, r) => { const rw = row.reduce((a, x) => a + x.ww + sp, -sp); let x = (W - rw) / 2; const y = y0 + r * lh;
    for (const it of row) { const spoken = t >= times[it.i]; const hl = line.hl.some(h => it.w.toLowerCase().replace(/[.,!?—]/g, '').startsWith(h.toLowerCase().slice(0, 5)));
      ctx.globalAlpha = fadeIn;
      if (spoken && hl) { rr(x - 8, y - 25, it.ww + 16, 50, 12, OR); txt(it.w, x + it.ww / 2, y + 1, 34, '#fff'); } else txt(it.w, x + it.ww / 2, y + 1, 34, spoken ? (dark ? '#ffffff' : INK) : (dark ? '#7d8396' : GRAY));
      x += it.ww + sp; } });
  ctx.globalAlpha = 1;
}

window.seek = t => {
  const L = T.lines; let i = 0; for (let k = 0; k < L.length; k++) if (t >= L[k].start - 0.05) i = k;
  const t0 = L[i].start - 0.05; const dark = i === 3 || i === 4;
  const fade = clamp((t - t0) / 0.25);
  if (i > 0 && fade < 1) { bg(i - 1, 1); bg(i, fade); } else bg(i, 1);
  ctx.save(); SCENES[i](Math.max(0, t - t0)); ctx.restore();
  caption(L[i], t, dark);
  R(0, 0, W * clamp(t / T.total), 5, OR);
};
fetch('../timing.json').then(r => r.json()).then(j => { T = j; window.READY = true; });
