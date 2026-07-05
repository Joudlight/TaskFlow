/*
  App.Dashboard — today's numbers, streaks, and small hand-rolled SVG charts
  (no chart library, per the "vanilla JS only" constraint).
*/
(function () {
  'use strict';
  window.App = window.App || {};
  const { $, el } = App.Helpers;
  const D = App.DateUtils;

  const DONUT_COLORS = ['#5b5fef', '#10b981', '#f59e0b', '#f43f5e', '#14b8a6', '#8b5cf6', '#6b9bd8'];

  function computeStats() {
    const tasks = App.Store.state.tasks.filter((t) => !t.archived);
    const today = D.toISODate(new Date());
    const todayTasks = tasks.filter((t) => t.dueDate === today);
    const completedToday = todayTasks.filter((t) => t.status === 'completed').length;
    const totalActive = tasks.filter((t) => t.status !== 'completed').length;
    const totalCompleted = tasks.filter((t) => t.status === 'completed').length;
    const completionPct = tasks.length ? Math.round((totalCompleted / tasks.length) * 100) : 0;
    return { todayTasks, completedToday, remainingToday: todayTasks.length - completedToday, totalActive, totalCompleted, completionPct };
  }

  function renderStatCards() {
    const s = computeStats();
    const streak = App.Store.state.streak;
    const grid = $('#statGrid');
    const cards = [
      { icon: 'check', label: 'Completed today', value: s.completedToday },
      { icon: 'clock', label: 'Remaining today', value: s.remainingToday },
      { icon: 'chart', label: 'Completion rate', value: s.completionPct + '%' },
      { icon: 'flame', label: 'Active tasks', value: s.totalActive },
    ];
    grid.innerHTML = cards.map((c) => `
      <div class="stat-card">
        <div class="stat-card__icon">${statIcon(c.icon)}</div>
        <div class="stat-value">${c.value}</div>
        <div class="stat-label">${c.label}</div>
      </div>`).join('');

    $('#streakCurrentValue').textContent = streak.current;
    $('#streakBestValue').textContent = streak.longest;
  }

  function statIcon(name) {
    const icons = {
      check: '<svg viewBox="0 0 24 24" fill="none"><path d="M5 13l4 4L19 7" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg>',
      clock: '<svg viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="2"/><path d="M12 7v5l3 2" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>',
      chart: '<svg viewBox="0 0 24 24" fill="none"><path d="M4 20V10M12 20V4M20 20v-7" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/></svg>',
      flame: '<svg viewBox="0 0 24 24" fill="none"><path d="M12 2s5 5 5 10a5 5 0 01-10 0c0-2 1-3 2-4 0 1 1 2 2 1-1-3 0-5 1-7z" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/></svg>',
    };
    return icons[name] || '';
  }

  // ---------------- Weekly bar chart (tasks completed per day) ----------------
  function renderWeeklyChart() {
    const container = $('#weeklyBarChart');
    if (!container) return;
    const days = Array.from({ length: 7 }, (_, i) => D.addDays(new Date(), i - 6));
    const counts = days.map((d) => {
      const iso = D.toISODate(d);
      return App.Store.state.tasks.filter((t) => t.completedAt && D.toISODate(new Date(t.completedAt)) === iso).length;
    });
    const max = Math.max(1, ...counts);
    container.innerHTML = days.map((d, i) => {
      const iso = D.toISODate(d);
      const isToday = iso === D.toISODate(new Date());
      const heightPct = Math.round((counts[i] / max) * 100);
      return `<div class="bar-chart__col">
        <div class="bar-chart__bar ${isToday ? 'is-today' : ''}" style="height:${Math.max(heightPct, 4)}%" title="${counts[i]} completed"><span></span></div>
        <div class="bar-chart__label">${D.WEEKDAYS[d.getDay()].slice(0, 1).toUpperCase()}</div>
      </div>`;
    }).join('');
  }

  // ---------------- Category donut ----------------
  function renderCategoryDonut() {
    const wrap = $('#categoryDonutWrap');
    if (!wrap) return;
    const active = App.Store.state.tasks.filter((t) => !t.archived && t.status !== 'completed');
    const cats = App.Store.state.categories;
    const counts = cats.map((c) => active.filter((t) => t.category === c.id).length);
    const uncategorized = active.filter((t) => !t.category).length;
    const labels = cats.map((c) => c.name).concat(uncategorized ? ['No category'] : []);
    const values = counts.concat(uncategorized ? [uncategorized] : []);
    const colors = cats.map((c) => c.color).concat(uncategorized ? ['#8b90a0'] : []);
    const total = values.reduce((a, b) => a + b, 0) || 1;

    let cumulative = 0;
    const R = 52, CX = 60, CY = 60, STROKE = 16;
    const circ = 2 * Math.PI * R;
    const segments = values.map((v, i) => {
      const frac = v / total;
      const dash = frac * circ;
      const offset = cumulative * circ;
      cumulative += frac;
      return `<circle cx="${CX}" cy="${CY}" r="${R}" fill="none" stroke="${colors[i] || DONUT_COLORS[i % DONUT_COLORS.length]}" stroke-width="${STROKE}" stroke-dasharray="${dash} ${circ - dash}" stroke-dashoffset="${-offset}" transform="rotate(-90 ${CX} ${CY})"/>`;
    }).join('');

    wrap.innerHTML = `
      <svg viewBox="0 0 120 120">${total ? segments : `<circle cx="60" cy="60" r="52" fill="none" stroke="var(--color-border)" stroke-width="16"/>`}
        <text x="60" y="64" text-anchor="middle" class="donut-center-label" style="font-size:22px;fill:var(--color-text);">${active.length}</text>
      </svg>
      <div class="donut-legend">${labels.map((l, i) => `
        <div class="donut-legend-row"><span class="dot" style="background:${colors[i] || DONUT_COLORS[i % DONUT_COLORS.length]}"></span>${l}<span class="amt">${values[i]}</span></div>
      `).join('') || '<span class="text-tertiary">No active tasks yet</span>'}</div>`;
  }

  // ---------------- Priority breakdown (simple horizontal bars) ----------------
  function renderPriorityBars() {
    const wrap = $('#priorityBars');
    if (!wrap) return;
    const active = App.Store.state.tasks.filter((t) => !t.archived && t.status !== 'completed');
    const order = ['urgent', 'high', 'medium', 'low'];
    const max = Math.max(1, ...order.map((p) => active.filter((t) => t.priority === p).length));
    wrap.innerHTML = order.map((p) => {
      const count = active.filter((t) => t.priority === p).length;
      return `<div class="flex-row" style="margin-bottom:8px;">
        <span style="width:60px;font-size:12px;font-weight:700;color:var(--priority-${p});text-transform:capitalize;">${p}</span>
        <div style="flex:1;height:8px;border-radius:99px;background:var(--color-surface-sunken);overflow:hidden;">
          <div style="width:${(count / max) * 100}%;height:100%;background:var(--priority-${p});border-radius:inherit;"></div>
        </div>
        <span style="width:24px;text-align:right;font-size:12px;font-weight:700;font-family:var(--font-mono);">${count}</span>
      </div>`;
    }).join('');
  }

  function refresh() {
    renderStatCards();
    renderWeeklyChart();
    renderCategoryDonut();
    renderPriorityBars();
    if (App.Pomodoro) App.Pomodoro.renderStats();
  }

  function init() {
    App.Store.on('tasks:changed', refresh);
    App.Store.on('streak:changed', renderStatCards);
    refresh();
  }

  App.Dashboard = { init, refresh, computeStats };
})();
