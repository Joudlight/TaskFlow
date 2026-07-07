/*
  App.Onboarding — first-run welcome screen, the Settings modal (theme/sound/
  notifications/density/etc. all live here), and the Help modal's static tabs.
*/
(function () {
  'use strict';
  window.App = window.App || {};
  const { $, $all } = App.Helpers;

  // ---------------- Tour guide ----------------
  var TOUR_STEPS = [
    { title: 'Welcome to Flow', desc: 'A fast, private task manager that lives entirely on this device. No account, no tracking, works offline. Let\u2019s take a quick tour of everything you can do.' },
    { title: 'Your Tasks', desc: 'Browse tasks in the main list. Use the sidebar to filter by Today, Upcoming, Favorites, or Pinned. Tap any task to see full details and inline editing.' },
    { title: 'Quick Add', desc: 'Type tasks in plain English using the Quick Add bar. Try \u201cMeeting tomorrow 2pm p1\u201d or \u201cRead chapter 5 every week\u201d \u2014 Flow parses dates, priority, and recurrence naturally.' },
    { title: 'Categories & Filters', desc: 'Organize tasks as Work, Personal, Learning, Health, or Finance. Create custom categories with unique colors from Settings or the sidebar.' },
    { title: 'Task Details', desc: 'Every task supports subtasks, priority levels (urgent / high / medium / low), progress tracking, estimated duration, tags, and reminders for full control.' },
    { title: 'Recurring Tasks', desc: 'Set tasks to repeat daily, weekly, monthly, or on custom days of the week \u2014 perfect for habits, standups, and routines.' },
    { title: 'Calendar View', desc: 'Switch to Calendar view to see all tasks grouped by due date. Each day shows task counts so you can plan your week at a glance.' },
    { title: 'Notes', desc: 'The Notes view gives you a full markdown editor with live preview. Link notes directly to tasks from the task detail panel for easy cross-referencing.' },
    { title: 'Tables', desc: 'The Table Editor creates spreadsheets with rich formatting: bold, italic, text color, background color, alignment, column resize, undo/redo, fill handle, copy/paste, and CSV import/export.' },
    { title: 'Dashboard', desc: 'The Dashboard shows productivity trends, completion rates, category distribution, focus time stats, and your current streak at a glance.' },
    { title: 'Focus Mode', desc: 'Use Focus view with a built-in Pomodoro timer to stay in the zone. Track sessions with custom intervals, add sticky notes, and review your deep work history.' },
    { title: 'Vault', desc: 'The Vault is a local password manager. Store credentials with copy-to-clipboard and search \u2014 all data stays in your browser only.' },
    { title: 'Command Palette & Shortcuts', desc: 'Press Ctrl/Cmd+K for the command palette. N for new task, / to search, T to toggle theme, X for multi-select, ? for help, , for settings.' },
    { title: 'Multi-Select & Bulk Actions', desc: 'Press X to enter multi-select mode, then select several tasks at once to complete, delete, re-prioritize, or bulk-update.' },
    { title: 'Themes & Settings', desc: 'Customize with light/dark/auto themes, accent colors, font sizes, interface density, and high contrast mode \u2014 all from the Settings panel.' },
    { title: 'You\u2019re Ready!', desc: 'The demo data includes sample tasks, notes, and a table to help you get started. Explore freely, or click \u201cStart fresh\u201d below to begin with a clean slate.' },
  ];

  var tourStep = 0;

  function maybeShowWelcome() {
    if (App.Store.state.settings.onboardingComplete) return;
    tourStep = 0;
    renderTourStep();
    var overlay = $('#welcomeScreen');
    overlay.hidden = false;
    requestAnimationFrame(function () { overlay.classList.add('is-open'); });
  }

  function renderTourStep() {
    var step = TOUR_STEPS[tourStep];
    if (!step) return;
    $('#tourTitle').textContent = step.title;
    $('#tourDesc').textContent = step.desc;
    $('#tourPrevBtn').hidden = tourStep === 0;
    $('#tourNextBtn').hidden = tourStep >= TOUR_STEPS.length - 1;
    $('#tourFinishBtn').hidden = tourStep < TOUR_STEPS.length - 1;
    $('#clearDemoDataBtn').hidden = tourStep < TOUR_STEPS.length - 1;
    var dots = $('#tourDots');
    dots.innerHTML = TOUR_STEPS.map(function (s, i) {
      return '<span style="width:8px;height:8px;border-radius:50%;background:' + (i === tourStep ? 'var(--accent-500)' : 'var(--color-border-strong)') + ';transition:background var(--dur-fast);"></span>';
    }).join('');
  }

  function nextTourStep() {
    if (tourStep < TOUR_STEPS.length - 1) { tourStep++; renderTourStep(); }
    else finishTour();
  }

  function prevTourStep() {
    if (tourStep > 0) { tourStep--; renderTourStep(); }
  }

  function finishTour() {
    App.Store.updateSettings({ onboardingComplete: true });
    var overlay = $('#welcomeScreen');
    overlay.classList.remove('is-open');
    setTimeout(function () { overlay.hidden = true; }, 300);
  }

  // ---------------- Settings modal ----------------
  function openSettings() {
    syncSettingsUI();
    const overlay = $('#settingsModal');
    overlay.classList.add('is-open');
    overlay.setAttribute('aria-hidden', 'false');
  }
  function closeSettings() { $('#settingsModal').classList.remove('is-open'); $('#settingsModal').setAttribute('aria-hidden', 'true'); }

  function syncSettingsUI() {
    const s = App.Store.state.settings;
    $('#soundsEnabledToggle').checked = s.soundsEnabled;
    $('#soundVolumeInput').value = s.soundVolume;
    $all('.fontsize-option').forEach((b) => b.classList.toggle('is-active', b.dataset.size === s.fontSize));
    $all('.density-option').forEach((b) => b.classList.toggle('is-active', b.dataset.density === s.density));
    $('#highContrastToggle').checked = s.contrast === 'high';
    $('#reducedMotionToggle').checked = !!s.reducedMotion;
    $('#weekStartsMondayToggle').checked = s.weekStartsMonday;
    App.Pomodoro.openSettingsPanel();
  }

  function initSettingsControls() {
    $('#soundsEnabledToggle').addEventListener('change', (e) => App.Sounds.setEnabled(e.target.checked));
    $('#soundVolumeInput').addEventListener('input', (e) => App.Sounds.setVolume(Number(e.target.value)));
    $('#soundTestBtn').addEventListener('click', () => App.Sounds.play('achievement'));
    $all('.fontsize-option').forEach((b) => b.addEventListener('click', () => { App.Theme.setFontSize(b.dataset.size); syncSettingsUI(); }));
    $all('.density-option').forEach((b) => b.addEventListener('click', () => { App.Theme.setDensity(b.dataset.density); syncSettingsUI(); }));
    $('#highContrastToggle').addEventListener('change', (e) => App.Theme.setContrast(e.target.checked ? 'high' : 'normal'));
    $('#reducedMotionToggle').addEventListener('change', (e) => App.Theme.setReducedMotion(e.target.checked));
    $('#weekStartsMondayToggle').addEventListener('change', (e) => { App.Store.updateSettings({ weekStartsMonday: e.target.checked }); App.Calendar.render(); });
    $('#groupBySelectSettings').addEventListener('change', (e) => { App.Store.updateSettings({ groupBy: e.target.value }); App.Tasks.renderList(); });

    $('#settingsModalCloseBtn').addEventListener('click', closeSettings);
    $('#settingsModal').addEventListener('click', (e) => { if (e.target === e.currentTarget) closeSettings(); });
    $('#settingsTriggerBtn').addEventListener('click', openSettings);

    $('#clearTrashBtn').addEventListener('click', () => {
      if (App.Store.state.trash.length && confirm(`Permanently delete ${App.Store.state.trash.length} items in Trash? This can't be undone.`)) {
        App.Store.emptyTrash();
        App.Toast.show({ message: 'Trash emptied', type: 'success' });
      }
    });
    $('#addCategoryBtn').addEventListener('click', () => {
      showAddCategoryForm($('#addCategoryBtn'), () => { renderCategoryManager(); renderSidebarCategories(); });
    });
    $('#sidebarAddCategoryBtn').addEventListener('click', () => {
      showAddCategoryForm($('#sidebarAddCategoryBtn'), () => { renderSidebarCategories(); });
    });
  }

  function showAddCategoryForm(anchor, onDone) {
    var old = document.querySelector('.cat-add-form');
    if (old) { old.remove(); }
    var form = document.createElement('div');
    form.className = 'cat-add-form';
    form.style.cssText = 'display:flex;gap:6px;align-items:center;padding:6px 0;';
    form.innerHTML =
      '<input type="text" class="cat-add-name" placeholder="Category name" maxlength="30" style="flex:1;min-width:0;padding:4px 8px;border:1px solid var(--color-border);border-radius:var(--radius-sm);background:var(--color-surface);color:var(--color-text);font:inherit;font-size:13px;">' +
      '<input type="color" class="cat-add-color" value="' + randomCatColor() + '" style="width:30px;height:30px;padding:0;border:none;border-radius:var(--radius-sm);cursor:pointer;">' +
      '<button class="btn btn-primary btn-sm" style="padding:4px 10px;">Add</button>' +
      '<button class="btn btn-secondary btn-sm" style="padding:4px 10px;">Cancel</button>';
    anchor.parentNode.insertBefore(form, anchor.nextSibling);
    var nameInput = form.querySelector('.cat-add-name');
    var colorInput = form.querySelector('.cat-add-color');
    nameInput.focus();
    function submit() {
      var name = nameInput.value.trim();
      if (!name) { nameInput.focus(); return; }
      App.Store.addCategory(name, colorInput.value);
      form.remove();
      if (onDone) onDone();
    }
    form.querySelector('.btn-primary').addEventListener('click', submit);
    form.querySelector('.btn-secondary').addEventListener('click', function () { form.remove(); });
    nameInput.addEventListener('keydown', function (e) { if (e.key === 'Enter') { e.preventDefault(); submit(); } else if (e.key === 'Escape') { form.remove(); } });
  }

  function randomCatColor() {
    var palette = ['#5b5fef', '#10b981', '#f59e0b', '#f43f5e', '#14b8a6', '#8b5cf6', '#3b82f6', '#e08a1e'];
    return palette[Math.floor(Math.random() * palette.length)];
  }

  function renderCategoryManager() {
    var wrap = $('#categoryManagerList');
    if (!wrap) return;
    var cats = App.Store.state.categories;
    if (!cats.length) { wrap.innerHTML = '<p class="text-secondary">No categories yet.</p>'; return; }
    wrap.innerHTML = cats.map(function (c) {
      return '<div class="flex-row" style="padding:6px 0;border-bottom:1px solid var(--color-border);gap:8px;">' +
        '<input type="color" class="cat-mgr-color" value="' + c.color + '" data-cat-id="' + c.id + '" style="width:26px;height:26px;padding:0;border:none;border-radius:var(--radius-sm);cursor:pointer;flex-shrink:0;" title="Change color">' +
        '<input type="text" class="cat-mgr-name" value="' + App.Helpers.escapeHtml(c.name) + '" data-cat-id="' + c.id + '" style="flex:1;min-width:0;padding:4px 8px;border:1px solid var(--color-border);border-radius:var(--radius-sm);background:var(--color-surface);color:var(--color-text);font:inherit;font-size:13px;">' +
        '<button class="btn-icon" style="width:26px;height:26px;flex-shrink:0;" data-cat-delete="' + c.id + '" aria-label="Delete category">' + App.Tasks.ICON.trash + '</button>' +
        '</div>';
    }).join('');
    $all('.cat-mgr-name', wrap).forEach(function (inp) {
      inp.addEventListener('change', function () {
        var v = inp.value.trim();
        if (v) App.Store.updateCategory(inp.dataset.catId, { name: v });
      });
      inp.addEventListener('keydown', function (e) { if (e.key === 'Escape') { inp.value = App.Store.state.categories.find(function (c) { return c.id === inp.dataset.catId; })?.name || inp.value; inp.blur(); } });
    });
    $all('.cat-mgr-color', wrap).forEach(function (inp) {
      inp.addEventListener('input', function () {
        App.Store.updateCategory(inp.dataset.catId, { color: inp.value });
      });
    });
    $all('[data-cat-delete]', wrap).forEach(function (btn) {
      btn.addEventListener('click', function () {
        if (confirm('Delete this category? Tasks will be uncategorized, not deleted.')) { App.Store.deleteCategory(btn.dataset.catDelete); renderCategoryManager(); }
      });
    });
  }

  // ---------------- Sidebar category list (nav) ----------------
  function renderSidebarCategories() {
    var wrap = $('#sidebarCategoryList');
    if (!wrap) return;
    wrap.innerHTML = App.Store.state.categories.map(function (c) {
      return '<div class="sidebar-cat-wrap">' +
        '<button class="sidebar-link" data-filter="' + c.id + '">' +
        '<span class="dot" style="background:' + c.color + '"></span>' +
        '<span class="sidebar-cat-name">' + App.Helpers.escapeHtml(c.name) + '</span>' +
        '<span class="count"></span>' +
        '</button>' +
        '<div class="sidebar-cat-actions">' +
        '<button class="sidebar-cat-action" data-cat-rename="' + c.id + '" aria-label="Rename">' + App.Tasks.ICON.edit + '</button>' +
        '<button class="sidebar-cat-action" data-cat-delete="' + c.id + '" aria-label="Delete">' + App.Tasks.ICON.trash + '</button>' +
        '</div></div>';
    }).join('');
    $all('.sidebar-link[data-filter]', wrap).forEach(function (link) { link.addEventListener('click', function () { App.Filters.setActiveFilter(link.dataset.filter); }); });
    $all('[data-cat-delete]', wrap).forEach(function (btn) {
      btn.addEventListener('click', function (e) { e.stopPropagation(); if (confirm('Delete this category? Tasks will be uncategorized, not deleted.')) { App.Store.deleteCategory(btn.dataset.catDelete); renderSidebarCategories(); } });
    });
    $all('[data-cat-rename]', wrap).forEach(function (btn) {
      btn.addEventListener('click', function (e) { e.stopPropagation(); inlineRenameCategory(btn.dataset.catRename); });
    });
  }

  function inlineRenameCategory(id) {
    var wrap = $('#sidebarCategoryList').querySelector('[data-filter="' + id + '"]');
    if (!wrap) return;
    var nameSpan = wrap.querySelector('.sidebar-cat-name');
    var cat = App.Store.state.categories.find(function (c) { return c.id === id; });
    if (!cat) return;
    var input = document.createElement('input');
    input.type = 'text';
    input.value = cat.name;
    input.className = 'sidebar-cat-rename-input';
    input.maxLength = 30;
    nameSpan.replaceWith(input);
    input.focus();
    input.select();
    function done() {
      var v = input.value.trim();
      if (v) App.Store.updateCategory(id, { name: v });
      renderSidebarCategories();
    }
    input.addEventListener('blur', done);
    input.addEventListener('keydown', function (e) { if (e.key === 'Enter') { e.preventDefault(); done(); } else if (e.key === 'Escape') { renderSidebarCategories(); } });
  }

  // ---------------- Help modal (static content tabs) ----------------
  const FAQ = [
    ['Is my data stored anywhere online?', 'No. Everything lives in your browser\u2019s local storage on this device. There\u2019s no account, no server, and no sync between devices unless you export/import manually.'],
    ['Will I lose my tasks if I clear my browser data?', 'Yes \u2014 local storage is tied to this browser on this device. Use Settings \u2192 Backup to export a JSON file regularly if that matters to you.'],
    ['Does this work offline?', 'Yes, once you\u2019ve loaded it once, the service worker caches everything needed to run with no connection.'],
    ['Can I use this on my phone?', 'Yes \u2014 it\u2019s fully responsive, and you can install it to your home screen as a PWA from your browser\u2019s share/menu.'],
    ['How do I move my tasks to a new device?', 'Export a JSON backup on the old device (Settings \u2192 Backup) and import it on the new one.'],
    ['Why can\u2019t I attach large files?', 'Attachments are stored as part of your local browser storage, which most browsers cap around 5\u201310MB total \u2014 so files are capped and images are automatically compressed.'],
  ];

  const SHORTCUTS_GUIDE = [
    ['Ctrl / Cmd + K', 'Open command palette'], ['N', 'New task'], ['/', 'Focus search'],
    ['T', 'Cycle theme'], ['X', 'Toggle multi-select'], ['G then T / C / D / F', 'Go to Tasks / Calendar / Dashboard / Focus'],
    [',', 'Open settings'], ['?', 'Open this help panel'], ['Esc', 'Close any dialog'],
  ];

  function renderHelpTabs() {
    $('#faqPanel').innerHTML = FAQ.map(([q, a]) => `<div style="margin-bottom:16px;"><h4 style="font-size:14px;margin-bottom:4px;">${q}</h4><p class="text-secondary" style="font-size:13px;">${a}</p></div>`).join('');
    $('#shortcutsPanel').innerHTML = SHORTCUTS_GUIDE.map(([k, d]) => `<div class="flex-row" style="justify-content:space-between;padding:8px 0;border-bottom:1px solid var(--color-border);"><span style="font-size:13px;">${d}</span><kbd style="font-family:var(--font-mono);font-size:11px;border:1px solid var(--color-border-strong);border-radius:5px;padding:2px 8px;">${k}</kbd></div>`).join('');
    $('#aboutPanel').innerHTML = `
      <p class="text-secondary" style="font-size:13px;line-height:1.7;">Flow is a static, offline-first task manager built with plain HTML, CSS, and JavaScript \u2014 no frameworks, no build step, no backend. Everything runs and stores data entirely in your browser.</p>
      <p class="text-secondary" style="font-size:13px;margin-top:10px;">Version 1.0.0</p>`;
    $('#changelogPanel').innerHTML = `
      <div style="font-size:13px;"><strong>1.0.0</strong> \u2014 ${App.DateUtils.toISODate(new Date())}<p class="text-secondary" style="margin-top:4px;">Initial release: tasks, calendar, focus timer, dashboard, quotes, PWA/offline support, import/export, and more.</p></div>`;
    $('#privacyPanel').innerHTML = `<p class="text-secondary" style="font-size:13px;line-height:1.7;">Flow collects nothing. There are no analytics, no tracking scripts, and no network requests of any kind after the initial page load \u2014 everything you enter stays in this browser's local storage, on this device, until you delete it or clear your browser data.</p>`;
    $('#feedbackLink').href = 'mailto:feedback@example.com?subject=Flow%20feedback';
  }

  function openHelp(tab) {
    renderHelpTabs();
    switchHelpTab(tab || 'faq');
    const overlay = $('#helpModal');
    overlay.classList.add('is-open');
    overlay.setAttribute('aria-hidden', 'false');
  }
  function switchHelpTab(tab) {
    $all('#helpModal .tab-btn').forEach((b) => b.classList.toggle('is-active', b.dataset.tab === tab));
    $all('#helpModal .tab-panel').forEach((p) => { p.hidden = p.dataset.tab !== tab; });
  }

  function initHelpModal() {
    $('#helpModalCloseBtn').addEventListener('click', () => $('#helpModal').classList.remove('is-open'));
    $('#helpModal').addEventListener('click', (e) => { if (e.target === e.currentTarget) e.currentTarget.classList.remove('is-open'); });
    $('#helpTriggerBtn').addEventListener('click', () => openHelp('faq'));
    $all('#helpModal .tab-btn').forEach((b) => b.addEventListener('click', () => switchHelpTab(b.dataset.tab)));
  }

  // ---------------- Sidebar clock ----------------
  function updateClock() {
    var now = new Date();
    var h = String(now.getHours()).padStart(2, '0');
    var m = String(now.getMinutes()).padStart(2, '0');
    var clockEl = $('#sidebarClock');
    if (clockEl) clockEl.textContent = h + ':' + m;
    var dateEl = $('#sidebarDate');
    if (dateEl) {
      var days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      var months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
      dateEl.textContent = days[now.getDay()] + ', ' + months[now.getMonth()] + ' ' + now.getDate() + ', ' + now.getFullYear();
    }
  }

  function clearDemoData() {
    if (!confirm('Clear all demo data and start fresh? This will remove all tasks, notes, tables, and categories.')) return;
    var s = App.Store.state;
    s.tasks = [];
    s.trash = [];
    s.notes = [];
    s.tables = [];
    s.categories = [];
    s.templates = [];
    s.pomodoroSessions = [];
    s.achievementsUnlocked = [];
    s.activityLog = [];
    s.quoteFavorites = [];
    s.focusStickyNotes = [];
    s.streak = { current: 0, longest: 0, lastCompletionDate: null };
    App.Store.updateSettings({ onboardingComplete: true });
    App.Store.save();
    App.Store.emit('tasks:changed', { type: 'purge' });
    App.Store.emit('notes:changed', { type: 'purge' });
    App.Store.emit('tables:changed', { type: 'purge' });
    finishTour();
    App.Toast.show({ message: 'All demo data cleared. You\'re starting fresh!', type: 'success' });
  }

  function init() {
    initSettingsControls();
    initHelpModal();
    $('#tourNextBtn').addEventListener('click', nextTourStep);
    $('#tourPrevBtn').addEventListener('click', prevTourStep);
    $('#tourFinishBtn').addEventListener('click', finishTour);
    $('#clearDemoDataBtn').addEventListener('click', clearDemoData);
    renderSidebarCategories();
    renderCategoryManager();
    App.Store.on('categories:changed', () => { renderSidebarCategories(); renderCategoryManager(); });
    updateClock();
    setInterval(updateClock, 10000);
    maybeShowWelcome();
  }

  App.Onboarding = { init, openSettings, closeSettings, openHelp };
})();
