/*
OROVIAN OASIS SHOWCASE — OPTIONAL MOBILE BEHAVIOR LAYER 2.2

Edit this file for phone/tablet-only behavior. Every enhancement is guarded by
matchMedia('(max-width: 880px)'). Removing this file does not break navigation,
content, prices, project pages, floor plans, or native menu behavior.
*/
(() => {
  'use strict';

  const query = window.matchMedia('(max-width: 880px)');
  const root = document.documentElement;
  const menu = document.querySelector('[data-site-menu]');

  const setViewportHeight = () => {
    if (!query.matches) {
      root.style.removeProperty('--mobile-vh');
      return;
    }
    const height = window.visualViewport?.height || window.innerHeight;
    root.style.setProperty('--mobile-vh', `${Math.round(height)}px`);
  };

  const syncMode = () => {
    root.classList.toggle('mobile-view', query.matches);
    if (!query.matches) {
      document.body.classList.remove('mobile-menu-open');
      menu?.removeAttribute('open');
    }
    setViewportHeight();
  };

  const syncMenu = () => {
    document.body.classList.toggle('mobile-menu-open', Boolean(query.matches && menu?.open));
  };

  syncMode();
  syncMenu();
  query.addEventListener?.('change', syncMode);
  menu?.addEventListener('toggle', syncMenu);
  window.visualViewport?.addEventListener('resize', setViewportHeight, { passive: true });
  window.addEventListener('orientationchange', setViewportHeight, { passive: true });
})();
