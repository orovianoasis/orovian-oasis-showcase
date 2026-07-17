(() => {
  const modal = document.querySelector('[data-plan-lightbox]');
  if (!modal) return;

  const card = modal.querySelector('.plan-lightbox-card');
  const stage = modal.querySelector('[data-plan-stage]');
  const image = modal.querySelector('[data-plan-image]');
  const title = modal.querySelector('[data-plan-title]');
  const status = modal.querySelector('[data-plan-zoom-status]');
  const zoomIn = modal.querySelector('[data-plan-zoom-in]');
  const zoomOut = modal.querySelector('[data-plan-zoom-out]');
  const resetButton = modal.querySelector('[data-plan-reset]');
  const closeButtons = modal.querySelectorAll('[data-plan-close]');

  let scale = 1;
  let x = 0;
  let y = 0;
  let previousFocus = null;
  let dragging = false;
  let dragStart = null;
  let lastTouchDistance = null;
  const activePointers = new Map();

  const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

  function applyTransform() {
    image.style.transform = `translate3d(${x}px, ${y}px, 0) scale(${scale})`;
    status.value = `${Math.round(scale * 100)}%`;
    stage.classList.toggle('is-zoomed', scale > 1.01);
  }

  function reset() {
    scale = 1;
    x = 0;
    y = 0;
    applyTransform();
  }

  function setScale(next, originX = stage.clientWidth / 2, originY = stage.clientHeight / 2) {
    const old = scale;
    scale = clamp(next, 0.75, 5);
    if (Math.abs(scale - old) < 0.001) return;
    const rect = stage.getBoundingClientRect();
    const px = originX - rect.width / 2;
    const py = originY - rect.height / 2;
    const ratio = scale / old;
    x = px - (px - x) * ratio;
    y = py - (py - y) * ratio;
    if (scale <= 1) { x = 0; y = 0; }
    applyTransform();
  }

  function openViewer(link) {
    previousFocus = document.activeElement;
    const img = link.querySelector('img');
    image.src = link.href;
    image.alt = img?.alt || link.dataset.planTitle || 'Floor plan';
    title.textContent = link.dataset.planTitle || img?.alt || 'Floor Plan';
    reset();
    modal.classList.add('is-open');
    modal.setAttribute('aria-hidden', 'false');
    document.body.classList.add('plan-lightbox-open');
    requestAnimationFrame(() => card.focus({preventScroll: true}));
  }

  function closeViewer() {
    if (!modal.classList.contains('is-open')) return;
    modal.classList.remove('is-open');
    modal.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('plan-lightbox-open');
    activePointers.clear();
    lastTouchDistance = null;
    dragging = false;
    previousFocus?.focus?.({preventScroll: true});
  }

  document.querySelectorAll('[data-plan-open]').forEach(link => {
    link.addEventListener('click', event => {
      event.preventDefault();
      openViewer(link);
    });
  });

  zoomIn.addEventListener('click', () => setScale(scale + 0.25));
  zoomOut.addEventListener('click', () => setScale(scale - 0.25));
  resetButton.addEventListener('click', reset);
  closeButtons.forEach(button => button.addEventListener('click', closeViewer));

  stage.addEventListener('wheel', event => {
    event.preventDefault();
    const rect = stage.getBoundingClientRect();
    const amount = event.deltaY < 0 ? 0.2 : -0.2;
    setScale(scale + amount, event.clientX - rect.left, event.clientY - rect.top);
  }, {passive: false});

  stage.addEventListener('dblclick', event => {
    const rect = stage.getBoundingClientRect();
    setScale(scale > 1.1 ? 1 : 2, event.clientX - rect.left, event.clientY - rect.top);
  });

  stage.addEventListener('pointerdown', event => {
    stage.setPointerCapture?.(event.pointerId);
    activePointers.set(event.pointerId, {x: event.clientX, y: event.clientY});
    if (activePointers.size === 1) {
      dragging = true;
      dragStart = {pointerX: event.clientX, pointerY: event.clientY, x, y};
    }
    if (activePointers.size === 2) {
      const [a, b] = [...activePointers.values()];
      lastTouchDistance = Math.hypot(a.x - b.x, a.y - b.y);
      dragging = false;
    }
  });

  stage.addEventListener('pointermove', event => {
    if (!activePointers.has(event.pointerId)) return;
    activePointers.set(event.pointerId, {x: event.clientX, y: event.clientY});
    if (activePointers.size === 2) {
      const [a, b] = [...activePointers.values()];
      const distance = Math.hypot(a.x - b.x, a.y - b.y);
      if (lastTouchDistance) {
        const midpointX = ((a.x + b.x) / 2) - stage.getBoundingClientRect().left;
        const midpointY = ((a.y + b.y) / 2) - stage.getBoundingClientRect().top;
        setScale(scale * (distance / lastTouchDistance), midpointX, midpointY);
      }
      lastTouchDistance = distance;
      return;
    }
    if (dragging && dragStart && scale > 1) {
      x = dragStart.x + event.clientX - dragStart.pointerX;
      y = dragStart.y + event.clientY - dragStart.pointerY;
      applyTransform();
    }
  });

  function endPointer(event) {
    activePointers.delete(event.pointerId);
    if (activePointers.size < 2) lastTouchDistance = null;
    if (activePointers.size === 0) {
      dragging = false;
      dragStart = null;
    } else if (activePointers.size === 1) {
      const remaining = [...activePointers.values()][0];
      dragging = true;
      dragStart = {pointerX: remaining.x, pointerY: remaining.y, x, y};
    }
  }
  stage.addEventListener('pointerup', endPointer);
  stage.addEventListener('pointercancel', endPointer);

  document.addEventListener('keydown', event => {
    if (!modal.classList.contains('is-open')) return;
    if (event.key === 'Escape') closeViewer();
    if (event.key === '+' || event.key === '=') setScale(scale + 0.25);
    if (event.key === '-') setScale(scale - 0.25);
    if (event.key === '0') reset();
  });
})();
