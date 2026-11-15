/* ==========================================================================
   ÁSPERUS — app.js
   Editorial portfolio interactions, local answer engine and contact flow.
   ========================================================================== */

import { initStage } from './stage.js?v=2.0.0';
import { createFooterObject } from './object.js?v=2.0.0';

const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ==========================================================================
   SCROLL LOCK
   ========================================================================== */

let scrollLocks = 0;
function lockScroll(lock) {
  scrollLocks = Math.max(0, scrollLocks + (lock ? 1 : -1));
  document.body.classList.toggle('is-locked', scrollLocks > 0);
}

/* ==========================================================================
   HERO TITLE
   ========================================================================== */

function splitHeroTitle() {
  const title = $('#hero-title');
  if (!title) return null;

  const label = (title.getAttribute('aria-label') || title.textContent || 'ÁSPERUS').trim();
  title.setAttribute('aria-label', label);
  title.textContent = '';

  const fragment = document.createDocumentFragment();
  Array.from(label).forEach((character, index) => {
    const outer = document.createElement('span');
    outer.className = 'hero__letter';
    outer.style.setProperty('--i', String(index));
    outer.setAttribute('aria-hidden', 'true');

    const inner = document.createElement('span');
    inner.className = 'hero__letter-inner';
    inner.textContent = character === ' ' ? '\u00A0' : character;

    outer.appendChild(inner);
    fragment.appendChild(outer);
  });

  title.appendChild(fragment);
  title.classList.add('is-split');
  return title;
}

/* ==========================================================================
   CUSTOM CURSOR
   ========================================================================== */

function initCursor() {
  const cursor = $('#cursor');
  const label = $('#cursor-label');
  if (!cursor) return;

  const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  if (!finePointer) return;

  [
    ['#ask-nav', 'Perguntar'],
    ['#ask-fab', 'Perguntar'],
    ['#footer-mark', 'Revelar objeto'],
    ['.project__toggle', 'Abrir case'],
    ['.service__ask', 'Perguntar'],
    ['.submit', 'Enviar'],
  ].forEach(([selector, text]) => {
    $$(selector).forEach((el) => {
      if (!el.dataset.cursor) el.dataset.cursor = text;
    });
  });

  document.body.classList.add('has-cursor');

  const useGsap = typeof window.gsap !== 'undefined';
  let pointerX = window.innerWidth / 2;
  let pointerY = window.innerHeight / 2;
  let currentX = pointerX;
  let currentY = pointerY;
  let cursorRaf = 0;

  if (useGsap) {
    window.gsap.set(cursor, { xPercent: -50, yPercent: -50 });
    const moveX = window.gsap.quickTo(cursor, 'x', { duration: 0.18, ease: 'power2.out' });
    const moveY = window.gsap.quickTo(cursor, 'y', { duration: 0.18, ease: 'power2.out' });
    window.addEventListener('pointermove', (event) => {
      if (event.pointerType && event.pointerType !== 'mouse') return;
      moveX(event.clientX);
      moveY(event.clientY);
    }, { passive: true });
  } else {
    window.addEventListener('pointermove', (event) => {
      if (event.pointerType && event.pointerType !== 'mouse') return;
      pointerX = event.clientX;
      pointerY = event.clientY;
    }, { passive: true });

    const tick = () => {
      currentX += (pointerX - currentX) * 0.18;
      currentY += (pointerY - currentY) * 0.18;
      cursor.style.transform = `translate3d(${currentX}px, ${currentY}px, 0) translate(-50%, -50%)`;
      cursorRaf = requestAnimationFrame(tick);
    };
    cursorRaf = requestAnimationFrame(tick);
    window.addEventListener('pagehide', () => cancelAnimationFrame(cursorRaf), { once: true });
  }

  const interactive = 'a, button, [data-cursor], input, textarea, select, label, .project';

  document.addEventListener('pointerover', (event) => {
    if (event.pointerType && event.pointerType !== 'mouse') return;
    const target = event.target.closest ? event.target.closest(interactive) : null;
    if (!target) return;
    cursor.classList.add('is-hover');
    if (label) label.textContent = target.getAttribute('data-cursor') || '';
  });

  document.addEventListener('pointerout', (event) => {
    if (event.pointerType && event.pointerType !== 'mouse') return;
    const target = event.target.closest ? event.target.closest(interactive) : null;
    if (!target) return;
    const next = event.relatedTarget && event.relatedTarget.closest
      ? event.relatedTarget.closest(interactive)
      : null;
    if (next) return;
    cursor.classList.remove('is-hover');
    if (label) label.textContent = '';
  });

  document.addEventListener('mouseleave', () => { cursor.style.opacity = '0'; });
  document.addEventListener('mouseenter', () => { cursor.style.opacity = ''; });
  window.addEventListener('blur', () => cursor.classList.remove('is-hover'));
}

/* ==========================================================================
   NAVIGATION, MENU, RAIL AND SCROLL PROGRESS
   ========================================================================== */

function smoothScrollTo(selector) {
  const target = document.querySelector(selector);
  if (!target) return;

  const nav = $('#nav');
  const offset = (nav ? nav.offsetHeight : 0) + 18;
  const top = target.id === 'hero' || target.id === 'main'
    ? 0
    : Math.max(0, target.getBoundingClientRect().top + window.scrollY - offset);

  window.scrollTo({ top, behavior: reduceMotion ? 'auto' : 'smooth' });

  try {
    history.replaceState(null, '', selector);
  } catch (_) { /* file:// or restricted history */ }
}

function initNavigation() {
  const nav = $('#nav');
  const burger = $('#nav-burger');
  const menu = $('#mobile-menu');
  const menuClose = $('#menu-close');
  const navLinks = $$('[data-nav]');
  const railIndex = $('#rail-index');
  const railName = $('#rail-name');
  const progressFill = $('#scroll-progress-fill');
  const sections = ['hero', 'about', 'services', 'projects', 'process', 'contact']
    .map((id) => document.getElementById(id))
    .filter(Boolean);

  let menuOpen = false;
  let menuReturnFocus = null;

  if (menu) {
    menu.inert = true;

    const focusablesInMenu = () => $$('a, button, input, textarea, [tabindex]:not([tabindex="-1"])', menu)
      .filter((el) => !el.hasAttribute('disabled') && el.offsetParent !== null);

    const setMenu = (open, restoreFocus = true) => {
      if (open === menuOpen) return;

      if (open) {
        menuReturnFocus = document.activeElement;
        menuOpen = true;
        menu.classList.add('is-open');
        menu.setAttribute('aria-hidden', 'false');
        menu.inert = false;
        if (burger) {
          burger.setAttribute('aria-expanded', 'true');
          burger.setAttribute('aria-label', 'Fechar menu');
        }
        lockScroll(true);
        window.setTimeout(() => {
          const first = focusablesInMenu()[0];
          if (first) first.focus({ preventScroll: true });
        }, 260);
      } else {
        menuOpen = false;
        menu.classList.remove('is-open');
        menu.inert = true;
        menu.setAttribute('aria-hidden', 'true');
        if (document.activeElement && menu.contains(document.activeElement)) document.activeElement.blur();
        if (burger) {
          burger.setAttribute('aria-expanded', 'false');
          burger.setAttribute('aria-label', 'Abrir menu');
        }
        lockScroll(false);
        if (restoreFocus && menuReturnFocus && menuReturnFocus.focus) {
          menuReturnFocus.focus({ preventScroll: true });
        }
        menuReturnFocus = null;
      }
    };

    window.__asperusSetMenu = setMenu;

    if (burger) {
      burger.addEventListener('click', () => setMenu(!menuOpen));
    }
    if (menuClose) {
      menuClose.addEventListener('click', () => setMenu(false));
    }

    menu.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        setMenu(false);
        return;
      }
      if (event.key !== 'Tab') return;

      const items = focusablesInMenu();
      if (!items.length) return;
      const first = items[0];
      const last = items[items.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    });
  }

  const setMenuClosed = () => {
    if (window.__asperusSetMenu) window.__asperusSetMenu(false, false);
  };

  function updateChrome() {
    const y = window.scrollY || window.pageYOffset || 0;
    const vh = window.innerHeight;
    const maxScroll = Math.max(1, document.documentElement.scrollHeight - vh);

    if (nav) nav.classList.toggle('is-scrolled', y > 36);

    if (progressFill) {
      progressFill.style.transform = `scaleX(${Math.min(1, Math.max(0, y / maxScroll)).toFixed(4)})`;
    }

    const marker = y + vh * 0.38;
    let active = sections[0];
    sections.forEach((section) => {
      const top = section.getBoundingClientRect().top + y;
      if (top <= marker) active = section;
    });

    if (active) {
      navLinks.forEach((link) => {
        link.classList.toggle('is-active', link.dataset.nav === active.id);
      });
      if (railIndex) railIndex.textContent = active.dataset.section || '00';
      if (railName) railName.textContent = active.dataset.name || 'ÁSPERUS';
      document.body.dataset.section = active.id;
    }
  }

  let framePending = false;
  const requestChromeUpdate = () => {
    if (framePending) return;
    framePending = true;
    requestAnimationFrame(() => {
      framePending = false;
      updateChrome();
    });
  };

  window.addEventListener('scroll', requestChromeUpdate, { passive: true });
  window.addEventListener('resize', requestChromeUpdate, { passive: true });
  window.addEventListener('asperus:ready', requestChromeUpdate);
  updateChrome();

  /* Same-page anchors: close overlays first, then scroll with nav offset. */
  document.addEventListener('click', (event) => {
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    const link = event.target.closest ? event.target.closest('a[href^="#"]') : null;
    if (!link) return;

    const href = link.getAttribute('href');
    if (!href || href === '#') return;
    const target = document.querySelector(href);
    if (!target) return;

    event.preventDefault();
    if (window.__asperusCloseAI) window.__asperusCloseAI(false);
    setMenuClosed();
    requestAnimationFrame(() => smoothScrollTo(href));
  });

  window.__asperusCloseMenu = setMenuClosed;
}

/* ==========================================================================
   REVEALS
   ========================================================================== */

let revealsInitialised = false;

function initReveals() {
  if (revealsInitialised) return;
  revealsInitialised = true;

  $$('.service-list').forEach((list) => {
    $$('.service', list).forEach((item, index) => {
      item.style.setProperty('--d', `${index * 70}ms`);
    });
  });
  $$('.process__steps').forEach((list) => {
    $$('li', list).forEach((item, index) => {
      item.style.setProperty('--d', `${index * 80}ms`);
    });
  });
  $$('.stats > div').forEach((item, index) => {
    item.style.setProperty('--d', `${index * 60}ms`);
  });

  const items = $$('[data-reveal]');

  if (reduceMotion || !('IntersectionObserver' in window)) {
    items.forEach((item) => item.classList.add('in-view'));
    return;
  }

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('in-view');
      observer.unobserve(entry.target);
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });

  items.forEach((item) => observer.observe(item));
}

/* ==========================================================================
   PROJECTS
   ========================================================================== */

function initProjects() {
  const projects = $$('.project');
  const preview = $('#project-preview');
  const previewMark = $('#preview-mark');
  const previewIndex = $('#preview-index');
  const previewName = $('#preview-name');
  const previewYear = $('#preview-year');
  let previewTimer = 0;

  function applyPreview(project, animate) {
    if (!preview || !project) return;

    preview.style.setProperty('--accent', project.dataset.accent || '#C8A96A');

    const mark = project.dataset.mark || '·';
    const index = $('.project__index', project)?.textContent || '01';
    const name = $('.project__title', project)?.textContent || '';
    const year = $('.project__year', project)?.textContent || '';

    const write = () => {
      if (previewMark) previewMark.textContent = mark;
      if (previewIndex) previewIndex.textContent = index.trim();
      if (previewName) previewName.textContent = name.trim();
      if (previewYear) previewYear.textContent = year.trim();
      if (previewMark) previewMark.classList.remove('is-changing');
    };

    window.clearTimeout(previewTimer);

    if (!animate) {
      write();
      return;
    }

    if (previewMark) previewMark.classList.add('is-changing');
    previewTimer = window.setTimeout(write, 90);

    projects.forEach((item) => item.classList.toggle('is-active', item === project));
  }

  projects.forEach((project) => {
    project.addEventListener('mouseenter', () => applyPreview(project, true));
    project.addEventListener('focusin', () => applyPreview(project, true));

    const toggle = $('.project__toggle', project);
    if (!toggle) return;

    toggle.addEventListener('click', () => {
      const shouldOpen = !project.classList.contains('is-open');

      projects.forEach((other) => {
        other.classList.remove('is-open');
        const otherToggle = $('.project__toggle', other);
        if (otherToggle) otherToggle.setAttribute('aria-expanded', 'false');
      });

      project.classList.toggle('is-open', shouldOpen);
      toggle.setAttribute('aria-expanded', String(shouldOpen));
      applyPreview(project, true);
    });
  });

  if (projects[0]) applyPreview(projects[0], false);

  $$('[data-fill-project]').forEach((button) => {
    button.addEventListener('click', () => {
      const name = button.dataset.fillProject || 'um novo projeto';
      const message = $('#field-msg');
      if (message) {
        message.value = `Olá, Renato. Quero conversar sobre um projeto parecido com o ${name}. Meu contexto é: `;
        message.dispatchEvent(new Event('input', { bubbles: true }));
      }
      smoothScrollTo('#contact');
      window.setTimeout(() => {
        if (message && window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
          message.focus({ preventScroll: true });
          message.setSelectionRange(message.value.length, message.value.length);
        }
      }, 620);
    });
  });
}

/* ==========================================================================
   CONTACT FORM
   ========================================================================== */

function initContactForm() {
  const form = $('#contact-form');
  if (!form) return;

  const nameField = $('#field-name');
  const emailField = $('#field-email');
  const messageField = $('#field-msg');
  const counter = $('#msg-count');
  const status = $('#form-status');
  const button = $('#btn-submit');
  const buttonText = button ? $('.submit__text', button) : null;
  const fallback = $('#form-fallback');
  const endpoint = form.dataset.endpoint || '/api/contact';

  const setStatus = (text, isError = false) => {
    if (!status) return;
    status.textContent = text;
    status.classList.toggle('is-error', Boolean(isError));
  };

  const setInvalid = (field, invalid) => {
    if (!field) return;
    if (invalid) field.setAttribute('aria-invalid', 'true');
    else field.removeAttribute('aria-invalid');
  };

  const updateCounter = () => {
    if (counter && messageField) counter.textContent = `${messageField.value.length} / 2000`;
  };

  if (messageField) {
    messageField.addEventListener('input', updateCounter);
    updateCounter();
  }

  const setLoading = (loading) => {
    if (!button) return;
    button.disabled = loading;
    if (buttonText) buttonText.textContent = loading ? 'Enviando…' : 'Enviar mensagem';
  };

  const resetSuccess = () => {
    if (!button) return;
    button.disabled = false;
    button.classList.remove('is-success');
    if (buttonText) buttonText.textContent = 'Enviar mensagem';
    setStatus('');
  };

  const showMailFallback = (name, email, message) => {
    const subject = encodeURIComponent(`[ÁSPERUS] Contato de ${name || 'site'}`);
    const body = encodeURIComponent(
      `${message || ''}\n\n— ${name || ''}\n${email || ''}`.trim()
    );
    const href = `mailto:renato@asperus.dev?subject=${subject}&body=${body}`;

    if (fallback) {
      fallback.hidden = false;
      fallback.innerHTML = `Não consegui enviar pelo site neste momento. <a href="${href}">Abrir a mensagem no seu e-mail</a> — ela já vai preenchida.`;
    }
    setStatus('Envio pelo site indisponível. Use o e-mail direto ao lado.', true);
  };

  form.addEventListener('submit', async (event) => {
    event.preventDefault();

    const honeypot = $('#field-hp');
    if (honeypot && honeypot.value.trim()) {
      form.reset();
      updateCounter();
      return;
    }

    if (fallback) {
      fallback.hidden = true;
      fallback.innerHTML = '';
    }

    const name = nameField ? nameField.value.trim() : '';
    const email = emailField ? emailField.value.trim() : '';
    const message = messageField ? messageField.value.trim() : '';

    setInvalid(nameField, false);
    setInvalid(emailField, false);
    setInvalid(messageField, false);

    if (name.length < 2) {
      setInvalid(nameField, true);
      setStatus('Diga como posso te chamar.', true);
      if (nameField) nameField.focus();
      return;
    }

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
    if (!emailPattern.test(email) || email.length > 150) {
      setInvalid(emailField, true);
      setStatus('Preciso de um e-mail válido para responder.', true);
      if (emailField) emailField.focus();
      return;
    }

    if (message.length < 8) {
      setInvalid(messageField, true);
      setStatus('Conte um pouco mais sobre o que você quer construir.', true);
      if (messageField) messageField.focus();
      return;
    }

    setStatus('');
    setLoading(true);

    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 12000);

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({
          name,
          email,
          message,
          _gotcha: '',
          source: window.location.href,
        }),
        signal: controller.signal,
      });

      window.clearTimeout(timeout);

      let payload = null;
      try { payload = await response.json(); } catch (_) { payload = null; }

      if (response.ok && (!payload || payload.success !== false)) {
        form.reset();
        updateCounter();
        setInvalid(nameField, false);
        setInvalid(emailField, false);
        setInvalid(messageField, false);
        if (button) {
          button.disabled = true;
          button.classList.add('is-success');
        }
        if (buttonText) buttonText.textContent = 'Mensagem enviada';
        setStatus('Recebido. Respondo em até 24h, direto de quem escreve o código.');
        window.setTimeout(resetSuccess, 9000);
        return;
      }

      if (response.status === 429) {
        setStatus('Muitas mensagens em pouco tempo. Tente novamente em alguns minutos.', true);
      } else if (payload && payload.error) {
        setStatus(String(payload.error).slice(0, 180), true);
      } else {
        showMailFallback(name, email, message);
      }
    } catch (_) {
      window.clearTimeout(timeout);
      showMailFallback(name, email, message);
    } finally {
      if (button && !button.classList.contains('is-success')) setLoading(false);
    }
  });
}

/* ==========================================================================
   LOCAL ANSWER ENGINE
   ========================================================================== */

const normalize = (text) => String(text)
  .toLowerCase()
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .replace(/[^a-z0-9\s]/g, ' ')
  .replace(/\s+/g, ' ')
  .trim();

const escapeAttribute = (value) => String(value)
  .replace(/&/g, '&amp;')
  .replace(/"/g, '&quot;')
  .replace(/</g, '&lt;');

const INTENTS = [
  {
    id: 'nexus',
    test: /nexus|sete planilhas|operaca/,
    keywords: ['nexus', 'plataforma', 'operacoes', 'planilha', 'redis'],
    answer: '<strong>Nexus Platform</strong> (2025) substituiu sete planilhas por um modelo de dados único, permissões por papel e uma interface que abre no navegador sem manual. Uma operação inteira em um só lugar. Stack: React, Node.js, PostgreSQL e Redis.',
    actions: [
      { label: 'Abrir projeto', href: '#projects' },
      { label: 'Conversar sobre algo parecido', href: '#contact' },
    ],
  },
  {
    id: 'orbit',
    test: /orbit|dashboard|analytics|tempo real/,
    keywords: ['orbit', 'dashboard', 'analytics', 'relatorio', 'websocket'],
    answer: '<strong>Orbit Dashboard</strong> (2025) levou analytics em tempo real para times não técnicos. Pipeline de eventos, cache agressivo e visualizações desenhadas para leitura rápida — não para decorar tela. Stack: Next.js, TypeScript, AWS e WebSockets.',
    actions: [
      { label: 'Abrir projeto', href: '#projects' },
      { label: 'Conversar sobre algo parecido', href: '#contact' },
    ],
  },
  {
    id: 'flux',
    test: /flux|gateway|microsservic|rate limit|observabilidade/,
    keywords: ['flux', 'gateway', 'api', 'microsservico', 'opentelemetry'],
    answer: '<strong>Flux API Gateway</strong> (2024) normaliza autenticação, rate limit e observabilidade para múltiplos serviços. Uma camada fina em Go, contrato explícito e métricas no mesmo lugar. Resultado: menos duplicação e diagnóstico mais rápido. Stack: Go, Cloudflare, microsserviços e OpenTelemetry.',
    actions: [
      { label: 'Abrir projeto', href: '#projects' },
      { label: 'Conversar sobre algo parecido', href: '#contact' },
    ],
  },
  {
    id: 'vela',
    test: /vela|commerce|e.?commerce|checkout|loja|vendas/,
    keywords: ['vela', 'commerce', 'checkout', 'loja', 'mobile'],
    answer: '<strong>Vela Commerce</strong> (2023) nasceu mobile-first: checkout curto, catálogo leve e conexão instável tratada como requisito, não exceção. A compra deixou de ser um teste de paciência. Stack: React Native, Stripe e Firebase.',
    actions: [
      { label: 'Abrir projeto', href: '#projects' },
      { label: 'Conversar sobre algo parecido', href: '#contact' },
    ],
  },
  {
    id: 'availability',
    test: /disponivel|disponibilidade|aceitando|agenda|agenda aberta|esta livre|tem vaga|proximo projeto/,
    keywords: ['disponivel', 'disponibilidade', 'aceitando', 'agenda', 'livre', 'vaga'],
    answer: 'Sim — estou aceitando <strong>um novo projeto</strong>. Respondo em até 24h, direto de quem vai escrever o código. Se o timing for apertado, me diga na primeira mensagem.',
    actions: [
      { label: 'Falar sobre meu projeto', href: '#contact' },
      { label: 'Enviar e-mail', href: 'mailto:renato@asperus.dev' },
    ],
  },
  {
    id: 'projects',
    test: /projetos?|cases?|portfolio|trabalhos?|o que ja (fez|construiu|entregou)/,
    keywords: ['projeto', 'projetos', 'case', 'cases', 'portfolio', 'trabalho', 'trabalhos'],
    answer: 'Quatro peças abertas na seção de projetos: <strong>Nexus Platform</strong> (operações), <strong>Orbit Dashboard</strong> (analytics), <strong>Flux API Gateway</strong> (infraestrutura) e <strong>Vela Commerce</strong> (commerce mobile-first). Cada uma mostra contexto, decisão e resultado — sem estudo de caso inflado.',
    actions: [
      { label: 'Abrir projetos', href: '#projects' },
      { label: 'Ver serviços', href: '#services' },
      { label: 'Falar com o dev', href: '#contact' },
    ],
  },
  {
    id: 'pricing',
    test: /preco|valor|quanto custa|quanto sai|orcamento|investimento|budget|custo|barato|caro/,
    keywords: ['preco', 'valor', 'custa', 'custo', 'orcamento', 'investimento', 'budget'],
    answer: 'Não trabalho com tabela fixa. O valor depende do escopo, do risco e do que já existe. A proposta é curta e explícita: o que entra, o que fica fora e quanto custa. Me conte o contexto e eu devolvo um número — sem faixa elástica para negociar depois.',
    actions: [
      { label: 'Pedir uma proposta', href: '#contact' },
      { label: 'Ver o que eu faço', href: '#services' },
    ],
  },
  {
    id: 'timeline',
    test: /prazo|quanto tempo|quando (fica|sai|entrega)|pra quando|semanas|meses|cronograma/,
    keywords: ['prazo', 'tempo', 'semanas', 'meses', 'cronograma', 'entrega'],
    answer: 'Um MVP costuma sair em <strong>semanas, não trimestres</strong>. O prazo real depende do escopo e das integrações. Na primeira conversa eu já digo o que é possível — e o que não é. Entrega curta, revisada a cada ciclo.',
    actions: [
      { label: 'Falar sobre prazos', href: '#contact' },
      { label: 'Ver o processo', href: '#process' },
    ],
  },
  {
    id: 'contact',
    test: /contato|e.?mail|falar|conversar|mensagem|whatsapp|telefone|contratar|chamar/,
    keywords: ['contato', 'email', 'falar', 'conversar', 'mensagem', 'contratar', 'whatsapp'],
    answer: 'O caminho mais direto é <strong>renato@asperus.dev</strong>. Também estou no GitHub (<strong>datomoliveira</strong>) e no Instagram (<strong>@asperusagency</strong>). O formulário do site cai na mesma caixa.',
    actions: [
      { label: 'Enviar e-mail', href: 'mailto:renato@asperus.dev' },
      { label: 'Abrir contato', href: '#contact' },
      { label: 'GitHub', href: 'https://github.com/datomoliveira' },
    ],
  },
  {
    id: 'webdev',
    test: /desenvolvimento web|faz site|fazer site|website|landing page|front.?end|back.?end|full.?stack|aplicacao web|web app/,
    keywords: ['site', 'website', 'web', 'frontend', 'backend', 'landing', 'aplicacao', 'fullstack'],
    answer: '<strong>Desenvolvimento web</strong> é front, back e infra na mesma linha: React/Next no cliente, Node ou Go no servidor, PostgreSQL e deploy em Cloudflare/AWS. Você recebe o fluxo inteiro funcionando — não uma pasta de arquivos para alguém montar depois.',
    actions: [
      { label: 'Ver serviços', href: '#services' },
      { label: 'Pedir uma proposta', href: '#contact' },
    ],
  },
  {
    id: 'architecture',
    test: /arquitetura|backend|api|gateway|escal|sistema|infra|cloud|microsservic|banco de dados/,
    keywords: ['arquitetura', 'backend', 'api', 'sistema', 'infra', 'cloud', 'escala', 'banco'],
    answer: 'Sistemas desenhados para durar: modelo de dados claro, permissões explícitas, cache onde faz sentido e observabilidade desde o primeiro deploy. Sem sobre-engenharia para impressionar slide. A arquitetura existe para reduzir risco — não para gerar diagrama.',
    actions: [
      { label: 'Ver arquitetura', href: '#services' },
      { label: 'Conversar sobre o sistema', href: '#contact' },
    ],
  },
  {
    id: 'product',
    test: /produto digital|mvp|aplicativo|app|saas|plataforma|design|figma|prototip|e.?commerce|dashboard/,
    keywords: ['produto', 'mvp', 'aplicativo', 'app', 'saas', 'plataforma', 'design', 'prototipo'],
    answer: 'Do produto digital ao MVP com escopo curto: uma fatia útil no ar em semanas, com espaço para aprender antes de investir no resto. Produto não precisa nascer com 40 telas — precisa nascer resolvendo algo real.',
    actions: [
      { label: 'Ver produtos digitais', href: '#services' },
      { label: 'Falar sobre o MVP', href: '#contact' },
    ],
  },
  {
    id: 'consulting',
    test: /consultoria|auditoria|diagnostico|revisao de codigo|code review|melhorar o time|destravar/,
    keywords: ['consultoria', 'auditoria', 'diagnostico', 'revisao', 'destravar'],
    answer: 'Consultoria aqui é diagnóstico direto: eu entro, leio o código e o desenho atual, aponto o que está segurando o time e o que muda o jogo. Sem relatório de 80 páginas. Se o gargalo for outro, eu falo.',
    actions: [
      { label: 'Ver consultoria', href: '#services' },
      { label: 'Agendar um diagnóstico', href: '#contact' },
    ],
  },
  {
    id: 'maintenance',
    test: /manutencao|suporte|evolucao|continuidade|acompanhamento|sustentacao/,
    keywords: ['manutencao', 'suporte', 'evolucao', 'continuidade', 'sustentacao'],
    answer: 'Também trabalho com <strong>evolução contínua</strong>: manutenção, novas features, performance e dívida técnica. A diferença é que o mesmo dev que construiu continua responsável — sem repassar contexto para uma equipe que nunca viu o projeto.',
    actions: [
      { label: 'Falar sobre continuidade', href: '#contact' },
      { label: 'Ver o processo', href: '#process' },
    ],
  },
  {
    id: 'process',
    test: /processo|como (voce )?trabalha|metodologia|etapas?|como funciona o trabalho|discovery|deploy/,
    keywords: ['processo', 'trabalha', 'metodologia', 'etapa', 'etapas', 'discovery', 'deploy'],
    answer: '<strong>Corte</strong> (discovery e escopo), <strong>Costura</strong> (build em ciclos curtos), <strong>Prova</strong> (QA, performance e acessibilidade) e <strong>Acabamento</strong> (deploy, monitoramento e documentação). Você acompanha as decisões e recebe a peça pronta para vestir.',
    actions: [
      { label: 'Ver o processo', href: '#process' },
      { label: 'Começar um projeto', href: '#contact' },
    ],
  },
  {
    id: 'stack',
    test: /stack|tecnologia|linguagem|framework|ferramenta|tech|typescript|react|node|go\b|three|cloudflare/,
    keywords: ['stack', 'tecnologia', 'linguagem', 'framework', 'ferramenta', 'typescript', 'react', 'node', 'three', 'cloudflare'],
    answer: 'TypeScript/React/Next.js, Node.js/Go/PostgreSQL, Three.js/WebGL/GSAP e Cloudflare/AWS/Docker. A stack é meio, não troféu: escolho o que resolve o problema e mantenho o que dá para sustentar.',
    actions: [
      { label: 'Ver repertório', href: '#about' },
      { label: 'Falar sobre requisitos', href: '#contact' },
    ],
  },
  {
    id: 'location',
    test: /onde (voce )?(fica|mora|esta)|localizacao|brasil|fuso|remoto|presencial|atende fora/,
    keywords: ['onde', 'localizacao', 'brasil', 'fuso', 'remoto', 'presencial', 'atende'],
    answer: 'Base no <strong>Brasil (GMT−3)</strong>, trabalhando remoto com times de qualquer fuso. Reuniões curtas, decisões registradas e código no repositório. Presencial não é requisito para entregar bem.',
    actions: [
      { label: 'Falar com o dev', href: '#contact' },
      { label: 'Sobre a ÁSPERUS', href: '#about' },
    ],
  },
  {
    id: 'solo',
    test: /agencia|empresa|equipe|time|sozinho|solo|intermediario|diferencial|por que voce|autoria/,
    keywords: ['agencia', 'empresa', 'equipe', 'time', 'sozinho', 'solo', 'intermediario', 'diferencial'],
    answer: 'Sem camadas. Você fala com quem decide e com quem implementa. A ÁSPERUS é um estúdio solo — isso encurta o caminho entre a ideia e o deploy e elimina o jogo de telefone. Menos ruído, mais código no ar.',
    actions: [
      { label: 'Conhecer a origem', href: '#about' },
      { label: 'Falar direto com o dev', href: '#contact' },
    ],
  },
  {
    id: 'quality',
    test: /seguranca|teste|testes|qualidade|performance|acessibilidade|lento|otimiza|seo|confiavel/,
    keywords: ['seguranca', 'teste', 'testes', 'qualidade', 'performance', 'acessibilidade', 'otimizacao', 'seo'],
    answer: 'Testes, performance, acessibilidade e revisão de código. Cada entrega passa pelo mesmo crivo que eu aplicaria em um produto meu. Se não estiver pronto, não vai para produção. Segurança entra no desenho, não como camada final.',
    actions: [
      { label: 'Ver como trabalho', href: '#process' },
      { label: 'Conversar sobre qualidade', href: '#contact' },
    ],
  },
  {
    id: 'ai',
    test: /busca|assistente|chatbot|pageagent|inteligencia artificial|essa ia|usa ia/,
    keywords: ['busca', 'assistente', 'chatbot', 'inteligencia', 'ia'],
    answer: 'A busca deste site roda <strong>100% no seu navegador</strong>, com uma base local do portfólio. Ela não inventa: se a resposta não estiver aqui, oferece o caminho direto para o e-mail. Nos produtos, IA entra só quando resolve um problema real — não como enfeite.',
    actions: [
      { label: 'Ver a stack', ask: 'Qual é a stack?' },
      { label: 'Perguntar outra coisa', href: '#services' },
    ],
  },
  {
    id: 'about',
    test: /quem (e|eh) voce|quem e o renato|sobre voce|o que (voce )?faz|se apresenta|quem sou eu|asperus|origem|historia/,
    keywords: ['quem', 'renato', 'maia', 'sobre', 'asperus', 'desenvolvedor', 'dev', 'origem', 'historia'],
    answer: '<strong>Renato Maia</strong>, desenvolvedor, arquiteto de sistemas e estrategista digital. A ÁSPERUS é um estúdio solo: quem responde, desenha e escreve o código é a mesma pessoa. São 7 anos de estrada e 12+ projetos entregues.',
    actions: [
      { label: 'Ler a origem', href: '#about' },
      { label: 'Ver projetos', href: '#projects' },
      { label: 'Falar com o dev', href: '#contact' },
    ],
  },
  {
    id: 'services',
    test: /servicos?|o que (voce )?(oferece|entrega)|frentes? de trabalho|no que (voce )?pode ajudar/,
    keywords: ['servico', 'servicos', 'oferece', 'entrega', 'frentes', 'ajudar'],
    answer: 'Quatro frentes: <strong>desenvolvimento web</strong> (front, back e infra), <strong>arquitetura de sistemas</strong>, <strong>produtos digitais</strong> (MVP em semanas) e <strong>consultoria técnica</strong>. Um único responsável do começo ao fim.',
    actions: [
      { label: 'Ver serviços', href: '#services' },
      { label: 'Pedir uma proposta', href: '#contact' },
    ],
  },
  {
    id: 'thanks',
    test: /^(obrigad|valeu|vlw|brigad|thanks|thank you)/,
    keywords: ['obrigado', 'obrigada', 'valeu', 'vlw'],
    answer: 'De nada. Se quiser continuar a conversa, o e-mail direto é <strong>renato@asperus.dev</strong>. Respondo em até 24h.',
    actions: [
      { label: 'Enviar e-mail', href: 'mailto:renato@asperus.dev' },
      { label: 'Ver projetos', href: '#projects' },
    ],
  },
  {
    id: 'greeting',
    test: /^(oi|ola|opa|eai|e ai|bom dia|boa tarde|boa noite|hey|hello|hi)\b/,
    keywords: ['oi', 'ola', 'opa', 'eai', 'hey', 'hello'],
    answer: 'Olá. Pergunte sobre serviços, projetos, processo, stack, prazos ou disponibilidade. Ou vá direto ao ponto: me conte o que você quer construir.',
    actions: [
      { label: 'O que você faz?', ask: 'O que você faz?' },
      { label: 'Me mostra os projetos', ask: 'Me mostra os projetos' },
      { label: 'Como você trabalha?', ask: 'Como você trabalha?' },
    ],
  },
  {
    id: 'fallback',
    test: /$^/,
    keywords: [],
    answer: 'Não encontrei isso na base local. Tente perguntar sobre <strong>serviços</strong>, <strong>projetos</strong>, <strong>processo</strong>, <strong>stack</strong>, <strong>prazos</strong> ou <strong>disponibilidade</strong>. Se for algo específico, me escreva em <strong>renato@asperus.dev</strong>.',
    actions: [
      { label: 'Ver serviços', href: '#services' },
      { label: 'Ver projetos', href: '#projects' },
      { label: 'Enviar e-mail', href: 'mailto:renato@asperus.dev' },
    ],
  },
];

function scoreIntent(query, intent) {
  let score = 0;
  if (intent.test && intent.test.test(query)) score += 12;

  const words = query.split(' ').filter(Boolean);

  /* Score each word once: an exact keyword beats a prefix match. */
  words.forEach((word) => {
    let wordScore = 0;
    (intent.keywords || []).forEach((keyword) => {
      if (keyword.includes(' ')) return;
      if (word === keyword) wordScore = Math.max(wordScore, 3);
      else if (keyword.length > 4 && word.startsWith(keyword)) wordScore = Math.max(wordScore, 1);
    });
    score += wordScore;
  });

  (intent.keywords || []).forEach((keyword) => {
    if (keyword.includes(' ') && query.includes(keyword)) score += 5;
  });

  return score;
}

function findIntent(rawQuery) {
  const query = normalize(rawQuery);
  let best = INTENTS[INTENTS.length - 1];
  let bestScore = 0;

  INTENTS.forEach((intent) => {
    if (intent.id === 'fallback') return;
    const score = scoreIntent(query, intent);
    if (score > bestScore) {
      bestScore = score;
      best = intent;
    }
  });

  return { intent: best, score: bestScore, query };
}

function answerHtml(intent) {
  const actions = (intent.actions || []).map((action) => {
    if (action.ask) {
      return `<button type="button" data-ai-ask="${escapeAttribute(action.ask)}">${action.label}</button>`;
    }
    return `<a href="${escapeAttribute(action.href)}">${action.label} <span aria-hidden="true">↗</span></a>`;
  }).join('');

  return `<p class="ai__answer-text">${intent.answer}</p>${actions ? `<div class="ai__actions">${actions}</div>` : ''}`;
}

function sanitizeQuery(value) {
  return String(value || '')
    .replace(/[\u0000-\u001F\u007F]/g, ' ')
    .replace(/[<>]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 160);
}

function initAI() {
  const ai = $('#ai');
  const panel = $('#ai-panel');
  const input = $('#ai-input');
  const form = $('#ai-form');
  const answer = $('#ai-answer');
  const suggestions = $('#ai-suggestions');
  if (!ai || !panel || !input || !form || !answer) return;

  const initialAnswer = answer.innerHTML;
  let aiOpen = false;
  let lastFocus = null;
  let queryToken = 0;
  let queryTimer = 0;

  ai.inert = true;

  const resetAnswer = () => {
    answer.innerHTML = initialAnswer;
    input.value = '';
    queryToken += 1;
    window.clearTimeout(queryTimer);
  };

  const runQuery = (rawQuery) => {
    const query = sanitizeQuery(rawQuery);
    if (!query) {
      input.focus({ preventScroll: true });
      return;
    }

    answer.innerHTML = '<span class="ai__loading"><i></i> Consultando a base local</span>';
    const { intent } = findIntent(query);
    const token = ++queryToken;

    window.clearTimeout(queryTimer);
    queryTimer = window.setTimeout(() => {
      if (token !== queryToken) return;
      answer.innerHTML = answerHtml(intent);
      answer.dataset.intent = intent.id;
    }, reduceMotion ? 0 : 210);
  };

  const closeAI = (restoreFocus = true) => {
    if (!aiOpen) return;

    aiOpen = false;
    ai.classList.remove('is-open');
    ai.inert = true;
    ai.setAttribute('aria-hidden', 'true');
    if (document.activeElement && ai.contains(document.activeElement)) document.activeElement.blur();
    document.body.classList.remove('ai-open');
    lockScroll(false);
    queryToken += 1;
    window.clearTimeout(queryTimer);

    if (restoreFocus && lastFocus && lastFocus.focus) {
      lastFocus.focus({ preventScroll: true });
    }
    lastFocus = null;

    window.setTimeout(() => {
      if (!aiOpen) resetAnswer();
    }, 380);
  };

  const openAI = (options = {}) => {
    if (window.__asperusSetMenu) window.__asperusSetMenu(false, false);

    if (!aiOpen) {
      lastFocus = document.activeElement;
      aiOpen = true;
      ai.classList.add('is-open');
      ai.setAttribute('aria-hidden', 'false');
      ai.inert = false;
      document.body.classList.add('ai-open');
      lockScroll(true);
      resetAnswer();
    }

    if (options.query) {
      input.value = sanitizeQuery(options.query);
      runQuery(options.query);
    }

    window.setTimeout(() => {
      input.focus({ preventScroll: true });
      input.select();
    }, 70);
  };

  window.__asperusOpenAI = openAI;
  window.__asperusCloseAI = (restoreFocus = true) => closeAI(restoreFocus);

  ['#ask-nav', '#ask-mobile', '#ask-fab'].forEach((selector) => {
    const button = $(selector);
    if (button) button.addEventListener('click', () => openAI());
  });

  $$('[data-ask]').forEach((button) => {
    button.addEventListener('click', () => openAI({ query: button.dataset.ask }));
  });

  $$('[data-ai-close]', ai).forEach((button) => {
    button.addEventListener('click', () => closeAI());
  });

  if (suggestions) {
    suggestions.addEventListener('click', (event) => {
      const chip = event.target.closest('button[data-q]');
      if (!chip) return;
      const query = chip.dataset.q;
      input.value = query;
      runQuery(query);
    });
  }

  answer.addEventListener('click', (event) => {
    const askButton = event.target.closest('button[data-ai-ask]');
    if (!askButton) return;
    const query = askButton.dataset.aiAsk;
    input.value = query;
    runQuery(query);
    input.focus({ preventScroll: true });
  });

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    runQuery(input.value);
  });

  panel.addEventListener('keydown', (event) => {
    if (event.key !== 'Tab') return;

    const items = $$('a[href], button:not([disabled]), input:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])', panel)
      .filter((el) => el.offsetParent !== null);
    if (!items.length) return;

    const first = items[0];
    const last = items[items.length - 1];

    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  });

  document.addEventListener('keydown', (event) => {
    const isTyping = /^(INPUT|TEXTAREA|SELECT)$/.test(document.activeElement ? document.activeElement.tagName : '')
      || (document.activeElement && document.activeElement.isContentEditable);

    if (event.key === 'Escape') {
      if (aiOpen) {
        event.preventDefault();
        closeAI();
      } else if (window.__asperusSetMenu) {
        window.__asperusSetMenu(false);
      }
      return;
    }

    if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
      event.preventDefault();
      if (aiOpen) closeAI();
      else openAI();
      return;
    }

    if (event.key === '/' && !aiOpen && !isTyping) {
      event.preventDefault();
      openAI();
    }
  });
}

/* ==========================================================================
   FOOTER OBJECT, CLOCK AND MOTION
   ========================================================================== */

function initFooter() {
  const trigger = $('#footer-mark');
  const wrap = $('#footer-cap');
  const canvas = $('#footer-cap-canvas');
  if (!trigger || !wrap || !canvas) return;

  trigger.setAttribute('aria-controls', 'footer-cap');
  trigger.dataset.cursor = 'Revelar objeto';
  createFooterObject({ trigger, wrap, canvas });
}

function initClock() {
  const clock = $('#clock');
  if (!clock) return;

  const formatter = (() => {
    try {
      return new Intl.DateTimeFormat('pt-BR', {
        timeZone: 'America/Sao_Paulo',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      });
    } catch (_) {
      return null;
    }
  })();

  const update = () => {
    clock.textContent = formatter ? formatter.format(new Date()) : '--:--';
  };

  update();
  window.setInterval(update, 30000);
}

function initHeroMotion() {
  if (!window.gsap || !window.ScrollTrigger || reduceMotion) return;

  const gsap = window.gsap;
  const ScrollTrigger = window.ScrollTrigger;
  gsap.registerPlugin(ScrollTrigger);

  const title = $('#hero-title');
  if (title) {
    const letters = $$('.hero__letter', title);
    if (letters.length) {
      gsap.to(letters, {
        y: (index) => 70 + (index % 3) * 30,
        x: (index) => (index - (letters.length - 1) / 2) * 15,
        rotate: (index) => (index % 2 === 0 ? 1 : -1) * (3 + index * 1.7),
        opacity: 0,
        ease: 'none',
        stagger: { each: 0.016, from: 'center' },
        scrollTrigger: {
          trigger: '#hero',
          start: 'top top',
          end: 'bottom 38%',
          scrub: 0.7,
        },
      });
    }
  }

  const heroSpec = $('.hero__spec');
  if (heroSpec) {
    gsap.to(heroSpec, {
      y: -54,
      ease: 'none',
      scrollTrigger: {
        trigger: '#hero',
        start: 'top top',
        end: 'bottom top',
        scrub: 1,
      },
    });
  }

  const footerWord = $('.footer__word');
  if (footerWord) {
    gsap.to(footerWord, {
      y: -36,
      ease: 'none',
      scrollTrigger: {
        trigger: '#footer',
        start: 'top bottom',
        end: 'bottom bottom',
        scrub: 1,
      },
    });
  }
}

/* ==========================================================================
   LOADER / BOOT
   ========================================================================== */

function startExperience() {
  const loader = $('#loader');
  const fill = $('#loader-fill');
  const count = $('#load-count');
  const status = $('#loader-status');
  const steps = [
    'alinhando a costura',
    'carregando a peça',
    'ajustando a linha de ouro',
    'conferindo o caimento',
    'peça pronta',
  ];

  let finished = false;
  const startedAt = performance.now();
  document.body.classList.add('is-loading');
  if (loader) loader.setAttribute('aria-busy', 'true');

  const updateProgress = (done, total) => {
    const progress = total ? done / total : 0;
    if (fill) fill.style.transform = `scaleX(${progress.toFixed(4)})`;
    if (count) count.textContent = String(done).padStart(3, '0');
    if (status) {
      const index = Math.min(steps.length - 1, Math.floor(progress * steps.length));
      if (status.textContent !== steps[index]) status.textContent = steps[index];
    }
  };

  const finish = () => {
    if (finished) return;
    finished = true;

    const elapsed = performance.now() - startedAt;
    const delay = reduceMotion ? Math.max(0, 260 - elapsed) : Math.max(0, 1050 - elapsed);

    window.setTimeout(() => {
      if (loader) {
        loader.setAttribute('aria-busy', 'false');
        loader.classList.add('is-done');
        window.setTimeout(() => loader.remove(), 1600);
      }

      document.body.classList.remove('is-loading');
      document.body.classList.add('is-ready');

      const title = $('#hero-title');
      if (title) title.classList.add('is-ready');

      window.dispatchEvent(new Event('asperus:ready'));
    }, delay);
  };

  try {
    initStage({ onProgress: updateProgress, onReady: finish });
  } catch (error) {
    console.warn('[ÁSPERUS] stage unavailable:', error);
    finish();
  }

  window.setTimeout(finish, 9500);
}

function boot() {
  splitHeroTitle();
  initCursor();
  initNavigation();
  initProjects();
  initContactForm();
  initAI();
  initFooter();
  initClock();
  initHeroMotion();

  window.addEventListener('asperus:ready', () => {
    initReveals();
    if (window.ScrollTrigger) window.ScrollTrigger.refresh();
  }, { once: true });

  /* Safety net: never leave the page hidden if the ready event is lost. */
  window.setTimeout(initReveals, 11000);

  startExperience();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', boot, { once: true });
} else {
  boot();
}
