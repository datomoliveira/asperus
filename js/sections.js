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
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

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

  let frameId;
  function animate() {
    frameId = requestAnimationFrame(animate);
    const speed = hovered ? 0.025 : 0.008;
    mesh.rotation.y += speed;
    mesh.rotation.x += speed * 0.4;
    wire.rotation.y = mesh.rotation.y;
    wire.rotation.x = mesh.rotation.x;
    renderer.render(scene, camera);
  }
  animate();
  return { destroy() { cancelAnimationFrame(frameId); renderer.dispose(); } };
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
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

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

  // Head
  const head = new THREE.Mesh(new THREE.BoxGeometry(0.82, 0.82, 0.72, 2, 2, 2), skinMat);
  head.position.y = 2.75;
  avatar.add(head);

  // Cap crown (boné)
  const capCrown = new THREE.Mesh(new THREE.SphereGeometry(0.52, 8, 6, 0, Math.PI*2, 0, Math.PI*0.55), capMat);
  capCrown.position.y = 3.12;
  avatar.add(capCrown);

  // Cap brim
  const brimGeo = new THREE.CylinderGeometry(0.68, 0.68, 0.06, 12, 1, false, -Math.PI*0.35, Math.PI*0.7);
  const capBrim = new THREE.Mesh(brimGeo, capMat);
  capBrim.position.set(0, 2.75, 0.35);
  avatar.add(capBrim);

  // Eyes
  const eyeGeo = new THREE.SphereGeometry(0.06, 6, 4);
  const eyeMat = new THREE.MeshStandardMaterial({ color: 0x111111 });
  [-0.2, 0.2].forEach(x => {
    const eye = new THREE.Mesh(eyeGeo, eyeMat);
    eye.position.set(x, 2.76, 0.36);
    avatar.add(eye);
  });

  // Arms
  const armGeo = new THREE.BoxGeometry(0.32, 1.2, 0.32, 1, 3, 1);
  [-0.8, 0.8].forEach(x => {
    const arm = new THREE.Mesh(armGeo, bodyMat);
    arm.position.set(x, 1.4, 0);
    arm.rotation.z = x > 0 ? -0.15 : 0.15;
    avatar.add(arm);
  });

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
  scene.add(new THREE.AmbientLight(0xE8E2D9, 0.5));
  const key = new THREE.DirectionalLight(0xffd9a0, 3);
  key.position.set(4, 8, 5);
  scene.add(key);
  const fill = new THREE.DirectionalLight(0x8090c0, 0.8);
  fill.position.set(-4, 2, 3);
  scene.add(fill);

  let frameId, t = 0;
  function animate() {
    frameId = requestAnimationFrame(animate);
    t += 0.005;
    avatar.rotation.y = Math.sin(t * 0.4) * 0.2;
    renderer.render(scene, camera);
  }
  animate();
  return { destroy() { cancelAnimationFrame(frameId); renderer.dispose(); } };
}

/* ── Contact wireframe logo scene ── */
export function initContactScene() {
  const canvas = document.getElementById('contact-canvas');
  if (!canvas) return null;

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

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

  let frameId;
  function animate() {
    frameId = requestAnimationFrame(animate);
    mesh.rotation.y += 0.003;
    mesh.rotation.x += 0.001;
    ring.rotation.x += 0.002;
    renderer.render(scene, camera);
  }
  animate();

  window.addEventListener('resize', () => {
    renderer.setSize(window.innerWidth, window.innerHeight);
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
  });

  return { destroy() { cancelAnimationFrame(frameId); renderer.dispose(); } };
}
