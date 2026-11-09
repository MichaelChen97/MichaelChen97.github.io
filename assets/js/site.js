/* Portfolio behaviour v3: header, mobile nav, reveal, video modes, the homepage product views, a zoomable lightbox,
   the email dialog and the case-study chapter nav. No dependencies; everything degrades to plain HTML (posters, every
   view state listed, homepage stills as links to their full-size files) without JS. Nothing autoplays with reduced
   motion or Save-Data. */
(() => {
  'use strict';
  const doc = document.documentElement;
  doc.classList.add('js', 'js-ready');
  // project display faces that aren't needed for the first paint arrive once the page has loaded
  const late = () => doc.classList.add('fonts-late');
  if (document.readyState === 'complete') setTimeout(late, 0); else window.addEventListener('load', () => ('requestIdleCallback' in window ? requestIdleCallback(late, { timeout: 1200 }) : setTimeout(late, 200)));
  // sections and next-project cards take their project face when they come near the screen
  const near = [...document.querySelectorAll('#work > .world-ch, .next')];
  if ('IntersectionObserver' in window) { const fio = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('fonts-ok'); fio.unobserve(e.target); } }), { rootMargin: '250px 0px' }); near.forEach(el => fio.observe(el)); } else near.forEach(el => el.classList.add('fonts-ok'));
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
  const saveData = !!(navigator.connection && (navigator.connection.saveData || /2g/.test(navigator.connection.effectiveType || '')));
  const small = () => window.matchMedia('(max-width: 720px)').matches;
  const canAuto = () => !reduce.matches && !saveData;
  const ICON = {
    play: '<svg viewBox="0 0 16 16" aria-hidden="true"><path fill="currentColor" d="M4 2.5v11l9-5.5z"/></svg>',
    pause: '<svg viewBox="0 0 16 16" aria-hidden="true"><path fill="currentColor" d="M4 2.5h3v11H4zM9 2.5h3v11H9z"/></svg>',
    replay: '<svg viewBox="0 0 16 16" aria-hidden="true"><path fill="none" stroke="currentColor" stroke-width="1.6" d="M3 8a5 5 0 1 0 1.6-3.7M3 2.5v3h3"/></svg>',
  };

  /* header + nav */
  const header = document.querySelector('.site-header');
  const primaryLinks = header ? [...header.querySelectorAll('[data-nav]')] : [];
  const primarySections = document.getElementById('work') ? primaryLinks.map(link => ({ link, section: document.getElementById(link.dataset.nav) })).filter(item => item.section) : [];
  const onScroll = () => {
    if (header) header.classList.toggle('is-scrolled', window.scrollY > 8);
    if (!primarySections.length) return;
    const edge = (header?.offsetHeight || 0) + innerHeight * .25;
    let current = primarySections[0];
    for (const item of primarySections) if (item.section.getBoundingClientRect().top <= edge) current = item;
    for (const item of primarySections) {
      if (item === current) item.link.setAttribute('aria-current', 'location');
      else item.link.removeAttribute('aria-current');
    }
  };
  onScroll(); window.addEventListener('scroll', onScroll, { passive: true });
  const toggle = document.querySelector('.nav-toggle');
  if (toggle) {
    const close = () => { document.body.classList.remove('nav-open'); toggle.setAttribute('aria-expanded', 'false'); toggle.textContent = 'Menu'; };
    toggle.addEventListener('click', () => { const open = document.body.classList.toggle('nav-open'); toggle.setAttribute('aria-expanded', String(open)); toggle.textContent = open ? 'Close' : 'Menu'; if (open) { const first = document.querySelector('#site-nav a'); if (first) setTimeout(() => first.focus(), 30); } });
    // while the menu is open, Tab cycles through its links and the Close button only
    document.addEventListener('keydown', e => { if (e.key !== 'Tab' || !document.body.classList.contains('nav-open')) return; const ring = [...document.querySelectorAll('#site-nav a'), toggle]; const i = ring.indexOf(document.activeElement); e.preventDefault(); ring[i < 0 ? 0 : (i + (e.shiftKey ? ring.length - 1 : 1)) % ring.length].focus(); });
    document.querySelectorAll('.nav a').forEach(a => a.addEventListener('click', close));
    document.addEventListener('keydown', e => { if (e.key === 'Escape' && document.body.classList.contains('nav-open')) { close(); toggle.focus(); } });
  }

  /* reveal */
  const reveals = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window && !reduce.matches) {
    const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); } }), { rootMargin: '0px 0px -6% 0px' });
    reveals.forEach(el => io.observe(el));
  } else reveals.forEach(el => el.classList.add('is-in'));

  /* video: data-mode = once (plays once on view, holds the last frame, Replay) | loop (Pause button) | click (never
     autoplays). Videos inside [data-managed] are started by their owner (the hero explorer), not by visibility. */
  const pick = v => (small() && v.dataset.srcSm) ? v.dataset.srcSm : v.dataset.src;
  const loadV = v => { if (!v.dataset.loaded) { const s = pick(v); if (s) { v.src = s; v.dataset.loaded = '1'; } } };
  const playV = v => { loadV(v); const p = v.play(); if (p && p.catch) p.catch(() => {}); };
  const shown = v => v.offsetParent !== null && !v.closest('[hidden]');
  function wireVideo(v) {
    const frame = v.closest('.frame, .phone'); const mode = v.dataset.mode; const fig = v.closest('figure.fig');
    v.muted = true; v.playsInline = true; v.setAttribute('playsinline', ''); v.removeAttribute('controls');
    if (mode === 'loop') v.loop = true;
    const ctl = document.createElement('button'); ctl.type = 'button'; ctl.className = 'media-ctl'; ctl.dataset.mode = mode;
    const sync = () => {
      if (frame) frame.classList.toggle('is-playing', !v.paused && !v.ended);
      const t = (!v.paused && !v.ended) ? 'Pause' : (v.ended || (mode === 'once' && v.dataset.played)) ? 'Replay' : 'Play';
      ctl.innerHTML = ICON[t.toLowerCase()] + '<span>' + t + '</span>'; ctl.setAttribute('aria-label', t + ': ' + (v.getAttribute('aria-label') || 'video'));
      if (mode === 'click' && fig) ctl.hidden = !v.dataset.started;
    };
    ctl.addEventListener('click', () => { if (!v.paused && !v.ended) { v.pause(); v.dataset.userPaused = '1'; } else { if (v.ended) v.currentTime = 0; v.dataset.userPaused = ''; playV(v); } });
    v.addEventListener('play', () => { v.dataset.started = '1'; sync(); }); v.addEventListener('pause', sync); v.addEventListener('ended', () => { v.dataset.played = '1'; sync(); });
    const cap = fig && fig.querySelector('figcaption'); if (cap) cap.prepend(ctl); else (frame || v.parentElement).appendChild(ctl);
    if (frame && mode === 'click') {
      const big = document.createElement('button'); big.type = 'button'; big.className = 'play-big'; big.setAttribute('aria-label', 'Play video: ' + (v.getAttribute('aria-label') || ''));
      big.innerHTML = ICON.play; big.addEventListener('click', () => { if (v.ended) v.currentTime = 0; v.dataset.userPaused = ''; playV(v); }); frame.appendChild(big);
    }
    sync();
  }
  const videos = [...document.querySelectorAll('video[data-mode]')];
  videos.forEach(wireVideo);
  // posters load lazily, near the viewport (a hidden pane's poster loads when the pane is shown)
  const setPoster = v => { if (v.getAttribute('poster')) return; const p = (small() && v.dataset.posterSm) || v.dataset.poster; if (p) v.setAttribute('poster', p); };
  const pio = 'IntersectionObserver' in window ? new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { setPoster(e.target); pio.unobserve(e.target); } }), { rootMargin: '900px 0px' }) : null;
  videos.forEach(v => { if (v.closest('[data-managed]')) return; if (pio) pio.observe(v); else setPoster(v); });
  // first-screen videos start with a small poster; wide or high-density screens upgrade to the large one
  videos.forEach(v => { if (v.dataset.posterLg && !v.closest('[data-managed]') && !small() && v.clientWidth * (window.devicePixelRatio || 1) > 1000) v.setAttribute('poster', v.dataset.posterLg); });
  const autoOK = v => v.dataset.mode !== 'click' && canAuto() && !(small() && v.dataset.heavy !== undefined) && !v.closest('[data-managed]');
  const vio = 'IntersectionObserver' in window ? new IntersectionObserver(es => es.forEach(e => {
    const v = e.target;
    if (e.isIntersecting && e.intersectionRatio >= 0.5 && shown(v)) { if (!v.dataset.userPaused && !(v.dataset.mode === 'once' && v.dataset.played)) playV(v); }
    else if (!v.paused) v.pause();
  }), { threshold: [0, 0.5] }) : null;
  if (vio) videos.filter(autoOK).forEach(v => vio.observe(v));
  // re-evaluate a video that has just become visible (pane switch): IntersectionObserver alone does not re-fire
  const kick = root => root.querySelectorAll('video[data-mode]').forEach(v => { setPoster(v); if (!autoOK(v) || v.dataset.userPaused) return; const r = v.getBoundingClientRect(); if (r.bottom > 0 && r.top < innerHeight && shown(v)) { if (v.dataset.mode === 'once') { v.currentTime = 0; v.dataset.played = ''; } playV(v); } });

  /* project switchers: [data-switch] > [role=tablist] tabs + [role=tabpanel] panes (ARIA tabs, roving tabindex) */
  document.querySelectorAll('[data-switch]').forEach(sw => {
    const tabs = [...sw.querySelectorAll('[role="tab"]')]; const stage = sw.querySelector('.sw-stage');
    const paneOf = t => document.getElementById(t.getAttribute('aria-controls'));
    const select = (t, focus) => {
      const cur = tabs.find(x => x.getAttribute('aria-selected') === 'true'); if (cur === t) return;
      tabs.forEach(x => { const on = x === t; x.setAttribute('aria-selected', String(on)); x.tabIndex = on ? 0 : -1; const p = paneOf(x); if (p) { p.hidden = !on; p.classList.remove('is-entering'); if (!on) p.querySelectorAll('video').forEach(v => { if (!v.paused) v.pause(); }); } });
      const p = paneOf(t);
      if (p && !reduce.matches) { void p.offsetWidth; p.classList.add('is-entering'); if (stage) { stage.classList.remove('is-moving'); void stage.offsetWidth; stage.classList.add('is-moving'); } }
      if (p) kick(p);
      if (focus) t.focus();
    };
    tabs.forEach((t, i) => {
      t.type = 'button';
      t.addEventListener('click', () => select(t));
      t.addEventListener('keydown', e => {
        const k = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[e.key];
        if (k) { e.preventDefault(); select(tabs[(i + k + tabs.length) % tabs.length], true); }
        else if (e.key === 'Home') { e.preventDefault(); select(tabs[0], true); } else if (e.key === 'End') { e.preventDefault(); select(tabs[tabs.length - 1], true); }
      });
    });
  });


  /* --- product views: shared runtime --- */
  const pv = (() => {
  try {
  /* product views: the shared runtime of the four homepage viewers. assemble.mjs wraps this body as
     const pv = (() => { try { BODY } catch (e) { ... return null; } })();   so it must end with `return api;`.
     Views (src/views/<id>/view.js) run after it and register hooks with pv.view(id, hooks); the shell (atlas.js) runs
     last, drives project switches and owns window.PV. Nothing here touches the page until the shell calls pv.start(). */
  const d = document, root = d.documentElement;
  const RM = matchMedia('(prefers-reduced-motion: reduce)'), SMALL = matchMedia('(max-width: 760px)');
  const EASE = 'cubic-bezier(.2,.7,.2,1)';
  const motion = () => !RM.matches;
  const sec = id => d.getElementById('pv-' + id);
  const idOf = s => s && s.dataset.pv;
  const words = v => String(v || '').split(/\s+/).filter(Boolean);
  const hooks = {};
  const report = (where, e) => { try { console.error('[pv:' + where + ']', e); } catch (x) { /* ignore */ } };

  /* guarded listeners: an error in a view's handler is reported and never breaks the page */
  const on = (el, type, fn, opt) => { if (el) el.addEventListener(type, function (e) { try { return fn.call(this, e); } catch (x) { report('handler', x); } }, opt); };

  /* animations run through pv.animate are tracked per section, so a settle can always finish them (transform none) */
  const live = new WeakMap();
  const track = (s, a) => { if (!s || !a) return a; let set = live.get(s); if (!set) live.set(s, set = new Set()); set.add(a); const drop = () => set.delete(a); a.finished.then(drop, drop); return a; };
  const done = { finished: Promise.resolve(), cancel() {}, finish() {} };
  function animate(el, kf, opt = {}) {
    if (!el || !el.animate) return done;
    let frames = kf, o = { easing: EASE, ...opt };
    if (!motion()) { // reduced motion: opacity only, at most 120 ms, or nothing at all
      const op = (Array.isArray(kf) ? kf : []).map(f => ('opacity' in f ? { opacity: f.opacity } : null));
      if (!op.length || op.some(f => !f)) return done;
      frames = op; o = { duration: Math.min(120, o.duration || 120), easing: 'linear' };
    }
    try { return track(el.closest('section.pv') || el, el.animate(frames, o)); } catch (e) { report('animate', e); return done; }
  }
  const stopAll = s => { const set = live.get(s); if (set) { [...set].forEach(a => { try { a.cancel(); } catch (e) { /* ignore */ } }); set.clear(); } };
  const ended = a => a.finished.then(() => {}, () => {});
  const timeout = (p, ms) => Promise.race([Promise.resolve(p).catch(e => report('hook', e)), new Promise(r => setTimeout(r, ms))]);

  /* settled bookkeeping: data-pv-settled="true" on a section while no transition of it is running */
  const busy = new WeakMap();
  function hold(s) { busy.set(s, (busy.get(s) || 0) + 1); s.dataset.pvSettled = 'false'; }
  function release(s) {
    const n = Math.max(0, (busy.get(s) || 0) - 1); busy.set(s, n);
    if (n) return;
    stopAll(s);
    s.dataset.pvSettled = 'true';
    s.dispatchEvent(new CustomEvent('pv:settled', { bubbles: true, detail: { project: idOf(s), state: s.dataset.pvCurrentState } }));
  }
  const settledP = s => (s.dataset.pvSettled === 'true' ? Promise.resolve() : new Promise(r => s.addEventListener('pv:settled', () => r(), { once: true })));

  /* steady stages (.pv-steady): the media row keeps the height of the tallest state's media (--pv-hold), so the controls
     under it never move when the state changes. Measured when the project is shown, on resize and when the stage's width
     changes. Each hidden state is laid out for one synchronous read (class pv-probe: invisible, never painted; its lazy
     images are not requested), then hidden again. pv.steady(id or section) re-measures, e.g. after a view adds media. */
  const outerH = el => { const cs = getComputedStyle(el); return el.offsetHeight + (parseFloat(cs.marginTop) || 0) + (parseFloat(cs.marginBottom) || 0); };
  const mediaOf = p => { const box = p.querySelector(':scope > .pv-fig') || p; return [...box.children].filter(c => !c.classList.contains('pv-cap')); };
  let sro = null;
  function steady(s) {
    s = typeof s === 'string' ? sec(s) : s;
    if (!s) return;
    s.querySelectorAll('.pv-steady').forEach(st => {
      if (!st.getClientRects().length) return;   // not on screen: measured when its project is shown
      const panes = [...st.children].filter(c => c.hasAttribute('data-pv-for'));
      const probe = panes.filter(p => !p.classList.contains('is-cur'));
      let h = 0;
      probe.forEach(p => p.classList.add('pv-probe'));
      try { panes.forEach(p => mediaOf(p).forEach(c => { h = Math.max(h, outerH(c)); })); }
      finally { probe.forEach(p => p.classList.remove('pv-probe')); }
      st.style.setProperty('--pv-hold', Math.ceil(h) + 'px');
      if (sro && !st._pvRO) { st._pvRO = 1; sro.observe(st); }
    });
  }

  /* states */
  const states = id => { const s = sec(id); return s ? words(s.dataset.pvStates) : []; };
  const state = id => { const s = sec(id); return s ? s.dataset.pvCurrentState : null; };
  const isCurProject = s => idOf(s) === root.dataset.w;
  const forOf = el => words(el.dataset.pvFor);

  function syncControls(s, to) {
    s.querySelectorAll('[data-pv-state]').forEach(b => {
      const on = words(b.dataset.pvOn || b.dataset.pvState).includes(to);
      if (b.getAttribute('role') === 'tab') { b.setAttribute('aria-selected', String(on)); b.tabIndex = on ? 0 : -1; }
      else if (b.hasAttribute('aria-pressed')) b.setAttribute('aria-pressed', String(on));
    });
  }
  function announce(s, to) {
    const out = s.querySelector('.pv-live'); if (!out) return;
    const b = s.querySelector(`[data-pv-state="${to}"]`), cap = s.querySelector(`[data-pv-for~="${to}"] .pv-cap-t`);
    out.textContent = [b && b.querySelector('.pv-ctl-l') ? b.querySelector('.pv-ctl-l').textContent : '', cap ? cap.textContent : ''].filter(Boolean).join(': ');
  }

  /* media: posters and lazy images of a state are switched on when the state (or its project) is shown */
  function activate(scope) { // only the parts of the current state: hidden states download nothing
    if (!scope) return;
    scope.querySelectorAll('video.pv-video').forEach(v => {
      const part = v.closest('[data-pv-for]'); if (part && !part.classList.contains('is-cur')) return;
      if (!v.getAttribute('poster')) { const p = (SMALL.matches && v.dataset.posterSm) || v.dataset.poster; if (p) v.setAttribute('poster', p); }
    });
  }
  function warm(s, to) { // fetch a state's media before it is shown (on hover or focus of its control)
    s.querySelectorAll(`[data-pv-for~="${to}"] img[loading="lazy"]`).forEach(i => { i.loading = 'eager'; });
    s.querySelectorAll(`[data-pv-for~="${to}"] video.pv-video:not([poster])`).forEach(v => { const p = (SMALL.matches && v.dataset.posterSm) || v.dataset.poster; if (p) v.setAttribute('poster', p); });
  }

  /* the default state change: outgoing parts fade (<= 140 ms), incoming parts rise in (300 ms), then everything is flat */
  async function swap(ctx) {
    const { section: s, from, to, instant } = ctx;
    const all = [...s.querySelectorAll('[data-pv-for]')];
    const outs = all.filter(el => el.classList.contains('is-cur') && !forOf(el).includes(to));
    const ins = all.filter(el => !el.classList.contains('is-cur') && forOf(el).includes(to));
    if (!instant && outs.length) await Promise.all(outs.map(el => ended(animate(el, [{ opacity: 1 }, { opacity: 0 }], { duration: 140, easing: 'linear' }))));
    if (ctx.stale && ctx.stale()) return from;   // a newer state change took over
    all.forEach(el => el.classList.toggle('is-cur', forOf(el).includes(to)));
    activate(s);
    if (!instant && ins.length) await Promise.all(ins.map(el => ended(animate(el, [{ opacity: 0, transform: 'translateY(10px)' }, { opacity: 1, transform: 'none' }], { duration: 300 }))));
    return from;
  }

  const ctxFor = (s, extra) => ({ section: s, root: s, id: idOf(s), motion: motion(), animate, swap: () => swap(ctxFor(s, extra)), activate: () => activate(s), ...extra });

  /** Set a view's internal state. Resolves once it has settled. o.instant skips the animation; o.user announces it. */
  async function go(id, to, o = {}) {
    const s = sec(id);
    if (!s) throw new Error('unknown project ' + id);
    if (!states(id).includes(to)) throw new Error('unknown state ' + to + ' for ' + id);
    const from = s.dataset.pvCurrentState;
    if (to === from && !o.force) return settledP(s);
    stopAll(s);
    hold(s);
    const my = s._pvTok = (s._pvTok || 0) + 1;
    const instant = !!o.instant || !motion() || !isCurProject(s);
    s.dataset.pvCurrentState = to;
    syncControls(s, to);
    const ctx = ctxFor(s, { from, to, instant, user: !!o.user, stale: () => s._pvTok !== my });
    try {
      const h = hooks[idOf(s)];
      if (h && typeof h.set === 'function') await timeout(h.set(ctx), instant ? 50 : 1200);
      else await swap(ctx);
    } catch (e) { report(id + ':set', e); }
    finally {
      // whatever a hook did, the parts of the current state end up shown and flat
      s.querySelectorAll('[data-pv-for]').forEach(el => el.classList.toggle('is-cur', forOf(el).includes(s.dataset.pvCurrentState)));
      activate(s);
      if (o.user) announce(s, to);
      s.dispatchEvent(new CustomEvent('pv:state', { bubbles: true, detail: { project: idOf(s), state: to, from } }));
      videos();
      release(s);
    }
    return settledP(s);
  }
  /** Back to a view's initial state (data-pv-initial, else its first) or a given one, without animation, e.g. before the
   *  project is shown again. */
  const initial = id => { const s = sec(id); return s ? (s.dataset.pvInitial || states(id)[0] || null) : null; };
  const reset = (id, to) => { const s = sec(id); if (!s) return Promise.resolve(); const t = to || initial(id); return t ? go(id, t, { instant: true }) : Promise.resolve(); };

  /* project lifecycle, driven by the shell */
  function leave(id, detail) {
    const s = sec(id); if (!s) return;
    s.dispatchEvent(new CustomEvent('pv:leave', { bubbles: true, detail }));
    const h = hooks[id]; if (h && typeof h.leave === 'function') { try { h.leave(ctxFor(s, detail)); } catch (e) { report(id + ':leave', e); } }
    videos();
  }
  /** Show a project's view. With motion the view's signature entrance runs (hook enter, 300-650 ms), or the default:
   *  a short rise with a slight tilt that always ends at transform none. */
  async function enter(id, detail = {}) {
    const s = sec(id); if (!s) return;
    activate(s);
    steady(s);
    s.dispatchEvent(new CustomEvent('pv:enter', { bubbles: true, detail }));
    if (detail.instant) { videos(); return; }
    const h = hooks[id];
    const ctx = ctxFor(s, { ...detail, from: detail.from, to: id });
    try {
      if (h && typeof h.enter === 'function') await timeout(h.enter(ctx), 900);
      else await ended(animate(s, [{ opacity: 0, transform: 'perspective(1400px) translate3d(0,18px,0) rotateX(2.5deg) scale(.985)' }, { opacity: 1, transform: 'none' }], { duration: 420 }));
    } catch (e) { report(id + ':enter', e); }
    videos();
  }

  /* video policy: a clip plays only in the current project and state, while visible, with the page visible, and
     (unless the visitor pressed Play) only short loops marked data-autoplay with motion allowed. One-shot clips hold
     their last frame. Nothing has sound. */
  const vids = () => [...d.querySelectorAll('section.pv video.pv-video')];
  const vis = new WeakMap();
  let vio = null;
  const watch = v => { if (v._pvIO) return; v._pvIO = 1; v.muted = true; syncBtn(v); if (vio) vio.observe(v); else vis.set(v, true); };
  const btnOf = v => { const m = v.closest('.pv-media'); return m && m.querySelector('[data-pv-play]'); };
  function syncBtn(v) {
    const b = btnOf(v); if (!b) return;
    const playing = !v.paused && !v.ended, t = playing ? 'Pause' : (v.ended || v._done) ? 'Replay' : 'Play';
    b.dataset.s = t.toLowerCase();
    const l = b.querySelector('.pv-play-t'); if (l) l.textContent = t;
    b.setAttribute('aria-label', t + ' video: ' + (v.getAttribute('aria-label') || ''));
  }
  function load(v) { if (!v.getAttribute('src')) { v.preload = 'auto'; v.src = (SMALL.matches && v.dataset.srcSm) || v.dataset.src; } }
  function isCur(v) {
    const s = v.closest('section.pv'); if (!s || !isCurProject(s) || s.closest('.ax-world.is-out')) return false;
    const p = v.closest('[data-pv-for]'); return !p || p.classList.contains('is-cur');
  }
  function videos() {
    vids().forEach(v => {
      watch(v);
      const c = isCur(v);
      if (!c && v._user === 'play') v._user = null;
      let want = c && vis.get(v) && !d.hidden && v._user !== 'pause';
      // A finished one-shot stays on its end frame until the visitor explicitly presses Replay.
      if (want && v.hasAttribute('data-once') && v._done) want = false;
      if (want && v._user !== 'play' && (!motion() || !v.hasAttribute('data-autoplay'))) want = false;
      if (want) { load(v); if (v.paused) { const p = v.play(); if (p && p.catch) p.catch(() => {}); } } else if (!v.paused) v.pause();
    });
  }
  function startVideos() {
    // media events don't bubble, so they are caught on the way down: videos a view adds later are covered too
    ['play', 'pause', 'ended'].forEach(ev => on(d, ev, e => { const v = e.target; if (!v.matches || !v.matches('video.pv-video')) return; if (ev === 'ended') v._done = true; syncBtn(v); }, true));
    // Play/Pause: the visible button, or a click or tap on the video itself (the button is the accessible control). One
    // toggle per click: a view that forwards a video click to the button (b.click()) is not toggled twice.
    const toggle = v => {
      if (v._pvTog) return; v._pvTog = 1; setTimeout(() => { v._pvTog = 0; }, 0);
      if (!v.paused && !v.ended) { v._user = 'pause'; v.pause(); return; }
      v._user = 'play'; if (v.ended || v._done) { v.currentTime = 0; v._done = false; }
      load(v); const p = v.play(); if (p && p.catch) p.catch(() => {});
    };
    on(d, 'click', e => {
      const t = e.target; if (!t || !t.closest) return;
      const b = t.closest('[data-pv-play]');
      if (b) { const m = b.closest('.pv-media'), v = m && m.querySelector('video.pv-video'); if (!v) return; e.preventDefault(); toggle(v); return; }
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const v = t.closest('section.pv video.pv-video'); if (!v || v.closest('[data-zoom]')) return;
      e.preventDefault(); toggle(v);
    });
    if ('IntersectionObserver' in window) vio = new IntersectionObserver(es => { es.forEach(e => vis.set(e.target, e.intersectionRatio >= 0.3)); videos(); }, { threshold: [0, 0.3, 0.6] });
    vids().forEach(watch);
    on(d, 'visibilitychange', videos);
    if (RM.addEventListener) RM.addEventListener('change', videos);
  }

  /* controls: any [data-pv-state] button inside a view; arrows, Home and End move along its [data-pv-group] */
  function startControls() {
    on(d, 'click', e => {
      const b = e.target.closest && e.target.closest('section.pv [data-pv-state]'); if (!b || b.disabled) return;
      const s = b.closest('section.pv');
      go(idOf(s), b.dataset.pvState, { user: true }).catch(x => report('go', x));
    });
    on(d, 'keydown', e => {
      const b = e.target.closest && e.target.closest('section.pv [data-pv-group] [data-pv-state]'); if (!b) return;
      const g = b.closest('[data-pv-group]'), list = [...g.querySelectorAll('[data-pv-state]')].filter(x => !x.disabled && x.offsetParent !== null);
      const i = list.indexOf(b), L = list.length; if (i < 0 || L < 2) return;
      const j = { ArrowRight: (i + 1) % L, ArrowDown: (i + 1) % L, ArrowLeft: (i + L - 1) % L, ArrowUp: (i + L - 1) % L, Home: 0, End: L - 1 }[e.key];
      if (j === undefined) return;
      e.preventDefault(); list[j].focus(); list[j].click();
    });
    const pre = e => { const b = e.target.closest && e.target.closest('section.pv [data-pv-state]'); if (b) warm(b.closest('section.pv'), b.dataset.pvState); };
    on(d, 'pointerover', pre, { passive: true }); on(d, 'focusin', pre);
  }

  function startSteady() {
    if ('ResizeObserver' in window) sro = new ResizeObserver(es => es.forEach(e => {   // a width change re-measures
      const st = e.target, w = Math.round(e.contentRect.width);
      if (st._pvW !== w) { const first = st._pvW == null; st._pvW = w; if (!first) steady(st.closest('section.pv')); }
    }));
    let rt = 0;
    on(window, 'resize', () => { clearTimeout(rt); rt = setTimeout(() => steady(root.dataset.w), 120); }, { passive: true });
  }

  let started = false;
  function start() { if (started) return; started = true; startControls(); startVideos(); startSteady(); }

  const api = Object.freeze({
    /** register a view's hooks: { set(ctx), enter(ctx), leave(ctx) } (all optional; set/enter may return a Promise) */
    view(id, h) { hooks[id] = Object.assign(hooks[id] || {}, h); },
    section: sec, states, state, initial, go, reset, enter, leave, hold, release, settled: settledP,
    animate, motion, on, activate, videos, start, swap: s => swap(s), ease: EASE,
    /** re-measure the steady stages (.pv-steady) of a view: an id or the section */
    steady,
  });
  return api;

  } catch (e) { console.error('[pv]', e); return null; }
  })();

  /* --- view: cfit --- */
  ;(() => {
  'use strict';
  const id = 'cfit', root = pv && document.getElementById('pv-cfit');
  if (!root) return;
  try {
/* CFIT view runtime (Batch B2). Wrapped by assemble: `id` = 'cfit', `root` = section#pv-cfit, `pv` = the shared runtime.
   - "Look closer" (desktop and tablet): a shared-element zoom from the frame toward the close-up rectangle (about 380 ms),
     then a crossfade into the sharp 1:1 close-up beside a mini-map; "Show full screen" (or Escape) zooms back out.
     The section reads data-pv-settled="false" while it runs; data-pv-main moves to the close-up while it is shown.
   - The entrance signature: a grid-scan wipe across the media (about 560 ms) that leaves nothing behind.
   - A click on the recording toggles Play, like its Play button.
   With reduced motion there are no transforms or wipes: the close-up appears with a short fade (<= 120 ms). */
const SMALL = matchMedia('(max-width: 600px)');
const look = root.querySelector('.cf-look');
const live = root.querySelector('.pv-live');
const EZ = 'cubic-bezier(.3,.1,.2,1)';
let busy = false, tok = 0;   // tok: a newer reset or toggle makes a running zoom stale

const curFig = () => root.querySelector('.cf-fig.is-cur');
const viewOf = fig => fig && fig.querySelector('.cf-view');
const isCloser = fig => !!(viewOf(fig) && viewOf(fig).classList.contains('is-closer'));
const wait = ms => new Promise(r => setTimeout(r, ms));
const say = t => { if (live) live.textContent = t; };

function warm(fig) {   // fetch the close-up and the mini-map before they are shown
  if (!fig) return;
  fig.querySelectorAll('.cf-closer img[loading="lazy"]').forEach(i => { i.loading = 'eager'; });
}
async function ready(img) {
  if (!img) return;
  if (img.loading === 'lazy') img.loading = 'eager';
  if (img.decode) await Promise.race([img.decode().catch(() => {}), wait(1500)]);
}

/* the settled state of a figure: frame or close-up (no animation) */
function mark(fig, on) {
  const v = viewOf(fig); if (!v) return;
  v.classList.toggle('is-closer', on);
  v.classList.remove('is-zooming');
  const f = fig.querySelector('.cf-frame'), d = fig.querySelector('.cf-detail-img');
  if (f && d) {
    if (on) { f.removeAttribute('data-pv-main'); d.setAttribute('data-pv-main', ''); }
    else { d.removeAttribute('data-pv-main'); f.setAttribute('data-pv-main', ''); }
  }
  // the settled state lives in CSS: drop every animation of the parts (fill-forwards would keep a transform matrix)
  fig.querySelectorAll('.cf-shot, .cf-closer, .cf-closer-bg, .cf-detail, .cf-ctx').forEach(e => { e.getAnimations().forEach(a => a.cancel()); e.style.opacity = ''; });
  const shot = fig.querySelector('.cf-shot'); if (shot) shot.style.transformOrigin = '';
  if (look) look.setAttribute('aria-pressed', String(on && fig.classList.contains('is-cur')));
}
/* back to the frame everywhere, at once (a step change, leaving the project, a phone-width layout) */
function resetAll() {
  tok++;
  root.querySelectorAll('.cf-fig').forEach(f => { if (isCloser(f) || viewOf(f)?.classList.contains('is-zooming')) mark(f, false); });
  if (look) look.setAttribute('aria-pressed', 'false');
}

/* the transform that puts the close-up rectangle of the frame exactly where the close-up image sits */
function zoomTo(fig) {
  const box = fig.querySelector('.cf-media'), det = fig.querySelector('.cf-detail');
  const B = box.getBoundingClientRect(), T = det.getBoundingClientRect();
  const [rx, ry, rw] = String(fig.dataset.cfR || '').split(' ').map(Number);
  if (!(rw > 0) || !B.width || !T.width) return null;
  const s = T.width / (rw * B.width);
  return `translate(${(T.left - B.left - rx * B.width * s).toFixed(2)}px, ${(T.top - B.top - ry * B.height * s).toFixed(2)}px) scale(${s.toFixed(4)})`;
}

async function zoomIn(fig, my) {
  const v = viewOf(fig), shot = fig.querySelector('.cf-shot');
  const bg = fig.querySelector('.cf-closer-bg'), det = fig.querySelector('.cf-detail'), side = fig.querySelector('.cf-ctx');
  [bg, det, side].forEach(e => { e.style.opacity = '0'; });
  v.classList.add('is-zooming');
  const Z = zoomTo(fig);
  if (!Z) { mark(fig, true); return; }
  shot.style.transformOrigin = '0 0';
  const a = pv.animate(shot, [{ transform: 'none' }, { transform: Z }], { duration: 380, easing: EZ, fill: 'forwards' });
  const b = pv.animate(bg, [{ opacity: 0 }, { opacity: 0, offset: 0.55 }, { opacity: 1 }], { duration: 540, easing: 'linear', fill: 'forwards' });
  const c = pv.animate(side, [{ opacity: 0, transform: 'translateX(14px)' }, { opacity: 1, transform: 'none' }], { duration: 300, delay: 260, fill: 'both' });
  await a.finished.catch(() => {});
  if (my !== tok) return;
  const d = pv.animate(det, [{ opacity: 0 }, { opacity: 1 }], { duration: 160, easing: 'linear', fill: 'forwards' });
  await Promise.all([b, c, d].map(x => x.finished.catch(() => {})));
  if (my === tok) mark(fig, true);
}

async function zoomOut(fig, my) {
  const v = viewOf(fig), shot = fig.querySelector('.cf-shot');
  const bg = fig.querySelector('.cf-closer-bg'), det = fig.querySelector('.cf-detail'), side = fig.querySelector('.cf-ctx');
  v.classList.add('is-zooming');
  const Z = zoomTo(fig);
  if (!Z) { mark(fig, false); return; }
  shot.style.transformOrigin = '0 0';
  const a = pv.animate(shot, [{ transform: Z }, { transform: Z, offset: 0.3 }, { transform: 'none' }], { duration: 520, easing: EZ, fill: 'both' });
  const fades = [det, side].map(e => pv.animate(e, [{ opacity: 1 }, { opacity: 0 }], { duration: 150, easing: 'linear', fill: 'forwards' }));
  const b = pv.animate(bg, [{ opacity: 1 }, { opacity: 0 }], { duration: 320, easing: 'linear', fill: 'forwards' });
  await Promise.all([a, b, ...fades].map(x => x.finished.catch(() => {})));
  if (my === tok) mark(fig, false);
}

async function closer(on, o = {}) {
  const fig = curFig();
  if (!fig || busy || !fig.querySelector('.cf-closer') || isCloser(fig) === on) return;
  if (on && SMALL.matches) return;   // phones show the close-up inline
  busy = true; pv.hold(root);
  const my = ++tok;
  try {
    const motion = pv.motion() && !o.instant;
    if (on) await ready(fig.querySelector('.cf-detail-img'));
    if (my !== tok) return;
    if (!motion) {
      mark(fig, on);
      if (on && !o.instant) await pv.animate(fig.querySelector('.cf-closer'), [{ opacity: 0 }, { opacity: 1 }], { duration: 120, easing: 'linear' }).finished.catch(() => {});
    } else if (on) await zoomIn(fig, my);
    else await zoomOut(fig, my);
  } catch (e) { if (my === tok) mark(fig, on); throw e; }
  finally { busy = false; pv.release(root); }
  if (my !== tok) return;
  if (o.user) say(on ? `${look ? look.textContent.trim() : 'Look closer'}: ${fig.querySelector('.cf-detail-img').alt}` : `Full screen: ${fig.querySelector('.pv-cap-t').textContent}`);
}

pv.on(look, 'click', () => {
  const fig = curFig();
  closer(!isCloser(fig), { user: true }).catch(e => console.error('[pv:cfit]', e));
});
pv.on(look, 'pointerenter', () => warm(curFig()));
pv.on(look, 'focus', () => warm(curFig()));
root.querySelectorAll('.cf-back').forEach(b => pv.on(b, 'click', () => {
  closer(false, { user: true }).then(() => { if (look) look.focus({ preventScroll: true }); }).catch(e => console.error('[pv:cfit]', e));
}));
pv.on(root, 'keydown', e => {
  if (e.key !== 'Escape' || !isCloser(curFig())) return;
  const inView = e.target.closest && (e.target.closest('.cf-view') || e.target === look);
  if (!inView) return;
  e.preventDefault();
  closer(false, { user: true }).then(() => { if (look) look.focus({ preventScroll: true }); }).catch(x => console.error('[pv:cfit]', x));
});
const onSmall = () => { if (SMALL.matches) resetAll(); };
if (SMALL.addEventListener) SMALL.addEventListener('change', () => { try { onSmall(); } catch (e) { console.error('[pv:cfit]', e); } });

/* a click on the recording does what its Play button does */
root.querySelectorAll('video.pv-video').forEach(v => pv.on(v, 'click', () => {
  const b = v.closest('.pv-media') && v.closest('.pv-media').querySelector('[data-pv-play]');
  if (b) b.click();
}));

/* the grid-scan wipe: the media is revealed left to right behind a scanning grid band; the band is removed afterwards */
const dropScans = () => root.querySelectorAll('.cf-scan').forEach(s => s.remove());
pv.on(root, 'pv:settled', dropScans);

pv.view(id, {
  async set(ctx) {
    resetAll();
    return ctx.swap();
  },
  async enter(ctx) {
    resetAll();
    if (!ctx.motion) return;
    const fig = curFig(), box = fig && fig.querySelector('.pv-media');
    if (!box) return;
    const W = box.getBoundingClientRect().width;
    const scan = document.createElement('div');
    scan.className = 'cf-scan'; scan.setAttribute('aria-hidden', 'true');
    box.appendChild(scan);
    const sw = scan.getBoundingClientRect().width || W * 0.24;
    const D = 560, E = 'cubic-bezier(.45,.05,.25,1)';
    try {
      const parts = [...root.querySelectorAll('.cf-bar, .pv-info')];
      const anims = [
        pv.animate(box, [{ clipPath: 'inset(0 100% 0 0 round 10px)' }, { clipPath: 'inset(0 0% 0 0 round 10px)' }], { duration: D, easing: E }),
        pv.animate(scan, [{ transform: `translateX(${-sw}px)` }, { transform: `translateX(${W - sw}px)` }], { duration: D, easing: E }),
        pv.animate(root, [{ opacity: 0 }, { opacity: 1 }], { duration: 200, easing: 'linear' }),
        ...parts.map((p, i) => pv.animate(p, [{ opacity: 0, transform: 'translateY(8px)' }, { opacity: 1, transform: 'none' }], { duration: 360, delay: 80 + i * 60 })),
      ];
      await Promise.all(anims.map(a => a.finished.catch(() => {})));
      await pv.animate(scan, [{ opacity: 1 }, { opacity: 0 }], { duration: 90, easing: 'linear', fill: 'forwards' }).finished.catch(() => {});
    } finally { scan.remove(); }
  },
  leave() { resetAll(); dropScans(); },
});

  } catch (e) { console.error('[pv:cfit]', e); root.classList.add('pv-js-failed'); }
  })();

  /* --- view: awhina --- */
  ;(() => {
  'use strict';
  const id = 'awhina', root = pv && document.getElementById('pv-awhina');
  if (!root) return;
  try {
  /* AWAI view runtime: the dual-app studio. Wrapped by assemble.mjs (id = 'awhina', root = section#pv-awhina).
     States: overview (both apps) and one state per real screen (qr-help, qr-help-2, ... ia-quiz-3). The layout class on
     .aw-body (is-ov / is-qr / is-ia) changes together with the visible parts, so a switch between layouts is a FLIP:
     each app's phone (or its compact card) moves from where it was to where it is now, then settles at transform none.
     Inside one app only the screen changes (a short slide within the phone). Reduced motion: the runtime makes every
     change instant. Nothing here imitates the apps: the controls only switch between real captures. */
  const body = root.querySelector('.aw-body');
  const words = v => String(v || '').split(/\s+/).filter(Boolean);
  const appOf = st => (st === 'overview' ? 'ov' : String(st).slice(0, 2));
  const order = pv.states(id);
  const ended = a => (a && a.finished ? a.finished.then(() => {}, () => {}) : Promise.resolve());
  const figOf = st => root.querySelector('.aw-fig[data-pv-for="' + st + '"]');
  const shown = el => !!el && el.getClientRects().length > 0;

  function setMode(st) {
    const m = appOf(st);
    body.classList.toggle('is-ov', m === 'ov');
    body.classList.toggle('is-qr', m === 'qr');
    body.classList.toggle('is-ia', m === 'ia');
  }
  function swapNow(st) {
    root.querySelectorAll('[data-pv-for]').forEach(el => el.classList.toggle('is-cur', words(el.dataset.pvFor).includes(st)));
    setMode(st);
    pv.activate(root);
  }
  // where each app is drawn right now: its phone, or the thumbnail of its compact card
  function places(st) {
    const out = {};
    if (appOf(st) === 'ov') { const f = figOf('overview'); if (f) f.querySelectorAll('.aw-dev[data-aw-app]').forEach(d => { out[d.dataset.awApp] = d; }); }
    else {
      const f = figOf(st), d = f && f.querySelector('.aw-dev[data-aw-app]'); if (d) out[d.dataset.awApp] = d;
      const t = root.querySelector('.aw-card.is-cur .aw-thumb[data-aw-app]'); if (t) out[t.dataset.awApp] = t;
    }
    return out;
  }
  const rectsOf = m => Object.fromEntries(Object.entries(m).filter(([, el]) => shown(el)).map(([k, el]) => [k, el.getBoundingClientRect()]));
  // the parts beside the phones that fade in after a layout switch
  const sideParts = () => [...root.querySelectorAll('.aw-chips.is-cur, .aw-fig.is-cur > .aw-pager, .aw-fig.is-cur > .aw-cap, .aw-fig.is-cur .aw-name, .aw-card.is-cur .aw-card-t, .aw-card.is-cur .aw-card-go')].filter(shown);

  pv.view(id, {
    async set(ctx) {
      const { from, to } = ctx;
      if (ctx.instant) { await ctx.swap(); setMode(to); return; }
      const a = appOf(from), b = appOf(to);
      if (a === b) {   // the same app: only the screen changes, sliding in the reading direction
        const outFig = figOf(from), inFig = figOf(to);
        const outScr = outFig && outFig.querySelector('.aw-dev .pv-media');
        const outCap = outFig && outFig.querySelector('.aw-cap');
        await Promise.all([ended(ctx.animate(outScr, [{ opacity: 1 }, { opacity: 0 }], { duration: 110, easing: 'linear' })), ended(ctx.animate(outCap, [{ opacity: 1 }, { opacity: 0 }], { duration: 110, easing: 'linear' }))]);
        if (ctx.stale()) return;
        swapNow(to);
        const dir = order.indexOf(to) >= order.indexOf(from) ? 1 : -1;
        const scr = inFig && inFig.querySelector('.aw-dev .pv-media > .pv-shot, .aw-dev .pv-media > video');
        const cap = inFig && inFig.querySelector('.aw-cap');
        await Promise.all([
          ended(ctx.animate(scr, [{ opacity: 0, transform: 'translateX(' + (dir * 26) + 'px)' }, { opacity: 1, transform: 'none' }], { duration: 320 })),
          ended(ctx.animate(cap, [{ opacity: 0, transform: 'translateY(6px)' }, { opacity: 1, transform: 'none' }], { duration: 260 })),
        ]);
        return;
      }
      // another layout (overview <-> an app, or one app -> the other): FLIP each app's phone or card
      const first = rectsOf(places(from));
      swapNow(to);
      const now = places(to), runs = [];
      Object.entries(now).forEach(([k, el]) => {
        const f = first[k]; if (!f || !shown(el)) return;
        const l = el.getBoundingClientRect(); if (!l.width || !l.height) return;
        const sx = f.width / l.width, sy = f.height / l.height, dx = f.left - l.left, dy = f.top - l.top;
        if (Math.abs(dx) < 1 && Math.abs(dy) < 1 && Math.abs(sx - 1) < 0.01) return;
        runs.push(ctx.animate(el, [{ transformOrigin: '0 0', transform: 'translate(' + dx + 'px,' + dy + 'px) scale(' + sx + ',' + sy + ')' }, { transformOrigin: '0 0', transform: 'none' }], { duration: 560 }));
      });
      sideParts().forEach((el, i) => runs.push(ctx.animate(el, [{ opacity: 0, transform: 'translateY(10px)' }, { opacity: 1, transform: 'none' }], { duration: 320, delay: 140 + Math.min(i, 5) * 35, fill: 'backwards' })));
      await Promise.all(runs.map(ended));
    },
    // the AWAI signature on entry: the phones rise one after the other, then settle flat
    async enter(ctx) {
      const items = [...root.querySelectorAll('.aw-fig.is-cur .aw-dev, .aw-card.is-cur')].filter(shown);
      const runs = [ctx.animate(root, [{ opacity: 0 }, { opacity: 1 }], { duration: 200, easing: 'linear' })];
      items.forEach((el, i) => runs.push(ctx.animate(el, [{ opacity: 0, transform: 'translateY(64px)' }, { opacity: 1, transform: 'none' }], { duration: 480, delay: 40 + i * 90, fill: 'backwards', easing: 'cubic-bezier(.16,.8,.24,1)' })));
      await Promise.all(runs.map(ended));
    },
  });

  // the overview phones are buttons that focus their app (rendered disabled so they are inert without JS)
  root.querySelectorAll('.aw-pick[disabled]').forEach(b => { b.disabled = false; });

  // each app button, overview phone and card returns to the last screen seen in that app
  const last = {};
  const point = () => root.querySelectorAll('[data-aw-go]').forEach(el => { const k = el.dataset.awGo; el.dataset.pvState = last[k] || el.dataset.awFirst || el.dataset.pvState; });
  root.querySelectorAll('[data-aw-go]').forEach(el => { el.dataset.awFirst = el.dataset.pvState; });

  // focus follows the visitor when the control they used is hidden by the change (pager, overview phone, card)
  let used = null;
  pv.on(root, 'click', e => { const b = e.target.closest && e.target.closest('[data-pv-state]'); used = b ? { pg: b.dataset.awPg || null, card: b.classList.contains('aw-card'), pick: b.classList.contains('aw-pick') } : null; });
  const live = root.querySelector('.pv-live');
  let said = live ? live.textContent : '';
  pv.on(root, 'pv:state', e => {
    const st = e.detail && e.detail.state; if (!st) return;
    setMode(st);
    const k = appOf(st); if (k !== 'ov') last[k] = st;
    point();
    // announce "<app> · <topic> · n of m: caption" instead of the bare button label
    if (live && live.textContent && live.textContent !== said) {
      const f = figOf(st), kick = f && f.querySelector('.aw-kick'), cap = f && f.querySelector('.pv-cap-t');
      if (kick && cap) live.textContent = kick.textContent.trim() + ': ' + cap.textContent.trim();
      said = live.textContent;
    }
    const u = used; used = null;
    if (!u) return;
    // after a change of layout (e.g. the lower phone of the stacked overview on a phone), bring the phone into view
    const dev = root.querySelector('.aw-fig.is-cur .aw-dev'), bar = document.querySelector('.bar'), hdr = document.querySelector('.site-header');
    if (dev && (e.detail.from === 'overview' || st === 'overview')) {
      const top = (hdr ? hdr.offsetHeight : 0) + (bar ? bar.offsetHeight : 0), r = dev.getBoundingClientRect();
      if (r.top < top || r.top > innerHeight * 0.5) { const s = root.querySelector('.aw-studio').getBoundingClientRect(); scrollTo({ top: Math.max(0, Math.round(scrollY + s.top - top - 8)), behavior: pv.motion() ? 'smooth' : 'auto' }); }
    }
    const a = document.activeElement;
    if (a && a !== document.body && shown(a) && root.contains(a)) return;
    let t = null;
    if (u.pg) { const f = figOf(st); if (f) t = f.querySelector('[data-aw-pg="' + u.pg + '"]:not(:disabled)') || f.querySelector('.aw-pg:not(:disabled)'); }
    else if (u.card) t = root.querySelector('.aw-card.is-cur');
    else if (u.pick) t = root.querySelector('.aw-chips.is-cur [aria-pressed="true"]');
    if (t && shown(t)) t.focus({ preventScroll: true });
  });
  pv.on(root, 'pv:enter', () => { Object.keys(last).forEach(k => delete last[k]); point(); setMode(pv.state(id)); });

  } catch (e) { console.error('[pv:awhina]', e); root.classList.add('pv-js-failed'); }
  })();

  /* --- view: echoes --- */
  ;(() => {
  'use strict';
  const id = 'echoes', root = pv && document.getElementById('pv-echoes');
  if (!root) return;
  try {
/* Echoes of Valor: the level explorer. A chapter change is a pixel mosaic cut: the outgoing frame breaks into growing
   blocks, the panes swap, and the incoming frame resolves from coarse blocks back to its real pixels. The blocks are
   drawn on a canvas laid over the player only while the change runs; it is removed before the view settles, so the
   settled frame is the untouched image or video. Entering the project resolves the frame the same way (or, if it is
   not decoded yet, reveals it with a stepped scanline wipe). Reduced motion: instant. */
const d = document;
const stage = root.querySelector('.ev-stage'), reel = root.querySelector('.ev-reel'), strip = root.querySelector('.ev-reel-in');
const STEP = 60, OUT = [4, 8, 16, 32], IN = [32, 16, 8, 4];
const words = v => String(v || '').split(/\s+/).filter(Boolean);
const sleep = ms => new Promise(r => setTimeout(r, ms));
const paneOf = s => stage && stage.querySelector(`.ev-pane[data-pv-for~="${s}"]`);
const curPane = () => stage && stage.querySelector('.ev-pane.is-cur');
const screenOf = p => p && p.querySelector('.ev-screen');

/* the right file for this screen: the 1280x720 encode lands pixel for pixel in a 1280 CSS px player at DPR 1 (and
   suits phones); high-density desktops get the 1920 encode and poster */
(() => {
  const dpw = Math.min(1280, innerWidth) * (devicePixelRatio || 1);
  root.querySelectorAll('video.pv-video').forEach(v => {
    if (dpw <= 1400) { if (v.dataset.srcSm) v.dataset.src = v.dataset.srcSm; }
    else if (v.dataset.posterLg) v.dataset.poster = v.dataset.posterLg;
  });
})();

/* a decoded source for a pane: its image, the video frame, or the video's poster; null if not ready within ms */
function within(p, ms) { return Promise.race([p.then(x => x, () => null), sleep(ms).then(() => null)]); }
async function source(pane, ms) {
  const scr = screenOf(pane); if (!scr) return null;
  const v = scr.querySelector('video');
  if (v) {
    if (v.readyState >= 2 && v.videoWidth) return v;
    const url = v.getAttribute('poster') || v.dataset.poster; if (!url) return null;
    const im = new Image(); im.decoding = 'async'; im.src = url;
    return within(im.decode().then(() => im), ms);
  }
  const img = scr.querySelector('img'); if (!img) return null;
  if (img.complete && img.naturalWidth) return img;
  img.loading = 'eager';
  return within(img.decode().then(() => (img.naturalWidth ? img : null)), ms);
}

/* the canvas over the player (never left behind: removed by its own change, by the next change, or on settle) */
const work = d.createElement('canvas');
function cover(scr) {
  const cv = d.createElement('canvas'); cv.className = 'ev-px'; cv.setAttribute('aria-hidden', 'true');
  place(cv, scr); stage.appendChild(cv); return cv;
}
function place(cv, scr) {
  const r = scr.getBoundingClientRect(), s = stage.getBoundingClientRect(), k = devicePixelRatio || 1;
  cv.width = Math.max(1, Math.round(r.width * k)); cv.height = Math.max(1, Math.round(r.height * k));
  cv.style.cssText = `left:${r.left - s.left}px;top:${r.top - s.top}px;width:${r.width}px;height:${r.height}px`;
}
function mosaic(cv, src, block) {
  const k = devicePixelRatio || 1, W = cv.width, H = cv.height;
  const w = Math.max(1, Math.round(W / (block * k))), h = Math.max(1, Math.round(H / (block * k)));
  work.width = w; work.height = h;
  const t = work.getContext('2d'); t.imageSmoothingEnabled = true; t.imageSmoothingQuality = 'high'; t.drawImage(src, 0, 0, w, h);
  const g = cv.getContext('2d'); g.imageSmoothingEnabled = false; g.clearRect(0, 0, W, H); g.drawImage(work, 0, 0, w, h, 0, 0, W, H);
}
const drop = cv => { if (cv && cv.parentNode) cv.parentNode.removeChild(cv); };
const clean = () => { if (stage) stage.querySelectorAll('canvas.ev-px').forEach(drop); };
function show(to) { root.querySelectorAll('[data-pv-for]').forEach(el => el.classList.toggle('is-cur', words(el.dataset.pvFor).includes(to))); }

/* the play order strip and the chapter strip follow the current chapter */
function follow(to) {
  root.querySelectorAll('.ev-route-l li[data-states]').forEach(li => li.classList.toggle('is-on', words(li.dataset.states).includes(to)));
  if (!strip || strip.scrollWidth <= strip.clientWidth + 2) return;
  const b = strip.querySelector(`[data-pv-state="${to}"]`); if (!b) return;
  const r = b.getBoundingClientRect(), R = strip.getBoundingClientRect(), pad = 16;
  const dx = r.left < R.left + pad ? r.left - R.left - pad : r.right > R.right - pad ? r.right - R.right + pad : 0;
  if (dx) strip.scrollBy({ left: dx, behavior: pv.motion() ? 'smooth' : 'auto' });
}
function edges() { if (strip && reel) reel.classList.toggle('at-end', strip.scrollLeft + strip.clientWidth >= strip.scrollWidth - 4); }

pv.view(id, {
  async set(ctx) {
    clean();
    if (ctx.instant || !ctx.motion || d.hidden) return ctx.swap();
    const t0 = performance.now(), late = () => ctx.stale() || performance.now() - t0 > 1000;
    const inP = paneOf(ctx.to), outP = curPane();
    const next = source(inP, 300);                       // starts the incoming frame's download and decode now
    const prev = outP ? await source(outP, 80) : null;
    let cv = null;
    try {
      if (prev) { cv = cover(screenOf(outP)); for (const b of OUT) { mosaic(cv, prev, b); await sleep(STEP); if (late()) return; } }
      const src = await next;
      if (late()) return;
      show(ctx.to); ctx.activate();                       // the cut
      const scr = screenOf(inP);
      if (src && scr) {
        if (cv) place(cv, scr); else cv = cover(scr);
        for (const b of IN) { mosaic(cv, src, b); await sleep(STEP); if (late()) return; }
      } else if (scr) {
        drop(cv); cv = null;
        await ctx.animate(scr, [{ clipPath: 'inset(0 0 100% 0)' }, { clipPath: 'inset(0 0 0 0)' }], { duration: 360, easing: 'steps(9, end)' }).finished.catch(() => {});
      }
    } finally { drop(cv); }
  },
  async enter(ctx) {
    clean();
    if (!ctx.motion || d.hidden) return;
    const pane = curPane(), scr = screenOf(pane);
    const rest = [...root.querySelectorAll('.ev-reel, .ev-route, .ev-pane.is-cur .ev-cap, .pv-info')];
    const fades = rest.map(el => ctx.animate(el, [{ opacity: 0 }, { opacity: 1 }], { duration: 320, easing: 'steps(4, end)' }));
    let cv = null;
    try {
      if (scr) {
        cv = cover(scr);                                  // dark until the frame is ready: no flash of the final image
        const src = await source(pane, 220);
        if (src) { for (const b of IN) { mosaic(cv, src, b); await sleep(70); } }
        else { drop(cv); cv = null; await ctx.animate(scr, [{ clipPath: 'inset(0 0 100% 0)' }, { clipPath: 'inset(0 0 0 0)' }], { duration: 360, easing: 'steps(9, end)' }).finished.catch(() => {}); }
      }
      await Promise.all(fades.map(a => a.finished.catch(() => {})));
    } finally { drop(cv); }
  },
  leave() { clean(); },
});

root.addEventListener('pv:settled', clean);
root.addEventListener('pv:state', e => { if (e.detail) follow(e.detail.state); });
root.addEventListener('pv:enter', () => { follow(root.dataset.pvCurrentState); edges(); });
if (strip) pv.on(strip, 'scroll', edges, { passive: true });
pv.on(window, 'resize', edges, { passive: true });
follow(root.dataset.pvCurrentState);

  } catch (e) { console.error('[pv:echoes]', e); root.classList.add('pv-js-failed'); }
  })();

  /* --- view: livestock --- */
  ;(() => {
  'use strict';
  const id = 'livestock', root = pv && document.getElementById('pv-livestock');
  if (!root) return;
  try {
/* Livestock view: one large app window of real captures with page tabs (pages crossfade; on entry the window opens
   from its title bar and settles flat), then a separate browser demo that rebuilds the app's pages on its bundled
   synthetic farm. The demo's numbers come from LS below: the app's C# formulas and .NET text rules, line for line. */
/* ls-logic:begin (the app's C# formulas and .NET text rules; checked against the reference vectors) */
const LS = (() => {
  const LABEL = 'Interactive demo based on the original .NET MAUI application';
  const MILK_PRICE = 9.4;   // Models/Cow.cs:10
  const WOOL_PRICE = 6.2;   // Models/Sheep.cs:10
  const TAX_RATE = 0.02;    // Models/Animal.cs:18
  const PALETTE = ['#5E35B1', '#1976D2', '#4CAF50', '#FFA726', '#EF5350', '#78909C']; // ViewModels/DashboardViewModel.cs:55-63
  const LINE_TEXT_COLOR = '#6B7280';                                                   // DashboardViewModel.cs:136
  const GREEN = '#008000';  // Microsoft.Maui.Graphics.Colors.Green (AnimalFormPage.xaml.cs:123; XAML TextColor="Green")
  const RED = '#FF0000';    // Microsoft.Maui.Graphics.Colors.Red (AnimalFormPage.xaml.cs:123)
  const QUERY_TYPES = ['All', 'Cow', 'Sheep'];               // Views/AnimalQueryPage.xaml.cs:15
  const QUERY_COLOURS = ['All', 'Black', 'Red', 'White'];    // Views/AnimalQueryPage.xaml.cs:16
  const SORT_KEYS = ['Weight', 'Colour', 'Cost', 'Profit'];  // Views/AnalysisPage.xaml.cs:31
  const SORT_DEFAULT = 'Profit';                             // Views/AnalysisPage.xaml.cs:32 (SelectedIndex = 3)

  // ---------------------------------------------------------------- .NET text helpers
  const f64 = new Float64Array(1);
  const u64 = new BigUint64Array(f64.buffer);
  function decompose(x) { // finite x >= 0  ->  x = m * 2^e exactly
    f64[0] = x;
    const bits = u64[0];
    const exp = Number((bits >> 52n) & 0x7ffn);
    const frac = bits & 0xfffffffffffffn;
    return exp === 0 ? { m: frac, e: -1074 } : { m: frac | (1n << 52n), e: exp - 1075 };
  }
  const isNeg = x => x < 0 || Object.is(x, -0);

  function special(x, culture) {
    if (Number.isNaN(x)) return 'NaN';
    if (x === Infinity) return culture === 'invariant' ? 'Infinity' : '∞';
    if (x === -Infinity) return culture === 'invariant' ? '-Infinity' : '-∞';
    return null;
  }

  /** double.ToString("F<decimals>") in .NET 9 (en-US or invariant). Exact value, ties to even, sign kept. */
  function netFixed(x, decimals = 1, culture = 'en-US') {
    const sp = special(x, culture);
    if (sp !== null) return sp;
    const { m, e } = decompose(Math.abs(x));
    const scale = 10n ** BigInt(decimals);
    let n;
    if (e >= 0) n = (m << BigInt(e)) * scale;
    else {
      const num = m * scale, den = 1n << BigInt(-e);
      const q = num / den, twice = 2n * (num % den);
      n = twice > den ? q + 1n : twice < den ? q : (q % 2n === 0n ? q : q + 1n);
    }
    let s = n.toString();
    if (decimals > 0) {
      s = s.padStart(decimals + 1, '0');
      s = s.slice(0, -decimals) + '.' + s.slice(-decimals);
    }
    return (isNeg(x) ? '-' : '') + s;
  }
  /** "{0:F1}" / $"{x:F1}" with the en-US current culture. */
  const F1 = x => netFixed(x, 1, 'en-US');
  /** "${0:F1}" (XAML StringFormat and the C# interpolations "${x:F1}"). */
  const money = x => '$' + F1(x);

  /** double.ToString() (.NET Core 3.0+ shortest round-trip, "G" layout: E-notation when the decimal
   *  exponent is > max(digits, 17) or < -3; exponent has a sign and at least two digits). */
  function netToString(x, culture = 'en-US') {
    const sp = special(x, culture);
    if (sp !== null) return sp;
    if (x === 0) return Object.is(x, -0) ? '-0' : '0';
    let s = String(Math.abs(x)), e = 0;
    const i = s.indexOf('e');
    if (i >= 0) { e = parseInt(s.slice(i + 1), 10); s = s.slice(0, i); }
    const [ip, fp = ''] = s.split('.');
    let digits = ip + fp, scale = ip.length + e;          // value = 0.digits x 10^scale
    const lead = digits.length - digits.replace(/^0+/, '').length;
    digits = digits.slice(lead).replace(/0+$/, ''); scale -= lead;
    const nd = digits.length;
    let out;
    if (scale > Math.max(nd, 17) || scale < -3) {
      const ex = scale - 1;
      out = digits[0] + (nd > 1 ? '.' + digits.slice(1) : '') + 'E' + (ex < 0 ? '-' : '+') + String(Math.abs(ex)).padStart(2, '0');
    } else if (scale <= 0) out = '0.' + '0'.repeat(-scale) + digits;
    else if (scale >= nd) out = digits + '0'.repeat(scale - nd);
    else out = digits.slice(0, scale) + '.' + digits.slice(scale);
    return (x < 0 ? '-' : '') + out;
  }

  // String.Trim() / char.IsWhiteSpace set in .NET (differs from JS trim on U+0085 and U+FEFF).
  const WS = '\\u0009-\\u000D\\u0020\\u0085\\u00A0\\u1680\\u2000-\\u200A\\u2028\\u2029\\u202F\\u205F\\u3000';
  const TRIM_RE = new RegExp(`^[${WS}]+|[${WS}]+$`, 'g');
  const netTrim = s => (s ?? '').replace(TRIM_RE, '');
  const isNullOrWhiteSpace = s => s == null || netTrim(s) === '';

  // StringComparer.OrdinalIgnoreCase: per-code-point simple upper-casing; U+0131 and U+017F are not folded.
  function upperCp(ch) {
    const cp = ch.codePointAt(0);
    if (cp === 0x131 || cp === 0x17f) return ch;
    const u = ch.toUpperCase();
    return [...u].length === 1 ? u : ch;
  }
  const oicKey = s => [...(s ?? '')].map(upperCp).join('');
  const oicEquals = (a, b) => oicKey(a) === oicKey(b);
  function oicCompare(a, b) { const x = oicKey(a), y = oicKey(b); return x < y ? -1 : x > y ? 1 : 0; }

  // Comparer<double>.Default (double.CompareTo): NaN is smaller than every number, -0 == 0.
  function compareDouble(a, b) {
    if (a < b) return -1;
    if (a > b) return 1;
    if (a === b) return 0;
    return Number.isNaN(a) ? (Number.isNaN(b) ? 0 : -1) : 1;
  }
  const stableSort = (arr, cmp) => arr.map((v, i) => [v, i]).sort((p, q) => cmp(p[0], q[0]) || p[1] - q[1]).map(p => p[0]);

  /** AnimalFormPage.xaml.cs:103-107  TryParseDouble: Trim, ',' -> '.', double.TryParse(Float, Invariant).
   *  Returns { ok, value } with value 0 on failure (as the out parameter). */
  function tryParseDouble(text) {
    const s = netTrim(text).replaceAll(',', '.');
    const m = /^[\t-\r ]*([+-]?)(?:(\d+\.?\d*|\.\d+)([eE][+-]?\d+)?|(infinity)|(nan))[\t-\r ]*\0*$/i.exec(s);
    if (!m) return { ok: false, value: 0 };
    if (m[5]) return { ok: true, value: NaN };
    if (m[4]) return { ok: true, value: m[1] === '-' ? -Infinity : Infinity };
    return { ok: true, value: Number(m[1] + m[2] + (m[3] ?? '')) };
  }

  /** AnalysisPage.xaml.cs:94  int.TryParse(text.Trim(), NumberStyles.Integer, InvariantCulture). */
  function tryParseInt(text) {
    const m = /^[\t-\r ]*([+-]?)(\d+)[\t-\r ]*\0*$/.exec(netTrim(text));
    if (!m) return { ok: false, value: 0 };
    const v = BigInt(m[2]) * (m[1] === '-' ? -1n : 1n);
    if (v < -2147483648n || v > 2147483647n) return { ok: false, value: 0 };
    return { ok: true, value: Number(v) };
  }

  /** Math.Round(x, 0) - MidpointRounding.ToEven (AnimalQueryPage.xaml.cs:75). */
  function roundHalfEven(x) {
    if (!Number.isFinite(x) || Math.abs(x) >= 4503599627370496) return x;
    const f = Math.floor(x), d = x - f;
    const r = d < 0.5 ? f : d > 0.5 ? f + 1 : (f % 2 === 0 ? f : f + 1);
    return r === 0 && isNeg(x) ? -0 : r;
  }

  // LINQ accumulators (System.Linq, .NET 9): Sum starts at +0.0; Average starts at the first element.
  const sum = (xs, sel) => xs.reduce((s, a) => s + sel(a), 0);
  function average(xs, sel) {
    let s = sel(xs[0]);
    for (let i = 1; i < xs.length; i++) s += sel(xs[i]);
    return s / xs.length;
  }

  // ---------------------------------------------------------------- model (Models/*.cs)
  const yieldOf = a => (a.type === 'Cow' ? a.milk : a.wool);                    // Animal.cs:22
  const taxOf = a => TAX_RATE * a.weight;                                        // Animal.cs:18 GetTax
  const incomeOf = a => (a.type === 'Cow' ? a.milk * MILK_PRICE : a.wool * WOOL_PRICE); // Cow.cs:10 / Sheep.cs:10
  const costOf = a => a.expense + taxOf(a);                                      // Animal.cs:19 GetCost
  const profitOf = a => incomeOf(a) - costOf(a);                                 // Animal.cs:20 GetProfit

  // ---------------------------------------------------------------- data store (SQLite tables Cow, Sheep)
  /** Seed state from demo-data.json. Tables keep rowid order, as the app's unordered SELECT returns them. */
  function createStore(data) {
    return {
      Cow: data.cows.map(r => ({ type: 'Cow', id: r.id, expense: r.expense, weight: r.weight, colour: r.colour, milk: r.milk })),
      Sheep: data.sheep.map(r => ({ type: 'Sheep', id: r.id, expense: r.expense, weight: r.weight, colour: r.colour, wool: r.wool })),
      seq: { ...data.sqliteSequence },
    };
  }
  /** Services/AnimalRepository.cs:12-18  cows then sheep. */
  const loadAll = store => [...store.Cow, ...store.Sheep];
  const clone = st => ({ Cow: [...st.Cow], Sheep: [...st.Sheep], seq: { ...st.seq } });
  function make(type, id, f) {
    return type === 'Cow' ? { type, id, expense: f.expense, weight: f.weight, colour: f.colour, milk: f.yieldValue }
      : { type, id, expense: f.expense, weight: f.weight, colour: f.colour, wool: f.yieldValue };
  }
  /** INSERT with "PRIMARY KEY(Id AUTOINCREMENT)": new Id = max(sqlite_sequence, max rowid) + 1. */
  function insertAnimal(store, type, f) {
    const st = clone(store);
    const maxId = st[type].reduce((m, a) => Math.max(m, a.id), 0);
    const id = Math.max(st.seq[type] ?? 0, maxId) + 1;
    st.seq[type] = id;
    st[type].push(make(type, id, f));
    return { store: st, id };
  }
  function updateAnimal(store, type, id, f) {
    const st = clone(store);
    st[type] = st[type].map(a => (a.id === id ? make(type, id, f) : a));
    return st;
  }
  function deleteAnimal(store, type, id) {
    const st = clone(store);
    st[type] = st[type].filter(a => a.id !== id);
    return st;
  }

  // ---------------------------------------------------------------- Records (Views/AnimalPage)
  /** AnimalPage.xaml:127-135 cells: Type, Id, Expense F1, Weight "F1 kg", Colour, Milk/Wool "F1 kg", Profit "$F1" (always green). */
  const recordCells = a => [a.type, String(a.id), F1(a.expense), F1(a.weight) + ' kg', a.colour, F1(yieldOf(a)) + ' kg', money(profitOf(a))];
  const recordRow = a => recordCells(a).join(' | ');
  /** AnimalPage.xaml.cs:50-51 */
  const deletePrompt = a => ({ title: 'Confirm Delete', message: `Delete ${a.type} (ID: ${a.id})?`, accept: 'Yes', cancel: 'Cancel' });

  // ---------------------------------------------------------------- Query (Views/AnimalQueryPage.xaml.cs:42-98)
  function runQuery(all, typeSelIn = 'All', colourSelIn = 'All') {
    if (all.length === 0) {
      return { rows: [], lines: ['No data', 'Number of livestocks: 0', 'Percentage of selected livestock: 0%', 'Daily tax of selected livestocks: $0.0',
        'Profit: $0.0', 'Average weight: 0.0kg', 'Produce amount: 0.0kg'] };
    }
    const typeSel = netTrim(typeSelIn ?? 'All'), colourSel = netTrim(colourSelIn ?? 'All');
    let q = all;
    if (oicEquals(typeSel, 'Cow')) q = q.filter(a => a.type === 'Cow');
    else if (oicEquals(typeSel, 'Sheep')) q = q.filter(a => a.type === 'Sheep');
    if (!oicEquals(colourSel, 'All')) q = q.filter(a => oicEquals(a.colour, colourSel));
    const count = q.length;
    const percent = roundHalfEven(count / all.length * 100.0);                              // :75
    const tax = sum(q, taxOf);                                                              // :76
    const profit = sum(q, profitOf);                                                        // :77
    const avgWeight = count > 0 ? average(q, a => a.weight) : 0.0;                          // :78
    const cows = q.filter(a => a.type === 'Cow'), sheep = q.filter(a => a.type === 'Sheep');
    const produce = oicEquals(typeSel, 'Cow') ? sum(cows, a => a.milk)                      // :80-86
      : oicEquals(typeSel, 'Sheep') ? sum(sheep, a => a.wool)
        : sum(cows, a => a.milk) + sum(sheep, a => a.wool);
    const typeText = oicEquals(typeSel, 'All') ? 'All' : typeSel;
    const colourText = oicEquals(colourSel, 'All') ? 'All' : colourSel;
    return {
      rows: q,
      lines: [
        `Selection: ${typeText} in ${colourText} colour`,
        `Number of livestocks (${typeText} in ${colourText} colour): ${count}`,
        `Percentage of selected livestock: ${netToString(percent)}%`,
        `Daily tax of selected livestocks: ${money(tax)}`,
        `Profit: ${money(profit)}`,
        `Average weight: ${F1(avgWeight)}kg`,
        `Produce amount: ${F1(produce)}kg`,
      ],
    };
  }

  // ---------------------------------------------------------------- Analysis (Views/AnalysisPage.xaml.cs)
  /** :49-59 RenderOverview with CalculationService.GetTotalTax/GetTotalProfit/GetAverageWeight (Services/CalculationService.cs:7-14). */
  function analysisOverview(all) {
    const dailyTax = sum(all, taxOf);
    const monthTax = dailyTax * 30.0;
    const farmDailyProfit = sum(all, profitOf);
    const avgWeight = all.length > 0 ? average(all, a => a.weight) : 0;
    return [
      `30 days govt tax:     ${money(monthTax)}`,
      `Farm daily profit:     ${money(farmDailyProfit)}`,
      `Average weight of all livestocks:  ${F1(avgWeight)} kg`,
    ];
  }
  /** :61-77 RenderPerType */
  function analysisPerType(all) {
    const cows = all.filter(a => a.type === 'Cow'), sheep = all.filter(a => a.type === 'Sheep');
    const c = cows.length ? average(cows, profitOf) : 0.0;
    const s = sheep.length ? average(sheep, profitOf) : 0.0;
    const conclusion = c > s ? 'Therefore, cows are more profitable than sheep.'
      : c < s ? 'Therefore, sheep are more profitable than cows.' : 'Therefore, cows and sheep are equally profitable.';
    return [
      `On average, a single cow makes daily profit:   ${money(c)}`,
      `On average, a single sheep makes daily profit: ${money(s)}`,
      conclusion,
    ];
  }
  /** :86-103 OnForecastClicked with CalculationService.ForecastProfit (CalculationService.cs:16-24). */
  function forecast(all, type, qtyText) {
    if (type !== 'Cow' && type !== 'Sheep') return { alert: { title: 'Invalid input', message: 'Please select livestock type.', cancel: 'OK' } };
    const p = tryParseInt(qtyText);
    if (!p.ok || p.value <= 0) return { alert: { title: 'Invalid input', message: 'Please enter a positive integer quantity.', cancel: 'OK' } };
    const subset = all.filter(a => a.type === type);
    const avgProfit = subset.length ? average(subset, profitOf) : 0;
    const est = avgProfit * p.value;
    return { text: `Buying ${p.value} ${type === 'Cow' ? 'cows' : 'sheep'} would bring in an estimated daily profit: ${money(est)}` };
  }
  /** :105-120 BuildAndBindSorted rows (load order). */
  const analysisRows = all => all.map(a => ({
    type: a.type, id: a.id, expense: a.expense, weight: a.weight, colour: a.colour, yieldValue: yieldOf(a), cost: costOf(a), profit: profitOf(a),
  }));
  /** :130-146 ApplySort: sorts the CURRENT list (stateful), all keys descending, stable. */
  function applySort(currentRows, key = SORT_DEFAULT) {
    const k = netTrim(key ?? 'Profit').toLowerCase();
    const desc = sel => (x, y) => compareDouble(sel(y), sel(x));
    if (k === 'weight') return stableSort(currentRows, desc(r => r.weight));
    if (k === 'colour') return stableSort(currentRows, (x, y) => oicCompare(y.colour, x.colour) || compareDouble(y.profit, x.profit));
    if (k === 'cost') return stableSort(currentRows, desc(r => r.cost));
    return stableSort(currentRows, desc(r => r.profit));
  }
  /** AnalysisPage.xaml:174-182 cells. */
  const sortedCells = r => [r.type, String(r.id), F1(r.expense), F1(r.weight) + ' kg', r.colour, F1(r.yieldValue) + ' kg', money(r.cost), money(r.profit)];
  const sortedRow = r => sortedCells(r).join(' | ');

  // ---------------------------------------------------------------- Dashboard (ViewModels/DashboardViewModel.cs:53-163)
  function dashboardCharts(all) {
    const P = PALETTE;
    if (all.length === 0) {
      return {
        cowSheepBar: [{ label: 'No Data', valueLabel: '0', value: 0, color: P[5] }],
        colourPie: [{ label: 'No Data', valueLabel: '0', value: 0, color: P[5] }],
        profitLine: [{ label: '0', valueLabel: '$0.0', value: 0, color: P[5] }],
        costBar: [{ label: 'No Data', valueLabel: '$0.0', value: 0, color: P[5] }],
      };
    }
    const cowCount = all.filter(a => a.type === 'Cow').length, sheepCount = all.filter(a => a.type === 'Sheep').length;
    const cowSheepBar = [
      { label: 'Cow', valueLabel: String(cowCount), value: cowCount, color: P[0] },
      { label: 'Sheep', valueLabel: String(sheepCount), value: sheepCount, color: P[1] },
    ];
    const groups = [];                                                     // :105-108 GroupBy(Trim, OrdinalIgnoreCase)
    for (const a of all) {
      const key = netTrim(a.colour ?? '');
      const g = groups.find(x => oicEquals(x.key, key));
      if (g) g.count++; else groups.push({ key, count: 1 });
    }
    const byColour = stableSort(groups, (x, y) => y.count - x.count);
    const colourPie = byColour.map((g, i) => ({ label: isNullOrWhiteSpace(g.key) ? 'Unknown' : g.key, valueLabel: String(g.count), value: g.count, color: P[i % P.length] }));
    const profitSeq = stableSort(all, (x, y) => x.id - y.id);              // :124
    const profitLine = profitSeq.map((a, i) => ({ label: `${a.type} #${a.id}`, valueLabel: money(profitOf(a)), value: Math.fround(profitOf(a)), color: P[i % P.length], textColor: LINE_TEXT_COLOR }));
    const byCost = stableSort(all, (x, y) => compareDouble(costOf(y), costOf(x)));  // :148
    const costBar = byCost.map((a, i) => ({ label: `${a.type} #${a.id}`, valueLabel: money(costOf(a)), value: Math.fround(costOf(a)), color: P[i % P.length] }));
    return { cowSheepBar, colourPie, profitLine, costBar };
  }

  // ---------------------------------------------------------------- Add / Edit form (Views/AnimalFormPage.xaml.cs)
  /** :95-99 and :109-124 UpdateYieldLabel + UpdatePreview. Unparseable text counts as 0. */
  function formPreview({ type = 'Cow', expense, weight, yieldText }) {
    const e = tryParseDouble(expense).value, w = tryParseDouble(weight).value, y = tryParseDouble(yieldText).value;
    const income = type === 'Cow' ? y * MILK_PRICE : y * WOOL_PRICE;
    const tax = TAX_RATE * w;
    const profit = income - (e + tax);
    return { yieldLabel: type === 'Cow' ? 'Milk (kg/day)' : 'Wool (kg/day)', income: money(income), profit: money(profit), profitColor: profit >= 0 ? GREEN : RED };
  }
  /** :31-35 new form; :64-87 LoadFromExisting (InvariantCulture ToString of the stored doubles). */
  const newForm = () => ({ title: 'Add Animal', id: null, type: 'Cow', expense: '', weight: '', colour: '', yieldText: '' });
  const editForm = a => ({
    title: 'Edit Animal', id: String(a.id), type: a.type, expense: netToString(a.expense, 'invariant'), weight: netToString(a.weight, 'invariant'),
    colour: a.colour, yieldText: netToString(yieldOf(a), 'invariant'), editing: { type: a.type, id: a.id },
  });
  /** :126-178 OnSaveClicked. Only check: three numbers parse and Colour is not blank. Colour is trimmed. */
  function saveForm(store, form) {
    const ex = tryParseDouble(form.expense), we = tryParseDouble(form.weight), ye = tryParseDouble(form.yieldText);
    if (!ex.ok || !we.ok || isNullOrWhiteSpace(form.colour) || !ye.ok) {
      return { store, saved: false, alert: { title: 'Invalid Input', message: 'Please fill all fields with valid numbers.', cancel: 'OK' } };
    }
    const f = { expense: ex.value, weight: we.value, colour: netTrim(form.colour), yieldValue: ye.value };
    const type = form.type === 'Sheep' ? 'Sheep' : 'Cow';
    if (!form.editing) {
      const r = insertAnimal(store, type, f);
      return { store: r.store, saved: true, id: r.id, alert: { title: 'Saved', message: 'New animal has been added.', cancel: 'OK' } };
    }
    if (form.editing.type === type) {
      return { store: updateAnimal(store, type, form.editing.id, f), saved: true, id: form.editing.id, alert: { title: 'Saved', message: 'Changes have been saved.', cancel: 'OK' } };
    }
    const r = insertAnimal(deleteAnimal(store, form.editing.type, form.editing.id), type, f);   // type changed: delete + insert (new Id)
    return { store: r.store, saved: true, id: r.id, alert: { title: 'Saved', message: 'Changes have been saved.', cancel: 'OK' } };
  }

  // the app's bundled seed database (Resources/Raw/FarmData.db): 5 cows, 6 sheep, AUTOINCREMENT counters
  const SEED = {"sqliteSequence":{"Cow":5,"Sheep":50006},"cows":[{"id":1,"expense":46,"weight":400,"colour":"Red","milk":23.6},{"id":2,"expense":40.5,"weight":450.5,"colour":"Black","milk":27.1},{"id":3,"expense":43,"weight":430,"colour":"Black","milk":21.9},{"id":4,"expense":39,"weight":330.5,"colour":"Red","milk":16.4},{"id":5,"expense":30.5,"weight":310,"colour":"Red","milk":15.8}],"sheep":[{"id":50001,"expense":6.5,"weight":22.5,"colour":"White","wool":9.5},{"id":50002,"expense":6.5,"weight":28.5,"colour":"White","wool":9.2},{"id":50003,"expense":6.5,"weight":33.2,"colour":"White","wool":8.9},{"id":50004,"expense":5.5,"weight":23.5,"colour":"White","wool":8.2},{"id":50005,"expense":6.4,"weight":25.5,"colour":"Black","wool":9.3},{"id":50006,"expense":5.4,"weight":24.2,"colour":"White","wool":8.8}]};
  return Object.freeze({ LABEL, MILK_PRICE, WOOL_PRICE, TAX_RATE, PALETTE, LINE_TEXT_COLOR, GREEN, RED, QUERY_TYPES, QUERY_COLOURS, SORT_KEYS, SORT_DEFAULT, netFixed, F1, money, netToString, netTrim, isNullOrWhiteSpace, oicEquals, oicCompare, compareDouble, tryParseDouble, tryParseInt, roundHalfEven, sum, average, yieldOf, taxOf, incomeOf, costOf, profitOf, createStore, loadAll, insertAnimal, updateAnimal, deleteAnimal, recordCells, recordRow, deletePrompt, runQuery, analysisOverview, analysisPerType, forecast, analysisRows, applySort, sortedCells, sortedRow, dashboardCharts, formPreview, newForm, editForm, saveForm, SEED });
})();
/* ls-logic:end */

/* ---------------------------------------------------------------- the window: page tabs over real captures */
const stage = root.querySelector('.ls-stage'), bar = root.querySelector('.ls-bar');
const paneOf = s => stage && stage.querySelector(`.pv-pane[data-pv-for~="${s}"]`);
// wait (briefly) until a page's capture can be painted, so the crossfade never fades in an empty frame
function ready(pane, ms) {
  const img = pane && pane.querySelector('img');
  if (!img || (img.complete && img.naturalWidth)) return Promise.resolve();
  if (img.loading === 'lazy') img.loading = 'eager';
  const p = img.decode ? img.decode().catch(() => {}) : new Promise(r => { img.addEventListener('load', r, { once: true }); img.addEventListener('error', r, { once: true }); });
  return Promise.race([p, new Promise(r => setTimeout(r, ms))]);
}
const ended = a => a.finished.then(() => {}, () => {});

pv.view(id, {
  // a page switch: the new capture crossfades over the old one (200 ms); the window itself never moves or resizes
  async set(ctx) {
    if (ctx.instant || !stage) return ctx.swap();
    const out = stage.querySelector('.pv-pane.is-cur'), inn = paneOf(ctx.to);
    if (!inn || inn === out) return ctx.swap();
    try {
      inn.classList.add('is-cur', 'ls-xin');
      ctx.activate();
      await ready(inn, 400);
      if (ctx.stale()) return;
      const cap = out && out.querySelector('.pv-cap');
      if (cap) ctx.animate(cap, [{ opacity: 1 }, { opacity: 0 }], { duration: 110, easing: 'linear', fill: 'forwards' });
      await ended(ctx.animate(inn.querySelector('.pv-fig') || inn, [{ opacity: 0 }, { opacity: 1 }], { duration: 200, easing: 'linear' }));
      if (ctx.stale()) return;
      if (out) out.classList.remove('is-cur');
    } finally { inn.classList.remove('ls-xin'); }
  },
  // the project signature: the window opens downward from its title bar (the tab strip), then settles flat
  async enter(ctx) {
    const cur = stage && stage.querySelector('.pv-pane.is-cur');
    const media = cur && cur.querySelector('.pv-media'), cap = cur && cur.querySelector('.pv-cap'), demo = root.querySelector('.ls-demo');
    const runs = [];
    if (bar) runs.push(ctx.animate(bar, [{ opacity: 0, transform: 'translateY(-10px)' }, { opacity: 1, transform: 'none' }], { duration: 240 }));
    if (media) runs.push(ctx.animate(media, [
      { clipPath: 'inset(0 0 100% 0 round 0 0 14px 14px)', transform: 'perspective(1800px) rotateX(-7deg)', transformOrigin: '50% 0' },
      { clipPath: 'inset(0 0 0 0 round 0 0 14px 14px)', transform: 'none', transformOrigin: '50% 0' }], { duration: 470, delay: 80, fill: 'backwards' }));
    if (cap) runs.push(ctx.animate(cap, [{ opacity: 0 }, { opacity: 1 }], { duration: 220, delay: 330, fill: 'backwards', easing: 'linear' }));
    if (demo) runs.push(ctx.animate(demo, [{ opacity: 0 }, { opacity: 1 }], { duration: 220, delay: 380, fill: 'backwards', easing: 'linear' }));
    await Promise.all(runs.map(ended));
  },
});

/* ---------------------------------------------------------------- the browser demo (a reconstruction, not the app) */
const D = root.querySelector('.ls-demo');
if (D) demo(D);

function demo(D) {
  const $ = s => D.querySelector(s);
  const body = $('.ls-d-body'), main = $('.ls-d-main'), live = $('.ls-d-live'), dlg = $('.ls-dlg'), toggle = $('.ls-d-toggle');
  const tabs = [...D.querySelectorAll('.ls-d-tab')];
  if (!body || !main) return;
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const opts = (list, cur) => list.map(x => `<option${x === cur ? ' selected' : ''}>${esc(x)}</option>`).join('');
  const say = t => { if (live) { live.textContent = ''; setTimeout(() => { live.textContent = t; }, 30); } };
  const COLS = ['Animal', 'Id', 'Expense', 'Weight', 'Colour', 'Milk/Wool', 'Profit'];

  // state: in memory only; Reset (or a reload) brings back the bundled sample farm
  let store, page, selKey, form, q, an;
  function fresh() {
    store = LS.createStore(LS.SEED); selKey = null; form = null; q = null;
    an = { sortKey: LS.SORT_DEFAULT, rows: null, fcType: 'Cow', fcQty: '', fcText: '' };
  }
  const all = () => LS.loadAll(store);
  const find = k => all().find(a => `${a.type}:${a.id}` === k);

  const table = (cols, rows, label, cls = '') => `<div class="ls-scroll" data-label="${esc(label)}"><table class="ls-t${cls}"><thead><tr>${cols.map(c => `<th scope="col">${esc(c)}</th>`).join('')}</tr></thead><tbody>${rows || `<tr><td class="ls-empty" colspan="${cols.length}">No records</td></tr>`}</tbody></table></div><p class="ls-swipe" aria-hidden="true">Scroll the table sideways to see every column.</p>`;
  const cells = (a, extra = '') => LS.recordCells(a).map((v, i) => `<td${i === 6 ? ' class="ls-g"' : ''}>${esc(v)}</td>`).join('') + extra;
  const btn = (act, label, dis) => `<button type="button" class="ls-act" data-act="${act}"${dis ? ' disabled' : ''}>${esc(label)}</button>`;
  const field = (k, label, ph, num, val) => `<label class="ls-l" for="ls-f-${k}">${esc(label)}</label><input class="ls-in" id="ls-f-${k}" data-f="${k}" type="text"${num ? ' inputmode="decimal"' : ''} autocomplete="off" spellcheck="false" placeholder="${esc(ph)}" value="${esc(val)}">`;

  /* pages. "Appearing" mirrors the app: Animals clears the selection; Query and the form are new pages each time;
     Analysis rebuilds its list in load order and re-applies the chosen sort, and clears the forecast text. */
  const pages = {
    dashboard() {
      const ch = LS.dashboardCharts(all());
      const card = (t, list) => `<section class="ls-card"><h4 class="ls-h5">${esc(t)}</h4><table class="ls-t ls-t--kv"><thead class="sr-only"><tr><th scope="col">Label</th><th scope="col">Value</th></tr></thead><tbody>${list.map(e => `<tr><th scope="row"><span class="ls-sw" style="background:${e.color}" aria-hidden="true"></span>${esc(e.label)}</th><td>${esc(e.valueLabel)}</td></tr>`).join('')}</tbody></table></section>`;
      return `<h3 class="ls-h" tabindex="-1">Dashboard</h3><p class="ls-note ls-note--top">The app draws these four charts with Microcharts; the demo lists the same values, recomputed from the demo's records. The drawn charts are in the real window above.</p>
        <div class="ls-cards">${card('Livestock Count (Cow vs Sheep, count)', ch.cowSheepBar)}${card('Distribution by Colour (count)', ch.colourPie)}${card('Profit Trend (by Id, $/day)', ch.profitLine)}${card('Top Cost per Animal (Expense + Tax, $/day)', ch.costBar)}</div>`;
    },
    animals() {
      const rows = all().map(a => {
        const k = `${a.type}:${a.id}`, on = k === selKey;
        return `<tr data-k="${k}"${on ? ' class="is-sel"' : ''}><td><label class="ls-pick"><input type="radio" name="ls-pick" value="${k}"${on ? ' checked' : ''} aria-label="Select ${a.type} ${a.id}"><span>${esc(a.type)}</span></label></td>${cells(a).replace(/^<td>[^<]*<\/td>/, '')}</tr>`;
      }).join('');
      return `<h3 class="ls-h" tabindex="-1">Animals</h3>${table(COLS, rows, 'Animals table', ' ls-t--pick')}
        <div class="ls-btns">${btn('add', 'Add')}${btn('del', 'Delete', !selKey)}${btn('upd', 'Update', !selKey)}${btn('query', 'Query')}</div>
        <p class="ls-note">Select a row to enable Update and Delete, as in the app.</p>`;
    },
    form() {
      const f = form, p = LS.formPreview(f);
      return `<h3 class="ls-h" tabindex="-1">${esc(f.title)}</h3><div class="ls-form">
        ${f.id ? `<span class="ls-l">Id</span><span class="ls-v">${esc(f.id)}</span>` : ''}
        <label class="ls-l" for="ls-f-type">Type</label><select class="ls-in" id="ls-f-type" data-f="type">${opts(['Cow', 'Sheep'], f.type)}</select>
        ${field('expense', 'Expense', 'e.g. 40.5', true, f.expense)}${field('weight', 'Weight (kg)', 'e.g. 450.5', true, f.weight)}${field('colour', 'Colour', 'e.g. Red', false, f.colour)}${field('yieldText', p.yieldLabel, 'e.g. 46', true, f.yieldText)}
        <div class="ls-prev" role="status"><span class="ls-l">Income</span><b data-o="income">${esc(p.income)}</b><span class="ls-l">Profit</span><b data-o="profit" class="${p.profitColor === LS.GREEN ? 'ls-g' : 'ls-r'}">${esc(p.profit)}</b></div>
        <div class="ls-btns">${btn('save', 'Save')}${btn('freset', 'Reset')}${btn('cancel', 'Cancel')}</div></div>
        <p class="ls-note">Income and profit update on every keystroke in Expense, Weight and ${f.type === 'Cow' ? 'Milk' : 'Wool'}, as in the app; Save checks only that the three numbers parse and Colour is not blank.</p>`;
    },
    query() {
      const r = q.res;
      return `<h3 class="ls-h" tabindex="-1">Query Animals</h3><div class="ls-form">
        <label class="ls-l" for="ls-q-type">Type</label><select class="ls-in" id="ls-q-type" data-q="type">${opts(LS.QUERY_TYPES, q.type)}</select>
        <label class="ls-l" for="ls-q-colour">Colour</label><select class="ls-in" id="ls-q-colour" data-q="colour">${opts(LS.QUERY_COLOURS, q.colour)}</select>
        <div class="ls-btns">${btn('run', 'Run Query')}${btn('qreset', 'Reset')}${btn('close', 'Close')}</div></div>
        <p class="ls-note">As in the app, the list changes only when you press Run Query or Reset.</p>
        <h4 class="ls-h5">Matched Records</h4><div class="ls-qres">${table(COLS, r.rows.map(a => `<tr>${cells(a)}</tr>`).join(''), 'Matched records')}
        <div class="ls-sum" role="status">${r.lines.map((l, i) => `<p${i ? '' : ' class="ls-sum-h"'}>${esc(l)}</p>`).join('')}</div></div>`;
    },
    analysis() {
      const a = all(), ov = LS.analysisOverview(a), pt = LS.analysisPerType(a);
      const rows = an.rows.map(r => `<tr>${LS.sortedCells(r).map((v, i) => `<td${i === 7 ? ' class="ls-gb"' : ''}>${esc(v)}</td>`).join('')}</tr>`).join('');
      return `<h3 class="ls-h" tabindex="-1">Livestock Statistics</h3>
        <pre class="ls-pre">${ov.map(esc).join('\n')}</pre>
        <div class="ls-pre"><span class="ls-pre-h">Based on current livestock data:</span>${pt.map(esc).join('\n')}</div>
        <h4 class="ls-h5">Profit Forecast for Future Investment</h4><div class="ls-form">
        <label class="ls-l" for="ls-a-type">Livestock type</label><select class="ls-in" id="ls-a-type" data-a="fcType">${opts(['Cow', 'Sheep'], an.fcType)}</select>
        <label class="ls-l" for="ls-a-qty">Quantity</label><input class="ls-in" id="ls-a-qty" data-a="fcQty" type="text" inputmode="numeric" autocomplete="off" placeholder="e.g. 12" value="${esc(an.fcQty)}">
        <div class="ls-btns">${btn('calc', 'Calculate')}${btn('fcreset', 'Reset')}</div>
        <p class="ls-out" role="status">${esc(an.fcText)}</p></div>
        <h4 class="ls-h5">Sorting</h4><div class="ls-form">
        <label class="ls-l" for="ls-a-sort">Sort by (desc)</label><select class="ls-in" id="ls-a-sort" data-a="sortKey">${opts(LS.SORT_KEYS, an.sortKey)}</select>
        <div class="ls-btns">${btn('sort', 'Apply')}${btn('sreset', 'Reset')}</div></div>
        <div class="ls-sorted">${table([...COLS.slice(0, 6), 'Cost', 'Profit'], rows, 'Sorted animals')}</div>`;
    },
  };
  const appear = {
    animals() { selKey = null; },
    query() { q = { type: 'All', colour: 'All', res: LS.runQuery(all(), 'All', 'All') }; },
    analysis() { an.rows = LS.applySort(LS.analysisRows(all()), an.sortKey); an.fcText = ''; },
  };
  const tabOf = p => (p === 'form' || p === 'query' ? 'animals' : p);

  // horizontally scrolling tables (phones) become focusable regions, so keyboards can scroll them too
  function scrollers() {
    D.querySelectorAll('.ls-scroll').forEach(s => {
      const over = s.scrollWidth > s.clientWidth + 1;
      s.classList.toggle('is-over', over);
      if (over) { s.tabIndex = 0; s.setAttribute('role', 'region'); s.setAttribute('aria-label', s.dataset.label + ' (scrolls sideways)'); }
      else { s.removeAttribute('tabindex'); s.removeAttribute('role'); s.removeAttribute('aria-label'); }
    });
  }
  function render(focus) {
    body.innerHTML = pages[page]();
    const t = tabOf(page);
    tabs.forEach(b => { const on = b.dataset.page === t; b.setAttribute('aria-selected', String(on)); b.tabIndex = on ? 0 : -1; });
    body.setAttribute('aria-labelledby', 'ls-d-t-' + t);
    scrollers();
    if (focus) { const el = typeof focus === 'string' ? body.querySelector(focus) : body.querySelector('.ls-h'); if (el) el.focus({ preventScroll: !el.matches('.ls-h') }); }
  }
  function go(p, focus = true) { page = p; if (appear[p]) appear[p](); render(focus); }

  // the app's DisplayAlert, as a modal dialog: resolves with the chosen button text (Escape = the last button)
  function alertBox(title, msg, buttons) {
    return new Promise(res => {
      const back = document.activeElement;
      if (!dlg || !dlg.showModal) { res(buttons.length > 1 ? (confirm(`${title}\n\n${msg}`) ? buttons[0] : buttons[1]) : (alert(`${title}\n\n${msg}`), buttons[0])); return; } // eslint-disable-line no-alert
      $('.ls-dlg-t').textContent = title; $('.ls-dlg-m').textContent = msg;
      const row = $('.ls-dlg-b');
      row.innerHTML = buttons.map(b => `<button type="button" class="ls-act" value="${esc(b)}">${esc(b)}</button>`).join('');
      let val = buttons[buttons.length - 1];
      row.onclick = e => { const b = e.target.closest('button'); if (b) { val = b.value; dlg.close(); } };
      dlg.addEventListener('close', () => { res(val); if (back && back.isConnected) back.focus(); }, { once: true });
      dlg.showModal();
      row.lastElementChild.focus();
    });
  }

  function preview() {
    const p = LS.formPreview(form);
    const inc = body.querySelector('[data-o="income"]'), pro = body.querySelector('[data-o="profit"]'), yl = body.querySelector('label[for="ls-f-yieldText"]');
    if (inc) inc.textContent = p.income;
    if (pro) { pro.textContent = p.profit; pro.className = p.profitColor === LS.GREEN ? 'ls-g' : 'ls-r'; }
    if (yl) yl.textContent = p.yieldLabel;
  }
  function select(k) {
    selKey = k;
    body.querySelectorAll('tr[data-k]').forEach(tr => tr.classList.toggle('is-sel', tr.dataset.k === k));
    body.querySelectorAll('[data-act="del"], [data-act="upd"]').forEach(b => { b.disabled = !k; });
  }

  const acts = {
    add() { form = LS.newForm(); go('form'); },
    query() { go('query'); },
    upd() { const a = find(selKey); if (a) { form = LS.editForm(a); go('form'); } },
    async del() {
      const a = find(selKey); if (!a) return;
      const p = LS.deletePrompt(a);
      if (await alertBox(p.title, p.message, [p.accept, p.cancel]) !== p.accept) return;
      store = LS.deleteAnimal(store, a.type, a.id);
      go('animals');
      say(`${a.type} ${a.id} deleted. ${all().length} animals left.`);
    },
    async save() {
      const r = LS.saveForm(store, form);
      await alertBox(r.alert.title, r.alert.message, [r.alert.cancel]);
      if (!r.saved) { const b = body.querySelector('[data-act="save"]'); if (b) b.focus(); return; }
      const t = form.type === 'Sheep' ? 'Sheep' : 'Cow';
      store = r.store; form = null;
      go('animals');
      say(`Saved as ${t} ${r.id}. ${all().length} animals.`);
    },
    freset() { const a = form.editing && all().find(x => x.type === form.editing.type && x.id === form.editing.id); form = a ? LS.editForm(a) : LS.newForm(); render('[data-act="freset"]'); },
    cancel() { form = null; go('animals'); },
    run() { q.res = LS.runQuery(all(), q.type, q.colour); render('[data-act="run"]'); say(q.res.lines[1]); },
    qreset() { q.type = 'All'; q.colour = 'All'; q.res = LS.runQuery(all(), 'All', 'All'); render('[data-act="qreset"]'); say(q.res.lines[1]); },
    close() { go('animals'); },
    async calc() {
      const r = LS.forecast(all(), an.fcType, an.fcQty);
      if (r.alert) { await alertBox(r.alert.title, r.alert.message, [r.alert.cancel]); return; }
      an.fcText = r.text; const o = body.querySelector('.ls-out'); if (o) o.textContent = r.text;
    },
    fcreset() { an.fcType = 'Cow'; an.fcQty = ''; an.fcText = ''; render('[data-act="fcreset"]'); },
    sort() { an.rows = LS.applySort(an.rows, an.sortKey); render('[data-act="sort"]'); say(`Sorted by ${an.sortKey}, highest first.`); },
    sreset() { an.sortKey = LS.SORT_DEFAULT; an.rows = LS.applySort(an.rows, an.sortKey); render('[data-act="sreset"]'); say('Sorted by Profit, highest first.'); },
  };

  pv.on(body, 'click', e => {
    const b = e.target.closest('[data-act]');
    if (b) { if (!b.disabled && acts[b.dataset.act]) acts[b.dataset.act](); return; }
    const tr = e.target.closest('tr[data-k]');
    if (tr && !e.target.closest('input')) { const r = tr.querySelector('input[type=radio]'); if (r) { r.checked = true; select(tr.dataset.k); } }
  });
  pv.on(body, 'change', e => {
    const t = e.target;
    if (t.name === 'ls-pick') select(t.value);
    else if (t.dataset.f === 'type') { form.type = t.value; preview(); const n = body.querySelector('.ls-note'); if (n) n.textContent = n.textContent.replace(/(Weight and )(Milk|Wool)/, `$1${t.value === 'Cow' ? 'Milk' : 'Wool'}`); }
    else if (t.dataset.q) q[t.dataset.q] = t.value;
    else if (t.dataset.a) an[t.dataset.a] = t.value;
  });
  pv.on(body, 'input', e => {
    const t = e.target;
    if (t.dataset.f && form) { form[t.dataset.f] = t.value; if (t.dataset.f !== 'colour') preview(); }
    else if (t.dataset.a === 'fcQty') an.fcQty = t.value;
  });
  tabs.forEach((b, i) => {
    pv.on(b, 'click', () => { if (b.getAttribute('aria-selected') !== 'true' || page !== b.dataset.page) go(b.dataset.page); });
    pv.on(b, 'keydown', e => {
      const j = { ArrowRight: (i + 1) % tabs.length, ArrowLeft: (i + tabs.length - 1) % tabs.length, Home: 0, End: tabs.length - 1 }[e.key];
      if (j === undefined) return;
      e.preventDefault(); tabs[j].focus(); go(tabs[j].dataset.page, false);
    });
  });
  pv.on($('.ls-d-reset'), 'click', () => { fresh(); go('animals', false); say('Sample data reset: 5 cows and 6 sheep.'); });
  pv.on(toggle, 'click', () => setOpen(main.hidden));
  // "Try the browser demo" in the window's title bar: opens the panel and brings its heading into view
  pv.on(root.querySelector('.ls-try'), 'click', () => {
    setOpen(true);
    const h = $('.ls-demo-h');
    if (h) { h.tabIndex = -1; D.scrollIntoView({ behavior: pv.motion() ? 'smooth' : 'auto', block: 'start' }); h.focus({ preventScroll: true }); }
  });
  function setOpen(open) {
    main.hidden = !open;
    if (toggle) { toggle.setAttribute('aria-expanded', String(open)); toggle.textContent = open ? toggle.dataset.hide : toggle.dataset.open; }
    if (open) scrollers();
  }
  let rz = 0;
  pv.on(window, 'resize', () => { cancelAnimationFrame(rz); rz = requestAnimationFrame(scrollers); });

  fresh();
  page = D.dataset.start || 'animals';
  if (appear[page]) appear[page]();
  render(false);
  setOpen(matchMedia('(min-width: 1180px)').matches);
}

  } catch (e) { console.error('[pv:livestock]', e); root.classList.add('pv-js-failed'); }
  })();

  /* --- homepage shell --- */
  ;(() => {
  try {
  /* homepage shell: the sticky project bar (ARIA tabs with a roving tabindex, arrows, Home/End, Previous/Next), deep
     links (#cfit, #awhina, #awai, #echoes, #livestock), history.state, the remembered project (sessionStorage mc-atlas),
     project switching with the view lifecycle (pv:leave, pv:enter, pv:settled) and the small test API window.PV.
     assemble.mjs wraps this body in a try/catch and runs it after the shared runtime (pv) and the four views. */
  const tablist = document.querySelector('.ax-tabs');
  if (!tablist || !pv) return;
  const d = document, root = d.documentElement;
  const $ = (s, c = d) => c.querySelector(s), $$ = (s, c = d) => [...c.querySelectorAll(s)];
  const IDS = ['cfit', 'awhina', 'echoes', 'livestock'];
  const norm = h => { h = String(h || '').replace(/^#/, '').toLowerCase(); h = h === 'awai' ? 'awhina' : h; return IDS.includes(h) ? h : null; };
  const tabs = $$('.ax-tab', tablist), ind = $('.ind'), atlas = $('#work'), hdr = $('.site-header');
  const W = {};
  IDS.forEach((id, k) => { const el = d.getElementById(id); W[id] = { id, k, el, sec: el && $('section.pv', el), tab: tabs.find(t => t.dataset.w === id) }; });
  if (IDS.some(id => !W[id].el || !W[id].sec || !W[id].tab)) return;
  let cur = norm(root.dataset.w) || 'cfit';
  const remember = id => { try { sessionStorage.setItem('mc-atlas', id); } catch (e) { /* storage off */ } };

  tablist.setAttribute('role', 'tablist');
  IDS.forEach(id => { const w = W[id]; w.tab.setAttribute('role', 'tab'); w.tab.setAttribute('aria-controls', id); w.el.setAttribute('role', 'tabpanel'); w.el.setAttribute('aria-labelledby', 't-' + id); });
  function progress() {
    const list = pv.states(cur), i = Math.max(0, list.indexOf(pv.state(cur)));
    if (ind) ind.style.setProperty('--prog', list.length ? ((i + 1) / list.length).toFixed(3) : '1');
  }
  function updateTabs() {
    tabs.forEach(t => {
      const on = t.dataset.w === cur;
      t.setAttribute('aria-selected', String(on)); t.tabIndex = on ? 0 : -1;
      if (on && ind) { ind.style.setProperty('--il', t.offsetLeft + 'px'); ind.style.setProperty('--iw', t.offsetWidth + 'px'); }
    });
    progress();
  }
  tabs.forEach(t => pv.on(t, 'click', e => { e.preventDefault(); select(t.dataset.w, { push: true }); }));
  pv.on(tablist, 'keydown', e => {
    const i = tabs.indexOf(d.activeElement), L = tabs.length;
    if (i < 0) return;
    const j = { ArrowRight: (i + 1) % L, ArrowLeft: (i + L - 1) % L, Home: 0, End: L - 1, ' ': i }[e.key];
    if (j === undefined) return;
    e.preventDefault(); tabs[j].focus(); select(tabs[j].dataset.w, { push: true });
  });
  const shift = dir => select(IDS[(W[cur].k + dir + IDS.length) % IDS.length], { push: true });
  $$('.bar-ctl .round').forEach(b => pv.on(b, 'click', () => shift(+b.dataset.d)));
  $$('[data-go]').forEach(a => pv.on(a, 'click', e => { e.preventDefault(); select(a.dataset.go, { push: true, focusTab: true }); }));
  pv.on(d, 'pv:state', e => { if (e.detail && e.detail.project === cur) progress(); });

  /* switching: the outgoing view fades out (<= 200 ms), then the incoming one enters with its own signature (the view's
     enter hook, 300-650 ms) or the shared default; depth exists only during the transition and every view settles flat.
     With reduced motion the change is instant apart from a 100 ms fade. A new switch finishes the running one first. */
  const stickY = () => Math.round(atlas.getBoundingClientRect().top + scrollY - hdr.offsetHeight);
  let run = null;
  function finishRun() {
    if (!run) return;
    const r = run; run = null;
    r.stale = true;
    $$('.ax-world.is-out, .ax-world.is-pending').forEach(w => w.classList.remove('is-out', 'is-pending'));
    r.from.el.inert = false;
    if (!r.entered) { r.entered = true; pv.enter(r.to.id, { from: r.from.id, instant: true }); }
    r.finish();
  }
  function select(id, o = {}) {
    id = norm(id);
    if (!id) return Promise.reject(new Error('unknown project'));
    if (o.state && !pv.states(id).includes(o.state)) return Promise.reject(new Error('unknown state ' + o.state + ' for ' + id));
    if (id === cur) {
      if (o.focusTab) W[cur].tab.focus({ preventScroll: true });
      return (run ? run.done : Promise.resolve()).then(() => (o.state ? pv.go(id, o.state) : pv.settled(W[id].sec)));
    }
    finishRun();
    const from = W[cur], to = W[id], anim = o.anim !== false && pv.motion();
    pv.hold(from.sec); pv.hold(to.sec);
    pv.reset(id, o.state);                       // the view starts from its default (or the requested) state
    if (anim) { from.el.classList.add('is-out'); from.el.inert = true; to.el.classList.add('is-pending'); }
    cur = id; root.dataset.w = id; remember(id);
    updateTabs();
    pv.leave(from.id, { to: id });
    const y = stickY();
    if (scrollY > y + 2) scrollTo({ top: y, behavior: 'instant' });
    if (o.push) history.pushState({ w: id }, '', '#' + id);
    if (o.focusTab) to.tab.focus({ preventScroll: true });
    let finish;
    const r = run = { from, to, stale: false, entered: false, done: new Promise(res => { finish = res; }) };
    r.finish = () => { finish(); };
    r.done = r.done.then(() => { pv.release(from.sec); pv.release(to.sec); });
    if (!anim) {   // reduced motion: swap at once, then a 100 ms fade-in (none at all when the caller asked for anim: false)
      r.entered = true; run = null;
      pv.enter(id, { from: from.id, instant: true });
      const fade = o.anim === false ? null : pv.animate(to.sec, [{ opacity: 0 }, { opacity: 1 }], { duration: 100, easing: 'linear' });
      (fade ? fade.finished.catch(() => {}) : Promise.resolve()).then(r.finish);
      return r.done.then(() => pv.settled(to.sec));
    }
    pv.animate(from.sec, [{ opacity: 1 }, { opacity: 0 }], { duration: 160, easing: 'linear' }).finished.catch(() => {}).then(() => {
      if (r.stale) return;
      from.el.classList.remove('is-out'); from.el.inert = false; to.el.classList.remove('is-pending');
      r.entered = true;
      return pv.enter(id, { from: from.id, instant: false });
    }).then(() => { if (run === r) run = null; r.finish(); }, () => { if (run === r) run = null; r.finish(); });
    return r.done.then(() => pv.settled(to.sec));
  }

  /* focus not obscured (WCAG 2.2, 2.4.11): keyboard focus is never left under the fixed header or the stuck project bar.
     Chrome does not scroll an element that is already inside the viewport, so scroll-padding alone cannot do this. On
     keyboard focus (:focus-visible) an element under the sticky stack, or below the fold, is scrolled clear at once,
     before the browser's own focus scroll (which then has nothing left to do). Fixed parts are left alone, and a scroll
     that does not move the element (a stuck sticky part) is undone. Inside the bar's container the bar counts even while
     it is not stuck yet: Shift+Tab back into the projects from below would otherwise park the focus under the bar that
     sticks during the same scroll (B2 re-test). A second pass corrects what the first scroll changed. */
  const bar = $('.bar'), barBox = bar && bar.parentElement;
  const clearTop = el => {
    const h = hdr.getBoundingClientRect().bottom; if (!bar) return h;
    const b = bar.getBoundingClientRect();
    return b.top <= h + 1 && b.bottom > h ? b.bottom : barBox && barBox.contains(el) ? h + b.height : h;
  };
  const pinned = el => { for (let a = el; a && a !== d.body; a = a.parentElement) if (getComputedStyle(a).position === 'fixed') return true; return false; };
  function reveal(el) {
    if (!el || el === d.body || el === root || !el.getBoundingClientRect || el.closest('dialog, .site-header, .bar, .skip') || pinned(el)) return;
    let r = el.getBoundingClientRect(); if (!r.width && !r.height) return;
    const y0 = scrollY;
    for (let k = 0; k < 2; k++) {
      const top = clearTop(el) + 14, bottom = innerHeight - 14;
      const dy = r.top < top ? r.top - top : r.bottom > bottom ? Math.min(r.bottom - bottom, r.top - top) : 0;
      if (Math.abs(dy) < 1) return;
      scrollBy({ top: Math.round(dy), behavior: 'instant' });
      const r2 = el.getBoundingClientRect();
      if (Math.abs(r2.top - r.top) < 1) { if (!k) scrollTo({ top: y0, behavior: 'instant' }); return; }
      r = r2;
    }
  }
  pv.on(d, 'focusin', e => { let kb = true; try { kb = e.target.matches(':focus-visible'); } catch (x) { /* no :focus-visible */ } if (kb) reveal(e.target); });

  pv.on(window, 'popstate', () => { const id = norm(location.hash) || (history.state && norm(history.state.w)); if (id && id !== cur) select(id); });
  let rt = 0;
  pv.on(window, 'resize', () => { clearTimeout(rt); rt = setTimeout(updateTabs, 100); }, { passive: true });

  /* test API (tiny and stable; see the shell notes): projects(), states(id), go(id, state?) -> Promise, current() */
  const current = () => ({ project: cur, state: pv.state(cur) });
  window.PV = Object.freeze({
    projects: () => IDS.slice(),
    states: id => pv.states(norm(id) || id),
    go: (id, state) => { const n = norm(id); if (!n) return Promise.reject(new Error('unknown project ' + id)); return select(n, { push: n !== cur, state }).then(current); },
    current,
  });

  /* init: the project named by the pre-paint script is on screen; the others stay hidden until chosen */
  pv.start();
  const raw = location.hash.replace(/^#/, '').toLowerCase();
  updateTabs();
  const other = raw && !norm(raw) && raw !== 'work';   // e.g. #about: keep that anchor
  history.replaceState({ w: cur }, '', !other && (norm(raw) || cur !== 'cfit') ? '#' + cur : location.href);   // the URL names the project on screen
  remember(cur);                                       // however the visitor arrived (tab, link, breadcrumb)
  pv.enter(cur, { from: null, instant: true });
  if (raw === 'awai') pv.on(window, 'load', () => scrollTo({ top: stickY(), behavior: 'instant' }), { once: true });

  } catch (e) { console.error('[shell]', e); }
  })();


  /* lightbox: any [data-zoom] element opens data-full (the full-size file) in a viewer. Triggers are found when they are
     clicked (one delegated listener), so triggers added later work too; a link trigger still opens the file without JS.
     Fit and 1:1 (actual pixels): buttons, double-click or double-tap, and the 1 key (0 = Fit). Pan by dragging, touch
     dragging or the arrow keys when the image is larger than the screen (otherwise the arrows, like Page Up/Down, move
     through the group). Wheel and pinch zoom. Loading and error states; focus stays inside and returns to the trigger. */
  if ('HTMLDialogElement' in window) {
    let dlg = null, stage, img, cap, zl, msg, oneB, fitB, prevB, nextB;
    let i = 0, s = 1, x = 0, y = 0, fit = 1, group = [], opener = null, tok = 0, lastTap = 0, drag = null, pinch = null;
    const pointers = new Map();
    const loaded = () => dlg && !dlg.classList.contains('is-loading') && !dlg.classList.contains('is-error') && img.naturalWidth > 0;
    const apply = () => { img.style.transform = `translate(${x}px, ${y}px) scale(${s})`; zl.textContent = loaded() ? Math.round(s * 100) + '%' : ''; const one = Math.abs(s - 1) < 0.001; oneB.setAttribute('aria-pressed', String(one)); fitB.setAttribute('aria-pressed', String(Math.abs(s - fit) < 0.001)); };
    const clamp = () => { const W = stage.clientWidth, H = stage.clientHeight, w = img.naturalWidth * s, h = img.naturalHeight * s; x = w <= W ? (W - w) / 2 : Math.min(0, Math.max(W - w, x)); y = h <= H ? (H - h) / 2 : Math.min(0, Math.max(H - h, y)); };
    const zoomAt = (ns, cx, cy) => { if (!loaded()) return; ns = Math.max(fit * 0.5, Math.min(4, ns)); x = cx - (cx - x) * (ns / s); y = cy - (cy - y) * (ns / s); s = ns; clamp(); apply(); };
    const fitNow = () => { if (!loaded()) return; const W = stage.clientWidth, H = stage.clientHeight; fit = Math.min(1, W / img.naturalWidth, H / img.naturalHeight); s = fit; x = 0; y = 0; clamp(); apply(); };
    const center = () => ({ cx: stage.clientWidth / 2, cy: stage.clientHeight / 2 });
    // Actual pixels always means one image pixel per CSS pixel, including an image that already fits.
    const oneNow = (cx, cy) => { if (!loaded()) return; const c = center(); zoomAt(1, cx ?? c.cx, cy ?? c.cy); };
    // Double-click/tap toggles Fit and actual pixels; a small image already at native size stays native.
    const toggleOne = (cx, cy) => { if (!loaded()) return; if (Math.abs(s - 1) < 0.001 && fit < 1) fitNow(); else oneNow(cx, cy); };
    const pannable = () => loaded() && (img.naturalWidth * s > stage.clientWidth + 1 || img.naturalHeight * s > stage.clientHeight + 1);
    const pan = (dx, dy) => { x += dx; y += dy; clamp(); apply(); };
    const say = (t, kind) => { msg.textContent = t; dlg.classList.toggle('is-loading', kind === 'loading'); dlg.classList.toggle('is-error', kind === 'error'); };
    function build() {
      dlg = document.createElement('dialog');
      dlg.className = 'lightbox'; dlg.setAttribute('aria-describedby', 'lb-cap');
      dlg.innerHTML = '<div class="lb-stage"><img alt=""><p class="lb-msg" role="status" aria-live="polite"></p></div><div class="lb-bar"><button type="button" class="btn btn-sm" data-a="prev" aria-label="Previous image">&larr;</button><button type="button" class="btn btn-sm" data-a="next" aria-label="Next image">&rarr;</button><p class="lb-cap" id="lb-cap"></p><span class="lb-zoom" aria-hidden="true"></span><button type="button" class="btn btn-sm" data-a="out" aria-label="Zoom out">&minus;</button><button type="button" class="btn btn-sm" data-a="fit" aria-label="Fit to screen" aria-pressed="true">Fit</button><button type="button" class="btn btn-sm" data-a="one" aria-label="1:1, actual pixels" aria-pressed="false">1:1</button><button type="button" class="btn btn-sm" data-a="in" aria-label="Zoom in">+</button><button type="button" class="btn btn-sm btn-primary" data-a="close" aria-label="Close viewer">Close</button></div>';
      document.body.appendChild(dlg);
      stage = dlg.querySelector('.lb-stage'); img = stage.querySelector('img'); cap = dlg.querySelector('.lb-cap'); zl = dlg.querySelector('.lb-zoom'); msg = dlg.querySelector('.lb-msg');
      oneB = dlg.querySelector('[data-a="one"]'); fitB = dlg.querySelector('[data-a="fit"]'); prevB = dlg.querySelector('[data-a="prev"]'); nextB = dlg.querySelector('[data-a="next"]');
      dlg.addEventListener('click', e => {
        const a = e.target.closest('[data-a]'); if (!a) return; const c = center();
        ({ prev: () => show(i - 1), next: () => show(i + 1), out: () => zoomAt(s / 1.5, c.cx, c.cy), in: () => zoomAt(s * 1.5, c.cx, c.cy), fit: fitNow, one: () => oneNow(), close: () => dlg.close() })[a.dataset.a]();
      });
      dlg.addEventListener('keydown', e => {
        if (e.key === 'Tab') { // keep focus inside the viewer
          const ring = [...dlg.querySelectorAll('button')].filter(b => !b.hidden && b.offsetParent !== null);
          const k = ring.indexOf(document.activeElement); e.preventDefault();
          ring[k < 0 ? 0 : (k + (e.shiftKey ? ring.length - 1 : 1)) % ring.length].focus(); return;
        }
        if (e.target.closest('button') && (e.key === 'Enter' || e.key === ' ')) return;
        const c = center(), step = e.shiftKey ? 240 : 80;
        const arrows = { ArrowLeft: [step, 0], ArrowRight: [-step, 0], ArrowUp: [0, step], ArrowDown: [0, -step] }[e.key];
        if (arrows && pannable()) { e.preventDefault(); pan(arrows[0], arrows[1]); return; }
        if (e.key === 'ArrowLeft' || e.key === 'PageUp') { e.preventDefault(); show(i - 1); }
        else if (e.key === 'ArrowRight' || e.key === 'PageDown') { e.preventDefault(); show(i + 1); }
        else if (e.key === '+' || e.key === '=') zoomAt(s * 1.5, c.cx, c.cy); else if (e.key === '-') zoomAt(s / 1.5, c.cx, c.cy);
        else if (e.key === '0') fitNow(); else if (e.key === '1') oneNow();
      });
      dlg.addEventListener('close', () => {
        // A queued close event belongs to the old opening; preserve an image already reopened by keyboard.
        if (dlg.open) return;
        tok++; img.removeAttribute('src'); say('', ''); const z = opener; opener = null;
        if (z && z.isConnected && z.offsetParent !== null) { z.focus(); return; }
        // the trigger is gone or hidden (its view changed state): fall back to that view's current control, then the project tab
        const host = z && z.isConnected ? z.closest('section.pv, .ax-world, main') : null;
        const alt = (host && host.querySelector('[data-pv-state][aria-pressed="true"], [data-pv-state][aria-selected="true"]')) || document.querySelector('.ax-tabs [aria-selected="true"]') || document.getElementById('main');
        if (alt) { if (alt.id === 'main' && !alt.hasAttribute('tabindex')) alt.setAttribute('tabindex', '-1'); alt.focus(); }
      });
      stage.addEventListener('wheel', e => { e.preventDefault(); const r = stage.getBoundingClientRect(); zoomAt(s * Math.exp(-e.deltaY * 0.0015), e.clientX - r.left, e.clientY - r.top); }, { passive: false });
      stage.addEventListener('pointerdown', e => {
        if (!loaded()) return;
        stage.setPointerCapture(e.pointerId); pointers.set(e.pointerId, e);
        if (pointers.size === 2) { const [a, b] = [...pointers.values()]; pinch = { d: Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY), s }; drag = null; return; }
        drag = { px: e.clientX, py: e.clientY, x, y }; stage.classList.add('is-dragging');
        const now = Date.now(); if (now - lastTap < 300) { const r = stage.getBoundingClientRect(); toggleOne(e.clientX - r.left, e.clientY - r.top); lastTap = 0; } else lastTap = now;
      });
      stage.addEventListener('pointermove', e => {
        if (!pointers.has(e.pointerId)) return; pointers.set(e.pointerId, e);
        if (pinch && pointers.size === 2) { const [a, b] = [...pointers.values()]; const r = stage.getBoundingClientRect(); const dd = Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY); zoomAt(pinch.s * dd / pinch.d, (a.clientX + b.clientX) / 2 - r.left, (a.clientY + b.clientY) / 2 - r.top); }
        else if (drag) { x = drag.x + e.clientX - drag.px; y = drag.y + e.clientY - drag.py; clamp(); apply(); }
      });
      const up = e => { pointers.delete(e.pointerId); if (pointers.size < 2) pinch = null; if (!pointers.size) { drag = null; stage.classList.remove('is-dragging'); } };
      stage.addEventListener('pointerup', up); stage.addEventListener('pointercancel', up);
      window.addEventListener('resize', () => { if (dlg.open) fitNow(); });
    }
    function show(k) {
      if (!group.length) return;
      i = (k + group.length) % group.length; const z = group[i], my = ++tok;
      stage.classList.toggle('pixel', z.hasAttribute('data-pixel'));
      const alt = z.dataset.alt || z.getAttribute('aria-label') || '';
      img.alt = alt; cap.textContent = z.dataset.caption || alt;
      dlg.setAttribute('aria-label', 'Full-size image' + (alt ? ': ' + alt : ''));
      prevB.hidden = nextB.hidden = group.length < 2;
      say('Loading the full-size image…', 'loading'); img.removeAttribute('src'); apply();
      img.onload = () => { if (my !== tok) return; say('', ''); fitNow(); };
      img.onerror = () => { if (my !== tok) return; say('This image could not be loaded. Close the viewer and try again.', 'error'); zl.textContent = ''; };
      img.src = z.dataset.full || z.getAttribute('href');
    }
    function open(z) {
      if (!dlg) build();
      opener = z;
      const g = z.dataset.group, full = z.dataset.full || z.getAttribute('href'), seen = new Set();
      // the group in page order; a still and its corner button (same file) count once
      group = (g ? [...document.querySelectorAll('[data-zoom]')].filter(o => o.dataset.group === g) : [z]).filter(o => { const f = o.dataset.full || o.getAttribute('href'); if (seen.has(f)) return false; seen.add(f); return true; });
      if (!dlg.open) dlg.showModal();
      show(Math.max(0, group.findIndex(o => (o.dataset.full || o.getAttribute('href')) === full)));
      const first = dlg.querySelector('[data-a="close"]'); if (first) first.focus();
    }
    document.addEventListener('click', e => {
      const z = e.target.closest && e.target.closest('[data-zoom]');
      if (!z || e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      e.preventDefault(); open(z);
    });
    document.addEventListener('keydown', e => { // Space on a link trigger opens it too (buttons do this natively)
      if (e.key !== ' ' || e.defaultPrevented) return;
      const z = e.target.closest && e.target.closest('a[data-zoom]'); if (!z) return;
      e.preventDefault(); open(z);
    });
  }

  /* email: [data-email] mailto links open a small dialog (the address, Copy email, Open email app), because a bare
     mailto: fails silently where no mail app is set up. Without JavaScript (or <dialog>) the link stays a plain mailto. */
  const mailers = [...document.querySelectorAll('a[data-email][href^="mailto:"]')];
  if (mailers.length && 'HTMLDialogElement' in window) {
    const addr = mailers[0].getAttribute('href').slice(7).split('?')[0];
    const md = document.createElement('dialog');
    md.className = 'mail-dlg'; md.setAttribute('aria-labelledby', 'mail-dlg-title'); md.setAttribute('aria-describedby', 'mail-dlg-sub');
    md.innerHTML = `<div class="md-card"><div class="md-head"><h2 id="mail-dlg-title">Email Michael</h2><button type="button" class="md-x" data-m="close" aria-label="Close"><svg viewBox="0 0 16 16" aria-hidden="true"><path d="M4 4l8 8M12 4l-8 8" fill="none" stroke="currentColor" stroke-width="1.6"/></svg></button></div>
<p class="md-sub" id="mail-dlg-sub">Copy the address, or open your email app.</p>
<label class="md-label" for="mail-dlg-addr">Email address</label><input class="md-addr" id="mail-dlg-addr" type="text" readonly value="${addr}" spellcheck="false" autocomplete="off">
<div class="md-actions"><button type="button" class="btn btn-primary" data-m="copy">Copy email</button><a class="btn" data-m="open" href="mailto:${addr}">Open email app</a></div>
<p class="md-status" role="status" aria-live="polite"></p></div>`;
    document.body.appendChild(md);
    const input = md.querySelector('.md-addr'), status = md.querySelector('.md-status'), copyBtn = md.querySelector('[data-m="copy"]'), openA = md.querySelector('[data-m="open"]');
    let opener = null, tmr = 0;
    const say = (msg, kind) => { status.textContent = msg; status.dataset.kind = kind || ''; };
    const selectAddr = () => { input.focus(); input.select(); input.setSelectionRange(0, input.value.length); };
    const copied = () => { say('Copied to the clipboard.', 'ok'); copyBtn.textContent = 'Copied'; clearTimeout(tmr); tmr = setTimeout(() => { copyBtn.textContent = 'Copy email'; }, 2400); };
    const manual = () => { selectAddr(); say(`Couldn’t copy automatically. The address is selected: press ${/Mac|iPhone|iPad/.test(navigator.platform) ? '⌘C' : 'Ctrl+C'} to copy it.`, 'warn'); };
    const legacy = () => { try { selectAddr(); return document.execCommand && document.execCommand('copy'); } catch { return false; } };
    copyBtn.addEventListener('click', async () => {
      try { if (!navigator.clipboard || !navigator.clipboard.writeText) throw 0; await navigator.clipboard.writeText(addr); copied(); copyBtn.focus(); }
      catch { if (legacy()) { copied(); copyBtn.focus(); } else manual(); }
    });
    input.addEventListener('focus', () => input.select());
    md.addEventListener('click', e => { if (e.target === md || e.target.closest('[data-m="close"]')) md.close(); });
    md.addEventListener('close', () => { say(''); copyBtn.textContent = 'Copy email'; const o = opener; opener = null; if (o && o.isConnected) o.focus(); });
    mailers.forEach(a => a.addEventListener('click', e => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      e.preventDefault(); opener = a; openA.setAttribute('href', a.getAttribute('href')); say('');
      md.showModal(); copyBtn.focus();
    }));
  }

  /* case-study chapter nav: highlight the chapter in view; on phones keep the active pill scrolled into view */
  const toc = document.querySelector('.toc');
  if (toc && 'IntersectionObserver' in window) {
    const links = new Map([...toc.querySelectorAll('a[href^="#"]')].map(a => [a.getAttribute('href').slice(1), a]));
    const io = new IntersectionObserver(es => es.forEach(e => { if (!e.isIntersecting) return; links.forEach(a => { a.classList.remove('is-active'); a.removeAttribute('aria-current'); }); const a = links.get(e.target.id); if (a) { a.classList.add('is-active'); a.setAttribute('aria-current', 'true'); if (toc.scrollWidth > toc.clientWidth) toc.scrollTo({ left: a.offsetLeft - 16, behavior: reduce.matches ? 'auto' : 'smooth' }); } }), { rootMargin: '-30% 0px -60% 0px' });
    links.forEach((a, id) => { const t = document.getElementById(id); if (t) io.observe(t); });
  }
})();
