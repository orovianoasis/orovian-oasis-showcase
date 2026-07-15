/*
OROVIAN OASIS SHOWCASE — CONTACT LAYER 2.3
The popups themselves use CSS :target and remain usable without JavaScript.
This file adds focus management, Escape-to-close, body scroll locking, and enhanced form submission.
*/
(() => {
  'use strict';

  const modalIds = new Set(['quick-contact', 'contact-us']);
  const form = document.querySelector('[data-contact-form]');
  const status = document.querySelector('[data-contact-status]');
  let previousFocus = null;

  const activeModal = () => {
    const id = window.location.hash.slice(1);
    return modalIds.has(id) ? document.getElementById(id) : null;
  };

  const syncModalState = () => {
    const modal = activeModal();
    document.body.classList.toggle('contact-modal-open', Boolean(modal));
    if (modal) {
      previousFocus = document.activeElement;
      window.requestAnimationFrame(() => modal.querySelector('.contact-modal-card')?.focus());
    } else if (previousFocus instanceof HTMLElement) {
      previousFocus.focus({ preventScroll: true });
      previousFocus = null;
    }
  };

  window.addEventListener('hashchange', syncModalState);
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && activeModal()) {
      event.preventDefault();
      history.replaceState(null, '', `${location.pathname}${location.search}`);
      syncModalState();
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
