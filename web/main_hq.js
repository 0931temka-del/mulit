import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

/* ---------- utils ---------- */
const W = 1280, H = 720;
const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const sstep = x => { x = clamp(x); return x * x * (3 - 2 * x); };
const lerp = (a, b, x) => a + (b - a) * x;
const mix3 = (a, b, x) => [lerp(a[0], b[0], x), lerp(a[1], b[1], x), lerp(a[2], b[2], x)];
const TL = await (await fetch('timeline.json')).json();
const sec = TL.sections;
const s = (i, k) => sec[i - 1].sentences[k - 1].t0;
const cutStart = i => i === 1 ? 0 : (sec[i - 2].t0 + sec[i - 2].D + sec[i - 1].t0) / 2;
const cutEnd = i => i === 5 ? TL.total : cutStart(i + 1);
const speechOf = { gma: [], nbr: [] };
sec.forEach(x => { (x.speech.grandma || []).forEach(a => speechOf.gma.push(a)); (x.speech.neighbor || []).forEach(a => speechOf.nbr.push(a)); });
const speaking = (who, t) => { for (const a of (speechOf[who] || [])) if (t >= a[0] && t <= a[1]) return .3 + .7 * Math.abs(Math.sin((t - a[0]) * 17)); return 0; };
const beepEnv = t => { let m = 0; for (const [b, d] of TL.beeps) { const a = t - b; if (a >= 0 && a < d) m = Math.max(m, 1 - a / d * .5); } return m; };

const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
renderer.setPixelRatio(window.devicePixelRatio || 1); renderer.setSize(W, H);
renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.05;
document.getElementById('gl').appendChild(renderer.domElement);
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(34, W / H, .1, 300);

const M = (c, o = {}) => new THREE.MeshStandardMaterial({ color: c, roughness: .85, ...o });
const box = (p, w, h, d, c, x, y, z, o) => { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), M(c, o)); m.position.set(x, y, z); p.add(m); return m; };
const cyl = (p, rt, rb, h, c, x, y, z, o, seg = 28) => { const m = new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, seg), M(c, o)); m.position.set(x, y, z); p.add(m); return m; };
const sph = (p, r, c, x, y, z, o) => { const m = new THREE.Mesh(new THREE.SphereGeometry(r, 24, 16), M(c, o)); m.position.set(x, y, z); p.add(m); return m; };
const plane = (p, w, h, c, x, y, z, o) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), M(c, o)); m.position.set(x, y, z); p.add(m); return m; };
function ctex(w, h, draw, rep) { const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; if (rep) { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(...rep); } t.anisotropy = 4; return t; }
const FONT = "bold 40px 'DejaVu Sans', Arial";

/* ---------- sets ---------- */
const Ox = { A: 0, B: 60, C: 120 };
const sets = {};
const mkSet = n => { const g = new THREE.Group(); g.position.x = Ox[n]; scene.add(g); sets[n] = g; return g; };

/* A: village */
const A = mkSet('A');
{
  const sky = new THREE.Mesh(new THREE.SphereGeometry(120, 32, 16), new THREE.MeshBasicMaterial({ side: THREE.BackSide, map: ctex(8, 256, (c, w, h) => { const g = c.createLinearGradient(0, 0, 0, h); g.addColorStop(0, '#79b6f2'); g.addColorStop(.55, '#cfe6f7'); g.addColorStop(.75, '#ffe2b8'); g.addColorStop(1, '#ffd29a'); c.fillStyle = g; c.fillRect(0, 0, w, h); }), fog: false }));
  A.add(sky);
  plane(A, 300, 300, 0x8fc873, 0, 0, 0).rotation.x = -Math.PI / 2;
  const road = plane(A, 80, 3.4, 0xe0c9a0, 0, .02, 1.6); road.rotation.x = -Math.PI / 2;
  for (const [x, z, sx] of [[-30, -60, 40], [10, -70, 50], [50, -65, 38]]) { const h = sph(A, 1, 0x7fb86a, x, -4, z); h.scale.set(sx, 14, 12); }
  const sun = sph(A, 4, 0xfff2b0, -30, 26, -90, { emissive: 0xfff2b0, emissiveIntensity: 1.5 }); sun.material = new THREE.MeshBasicMaterial({ color: 0xfff1b5 });
  for (let i = 0; i < 6; i++) { const c = new THREE.Group(); const x = -50 + i * 22, y = 24 + (i % 3) * 3; for (let j = 0; j < 4; j++) sph(c, 3 + (j % 2), 0xffffff, j * 3.4 - 5, (j % 2) * .6, 0, { emissive: 0xffffff, emissiveIntensity: .5 }); c.position.set(x, y, -70); c.scale.y = .6; A.add(c); }
  // fence with gate gap
  for (let x = -12; x <= 12; x += .9) { if (x > -2.3 && x < -.5) continue; box(A, .22, 1.5, .18, 0xc9985c, x, .75, -2.4); }
  box(A, 24, .14, .12, 0xb98a50, 0, 1.1, -2.4); box(A, 24, .14, .12, 0xb98a50, 0, .5, -2.4);
  box(A, .3, 2.0, .3, 0x9b6e3c, -2.45, 1, -2.4); box(A, .3, 2.0, .3, 0x9b6e3c, -.35, 1, -2.4);
  const gl = new THREE.Group(); gl.position.set(-2.4, 0, -2.4); gl.rotation.y = -1.25; box(gl, 1.0, 1.2, .1, 0xd0a064, .55, .75, 0); A.add(gl);
  const gr = new THREE.Group(); gr.position.set(-.4, 0, -2.4); gr.rotation.y = 1.25; box(gr, 1.0, 1.2, .1, 0xd0a064, -.55, .75, 0); A.add(gr);
  // house
  const house = new THREE.Group(); house.position.set(-7, 0, -10); A.add(house);
  box(house, 7, 3.6, 5, 0xf3e3c0, 0, 1.8, 0);
  const roof = new THREE.Mesh(new THREE.ConeGeometry(6.2, 2.6, 4), M(0xb4503d)); roof.rotation.y = Math.PI / 4; roof.position.y = 4.9; roof.scale.z = .85; house.add(roof);
  box(house, 1.1, 2.2, .2, 0x7a4a2a, 1.6, 1.1, 2.55);
  box(house, 1.5, 1.3, .2, 0xffe9a8, -1.6, 2, 2.55, { emissive: 0xffd77a, emissiveIntensity: .6 });
  box(house, .12, 1.3, .24, 0x7a4a2a, -1.6, 2, 2.56); box(house, 1.6, .12, .24, 0x7a4a2a, -1.6, 2, 2.56);
  // trees, bushes, flowers
  for (const [x, z, k] of [[8, -8, 1.2], [14, -4, 1], [-16, -6, 1.3]]) { cyl(A, .35 * k, .45 * k, 3 * k, 0x7a5232, x, 1.5 * k, z); sph(A, 2 * k, 0x5fa957, x, 3.8 * k, z); sph(A, 1.5 * k, 0x6bbb62, x + 1.2 * k, 3.2 * k, z + .4); sph(A, 1.5 * k, 0x6bbb62, x - 1.2 * k, 3.3 * k, z - .2); }
  for (let i = 0; i < 40; i++) { const x = -14 + ((i * 7.3) % 28), z = -1.6 + ((i * 3.7) % 3.5) * .01 + (i % 5) * -.25; if (Math.abs(z - 1.6) < 1.8 && z > -1.5) continue; sph(A, .1, [0xff7b9c, 0xffd23f, 0xffffff][i % 3], x, .12, z - 1.1 - (i % 3) * .1); }
  const sunL = new THREE.DirectionalLight(0xfff0d0, 2.6); sunL.position.set(-6, 10, 9); A.add(sunL);
  A.add(new THREE.HemisphereLight(0xcfe6ff, 0x8aa86a, 1.0));
  { const fl = new THREE.PointLight(0xfff0e0, 40, 30, 2); fl.position.set(2, 4, 9); A.add(fl); }
}
const suitcase = new THREE.Group(); box(suitcase, 1.1, .85, .45, 0x9a5a2c, 0, .0, 0); box(suitcase, .9, .08, .5, 0x6e3c1c, 0, .1, 0); box(suitcase, .4, .1, .1, 0x333333, 0, .5, 0); A.add(suitcase);

/* B: city room */
const B = mkSet('B');
const phoneScreenTex = ctex(256, 512, (c, w, h) => { c.fillStyle = '#10182c'; c.fillRect(0, 0, w, h); c.fillStyle = '#f2a0b6'; c.beginPath(); c.arc(w / 2, 170, 70, 0, 7); c.fill(); c.fillStyle = '#fff'; c.font = "bold 38px 'DejaVu Sans'"; c.textAlign = 'center'; c.fillText('Бабушка', w / 2, 320); c.font = "28px 'DejaVu Sans'"; c.fillStyle = '#9db4ff'; c.fillText('вызов…', w / 2, 366); c.fillStyle = '#30c060'; c.beginPath(); c.arc(w / 2, 450, 34, 0, 7); c.fill(); });
const winTex = ctex(1024, 560, (c, w, h) => {
  const g = c.createLinearGradient(0, 0, 0, h); g.addColorStop(0, '#070b24'); g.addColorStop(.6, '#1a2a63'); g.addColorStop(1, '#3a4c8c'); c.fillStyle = g; c.fillRect(0, 0, w, h);
  for (let i = 0; i < 90; i++) { c.fillStyle = `rgba(255,255,255,${.3 + (i % 5) * .13})`; c.fillRect((i * 97) % w, (i * 53) % 230, 2, 2); }
  c.fillStyle = '#f4f1d6'; c.beginPath(); c.arc(820, 110, 38, 0, 7); c.fill(); c.fillStyle = '#1a2a63'; c.beginPath(); c.arc(836, 100, 34, 0, 7); c.fill();
  for (let i = 0; i < 16; i++) { const bw = 50 + (i * 37) % 60, bh = 140 + (i * 83) % 230, x = i * 66 - 10; c.fillStyle = i % 2 ? '#0d1330' : '#141b42'; c.fillRect(x, h - bh, bw, bh); for (let yy = h - bh + 12; yy < h - 8; yy += 20) for (let xx = x + 8; xx < x + bw - 10; xx += 16) if (((xx * 7 + yy * 13) | 0) % 5 < 2) { c.fillStyle = ((xx + yy) | 0) % 3 ? '#ffd56b' : '#8fd0ff'; c.fillRect(xx, yy, 8, 11); } }
});
{
  const fl = plane(B, 60, 40, 0x6d4a34, 0, 0, 4); fl.rotation.x = -Math.PI / 2;
  plane(B, 60, 12, 0x34457a, 0, 6, -4); box(B, 60, 1.2, .2, 0x232f57, 0, .6, -3.9);
  plane(B, 40, 12, 0x2d3d70, -14, 6, 6).rotation.y = Math.PI / 2; plane(B, 40, 12, 0x2d3d70, 14, 6, 6).rotation.y = -Math.PI / 2;
  const win = new THREE.Mesh(new THREE.PlaneGeometry(7.4, 4.2), new THREE.MeshBasicMaterial({ map: winTex })); win.position.set(1, 4.1, -3.85); B.add(win);
  for (const [w, h, x, y] of [[7.8, .25, 1, 6.3], [7.8, .25, 1, 1.9], [.25, 4.6, -2.9, 4.1], [.25, 4.6, 4.9, 4.1], [.15, 4.2, 1, 4.1]]) box(B, w, h, .3, 0xe8e2d4, x, y, -3.8);
  box(B, .9, 4.6, .3, 0x9e3d4e, -3.7, 4.1, -3.6); box(B, .9, 4.6, .3, 0x9e3d4e, 5.7, 4.1, -3.6);
  // desk in front of the boy (seen from behind), laptop screen faces him
  const D = new THREE.Group(); D.position.set(-3.2, 0, 1.4); D.rotation.y = Math.PI; D.scale.setScalar(.75); B.add(D);
  box(D, 4, .18, 1.9, 0x8b5e3c, 0, 1.1, 0); for (const dx of [-1.8, 1.8]) for (const dz of [-.8, .8]) box(D, .15, 1.1, .15, 0x5a3b24, dx, .55, dz);
  box(D, 1.5, .08, 1.0, 0x9aa0aa, .1, 1.23, -.1); const scr = box(D, 1.5, .95, .06, 0x2a2e38, .1, 1.75, -.55); scr.rotation.x = -.15;
  const scr2 = plane(B, 1.35, .8, 0x7fb7ff, 0, 0, .035, { emissive: 0x7fb7ff, emissiveIntensity: 1.0 }); scr.add(scr2); B.remove(scr2);
  cyl(D, .06, .06, 1.4, 0x333333, 1.6, 1.9, -.3); cyl(D, .1, .5, .5, 0xffc15a, 1.6, 2.7, -.3, { emissive: 0xffa53a, emissiveIntensity: .9 });
  const lampL = new THREE.PointLight(0xffc27a, 45, 22, 2); lampL.position.set(-4.6, 2.6, 1.2); B.add(lampL);
  // poster, plant, bed
  box(B, 2, 2.6, .08, 0xf4d03f, -9.6, 4.6, -3.88); box(B, 1.6, 2.2, .1, 0xc0392b, -9.6, 4.6, -3.84);
  cyl(B, .45, .35, .7, 0xb5651d, 8.5, .35, -2.6); sph(B, .8, 0x3f9d4d, 8.5, 1.4, -2.6); sph(B, .6, 0x4fb35c, 8.9, 1.9, -2.5);
  box(B, 4.4, .7, 5, 0x3d5a9e, 12, .35, -.5); box(B, 4.4, 1.6, .5, 0x2a3f73, 12, .9, -3.1);
  B.add(new THREE.HemisphereLight(0x8aa2e6, 0x3a2e24, 1.3));
  const moonL = new THREE.PointLight(0x9db8ff, 60, 26, 2); moonL.position.set(1, 4, -2.2); B.add(moonL);
  const fillB = new THREE.PointLight(0xfff0e0, 70, 28, 2); fillB.position.set(0, 3, 8); B.add(fillB);
  B.userData = { lampL, moonL, fillB, scr2 };
}
// desk phone (smartphone) as a prop
function makeSmartphone() {
  const g = new THREE.Group(); box(g, .36, .72, .06, 0x15151c, 0, 0, 0);
  const sc = new THREE.Mesh(new THREE.PlaneGeometry(.31, .66), new THREE.MeshBasicMaterial({ map: phoneScreenTex })); sc.position.z = .032; g.add(sc);
  g.userData.screen = sc; return g;
}
function makeHandset() {
  const g = new THREE.Group(); box(g, .2, .9, .2, 0xb3262a, 0, 0, 0); cyl(g, .19, .19, .24, 0x8f1c20, 0, .46, 0); cyl(g, .19, .19, .24, 0x8f1c20, 0, -.46, 0); return g;
}
const smart = makeSmartphone(), handsetG = makeHandset(), handsetN = makeHandset();

/* C: grandma kitchen */
const C = mkSet('C');
const kit = {};
{
  const fl = plane(C, 60, 40, 0xa9774c, 0, 0, 4); fl.rotation.x = -Math.PI / 2;
  fl.material.map = ctex(256, 256, (c, w, h) => { c.fillStyle = '#b3814f'; c.fillRect(0, 0, w, h); for (let i = 0; i < 8; i++) { c.fillStyle = i % 2 ? '#a8774a' : '#bb8957'; c.fillRect(0, i * 32, w, 32); c.fillStyle = '#7d5532'; c.fillRect(0, i * 32, w, 2); } }, [10, 6]);
  const wall = plane(C, 60, 12, 0xf2dca0, 0, 6, -4);
  wall.material.map = ctex(128, 128, (c, w, h) => { c.fillStyle = '#f3dea6'; c.fillRect(0, 0, w, h); c.fillStyle = '#e4c882'; for (let y = 16; y < h; y += 32) for (let x = (y / 32 % 2) * 32 + 16; x < w; x += 64) { c.beginPath(); c.arc(x, y, 6, 0, 7); c.fill(); } }, [14, 4]);
  box(C, 60, 1.6, .2, 0x8a5a3a, 0, .8, -3.9);
  plane(C, 40, 12, 0xe8cf94, -14, 6, 6).rotation.y = Math.PI / 2; plane(C, 40, 12, 0xe8cf94, 14, 6, 6).rotation.y = -Math.PI / 2;
  // window
  const wx = -6.4, wy = 4.4;
  kit.sky = new THREE.Mesh(new THREE.PlaneGeometry(3.6, 3.0), new THREE.MeshBasicMaterial({ color: 0x8fd0ff })); kit.sky.position.set(wx, wy, -3.85); C.add(kit.sky);
  kit.sun = new THREE.Mesh(new THREE.CircleGeometry(.5, 24), new THREE.MeshBasicMaterial({ color: 0xfff1a0 })); kit.sun.position.z = -3.83; C.add(kit.sun);
  kit.moon = new THREE.Mesh(new THREE.CircleGeometry(.36, 24), new THREE.MeshBasicMaterial({ color: 0xf4f1d6 })); kit.moon.position.z = -3.83; C.add(kit.moon);
  const hill = new THREE.Mesh(new THREE.PlaneGeometry(3.6, .8), new THREE.MeshBasicMaterial({ color: 0x3f6d3a })); hill.position.set(wx, wy - 1.1, -3.81); C.add(hill); kit.hill = hill;
  for (const [w, h, x, y] of [[4.0, .22, wx, wy + 1.6], [4.0, .3, wx, wy - 1.6], [.22, 3.3, wx - 1.9, wy], [.22, 3.3, wx + 1.9, wy], [.12, 3.0, wx, wy]]) box(C, w, h, .3, 0xf6efe0, x, y, -3.75);
  box(C, .8, 3.5, .3, 0xd77a8f, wx - 2.3, wy, -3.6); box(C, .8, 3.5, .3, 0xd77a8f, wx + 2.3, wy, -3.6);
  // clock
  cyl(C, .7, .7, .1, 0xf8f8f0, 1.0, 6.4, -3.8).rotation.x = Math.PI / 2; cyl(C, .76, .76, .07, 0x6b4a2a, 1.0, 6.4, -3.82).rotation.x = Math.PI / 2;
  kit.hm = new THREE.Group(); kit.hm.position.set(1.0, 6.4, -3.7); box(kit.hm, .06, .36, .03, 0x222222, 0, .18, 0); C.add(kit.hm);
  kit.hh = new THREE.Group(); kit.hh.position.set(1.0, 6.4, -3.7); box(kit.hh, .09, .26, .03, 0x222222, 0, .13, 0); C.add(kit.hh);
  // shelf
  box(C, 3.2, .15, .6, 0x8a5a3a, 6.5, 4.6, -3.55); for (let i = 0; i < 4; i++) cyl(C, .17, .13, .3, [0xe8e8f0, 0xd24b4b, 0x4d8dff, 0xffd23f][i], 5.4 + i * .7, 4.85, -3.55);
  box(C, 2.4, 1.4, .1, 0xe0b080, 4, 5.0, -3.85); box(C, 2.1, 1.1, .12, 0x7ab0c8, 4, 5.0, -3.8);
  // table + phone
  const tb = new THREE.Group(); tb.position.set(2.8, 0, -.8); C.add(tb); kit.tb = tb;
  cyl(tb, 1.7, 1.7, .12, 0xc88a52, 0, 1.05, 0); cyl(tb, .2, .3, 1.0, 0x6b4a2a, 0, .5, 0); cyl(tb, 1.78, 1.78, .5, 0xf6f0e0, 0, .85, 0); cyl(tb, .8, .8, .02, 0xffffff, 0, 1.12, 0);
  const ph = new THREE.Group(); ph.position.set(.1, 1.18, .0); tb.add(ph);
  kit.phBase = box(ph, 1.1, .3, .8, 0xb3262a, 0, .15, 0); cyl(ph, .28, .28, .04, 0xe8e0d0, 0, .32, .12); box(ph, .26, .1, .5, 0x8f1c20, -.3, .35, -.2); box(ph, .26, .1, .5, 0x8f1c20, .3, .35, -.2);
  kit.phPos = new THREE.Vector3(2.9, 1.5, -.8);
  kit.cradle = new THREE.Group(); kit.cradle.position.set(0, .56, -.2); kit.cradle.rotation.x = Math.PI / 2; ph.add(kit.cradle);
  // chairs
  const chair = new THREE.Group(); chair.position.set(-.6, 0, -.3); C.add(chair); cyl(chair, 1.0, 1.0, .14, 0xa0603a, 0, .5, 0); for (const dx of [-.6, .6]) for (const dz of [-.6, .6]) box(chair, .12, .5, .12, 0x6b4a2a, dx, .25, dz); box(chair, 1.6, 1.4, .14, 0xa0603a, 0, 1.2, -.9);
  const arm = new THREE.Group(); arm.position.set(-3.6, 0, 1.2); C.add(arm); kit.arm = arm;
  box(arm, 2.6, .55, 2.2, 0xa04a3f, 0, .42, 0); box(arm, 2.6, 2.1, .5, 0x8f3d34, 0, 1.3, -.9); box(arm, .4, 1.1, 2.2, 0x8f3d34, -1.3, .9, 0); box(arm, .4, 1.1, 2.2, 0x8f3d34, 1.3, .9, 0);
  kit.blanket = box(C, 1.8, .24, 1.0, 0x4a7ab5, -3.6, .78, 2.0); kit.blanket.rotation.x = .12;
  kit.lamp = new THREE.PointLight(0xffd9a0, 90, 30, 2); kit.lamp.position.set(1.2, 6, 1.5); C.add(kit.lamp);
  kit.winL = new THREE.PointLight(0xaed6ff, 60, 24, 2); kit.winL.position.set(wx, wy, -2.4); C.add(kit.winL);
  kit.fill = new THREE.PointLight(0xfff0e0, 36, 28, 2); kit.fill.position.set(0, 3, 9); C.add(kit.fill);
  kit.hemi = new THREE.HemisphereLight(0xfff0d0, 0x7a5a3a, .9); C.add(kit.hemi);
  cyl(C, .05, .05, 2, 0x444444, 1.2, 7.0, 1.5); sph(C, .5, 0xfff0c0, 1.2, 5.8, 1.5, { emissive: 0xffd080, emissiveIntensity: 1.2 });
}
function kitchenDay(d, tt) {
  const sunH = -Math.cos(2 * Math.PI * d), ang = (d - .25) * 2 * Math.PI;
  const night = new THREE.Color(0x0b1330), day = new THREE.Color(0x8fd0ff), dusk = new THREE.Color(0xff9a5c);
  const k = sstep((sunH + .15) / .5), c = night.clone().lerp(day, k);
  const duskK = clamp(1 - Math.abs(sunH) / .4) * .85; c.lerp(dusk, duskK);
  kit.sky.material.color.copy(c);
  const wx = -6.4, wy = 4.4;
  kit.sun.position.set(wx - Math.cos(ang) * 1.3, wy - .8 + Math.sin(ang) * 1.9, -3.83); kit.sun.visible = Math.sin(ang) > -.05;
  kit.moon.position.set(wx + Math.cos(ang) * 1.3, wy - .8 - Math.sin(ang) * 1.9, -3.83); kit.moon.visible = Math.sin(ang) < .05;
  kit.winL.color.copy(c.clone().lerp(new THREE.Color(0xffffff), .3)); kit.winL.intensity = 10 + 80 * Math.max(0, sunH + .15);
  kit.lamp.intensity = 40 + 60 * (1 - k) * 1.0;
  kit.hill.material.color.set(night.clone().lerp(new THREE.Color(0x3f6d3a), k));
  kit.hm.rotation.z = -(tt / 60) * 2 * Math.PI; kit.hh.rotation.z = -(tt / 720) * 2 * Math.PI;
}

/* ---------- characters ---------- */
function makeChar(o) {
  const r = o.r, root = new THREE.Group(), pivot = new THREE.Group(); root.add(pivot); pivot.position.y = r; scene.add(root);
  const mats = []; const MC = (c, x = {}) => { const m = new THREE.MeshStandardMaterial({ color: c, roughness: .55, transparent: true, ...x }); mats.push(m); return m; };
  const body = new THREE.Mesh(new THREE.SphereGeometry(r, 56, 36), MC(o.color)); pivot.add(body);
  const surf = (x, y, off = 0) => new THREE.Vector3(x * r, y * r, Math.sqrt(Math.max(0, 1 - x * x - y * y)) * r + off * r);
  const orient = (g, v) => { g.position.copy(v); g.lookAt(v.clone().multiplyScalar(2)); pivot.add(g); return g; };
  const ch = { name: o.name, r, root, pivot, mats, set: null, vis: true, st: { mood: 0, worry: 0, lx: 0, ly: 0, sob: 0, tears: 0, hop: 0, sit: 0 }, eyes: [], pupils: [], brows: [], arms: {}, armT: {}, tears: [] };
  [-1, 1].forEach(sd => {
    const g = orient(new THREE.Group(), surf(sd * .33, .2, -.01));
    const w = new THREE.Mesh(new THREE.SphereGeometry(.2 * r, 24, 16), MC(0xffffff, { roughness: .3 })); w.scale.set(1, 1.28, .45); g.add(w);
    const p = new THREE.Mesh(new THREE.SphereGeometry(.098 * r, 16, 12), MC(0x15151a, { roughness: .2 })); p.scale.z = .5; p.position.z = .08 * r; g.add(p);
    const sh = new THREE.Mesh(new THREE.SphereGeometry(.03 * r, 8, 8), MC(0xffffff, { emissive: 0xffffff })); sh.position.set(.03 * r, .035 * r, .09 * r); p.add(sh);
    ch.eyes.push(g); ch.pupils.push(p);
    const bg = orient(new THREE.Group(), surf(sd * .34, .55, .01)); const bp = new THREE.Group(); bg.add(bp);
    bp.add(new THREE.Mesh(new THREE.BoxGeometry(.3 * r, .055 * r, .05 * r), MC(o.brow || 0x3a2a22))); ch.brows.push(bp);
    const cheek = orient(new THREE.Group(), surf(sd * .62, -.1, 0)); const cm = new THREE.Mesh(new THREE.SphereGeometry(.12 * r, 12, 8), MC(0xff7f8a, { opacity: .5 })); cm.scale.set(1, .7, .3); cheek.add(cm);
    const tr = []; for (let k = 0; k < 3; k++) { const td = new THREE.Mesh(new THREE.SphereGeometry(.055 * r, 10, 8), MC(0x8fd0ff, { emissive: 0x4a90ff, emissiveIntensity: .5, opacity: .85 })); td.visible = false; pivot.add(td); tr.push(td); } ch.tears.push(tr);
    // arm
    const am = new THREE.Mesh(new THREE.SphereGeometry(.2 * r, 16, 12), MC(new THREE.Color(o.color).multiplyScalar(.88))); pivot.add(am); ch.arms[sd < 0 ? 'L' : 'R'] = am;
    // foot
    const ft = new THREE.Mesh(new THREE.SphereGeometry(.3 * r, 16, 12), MC(o.shoe)); ft.scale.set(1, .5, 1.5); ft.position.set(sd * .42 * r, .14 * r, .3 * r); root.add(ft); (ch.feet = ch.feet || []).push(ft);
  });
  const mg = orient(new THREE.Group(), surf(0, -.27, .01)); ch.mouthG = mg;
  ch.smile = new THREE.Mesh(new THREE.TorusGeometry(.2 * r, .032 * r, 8, 28, Math.PI), MC(o.lip || 0x3a1d1d)); ch.smile.position.y = .06 * r; mg.add(ch.smile);
  ch.open = new THREE.Mesh(new THREE.SphereGeometry(.14 * r, 16, 12), MC(0x5a1620)); ch.open.scale.set(1.15, 1, .3); mg.add(ch.open);
  const shadow = new THREE.Mesh(new THREE.CircleGeometry(r * .95, 32), new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: .22, depthWrite: false })); shadow.rotation.x = -Math.PI / 2; shadow.position.y = .02; root.add(shadow); ch.shadow = shadow;
  o.acc(ch, pivot, MC, surf, orient);
  return ch;
}
const boy = makeChar({
  name: 'boy', color: 0x4d8dff, r: 1.0, shoe: 0xf2f2f2, acc(ch, pv, MC) {
    for (const [x, z, h, rot] of [[-.12, .02, .42, -.35], [.04, .0, .5, .0], [.2, .04, .38, .4]]) { const c = new THREE.Mesh(new THREE.ConeGeometry(.12, h, 10), MC(0x4b2e1c)); c.position.set(x, 1.0 + h * .35, z); c.rotation.z = rot; pv.add(c); }
    const sc = new THREE.Mesh(new THREE.TorusGeometry(.84, .14, 12, 40), MC(0xd9453a)); sc.rotation.x = Math.PI / 2; sc.position.y = -.52; pv.add(sc); const tail = new THREE.Mesh(new THREE.BoxGeometry(.22, .6, .1), MC(0xd9453a)); tail.position.set(.3, -.85, .78); tail.rotation.z = .12; pv.add(tail);
  }
});
const gma = makeChar({
  name: 'gma', color: 0xf2a0b6, r: 1.12, shoe: 0x8a5a3a, brow: 0x8d8d8d, acc(ch, pv, MC) {
    const bun = new THREE.Mesh(new THREE.SphereGeometry(.34, 20, 14), MC(0xe2e2e8)); bun.position.set(0, 1.12, -.15); pv.add(bun); const top = new THREE.Mesh(new THREE.SphereGeometry(.2, 16, 12), MC(0xe2e2e8)); top.position.set(0, 1.0, .3); top.scale.set(2.2, .55, 1); pv.add(top);
    [-1, 1].forEach(sd => { const gl = new THREE.Mesh(new THREE.TorusGeometry(.25, .026, 8, 28), MC(0x333333)); const p = new THREE.Vector3(sd * .37, .22, Math.sqrt(1 - .37 ** 2 - .22 ** 2)).multiplyScalar(1.12); gl.position.copy(p).multiplyScalar(1.02); gl.lookAt(p.clone().multiplyScalar(2)); pv.add(gl); });
    const br = new THREE.Mesh(new THREE.BoxGeometry(.18, .03, .03), MC(0x333333)); br.position.set(0, .26, 1.14 * Math.sqrt(1 - .25 * .25 - .22 ** 2) * 1.0); pv.add(br);
    const sh = new THREE.Mesh(new THREE.TorusGeometry(.93, .19, 14, 44), MC(0x8e5fb0)); sh.rotation.x = Math.PI / 2; sh.position.y = -.5; pv.add(sh); const sh2 = new THREE.Mesh(new THREE.SphereGeometry(.28, 14, 10), MC(0x8e5fb0)); sh2.position.set(0, -.62, .93); pv.add(sh2);
  }
});
const nbr = makeChar({
  name: 'nbr', color: 0x6fc47a, r: .98, shoe: 0xd24b4b, lip: 0xb02a3a, acc(ch, pv, MC) {
    for (let i = 0; i < 5; i++) { const a = -.9 + i * .45; const c = new THREE.Mesh(new THREE.CylinderGeometry(.13, .13, .5, 12), MC(0xff8fb1)); c.rotation.z = Math.PI / 2; c.position.set(Math.sin(a) * .5, .93 - Math.abs(a) * .12, Math.cos(a) * .42); c.rotation.y = -a; pv.add(c); const t = new THREE.Mesh(new THREE.SphereGeometry(.2, 12, 8), MC(0x4a3524)); t.position.set(Math.sin(a) * .62, .85 - Math.abs(a) * .1, Math.cos(a) * .5 - .1); pv.add(t); }
    const ap = new THREE.Mesh(new THREE.SphereGeometry(.92, 28, 14, 0, Math.PI * 2, Math.PI * .58, Math.PI * .3), MC(0xfff4e0, { side: THREE.DoubleSide })); ap.scale.setScalar(1.03); pv.add(ap);
    [-1, 1].forEach(sd => { const e = new THREE.Mesh(new THREE.SphereGeometry(.07, 10, 8), MC(0xf5c542, { metalness: .5 })); e.position.set(sd * .97, -.15, .1); pv.add(e); });
    const fl = new THREE.Mesh(new THREE.SphereGeometry(.12, 10, 8), MC(0xffd23f)); fl.position.set(.5, -.45, .82); pv.add(fl);
  }
});
const chars = [boy, gma, nbr];

function place(ch, set, x, z, ry, y = 0, sit = 0) { ch.set = set; ch.root.position.set(Ox[set] + x, y, z); ch.root.rotation.y = ry; ch.st.sit = sit; ch.st.hop = 0; ch.armT = {}; ch.st.mood = 0; ch.st.worry = 0; ch.st.lx = 0; ch.st.ly = 0; ch.st.sob = 0; ch.st.tears = 0; ch.st.op = 1; ch.st.nod = 0; ch.st.lean = 0; ch.st.zoff = 0; ch.held = null; }
function reach(ch, side, worldVec, w = 1) { ch.armT[side] = [worldVec, w]; }
const baseArm = (ch, sd) => new THREE.Vector3(sd * .98 * ch.r, -.12 * ch.r, .12 * ch.r);
function hold(ch, obj, mode, w = 1) { // obj attached to char pivot
  ch.pivot.add(obj); const r = ch.r;
  if (mode === 'ear') { obj.position.set(1.07 * r, .1 * r, .1 * r); obj.rotation.set(0, -Math.PI / 2, 0); if (obj === smart) obj.rotation.y = -Math.PI / 2; else { obj.rotation.set(0, 0, -.12); } }
  else if (mode === 'front') { obj.position.set(.35 * r, -.3 * r, 1.04 * r); obj.rotation.set(-.2, 0, 0); }
  obj.visible = true; reach(ch, 'R', obj.getWorldPosition(new THREE.Vector3()), w);
}
function applyChar(ch, t) {
  const r = ch.r, st = ch.st; ch.root.visible = false;
  if (ch.set === null) return;
  const sit = st.sit, bob = Math.sin(t * 2.2 + r * 3) * .018 * r;
  ch.pivot.position.y = r * (1 - .12 * sit) + bob + st.hop; ch.pivot.position.z = st.zoff;
  ch.pivot.rotation.x = st.nod; ch.pivot.rotation.z = st.lean;
  ch.feet.forEach(f => { f.visible = !sit; f.position.y = .14 * r + Math.max(0, st.hop); });
  ch.shadow.visible = !sit; ch.shadow.scale.setScalar(1 - st.hop * .3);
  const bl = ((t + r * 1.7) % 3.6) < .14 ? .1 : 1;
  ch.eyes.forEach(e => e.scale.y = bl);
  ch.pupils.forEach(p => { p.position.x = st.lx * .075 * r; p.position.y = st.ly * .09 * r; });
  ch.brows.forEach((b, i) => { b.rotation.z = (i === 0 ? 1 : -1) * st.worry * .5; b.parent.position.y = (.55 + st.worry * .05 + (st.mood > .5 ? .03 : 0)) * r; });
  const op = speaking(ch.name, t), sobv = st.sob * (.5 + .5 * Math.sin(t * 9)) * .5;
  const open = Math.max(op, sobv); ch.open.visible = open > .02; ch.open.scale.set(1.15, .04 + open * .9, .3); ch.smile.visible = !ch.open.visible;
  const m = st.mood, k = m >= 0 ? -Math.max(m, .06) : -Math.min(m, -.06); ch.smile.scale.y = k * 1.0; ch.smile.position.y = (k < 0 ? .06 : -.02) * r;
  ch.mouthG.scale.set(1, 1, 1);
  // arms
  ['L', 'R'].forEach(side => {
    const sd = side === 'L' ? -1 : 1, base = baseArm(ch, sd); base.y += Math.sin(t * 2 + sd) * .02 * r; let pos = base;
    const tg = ch.armT[side];
    if (tg) { ch.root.updateMatrixWorld(true); const loc = ch.pivot.worldToLocal(tg[0].clone()); const sh = baseArm(ch, sd); const d = loc.clone().sub(sh); const mx = 1.25 * r; if (d.length() > mx) d.setLength(mx); pos = base.clone().lerp(sh.clone().add(d), tg[1]); }
    ch.arms[side].position.copy(pos);
  });
  // tears
  ch.tears.forEach((tr, i) => tr.forEach((td, k) => {
    const on = st.tears > .01; td.visible = on; if (!on) return; const ph = (t * .75 + k / 3 + i * .2) % 1;
    const x = (i === 0 ? -1 : 1) * (.36 + ph * .05), y = .08 - ph * .75, z = Math.sqrt(Math.max(0, 1 - x * x - y * y)); td.position.set(x * r, y * r, z * r + .03 * r); td.material.opacity = (1 - ph) * st.tears; td.scale.setScalar(.7 + .6 * (1 - ph));
  }));
  ch.mats.forEach(mm => { if (mm.userData.base === undefined) mm.userData.base = mm.opacity; mm.opacity = mm.userData.base * st.op; });
  ch.root.visible = st.op > .01;
}

/* ---------- ripples (ringing) ---------- */
const rings = []; for (let i = 0; i < 6; i++) { const m = new THREE.Mesh(new THREE.TorusGeometry(1, .03, 8, 48), new THREE.MeshBasicMaterial({ color: 0xbfe0ff, transparent: true, opacity: 0, depthWrite: false })); m.visible = false; scene.add(m); rings.push(m); }
function ripples(origin, t, camPos, col = 0xbfe0ff) {
  let n = 0; rings.forEach(r => r.visible = false);
  for (const [b] of TL.beeps) for (let k = 0; k < 2; k++) { const a = t - b - k * .28; if (a > 0 && a < 1.3 && n < rings.length) { const m = rings[n++]; m.visible = true; m.position.copy(origin); m.lookAt(camPos); m.scale.setScalar(.3 + a * 1.9); m.material.opacity = (1 - a / 1.3) * .75; m.material.color.set(col); } }
}

/* ---------- shots ---------- */
const SH = [];
const shot = (id, t0, t1, set, c0, c1, l0, l1, x = {}) => SH.push({ id, t0, t1, set, c0, c1, l0, l1, ...x });
shot('1a', 0, s(1, 2), 'A', [2.0, 2.5, 12.5], [1.0, 2.1, 10], [0, 1.4, -.5], [0, 1.4, -.5]);
shot('1b', s(1, 2), s(1, 4), 'A', [-.2, 1.9, 6.8], [-.1, 1.75, 5.5], [-.1, 1.4, -.2], [-.1, 1.4, -.2]);
shot('1c', s(1, 4), cutEnd(1), 'A', [-1.2, 2.0, 11], [0, 2.1, 10.2], [1.8, 1.3, 0], [4.2, 1.3, 0]);
shot('2a', cutStart(2), s(2, 2), 'B', [4, 2.2, 7], [2.6, 2.0, 5.6], [0, 1.2, -1], [0, 1.2, -1]);
shot('2b', s(2, 2), s(2, 3), 'B', [-1.0, 3.2, 8.2], [-2.2, 2.9, 7.0], [-3.2, 1.35, -.2], [-3.2, 1.35, -.2]);
shot('2c', s(2, 3), s(2, 8), 'B', [-.4, 3.5, 7.4], [-1.2, 3.1, 6.4], [-2.8, 1.2, .3], [-2.8, 1.2, .3]);
shot('2d', s(2, 8), cutEnd(2), 'C', [4.8, 2.7, 8.5], [2.8, 2.2, 6.0], [1.2, 1.3, 0], [.6, 1.3, 0]);
shot('3a', cutStart(3), s(3, 2), 'B', [-1.6, 2.0, 7.2], [.2, 1.8, 5.8], [1.0, 1.2, -.3], [1.0, 1.2, -.3]);
shot('3b1', s(3, 2), s(3, 5), 'C', [-.6, 2.0, 6.4], [.2, 1.9, 5.2], [.9, 1.3, .6], [.9, 1.3, .6]);
shot('3b2', s(3, 5), s(3, 8) - .1, 'C', [4.2, 2.8, 8.8], [2.2, 2.2, 6.0], [.6, 1.3, -.3], [.4, 1.3, -.3], { sepia: true });
shot('3c', s(3, 8) - .1, cutEnd(3), 'B', [.6, 1.9, 5.0], [.7, 1.8, 3.8], [.7, 1.5, -.2], [.7, 1.5, -.2]);
shot('4a', cutStart(4), s(4, 2), 'C', [1.8, 2.7, 9.8], [-.4, 2.3, 8.0], [-1.8, 1.3, .8], [-2.4, 1.3, .8]);
shot('4b', s(4, 2), s(4, 7), 'C', [-3.0, 1.9, 6.3], [-3.2, 1.85, 5.3], [-3.6, 1.5, 1.2], [-3.6, 1.5, 1.2]);
shot('4c', s(4, 7), s(4, 11), 'S', null, null, null, null, { split: true });
shot('4d', s(4, 11), cutEnd(4), 'C', [-1.0, 2.2, 6.0], [1.6, 2.6, 9.5], [-3.2, 1.2, 1.0], [-1.2, 1.4, .2]);
shot('5a', cutStart(5), s(5, 3), 'B', [-2.8, 2.3, 7.0], [-1.2, 2.0, 5.4], [1.0, 1.4, -.5], [.9, 1.4, -.4]);
shot('5b', s(5, 3), s(5, 5), 'B', [.2, 1.9, 4.6], [.6, 1.8, 3.6], [.9, 1.5, -.2], [.9, 1.5, -.2]);
shot('5c', s(5, 5), s(5, 7), 'C', [4.2, 2.3, 6.2], [3.2, 2.0, 5.0], [2.6, 1.3, -.8], [2.8, 1.3, -.8]);
shot('5d', s(5, 7), TL.total, 'B', [.5, 2.0, 4.6], [2.2, 2.6, 10.5], [.7, 1.45, -.2], [.4, 1.9, -1.0]);
const SPLIT_CAMS = { L: { c0: [.7, 1.8, 4.9], c1: [.7, 1.75, 4.1], l: [.7, 1.45, -.2] }, R: { c0: [-3.5, 1.95, 6.3], c1: [-3.6, 1.9, 5.4], l: [-3.6, 1.5, 1.2] } };
const shotAt = t => SH.find(x => t >= x.t0 && t < x.t1) || SH[SH.length - 1];

/* ---------- choreography ---------- */
const P = (set, x, y, z) => new THREE.Vector3(Ox[set] + x, y, z);
function choreo(id, t, p) {
  boy.set = gma.set = nbr.set = null; suitcase.visible = false; smart.visible = false; handsetG.visible = false; handsetN.visible = false;
  B.userData.scr2.material.emissiveIntensity = 1; B.userData.lampL.intensity = 45; kitchenDay(.55, t);
  let pulse = 0; let ringAt = null;
  const sy = t * 6;
  switch (id) {
    case '1a': case '1b': case '1c': {
      const walk = id === '1c' ? sstep((t - (s(1, 4) + .5)) / 2.5) : 0, bx = lerp(1.0, 9, walk * walk * .6 + walk * .4);
      place(gma, 'A', -1.4, -.5, id === '1c' ? 1.1 : .55); place(boy, 'A', bx, .2 - walk * .3, id === '1c' ? 1.3 : -.6);
      if (walk > 0) { boy.st.hop = Math.abs(Math.sin(sy)) * .16 * clamp(walk * 6); boy.st.lean = Math.sin(sy) * .05; }
      suitcase.visible = true; suitcase.position.set(Ox.A + (id === '1c' ? bx + 1.5 : 2.4), .45, id === '1c' ? .55 - walk * .3 : .5);
      gma.st.mood = id === '1a' ? .4 : .2; gma.st.worry = .65; boy.st.mood = .5; boy.st.lx = id === '1c' ? 0 : -.8; boy.st.worry = .2;
      gma.st.lx = .6; boy.st.nod = id === '1c' ? Math.max(0, Math.sin((t - s(1, 4)) * 3.2) * .1) * (t < s(1, 5)) : 0;
      const rw = sstep((t - 1.8) / 1.0) * (1 - sstep((t - (s(1, 4) + .7)) / .5));
      gma.root.updateMatrixWorld(true); boy.root.updateMatrixWorld(true);
      reach(gma, 'R', new THREE.Vector3(Ox.A + bx - .85, 1.0, .35), rw);
      if (id === '1c') { gma.st.lx = 1; gma.st.mood = -.2; gma.st.worry = .9; const wv = sstep((t - s(1, 5)) / .6); reach(gma, 'R', new THREE.Vector3(Ox.A - 0.2 + Math.sin(t * 3) * .3, 2.4, .2), wv * (1 - sstep((t - (s(1, 4) + .7)) / .4)) + wv * .0 > 0 ? Math.max(wv, 0) : 0); }
      break;
    }
    case '2a': {
      place(boy, 'B', 0, -.5, .35); boy.st.mood = .9; boy.st.lx = -.3; boy.st.nod = Math.sin(t * 2.5) * .03; hold(boy, smart, 'ear'); break;
    }
    case '2b': {
      place(boy, 'B', -3.2, -.9, -.1, .45, 1); boy.st.mood = -.15; boy.st.worry = .5; boy.st.lx = 0; boy.st.ly = -.7; boy.st.nod = .12 + Math.sin(t * 1.5) * .03;
      const k = Math.sin(t * 14) * .08; reach(boy, 'L', P('B', -3.7 + k * 3, 1.15, .7)); reach(boy, 'R', P('B', -2.8 - k * 3, 1.15, .7));
      break;
    }
    case '2c': {
      place(boy, 'B', -3.2, -.9, .15, .45, 1); boy.st.mood = .1; boy.st.worry = .6; boy.st.lx = -.2;
      const lookP = sstep((t - s(2, 5)) / .5);
      boy.st.lx = lerp(-.8, .7, lookP); boy.st.ly = lerp(-.4, .0, lookP); boy.st.nod = .1;
      smart.visible = true; B.add(smart); smart.position.set(-2.2, .93, 1.3); smart.rotation.set(-Math.PI / 2, 0, .4);
      let buz = 0; for (const n of ['one', 'two', 'three']) { const a = t - sec[1].cues[n]; if (a > -.4 && a < .9) buz = 1; }
      const sh = buz ? Math.sin(t * 90) * .03 : 0; smart.position.x += sh; smart.position.z += sh * .6;
      pulse = buz; reach(boy, 'R', P('B', -2.4, 2.3, -.4), sstep((t - s(2, 6)) / .6) * .8);
      boy.st.worry = .7; boy.st.mood = -.15;
      break;
    }
    case '2d': {
      place(gma, 'C', -.7, -.3, .95, .45, 1); gma.st.mood = -.05; gma.st.worry = .8; gma.st.lx = .8; gma.st.ly = -.2;
      reach(gma, 'R', P('C', 2.1, 1.3, -.6), .35); kitchenDay(((t - s(2, 8)) / 2.1 * 1 + .3) % 1, t);
      break;
    }
    case '3a': {
      place(boy, 'B', 1.0, -.2, .5); boy.st.mood = -.2; boy.st.worry = .6; boy.st.lx = -.3; boy.st.ly = -.1;
      const toEar = sstep((t - (sec[2].t0 + 1.4)) / .6);
      if (toEar < .02) hold(boy, smart, 'front', 1); else { hold(boy, smart, 'ear', 1); smart.position.lerp(new THREE.Vector3(.35, -.3, 1.04), 1 - toEar); }
      smart.rotation.y = lerp(0, -Math.PI / 2, toEar); smart.visible = true;
      if (toEar > .5 || true) { pulse = beepEnv(t); ringAt = smart.getWorldPosition(new THREE.Vector3()); }
      boy.st.nod = .06;
      if (t > sec[2].pickup - .4) { boy.st.worry = .8; }
      break;
    }
    case '3b1': {
      place(nbr, 'C', .6, 1.0, -.45); nbr.st.mood = -.1; nbr.st.worry = .8; nbr.st.lx = -.6; nbr.st.ly = .1; hold(nbr, handsetN, 'ear');
      handsetN.rotation.set(0, 0, -.12); handsetN.position.set(1.05 * nbr.r, .1 * nbr.r, .1 * nbr.r); handsetN.visible = true;
      handsetG.visible = true; kit.cradle.add(handsetG); handsetG.position.set(0, 0, 0); handsetG.rotation.set(0, 0, 0); handsetG.scale.set(1, 1, 1);
      break;
    }
    case '3b2': {
      place(gma, 'C', -.7, -.3, .95, .45, 1); gma.st.mood = .0; gma.st.worry = .85; gma.st.lx = .8; gma.st.ly = -.2;
      reach(gma, 'R', P('C', 2.1, 1.3, -.6), .35);
      const d0 = s(3, 5), d1 = s(3, 8) - .1, u = (t - d0) / (d1 - d0); kitchenDay((u * 3 + .3) % 1, t);
      break;
    }
    case '3c': {
      place(boy, 'B', .7, -.2, .15); const sob = sstep((t - (s(3, 8) - .1)) / 1.2);
      boy.st.mood = -.8 * sob; boy.st.worry = 1; boy.st.lx = 0; boy.st.ly = -.3; boy.st.tears = sob; boy.st.sob = sob * .5; boy.st.nod = .08 * sob;
      hold(boy, smart, 'ear'); smart.rotation.y = -Math.PI / 2; smart.visible = true;
      const dr = sstep((t - (s(3, 8) + 1.6)) / 1.2); smart.position.y = lerp(.1, -.9, dr); smart.position.x = lerp(1.07, 1.3, dr); boy.armT = {}; reach(boy, 'R', smart.getWorldPosition(new THREE.Vector3()), 1 - dr);
      B.userData.lampL.intensity = lerp(45, 12, sob); break;
    }
    case '4a': {
      place(gma, 'C', -3.6, 1.2, .35, .45, 1); gma.st.mood = .0; gma.st.worry = .7; gma.st.lx = .6;
      const u = sstep((t - (sec[3].t0 + .3)) / 1.0), nx = lerp(1.6, -1.4, u);
      place(nbr, 'C', nx, 1.0, -1.3 - u * .2); nbr.st.mood = .2; nbr.st.worry = .5; nbr.st.lx = -.7; nbr.st.hop = Math.abs(Math.sin(sy * 1.1)) * .1 * (u > 0 && u < 1);
      handsetN.visible = true; hold(nbr, handsetN, 'front'); handsetN.position.set(.9 * nbr.r, -.1 * nbr.r, .85 * nbr.r); handsetN.rotation.set(0, 0, 1.2);
      kitchenDay(.58, t); kit.lamp.intensity = 90; break;
    }
    case '4b': {
      place(gma, 'C', -3.6, 1.2, .25, .45, 1); gma.st.mood = .75; gma.st.worry = .65; gma.st.lx = 0; gma.st.ly = 0; gma.st.nod = .05; hold(gma, handsetG, 'ear'); handsetG.rotation.set(0, 0, -.12); handsetG.position.set(1.07 * gma.r, .1 * gma.r, .1 * gma.r);
      kitchenDay(.58, t); break;
    }
    case '4d': {
      const u = (t - s(4, 11)); const fade = sstep((u - .5) / 2.4);
      place(gma, 'C', -3.6, 1.2, .25, .45 + fade * 1.2, 1); gma.st.op = 1 - fade; gma.st.mood = .6; gma.st.worry = .8; gma.st.lx = 0;
      hold(gma, handsetG, 'ear'); handsetG.rotation.set(0, 0, -.12); handsetG.position.set(1.07 * gma.r, .1 * gma.r, .1 * gma.r); handsetG.visible = fade < .98;
      if (fade > .5) { handsetG.visible = true; kit.cradle.add(handsetG); handsetG.position.set(0, 0, 0); handsetG.rotation.set(0, 0, 0); }
      kitchenDay(lerp(.58, .72, sstep(u / 3)), t); break;
    }
    case '5a': {
      place(boy, 'B', .9, -.3, .45); boy.st.mood = -.15; boy.st.worry = .5; boy.st.lx = -.2; boy.st.ly = -.1;
      const toEar = sstep((t - (sec[4].t0 + 2.2)) / .7); hold(boy, smart, 'ear'); smart.position.lerp(new THREE.Vector3(.35 * 1, -.3, 1.04), 1 - toEar); smart.rotation.y = lerp(0, -Math.PI / 2, toEar); smart.visible = true;
      break;
    }
    case '5b': case '5d': {
      place(boy, 'B', .9, -.3, id === '5d' ? .3 : .15); boy.st.mood = -.35; boy.st.worry = .75; boy.st.lx = 0; boy.st.ly = -.1; boy.st.nod = .05;
      hold(boy, smart, 'ear'); smart.rotation.y = -Math.PI / 2; smart.visible = true; pulse = beepEnv(t); ringAt = smart.getWorldPosition(new THREE.Vector3());
      if (id === '5d') { B.userData.lampL.intensity = lerp(45, 20, sstep((t - s(5, 7)) / 6)); boy.st.tears = .0; }
      break;
    }
    case '5c': {
      kitchenDay(.8, t); kit.lamp.intensity = 35; kit.winL.intensity = 8;
      handsetG.visible = true; kit.cradle.add(handsetG); handsetG.position.set(0, 0, 0); handsetG.rotation.set(0, 0, 0);
      pulse = beepEnv(t); ringAt = P('C', 2.9, 1.7, -.8); break;
    }
  }
  if (id === '5b' || id === '5c' || id === '5d' || id === '3a') p.pulse = pulse, p.ringAt = ringAt; else { p.pulse = 0; p.ringAt = null; }
  if (id === '5c') { kit.phBase.material.emissive.set(0xff5a3a); kit.phBase.material.emissiveIntensity = pulse * 1.4; } else { kit.phBase.material.emissive.set(0x000000); }
  if (id === '3a' || id === '5a' || id === '5b' || id === '5d') { smart.userData.screen.material.color.setScalar(.6 + .8 * pulse); }
}

/* ---------- overlays ---------- */
const $ = id => document.getElementById(id);
const capEl = $('cap'), capSpan = capEl.firstElementChild, blackEl = $('black'), calEl = $('cal'), titleEl = $('title'), dayEl = $('day'), wordsEl = $('words'), splitEl = $('split');
const WORDS = ['Hello', 'Bonjour', 'Deadline', 'Meeting?', 'Sorry?', 'Wie bitte?', 'OK', 'Monday', 'Report', 'Ja', 'Thanks'];
WORDS.forEach(w => { const e = document.createElement('span'); e.textContent = w; wordsEl.appendChild(e); });
const allCaps = sec.flatMap(x => x.captions);
function overlays(t, sh) {
  // black dips + fades
  let b = 0; b = Math.max(b, 1 - clamp(t / 1.2));
  for (let i = 1; i < 5; i++) { const mid = cutStart(i + 1), e = sec[i - 1].t0 + sec[i - 1].D; const half = Math.max(.35, (sec[i].t0 - e) / 2 + .15); b = Math.max(b, 1 - clamp(Math.abs(t - mid) / half)); }
  const fo = sec[4].t0 + sec[4].D + .5; b = Math.max(b, sstep((t - fo) / 1.4));
  blackEl.style.opacity = b.toFixed(3);
  const cp = allCaps.find(c => t >= c.t0 && t <= c.t1);
  capSpan.textContent = cp ? cp.text : ''; capEl.style.opacity = cp ? (1 - clamp(b * 2)).toFixed(2) : 0;
  // calendar
  const cs = sec[1], on = t >= s(2, 3) && t < s(2, 8) ? 1 : 0; const cf = Math.min(sstep((t - s(2, 3)) / .6), 1 - sstep((t - (s(2, 8) - .5)) / .5)); calEl.style.opacity = (on ? cf : 0).toFixed(2);
  [...calEl.querySelectorAll('.x')].forEach((x, i) => { const c = [cs.cues.one, cs.cues.two, cs.cues.three][i]; x.style.opacity = t >= c ? 1 : 0; x.style.transform = `scale(${t >= c ? 1 + Math.max(0, .5 - (t - c) * 2) : 1})`; });
  // sunday label (S5 start)
  dayEl.style.opacity = clamp(Math.min(sstep((t - (sec[4].t0 + .2)) / .8), 1 - sstep((t - (sec[4].t0 + 3.2)) / .8))).toFixed(2);
  // foreign words (S2b)
  const w0 = s(2, 2), w1 = s(2, 3); wordsEl.style.opacity = clamp(Math.min(sstep((t - w0) / .7), 1 - sstep((t - (w1 - .6)) / .6))).toFixed(2);
  [...wordsEl.children].forEach((e, i) => { const u = (t - w0) * .12 + i * .37; e.style.left = (60 + ((i * 193) % 760) + Math.sin(u * 5 + i) * 24) + 'px'; e.style.top = (60 + ((i * 97) % 300) + Math.cos(u * 4 + i * 2) * 26) + 'px'; e.style.fontSize = (20 + (i % 4) * 7) + 'px'; });
  // title
  const ta = sstep((t - (sec[4].t0 + sec[4].D + 2.3)) / 1.3) * (1 - sstep((t - (TL.total - .6)) / .6)); titleEl.style.opacity = ta.toFixed(2);
  splitEl.style.display = sh.split ? 'block' : 'none';
  renderer.domElement.style.filter = sh.sepia ? 'sepia(.45) saturate(.85) brightness(.95)' : 'none';
}

/* ---------- render ---------- */
const bgOf = { A: 0xcfe6f7, B: 0x0b1030, C: 0x1a1410 };
function showSet(name) { for (const k in sets) sets[k].visible = k === name; chars.forEach(c => { c.root.visible = c.set === name && c.st.op > .01; }); scene.background = new THREE.Color(bgOf[name]); smartVis(name); rings.forEach(r => { if (r.visible) r.visible = (r.userData.set === name) || true; }); }
function smartVis() { }
const cp = new THREE.Vector3(), lp = new THREE.Vector3();
function setCam(c0, c1, l0, l1, u, off, t) {
  const a = mix3(c0, c1, sstep(u)), b = mix3(l0, l1, sstep(u));
  camera.position.set(a[0] + off, a[1] + Math.sin(t * .8) * .02, a[2]); camera.lookAt(b[0] + off, b[1], b[2]);
}
function seek(t) {
  const sh = shotAt(t), p = {};
  if (sh.split) {
    // left: B boy crying ; right: C grandma
    boy.set = gma.set = nbr.set = null; suitcase.visible = false; handsetN.visible = false; kitchenDay(.58, t); B.userData.lampL.intensity = 22;
    place(boy, 'B', .7, -.2, .15); const u0 = (t - s(4, 7)) / (s(4, 11) - s(4, 7));
    boy.st.mood = -.7; boy.st.worry = 1; boy.st.tears = 1; boy.st.sob = .5; boy.st.ly = -.3; hold(boy, smart, 'ear'); smart.rotation.y = -Math.PI / 2; smart.visible = true; smart.userData.screen.material.color.setScalar(1);
    place(gma, 'C', -3.6, 1.2, .25, .45, 1); gma.st.mood = .8; gma.st.worry = .7; hold(gma, handsetG, 'ear'); handsetG.rotation.set(0, 0, -.12); handsetG.position.set(1.07 * gma.r, .1 * gma.r, .1 * gma.r); handsetG.visible = true;
    chars.forEach(c => applyChar(c, t));
    renderer.setScissorTest(true); const hw = W / 2;
    for (const [side, set, x] of [['L', 'B', 0], ['R', 'C', hw]]) {
      showSet(set); const cfg = SPLIT_CAMS[side]; camera.aspect = hw / H; camera.updateProjectionMatrix();
      setCam(cfg.c0, cfg.c1, cfg.l, cfg.l, u0, Ox[set], t);
      renderer.setViewport(x, 0, hw, H); renderer.setScissor(x, 0, hw, H); renderer.render(scene, camera);
    }
    renderer.setScissorTest(false); renderer.setViewport(0, 0, W, H); camera.aspect = W / H; camera.updateProjectionMatrix();
    overlays(t, sh); return;
  }
  choreo(sh.id, t, p);
  chars.forEach(c => applyChar(c, t));
  showSet(sh.set);
  const u = (t - sh.t0) / (sh.t1 - sh.t0), off = Ox[sh.set];
  setCam(sh.c0, sh.c1, sh.l0, sh.l1, u, off, t);
  if (p.ringAt) ripples(p.ringAt, t, camera.position); else rings.forEach(r => r.visible = false);
  renderer.render(scene, camera);
  overlays(t, sh);
}
window.seek = seek;
document.fonts && await document.fonts.ready;
/* ---------- HQ: тени, свет окружения ---------- */
function hqSetup() {
  const pm = new THREE.PMREMGenerator(renderer);
  scene.environment = pm.fromScene(new RoomEnvironment(), 0.04).texture;
  const ENV = +(new URLSearchParams(location.search).get('env') || 0.3);
  scene.traverse(o => {
    if (o.isMesh && o.material && o.material.isMeshStandardMaterial) { o.castShadow = true; o.receiveShadow = true; o.material.envMapIntensity = ENV; }
  });
  const shadowOn = (l, size, bias, nb) => { if (!l) return; l.castShadow = true; l.shadow.mapSize.set(size, size); l.shadow.bias = bias; l.shadow.normalBias = nb; };
  scene.traverse(o => {
    if (o.isDirectionalLight) {
      shadowOn(o, 2048, -0.0004, 0.03);
      const c = o.shadow.camera; c.left = -14; c.right = 14; c.top = 14; c.bottom = -14; c.near = 0.5; c.far = 60; c.updateProjectionMatrix();
    }
  });
  // тени от ламп в комнатах по умолчанию ВЫКЛЮЧЕНЫ: на проверке давали жёсткие ступенчатые края; включить для опыта: index_hq.html?lamps=1
  const LS = new URLSearchParams(location.search).get('lamps') === '1';
  if (LS) {
    try { const l = B.userData.lampL; shadowOn(l, 2048, -0.0006, 0.03); l.shadow.camera.near = 0.3; l.shadow.camera.far = 30; } catch (e) { console.warn('lampL', e.message); }
    try { const l = kit.lamp; shadowOn(l, 2048, -0.0006, 0.03); l.shadow.camera.near = 0.3; l.shadow.camera.far = 30; } catch (e) { console.warn('kit.lamp', e.message); }
  }
  // мягкое пятно-тень под героями вместо плотного тёмного кружка
  try {
    const cv = document.createElement('canvas'); cv.width = cv.height = 128; const g = cv.getContext('2d');
    const gr = g.createRadialGradient(64, 64, 4, 64, 64, 62); gr.addColorStop(0, 'rgba(0,0,0,0.75)'); gr.addColorStop(0.55, 'rgba(0,0,0,0.35)'); gr.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = gr; g.fillRect(0, 0, 128, 128);
    const tex = new THREE.CanvasTexture(cv); tex.colorSpace = THREE.SRGBColorSpace;
    chars.forEach(c => { if (c.shadow) { c.shadow.scale.multiplyScalar(1.15); c.shadow.material.map = tex; c.shadow.material.opacity = 0.5; c.shadow.material.needsUpdate = true; } });
  } catch (e) { console.warn('chars', e.message); }
  // контровой свет (холодный, сзади-сверху): подсвечивает края героев и отделяет их от фона
  try { const rim = new THREE.DirectionalLight(0xbcd6ff, 0.8); rim.position.set(3, 6, -14); scene.add(rim); } catch (e) { console.warn('rim', e.message); }
}
hqSetup();
seek(2); window.READY = true;
