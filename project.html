/*
OROVIAN OASIS SHOWCASE — CATEGORY FILTERS 3.3
Progressive enhancement: without this file every project remains visible.
*/
(() => {
  'use strict';

  const panel = document.querySelector('[data-project-filters]');
  const results = document.querySelector('[data-project-results]');
  if (!panel || !results) return;

  const cards = [...results.querySelectorAll('[data-project-card]')];
  const count = panel.querySelector('[data-filter-count]');
  const empty = document.querySelector('[data-filter-empty]');
  const controls = [...panel.querySelectorAll('[data-filter]')];
  const reset = panel.querySelector('[data-filter-reset]');

  const valueOf = (name) => panel.querySelector(`[data-filter="${name}"]`)?.value.trim() || '';
  const numeric = (card, name) => Number(card.dataset[name] || 0);

  function squareFeetMatches(value, range) {
    if (!range) return true;
    if (!value) return false;
    if (range === 'under-2000') return value < 2000;
    if (range === '2000-3999') return value >= 2000 && value <= 3999;
    if (range === '4000-5999') return value >= 4000 && value <= 5999;
    if (range === '6000-plus') return value >= 6000;
    return true;
  }

  function storiesMatch(value, selected) {
    if (!selected) return true;
    if (!value) return false;
    const target = Number(selected);
    return target >= 3 ? value >= 3 : value === target;
  }

  function applyFilters() {
    const query = valueOf('query').toLowerCase();
    const squareFeet = valueOf('square-feet');
    const bedrooms = Number(valueOf('bedrooms') || 0);
    const bathrooms = Number(valueOf('bathrooms') || 0);
    const garage = Number(valueOf('garage') || 0);
    const stories = valueOf('stories');

    let visible = 0;
    cards.forEach((card) => {
      const matches = (
        (!query || (card.dataset.search || '').includes(query)) &&
        squareFeetMatches(numeric(card, 'squareFeet'), squareFeet) &&
        (!bedrooms || numeric(card, 'bedrooms') >= bedrooms) &&
        (!bathrooms || numeric(card, 'bathrooms') >= bathrooms) &&
        (!garage || numeric(card, 'garage') >= garage) &&
        storiesMatch(numeric(card, 'stories'), stories)
      );
      card.hidden = !matches;
      if (matches) visible += 1;
    });

    if (count) count.textContent = `${visible} project${visible === 1 ? '' : 's'}`;
    if (empty) empty.hidden = visible !== 0;
  }

  controls.forEach((control) => {
    control.addEventListener(control.matches('input[type="search"]') ? 'input' : 'change', applyFilters);
  });

  reset?.addEventListener('click', () => {
    controls.forEach((control) => { control.value = ''; });
    applyFilters();
    panel.querySelector('[data-filter="query"]')?.focus();
  });

  applyFilters();
})();
