/*
  App.Csv — small dependency-free CSV reader/writer.
  Handles quoted fields, embedded commas, embedded quotes ("") and newlines within quotes.
*/
(function () {
  'use strict';
  window.App = window.App || {};

  function parse(text) {
    const rows = [];
    let row = [], field = '', inQuotes = false;
    text = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
    for (let i = 0; i < text.length; i++) {
      const c = text[i];
      if (inQuotes) {
        if (c === '"') {
          if (text[i + 1] === '"') { field += '"'; i++; }
          else inQuotes = false;
        } else field += c;
      } else if (c === '"') {
        inQuotes = true;
      } else if (c === ',') {
        row.push(field); field = '';
      } else if (c === '\n') {
        row.push(field); rows.push(row); row = []; field = '';
      } else {
        field += c;
      }
    }
    if (field.length || row.length) { row.push(field); rows.push(row); }
    if (!rows.length) return [];
    const headers = rows[0].map((h) => h.trim());
    return rows.slice(1).filter((r) => r.some((cell) => cell !== '')).map((r) => {
      const obj = {};
      headers.forEach((h, idx) => { obj[h] = r[idx] !== undefined ? String(r[idx]).trim() : ''; });
      return obj;
    });
  }

  function stringify(rows, columns) {
    const escape = (val) => {
      const s = val == null ? '' : String(val);
      return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
    };
    const lines = [columns.join(',')];
    rows.forEach((row) => lines.push(columns.map((c) => escape(row[c])).join(',')));
    return lines.join('\n');
  }

  App.Csv = { parse, stringify };
})();
