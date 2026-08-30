/* ============================================================================
   scroll-world — Barra de Progresso e Navegação Global (GSAP ScrollTrigger)
   Projetado para 60 FPS com aceleração de GPU
   ========================================================================== */

function injectCSS() {
  if (document.getElementById('sw-styles')) return;
  const css = `
    .sw-scrollbar {
      position: fixed; top: 0; left: 0; width: 100%; height: 3px;
      background: rgba(255, 255, 255, 0.05); z-index: 9999; pointer-events: none;
    }
    .sw-scrollbar-fill {
      display: block; height: 100%; width: 100%;
      background: linear-gradient(90deg, #C4A96B, #E24B4A, #6BE2A4);
      transform-origin: left center; transform: scaleX(0);
      will-change: transform;
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

/**
 * Initializes scroll atmosphere and GSAP ScrollTrigger
 */
export function initScrollAtmosphere() {
  injectCSS();

  // Top scroll bar
  const scrollbar = document.createElement('div');
  scrollbar.className = 'sw-scrollbar';
  const fill = document.createElement('span');
  fill.className = 'sw-scrollbar-fill';
  scrollbar.appendChild(fill);
  document.body.appendChild(scrollbar);

  // Route track (side navigation dots)
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

    // Update active dot efficiently using IntersectionObserver
    const dotObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const id = entry.target.id;
          document.querySelectorAll('.sw-route-dot').forEach(d => {
            d.classList.toggle('active', d.dataset.secId === id);
          });
        }
      });
    }, { threshold: 0.3 });

    sections.forEach(sec => dotObserver.observe(sec));
  }

  // Scroll progress bar via ScrollTrigger (ultra-fast GPU render)
  if (typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined') {
    gsap.registerPlugin(ScrollTrigger);

    gsap.to(fill, {
      scaleX: 1,
      ease: 'none',
      scrollTrigger: {
        trigger: document.body,
        start: 'top top',
        end: 'bottom bottom',
        scrub: 0.1,
      }
    });
  }
}


