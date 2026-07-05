/*
  App.Views + bootstrap. This file runs last: it wires primary view switching
  (Tasks / Calendar / Dashboard / Focus), a global ripple effect, and calls
  every feature module's init() in dependency order.
*/
(function () {
  'use strict';
  window.App = window.App || {};
  const { $, $all, fireRipple } = App.Helpers;

  const VIEWS = ['tasks', 'calendar', 'dashboard', 'focus', 'notes', 'tables'];

  function show(view) {
    if (!VIEWS.includes(view)) view = 'tasks';
    VIEWS.forEach((v) => { const el = $('#view-' + v); if (el) el.hidden = v !== view; });
    $all('[data-view]').forEach((btn) => btn.classList.toggle('is-active', btn.dataset.view === view));
    if (view === 'calendar') App.Calendar.render();
    if (view === 'dashboard') App.Dashboard.refresh();
    if (view === 'notes') App.Notes.render();
    if (view === 'tables') App.Tables.render();
    if (view !== 'focus' && document.documentElement.getAttribute('data-focus-mode') === 'fullscreen') {
      document.documentElement.setAttribute('data-focus-mode', 'normal');
    }
    history.replaceState(null, '', '#' + view);
    $('#appSidebar').classList.remove('is-open');
    $('#sidebarScrim').classList.remove('is-open');
    window.scrollTo(0, 0);
  }

  App.Views = { show, VIEWS };

  function initViewNav() {
    $all('[data-view]').forEach((btn) => btn.addEventListener('click', () => show(btn.dataset.view)));
    const initial = location.hash.replace('#', '');
    const params = new URLSearchParams(location.search);
    const action = params.get('action');
    if (action === 'focus') show('focus');
    else show(VIEWS.includes(initial) ? initial : 'tasks');
    if (action === 'new-task') setTimeout(() => App.TaskModal.open(null), 50);
    if (action) history.replaceState(null, '', location.pathname + location.hash);
  }

  function initSidebarToggle() {
    $('#sidebarToggleBtn').addEventListener('click', () => {
      $('#appSidebar').classList.add('is-open');
      $('#sidebarScrim').classList.add('is-open');
    });
    $('#sidebarScrim').addEventListener('click', () => {
      $('#appSidebar').classList.remove('is-open');
      $('#sidebarScrim').classList.remove('is-open');
    });
  }

  function initGlobalRipple() {
    document.addEventListener('pointerdown', (e) => {
      const btn = e.target.closest('.btn, .btn-icon, .chip, .sidebar-link, .palette-item, .cal-day, .priority-pill, .swatch');
      if (btn) fireRipple(e, btn);
    });
  }

  function initFabVisibility() {
    // Hide the floating add button while a modal is open (avoids stacking above overlays awkwardly)
    const observer = new MutationObserver(() => {
      const anyModalOpen = $all('.modal-overlay.is-open, .palette-overlay.is-open').length > 0;
      $('#addTaskFab').style.display = anyModalOpen ? 'none' : '';
    });
    $all('.modal-overlay, .palette-overlay').forEach((el) => observer.observe(el, { attributes: true, attributeFilter: ['class'] }));
  }

  function registerServiceWorker() {
    if (!('serviceWorker' in navigator)) return;
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('service-worker.js').then((reg) => {
        reg.addEventListener('updatefound', () => {
          const installing = reg.installing;
          if (!installing) return;
          installing.addEventListener('statechange', () => {
            if (installing.state === 'installed' && navigator.serviceWorker.controller) {
              App.Toast.show({
                type: 'info', message: 'An update is ready.', actionLabel: 'Refresh',
                onAction: () => { installing.postMessage('skipWaiting'); location.reload(); }, duration: 10000,
              });
            }
          });
        });
      }).catch(() => { /* offline-first still works without the SW registering, e.g. file:// */ });
    });
  }

  function init() {
    App.Store.init();
    App.Theme.init();
    App.Sounds.init();
    App.Achievements.init();
    App.Filters.init();
    App.Tasks.init();
    App.TaskModal.init();
    App.Calendar.init();
    App.Pomodoro.init();
    App.Dashboard.init();
    App.Quotes.init();
    App.Notifications.init();
    App.ImportExport.init();
    App.Share.init();
    App.Print.init();
    App.Onboarding.init();
    App.Notes.init();
    App.Tables.init();
    App.Shortcuts.init();

    initViewNav();
    initSidebarToggle();
    initGlobalRipple();
    initFabVisibility();
    registerServiceWorker();

    document.body.classList.add('is-ready');
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
