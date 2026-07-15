/*
OROVIAN OASIS SHOWCASE — PROJECT IMAGE CAROUSELS 3.4
Progressive enhancement: without this file, the first image remains visible and every page still works.
*/
(() => {
  'use strict';

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  document.querySelectorAll('[data-carousel]').forEach((carousel) => {
    const slides = [...carousel.querySelectorAll('[data-carousel-slide]')];
    if (slides.length < 2) return;

    const dots = [...carousel.querySelectorAll('[data-carousel-dot]')];
    const previous = carousel.querySelector('[data-carousel-prev]');
    const next = carousel.querySelector('[data-carousel-next]');
    const interval = Math.max(2000, Number(carousel.dataset.interval || 5000));
    const autoplay = carousel.dataset.autoplay === 'true';
    let index = 0;
    let timer = null;
    let pointerStartX = null;
    let pointerMoved = false;

    carousel.classList.add('carousel-ready');

    const show = (newIndex, userInitiated = false) => {
      index = (newIndex + slides.length) % slides.length;
      slides.forEach((slide, slideIndex) => {
        const active = slideIndex === index;
        slide.classList.toggle('is-active', active);
        slide.setAttribute('aria-hidden', active ? 'false' : 'true');
        slide.tabIndex = active ? 0 : -1;
      });
      dots.forEach((dot, dotIndex) => {
        const active = dotIndex === index;
        dot.classList.toggle('is-active', active);
        dot.setAttribute('aria-current', active ? 'true' : 'false');
      });
      if (userInitiated) restart();
    };

    const stop = () => {
      if (timer) window.clearInterval(timer);
      timer = null;
    };

    const start = () => {
      stop();
      if (!autoplay || reducedMotion.matches || document.hidden) return;
      timer = window.setInterval(() => show(index + 1), interval);
    };

    const restart = () => {
      stop();
      start();
    };

    previous?.addEventListener('click', () => show(index - 1, true));
    next?.addEventListener('click', () => show(index + 1, true));
    dots.forEach((dot) => dot.addEventListener('click', () => show(Number(dot.dataset.index || 0), true)));

    carousel.addEventListener('mouseenter', stop);
    carousel.addEventListener('mouseleave', start);
    carousel.addEventListener('focusin', stop);
    carousel.addEventListener('focusout', (event) => {
      if (!carousel.contains(event.relatedTarget)) start();
    });

    carousel.addEventListener('pointerdown', (event) => {
      if (event.pointerType === 'mouse' && event.button !== 0) return;
      pointerStartX = event.clientX;
      pointerMoved = false;
    });
    carousel.addEventListener('pointermove', (event) => {
      if (pointerStartX === null) return;
      if (Math.abs(event.clientX - pointerStartX) > 12) pointerMoved = true;
    });
    carousel.addEventListener('pointerup', (event) => {
      if (pointerStartX === null) return;
      const distance = event.clientX - pointerStartX;
      if (Math.abs(distance) > 42) show(index + (distance < 0 ? 1 : -1), true);
      pointerStartX = null;
    });
    carousel.addEventListener('click', (event) => {
      if (pointerMoved && event.target.closest('a')) event.preventDefault();
      pointerMoved = false;
    }, true);

    document.addEventListener('visibilitychange', () => document.hidden ? stop() : start());
    reducedMotion.addEventListener?.('change', restart);
    show(0);
    start();
  });
})();
