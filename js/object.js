/* ==========================================================================
   ÁSPERUS — object.js
   The real 3D cap lives in the footer and only loads when it is needed.
   ========================================================================== */

/**
 * @param {{
 *   trigger: HTMLElement,
 *   wrap: HTMLElement,
 *   canvas: HTMLCanvasElement
 * }} options
 */
export function createFooterObject({ trigger, wrap, canvas }) {
  if (!trigger || !wrap || !canvas) return null;

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let bootPromise = null;
  let renderer = null;
  let scene = null;
  let camera = null;
  let cap = null;
  let ready = false;
  let visible = false;
  let rafId = 0;
  let lastTime = 0;
  let autoRotation = 0;
  let spinBoost = 0;
  let pointerX = 0;
  let pointerY = 0;
  let currentPointerX = 0;
  let currentPointerY = 0;
  let observer = null;

  function resize() {
    if (!renderer || !camera) return;
    const rect = wrap.getBoundingClientRect();
    const size = Math.max(140, Math.min(460, Math.floor(rect.width || 320)));
    renderer.setSize(size, size, false);
    camera.aspect = 1;
    camera.updateProjectionMatrix();
  }

  function drawFallback() {
    try {
      const image = new Image();
      image.alt = '';
      image.decoding = 'async';
      image.src = 'assets/cap/960/frame-030.webp';
      image.style.cssText = 'width:100%;height:100%;object-fit:cover;object-position:center;display:block;';
      canvas.style.display = 'none';
      wrap.appendChild(image);
    } catch (_) { /* nothing else to do */ }
  }

  function boot() {
    if (bootPromise) return bootPromise;

    bootPromise = (async () => {
      try {
        const THREE = await import('three');
        const { buildCap } = await import('./cap.js?v=2.0.0');

        renderer = new THREE.WebGLRenderer({
          canvas,
          antialias: true,
          alpha: true,
          powerPreference: 'high-performance',
        });
        renderer.setClearColor(0x000000, 0);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.8));
        renderer.outputColorSpace = THREE.SRGBColorSpace;
        renderer.toneMapping = THREE.ACESFilmicToneMapping;
        renderer.toneMappingExposure = 1.28;

        scene = new THREE.Scene();
        camera = new THREE.PerspectiveCamera(30, 1, 0.1, 100);
        camera.position.set(0, 0.28, 8.1);
        camera.lookAt(0, 0.1, 0);

        const ambient = new THREE.AmbientLight(0xfff6e5, 0.62);
        scene.add(ambient);

        const hemisphere = new THREE.HemisphereLight(0xfff0d5, 0x070605, 0.7);
        scene.add(hemisphere);

        const key = new THREE.DirectionalLight(0xffe8bf, 3.6);
        key.position.set(3.4, 4.6, 4.2);
        scene.add(key);

        const rim = new THREE.DirectionalLight(0xc8a96a, 4.2);
        rim.position.set(-4.2, 2.2, -3.4);
        scene.add(rim);

        const fill = new THREE.PointLight(0xc8a96a, 2.4, 14, 2);
        fill.position.set(0, -2.2, 3.2);
        scene.add(fill);

        /* Soft gold atmosphere behind the object. */
        const glowCanvas = document.createElement('canvas');
        glowCanvas.width = 256;
        glowCanvas.height = 256;
        const glowCtx = glowCanvas.getContext('2d');
        if (glowCtx) {
          const gradient = glowCtx.createRadialGradient(128, 128, 0, 128, 128, 128);
          gradient.addColorStop(0, 'rgba(200,169,106,0.34)');
          gradient.addColorStop(0.45, 'rgba(200,169,106,0.09)');
          gradient.addColorStop(1, 'rgba(200,169,106,0)');
          glowCtx.fillStyle = gradient;
          glowCtx.fillRect(0, 0, 256, 256);
          const glowTexture = new THREE.CanvasTexture(glowCanvas);
          const glow = new THREE.Sprite(new THREE.SpriteMaterial({
            map: glowTexture,
            transparent: true,
            depthWrite: false,
            blending: THREE.AdditiveBlending,
          }));
          glow.scale.set(6.2, 6.2, 1);
          glow.position.set(0, -0.1, -2.2);
          scene.add(glow);
        }

        cap = buildCap();
        cap.rotation.set(-0.07, -0.5, 0.02);
        cap.position.y = 0.06;
        scene.add(cap);

        resize();
        ready = true;

        if (observer) {
          observer.disconnect();
          observer = null;
        }

        if (visible) {
          renderOnce();
          if (!reducedMotion) startLoop();
        }
      } catch (error) {
        console.warn('[ÁSPERUS] 3D cap unavailable:', error);
        drawFallback();
        ready = false;
      }
    })();

    return bootPromise;
  }

  function renderOnce() {
    if (!renderer || !scene || !camera) return;
    currentPointerX += (pointerX - currentPointerX) * 0.12;
    currentPointerY += (pointerY - currentPointerY) * 0.12;
    if (cap) {
      cap.rotation.y = -0.5 + autoRotation + currentPointerX * 0.38;
      cap.rotation.x = -0.07 + currentPointerY * 0.16;
      cap.position.y = 0.06 + (reducedMotion ? 0 : Math.sin(performance.now() * 0.0011) * 0.035);
    }
    renderer.render(scene, camera);
  }

  function startLoop() {
    if (rafId) return;
    lastTime = performance.now();
    const tick = (now) => {
      if (!visible) {
        rafId = 0;
        return;
      }
      const delta = Math.min((now - lastTime) / 1000, 0.05);
      lastTime = now;

      autoRotation += delta * (0.26 + spinBoost);
      spinBoost *= Math.pow(0.06, delta);
      if (spinBoost < 0.002) spinBoost = 0;

      currentPointerX += (pointerX - currentPointerX) * 0.08;
      currentPointerY += (pointerY - currentPointerY) * 0.08;

      if (cap) {
        cap.rotation.y = -0.5 + autoRotation + currentPointerX * 0.38;
        cap.rotation.x = -0.07 + currentPointerY * 0.16;
        cap.position.y = 0.06 + Math.sin(now * 0.0011) * 0.035;
      }

      renderer.render(scene, camera);
      rafId = requestAnimationFrame(tick);
    };
    rafId = requestAnimationFrame(tick);
  }

  function stopLoop() {
    if (rafId) cancelAnimationFrame(rafId);
    rafId = 0;
  }

  function show() {
    boot().then(() => {
      visible = true;
      wrap.classList.add('is-visible');
      wrap.setAttribute('aria-hidden', 'false');
      trigger.setAttribute('aria-expanded', 'true');
      trigger.setAttribute('aria-label', 'ÁSPERUS — girar o boné 3D');
      spinBoost = 3.2;

      if (ready && !reducedMotion) {
        resize();
        startLoop();
      } else if (ready) {
        renderOnce();
      }
    });
  }

  function hide() {
    visible = false;
    stopLoop();
    wrap.classList.remove('is-visible');
    wrap.setAttribute('aria-hidden', 'true');
    trigger.setAttribute('aria-expanded', 'false');
    trigger.setAttribute('aria-label', 'ÁSPERUS — clique para revelar o boné 3D');
  }

  trigger.setAttribute('aria-expanded', 'false');
  trigger.addEventListener('click', () => {
    if (visible) hide();
    else show();
  });

  trigger.addEventListener('pointerenter', boot, { once: true });
  trigger.addEventListener('focus', boot, { once: true });

  const onPointerMove = (event) => {
    if (event.pointerType && event.pointerType !== 'mouse') return;
    pointerX = event.clientX / window.innerWidth - 0.5;
    pointerY = event.clientY / window.innerHeight - 0.5;
  };
  window.addEventListener('pointermove', onPointerMove, { passive: true });

  const onKeyDown = (event) => {
    if (event.key === 'Escape' && visible) hide();
  };
  window.addEventListener('keydown', onKeyDown);

  const onResize = () => {
    if (ready) {
      resize();
      renderOnce();
    }
  };
  window.addEventListener('resize', onResize, { passive: true });

  if ('IntersectionObserver' in window) {
    observer = new IntersectionObserver((entries) => {
      if (entries.some((entry) => entry.isIntersecting)) boot();
    }, { rootMargin: '700px 0px' });
    observer.observe(trigger.closest('.footer') || wrap);
  }

  return {
    boot,
    show,
    hide,
    get isVisible() { return visible; },
  };
}
