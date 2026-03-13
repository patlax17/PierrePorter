/* ─── 
   Pierre Porter Creator Hub — script.js
   Handles: Navbar, Scroll Animations, Animated Counters,
            3D Sound Button, Soundboard, Form, Confetti
─── */

'use strict';

/* ============================================================
   NAVBAR
============================================================ */
const navbar = document.getElementById('navbar');
const hamburger = document.getElementById('hamburger');
const mobileNav = document.getElementById('mobileNav');
const mobileNavClose = document.getElementById('mobileNavClose');
const mobileLinks = document.querySelectorAll('.mobile-link');

window.addEventListener('scroll', () => {
  navbar.classList.toggle('scrolled', window.scrollY > 40);
}, { passive: true });

hamburger.addEventListener('click', () => mobileNav.classList.add('open'));
mobileNavClose.addEventListener('click', () => mobileNav.classList.remove('open'));
mobileLinks.forEach(link => link.addEventListener('click', () => mobileNav.classList.remove('open')));

/* ============================================================
   SCROLL-TRIGGERED ANIMATIONS (Intersection Observer)
============================================================ */
const animateEls = document.querySelectorAll('[data-animate]');
const statCards = document.querySelectorAll('.stat-card');

const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (!entry.isIntersecting) return;
    const el = entry.target;
    const delay = parseInt(el.dataset.delay || 0);
    setTimeout(() => el.classList.add('is-visible'), delay);
    revealObserver.unobserve(el);
  });
}, { threshold: 0.12, rootMargin: '0px 0px -60px 0px' });

animateEls.forEach(el => revealObserver.observe(el));

/* Stat cards get their own observer for the bar/counter trigger */
const statObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (!entry.isIntersecting) return;
    entry.target.classList.add('is-visible');
    animateCounter(entry.target);
    statObserver.unobserve(entry.target);
  });
}, { threshold: 0.2 });

statCards.forEach(card => statObserver.observe(card));

/* ============================================================
   ANIMATED COUNTERS
============================================================ */
function animateCounter(card) {
  const numEl = card.querySelector('.stat-number');
  if (!numEl) return;
  const target = parseInt(numEl.dataset.target, 10);
  const suffix = numEl.dataset.suffix || '';
  const duration = 2000;
  const start = performance.now();

  function easeOutCubic(t) { return 1 - Math.pow(1 - t, 3); }

  function formatNum(n) {
    if (n >= 1_000_000) return (n / 1_000_000).toFixed(1).replace('.0', '') + 'M';
    if (n >= 1_000) return (n / 1_000).toFixed(0) + 'K';
    return n.toString();
  }

  function tick(now) {
    const elapsed = now - start;
    const progress = Math.min(easeOutCubic(elapsed / duration), 1);
    const current = Math.round(progress * target);
    numEl.textContent = formatNum(current) + suffix;
    if (progress < 1) requestAnimationFrame(tick);
  }

  requestAnimationFrame(tick);
}



/* ============================================================
   REEL DEAL — Lazy-load + autoplay on scroll
   Strategy: videos start with preload="none" so they don't
   all download at page load. The observer swaps to "auto"
   and calls play() only when the card enters the viewport.
============================================================ */
const reelVideos = document.querySelectorAll('.reel-video');

// Kill preload on all videos at JS-init so browser doesn't eagerly fetch
reelVideos.forEach(vid => { vid.preload = 'none'; });

const reelObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    const vid = entry.target;
    if (entry.isIntersecting) {
      // Kick off load if not already started
      if (vid.preload === 'none') {
        vid.preload = 'auto';
        vid.load();
      }
      vid.play().catch(() => {});
    } else {
      vid.pause();
    }
  });
}, { threshold: 0.35, rootMargin: '100px 0px' }); // preload slightly early

reelVideos.forEach(vid => {
  reelObserver.observe(vid);

  // Desktop hover: make sure it's loaded & playing
  const card = vid.closest('.reel-card');
  if (card) {
    card.addEventListener('mouseenter', () => {
      if (vid.preload === 'none') { vid.preload = 'auto'; vid.load(); }
      vid.play().catch(() => {});
    });
  }
});


/* ============================================================
   CONTACT FORM
============================================================ */
const form = document.getElementById('bookingForm');
const submitBtn = document.getElementById('formSubmit');
const formSuccess = document.getElementById('formSuccess');

if (form) {
  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const submitText = submitBtn.querySelector('.submit-text');
    const submitLoader = submitBtn.querySelector('.submit-loader');

    // Validate required fields
    const required = form.querySelectorAll('[required]');
    let valid = true;
    required.forEach(field => {
      if (!field.value.trim()) {
        field.style.borderColor = 'var(--red-bright)';
        valid = false;
      } else {
        field.style.borderColor = '';
      }
    });
    if (!valid) return;

    // Loading state
    submitBtn.disabled = true;
    submitText.hidden = true;
    submitLoader.hidden = false;

    // Real API submission
    try {
      const formData = new FormData(form);
      const response = await fetch('https://api.web3forms.com/submit', {
        method: 'POST',
        body: formData
      });

      if (response.ok) {
        submitBtn.hidden = true;
        formSuccess.hidden = false;
        form.reset();
      } else {
        throw new Error('Form submission failed');
      }
    } catch (error) {
      console.error(error);
      alert('Oops! Something went wrong. Please try again or reach out on Instagram.');
      submitBtn.disabled = false;
      submitText.hidden = false;
      submitLoader.hidden = true;
      return;
    }

    // Celebratory confetti
    if (window.confetti) {
      confetti({ particleCount: 150, spread: 100, origin: { y: 0.9 } });
    }
  });

  // Real-time field validation
  form.querySelectorAll('input, select, textarea').forEach(field => {
    field.addEventListener('input', () => {
      if (field.value.trim()) field.style.borderColor = '';
    });
  });
}



/* ============================================================
   SMOOTH ANCHOR SCROLLING
============================================================ */
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', (e) => {
    const target = document.querySelector(anchor.getAttribute('href'));
    if (!target) return;
    e.preventDefault();
    const offset = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--nav-h')) || 72;
    const top = target.getBoundingClientRect().top + window.scrollY - offset;
    window.scrollTo({ top, behavior: 'smooth' });
  });
});

/* ============================================================
   PARALLAX — subtle hero image drift on scroll
============================================================ */
const heroSection = document.getElementById('hero');
const heroBg = document.querySelector('.hero-food-bg');

window.addEventListener('scroll', () => {
  if (!heroSection || !heroBg) return;
  const rect = heroSection.getBoundingClientRect();
  if (rect.bottom < 0) return;
  const ry = Math.max(0, Math.min(rect.bottom / rect.height, 1));
  heroBg.style.transform = `scale(1.06) translateY(${(1 - ry) * -30}px)`;
}, { passive: true });

/* ============================================================
   STAT CARD — pulse gold border on hover
============================================================ */
document.querySelectorAll('.stat-card').forEach(card => {
  card.addEventListener('mouseenter', () => {
    card.style.borderColor = 'rgba(255,215,0,0.4)';
    card.style.boxShadow = '0 0 32px rgba(255,215,0,0.1), 0 16px 40px rgba(0,0,0,0.5)';
  });
  card.addEventListener('mouseleave', () => {
    card.style.borderColor = '';
    card.style.boxShadow = '';
  });
});

console.log('%c🍽️ MR. OH LAWWDDD — Pierre Porter Creator Hub Loaded', 'background:#e81c1c;color:#fff;padding:8px 16px;border-radius:4px;font-size:14px;font-weight:bold;');
