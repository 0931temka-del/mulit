// make_hq.mjs - делает улучшенную копию сцены web/main_hq.js и web/index_hq.html из оригиналов (оригиналы не меняются).
// Улучшения: настоящие тени (солнце + две лампы), мягкий свет окружения (RoomEnvironment), чёткость по devicePixelRatio.
import fs from 'fs';
let src = fs.readFileSync('web/main.js', 'utf8');
const must = (name, from, to) => { if (!src.includes(from)) throw new Error('не нашёл фрагмент: ' + name); src = src.replace(from, to); };

must('import', "import * as THREE from 'three';",
  "import * as THREE from 'three';\nimport { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';");

must('renderer', "renderer.setPixelRatio(1); renderer.setSize(W, H);",
  "renderer.setPixelRatio(window.devicePixelRatio || 1); renderer.setSize(W, H);\nrenderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;");

must('ready', "seek(2); window.READY = true;",
`/* ---------- HQ: тени, свет окружения ---------- */
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
seek(2); window.READY = true;`);

fs.writeFileSync('web/main_hq.js', src);

let html = fs.readFileSync('web/index.html', 'utf8');
if (!html.includes('"three":"../node_modules/three/build/three.module.js"')) throw new Error('importmap не найден');
html = html.replace('{"imports":{"three":"../node_modules/three/build/three.module.js"}}', '{"imports":{"three":"../node_modules/three/build/three.module.js","three/addons/":"../node_modules/three/examples/jsm/"}}');
html = html.replace('src="main.js"', 'src="main_hq.js"');
fs.writeFileSync('web/index_hq.html', html);
console.log('OK: web/main_hq.js и web/index_hq.html созданы');

