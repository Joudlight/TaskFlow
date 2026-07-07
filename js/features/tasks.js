/*
  App.Tasks — renders the task list/groups, owns the quick-add bar, and handles
  per-item actions via event delegation. Filtering/sorting logic lives in App.Filters;
  this module just renders whatever App.Filters says is visible.
*/
(function () {
  'use strict';
  window.App = window.App || {};
  const { $, $all, el, escapeHtml, fireRipple } = App.Helpers;
  const D = App.DateUtils;

  const ICON = {
    check: '<svg viewBox="0 0 24 24" fill="none"><path d="M5 13l4 4L19 7" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    star: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l2.9 6.6L22 9.6l-5.2 4.8L18.2 22 12 18.3 5.8 22 7.2 14.4 2 9.6l7.1-1z"/></svg>',
    starOutline: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M12 2l2.9 6.6L22 9.6l-5.2 4.8L18.2 22 12 18.3 5.8 22 7.2 14.4 2 9.6l7.1-1z"/></svg>',
    pin: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M14.5 2.5l7 7-3 3-1-1-4 4 .5 5-2-.3-3-5-5 5-1-1 5-5-5-3-.3-2 5 .5 4-4-1-1z"/></svg>',
    edit: '<svg viewBox="0 0 24 24" fill="none"><path d="M4 20h4L18.5 9.5a2.1 2.1 0 000-3l-1-1a2.1 2.1 0 00-3 0L4 15v5z" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/></svg>',
    duplicate: '<svg viewBox="0 0 24 24" fill="none"><rect x="8" y="8" width="12" height="12" rx="2" stroke="currentColor" stroke-width="1.8"/><path d="M16 8V6a2 2 0 00-2-2H6a2 2 0 00-2 2v8a2 2 0 002 2h2" stroke="currentColor" stroke-width="1.8"/></svg>',
    trash: '<svg viewBox="0 0 24 24" fill="none"><path d="M4 7h16M9 7V4h6v3M6 7l1 13a2 2 0 002 2h6a2 2 0 002-2l1-13" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    preview: '<svg viewBox="0 0 24 24" fill="none"><path d="M4 12s1.5-6 8-6 8 6 8 6-1.5 6-8 6-8-6-8-6z" stroke="currentColor" stroke-width="1.8"/><circle cx="12" cy="12" r="2.5" stroke="currentColor" stroke-width="1.8"/></svg>',
    calendar: '<svg viewBox="0 0 24 24" fill="none"><rect x="3" y="5" width="18" height="16" rx="2" stroke="currentColor" stroke-width="1.8"/><path d="M8 3v4M16 3v4M3 10h18" stroke="currentColor" stroke-width="1.8"/></svg>',
    clock: '<svg viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="1.8"/><path d="M12 7v5l3 2" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>',
    subtask: '<svg viewBox="0 0 24 24" fill="none"><path d="M9 6h11M9 12h11M9 18h11M5 6h.01M5 12h.01M5 18h.01" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>',
    empty: '<svg viewBox="0 0 24 24" fill="none"><path d="M9 11l3 3L22 4M12 3H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-6" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    archive: '<svg viewBox="0 0 24 24" fill="none"><rect x="3" y="4" width="18" height="5" rx="1" stroke="currentColor" stroke-width="1.8"/><path d="M5 9v9a2 2 0 002 2h10a2 2 0 002-2V9M10 13h4" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>',
    restore: '<svg viewBox="0 0 24 24" fill="none"><path d="M4 12a8 8 0 0114-5.3M20 12a8 8 0 01-14 5.3" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/><path d="M18 4v4h-4M6 20v-4h4" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    permanentDelete: '<svg viewBox="0 0 24 24" fill="none"><path d="M4 7h16M9 7V4h6v3M10 12v4M14 12v4" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/><path d="M6 7l1 13a2 2 0 002 2h6a2 2 0 002-2l1-13" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>',
  };

  function priorityLabel(p) { return { low: 'Low', medium: 'Medium', high: 'High', urgent: 'Urgent' }[p] || p; }

  function taskCategory(task) { return App.Store.state.categories.find((c) => c.id === task.category); }

  function renderMetaTags(task) {
    const tags = [];
    if (task.dueDate) {
      const overdue = D.isPast(task.dueDate) && task.status !== 'completed';
      const today = D.isToday(task.dueDate);
      tags.push(`<span class="meta-tag meta-tag--due ${overdue ? 'is-overdue' : ''} ${today ? 'is-today' : ''}">${ICON.calendar}${escapeHtml(D.friendlyDate(task.dueDate))}${task.dueTime ? ' · ' + escapeHtml(D.friendlyTime(task.dueTime)) : ''}</span>`);
    }
    if (task.priority && task.priority !== 'medium') {
      tags.push(`<span class="meta-tag" style="color:var(--priority-${task.priority})">${priorityLabel(task.priority)}</span>`);
    }
    const cat = taskCategory(task);
    if (cat) tags.push(`<span class="meta-tag meta-tag--category" style="--tag-color:${cat.color}">${escapeHtml(cat.name)}</span>`);
    if (task.estimatedDuration) tags.push(`<span class="meta-tag">${ICON.clock}${task.estimatedDuration}m</span>`);
    if (task.recurrence) tags.push(`<span class="meta-tag">\u21BB ${task.recurrence.type}</span>`);
    if (task.attachments && task.attachments.length) tags.push(`<span class="meta-tag">\uD83D\uDCCE ${task.attachments.length}</span>`);
    if (task.linkedNoteIds && task.linkedNoteIds.length) tags.push(`<span class="meta-tag">\uD83D\uDCC4 ${task.linkedNoteIds.length}</span>`);
    return tags.join('');
  }

  function renderTaskItem(task, opts) {
    opts = opts || {};
    const isComplete = task.status === 'completed';
    const subtaskDone = (task.subtasks || []).filter((s) => s.done).length;
    const subtaskTotal = (task.subtasks || []).length;

    const node = el('li', {
      class: `task-item${isComplete ? ' is-complete' : ''}`,
      dataset: { taskId: task.id },
      draggable: opts.draggable ? 'true' : 'false',
      'data-priority': task.priority,
      style: task.color ? `border-left-color:${task.color}` : '',
    });

    node.innerHTML = `
      ${opts.selectMode ? `<input type="checkbox" class="task-select-check" aria-label="Select task" ${opts.selected ? 'checked' : ''}>` : `<span class="task-item__drag-handle" aria-hidden="true"><svg width="16" height="16" viewBox="0 0 24 24" fill="none"><circle cx="8" cy="6" r="1.4" fill="currentColor"/><circle cx="8" cy="12" r="1.4" fill="currentColor"/><circle cx="8" cy="18" r="1.4" fill="currentColor"/><circle cx="16" cy="6" r="1.4" fill="currentColor"/><circle cx="16" cy="12" r="1.4" fill="currentColor"/><circle cx="16" cy="18" r="1.4" fill="currentColor"/></svg></span>`}
      <button class="task-checkbox" data-action="toggle" aria-label="${isComplete ? 'Mark incomplete' : 'Mark complete'}" aria-pressed="${isComplete}">${ICON.check}</button>
      <div class="task-item__body" data-action="open">
        <div class="task-item__top">
          <div style="flex:1;min-width:0;">
            <div class="task-item__title">${escapeHtml(task.title)}</div>
            ${task.description ? `<div class="task-item__desc">${escapeHtml(task.description)}</div>` : ''}
          </div>
        </div>
        ${subtaskTotal ? `<div class="task-item__subtask-summary">${ICON.subtask} ${subtaskDone}/${subtaskTotal} subtasks</div>` : ''}
        <div class="task-item__meta">${renderMetaTags(task)}</div>
        ${(function() { const p = subtaskTotal && !task.progress ? Math.round((subtaskDone / subtaskTotal) * 100) : task.progress; return p > 0 && p < 100 ? `<div class="task-item__progress"><span style="width:${p}%"></span></div>` : ''; })()}
      </div>
      <div class="task-item__actions">${opts.isTrash ? `
        <button class="btn-icon" data-action="restore" aria-label="Restore task">${ICON.restore}</button>
        <button class="btn-icon" data-action="permanent-delete" aria-label="Permanently delete">${ICON.permanentDelete}</button>` : opts.isArchive ? `
        <button class="btn-icon" data-action="restore" aria-label="Restore from archive">${ICON.restore}</button>
        <button class="btn-icon" data-action="delete" aria-label="Delete task">${ICON.trash}</button>` : `
        <button class="btn-icon star-btn ${task.favorite ? 'is-favorite' : ''}" data-action="favorite" aria-label="${task.favorite ? 'Remove favorite' : 'Add favorite'}" aria-pressed="${task.favorite}">${task.favorite ? ICON.star : ICON.starOutline}</button>
        <button class="btn-icon pin-btn ${task.pinned ? 'is-pinned' : ''}" data-action="pin" aria-label="${task.pinned ? 'Unpin' : 'Pin'}" aria-pressed="${task.pinned}">${ICON.pin}</button>
        <button class="btn-icon" data-action="duplicate" aria-label="Duplicate task">${ICON.duplicate}</button>
        <button class="btn-icon" data-action="preview" aria-label="Preview task">${ICON.preview}</button>
        <button class="btn-icon" data-action="edit" aria-label="Edit task">${ICON.edit}</button>
        <button class="btn-icon" data-action="archive" aria-label="Archive task">${ICON.archive}</button>
        <button class="btn-icon" data-action="delete" aria-label="Delete task">${ICON.trash}</button>`}
      </div>`;
    return node;
  }

  function renderEmptyState(context) {
    const copy = {
      all: ['Nothing here yet', 'Add your first task above \u2014 or try Quick Add with a phrase like "Team sync tomorrow 4pm".'],
      today: ['Nothing due today', 'Enjoy the clear runway, or pull something in from Upcoming.'],
      upcoming: ['Nothing on the horizon', 'Tasks with a future due date will show up here.'],
      favorites: ['No favorites yet', 'Tap the star on any task to pin it here.'],
      pinned: ['Nothing pinned', 'Pin your most important tasks to keep them at the top.'],
      archive: ['Archive is empty', 'Completed tasks you archive will land here.'],
      trash: ['Trash is empty', 'Deleted tasks stay here until you empty the trash.'],
      search: ['No matches', 'Try a different search term or clear your filters.'],
    }[context] || ['All clear', 'Nothing to show for this view right now.'];
    return el('div', { class: 'empty-state' }, [
      el('div', { html: ICON.empty }),
      el('h3', { text: copy[0] }),
      el('p', { text: copy[1] }),
    ]);
  }

  const collapsedGroups = new Set();

  function renderList() {
    const container = $('#taskListContainer');
    if (!container) return;
    const groups = App.Filters.getGroupedTasks();
    container.innerHTML = '';

    if (!groups.length) {
      container.appendChild(renderEmptyState(App.Filters.state.activeFilter === 'all' && !App.Filters.state.search ? 'all' : (App.Filters.state.search ? 'search' : App.Filters.state.activeFilter)));
      return;
    }

    groups.forEach((group) => {
      const isCollapsed = collapsedGroups.has(group.key);
      const groupEl = el('div', { class: 'task-group' + (isCollapsed ? ' is-collapsed' : '') }, [
        el('div', { class: 'task-group__title', dataset: { groupKey: group.key } }, [group.label, el('span', { class: 'count', text: ` ${group.tasks.length}` })]),
      ]);
      const list = el('ul', { class: 'task-list' });
      const activeFilter = App.Filters.state.activeFilter;
      group.tasks.forEach((task) => list.appendChild(renderTaskItem(task, {
        draggable: App.Filters.state.sortBy === 'manual' && activeFilter === 'all',
        selectMode: App.Filters.state.selectMode,
        selected: App.Filters.state.selectedIds.has(task.id),
        isTrash: activeFilter === 'trash',
        isArchive: activeFilter === 'archive',
      })));
      groupEl.appendChild(list);
      container.appendChild(groupEl);
    });
    initGroupCollapse();
    App.DragDrop.attachListHandlers(container);
  }

  function initGroupCollapse() {
    const container = $('#taskListContainer');
    container.querySelectorAll('.task-group__title').forEach((title) => {
      title.addEventListener('click', (e) => {
        const key = title.dataset.groupKey;
        if (!key) return;
        const group = title.closest('.task-group');
        if (collapsedGroups.has(key)) { collapsedGroups.delete(key); group.classList.remove('is-collapsed'); }
        else { collapsedGroups.add(key); group.classList.add('is-collapsed'); }
      });
    });
  }

  // ---------------- Quick add ----------------
  function initQuickAdd() {
    const input = $('#quickAddInput');
    const hint = $('#quickAddHint');
    if (!input) return;
    input.addEventListener('input', () => {
      if (!input.value.trim()) { hint.textContent = ''; return; }
      const parsed = D.parseNaturalLanguage(input.value);
      const bits = [];
      if (parsed.dueDate) bits.push(D.friendlyDate(parsed.dueDate));
      if (parsed.dueTime) bits.push(D.friendlyTime(parsed.dueTime));
      if (parsed.recurrence) bits.push('repeats ' + parsed.recurrence.type);
      hint.innerHTML = bits.length ? `Will set: <strong>${escapeHtml(bits.join(' \u00b7 '))}</strong>` : '';
    });
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && input.value.trim()) {
        e.preventDefault();
        createFromQuickAdd(input.value);
        input.value = '';
        hint.textContent = '';
      }
    });
    $('#quickAddBtn').addEventListener('click', () => {
      if (input.value.trim()) { createFromQuickAdd(input.value); input.value = ''; hint.textContent = ''; input.focus(); }
      else input.focus();
    });
  }

  function createFromQuickAdd(rawText) {
    const parsed = D.parseNaturalLanguage(rawText);
    const activeFilter = App.Filters.state.activeFilter;
    const category = activeFilter && !['all', 'today', 'upcoming', 'favorites', 'pinned', 'archive', 'trash'].includes(activeFilter) ? activeFilter : null;
    const task = App.Store.addTask({
      title: parsed.cleanTitle, dueDate: parsed.dueDate, dueTime: parsed.dueTime,
      recurrence: parsed.recurrence, category, favorite: activeFilter === 'favorites', pinned: activeFilter === 'pinned',
    });
    App.Sounds.play('create');
    App.Toast.show({ type: 'success', message: `Added "${task.title}"`, icon: 'success' });
    App.Achievements.check();
  }

  // ---------------- Delegated actions ----------------
  function initDelegation() {
    const container = $('#taskListContainer');
    container.addEventListener('click', (e) => {
      const selectCheck = e.target.closest('.task-select-check');
      const itemEl = e.target.closest('.task-item');
      if (!itemEl) return;
      const id = itemEl.dataset.taskId;

      if (selectCheck) { App.Filters.toggleSelect(id); return; }

      const actionBtn = e.target.closest('[data-action]');
      if (!actionBtn) return;
      const action = actionBtn.dataset.action;
      fireRipple(e, actionBtn.classList.contains('btn-icon') || actionBtn.classList.contains('task-checkbox') ? actionBtn : null);

      switch (action) {
        case 'toggle': handleToggle(id, itemEl); break;
        case 'favorite': { const t = App.Store.getTask(id); App.Store.updateTask(id, { favorite: !t.favorite }); renderList(); break; }
        case 'pin': { const t = App.Store.getTask(id); App.Store.updateTask(id, { pinned: !t.pinned }); renderList(); App.Toast.show({ message: t.pinned ? 'Unpinned' : 'Pinned to top', type: 'info' }); break; }
        case 'duplicate': { App.Store.duplicateTask(id); App.Sounds.play('create'); App.Toast.show({ message: 'Task duplicated', type: 'success' }); break; }
        case 'edit': case 'open':
          if (App.Store.getTask(id)) { App.TaskModal.open(id); } else { App.Toast.show({ message: 'Task no longer available', type: 'info' }); }
          break;
        case 'preview':
          if (App.Store.getTask(id)) { App.TaskModal.openWithPreview(id); } else { App.Toast.show({ message: 'Task no longer available', type: 'info' }); }
          break;
        case 'delete': handleDelete(id); break;
        case 'archive': handleArchive(id); break;
        case 'restore': handleRestore(id); break;
        case 'permanent-delete': handlePermanentDelete(id); break;
      }
    });
  }

  function handleToggle(id, itemEl) {
    const wasComplete = App.Store.getTask(id).status === 'completed';
    if (!wasComplete) itemEl.classList.add('is-completing');
    App.Store.toggleComplete(id);
    App.Sounds.play(wasComplete ? 'uncomplete' : 'complete');
    App.Achievements.check();
    setTimeout(() => { renderList(); checkAllTodayComplete(); }, wasComplete ? 0 : 260);
  }

  function handleDelete(id) {
    const task = App.Store.getTask(id);
    const itemEl = $(`.task-item[data-task-id="${id}"]`);
    if (itemEl) itemEl.classList.add('is-removing');
    App.Sounds.play('delete');
    setTimeout(() => {
      App.Store.deleteTask(id);
      renderList();
      App.Toast.show({
        type: 'danger', message: `Deleted "${task.title}"`, icon: 'danger',
        actionLabel: 'Undo', onAction: () => { App.Store.restoreTask(id); renderList(); App.Toast.show({ message: 'Task restored', type: 'success' }); },
      });
    }, 220);
  }

  function handleArchive(id) {
    const task = App.Store.getTask(id);
    if (!task) return;
    App.Store.archiveTask(id);
    renderList();
    App.Toast.show({
      type: 'info', message: `Archived "${task.title}"`,
      actionLabel: 'Undo', onAction: () => { App.Store.restoreFromArchive(id); renderList(); App.Toast.show({ message: 'Task restored from archive', type: 'success' }); },
    });
  }

  function handleRestore(id) {
    const filter = App.Filters.state.activeFilter;
    if (filter === 'trash') {
      const task = App.Store.state.trash.find((t) => t.id === id);
      App.Store.restoreTask(id);
      renderList();
      App.Toast.show({ message: `Restored "${task ? task.title : ''}"`, type: 'success' });
    } else if (filter === 'archive') {
      App.Store.restoreFromArchive(id);
      renderList();
      App.Toast.show({ message: 'Task restored from archive', type: 'success' });
    }
  }

  function handlePermanentDelete(id) {
    if (confirm('Permanently delete this task? This cannot be undone.')) {
      App.Store.permanentlyDelete(id);
      renderList();
      App.Toast.show({ message: 'Task permanently deleted', type: 'danger' });
    }
  }

  function checkAllTodayComplete() {
    const todayTasks = App.Store.state.tasks.filter((t) => t.dueDate && D.isToday(t.dueDate));
    if (todayTasks.length && todayTasks.every((t) => t.status === 'completed')) {
      App.Achievements.celebrate();
    }
  }

  function updateTabTitle() {
    const due = App.Store.state.tasks.filter((t) => t.dueDate && D.isToday(t.dueDate) && t.status !== 'completed');
    const overdue = App.Store.state.tasks.filter((t) => t.dueDate && D.isPast(t.dueDate) && t.status !== 'completed');
    const total = due.length + overdue.length;
    document.title = total ? `(${total}) Flow` : 'Flow \u2014 Focus & Task Manager';
  }

  function initSwipeComplete() {
    const container = $('#taskListContainer');
    let startX = 0, startY = 0, swiping = false;
    container.addEventListener('touchstart', (e) => {
      const item = e.target.closest('.task-item');
      if (!item || item.querySelector('.task-select-check')) return;
      startX = e.touches[0].clientX;
      startY = e.touches[0].clientY;
      swiping = false;
    }, { passive: true });
    container.addEventListener('touchmove', (e) => {
      if (!startX) return;
      const dx = e.touches[0].clientX - startX;
      const dy = e.touches[0].clientY - startY;
      if (Math.abs(dx) > 10 && Math.abs(dx) > Math.abs(dy) * 1.5) {
        swiping = true;
      }
    }, { passive: true });
    container.addEventListener('touchend', (e) => {
      if (!swiping) return;
      const item = e.target.closest('.task-item');
      if (!item) return;
      const dx = e.changedTouches[0].clientX - startX;
      if (dx < -60) {
        const id = item.dataset.taskId;
        if (id) handleToggle(id, item);
      }
      startX = 0; swiping = false;
    }, { passive: true });
  }

  function init() {
    initQuickAdd();
    initDelegation();
    initSwipeComplete();
    App.Store.on('tasks:changed', () => { renderList(); updateTabTitle(); });
    App.Store.on('categories:changed', renderList);
    renderList();
    updateTabTitle();
  }

  App.Tasks = { init, renderList, renderTaskItem, ICON, priorityLabel, taskCategory };
})();
