(function () {
  'use strict';
  window.App = window.App || {};
  const { $, escapeHtml } = App.Helpers;

  const COLORS = [
    { name: 'Yellow', bg: '#fef3c7', text: '#92400e' },
    { name: 'Blue', bg: '#dbeafe', text: '#1e40af' },
    { name: 'Green', bg: '#d1fae5', text: '#065f46' },
    { name: 'Pink', bg: '#fce7f3', text: '#9d174d' },
    { name: 'Purple', bg: '#ede9fe', text: '#5b21b6' },
    { name: 'Orange', bg: '#ffedd5', text: '#9a3412' },
  ];

  function render() {
    const wrap = $('#focusStickyNotes');
    if (!wrap) return;
    const notes = App.Store.state.focusStickyNotes;
    if (!notes.length) { wrap.innerHTML = ''; return; }
    wrap.innerHTML = notes.map((n) => {
      const color = COLORS.find((c) => c.bg === n.color) || COLORS[0];
      return `<div class="sticky-note ${n.pinned ? 'is-pinned' : ''}" data-id="${n.id}" style="left:${n.x}px;top:${n.y}px;background:${color.bg};color:${color.text};">
        <div class="sticky-note__bar">
          <button class="sticky-note__pin" title="${n.pinned ? 'Unpin' : 'Pin'}">${n.pinned ? '\u{1F4CC}' : '\u{1F4CD}'}</button>
          <span class="sticky-note__color-picker">
            ${COLORS.map((c) => `<button class="sticky-color-swatch" data-color="${c.bg}" style="background:${c.bg};${c.bg === n.color ? 'outline:2px solid currentColor;outline-offset:1px;' : ''}" title="${c.name}"></button>`).join('')}
          </span>
          <button class="sticky-note__delete" title="Delete note">&times;</button>
        </div>
        <div class="sticky-note__content" contenteditable="true" data-placeholder="Type...">${escapeHtml(n.content)}</div>
      </div>`;
    }).join('');
    wrap.querySelectorAll('.sticky-note').forEach(initNote);
  }

  function initNote(noteEl) {
    const id = noteEl.dataset.id;
    let drag = false, startX, startY, origX, origY;

    noteEl.addEventListener('mousedown', (e) => {
      const note = App.Store.state.focusStickyNotes.find((n) => n.id === id);
      if (!note || note.pinned) return;
      if (e.target.closest('.sticky-note__bar')) return;
      if (e.target.closest('.sticky-note__content')) return;
      drag = true;
      startX = e.clientX;
      startY = e.clientY;
      origX = note.x;
      origY = note.y;
      noteEl.classList.add('dragging');
    });

    document.addEventListener('mousemove', (e) => {
      if (!drag) return;
      noteEl.style.left = (origX + e.clientX - startX) + 'px';
      noteEl.style.top = (origY + e.clientY - startY) + 'px';
    });

    document.addEventListener('mouseup', () => {
      if (!drag) return;
      drag = false;
      noteEl.classList.remove('dragging');
      App.Store.updateFocusStickyNote(id, { x: parseInt(noteEl.style.left, 10), y: parseInt(noteEl.style.top, 10) });
    });

    const contentEl = noteEl.querySelector('.sticky-note__content');
    if (contentEl) {
      contentEl.addEventListener('blur', () => {
        App.Store.updateFocusStickyNote(id, { content: contentEl.textContent.trim() });
      });
      contentEl.addEventListener('keydown', (e) => { if (e.key === 'Escape') contentEl.blur(); });
    }

    noteEl.querySelector('.sticky-note__pin')?.addEventListener('click', (e) => {
      const note = App.Store.state.focusStickyNotes.find((n) => n.id === id);
      if (!note) return;
      App.Store.updateFocusStickyNote(id, { pinned: !note.pinned });
      const btn = e.currentTarget;
      btn.classList.add('pin-jolt');
      setTimeout(() => btn.classList.remove('pin-jolt'), 300);
      render();
    });

    noteEl.querySelector('.sticky-note__delete')?.addEventListener('click', () => {
      App.Store.deleteFocusStickyNote(id);
      render();
    });

    noteEl.querySelectorAll('.sticky-color-swatch').forEach((swatch) => {
      swatch.addEventListener('click', () => {
        App.Store.updateFocusStickyNote(id, { color: swatch.dataset.color });
        render();
      });
    });
  }

  function addNote() {
    App.Store.addFocusStickyNote({ content: '', color: '#fef3c7', x: 60 + Math.random() * 80, y: 60 + Math.random() * 80 });
    render();
  }

  function init() {
    const addBtn = $('#focusStickyAddBtn');
    if (addBtn) addBtn.addEventListener('click', addNote);
    App.Store.on('focusStickyNotes:changed', render);
    render();
  }

  App.FocusSticky = { init, render, addNote };
})();
