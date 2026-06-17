/* ============================================================
   home.js — index page interactions
   · ArcDeck: physics-based project carousel (reads /projects/)
   · ID card: 3D holographic student-ID tilt + expand
   ============================================================ */

/* ─────────────────────────────────────────────────────
   ARC DECK
────────────────────────────────────────────────────── */
const ArcDeck = (() => {
  function arcAt(t, W, ARC_H) {
    const x     = (t - 0.5) * W;
    const y     = 4 * ARC_H * t * (1 - t);
    const slope = 4 * ARC_H * (1 - 2 * t) / W;
    const tilt  = Math.atan(slope) * (180 / Math.PI) * 0.4;
    return { x, y, tilt };
  }

  let allProjects = [], totalCount = 0, cards = [];
  let offset = 0, targetOffset = 0, animRaf = null;
  let dragging = false, dragStartX = 0, dragBaseOffset = 0, dragMoved = false;
  let introStartOffset = 0, animStartTime = null;

  const CARD_W = 220, CARD_W_SM = 210, ARC_H = 80, TOP_PAD = 30;

  function getCardW() {
    const outer = document.getElementById('arc-deck-outer');
    return outer && outer.clientWidth < 600 ? CARD_W_SM : CARD_W;
  }
  function getBounds() { return { min: 0, max: Math.max(0, cards.length - 1) }; }
  function applyStretch(val) {
    const { min, max } = getBounds();
    const lim = 0.55;
    if (val < min) return min - lim * (1 - Math.exp(-(min - val) / lim));
    if (val > max) return max + lim * (1 - Math.exp(-(val - max) / lim));
    return val;
  }

  function updateIndicators() {
    const svg = document.getElementById('arc-dots-svg');
    if (!svg || !cards.length || cards.length === 1) { if (svg) svg.innerHTML = ''; return; }
    const n = cards.length, GAP = 22, DOT_R = 4.5, IH = 10;
    const totalW = (n - 1) * GAP, CY = IH + DOT_R + 2;
    const isDark = document.body.classList.contains('dark');
    svg.innerHTML = '';
    cards.forEach((_, i) => {
      const t = i / (n - 1), x = i * GAP, y = CY - 4 * IH * t * (1 - t);
      const activeMix = Math.max(0, 1 - Math.abs(i - offset));
      const c = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      c.setAttribute('cx', x); c.setAttribute('cy', y); c.setAttribute('r', DOT_R + activeMix * 0.5);
      c.setAttribute('fill', isDark ? '#98a6b3' : '#6b7280');
      c.setAttribute('opacity', 0.2 + 0.8 * activeMix);
      c.classList.add('arc-dot');
      c.style.pointerEvents = 'auto'; c.style.cursor = 'pointer';
      c.addEventListener('click', () => {
        const { min, max } = getBounds();
        targetOffset = Math.max(min, Math.min(max, i));
        if (animStartTime) animStartTime = null;
        startAnim();
      });
      svg.appendChild(c);
    });
    const vbH = CY + DOT_R + 4;
    svg.setAttribute('viewBox', `${-DOT_R-1} ${-DOT_R-1} ${totalW+DOT_R*2+2} ${vbH+DOT_R+2}`);
    svg.style.width  = `${totalW + DOT_R * 2 + 2}px`;
    svg.style.height = `${vbH + DOT_R + 2}px`;
  }

  function placeCard(el, x, y, tilt, scale, zi, alpha, isAnim) {
    el.style.transition = isAnim
      ? 'translate 0.3s ease, box-shadow 0.3s ease, border-color 0.3s ease'
      : 'translate 0.35s ease, box-shadow 0.35s ease, border-color 0.25s ease, opacity 0.5s ease, transform 0.35s ease';
    el.style.zIndex   = zi;
    el.style.opacity  = alpha;
    el.style.transform = `translate3d(${x}px, ${y}px, 0) rotate(${tilt}deg) scale(${scale})`;
  }

  function layoutCards(isAnim) {
    const outer = document.getElementById('arc-deck-outer');
    if (!outer || !cards.length) return;
    const isMobile = outer.clientWidth < 600;
    const cw = getCardW(), W = Math.min(outer.clientWidth * (isMobile ? 1.15 : 0.9), 860);
    const step = isMobile ? 0.28 : 0.24;
    cards.forEach((card, i) => {
      const relI = i - offset, t = 0.5 + relI * step;
      const { x, y, tilt } = arcAt(t, W, ARC_H);
      const dist  = Math.abs(relI);
      const scale = Math.max(0.75, 1 - dist * 0.08);
      const zi    = Math.round(100 - dist * 10);
      const alpha = t < 0 ? Math.max(0, 1 + t * 4) : (t > 1 ? Math.max(0, 1 - (t-1)*4) : 1);
      if (!card.el.dataset.anchored) {
        card.el.style.top  = `${TOP_PAD}px`;
        card.el.style.left = '50%';
        card.el.style.marginLeft = `${-cw / 2}px`;
        card.el.dataset.anchored = 'true';
      }
      placeCard(card.el, x, ARC_H - y, tilt, scale, zi, alpha, isAnim);
    });
    updateIndicators();
  }

  function tick() {
    const diff = targetOffset - offset;
    if (Math.abs(diff) < 0.001) { offset = targetOffset; layoutCards(false); animRaf = null; return; }
    offset += diff * 0.16;
    layoutCards(true);
    animRaf = requestAnimationFrame(tick);
  }

  function introTick(now) {
    if (!animStartTime) animStartTime = now;
    const elapsed = now - animStartTime, dur = 1300;
    let progress = Math.min(elapsed / dur, 1);
    if (progress === 1) { offset = targetOffset; layoutCards(false); animRaf = null; animStartTime = null; return; }
    const ease = 1 - Math.pow(1 - progress, 4);
    offset = introStartOffset + (targetOffset - introStartOffset) * ease;
    layoutCards(true);
    animRaf = requestAnimationFrame(introTick);
  }

  function startAnim() { if (!animRaf) animRaf = requestAnimationFrame(tick); }

  function attachDragGuard(el) {
    let sx, sy, st;
    el.addEventListener('touchstart', e => { sx = e.touches[0].clientX; sy = e.touches[0].clientY; st = Date.now(); }, { passive: true });
    el.addEventListener('touchend', e => {
      const d = Math.hypot(e.changedTouches[0].clientX - sx, e.changedTouches[0].clientY - sy);
      if (d < 10 && Date.now() - st < 250) { const h = el.getAttribute('href'); if (h) window.location.href = h; }
    });
    el.addEventListener('click', e => { if (dragging || dragMoved) { e.preventDefault(); e.stopPropagation(); } });
  }

  function buildProjectCard(proj) {
    const a = document.createElement('a');
    a.className = 'arc-card'; a.href = proj.href || '/projects/';
    const thumb = document.createElement('div'); thumb.className = 'arc-card-thumb';
    if (proj.image) {
      const img = document.createElement('img'); img.src = proj.image; img.alt = proj.title; thumb.appendChild(img);
    } else {
      thumb.classList.add('no-image');
      thumb.innerHTML = `<div class="arc-card-thumb-placeholder"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="3"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/></svg></div>`;
    }
    const titleEl = document.createElement('h2'); titleEl.className = 'arc-card-title'; titleEl.textContent = proj.title;
    thumb.appendChild(titleEl);
    a.appendChild(thumb);

    const statusLabel = { 'in-progress': 'In progress', 'on-hold': 'On hold', 'completed': 'Completed', 'dropped': 'Dropped' };
    const body = document.createElement('div'); body.className = 'arc-card-body';
    body.innerHTML = `<p class="arc-card-desc">${proj.desc || ''}</p>
      <div class="arc-card-meta">
        ${proj.status ? `<span class="arc-status-pill"><span class="arc-status-dot" data-status="${proj.status}"></span>${statusLabel[proj.status] || proj.status}</span>` : ''}
        ${proj.date ? `<span class="arc-card-date">${proj.date}</span>` : ''}
      </div>`;
    a.appendChild(body); attachDragGuard(a); return a;
  }

  function buildViewAllCard(total) {
    const a = document.createElement('a'); a.className = 'arc-card arc-card-viewall'; a.href = '/projects/';
    a.innerHTML = `<div class="viewall-icon"><svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg></div>
      <div class="viewall-label">View all<br>projects</div>${total?`<div class="viewall-count">${total} total</div>`:''}`;
    attachDragGuard(a); return a;
  }

  function buildCards(stage, animate) {
    cards.forEach(c => c.el.remove()); cards = [];
    if (animRaf) { cancelAnimationFrame(animRaf); animRaf = null; }
    allProjects.forEach(p => { const el = buildProjectCard(p); stage.appendChild(el); cards.push({ el }); });
    if (allProjects.length > 0) { const va = buildViewAllCard(totalCount); stage.appendChild(va); cards.push({ el: va }); }
    const startIdx = 1;
    if (animate) {
      introStartOffset = cards.length + 1.8; offset = introStartOffset; targetOffset = startIdx;
      layoutCards(true); cards.forEach(c => c.el.classList.add('card-in'));
      animStartTime = null; animRaf = requestAnimationFrame(introTick);
    } else {
      offset = startIdx; targetOffset = startIdx;
      layoutCards(false); cards.forEach(c => c.el.classList.add('card-in'));
    }
  }

  function setupInteraction() {
    const outer = document.getElementById('arc-deck-outer'); if (!outer) return;
    const interruptIntro = () => { if (animStartTime) { cancelAnimationFrame(animRaf); animRaf = null; animStartTime = null; targetOffset = offset; } };

    outer.addEventListener('mousedown', e => { if (cards.length <= 1) return; interruptIntro(); dragging = true; dragMoved = false; dragStartX = e.clientX; dragBaseOffset = targetOffset; outer.style.cursor = 'grabbing'; e.preventDefault(); });
    window.addEventListener('mousemove', e => { if (!dragging) return; const dx = e.clientX - dragStartX; if (Math.abs(dx) > 6) dragMoved = true; targetOffset = applyStretch(dragBaseOffset - dx / 70); startAnim(); });
    window.addEventListener('mouseup', () => { if (!dragging) return; dragging = false; outer.style.cursor = ''; const { min, max } = getBounds(); targetOffset = Math.max(min, Math.min(max, Math.round(targetOffset))); startAnim(); });

    outer.addEventListener('touchstart', e => { if (cards.length <= 1) return; interruptIntro(); dragging = true; dragMoved = false; dragStartX = e.touches[0].clientX; dragBaseOffset = targetOffset; }, { passive: true });
    outer.addEventListener('touchmove', e => { if (!dragging) return; const dx = e.touches[0].clientX - dragStartX; if (Math.abs(dx) > 6) dragMoved = true; if (dragMoved) e.preventDefault(); targetOffset = applyStretch(dragBaseOffset - dx / 60); startAnim(); }, { passive: false });
    outer.addEventListener('touchend', () => { if (!dragging) return; dragging = false; const { min, max } = getBounds(); targetOffset = Math.max(min, Math.min(max, Math.round(targetOffset))); startAnim(); });

    let wt;
    outer.addEventListener('wheel', e => {
      if (cards.length <= 1 || Math.abs(e.deltaX) <= Math.abs(e.deltaY)) return;
      e.preventDefault(); interruptIntro();
      targetOffset = applyStretch(targetOffset + e.deltaX / 90); startAnim();
      clearTimeout(wt); wt = setTimeout(() => { const { min, max } = getBounds(); targetOffset = Math.max(min, Math.min(max, Math.round(targetOffset))); startAnim(); }, 150);
    }, { passive: false });

    let rt; window.addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(() => layoutCards(false), 120); });
    new MutationObserver(() => updateIndicators()).observe(document.body, { attributes: true, attributeFilter: ['class'] });
  }

  async function init() {
    const stage = document.getElementById('arc-deck-stage'), outer = document.getElementById('arc-deck-outer');
    if (!stage || !outer) return;
    const PLACEHOLDERS = [
      { title: 'Project One',   desc: 'A brief description.',                              href: '/projects/', status: 'completed',  date: 'Jan 2025', image: '' },
      { title: 'Project Two',   desc: 'Short summary of goals, tech, and outcomes.',        href: '/projects/', status: 'in-progress',date: 'Mar 2025', image: '' },
      { title: 'Project Three', desc: 'Hardware and software work across two semesters.',   href: '/projects/', status: 'on-hold',    date: 'Nov 2024', image: '' },
    ];
    try {
      const res = await fetch('/projects/'); if (!res.ok) throw new Error();
      const doc = new DOMParser().parseFromString(await res.text(), 'text/html');
      const allCards = doc.querySelectorAll('.project-card'); totalCount = allCards.length;
      for (let i = 0; i < Math.min(3, allCards.length); i++) {
        const c = allCards[i];
        allProjects.push({ title: c.querySelector('h2')?.textContent?.trim()||'Project', desc: c.querySelector('p')?.textContent?.trim()||'', image: c.getAttribute('data-image')||'', href: c.getAttribute('href')||'/projects/', status: c.querySelector('[data-status]')?.getAttribute('data-status')||'', date: c.querySelector('.date-label')?.textContent?.trim()||'' });
      }
    } catch(e) { console.warn('Arc deck: using placeholders'); }
    if (!allProjects.length) { allProjects = PLACEHOLDERS; totalCount = allProjects.length; }
    setupInteraction();
    new IntersectionObserver((entries, obs) => {
      if (entries[0].isIntersecting) { outer.classList.add('deck-visible'); buildCards(stage, true); obs.disconnect(); }
    }, { threshold: 0.12 }).observe(outer);
  }

  return { init };
})();

document.addEventListener('DOMContentLoaded', () => ArcDeck.init());

/* ─────────────────────────────────────────────────────
   ID CARD interaction
────────────────────────────────────────────────────── */
(() => {
  const wrap     = document.getElementById('id-wrapper');
  const card     = document.getElementById('id-card');
  const backdrop = document.getElementById('card-backdrop');
  const closeBtn = document.getElementById('card-close-btn');
  if (!wrap || !card) return;

  let spinning = false, recovering = false, rt;
  let isExpanded = false;

  const reset = () => {
    if (spinning) { rt = setTimeout(reset, 100); return; }
    card.classList.remove('interacting');
    card.style.setProperty('--rx','0deg'); card.style.setProperty('--ry','0deg');
    card.style.setProperty('--px','50%');  card.style.setProperty('--py','50%');
    card.style.boxShadow = 'none';
  };

  const spin = () => {
    if (spinning) return;
    spinning = true; card.classList.remove('interacting'); card.classList.add('spin-360');
    setTimeout(() => { card.classList.remove('spin-360'); spinning = false; recovering = true; setTimeout(() => recovering = false, 300); }, 600);
  };

  let scrollLockY = 0;
  const lockScroll = () => {
    scrollLockY = window.scrollY;
    document.body.style.position = 'fixed';
    document.body.style.top = `-${scrollLockY}px`;
    document.body.style.width = '100%';
  };
  const unlockScroll = () => {
    document.body.style.position = '';
    document.body.style.top = '';
    document.body.style.width = '';
    window.scrollTo({ top: scrollLockY, behavior: 'instant' });
  };

  const expandCard = () => {
    if (isExpanded) return;
    const rect = wrap.getBoundingClientRect();
    const tx = window.innerWidth  / 2 - (rect.left + rect.width  / 2);
    const ty = window.innerHeight / 2 - (rect.top  + rect.height / 2);
    const s  = Math.min(1.8, (window.innerWidth * 0.85) / rect.width, (window.innerHeight * 0.8) / rect.height);

    wrap.style.setProperty('--tx', `${tx}px`); wrap.style.setProperty('--ty', `${ty}px`); wrap.style.setProperty('--s', `${s}`);

    lockScroll();

    wrap.classList.add('expanded'); document.body.classList.add('card-expanded');
    backdrop.classList.add('visible'); closeBtn.classList.add('visible');
    isExpanded = true;
  };

  const shrinkCard = () => {
    if (!isExpanded) return;
    wrap.style.setProperty('--tx','0px'); wrap.style.setProperty('--ty','0px'); wrap.style.setProperty('--s','1');

    document.body.classList.remove('card-expanded');
    backdrop.classList.remove('visible'); closeBtn.classList.remove('visible');

    unlockScroll();

    isExpanded = false;
    setTimeout(() => { if (!isExpanded) wrap.classList.remove('expanded'); }, 600);
    rt = setTimeout(reset, 500);
  };

  const handleCardAction = (e) => {
    if (e && e.cancelable) e.preventDefault();
    if (isExpanded) { spin(); rt = setTimeout(reset, 600); } else { reset(); expandCard(); }
  };

  const interact = (cx, cy) => {
    if (spinning) return; clearTimeout(rt);
    const r = wrap.getBoundingClientRect();
    const nx = Math.max(-1, Math.min(1, (((cx-r.left)/r.width)*2-1) * 1.6));
    const ny = Math.max(-1, Math.min(1, (((cy-r.top)/r.height)*2-1) * 1.6));
    if (!recovering) card.classList.add('interacting');
    card.style.setProperty('--rx', `${ny * -16}deg`); card.style.setProperty('--ry', `${nx * 16}deg`);
    card.style.setProperty('--px', `${(nx+1)*50}%`);  card.style.setProperty('--py', `${(ny+1)*50}%`);
    card.style.boxShadow = `${-nx*16*1.5}px ${ny*-16*1.5}px 30px ${getComputedStyle(document.body).getPropertyValue('--card-shadow')}`;
  };

  wrap.addEventListener('click', handleCardAction);
  let ticking = false;
  wrap.addEventListener('mousemove', e => {
    if (!ticking) { requestAnimationFrame(() => { interact(e.clientX, e.clientY); ticking = false; }); ticking = true; }
  });
  wrap.addEventListener('mouseleave', () => { rt = setTimeout(reset, 500); });

  let ts = {};
  wrap.addEventListener('touchstart', e => { clearTimeout(rt); ts = { t: Date.now(), x: e.touches[0].clientX, y: e.touches[0].clientY }; }, { passive: true });
  wrap.addEventListener('touchmove', e => { if (e.cancelable) e.preventDefault(); interact(e.touches[0].clientX, e.touches[0].clientY); }, { passive: false });
  wrap.addEventListener('touchend', e => {
    const dist = Math.hypot(e.changedTouches[0].clientX - ts.x, e.changedTouches[0].clientY - ts.y);
    if (Date.now() - ts.t < 250 && dist < 20) { handleCardAction(e); } else { rt = setTimeout(reset, 500); }
  });
  wrap.addEventListener('touchcancel', () => { rt = setTimeout(reset, 500); });
  closeBtn.addEventListener('click', shrinkCard);
  backdrop.addEventListener('click', shrinkCard);
  window.addEventListener('resize', () => { if (isExpanded) shrinkCard(); });
})();
