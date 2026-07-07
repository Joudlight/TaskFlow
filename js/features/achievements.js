/*
  App.Achievements — a modest set of unlockable badges, checked after actions
  that could trigger one, plus the confetti celebration used app-wide.
*/
(function () {
  'use strict';
  window.App = window.App || {};
  const { $, el } = App.Helpers;

  const BADGES = [
    { id: 'first-task', name: 'Getting started', desc: 'Create your first task', icon: '\u{1F331}', test: (s) => s.tasks.length + s.trash.length >= 1 },
    { id: 'first-complete', name: 'First win', desc: 'Complete your first task', icon: '\u2705', test: (s) => s.tasks.some((t) => t.status === 'completed') },
    { id: 'ten-complete', name: 'Ten down', desc: 'Complete 10 tasks', icon: '\u{1F3AF}', test: (s) => countCompleted(s) >= 10 },
    { id: 'fifty-complete', name: 'Half century', desc: 'Complete 50 tasks', icon: '\u{1F3C6}', test: (s) => countCompleted(s) >= 50 },
    { id: 'hundred-complete', name: 'Centurion', desc: 'Complete 100 tasks', icon: '\u{1F451}', test: (s) => countCompleted(s) >= 100 },
    { id: 'streak-3', name: 'Warming up', desc: '3-day streak', icon: '\u{1F525}', test: (s) => s.streak.current >= 3 },
    { id: 'streak-7', name: 'On a roll', desc: '7-day streak', icon: '\u26A1', test: (s) => s.streak.current >= 7 },
    { id: 'streak-30', name: 'Unstoppable', desc: '30-day streak', icon: '\u{1F48E}', test: (s) => s.streak.current >= 30 },
    { id: 'first-pomodoro', name: 'Deep breath', desc: 'Finish your first focus session', icon: '\u{1F345}', test: (s) => s.pomodoroSessions.length >= 1 },
    { id: 'ten-pomodoro', name: 'In the zone', desc: 'Finish 10 focus sessions', icon: '\u{1F9E0}', test: (s) => s.pomodoroSessions.length >= 10 },
    { id: 'organizer', name: 'Organizer', desc: 'Create 3 categories', icon: '\u{1F5C2}\uFE0F', test: (s) => s.categories.length >= 3 },
    { id: 'planner', name: 'Planner', desc: 'Schedule 20 tasks with a due date', icon: '\u{1F5D3}\uFE0F', test: (s) => s.tasks.filter((t) => t.dueDate).length >= 20 },
    { id: 'clean-sweep', name: 'Clean sweep', desc: 'Complete every task due today', icon: '\u2728', test: () => false /* set via celebrate() */ },
    { id: 'night-owl', name: 'Night owl', desc: 'Complete a task after 11pm', icon: '\u{1F989}', test: () => new Date().getHours() >= 23 },
  ];

  function countCompleted(s) { return s.tasks.filter((t) => t.status === 'completed').length; }

  function check() {
    const s = App.Store.state;
    BADGES.forEach((b) => {
      if (s.achievementsUnlocked.includes(b.id)) return;
      if (b.test(s)) unlock(b);
    });
  }

  function unlock(badge) {
    App.Store.state.achievementsUnlocked.push(badge.id);
    App.Store.save();
    App.Sounds.play('achievement');
    showUnlockToast(badge);
    App.Helpers.announce(`Achievement unlocked: ${badge.name}`);
  }

  function showUnlockToast(badge) {
    const wrap = el('div', { class: 'toast pop-in', style: 'background:var(--accent-500);color:#fff;' });
    wrap.innerHTML = `<span style="font-size:22px;">${badge.icon}</span><span class="toast__msg"><strong>Achievement unlocked</strong><br>${badge.name}</span>`;
    $('#toastContainer').appendChild(wrap);
    setTimeout(() => { wrap.classList.add('is-leaving'); setTimeout(() => wrap.remove(), 250); }, 3600);
  }

  function celebrate() {
    if (!App.Store.state.achievementsUnlocked.includes('clean-sweep')) unlock(BADGES.find((b) => b.id === 'clean-sweep'));
    fireConfetti();
    App.Toast.show({ type: 'success', message: '\u{1F389} All of today\u2019s tasks are done!' });
  }

  function fireConfetti() {
    if (App.Store.state.settings.reducedMotion) return;
    let layer = $('#confettiLayer');
    if (!layer) {
      layer = el('div', { id: 'confettiLayer', class: 'confetti-layer', 'aria-hidden': 'true' });
      document.body.appendChild(layer);
    }
    const colors = ['#5b5fef', '#10b981', '#f59e0b', '#f43f5e', '#14b8a6', '#8b5cf6'];
    for (let i = 0; i < 90; i++) {
      const piece = el('div', { class: 'confetti-piece' });
      const x = Math.random() * 100;
      const drift = (Math.random() - 0.5) * 300;
      const duration = 2200 + Math.random() * 1600;
      const delay = Math.random() * 350;
      piece.style.left = x + 'vw';
      piece.style.background = colors[i % colors.length];
      piece.style.setProperty('--drift', drift + 'px');
      piece.style.setProperty('--spin', (Math.random() > 0.5 ? 1 : -1) * (360 + Math.random() * 480) + 'deg');
      piece.style.animationDuration = duration + 'ms';
      piece.style.animationDelay = delay + 'ms';
      piece.style.borderRadius = Math.random() > 0.5 ? '50%' : '2px';
      layer.appendChild(piece);
      setTimeout(() => piece.remove(), duration + delay + 100);
    }
  }

  function openModal() {
    const grid = $('#achievementsGrid');
    const unlocked = App.Store.state.achievementsUnlocked;
    grid.innerHTML = BADGES.map((b) => `
      <div class="card" style="text-align:center;padding:16px 10px;opacity:${unlocked.includes(b.id) ? 1 : 0.35};">
        <div style="font-size:32px;margin-bottom:6px;">${b.icon}</div>
        <div style="font-weight:700;font-size:13px;">${b.name}</div>
        <div class="text-tertiary" style="font-size:11px;margin-top:2px;">${b.desc}</div>
      </div>`).join('');
    $('#achievementsCount').textContent = `${unlocked.length} / ${BADGES.length} unlocked`;
    const overlay = $('#achievementsModal');
    overlay.classList.add('is-open');
    overlay.setAttribute('aria-hidden', 'false');
  }

  function init() {
    $('#achievementsTriggerBtn').addEventListener('click', openModal);
    $('#achievementsModalCloseBtn').addEventListener('click', () => $('#achievementsModal').classList.remove('is-open'));
    $('#achievementsModal').addEventListener('click', (e) => { if (e.target === e.currentTarget) e.currentTarget.classList.remove('is-open'); });
    check();
  }

  App.Achievements = { init, check, celebrate, openModal, BADGES };
})();
