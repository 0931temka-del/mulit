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
  try { const l = B.userData.lampL; shadowOn(l, 1024, -0.0008, 0.04); l.shadow.camera.near = 0.3; l.shadow.camera.far = 30; } catch (e) { console.warn('lampL', e.message); }
  try { const l = kit.lamp; shadowOn(l, 1024, -0.0008, 0.04); l.shadow.camera.near = 0.3; l.shadow.camera.far = 30; } catch (e) { console.warn('kit.lamp', e.message); }
  try { chars.forEach(c => { if (c.shadow) c.shadow.material.opacity = 0.1; }); } catch (e) { console.warn('chars', e.message); }
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
