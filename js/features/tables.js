(function () {
  'use strict';
  window.App = window.App || {};
  const { $, $all, uuid, debounce, escapeHtml: esc } = App.Helpers;

  let selectedTableId = null;
  let releaseFocusTrap = null;
  let skipNextRender = false;
  let activeCellRow = -1;
  let activeCellCol = -1;

  function render() {
    const tables = App.Store.state.tables;
    const list = $('#tablesList');
    const editor = $('#tablesEditor');
    const empty = $('#tablesEmpty');
    if (!list || !editor || !empty) return;

    if (tables.length === 0) {
      list.innerHTML = '';
      editor.innerHTML = '';
      empty.hidden = false;
      editor.style.display = 'none';
      selectedTableId = null;
      adjustMobileView();
      return;
    }
    empty.hidden = true;
    editor.style.display = '';

    renderList();
    if (selectedTableId && App.Store.getTable(selectedTableId)) {
      renderEditor(selectedTableId);
    } else {
      selectedTableId = tables[0].id;
      renderEditor(selectedTableId);
    }
    adjustMobileView();
  }

  function renderList() {
    const list = $('#tablesList');
    if (!list) return;
    const tables = App.Store.state.tables;
    list.innerHTML = tables.map((t) =>
      `<div class="tables-list-item${t.id === selectedTableId ? ' is-active' : ''}" data-id="${t.id}" tabindex="0" role="button">
        <span class="tables-list-item__name">${esc(t.name)}</span>
        <span class="tables-list-item__dims">${t.rows}\u00d7${t.cols}</span>
        <span class="tables-list-item__actions">
          <button class="tables-list-item__edit" data-id="${t.id}" title="Rename table"><svg viewBox="0 0 24 24" fill="none" width="14" height="14"><path d="M15.5 5.5l3 3L9 18H6v-3l9.5-9.5z" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg></button>
          <button class="tables-list-item__delete" data-id="${t.id}" title="Delete table"><svg viewBox="0 0 24 24" fill="none" width="14" height="14"><path d="M6 6l12 12M18 6L6 18" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/></svg></button>
        </span>
      </div>`
    ).join('');
  }

  function getColLabel(c) {
    var label = '';
    var n = c;
    while (n >= 0) {
      label = String.fromCharCode(65 + (n % 26)) + label;
      n = Math.floor(n / 26) - 1;
    }
    return label;
  }

  function renderEditor(id) {
    const table = App.Store.getTable(id);
    if (!table) return;
    const editor = $('#tablesEditor');
    if (!editor) return;

    const colWidth = Math.max(120, Math.min(200, 600 / table.cols));
    const colgroup = '<col class="tables-table__rownum-col" style="width:36px;">' +
      Array.from({ length: table.cols }, () => `<col style="width:${colWidth}px;">`).join('');

    const cornerTh = '<th class="tables-table__corner"></th>';
    const headerRow = cornerTh + table.headers.map((h, ci) =>
      `<th contenteditable="true" data-col="${ci}"${ci === 0 ? ' class="tables-table__first-col"' : ''}>${esc(h)}</th>`
    ).join('');

    const bodyRows = table.cells.map((row, r) => {
      const rowNum = '<td class="tables-table__rownum" data-row="' + r + '">' + (r + 1) + '</td>';
      return '<tr>' + rowNum + row.map((cell, c) => {
        var cls = c === 0 ? 'tables-table__first-col' : '';
        if (!cell) cls = cls ? cls + ' is-empty' : 'is-empty';
        return '<td contenteditable="true" data-row="' + r + '" data-col="' + c + '"' + (cls ? ' class="' + cls + '"' : '') + '>' + esc(cell) + '</td>';
      }).join('') + '</tr>';
    }).join('');

    editor.innerHTML = `
      <div class="tables-editor__header">
        <input class="tables-editor__name" id="tableNameInput" value="${esc(table.name)}" placeholder="Table name\u2026">
      </div>
      <div class="tables-actions">
        <div class="tables-actions__group">
          <button class="btn btn-secondary btn-sm" id="tableAddRowBtn" title="Append row"><svg viewBox="0 0 24 24" fill="none" width="14" height="14"><path d="M12 5v14M5 12h14" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg> Row</button>
          <button class="btn btn-secondary btn-sm" id="tableAddColBtn" title="Append column"><svg viewBox="0 0 24 24" fill="none" width="14" height="14"><path d="M12 5v14M5 12h14" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg> Col</button>
        </div>
        <div class="tables-actions__group">
          <button class="btn btn-secondary btn-sm" id="tableExportCsvBtn" title="Export as CSV"><svg viewBox="0 0 24 24" fill="none" width="14" height="14"><path d="M4 17v3a1 1 0 001 1h14a1 1 0 001-1v-3M12 3v12M8 11l4 4 4-4" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg> CSV</button>
          <button class="btn btn-secondary btn-sm" id="tableDuplicateBtn" title="Duplicate table"><svg viewBox="0 0 24 24" fill="none" width="14" height="14"><rect x="8" y="8" width="12" height="12" rx="2" stroke="currentColor" stroke-width="1.8"/><path d="M16 8V6a2 2 0 00-2-2H6a2 2 0 00-2 2v8a2 2 0 002 2h2" stroke="currentColor" stroke-width="1.8"/></svg> Duplicate</button>
          <button class="btn btn-secondary btn-sm" id="tableClearBtn" title="Clear all data"><svg viewBox="0 0 24 24" fill="none" width="14" height="14"><path d="M4 7h16M9 7V4h6v3M6 7l1 13a2 2 0 002 2h6a2 2 0 002-2l1-13" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg> Clear</button>
        </div>
        <button class="btn btn-danger btn-sm" id="tableDeleteBtn" style="margin-left:auto;">Delete table</button>
      </div>
      <div class="tables-scroll">
        <table class="tables-table">
          <colgroup>${colgroup}</colgroup>
          <thead><tr>${headerRow}</tr></thead>
          <tbody>${bodyRows}</tbody>
        </table>
      </div>
    `;

    activeCellRow = -1;
    activeCellCol = -1;
  }

  function selectTable(id) {
    if (id === selectedTableId) return;
    selectedTableId = id;
    renderList();
    renderEditor(id);
    adjustMobileView();
  }

  function addTable() {
    $('#createTableRowsInput').value = 3;
    $('#createTableColsInput').value = 3;
    $('#createTableNameInput').value = '';
    updateCreatePreview(3, 3);
    const overlay = $('#createTableModal');
    overlay.classList.add('is-open');
    overlay.setAttribute('aria-hidden', 'false');
    releaseFocusTrap = App.Helpers.trapFocus($('.modal', overlay));
    document.body.style.overflow = 'hidden';
    setTimeout(() => $('#createTableNameInput')?.focus(), 100);
  }

  function closeCreateModal() {
    const overlay = $('#createTableModal');
    overlay.classList.remove('is-open');
    overlay.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    if (releaseFocusTrap) { releaseFocusTrap(); releaseFocusTrap = null; }
  }

  function confirmCreate() {
    const name = $('#createTableNameInput').value.trim() || 'Untitled table';
    const rows = Math.max(1, parseInt($('#createTableRowsInput').value) || 3);
    const cols = Math.max(1, parseInt($('#createTableColsInput').value) || 3);
    const table = App.Store.addTable({ name, rows, cols });
    closeCreateModal();
    selectedTableId = table.id;
    render();
    App.Toast.show({ message: 'Table created', type: 'success', duration: 2000 });
  }

  function updateCreatePreview(rows, cols) {
    const preview = $('#createTablePreview');
    if (!preview) return;
    const r = Math.min(rows, 8);
    const c = Math.min(cols, 8);
    preview.style.gridTemplateColumns = `repeat(${c}, 32px)`;
    const cells = [];
    for (let i = 0; i < r; i++) {
      for (let j = 0; j < c; j++) {
        cells.push(`<div class="create-table-preview__cell ${i === 0 ? 'is-header' : 'is-data'}"></div>`);
      }
    }
    preview.innerHTML = cells.join('');
  }

  function deleteTable(id) {
    if (!window.confirm('Delete this table?')) return;
    App.Store.deleteTable(id);
    selectedTableId = null;
    render();
    App.Toast.show({ message: 'Table deleted', type: 'info', duration: 2000 });
  }

  function editTableName(id) {
    const item = $(`.tables-list-item[data-id="${id}"]`);
    if (!item) return;
    const nameSpan = item.querySelector('.tables-list-item__name');
    if (!nameSpan) return;
    const current = nameSpan.textContent;

    const input = document.createElement('input');
    input.className = 'tables-list-item__rename-input';
    input.value = current;
    input.setAttribute('aria-label', 'Rename table');

    nameSpan.replaceWith(input);
    input.focus();
    input.select();

    function finish(save) {
      const val = save ? input.value.trim() || 'Untitled table' : current;
      const span = document.createElement('span');
      span.className = 'tables-list-item__name';
      span.textContent = val;
      input.replaceWith(span);
      if (save && val !== current) {
        skipNextRender = true;
        App.Store.updateTable(id, { name: val });
        skipNextRender = false;
        const nameInput = $('#tableNameInput');
        if (nameInput) nameInput.value = val;
      }
    }

    input.addEventListener('blur', () => finish(true));
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') { e.preventDefault(); input.blur(); }
      if (e.key === 'Escape') { finish(false); }
    });
  }

  function saveCurrentTable() {
    if (!selectedTableId) return;
    const table = App.Store.getTable(selectedTableId);
    if (!table) return;

    const nameInput = $('#tableNameInput');
    const name = nameInput ? (nameInput.value.trim() || 'Untitled table') : table.name;

    const headerEls = $all('.tables-table thead th[contenteditable]');
    const headers = Array.from(headerEls).map((th) => th.textContent.trim());

    const rowEls = $all('.tables-table tbody tr');
    const cells = Array.from(rowEls).map((tr) =>
      Array.from(tr.querySelectorAll('td[contenteditable]')).map((td) => td.textContent.trim())
    );

    const cols = headers.length;
    const rows = cells.length;
    skipNextRender = true;
    App.Store.updateTable(selectedTableId, { name, headers, cells, rows, cols });
    skipNextRender = false;
    renderList();
  }

  const saveTableDebounced = debounce(saveCurrentTable, 400);

  /* ─── Row / Column Operations ─────────────────────────────────────────── */

  function insertRow(index) {
    var table = App.Store.getTable(selectedTableId);
    if (!table) return;
    var newRow = Array(table.cols).fill('');
    var cells = table.cells.slice();
    cells.splice(index, 0, newRow);
    App.Store.updateTable(selectedTableId, { cells: cells, rows: cells.length });
  }

  function deleteRow(index) {
    var table = App.Store.getTable(selectedTableId);
    if (!table || table.rows <= 1) return;
    var cells = table.cells.filter(function (_, i) { return i !== index; });
    App.Store.updateTable(selectedTableId, { cells: cells, rows: cells.length });
  }

  function insertCol(index) {
    var table = App.Store.getTable(selectedTableId);
    if (!table) return;
    var headers = table.headers.slice();
    headers.splice(index, 0, '');
    var cells = table.cells.map(function (row) {
      var r = row.slice();
      r.splice(index, 0, '');
      return r;
    });
    App.Store.updateTable(selectedTableId, { headers: headers, cells: cells, cols: headers.length });
  }

  function deleteCol(index) {
    var table = App.Store.getTable(selectedTableId);
    if (!table || table.cols <= 1) return;
    var headers = table.headers.filter(function (_, i) { return i !== index; });
    var cells = table.cells.map(function (row) {
      return row.filter(function (_, i) { return i !== index; });
    });
    App.Store.updateTable(selectedTableId, { headers: headers, cells: cells, cols: headers.length });
  }

  function clearTable() {
    if (!window.confirm('Clear all table data?')) return;
    var table = App.Store.getTable(selectedTableId);
    if (!table) return;
    var empty = Array(table.cols).fill('');
    var cells = table.cells.map(function () { return empty.slice(); });
    var headers = table.headers.map(function () { return ''; });
    App.Store.updateTable(selectedTableId, { headers: headers, cells: cells });
    App.Toast.show({ message: 'Table cleared', type: 'info', duration: 2000 });
  }

  function duplicateTable() {
    var table = App.Store.getTable(selectedTableId);
    if (!table) return;
    var data = {
      name: table.name + ' (copy)',
      rows: table.rows,
      cols: table.cols,
      headers: table.headers.slice(),
      cells: table.cells.map(function (r) { return r.slice(); }),
    };
    var t = App.Store.addTable(data);
    selectedTableId = t.id;
    render();
    App.Toast.show({ message: 'Table duplicated', type: 'success', duration: 2000 });
  }

  function exportCsv() {
    var table = App.Store.getTable(selectedTableId);
    if (!table) return;
    var lines = [];
    lines.push(table.headers.map(escapeCsvCell).join(','));
    table.cells.forEach(function (row) {
      lines.push(row.map(escapeCsvCell).join(','));
    });
    var blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = (table.name || 'table') + '.csv';
    a.click();
    URL.revokeObjectURL(url);
  }

  function escapeCsvCell(str) {
    if (!str) return '';
    if (str.indexOf(',') !== -1 || str.indexOf('"') !== -1 || str.indexOf('\n') !== -1) {
      return '"' + str.replace(/"/g, '""') + '"';
    }
    return str;
  }

  /* ─── Context Menu ────────────────────────────────────────────────────── */

  function buildContextMenu() {
    if ($('#tableContextMenu')) return;
    var div = document.createElement('div');
    div.id = 'tableContextMenu';
    div.className = 'table-context-menu';
    div.hidden = true;
    div.innerHTML =
      '<button data-action="insertRowAbove">Insert row above</button>' +
      '<button data-action="insertRowBelow">Insert row below</button>' +
      '<button data-action="deleteRow">Delete row</button>' +
      '<hr>' +
      '<button data-action="insertColLeft">Insert column left</button>' +
      '<button data-action="insertColRight">Insert column right</button>' +
      '<button data-action="deleteCol">Delete column</button>' +
      '<hr>' +
      '<button data-action="clearRow">Clear row</button>' +
      '<button data-action="clearCol">Clear column</button>';
    document.body.appendChild(div);
  }

  function showContextMenu(e, row, col) {
    e.preventDefault();
    activeCellRow = row;
    activeCellCol = col;
    buildContextMenu();
    var menu = $('#tableContextMenu');
    menu.style.left = Math.min(e.clientX, window.innerWidth - 200) + 'px';
    menu.style.top = Math.min(e.clientY, window.innerHeight - 240) + 'px';
    menu.hidden = false;
  }

  function hideContextMenu() {
    var menu = $('#tableContextMenu');
    if (menu) menu.hidden = true;
  }

  function handleContextAction(action) {
    if (activeCellRow < 0 && activeCellCol < 0) return;
    var r = activeCellRow;
    var c = activeCellCol;
    switch (action) {
      case 'insertRowAbove': insertRow(r); break;
      case 'insertRowBelow': insertRow(r + 1); break;
      case 'deleteRow': deleteRow(r); break;
      case 'insertColLeft': insertCol(c); break;
      case 'insertColRight': insertCol(c + 1); break;
      case 'deleteCol': deleteCol(c); break;
      case 'clearRow':
        var table = App.Store.getTable(selectedTableId);
        if (table && r >= 0 && r < table.cells.length) {
          var cells = table.cells.slice();
          cells[r] = Array(table.cols).fill('');
          App.Store.updateTable(selectedTableId, { cells: cells });
        }
        break;
      case 'clearCol':
        var table = App.Store.getTable(selectedTableId);
        if (table && c >= 0 && c < table.cols) {
          var cells = table.cells.map(function (row) {
            var r = row.slice();
            r[c] = '';
            return r;
          });
          App.Store.updateTable(selectedTableId, { cells: cells });
        }
        break;
    }
    hideContextMenu();
  }

  /* ─── Mobile ──────────────────────────────────────────────────────────── */

  function adjustMobileView() {
    if (window.innerWidth > 720) return;
    if (selectedTableId) {
      $('#tablesList')?.classList.remove('is-visible');
      $('#tablesEditor')?.classList.remove('is-hidden');
    } else {
      $('#tablesList')?.classList.add('is-visible');
      $('#tablesEditor')?.classList.add('is-hidden');
    }
  }

  function init() {
    const list = $('#tablesList');
    const editor = $('#tablesEditor');
    if (!list || !editor) return;

    App.Store.on('tables:changed', () => {
      if (!skipNextRender) render();
    });

    $('#tablesAddBtn')?.addEventListener('click', addTable);

    list.addEventListener('click', (e) => {
      const item = e.target.closest('.tables-list-item');
      const delBtn = e.target.closest('.tables-list-item__delete');
      const editBtn = e.target.closest('.tables-list-item__edit');
      if (delBtn) { e.stopPropagation(); deleteTable(delBtn.dataset.id); return; }
      if (editBtn) { e.stopPropagation(); editTableName(editBtn.dataset.id); return; }
      if (item) selectTable(item.dataset.id);
    });

    editor.addEventListener('click', (e) => {
      var cell = e.target.closest('td[contenteditable], th[contenteditable]');
      if (cell) {
        cell.classList.remove('is-empty');
        activeCellRow = parseInt(cell.dataset.row) || -1;
        activeCellCol = parseInt(cell.dataset.col) || -1;
      }

      if (e.target.closest('#tableAddRowBtn')) {
        var table = App.Store.getTable(selectedTableId);
        if (!table) return;
        insertRow(table.rows);
      }

      if (e.target.closest('#tableAddColBtn')) {
        var table = App.Store.getTable(selectedTableId);
        if (!table) return;
        insertCol(table.cols);
      }

      if (e.target.closest('#tableExportCsvBtn')) {
        exportCsv();
      }

      if (e.target.closest('#tableDuplicateBtn')) {
        duplicateTable();
      }

      if (e.target.closest('#tableClearBtn')) {
        clearTable();
      }

      if (e.target.closest('#tableDeleteBtn')) {
        deleteTable(selectedTableId);
      }
    });

    editor.addEventListener('contextmenu', (e) => {
      var cell = e.target.closest('td[contenteditable], th[contenteditable]');
      if (!cell) return;
      var row = parseInt(cell.dataset.row);
      var col = parseInt(cell.dataset.col);
      if (!isNaN(row) && !isNaN(col) && row >= 0 && col >= 0) {
        showContextMenu(e, row, col);
      } else if (cell.tagName === 'TH') {
        col = parseInt(cell.dataset.col);
        if (!isNaN(col) && col >= 0) {
          showContextMenu(e, 0, col);
        }
      }
    });

    document.addEventListener('click', (e) => {
      if (!e.target.closest('#tableContextMenu')) {
        hideContextMenu();
      }
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') hideContextMenu();
    });

    document.addEventListener('click', (e) => {
      var ctxBtn = e.target.closest('#tableContextMenu button');
      if (ctxBtn) {
        e.preventDefault();
        handleContextAction(ctxBtn.dataset.action);
      }
    });

    editor.addEventListener('input', (e) => {
      if (e.target.closest('#tableNameInput') || e.target.closest('.tables-table [contenteditable]')) {
        saveTableDebounced();
      }
    });

    editor.addEventListener('focusout', (e) => {
      const cell = e.target.closest('.tables-table td[contenteditable]');
      if (cell && cell.textContent.trim() === '') cell.classList.add('is-empty');
    });

    editor.addEventListener('focusin', (e) => {
      const cell = e.target.closest('.tables-table td[contenteditable]');
      if (cell) cell.classList.remove('is-empty');
    });

    document.addEventListener('keydown', (e) => {
      const cell = e.target.closest('.tables-table [contenteditable]');
      if (cell && e.key === 'Tab') {
        e.preventDefault();
        const cells = $all('.tables-table [contenteditable]');
        const idx = Array.from(cells).indexOf(e.target);
        const next = idx + (e.shiftKey ? -1 : 1);
        if (next >= 0 && next < cells.length) cells[next].focus();
      }
    });

    window.addEventListener('resize', adjustMobileView);

    $('#tablesBackBtn')?.addEventListener('click', () => {
      selectedTableId = null;
      adjustMobileView();
    });

    const createModal = $('#createTableModal');
    if (createModal) {
      $('#createTableCloseBtn')?.addEventListener('click', closeCreateModal);
      $('#createTableCancelBtn')?.addEventListener('click', closeCreateModal);
      $('#createTableConfirmBtn')?.addEventListener('click', confirmCreate);
      createModal.addEventListener('click', (e) => { if (e.target === e.currentTarget) closeCreateModal(); });
      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && createModal.classList.contains('is-open')) closeCreateModal();
      });
      $('#createTableRowsInput')?.addEventListener('input', () => {
        const rows = parseInt($('#createTableRowsInput').value) || 1;
        const cols = parseInt($('#createTableColsInput').value) || 1;
        updateCreatePreview(rows, cols);
      });
      $('#createTableColsInput')?.addEventListener('input', () => {
        const rows = parseInt($('#createTableRowsInput').value) || 1;
        const cols = parseInt($('#createTableColsInput').value) || 1;
        updateCreatePreview(rows, cols);
      });
    }
  }

  App.Tables = { init, render };
})();
