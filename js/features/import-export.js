/*
  App.ImportExport — JSON (full fidelity) and CSV (spreadsheet-friendly) export,
  plus import for both, and a one-click full-state backup/restore.
*/
(function () {
  'use strict';
  window.App = window.App || {};
  const { $ } = App.Helpers;

  const CSV_COLUMNS = ['title', 'description', 'priority', 'dueDate', 'dueTime', 'category', 'tags', 'status', 'progress', 'estimatedDuration'];

  function downloadFile(filename, content, mime) {
    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = filename;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 2000);
  }

  function exportJSON() {
    const data = { exportedAt: new Date().toISOString(), version: 1, tasks: App.Store.state.tasks, categories: App.Store.state.categories, templates: App.Store.state.templates };
    downloadFile(`flow-tasks-${todayStr()}.json`, JSON.stringify(data, null, 2), 'application/json');
    App.Toast.show({ type: 'success', message: 'Exported tasks as JSON' });
  }

  function exportCSV() {
    const rows = App.Store.state.tasks.map((t) => Object.assign({}, t, { tags: (t.tags || []).join('|') }));
    const csv = App.Csv.stringify(rows, CSV_COLUMNS);
    downloadFile(`flow-tasks-${todayStr()}.csv`, csv, 'text/csv');
    App.Toast.show({ type: 'success', message: 'Exported tasks as CSV' });
  }

  function exportFullBackup() {
    downloadFile(`flow-backup-${todayStr()}.json`, JSON.stringify({ backupVersion: 1, at: new Date().toISOString(), state: App.Store.state }, null, 2), 'application/json');
    App.Toast.show({ type: 'success', message: 'Full backup downloaded' });
  }

  function todayStr() { return App.DateUtils.toISODate(new Date()); }

  function importJSONFile(file) {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(reader.result);
        if (parsed.backupVersion) { restoreFullBackup(parsed); return; }
        const incoming = Array.isArray(parsed) ? parsed : parsed.tasks || [];
        let count = 0;
        incoming.forEach((t) => {
          if (!t.title) return;
          const catId = t.category && App.Store.state.categories.find((c) => c.id === t.category || c.name === t.category);
          App.Store.addTask({
            title: t.title, description: t.description || '', priority: t.priority || 'medium',
            dueDate: t.dueDate || null, dueTime: t.dueTime || null,
            category: catId ? catId.id : null, tags: t.tags || [],
            progress: t.progress || 0, status: t.status === 'completed' ? 'completed' : 'active',
            estimatedDuration: t.estimatedDuration ? Number(t.estimatedDuration) : null,
          });
          count++;
        });
        App.Toast.show({ type: 'success', message: `Imported ${count} tasks` });
      } catch (e) {
        App.Toast.show({ type: 'danger', message: 'Could not read that JSON file' });
      }
    };
    reader.readAsText(file);
  }

  function importCSVFile(file) {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const rows = App.Csv.parse(reader.result);
        let count = 0;
        rows.forEach((r) => {
          if (!r.title) return;
          const catId = r.category && App.Store.state.categories.find((c) => c.id === r.category || c.name === r.category);
          App.Store.addTask({
            title: r.title, description: r.description || '', priority: ['low', 'medium', 'high', 'urgent'].includes(r.priority) ? r.priority : 'medium',
            dueDate: r.dueDate || null, dueTime: r.dueTime || null,
            category: catId ? catId.id : null,
            tags: r.tags ? r.tags.split('|').filter(Boolean) : [],
            progress: Number(r.progress) || 0, status: r.status === 'completed' ? 'completed' : 'active',
            estimatedDuration: r.estimatedDuration ? Number(r.estimatedDuration) : null,
          });
          count++;
        });
        App.Toast.show({ type: 'success', message: `Imported ${count} tasks from CSV` });
      } catch (e) {
        App.Toast.show({ type: 'danger', message: 'Could not parse that CSV file' });
      }
    };
    reader.readAsText(file);
  }

  function restoreFullBackup(parsed) {
    if (!confirm('This replaces all current data with the backup. Continue?')) return;
    App.Storage.set('state', parsed.state);
    App.Toast.show({ type: 'success', message: 'Backup restored \u2014 reloading\u2026' });
    setTimeout(() => location.reload(), 900);
  }

  function updateStorageUsageUI() {
    const bar = $('#sidebarStorageBar');
    const label = $('#sidebarStorageLabel');
    if (!bar) return;
    const used = App.Storage.estimateUsage();
    const pct = Math.min(100, Math.round((used / App.Storage.QUOTA_ESTIMATE) * 100));
    bar.style.width = pct + '%';
    label.textContent = `${App.Helpers.formatBytes(used)} used locally`;
  }

  function init() {
    $('#exportJsonBtn').addEventListener('click', exportJSON);
    $('#exportCsvBtn').addEventListener('click', exportCSV);
    $('#exportBackupBtn').addEventListener('click', exportFullBackup);
    $('#importJsonInput').addEventListener('change', (e) => { if (e.target.files[0]) importJSONFile(e.target.files[0]); e.target.value = ''; });
    $('#importCsvInput').addEventListener('change', (e) => { if (e.target.files[0]) importCSVFile(e.target.files[0]); e.target.value = ''; });
    $('#restoreBackupInput').addEventListener('change', (e) => {
      if (!e.target.files[0]) return;
      const reader = new FileReader();
      reader.onload = () => { try { restoreFullBackup(JSON.parse(reader.result)); } catch (err) { App.Toast.show({ type: 'danger', message: 'Invalid backup file' }); } };
      reader.readAsText(e.target.files[0]);
      e.target.value = '';
    });
    App.Store.on('persist', updateStorageUsageUI);
    updateStorageUsageUI();
  }

  App.ImportExport = { init, exportJSON, exportCSV, exportFullBackup };
})();
