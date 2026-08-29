// global-cap.js — Controlador do Boné 3D Hero + Fundo persistente por todo o site
import * as THREE from 'three';
import { buildCap } from './cap.js';

const TOTAL_FRAMES = 56;
const FRAMES_PATH = 'hero_asperus/hero asperus_';

export function initGlobalCap() {
  const heroCanvas = document.getElementById('hero-cap-canvas');
  const bgCanvas   = document.getElementById('bg-cap-canvas');
  
  // 1. CARREGAMENTO E SCRUB DAS 56 IMAGENS NA HERO
  let frames = [];
  let loadedCount = 0;
  let currentFrame = 0;
  let targetFrame = 0;
  let heroCtx = heroCanvas?.getContext('2d');

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
    heroCanvas.width = heroCanvas.clientWidth || 600;
    heroCanvas.height = heroCanvas.clientHeight || 600;
    renderHeroFrame(Math.round(currentFrame));
  }

  function renderHeroFrame(index) {
    if (!heroCtx || !frames[index] || !frames[index].complete) return;
    const img = frames[index];
    const cw = heroCanvas.width;
    const ch = heroCanvas.height;
    heroCtx.clearRect(0, 0, cw, ch);

    // Contain draw
    const hRatio = cw / img.naturalWidth;
    const vRatio = ch / img.naturalHeight;
    const ratio  = Math.min(hRatio, vRatio) * 0.95;
    const cx = (cw - img.naturalWidth * ratio) / 2;
    const cy = (ch - img.naturalHeight * ratio) / 2;

    heroCtx.drawImage(img, 0, 0, img.naturalWidth, img.naturalHeight, cx, cy, img.naturalWidth * ratio, img.naturalHeight * ratio);
  }

  if (heroCanvas) {
    preloadHeroFrames();
    window.addEventListener('resize', resizeHeroCanvas);
    setTimeout(resizeHeroCanvas, 100);

    // Rotação suave do boné no Hero ao mover o mouse
    document.addEventListener('mousemove', (e) => {
      const normX = e.clientX / window.innerWidth;
      targetFrame = Math.floor(normX * (TOTAL_FRAMES - 1));
    });
  }

  // 2. CENA 3D THREE.JS DO BONÉ QUE PERCORRE TODO O FUNDO DO SITE
  let renderer, scene, camera, cap3D;
  if (bgCanvas) {
    renderer = new THREE.WebGLRenderer({ canvas: bgCanvas, antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(window.innerWidth, window.innerHeight);

    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(40, window.innerWidth / window.innerHeight, 0.1, 100);
    camera.position.set(0, 0, 6);

    // Iluminação do Boné de Fundo
    const amb = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(amb);
    const dirLight1 = new THREE.DirectionalLight(0xC4A96B, 2.5);
    dirLight1.position.set(3, 4, 4);
    scene.add(dirLight1);
    const dirLight2 = new THREE.DirectionalLight(0xE8E2D9, 1.2);
    dirLight2.position.set(-3, -2, 2);
    scene.add(dirLight2);

    try {
      cap3D = buildCap();
      cap3D.scale.setScalar(1.2);
      scene.add(cap3D);
    } catch (e) {
      console.warn("3D Cap build fallback:", e);
    }

    window.addEventListener('resize', () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    });
  }

  // 3. ANIMAÇÃO UNIFICADA ORIENTADA AO SCROLL & MOUSE
  let mouseX = 0, mouseY = 0;
  document.addEventListener('mousemove', (e) => {
    mouseX = (e.clientX / window.innerWidth - 0.5) * 2;
    mouseY = (e.clientY / window.innerHeight - 0.5) * 2;
  });

  let rafId;
  function loop() {
    rafId = requestAnimationFrame(loop);

    const scrollY = window.scrollY || window.pageYOffset;
    const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
    const scrollProgress = Math.min(1, Math.max(0, scrollY / (maxScroll || 1)));

    // Animação dos frames do Hero
    if (heroCanvas && loadedCount > 0) {
      // Combina scroll com mouse
      const scrollFrameOffset = (scrollY / window.innerHeight) * 30;
      const computedTarget = (targetFrame + scrollFrameOffset) % TOTAL_FRAMES;
      currentFrame += (computedTarget - currentFrame) * 0.1;
      const idx = Math.floor(Math.abs(currentFrame)) % TOTAL_FRAMES;
      renderHeroFrame(idx);
    }

    // Animação do Boné 3D de Fundo que viaja pelo site
    if (cap3D && bgCanvas) {
      // Posição no espaço conforme rola para baixo
      // No hero fica mais sutil à direita, no About centraliza, em Serviços vai para a esquerda, etc.
      const targetX = Math.sin(scrollProgress * Math.PI * 2.5) * 2.2 + mouseX * 0.3;
      const targetY = -Math.cos(scrollProgress * Math.PI * 2) * 1.0 - mouseY * 0.3;
      const targetZ = -0.5 + Math.sin(scrollProgress * Math.PI) * 0.8;

      cap3D.position.x += (targetX - cap3D.position.x) * 0.08;
      cap3D.position.y += (targetY - cap3D.position.y) * 0.08;
      cap3D.position.z += (targetZ - cap3D.position.z) * 0.08;

      // Rotação 3D contínua influenciada pelo scroll do mouse
      cap3D.rotation.y = scrollProgress * Math.PI * 4 + mouseX * 0.4;
      cap3D.rotation.x = 0.25 + Math.sin(scrollProgress * Math.PI * 3) * 0.35 + mouseY * 0.2;
      cap3D.rotation.z = Math.cos(scrollProgress * Math.PI * 2) * 0.15;

      // Opacidade dinâmica (mais visível a partir da Seção 2 conforme solicitado)
      const heroOpacity = Math.max(0.15, Math.min(0.65, scrollY / (window.innerHeight * 0.8)));
      bgCanvas.style.opacity = heroOpacity.toFixed(2);

      renderer.render(scene, camera);
    }
  }

  loop();

  return {
    destroy() {
      cancelAnimationFrame(rafId);
      if (renderer) renderer.dispose();
    }
  };
}
