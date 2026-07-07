/*
  App.Pomodoro — focus timer with circular SVG progress, short/long breaks,
  session history persisted to the store for the dashboard's charts.
  Additional features: daily focus goal, interruption tracking, session notes,
  recent sessions list.
*/
(function () {
  'use strict';
  window.App = window.App || {};
  const { $, el } = App.Helpers;
  const D = App.DateUtils;

  const RING_RADIUS = 90;
  const CIRC = 2 * Math.PI * RING_RADIUS;

  let phase = 'focus'; // focus | short | long | custom

  const SKIP_CYCLE = ['focus', 'short', 'long', 'custom'];
  let secondsLeft = 0;
  let totalSeconds = 0;
  let running = false;
  let intervalId = null;
  let completedFocusSessions = 0; // since app open, for long-break cadence
  let linkedTaskId = null;
  let interruptionCount = 0;

  function settings() { return App.Store.state.settings.pomodoro; }

  function durationFor(p) {
    const s = settings();
    return { focus: s.focusMin, short: s.shortBreakMin, long: s.longBreakMin, custom: s.customMin || 30 }[p] * 60;
  }

  function reset(newPhase) {
    phase = newPhase || 'focus';
    totalSeconds = durationFor(phase);
    secondsLeft = totalSeconds;
    interruptionCount = 0;
    render();
  }

  function tick() {
    secondsLeft--;
    if (secondsLeft <= 0) { finishSession(); return; }
    render();
  }

  function start() {
    if (running) return;
    running = true;
    intervalId = setInterval(tick, 1000);
    render();
  }
  function pause() {
    if (!running) return;
    running = false;
    clearInterval(intervalId);
    if (phase === 'focus') interruptionCount++;
    render();
  }
  function toggle() { running ? pause() : start(); }
  function skip() { finishSession(true); }

  function finishSession(skipped) {
    pause();
    if (phase === 'focus' && !skipped) {
      completedFocusSessions++;
      App.Store.state.pomodoroSessions.unshift({
        id: App.Helpers.uuid(), phase: 'focus', minutes: settings().focusMin,
        taskId: linkedTaskId, completedAt: new Date().toISOString(), date: D.toISODate(new Date()),
        interruptions: interruptionCount, note: '',
      });
      App.Store.save();
      App.Sounds.play('timerFinish');
      notifyFinished('Focus session complete', 'Nice work \u2014 time for a break.');
      App.Achievements.check();
      showSessionNotePrompt();
    } else if (phase !== 'focus' && !skipped) {
      App.Sounds.play('notification');
      notifyFinished('Break\u2019s over', 'Ready for another focus session?');
    }

    let nextPhase;
    if (skipped) {
      const idx = SKIP_CYCLE.indexOf(phase);
      nextPhase = SKIP_CYCLE[(idx + 1) % SKIP_CYCLE.length];
    } else if (phase === 'focus') {
      nextPhase = (completedFocusSessions % settings().sessionsBeforeLongBreak === 0) ? 'long' : 'short';
    } else {
      nextPhase = 'focus';
    }
    reset(nextPhase);
    renderSessionDots();
    renderRecentSessions();
    renderDailyGoal();
    App.Dashboard.refresh();
    if (settings().autoStartNext && !skipped) start();
  }

  function showSessionNotePrompt() {
    const last = App.Store.state.pomodoroSessions[0];
    if (!last) return;
    App.Toast.show({
      type: 'info', message: 'Session complete! Add a note about what you accomplished.',
      duration: 8000, actionLabel: 'Add note',
      onAction: () => {
        const note = prompt('What did you accomplish this session?', last.note || '');
        if (note !== null) { last.note = note; App.Store.save(); renderRecentSessions(); }
      },
    });
  }

  function notifyFinished(title, body) {
    if (App.Notifications) App.Notifications.notify(title, body);
  }

  function render() {
    const digitsEl = $('#timerDigits');
    if (!digitsEl) return;
    const mm = Math.floor(secondsLeft / 60), ss = secondsLeft % 60;
    digitsEl.textContent = `${String(mm).padStart(2, '0')}:${String(ss).padStart(2, '0')}`;
    const labelMap = { focus: 'Focus', short: 'Short break', long: 'Long break', custom: 'Custom' };
    $('#timerLabel').textContent = labelMap[phase] || 'Focus';
    $('#timerLabel').classList.toggle('is-break', phase !== 'focus');

    const infoEl = $('#focusCustomInfo');
    if (infoEl) infoEl.hidden = phase !== 'custom';

    const ring = $('#focusRingProgress');
    const progress = totalSeconds ? (totalSeconds - secondsLeft) / totalSeconds : 0;
    ring.style.strokeDasharray = `${CIRC}`;
    ring.style.strokeDashoffset = `${CIRC * (1 - progress)}`;
    ring.classList.toggle('is-break', phase !== 'focus');

    const playBtn = $('#timerToggleBtn');
    playBtn.innerHTML = running
      ? '<svg viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="5" width="4" height="14" rx="1"/><rect x="14" y="5" width="4" height="14" rx="1"/></svg>'
      : '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>';
    playBtn.setAttribute('aria-label', running ? 'Pause timer' : 'Start timer');

    document.title = running ? `${digitsEl.textContent} \u2014 Flow` : 'Flow \u2014 Focus & Task Manager';

    const taskLabel = $('#focusCurrentTask');
    const linked = linkedTaskId && App.Store.getTask(linkedTaskId);
    taskLabel.innerHTML = linked ? `Focusing on <strong>${App.Helpers.escapeHtml(linked.title)}</strong>` : 'No task linked \u2014 pick one to track focus time against it.';
  }

  function renderSessionDots() {
    const wrap = $('#focusSessionDots');
    if (!wrap) return;
    const n = settings().sessionsBeforeLongBreak;
    const done = completedFocusSessions % n;
    wrap.innerHTML = Array.from({ length: n }, (_, i) => `<span class="${i < done ? 'is-done' : ''}"></span>`).join('');
  }

  function renderDailyGoal() {
    const el = $('#focusDailyGoalText');
    if (!el) return;
    const goalMin = settings().dailyGoalMin || 120;
    const today = D.toISODate(new Date());
    const todayMin = App.Store.state.pomodoroSessions
      .filter((s) => s.date === today && s.phase === 'focus')
      .reduce((a, s) => a + s.minutes, 0);
    const pct = Math.min(100, Math.round((todayMin / goalMin) * 100));
    el.textContent = `${todayMin}m / ${fmtHM(goalMin)}`;
    const fill = $('#focusDailyGoalFill');
    if (fill) fill.style.width = `${pct}%`;
  }

  function renderRecentSessions() {
    const wrap = $('#focusRecentSessions');
    if (!wrap) return;
    const sessions = App.Store.state.pomodoroSessions.filter((s) => s.phase === 'focus').slice(0, 5);
    if (!sessions.length) {
      wrap.innerHTML = '<div class="focus-recent-sessions__title">Recent sessions</div><div class="focus-recent-sessions__empty">No focus sessions yet. Start the timer to build your streak!</div>';
      return;
    }
    const html = ['<div class="focus-recent-sessions__title">Recent sessions</div>'];
    sessions.forEach((s) => {
      const task = s.taskId && App.Store.getTask(s.taskId);
      const taskName = task ? App.Helpers.escapeHtml(task.title) : 'No task';
      const time = new Date(s.completedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      const noteHtml = s.note ? `<div class="focus-recent-sessions__note">${App.Helpers.escapeHtml(s.note)}</div>` : '';
      const intLabel = s.interruptions > 0 ? ` <span class="focus-recent-sessions__ints">${s.interruptions} pause${s.interruptions > 1 ? 's' : ''}</span>` : '';
      html.push(`<div class="focus-recent-sessions__item" data-session-id="${s.id}">
        <div class="focus-recent-sessions__item-head">
          <span class="focus-recent-sessions__time">${time}</span>
          <span class="focus-recent-sessions__mins">${s.minutes} min</span>
          ${intLabel}
          <button class="btn-icon btn-icon--xs focus-recent-sessions__note-btn" aria-label="Edit note"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M12 20h9M16.5 3.5a2 2 0 012.8 2.8L8 17l-4 1 1-4L16.5 3.5z"/></svg></button>
        </div>
        <div class="focus-recent-sessions__task">${taskName}</div>
        ${noteHtml}
      </div>`);
    });
    wrap.innerHTML = html.join('');
    wrap.querySelectorAll('.focus-recent-sessions__note-btn').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        const item = e.target.closest('.focus-recent-sessions__item');
        const id = item && item.dataset.sessionId;
        if (!id) return;
        const session = App.Store.state.pomodoroSessions.find((s) => s.id === id);
        if (!session) return;
        const note = prompt('Edit session note:', session.note || '');
        if (note !== null) { session.note = note; App.Store.save(); renderRecentSessions(); }
      });
    });
  }

  function renderStats() {
    const sessions = App.Store.state.pomodoroSessions;
    const today = D.toISODate(new Date());
    const weekAgo = D.toISODate(D.addDays(new Date(), -6));
    const todayMin = sessions.filter((s) => s.date === today).reduce((a, s) => a + s.minutes, 0);
    const weekMin = sessions.filter((s) => s.date >= weekAgo).reduce((a, s) => a + s.minutes, 0);
    const monthAgo = D.toISODate(D.addDays(new Date(), -29));
    const monthMin = sessions.filter((s) => s.date >= monthAgo).reduce((a, s) => a + s.minutes, 0);
    $('#focusStatToday').textContent = fmtHM(todayMin);
    $('#focusStatWeek').textContent = fmtHM(weekMin);
    $('#focusStatMonth').textContent = fmtHM(monthMin);
  }
  function fmtHM(min) { return min >= 60 ? `${Math.floor(min / 60)}h ${min % 60}m` : `${min}m`; }

  function populateTaskLinkSelect() {
    const sel = $('#focusTaskLinkSelect');
    if (!sel) return;
    const active = App.Store.state.tasks.filter((t) => t.status !== 'completed' && !t.archived);
    sel.innerHTML = '<option value="">No linked task</option>' + active.map((t) => `<option value="${t.id}">${App.Helpers.escapeHtml(t.title)}</option>`).join('');
    sel.value = linkedTaskId || '';
  }

  function openSettingsPanel() {
    $('#pomodoroFocusMinInput').value = settings().focusMin;
    $('#pomodoroShortMinInput').value = settings().shortBreakMin;
    $('#pomodoroLongMinInput').value = settings().longBreakMin;
    $('#pomodoroCustomMinInput').value = settings().customMin || 30;
    $('#pomodoroSessionsInput').value = settings().sessionsBeforeLongBreak;
    $('#pomodoroAutoStartInput').checked = settings().autoStartNext;
    $('#pomodoroGoalInput').value = settings().dailyGoalMin || 120;
  }

  function saveSettingsPanel() {
    App.Store.updateSettings({
      pomodoro: {
        focusMin: Number($('#pomodoroFocusMinInput').value) || 25,
        shortBreakMin: Number($('#pomodoroShortMinInput').value) || 5,
        longBreakMin: Number($('#pomodoroLongMinInput').value) || 15,
        customMin: Number($('#pomodoroCustomMinInput').value) || 30,
        sessionsBeforeLongBreak: Number($('#pomodoroSessionsInput').value) || 4,
        autoStartNext: $('#pomodoroAutoStartInput').checked,
        soundOnFinish: true,
        dailyGoalMin: Number($('#pomodoroGoalInput').value) || 120,
      },
    });
    if (!running) reset(phase);
    renderDailyGoal();
    App.Toast.show({ type: 'success', message: 'Focus timer settings saved' });
  }

  function toggleFullscreenFocus() {
    const isFs = document.documentElement.getAttribute('data-focus-mode') === 'fullscreen';
    document.documentElement.setAttribute('data-focus-mode', isFs ? 'normal' : 'fullscreen');
    const btn = $('#focusFullscreenBtn');
    if (btn) btn.textContent = isFs ? 'Distraction-free' : 'Exit Distraction-free';
  }

  function renderClock() {
    try {
      const focusView = $('#view-focus');
      if (!focusView || focusView.hidden) return;
      const timeEl = $('#focusClockTime');
      const dateEl = $('#focusClockDate');
      if (!timeEl || !dateEl) return;
      const now = new Date();
      timeEl.textContent = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
      dateEl.textContent = now.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
    } catch (_) { /* clock update failed, will retry next interval */ }
  }

  function init() {
    const svg = $('#focusRingWrap svg');
    if (svg) {
      const track = $('#focusRingTrack');
      if (track) track.setAttribute('r', RING_RADIUS);
      const prog = $('#focusRingProgress');
      if (prog) prog.setAttribute('r', RING_RADIUS);
    }
    reset('focus');
    renderSessionDots();
    renderDailyGoal();
    renderRecentSessions();
    const toggleBtn = $('#timerToggleBtn');
    if (toggleBtn) toggleBtn.addEventListener('click', toggle);
    const resetBtn = $('#timerResetBtn');
    if (resetBtn) resetBtn.addEventListener('click', () => reset(phase));
    const skipBtn = $('#timerSkipBtn');
    if (skipBtn) skipBtn.addEventListener('click', skip);
    const fsBtn = $('#focusFullscreenBtn');
    if (fsBtn) fsBtn.addEventListener('click', toggleFullscreenFocus);
    const taskLink = $('#focusTaskLinkSelect');
    if (taskLink) taskLink.addEventListener('change', (e) => { linkedTaskId = e.target.value || null; render(); });
    const saveBtn = $('#pomodoroSaveSettingsBtn');
    if (saveBtn) saveBtn.addEventListener('click', saveSettingsPanel);
    const settingsLink = $('#focusCustomSettingsLink');
    if (settingsLink) settingsLink.addEventListener('click', () => { const btn = $('#settingsTriggerBtn'); if (btn) btn.click(); });
    App.Store.on('tasks:changed', populateTaskLinkSelect);
    App.Store.on('settings:changed', () => { renderStats(); renderDailyGoal(); });
    App.Store.on('tasks:changed', () => renderRecentSessions());
    populateTaskLinkSelect();
    renderStats();
    renderClock();
    setInterval(renderClock, 1000);
    if (App.FocusSticky) {
      App.FocusSticky.init();
    } else {
      // Direct wiring fallback if focus-sticky.js didn't load
      const stickyBtn = $('#focusStickyAddBtn');
      if (stickyBtn) {
        var notes = App.Store.state.focusStickyNotes || [];
        if (notes.length) {
          // Notes exist but module isn't loaded — for now just attach a basic handler
        }
        stickyBtn.addEventListener('click', function () {
          var n = App.Store.addFocusStickyNote({ content: '', color: '#fef3c7', x: 60 + Math.random() * 80, y: 60 + Math.random() * 80 });
        });
      }
    }
  }

  App.Pomodoro = { init, start, pause, toggle, skip, reset, renderStats, openSettingsPanel, renderRecentSessions, renderDailyGoal, renderClock };
})();

