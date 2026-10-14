// Одна и та же сцена (человек, машина, дом) в разных стилях. ?style=NAME. Готовится для выбора стиля заказчиком.
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
const Q = new URLSearchParams(location.search);
const S = Q.get('style') || 'cartoon';
const W = 640, H = 360;
const CFG = {
  cartoon:    { kind: 'smooth', mat: 'std' },
  clay:       { kind: 'smooth', mat: 'clay' },
  diorama:    { kind: 'smooth', mat: 'std', high: true },
  lowpoly:    { kind: 'poly',   mat: 'flat' },
  voxel:      { kind: 'block',  mat: 'std' },
  neon:       { kind: 'poly',   mat: 'neon', dark: true },
  paper:      { kind: 'paper' },
  flat2d:     { kind: 'smooth', mat: 'basic', outline: true, flatbg: true },
  toon:       { kind: 'smooth', mat: 'toon', outline: true },
  ps1:        { kind: 'poly',   mat: 'flat' },
  lego:       { kind: 'block',  mat: 'lego' },
  watercolor: { kind: 'smooth', mat: 'std' },
}[S];
const C = { skin: '#f0c4a0', jacket: '#3d73b8', pants: '#35405e', hair: '#4a3020', car: '#d94a3d', glass: '#bfe3f5', wall: '#f3e5c8', roof: '#b4533c', door: '#7a4a2e', grass: '#86b86a', road: '#5a5d66', trunk: '#7a5232', leaf: '#4f9d57', sun: '#ffd27a', white: '#f5f5f5', dark: '#1b1b22' };
const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
renderer.setSize(W, H); renderer.setPixelRatio(2);
renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
document.body.appendChild(renderer.domElement);
const scene = new THREE.Scene();

function gradBg(top, bot) {
  const c = document.createElement('canvas'); c.width = 4; c.height = 256; const g = c.getContext('2d');
  const gr = g.createLinearGradient(0, 0, 0, 256); gr.addColorStop(0, top); gr.addColorStop(1, bot); g.fillStyle = gr; g.fillRect(0, 0, 4, 256);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}
const noise = (() => { const c = document.createElement('canvas'); c.width = c.height = 128; const g = c.getContext('2d'); const d = g.createImageData(128, 128);
  for (let i = 0; i < d.data.length; i += 4) { const v = 120 + Math.random() * 120; d.data[i] = d.data[i + 1] = d.data[i + 2] = v; d.data[i + 3] = 255; }
  g.putImageData(d, 0, 0); const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(9, 9); return t; })();
const toonGrad = (() => { const t = new THREE.DataTexture(new Uint8Array([90, 90, 90, 255, 170, 170, 170, 255, 255, 255, 255, 255]), 3, 1, THREE.RGBAFormat); t.minFilter = t.magFilter = THREE.NearestFilter; t.needsUpdate = true; return t; })();
const NEON = ['#00e5ff', '#ff2bd6', '#ffe24a', '#7cff6b'];
let neonI = 0;

function mk(color) {
  switch (CFG.mat) {
    case 'clay': return new THREE.MeshStandardMaterial({ color, roughness: 0.95, bumpMap: noise, bumpScale: 14, roughness: 1 });
    case 'flat': return new THREE.MeshStandardMaterial({ color, roughness: 0.9, flatShading: true });
    case 'basic': return new THREE.MeshBasicMaterial({ color });
    case 'toon': return new THREE.MeshToonMaterial({ color, gradientMap: toonGrad });
    case 'lego': return new THREE.MeshStandardMaterial({ color, roughness: 0.25, metalness: 0.0 });
    case 'neon': return new THREE.MeshStandardMaterial({ color: '#120a2a', roughness: 0.4, metalness: 0.3, flatShading: true, emissive: '#1a0b3a' });
    default: return new THREE.MeshStandardMaterial({ color, roughness: 0.7 });
  }
}
function add(parent, geo, color, x = 0, y = 0, z = 0, opt = {}) {
  const m = new THREE.Mesh(geo, mk(color)); m.position.set(x, y, z);
  if (opt.rot) m.rotation.set(...opt.rot); if (opt.scale) m.scale.set(...opt.scale);
  m.castShadow = true; m.receiveShadow = true; parent.add(m);
  if (CFG.outline) { const o = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ color: '#111', side: THREE.BackSide })); o.scale.setScalar(1.07); o.position.copy(m.position); o.rotation.copy(m.rotation); if (opt.scale) o.scale.multiply(new THREE.Vector3(...opt.scale)); parent.add(o); }
  if (CFG.mat === 'neon') { const e = new THREE.LineSegments(new THREE.EdgesGeometry(geo, 20), new THREE.LineBasicMaterial({ color: NEON[(neonI++) % 4], linewidth: 2 })); e.position.copy(m.position); e.rotation.copy(m.rotation); if (opt.scale) e.scale.set(...opt.scale); parent.add(e); }
  return m;
}
const K = CFG.kind;
const sph = r => K === 'poly' ? new THREE.IcosahedronGeometry(r, 1) : new THREE.SphereGeometry(r, 32, 24);
const cap = (r, h) => K === 'poly' ? new THREE.CylinderGeometry(r, r, h + 1.1 * r, 7) : new THREE.CapsuleGeometry(r, h, 8, 16);
const box = (w, h, d, r = 0.08) => K === 'smooth' ? new RoundedBoxGeometry(w, h, d, 4, r) : new THREE.BoxGeometry(w, h, d);
const cyl = (r, h, n = 24) => new THREE.CylinderGeometry(r, r, h, K === 'poly' ? 7 : n);

function buildSmooth(g) {
  // земля и дорога
  add(g, new THREE.BoxGeometry(CFG.high ? 12 : 30, 0.4, CFG.high ? 9 : 20), C.grass, 0, -0.2, 0);
  add(g, new THREE.BoxGeometry(CFG.high ? 12.02 : 30.02, 0.42, 2.2), C.road, 0, -0.19, 3.2);
  // дом
  const h = new THREE.Group(); h.position.set(-3.2, 0, -1.6); g.add(h);
  add(h, box(4, 2.6, 3.2, 0.1), C.wall, 0, 1.3, 0);
  const roof = new THREE.ConeGeometry(3.3, 1.7, 4); add(h, roof, C.roof, 0, 3.45, 0, { rot: [0, Math.PI / 4, 0], scale: [1, 1, 0.84] });
  add(h, box(0.8, 1.5, 0.12, 0.04), C.door, -0.8, 0.75, 1.62);
  add(h, box(0.9, 0.8, 0.1, 0.04), C.glass, 0.9, 1.5, 1.62);
  add(h, box(0.5, 1.0, 0.7, 0.04), C.roof, 1.2, 3.6, -0.3);
  // машина
  const c = new THREE.Group(); c.position.set(2.1, 0, 0.6); c.rotation.y = -0.45; g.add(c);
  add(c, box(3.3, 0.75, 1.5, 0.28), C.car, 0, 0.7, 0);
  add(c, box(1.8, 0.7, 1.35, 0.28), C.car, -0.1, 1.3, 0);
  add(c, box(1.45, 0.45, 1.38, 0.15), C.glass, -0.1, 1.33, 0);
  for (const [x, z] of [[-1.0, 0.75], [1.0, 0.75], [-1.0, -0.75], [1.0, -0.75]]) add(c, cyl(0.38, 0.22), C.dark, x, 0.38, z, { rot: [Math.PI / 2, 0, 0] });
  add(c, sph(0.14), '#ffe9a0', 1.62, 0.78, 0.5); add(c, sph(0.14), '#ffe9a0', 1.62, 0.78, -0.5);
  // деревья
  for (const [x, z, s] of [[4.6, -2.2, 1.1], [-6.4, 1.0, 0.9], [5.2, 1.5, 0.8]]) { if (CFG.high && Math.abs(x) > 5.5) continue; const t = new THREE.Group(); t.position.set(x, 0, z); g.add(t); add(t, cyl(0.2 * s, 1.0 * s), C.trunk, 0, 0.5 * s, 0); add(t, sph(0.9 * s), C.leaf, 0, 1.6 * s, 0); }
  // человек
  const m = new THREE.Group(); m.position.set(-0.9, 0, 2.0); m.rotation.y = 0.35; m.scale.setScalar(1.3); g.add(m);
  add(m, cap(0.16, 0.7), C.pants, -0.17, 0.5, 0); add(m, cap(0.16, 0.7), C.pants, 0.17, 0.5, 0);
  add(m, cap(0.36, 0.55), C.jacket, 0, 1.3, 0);
  add(m, cap(0.11, 0.55), C.jacket, -0.48, 1.3, 0.05, { rot: [0, 0, 0.25] });
  add(m, cap(0.11, 0.55), C.jacket, 0.5, 1.55, 0.05, { rot: [0, 0, -2.4] });
  add(m, sph(0.1), C.skin, 0.73, 1.93, 0.05);
  add(m, sph(0.33), C.skin, 0, 2.0, 0);
  add(m, new THREE.SphereGeometry(0.35, 24, 12, 0, Math.PI * 2, 0, Math.PI * 0.5), C.hair, 0, 2.06, -0.02);
  add(m, sph(0.045), C.dark, -0.12, 2.0, 0.3); add(m, sph(0.045), C.dark, 0.12, 2.0, 0.3);
}
function buildBlock(g) {
  const U = 0.3, lego = CFG.mat === 'lego';
  const vb = (parent, x, y, z, w, h, d, color) => { // в клетках, y — низ
    const m = add(parent, new THREE.BoxGeometry(w * U, h * U, d * U), color, (x + w / 2) * U, (y + h / 2) * U, (z + d / 2) * U);
    if (lego) for (let i = 0; i < w; i++) for (let k = 0; k < d; k++) { const s = new THREE.Mesh(new THREE.CylinderGeometry(U * 0.3, U * 0.3, U * 0.18, 12), mk(color)); s.position.set((x + i + 0.5) * U, (y + h) * U + U * 0.09, (z + k + 0.5) * U); s.castShadow = true; parent.add(s); }
    return m; };
  add(g, new THREE.BoxGeometry(14, 0.4, 9), lego ? '#4aa655' : C.grass, 0, -0.2, 0);
  add(g, new THREE.BoxGeometry(14.02, 0.42, 2.2), lego ? '#6b6e78' : C.road, 0, -0.19, 3.2);
  const h = new THREE.Group(); h.position.set(-6.2, 0, -3.4); g.add(h);
  vb(h, 0, 0, 0, 14, 8, 10, C.wall); vb(h, 2, 0, 10, 3, 5, 1, C.door); vb(h, 8, 3, 10, 4, 3, 1, C.glass);
  for (let i = 0; i < 5; i++) vb(h, -1 + i, 8 + i, -1 + i, 16 - 2 * i, 1, 12 - 2 * i, C.roof);
  const c = new THREE.Group(); c.position.set(0.6, 0, 0.4); c.rotation.y = -0.4; g.add(c);
  vb(c, 0, 1, 0, 9, 2, 4, C.car); vb(c, 2, 3, 0, 5, 2, 4, C.car); vb(c, 3, 3, 0, 3, 2, 4, C.glass);
  for (const [x, z] of [[1, -1], [6, -1], [1, 4], [6, 4]]) vb(c, x, 0, z, 2, 2, 1, C.dark);
  const t1 = new THREE.Group(); t1.position.set(4.6, 0, -2.6); g.add(t1); vb(t1, 0, 0, 0, 1, 3, 1, C.trunk); vb(t1, -1, 3, -1, 3, 3, 3, C.leaf);
  const m = new THREE.Group(); m.position.set(-3.4, 0, 3.0); m.rotation.y = 0.35; g.add(m);
  vb(m, 0, 0, 0, 1, 3, 1, C.pants); vb(m, 2, 0, 0, 1, 3, 1, C.pants); vb(m, -1, 3, -0.5, 4.5, 3, 2, C.jacket);
  vb(m, -2, 3, 0, 1, 3, 1, C.jacket); vb(m, 3.5, 4, 0, 1, 3, 1, C.jacket);
  vb(m, 0, 6, -0.3, 3, 2.6, 2.4, C.skin); vb(m, -0.1, 8.6, -0.4, 3.2, 0.8, 2.6, C.hair);
  vb(m, 0.5, 7, 2.1, 0.6, 0.6, 0.2, C.dark); vb(m, 2.0, 7, 2.1, 0.6, 0.6, 0.2, C.dark);
}
function buildPaper() {
  const g = new THREE.Group(); let z = 0;
  const ext = (shape, color, dz = 0.3, x = 0, y = 0) => { z += dz; const m = new THREE.Mesh(new THREE.ExtrudeGeometry(shape, { depth: 0.1, bevelEnabled: false }), new THREE.MeshStandardMaterial({ color, roughness: 1 })); m.position.set(x, y, z); m.castShadow = m.receiveShadow = true; g.add(m); return m; };
  const rect = (w, h) => new THREE.Shape().moveTo(-w / 2, -h / 2).lineTo(w / 2, -h / 2).lineTo(w / 2, h / 2).lineTo(-w / 2, h / 2).closePath();
  const circ = r => { const s = new THREE.Shape(); s.absarc(0, 0, r, 0, Math.PI * 2); return s; };
  const tri = (w, h) => new THREE.Shape().moveTo(-w / 2, 0).lineTo(w / 2, 0).lineTo(0, h).closePath();
  ext(rect(18, 10), '#ffd9a8', 0, 0, 0); ext(circ(1.2), '#fff2c2', 0.1, 4.5, 2.5);
  ext(circ(5), '#9ccf8a', 0.3, -5, -5.8); ext(circ(6), '#7fbf72', 0.3, 5.5, -6.3);
  ext(rect(18, 2.2), '#6d707a', 0.4, 0, -3.0);
  ext(rect(3.6, 2.6), C.wall, 0.4, -4.6, 0.0); ext(tri(4.4, 1.8), C.roof, 0.2, -4.6, 1.3); ext(rect(0.7, 1.4), C.door, 0.2, -5.2, -0.6); ext(rect(0.9, 0.8), C.glass, 0.2, -3.7, 0.2);
  ext(rect(3.4, 0.9), C.car, 0.6, 1.8, -1.9); ext(rect(1.8, 0.8), C.car, 0.2, 1.7, -1.2); ext(rect(1.3, 0.5), C.glass, 0.1, 1.7, -1.2);
  ext(circ(0.42), C.dark, 0.2, 0.9, -2.35); ext(circ(0.42), C.dark, 0, 2.7, -2.35);
  ext(rect(0.3, 1.2), C.trunk, 0.2, 5.8, -0.6); ext(circ(1.0), C.leaf, 0.1, 5.8, 0.4);
  ext(rect(0.35, 1.0), C.pants, 0.6, -0.6, -2.5); ext(rect(0.7, 1.1), C.jacket, 0.1, -0.6, -1.5); ext(circ(0.42), C.skin, 0.1, -0.6, -0.55); ext(rect(0.85, 0.3), C.hair, 0.05, -0.6, -0.25);
  scene.add(g);
}

// фон, свет, камера
let cam;
if (CFG.kind === 'paper') {
  scene.background = new THREE.Color('#ffe9c8'); cam = new THREE.OrthographicCamera(-8, 8, 4.5, -4.5, 0.1, 50); cam.position.set(0, 0, 12);
  scene.add(new THREE.AmbientLight('#fff', 0.85));
  const d = new THREE.DirectionalLight('#fff', 1.3); d.position.set(-2, 4, 16); d.castShadow = true; d.shadow.mapSize.set(2048, 2048);
  Object.assign(d.shadow.camera, { left: -10, right: 10, top: 6, bottom: -6, near: 1, far: 40 }); d.shadow.radius = 3; scene.add(d); buildPaper();
} else {
  cam = new THREE.PerspectiveCamera(CFG.high ? 38 : 40, W / H, 0.1, 100);
  if (CFG.high) cam.position.set(8.5, 8.5, 11); else cam.position.set(5.2, 3.4, 9.6);
  cam.lookAt(CFG.high ? 0 : -0.3, CFG.high ? 0.8 : 1.4, 0);
  if (CFG.dark) { scene.background = gradBg('#12062b', '#3b0a5e'); scene.fog = new THREE.Fog('#2a0a45', 14, 34); }
  else if (CFG.flatbg) scene.background = new THREE.Color('#bfe6ff');
  else scene.background = gradBg('#8fc9ff', '#ffe2b8');
  scene.add(new THREE.HemisphereLight(CFG.dark ? '#7a4cff' : '#ffffff', CFG.dark ? '#ff2bd6' : '#c9b58f', CFG.dark ? 1.1 : 0.9));
  const d = new THREE.DirectionalLight(CFG.dark ? '#9c7bff' : '#fff0d0', CFG.dark ? 0.8 : 2.0); d.position.set(-6, 9, 7); d.castShadow = true; d.shadow.mapSize.set(2048, 2048);
  Object.assign(d.shadow.camera, { left: -10, right: 10, top: 10, bottom: -6, near: 1, far: 40 }); d.shadow.radius = 4; d.shadow.bias = -0.0005; scene.add(d);
  const g = new THREE.Group(); scene.add(g);
  if (CFG.kind === 'block') buildBlock(g); else buildSmooth(g);
  if (CFG.mat === 'neon') { const grid = new THREE.GridHelper(30, 30, '#ff2bd6', '#6a1b9a'); grid.position.y = 0.01; scene.add(grid); }
}
renderer.render(scene, cam);
window.READY = true;
