/* =====================================================================
   VILLAS BUKIT — Partner Villas  |  vanilla JS
   ===================================================================== */
(function () {
  'use strict';
  const $ = (s, c) => (c || document).querySelector(s);
  const $$ = (s, c) => Array.from((c || document).querySelectorAll(s));

  /* ---------- NAV: hide on scroll down, show on scroll up ---------- */
  const nav = $('#navbar');
  let lastY = window.scrollY;
  window.addEventListener('scroll', () => {
    const y = window.scrollY;
    if (nav) {
      if (y > 90 && y > lastY + 4) nav.style.transform = 'translateY(-100%)';
      else if (y < lastY - 4 || y < 120) nav.style.transform = 'translateY(0)';
    }
    lastY = y;
  }, { passive: true });

  /* ---------- MOBILE MENU ---------- */
  const burger = $('#burger');
  const mobileMenu = $('#mobileMenu');
  function toggleMenu(force) {
    if (!mobileMenu) return;
    const open = force !== undefined ? force : !mobileMenu.classList.contains('active');
    mobileMenu.classList.toggle('active', open);
    burger.classList.toggle('active', open);
    document.body.style.overflow = open ? 'hidden' : '';
  }
  if (burger) {
    burger.addEventListener('click', () => toggleMenu());
    burger.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggleMenu(); }
    });
  }
  $$('.mobile-menu .m-toggle').forEach((t) => {
    t.addEventListener('click', (e) => {
      e.preventDefault();
      const sub = t.nextElementSibling;
      t.classList.toggle('open');
      if (sub) sub.classList.toggle('open');
    });
  });
  $$('.mobile-menu a:not(.m-toggle)').forEach((a) =>
    a.addEventListener('click', () => toggleMenu(false))
  );

  /* ---------- SCROLL REVEAL ---------- */
  const reveals = $$('.reveal, .reveal-l, .reveal-r');
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((en) => {
        if (en.isIntersecting) { en.target.classList.add('visible'); io.unobserve(en.target); }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });
    reveals.forEach((el) => io.observe(el));
  } else {
    reveals.forEach((el) => el.classList.add('visible'));
  }

  /* ---------- SMOOTH SCROLL for in-page anchors ---------- */
  $$('a[href^="#"]').forEach((a) => {
    a.addEventListener('click', (e) => {
      const id = a.getAttribute('href');
      if (id.length < 2) return;
      const target = $(id);
      if (!target) return;
      e.preventDefault();
      const navH = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--nav')) || 78;
      const top = target.getBoundingClientRect().top + window.scrollY - navH - 12;
      window.scrollTo({ top, behavior: 'smooth' });
    });
  });

  /* ---------- GALLERY LIGHTBOX ---------- */
  const lb = $('#lightbox');
  const lbImg = $('#lbImg');
  const grid = $('#galleryGrid');
  let gallerySrcs = grid ? $$('[data-full]', grid).map((el) => el.getAttribute('data-full')) : [];
  let lbIndex = 0;

  /* "+N" overlay on the last visible tile so the full photo count is clear */
  if (grid) {
    const tiles = $$('.gallery-item', grid);
    const extra = gallerySrcs.length - tiles.length;
    if (tiles.length && extra > 0) {
      const more = document.createElement('span');
      more.className = 'gallery-more';
      more.innerHTML = '+' + extra + '<small>Photos</small>';
      tiles[tiles.length - 1].appendChild(more);
    }
  }

  function openLb(i) {
    if (!gallerySrcs.length || !lb) return;
    lbIndex = (i + gallerySrcs.length) % gallerySrcs.length;
    lbImg.src = gallerySrcs[lbIndex];
    lb.classList.add('active');
    document.body.style.overflow = 'hidden';
  }
  function closeLb() { if (lb) { lb.classList.remove('active'); document.body.style.overflow = ''; } }
  $$('.gallery-item').forEach((item) => {
    item.addEventListener('click', () => {
      const img = $('img', item);
      const full = img && img.getAttribute('data-full');
      openLb(Math.max(0, gallerySrcs.indexOf(full)));
    });
  });
  const vfg = $('#viewFullGallery');
  if (vfg) vfg.addEventListener('click', () => openLb(0));
  $('#lbClose') && $('#lbClose').addEventListener('click', closeLb);
  $('#lbNext') && $('#lbNext').addEventListener('click', () => openLb(lbIndex + 1));
  $('#lbPrev') && $('#lbPrev').addEventListener('click', () => openLb(lbIndex - 1));
  lb && lb.addEventListener('click', (e) => { if (e.target === lb) closeLb(); });

  /* ---------- BOOKING: jump to the always-visible Smoobu tool ----------
     The real Smoobu booking tool self-initialises inline in the #booking
     section, so the hero/nav CTAs just smooth-scroll to it. */
  $$('[data-open-booking]').forEach((b) =>
    b.addEventListener('click', (e) => {
      e.preventDefault();
      toggleMenu(false);
      const target = $('#booking');
      if (!target) return;
      const navH = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--nav')) || 78;
      const top = target.getBoundingClientRect().top + window.scrollY - navH - 12;
      window.scrollTo({ top, behavior: 'smooth' });
    })
  );

  /* ---------- SMOOBU CALENDAR: strip inline sizing so CSS controls layout ----------
     Smoobu hard-codes inline !important styles that beat our stylesheet:
       • style="width:26px;height:26px;line-height:26px !important" on every <td>
       • style="margin-right/left:…px !important" on each month's .calendar (its
         desktop centre gutter) — this pushes the 2nd month past the card edge,
         clipping its last column on desktop and, when the months stack on mobile,
         offsetting them so they're no longer centred (month 1 left, month 2 right).
     We strip both once the widget renders and again whenever the user navigates
     months (re-render). Inter-month spacing then comes purely from our flexbox
     gap, so both months stay aligned at every width. */
  const calWrap = $('#calWrap') || $('.calendar-wrap');
  if (calWrap && 'MutationObserver' in window) {
    const cleanCal = () => {
      $$('table td[style]', calWrap).forEach((td) => td.removeAttribute('style'));
      $$('.calendar', calWrap).forEach((cal) => {
        cal.style.removeProperty('margin-left');
        cal.style.removeProperty('margin-right');
      });
    };
    // attribute changes aren't observed, so our edits won't re-trigger this
    new MutationObserver(cleanCal).observe(calWrap, { childList: true, subtree: true });
    cleanCal();
  }

  /* ---------- GLOBAL KEYS ---------- */
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') { closeLb(); toggleMenu(false); }
    if (lb && lb.classList.contains('active')) {
      if (e.key === 'ArrowRight') openLb(lbIndex + 1);
      if (e.key === 'ArrowLeft') openLb(lbIndex - 1);
    }
  });
})();
