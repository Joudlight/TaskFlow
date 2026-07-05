/*
  App.Shortcuts — global keyboard shortcuts + the Ctrl/Cmd+K command palette.
*/
(function () {
  'use strict';
  window.App = window.App || {};
  const { $, $all, el, escapeHtml, trapFocus } = App.Helpers;

  let releaseFocusTrap = null;
  let activeIndex = 0;
  let filteredCommands = [];

  function commands() {
    return [
      { id: 'new-task', label: 'New task', icon: 'plus', hint: 'N', run: () => App.TaskModal.open(null) },
      { id: 'go-tasks', label: 'Go to Tasks', icon: 'list', hint: 'G T', run: () => App.Views.show('tasks') },
      { id: 'go-calendar', label: 'Go to Calendar', icon: 'calendar', hint: 'G C', run: () => App.Views.show('calendar') },
      { id: 'go-dashboard', label: 'Go to Dashboard', icon: 'chart', hint: 'G D', run: () => App.Views.show('dashboard') },
      { id: 'go-focus', label: 'Go to Focus timer', icon: 'clock', hint: 'G F', run: () => App.Views.show('focus') },
      { id: 'toggle-theme', label: 'Toggle theme', icon: 'theme', hint: 'T', run: () => App.Theme.cycleTheme() },
      { id: 'start-timer', label: 'Start/pause focus timer', icon: 'clock', hint: '', run: () => { App.Views.show('focus'); App.Pomodoro.toggle(); } },
      { id: 'search', label: 'Focus search', icon: 'search', hint: '/', run: () => $('#taskSearchInput').focus() },
      { id: 'select-mode', label: 'Toggle multi-select', icon: 'check', hint: 'X', run: () => App.Filters.setSelectMode(!App.Filters.state.selectMode) },
      { id: 'export', label: 'Export data (JSON)', icon: 'download', hint: '', run: () => App.ImportExport.exportJSON() },
      { id: 'print', label: 'Print current view', icon: 'print', hint: '', run: () => App.Print.printCurrentView() },
      { id: 'share', label: 'Share app', icon: 'share', hint: '', run: () => App.Share.open() },
      { id: 'settings', label: 'Open settings', icon: 'settings', hint: ',', run: () => App.Onboarding.openSettings() },
      { id: 'help', label: 'Help & shortcuts', icon: 'help', hint: '?', run: () => App.Onboarding.openHelp() },
      { id: 'achievements', label: 'View achievements', icon: 'trophy', hint: '', run: () => App.Achievements.openModal() },
    ];
  }

  const ICONS = {
    plus: '<path d="M12 5v14M5 12h14" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>',
    list: '<path d="M9 6h11M9 12h11M9 18h11M5 6h.01M5 12h.01M5 18h.01" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>',
    calendar: '<rect x="3" y="5" width="18" height="16" rx="2" stroke="currentColor" stroke-width="1.8"/><path d="M8 3v4M16 3v4M3 10h18" stroke="currentColor" stroke-width="1.8"/>',
    chart: '<path d="M4 20V10M12 20V4M20 20v-7" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>',
    clock: '<circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="1.8"/><path d="M12 7v5l3 2" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>',
    theme: '<circle cx="12" cy="12" r="4" stroke="currentColor" stroke-width="1.8"/><path d="M12 2v2M12 20v2M4 12H2M22 12h-2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>',
    search: '<circle cx="11" cy="11" r="7" stroke="currentColor" stroke-width="1.8"/><path d="M21 21l-4.3-4.3" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>',
    check: '<path d="M5 13l4 4L19 7" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>',
    download: '<path d="M12 4v12M6 12l6 6 6-6M4 20h16" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>',
    print: '<path d="M6 9V3h12v6M6 18h12v4H6zM4 9h16v7H4z" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/>',
    share: '<circle cx="18" cy="5" r="2.5" stroke="currentColor" stroke-width="1.8"/><circle cx="6" cy="12" r="2.5" stroke="currentColor" stroke-width="1.8"/><circle cx="18" cy="19" r="2.5" stroke="currentColor" stroke-width="1.8"/><path d="M8.2 10.8l7.6-4.6M8.2 13.2l7.6 4.6" stroke="currentColor" stroke-width="1.8"/>',
    settings: '<circle cx="12" cy="12" r="3" stroke="currentColor" stroke-width="1.8"/><path d="M19 12a7 7 0 00-.2-1.6l2-1.6-2-3.4-2.4.7a7 7 0 00-1.4-.8L14.6 3H9.4l-.4 2.3a7 7 0 00-1.4.8l-2.4-.7-2 3.4 2 1.6a7 7 0 000 3.2l-2 1.6 2 3.4 2.4-.7c.4.3.9.6 1.4.8l.4 2.3h5.2l.4-2.3c.5-.2 1-.5 1.4-.8l2.4.7 2-3.4-2-1.6c.1-.5.2-1 .2-1.6z" stroke="currentColor" stroke-width="1.4"/>',
    help: '<circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="1.8"/><path d="M9.5 9a2.5 2.5 0 015 0c0 1.5-2.5 1.8-2.5 3.5M12 17h.01" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>',
    trophy: '<path d="M8 4h8v5a4 4 0 01-8 0V4z" stroke="currentColor" stroke-width="1.8"/><path d="M8 5H5a3 3 0 003 3M16 5h3a3 3 0 01-3 3M9 20h6M12 13v4" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>',
  };

  function openPalette() {
    const overlay = $('#commandPalette');
    overlay.classList.add('is-open');
    overlay.setAttribute('aria-hidden', 'false');
    const input = $('#paletteInput');
    input.value = '';
    filterCommands('');
    releaseFocusTrap = trapFocus($('.palette', overlay));
    document.body.style.overflow = 'hidden';
  }
  function closePalette() {
    const overlay = $('#commandPalette');
    overlay.classList.remove('is-open');
    overlay.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    if (releaseFocusTrap) releaseFocusTrap();
  }

  function filterCommands(query) {
    const q = query.trim().toLowerCase();
    filteredCommands = !q ? commands() : commands().filter((c) => c.label.toLowerCase().includes(q));
    activeIndex = 0;
    renderPaletteList();
  }

  function renderPaletteList() {
    const list = $('#paletteList');
    if (!filteredCommands.length) { list.innerHTML = '<div class="palette-empty">No matching commands</div>'; return; }
    list.innerHTML = filteredCommands.map((c, i) => `
      <div class="palette-item ${i === activeIndex ? 'is-active' : ''}" data-idx="${i}" role="option" aria-selected="${i === activeIndex}">
        <svg viewBox="0 0 24 24" fill="none">${ICONS[c.icon] || ''}</svg>
        <span>${escapeHtml(c.label)}</span>
        ${c.hint ? `<span class="hint">${c.hint}</span>` : ''}
      </div>`).join('');
    $all('.palette-item', list).forEach((item) => item.addEventListener('click', () => runCommand(Number(item.dataset.idx))));
  }

  function runCommand(idx) {
    const cmd = filteredCommands[idx];
    if (!cmd) return;
    closePalette();
    cmd.run();
  }

  function initPalette() {
    $('#paletteInput').addEventListener('input', (e) => filterCommands(e.target.value));
    $('#commandPalette').addEventListener('click', (e) => { if (e.target === e.currentTarget) closePalette(); });
    $('#commandPaletteTrigger').addEventListener('click', openPalette);
    document.addEventListener('keydown', (e) => {
      const paletteOpen = $('#commandPalette').classList.contains('is-open');
      if (paletteOpen) {
        if (e.key === 'ArrowDown') { e.preventDefault(); activeIndex = Math.min(activeIndex + 1, filteredCommands.length - 1); renderPaletteList(); }
        else if (e.key === 'ArrowUp') { e.preventDefault(); activeIndex = Math.max(activeIndex - 1, 0); renderPaletteList(); }
        else if (e.key === 'Enter') { e.preventDefault(); runCommand(activeIndex); }
        else if (e.key === 'Escape') { closePalette(); }
      }
    });
  }

  function isTypingContext(e) {
    const tag = (e.target.tagName || '').toLowerCase();
    return tag === 'input' || tag === 'textarea' || tag === 'select' || e.target.isContentEditable;
  }

  function initGlobalShortcuts() {
    let pendingG = false;
    document.addEventListener('keydown', (e) => {
      const meta = e.metaKey || e.ctrlKey;
      if (meta && e.key.toLowerCase() === 'k') { e.preventDefault(); $('#commandPalette').classList.contains('is-open') ? closePalette() : openPalette(); return; }
      if (isTypingContext(e)) return;

      if (pendingG) {
        pendingG = false;
        if (e.key === 't') { App.Views.show('tasks'); return; }
        else if (e.key === 'c') { App.Views.show('calendar'); return; }
        else if (e.key === 'd') { App.Views.show('dashboard'); return; }
        else if (e.key === 'f') { App.Views.show('focus'); return; }
      }
      if (e.key === 'g') { pendingG = true; setTimeout(() => { pendingG = false; }, 900); return; }
      if (e.key === 'n') { e.preventDefault(); App.TaskModal.open(null); }
      else if (e.key === '/') { e.preventDefault(); $('#taskSearchInput').focus(); }
      else if (e.key === 't') { App.Theme.cycleTheme(); }
      else if (e.key === 'x') { App.Filters.setSelectMode(!App.Filters.state.selectMode); }
      else if (e.key === '?') { App.Onboarding.openHelp(); }
      else if (e.key === ',') { App.Onboarding.openSettings(); }
    });
  }

  function init() { initPalette(); initGlobalShortcuts(); }

  App.Shortcuts = { init, openPalette, closePalette };
})();
