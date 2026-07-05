/*
  App.Storage — thin, safe wrapper around localStorage.
  Namespaces every key under "flow:" so this app never collides with anything else
  on the same origin, and never throws on quota errors or private-browsing lockouts.
*/
(function () {
  'use strict';
  window.App = window.App || {};

  const PREFIX = 'flow:';
  let available = true;
  try {
    const t = '__flow_test__';
    localStorage.setItem(t, '1');
    localStorage.removeItem(t);
  } catch (e) {
    available = false;
  }

  function get(key, fallback) {
    if (!available) return fallback;
    try {
      const raw = localStorage.getItem(PREFIX + key);
      return raw == null ? fallback : JSON.parse(raw);
    } catch (e) {
      console.warn('Storage read failed for', key, e);
      return fallback;
    }
  }

  function set(key, value) {
    if (!available) return false;
    try {
      localStorage.setItem(PREFIX + key, JSON.stringify(value));
      return true;
    } catch (e) {
      console.warn('Storage write failed for', key, e);
      if (App.Toast) App.Toast.show({ type: 'danger', message: 'Storage is full — free up space in Settings → Backup.' });
      return false;
    }
  }

  function remove(key) { if (available) localStorage.removeItem(PREFIX + key); }

  function estimateUsage() {
    let bytes = 0;
    try {
      Object.keys(localStorage).forEach((k) => {
        if (k.startsWith(PREFIX)) bytes += (localStorage.getItem(k) || '').length + k.length;
      });
    } catch (e) { /* ignore */ }
    return bytes * 2; // UTF-16 approx bytes
  }

  // Most browsers cap localStorage around 5MB per origin; used only for the UI meter.
  const QUOTA_ESTIMATE = 5 * 1024 * 1024;

  App.Storage = { available, get, set, remove, estimateUsage, QUOTA_ESTIMATE, PREFIX };
})();
