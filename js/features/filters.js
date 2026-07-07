/*
  App.Filters — owns the "what's currently visible" state: search text, active
  saved-filter (all/today/upcoming/favorites/pinned/archive/trash/category),
  sort order, grouping, and multi-select for bulk actions.
*/
(function () {
  'use strict';
  window.App = window.App || {};
  const { $, $all, el } = App.Helpers;
  const D = App.DateUtils;

  const state = {
    search: '',
    activeFilter: 'all',
    sortBy: 'manual', // manual | date | name | priority | progress | category | created | modified
    selectMode: false,
    selectedIds: new Set(),
  };

  const PRIORITY_WEIGHT = { urgent: 0, high: 1, medium: 2, low: 3 };

  function baseList() {
    const s = App.Store.state;
    if (state.activeFilter === 'trash') return s.trash;
    let list = s.tasks.filter((t) => !t.archived);
    if (state.activeFilter === 'archive') list = s.tasks.filter((t) => t.archived);
    else if (state.activeFilter === 'favorites') list = list.filter((t) => t.favorite);
    else if (state.activeFilter === 'pinned') list = list.filter((t) => t.pinned);
    else if (state.activeFilter === 'today') list = list.filter((t) => t.dueDate && D.isToday(t.dueDate) && t.status !== 'completed');
    else if (state.activeFilter === 'upcoming') list = list.filter((t) => t.dueDate && !D.isToday(t.dueDate) && !D.isPast(t.dueDate) && t.status !== 'completed');
    else if (state.activeFilter !== 'all' && state.activeFilter !== 'archive') list = list.filter((t) => t.category === state.activeFilter);
    return list;
  }

  function applySearch(list) {
    if (!state.search.trim()) return list;
    const q = state.search.trim().toLowerCase();
    return list.filter((t) =>
      t.title.toLowerCase().includes(q) ||
      (t.description || '').toLowerCase().includes(q) ||
      (t.tags || []).some((tag) => tag.toLowerCase().includes(q)) ||
      (t.notes || '').toLowerCase().includes(q)
    );
  }

  function applySort(list) {
    const arr = list.slice();
    switch (state.sortBy) {
      case 'date': return arr.sort((a, b) => (a.dueDate || '9999').localeCompare(b.dueDate || '9999') || (a.dueTime || '').localeCompare(b.dueTime || ''));
      case 'name': return arr.sort((a, b) => a.title.localeCompare(b.title));
      case 'priority': return arr.sort((a, b) => PRIORITY_WEIGHT[a.priority] - PRIORITY_WEIGHT[b.priority]);
      case 'progress': return arr.sort((a, b) => b.progress - a.progress);
      case 'category': return arr.sort((a, b) => (a.category || '').localeCompare(b.category || ''));
      case 'created': return arr.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
      case 'modified': return arr.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
      default: return arr.sort((a, b) => a.order - b.order);
    }
  }

  function pinnedFirst(list) {
    return list.slice().sort((a, b) => (b.pinned - a.pinned));
  }

  /** Returns [{ key, label, tasks }] ready for rendering. */
  function getGroupedTasks() {
    let list = applySort(applySearch(baseList()));
    if (state.activeFilter !== 'trash') list = pinnedFirst(list);
    if (!list.length) return [];

    if (state.activeFilter === 'trash' || state.activeFilter === 'archive' || state.sortBy !== 'manual' && state.sortBy !== 'date') {
      return [{ key: 'all', label: labelFor(state.activeFilter), tasks: list }];
    }
    if (App.Store.state.settings.groupBy === 'category' ) {
      const cats = App.Store.state.categories;
      const groups = [];
      cats.forEach((c) => { const t = list.filter((x) => x.category === c.id); if (t.length) groups.push({ key: c.id, label: c.name, tasks: t }); });
      const none = list.filter((x) => !x.category);
      if (none.length) groups.push({ key: 'none', label: 'No category', tasks: none });
      return groups;
    }

    // Default: group by date bucket (Overdue / Today / Upcoming / No date / Completed)
    const overdue = [], today = [], upcoming = [], noDate = [], completed = [];
    list.forEach((t) => {
      if (t.status === 'completed') completed.push(t);
      else if (t.dueDate && D.isPast(t.dueDate)) overdue.push(t);
      else if (t.dueDate && D.isToday(t.dueDate)) today.push(t);
      else if (t.dueDate) upcoming.push(t);
      else noDate.push(t);
    });
    const groups = [];
    if (overdue.length) groups.push({ key: 'overdue', label: '\u26A0\uFE0F Overdue', tasks: overdue });
    if (today.length) groups.push({ key: 'today', label: 'Today', tasks: today });
    if (upcoming.length) groups.push({ key: 'upcoming', label: 'Upcoming', tasks: upcoming });
    if (noDate.length) groups.push({ key: 'nodate', label: 'No date', tasks: noDate });
    if (completed.length) groups.push({ key: 'completed', label: 'Completed', tasks: completed });
    return groups;
  }

  function labelFor(filter) {
    const map = { all: 'All tasks', today: 'Today', upcoming: 'Upcoming', favorites: 'Favorites', pinned: 'Pinned', archive: 'Archive', trash: 'Trash' };
    if (map[filter]) return map[filter];
    const cat = App.Store.state.categories.find((c) => c.id === filter);
    return cat ? cat.name : 'Tasks';
  }

  // ---------------- Multi-select / bulk ----------------
  function toggleSelect(id) {
    state.selectedIds.has(id) ? state.selectedIds.delete(id) : state.selectedIds.add(id);
    updateBulkBar();
    App.Tasks.renderList();
  }
  function setSelectMode(on) {
    state.selectMode = on;
    if (!on) state.selectedIds.clear();
    updateBulkBar();
    App.Tasks.renderList();
  }
  function selectAllVisible() {
    getGroupedTasks().forEach((g) => g.tasks.forEach((t) => state.selectedIds.add(t.id)));
    updateBulkBar();
    App.Tasks.renderList();
  }
  function updateBulkBar() {
    const bar = $('#bulkBar');
    if (!bar) return;
    bar.hidden = !state.selectMode || state.selectedIds.size === 0;
    const countEl = $('#bulkCount');
    if (countEl) countEl.textContent = `${state.selectedIds.size} selected`;
  }

  function populateBulkMoveSelect() {
    const sel = $('#bulkMoveSelect');
    if (!sel) return;
    sel.innerHTML = '<option value="">Move to\u2026</option><option value="__none__">No category</option>' +
      App.Store.state.categories.map((c) => `<option value="${c.id}">${c.name}</option>`).join('');
  }

  function initBulkBar() {
    $('#bulkCompleteBtn').addEventListener('click', () => {
      App.Store.bulkComplete(Array.from(state.selectedIds));
      App.Sounds.play('complete');
      setSelectMode(false);
    });
    $('#bulkDeleteBtn').addEventListener('click', () => {
      const ids = Array.from(state.selectedIds);
      const count = ids.length;
      if (state.activeFilter === 'trash') {
        if (!confirm('Permanently delete these tasks? This action cannot be undone.')) return;
        App.Store.bulkPermanentDelete(ids);
        App.Sounds.play('delete');
        App.Toast.show({ type: 'danger', message: `Permanently deleted ${count} tasks`, icon: 'danger' });
      } else {
        const tasks = ids.map((id) => App.Store.getTask(id)).filter(Boolean);
        App.Store.bulkDelete(ids);
        App.Sounds.play('delete');
        App.Toast.show({
          type: 'danger', message: `Deleted ${count} tasks`, icon: 'danger', persistent: true,
          actionLabel: 'Undo', onAction: () => { tasks.forEach((t) => App.Store.restoreTask(t.id)); App.Toast.show({ message: `${count} tasks restored`, type: 'success' }); },
        });
      }
      setSelectMode(false);
    });
    $('#bulkMoveSelect').addEventListener('change', (e) => {
      if (!e.target.value) return;
      App.Store.bulkUpdate(Array.from(state.selectedIds), { category: e.target.value === '__none__' ? null : e.target.value });
      App.Toast.show({ message: 'Moved tasks', type: 'success' });
      setSelectMode(false);
      e.target.value = '';
    });
    $('#bulkCancelBtn').addEventListener('click', () => setSelectMode(false));
    $('#selectModeBtn').addEventListener('click', () => setSelectMode(!state.selectMode));
  }

  function initToolbar() {
    const search = $('#taskSearchInput');
    search.addEventListener('input', App.Helpers.debounce(() => { state.search = search.value; App.Tasks.renderList(); }, 120));

    $('#sortSelect').addEventListener('change', (e) => { state.sortBy = e.target.value; App.Tasks.renderList(); });

    $all('.sidebar-link[data-filter]').forEach((link) => {
      link.addEventListener('click', () => setActiveFilter(link.dataset.filter));
    });

    $('#groupBySelect').addEventListener('change', (e) => { App.Store.updateSettings({ groupBy: e.target.value }); App.Tasks.renderList(); });
  }

  function setActiveFilter(filter) {
    state.activeFilter = filter;
    state.selectMode = false; state.selectedIds.clear();
    App.Helpers.$all('.sidebar-link[data-filter]').forEach((l) => l.classList.toggle('is-active', l.dataset.filter === filter));
    const titleEl = $('#tasksViewTitle');
    if (titleEl) titleEl.textContent = labelFor(filter);
    if (App.Views) App.Views.show('tasks');
    App.Tasks.renderList();
    updateBulkBar();
    if (window.innerWidth <= 980) App.Helpers.$('#appSidebar').classList.remove('is-open');
    App.Storage.set('activeFilter', filter);
  }

  function refreshSidebarCounts() {
    const s = App.Store.state;
    const active = s.tasks.filter((t) => !t.archived);
    const counts = {
      all: active.length,
      today: active.filter((t) => t.dueDate && D.isToday(t.dueDate) && t.status !== 'completed').length,
      upcoming: active.filter((t) => t.dueDate && !D.isToday(t.dueDate) && !D.isPast(t.dueDate) && t.status !== 'completed').length,
      favorites: active.filter((t) => t.favorite).length,
      pinned: active.filter((t) => t.pinned).length,
      archive: s.tasks.filter((t) => t.archived).length,
      trash: s.trash.length,
    };
    Object.keys(counts).forEach((key) => {
      const el2 = document.querySelector(`.sidebar-link[data-filter="${key}"] .count`);
      if (el2) el2.textContent = counts[key] || '';
    });
  }

  function init() {
    initToolbar();
    initBulkBar();
    const savedFilter = App.Storage.get('activeFilter', null);
    if (savedFilter && savedFilter !== 'all') setActiveFilter(savedFilter);
    App.Store.on('tasks:changed', refreshSidebarCounts);
    App.Store.on('categories:changed', refreshSidebarCounts);
    App.Store.on('categories:changed', populateBulkMoveSelect);
    refreshSidebarCounts();
    populateBulkMoveSelect();
  }

  App.Filters = { state, init, getGroupedTasks, toggleSelect, setSelectMode, selectAllVisible, setActiveFilter, labelFor, updateBulkBar };
})();
