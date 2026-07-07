(function (root) {
  'use strict';

  var uid = function () { return 'tb_' + Math.random().toString(36).slice(2, 10) + Date.now().toString(36); };
  var esc = function (s) { var d = document.createElement('div'); d.textContent = s || ''; return d.innerHTML; };
  var clamp = function (v, lo, hi) { return Math.max(lo, Math.min(hi, v)); };
  var colLabel = function (n) { var l = ''; while (n >= 0) { l = String.fromCharCode(65 + (n % 26)) + l; n = Math.floor(n / 26) - 1; } return l; };
  var deepClone = function (obj) { return JSON.parse(JSON.stringify(obj)); };

  var I = {
    table: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="4" width="16" height="16" rx="2"/><path d="M4 10h16M10 4v16"/></svg>',
    plus: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>',
    more: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="5" r="1.2"/><circle cx="12" cy="12" r="1.2"/><circle cx="12" cy="19" r="1.2"/></svg>',
    pencil: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M15.5 5.5l3 3L9 18H6v-3z"/></svg>',
    copy: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg>',
    trash: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 7h16M9 7V4h6v3M6 7l1 13a2 2 0 002 2h6a2 2 0 002-2l1-13"/></svg>',
    undo: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 10h10a5 5 0 010 10H9"/><path d="M3 10l4-4M3 10l4 4"/></svg>',
    redo: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10H11a5 5 0 000 10h4"/><path d="M21 10l-4-4M21 10l-4 4"/></svg>',
    bold: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M6 4h8a4 4 0 010 8H6zM6 12h9a4 4 0 010 8H6z"/></svg>',
    italic: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M19 4h-9M14 20H5M15 4L9 20"/></svg>',
    underline: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M6 3v7a6 6 0 006 6 6 6 0 006-6V3M4 21h16"/></svg>',
    strike: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M17.3 4.9c-1.2-1-2.8-1.4-4.3-.9s-2.5 1.6-2.5 3c0 2.2 2 3.5 4 4.5M3 12h18M8 21c1.2.8 2.7 1.2 4.2.8s2.6-1.6 2.8-3.1c0-2.2-2-3.5-4-4.7"/></svg>',
    alignL: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M17 10H3M21 6H3M21 14H3M17 18H3"/></svg>',
    alignC: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M18 10H6M21 6H3M21 14H3M18 18H3"/></svg>',
    alignR: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M21 10H7M21 6H3M21 14H3M21 18H7"/></svg>',
    type: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 7V4h16v3M9 20h6M12 4v16"/></svg>',
    bucket: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2H7a2 2 0 00-2 2v2"/></svg>',
    download: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 17v3a1 1 0 001 1h14a1 1 0 001-1v-3M12 3v12M8 11l4 4 4-4"/></svg>',
    upload: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 17v3a1 1 0 001 1h14a1 1 0 001-1v-3M12 15V3M8 5l4-4 4 4"/></svg>',
    rows: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M4 6h16M4 12h16M4 18h16"/></svg>',
    cols: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M6 4v16M12 4v16M18 4v16"/></svg>',
    arrowUp: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 5v14M5 12l7-7 7 7"/></svg>',
    arrowDown: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 19V5M5 12l7 7 7-7"/></svg>',
    sortUp: '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M8 3v10M4 7l4-4 4 4"/></svg>',
    sortDown: '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M8 13V3M4 9l4 4 4-4"/></svg>',
    close: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg>',
    tag: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M9 5H5v4l10 10 4-4z"/><circle cx="7.5" cy="7.5" r="1"/></svg>',
  };

  var icon = function (name, size) { return '<span style="display:inline-flex;width:' + (size || 14) + 'px;height:' + (size || 14) + 'px;flex-shrink:0">' + (I[name] || '') + '</span>'; };

  var DEFAULT_LABELS = [
    { id: 'urgent', name: 'Urgent', color: '#ef4444' },
    { id: 'high', name: 'High', color: '#f97316' },
    { id: 'medium', name: 'Medium', color: '#eab308' },
    { id: 'low', name: 'Low', color: '#22c55e' },
    { id: 'done', name: 'Done', color: '#3b82f6' },
    { id: 'in-progress', name: 'In Progress', color: '#8b5cf6' },
  ];

  var FONT_SIZES = [8, 9, 10, 11, 12, 14, 16, 18, 20, 24, 28, 36, 48];

  function makeCell(value) {
    return { value: value || '', bold: false, italic: false, underline: false, strikethrough: false, fontSize: 0, textColor: '', bgColor: '', align: '', labelId: '' };
  }

  function defaultTable(name, rows, cols) {
    var headers = [];
    for (var c = 0; c < cols; c++) headers.push({ id: uid(), name: colLabel(c), width: 140 });
    var cells = [];
    for (var r = 0; r < rows; r++) {
      var row = [];
      for (var c2 = 0; c2 < cols; c2++) row.push(makeCell(''));
      cells.push(row);
    }
    return {
      id: uid(), name: name || 'Untitled Table', headers: headers, cells: cells,
      labels: deepClone(DEFAULT_LABELS), sortCol: -1, sortDir: '',
      createdAt: Date.now(), updatedAt: Date.now(),
    };
  }

  var S = {
    tables: [],
    activeId: null,
    sel: null,
    range: null,
    editing: false,
    clipboard: null,
    undoStack: [],
    redoStack: [],
    MAX_UNDO: 50,
  };

  var container = null;
  var editingCell = null;
  var openDropdown = null;
  var openColorPicker = null;
  var resizingCol = null;
  var resizingStartX = 0;
  var nameEditActive = false;

  function getTable(id) { return S.tables.find(function (t) { return t.id === (id || S.activeId); }); }
  function activeTable() { return getTable(); }

  function pushUndo() {
    var t = activeTable(); if (!t) return;
    S.undoStack.push({ id: t.id, data: deepClone(t) });
    if (S.undoStack.length > S.MAX_UNDO) S.undoStack.shift();
    S.redoStack = [];
  }

  function popUndo() {
    if (!S.undoStack.length) return;
    var e = S.undoStack.pop();
    var cur = getTable(e.id); if (!cur) return;
    S.redoStack.push({ id: e.id, data: deepClone(cur) });
    var idx = S.tables.indexOf(cur);
    S.tables[idx] = deepClone(e.data);
    S.activeId = e.id;
    S.sel = null; S.range = null;
  }

  function popRedo() {
    if (!S.redoStack.length) return;
    var e = S.redoStack.pop();
    var cur = getTable(e.id); if (!cur) return;
    S.undoStack.push({ id: e.id, data: deepClone(cur) });
    var idx = S.tables.indexOf(cur);
    S.tables[idx] = deepClone(e.data);
    S.activeId = e.id;
    S.sel = null; S.range = null;
  }

  function addTable(name, rows, cols) {
    var t = defaultTable(name, rows || 10, cols || 5);
    S.tables.push(t);
    S.activeId = t.id;
    S.sel = null; S.range = null;
    return t;
  }

  function deleteTable(id) {
    S.tables = S.tables.filter(function (t) { return t.id !== id; });
    if (S.activeId === id) S.activeId = S.tables.length ? S.tables[0].id : null;
    S.sel = null; S.range = null;
  }

  function duplicateTable(id) {
    var t = getTable(id); if (!t) return;
    var d = deepClone(t); d.id = uid(); d.name += ' (Copy)'; d.createdAt = Date.now(); d.updatedAt = Date.now();
    S.tables.push(d); S.activeId = d.id;
  }

  function renameTable(id, name) {
    var t = getTable(id); if (t) { t.name = name; t.updatedAt = Date.now(); }
  }

  function setCellValue(r, c, val) {
    var t = activeTable(); if (!t || !t.cells[r] || !t.cells[r][c]) return;
    pushUndo();
    t.cells[r][c].value = val;
    t.updatedAt = Date.now();
  }

  function updateCellFormat(r, c, props) {
    var t = activeTable(); if (!t || !t.cells[r] || !t.cells[r][c]) return;
    Object.keys(props).forEach(function (k) { t.cells[r][c][k] = props[k]; });
  }

  function setRangeFormat(props) {
    var t = activeTable(); if (!t) return;
    var rng = S.range || (S.sel ? { sr: S.sel.row, sc: S.sel.col, er: S.sel.row, ec: S.sel.col } : null);
    if (!rng) return;
    pushUndo();
    var sr = Math.min(rng.sr, rng.er), er = Math.max(rng.sr, rng.er);
    var sc = Math.min(rng.sc, rng.ec), ec = Math.max(rng.sc, rng.ec);
    for (var r = sr; r <= er; r++) for (var c = sc; c <= ec; c++) {
      if (t.cells[r] && t.cells[r][c]) Object.keys(props).forEach(function (k) { t.cells[r][c][k] = props[k]; });
    }
    t.updatedAt = Date.now();
  }

  function toggleFormat(key) {
    var t = activeTable(); if (!t || !S.sel) return;
    var cell = t.cells[S.sel.row] && t.cells[S.sel.row][S.sel.col];
    if (!cell) return;
    var props = {}; props[key] = !cell[key];
    setRangeFormat(props);
  }

  function insertRow(idx) {
    var t = activeTable(); if (!t) return; pushUndo();
    var nr = []; for (var c = 0; c < t.headers.length; c++) nr.push(makeCell(''));
    t.cells.splice(idx, 0, nr);
    t.updatedAt = Date.now();
  }

  function removeRow(idx) {
    var t = activeTable(); if (!t || t.cells.length <= 1) return; pushUndo();
    t.cells.splice(idx, 1);
    t.updatedAt = Date.now();
    S.sel = null; S.range = null;
  }

  function moveRow(idx, dir) {
    var t = activeTable(); if (!t) return;
    var target = idx + dir;
    if (target < 0 || target >= t.cells.length) return;
    pushUndo();
    var row = t.cells.splice(idx, 1)[0];
    t.cells.splice(target, 0, row);
    S.sel = { row: target, col: S.sel ? S.sel.col : 0 };
    t.updatedAt = Date.now();
  }

  function insertCol(idx) {
    var t = activeTable(); if (!t) return; pushUndo();
    t.headers.splice(idx, 0, { id: uid(), name: colLabel(idx), width: 140 });
    t.cells.forEach(function (row) { row.splice(idx, 0, makeCell('')); });
    t.updatedAt = Date.now();
    S.sel = null; S.range = null;
  }

  function removeCol(idx) {
    var t = activeTable(); if (!t || t.headers.length <= 1) return; pushUndo();
    t.headers.splice(idx, 1);
    t.cells.forEach(function (row) { row.splice(idx, 1); });
    t.updatedAt = Date.now();
    S.sel = null; S.range = null;
  }

  function moveCol(idx, dir) {
    var t = activeTable(); if (!t) return;
    var target = idx + dir;
    if (target < 0 || target >= t.headers.length) return;
    pushUndo();
    var hdr = t.headers.splice(idx, 1)[0];
    t.headers.splice(target, 0, hdr);
    t.cells.forEach(function (row) {
      var cell = row.splice(idx, 1)[0];
      row.splice(target, 0, cell);
    });
    S.sel = { row: S.sel ? S.sel.row : 0, col: target };
    t.updatedAt = Date.now();
  }

  function toggleSort(ci) {
    var t = activeTable(); if (!t) return;
    if (t.sortCol === ci) {
      if (t.sortDir === 'asc') { t.sortDir = 'desc'; }
      else { t.sortCol = -1; t.sortDir = ''; }
    } else {
      t.sortCol = ci;
      t.sortDir = 'asc';
    }
    if (t.sortCol >= 0) {
      t.cells.sort(function (a, b) {
        var va = a[ci] ? a[ci].value : '', vb = b[ci] ? b[ci].value : '';
        var na = parseFloat(va), nb = parseFloat(vb);
        if (!isNaN(na) && !isNaN(nb)) return t.sortDir === 'asc' ? na - nb : nb - na;
        return t.sortDir === 'asc' ? va.localeCompare(vb) : vb.localeCompare(va);
      });
    }
    t.updatedAt = Date.now();
  }

  function copySelection() {
    var t = activeTable(); if (!t || !S.sel) return;
    var rng = S.range || { sr: S.sel.row, sc: S.sel.col, er: S.sel.row, ec: S.sel.col };
    var sr = Math.min(rng.sr, rng.er), er = Math.max(rng.sr, rng.er);
    var sc = Math.min(rng.sc, rng.ec), ec = Math.max(rng.sc, rng.ec);
    var cells = [];
    for (var r = sr; r <= er; r++) {
      var row = [];
      for (var c = sc; c <= ec; c++) row.push(deepClone(t.cells[r][c]));
      cells.push(row);
    }
    S.clipboard = { cells: cells };
    try {
      var text = cells.map(function (row) { return row.map(function (cell) { return cell.value; }).join('\t'); }).join('\n');
      navigator.clipboard.writeText(text).catch(function () {});
    } catch (e) {}
  }

  function pasteSelection() {
    var t = activeTable(); if (!t || !S.clipboard || !S.sel) return; pushUndo();
    var cl = S.clipboard;
    for (var r = 0; r < cl.cells.length; r++) for (var c = 0; c < cl.cells[r].length; c++) {
      var tr = S.sel.row + r, tc = S.sel.col + c;
      if (t.cells[tr] && t.cells[tr][tc]) t.cells[tr][tc] = deepClone(cl.cells[r][c]);
    }
    t.updatedAt = Date.now();
  }

  function deleteSelection() {
    var t = activeTable(); if (!t || !S.sel) return; pushUndo();
    var rng = S.range || { sr: S.sel.row, sc: S.sel.col, er: S.sel.row, ec: S.sel.col };
    var sr = Math.min(rng.sr, rng.er), er = Math.max(rng.sr, rng.er);
    var sc = Math.min(rng.sc, rng.ec), ec = Math.max(rng.sc, rng.ec);
    for (var r = sr; r <= er; r++) for (var c = sc; c <= ec; c++) {
      if (t.cells[r] && t.cells[r][c]) t.cells[r][c] = makeCell('');
    }
    t.updatedAt = Date.now();
  }

  function clearTableData() {
    var t = activeTable(); if (!t) return; pushUndo();
    t.cells = t.cells.map(function (row) { return row.map(function () { return makeCell(''); }); });
    t.updatedAt = Date.now();
  }

  function exportCsv() {
    var t = activeTable(); if (!t) return '';
    var escCsv = function (v) { if (!v) return ''; if (v.indexOf(',') !== -1 || v.indexOf('"') !== -1 || v.indexOf('\n') !== -1) return '"' + v.replace(/"/g, '""') + '"'; return v; };
    var lines = [t.headers.map(function (h) { return escCsv(h.name); }).join(',')];
    t.cells.forEach(function (row) { lines.push(row.map(function (c) { return escCsv(c.value); }).join(',')); });
    return lines.join('\n');
  }

  function importCsv(text, name) {
    var lines = text.split('\n').filter(function (l) { return l.trim(); });
    if (!lines.length) return addTable(name || 'Imported');
    var parseLine = function (line) {
      var result = [], cur = '', inQ = false;
      for (var i = 0; i < line.length; i++) {
        var ch = line[i];
        if (ch === '"') { if (inQ && line[i + 1] === '"') { cur += '"'; i++; } else inQ = !inQ; }
        else if (ch === ',' && !inQ) { result.push(cur.trim()); cur = ''; }
        else cur += ch;
      }
      result.push(cur.trim());
      return result;
    };
    var hdrs = parseLine(lines[0]);
    var dataRows = lines.slice(1).map(parseLine);
    var maxCols = Math.max(hdrs.length, dataRows.reduce(function (m, r) { return Math.max(m, r.length); }, 0));
    while (hdrs.length < maxCols) hdrs.push(colLabel(hdrs.length));
    dataRows.forEach(function (r) { while (r.length < maxCols) r.push(''); });
    var t = defaultTable(name || 'Imported', dataRows.length, maxCols);
    t.headers = hdrs.map(function (h) { return { id: uid(), name: h, width: 140 }; });
    t.cells = dataRows.map(function (row) { return row.map(function (val) { return makeCell(val); }); });
    S.tables.push(t); S.activeId = t.id;
    return t;
  }

  function exportHtml() {
    var t = activeTable(); if (!t) return '';
    var html = '<table><thead><tr>';
    t.headers.forEach(function (h) { html += '<th>' + esc(h.name) + '</th>'; });
    html += '</tr></thead><tbody>';
    t.cells.forEach(function (row) {
      html += '<tr>';
      row.forEach(function (c) { html += '<td>' + esc(c.value) + '</td>'; });
      html += '</tr>';
    });
    html += '</tbody></table>';
    return html;
  }

  function $(sel, ctx) { return (ctx || container).querySelector(sel); }
  function $$(sel, ctx) { return Array.from((ctx || container).querySelectorAll(sel)); }

  function render() {
    var t = activeTable();
    if (openColorPicker) { openColorPicker.remove(); openColorPicker = null; }
    if (openDropdown) { openDropdown.remove(); openDropdown = null; }
    if (!t) { renderEmpty(); return; }
    renderSidebar();
    renderToolbar();
    renderGrid(t);
    renderStatus(t);
  }

  function renderEmpty() {
    var main = $('.tm-main');
    if (main) main.innerHTML =
      '<div class="tm-empty"><div class="tm-empty__icon">' + icon('table', 48) + '</div><h3>No table selected</h3>' +
      '<p>Create or select a table to get started.</p></div>';
    $$('.tm-sidebar')[0] && renderSidebar();
  }

  function updateSidebarCount() {
    var el = $('#tm-count'); if (el) el.textContent = S.tables.length + ' table' + (S.tables.length !== 1 ? 's' : '');
  }

  function renderSidebar() {
    var list = $('#tm-list'); if (!list) return;
    if (!S.tables.length) {
      list.innerHTML = '<div class="tm-sidebar-empty">No tables yet</div>';
      updateSidebarCount();
      return;
    }
    list.innerHTML = S.tables.map(function (t) {
      var active = t.id === S.activeId;
      var dims = t.cells.length + ' \u00d7 ' + t.headers.length;
      return '<div class="tm-sb-item' + (active ? ' tm-sb-active' : '') + '" data-tid="' + t.id + '">' +
        '<div class="tm-sb-item__icon">' + icon('table', 14) + '</div>' +
        '<div class="tm-sb-item__info"><div class="tm-sb-item__name">' + esc(t.name) + '</div><div class="tm-sb-item__dims">' + dims + '</div></div>' +
        '<button class="tm-sb-item__menu" data-action="item-menu" data-tid="' + t.id + '">' + icon('more', 12) + '</button></div>';
    }).join('');
    updateSidebarCount();
  }

  function renderToolbar() {
    var tb = $('.tm-toolbar'); if (!tb) return;
    tb.style.display = 'flex';
    var t = activeTable();
    var hasSel = !!S.sel;
    var cell = hasSel && t.cells[S.sel.row] && t.cells[S.sel.row][S.sel.col] ? t.cells[S.sel.row][S.sel.col] : null;

    function tbBtn(name, tip, active, dis) {
      return '<button class="tm-tb-btn' + (active ? ' tm-tb-on' : '') + '" title="' + tip + '" data-tb="' + name + '"' + (dis ? ' disabled' : '') + '>' + icon(name, 15) + '</button>';
    }

    var labelHtml = '';
    if (hasSel && t.labels && t.labels.length) {
      var currentLabel = cell && cell.labelId ? t.labels.find(function (l) { return l.id === cell.labelId; }) : null;
      labelHtml = '<div class="tm-tb-group"><label class="tm-tb-select-wrap">' +
        '<select class="tm-tb-select" data-tb="label">' +
        '<option value="">' + (currentLabel ? esc(currentLabel.name) : 'Label') + '</option>';
      t.labels.forEach(function (l) {
        labelHtml += '<option value="' + l.id + '"' + (cell && cell.labelId === l.id ? ' selected' : '') + ' style="color:' + l.color + '">' + esc(l.name) + '</option>';
      });
      labelHtml += '</select></label>' +
        '<button class="tm-tb-btn2" data-action="edit-labels" title="Edit labels">\u2699\ufe0f</button></div>';
    }

    var fontSizeHtml = '<div class="tm-tb-group"><select class="tm-tb-select" data-tb="fontSize">' +
      '<option value="0">Size</option>';
    FONT_SIZES.forEach(function (s) {
      var selected = cell && cell.fontSize === s ? ' selected' : '';
      fontSizeHtml += '<option value="' + s + '"' + selected + '>' + s + '</option>';
    });
    fontSizeHtml += '</select></div>';

    tb.innerHTML =
      tbBtn('undo', 'Undo (Ctrl+Z)', false, !S.undoStack.length) +
      tbBtn('redo', 'Redo (Ctrl+Y)', false, !S.redoStack.length) +
      '<span class="tm-tb-sep"></span>' +
      tbBtn('copy', 'Copy (Ctrl+C)', false, !hasSel) +
      tbBtn('paste', 'Paste (Ctrl+V)', false, !hasSel || !S.clipboard) +
      tbBtn('trash', 'Delete selection (Del)', false, !hasSel) +
      '<span class="tm-tb-sep"></span>' +
      tbBtn('bold', 'Bold (Ctrl+B)', cell && cell.bold, !hasSel) +
      tbBtn('italic', 'Italic (Ctrl+I)', cell && cell.italic, !hasSel) +
      tbBtn('underline', 'Underline (Ctrl+U)', cell && cell.underline, !hasSel) +
      tbBtn('strike', 'Strikethrough', cell && cell.strikethrough, !hasSel) +
      '<span class="tm-tb-sep"></span>' +
      tbBtn('alignL', 'Align Left', !hasSel || !cell || !cell.align || cell.align === 'left', !hasSel) +
      tbBtn('alignC', 'Align Center', cell && cell.align === 'center', !hasSel) +
      tbBtn('alignR', 'Align Right', cell && cell.align === 'right', !hasSel) +
      '<span class="tm-tb-sep"></span>' +
      fontSizeHtml +
      '<span class="tm-tb-sep"></span>' +
      '<button class="tm-tb-btn" title="Text Color" data-tb="textColor" ' + (!hasSel ? 'disabled' : '') + '>' + icon('type', 15) +
        '<span class="tm-tb-cbar" style="background:' + (cell && cell.textColor ? cell.textColor : '#000') + '"></span></button>' +
      '<button class="tm-tb-btn" title="Background Color" data-tb="bgColor" ' + (!hasSel ? 'disabled' : '') + '>' + icon('bucket', 15) +
        '<span class="tm-tb-cbar" style="background:' + (cell && cell.bgColor ? cell.bgColor : '#fff') + '"></span></button>' +
      '<span class="tm-tb-sep"></span>' +
      labelHtml +
      '<span class="tm-tb-sep"></span>' +
      '<div class="tm-tb-group">' +
        '<button class="tm-tb-btn2" data-tb="addRow">' + icon('plus', 11) + ' Row</button>' +
        '<button class="tm-tb-btn2" data-tb="addCol">' + icon('plus', 11) + ' Col</button>' +
      '</div>' +
      '<span class="tm-tb-sep"></span>' +
      tbBtn('upload', 'Import CSV', false, false) +
      tbBtn('download', 'Export CSV', false, false) +
      '<span class="tm-tb-spacer"></span>' +
      '<label class="tm-tb-name"><input class="tm-tb-name-input" id="tm-table-name" value="' + esc(t.name) + '"></label>';
  }

  function renderGrid(t) {
    var wrap = $('.tm-grid-wrap'); if (!wrap) return;
    var html = '<div class="tm-grid-container"><table class="tm-grid"><colgroup>';
    html += '<col class="tm-row-num-col">';
    for (var ci = 0; ci < t.headers.length; ci++) html += '<col style="width:' + t.headers[ci].width + 'px">';
    html += '</colgroup><thead><tr class="tm-hdr-row">';
    html += '<th class="tm-corner"><div class="tm-corner-inner"></div></th>';
    for (var hi = 0; hi < t.headers.length; hi++) {
      var h = t.headers[hi];
      var sortIcon = '';
      if (t.sortCol === hi) sortIcon = icon(t.sortDir === 'asc' ? 'sortUp' : 'sortDown', 11);
      var selCol = S.sel && S.sel.col === hi && (!S.range || (S.range.sc <= hi && S.range.ec >= hi));
      html += '<th class="tm-hdr' + (selCol ? ' tm-hdr-sel' : '') + '" data-col="' + hi + '">' +
        '<div class="tm-hdr-content"><span class="tm-hdr-name">' + esc(h.name) + '</span>' + sortIcon +
        '<div class="tm-hdr-resize" data-col-resize="' + hi + '"></div></div></th>';
    }
    html += '</tr></thead><tbody>';
    var rowCount = t.cells.length;
    for (var ri = 0; ri < rowCount; ri++) {
      var row = t.cells[ri];
      var selRow = S.sel && S.sel.row === ri;
      html += '<tr class="tm-row">';
      html += '<td class="tm-row-num' + (selRow ? ' tm-row-sel' : '') + '" data-row="' + ri + '">' + (ri + 1) + '</td>';
      for (var cj = 0; cj < t.headers.length; cj++) {
        var cell = row[cj];
        var selected = S.sel && S.sel.row === ri && S.sel.col === cj;
        var inRange = false;
        if (S.range) {
          var sr = Math.min(S.range.sr, S.range.er), er2 = Math.max(S.range.sr, S.range.er);
          var sc = Math.min(S.range.sc, S.range.ec), ec2 = Math.max(S.range.sc, S.range.ec);
          inRange = ri >= sr && ri <= er2 && cj >= sc && cj <= ec2;
        }
        var cls = 'tm-cell';
        if (selected) cls += ' tm-cell-sel';
        else if (inRange) cls += ' tm-cell-range';

        var style = '';
        if (cell.bold) style += 'font-weight:700;';
        if (cell.italic) style += 'font-style:italic;';
        if (cell.underline && cell.strikethrough) style += 'text-decoration:underline line-through;';
        else if (cell.underline) style += 'text-decoration:underline;';
        else if (cell.strikethrough) style += 'text-decoration:line-through;';
        if (cell.fontSize > 0) style += 'font-size:' + cell.fontSize + 'px;';
        if (cell.textColor) style += 'color:' + cell.textColor + ';';
        if (cell.bgColor) style += 'background-color:' + cell.bgColor + ';';
        if (cell.align === 'center') style += 'text-align:center;';
        else if (cell.align === 'right') style += 'text-align:right;';

        var labelBadge = '';
        if (cell.labelId && t.labels) {
          var lbl = t.labels.find(function (l) { return l.id === cell.labelId; });
          if (lbl) labelBadge = '<span class="tm-label-badge" style="background:' + lbl.color + '">' + esc(lbl.name) + '</span>';
        }

        html += '<td class="' + cls + '" style="' + style + '" data-row="' + ri + '" data-col="' + cj + '">' +
          '<div class="tm-cell-val">' + (cell.value ? esc(cell.value) : '') + '</div>' + labelBadge +
          (selected ? '<div class="tm-fill-hdl"></div>' : '') + '</td>';
      }
      html += '</tr>';
    }
    html += '</tbody></table></div>';
    wrap.innerHTML = html;
    wrap.focus();
  }

  function renderStatus(t) {
    var sb = $('.tm-status'); if (!sb) return;
    sb.style.display = 'flex';
    var ref = S.sel ? colLabel(S.sel.col) + (S.sel.row + 1) : '';
    var val = S.sel && t.cells[S.sel.row] && t.cells[S.sel.row][S.sel.col] ? t.cells[S.sel.row][S.sel.col].value : '';
    var filled = 0, total = t.cells.length * t.headers.length;
    t.cells.forEach(function (row) { row.forEach(function (c) { if (c.value) filled++; }); });
    sb.innerHTML = '<span class="tm-st-ref">' + ref + '</span>' +
      (val ? '<span class="tm-st-val">' + esc(val) + '</span>' : '') +
      '<span class="tm-st-spacer"></span>' +
      '<span class="tm-st-info">' + filled + '/' + total + ' filled</span>' +
      (t.sortCol >= 0 ? '<span class="tm-st-info">Sorted by ' + esc(t.headers[t.sortCol].name) + '</span>' : '');
  }

  function scrollCellIntoView(row, col) {
    var td = container.querySelector('.tm-cell[data-row="' + row + '"][data-col="' + col + '"]');
    if (td) td.scrollIntoView({ block: 'nearest', inline: 'nearest' });
  }

  function moveSel(row, col) {
    var t = activeTable(); if (!t) return;
    row = clamp(row, 0, t.cells.length - 1);
    col = clamp(col, 0, t.headers.length - 1);
    S.sel = { row: row, col: col }; S.range = null;
    render();
    scrollCellIntoView(row, col);
  }

  function startEditing(row, col, initialChar) {
    if (editingCell) commitEdit();
    var t = activeTable(); if (!t) return;
    var td = container.querySelector('.tm-cell[data-row="' + row + '"][data-col="' + col + '"]');
    if (!td) return;
    var valDiv = td.querySelector('.tm-cell-val');
    if (!valDiv) return;
    var input = document.createElement('input');
    input.className = 'tm-cell-input';
    input.value = initialChar !== undefined ? initialChar : t.cells[row][col].value;
    valDiv.style.display = 'none';
    td.appendChild(input);
    input.focus();
    if (initialChar === undefined) input.setSelectionRange(input.value.length, input.value.length);
    editingCell = { row: row, col: col, input: input };
    S.editing = true;
    input.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); commitEdit(); moveSel(row + 1, col); return; }
      if (e.key === 'Tab') { e.preventDefault(); commitEdit(); moveSel(row, e.shiftKey ? col - 1 : col + 1); return; }
      if (e.key === 'Escape') { cancelEdit(); return; }
    });
    input.addEventListener('blur', function () { commitEdit(); });
  }

  function commitEdit() {
    if (!editingCell) return;
    var t = activeTable();
    if (t) {
      var newVal = editingCell.input.value;
      var oldVal = t.cells[editingCell.row][editingCell.col].value;
      if (newVal !== oldVal) { t.cells[editingCell.row][editingCell.col].value = newVal; t.updatedAt = Date.now(); }
    }
    restoreCellDisplay(editingCell.row, editingCell.col);
    editingCell = null;
    S.editing = false;
    renderStatus(activeTable());
    renderToolbar();
  }

  function cancelEdit() {
    if (!editingCell) return;
    restoreCellDisplay(editingCell.row, editingCell.col);
    editingCell = null; S.editing = false;
  }

  function restoreCellDisplay(row, col) {
    var td = container.querySelector('.tm-cell[data-row="' + row + '"][data-col="' + col + '"]');
    if (!td) return;
    var input = td.querySelector('.tm-cell-input'); if (input) input.remove();
    var valDiv = td.querySelector('.tm-cell-val'); if (valDiv) { valDiv.style.display = ''; }
  }

  function showColorPicker(e, key) {
    if (openColorPicker) { openColorPicker.remove(); openColorPicker = null; return; }
    var btn = e.target.closest('.tm-tb-btn'); if (!btn) return;
    var t = activeTable(); if (!t || !S.sel) return;
    var cell = t.cells[S.sel.row][S.sel.col];
    var picker = document.createElement('div');
    picker.className = 'tm-color-picker';
    var current = cell ? (cell[key] || (key === 'bgColor' ? '#ffffff' : '#000000')) : (key === 'bgColor' ? '#ffffff' : '#000000');
    var presets = key === 'bgColor'
      ? ['#ffffff', '#fef2f2', '#fff7ed', '#fefce8', '#f0fdf4', '#ecfdf5', '#f0f9ff', '#eff6ff', '#faf5ff', '#fdf4ff', '#f5f5f4', '#fee2e2', '#ffedd5', '#fef9c3', '#dcfce7', '#d1fae5', '#e0f2fe', '#dbeafe', '#e9d5ff', '#fce7f3', '#e7e5e4']
      : ['#000000', '#ef4444', '#f97316', '#eab308', '#22c55e', '#14b8a6', '#3b82f6', '#6366f1', '#8b5cf6', '#ec4899', '#78716c', '#dc2626', '#ea580c', '#ca8a04', '#16a34a', '#0d9488', '#2563eb', '#4f46e5', '#7c3aed', '#db2777', '#57534e'];

    picker.innerHTML = '<div class="tm-cp-grid">' +
      presets.map(function (c) { return '<button class="tm-cp-swatch' + (c.toLowerCase() === current.toLowerCase() ? ' tm-cp-sel' : '') + '" data-color="' + c + '" style="background:' + c + ';border:1px solid ' + (c === '#ffffff' ? '#ddd' : c) + '"></button>'; }).join('') +
      '</div><div class="tm-cp-custom"><label>Custom: <input type="color" value="' + current + '"></label></div>';
    var rect = btn.getBoundingClientRect();
    picker.style.cssText = 'position:fixed;top:' + (rect.bottom + 4) + 'px;left:' + Math.max(4, Math.min(rect.left + rect.width / 2 - 90, window.innerWidth - 188)) + 'px;z-index:10000';
    document.body.appendChild(picker);
    openColorPicker = picker;

    var closePicker = function () { picker.remove(); openColorPicker = null; document.removeEventListener('mousedown', onOutside, true); };
    var onOutside = function (ev) { if (!picker.contains(ev.target) && !ev.target.closest('[data-tb="' + key + '"]')) closePicker(); };
    setTimeout(function () { document.addEventListener('mousedown', onOutside, true); }, 0);

    var applyColor = function (color) {
      setRangeFormat(function () { var o = {}; o[key] = color; return o; }());
      render();
      syncToAppStore();
      closePicker();
      setTimeout(function () { showColorPicker({ target: btn }, key); }, 50);
    };

    picker.addEventListener('click', function (ev) {
      var sw = ev.target.closest('.tm-cp-swatch');
      if (sw && sw.dataset.color !== undefined) applyColor(sw.dataset.color);
    });
    picker.querySelector('input[type="color"]').addEventListener('input', function (ev) {
      applyColor(ev.target.value);
    });
  }

  function showContextMenu(e, row, col) {
    e.preventDefault();
    var menu = document.createElement('div');
    menu.className = 'tm-ctx-menu';
    menu.innerHTML =
      '<button class="tm-ctx-item" data-action="edit">\u270f\ufe0f Edit cell</button>' +
      '<div class="tm-ctx-sep"></div>' +
      '<button class="tm-ctx-item" data-action="ins-ra">Insert row above</button>' +
      '<button class="tm-ctx-item" data-action="ins-rb">Insert row below</button>' +
      '<button class="tm-ctx-item tm-ctx-danger" data-action="del-r">Delete row</button>' +
      '<div class="tm-ctx-sep"></div>' +
      '<button class="tm-ctx-item" data-action="ins-cl">Insert column left</button>' +
      '<button class="tm-ctx-item" data-action="ins-cr">Insert column right</button>' +
      '<button class="tm-ctx-item tm-ctx-danger" data-action="del-c">Delete column</button>' +
      '<div class="tm-ctx-sep"></div>' +
      '<button class="tm-ctx-item" data-action="mv-ru">Move row up</button>' +
      '<button class="tm-ctx-item" data-action="mv-rd">Move row down</button>' +
      '<div class="tm-ctx-sep"></div>' +
      '<button class="tm-ctx-item" data-action="sort">Sort column</button>' +
      '<button class="tm-ctx-item" data-action="clear">Clear cell(s)</button>';
    container.appendChild(menu);
    menu.style.cssText = 'position:fixed;left:' + Math.min(e.clientX, window.innerWidth - 200) + 'px;top:' + Math.min(e.clientY, window.innerHeight - 320) + 'px;z-index:9999';
    var close = function () { menu.remove(); document.removeEventListener('mousedown', onOutside, true); };
    var onOutside = function (ev) { if (!menu.contains(ev.target)) close(); };
    setTimeout(function () { document.addEventListener('mousedown', onOutside, true); }, 0);

    menu.addEventListener('click', function (ev) {
      var item = ev.target.closest('.tm-ctx-item'); if (!item) return;
      var t2 = activeTable();
      switch (item.dataset.action) {
        case 'edit': startEditing(row, col); break;
        case 'ins-ra': insertRow(row); render(); syncToAppStore(); break;
        case 'ins-rb': insertRow(row + 1); render(); syncToAppStore(); break;
        case 'del-r': removeRow(row); render(); syncToAppStore(); break;
        case 'ins-cl': insertCol(col); render(); syncToAppStore(); break;
        case 'ins-cr': insertCol(col + 1); render(); syncToAppStore(); break;
        case 'del-c': removeCol(col); render(); syncToAppStore(); break;
        case 'mv-ru': moveRow(row, -1); render(); syncToAppStore(); break;
        case 'mv-rd': moveRow(row, 1); render(); syncToAppStore(); break;
        case 'sort': toggleSort(col); render(); break;
        case 'clear': pushUndo(); deleteSelection(); render(); syncToAppStore(); break;
      }
      close();
    });
  }

  function showLabelsModal() {
    var t = activeTable(); if (!t) return;
    var overlay = document.createElement('div');
    overlay.className = 'tm-overlay';
    overlay.innerHTML =
      '<div class="tm-modal tm-modal-md"><div class="tm-modal-hdr"><h3>Edit Labels</h3><button class="tm-btn-close" data-action="close">' + icon('close', 16) + '</button></div>' +
      '<div class="tm-modal-bd" id="tm-labels-body">' +
      t.labels.map(function (l, i) { return '<div class="tm-label-row" data-idx="' + i + '"><input class="tm-lbl-name" value="' + esc(l.name) + '"><input class="tm-lbl-color" type="color" value="' + l.color + '"><button class="tm-lbl-del" data-action="del-label">' + icon('trash', 13) + '</button></div>'; }).join('') +
      '</div><div class="tm-modal-ft">' +
      '<button class="tm-btn tm-btn-sm" data-action="add-label">+ Add Label</button>' +
      '<button class="tm-btn tm-btn-sm tm-btn-primary" data-action="save-labels">Save</button></div></div>';
    document.body.appendChild(overlay);
    overlay.addEventListener('click', function (e) {
      if (e.target === overlay) overlay.remove();
      if (e.target.closest('[data-action="close"]')) overlay.remove();
      if (e.target.closest('[data-action="add-label"]')) {
        var body = $('#tm-labels-body', overlay);
        if (body) body.insertAdjacentHTML('beforeend',
          '<div class="tm-label-row"><input class="tm-lbl-name" value="New Label"><input class="tm-lbl-color" type="color" value="#6366f1"><button class="tm-lbl-del" data-action="del-label">' + icon('trash', 13) + '</button></div>');
      }
      if (e.target.closest('[data-action="del-label"]')) {
        var row = e.target.closest('.tm-label-row');
        if (row && overlay.querySelectorAll('.tm-label-row').length > 1) row.remove();
      }
      if (e.target.closest('[data-action="save-labels"]')) {
        var rows = overlay.querySelectorAll('.tm-label-row');
        var labels = Array.from(rows).map(function (r) {
          return { id: uid(), name: r.querySelector('.tm-lbl-name').value.trim() || 'Label', color: r.querySelector('.tm-lbl-color').value };
        });
        t.labels = labels;
        overlay.remove();
        render();
        syncToAppStore();
      }
    });
  }

  function setupEvents() {
    container.addEventListener('click', function (e) {
      if (e.target.closest('[data-action="new-table"]')) { showCreateModal(); return; }
      if (e.target.closest('[data-action="edit-labels"]')) { showLabelsModal(); return; }

      var item = e.target.closest('.tm-sb-item');
      if (item && !e.target.closest('[data-action="item-menu"]')) {
        S.activeId = item.dataset.tid; S.sel = null; S.range = null; render(); return;
      }

      var menuBtn = e.target.closest('[data-action="item-menu"]'); if (menuBtn) {
        e.stopPropagation();
        if (openDropdown) { openDropdown.remove(); openDropdown = null; }
        var tid = menuBtn.dataset.tid;
        var dd = document.createElement('div');
        dd.className = 'tm-dropdown';
        dd.innerHTML =
          '<button class="tm-dd-item" data-action="rename">' + icon('pencil', 12) + ' Rename</button>' +
          '<button class="tm-dd-item" data-action="dup">' + icon('copy', 12) + ' Duplicate</button>' +
          '<div class="tm-dd-sep"></div>' +
          '<button class="tm-dd-item tm-dd-danger" data-action="del">' + icon('trash', 12) + ' Delete</button>';
        menuBtn.parentElement.appendChild(dd);
        openDropdown = dd;
        var closeDd = function (ev) { if (dd && !dd.contains(ev.target) && !ev.target.closest('[data-action="item-menu"]')) { dd.remove(); openDropdown = null; document.removeEventListener('mousedown', closeDd, true); } };
        setTimeout(function () { document.addEventListener('mousedown', closeDd, true); }, 0);

        dd.addEventListener('click', function (ev) {
          var act = ev.target.closest('.tm-dd-item'); if (!act) return;
          switch (act.dataset.action) {
            case 'rename':
              dd.remove(); openDropdown = null;
              var itemEl = container.querySelector('.tm-sb-item[data-tid="' + tid + '"] .tm-sb-item__name');
              if (!itemEl) break;
              var cur = itemEl.textContent;
              var inp = document.createElement('input');
              inp.className = 'tm-inline-input';
              inp.value = cur;
              itemEl.replaceWith(inp);
              inp.focus(); inp.select();
              nameEditActive = true;
              var finish = function (save) {
                var v = save ? (inp.value.trim() || 'Table') : cur;
                var sp = document.createElement('div');
                sp.className = 'tm-sb-item__name';
                sp.textContent = v;
                inp.replaceWith(sp);
                nameEditActive = false;
                if (save && v !== cur) { renameTable(tid, v); syncToAppStore(); renderToolbar(); }
              };
              inp.addEventListener('blur', function () { finish(true); });
              inp.addEventListener('keydown', function (ek) { if (ek.key === 'Enter') inp.blur(); if (ek.key === 'Escape') finish(false); });
              break;
            case 'dup': dd.remove(); openDropdown = null; duplicateTable(tid); render(); syncToAppStore(); break;
            case 'del': dd.remove(); openDropdown = null; showConfirm('Delete "' + (getTable(tid) ? getTable(tid).name : '') + '"?', function () { deleteTable(tid); render(); syncToAppStore(); }); break;
          }
          if (openDropdown) { openDropdown.remove(); openDropdown = null; }
        });
        return;
      }

      var tb = e.target.closest('[data-tb]'); if (tb) { handleToolbar(tb.dataset.tb, e); return; }
      var cell = e.target.closest('.tm-cell');
      if (cell && !e.target.closest('.tm-cell-input') && !e.target.closest('.tm-hdr-resize')) {
        if (editingCell) commitEdit();
        var r = parseInt(cell.dataset.row), c = parseInt(cell.dataset.col);
        S.sel = { row: r, col: c }; S.range = null; render(); return;
      }
      var hdr = e.target.closest('[data-col]');
      if (hdr && !e.target.closest('.tm-hdr-resize')) {
        var ci = parseInt(hdr.dataset.col);
        if (e.shiftKey && S.sel) {
          var t2 = activeTable();
          S.range = { sr: 0, sc: Math.min(S.sel.col, ci), er: t2.cells.length - 1, ec: Math.max(S.sel.col, ci) };
          render();
        } else {
          toggleSort(ci); render();
        }
        return;
      }
      var rowNum = e.target.closest('[data-row]');
      if (rowNum && !rowNum.classList.contains('tm-hdr')) {
        var ri = parseInt(rowNum.dataset.row);
        if (e.shiftKey && S.sel) {
          var t2 = activeTable();
          S.range = { sr: Math.min(S.sel.row, ri), sc: 0, er: Math.max(S.sel.row, ri), ec: t2.headers.length - 1 };
          render();
        } else {
          S.sel = { row: ri, col: 0 };
          S.range = { sr: ri, sc: 0, er: ri, ec: activeTable().headers.length - 1 };
          render();
        }
        return;
      }
      var resizeHdl = e.target.closest('[data-col-resize]');
      if (resizeHdl) { startColResize(parseInt(resizeHdl.dataset.colResize), e); return; }
    });

    container.addEventListener('dblclick', function (e) {
      var cell = e.target.closest('.tm-cell');
      if (cell) { var r = parseInt(cell.dataset.row), c = parseInt(cell.dataset.col); startEditing(r, c); return; }
      var hdr = e.target.closest('[data-col]');
      if (hdr && !e.target.closest('.tm-hdr-resize')) {
        var ci = parseInt(hdr.dataset.col);
        var nameEl = hdr.querySelector('.tm-hdr-name'); if (!nameEl) return;
        var t = activeTable();
        var cur = nameEl.textContent;
        var inp = document.createElement('input');
        inp.className = 'tm-hdr-input';
        inp.value = t.headers[ci].name;
        nameEl.replaceWith(inp);
        inp.focus(); inp.select();
        nameEditActive = true;
        var finish = function (save) {
          var v = save ? (inp.value.trim() || colLabel(ci)) : cur;
          var sp = document.createElement('span');
          sp.className = 'tm-hdr-name';
          sp.textContent = v;
          inp.replaceWith(sp);
          nameEditActive = false;
          if (save && v !== t.headers[ci].name) { pushUndo(); t.headers[ci].name = v; syncToAppStore(); }
        };
        inp.addEventListener('blur', function () { finish(true); });
        inp.addEventListener('keydown', function (ev) { if (ev.key === 'Enter') inp.blur(); if (ev.key === 'Escape') finish(false); });
      }
    });

    container.addEventListener('contextmenu', function (e) {
      var cell = e.target.closest('.tm-cell');
      if (cell) {
        var r = parseInt(cell.dataset.row), c = parseInt(cell.dataset.col);
        if (editingCell) commitEdit();
        S.sel = { row: r, col: c }; S.range = null; render();
        showContextMenu(e, r, c);
      }
    });

    container.addEventListener('keydown', function (e) {
      if (nameEditActive || e.target.closest('.tm-hdr-input') || e.target.closest('.tm-inline-input')) return;
      if (!S.sel || S.editing || e.ctrlKey || e.metaKey) {
        if ((e.ctrlKey || e.metaKey) && !S.editing) {
          var t = activeTable(); if (!t || !S.sel) return;
          var r = S.sel.row, c = S.sel.col;
          if (e.key === 'z' && !e.shiftKey) { e.preventDefault(); popUndo(); render(); syncToAppStore(); }
          else if ((e.key === 'y') || (e.key === 'z' && e.shiftKey)) { e.preventDefault(); popRedo(); render(); syncToAppStore(); }
          else if (e.key === 'c') { e.preventDefault(); copySelection(); }
          else if (e.key === 'x') { e.preventDefault(); pushUndo(); copySelection(); deleteSelection(); render(); syncToAppStore(); }
          else if (e.key === 'v') { e.preventDefault(); pasteSelection(); render(); syncToAppStore(); }
          else if (e.key === 'b') { e.preventDefault(); toggleFormat('bold'); render(); syncToAppStore(); }
          else if (e.key === 'i') { e.preventDefault(); toggleFormat('italic'); render(); syncToAppStore(); }
          else if (e.key === 'u') { e.preventDefault(); toggleFormat('underline'); render(); syncToAppStore(); }
        }
        return;
      }
      var t = activeTable(); if (!t) return;
      var r = S.sel.row, c = S.sel.col;
      if (e.key === 'ArrowUp') { e.preventDefault(); moveSel(r - 1, c); }
      else if (e.key === 'ArrowDown') { e.preventDefault(); moveSel(r + 1, c); }
      else if (e.key === 'ArrowLeft') { e.preventDefault(); moveSel(r, c - 1); }
      else if (e.key === 'ArrowRight') { e.preventDefault(); moveSel(r, c + 1); }
      else if (e.key === 'Tab') { e.preventDefault(); moveSel(r, e.shiftKey ? c - 1 : c + 1); }
      else if (e.key === 'Enter') { e.preventDefault(); startEditing(r, c); }
      else if (e.key === 'F2') { e.preventDefault(); startEditing(r, c); }
      else if (e.key === 'Delete' || e.key === 'Backspace') { e.preventDefault(); pushUndo(); deleteSelection(); render(); syncToAppStore(); }
      else if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) { e.preventDefault(); startEditing(r, c, e.key); }
    });

    container.addEventListener('mousedown', function (e) {
      if (e.button !== 0) return;
      var fillHdl = e.target.closest('.tm-fill-hdl'); if (fillHdl) { startFillDrag(e); return; }
      var cell = e.target.closest('.tm-cell');
      if (!cell || e.target.closest('.tm-cell-input') || e.target.closest('.tm-hdr-resize')) return;
      var r = parseInt(cell.dataset.row), c = parseInt(cell.dataset.col);
      if (e.shiftKey) {
        if (!S.range) S.range = { sr: S.sel.row, sc: S.sel.col, er: S.sel.row, ec: S.sel.col };
        S.range.er = r; S.range.ec = c; render(); return;
      }
      S.sel = { row: r, col: c }; S.range = null;
      render();
      var sx = e.clientX, sy = e.clientY, started = false, raf = null;
      function onMove(ev) {
        if (!started) { if ((ev.clientX - sx) * (ev.clientX - sx) + (ev.clientY - sy) * (ev.clientY - sy) < 16) return; started = true; S.range = { sr: r, sc: c, er: r, ec: c }; }
        var el = document.elementFromPoint(ev.clientX, ev.clientY);
        var tc = el ? el.closest('.tm-cell') : null;
        if (!tc) return;
        var tr = parseInt(tc.dataset.row), tc2 = parseInt(tc.dataset.col);
        if (S.range && S.range.er === tr && S.range.ec === tc2) return;
        S.range = { sr: r, sc: c, er: tr, ec: tc2 };
        if (!raf) { raf = requestAnimationFrame(function () { raf = null; render(); }); }
      }
      function onUp() { document.removeEventListener('mousemove', onMove); document.removeEventListener('mouseup', onUp); if (raf) cancelAnimationFrame(raf); }
      document.addEventListener('mousemove', onMove); document.addEventListener('mouseup', onUp);
    });

    container.addEventListener('input', function (e) {
      var nameInput = e.target.closest('#tm-table-name');
      if (nameInput) {
        var t = activeTable(); if (t) { t.name = nameInput.value; t.updatedAt = Date.now(); syncToAppStore(); renderSidebar(); }
        return;
      }
    });

    container.addEventListener('change', function (e) {
      var labelSel = e.target.closest('[data-tb="label"]');
      if (labelSel) {
        var val = labelSel.value;
        setRangeFormat({ labelId: val });
        render();
        syncToAppStore();
        return;
      }
      var fontSizeSel = e.target.closest('[data-tb="fontSize"]');
      if (fontSizeSel) {
        var size = parseInt(fontSizeSel.value) || 0;
        setRangeFormat({ fontSize: size });
        render();
        syncToAppStore();
        return;
      }
    });

    document.addEventListener('mouseup', function () { endColResize(); });
    document.addEventListener('mousemove', function (e) { if (resizingCol !== null) doColResize(e); });
  }

  function startColResize(ci, e) {
    e.preventDefault(); e.stopPropagation();
    resizingCol = ci; resizingStartX = e.clientX;
    document.body.style.cursor = 'col-resize';
  }

  function doColResize(e) {
    if (resizingCol === null) return;
    var t = activeTable(); if (!t) return;
    var diff = e.clientX - resizingStartX;
    t.headers[resizingCol].width = Math.max(60, t.headers[resizingCol].width + diff);
    resizingStartX = e.clientX;
    renderGrid(t);
  }

  function endColResize() {
    if (resizingCol !== null) { resizingCol = null; document.body.style.cursor = ''; }
  }

  function startFillDrag(e) {
    e.preventDefault(); e.stopPropagation();
    var t = activeTable(); if (!t || !S.sel) return;
    var src = S.range
      ? { sr: Math.min(S.range.sr, S.range.er), sc: Math.min(S.range.sc, S.range.ec), er: Math.max(S.range.sr, S.range.er), ec: Math.max(S.range.sc, S.range.ec) }
      : { sr: S.sel.row, sc: S.sel.col, er: S.sel.row, ec: S.sel.col };
    var raf = null;
    function onMove(ev) {
      var el = document.elementFromPoint(ev.clientX, ev.clientY);
      var tc = el ? el.closest('.tm-cell') : null; if (!tc) return;
      S.range = { sr: src.sr, sc: src.sc, er: Math.max(src.er, parseInt(tc.dataset.row)), ec: Math.max(src.ec, parseInt(tc.dataset.col)) };
      if (!raf) { raf = requestAnimationFrame(function () { raf = null; render(); }); }
    }
    function onUp() {
      document.removeEventListener('mousemove', onMove); document.removeEventListener('mouseup', onUp);
      if (raf) cancelAnimationFrame(raf);
      doFill(src);
      render(); syncToAppStore();
    }
    document.addEventListener('mousemove', onMove); document.addEventListener('mouseup', onUp);
  }

  function doFill(src) {
    var t = activeTable(); if (!t) return;
    pushUndo();
    var dst = S.range || src;
    var dr0 = Math.min(dst.sr, dst.er), dr1 = Math.max(dst.sr, dst.er);
    var dc0 = Math.min(dst.sc, dst.ec), dc1 = Math.max(dst.sc, dst.ec);
    var srcRows = src.er - src.sr + 1, srcCols = src.ec - src.sc + 1;
    for (var r = dr0; r <= dr1; r++) for (var c = dc0; c <= dc1; c++) {
      if (r >= src.sr && r <= src.er && c >= src.sc && c <= src.ec) continue;
      if (!t.cells[r] || !t.cells[r][c]) continue;
      var sr2 = src.sr + ((r - dr0) % srcRows + srcRows) % srcRows;
      var sc2 = src.sc + ((c - dc0) % srcCols + srcCols) % srcCols;
      t.cells[r][c] = deepClone(t.cells[sr2][sc2]);
    }
    t.updatedAt = Date.now();
  }

  function handleToolbar(action, e) {
    var t = activeTable();
    switch (action) {
      case 'undo': popUndo(); render(); syncToAppStore(); break;
      case 'redo': popRedo(); render(); syncToAppStore(); break;
      case 'copy': copySelection(); break;
      case 'paste': pasteSelection(); render(); syncToAppStore(); break;
      case 'trash': pushUndo(); deleteSelection(); render(); syncToAppStore(); break;
      case 'bold': toggleFormat('bold'); render(); syncToAppStore(); break;
      case 'italic': toggleFormat('italic'); render(); syncToAppStore(); break;
      case 'underline': toggleFormat('underline'); render(); syncToAppStore(); break;
      case 'strike': toggleFormat('strikethrough'); render(); syncToAppStore(); break;
      case 'alignL': setRangeFormat({ align: 'left' }); render(); syncToAppStore(); break;
      case 'alignC': setRangeFormat({ align: 'center' }); render(); syncToAppStore(); break;
      case 'alignR': setRangeFormat({ align: 'right' }); render(); syncToAppStore(); break;
      case 'textColor': showColorPicker(e, 'textColor'); break;
      case 'bgColor': showColorPicker(e, 'bgColor'); break;
      case 'addRow': insertRow(t.cells.length); render(); syncToAppStore(); break;
      case 'addCol': insertCol(t.headers.length); render(); syncToAppStore(); break;
      case 'upload':
        var input = document.createElement('input');
        input.type = 'file'; input.accept = '.csv';
        input.addEventListener('change', function () {
          var file = input.files[0]; if (!file) return;
          var reader = new FileReader();
          reader.onload = function () { importCsv(reader.result, file.name.replace(/\.[^/.]+$/, '')); render(); syncToAppStore(); };
          reader.readAsText(file);
        });
        input.click();
        break;
      case 'download':
        var csv = exportCsv();
        var blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        var a = document.createElement('a');
        a.href = URL.createObjectURL(blob); a.download = (t ? t.name : 'table') + '.csv'; a.click();
        URL.revokeObjectURL(a.href);
        break;
    }
  }

  function showCreateModal() {
    var overlay = document.createElement('div');
    overlay.className = 'tm-overlay';
    overlay.innerHTML =
      '<div class="tm-modal"><div class="tm-modal-hdr"><h3>New Table</h3></div>' +
      '<div class="tm-modal-bd">' +
      '<label class="tm-fld">Name <input class="tm-inp" id="tm-new-name" placeholder="e.g. Project Plan"></label>' +
      '<div class="tm-fld-row"><label class="tm-fld">Rows <input class="tm-inp" id="tm-new-rows" type="number" min="1" max="500" value="10"></label>' +
      '<label class="tm-fld">Columns <input class="tm-inp" id="tm-new-cols" type="number" min="1" max="50" value="5"></label></div>' +
      '</div><div class="tm-modal-ft">' +
      '<button class="tm-btn tm-btn-sm" data-action="close-modal">Cancel</button>' +
      '<button class="tm-btn tm-btn-sm tm-btn-primary" id="tm-create-ok">Create</button></div></div>';
    document.body.appendChild(overlay);
    var nameIn = $('#tm-new-name', overlay);
    var rowsIn = $('#tm-new-rows', overlay);
    var colsIn = $('#tm-new-cols', overlay);
    nameIn.focus();
    function close() { overlay.remove(); }
    overlay.addEventListener('click', function (e) { if (e.target === overlay || e.target.closest('[data-action="close-modal"]')) close(); });
    $('#tm-create-ok', overlay).addEventListener('click', function () {
      addTable(nameIn.value.trim() || 'Untitled Table', parseInt(rowsIn.value) || 10, parseInt(colsIn.value) || 5);
      close(); render(); syncToAppStore();
    });
    nameIn.addEventListener('keydown', function (e) { if (e.key === 'Enter') $('#tm-create-ok', overlay).click(); });
  }

  function showConfirm(msg, onOk) {
    var overlay = document.createElement('div');
    overlay.className = 'tm-overlay';
    overlay.innerHTML =
      '<div class="tm-modal tm-modal-sm"><div class="tm-modal-hdr"><h3>' + esc(msg) + '</h3></div>' +
      '<div class="tm-modal-bd"><p style="color:var(--tb-text-muted);font-size:13px">This action cannot be undone.</p></div>' +
      '<div class="tm-modal-ft"><button class="tm-btn tm-btn-sm" data-action="close-modal">Cancel</button>' +
      '<button class="tm-btn tm-btn-sm tm-btn-danger" id="tm-cfm-ok">Delete</button></div></div>';
    document.body.appendChild(overlay);
    overlay.addEventListener('click', function (e) { if (e.target === overlay || e.target.closest('[data-action="close-modal"]')) overlay.remove(); });
    $('#tm-cfm-ok', overlay).addEventListener('click', function () { overlay.remove(); onOk(); });
  }

  function syncToAppStore() {
    if (typeof App === 'undefined' || !App.Store) return;
    var tables = S.tables.map(function (t) {
      return {
        id: t.id, name: t.name, rows: t.cells.length, cols: t.headers.length,
        headers: t.headers.map(function (h) { return h.name; }),
        cells: t.cells.map(function (row) { return row.map(function (c) { return c.value; }); }),
      };
    });
    App.Store.state.tables = tables;
    App.Store.save();
  }

  function syncFromAppStore() {
    if (typeof App === 'undefined' || !App.Store) return;
    var stored = App.Store.state.tables;
    if (!stored || !stored.length) return;
    S.tables = stored.map(function (t) {
      var tbl = defaultTable(t.name, t.cells.length, t.headers.length);
      tbl.id = t.id;
      tbl.headers = t.headers.map(function (h) { return { id: uid(), name: h, width: 140 }; });
      tbl.cells = t.cells.map(function (row) { return row.map(function (val) { return makeCell(val); }); });
      return tbl;
    });
    S.activeId = S.tables.length ? S.tables[0].id : null;
  }

  function init(selector, options) {
    options = options || {};
    var el = typeof selector === 'string' ? document.querySelector(selector) : selector;
    if (!el) { console.error('TableManager: container not found'); return; }

    el.innerHTML =
      '<div class="tm-root">' +
        '<div class="tm-body">' +
          '<aside class="tm-sidebar">' +
            '<div class="tm-sb-head"><span class="tm-sb-label">' + icon('table', 13) + ' Tables <span id="tm-count"></span></span>' +
            '<button class="tm-btn tm-btn-xs tm-btn-primary" data-action="new-table">' + icon('plus', 11) + ' New</button></div>' +
            '<div class="tm-sb-list" id="tm-list"></div>' +
          '</aside>' +
          '<div class="tm-main">' +
            '<div class="tm-toolbar" id="tm-toolbar"></div>' +
            '<div class="tm-grid-wrap" tabindex="0" id="tm-grid"></div>' +
            '<div class="tm-status" id="tm-status"></div>' +
            '<div class="tm-helpbar">Click to select \u2022 Double-click or F2 to edit \u2022 Drag to range-select \u2022 Right-click for menu \u2022 Drag blue corner to fill \u2022 Ctrl+Z/Y \u2022 Ctrl+C/V/X \u2022 Ctrl+B/I/U</div>' +
          '</div>' +
        '</div>' +
      '</div>';

    container = el.querySelector('.tm-root');

    if (options.darkMode) container.classList.add('dark');

    setupEvents();

    if (options.loadFromAppStore !== false) syncFromAppStore();

    if (options.tables && options.tables.length) {
      options.tables.forEach(function (cfg) {
        var t = addTable(cfg.name, cfg.rows, cfg.cols);
        if (cfg.headers) t.headers = cfg.headers.map(function (h, i) { return { id: uid(), name: h, width: cfg.colWidths ? cfg.colWidths[i] : 140 }; });
        if (cfg.data) t.cells = cfg.data.map(function (row) { return row.map(function (val) { return typeof val === 'object' ? deepClone(val) : makeCell(val); }); });
      });
    }

    if (S.tables.length === 0) {
      var demo = addTable('Project Plan', 8, 6);
      demo.headers = [
        { id: uid(), name: 'Task', width: 200 },
        { id: uid(), name: 'Assignee', width: 130 },
        { id: uid(), name: 'Status', width: 120 },
        { id: uid(), name: 'Priority', width: 110 },
        { id: uid(), name: 'Due Date', width: 120 },
        { id: uid(), name: 'Notes', width: 200 },
      ];
      var data = [
        ['Design homepage', 'Alice', 'In Progress', 'High', '2026-01-15', 'Wireframes approved'],
        ['Build API', 'Bob', 'Done', 'High', '2026-01-20', 'Deployed to staging'],
        ['Write tests', 'Charlie', 'In Progress', 'Medium', '2026-01-30', 'Coverage at 75%'],
        ['Deploy to prod', 'Alice', 'Not Started', 'Urgent', '2026-02-01', 'Requires approval'],
        ['User docs', 'Eve', 'Not Started', 'Low', '2026-02-15', ''],
        ['Performance audit', 'Bob', 'Not Started', 'Medium', '2026-02-25', 'Q2 milestone'],
        ['Security review', 'Diana', 'Done', 'High', '2026-01-28', 'All clear'],
        ['Post-launch monitoring', 'Alice', 'Not Started', 'Medium', '2026-03-01', 'Set up dashboards'],
      ];
      demo.cells = data.map(function (row) { return row.map(function (v) { return makeCell(v); }); });
      syncToAppStore();
    }

    render();

    return {
      render: render,
      addTable: function (name, rows, cols) { addTable(name, rows, cols); render(); syncToAppStore(); return S.activeId; },
      deleteTable: function (id) { deleteTable(id); render(); syncToAppStore(); },
      getTable: getTable,
      getState: function () { return deepClone(S); },
      syncToAppStore: syncToAppStore,
    };
  }

  root.TableManager = { init: init };

})(typeof window !== 'undefined' ? window : this);
