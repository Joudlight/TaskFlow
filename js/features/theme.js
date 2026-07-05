/*
  App.Theme — light/dark/auto (system) theme, accent color swap, font size,
  density, and high-contrast mode. Everything is driven by data-attributes on
  <html> so CSS does the actual work.
*/
(function () {
  'use strict';
  window.App = window.App || {};

  const ACCENTS = {
    indigo: { 500: '#5b5fef', 600: '#4548d1', name: 'Indigo' },
    blue: { 500: '#3b82f6', 600: '#2563eb', name: 'Blue' },
    emerald: { 500: '#10b981', 600: '#059669', name: 'Emerald' },
    rose: { 500: '#f43f5e', 600: '#e11d48', name: 'Rose' },
    amber: { 500: '#e08a1e', 600: '#c2740f', name: 'Amber' },
    teal: { 500: '#14b8a6', 600: '#0d9488', name: 'Teal' },
    violet: { 500: '#8b5cf6', 600: '#7c3aed', name: 'Violet' },
  };

  const mql = window.matchMedia ? window.matchMedia('(prefers-color-scheme: dark)') : null;
  const mqlMotion = window.matchMedia ? window.matchMedia('(prefers-reduced-motion: reduce)') : null;

  function effectiveTheme() {
    const pref = App.Store.state.settings.theme;
    if (pref === 'auto') return mql && mql.matches ? 'dark' : 'light';
    return pref;
  }

  function applyAccent(name) {
    const a = ACCENTS[name] || ACCENTS.indigo;
    const root = document.documentElement;
    root.style.setProperty('--accent-500', a[500]);
    root.style.setProperty('--accent-600', a[600]);
    root.style.setProperty('--accent-a-20', hexToRgba(a[500], 0.2));
    root.style.setProperty('--accent-a-30', hexToRgba(a[500], 0.3));
  }

  function hexToRgba(hex, alpha) {
    const v = hex.replace('#', '');
    const r = parseInt(v.substr(0, 2), 16), g = parseInt(v.substr(2, 2), 16), b = parseInt(v.substr(4, 2), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }

  function apply() {
    const root = document.documentElement;
    const settings = App.Store.state.settings;
    root.setAttribute('data-theme', effectiveTheme());
    root.setAttribute('data-fontsize', settings.fontSize);
    root.setAttribute('data-density', settings.density);
    root.setAttribute('data-contrast', settings.contrast);
    const reduceMotion = settings.reducedMotion || (mqlMotion && mqlMotion.matches);
    root.setAttribute('data-motion', reduceMotion ? 'reduced' : 'full');
    applyAccent(settings.accent);
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', effectiveTheme() === 'dark' ? '#14151a' : '#fafaf9');
    updateToggleUI();
  }

  function updateToggleUI() {
    const btn = App.Helpers.$('#themeToggleBtn');
    if (btn) btn.setAttribute('aria-label', `Theme: ${App.Store.state.settings.theme}. Activate to cycle.`);
    App.Helpers.$all('.theme-option').forEach((b) => b.classList.toggle('is-active', b.dataset.theme === App.Store.state.settings.theme));
    App.Helpers.$all('.swatch[data-accent]').forEach((b) => b.classList.toggle('is-selected', b.dataset.accent === App.Store.state.settings.accent));
  }

  function cycleTheme() {
    const order = ['light', 'dark', 'auto'];
    const current = App.Store.state.settings.theme;
    const next = order[(order.indexOf(current) + 1) % order.length];
    App.Store.updateSettings({ theme: next });
    apply();
    if (App.Toast) App.Toast.show({ message: `Theme: ${next === 'auto' ? 'Auto (system)' : next[0].toUpperCase() + next.slice(1)}`, icon: 'theme' });
  }

  function setAccent(name) { App.Store.updateSettings({ accent: name }); apply(); }
  function setFontSize(size) { App.Store.updateSettings({ fontSize: size }); apply(); }
  function setDensity(density) { App.Store.updateSettings({ density }); apply(); }
  function setContrast(contrast) { App.Store.updateSettings({ contrast }); apply(); }
  function setReducedMotion(val) { App.Store.updateSettings({ reducedMotion: val }); apply(); }

  function init() {
    apply();
    if (mql) mql.addEventListener('change', () => { if (App.Store.state.settings.theme === 'auto') apply(); });
    const toggle = App.Helpers.$('#themeToggleBtn');
    if (toggle) toggle.addEventListener('click', cycleTheme);
    App.Helpers.$all('.theme-option').forEach((b) => b.addEventListener('click', () => { App.Store.updateSettings({ theme: b.dataset.theme }); apply(); }));
    App.Helpers.$all('.swatch[data-accent]').forEach((b) => b.addEventListener('click', () => setAccent(b.dataset.accent)));
  }

  App.Theme = { init, apply, ACCENTS, setAccent, setFontSize, setDensity, setContrast, setReducedMotion, cycleTheme, effectiveTheme };
})();
