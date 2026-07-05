/*
  App.Toast — small snackbar notifications, including an "undo" affordance
  used by delete actions. Announces to screen readers via aria-live.
*/
(function () {
  'use strict';
  window.App = window.App || {};
  const { el, announce } = App.Helpers;

  const ICONS = {
    success: '<svg viewBox="0 0 24 24" fill="none"><path d="M5 13l4 4L19 7" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    danger: '<svg viewBox="0 0 24 24" fill="none"><path d="M12 8v5M12 16h.01M12 3l9 16H3z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    info: '<svg viewBox="0 0 24 24" fill="none"><path d="M12 8h.01M11 12h1v5h1" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="2"/></svg>',
    theme: '<svg viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="4" stroke="currentColor" stroke-width="2"/></svg>',
  };

  function show(opts) {
    const container = App.Helpers.$('#toastContainer');
    if (!container) return;
    const { message, type = 'info', actionLabel, onAction, duration = 4200 } = opts;
    const toast = el('div', { class: `toast toast--${type}`, role: 'status' }, [
      el('span', { class: 'toast__icon', html: ICONS[opts.icon] || ICONS[type] || ICONS.info }),
      el('span', { class: 'toast__msg', text: message }),
      actionLabel ? el('button', { class: 'toast__action', text: actionLabel, onClick: () => { onAction && onAction(); dismiss(toast); } }) : null,
      el('button', { class: 'toast__close', 'aria-label': 'Dismiss', html: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M6 6l12 12M18 6L6 18" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/></svg>', onClick: () => dismiss(toast) }),
    ]);
    container.appendChild(toast);
    announce(message);
    const timer = setTimeout(() => dismiss(toast), duration);
    toast._timer = timer;
    return toast;
  }

  function dismiss(toast) {
    if (!toast || toast._dismissed) return;
    toast._dismissed = true;
    clearTimeout(toast._timer);
    toast.classList.add('is-leaving');
    setTimeout(() => toast.remove(), 200);
  }

  App.Toast = { show, dismiss };
})();
