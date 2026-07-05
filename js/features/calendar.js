/*
  App.Calendar — month / week / agenda views. Click a day to quick-add a task
  due that day; drag a chip to another day to reschedule (via App.DragDrop).
*/
(function () {
  'use strict';
  window.App = window.App || {};
  const { $, el, escapeHtml } = App.Helpers;
  const D = App.DateUtils;

  let cursor = new Date(); // the month/week currently displayed
  let mode = 'month'; // month | week | agenda

  function tasksOnDate(iso) {
    return App.Store.state.tasks.filter((t) => t.dueDate === iso && !t.archived);
  }

  function setMode(m) {
    mode = m;
    App.Helpers.$all('.cal-toolbar .tab-btn').forEach((b) => b.classList.toggle('is-active', b.dataset.calMode === m));
    render();
  }

  function navigate(delta) {
    if (mode === 'month') cursor = D.addMonths(cursor, delta);
    else cursor = D.addDays(cursor, delta * (mode === 'week' ? 7 : 1));
    render();
  }
  function goToday() { cursor = new Date(); render(); }

  function render() {
    const root = $('#calendarGrid');
    if (!root) return;
    $('#calToolbarTitle').textContent = mode === 'month'
      ? `${D.MONTH_NAMES[cursor.getMonth()]} ${cursor.getFullYear()}`
      : mode === 'week' ? weekRangeLabel(cursor) : 'Agenda';

    root.innerHTML = '';
    if (mode === 'month') root.appendChild(renderMonth());
    else if (mode === 'week') root.appendChild(renderWeek());
    else root.appendChild(renderAgenda());
    App.DragDrop.attachCalendarHandlers(root);
  }

  function weekRangeLabel(d) {
    const start = startOfWeek(d);
    const end = D.addDays(start, 6);
    return `${D.MONTH_NAMES[start.getMonth()].slice(0, 3)} ${start.getDate()} \u2013 ${D.MONTH_NAMES[end.getMonth()].slice(0, 3)} ${end.getDate()}`;
  }
  function startOfWeek(d) {
    const c = D.startOfDay(d);
    const startsMonday = App.Store.state.settings.weekStartsMonday;
    const offset = startsMonday ? (c.getDay() + 6) % 7 : c.getDay();
    return D.addDays(c, -offset);
  }

  function renderMonth() {
    const wrap = el('div');
    const grid = el('div', { class: 'cal-grid' });
    const weekdayLabels = App.Store.state.settings.weekStartsMonday
      ? ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] : ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    weekdayLabels.forEach((w) => grid.appendChild(el('div', { class: 'cal-weekday', text: w })));

    const firstOfMonth = new Date(cursor.getFullYear(), cursor.getMonth(), 1);
    const gridStart = startOfWeek(firstOfMonth);
    const today = D.toISODate(new Date());

    for (let i = 0; i < 42; i++) {
      const date = D.addDays(gridStart, i);
      const iso = D.toISODate(date);
      const isOutside = date.getMonth() !== cursor.getMonth();
      const dayTasks = tasksOnDate(iso);
      const dayEl = el('div', {
        class: `cal-day${isOutside ? ' is-outside' : ''}${iso === today ? ' is-today' : ''}${dayTasks.length ? ' has-tasks' : ''}`,
        dataset: { date: iso }, tabindex: '0', role: 'button', 'aria-label': `${iso}, ${dayTasks.length} tasks`,
      });
      dayEl.innerHTML = `<span class="cal-day__num">${date.getDate()}</span>`;
      dayTasks.slice(0, 3).forEach((t) => {
        const cat = App.Store.state.categories.find((c) => c.id === t.category);
        dayEl.innerHTML += `<div class="cal-day__chip ${t.status === 'completed' ? 'is-complete' : ''}" draggable="true" data-task-id="${t.id}" style="--tag-color:${(cat && cat.color) || t.color || 'var(--accent-500)'}">${escapeHtml(t.title)}</div>`;
      });
      if (dayTasks.length > 3) dayEl.innerHTML += `<div class="cal-day__more">+${dayTasks.length - 3} more</div>`;
      dayEl.addEventListener('click', (e) => { if (!e.target.closest('.cal-day__chip')) openDayComposer(iso); });
      grid.appendChild(dayEl);
    }
    wrap.appendChild(grid);
    return wrap;
  }

  function renderWeek() {
    const wrap = el('div', { class: 'cal-week-grid' });
    const start = startOfWeek(cursor);
    const head = el('div', { class: 'cal-week-head' });
    head.appendChild(el('div'));
    for (let i = 0; i < 7; i++) {
      const d = D.addDays(start, i);
      head.appendChild(el('div', { text: `${D.WEEKDAYS[d.getDay()].slice(0, 3).toUpperCase()} ${d.getDate()}` }));
    }
    wrap.appendChild(head);

    const body = el('div', { class: 'cal-week-body' });
    for (let hour = 0; hour < 24; hour++) {
      body.appendChild(el('div', { class: 'cal-hour-label', text: hour === 0 ? '' : `${(hour % 12) || 12}${hour < 12 ? 'a' : 'p'}` }));
      for (let day = 0; day < 7; day++) {
        const d = D.addDays(start, day);
        const iso = D.toISODate(d);
        const cell = el('div', { class: 'cal-week-cell', dataset: { date: iso } });
        tasksOnDate(iso).filter((t) => t.dueTime && parseInt(t.dueTime, 10) === hour).forEach((t) => {
          cell.appendChild(el('div', { class: 'cal-week-event', text: t.title, onClick: () => App.TaskModal.open(t.id) }));
        });
        body.appendChild(cell);
      }
    }
    wrap.appendChild(body);
    return wrap;
  }

  function renderAgenda() {
    const wrap = el('div');
    const tasks = App.Store.state.tasks.filter((t) => t.dueDate && !t.archived && t.status !== 'completed').sort((a, b) => a.dueDate.localeCompare(b.dueDate));
    if (!tasks.length) return App.Tasks.renderTaskItem ? el('div', { class: 'empty-state', html: '<h3>No upcoming tasks</h3><p>Tasks with due dates will appear here in order.</p>' }) : wrap;
    const byDate = {};
    tasks.forEach((t) => { (byDate[t.dueDate] = byDate[t.dueDate] || []).push(t); });
    Object.keys(byDate).sort().forEach((iso) => {
      const dayWrap = el('div', { class: 'agenda-day' });
      const d = D.fromISODate(iso);
      dayWrap.appendChild(el('div', { class: 'agenda-day__label' }, [
        el('span', { class: 'num', text: String(d.getDate()).padStart(2, '0') }),
        `${D.WEEKDAYS[d.getDay()].replace(/^\w/, (c) => c.toUpperCase())}, ${D.MONTH_NAMES[d.getMonth()]} \u00b7 ${D.friendlyDate(iso)}`,
      ]));
      const list = el('ul', { class: 'task-list' });
      byDate[iso].forEach((t) => list.appendChild(App.Tasks.renderTaskItem(t, {})));
      dayWrap.appendChild(list);
      wrap.appendChild(dayWrap);
    });
    return wrap;
  }

  function openDayComposer(iso) {
    App.TaskModal.open(null);
    // Pre-fill due date once the modal's fields exist in the DOM
    requestAnimationFrame(() => { $('#taskDueDateInput').value = iso; });
  }

  function init() {
    $('#calPrevBtn').addEventListener('click', () => navigate(-1));
    $('#calNextBtn').addEventListener('click', () => navigate(1));
    $('#calTodayBtn').addEventListener('click', goToday);
    App.Helpers.$all('.cal-toolbar .tab-btn').forEach((b) => b.addEventListener('click', () => setMode(b.dataset.calMode)));
    App.Store.on('tasks:changed', () => { const calView = $('#view-calendar'); if (calView && !calView.hidden) render(); });
  }

  App.Calendar = { init, render, setMode };
})();
