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
    id: 'site',
    test: /site(?!.*seguro)|website|landing|pagina|google|seo|aparece|visibilidade|gerar cliente|mais clientes|vender|vendas|nao vende/,
    keywords: ['site', 'website', 'pagina', 'google', 'seo', 'visibilidade', 'cliente', 'clientes', 'vende', 'vender', 'vendas'],
    answer: 'Um site bom não é cartão de visita: é vendedor. Eu construo páginas rápidas, feitas para o celular e organizadas para o cliente entender em segundos o que você faz, por que confiar e como pedir orçamento. Também cuido para o seu negócio aparecer no Google quando alguém procura pelo serviço.',
    actions: [
      { label: 'Ver sites e lojas', href: '#services' },
      { label: 'Falar sobre meu site', href: '#contact' },
    ],
  },
  {
    id: 'sistema',
    test: /sistema|planilha|planilhas|gestao|pedido|pedidos|agenda|estoque|financeiro|organizar|operacao|controle/,
    keywords: ['sistema', 'planilha', 'planilhas', 'gestao', 'pedido', 'pedidos', 'agenda', 'estoque', 'financeiro', 'organizar', 'operacao', 'controle', 'whatsapp'],
    answer: 'Se a informação hoje vive em planilha, caderno e WhatsApp, o primeiro passo é juntar tudo em um lugar só. Eu construo um sistema simples — clientes, pedidos, agenda, estoque ou financeiro — com acesso por função e uma tela que qualquer pessoa do time aprende a usar no mesmo dia.',
    actions: [
      { label: 'Ver sistemas', href: '#services' },
      { label: 'Falar sobre minha operação', href: '#contact' },
    ],
  },
  {
    id: 'loja',
    test: /loja|e.?commerce|venda online|vender online|checkout|carrinho|catalogo|marketplace/,
    keywords: ['loja', 'commerce', 'checkout', 'carrinho', 'catalogo', 'marketplace', 'venda'],
    answer: 'Loja online precisa ser fácil no celular: catálogo claro, poucos passos até o pagamento e funcionamento mesmo com internet ruim. Eu monto a loja, integro pagamento e entrega, e deixo o caminho da compra curto para não perder cliente no meio.',
    actions: [
      { label: 'Ver lojas', href: '#services' },
      { label: 'Falar sobre minha loja', href: '#contact' },
    ],
  },
  {
    id: 'automacao',
    test: /automat|economizar tempo|tarefa repetitiva|retrabalho|integrar|integracao|conectar|aviso automatico/,
    keywords: ['automatizar', 'automacao', 'automatico', 'repetitiva', 'retrabalho', 'integrar', 'integracao', 'conectar', 'tempo'],
    answer: 'Toda tarefa que alguém repete todo dia pode virar automática: cobrança, lembrete de agenda, envio de orçamento, atualização de planilha, aviso no WhatsApp. Eu conecto as ferramentas que você já usa e devolvo horas da semana para a sua equipe.',
    actions: [
      { label: 'Ver automação', href: '#services' },
      { label: 'Falar do que repito todo dia', href: '#contact' },
    ],
  },
  {
    id: 'produto',
    test: /produto digital|app|aplicativo|plataforma|assinatura|saas|mvp|ideia|tirar do papel/,
    keywords: ['produto', 'app', 'aplicativo', 'plataforma', 'assinatura', 'saas', 'mvp', 'ideia'],
    answer: 'Se você tem uma ideia de aplicativo, plataforma ou assinatura, eu construo a primeira versão que já dá para usar e vender. Em vez de gastar um ano antes de testar, você coloca algo real na mão do cliente e aprende com o uso.',
    actions: [
      { label: 'Ver produtos digitais', href: '#services' },
      { label: 'Falar sobre minha ideia', href: '#contact' },
    ],
  },
  {
    id: 'diagnostico',
    test: /diagnostico|consultoria|auditoria|nao sei|por onde comecar|analisar|melhorar|priorizar|site lento|sistema ruim|esta travando/,
    keywords: ['diagnostico', 'consultoria', 'auditoria', 'analisar', 'melhorar', 'priorizar', 'travando', 'lento', 'nao sei', 'por onde comecar'],
    answer: 'Se você sabe que algo está errado mas não sabe o que, começo por um diagnóstico. Olho o site, o sistema e o processo, aponto o que está travando o negócio e monto um plano com prioridades, prazo e custo. Sem relatório de 80 páginas.',
    actions: [
      { label: 'Ver diagnóstico', href: '#services' },
      { label: 'Pedir um diagnóstico', href: '#contact' },
    ],
  },
  {
    id: 'pricing',
    test: /preco|valor|quanto custa|quanto sai|orcamento|investimento|custo|barato|caro|mensalidade/,
    keywords: ['preco', 'valor', 'custa', 'custo', 'orcamento', 'investimento', 'barato', 'caro', 'mensalidade', 'quanto custa'],
    answer: 'Não trabalho com tabela fixa porque cada negócio tem um problema diferente. O valor depende do tamanho da solução, do prazo e do que já existe. Você recebe uma proposta clara: o que entra, o que fica de fora e quanto custa — sem surpresa depois. Para começar, só me conte o que está travando.',
    actions: [
      { label: 'Pedir uma proposta', href: '#contact' },
      { label: 'Ver o que eu resolvo', href: '#services' },
    ],
  },
  {
    id: 'timeline',
    test: /prazo|quanto tempo|quando (fica|sai|entrega)|pra quando|semanas|meses|cronograma|demora/,
    keywords: ['prazo', 'tempo', 'semanas', 'meses', 'cronograma', 'entrega', 'demora'],
    answer: 'Um site costuma ficar pronto em poucas semanas. Um sistema ou loja depende do número de funções e integrações. Na primeira conversa eu digo o que é possível para o seu caso e divido a entrega em etapas, para você acompanhar e testar antes do final.',
    actions: [
      { label: 'Falar sobre prazos', href: '#contact' },
      { label: 'Ver como funciona', href: '#process' },
    ],
  },
  {
    id: 'availability',
    test: /disponivel|disponibilidade|aceitando|agenda|livre|vaga|proximo projeto|pode comecar/,
    keywords: ['disponivel', 'disponibilidade', 'aceitando', 'agenda', 'livre', 'vaga'],
    answer: 'Sim, estou com <strong>agenda aberta para novos negócios</strong>. Respondo em até 24h e, se o seu caso for urgente, me diga na primeira mensagem — eu digo com honestidade se consigo encaixar.',
    actions: [
      { label: 'Falar sobre meu caso', href: '#contact' },
      { label: 'Enviar e-mail', href: 'mailto:renato@asperus.dev' },
    ],
  },
  {
    id: 'contact',
    test: /contato|e.?mail|falar|conversar|mensagem|whatsapp|telefone|contratar|chamar/,
    keywords: ['contato', 'email', 'falar', 'conversar', 'mensagem', 'contratar', 'whatsapp', 'telefone'],
    answer: 'O caminho mais direto é <strong>renato@asperus.dev</strong>. Também estou no Instagram (<strong>@asperusagency</strong>). Você pode usar o formulário aqui embaixo: escreva com suas palavras o que está acontecendo — não precisa saber o nome técnico do problema.',
    actions: [
      { label: 'Enviar e-mail', href: 'mailto:renato@asperus.dev' },
      { label: 'Abrir contato', href: '#contact' },
      { label: 'Instagram', href: 'https://www.instagram.com/asperusagency/' },
    ],
  },
  {
    id: 'projects',
    test: /projetos?|casos?|portfolio|trabalhos?|exemplos?|o que ja (fez|construiu|entregou)|resultados?/,
    keywords: ['projeto', 'projetos', 'caso', 'casos', 'portfolio', 'trabalho', 'trabalhos', 'exemplo', 'exemplos', 'resultado'],
    answer: 'Aqui no site estão quatro casos: uma operação que vivia em sete planilhas, uma empresa que perdia tempo montando relatório à mão, sistemas que não se falavam e uma loja que perdia cliente no checkout. Em cada um você vê o problema, o que foi feito e o que mudou.',
    actions: [
      { label: 'Ver os casos', href: '#projects' },
      { label: 'Ver o que eu resolvo', href: '#services' },
      { label: 'Falar comigo', href: '#contact' },
    ],
  },
  {
    id: 'process',
    test: /processo|como (voce )?trabalha|metodologia|etapas?|como funciona|comeca|comeco|primeiro passo/,
    keywords: ['processo', 'trabalha', 'metodologia', 'etapa', 'etapas', 'comeca', 'comeco'],
    answer: 'Funciona assim: <strong>conversa</strong> para entender o problema, <strong>proposta</strong> com escopo, prazo e valor, <strong>construção</strong> em etapas para você acompanhar e <strong>entrega</strong> com suporte. Você não precisa entender de tecnologia — só precisa saber o que vai receber e quando.',
    actions: [
      { label: 'Ver como funciona', href: '#process' },
      { label: 'Dar o primeiro passo', href: '#contact' },
    ],
  },
  {
    id: 'about',
    test: /quem (e|eh) voce|quem e o renato|sobre voce|o que (voce )?faz|se apresenta|asperus|origem|historia|experiencia|anos/,
    keywords: ['quem', 'renato', 'maia', 'sobre', 'asperus', 'origem', 'historia', 'experiencia'],
    answer: 'Sou <strong>Renato Maia</strong>. Há 7 anos construo sites, sistemas e automações para pequenos e médios negócios — do comércio de bairro à operação que já não cabe em uma planilha. A ÁSPERUS é um estúdio solo: você fala e trabalha com a mesma pessoa do orçamento à entrega, sem agência no meio.',
    actions: [
      { label: 'Ler sobre a ÁSPERUS', href: '#about' },
      { label: 'Ver os casos', href: '#projects' },
      { label: 'Falar comigo', href: '#contact' },
    ],
  },
  {
    id: 'services',
    test: /servicos?|o que (voce )?(oferece|entrega|faz)|frentes?|no que (voce )?pode ajudar|solucoes/,
    keywords: ['servico', 'servicos', 'oferece', 'entrega', 'frentes', 'ajudar', 'solucoes'],
    answer: 'Trabalho com quatro coisas: <strong>sites e lojas</strong> que geram contato e venda, <strong>sistemas</strong> que substituem planilha e WhatsApp, <strong>produtos digitais</strong> do zero e <strong>diagnóstico</strong> para quem não sabe por onde começar. Tudo com um único responsável do começo ao fim.',
    actions: [
      { label: 'Ver soluções', href: '#services' },
      { label: 'Pedir uma proposta', href: '#contact' },
    ],
  },
  {
    id: 'location',
    test: /onde (voce )?(fica|mora|esta|atende)|localizacao|minha cidade|cidade|brasil|fuso|remoto|presencial|atende fora|regiao/,
    keywords: ['onde', 'localizacao', 'cidade', 'brasil', 'remoto', 'presencial', 'regiao'],
    answer: 'Atendo negócios de qualquer cidade do Brasil, de forma remota. Reunião por chamada de vídeo, mensagens no WhatsApp e tudo registrado por escrito. O que importa não é a distância — é a clareza do problema e do combinado.',
    actions: [
      { label: 'Falar comigo', href: '#contact' },
      { label: 'Sobre a ÁSPERUS', href: '#about' },
    ],
  },
  {
    id: 'solo',
    test: /agencia|empresa|equipe|time|sozinho|solo|intermediario|diferencial|por que voce|autoria|confianca/,
    keywords: ['agencia', 'empresa', 'equipe', 'time', 'sozinho', 'solo', 'intermediario', 'diferencial', 'confianca'],
    answer: 'Sem camadas: você fala com quem decide e com quem faz. Na ÁSPERUS não existe gerente de conta nem repasse para uma equipe que nunca ouviu o seu nome. Isso encurta o caminho, reduz o custo e faz o projeto andar mais rápido.',
    actions: [
      { label: 'Conhecer a ÁSPERUS', href: '#about' },
      { label: 'Falar comigo', href: '#contact' },
    ],
  },
  {
    id: 'quality',
    test: /seguranca|seguro|teste|testes|qualidade|performance|lento|rapido|confiavel|funciona bem|site cai/,
    keywords: ['seguranca', 'seguro', 'teste', 'testes', 'qualidade', 'performance', 'lento', 'rapido', 'confiavel'],
    answer: 'Todo projeto é testado antes de ir ao ar: velocidade, funcionamento no celular, segurança dos dados e os imprevistos que ninguém quer encontrar depois. Se não estiver pronto, não entrego. E depois da entrega você continua com suporte para o que aparecer.',
    actions: [
      { label: 'Ver como trabalho', href: '#process' },
      { label: 'Falar sobre qualidade', href: '#contact' },
    ],
  },
  {
    id: 'maintenance',
    test: /manutencao|suporte|evolucao|continuidade|acompanhamento|depois da entrega|atualizar/,
    keywords: ['manutencao', 'suporte', 'evolucao', 'continuidade', 'acompanhamento', 'atualizar'],
    answer: 'Depois da entrega, o projeto não fica largado. Faço manutenção, ajustes, novas funções e melhorias de velocidade — com a mesma pessoa que construiu e que já conhece o seu negócio. Você não precisa contratar outra empresa para cada mudança.',
    actions: [
      { label: 'Falar sobre suporte', href: '#contact' },
      { label: 'Ver como funciona', href: '#process' },
    ],
  },
  {
    id: 'stack',
    test: /tecnologia|linguagem|framework|ferramenta|stack|react|wordpress|wix|qual plataforma/,
    keywords: ['tecnologia', 'linguagem', 'framework', 'ferramenta', 'stack', 'react', 'wordpress', 'wix', 'plataforma'],
    answer: 'Uso a tecnologia que resolve o problema com o menor custo de manutenção — não a que está na moda. O que importa para você: o site precisa ser rápido, seguro, fácil de atualizar e não pode prender o seu negócio a uma ferramenta que cobra caro por tudo.',
    actions: [
      { label: 'Ver soluções', href: '#services' },
      { label: 'Falar sobre meu caso', href: '#contact' },
    ],
  },
  {
    id: 'ai',
    test: /inteligencia artificial|chatbot|assistente virtual|essa ia|usa ia|ia no site/,
    keywords: ['inteligencia', 'artificial', 'chatbot', 'assistente'],
    answer: 'Uso inteligência artificial quando ela resolve um problema real: responder dúvidas de cliente, organizar pedidos, resumir informação. Não coloco IA como enfeite. Neste site, a busca é local e instantânea: responde o que está no meu trabalho e não inventa.',
    actions: [
      { label: 'Ver soluções', href: '#services' },
      { label: 'Perguntar outra coisa', ask: 'Como você trabalha?' },
    ],
  },
  {
    id: 'thanks',
    test: /^(obrigad|valeu|vlw|brigad|thanks|thank you)/,
    keywords: ['obrigado', 'obrigada', 'valeu', 'vlw'],
    answer: 'De nada. Se quiser continuar a conversa, o e-mail direto é <strong>renato@asperus.dev</strong>. Respondo em até 24h.',
    actions: [
      { label: 'Enviar e-mail', href: 'mailto:renato@asperus.dev' },
      { label: 'Ver os casos', href: '#projects' },
    ],
  },
  {
    id: 'greeting',
    test: /^(oi|ola|opa|eai|e ai|bom dia|boa tarde|boa noite|hey|hello|hi)\b/,
    keywords: ['oi', 'ola', 'opa', 'eai', 'hey', 'hello'],
    answer: 'Olá. Me conte o que está travando no seu negócio — site que não gera contato, planilha demais, pedido perdido no WhatsApp — ou pergunte sobre preço, prazo e como funciona.',
    actions: [
      { label: 'Meu site não gera clientes', ask: 'Meu site não gera clientes' },
      { label: 'Quero organizar minha operação', ask: 'Quero organizar minha operação' },
      { label: 'Quanto custa um projeto?', ask: 'Quanto custa um projeto?' },
    ],
  },
  {
    id: 'fallback',
    test: /$^/,
    keywords: [],
    answer: 'Ainda não tenho essa resposta aqui. Me conte o seu caso em <strong>renato@asperus.dev</strong> — respondo em até 24h, sem jargão e sem compromisso. Ou tente perguntar sobre site, sistema, loja, preço, prazo ou como funciona.',
    actions: [
      { label: 'Ver soluções', href: '#services' },
      { label: 'Ver os casos', href: '#projects' },
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

    answer.innerHTML = '<span class="ai__loading"><i></i> Procurando a resposta</span>';
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
