// global-cap.js — Controlador do Boné 3D Hero (Sequência de Imagens e Fallback WebGL)
import * as THREE from 'three';
import { buildCap } from './cap.js';

const TOTAL_FRAMES = 56;
const FRAMES_PATH = 'hero_asperus/hero asperus_';

export function initGlobalCap() {
  const heroCanvas = document.getElementById('hero-cap-canvas');
  const heroWrapper = document.getElementById('hero-wrapper') || heroCanvas;
  if (!heroCanvas) return;

  // 1. CARREGAMENTO E SCRUB DAS 56 IMAGENS NA HERO
  let frames = [];
  let loadedCount = 0;
  let currentFrame = 0;
  let targetFrame = 0;
  let heroCtx = heroCanvas.getContext('2d');

  function pad(num, size = 3) {
    return String(num).padStart(size, '0');
  }

  function preloadHeroFrames() {
    for (let i = 0; i < TOTAL_FRAMES; i++) {
      const img = new Image();
      img.src = `${FRAMES_PATH}${pad(i)}.webp`;
      img.onload = () => {
        loadedCount++;
        if (loadedCount === 1) renderHeroFrame(0);
      };
      frames.push(img);
    }
  }

  function resizeHeroCanvas() {
    if (!heroCanvas) return;
    const rect = heroCanvas.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    const w = rect.width || heroCanvas.clientWidth || 800;
    const h = rect.height || heroCanvas.clientHeight || 800;
    heroCanvas.width = Math.round(w * dpr);
    heroCanvas.height = Math.round(h * dpr);
    renderHeroFrame(Math.round(currentFrame));
  }

  function renderHeroFrame(index) {
    if (!heroCtx || !frames[index] || !frames[index].complete) return;
    const img = frames[index];
    const cw = heroCanvas.width;
    const ch = heroCanvas.height;
    heroCtx.clearRect(0, 0, cw, ch);

    // Contain draw at full scale
    const hRatio = cw / img.naturalWidth;
    const vRatio = ch / img.naturalHeight;
    const ratio  = Math.min(hRatio, vRatio);
    const w = img.naturalWidth * ratio;
    const h = img.naturalHeight * ratio;
    const cx = (cw - w) / 2;
    const cy = (ch - h) / 2;

    heroCtx.drawImage(img, 0, 0, img.naturalWidth, img.naturalHeight, cx, cy, w, h);
  }

  // Fallback 3D cap for Hero canvas if image sequence fails
  let hero3DRenderer, hero3DScene, hero3DCamera, heroCap3D;

  function initHero3DFallback() {
    if (heroCap3D || loadedCount > 0) return;
    try {
      hero3DRenderer = new THREE.WebGLRenderer({ canvas: heroCanvas, antialias: true, alpha: true });
      hero3DRenderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
      const w = heroCanvas.clientWidth || 800;
      const h = heroCanvas.clientHeight || 800;
      hero3DRenderer.setSize(w, h);

      hero3DScene = new THREE.Scene();
      hero3DCamera = new THREE.PerspectiveCamera(40, w / h, 0.1, 100);
      hero3DCamera.position.set(0, 0, 5.2);

      hero3DScene.add(new THREE.AmbientLight(0xffffff, 0.7));
      const dLight = new THREE.DirectionalLight(0xC4A96B, 2.8);
      dLight.position.set(3, 4, 4);
      hero3DScene.add(dLight);

      heroCap3D = buildCap();
      heroCap3D.scale.setScalar(1.25);
      hero3DScene.add(heroCap3D);
    } catch (e) {
      console.warn("Hero 3D fallback init error:", e);
    }
  }

  preloadHeroFrames();
  window.addEventListener('resize', resizeHeroCanvas, { passive: true });
  setTimeout(() => {
    resizeHeroCanvas();
    if (loadedCount === 0) {
      initHero3DFallback();
    }
  }, 400);

  // Rotação suave do boné no Hero ao mover o mouse
  let mouseX = 0, mouseY = 0;
  document.addEventListener('mousemove', (e) => {
    const normX = e.clientX / window.innerWidth;
    targetFrame = Math.floor(normX * (TOTAL_FRAMES - 1));
    mouseX = (e.clientX / window.innerWidth - 0.5) * 2;
    mouseY = (e.clientY / window.innerHeight - 0.5) * 2;
  }, { passive: true });

  // IntersectionObserver para rodar a animação apenas quando a Hero estiver visível
  let isVisible = false;
  let rafId = null;

  function loop() {
    if (!isVisible) return;
    rafId = requestAnimationFrame(loop);

    const scrollY = window.scrollY || window.pageYOffset;

    // Animação dos frames do Hero ou Fallback 3D
    if (loadedCount > 0) {
      const scrollFrameOffset = (scrollY / window.innerHeight) * 25;
      const computedTarget = (targetFrame + scrollFrameOffset) % TOTAL_FRAMES;
      currentFrame += (computedTarget - currentFrame) * 0.12;
      const idx = Math.floor(Math.abs(currentFrame)) % TOTAL_FRAMES;
      renderHeroFrame(idx);
    } else if (heroCap3D && hero3DRenderer && hero3DScene && hero3DCamera) {
      heroCap3D.rotation.y += 0.008 + mouseX * 0.02;
      heroCap3D.rotation.x = Math.sin(Date.now() * 0.001) * 0.1 + mouseY * 0.2;
      hero3DRenderer.render(hero3DScene, hero3DCamera);
    }
  }

  const observer = new IntersectionObserver(([entry]) => {
    isVisible = entry.isIntersecting;
    if (isVisible && !rafId) {
      loop();
    } else if (!isVisible && rafId) {
      cancelAnimationFrame(rafId);
      rafId = null;
    }
  }, { threshold: 0.01 });

  if (heroWrapper) observer.observe(heroWrapper);

  return {
    destroy() {
      observer.disconnect();
      if (rafId) cancelAnimationFrame(rafId);
      window.removeEventListener('resize', resizeHeroCanvas);
      if (hero3DRenderer) hero3DRenderer.dispose();
    }
  };
}
