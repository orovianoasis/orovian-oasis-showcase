/*
OROVIAN OASIS SHOWCASE — MODAL + CONTACT LAYER 3.3
Keeps the no-JavaScript hash fallback, preserves page position, and attaches the current
property context to project inquiries automatically.
*/
(() => {
  'use strict';

  const modals = [...document.querySelectorAll('.contact-modal[id]')];
  const modalById = new Map(modals.map((modal) => [modal.id, modal]));
  const form = document.querySelector('[data-contact-form]');
  const status = document.querySelector('[data-contact-status]');
  const quickEmail = document.querySelector('[data-quick-email]');
  const contextFields = {
    title: form?.querySelector('input[name="project_title"]') || null,
    url: form?.querySelector('input[name="project_url"]') || null,
    category: form?.querySelector('input[name="project_category"]') || null,
    source: form?.querySelector('input[name="source_page"]') || null
  };

  let previousFocus = null;
  let returnScrollX = window.scrollX;
  let returnScrollY = window.scrollY;
  let currentModal = null;
  let activeContext = readPageContext();

  const cleanUrl = () => `${location.pathname}${location.search}`;

  function absoluteUrl(value) {
    if (!value) return '';
    try {
      return new URL(value, location.href).href;
    } catch (_) {
      return value;
    }
  }

  function readPageContext() {
    const body = document.body.dataset;
    return {
      title: body.projectTitle || '',
      url: absoluteUrl(body.projectUrl || ''),
      category: body.projectCategory || '',
      source: location.href
    };
  }

  function contextFromOpener(opener) {
    const base = readPageContext();
    if (!(opener instanceof HTMLElement)) return base;
    return {
      title: opener.dataset.contactProjectTitle || base.title,
      url: absoluteUrl(opener.dataset.contactProjectUrl || base.url),
      category: opener.dataset.contactProjectCategory || base.category,
      source: location.href
    };
  }

  function applyContext(context) {
    activeContext = context || readPageContext();
    if (contextFields.title) contextFields.title.value = activeContext.title || '';
    if (contextFields.url) contextFields.url.value = activeContext.url || '';
    if (contextFields.category) contextFields.category.value = activeContext.category || '';
    if (contextFields.source) contextFields.source.value = activeContext.source || location.href;

    if (quickEmail) {
      const address = quickEmail.dataset.emailAddress || '';
      if (!address) return;
      const subject = activeContext.title
        ? `Inquiry — ${activeContext.title}`
        : 'Orovian Oasis inquiry';
      const body = activeContext.title
        ? [`Regarding: ${activeContext.title}`, `Project page: ${activeContext.url || location.href}`, '', 'Hello,'].join('\n')
        : 'Hello,';
      quickEmail.href = `mailto:${address}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    }
  }

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

    const hasExplicitContext = opener instanceof HTMLElement && (
      opener.dataset.contactProjectTitle ||
      opener.dataset.contactProjectUrl ||
      opener.dataset.contactProjectCategory
    );
    if (hasExplicitContext || !currentModal) {
      applyContext(contextFromOpener(opener));
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

  applyContext(activeContext);

  const initialId = location.hash.slice(1);
  if (modalById.has(initialId)) openModal(initialId);

  if (!form) return;

  form.addEventListener('submit', async (event) => {
    const endpoint = form.dataset.formEndpoint?.trim();
    const recipient = form.dataset.contactEmail?.trim();
    const data = new FormData(form);
    const values = {
      name: String(data.get('name') || '').trim(),
      email: String(data.get('email') || '').trim(),
      phone: String(data.get('phone') || '').trim(),
      preferred: String(data.get('preferred_contact') || '').trim(),
      message: String(data.get('message') || '').trim(),
      projectTitle: String(data.get('project_title') || '').trim(),
      projectUrl: String(data.get('project_url') || '').trim(),
      projectCategory: String(data.get('project_category') || '').trim(),
      sourcePage: String(data.get('source_page') || location.href).trim()
    };

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
        applyContext(activeContext);
        status.textContent = '✅ Message sent. We’ll be in touch.';
      } catch (error) {
        status.textContent = 'Could not send directly. Opening your email app instead…';
        if (recipient) openMailDraft(recipient, values);
      }
      return;
    }

    event.preventDefault();
    if (!recipient) {
      status.textContent = '⚙️ Add the public email address in content/site.toml to activate this form.';
      return;
    }
    status.textContent = 'Opening your email app with the message prepared…';
    openMailDraft(recipient, values);
  });

  function openMailDraft(recipient, values) {
    const subject = values.projectTitle
      ? `Property inquiry — ${values.projectTitle}`
      : `Showcase contact from ${values.name || 'a visitor'}`;
    const body = [
      `Name: ${values.name}`,
      `Email: ${values.email}`,
      `Phone: ${values.phone || 'Not provided'}`,
      `Preferred contact: ${values.preferred || 'Email'}`,
      values.projectTitle ? `Regarding property: ${values.projectTitle}` : '',
      values.projectCategory ? `Category: ${values.projectCategory}` : '',
      values.projectUrl ? `Property page: ${values.projectUrl}` : '',
      `Submitted from: ${values.sourcePage || location.href}`,
      '',
      values.message
    ].filter(Boolean).join('\n');
    window.location.href = `mailto:${recipient}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  }
})();
