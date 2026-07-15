/*
OROVIAN OASIS SHOWCASE — CONTACT LAYER 2.4
The popups use CSS :target and remain visible without JavaScript.
This file adds focus management, Escape/close controls, scroll-position preservation,
body scroll locking, and enhanced form submission.
*/
(() => {
  'use strict';

  const modalIds = new Set(['quick-contact', 'contact-us']);
  const modalLinks = 'a[href="#quick-contact"], a[href="#contact-us"]';
  const form = document.querySelector('[data-contact-form]');
  const status = document.querySelector('[data-contact-status]');
  let previousFocus = null;
  let returnScrollX = window.scrollX;
  let returnScrollY = window.scrollY;

  const activeModal = () => {
    const id = window.location.hash.slice(1);
    return modalIds.has(id) ? document.getElementById(id) : null;
  };

  const restorePagePosition = () => {
    window.requestAnimationFrame(() => {
      window.scrollTo(returnScrollX, returnScrollY);
    });
  };

  const syncModalState = () => {
    const modal = activeModal();
    const wasOpen = document.body.classList.contains('contact-modal-open');
    document.body.classList.toggle('contact-modal-open', Boolean(modal));

    if (modal) {
      if (!wasOpen) previousFocus = document.activeElement;
      window.requestAnimationFrame(() => modal.querySelector('.contact-modal-card')?.focus({ preventScroll: true }));
      return;
    }

    if (previousFocus instanceof HTMLElement) {
      previousFocus.focus({ preventScroll: true });
      previousFocus = null;
    }
  };

  const closeModal = () => {
    history.replaceState(null, '', `${location.pathname}${location.search}`);
    syncModalState();
    restorePagePosition();
  };

  document.addEventListener('click', (event) => {
    const opener = event.target.closest(modalLinks);
    if (opener && !activeModal()) {
      returnScrollX = window.scrollX;
      returnScrollY = window.scrollY;
    }

    const closer = event.target.closest('[data-contact-close]');
    if (closer && activeModal()) {
      event.preventDefault();
      closeModal();
    }
  });

  window.addEventListener('hashchange', () => {
    if (window.location.hash === '#contact-closed') {
      closeModal();
      return;
    }
    syncModalState();
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && activeModal()) {
      event.preventDefault();
      closeModal();
    }
  });

  syncModalState();

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
