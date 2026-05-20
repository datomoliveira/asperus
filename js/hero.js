// hero.js — Cena hero robusta, sem dependências de addons que falham silenciosamente
import * as THREE from 'three';
import { buildCap } from './cap.js';

export function initHeroScene() {
  const canvas = document.getElementById('hero-canvas');
  const container = document.getElementById('hero-right');
  if (!canvas || !container) return null;

  /* ── Renderer ── */
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.6;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.setClearColor(0x000000, 0); // transparente

  /* ── Scene ── */
  const scene = new THREE.Scene();

  /* ── Camera ── */
  const camera = new THREE.PerspectiveCamera(40, 1, 0.1, 100);
  camera.position.set(0, 0.5, 5);
  camera.lookAt(0, 0.2, 0);

  /* ── Luzes — dramáticas como na foto do boné ── */
  // Ambient mínimo (não achatar shape)
  scene.add(new THREE.AmbientLight(0xffffff, 0.12));

  // Key light: topo-direita, quente — principal revelador de textura
  const keyLight = new THREE.SpotLight(0xffd9b0, 18, 30, Math.PI / 5, 0.35, 1.2);
  keyLight.position.set(3.5, 6, 3);
  keyLight.castShadow = true;
  keyLight.shadow.mapSize.set(2048, 2048);
  scene.add(keyLight);
  scene.add(keyLight.target);

  // Fill suave da esquerda (cool tint)
  const fillLight = new THREE.DirectionalLight(0xa0c0e8, 1.2);
  fillLight.position.set(-5, 2, 2);
  scene.add(fillLight);

  // Rim light atrás — define silhueta
  const rimLight = new THREE.DirectionalLight(0xC4A96B, 1.5);
  rimLight.position.set(0, -1, -5);
  scene.add(rimLight);

  // Extra: bounce light embaixo (simula reflexo do chão escuro)
  const bounceLight = new THREE.PointLight(0x302010, 3, 8);
  bounceLight.position.set(0, -2.5, 1.5);
  scene.add(bounceLight);

  /* ── Cap ── */
  let cap;
  try {
    cap = buildCap();
    scene.add(cap);
  } catch (e) {
    console.error('[ÁSPERUS] Erro ao construir boné:', e);
    return null;
  }

  /* ── Entrada: cai de cima com bounce ── */
  cap.position.y = 8;
  cap.rotation.x = -0.5;

  /* ── Partículas (fundo) ── */
  const count = 1800;
  const pos = new Float32Array(count * 3);
  const vel = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    pos[i*3]   = (Math.random() - 0.5) * 20;
    pos[i*3+1] = (Math.random() - 0.5) * 20;
    pos[i*3+2] = (Math.random() - 0.5) * 15;
    vel[i*3]   = (Math.random() - 0.5) * 0.003;
    vel[i*3+1] = (Math.random() - 0.5) * 0.001;
    vel[i*3+2] = (Math.random() - 0.5) * 0.002;
  }
  const pGeo = new THREE.BufferGeometry();
  pGeo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const pMat = new THREE.PointsMaterial({
    color: 0xC4A96B, size: 0.025,
    transparent: true, opacity: 0.5, sizeAttenuation: true,
  });
  scene.add(new THREE.Points(pGeo, pMat));

  /* ── Resize ── */
  function resize() {
    const w = container.offsetWidth  || window.innerWidth  * 0.55;
    const h = container.offsetHeight || window.innerHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }
  resize();

  const ro = new ResizeObserver(resize);
  ro.observe(container);
  window.addEventListener('resize', resize);

  /* ── Mouse ── */
  let tRotX = 0, tRotY = 0, cRotX = 0, cRotY = 0;
  const MAX_H = THREE.MathUtils.degToRad(20);
  const MAX_V = THREE.MathUtils.degToRad(10);

  window.addEventListener('mousemove', (e) => {
    const rect = container.getBoundingClientRect();
    const nx = ((e.clientX - rect.left) / rect.width  - 0.5) * 2;
    const ny = ((e.clientY - rect.top)  / rect.height - 0.5) * 2;
    tRotY =  nx * MAX_H;
    tRotX = -ny * MAX_V;
  });

  window.addEventListener('touchmove', (e) => {
    const t = e.touches[0];
    const rect = container.getBoundingClientRect();
    tRotY = ((t.clientX - rect.left) / rect.width  - 0.5) * MAX_H * 2;
    tRotX = -((t.clientY - rect.top) / rect.height - 0.5) * MAX_V * 2;
  }, { passive: true });

  /* ── Logo hover ── */
  const raycaster = new THREE.Raycaster();
  const ptr = new THREE.Vector2(-99, -99);
  const logo = cap.getObjectByName('logo');
  let logoScale = 1;

  window.addEventListener('mousemove', (e) => {
    const rect = container.getBoundingClientRect();
    ptr.x = ((e.clientX - rect.left) / rect.width)  * 2 - 1;
    ptr.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
  });

  /* ── Scroll flip ── */
  let scrollProg = 0, flipped = false;
  window.addEventListener('scroll', () => {
    const hero = document.getElementById('hero');
    if (!hero) return;
    scrollProg = Math.max(0, Math.min(1, -hero.getBoundingClientRect().top / hero.offsetHeight));
  });

  /* ── Loop ── */
  let frameId;
  let entranceT = 0, entranceDone = false;
  const clock = new THREE.Clock();
  let flipAngle = 0;

  function animate() {
    frameId = requestAnimationFrame(animate);
    const dt = clock.getDelta();
    const elapsed = clock.getElapsedTime();

    /* Entrada bounce */
    if (!entranceDone) {
      entranceT = Math.min(entranceT + dt * 1.3, 1);
      const eased = 1 - Math.pow(1 - entranceT, 4);
      const bounce = entranceT > 0.75 ? Math.sin((entranceT - 0.75) / 0.25 * Math.PI) * 0.12 * (1 - entranceT) : 0;
      cap.position.y = 8 * (1 - eased) - bounce;
      cap.rotation.x = -0.5 * (1 - eased) + (-0.05);
      if (entranceT >= 1) { cap.position.y = 0; entranceDone = true; }
    }

    /* Rotação por mouse */
    cRotX += (tRotX - cRotX) * 0.05;
    cRotY += (tRotY - cRotY) * 0.05;

    if (!flipped && entranceDone) {
      cap.rotation.y = -0.35 + cRotY + Math.sin(elapsed * 0.25) * 0.015;
      cap.rotation.x = -0.05 + cRotX + Math.sin(elapsed * 0.18) * 0.008;
      cap.rotation.z = 0.03 + Math.sin(elapsed * 0.12) * 0.005;
    }

    /* Scroll flip 360° */
    if (scrollProg > 0.35 && !flipped) {
      flipped = true;
      let t = 0;
      const iv = setInterval(() => {
        t += 0.025;
        cap.rotation.y += 0.18;
        cap.position.y -= 0.06;
        if (t >= 1.2) { clearInterval(iv); cap.visible = false; }
      }, 16);
    }

    /* Partículas drift */
    const pa = pGeo.attributes.position.array;
    for (let i = 0; i < count; i++) {
      pa[i*3]   += vel[i*3];
      pa[i*3+1] += vel[i*3+1];
      pa[i*3+2] += vel[i*3+2];
      if (Math.abs(pa[i*3])   > 10) vel[i*3]   *= -1;
      if (Math.abs(pa[i*3+1]) > 10) vel[i*3+1] *= -1;
      if (Math.abs(pa[i*3+2]) > 7.5) vel[i*3+2] *= -1;
    }
    pGeo.attributes.position.needsUpdate = true;

    /* Logo hover scale */
    if (logo) {
      raycaster.setFromCamera(ptr, camera);
      const hits = raycaster.intersectObject(logo);
      logoScale += ((hits.length ? 1.03 : 1.0) - logoScale) * 0.1;
      logo.scale.setScalar(logoScale);
    }

    renderer.render(scene, camera);
  }

  animate();
  return { destroy() { cancelAnimationFrame(frameId); ro.disconnect(); renderer.dispose(); } };
}

/* ── Loader ── */
export function initLoaderScene() {
  const canvas = document.getElementById('loader-canvas');
  if (!canvas) return null;

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setSize(200, 200);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 50);
  camera.position.set(0, 0.5, 4.5);

  const mat = new THREE.MeshBasicMaterial({ color: 0xC4A96B, wireframe: true, transparent: true, opacity: 0.7 });
  const crown = new THREE.Mesh(new THREE.SphereGeometry(1, 10, 7, 0, Math.PI*2, 0, Math.PI*0.55), mat);
  crown.position.y = 0.06;
  scene.add(crown);
  scene.add(new THREE.Mesh(new THREE.CylinderGeometry(1,1,0.12,10), mat));

  let scale = 0.1, growing = true, frameId;
  function loop() {
    frameId = requestAnimationFrame(loop);
    if (growing) { scale += 0.015; if (scale >= 1) { scale = 1; growing = false; } }
    crown.scale.setScalar(scale);
    crown.rotation.y += 0.03;
    renderer.render(scene, camera);
  }
  loop();
  return { destroy() { cancelAnimationFrame(frameId); renderer.dispose(); } };
}

/* ── Footer easter egg ── */
export function initFooterCapScene() {
  const canvas = document.getElementById('footer-cap-canvas');
  if (!canvas) return null;

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setSize(150, 150);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 50);
  camera.position.set(0, 0.5, 5);

  let cap;
  try { cap = buildCap(); } catch(e) { return null; }
  cap.scale.setScalar(0.65);
  scene.add(cap);

  scene.add(new THREE.AmbientLight(0xffffff, 0.4));
  const l = new THREE.DirectionalLight(0xC4A96B, 4);
  l.position.set(2, 4, 3);
  scene.add(l);

  let frameId, spinning = false;
  function loop() {
    frameId = requestAnimationFrame(loop);
    if (spinning) cap.rotation.y += 0.05;
    renderer.render(scene, camera);
  }
  loop();
  return {
    startSpin() { spinning = true; setTimeout(() => { spinning = false; }, 2200); },
    destroy() { cancelAnimationFrame(frameId); renderer.dispose(); }
  };
}
