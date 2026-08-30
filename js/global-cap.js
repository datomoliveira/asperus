// global-cap.js — Controlador do Boné 3D Hero e Fundo Persistente Contínuo por Todo o Site
import * as THREE from 'three';
import { buildCap } from './cap.js';

const TOTAL_FRAMES = 56;
const FRAMES_PATH = 'hero_asperus/hero asperus_';

export function initGlobalCap() {
  const heroCanvas = document.getElementById('hero-cap-canvas');
  if (!heroCanvas) return;

  // 1. CARREGAMENTO E SCRUB DAS 56 IMAGENS NA SEQUÊNCIA GLOBAL
  let frames = [];
  let loadedCount = 0;
  let currentFrame = 0;
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
    const w = rect.width || heroCanvas.clientWidth || window.innerWidth * 0.6;
    const h = rect.height || heroCanvas.clientHeight || window.innerHeight * 0.85;
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

    // Contain draw at full crisp scale
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
      const w = heroCanvas.clientWidth || window.innerWidth * 0.6;
      const h = heroCanvas.clientHeight || window.innerHeight * 0.85;
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

  // Rotação suave do boné ao mover o mouse
  let mouseX = 0, mouseY = 0;
  document.addEventListener('mousemove', (e) => {
    mouseX = (e.clientX / window.innerWidth - 0.5) * 2;
    mouseY = (e.clientY / window.innerHeight - 0.5) * 2;
  }, { passive: true });

  // Scrub contínuo de rotação pelo scroll de toda a página (recomeçando a sequência continuamente)
  let rafId = null;

  function loop() {
    rafId = requestAnimationFrame(loop);

    const scrollY = window.scrollY || window.pageYOffset;
    const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
    const scrollProgress = maxScroll > 0 ? (scrollY / maxScroll) : 0;

    // Rotação contínua da sequência de 56 imagens por todo o site
    // 3.5 voltas completas (loops contínuos) da Hero ao Rodapé
    const totalLoops = 3.5;
    const rawProgress = scrollProgress * TOTAL_FRAMES * totalLoops;
    const mouseOffset = mouseX * 3.5;

    // Garante loop contínuo e suave sem quebras
    const computedTarget = (rawProgress + mouseOffset + TOTAL_FRAMES * 20) % TOTAL_FRAMES;
    
    // Interpolação suave para 60fps
    let diff = computedTarget - currentFrame;
    if (diff > TOTAL_FRAMES / 2) diff -= TOTAL_FRAMES;
    if (diff < -TOTAL_FRAMES / 2) diff += TOTAL_FRAMES;
    currentFrame += diff * 0.15;
    if (currentFrame < 0) currentFrame += TOTAL_FRAMES;
    currentFrame = currentFrame % TOTAL_FRAMES;

    const idx = Math.floor(currentFrame) % TOTAL_FRAMES;

    if (loadedCount > 0) {
      renderHeroFrame(idx);
    } else if (heroCap3D && hero3DRenderer && hero3DScene && hero3DCamera) {
      heroCap3D.rotation.y = (scrollProgress * Math.PI * 7) + (mouseX * 0.3);
      heroCap3D.rotation.x = (mouseY * 0.2);
      hero3DRenderer.render(hero3DScene, hero3DCamera);
    }
  }

  loop();

  return {
    destroy() {
      if (rafId) cancelAnimationFrame(rafId);
      window.removeEventListener('resize', resizeHeroCanvas);
      if (hero3DRenderer) hero3DRenderer.dispose();
    }
  };
}
