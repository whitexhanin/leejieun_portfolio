import { content, components, profile, LAB_BASE, LAB_REPO } from './data.js';

const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

const store = {
  get(key) { try { return localStorage.getItem(key); } catch { return null; } },
  set(key, v) { try { localStorage.setItem(key, v); } catch { /* ignore */ } },
};

const escapeHtml = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
// *word* → <em>word</em>
const rich = (s) => escapeHtml(s).replace(/\*(.+?)\*/g, '<em>$1</em>');
const get = (obj, path) => path.split('.').reduce((o, k) => (o ? o[k] : undefined), obj);

/* =========================================================
   Language
   ========================================================= */
function initialLang() {
  const q = new URLSearchParams(location.search).get('lang');
  if (q === 'ko' || q === 'en') return q;
  const saved = store.get('portfolio_lang');
  if (saved === 'ko' || saved === 'en') return saved;
  return (navigator.language || 'ko').toLowerCase().startsWith('ko') ? 'ko' : 'en';
}

let lang = initialLang();
let t = content[lang];

function setLang(next, { rerender = true } = {}) {
  lang = next;
  t = content[lang];
  store.set('portfolio_lang', lang);
  document.documentElement.lang = t.meta.lang;
  document.title = t.meta.title;
  $$('.lang button').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.lang === lang)));
  if (rerender) render();
}

/* =========================================================
   Rendering
   ========================================================= */
function renderStatic() {
  $$('[data-i18n]').forEach((el) => {
    const v = get(t, el.dataset.i18n);
    if (typeof v === 'string') el.innerHTML = rich(v);
  });
  $$('[data-i18n-aria]').forEach((el) => {
    const v = get(t, el.dataset.i18nAria);
    if (typeof v === 'string') el.setAttribute('aria-label', v);
  });
  $$('[data-name]').forEach((el) => (el.textContent = profile.name[lang]));
  $$('[data-year]').forEach((el) => (el.textContent = new Date().getFullYear()));
}

function renderHero() {
  const title = $('[data-hero-title]');
  title.setAttribute('aria-label', t.hero.lines.join(' ').replace(/\*/g, ''));
  title.innerHTML = t.hero.lines
    .map((line) => `<span class="line" aria-hidden="true"><span>${rich(line)}</span></span>`)
    .join('');

  $('[data-stats]').innerHTML = t.hero.stats
    .map((s) => `<div><dt>${escapeHtml(s.label)}</dt><dd><span data-count="${s.value}">${s.value}</span><sup>${escapeHtml(s.suffix)}</sup></dd></div>`)
    .join('');
}

function workMedia(p) {
  if (p.images.length > 1) {
    return `<div class="work__media work__media--collage">${p.images
      .map((img) => `<img src="./assets/img/work/${img.src}" alt="${escapeHtml(img.alt)}" loading="lazy" decoding="async" />`)
      .join('')}</div>`;
  }
  if (p.images.length === 1) {
    const img = p.images[0];
    return `<div class="work__media"><img src="./assets/img/work/${img.src}" alt="${escapeHtml(img.alt)}" loading="lazy" decoding="async" /></div>`;
  }
  // No screenshot (NDA) → code-style placeholder
  return `<div class="work__media work__media--placeholder" aria-hidden="true"><div class="ph">
    <b>const</b> project = {<br>&nbsp;&nbsp;stack: [<i>'React'</i>, <i>'REST API'</i>],<br>&nbsp;&nbsp;mockup: <b>null</b>,<br>&nbsp;&nbsp;days: <i>16</i>,<br>&nbsp;&nbsp;status: <i>'shipped'</i><br>};
  </div></div>`;
}

function renderWork() {
  $('[data-work]').innerHTML = t.work.items
    .map((p, i) => `
      <li class="work" data-case="${i}">
        ${workMedia(p)}
        <div class="work__body">
          <div class="work__meta">
            <span class="work__index">${String(i + 1).padStart(2, '0')}</span>
            <span class="badge">${escapeHtml(p.domain)}</span>
            <span>${escapeHtml(p.client)}</span>
            <span>${escapeHtml(p.period)}</span>
          </div>
          <h3 class="work__title">${escapeHtml(p.title)}</h3>
          <p class="work__summary">${escapeHtml(p.summary)}</p>
          <ul class="tags">${p.tags.map((tag) => `<li class="tag">${escapeHtml(tag)}</li>`).join('')}</ul>
          <div class="work__foot">
            <div class="metric">
              <div class="metric__value">${escapeHtml(p.metric.value)}${p.metric.unit ? `<small>${escapeHtml(p.metric.unit)}</small>` : ''}</div>
              <div class="metric__label">${escapeHtml(p.metric.label)}</div>
            </div>
            <button type="button" class="work__open" data-open-case="${i}" aria-haspopup="dialog">
              ${escapeHtml(t.work.open)}
              <span class="arrow" aria-hidden="true"><svg width="16" height="16" viewBox="0 0 16 16"><path d="M3 8h10M9 4l4 4-4 4" fill="none" stroke="currentColor" stroke-width="1.6"/></svg></span>
            </button>
          </div>
        </div>
      </li>`)
    .join('');
}

let labFilter = 'all';

function renderLab() {
  const cats = Object.keys(t.lab.filters);
  $('[data-lab-filters]').innerHTML = cats
    .map((c) => {
      const n = c === 'all' ? components.length : components.filter((x) => x.cat === c).length;
      return `<button type="button" class="chip" data-filter="${c}" aria-pressed="${c === labFilter}">${escapeHtml(t.lab.filters[c])}<small>${n}</small></button>`;
    })
    .join('');

  $('[data-lab-grid]').innerHTML = components
    .map((c, i) => {
      const thumb = c.thumb
        ? `<div class="lab-card__thumb"><img src="./assets/img/lab/${c.thumb}.jpg" alt="" loading="lazy" decoding="async" /></div>`
        : `<div class="lab-card__thumb lab-card__thumb--ph"><span>${escapeHtml(c.name.charAt(0))}</span></div>`;
      const hidden = labFilter !== 'all' && c.cat !== labFilter;
      return `
        <li class="lab-card${hidden ? ' is-hidden' : ''}" data-cat="${c.cat}">
          <button type="button" class="lab-card__btn" data-demo="${i}" aria-haspopup="dialog">
            ${thumb.replace('</div>', `<span class="lab-card__play" aria-hidden="true">▶ ${escapeHtml(t.lab.demo)}</span></div>`)}
            <span class="lab-card__info">
              <span class="lab-card__name">${escapeHtml(c.name)}</span>
              <span class="lab-card__cat">${escapeHtml(t.lab.filters[c.cat])}</span>
            </span>
          </button>
        </li>`;
    })
    .join('');
}

function setLabFilter(cat) {
  if (cat === labFilter) return;
  labFilter = cat;
  $$('[data-filter]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.filter === cat)));
  const cards = $$('.lab-card');
  let k = 0;
  cards.forEach((card) => {
    const show = cat === 'all' || card.dataset.cat === cat;
    card.classList.toggle('is-hidden', !show);
    if (show && !reduceMotion) {
      card.classList.add('is-entering');
      card.style.transitionDelay = `${Math.min(k++, 12) * 30}ms`;
    }
  });
  requestAnimationFrame(() => requestAnimationFrame(() => {
    cards.forEach((card) => card.classList.remove('is-entering'));
  }));
}

function renderSkills() {
  $('[data-skills]').innerHTML = t.about.skills
    .map((s, i) => `
      <li class="skill reveal" style="--d:${(i % 2) * 0.08}s">
        <span class="skill__num">${String(i + 1).padStart(2, '0')}</span>
        <h3 class="skill__title">${escapeHtml(s.title)}</h3>
        <p class="skill__desc">${escapeHtml(s.desc)}</p>
        <ul class="tags">${s.tags.map((tag) => `<li class="tag">${escapeHtml(tag)}</li>`).join('')}</ul>
      </li>`)
    .join('');
}

function renderTimeline() {
  $('[data-timeline]').innerHTML = t.experience.items
    .map((e) => `
      <li class="tl reveal">
        <span class="tl__date">${escapeHtml(e.date)}</span>
        <div>
          <span class="tl__org">${escapeHtml(e.org)}</span>
          <h3 class="tl__title">${escapeHtml(e.title)}</h3>
          <p class="tl__desc">${escapeHtml(e.desc)}</p>
        </div>
        <ul class="tags">${e.tags.map((tag) => `<li class="tag">${escapeHtml(tag)}</li>`).join('')}</ul>
      </li>`)
    .join('');
}

function renderContact() {
  const mail = $('[data-email]');
  mail.href = `mailto:${profile.email}`;
  mail.textContent = profile.email;
  $('[data-contact-links]').innerHTML = `
    <li><span>Notion</span><a href="${profile.notion}" target="_blank" rel="noopener">${escapeHtml(t.contact.notion)} ↗</a></li>
    <li><span>GitHub</span><a href="${profile.github}" target="_blank" rel="noopener">@whitexhanin ↗</a></li>
    <li><span>Phone</span><a href="tel:${profile.phone.replace(/-/g, '')}">${profile.phone}</a></li>
    <li><span>Location</span>${escapeHtml(t.contact.location)}</li>`;
}

function render() {
  renderStatic();
  renderHero();
  renderWork();
  renderLab();
  renderSkills();
  renderTimeline();
  renderContact();
  observeReveals();
  bindPointerEffects();
  if (document.documentElement.classList.contains('is-loaded')) {
    $$('.hero__title .line > span').forEach((s) => (s.style.transform = 'none'));
  }
}

/* =========================================================
   Loader + hero intro
   ========================================================= */
function playIntro() {
  const root = document.documentElement;
  const lines = $$('.hero__title .line > span');
  const fades = [$('.hero__eyebrow'), $('.hero__bottom'), $('.stats')];

  const reveal = () => {
    root.classList.add('is-loaded');
    if (reduceMotion) return;
    lines.forEach((el, i) => {
      el.animate([{ transform: 'translateY(110%)' }, { transform: 'none' }], { duration: 1200, delay: 120 + i * 110, easing: 'cubic-bezier(.22,1,.36,1)', fill: 'backwards' });
    });
    fades.forEach((el, i) => {
      el?.animate([{ opacity: 0, transform: 'translateY(24px)' }, { opacity: 1, transform: 'none' }], { duration: 1000, delay: 450 + i * 120, easing: 'cubic-bezier(.22,1,.36,1)', fill: 'backwards' });
    });
    countUp();
  };

  let seen = false;
  try { seen = sessionStorage.getItem('portfolio_intro') === '1'; sessionStorage.setItem('portfolio_intro', '1'); } catch { /* ignore */ }

  if (reduceMotion || seen) {
    reveal();
    return;
  }

  const count = $('.loader__count');
  const bar = $('.loader__bar i');
  const start = performance.now();
  const dur = 1100;
  const tick = (now) => {
    const p = Math.min(1, (now - start) / dur);
    const eased = 1 - Math.pow(1 - p, 3);
    count.textContent = String(Math.round(eased * 100));
    bar.style.transform = `scaleX(${eased})`;
    if (p < 1) requestAnimationFrame(tick);
    else setTimeout(reveal, 160);
  };
  requestAnimationFrame(tick);
}

function countUp() {
  $$('[data-count]').forEach((el, i) => {
    const target = Number(el.dataset.count);
    const start = performance.now() + 500 + i * 100;
    const dur = 1400;
    const step = (now) => {
      const p = Math.max(0, Math.min(1, (now - start) / dur));
      el.textContent = String(Math.round(target * (1 - Math.pow(1 - p, 4))));
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  });
}

/* =========================================================
   Scroll: reveals, header, active nav, parallax
   ========================================================= */
let revealObserver;
function observeReveals() {
  revealObserver?.disconnect();
  const targets = [...$$('.reveal'), ...$$('.work')];
  if (reduceMotion || !('IntersectionObserver' in window)) {
    targets.forEach((el) => el.classList.add('is-in'));
    return;
  }
  revealObserver = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (e.isIntersecting) {
        e.target.classList.add('is-in');
        revealObserver.unobserve(e.target);
      }
    });
  }, { rootMargin: '0px 0px -12% 0px', threshold: 0.05 });
  targets.forEach((el) => revealObserver.observe(el));
}

function initScroll() {
  const header = $('[data-header]');
  let lastY = window.scrollY;
  let ticking = false;

  const onScroll = () => {
    const y = window.scrollY;
    header.classList.toggle('is-scrolled', y > 20);
    const menuOpen = $('.menu-toggle').getAttribute('aria-expanded') === 'true';
    header.classList.toggle('is-hidden', !menuOpen && y > lastY && y > 400);
    lastY = y;

    if (!reduceMotion) {
      const vh = window.innerHeight;
      $$('.work__media:not(.work__media--collage) img').forEach((img) => {
        const r = img.parentElement.getBoundingClientRect();
        if (r.bottom < 0 || r.top > vh) return;
        const p = (r.top + r.height / 2 - vh / 2) / vh; // -1 … 1
        img.style.setProperty('--py', `${(p * -24).toFixed(1)}px`);
      });
    }
    ticking = false;
  };
  window.addEventListener('scroll', () => {
    if (!ticking) { requestAnimationFrame(onScroll); ticking = true; }
  }, { passive: true });
  onScroll();

  // Active nav
  const links = $$('.nav__list a');
  const sections = links.map((a) => $(a.getAttribute('href'))).filter(Boolean);
  const navObserver = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (e.isIntersecting) {
        links.forEach((a) => a.classList.toggle('is-active', a.getAttribute('href') === `#${e.target.id}`));
      }
    });
  }, { rootMargin: '-45% 0px -50% 0px' });
  sections.forEach((s) => navObserver.observe(s));
}

/* =========================================================
   Pointer effects: cursor, magnetic, spotlight, glow
   ========================================================= */
function initCursor() {
  if (!finePointer || reduceMotion) return;
  const cursor = $('.cursor');
  let x = -100, y = -100, cx = -100, cy = -100;
  window.addEventListener('pointermove', (e) => {
    x = e.clientX; y = e.clientY;
    cursor.classList.add('is-visible');
    const hit = e.target.closest('a, button, [data-case]');
    cursor.classList.toggle('is-hover', Boolean(hit) && !e.target.closest('.sheet'));
  }, { passive: true });
  document.addEventListener('pointerleave', () => cursor.classList.remove('is-visible'));
  const loop = () => {
    cx += (x - cx) * 0.2;
    cy += (y - cy) * 0.2;
    cursor.style.transform = `translate3d(${cx}px, ${cy}px, 0)`;
    requestAnimationFrame(loop);
  };
  loop();

  const glow = $('.hero__glow');
  $('.hero').addEventListener('pointermove', (e) => {
    const r = e.currentTarget.getBoundingClientRect();
    glow.style.setProperty('--gx', `${((e.clientX - r.left) / r.width) * 100}%`);
    glow.style.setProperty('--gy', `${((e.clientY - r.top) / r.height) * 100}%`);
  });
}

function bindPointerEffects() {
  if (!finePointer || reduceMotion) return;
  $$('.magnetic').forEach((el) => {
    if (el.dataset.magnetBound) return;
    el.dataset.magnetBound = '1';
    el.addEventListener('pointermove', (e) => {
      const r = el.getBoundingClientRect();
      const dx = e.clientX - (r.left + r.width / 2);
      const dy = e.clientY - (r.top + r.height / 2);
      el.style.transform = `translate(${dx * 0.25}px, ${dy * 0.35}px)`;
    });
    el.addEventListener('pointerleave', () => (el.style.transform = ''));
  });
  $$('.work, .skill').forEach((el) => {
    el.addEventListener('pointermove', (e) => {
      const r = el.getBoundingClientRect();
      el.style.setProperty('--mx', `${e.clientX - r.left}px`);
      el.style.setProperty('--my', `${e.clientY - r.top}px`);
    });
  });
}

/* =========================================================
   Sheets (case study + demo): focus trap, Esc, swipe-to-close
   ========================================================= */
let activeSheet = null;
let lastFocus = null;

function openSheet(name) {
  const sheet = $(`[data-sheet="${name}"]`);
  lastFocus = document.activeElement;
  sheet.hidden = false;
  document.body.classList.add('is-locked');
  requestAnimationFrame(() => requestAnimationFrame(() => sheet.classList.add('is-open')));
  activeSheet = sheet;
  const panel = $('.sheet__panel', sheet);
  panel.scrollTop = 0;
  $('.sheet__body', sheet)?.scrollTo(0, 0);
  setTimeout(() => panel.focus({ preventScroll: true }), 50);
}

function closeSheet() {
  if (!activeSheet) return;
  const sheet = activeSheet;
  activeSheet = null;
  sheet.classList.remove('is-open');
  const panel = $('.sheet__panel', sheet);
  panel.style.transform = '';
  const done = () => {
    sheet.hidden = true;
    document.body.classList.remove('is-locked');
    if (sheet.dataset.sheet === 'demo') {
      const iframe = $('[data-demo-iframe]');
      iframe.removeAttribute('src');
      $('[data-demo-frame]').classList.remove('is-ready');
    }
  };
  if (reduceMotion) done();
  else setTimeout(done, 600);
  lastFocus?.focus?.({ preventScroll: true });
}

function trapFocus(e) {
  if (!activeSheet || e.key !== 'Tab') return;
  const focusables = $$('a[href], button:not([disabled]), iframe, [tabindex]:not([tabindex="-1"])', activeSheet)
    .filter((el) => el.offsetParent !== null);
  if (!focusables.length) return;
  const first = focusables[0];
  const last = focusables[focusables.length - 1];
  if (e.shiftKey && (document.activeElement === first || document.activeElement === $('.sheet__panel', activeSheet))) {
    e.preventDefault(); last.focus();
  } else if (!e.shiftKey && document.activeElement === last) {
    e.preventDefault(); first.focus();
  }
}

// Mobile bottom sheet: drag down on the handle / header to close
function initSwipe() {
  $$('.sheet').forEach((sheet) => {
    const panel = $('.sheet__panel', sheet);
    const grip = [$('.sheet__handle', sheet), $('.demo__bar', sheet)].filter(Boolean);
    let startY = 0, dy = 0, dragging = false;
    const isMobile = () => window.matchMedia('(max-width: 860px)').matches;

    const down = (e) => {
      if (!isMobile() || e.target.closest('a, button')) return;
      dragging = true; startY = e.clientY; dy = 0;
      panel.style.transition = 'none';
      e.currentTarget.setPointerCapture?.(e.pointerId);
    };
    const move = (e) => {
      if (!dragging) return;
      dy = Math.max(0, e.clientY - startY);
      panel.style.transform = `translateY(${dy}px)`;
    };
    const up = () => {
      if (!dragging) return;
      dragging = false;
      panel.style.transition = '';
      if (dy > 120) closeSheet();
      else panel.style.transform = '';
    };
    grip.forEach((g) => {
      g.style.touchAction = 'none';
      g.addEventListener('pointerdown', down);
      g.addEventListener('pointermove', move);
      g.addEventListener('pointerup', up);
      g.addEventListener('pointercancel', up);
    });

    // Body area: when scrolled to top, pulling down closes
    const body = $('.sheet__body', sheet);
    if (body) {
      let ty = 0, pulling = false;
      body.addEventListener('touchstart', (e) => { if (!isMobile()) return; ty = e.touches[0].clientY; pulling = body.scrollTop <= 0; }, { passive: true });
      body.addEventListener('touchmove', (e) => {
        if (!pulling) return;
        const d = e.touches[0].clientY - ty;
        if (d > 0 && body.scrollTop <= 0) { panel.style.transition = 'none'; panel.style.transform = `translateY(${d * 0.9}px)`; dy = d; }
        else { pulling = false; panel.style.transform = ''; }
      }, { passive: true });
      body.addEventListener('touchend', () => {
        if (!pulling) return;
        pulling = false; panel.style.transition = '';
        if (dy > 140) closeSheet(); else panel.style.transform = '';
        dy = 0;
      });
    }
  });
}

function openCase(i) {
  const p = t.work.items[i];
  const L = t.work.labels;
  const gallery = p.images.length
    ? `<div class="case__gallery${p.images.length > 1 ? ' case__gallery--multi' : ''}">${p.images
        .map((img) => `<figure class="${img.tall ? 'is-tall' : ''}"><img src="./assets/img/work/${img.src}" alt="${escapeHtml(img.alt)}" loading="lazy" /></figure>`)
        .join('')}</div>`
    : '';
  $('[data-case-body]').innerHTML = `
    <div class="stagger">
      <div class="case__meta">
        <span class="work__index">${String(i + 1).padStart(2, '0')}</span>
        <span class="badge">${escapeHtml(p.domain)}</span>
        <span>${escapeHtml(p.client)}</span>
        <span>${escapeHtml(p.period)}</span>
      </div>
      <h3 class="case__title" id="case-title">${escapeHtml(p.title)}</h3>
      <p class="case__summary">${escapeHtml(p.summary)}</p>
      <div class="case__metric">
        <div class="metric__value">${escapeHtml(p.metric.value)}${p.metric.unit ? `<small>${escapeHtml(p.metric.unit)}</small>` : ''}</div>
        <div class="metric__label">${escapeHtml(p.metric.label)}</div>
      </div>
      ${gallery}
      <div class="case__steps">
        <div class="case__step"><h4>${escapeHtml(L.problem)}</h4><p>${escapeHtml(p.problem)}</p></div>
        <div class="case__step"><h4>${escapeHtml(L.decision)}</h4><p>${escapeHtml(p.decision)}</p></div>
        <div class="case__step"><h4>${escapeHtml(L.solution)}</h4><p>${escapeHtml(p.solution)}</p></div>
        <div class="case__step case__step--result"><h4>${escapeHtml(L.result)}</h4><p>${escapeHtml(p.result)}</p></div>
      </div>
      <ul class="tags case__tags">${p.tags.map((tag) => `<li class="tag">${escapeHtml(tag)}</li>`).join('')}</ul>
    </div>`;
  openSheet('case');
}

const VIEWPORTS = [
  { key: 'mobile', width: '390px', icon: '<svg width="12" height="14" viewBox="0 0 12 16" aria-hidden="true"><rect x="1" y="1" width="10" height="14" rx="2" fill="none" stroke="currentColor" stroke-width="1.4"/></svg>' },
  { key: 'tablet', width: '820px', icon: '<svg width="16" height="14" viewBox="0 0 18 16" aria-hidden="true"><rect x="1" y="1" width="16" height="14" rx="2" fill="none" stroke="currentColor" stroke-width="1.4"/></svg>' },
  { key: 'desktop', width: '100%', icon: '<svg width="18" height="14" viewBox="0 0 20 16" aria-hidden="true"><rect x="1" y="1" width="18" height="11" rx="1.5" fill="none" stroke="currentColor" stroke-width="1.4"/><path d="M7 15h6" stroke="currentColor" stroke-width="1.4"/></svg>' },
];

function setViewport(key) {
  const vp = VIEWPORTS.find((v) => v.key === key) || VIEWPORTS[2];
  $('[data-demo-frame]').style.setProperty('--vw', vp.width);
  $$('[data-viewport]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.viewport === vp.key)));
}

function openDemo(i) {
  const c = components[i];
  const encoded = c.path.split('/').map(encodeURIComponent).join('/');
  const url = `${LAB_BASE}${encoded}/index.html`;
  $('[data-demo-title]').textContent = c.name;
  $('[data-demo-cat]').textContent = t.lab.filters[c.cat];
  $('[data-demo-open]').href = url;
  $('[data-demo-source]').href = `${LAB_REPO}${encoded}`;
  $('[data-demo-viewports]').innerHTML = VIEWPORTS
    .map((v) => `<button type="button" data-viewport="${v.key}" aria-pressed="false">${v.icon}${escapeHtml(t.lab.viewport[v.key])}</button>`)
    .join('');
  setViewport('desktop');

  const frame = $('[data-demo-frame]');
  const iframe = $('[data-demo-iframe]');
  frame.classList.remove('is-ready');
  iframe.title = `${c.name} demo`;
  iframe.onload = () => frame.classList.add('is-ready');
  openSheet('demo');
  // Load after the panel animation starts for a smoother open
  setTimeout(() => { iframe.src = url; }, reduceMotion ? 0 : 250);
}

/* =========================================================
   Misc: menu, toast, copy email, marquee
   ========================================================= */
function toast(msg) {
  const el = $('[data-toast]');
  el.textContent = msg;
  el.classList.add('is-show');
  clearTimeout(toast.timer);
  toast.timer = setTimeout(() => el.classList.remove('is-show'), 2200);
}

async function copyEmail() {
  try {
    await navigator.clipboard.writeText(profile.email);
  } catch {
    const ta = document.createElement('textarea');
    ta.value = profile.email;
    document.body.appendChild(ta);
    ta.select();
    try { document.execCommand('copy'); } catch { /* ignore */ }
    ta.remove();
  }
  toast(t.contact.copied);
}

function toggleMenu(force) {
  const btn = $('.menu-toggle');
  const menu = $('#mobile-menu');
  const open = typeof force === 'boolean' ? force : btn.getAttribute('aria-expanded') !== 'true';
  btn.setAttribute('aria-expanded', String(open));
  menu.hidden = !open;
  document.body.classList.toggle('is-locked', open);
  $('[data-header]').classList.toggle('is-scrolled', open || window.scrollY > 20);
}

function initMarquee() {
  const track = $('[data-marquee]');
  track.innerHTML += track.innerHTML; // seamless loop
}

/* =========================================================
   Events
   ========================================================= */
function bindEvents() {
  document.addEventListener('click', (e) => {
    const langBtn = e.target.closest('[data-lang]');
    if (langBtn) { setLang(langBtn.dataset.lang); return; }

    const filter = e.target.closest('[data-filter]');
    if (filter) { setLabFilter(filter.dataset.filter); return; }

    const demo = e.target.closest('[data-demo]');
    if (demo) { openDemo(Number(demo.dataset.demo)); return; }

    const vp = e.target.closest('[data-viewport]');
    if (vp) { setViewport(vp.dataset.viewport); return; }

    const caseCard = e.target.closest('[data-case]');
    if (caseCard) { openCase(Number(caseCard.dataset.case)); return; }

    if (e.target.closest('[data-close]')) { closeSheet(); return; }
    if (e.target.closest('[data-copy-email]')) { copyEmail(); return; }
    if (e.target.closest('.menu-toggle')) { toggleMenu(); return; }
    if (e.target.closest('#mobile-menu a')) { toggleMenu(false); }
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      if (activeSheet) closeSheet();
      else if ($('.menu-toggle').getAttribute('aria-expanded') === 'true') toggleMenu(false);
    }
    trapFocus(e);
  });

  window.addEventListener('resize', () => {
    if (window.innerWidth > 860 && $('.menu-toggle').getAttribute('aria-expanded') === 'true') toggleMenu(false);
  });
}

/* =========================================================
   Boot
   ========================================================= */
setLang(lang, { rerender: false });
render();
initMarquee();
bindEvents();
initScroll();
initCursor();
initSwipe();
playIntro();
