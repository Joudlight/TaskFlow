/*
  App.DateUtils — formatting helpers + a small natural-language date parser
  for Quick Add ("tomorrow 4pm", "next friday", "in 2 days", "every monday").
*/
(function () {
  'use strict';
  window.App = window.App || {};

  const WEEKDAYS = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  const WEEKDAY_ABBR = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
  const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

  function pad(n) { return String(n).padStart(2, '0'); }

  function toISODate(d) { return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`; }

  function fromISODate(iso) {
    if (!iso) return null;
    const [y, m, d] = iso.split('-').map(Number);
    return new Date(y, m - 1, d);
  }

  function startOfDay(d) { const c = new Date(d); c.setHours(0, 0, 0, 0); return c; }

  function addDays(d, n) { const c = new Date(d); c.setDate(c.getDate() + n); return c; }
  function addMonths(d, n) { const c = new Date(d); c.setMonth(c.getMonth() + n); return c; }

  function isSameDay(a, b) { return a && b && a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate(); }

  function isToday(iso) { return iso && isSameDay(fromISODate(iso), new Date()); }
  function isPast(iso) { return iso && startOfDay(fromISODate(iso)) < startOfDay(new Date()); }

  function friendlyDate(iso) {
    if (!iso) return '';
    const d = fromISODate(iso);
    const today = startOfDay(new Date());
    const diff = Math.round((startOfDay(d) - today) / 86400000);
    if (diff === 0) return 'Today';
    if (diff === 1) return 'Tomorrow';
    if (diff === -1) return 'Yesterday';
    if (diff > 1 && diff < 7) return WEEKDAYS[d.getDay()].replace(/^\w/, (c) => c.toUpperCase());
    const sameYear = d.getFullYear() === new Date().getFullYear();
    return `${MONTH_NAMES[d.getMonth()].slice(0, 3)} ${d.getDate()}${sameYear ? '' : ', ' + d.getFullYear()}`;
  }

  function friendlyTime(hhmm) {
    if (!hhmm) return '';
    let [h, m] = hhmm.split(':').map(Number);
    const suffix = h >= 12 ? 'PM' : 'AM';
    h = h % 12 || 12;
    return `${h}${m ? ':' + pad(m) : ''} ${suffix}`;
  }

  function nextWeekday(from, targetDow, forceNextWeek) {
    const d = new Date(from);
    let delta = (targetDow - d.getDay() + 7) % 7;
    if (delta === 0 && forceNextWeek) delta = 7;
    if (delta === 0 && !forceNextWeek) delta = 0;
    return addDays(d, delta);
  }

  /**
   * Parses natural-language date/time/recurrence phrases out of quick-add text.
   * Returns { cleanTitle, dueDate (ISO|null), dueTime ('HH:MM'|null), recurrence (obj|null) }
   */
  function parseNaturalLanguage(rawText) {
    if (typeof rawText !== 'string' || !rawText.trim()) return { cleanTitle: rawText || '', dueDate: null, dueTime: null, recurrence: null };
    let text = ' ' + rawText.trim() + ' ';
    const today = startOfDay(new Date());
    let dueDate = null;
    let dueTime = null;
    let recurrence = null;

    const consume = (re, fn) => {
      const m = text.match(re);
      if (m) { fn(m); text = text.replace(m[0], ' '); }
      return !!m;
    };

    // --- Recurrence phrases (checked first so "every monday" also seeds a date) ---
    consume(/\bevery\s+day\b/i, () => { recurrence = { type: 'daily' }; });
    consume(/\bdaily\b/i, () => { recurrence = { type: 'daily' }; });
    consume(/\bevery\s+week\b/i, () => { recurrence = { type: 'weekly', day: today.getDay() }; });
    consume(/\bweekly\b/i, () => { recurrence = { type: 'weekly', day: today.getDay() }; });
    consume(/\bevery\s+month\b/i, () => { recurrence = { type: 'monthly', date: today.getDate() }; });
    consume(/\bmonthly\b/i, () => { recurrence = { type: 'monthly', date: today.getDate() }; });
    consume(new RegExp('\\bevery\\s+(' + WEEKDAYS.join('|') + '|' + WEEKDAY_ABBR.join('|') + ')\\b', 'i'), (m) => {
      const dow = weekdayIndex(m[1]);
      recurrence = { type: 'weekly', day: dow };
      dueDate = toISODate(nextWeekday(today, dow, false));
    });

    // --- Relative day words ---
    consume(/\btoday\b/i, () => { dueDate = toISODate(today); });
    consume(/\btomorrow\b/i, () => { dueDate = toISODate(addDays(today, 1)); });
    consume(/\byesterday\b/i, () => { dueDate = toISODate(addDays(today, -1)); });

    // --- "in N day(s)/week(s)/month(s)" ---
    consume(/\bin\s+(\d+)\s*day(s)?\b/i, (m) => { dueDate = toISODate(addDays(today, parseInt(m[1], 10))); });
    consume(/\bin\s+(\d+)\s*week(s)?\b/i, (m) => { dueDate = toISODate(addDays(today, parseInt(m[1], 10) * 7)); });
    consume(/\bin\s+(\d+)\s*month(s)?\b/i, (m) => { dueDate = toISODate(addMonths(today, parseInt(m[1], 10))); });

    // --- "next <weekday>" / "this <weekday>" / bare "<weekday>" ---
    consume(new RegExp('\\bnext\\s+(' + WEEKDAYS.join('|') + '|' + WEEKDAY_ABBR.join('|') + ')\\b', 'i'), (m) => {
      dueDate = toISODate(nextWeekday(today, weekdayIndex(m[1]), true));
    });
    if (!dueDate) {
      consume(new RegExp('\\bthis\\s+(' + WEEKDAYS.join('|') + '|' + WEEKDAY_ABBR.join('|') + ')\\b', 'i'), (m) => {
        dueDate = toISODate(nextWeekday(today, weekdayIndex(m[1]), false));
      });
    }
    if (!dueDate) {
      consume(new RegExp('(?:^|\\s)(' + WEEKDAYS.join('|') + '|' + WEEKDAY_ABBR.join('|') + ')\\b', 'i'), (m) => {
        dueDate = toISODate(nextWeekday(today, weekdayIndex(m[1]), false));
      });
    }

    // --- Explicit dates: MM/DD or MM-DD(-YYYY) ---
    consume(/\b(\d{1,2})[\/\-](\d{1,2})(?:[\/\-](\d{2,4}))?\b/, (m) => {
      const year = m[3] ? (m[3].length === 2 ? 2000 + parseInt(m[3], 10) : parseInt(m[3], 10)) : today.getFullYear();
      const d = new Date(year, parseInt(m[1], 10) - 1, parseInt(m[2], 10));
      if (!isNaN(d.getTime())) dueDate = toISODate(d);
    });

    // --- Time: "4pm", "4:30 pm", "16:00" ---
    consume(/\b(\d{1,2}):(\d{2})\s*(am|pm)?\b/i, (m) => {
      let h = parseInt(m[1], 10);
      const min = parseInt(m[2], 10);
      if (m[3]) { h = h % 12; if (/pm/i.test(m[3])) h += 12; }
      dueTime = `${pad(h)}:${pad(min)}`;
    });
    if (!dueTime) {
      consume(/\b(\d{1,2})\s*(am|pm)\b/i, (m) => {
        let h = parseInt(m[1], 10) % 12;
        if (/pm/i.test(m[2])) h += 12;
        dueTime = `${pad(h)}:00`;
      });
    }

    if (dueTime && !dueDate) dueDate = toISODate(today);
    if (recurrence && !dueDate) dueDate = toISODate(today);

    const cleanTitle = text.replace(/\s+/g, ' ').trim().replace(/^[,\-–]\s*|\s*[,\-–]$/g, '');
    return { cleanTitle: cleanTitle || rawText.trim(), dueDate, dueTime, recurrence };
  }

  function weekdayIndex(word) {
    word = word.toLowerCase();
    let idx = WEEKDAYS.indexOf(word);
    if (idx === -1) idx = WEEKDAY_ABBR.indexOf(word.slice(0, 3));
    return idx === -1 ? 0 : idx;
  }

  function nextOccurrence(recurrence, fromISO) {
    const from = fromISODate(fromISO) || new Date();
    if (recurrence.type === 'daily') return toISODate(addDays(from, 1));
    if (recurrence.type === 'weekly') return toISODate(addDays(from, 7));
    if (recurrence.type === 'monthly') return toISODate(addMonths(from, 1));
    if (recurrence.type === 'custom' && recurrence.days && recurrence.days.length) {
      for (let i = 1; i <= 14; i++) {
        const d = addDays(from, i);
        if (recurrence.days.includes(d.getDay())) return toISODate(d);
      }
    }
    return null;
  }

  App.DateUtils = {
    WEEKDAYS, MONTH_NAMES, pad, toISODate, fromISODate, startOfDay, addDays, addMonths,
    isSameDay, isToday, isPast, friendlyDate, friendlyTime, nextWeekday, weekdayIndex,
    parseNaturalLanguage, nextOccurrence,
  };
})();
