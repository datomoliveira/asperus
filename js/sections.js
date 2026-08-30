// sections.js — Mini Three.js scenes para serviços, avatar e contato
import * as THREE from 'three';

/* ── Service icon scenes ── */
const SERVICE_COLORS = {
  web:     { primary: 0xC4A96B, accent: 0xE8E2D9 },
  arch:    { primary: 0xE24B4A, accent: 0xC4A96B },
  product: { primary: 0x6B9AC4, accent: 0xE8E2D9 },
  consult: { primary: 0x6BE2A4, accent: 0xC4A96B },
};

function makeServiceScene(canvas, type) {
  const W = canvas.clientWidth || 200, H = canvas.clientHeight || 120;
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setSize(W, H);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(45, W / H, 0.1, 50);
  camera.position.set(0, 0, 3.5);

  const col = SERVICE_COLORS[type] || SERVICE_COLORS.web;
  const mat = new THREE.MeshStandardMaterial({
    color: col.primary, roughness: 0.35, metalness: 0.7,
  });
  const wireMat = new THREE.MeshBasicMaterial({
    color: col.accent, wireframe: true, transparent: true, opacity: 0.25,
  });

  const geo = {
    web:     new THREE.TorusKnotGeometry(0.55, 0.18, 80, 10),
    arch:    new THREE.OctahedronGeometry(0.75, 0),
    product: new THREE.IcosahedronGeometry(0.7, 0),
    consult: new THREE.BoxGeometry(0.9, 0.9, 0.9),
  }[type] || new THREE.SphereGeometry(0.6, 16, 12);

  const mesh = new THREE.Mesh(geo, mat);
  const wire = new THREE.Mesh(geo.clone(), wireMat);
  scene.add(mesh, wire);

  scene.add(new THREE.AmbientLight(0xffffff, 0.4));
  const dLight = new THREE.DirectionalLight(0xC4A96B, 2.5);
  dLight.position.set(2, 3, 2);
  scene.add(dLight);

  let hovered = false;
  canvas.addEventListener('mouseenter', () => { hovered = true; });
  canvas.addEventListener('mouseleave', () => { hovered = false; });

  let frameId = null;
  let isVisible = false;

  const observer = new IntersectionObserver(([entry]) => {
    isVisible = entry.isIntersecting;
    if (isVisible && !frameId) {
      animate();
    } else if (!isVisible && frameId) {
      cancelAnimationFrame(frameId);
      frameId = null;
    }
  }, { threshold: 0.05 });
  observer.observe(canvas);

  function animate() {
    if (!isVisible) return;
    frameId = requestAnimationFrame(animate);
    const speed = hovered ? 0.025 : 0.008;
    mesh.rotation.y += speed;
    mesh.rotation.x += speed * 0.4;
    wire.rotation.y = mesh.rotation.y;
    wire.rotation.x = mesh.rotation.x;
    renderer.render(scene, camera);
  }

  return {
    destroy() {
      observer.disconnect();
      if (frameId) cancelAnimationFrame(frameId);
      renderer.dispose();
    }
  };
}

export function initServiceScenes() {
  const canvases = document.querySelectorAll('.service-canvas');
  const scenes = [];
  canvases.forEach(c => {
    const type = c.dataset.service;
    scenes.push(makeServiceScene(c, type));
  });
  return scenes;
}

/* ── About avatar (isometric low-poly) ── */
export function initAvatarScene() {
  const canvas = document.getElementById('avatar-canvas');
  if (!canvas) return null;

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  const W = canvas.clientWidth, H = canvas.clientHeight;
  renderer.setSize(W, H);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(35, W / H, 0.1, 100);
  camera.position.set(3.5, 4, 5);
  camera.lookAt(0, 1, 0);

  const bodyMat = new THREE.MeshStandardMaterial({ color: 0x1a1a1a, roughness: 0.8, metalness: 0.05, flatShading: true });
  const skinMat = new THREE.MeshStandardMaterial({ color: 0xc68642, roughness: 0.9, flatShading: true });
  const capMat  = new THREE.MeshStandardMaterial({ color: 0x0c0c0c, roughness: 0.9, flatShading: true });
  const accentMat = new THREE.MeshStandardMaterial({ color: 0xC4A96B, roughness: 0.4, metalness: 0.5, flatShading: true });
  const jeansMat = new THREE.MeshStandardMaterial({ color: 0x2a3a5a, roughness: 0.85, flatShading: true });

  const avatar = new THREE.Group();

  // Torso
  const torso = new THREE.Mesh(new THREE.BoxGeometry(1.2, 1.5, 0.65, 2, 3, 2), bodyMat);
  torso.position.y = 1.25;
  avatar.add(torso);

  // Neck
  const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.2, 0.3, 6), skinMat);
  neck.position.y = 2.15;
  avatar.add(neck);

  // Head Group (for independent head/cap tilting)
  const headGroup = new THREE.Group();
  headGroup.position.y = 2.75;

  const head = new THREE.Mesh(new THREE.BoxGeometry(0.82, 0.82, 0.72, 2, 2, 2), skinMat);
  headGroup.add(head);

  // Cap Crown (boné 3D detalhado)
  const capCrown = new THREE.Mesh(new THREE.SphereGeometry(0.54, 16, 12, 0, Math.PI*2, 0, Math.PI*0.58), capMat);
  capCrown.position.y = 0.36;
  headGroup.add(capCrown);

  // Cap Brim (aba do boné curvada)
  const brimGeo = new THREE.CylinderGeometry(0.72, 0.72, 0.05, 16, 1, false, -Math.PI*0.4, Math.PI*0.8);
  const capBrim = new THREE.Mesh(brimGeo, capMat);
  capBrim.position.set(0, 0.02, 0.36);
  capBrim.rotation.x = 0.12;
  headGroup.add(capBrim);

  // Cap Top Button (botão metálico superior do boné)
  const capButton = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.04, 12), accentMat);
  capButton.position.y = 0.88;
  headGroup.add(capButton);

  // Cap Front Emblem (Emblema Dourado ÁSPERUS na frente do boné)
  const emblemGeo = new THREE.BoxGeometry(0.24, 0.15, 0.04);
  const emblem = new THREE.Mesh(emblemGeo, accentMat);
  emblem.position.set(0, 0.38, 0.51);
  headGroup.add(emblem);

  // Eyes
  const eyeGeo = new THREE.SphereGeometry(0.06, 6, 4);
  const eyeMat = new THREE.MeshStandardMaterial({ color: 0x111111 });
  [-0.2, 0.2].forEach(x => {
    const eye = new THREE.Mesh(eyeGeo, eyeMat);
    eye.position.set(x, 0.02, 0.36);
    headGroup.add(eye);
  });

  avatar.add(headGroup);

  // Arms
  const armGeo = new THREE.BoxGeometry(0.32, 1.2, 0.32, 1, 3, 1);
  const leftArm = new THREE.Mesh(armGeo, bodyMat);
  leftArm.position.set(-0.8, 1.4, 0);
  leftArm.rotation.z = 0.15;
  avatar.add(leftArm);

  const rightArm = new THREE.Mesh(armGeo, bodyMat);
  rightArm.position.set(0.8, 1.4, 0);
  rightArm.rotation.z = -0.15;
  avatar.add(rightArm);

  // Legs
  const legGeo = new THREE.BoxGeometry(0.4, 1.3, 0.4, 1, 3, 1);
  [-0.3, 0.3].forEach(x => {
    const leg = new THREE.Mesh(legGeo, jeansMat);
    leg.position.set(x, 0.2, 0);
    avatar.add(leg);
  });

  // Detail: chain/necklace (accent)
  const chainGeo = new THREE.TorusGeometry(0.18, 0.015, 6, 16);
  const chain = new THREE.Mesh(chainGeo, accentMat);
  chain.position.set(0, 2.05, 0.3);
  chain.rotation.x = Math.PI / 2.5;
  avatar.add(chain);

  // Platform base (isometric floor)
  const floorGeo = new THREE.CylinderGeometry(1.6, 1.6, 0.12, 6);
  const floorMat = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.8, flatShading: true });
  const floor = new THREE.Mesh(floorGeo, floorMat);
  floor.position.y = -0.5;
  avatar.add(floor);

  scene.add(avatar);

  // Lights
  scene.add(new THREE.AmbientLight(0xE8E2D9, 0.6));
  const key = new THREE.DirectionalLight(0xC4A96B, 3);
  key.position.set(4, 8, 5);
  scene.add(key);
  const fill = new THREE.DirectionalLight(0x8090c0, 1.2);
  fill.position.set(-4, 2, 3);
  scene.add(fill);

  // Motion Design Mouse Interactivity
  let targetMouseX = 0, targetMouseY = 0;
  let currentMouseX = 0, currentMouseY = 0;

  function onMouseMove(e) {
    const rect = canvas.getBoundingClientRect();
    if (e.clientX >= rect.left && e.clientX <= rect.right && e.clientY >= rect.top && e.clientY <= rect.bottom) {
      targetMouseX = ((e.clientX - rect.left) / rect.width - 0.5) * 2;
      targetMouseY = ((e.clientY - rect.top) / rect.height - 0.5) * 2;
    } else {
      targetMouseX = 0;
      targetMouseY = 0;
    }
  }
  window.addEventListener('mousemove', onMouseMove);

  let frameId = null, t = 0;
  let isVisible = false;

  const observer = new IntersectionObserver(([entry]) => {
    isVisible = entry.isIntersecting;
    if (isVisible && !frameId) {
      animate();
    } else if (!isVisible && frameId) {
      cancelAnimationFrame(frameId);
      frameId = null;
    }
  }, { threshold: 0.05 });
  observer.observe(canvas);

  function animate() {
    if (!isVisible) return;
    frameId = requestAnimationFrame(animate);
    t += 0.02;

    // Smooth motion design interpolation
    currentMouseX += (targetMouseX - currentMouseX) * 0.08;
    currentMouseY += (targetMouseY - currentMouseY) * 0.08;

    // Breathing motion float
    avatar.position.y = Math.sin(t * 1.2) * 0.08;

    // Avatar body rotation + mouse reactivity
    avatar.rotation.y = Math.sin(t * 0.4) * 0.15 + currentMouseX * 0.45;
    avatar.rotation.x = currentMouseY * 0.2;

    // Head / Cap tilt anticipation & follow-through
    headGroup.rotation.y = currentMouseX * 0.3;
    headGroup.rotation.x = -currentMouseY * 0.2 + Math.sin(t * 1.5) * 0.03;

    // Arm swaying
    rightArm.rotation.z = -0.15 + Math.sin(t * 1.2) * 0.05;
    leftArm.rotation.z = 0.15 - Math.sin(t * 1.2) * 0.05;

    renderer.render(scene, camera);
  }

  return {
    destroy() {
      observer.disconnect();
      if (frameId) cancelAnimationFrame(frameId);
      window.removeEventListener('mousemove', onMouseMove);
      renderer.dispose();
    }
  };
}

/* ── Contact wireframe logo scene ── */
export function initContactScene() {
  const canvas = document.getElementById('contact-canvas');
  if (!canvas) return null;

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 100);
  camera.position.set(0, 0, 6);

  // Large wireframe "Á" shape (simplified as abstract geometry)
  const wireMat = new THREE.MeshBasicMaterial({ color: 0xC4A96B, wireframe: true, transparent: true, opacity: 0.15 });
  const geo = new THREE.TorusKnotGeometry(1.8, 0.5, 120, 20);
  const mesh = new THREE.Mesh(geo, wireMat);
  scene.add(mesh);

  // Secondary ring
  const ring = new THREE.Mesh(
    new THREE.TorusGeometry(3, 0.02, 6, 64),
    new THREE.MeshBasicMaterial({ color: 0xC4A96B, transparent: true, opacity: 0.1 })
  );
  scene.add(ring);

  let frameId = null;
  let isVisible = false;

  const observer = new IntersectionObserver(([entry]) => {
    isVisible = entry.isIntersecting;
    if (isVisible && !frameId) {
      animate();
    } else if (!isVisible && frameId) {
      cancelAnimationFrame(frameId);
      frameId = null;
    }
  }, { threshold: 0.05 });
  observer.observe(canvas);

  function animate() {
    if (!isVisible) return;
    frameId = requestAnimationFrame(animate);
    mesh.rotation.y += 0.003;
    mesh.rotation.x += 0.001;
    ring.rotation.x += 0.002;
    renderer.render(scene, camera);
  }

  window.addEventListener('resize', () => {
    renderer.setSize(window.innerWidth, window.innerHeight);
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
  });

  return { destroy() { observer.disconnect(); if (frameId) cancelAnimationFrame(frameId); renderer.dispose(); } };
}
