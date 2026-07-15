/*
OROVIAN OASIS SHOWCASE — OPTIONAL DYNAMICS LAYER
Delete this script tag or remove this file to disable enhanced motion. Navigation, cards,
pricing, floor plans, project pages, and the native <details> menu continue to work.
*/
(() => {
  'use strict';

  const root = document.documentElement;
  const body = document.body;
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  body.classList.add('motion-ready');

  // Reveal sections only after the motion-ready class exists. No JS means everything stays visible.
  const revealItems = [...document.querySelectorAll('[data-reveal]')];
  if (!reduceMotion && 'IntersectionObserver' in window) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-revealed');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });
    revealItems.forEach((item) => observer.observe(item));
  } else {
    revealItems.forEach((item) => item.classList.add('is-revealed'));
  }

  // Compact floating header disappears while scrolling down and returns when scrolling up.
  const header = document.querySelector('[data-site-header]');
  let lastY = window.scrollY;
  let ticking = false;
  const updateHeader = () => {
    const currentY = window.scrollY;
    if (header) {
      const movingDown = currentY > lastY + 7;
      const movingUp = currentY < lastY - 7;
      if (currentY < 90 || movingUp) header.classList.remove('is-hidden');
      else if (movingDown) header.classList.add('is-hidden');
    }
    lastY = currentY;
    ticking = false;
  };
  window.addEventListener('scroll', () => {
    if (!ticking) {
      window.requestAnimationFrame(updateHeader);
      ticking = true;
    }
  }, { passive: true });

  // Native details menu enhancement: close after navigation, outside click, or Escape.
  const menu = document.querySelector('[data-site-menu]');
  if (menu) {
    menu.querySelectorAll('a').forEach((link) => link.addEventListener('click', () => menu.removeAttribute('open')));
    document.addEventListener('pointerdown', (event) => {
      if (menu.open && !menu.contains(event.target)) menu.removeAttribute('open');
    });
    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') {
        menu.removeAttribute('open');
        menu.querySelector('summary')?.focus();
      }
    });
  }

  if (!reduceMotion) {
    // Pointer glow is decorative and safely absent on touch-only devices.
    const glow = document.querySelector('[data-pointer-glow]');
    if (glow && window.matchMedia('(pointer:fine)').matches) {
      window.addEventListener('pointermove', (event) => {
        glow.style.left = `${event.clientX}px`;
        glow.style.top = `${event.clientY}px`;
        glow.classList.add('is-visible');
      }, { passive: true });
      document.documentElement.addEventListener('mouseleave', () => glow.classList.remove('is-visible'));
    }

    // Gentle card tilt. Inline transforms are removed when the pointer leaves.
    document.querySelectorAll('[data-tilt], [data-tilt-soft]').forEach((element) => {
      const max = element.hasAttribute('data-tilt-soft') ? 2.5 : 5;
      element.addEventListener('pointermove', (event) => {
        if (event.pointerType === 'touch') return;
        const rect = element.getBoundingClientRect();
        const x = (event.clientX - rect.left) / rect.width - 0.5;
        const y = (event.clientY - rect.top) / rect.height - 0.5;
        element.style.transform = `perspective(900px) rotateX(${-y * max}deg) rotateY(${x * max}deg) translateZ(0)`;
      });
      element.addEventListener('pointerleave', () => { element.style.transform = ''; });
    });

    // Button ripple is visual only; link behavior remains native.
    document.querySelectorAll('.button, .intake-cta, .menu-intake').forEach((button) => {
      button.addEventListener('pointerdown', (event) => {
        const rect = button.getBoundingClientRect();
        const size = Math.max(rect.width, rect.height);
        const ripple = document.createElement('span');
        ripple.className = 'ripple';
        ripple.style.width = ripple.style.height = `${size}px`;
        ripple.style.left = `${event.clientX - rect.left - size / 2}px`;
        ripple.style.top = `${event.clientY - rect.top - size / 2}px`;
        button.appendChild(ripple);
        window.setTimeout(() => ripple.remove(), 650);
      });
    });
  }
})();
