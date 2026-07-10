// app.js — Main orchestrator: cursor, GSAP, scroll, forms, init
import { initHeroScene, initLoaderScene, initFooterCapScene } from './hero.js?v=1.0.1';
import { initServiceScenes, initAvatarScene, initContactScene } from './sections.js';

/* ══════════════════════════════════════════════
   CUSTOM CURSOR
══════════════════════════════════════════════ */
function initCursor() {
  const cursor = document.getElementById('cursor');
  const dot    = document.getElementById('cursor-dot');
  if (!cursor || !dot) return;

  let mx = -100, my = -100, cx = -100, cy = -100;

  document.addEventListener('mousemove', e => { mx = e.clientX; my = e.clientY; });

  function tick() {
    cx += (mx - cx) * 0.12;
    cy += (my - cy) * 0.12;
    cursor.style.left = cx + 'px';
    cursor.style.top  = cy + 'px';
    dot.style.left = mx + 'px';
    dot.style.top  = my + 'px';
    requestAnimationFrame(tick);
  }
  tick();

  // Hide on touch
  document.addEventListener('touchstart', () => {
    cursor.style.display = 'none';
    dot.style.display = 'none';
  }, { passive: true });
}

/* ══════════════════════════════════════════════
   LOADER
══════════════════════════════════════════════ */
function initLoader(onDone) {
  const loader = document.getElementById('loader');
  const fill   = document.getElementById('loader-fill');
  const status = document.getElementById('loader-status');

  const steps = ['Iniciando...', 'Construindo boné...', 'Calibrando shaders...', 'Pronto.'];
  let step = 0, pct = 0;

  const loaderScene = initLoaderScene();

  const interval = setInterval(() => {
    pct += 25 + Math.random() * 10;
    if (pct > 100) pct = 100;
    fill.style.width = pct + '%';
    if (status && step < steps.length) status.textContent = steps[step++];
    if (pct >= 100) {
      clearInterval(interval);
      setTimeout(() => {
        loader.classList.add('hidden');
        if (loaderScene) loaderScene.destroy();
        onDone();
      }, 500);
    }
  }, 280);
}

/* ══════════════════════════════════════════════
   NAV
══════════════════════════════════════════════ */
function initNav() {
  const nav    = document.getElementById('nav');
  const burger = document.getElementById('nav-burger');
  const mobileNav = document.getElementById('mobile-nav');

  window.addEventListener('scroll', () => {
    nav.classList.toggle('scrolled', window.scrollY > 60);
  });

  burger?.addEventListener('click', () => {
    const open = mobileNav.classList.toggle('open');
    burger.setAttribute('aria-expanded', open);
    mobileNav.setAttribute('aria-hidden', !open);
    document.body.style.overflow = open ? 'hidden' : '';
  });

  document.querySelectorAll('.mobile-nav-link').forEach(link => {
    link.addEventListener('click', () => {
      mobileNav.classList.remove('open');
      burger.setAttribute('aria-expanded', 'false');
      mobileNav.setAttribute('aria-hidden', 'true');
      document.body.style.overflow = '';
    });
  });
}

/* ══════════════════════════════════════════════
   GSAP SCROLL ANIMATIONS
══════════════════════════════════════════════ */
function initGSAP() {
  if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') return;

  gsap.registerPlugin(ScrollTrigger);

  /* Hero title char animation */
  const heroTitle = document.getElementById('hero-title');
  if (heroTitle) {
    const text = heroTitle.textContent;
    heroTitle.innerHTML = text.split('').map((c, i) =>
      `<span class="char" style="animation-delay:${0.05 + i * 0.06}s">${c}</span>`
    ).join('');
  }

  /* Hero sub word animation */
  const heroSub = document.getElementById('hero-sub');
  if (heroSub) {
    const html = heroSub.innerHTML;
    const lines = html.split('<br>');
    heroSub.innerHTML = lines.map((line, li) =>
      `<span class="word" style="display:block;animation-delay:${0.8 + li * 0.15}s">${line}</span>`
    ).join('');
  }

  /* About words */
  const aboutWords = document.querySelectorAll('.about-headline .split-word');
  gsap.fromTo(aboutWords,
    { opacity: 0, y: 40 },
    {
      opacity: 1, y: 0, duration: 0.8, stagger: 0.12, ease: 'power3.out',
      scrollTrigger: { trigger: '.about-headline', start: 'top 80%' }
    }
  );

  /* Service cards stagger */
  gsap.fromTo('.service-card',
    { opacity: 0, rotateX: 20, y: 60 },
    {
      opacity: 1, rotateX: 0, y: 0,
      duration: 0.8, stagger: 0.12, ease: 'power3.out',
      scrollTrigger: { trigger: '.services-grid', start: 'top 80%' }
    }
  );

  /* Project cards stagger */
  gsap.fromTo('.project-card',
    { opacity: 0, y: 50 },
    {
      opacity: 1, y: 0,
      duration: 0.7, stagger: 0.1, ease: 'power3.out',
      scrollTrigger: { trigger: '.projects-grid', start: 'top 80%' }
    }
  );

  /* Stats counter */
  document.querySelectorAll('.stat-num').forEach(el => {
    ScrollTrigger.create({
      trigger: el,
      start: 'top 85%',
      once: true,
      onEnter() {
        const target = parseFloat(el.textContent);
        if (isNaN(target)) return;
        gsap.fromTo(el,
          { textContent: 0 },
          { textContent: target, duration: 1.5, ease: 'power2.out',
            snap: { textContent: 1 },
            onUpdate() {
              el.textContent = Math.round(Number(el.textContent));
              if (target > 10) el.textContent += '+';
            }
          }
        );
      }
    });
  });

  /* Section titles */
  gsap.utils.toArray('.section-title').forEach(el => {
    gsap.fromTo(el,
      { opacity: 0, y: 30 },
      {
        opacity: 1, y: 0, duration: 0.9, ease: 'power3.out',
        scrollTrigger: { trigger: el, start: 'top 85%' }
      }
    );
  });

  /* Contact form */
  gsap.fromTo('.contact-form',
    { opacity: 0, y: 40 },
    {
      opacity: 1, y: 0, duration: 0.9, ease: 'power3.out',
      scrollTrigger: { trigger: '.contact-form', start: 'top 85%' }
    }
  );

  /* About body text */
  gsap.fromTo('.about-body',
    { opacity: 0, x: -20 },
    {
      opacity: 1, x: 0, duration: 0.8, stagger: 0.2, ease: 'power2.out',
      scrollTrigger: { trigger: '.about-text', start: 'top 80%' }
    }
  );

  /* Badges */
  gsap.fromTo('.badge',
    { opacity: 0, scale: 0.8 },
    {
      opacity: 1, scale: 1, duration: 0.5, stagger: 0.06, ease: 'back.out(1.7)',
      scrollTrigger: { trigger: '.about-badges', start: 'top 90%' }
    }
  );
}

/* ══════════════════════════════════════════════
   PROJECT VISUALS (procedural canvas backgrounds)
══════════════════════════════════════════════ */
function initProjectVisuals() {
  document.querySelectorAll('.project-visual').forEach(el => {
    const color = el.dataset.color || '#C4A96B';
    const canvas = document.createElement('canvas');
    canvas.width = 800; canvas.height = 400;
    const ctx = canvas.getContext('2d');

    // Dark base
    ctx.fillStyle = '#0d0d0d';
    ctx.fillRect(0, 0, 800, 400);

    // Gradient overlay
    const grad = ctx.createRadialGradient(400, 200, 0, 400, 200, 400);
    grad.addColorStop(0, color + '22');
    grad.addColorStop(1, 'transparent');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 800, 400);

    // Grid lines
    ctx.strokeStyle = color + '15';
    ctx.lineWidth = 1;
    for (let x = 0; x < 800; x += 40) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, 400); ctx.stroke();
    }
    for (let y = 0; y < 400; y += 40) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(800, y); ctx.stroke();
    }

    // Diagonal accent
    ctx.strokeStyle = color + '30';
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(0, 400); ctx.lineTo(800, 0); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(100, 400); ctx.lineTo(900, 0); ctx.stroke();

    // Glow dot
    const glow = ctx.createRadialGradient(200, 200, 0, 200, 200, 150);
    glow.addColorStop(0, color + '40');
    glow.addColorStop(1, 'transparent');
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, 800, 400);

    el.style.backgroundImage = `url(${canvas.toDataURL()})`;
    el.style.backgroundSize = 'cover';
  });
}

/* ══════════════════════════════════════════════
   CONTACT FORM
══════════════════════════════════════════════ */
function initContactForm() {
  const form = document.getElementById('contact-form');
  const btn  = document.getElementById('btn-submit');
  if (!form || !btn) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btnText = btn.querySelector('.btn-submit-text');

    btn.disabled = true;
    btnText.textContent = 'Enviando...';

    // Simulate send (replace with real endpoint)
    await new Promise(r => setTimeout(r, 1200));

    btn.classList.add('success');
    btnText.textContent = '✓ Mensagem enviada!';

    // Particle burst effect
    spawnSuccessParticles(btn);

    setTimeout(() => {
      btn.disabled = false;
      btn.classList.remove('success');
      btnText.textContent = 'Enviar mensagem';
      form.reset();
    }, 3500);
  });
}

function spawnSuccessParticles(btn) {
  const rect = btn.getBoundingClientRect();
  const cx = rect.left + rect.width / 2;
  const cy = rect.top + rect.height / 2;

  for (let i = 0; i < 18; i++) {
    const p = document.createElement('div');
    const angle = (i / 18) * Math.PI * 2;
    const dist = 60 + Math.random() * 60;
    Object.assign(p.style, {
      position: 'fixed',
      left: cx + 'px', top: cy + 'px',
      width: '6px', height: '6px',
      borderRadius: '50%',
      background: i % 2 === 0 ? '#C4A96B' : '#E8E2D9',
      pointerEvents: 'none',
      zIndex: '9999',
      transform: 'translate(-50%,-50%)',
      transition: `all 0.8s cubic-bezier(0,0.8,0.5,1)`,
    });
    document.body.appendChild(p);
    requestAnimationFrame(() => {
      p.style.left = (cx + Math.cos(angle) * dist) + 'px';
      p.style.top  = (cy + Math.sin(angle) * dist) + 'px';
      p.style.opacity = '0';
      p.style.transform = 'translate(-50%,-50%) scale(0)';
    });
    setTimeout(() => p.remove(), 900);
  }
}

/* ══════════════════════════════════════════════
   FOOTER EASTER EGG
══════════════════════════════════════════════ */
function initEasterEgg(footerCapScene) {
  const btn = document.getElementById('footer-logo');
  const panel = document.getElementById('footer-cap-easter');
  if (!btn || !panel) return;

  btn.addEventListener('click', () => {
    panel.classList.add('visible');
    footerCapScene?.startSpin();
    setTimeout(() => panel.classList.remove('visible'), 2500);
  });
}

/* ══════════════════════════════════════════════
   SMOOTH SCROLL
══════════════════════════════════════════════ */
function initSmoothScroll() {
  document.querySelectorAll('a[href^="#"]').forEach(a => {
    a.addEventListener('click', e => {
      e.preventDefault();
      const target = document.querySelector(a.getAttribute('href'));
      if (target) target.scrollIntoView({ behavior: 'smooth' });
    });
  });
}

/* ══════════════════════════════════════════════
   BOOT
══════════════════════════════════════════════ */
initCursor();
initNav();
initSmoothScroll();

initLoader(() => {
  // Init all Three.js scenes
  initHeroScene();
  initAvatarScene();
  initServiceScenes();
  initContactScene();

  const footerCap = initFooterCapScene();
  initEasterEgg(footerCap);

  // Project canvas backgrounds
  initProjectVisuals();

  // GSAP animations
  initGSAP();

  // Form
  initContactForm();
});
