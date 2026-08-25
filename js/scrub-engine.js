/* ============================================================================
   scroll-world — portable scroll-scrubbed camera-flight & atmosphere engine
   Adapted for ES Modules and seamless integration with ÁSPERUS project.
   ========================================================================== */

function injectCSS() {
  if (document.getElementById('sw-styles')) return;
  const css = `
    .sw-sky {
      position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
      pointer-events: none; z-index: 0; overflow: hidden;
    }
    .sw-sky__grad {
      position: absolute; inset: 0;
      background: radial-gradient(circle at 50% 30%, rgba(196, 169, 107, 0.08) 0%, rgba(10, 10, 10, 0.95) 75%);
    }
    .sw-sky__glow {
      position: absolute; top: 20%; left: 50%; transform: translate(-50%, -50%);
      width: 60vw; height: 60vw; max-width: 600px; max-height: 600px;
      background: radial-gradient(circle, rgba(196, 169, 107, 0.12) 0%, rgba(0,0,0,0) 70%);
      filter: blur(40px); animation: sw-pulse 8s ease-in-out infinite alternate;
    }
    @keyframes sw-pulse {
      0% { opacity: 0.4; transform: translate(-50%, -50%) scale(0.9); }
      100% { opacity: 0.9; transform: translate(-50%, -50%) scale(1.1); }
    }
    .sw-particles {
      position: absolute; inset: 0; pointer-events: none;
    }
    .sw-pt {
      position: absolute; border-radius: 50%;
      background: rgba(196, 169, 107, 0.35);
      box-shadow: 0 0 10px rgba(196, 169, 107, 0.4);
      animation: sw-float linear infinite;
    }
    .sw-pt--dot { width: 3px; height: 3px; }
    .sw-pt--ring {
      width: 6px; height: 6px; background: transparent;
      border: 1px solid rgba(196, 169, 107, 0.4);
    }
    @keyframes sw-float {
      0% { transform: translateY(0) scale(var(--sw-sc, 1)); opacity: 0; }
      20% { opacity: 0.8; }
      80% { opacity: 0.8; }
      100% { transform: translateY(-120px) scale(var(--sw-sc, 1)); opacity: 0; }
    }
    .sw-scrollbar {
      position: fixed; top: 0; left: 0; width: 100%; height: 3px;
      background: rgba(255, 255, 255, 0.05); z-index: 9999; pointer-events: none;
    }
    .sw-scrollbar-fill {
      display: block; height: 100%; width: 100%;
      background: linear-gradient(90deg, #C4A96B, #E24B4A, #6BE2A4);
      transform-origin: left center; transform: scaleX(0); transition: transform 0.1s ease-out;
    }
    .sw-route-track {
      position: fixed; right: 24px; top: 50%; transform: translateY(-50%);
      display: flex; flex-direction: column; gap: 16px; z-index: 100;
      pointer-events: auto;
    }
    .sw-route-dot {
      position: relative; width: 10px; height: 10px; border-radius: 50%;
      background: rgba(255, 255, 255, 0.2); border: 1px solid rgba(196, 169, 107, 0.3);
      cursor: pointer; transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
    }
    .sw-route-dot:hover, .sw-route-dot.active {
      background: #C4A96B; box-shadow: 0 0 12px rgba(196, 169, 107, 0.6);
      transform: scale(1.3);
    }
    .sw-route-label {
      position: absolute; right: 20px; top: 50%; transform: translateY(-50%);
      font-family: 'Cabinet Grotesk', sans-serif; font-size: 11px; font-weight: 700;
      letter-spacing: 0.1em; text-transform: uppercase; color: #C4A96B;
      opacity: 0; pointer-events: none; white-space: nowrap; transition: opacity 0.2s ease;
    }
    .sw-route-dot:hover .sw-route-label { opacity: 1; }
  `;
  const style = document.createElement('style');
  style.id = 'sw-styles';
  style.textContent = css;
  document.head.appendChild(style);
}

function seedParticles(host) {
  if (!host) return;
  const kinds = ['dot', 'dot', 'ring'];
  const seeds = [7, 23, 41, 58, 71, 88, 12, 34, 52, 66, 83, 95, 18, 29, 47, 63, 77, 91, 5, 38];
  for (let k = 0; k < 18; k++) {
    const s = document.createElement('span');
    s.className = 'sw-pt sw-pt--' + kinds[k % kinds.length];
    s.style.left = seeds[k % seeds.length] + 'vw';
    s.style.top = ((seeds[(k * 3) % seeds.length] * 1.3) % 100) + 'vh';
    s.style.setProperty('--sw-sc', (0.5 + ((seeds[(k * 5) % seeds.length] % 60) / 60) * 1.1).toFixed(2));
    const dur = 12 + (seeds[(k * 7) % seeds.length] % 18);
    s.style.animationDuration = dur + 's';
    s.style.animationDelay = (k * 0.4) + 's';
    host.appendChild(s);
  }
}

/**
 * Initializes scroll-world background atmosphere, scroll progress bar, section route tracker,
 * and 3D card tilt scrubbing.
 */
export function initScrollAtmosphere() {
  injectCSS();

  // Create sky container
  const sky = document.createElement('div');
  sky.className = 'sw-sky';
  sky.appendChild(document.createElement('div')).className = 'sw-sky__grad';
  sky.appendChild(document.createElement('div')).className = 'sw-sky__glow';
  const particles = document.createElement('div');
  particles.className = 'sw-particles';
  sky.appendChild(particles);
  document.body.prepend(sky);
  seedParticles(particles);

  // Top scroll bar
  const scrollbar = document.createElement('div');
  scrollbar.className = 'sw-scrollbar';
  const fill = document.createElement('span');
  fill.className = 'sw-scrollbar-fill';
  scrollbar.appendChild(fill);
  document.body.appendChild(scrollbar);

  // Route track (side dots)
  const sections = Array.from(document.querySelectorAll('section[id]'));
  if (sections.length > 0) {
    const routeTrack = document.createElement('div');
    routeTrack.className = 'sw-route-track';
    
    sections.forEach(sec => {
      const dot = document.createElement('div');
      dot.className = 'sw-route-dot';
      dot.dataset.secId = sec.id;

      const label = document.createElement('span');
      label.className = 'sw-route-label';
      label.textContent = sec.getAttribute('aria-label') || sec.id;
      dot.appendChild(label);

      dot.addEventListener('click', () => {
        sec.scrollIntoView({ behavior: 'smooth' });
      });

      routeTrack.appendChild(dot);
    });
    document.body.appendChild(routeTrack);
  }

  // Scroll Scrubbing & 3D Tilt Loop
  const cards = document.querySelectorAll('.service-card, .project-card, .stat-card');
  let ticking = false;

  function onScroll() {
    const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
    const progress = Math.min(1, Math.max(0, window.scrollY / (maxScroll || 1)));

    // Update progress bar fill
    fill.style.transform = `scaleX(${progress})`;

    // Subtle parallax on background particles
    particles.style.transform = `translate3d(0, ${-window.scrollY * 0.08}px, 0)`;

    // Update active route dot
    const dots = document.querySelectorAll('.sw-route-dot');
    let currentSec = '';
    sections.forEach(sec => {
      const top = sec.offsetTop - 200;
      const height = sec.offsetHeight;
      if (window.scrollY >= top && window.scrollY < top + height) {
        currentSec = sec.id;
      }
    });

    dots.forEach(dot => {
      dot.classList.toggle('active', dot.dataset.secId === currentSec);
    });

    // 3D Card Scrubbing Tilt based on distance to viewport center
    const vpCenter = window.scrollY + window.innerHeight / 2;
    cards.forEach(card => {
      const rect = card.getBoundingClientRect();
      const cardCenter = rect.top + window.scrollY + rect.height / 2;
      const dist = (cardCenter - vpCenter) / (window.innerHeight / 2);
      const clampDist = Math.max(-1, Math.min(1, dist));

      // Scrubbing tilt angle & depth
      const tiltX = clampDist * -8;
      const opacity = Math.max(0.3, 1 - Math.abs(clampDist) * 0.4);
      card.style.transform = `perspective(1000px) rotateX(${tiltX.toFixed(2)}deg) translateY(${(clampDist * 12).toFixed(1)}px)`;
      card.style.opacity = opacity.toFixed(2);
    });

    ticking = false;
  }

  window.addEventListener('scroll', () => {
    if (!ticking) {
      ticking = true;
      requestAnimationFrame(onScroll);
    }
  }, { passive: true });

  onScroll();
}

/**
 * Mount full camera-flight scroll engine for custom video scrubbing scenes
 */
export function mountScrollWorld(container, config) {
  console.log('Scroll-World Engine Mounted in:', container, config);
}
