/* ============================================================
   shared.js — Ruiqian Zhang · Site-Wide Scripts

   USAGE: Include this AFTER your page-specific inline script
   that sets up any page-specific UI object.

   Exports (globals): window.RZ.initTheme, window.RZ.splitFlipText,
   window.RZ.observeReveal, window.RZ.smoothScrollTop, window.RZ.initScrollProgress
   ============================================================ */

window.RZ = (() => {

  /* ── 1. Theme ──────────────────────────────────────────── */
  function initTheme() {
    const saved       = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    document.body.style.transition = 'none';
    if (saved === 'dark' || (!saved && prefersDark)) document.body.classList.add('dark');
    // Re-enable transitions after first paint
    window.addEventListener('load', () => {
      setTimeout(() => document.body.style.transition = '', 100);
    });
  }

  function attachThemeToggle(btnId = 'theme-toggle') {
    const btn = document.getElementById(btnId);
    if (!btn) return;
    btn.addEventListener('click', () => {
      document.body.classList.add('theme-transition');
      const dark = document.body.classList.toggle('dark');
      localStorage.setItem('theme', dark ? 'dark' : 'light');
      setTimeout(() => document.body.classList.remove('theme-transition'), 420);
    });
  }

  /* ── 2. Split-text flip animation ──────────────────────── */
  function splitFlipText(selector = '.split-flip-text', delay = 30) {
    document.querySelectorAll(selector).forEach(el => {
      const text = el.textContent.trim();
      el.setAttribute('aria-label', text);
      el.innerHTML = text.split('').map(ch => `<span class="char-flip">${ch}</span>`).join('');
    });
    // Trigger visible on load
    window.addEventListener('load', () => {
      document.querySelectorAll('.char-flip').forEach((c, i) =>
        setTimeout(() => c.classList.add('visible'), i * delay)
      );
    });
  }

  /* ── 3. Intersection-observer reveal ───────────────────── */
  function observeReveal(selector = '.reveal-flip', rootMargin = '-40px') {
    const obs = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        const el    = entry.target;
        const delay = parseInt(el.getAttribute('data-delay') || 0);
        // Char-flips inside the element
        el.querySelectorAll('.char-flip').forEach((c, i) =>
          setTimeout(() => c.classList.add('visible'), delay + i * 30)
        );
        // Resume-arrow fade
        const dl = el.closest('.download-link');
        if (dl) {
          const icon = dl.querySelector('svg');
          if (icon) {
            icon.style.opacity   = '0';
            icon.style.transition = 'opacity 0.5s ease';
            setTimeout(() => icon.style.opacity = '1', delay);
          }
        }
        if (el.classList.contains('reveal-flip'))
          setTimeout(() => el.classList.add('visible'), delay);
        obs.unobserve(el);
      });
    }, { rootMargin, threshold: 0.05 });

    document.querySelectorAll(selector).forEach(el => obs.observe(el));
  }

  /* ── 4. Smooth scroll to top ───────────────────────────── */
  function smoothScrollTop(duration = 800) {
    const startY    = window.scrollY;
    let   startTime = null;
    function tick(now) {
      if (!startTime) startTime = now;
      const t    = Math.min((now - startTime) / duration, 1);
      const ease = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
      window.scrollTo(0, startY * (1 - ease));
      if (t < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }

  function initScrollToTop(btnId = 'scroll-to-top') {
    const btn = document.getElementById(btnId);
    if (!btn) return;
    btn.addEventListener('click', () => smoothScrollTop());
    window.addEventListener('scroll', () => {
      const atBottom = window.innerHeight + window.scrollY >= document.body.offsetHeight - 100;
      btn.classList.toggle('visible', atBottom || window.scrollY > 400);
    }, { passive: true });
  }

  /* ── 5. Scroll-progress bar ─────────────────────────────── */
  function initScrollProgress(barId = 'scroll-progress') {
    const bar = document.getElementById(barId);
    if (!bar) return;
    window.addEventListener('scroll', () => {
      const total   = document.documentElement.scrollHeight - window.innerHeight;
      const pct     = total > 0 ? (window.scrollY / total) * 100 : 0;
      bar.style.width = pct + '%';
      bar.classList.toggle('visible', window.scrollY > 80);
    }, { passive: true });
  }

  /* ── 6. Staggered reveal on load (first-view items) ─────── */
  function revealOnLoad(selector, baseDelay = 300, step = 150) {
    window.addEventListener('load', () => {
      const items = document.querySelectorAll(selector);
      items.forEach((el, i) =>
        setTimeout(() => el.classList.add('visible'), baseDelay + i * step)
      );
    });
  }

  return { initTheme, attachThemeToggle, splitFlipText, observeReveal, smoothScrollTop, initScrollToTop, initScrollProgress, revealOnLoad };
})();

// Auto-init: theme must run before first paint (called inline too, this is a safety net)
RZ.initTheme();
RZ.attachThemeToggle();
