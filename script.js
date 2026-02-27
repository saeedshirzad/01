/**
 * Cabino_On – Premium Cabinet Design & Installation
 * script.js | Vanilla JavaScript
 * =====================================================
 */

'use strict';

/* ── Utility: Helper Functions ─────────────────────── */

/**
 * Converts a number to Persian (Farsi) numerals
 * @param {number|string} num
 * @returns {string}
 */
function toPersianNum(num) {
  const persianDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
  return String(num).replace(/[0-9]/g, d => persianDigits[+d]);
}

/**
 * Formats a number with commas and converts to Persian
 * @param {number} num
 * @returns {string}
 */
function formatPrice(num) {
  return toPersianNum(num.toLocaleString('en-US'));
}

/**
 * Selects an element or returns null
 */
const $ = (sel, ctx = document) => ctx.querySelector(sel);
const $$ = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];

/* ══════════════════════════════════════════════════
   1. STICKY HEADER
══════════════════════════════════════════════════ */
(function initStickyHeader() {
  const header = $('#header');
  if (!header) return;

  let ticking = false;

  const updateHeader = () => {
    if (window.scrollY > 20) {
      header.classList.add('scrolled');
    } else {
      header.classList.remove('scrolled');
    }
    ticking = false;
  };

  window.addEventListener('scroll', () => {
    if (!ticking) {
      requestAnimationFrame(updateHeader);
      ticking = true;
    }
  }, { passive: true });
})();

/* ══════════════════════════════════════════════════
   2. MOBILE NAVIGATION TOGGLE
══════════════════════════════════════════════════ */
(function initMobileNav() {
  const toggle = $('#navToggle');
  const menu   = $('#navMenu');
  if (!toggle || !menu) return;

  const openMenu = () => {
    menu.classList.add('open');
    toggle.setAttribute('aria-expanded', 'true');
    document.body.style.overflow = 'hidden';
    // Animate hamburger to X
    const spans = $$('span', toggle);
    if (spans[0]) spans[0].style.transform = 'rotate(45deg) translate(5px, 5px)';
    if (spans[1]) spans[1].style.opacity   = '0';
    if (spans[2]) spans[2].style.transform = 'rotate(-45deg) translate(5px, -5px)';
  };

  const closeMenu = () => {
    menu.classList.remove('open');
    toggle.setAttribute('aria-expanded', 'false');
    document.body.style.overflow = '';
    const spans = $$('span', toggle);
    spans.forEach(s => { s.style.transform = ''; s.style.opacity = ''; });
  };

  toggle.addEventListener('click', () => {
    menu.classList.contains('open') ? closeMenu() : openMenu();
  });

  // Close on nav link click
  $$('.nav__link', menu).forEach(link => {
    link.addEventListener('click', closeMenu);
  });

  // Close on outside click
  document.addEventListener('click', (e) => {
    if (!menu.contains(e.target) && !toggle.contains(e.target)) {
      closeMenu();
    }
  });
})();

/* ══════════════════════════════════════════════════
   3. SCROLL REVEAL ANIMATIONS
══════════════════════════════════════════════════ */
(function initScrollReveal() {
  const elements = $$('.reveal');
  if (!elements.length) return;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        // Stagger children if parent is a grid container
        const delay = entry.target.dataset.delay || 0;
        setTimeout(() => {
          entry.target.classList.add('visible');
        }, delay * 100);
        observer.unobserve(entry.target);
      }
    });
  }, {
    threshold: 0.12,
    rootMargin: '0px 0px -60px 0px'
  });

  elements.forEach((el, i) => {
    // Auto-stagger siblings
    const siblings = el.parentElement ? $$('.reveal', el.parentElement) : [];
    const siblingIndex = siblings.indexOf(el);
    if (siblingIndex > 0) {
      el.style.transitionDelay = `${siblingIndex * 0.08}s`;
    }
    observer.observe(el);
  });
})();

/* ══════════════════════════════════════════════════
   4. ANIMATED COUNTER (Hero Stats)
══════════════════════════════════════════════════ */
(function initCounters() {
  const counters = $$('.stat__number[data-target]');
  if (!counters.length) return;

  const easeOut = (t) => 1 - Math.pow(1 - t, 3);

  const animateCounter = (el) => {
    const target   = parseInt(el.dataset.target, 10);
    const duration = 2000; // ms
    const start    = performance.now();

    const tick = (now) => {
      const elapsed  = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const value    = Math.round(easeOut(progress) * target);

      el.textContent = toPersianNum(value);

      if (progress < 1) {
        requestAnimationFrame(tick);
      } else {
        el.textContent = toPersianNum(target);
      }
    };

    requestAnimationFrame(tick);
  };

  // Trigger counter when stat enters viewport
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        animateCounter(entry.target);
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.5 });

  counters.forEach(c => observer.observe(c));
})();

/* ══════════════════════════════════════════════════
   5. PRICE CALCULATOR
══════════════════════════════════════════════════ */
(function initCalculator() {
  const calcBtn           = $('#calcBtn');
  const resultPlaceholder = $('#resultPlaceholder');
  const resultOutput      = $('#resultOutput');
  const priceValue        = $('#priceValue');
  const upperAreaEl       = $('#upperArea');
  const lowerAreaEl       = $('#lowerArea');
  const totalAreaEl       = $('#totalArea');

  // Base price per square meter in Tomans (تومان)
  const BASE_PRICE_PER_SQM = 18_000_000; // ۱۸ میلیون تومان

  if (!calcBtn) return;

  const showError = (inputEl, msg) => {
    inputEl.style.borderColor = '#FF453A';
    inputEl.style.boxShadow   = '0 0 0 4px rgba(255,69,58,0.2)';
    inputEl.placeholder       = msg;
    inputEl.value             = '';
    setTimeout(() => {
      inputEl.style.borderColor = '';
      inputEl.style.boxShadow   = '';
    }, 2000);
  };

  const animateValue = (el, newVal) => {
    el.classList.remove('animating');
    void el.offsetWidth; // force reflow
    el.textContent = newVal;
    el.classList.add('animating');
  };

  calcBtn.addEventListener('click', () => {
    const lengthEl   = $('#roomLength');
    const widthEl    = $('#roomWidth');
    const heightEl   = $('#roomHeight');
    const typeEl     = $('#cabinetType');
    const materialEl = $('#materialType');

    const length   = parseFloat(lengthEl.value);
    const width    = parseFloat(widthEl.value);
    const height   = parseFloat(heightEl.value);
    const typeMul  = parseFloat(typeEl.value);
    const matMul   = parseFloat(materialEl.value);

    // Validation
    let isValid = true;
    if (!length || length < 1 || length > 20) { showError(lengthEl, 'بین ۱ تا ۲۰ متر'); isValid = false; }
    if (!width  || width  < 1 || width  > 20) { showError(widthEl,  'بین ۱ تا ۲۰ متر'); isValid = false; }
    if (!height || height < 2 || height > 5)  { showError(heightEl, 'بین ۲ تا ۵ متر');  isValid = false; }

    if (!isValid) return;

    // Calculation logic:
    // Perimeter of room (assuming L-shape usage on 2 walls)
    const perimeter = (length + width) * 2 * 0.6; // ~60% of perimeter covered

    // Upper cabinets: height above counter to ceiling ≈ (height - 0.85) * 0.65
    const upperHeight = Math.max(0, (height - 0.95) * 0.65);
    const upperArea   = +(perimeter * upperHeight).toFixed(2);

    // Lower cabinets: fixed ~0.85m height
    const lowerArea   = +(perimeter * 0.85).toFixed(2);

    const totalArea   = +(upperArea + lowerArea).toFixed(2);

    // Price
    const totalPrice  = Math.round(totalArea * BASE_PRICE_PER_SQM * typeMul * matMul);

    // Show results
    resultPlaceholder.style.display = 'none';
    resultOutput.style.display      = 'flex';

    // Animate price counting up
    const finalFormatted = formatPrice(totalPrice);

    // Animate number
    const duration = 1200;
    const start    = performance.now();
    const easeOut  = t => 1 - Math.pow(1 - t, 3);

    const tick = (now) => {
      const progress = Math.min((now - start) / duration, 1);
      const value    = Math.round(easeOut(progress) * totalPrice);
      priceValue.textContent = formatPrice(value);
      if (progress < 1) {
        requestAnimationFrame(tick);
      } else {
        priceValue.textContent = finalFormatted;
      }
    };
    requestAnimationFrame(tick);
    priceValue.classList.add('animating');

    // Update detail rows
    upperAreaEl.textContent = toPersianNum(upperArea) + ' m²';
    lowerAreaEl.textContent = toPersianNum(lowerArea) + ' m²';
    totalAreaEl.textContent = toPersianNum(totalArea) + ' m²';

    // Scroll result into view smoothly
    resultOutput.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  });

  // Live input formatting
  ['roomLength', 'roomWidth', 'roomHeight'].forEach(id => {
    const el = document.getElementById(id);
    if (!el) return;
    el.addEventListener('input', () => {
      el.style.borderColor = '';
      el.style.boxShadow   = '';
    });
  });
})();

/* ══════════════════════════════════════════════════
   6. GALLERY FILTER
══════════════════════════════════════════════════ */
(function initGalleryFilter() {
  const filterBtns  = $$('.filter-btn');
  const galleryItems = $$('.gallery-item');

  if (!filterBtns.length) return;

  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      // Update active state
      filterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      const filter = btn.dataset.filter;

      galleryItems.forEach((item, i) => {
        const category = item.dataset.category;
        const shouldShow = filter === 'all' || category === filter;

        if (shouldShow) {
          item.style.display = '';
          // Re-trigger animation
          item.style.opacity = '0';
          item.style.transform = 'scale(0.95)';
          setTimeout(() => {
            item.style.transition = 'opacity 0.4s ease, transform 0.4s ease';
            item.style.opacity    = '1';
            item.style.transform  = 'scale(1)';
          }, i * 50);
        } else {
          item.style.opacity    = '0';
          item.style.transform  = 'scale(0.9)';
          setTimeout(() => { item.style.display = 'none'; }, 300);
        }
      });
    });
  });
})();

/* ══════════════════════════════════════════════════
   7. TESTIMONIALS SLIDER (Mobile)
══════════════════════════════════════════════════ */
(function initTestimonials() {
  const track = $('#testimonialsTrack');
  const dots  = $$('.dot');
  if (!track || !dots.length) return;

  let current = 0;
  const cards = $$('.testimonial-card', track);

  const isMobile = () => window.innerWidth <= 768;

  const showCard = (index) => {
    if (!isMobile()) return;
    cards.forEach((card, i) => {
      card.style.display = i === index ? '' : 'none';
    });
    dots.forEach((d, i) => d.classList.toggle('active', i === index));
  };

  const initSlider = () => {
    if (isMobile()) {
      showCard(current);
      document.querySelector('.testimonials__dots').style.display = 'flex';
    } else {
      cards.forEach(c => c.style.display = '');
      document.querySelector('.testimonials__dots').style.display = 'none';
    }
  };

  dots.forEach(dot => {
    dot.addEventListener('click', () => {
      current = parseInt(dot.dataset.index, 10);
      showCard(current);
    });
  });

  // Auto-advance on mobile
  setInterval(() => {
    if (!isMobile()) return;
    current = (current + 1) % cards.length;
    showCard(current);
  }, 5000);

  window.addEventListener('resize', initSlider, { passive: true });
  initSlider();
})();

/* ══════════════════════════════════════════════════
   8. SMOOTH SCROLL FOR ANCHOR LINKS
══════════════════════════════════════════════════ */
(function initSmoothScroll() {
  $$('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', (e) => {
      const target = document.querySelector(anchor.getAttribute('href'));
      if (!target) return;
      e.preventDefault();
      const headerHeight = 72;
      const targetPos    = target.getBoundingClientRect().top + window.scrollY - headerHeight;
      window.scrollTo({ top: targetPos, behavior: 'smooth' });
    });
  });
})();

/* ══════════════════════════════════════════════════
   9. BACK TO TOP BUTTON
══════════════════════════════════════════════════ */
(function initBackToTop() {
  const btn = $('#backToTop');
  if (!btn) return;

  window.addEventListener('scroll', () => {
    btn.classList.toggle('visible', window.scrollY > 600);
  }, { passive: true });

  btn.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
})();

/* ══════════════════════════════════════════════════
   10. ACTIVE NAV LINK ON SCROLL
══════════════════════════════════════════════════ */
(function initActiveNav() {
  const sections = $$('section[id]');
  const navLinks = $$('.nav__link');
  if (!sections.length || !navLinks.length) return;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const id = entry.target.id;
        navLinks.forEach(link => {
          const href = link.getAttribute('href').replace('#', '');
          link.classList.toggle('nav__link--active', href === id);
          if (href === id) {
            link.style.color = 'var(--color-emerald)';
          } else {
            link.style.color = '';
          }
        });
      }
    });
  }, { threshold: 0.4, rootMargin: '-72px 0px 0px 0px' });

  sections.forEach(s => observer.observe(s));
})();

/* ══════════════════════════════════════════════════
   11. CABINET DOOR HOVER INTERACTION (Hero)
══════════════════════════════════════════════════ */
(function initCabinetInteraction() {
  const doors = $$('.cabinet-door');
  doors.forEach(door => {
    door.addEventListener('mouseenter', () => {
      door.style.transform = 'scaleX(1.04)';
    });
    door.addEventListener('mouseleave', () => {
      door.style.transform = '';
    });
  });
})();

/* ══════════════════════════════════════════════════
   12. PARALLAX HERO ORBS
══════════════════════════════════════════════════ */
(function initParallax() {
  const orbs = $$('.hero__orb');
  if (!orbs.length) return;

  const speeds = [0.03, 0.05, 0.04];

  window.addEventListener('mousemove', (e) => {
    const cx = window.innerWidth  / 2;
    const cy = window.innerHeight / 2;
    const dx = (e.clientX - cx);
    const dy = (e.clientY - cy);

    orbs.forEach((orb, i) => {
      const speed = speeds[i] || 0.03;
      orb.style.transform = `translate(${dx * speed}px, ${dy * speed}px)`;
    });
  }, { passive: true });
})();

/* ══════════════════════════════════════════════════
   13. PAGE LOAD ANIMATION
══════════════════════════════════════════════════ */
(function initPageLoad() {
  document.documentElement.style.opacity = '0';
  document.documentElement.style.transition = 'opacity 0.5s ease';

  window.addEventListener('load', () => {
    document.documentElement.style.opacity = '1';

    // Trigger hero elements with stagger
    const heroReveal = $$('.hero .reveal');
    heroReveal.forEach((el, i) => {
      setTimeout(() => {
        el.classList.add('visible');
      }, 200 + i * 120);
    });
  });
})();

/* ══════════════════════════════════════════════════
   14. FORM INPUT: Persian numerals in inputs (UX)
══════════════════════════════════════════════════ */
(function initFormUX() {
  // Show character count hint and auto-format dimension inputs
  const dimInputs = $$('#roomLength, #roomWidth, #roomHeight');
  dimInputs.forEach(input => {
    input.addEventListener('keydown', (e) => {
      // Allow: backspace, delete, tab, escape, enter
      const allowed = [8, 9, 27, 13, 46, 37, 38, 39, 40, 110, 190];
      if (allowed.includes(e.keyCode)) return;
      // Block non-numeric
      if ((e.shiftKey || e.keyCode < 48 || e.keyCode > 57) &&
          (e.keyCode < 96 || e.keyCode > 105)) {
        e.preventDefault();
      }
    });
  });
})();

/* ── Console Signature ──────────────────────────── */
console.log(
  '%c Cabino_On ',
  'background: #0B5E38; color: #C9A84C; font-size: 18px; font-weight: bold; padding: 6px 12px; border-radius: 6px;',
  '\n🏠 طراحی و نصب کابینت پریمیوم'
);