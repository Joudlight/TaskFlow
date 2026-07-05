/*
  App.TaskModal — the add/edit task dialog. Owns subtasks, recurrence,
  dependency picking, and file attachments (with client-side thumbnailing).
*/
(function () {
  'use strict';
  window.App = window.App || {};
  const { $, $all, el, uuid, escapeHtml, formatBytes, readFileAsDataURL, downscaleImage, trapFocus } = App.Helpers;

  let editingId = null;
  let draftSubtasks = [];
  let draftAttachments = [];
  let draftLinkedNoteIds = [];
  let releaseFocusTrap = null;

  const ACCEPTED_TYPES = ['image/png', 'image/jpeg', 'image/gif', 'image/webp', 'image/svg+xml', 'application/pdf'];
  const MAX_ATTACHMENT_BYTES = 3 * 1024 * 1024; // 3MB per file - localStorage is small, keep this sane

  function open(taskId) {
    hideTaskPreview();
    editingId = taskId || null;
    const task = editingId ? App.Store.getTask(editingId) : App.Store.makeTask({});
    if (editingId && !task) { App.Toast.show({ message: 'Task not found', type: 'info' }); return; }
    draftSubtasks = (task.subtasks || []).map((s) => ({ ...s }));
    draftAttachments = (task.attachments || []).map((a) => ({ ...a }));
    draftLinkedNoteIds = (task.linkedNoteIds || []).slice();

    $('#taskModalTitle').textContent = editingId ? 'Edit task' : 'New task';
    $('#taskDeleteBtn').hidden = !editingId;
    $('#taskArchiveBtn').hidden = !editingId;
    var goNoteBtn = $('#taskGoNoteBtn');
    if (goNoteBtn) {
      var hasNoteLink = draftLinkedNoteIds.length > 0;
      if (!hasNoteLink && editingId) {
        hasNoteLink = App.Store.state.notes.some(function (n) { return (n.linkedTaskIds || []).indexOf(editingId) !== -1; });
      }
      goNoteBtn.hidden = !editingId || !hasNoteLink;
    }
    $('#taskTitleInput').value = task.title;
    $('#taskDescInput').value = task.description || '';
    $('#taskNotesInput').value = task.notes || '';
    $('#taskDueDateInput').value = task.dueDate || '';
    $('#taskDueTimeInput').value = task.dueTime || '';
    $('#taskTagsInput').value = (task.tags || []).join(', ');
    $('#taskDurationInput').value = task.estimatedDuration || '';
    $('#taskProgressInput').value = task.progress || 0;
    $('#taskProgressValue').textContent = (task.progress || 0) + '%';
    setPriority(task.priority || 'medium');
    setColor(task.color);
    populateCategorySelect(task.category);
    populateDependsSelect(task.dependsOn);
    setRecurrenceUI(task.recurrence);
    renderSubtasks();
    renderAttachments();
    populateLinkedNoteSelect();
    renderLinkedNotes();

    const overlay = $('#taskModal');
    overlay.classList.add('is-open');
    overlay.setAttribute('aria-hidden', 'false');
    releaseFocusTrap = trapFocus($('.modal', overlay));
    document.body.style.overflow = 'hidden';
  }

  function close() {
    const overlay = $('#taskModal');
    overlay.classList.remove('is-open');
    overlay.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    if (releaseFocusTrap) releaseFocusTrap();
    editingId = null;
  }

  function setPriority(p) {
    $all('.priority-pill', $('#taskModal')).forEach((btn) => btn.classList.toggle('is-selected', btn.dataset.p === p));
  }
  function getPriority() {
    const sel = $('.priority-pill.is-selected', $('#taskModal'));
    return sel ? sel.dataset.p : 'medium';
  }

  function setColor(color) {
    $all('.swatch[data-color]', $('#taskModal')).forEach((s) => s.classList.toggle('is-selected', (s.dataset.color || null) === (color || null)));
  }
  function getColor() {
    const sel = $('.swatch[data-color].is-selected', $('#taskModal'));
    return sel && sel.dataset.color ? sel.dataset.color : null;
  }

  function populateCategorySelect(selected) {
    const sel = $('#taskCategorySelect');
    sel.innerHTML = '<option value="">No category</option>' +
      App.Store.state.categories.map((c) => `<option value="${c.id}" ${c.id === selected ? 'selected' : ''}>${escapeHtml(c.name)}</option>`).join('');
  }

  function populateDependsSelect(selected) {
    const sel = $('#taskDependsSelect');
    const others = App.Store.state.tasks.filter((t) => t.id !== editingId && t.status !== 'completed');
    sel.innerHTML = '<option value="">None</option>' +
      others.map((t) => `<option value="${t.id}" ${t.id === selected ? 'selected' : ''}>${escapeHtml(t.title)}</option>`).join('');
  }

  function setRecurrenceUI(recurrence) {
    const sel = $('#taskRecurrenceSelect');
    sel.value = recurrence ? recurrence.type : 'none';
    const customWrap = $('#taskRecurrenceCustomDays');
    customWrap.hidden = sel.value !== 'custom';
    $all('input[type=checkbox]', customWrap).forEach((cb) => {
      cb.checked = !!(recurrence && recurrence.type === 'custom' && (recurrence.days || []).includes(Number(cb.value)));
    });
  }
  function getRecurrence() {
    const type = $('#taskRecurrenceSelect').value;
    if (type === 'none') return null;
    if (type === 'custom') {
      const days = $all('input[type=checkbox]:checked', $('#taskRecurrenceCustomDays')).map((cb) => Number(cb.value));
      return days.length ? { type: 'custom', days } : null;
    }
    return { type };
  }

  // ---------------- Subtasks ----------------
  function renderSubtasks() {
    const list = $('#subtaskList');
    list.innerHTML = '';
    draftSubtasks.forEach((s) => {
      const row = el('div', { class: `subtask-row${s.done ? ' is-done' : ''}`, dataset: { id: s.id } });
      row.innerHTML = `
        <input type="checkbox" ${s.done ? 'checked' : ''} aria-label="Toggle subtask">
        <input type="text" value="${escapeHtml(s.title)}" placeholder="Subtask" aria-label="Subtask title">
        <button type="button" class="btn-icon" aria-label="Remove subtask" style="width:28px;height:28px;">${App.Tasks.ICON.trash}</button>`;
      row.querySelector('input[type=checkbox]').addEventListener('change', (e) => { s.done = e.target.checked; row.classList.toggle('is-done', s.done); });
      row.querySelector('input[type=text]').addEventListener('input', (e) => { s.title = e.target.value; });
      row.querySelector('button').addEventListener('click', () => { draftSubtasks = draftSubtasks.filter((x) => x.id !== s.id); renderSubtasks(); });
      list.appendChild(row);
    });
  }
  function addSubtask() {
    draftSubtasks.push({ id: uuid(), title: '', done: false });
    renderSubtasks();
    const inputs = $all('#subtaskList input[type=text]');
    if (inputs.length) inputs[inputs.length - 1].focus();
  }

  // ---------------- Linked Notes ----------------
  function populateLinkedNoteSelect() {
    var sel = $('#taskLinkNoteSelect');
    if (!sel) return;
    var notes = App.Store.state.notes;
    sel.innerHTML = '<option value="">Link a note\u2026</option>' +
      notes.filter(function (n) { return !draftLinkedNoteIds.includes(n.id); })
        .map(function (n) { return '<option value="' + n.id + '">' + escapeHtml(n.title) + '</option>'; })
        .join('');
  }

  function renderLinkedNotes() {
    var container = $('#taskLinkedNotesList');
    if (!container) return;
    container.innerHTML = '';
    draftLinkedNoteIds.forEach(function (noteId) {
      var note = App.Store.getNote(noteId);
      if (!note) return;
      var chip = document.createElement('span');
      chip.className = 'linked-item';
      chip.innerHTML = '<span class="linked-item__label">' + escapeHtml(note.title) + '</span>' +
        '<button type="button" class="linked-item__nav" data-note-id="' + noteId + '" aria-label="Go to note" title="Open note">' +
        '<svg viewBox="0 0 24 24" fill="none" width="12" height="12"><path d="M7 17l10-10M7 7h10v10" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg></button>' +
        '<button type="button" class="linked-item__remove" data-note-id="' + noteId + '" aria-label="Unlink note">' +
        '<svg viewBox="0 0 24 24" fill="none" width="12" height="12"><path d="M6 6l12 12M18 6L6 18" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/></svg></button>';
      chip.querySelector('.linked-item__nav').addEventListener('click', function (e) {
        e.stopPropagation();
        close();
        App.Views.show('notes');
        App.Notes.selectNote(noteId);
      });
      chip.querySelector('.linked-item__remove').addEventListener('click', function (e) {
        e.stopPropagation();
        draftLinkedNoteIds = draftLinkedNoteIds.filter(function (id) { return id !== noteId; });
        renderLinkedNotes();
        populateLinkedNoteSelect();
      });
      container.appendChild(chip);
    });
  }

  function linkCurrentNote() {
    var sel = $('#taskLinkNoteSelect');
    if (!sel || !sel.value) return;
    draftLinkedNoteIds.push(sel.value);
    sel.value = '';
    renderLinkedNotes();
    populateLinkedNoteSelect();
  }

  // ---------------- Attachments ----------------
  function renderAttachments() {
    const grid = $('#attachmentGrid');
    grid.innerHTML = '';
    draftAttachments.forEach((a) => {
      const isImage = a.type.startsWith('image/');
      const thumb = el('div', { class: 'attachment-thumb', dataset: { id: a.id }, role: 'button', tabindex: '0', 'aria-label': `Preview ${a.name}` });
      thumb.innerHTML = isImage
        ? `<img src="${a.thumbDataUrl || a.dataUrl}" alt="${escapeHtml(a.name)}" loading="lazy">`
        : `<div class="file-icon"><svg viewBox="0 0 24 24" fill="none" width="26" height="26"><path d="M6 2h9l5 5v15H6z" stroke="currentColor" stroke-width="1.6"/><path d="M15 2v5h5" stroke="currentColor" stroke-width="1.6"/></svg><span>${escapeHtml(a.name.length > 14 ? a.name.slice(0, 12) + '\u2026' : a.name)}</span></div>`;
      thumb.innerHTML += `<button type="button" class="attachment-thumb__remove" aria-label="Remove ${escapeHtml(a.name)}"><svg viewBox="0 0 24 24" fill="none"><path d="M6 6l12 12M18 6L6 18" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/></svg></button>`;
      thumb.querySelector('.attachment-thumb__remove').addEventListener('click', (e) => { e.stopPropagation(); draftAttachments = draftAttachments.filter((x) => x.id !== a.id); renderAttachments(); });
      thumb.addEventListener('click', () => App.TaskModal.previewAttachment(a));
      grid.appendChild(thumb);
    });
    const addTile = el('button', { type: 'button', class: 'attachment-add', 'aria-label': 'Add attachment' });
    addTile.innerHTML = '<svg viewBox="0 0 24 24" fill="none"><path d="M12 5v14M5 12h14" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg><span>Add file</span>';
    addTile.addEventListener('click', () => $('#attachmentFileInput').click());
    addTile.addEventListener('dragover', (e) => { e.preventDefault(); addTile.classList.add('is-dragover'); });
    addTile.addEventListener('dragleave', () => addTile.classList.remove('is-dragover'));
    addTile.addEventListener('drop', (e) => { e.preventDefault(); addTile.classList.remove('is-dragover'); handleFiles(e.dataTransfer.files); });
    grid.appendChild(addTile);
  }

  async function handleFiles(fileList) {
    for (const file of Array.from(fileList)) {
      if (!ACCEPTED_TYPES.includes(file.type)) {
        App.Toast.show({ type: 'danger', message: `${file.name}: unsupported file type` });
        continue;
      }
      if (file.size > MAX_ATTACHMENT_BYTES) {
        App.Toast.show({ type: 'danger', message: `${file.name} is over ${formatBytes(MAX_ATTACHMENT_BYTES)} \u2014 too large for local storage` });
        continue;
      }
      try {
        const dataUrl = await readFileAsDataURL(file);
        let finalUrl = dataUrl, thumbUrl = dataUrl;
        if (file.type.startsWith('image/') && file.type !== 'image/svg+xml') {
          finalUrl = await downscaleImage(dataUrl, 1400, 0.85);
          thumbUrl = await downscaleImage(dataUrl, 160, 0.7);
        }
        draftAttachments.push({ id: uuid(), name: file.name, type: file.type, size: file.size, dataUrl: finalUrl, thumbDataUrl: thumbUrl });
      } catch (e) {
        App.Toast.show({ type: 'danger', message: `Couldn't read ${file.name}` });
      }
    }
    renderAttachments();
  }

  function previewAttachment(attachment) {
    const overlay = $('#attachmentPreviewModal');
    const body = $('#attachmentPreviewBody');
    $('#attachmentPreviewTitle').textContent = attachment.name;
    $('#attachmentPreviewMeta').textContent = `${attachment.type} \u00b7 ${formatBytes(attachment.size)}`;
    if (attachment.type.startsWith('image/')) {
      body.innerHTML = `<img src="${attachment.dataUrl}" alt="${escapeHtml(attachment.name)}" style="max-width:100%;border-radius:12px;">`;
    } else if (attachment.type === 'application/pdf') {
      body.innerHTML = `<embed src="${attachment.dataUrl}" type="application/pdf" style="width:100%;height:60vh;border-radius:12px;border:1px solid var(--color-border);">`;
    }
    const downloadBtn = $('#attachmentDownloadBtn');
    downloadBtn.href = attachment.dataUrl;
    downloadBtn.download = attachment.name;
    overlay.classList.add('is-open');
    overlay.setAttribute('aria-hidden', 'false');
  }

  // ---------------- Save / delete ----------------
  function collectFormData() {
    const tags = $('#taskTagsInput').value.split(',').map((t) => t.trim()).filter(Boolean);
    return {
      title: $('#taskTitleInput').value.trim(),
      description: $('#taskDescInput').value.trim(),
      notes: $('#taskNotesInput').value,
      priority: getPriority(),
      dueDate: $('#taskDueDateInput').value || null,
      dueTime: $('#taskDueTimeInput').value || null,
      category: $('#taskCategorySelect').value || null,
      tags,
      estimatedDuration: $('#taskDurationInput').value ? Number($('#taskDurationInput').value) : null,
      progress: Number($('#taskProgressInput').value),
      color: getColor(),
      subtasks: draftSubtasks.filter((s) => s.title.trim()),
      dependsOn: $('#taskDependsSelect').value || null,
      recurrence: getRecurrence(),
      attachments: draftAttachments,
      linkedNoteIds: draftLinkedNoteIds,
    };
  }

  function save() {
    var data = collectFormData();
    if (!data.title) { $('#taskTitleInput').classList.add('shake'); $('#taskTitleInput').focus(); setTimeout(function () { $('#taskTitleInput').classList.remove('shake'); }, 420); return; }
    var isNew = !editingId;
    if (editingId) {
      App.Store.updateTask(editingId, data);
      App.Toast.show({ type: 'success', message: 'Task updated' });
    } else {
      App.Store.addTask(data);
      App.Sounds.play('create');
      App.Toast.show({ type: 'success', message: 'Task added' });
    }
    syncNoteLinks(isNew ? App.Store.state.tasks[0].id : editingId);
    App.Achievements.check();
    close();
  }

  function syncNoteLinks(taskId) {
    var task = App.Store.getTask(taskId);
    if (!task) return;
    var allNotes = App.Store.state.notes;
    allNotes.forEach(function (note) {
      var wasLinked = note.linkedTaskIds && note.linkedTaskIds.indexOf(taskId) !== -1;
      var shouldBeLinked = draftLinkedNoteIds.indexOf(note.id) !== -1;
      if (wasLinked && !shouldBeLinked) {
        App.Store.unlinkNoteFromTask(taskId, note.id);
      } else if (!wasLinked && shouldBeLinked) {
        App.Store.linkNoteToTask(taskId, note.id);
      }
    });
  }

  function remove() {
    if (!editingId) return;
    App.Store.deleteTask(editingId);
    App.Sounds.play('delete');
    const id = editingId;
    close();
    App.Toast.show({ type: 'danger', message: 'Task deleted', actionLabel: 'Undo', onAction: () => App.Store.restoreTask(id) });
  }

  function archive() {
    if (!editingId) return;
    App.Store.archiveTask(editingId);
    const id = editingId;
    close();
    App.Toast.show({ type: 'info', message: 'Task archived', actionLabel: 'Undo', onAction: () => { App.Store.restoreFromArchive(id); App.Toast.show({ message: 'Task restored from archive', type: 'success' }); } });
  }

  function saveTemplate() {
    const data = collectFormData();
    const temp = App.Store.addTask(data);
    App.Store.saveAsTemplate(temp.id);
    App.Store.deleteTask(temp.id);
    App.Store.permanentlyDelete(temp.id);
    App.Toast.show({ type: 'success', message: 'Saved as template' });
  }

  function init() {
    $('#addTaskFab').addEventListener('click', () => open(null));
    $('#taskModalCloseBtn').addEventListener('click', close);
    $('#taskCancelBtn').addEventListener('click', close);
    $('#taskModal').addEventListener('click', (e) => { if (e.target === e.currentTarget) close(); });
    $('#taskSaveBtn').addEventListener('click', save);
    $('#taskDeleteBtn').addEventListener('click', remove);
    $('#taskArchiveBtn').addEventListener('click', archive);
    $('#taskTemplateBtn').addEventListener('click', saveTemplate);
    $('#taskGoNoteBtn').addEventListener('click', goToLinkedNote);
    $('#taskPreviewBtn').addEventListener('click', toggleTaskPreview);
    $('#taskPreviewBackBtn').addEventListener('click', toggleTaskPreview);
    $all('.priority-pill', $('#taskModal')).forEach((btn) => btn.addEventListener('click', () => setPriority(btn.dataset.p)));
    $all('.swatch[data-color]', $('#taskModal')).forEach((btn) => btn.addEventListener('click', () => setColor(btn.dataset.color)));
    $('#taskProgressInput').addEventListener('input', (e) => { $('#taskProgressValue').textContent = e.target.value + '%'; });
    $('#taskRecurrenceSelect').addEventListener('change', (e) => { $('#taskRecurrenceCustomDays').hidden = e.target.value !== 'custom'; });
    $('#addSubtaskBtn').addEventListener('click', addSubtask);
    $('#attachmentFileInput').addEventListener('change', (e) => handleFiles(e.target.files));
    $('#taskLinkNoteBtn').addEventListener('click', linkCurrentNote);

    $('#attachmentPreviewCloseBtn').addEventListener('click', () => { $('#attachmentPreviewModal').classList.remove('is-open'); });
    $('#attachmentPreviewModal').addEventListener('click', (e) => { if (e.target === e.currentTarget) e.currentTarget.classList.remove('is-open'); });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        if (!$('#taskPreviewPanel').hidden) { hideTaskPreview(); }
        else if ($('#attachmentPreviewModal').classList.contains('is-open')) $('#attachmentPreviewModal').classList.remove('is-open');
        else if ($('#taskModal').classList.contains('is-open')) close();
      }
    });
  }

  /* ─── Linked note navigation ─────────────────────────────────────────── */

  function goToLinkedNote() {
    if (!draftLinkedNoteIds.length || !editingId) return;
    save();
    App.Views.show('notes');
    App.Notes.selectNote(draftLinkedNoteIds[0]);
  }

  /* ─── Task preview panel (in-modal) ──────────────────────────────────── */

  function toggleTaskPreview() {
    var panel = $('#taskPreviewPanel');
    if (!panel) return;
    if (!panel.hidden) { hideTaskPreview(); return; }
    var id = editingId;
    if (!id) {
      var data = collectFormData();
      if (!data.title) return;
      var t = App.Store.addTask(data);
      App.Sounds.play('create');
      App.Toast.show({ type: 'success', message: 'Task added' });
      id = t.id;
      editingId = id;
    }
    showTaskPreview(id);
  }

  function showTaskPreview(id) {
    var task = App.Store.getTask(id);
    if (!task) return;
    $('#taskPreviewPanelTitle').textContent = task.title || 'Untitled task';
    $('#taskPreviewPanelBody').innerHTML = buildPreviewPanel(task);
    $('#taskModalFields').hidden = true;
    $('#taskPreviewPanel').hidden = false;
  }

  function hideTaskPreview() {
    var panel = $('#taskPreviewPanel');
    if (panel) panel.hidden = true;
    var fields = $('#taskModalFields');
    if (fields) fields.hidden = false;
  }

  function buildPreviewPanel(task) {
    var h = App.Helpers.escapeHtml;
    var cat = App.Store.state.categories.find(function (c) { return c.id === task.category; });
    var cards = [];

    /* Due & Priority row */
    var dueParts = [];
    if (task.dueDate) dueParts.push('<span class="pp-icon">\u{1F4C5}</span> ' + h(task.dueDate) + (task.dueTime ? ' ' + h(task.dueTime) : ''));
    if (dueParts.length) cards.push('<div class="pp-card">' + dueParts.join('') + '</div>');
    if (task.priority) cards.push('<div class="pp-card"><span class="pp-badge pp-badge--' + task.priority + '">' + task.priority + '</span></div>');

    /* Category & Tags */
    var metaParts = [];
    if (cat) metaParts.push('<span style="display:inline-flex;align-items:center;gap:4px;"><span class="dot" style="display:inline-block;width:8px;height:8px;border-radius:50%;background:' + cat.color + ';"></span>' + h(cat.name) + '</span>');
    if (task.tags && task.tags.length) metaParts.push(task.tags.map(function (t) { return '<span class="tag">' + h(t) + '</span>'; }).join(' '));
    if (task.estimatedDuration) metaParts.push('\u23F1 ' + h(String(task.estimatedDuration)) + ' min');
    if (task.recurrence) metaParts.push('\u{1F503} ' + task.recurrence.type);
    if (metaParts.length) cards.push('<div class="pp-card pp-card--meta">' + metaParts.join('') + '</div>');

    /* Progress */
    if (task.progress > 0) {
      var pct = Math.min(100, Math.max(0, Number(task.progress)));
      cards.push('<div class="pp-card pp-card--progress"><div class="pp-progress-label">Progress ' + pct + '%</div><div class="pp-progress-bar"><span style="width:' + pct + '%;"></span></div></div>');
    }

    /* Description */
    if (task.description) cards.push('<div class="pp-card pp-card--desc"><div class="pp-label">Description</div><p>' + h(task.description) + '</p></div>');

    /* Subtasks */
    var subtasks = task.subtasks || [];
    if (subtasks.length) {
      var done = subtasks.filter(function (s) { return s.done; }).length;
      cards.push('<div class="pp-card"><div class="pp-label">Subtasks <span class="pp-subcount">' + done + '/' + subtasks.length + '</span></div><ul class="pp-sub-list">' +
        subtasks.map(function (s) { return '<li' + (s.done ? ' class="pp-done"' : '') + '>' + (s.done ? '\u2713' : '\u25CB') + ' ' + h(s.title) + '</li>'; }).join('') + '</ul></div>');
    }

    /* Notes */
    if (task.notes) cards.push('<div class="pp-card pp-card--notes"><div class="pp-label">Notes</div><div class="pp-markdown">' + h(task.notes) + '</div></div>');

    /* Linked notes */
    var linkedNotes = (task.linkedNoteIds || []).map(function (id) { return App.Store.getNote(id); }).filter(Boolean);
    if (linkedNotes.length) {
      cards.push('<div class="pp-card"><div class="pp-label">Linked notes</div><div class="pp-link-list">' +
        linkedNotes.map(function (n) { return '<span class="pp-link-chip">\u{1F4DD} ' + h(n.title || 'Untitled') + '</span>'; }).join('') + '</div></div>');
    }

    /* Attachments */
    var attachments = task.attachments || [];
    if (attachments.length) {
      cards.push('<div class="pp-card"><div class="pp-label">Attachments (' + attachments.length + ')</div><div class="pp-attach-grid">' +
        attachments.map(function (a) {
          return a.type && a.type.startsWith('image/')
            ? '<img src="' + (a.thumbDataUrl || a.dataUrl) + '" alt="' + h(a.name) + '" loading="lazy">'
            : '<div class="pp-attach-file">\u{1F4C4} ' + h(a.name) + '</div>';
        }).join('') + '</div></div>');
    }

    cards.push('<div class="pp-footer">Created ' + h(task.createdAt ? new Date(task.createdAt).toLocaleDateString() : '') + (task.updatedAt && task.updatedAt !== task.createdAt ? ' \u00B7 Updated ' + h(new Date(task.updatedAt).toLocaleDateString()) : '') + '</div>');
    return cards.join('');
  }

  function openWithPreview(taskId) {
    open(taskId);
    if (editingId) showTaskPreview(editingId);
  }

  App.TaskModal = { init, open, close, previewAttachment, hideTaskPreview, openWithPreview };
})();
