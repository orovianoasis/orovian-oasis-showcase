/*
OROVIAN OASIS SHOWCASE — MODAL + CONTACT LAYER 2.5
Hash targets remain a no-JavaScript fallback. With JavaScript, dialogs use .is-open so one tap
always opens or closes them without moving the page or requiring a second click.
*/
(() => {
  'use strict';

  const modals = [...document.querySelectorAll('.contact-modal[id]')];
  const modalById = new Map(modals.map((modal) => [modal.id, modal]));
  const form = document.querySelector('[data-contact-form]');
  const status = document.querySelector('[data-contact-status]');
  let previousFocus = null;
  let returnScrollX = window.scrollX;
  let returnScrollY = window.scrollY;
  let currentModal = null;

  const cleanUrl = () => `${location.pathname}${location.search}`;

  function savePagePosition() {
    returnScrollX = window.scrollX;
    returnScrollY = window.scrollY;
  }

  function restorePagePosition() {
    window.requestAnimationFrame(() => window.scrollTo(returnScrollX, returnScrollY));
  }

  function setModalState(modal, open) {
    modal.classList.toggle('is-open', open);
    modal.setAttribute('aria-hidden', open ? 'false' : 'true');
  }

  function openModal(id, opener = null) {
    const modal = modalById.get(id);
    if (!modal) return;

    if (!currentModal) {
      savePagePosition();
      previousFocus = opener instanceof HTMLElement ? opener : document.activeElement;
    }

    modals.forEach((item) => setModalState(item, item === modal));
    currentModal = modal;
    document.body.classList.add('contact-modal-open');
    history.replaceState(null, '', cleanUrl());
    window.requestAnimationFrame(() => modal.querySelector('.contact-modal-card')?.focus({ preventScroll: true }));
  }

  function closeModal({ restoreFocus = true } = {}) {
    if (!currentModal && !modals.some((modal) => modal.matches(':target'))) return;

    modals.forEach((modal) => setModalState(modal, false));
    currentModal = null;
    document.body.classList.remove('contact-modal-open');
    history.replaceState(null, '', cleanUrl());
    restorePagePosition();

    if (restoreFocus && previousFocus instanceof HTMLElement) {
      window.requestAnimationFrame(() => previousFocus?.focus({ preventScroll: true }));
    }
    previousFocus = null;
  }

  document.addEventListener('click', (event) => {
    const closer = event.target.closest('[data-modal-close], [data-contact-close]');
    if (closer) {
      event.preventDefault();
      event.stopPropagation();
      closeModal();
      return;
    }

    const opener = event.target.closest('a[href^="#"]');
    if (!opener) return;
    const id = opener.getAttribute('href')?.slice(1);
    if (!id || !modalById.has(id)) return;

    event.preventDefault();
    event.stopPropagation();
    openModal(id, opener);
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && currentModal) {
      event.preventDefault();
      closeModal();
    }
  });

  // Support direct hash links and the CSS-only fallback when the script arrives after navigation.
  const initialId = location.hash.slice(1);
  if (modalById.has(initialId)) openModal(initialId);

  if (!form) return;

  form.addEventListener('submit', async (event) => {
    const endpoint = form.dataset.formEndpoint?.trim();
    const recipient = form.dataset.contactEmail?.trim();
    const data = new FormData(form);
    const name = String(data.get('name') || '').trim();
    const email = String(data.get('email') || '').trim();
    const phone = String(data.get('phone') || '').trim();
    const preferred = String(data.get('preferred_contact') || '').trim();
    const message = String(data.get('message') || '').trim();

    if (!form.reportValidity()) {
      event.preventDefault();
      return;
    }

    if (endpoint) {
      event.preventDefault();
      status.textContent = 'Sending…';
      try {
        const response = await fetch(endpoint, {
          method: 'POST',
          body: data,
          headers: { Accept: 'application/json' }
        });
        if (!response.ok) throw new Error('Submission failed');
        form.reset();
        status.textContent = '✅ Message sent. We’ll be in touch.';
      } catch (error) {
        status.textContent = 'Could not send directly. Opening your email app instead…';
        if (recipient) openMailDraft(recipient, { name, email, phone, preferred, message });
      }
      return;
    }

    event.preventDefault();
    if (!recipient) {
      status.textContent = '⚙️ Add the public email address in content/site.toml to activate this form.';
      return;
    }
    status.textContent = 'Opening your email app with the message prepared…';
    openMailDraft(recipient, { name, email, phone, preferred, message });
  });

  function openMailDraft(recipient, values) {
    const subject = `Showcase contact from ${values.name || 'a visitor'}`;
    const body = [
      `Name: ${values.name}`,
      `Email: ${values.email}`,
      `Phone: ${values.phone || 'Not provided'}`,
      `Preferred contact: ${values.preferred || 'Email'}`,
      '',
      values.message
    ].join('\n');
    window.location.href = `mailto:${recipient}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  }
})();
