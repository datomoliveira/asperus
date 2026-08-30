/* ============================================================================
   scroll-world — Engine de Parallax e Transição de Camadas (GSAP ScrollTrigger)
   Projetado para 60 FPS com aceleração de GPU e profundidade 3D real
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
 * Generates vertical-bar digital silhouette edge divider (Gold / Obsidian)
 */
function initVerticalBarDivider() {
  const svg = document.getElementById('layer-divider-svg');
  if (!svg) return;

  const totalWidth = 1440;
  const maxHeight = 140;
  const barWidth = 6;
  const gap = 3;
  const numBars = Math.floor(totalWidth / (barWidth + gap));

  let pathD = `M 0 ${maxHeight} `;

  for (let i = 0; i <= numBars; i++) {
    const x = i * (barWidth + gap);
    // Multi-frequency sine & noise wave creating modern digital silhouette landscape
    const n1 = Math.sin(i * 0.07) * 35;
    const n2 = Math.cos(i * 0.18) * 25;
    const n3 = Math.sin(i * 0.03) * 45;
    const noise = Math.abs(n1 + n2 + n3);
    const barH = Math.max(20, Math.min(135, noise + ((i * 13) % 7) * 5));
    const topY = maxHeight - barH;

    pathD += `L ${x} ${topY.toFixed(1)} L ${(x + barWidth).toFixed(1)} ${topY.toFixed(1)} L ${(x + barWidth).toFixed(1)} ${maxHeight} `;
  }

  pathD += `L ${totalWidth} ${maxHeight} Z`;

  svg.innerHTML = '';
  
  // Defs with gold gradient highlight
  const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
  const grad = document.createElementNS('http://www.w3.org/2000/svg', 'linearGradient');
  grad.setAttribute('id', 'dividerGoldGrad');
  grad.setAttribute('x1', '0%'); grad.setAttribute('y1', '0%');
  grad.setAttribute('x2', '0%'); grad.setAttribute('y2', '100%');

  const stop1 = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
  stop1.setAttribute('offset', '0%'); stop1.setAttribute('stop-color', '#C4A96B'); stop1.setAttribute('stop-opacity', '0.85');
  const stop2 = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
  stop2.setAttribute('offset', '100%'); stop2.setAttribute('stop-color', '#080808'); stop2.setAttribute('stop-opacity', '1');

  grad.appendChild(stop1); grad.appendChild(stop2);
  defs.appendChild(grad);
  svg.appendChild(defs);

  const pathEl = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  pathEl.setAttribute('d', pathD);
  pathEl.setAttribute('fill', 'url(#dividerGoldGrad)');
  pathEl.setAttribute('stroke', '#C4A96B');
  pathEl.setAttribute('stroke-width', '0.6');
  pathEl.setAttribute('stroke-opacity', '0.5');
  svg.appendChild(pathEl);
}

/**
 * Initializes scroll atmosphere and GSAP ScrollTrigger Parallax Layer Transition
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

  // Generate Digital Silhouette Edge Divider
  initVerticalBarDivider();

  // GSAP ScrollTrigger Parallax Transition between Hero and About
  if (typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined') {
    gsap.registerPlugin(ScrollTrigger);

    const heroLeft = document.querySelector('.hero-left');
    const heroRight = document.querySelector('.hero-right');
    const heroScroll = document.querySelector('.hero-scroll-indicator');
    const divider = document.getElementById('layer-edge-divider');
    const heroWrapper = document.getElementById('hero-wrapper');

    if (heroWrapper && divider) {
      const parallaxTl = gsap.timeline({
        scrollTrigger: {
          trigger: heroWrapper,
          start: 'top top',
          end: 'bottom top',
          scrub: 0.5,
          invalidateOnRefresh: true,
        }
      });

      // Hero content moves up with depth delay and soft fade
      if (heroLeft) {
        parallaxTl.to(heroLeft, { yPercent: -28, opacity: 0.2, ease: 'none' }, 0);
      }
      if (heroRight) {
        parallaxTl.to(heroRight, { yPercent: -16, opacity: 0.3, ease: 'none' }, 0);
      }
      if (heroScroll) {
        parallaxTl.to(heroScroll, { opacity: 0, y: -30, ease: 'none' }, 0);
      }

      // Parallax movement for the edge divider (moves independently to create layered depth)
      parallaxTl.fromTo(divider,
        { y: 70, scaleY: 0.9 },
        { y: -35, scaleY: 1.12, ease: 'none' },
        0
      );
    }

    // Scroll progress bar via ScrollTrigger (ultra-fast GPU render)
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

