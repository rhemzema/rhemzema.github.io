/* ============================================================
   shared.js — Ruiqian Zhang · Site-Wide Scripts

   USAGE: Include this AFTER your page-specific inline script
   that sets up any page-specific UI object.

   Exports (globals): window.RZ.initTheme, window.RZ.splitFlipText,
   window.RZ.observeReveal, window.RZ.smoothScrollTop, window.RZ.initScrollProgress,
   window.RZ.revealOnLoad, window.RZ.initImageGallery
   ============================================================ */

window.RZ = (() => {

  /* ── 1. Theme ──────────────────────────────────────────── */
  function initTheme() {
    const saved       = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    document.body.style.transition = 'none';
    if (saved === 'dark' || (!saved && prefersDark)) document.body.classList.add('dark');
    
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
      el.style.visibility = 'visible';
    });
    
    function revealChars() {
      document.querySelectorAll('.char-flip').forEach((c, i) =>
        setTimeout(() => c.classList.add('visible'), i * delay)
      );
    }
    if (document.readyState === 'complete') {
      revealChars();
    } else {
      window.addEventListener('load', revealChars);
    }
  }

  /* ── 3. Intersection-observer reveal ───────────────────── */
  function observeReveal(selector = '.reveal-flip', rootMargin = '-40px') {
    const obs = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        const el    = entry.target;
        const delay = parseInt(el.getAttribute('data-delay') || 0);
        
        el.querySelectorAll('.char-flip').forEach((c, i) =>
          setTimeout(() => c.classList.add('visible'), delay + i * 30)
        );
        
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

  /* ── 4. Scroll To Top ──────────────────────────────────── */
  function smoothScrollTop() {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function initScrollToTop(btnId = 'scroll-to-top') {
    const btn = document.getElementById(btnId);
    if (!btn) return;
    btn.addEventListener('click', () => smoothScrollTop());
    function check() {
      const atBottom = window.innerHeight + window.scrollY >= document.body.offsetHeight - 100;
      btn.classList.toggle('visible', atBottom || window.scrollY > 400);
    }
    window.addEventListener('scroll', check, { passive: true });
    window.addEventListener('load', check);
  }

  /* ── 5. Scroll-progress bar ─────────────────────────────── */
  function initScrollProgress(barId = 'scroll-progress') {
    const bar = document.getElementById(barId);
    if (!bar) return;
    window.addEventListener('scroll', () => {
      const total = document.documentElement.scrollHeight - window.innerHeight;
      const pct   = total > 0 ? window.scrollY / total : 0;
      bar.style.transform = `scaleX(${pct})`;
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

  /* ── 7. Shared Image Gallery & Modal ────────────────────── */
  function initImageGallery() {
    const grids = document.querySelectorAll('.content-image-grid');
    if (!grids.length) return;

    if (!document.getElementById('image-modal')) {
      document.body.insertAdjacentHTML('beforeend', `
        <div class="image-modal-wrapper" id="image-modal">
          <div class="modal-nav prev" id="modal-prev"><div class="modal-arrow-icon"></div></div>
          <div class="modal-nav next" id="modal-next"><div class="modal-arrow-icon"></div></div>
          <div class="image-modal-content" id="modal-content">
            <img id="modal-image" class="image-modal-img" src="" alt="" draggable="false" />
          </div>
        </div>
      `);
    }

    const imageModal   = document.getElementById('image-modal');
    const modalImage   = document.getElementById('modal-image');
    const modalContent = document.getElementById('modal-content');
    const prevBtn      = document.getElementById('modal-prev');
    const nextBtn      = document.getElementById('modal-next');
    const backdrop     = document.getElementById('card-backdrop');
    const closeBtn     = document.getElementById('card-close-btn');

    let currentImages = [], currentIdx = 0, activeImg = null, isExpanded = false;
    let scrollLockY = 0;
    let scrollbarWidth = 0;

    /* Desktop uses overflow hidden to preserve sticky sidebar, Mobile uses fixed body to avoid opaque bottom */
    function lockScroll() {
      scrollLockY = window.scrollY;
      if (window.innerWidth > 900) {
        scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
        document.documentElement.style.overflow = 'hidden';
        document.documentElement.style.paddingRight = `${scrollbarWidth}px`;
      } else {
        document.body.style.position = 'fixed';
        document.body.style.top = `-${scrollLockY}px`;
        document.body.style.width = '100%';
      }
    }
    
    function unlockScroll() {
      if (window.innerWidth > 900) {
        document.documentElement.style.overflow = '';
        document.documentElement.style.paddingRight = '';
      } else {
        document.body.style.position = '';
        document.body.style.top = '';
        document.body.style.width = '';
        window.scrollTo({ top: scrollLockY, behavior: 'instant' });
      }
    }

    function expandImage(img) {
      imageModal.style.transform = '';
      const rect = img.getBoundingClientRect();
      const tx = rect.left + rect.width  / 2 - window.innerWidth  / 2;
      const ty = rect.top  + rect.height / 2 - window.innerHeight / 2;
      
      /* Pure Edge-to-Edge math scaling */
      const s  = Math.min(window.innerWidth / rect.width, window.innerHeight / rect.height);
      
      modalContent.style.width  = `${rect.width}px`;
      modalContent.style.height = `${rect.height}px`;
      modalContent.style.transition = 'none'; 
      modalContent.style.setProperty('--tx', `${tx}px`);
      modalContent.style.setProperty('--ty', `${ty}px`);
      modalContent.style.setProperty('--s', '1');
      modalContent.style.opacity = '1';
      img.style.opacity = '0';
      modalContent.offsetHeight; // Force reflow
      
      backdrop.classList.add('visible'); closeBtn.classList.add('visible');
      document.body.classList.add('card-expanded');
      
      lockScroll(); isExpanded = true;
      requestAnimationFrame(() => {
        modalContent.style.transition = ''; 
        modalContent.style.setProperty('--tx', '0px'); 
        modalContent.style.setProperty('--ty', '0px');
        modalContent.style.setProperty('--s', `${s}`);
        modalContent.classList.add('expanded'); 
        updateArrows();
      });
    }

    function openModal(img, grid) {
      if (isExpanded) return;
      activeImg = img;
      currentImages = grid ? Array.from(grid.querySelectorAll('.content-image')) : [img];
      currentIdx = currentImages.indexOf(img);
      modalImage.src = img.src; expandImage(img);
    }

    function closeModal() {
      if (!isExpanded || !activeImg) return;

      const rect = activeImg.getBoundingClientRect();
      const tx = rect.left + rect.width  / 2 - window.innerWidth  / 2;
      const ty = rect.top  + rect.height / 2 - window.innerHeight / 2;
      
      backdrop.classList.remove('visible'); closeBtn.classList.remove('visible');
      document.body.classList.remove('card-expanded');
      
      modalContent.classList.remove('expanded');
      modalContent.style.setProperty('--tx', `${tx}px`); 
      modalContent.style.setProperty('--ty', `${ty}px`); 
      modalContent.style.setProperty('--s', '1');
      
      prevBtn.classList.remove('visible'); nextBtn.classList.remove('visible');
      isExpanded = false;
      
      setTimeout(() => {
        if (!isExpanded) {
          imageModal.style.transform = '';
          activeImg.style.opacity = '1'; 
          modalContent.style.opacity = '0'; 
          activeImg = null;

          document.documentElement.style.scrollBehavior = 'auto';
          unlockScroll();
          requestAnimationFrame(() => {
            document.documentElement.style.scrollBehavior = '';
          });
        }
      }, 600);
    }

    function updateArrows() {
      if (currentImages.length <= 1) { prevBtn.classList.remove('visible'); nextBtn.classList.remove('visible'); return; }
      currentIdx > 0 ? prevBtn.classList.add('visible') : prevBtn.classList.remove('visible');
      currentIdx < currentImages.length - 1 ? nextBtn.classList.add('visible') : nextBtn.classList.remove('visible');
    }

    function goNext(e) {
      if (e) e.stopPropagation();
      if (currentIdx >= currentImages.length - 1) return;
      const newImg = currentImages[++currentIdx];
      
      activeImg.style.opacity = '1'; activeImg = newImg; 
      newImg.style.opacity = '0'; modalImage.style.opacity = '0';
      
      const parentGrid = newImg.closest('.content-image-grid');
      if (parentGrid) {
        parentGrid.style.scrollBehavior = 'auto';
        parentGrid.scrollLeft = newImg.offsetLeft;
      }

      setTimeout(() => {
        const r = newImg.getBoundingClientRect();
        const s  = Math.min(window.innerWidth / r.width, window.innerHeight / r.height);
        modalContent.style.width=`${r.width}px`; modalContent.style.height=`${r.height}px`;
        modalContent.style.setProperty('--s',`${s}`); modalImage.src=newImg.src; modalImage.style.opacity='1';
      }, 150);
      updateArrows();
    }

    function goPrev(e) {
      if (e) e.stopPropagation();
      if (currentIdx <= 0) return;
      const newImg = currentImages[--currentIdx];
      
      activeImg.style.opacity = '1'; activeImg = newImg; 
      newImg.style.opacity = '0'; modalImage.style.opacity = '0';
      
      const parentGrid = newImg.closest('.content-image-grid');
      if (parentGrid) {
        parentGrid.style.scrollBehavior = 'auto';
        parentGrid.scrollLeft = newImg.offsetLeft;
      }

      setTimeout(() => {
        const r = newImg.getBoundingClientRect();
        const s  = Math.min(window.innerWidth / r.width, window.innerHeight / r.height);
        modalContent.style.width=`${r.width}px`; modalContent.style.height=`${r.height}px`;
        modalContent.style.setProperty('--s',`${s}`); modalImage.src=newImg.src; modalImage.style.opacity='1';
      }, 150);
      updateArrows();
    }

    nextBtn.addEventListener('click', goNext);
    prevBtn.addEventListener('click', goPrev);
    closeBtn.addEventListener('click', closeModal);
    backdrop.addEventListener('click', closeModal);
    modalContent.addEventListener('click', closeModal);
    
    document.addEventListener('keydown', e => {
      if (!isExpanded) return;
      if (e.key === 'ArrowRight') goNext(e);
      if (e.key === 'ArrowLeft')  goPrev(e);
      if (e.key === 'Escape')     closeModal();
    });

    let mts = 0;
    modalContent.addEventListener('touchstart', e => { mts = e.changedTouches[0].screenX; }, { passive: true });
    modalContent.addEventListener('touchend',   e => {
      const mte = e.changedTouches[0].screenX;
      if (mte < mts - 50) goNext(); if (mte > mts + 50) goPrev();
    }, { passive: true });

    // Drag-to-scroll grids
    grids.forEach(grid => {
      let isDown = false, startX, scrollLeft, isDragging = false;
      grid.addEventListener('mousedown',  e => { isDown = true; isDragging = false; grid.classList.add('grabbing'); startX = e.pageX - grid.offsetLeft; scrollLeft = grid.scrollLeft; });
      grid.addEventListener('mouseleave', () => { if (!isDown) return; isDown = false; grid.classList.remove('grabbing'); resetGrid(); });
      grid.addEventListener('mouseup',    () => { if (!isDown) return; isDown = false; grid.classList.remove('grabbing'); resetGrid(); });
      grid.addEventListener('mousemove',  e => {
        if (!isDown) return; e.preventDefault();
        const walk = (e.pageX - grid.offsetLeft - startX) * 1.5;
        if (Math.abs(walk) > 5) isDragging = true;
        const target = scrollLeft - walk, max = grid.scrollWidth - grid.clientWidth;
        if      (target < 0)   { grid.scrollLeft = 0;   grid.style.transform = `translate3d(${-target * 0.25}px,0,0)`; }
        else if (target > max) { grid.scrollLeft = max;  grid.style.transform = `translate3d(${-(target-max)*0.25}px,0,0)`; }
        else                   { grid.style.transform = 'translate3d(0px,0,0)'; grid.scrollLeft = target; }
      });
      function resetGrid() { grid.style.transition='transform 0.4s cubic-bezier(0.25,1,0.5,1)'; grid.style.transform='translate3d(0px,0,0)'; setTimeout(()=>grid.style.transition='',400); }
      grid.addEventListener('click', e => {
        if (isDragging) { e.preventDefault(); e.stopPropagation(); return; }
        const img = e.target.closest('.content-image'); if (img) openModal(img, grid);
      });
    });

    document.querySelectorAll('.content-image-grid .content-image').forEach(img => img.addEventListener('dragstart', e => e.preventDefault()));
    document.querySelectorAll('.content-image').forEach(img => {
      const check = () => { if (img.naturalWidth === img.naturalHeight && img.naturalWidth > 0) img.classList.add('square'); };
      if (img.complete) check(); else img.addEventListener('load', check);
    });
  }

  return { initTheme, attachThemeToggle, splitFlipText, observeReveal, smoothScrollTop, initScrollToTop, initScrollProgress, revealOnLoad, initImageGallery };
})();

// Auto-init: theme must run before first paint (called inline too, this is a safety net)
RZ.initTheme();
RZ.attachThemeToggle();