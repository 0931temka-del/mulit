// Процедурные горы на закате (всё кодом): шум высот, цвет по высоте и склону, туман, небо. ?t=0..1 двигает камеру и солнце.
import * as THREE from 'three';
import { ImprovedNoise } from 'three/addons/math/ImprovedNoise.js';
import { Sky } from 'three/addons/objects/Sky.js';
const Q = new URLSearchParams(location.search); const W = +(Q.get('w') || 720), H = +(Q.get('h') || 1280); const T = +(Q.get('t') || 0.3);
const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true }); renderer.setSize(W, H); renderer.setPixelRatio(1);
renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 0.85; renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap; renderer.outputColorSpace = THREE.SRGBColorSpace; document.body.appendChild(renderer.domElement);
const scene = new THREE.Scene(); const cam = new THREE.PerspectiveCamera(48, W / H, 0.5, 2000);
const sunDir = new THREE.Vector3().setFromSphericalCoords(1, THREE.MathUtils.degToRad(90 - (11 + 6 * (1 - T))), THREE.MathUtils.degToRad(110));
const sky = new Sky(); sky.scale.setScalar(1500); scene.add(sky);
const u = sky.material.uniforms; u.turbidity.value = 6; u.rayleigh.value = 2.2; u.mieCoefficient.value = 0.006; u.mieDirectionalG.value = 0.9; u.sunPosition.value.copy(sunDir);
scene.fog = new THREE.FogExp2(0xe6b99a, 0.0026);
const hemi = new THREE.HemisphereLight(0xb7c8ff, 0x8a6a50, 1.7); scene.add(hemi);
const sun = new THREE.DirectionalLight(0xffb070, 3.4); sun.position.copy(sunDir.clone().multiplyScalar(300)); sun.castShadow = true; sun.shadow.mapSize.set(4096, 4096); Object.assign(sun.shadow.camera, { left: -380, right: 380, top: 380, bottom: -380, near: 1, far: 900 }); sun.shadow.bias = -0.0004; scene.add(sun);
// высоты
const N = new ImprovedNoise(); const SEG = 420, SIZE = 700; const geo = new THREE.PlaneGeometry(SIZE, SIZE, SEG, SEG); geo.rotateX(-Math.PI / 2);
const pos = geo.attributes.position; const heights = new Float32Array(pos.count);
function fbm(x, z) { let a = 1, f = 0.006, s = 0, w = 0; const wx = x + 40 * N.noise(x * 0.01, 1.3, z * 0.01), wz = z + 40 * N.noise(x * 0.01, 7.7, z * 0.01); for (let o = 0; o < 10; o++) { const n = 1 - Math.abs(N.noise(wx * f + 11.3, 3.7, wz * f + 5.1)); s += Math.pow(n, 2.6) * a; w += a; a *= 0.52; f *= 2.1; } return s / w; }
for (let i = 0; i < pos.count; i++) { const x = pos.getX(i), z = pos.getZ(i); const m = THREE.MathUtils.smoothstep(-z, 150, 330); const base = fbm(x, z) * 260 * (0.10 + 0.90 * m) + 0.8 * N.noise(x * 0.04, 0, z * 0.04) * (1 - m * 0.6); pos.setY(i, base); heights[i] = base; }
geo.computeVertexNormals(); const nrm = geo.attributes.normal; const col = new Float32Array(pos.count * 3); const c = new THREE.Color();
for (let i = 0; i < pos.count; i++) { const h = heights[i], slope = 1 - nrm.getY(i), x = pos.getX(i), z = pos.getZ(i);
  const grain = 0.72 + 0.5 * N.noise(x * 0.9, h * 0.35, z * 0.9);
  c.set('#5c4b3d').lerp(new THREE.Color('#2f332b'), THREE.MathUtils.smoothstep(h, 0, 25) * 0.7);       // скала/лес
  c.lerp(new THREE.Color('#3b2f29'), THREE.MathUtils.smoothstep(slope, 0.25, 0.6));                      // крутые склоны темнее
  const snow = THREE.MathUtils.smoothstep(h + 12 * N.noise(x * 0.06, 5, z * 0.06), 46, 66) * (1 - THREE.MathUtils.smoothstep(slope, 0.42, 0.7));
  c.lerp(new THREE.Color('#f4efe9'), snow); c.multiplyScalar(grain); col[i * 3] = c.r; col[i * 3 + 1] = c.g; col[i * 3 + 2] = c.b; }
geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
{ const mesh = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.95, metalness: 0 })); mesh.castShadow = true; mesh.receiveShadow = true; scene.add(mesh); }
// камера
const k = T; cam.position.set(THREE.MathUtils.lerp(-40, 30, k), THREE.MathUtils.lerp(55, 66, k), THREE.MathUtils.lerp(70, 40, k)); cam.lookAt(THREE.MathUtils.lerp(10, -10, k), 70, -170);
renderer.render(scene, cam); window.READY = true;
