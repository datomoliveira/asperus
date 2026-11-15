/* ==========================================================================
   ÁSPERUS — stage.js
   One continuous 56-frame cap sequence mapped to the page keyframes.
   ========================================================================== */

const TOTAL_FRAMES = 56;
const FRAME_PAD = (n) => String(n).padStart(3, '0');

function preloadFrames(dir, total, onProgress) {
  const images = new Array(total).fill(null);
  let cursor = 0;
  let done = 0;
  let failed = 0;

  async function worker() {
    while (true) {
      const index = cursor++;
      if (index >= total) return;

      const img = new Image();
      img.decoding = 'async';

      try {
        await new Promise((resolve, reject) => {
          img.onload = () => resolve();
          img.onerror = () => reject(new Error(`frame ${index}`));
          img.src = `${dir}/frame-${FRAME_PAD(index)}.webp`;
        });
        /* `decode()` can stay pending for detached images in some Chromium
           builds, so the canvas decodes lazily on first draw instead. */
        images[index] = img;
      } catch (_) {
        failed += 1;
      }

      done += 1;
      if (onProgress) onProgress(done, total, failed);
    }
  }

  const workers = Math.min(6, total);
  return Promise.all(Array.from({ length: workers }, worker)).then(() => ({ images, failed }));
}

function findFrame(images, index) {
  if (!images.length) return null;
  if (images[index]) return images[index];
  for (let i = index - 1; i >= 0; i -= 1) if (images[i]) return images[i];
  for (let i = index + 1; i < images.length; i += 1) if (images[i]) return images[i];
  return null;
}

const lerp = (a, b, t) => a + (b - a) * t;
const smoothstep = (t) => t * t * (3 - 2 * t);
const clamp = (v, min, max) => Math.min(max, Math.max(min, v));

/**
 * Starts the fixed cap stage.
 * @param {{ onProgress?: (done:number,total:number,failed:number)=>void, onReady?: ()=>void }} options
 */
export function initStage({ onProgress, onReady } = {}) {
  const stage = document.getElementById('stage');
  const canvas = document.getElementById('stage-canvas');
  const frameReadout = document.getElementById('frame-readout');
  const readout = document.getElementById('stage-readout');

  if (!stage || !canvas) {
    if (onReady) onReady();
    return null;
  }

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const smallScreen = window.matchMedia('(max-width: 900px)').matches;
  const frameDir = smallScreen ? 'assets/cap/640' : 'assets/cap/960';

  canvas.width = smallScreen ? 640 : 960;
  canvas.height = smallScreen ? 360 : 540;
  const ctx = canvas.getContext('2d', { alpha: true });

  let images = [];
  let keyframes = [];
  let ready = false;
  let lastFrame = -1;
  let lastTransform = '';
  let lastOpacity = '';
  let lastReadout = '';
  let px = 0;
  let py = 0;
  let targetX = 0;
  let targetY = 0;
  let rafId = 0;

  /* ------------------------------------------------------------------ */
  /* Keyframes from the semantic sections                               */
  /* ------------------------------------------------------------------ */

  function measure() {
    const scrollY = window.scrollY || window.pageYOffset || 0;
    const vh = window.innerHeight || 800;
    const nodes = Array.from(document.querySelectorAll('[data-section]'));

    keyframes = nodes
      .map((node) => {
        const rect = node.getBoundingClientRect();
        return {
          y: Math.max(0, rect.top + scrollY - vh * 0.16),
          x: parseFloat(node.dataset.stageX) || 50,
          yPos: parseFloat(node.dataset.stageY) || 50,
          scale: parseFloat(node.dataset.stageScale) || 1,
          opacity: parseFloat(node.dataset.stageOpacity) || 0.8,
          frame: parseInt(node.dataset.stageFrame, 10) || 0,
        };
      })
      .sort((a, b) => a.y - b.y);

    const footer = document.getElementById('footer');
    if (keyframes.length && footer) {
      const last = keyframes[keyframes.length - 1];
      const footerY = footer.getBoundingClientRect().top + scrollY - vh * 0.1;
      if (footerY > last.y + 40) {
        keyframes.push({
          ...last,
          y: footerY,
          frame: TOTAL_FRAMES - 1,
          opacity: Math.min(last.opacity, 0.34),
        });
      }
    }

    if (readout) readout.style.opacity = keyframes.length ? '0.55' : '0';
  }

  function nearestKeyframe(y) {
    if (!keyframes.length) return null;
    let best = keyframes[0];
    let bestDistance = Infinity;
    keyframes.forEach((kf) => {
      const distance = Math.abs(kf.y - y);
      if (distance < bestDistance) {
        bestDistance = distance;
        best = kf;
      }
    });
    return best;
  }

  function stateAt(y) {
    if (!keyframes.length) {
      return { x: 50, yPos: 50, scale: 1, opacity: 0, frame: 0 };
    }

    if (reducedMotion) return nearestKeyframe(y);

    const first = keyframes[0];
    const last = keyframes[keyframes.length - 1];
    if (y <= first.y) return first;
    if (y >= last.y) return last;

    let from = first;
    let to = first;
    for (let i = 0; i < keyframes.length - 1; i += 1) {
      if (y >= keyframes[i].y && y < keyframes[i + 1].y) {
        from = keyframes[i];
        to = keyframes[i + 1];
        break;
      }
    }

    const gap = Math.max(1, to.y - from.y);
    const transition = Math.min(gap * 0.72, Math.max(240, window.innerHeight * 0.58));
    const start = to.y - transition;
    const raw = clamp((y - start) / transition, 0, 1);
    const t = smoothstep(raw);

    return {
      x: lerp(from.x, to.x, t),
      yPos: lerp(from.yPos, to.yPos, t),
      scale: lerp(from.scale, to.scale, t),
      opacity: lerp(from.opacity, to.opacity, t),
      frame: lerp(from.frame, to.frame, t),
    };
  }

  /* ------------------------------------------------------------------ */
  /* Render                                                             */
  /* ------------------------------------------------------------------ */

  function drawFrame(index) {
    if (!ctx) return;
    const img = findFrame(images, clamp(index, 0, TOTAL_FRAMES - 1));
    if (!img) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    canvas.style.visibility = 'visible';
  }

  function apply() {
    if (!ready) return;

    const scrollY = window.scrollY || window.pageYOffset || 0;
    const state = stateAt(scrollY);

    const frame = clamp(Math.round(state.frame), 0, TOTAL_FRAMES - 1);

    if (frame !== lastFrame) {
      drawFrame(frame);
      lastFrame = frame;
      if (frameReadout) {
        const label = FRAME_PAD(frame);
        if (label !== lastReadout) {
          frameReadout.textContent = label;
          lastReadout = label;
        }
      }
    }

    const mobileX = smallScreen ? 50 : state.x;
    const mobileY = smallScreen ? 50 : state.yPos;
    const scale = smallScreen ? state.scale * 0.94 : state.scale;
    const alpha = smallScreen ? state.opacity * 0.56 : state.opacity;

    const transform = `translate3d(calc(-50% + ${(mobileX - 50).toFixed(3)}vw + ${px.toFixed(2)}px), calc(-50% + ${(mobileY - 50).toFixed(3)}vh + ${py.toFixed(2)}px), 0) scale(${scale.toFixed(4)})`;
    if (transform !== lastTransform) {
      canvas.style.transform = transform;
      lastTransform = transform;
    }

    const opacity = alpha.toFixed(3);
    if (opacity !== lastOpacity) {
      canvas.style.opacity = opacity;
      lastOpacity = opacity;
    }
  }

  function loop() {
    rafId = requestAnimationFrame(loop);
    if (!ready) return;

    if (document.hidden) return;

    if (reducedMotion) {
      px = 0;
      py = 0;
    } else {
      px += (targetX - px) * 0.075;
      py += (targetY - py) * 0.075;
      if (Math.abs(targetX - px) < 0.01) px = targetX;
      if (Math.abs(targetY - py) < 0.01) py = targetY;
    }

    apply();
  }

  /* ------------------------------------------------------------------ */
  /* Events                                                             */
  /* ------------------------------------------------------------------ */

  const onPointerMove = (event) => {
    if (reducedMotion || event.pointerType !== 'mouse' || smallScreen) return;
    targetX = (event.clientX / window.innerWidth - 0.5) * 30;
    targetY = (event.clientY / window.innerHeight - 0.5) * 20;
  };

  const onScroll = () => {
    if (reducedMotion) apply();
  };

  const onResize = () => {
    measure();
    apply();
  };

  window.addEventListener('pointermove', onPointerMove, { passive: true });
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onResize, { passive: true });
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(measure).catch(() => {});
  }
  window.addEventListener('load', measure, { once: true });

  measure();
  rafId = requestAnimationFrame(loop);

  preloadFrames(frameDir, TOTAL_FRAMES, onProgress)
    .then(({ images: loaded, failed }) => {
      images = loaded;
      measure();
      ready = true;
      lastFrame = -1;
      lastTransform = '';
      lastOpacity = '';
      apply();

      if (failed >= TOTAL_FRAMES) {
        stage.style.display = 'none';
        if (readout) readout.style.display = 'none';
      } else {
        stage.classList.add('is-loaded');
      }

      if (onReady) onReady();
    })
    .catch(() => {
      stage.style.display = 'none';
      if (readout) readout.style.display = 'none';
      if (onReady) onReady();
    });

  return {
    get frameCount() { return TOTAL_FRAMES; },
    destroy() {
      cancelAnimationFrame(rafId);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onResize);
    },
  };
}
