// hero.js — Cena hero robusta, sem dependências de addons que falham silenciosamente
import * as THREE from 'three';
import { buildCap } from './cap.js';

export function initHeroScene() {
  const video = document.getElementById('hero-video');
  const placeholder = document.getElementById('hero-placeholder');
  if (!video || !placeholder) return null;

  let playCount = 0;
  const maxPlays = 3;

  function onVideoEnded() {
    playCount++;
    if (playCount < maxPlays) {
      video.currentTime = 0;
      video.play().catch(err => console.warn("Video replay failed:", err));
    }
  }

  function onVideoReady() {
    video.play().then(() => {
      video.classList.add('active');
      placeholder.classList.remove('active');
    }).catch(err => {
      console.warn("Video play failed:", err);
      video.classList.add('active');
      placeholder.classList.remove('active');
    });
  }

  video.addEventListener('ended', onVideoEnded);

  if (video.readyState >= 3) {
    onVideoReady();
  } else {
    video.addEventListener('canplay', onVideoReady, { once: true });
    video.addEventListener('loadeddata', onVideoReady, { once: true });
  }

  return {
    destroy() {
      video.removeEventListener('canplay', onVideoReady);
      video.removeEventListener('loadeddata', onVideoReady);
      video.removeEventListener('ended', onVideoEnded);
      video.pause();
    }
  };
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
