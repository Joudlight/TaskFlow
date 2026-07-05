/*
  App.DragDrop — HTML5 drag-and-drop for reordering the task list, and for
  dragging a task chip from one calendar day onto another to change its due date.
  Falls back gracefully (buttons still work) on touch-only devices without
  pointer-drag support since reordering isn't the only way to prioritize a task.
*/
(function () {
  'use strict';
  window.App = window.App || {};
  const { $, $all } = App.Helpers;

  let dragSourceId = null;

  function attachListHandlers(container) {
    $all('.task-item[draggable="true"]', container).forEach((item) => {
      item.addEventListener('dragstart', (e) => {
        dragSourceId = item.dataset.taskId;
        item.classList.add('is-dragging');
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', dragSourceId);
      });
      item.addEventListener('dragend', () => {
        item.classList.remove('is-dragging');
        $all('.task-item.is-drop-target', container).forEach((n) => n.classList.remove('is-drop-target'));
      });
      item.addEventListener('dragover', (e) => {
        e.preventDefault();
        if (item.dataset.taskId === dragSourceId) return;
        item.classList.add('is-drop-target');
      });
      item.addEventListener('dragleave', () => item.classList.remove('is-drop-target'));
      item.addEventListener('drop', (e) => {
        e.preventDefault();
        item.classList.remove('is-drop-target');
        const targetId = item.dataset.taskId;
        if (!dragSourceId || dragSourceId === targetId) return;
        reorder(dragSourceId, targetId);
      });
    });
  }

  function reorder(sourceId, targetId) {
    const list = App.Store.state.tasks.filter((t) => !t.archived).sort((a, b) => (a.order || 0) - (b.order || 0));
    const ids = list.map((t) => t.id);
    const from = ids.indexOf(sourceId);
    const to = ids.indexOf(targetId);
    if (from === -1 || to === -1) return;
    ids.splice(to, 0, ids.splice(from, 1)[0]);
    App.Store.reorderTasks(ids);
    App.Helpers.announce('Task reordered');
  }

  // ---- Calendar day-to-day dragging ----
  function attachCalendarHandlers(root) {
    $all('.cal-day__chip[draggable="true"]', root).forEach((chip) => {
      chip.addEventListener('dragstart', (e) => {
        e.stopPropagation();
        e.dataTransfer.setData('text/plain', chip.dataset.taskId);
        e.dataTransfer.effectAllowed = 'move';
      });
    });
    $all('.cal-day[data-date]', root).forEach((day) => {
      day.addEventListener('dragover', (e) => { e.preventDefault(); day.classList.add('is-drop-target'); });
      day.addEventListener('dragleave', () => day.classList.remove('is-drop-target'));
      day.addEventListener('drop', (e) => {
        e.preventDefault();
        day.classList.remove('is-drop-target');
        const taskId = e.dataTransfer.getData('text/plain');
        if (!taskId) return;
        App.Store.updateTask(taskId, { dueDate: day.dataset.date });
        App.Toast.show({ message: 'Due date updated', type: 'success' });
        App.Calendar.render();
      });
    });
  }

  App.DragDrop = { attachListHandlers, attachCalendarHandlers };
})();
