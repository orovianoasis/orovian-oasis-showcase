(() => {
  const toolbar = document.querySelector('[data-blueprint-toolbar]');
  if (!toolbar) return;

  const cards = Array.from(document.querySelectorAll('[data-plan-card]'));
  const selectAllButton = toolbar.querySelector('[data-plan-select-all]');
  const clearButton = toolbar.querySelector('[data-plan-clear]');
  const selectedButton = toolbar.querySelector('[data-plan-download-selected]');
  const allButton = toolbar.querySelector('[data-plan-download-all]');
  const selectionStatus = toolbar.querySelector('[data-plan-selection-status]');
  const projectName = toolbar.dataset.planProject || 'Plan_Set';

  const notesModal = document.querySelector('[data-plan-notes-modal]');
  const notesHeading = notesModal?.querySelector('[data-plan-notes-heading]');
  const notesContent = notesModal?.querySelector('[data-plan-notes-content]');
  const notesCloseButtons = notesModal?.querySelectorAll('[data-plan-notes-close]') || [];
  let previousFocus = null;

  function selectedCards() {
    return cards.filter(card => card.querySelector('[data-plan-select]')?.checked);
  }

  function updateSelection() {
    const count = selectedCards().length;
    if (selectionStatus) selectionStatus.textContent = `${count} sheet${count === 1 ? '' : 's'} selected`;
    if (selectedButton) selectedButton.disabled = count === 0;
    if (clearButton) clearButton.disabled = count === 0;
    if (selectAllButton) selectAllButton.textContent = count === cards.length && cards.length ? 'All Selected' : 'Select All';
    cards.forEach(card => card.classList.toggle('is-selected', !!card.querySelector('[data-plan-select]')?.checked));
  }

  cards.forEach(card => card.querySelector('[data-plan-select]')?.addEventListener('change', updateSelection));
  selectAllButton?.addEventListener('click', () => {
    cards.forEach(card => { const box = card.querySelector('[data-plan-select]'); if (box) box.checked = true; });
    updateSelection();
  });
  clearButton?.addEventListener('click', () => {
    cards.forEach(card => { const box = card.querySelector('[data-plan-select]'); if (box) box.checked = false; });
    updateSelection();
  });

  function planFiles(sourceCards) {
    return sourceCards.flatMap(card => Array.from(card.querySelectorAll('[data-plan-file]')).map(node => ({
      url: node.dataset.planFileUrl,
      name: node.dataset.planFileName,
    }))).filter(file => file.url && file.name);
  }

  // Small dependency-free ZIP writer using ZIP's STORE method. No compression is
  // needed for CAD/PDF downloads; this keeps selected-sheet packaging reliable in
  // current desktop and mobile browsers without a third-party CDN.
  const crcTable = (() => {
    const table = new Uint32Array(256);
    for (let n = 0; n < 256; n++) {
      let c = n;
      for (let k = 0; k < 8; k++) c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
      table[n] = c >>> 0;
    }
    return table;
  })();

  function crc32(bytes) {
    let crc = 0xffffffff;
    for (const value of bytes) crc = crcTable[(crc ^ value) & 0xff] ^ (crc >>> 8);
    return (crc ^ 0xffffffff) >>> 0;
  }

  function u16(value) {
    const bytes = new Uint8Array(2);
    new DataView(bytes.buffer).setUint16(0, value, true);
    return bytes;
  }
  function u32(value) {
    const bytes = new Uint8Array(4);
    new DataView(bytes.buffer).setUint32(0, value >>> 0, true);
    return bytes;
  }
  function concat(parts) {
    const size = parts.reduce((sum, part) => sum + part.length, 0);
    const result = new Uint8Array(size);
    let offset = 0;
    for (const part of parts) { result.set(part, offset); offset += part.length; }
    return result;
  }

  function dosDateTime(date = new Date()) {
    const year = Math.max(1980, date.getFullYear());
    const time = (date.getHours() << 11) | (date.getMinutes() << 5) | Math.floor(date.getSeconds() / 2);
    const day = ((year - 1980) << 9) | ((date.getMonth() + 1) << 5) | date.getDate();
    return { time, day };
  }

  function buildZip(entries) {
    const encoder = new TextEncoder();
    const localParts = [];
    const centralParts = [];
    let offset = 0;
    const stamp = dosDateTime();

    entries.forEach(entry => {
      const name = encoder.encode(entry.name.replace(/\\/g, '/'));
      const data = entry.data;
      const crc = crc32(data);
      const local = concat([
        u32(0x04034b50), u16(20), u16(0x0800), u16(0), u16(stamp.time), u16(stamp.day),
        u32(crc), u32(data.length), u32(data.length), u16(name.length), u16(0), name, data,
      ]);
      localParts.push(local);

      const central = concat([
        u32(0x02014b50), u16(20), u16(20), u16(0x0800), u16(0), u16(stamp.time), u16(stamp.day),
        u32(crc), u32(data.length), u32(data.length), u16(name.length), u16(0), u16(0), u16(0),
        u16(0), u32(0), u32(offset), name,
      ]);
      centralParts.push(central);
      offset += local.length;
    });

    const centralSize = centralParts.reduce((sum, part) => sum + part.length, 0);
    return concat([
      ...localParts,
      ...centralParts,
      u32(0x06054b50), u16(0), u16(0), u16(entries.length), u16(entries.length),
      u32(centralSize), u32(offset), u16(0),
    ]);
  }

  async function downloadCards(sourceCards, suffix, button) {
    const files = planFiles(sourceCards);
    if (!files.length) return;
    const original = button?.textContent || '';
    if (button) { button.disabled = true; button.textContent = 'Preparing…'; }
    try {
      const entries = [];
      for (const file of files) {
        const response = await fetch(file.url, { cache: 'no-store' });
        if (!response.ok) throw new Error(`Could not fetch ${file.name}`);
        entries.push({ name: file.name, data: new Uint8Array(await response.arrayBuffer()) });
      }
      const blob = new Blob([buildZip(entries)], { type: 'application/zip' });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = `${projectName}_${suffix}.zip`;
      document.body.append(anchor);
      anchor.click();
      anchor.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1200);
    } catch (error) {
      console.error(error);
      alert('The plan package could not be prepared. Try the individual download buttons, or reload the page and try again.');
    } finally {
      if (button) { button.textContent = original; button.disabled = suffix === 'Selected_Plan_Sheets' ? selectedCards().length === 0 : false; }
    }
  }

  selectedButton?.addEventListener('click', () => downloadCards(selectedCards(), 'Selected_Plan_Sheets', selectedButton));
  allButton?.addEventListener('click', () => downloadCards(cards, 'Full_Plan_Set', allButton));

  function closeNotes() {
    if (!notesModal) return;
    notesModal.classList.remove('is-open');
    notesModal.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('plan-notes-open');
    previousFocus?.focus?.({ preventScroll: true });
  }

  document.querySelectorAll('[data-plan-notes]').forEach(button => {
    button.addEventListener('click', async () => {
      if (!notesModal || !notesContent || !notesHeading) return;
      previousFocus = document.activeElement;
      notesHeading.textContent = button.dataset.planNotesTitle || 'Plan Notes';
      notesContent.textContent = 'Loading notes…';
      notesModal.classList.add('is-open');
      notesModal.setAttribute('aria-hidden', 'false');
      document.body.classList.add('plan-notes-open');
      requestAnimationFrame(() => notesModal.querySelector('.plan-notes-card')?.focus({ preventScroll: true }));
      try {
        const response = await fetch(button.dataset.planNotesUrl, { cache: 'no-store' });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        notesContent.textContent = await response.text();
      } catch {
        notesContent.textContent = 'Project notes for this drawing have not yet been finalized.';
      }
    });
  });
  notesCloseButtons.forEach(button => button.addEventListener('click', closeNotes));
  document.addEventListener('keydown', event => { if (event.key === 'Escape' && notesModal?.classList.contains('is-open')) closeNotes(); });

  updateSelection();
})();
