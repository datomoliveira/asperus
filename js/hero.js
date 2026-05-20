// hero.js — Hero Three.js scene com boné 3D interativo
import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { buildCap } from './cap.js';

export function initHeroScene() {
  const canvas = document.getElementById('hero-canvas');
  const container = document.getElementById('hero-right');
  if (!canvas || !container) return null;

  /* ── Renderer ── */
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.2;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  /* ── Scene ── */
  const scene = new THREE.Scene();

  /* ── Camera ── */
  const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
  camera.position.set(0, 0.3, 4.5);

  /* ── Lights ── */
  // Minimal ambient
  const ambient = new THREE.AmbientLight(0xE8E2D9, 0.18);
  scene.add(ambient);

  // Dramatic spotlight top-right (warm)
  const spot = new THREE.SpotLight(0xffd9a0, 6, 20, Math.PI / 6, 0.4, 1.5);
  spot.position.set(3, 6, 3);
  spot.castShadow = true;
  spot.shadow.mapSize.set(1024, 1024);
  scene.add(spot);
  scene.add(spot.target);

  // Soft fill from left (cool tint)
  const fill = new THREE.DirectionalLight(0x8090c0, 0.4);
  fill.position.set(-4, 2, 2);
  scene.add(fill);

  // Rim light (behind, defines silhouette)
  const rim = new THREE.DirectionalLight(0xC4A96B, 0.6);
  rim.position.set(0, -2, -4);
  scene.add(rim);

  /* ── Cap ── */
  const cap = buildCap();
  scene.add(cap);

  /* ── Entrance animation state ── */
  cap.position.y = 6;
  cap.rotation.x = -0.4;

  /* ── Particles ── */
  const particleGeo = new THREE.BufferGeometry();
  const count = 2000;
  const pos = new Float32Array(count * 3);
  const vel = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    pos[i*3]   = (Math.random() - 0.5) * 22;
    pos[i*3+1] = (Math.random() - 0.5) * 22;
    pos[i*3+2] = (Math.random() - 0.5) * 22;
    vel[i*3]   = (Math.random() - 0.5) * 0.002;
    vel[i*3+1] = (Math.random() - 0.5) * 0.001;
    vel[i*3+2] = (Math.random() - 0.5) * 0.002;
  }
  particleGeo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const particleMat = new THREE.PointsMaterial({
    color: 0xC4A96B, size: 0.02,
    transparent: true, opacity: 0.45, sizeAttenuation: true,
  });
  const particles = new THREE.Points(particleGeo, particleMat);
  scene.add(particles);

  /* ── Post-processing (Bloom) ── */
  const composer = new EffectComposer(renderer);
  composer.addPass(new RenderPass(scene, camera));
  const bloom = new UnrealBloomPass(
    new THREE.Vector2(window.innerWidth, window.innerHeight),
    0.35, 0.4, 0.9
  );
  composer.addPass(bloom);

  /* ── Resize ── */
  function resize() {
    const w = container.clientWidth;
    const h = container.clientHeight;
    renderer.setSize(w, h);
    composer.setSize(w, h);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }
  resize();
  window.addEventListener('resize', resize);

  /* ── Mouse interaction ── */
  let targetRotX = 0, targetRotY = 0;
  let currentRotX = 0, currentRotY = 0;
  const MAX_H = THREE.MathUtils.degToRad(20);
  const MAX_V = THREE.MathUtils.degToRad(10);

  function onMouseMove(e) {
    const rect = container.getBoundingClientRect();
    const nx = ((e.clientX - rect.left) / rect.width  - 0.5) * 2;
    const ny = ((e.clientY - rect.top)  / rect.height - 0.5) * 2;
    targetRotY =  nx * MAX_H;
    targetRotX = -ny * MAX_V;
  }

  // Touch support
  function onTouchMove(e) {
    const t = e.touches[0];
    onMouseMove({ clientX: t.clientX, clientY: t.clientY });
  }

  container.addEventListener('mousemove', onMouseMove);
  container.addEventListener('touchmove', onTouchMove, { passive: true });

  /* ── Logo hover pulse ── */
  const raycaster = new THREE.Raycaster();
  const pointer = new THREE.Vector2();
  const logoMesh = cap.getObjectByName('logo');
  let logoScale = 1;

  container.addEventListener('mousemove', (e) => {
    const rect = container.getBoundingClientRect();
    pointer.x = ((e.clientX - rect.left) / rect.width)  * 2 - 1;
    pointer.y = -((e.clientY - rect.top)  / rect.height) * 2 + 1;
  });

  /* ── Scroll flip ── */
  let scrollProgress = 0;
  let hasFlipped = false;
  window.addEventListener('scroll', () => {
    const hero = document.getElementById('hero');
    if (!hero) return;
    const rect = hero.getBoundingClientRect();
    scrollProgress = Math.max(0, Math.min(1, -rect.top / rect.height));
  });

  /* ── Entrance bounce (GSAP fallback with THREE) ── */
  let entranceDone = false;
  let entranceT = 0;

  /* ── Animation loop ── */
  let frameId;
  const clock = new THREE.Clock();

  function animate() {
    frameId = requestAnimationFrame(animate);
    const delta = clock.getDelta();
    const elapsed = clock.getElapsedTime();

    /* Entrance drop */
    if (!entranceDone) {
      entranceT += delta * 1.4;
      const t = Math.min(entranceT, 1);
      const eased = 1 - Math.pow(1 - t, 3); // ease-out cubic
      const bounce = t > 0.7 ? Math.sin((t - 0.7) / 0.3 * Math.PI) * 0.08 * (1 - t) : 0;
      cap.position.y = 6 * (1 - eased) - bounce;
      if (t >= 1) { cap.position.y = 0; entranceDone = true; }
    }

    /* Lerp rotation from mouse */
    currentRotY += (targetRotY - currentRotY) * 0.05;
    currentRotX += (targetRotX - currentRotX) * 0.05;

    if (!hasFlipped) {
      cap.rotation.y = currentRotY + Math.sin(elapsed * 0.3) * 0.02;
      cap.rotation.x = -0.06 + currentRotX + Math.sin(elapsed * 0.2) * 0.01;
    }

    /* Scroll flip */
    if (scrollProgress > 0.3 && !hasFlipped) {
      hasFlipped = true;
      // Animate 360° flip
      const startY = cap.rotation.y;
      let t = 0;
      const flipInterval = setInterval(() => {
        t += 0.03;
        cap.rotation.y = startY + t * Math.PI * 2;
        cap.position.y -= 0.08;
        cap.material && (cap.material.opacity = 1 - t / 1.2);
        if (t >= 1.2) {
          clearInterval(flipInterval);
          cap.visible = false;
        }
      }, 16);
    }

    /* Particle drift */
    const positions = particleGeo.attributes.position.array;
    for (let i = 0; i < count; i++) {
      positions[i*3]   += vel[i*3];
      positions[i*3+1] += vel[i*3+1];
      positions[i*3+2] += vel[i*3+2];
      // Wrap around
      if (Math.abs(positions[i*3])   > 11) vel[i*3]   *= -1;
      if (Math.abs(positions[i*3+1]) > 11) vel[i*3+1] *= -1;
      if (Math.abs(positions[i*3+2]) > 11) vel[i*3+2] *= -1;
    }
    particleGeo.attributes.position.needsUpdate = true;

    /* Logo hover check */
    if (logoMesh) {
      raycaster.setFromCamera(pointer, camera);
      const hits = raycaster.intersectObject(logoMesh);
      const targetScale = hits.length > 0 ? 1.02 : 1.0;
      logoScale += (targetScale - logoScale) * 0.1;
      logoMesh.scale.setScalar(logoScale);
    }

    composer.render();
  }

  animate();

  return { destroy() { cancelAnimationFrame(frameId); renderer.dispose(); } };
}

/* ── Loader wireframe scene ── */
export function initLoaderScene() {
  const canvas = document.getElementById('loader-canvas');
  if (!canvas) return null;

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setSize(200, 200);
  renderer.setPixelRatio(window.devicePixelRatio);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
  camera.position.set(0, 0.5, 4);

  const wireMat = new THREE.MeshBasicMaterial({
    color: 0xC4A96B, wireframe: true, transparent: true, opacity: 0.6,
  });

  // Simple wireframe cap shapes
  const wCrown = new THREE.Mesh(new THREE.SphereGeometry(1, 12, 8, 0, Math.PI*2, 0, Math.PI*0.5), wireMat);
  wCrown.position.y = 0.05;
  scene.add(wCrown);

  const wBase = new THREE.Mesh(new THREE.CylinderGeometry(1,1,0.1,16), wireMat);
  scene.add(wBase);

  let frameId;
  let t = 0;
  function loop() {
    frameId = requestAnimationFrame(loop);
    t += 0.015;
    wCrown.rotation.y = t;
    wBase.rotation.y = t;
    wCrown.scale.setScalar(0.3 + t * 0.3 > 1 ? 1 : 0.3 + t * 0.3);
    renderer.render(scene, camera);
  }
  loop();
  return { destroy() { cancelAnimationFrame(frameId); renderer.dispose(); } };
}

/* ── Footer easter egg scene ── */
export function initFooterCapScene() {
  const canvas = document.getElementById('footer-cap-canvas');
  if (!canvas) return null;

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setSize(150, 150);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
  camera.position.set(0, 0.5, 4.5);

  const cap = buildCap();
  cap.scale.setScalar(0.7);
  scene.add(cap);

  const light = new THREE.DirectionalLight(0xC4A96B, 3);
  light.position.set(2, 3, 2);
  scene.add(light);
  scene.add(new THREE.AmbientLight(0xffffff, 0.3));

  let frameId, spin = false;
  function loop() {
    frameId = requestAnimationFrame(loop);
    if (spin) cap.rotation.y += 0.04;
    renderer.render(scene, camera);
  }
  loop();
  return {
    startSpin() { spin = true; setTimeout(() => { spin = false; }, 2000); },
    destroy() { cancelAnimationFrame(frameId); renderer.dispose(); }
  };
}
