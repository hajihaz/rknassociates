/* RKN Associates — Shared JavaScript
   Handles: preloader, navigation, language toggle (EN/TA), reveal animations,
            sticky CTA, mobile menu, WhatsApp link, form helpers, scroll effects.
*/

(function() {
  'use strict';

  // ============= LANGUAGE ============= //
  const LANG_KEY = 'rkn_lang';
  const DEFAULT_LANG = 'en';

  function getCurrentLang() {
    try {
      return localStorage.getItem(LANG_KEY) || DEFAULT_LANG;
    } catch (e) {
      return DEFAULT_LANG;
    }
  }

  function applyLang(lang) {
    if (!window.RKN_I18N || !window.RKN_I18N[lang]) return;
    const dict = window.RKN_I18N[lang];
    document.documentElement.lang = lang;

    document.querySelectorAll('[data-i18n]').forEach(el => {
      const key = el.getAttribute('data-i18n');
      if (dict[key] !== undefined) {
        // Preserve HTML tags like <br> and <em>
        if (el.getAttribute('data-i18n-html') === 'true') {
          el.innerHTML = dict[key];
        } else {
          el.textContent = dict[key];
        }
      }
    });

    document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
      const key = el.getAttribute('data-i18n-placeholder');
      if (dict[key] !== undefined) el.placeholder = dict[key];
    });

    document.querySelectorAll('[data-i18n-aria]').forEach(el => {
      const key = el.getAttribute('data-i18n-aria');
      if (dict[key] !== undefined) el.setAttribute('aria-label', dict[key]);
    });

    // Update language toggle UI state
    document.querySelectorAll('.lang-toggle button').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.lang === lang);
    });

    try { localStorage.setItem(LANG_KEY, lang); } catch (e) {}
  }

  function bindLangToggle() {
    document.querySelectorAll('.lang-toggle button').forEach(btn => {
      btn.addEventListener('click', () => {
        const lang = btn.dataset.lang;
        applyLang(lang);
      });
    });
  }

  // ============= PRELOADER ============= //
  function initPreloader() {
    const pl = document.getElementById('preloader');
    if (!pl) return;
    window.addEventListener('load', () => {
      setTimeout(() => pl.classList.add('hide'), 1600);
    });
  }

  // ============= NAV ============= //
  function initNav() {
    const nav = document.querySelector('nav.rkn-nav');
    if (!nav) return;

    // Scrolled state
    let lastScroll = 0;
    const onScroll = () => {
      const y = window.scrollY;
      nav.classList.toggle('scrolled', y > 48);
      lastScroll = y;
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();

    // Mobile menu toggle
    const hamb = document.querySelector('.nav-hamburger');
    const menu = document.getElementById('mobile-menu');
    const close = document.querySelector('.mobile-close');

    if (hamb && menu) {
      hamb.addEventListener('click', () => {
        menu.classList.add('open');
        document.body.style.overflow = 'hidden';
      });
    }
    if (close && menu) {
      close.addEventListener('click', () => {
        menu.classList.remove('open');
        document.body.style.overflow = '';
      });
    }
    if (menu) {
      menu.querySelectorAll('a').forEach(a => {
        a.addEventListener('click', () => {
          menu.classList.remove('open');
          document.body.style.overflow = '';
        });
      });
    }
  }

  // ============= STICKY CTA ============= //
  function initStickyCta() {
    const sticky = document.querySelector('.sticky-cta');
    if (!sticky) return;
    const hero = document.querySelector('.home-hero, .page-hero');
    const onScroll = () => {
      const threshold = hero ? hero.offsetHeight * 0.8 : 400;
      const nearFooter = (window.innerHeight + window.scrollY) > (document.body.offsetHeight - 600);
      sticky.classList.toggle('visible', window.scrollY > threshold && !nearFooter);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  // ============= REVEAL ON SCROLL ============= //
  function initReveal() {
    const els = document.querySelectorAll('.reveal');
    if (!els.length || !('IntersectionObserver' in window)) {
      els.forEach(e => e.classList.add('visible'));
      return;
    }
    const io = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -60px 0px' });
    els.forEach(e => io.observe(e));
  }

  // ============= BACK TO TOP ============= //
  function initBackTop() {
    const btn = document.querySelector('.footer-back-top');
    if (!btn) return;
    btn.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  // ============= LOAD IMAGES FROM LIBRARY ============= //
  function loadImages() {
    if (!window.RKN_IMG && !window.RKN_MISC) return;

    // Logos referenced by class
    document.querySelectorAll('[data-img="logo"]').forEach(el => {
      if (window.RKN_MISC && window.RKN_MISC.logo) el.src = window.RKN_MISC.logo;
    });

    document.querySelectorAll('[data-img]').forEach(el => {
      const key = el.getAttribute('data-img');
      if (key === 'logo') return;  // handled above

      // WWA / award / misc keys
      if (window.RKN_MISC && window.RKN_MISC[key]) {
        el.src = window.RKN_MISC[key];
        return;
      }

      // Project image IDs
      if (window.RKN_IMG && window.RKN_IMG[key]) {
        const variant = el.getAttribute('data-variant') || 'web';
        const src = window.RKN_IMG[key][variant] || window.RKN_IMG[key].web;
        if (src) {
          el.src = src;
          // Add alt if missing
          if (!el.alt && window.RKN_META && window.RKN_META[key]) {
            el.alt = window.RKN_META[key].title;
          }
        }
      }
    });

    // Background images
    document.querySelectorAll('[data-bg-img]').forEach(el => {
      const key = el.getAttribute('data-bg-img');
      if (window.RKN_MISC && window.RKN_MISC[key]) {
        el.style.backgroundImage = `url('${window.RKN_MISC[key]}')`;
      } else if (window.RKN_IMG && window.RKN_IMG[key]) {
        const variant = el.getAttribute('data-variant') || 'web';
        const src = window.RKN_IMG[key][variant] || window.RKN_IMG[key].web;
        if (src) el.style.backgroundImage = `url('${src}')`;
      }
    });
  }

  // ============= WHATSAPP LINK BUILDER ============= //
  function buildWhatsAppUrl(message) {
    const num = '919489486081';
    const msg = message || 'Hi, I\'m interested in discussing a project with RKN Associates.';
    return `https://wa.me/${num}?text=${encodeURIComponent(msg)}`;
  }

  // ============= QUOTE FORM SUBMISSION ============= //
  function initQuoteForm() {
    document.querySelectorAll('.cfc-form[data-quote-form], .rkn-form[data-quote-form]').forEach(form => {
      form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const lang = getCurrentLang();
        const dict = (window.RKN_I18N && window.RKN_I18N[lang]) || window.RKN_I18N.en;

        const data = {
          name: (form.querySelector('[name=name]') || {}).value || '',
          phone: (form.querySelector('[name=phone]') || {}).value || '',
          type: (form.querySelector('[name=project_type]') || {}).value || '',
          timeline: (form.querySelector('[name=timeline]') || {}).value || '',
          message: (form.querySelector('[name=message]') || {}).value || '',
        };

        const successEl = form.querySelector('.form-success');
        const submitBtn = form.querySelector('button[type=submit]');
        if (submitBtn) submitBtn.disabled = true;

        // 1) POST to Web3Forms in the background (reliable email delivery to iamhajihaz@gmail.com)
        const formData = new FormData(form);
        try {
          if (form.action && form.action.indexOf('web3forms.com') !== -1) {
            await fetch(form.action, {
              method: 'POST',
              body: formData,
              headers: { 'Accept': 'application/json' }
            });
          }
        } catch (err) {
          // Silent fail — WhatsApp remains as the backup path
          console.warn('Web3Forms submit failed:', err);
        }

        // 2) Open WhatsApp in new tab with the same message (parallel channel)
        const body = `*New Quote Request from rknassociates.com*%0A%0A*Name:* ${encodeURIComponent(data.name)}%0A*Phone:* ${encodeURIComponent(data.phone)}%0A*Project Type:* ${encodeURIComponent(data.type)}%0A*Timeline:* ${encodeURIComponent(data.timeline)}%0A%0A*Message:*%0A${encodeURIComponent(data.message)}`;
        const waUrl = `https://wa.me/919489486081?text=${body}`;
        window.open(waUrl, '_blank');

        // 3) Success state on-page (no navigation)
        if (successEl) {
          successEl.textContent = dict.form_success || 'Thank you. We will respond within 24 hours.';
          successEl.classList.add('visible');
        }
        form.reset();
        if (submitBtn) submitBtn.disabled = false;

        setTimeout(() => {
          if (successEl) successEl.classList.remove('visible');
        }, 6000);
      });
    });
  }

  // ============= CURRENT YEAR ============= //
  function initYear() {
    document.querySelectorAll('[data-year]').forEach(el => {
      el.textContent = new Date().getFullYear();
    });
  }

  // ============= INITIALIZATION ============= //
  function init() {
    loadImages();
    applyLang(getCurrentLang());
    bindLangToggle();
    initPreloader();
    initNav();
    initStickyCta();
    initReveal();
    initBackTop();
    initQuoteForm();
    initYear();

    // Expose a couple utilities
    window.RKN = window.RKN || {};
    window.RKN.buildWhatsAppUrl = buildWhatsAppUrl;
    window.RKN.applyLang = applyLang;
    window.RKN.getCurrentLang = getCurrentLang;
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();

/* =========================================================
   v5 ADDITIONS — Cursor, Tilt, Spotlight, Stamp, About Hero Reveal
   ========================================================= */
(function() {
  'use strict';

  // Utility: detect touch/pointer coarse devices
  const isTouch = window.matchMedia('(hover: none), (pointer: coarse)').matches;
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ============= CUSTOM GOLD RING CURSOR (desktop only) =============
  function initCursor() {
    if (isTouch || reduceMotion) return;
    if (document.querySelector('.rkn-cursor-ring')) return;

    const ring = document.createElement('div');
    ring.className = 'rkn-cursor-ring';
    document.body.appendChild(ring);

    const dot = document.createElement('div');
    dot.className = 'rkn-cursor-dot';
    document.body.appendChild(dot);

    document.body.classList.add('cursor-enabled');

    let mouseX = 0, mouseY = 0;
    let ringX = 0, ringY = 0;

    document.addEventListener('mousemove', (e) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
      dot.style.transform = `translate(${mouseX}px, ${mouseY}px) translate(-50%, -50%)`;
      ring.classList.add('visible');
      dot.classList.add('visible');
    });

    document.addEventListener('mouseleave', () => {
      ring.classList.remove('visible');
      dot.classList.remove('visible');
    });

    function updateRing() {
      const dx = mouseX - ringX;
      const dy = mouseY - ringY;
      ringX += dx * 0.18;
      ringY += dy * 0.18;
      ring.style.transform = `translate(${ringX}px, ${ringY}px) translate(-50%, -50%)`;
      requestAnimationFrame(updateRing);
    }
    requestAnimationFrame(updateRing);

    // Hover states on interactive elements
    const hoverSelectors = 'a, button, .filter-chip, .btn-gold, .btn-outline-dark, .btn-outline-ivory, .nav-hamburger, .lang-toggle button, input[type="submit"], .wa-block, .mo-directions, .faq-q, .gallery-item, .landmark-tile, .polaroid, .award-card-new, .leader-card';
    document.addEventListener('mouseover', (e) => {
      if (e.target.closest && e.target.closest(hoverSelectors)) {
        ring.classList.add('hovering');
      }
    });
    document.addEventListener('mouseout', (e) => {
      if (e.target.closest && e.target.closest(hoverSelectors)) {
        ring.classList.remove('hovering');
      }
    });
  }

  // ============= SPOTLIGHT GLOW (dark sections) =============
  function initSpotlight() {
    if (isTouch || reduceMotion) return;
    document.querySelectorAll('.rkn-spotlight').forEach((el) => {
      el.addEventListener('mousemove', (e) => {
        const rect = el.getBoundingClientRect();
        const x = ((e.clientX - rect.left) / rect.width) * 100;
        const y = ((e.clientY - rect.top) / rect.height) * 100;
        el.style.setProperty('--spotlight-x', `${x}%`);
        el.style.setProperty('--spotlight-y', `${y}%`);
        el.classList.add('active');
      });
      el.addEventListener('mouseleave', () => {
        el.classList.remove('active');
      });
    });
  }

  // ============= IMAGE TILT =============
  function initTilt() {
    if (isTouch || reduceMotion) return;
    document.querySelectorAll('.rkn-tilt').forEach((el) => {
      el.addEventListener('mousemove', (e) => {
        const rect = el.getBoundingClientRect();
        const x = ((e.clientX - rect.left) / rect.width) - 0.5;
        const y = ((e.clientY - rect.top) / rect.height) - 0.5;
        const rotY = x * 6;    // max 6deg
        const rotX = -y * 6;
        el.style.transform = `perspective(1000px) rotateX(${rotX}deg) rotateY(${rotY}deg) translateZ(0)`;
      });
      el.addEventListener('mouseleave', () => {
        el.style.transform = 'perspective(1000px) rotateX(0) rotateY(0) translateZ(0)';
      });
    });
  }

  // ============= 12+ STAMP / SEAL ANIMATION =============
  function initStamp() {
    const containers = document.querySelectorAll('.stamp-container');
    if (!containers.length) return;

    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('stamped');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.4 });

    containers.forEach((c) => io.observe(c));
  }

  // ============= ABOUT HERO PHOTO REVEAL =============
  function initAboutHeroReveal() {
    const photo = document.querySelector('.ahn-photo');
    if (!photo) return;

    // Always auto-reveal once on load (gives a baseline for users who don't scroll)
    setTimeout(() => { photo.classList.add('mid-reveal'); }, 600);
    setTimeout(() => { photo.classList.add('revealed'); photo.classList.remove('mid-reveal'); }, 2400);

    // Also tie to scroll, for scroll-active users
    let scrollTicking = false;
    function onScroll() {
      if (scrollTicking) return;
      scrollTicking = true;
      requestAnimationFrame(() => {
        const rect = photo.getBoundingClientRect();
        const vh = window.innerHeight;
        // When the photo is at least 40% visible, ensure it's revealed
        if (rect.top < vh * 0.8 && rect.bottom > vh * 0.2) {
          photo.classList.add('revealed');
          photo.classList.remove('mid-reveal');
        }
        scrollTicking = false;
      });
    }
    window.addEventListener('scroll', onScroll, { passive: true });
  }

  // ============= INITIALIZATION =============
  function initV5() {
    initCursor();
    initSpotlight();
    initTilt();
    initStamp();
    initAboutHeroReveal();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initV5);
  } else {
    initV5();
  }
})();
