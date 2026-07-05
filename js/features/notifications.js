/*
  App.Notifications — wraps the Notification API. Checks due/soon-due tasks on
  an interval while the tab is open (a static site has no server to push from).
*/
(function () {
  'use strict';
  window.App = window.App || {};
  const { $ } = App.Helpers;
  const D = App.DateUtils;

  const notifiedToday = new Set();
  let checkInterval = null;

  function supported() { return 'Notification' in window; }
  function permission() { return supported() ? Notification.permission : 'unsupported'; }

  async function requestPermission() {
    if (!supported()) { App.Toast.show({ type: 'danger', message: 'Notifications are not supported in this browser.' }); return; }
    const result = await Notification.requestPermission();
    App.Store.updateSettings({ notificationsEnabled: result === 'granted' });
    updateUI();
    if (result === 'granted') {
      notify('Notifications enabled', "We'll remind you about due tasks and daily planning.");
    }
  }

  function notify(title, body, opts) {
    if (!supported() || Notification.permission !== 'granted') return;
    try {
      const n = new Notification(title, Object.assign({ body, icon: 'icons/icon-192.png', badge: 'icons/icon-192.png', tag: 'flow-' + Date.now() }, opts));
      n.onclick = () => { window.focus(); n.close(); };
    } catch (e) { /* some platforms restrict Notification() outside a service worker */ }
  }

  function checkDueTasks() {
    if (!App.Store.state.settings.notificationsEnabled || Notification.permission !== 'granted') return;
    const now = new Date();
    const minutesBefore = App.Store.state.settings.reminderMinutesBefore;
    App.Store.state.tasks.filter((t) => t.status !== 'completed' && t.dueDate && t.dueTime).forEach((t) => {
      const due = new Date(`${t.dueDate}T${t.dueTime}`);
      const diffMin = (due - now) / 60000;
      const key = t.id + ':' + t.dueDate;
      if (diffMin > 0 && diffMin <= minutesBefore && !notifiedToday.has(key)) {
        notifiedToday.add(key);
        notify('Task due soon', `"${t.title}" is due in ${Math.round(diffMin)} min`);
        App.Sounds.play('notification');
      }
      if (diffMin < 0 && diffMin > -1 && !notifiedToday.has(key + ':due')) {
        notifiedToday.add(key + ':due');
        notify('Task due now', `"${t.title}" is due now`);
      }
    });

    const dailyTime = App.Store.state.settings.dailyReminderTime;
    if (dailyTime) {
      const [h, m] = dailyTime.split(':').map(Number);
      const key = 'daily:' + D.toISODate(now);
      if (now.getHours() === h && now.getMinutes() === m && !notifiedToday.has(key)) {
        notifiedToday.add(key);
        const todayCount = App.Store.state.tasks.filter((t) => t.dueDate === D.toISODate(now) && t.status !== 'completed').length;
        notify('Daily planning', `You have ${todayCount} task${todayCount === 1 ? '' : 's'} due today.`);
      }
    }
  }

  function updateUI() {
    const badge = $('#notifPermissionBadge');
    if (!badge) return;
    const p = permission();
    badge.textContent = p === 'granted' ? 'Enabled' : p === 'denied' ? 'Blocked in browser settings' : 'Not enabled';
    badge.className = 'badge ' + (p === 'granted' ? 'badge-success' : p === 'denied' ? 'badge-danger' : 'badge-warning');
    const toggle = $('#notifEnableToggle');
    if (toggle) toggle.checked = App.Store.state.settings.notificationsEnabled && p === 'granted';
  }

  function init() {
    updateUI();
    const toggle = $('#notifEnableToggle');
    if (toggle) toggle.addEventListener('change', (e) => { if (e.target.checked) requestPermission(); else { App.Store.updateSettings({ notificationsEnabled: false }); updateUI(); } });
    const reminderSelect = $('#reminderMinutesSelect');
    if (reminderSelect) { reminderSelect.value = App.Store.state.settings.reminderMinutesBefore; reminderSelect.addEventListener('change', (e) => App.Store.updateSettings({ reminderMinutesBefore: Number(e.target.value) })); }
    const dailyInput = $('#dailyReminderTimeInput');
    if (dailyInput) { dailyInput.value = App.Store.state.settings.dailyReminderTime || ''; dailyInput.addEventListener('change', (e) => App.Store.updateSettings({ dailyReminderTime: e.target.value || null })); }

    checkInterval = setInterval(checkDueTasks, 30000);
    checkDueTasks();
  }

  App.Notifications = { init, notify, requestPermission, permission, supported };
})();
