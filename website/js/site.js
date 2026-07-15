/*
OROVIAN OASIS SHOWCASE — CORE JAVASCRIPT
Keep this file tiny and essential. The website remains usable if JavaScript is unavailable.
Optional motion and interaction enhancements live in dynamics.js.
*/
document.querySelectorAll('[data-year]').forEach((element) => {
  element.textContent = new Date().getFullYear();
});
