(function () {
  'use strict';
  window.App = window.App || {};
  const { $, $all, uuid, debounce, escapeHtml: esc } = App.Helpers;

  /* ─── State ─────────────────────────────────────────────────────────────── */
  let selectedNoteId = null;
  let savedRange = null;
  let toolbarBuilt = false;
  let isEditing = false;
  let strokeThickness = 1;
  let shadowOpacity = 0.5;
  let shadowColor = '#000000';
  let shadowOffsetX = 1;
  let shadowOffsetY = 1;
  let shadowBlur = 2;

  /* ─── Constants ─────────────────────────────────────────────────────────── */
  const TEXT_COLORS = [
    '#e5484d', '#e08a1e', '#f5d90a', '#30a46c',
    '#3b82f6', '#8b5cf6', '#000000', '#6b7280',
  ];
  const HIGHLIGHT_COLORS = [
    '#fef08a', '#bbf7d0', '#a5f3fc', '#fecaca',
    '#fed7aa', '#e9d5ff', '#d4d4d8', '#ffffff00',
  ];
  const EMOJI_CATEGORIES = [
    {
      name: 'Smileys', icon: '\u{1F600}',
      items: ['\u{1F600}','\u{1F603}','\u{1F604}','\u{1F601}','\u{1F606}','\u{1F605}','\u{1F602}','\u{1F923}','\u{1F60A}','\u{1F607}','\u{1F643}','\u{1F642}','\u{1F609}','\u{1F60D}','\u{1F618}','\u{1F61A}','\u{1F617}','\u{1F61D}','\u{1F61B}','\u{1F44D}','\u{1F44E}','\u{1F44F}','\u{1F64C}','\u{1F64F}','\u{1F4AA}','\u{1F60E}','\u{1F913}','\u{1F60F}','\u{1F61C}','\u{1F61E}','\u{1F620}','\u{1F621}','\u{1F624}','\u{1F62D}','\u{1F62E}','\u{1F631}','\u{1F635}','\u{1F634}','\u{1F637}','\u{1F914}','\u{1F92A}','\u{1F92B}','\u{1F60B}','\u{1F612}','\u{1F614}','\u{1F622}','\u{1F62A}','\u{1F629}','\u{1F628}','\u{1F630}','\u{1F640}','\u{1F644}','\u{1F648}','\u{1F649}','\u{1F64A}','\u{1F480}','\u{2620}\u{FE0F}','\u{1F4A9}','\u{1F921}','\u{1F479}','\u{1F47A}','\u{1F47B}','\u{1F47D}','\u{1F47E}','\u{1F916}','\u{1F4A5}','\u{1F525}']
    },
    {
      name: 'Gestures', icon: '\u{1F44B}',
      items: ['\u{1F44B}','\u{1F91A}','\u{1F590}','\u{270B}','\u{1F596}','\u{1F44C}','\u{1F90F}','\u{270C}\u{FE0F}','\u{1F91E}','\u{1F91F}','\u{1F918}','\u{1F919}','\u{1F448}','\u{1F449}','\u{1F446}','\u{1F595}','\u{1F447}','\u{261D}\u{FE0F}','\u{1F44D}','\u{1F44E}','\u{270A}','\u{1F44A}','\u{1F91B}','\u{1F91C}','\u{1F44F}','\u{1F64C}','\u{1F450}','\u{1F932}','\u{1F91D}','\u{1F64F}','\u{270D}\u{FE0F}','\u{1F485}','\u{1F933}','\u{1F4AA}','\u{1F9BE}','\u{1F9BF}','\u{1F9B5}','\u{1F9B6}','\u{1F442}','\u{1F9BB}','\u{1F443}','\u{1F9E0}','\u{1FAC0}','\u{1F445}','\u{1F444}']
    },
    {
      name: 'Hearts', icon: '\u{2764}\u{FE0F}',
      items: ['\u{2764}\u{FE0F}','\u{1F9E1}','\u{1F49B}','\u{1F49A}','\u{1F499}','\u{1F49C}','\u{1F5A4}','\u{1F90D}','\u{1F90E}','\u{1F494}','\u{2763}\u{FE0F}','\u{1F495}','\u{1F49E}','\u{1F493}','\u{1F497}','\u{1F496}','\u{1F498}','\u{1F49D}','\u{1F49F}','\u{2665}\u{FE0F}','\u{1FAC1}']
    },
    {
      name: 'Nature', icon: '\u{1F431}',
      items: ['\u{1F436}','\u{1F431}','\u{1F42D}','\u{1F439}','\u{1F430}','\u{1F98A}','\u{1F43B}','\u{1F43C}','\u{1F428}','\u{1F42F}','\u{1F981}','\u{1F42E}','\u{1F437}','\u{1F43D}','\u{1F438}','\u{1F435}','\u{1F414}','\u{1F427}','\u{1F426}','\u{1F424}','\u{1F425}','\u{1F986}','\u{1F985}','\u{1F989}','\u{1F987}','\u{1F43A}','\u{1F417}','\u{1F434}','\u{1F984}','\u{1F41D}','\u{1F41B}','\u{1F98B}','\u{1F40C}','\u{1F41E}','\u{1F41C}','\u{1F577}\u{FE0F}','\u{1F422}','\u{1F40D}','\u{1F98E}','\u{1F996}','\u{1F995}','\u{1F419}','\u{1F991}','\u{1F990}','\u{1F980}','\u{1F420}','\u{1F41F}','\u{1F421}','\u{1F433}','\u{1F42B}','\u{1F42C}','\u{1F988}','\u{1F332}','\u{1F333}','\u{1F334}','\u{1F335}','\u{1F33E}','\u{1F33F}','\u{1F340}','\u{1F341}','\u{1F342}','\u{1F343}','\u{1F30E}','\u{1F30D}','\u{1F30F}','\u{1F311}','\u{1F319}','\u{2600}\u{FE0F}','\u{2B50}','\u{1F31F}','\u{1F308}','\u{2601}\u{FE0F}','\u{26A1}','\u{1F30A}','\u{1F327}\u{FE0F}','\u{2744}\u{FE0F}','\u{1F525}','\u{1F4A6}']
    },
    {
      name: 'Food', icon: '\u{1F354}',
      items: ['\u{1F34E}','\u{1F34F}','\u{1F350}','\u{1F34A}','\u{1F34B}','\u{1F34C}','\u{1F349}','\u{1F347}','\u{1F353}','\u{1F348}','\u{1F352}','\u{1F351}','\u{1F96D}','\u{1F34D}','\u{1F965}','\u{1F95D}','\u{1F345}','\u{1F346}','\u{1F951}','\u{1F966}','\u{1F96C}','\u{1F952}','\u{1F336}\u{FE0F}','\u{1F33D}','\u{1F955}','\u{1F954}','\u{1F360}','\u{1F950}','\u{1F35E}','\u{1F956}','\u{1F968}','\u{1F96F}','\u{1F9C0}','\u{1F9C8}','\u{1F373}','\u{1F95E}','\u{1F95F}','\u{1F953}','\u{1F969}','\u{1F357}','\u{1F356}','\u{1F32D}','\u{1F354}','\u{1F35F}','\u{1F355}','\u{1F96A}','\u{1F959}','\u{1F32E}','\u{1F32F}','\u{1F957}','\u{1F958}','\u{1F35D}','\u{1F35C}','\u{1F372}','\u{1F35B}','\u{1F363}','\u{1F371}','\u{1F364}','\u{1F359}','\u{1F35A}','\u{1F358}','\u{1F365}','\u{1F960}','\u{1F362}','\u{1F361}','\u{1F367}','\u{1F368}','\u{1F366}','\u{1F967}','\u{1F9C1}','\u{1F370}','\u{1F382}','\u{1F36E}','\u{1F36D}','\u{1F36C}','\u{1F36B}','\u{1F37F}','\u{1F9C2}','\u{1F375}','\u{1F376}','\u{1F37E}','\u{1F377}','\u{1F378}','\u{1F379}','\u{1F37A}','\u{1F37B}']
    },
    {
      name: 'Objects', icon: '\u{1F4F1}',
      items: ['\u{1F4F1}','\u{1F4F2}','\u{1F4BB}','\u{2328}\u{FE0F}','\u{1F5A5}\u{FE0F}','\u{1F5A8}\u{FE0F}','\u{1F5B1}\u{FE0F}','\u{1F579}\u{FE0F}','\u{1F4BE}','\u{1F4BF}','\u{1F4C0}','\u{1F4F7}','\u{1F4F8}','\u{1F4F9}','\u{1F3A5}','\u{1F4FD}\u{FE0F}','\u{1F39E}\u{FE0F}','\u{260E}\u{FE0F}','\u{1F4DE}','\u{1F4DF}','\u{1F4E0}','\u{1F4FA}','\u{1F4FB}','\u{1F399}\u{FE0F}','\u{1F39A}\u{FE0F}','\u{1F39B}\u{FE0F}','\u{1F9ED}','\u{23F0}','\u{231A}','\u{1F4E1}','\u{1F50B}','\u{1F50C}','\u{1F4A1}','\u{1F4A2}','\u{1F526}','\u{1F5D1}\u{FE0F}','\u{1F9F9}','\u{1F9FA}','\u{1F9FB}','\u{1F511}','\u{1F5DD}\u{FE0F}','\u{1F528}','\u{1F6E0}\u{FE0F}','\u{26CF}\u{FE0F}','\u{1F529}','\u{1F527}','\u{2692}\u{FE0F}','\u{1F5E1}\u{FE0F}','\u{2694}\u{FE0F}','\u{1F52B}','\u{1F3F9}','\u{1F6E1}\u{FE0F}','\u{1F9F0}','\u{1F9F2}','\u{1F4A3}','\u{1F9E8}','\u{1F3AF}','\u{1F3B0}','\u{1F3B2}','\u{1F3AD}','\u{1F3A8}','\u{1F3AA}','\u{1F3A4}','\u{1F3A7}','\u{1F3B5}','\u{1F3B6}','\u{1F3B9}','\u{1F3BB}','\u{1F3BA}','\u{1F3BC}','\u{1F3AC}','\u{1F4DA}','\u{1F4D6}','\u{1F4DD}','\u{1F4C4}','\u{1F4C3}','\u{1F58B}\u{FE0F}','\u{1F58A}\u{FE0F}','\u{1F58C}\u{FE0F}','\u{270F}\u{FE0F}','\u{1F4CD}','\u{1F4C1}','\u{1F4C2}','\u{1F5C2}\u{FE0F}','\u{1F4C5}','\u{1F4C6}','\u{1F4CC}','\u{1F4CD}','\u{1F517}','\u{1F9F7}','\u{1F4D0}']
    },
    {
      name: 'Symbols', icon: '\u{1F4F3}',
      items: ['\u{2705}','\u{274C}','\u{2753}','\u{2757}','\u{203C}\u{FE0F}','\u{2049}\u{FE0F}','\u{2795}','\u{2796}','\u{2797}','\u{2716}\u{FE0F}','\u{267E}\u{FE0F}','\u{1F4B5}','\u{1F4B1}','\u{2122}\u{FE0F}','\u{00A9}\u{FE0F}','\u{00AE}\u{FE0F}','\u{1F534}','\u{1F7E0}','\u{1F7E1}','\u{1F7E2}','\u{1F535}','\u{1F7E3}','\u{26AB}','\u{26AA}','\u{1F7E4}','\u{1F53A}','\u{1F53B}','\u{1F538}','\u{1F539}','\u{1F536}','\u{1F537}','\u{1F533}','\u{1F532}','\u{25AA}\u{FE0F}','\u{25AB}\u{FE0F}','\u{1F514}','\u{1F515}','\u{1F50A}','\u{1F4E2}','\u{1F4E3}','\u{1F4A4}','\u{1F4A2}','\u{1F4AC}','\u{1F5E8}\u{FE0F}','\u{2660}\u{FE0F}','\u{2663}\u{FE0F}','\u{1F0CF}','\u{1F004}','\u{1F3B4}','\u{1F51E}','\u{1F6AB}','\u{26D4}','\u{1F6D1}','\u{1F6A7}']
    }
  ];
  let emojiCategoryIndex = 0;

  /* ─── Selection Management ──────────────────────────────────────────────── */

  /**
   * Save the current selection inside #noteContent so we can restore it after
   * a toolbar interaction steals focus.  Uses cloneRange() so the saved copy
   * stays valid even if the DOM mutates slightly.
   */
  function saveSelection() {
    const sel = window.getSelection();
    const content = $('#noteContent');
    if (sel && sel.rangeCount && content && content.contains(sel.anchorNode)) {
      savedRange = sel.getRangeAt(0).cloneRange();
    }
  }

  /**
   * Restore a previously saved selection.  Returns true if a range was
   * successfully restored, false otherwise.  Does NOT clear savedRange so it
   * can be reused (e.g. during continuous color-picker input events).
   */
  function restoreSelection() {
    if (!savedRange) return false;
    try {
      const sel = window.getSelection();
      sel.removeAllRanges();
      sel.addRange(savedRange);
      return true;
    } catch (_) {
      savedRange = null;
      return false;
    }
  }

  /** Explicitly discard the saved range when it is no longer needed. */
  function clearSavedSelection() {
    savedRange = null;
  }

  function findStyleSpan(prop) {
    var sel = window.getSelection();
    if (!sel.rangeCount) return null;
    var range = sel.getRangeAt(0);
    var container = range.commonAncestorContainer;
    var content = $('#noteContent');
    if (!content) return null;
    var el;
    if (container.nodeType === 3) {
      el = container.parentElement;
    } else {
      el = container;
      if (sel.isCollapsed) {
        var prev = container.childNodes[range.startOffset - 1];
        if (prev && prev.nodeType === 1 && prev.tagName === 'SPAN' && prev.style[prop]) return prev;
      }
    }
    var parent = el;
    while (parent && parent !== content) {
      if (parent.tagName === 'SPAN' && parent.style[prop]) return parent;
      parent = parent.parentElement;
    }
    return null;
  }

  function removeStyleSpan(prop) {
    var span = findStyleSpan(prop);
    if (!span) return false;
    var p = span.parentNode;
    while (span.firstChild) p.insertBefore(span.firstChild, span);
    p.removeChild(span);
    return true;
  }

  function applyOrUpdateStyle(prop, value) {
    var sel = window.getSelection();
    if (!sel.rangeCount) return;
    var existing = findStyleSpan(prop);
    if (existing) {
      existing.style[prop] = value;
      return;
    }
    if (sel.isCollapsed) return;
    var range = sel.getRangeAt(0);
    var html = range.extractContents();
    var span = document.createElement('span');
    span.style[prop] = value;
    span.appendChild(html);
    range.insertNode(span);
    sel.removeAllRanges();
    var r = document.createRange();
    r.setStartAfter(span);
    sel.addRange(r);
  }

  function updateStrokeLabel() {
    var lbl = $('#strokeThicknessLabel');
    if (lbl) lbl.textContent = strokeThickness + 'px';
  }

  function buildShadowCSS(color, opacity, ox, oy, blur) {
    var r = parseInt(color.slice(1,3), 16);
    var g = parseInt(color.slice(3,5), 16);
    var b = parseInt(color.slice(5,7), 16);
    if (opacity <= 1) {
      return ox + 'px ' + oy + 'px ' + blur + 'px rgba(' + r + ',' + g + ',' + b + ',' + opacity + ')';
    }
    var extra = opacity - 1;
    return ox + 'px ' + oy + 'px ' + blur + 'px rgba(' + r + ',' + g + ',' + b + ',1), ' +
           (ox * 2) + 'px ' + (oy * 2) + 'px ' + (blur + 1) + 'px rgba(' + r + ',' + g + ',' + b + ',' + extra + ')';
  }

  function updateShadowOnSelection() {
    var content = $('#noteContent');
    if (!content) return;
    var si = $('#notesShadowColorInput');
    var opacity = parseFloat($('#notesShadowOpacity').value || '0.5');
    var ox = parseInt($('#notesShadowOffsetX').value || '1');
    var oy = parseInt($('#notesShadowOffsetY').value || '1');
    var blur = parseInt($('#notesShadowBlur').value || '2');
    var color = si ? si.value : '#000000';
    shadowColor = color;
    shadowOpacity = opacity;
    shadowOffsetX = ox;
    shadowOffsetY = oy;
    shadowBlur = blur;
    var label = $('#notesShadowOpacityLabel');
    if (label) label.textContent = Math.round(opacity * 100) + '%';
    var textShadow = buildShadowCSS(color, opacity, ox, oy, blur);
    var spans = content.querySelectorAll('span[style*="text-shadow"]');
    if (spans.length === 0) {
      var span = findStyleSpan('text-shadow');
      if (span) span.style['text-shadow'] = textShadow;
    } else {
      for (var i = 0; i < spans.length; i++) {
        spans[i].style['text-shadow'] = textShadow;
      }
    }
    saveNoteDebounced();
  }

  /** Toggle between preview and editing mode. In preview mode the toolbar
   *  is hidden and the content area is read-only. In editing mode the toolbar
   *  is shown and the content is editable. */
  function setEditMode(editing) {
    isEditing = editing;
    var editor = $('#notesEditor');
    if (!editor) return;
    var toolbar = editor.querySelector('.notes-toolbar');
    var content = $('#noteContent');
    if (toolbar) toolbar.style.display = editing ? '' : 'none';
    if (content) {
      if (editing) {
        content.contentEditable = 'true';
        content.focus();
      } else {
        content.contentEditable = 'false';
      }
    }
  }

  /* ─── Render: Notes List ────────────────────────────────────────────────── */

  function renderList() {
    const list = $('#notesList');
    if (!list) return;

    const notes = App.Store.state.notes;
    const scrollTop = list.scrollTop; // preserve scroll position across re-renders

    list.innerHTML = notes
      .map((n) => {
        const dateStr = new Date(n.updatedAt).toLocaleDateString(undefined, {
          month: 'short',
          day: 'numeric',
        });
        // Strip HTML tags for card preview (plain text only)
        var plain = n.content ? n.content.replace(/<[^>]*>/g, '').trim() : '';
        if (plain.length > 140) plain = plain.slice(0, 140) + '\u2026';
        return `
          <div class="notes-list-item${n.id === selectedNoteId ? ' is-active' : ''}"
               data-id="${n.id}" tabindex="0" role="button">
            <div class="notes-list-item__header">
              <span class="notes-list-item__title">${esc(n.title) || 'Untitled'}</span>
              <span class="notes-list-item__date">${dateStr}</span>
            </div>
            <div class="notes-list-item__preview">${plain ? esc(plain) : '<span class="notes-list-item__preview-empty">No content</span>'}</div>
            <div class="notes-list-item__footer">
              ${n.linkedTaskIds && n.linkedTaskIds.length ? '<span class="notes-list-item__linked-badge" title="Linked to tasks">' + n.linkedTaskIds.length + '</span>' : ''}
              <span class="notes-list-item__actions">
                <button class="notes-list-item__preview" data-id="${n.id}" title="Preview note">
                  <svg viewBox="0 0 24 24" fill="none" width="14" height="14">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"
                          stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
                    <circle cx="12" cy="12" r="3" stroke="currentColor" stroke-width="1.8"/>
                  </svg>
                </button>
                <button class="notes-list-item__edit" data-id="${n.id}" title="Edit note">
                  <svg viewBox="0 0 24 24" fill="none" width="14" height="14">
                    <path d="M15.5 5.5l3 3L9 18H6v-3l9.5-9.5z"
                          stroke="currentColor" stroke-width="1.8"
                          stroke-linecap="round" stroke-linejoin="round"/>
                  </svg>
                </button>
                <button class="notes-list-item__delete" data-id="${n.id}" title="Delete note">
                  <svg viewBox="0 0 24 24" fill="none" width="14" height="14">
                    <path d="M6 6l12 12M18 6L6 18"
                          stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/>
                  </svg>
                </button>
              </span>
            </div>
          </div>`;
      })
      .join('');

    list.scrollTop = scrollTop;
  }

  /* ─── Render: Toolbar (static HTML — built once) ────────────────────────── */

  function buildToolbarHTML() {
    const buildSwatches = (colors, type) =>
      colors
        .map((c) => {
          const isTransparent = c === '#ffffff00';
          const bg = isTransparent ? 'transparent' : c;
          const extra = isTransparent ? 'border-color:var(--color-border-strong);' : '';
          return `<div class="notes-toolbar-swatch" data-type="${type}" data-color="${c}"
                       title="${c}" style="background:${bg};${extra}"></div>`;
        })
        .join('');

    const emojiTabs = EMOJI_CATEGORIES.map(function(c, i) {
      return '<button class="emoji-tab' + (i === 0 ? ' is-active' : '') + '" data-cat="' + i + '" title="' + c.name + '">' + c.icon + '</button>';
    }).join('');
    const emojiGrid = EMOJI_CATEGORIES.map(function(c, ci) {
      return '<div class="emoji-category-label" data-cat="' + ci + '"' + (ci === 0 ? '' : ' hidden') + '>' + c.name + '</div>' +
        c.items.map(function(e) {
          return '<button data-cat="' + ci + '" data-emoji="' + e + '"' + (ci === 0 ? '' : ' hidden') + '>' + e + '</button>';
        }).join('');
    }).join('');

    // All color swatches are rendered, including the transparent highlight
    // option (to remove highlighting) and the grey text color option.
    const highlightSwatches = buildSwatches(HIGHLIGHT_COLORS, 'highlight');
    const textColorSwatches = buildSwatches(TEXT_COLORS, 'text');

    return `
    <div class="notes-toolbar" role="toolbar" aria-label="Formatting" style="display:none">
      <div class="notes-toolbar__row">
        <button class="notes-toolbar-btn" data-cmd="bold" title="Bold (Ctrl+B)">
          <svg viewBox="0 0 24 24" fill="none">
            <path d="M6 4h8a4 4 0 014 4 4 4 0 01-4 4H6V4zM6 12h9a4 4 0 014 4 4 4 0 01-4 4H6v-8z"
                  stroke="currentColor" stroke-width="1.8"
                  stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </button>
        <button class="notes-toolbar-btn" data-cmd="italic" title="Italic (Ctrl+I)">
          <svg viewBox="0 0 24 24" fill="none">
            <path d="M10 4h8M6 20h8M14 4L9 20"
                  stroke="currentColor" stroke-width="1.8"
                  stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </button>
        <button class="notes-toolbar-btn" data-cmd="underline" title="Underline (Ctrl+U)">
          <svg viewBox="0 0 24 24" fill="none">
            <path d="M6 4v7a6 6 0 0012 0V4M4 20h16"
                  stroke="currentColor" stroke-width="1.8"
                  stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </button>
        <button class="notes-toolbar-btn" data-cmd="strikeThrough" title="Strikethrough">
          <svg viewBox="0 0 24 24" fill="none">
            <path d="M6 12h12M8 6l.5 4M16 18l-.5-4"
                  stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
            <path d="M10 6l1 6M14 18l-1-6"
                  stroke="currentColor" stroke-width="1.8" stroke-linecap="round" opacity="0.4"/>
          </svg>
        </button>
        <div class="notes-toolbar__divider"></div>
        <button class="notes-toolbar-btn" data-cmd="insertOrderedList" title="Numbered list">
          <svg viewBox="0 0 24 24" fill="none">
            <path d="M11 7h9M11 12h9M11 17h9M5 6l1-1v4M4 11.5L6 10v4M5 18h1M4 18.5l2-2"
                  stroke="currentColor" stroke-width="1.8"
                  stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </button>
        <button class="notes-toolbar-btn" data-cmd="insertUnorderedList" title="Bullet list">
          <svg viewBox="0 0 24 24" fill="none">
            <path d="M9 7h11M9 12h11M9 17h11M4.5 6.5h.01M4.5 11.5h.01M4.5 16.5h.01"
                  stroke="currentColor" stroke-width="1.8"
                  stroke-linecap="round" stroke-linejoin="round"/>
            <circle cx="4.5" cy="6.5" r="1.5" fill="currentColor"/>
            <circle cx="4.5" cy="11.5" r="1.5" fill="currentColor"/>
            <circle cx="4.5" cy="16.5" r="1.5" fill="currentColor"/>
          </svg>
        </button>
        <div class="notes-toolbar__divider"></div>
        <button class="notes-toolbar-btn" data-cmd="justifyLeft" title="Align left">
          <svg viewBox="0 0 24 24" fill="none">
            <path d="M4 6h16M4 12h12M4 18h14"
                  stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
          </svg>
        </button>
        <button class="notes-toolbar-btn" data-cmd="justifyCenter" title="Center">
          <svg viewBox="0 0 24 24" fill="none">
            <path d="M4 6h16M6 12h12M5 18h14"
                  stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
          </svg>
        </button>
        <button class="notes-toolbar-btn" data-cmd="justifyRight" title="Align right">
          <svg viewBox="0 0 24 24" fill="none">
            <path d="M4 6h16M8 12h12M6 18h14"
                  stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
          </svg>
        </button>
        <div class="notes-toolbar__divider"></div>
        <select class="notes-toolbar-select" id="notesFontSelect" title="Font">
          <option value="sans-serif">Default</option>
          <option value="serif" style="font-family:serif">Serif</option>
          <option value="monospace" style="font-family:monospace">Mono</option>
          <option value="Georgia, serif" style="font-family:Georgia, serif">Georgia</option>
          <option value="'Courier New', monospace" style="font-family:'Courier New', monospace">Courier</option>
          <option value="Arial, sans-serif" style="font-family:Arial, sans-serif">Arial</option>
          <option value="'Times New Roman', serif" style="font-family:'Times New Roman', serif">Times New Roman</option>
          <option value="Verdana, sans-serif" style="font-family:Verdana, sans-serif">Verdana</option>
          <option value="'Trebuchet MS', sans-serif" style="font-family:'Trebuchet MS', sans-serif">Trebuchet MS</option>
          <option value="'Comic Sans MS', cursive" style="font-family:'Comic Sans MS', cursive">Comic Sans</option>
          <option value="Impact, sans-serif" style="font-family:Impact, sans-serif">Impact</option>
          <option value="Palatino, serif" style="font-family:Palatino, serif">Palatino</option>
          <option value="Tahoma, sans-serif" style="font-family:Tahoma, sans-serif">Tahoma</option>
          <option value="'Lucida Console', monospace" style="font-family:'Lucida Console', monospace">Lucida Console</option>
        </select>
        <select class="notes-toolbar-select" id="notesSizeSelect" title="Size">
          <option value="12px">12px</option>
          <option value="14px">14px</option>
          <option value="16px" selected>16px</option>
          <option value="20px">20px</option>
          <option value="24px">24px</option>
          <option value="32px">32px</option>
          <option value="48px">48px</option>
        </select>
      </div>
      <div class="notes-toolbar__row">
        <div class="notes-toolbar-color-wrap">
          <button class="notes-toolbar-btn" title="Highlight color">
            <svg viewBox="0 0 24 24" fill="none">
              <path d="M6 14l4-4 8 8-4 4-8-8zM12 8l4-4 4 4-4 4-4-4z"
                    stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/>
            </svg>
          </button>
          <input type="color" id="notesHighlightInput" value="#fef08a">
        </div>
        <div class="notes-toolbar-swatches">${highlightSwatches}</div>
        <div class="notes-toolbar__divider"></div>
        <div class="notes-toolbar-color-wrap">
          <button class="notes-toolbar-btn" title="Text color">
            <span class="color-preview" id="notesColorPreview" style="background:#000000"></span>
          </button>
          <input type="color" id="notesColorInput" value="#000000">
        </div>
        <div class="notes-toolbar-swatches">${textColorSwatches}</div>
        <div class="notes-toolbar__divider"></div>
        <div class="notes-toolbar-emoji-wrap">
          <button class="notes-toolbar-btn" id="notesEmojiBtn" title="Insert emoji">
            <svg viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="1.8"/>
              <path d="M8.5 10h.01M15.5 10h.01M8 14s2 3 4 3 4-3 4-3"
                    stroke="currentColor" stroke-width="1.8"
                    stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </button>
          <div class="notes-toolbar-emoji-picker" id="notesEmojiPicker" hidden>
            <div class="emoji-tabs">${emojiTabs}</div>
            <div class="emoji-grid">${emojiGrid}</div>
          </div>
        </div>
        <div class="notes-toolbar__divider"></div>
        <button class="notes-toolbar-btn" data-cmd="toggleStroke" title="Text outline">
          <svg viewBox="0 0 24 24" fill="none">
            <path d="M6 20l6-16 6 16M9 15h6" stroke="currentColor" stroke-width="2.8" stroke-linejoin="round" opacity="0.25"/>
            <path d="M6 20l6-16 6 16M9 15h6" stroke="currentColor" stroke-width="1.2" stroke-linejoin="round"/>
          </svg>
        </button>
        <div class="notes-toolbar-color-wrap" title="Outline color">
          <button class="notes-toolbar-btn" tabindex="-1">
            <span class="color-preview" id="notesStrokeColorPreview" style="background:#000000"></span>
          </button>
          <input type="color" id="notesStrokeColorInput" value="#000000">
        </div>
        <button class="notes-toolbar-btn" data-cmd="strokeThinner" title="Thinner outline">
          <svg viewBox="0 0 24 24" fill="none">
            <path d="M5 12h14" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/>
          </svg>
        </button>
        <span class="stroke-thickness-label" id="strokeThicknessLabel">1px</span>
        <button class="notes-toolbar-btn" data-cmd="strokeThicker" title="Thicker outline">
          <svg viewBox="0 0 24 24" fill="none">
            <path d="M12 5v14M5 12h14" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/>
          </svg>
        </button>
        <div class="notes-toolbar__divider"></div>
        <button class="notes-toolbar-btn" data-cmd="toggleShadow" title="Text shadow">
          <svg viewBox="0 0 24 24" fill="none">
            <g opacity="0.2">
              <path d="M9 20l6-16 6 16M12 15h6" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round" transform="translate(1.5,1.5)"/>
            </g>
            <path d="M7 20l6-16 6 16M10 15h6" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/>
          </svg>
        </button>
        <div class="notes-toolbar-color-wrap" title="Shadow color">
          <button class="notes-toolbar-btn" tabindex="-1">
            <span class="color-preview" id="notesShadowColorPreview" style="background:#000000"></span>
          </button>
          <input type="color" id="notesShadowColorInput" value="#000000">
        </div>
        <div class="shadow-slider-group" title="Shadow X offset">
          <span class="shadow-slider-label">X</span>
          <input type="range" id="notesShadowOffsetX" min="-10" max="10" step="1" value="1">
        </div>
        <div class="shadow-slider-group" title="Shadow Y offset">
          <span class="shadow-slider-label">Y</span>
          <input type="range" id="notesShadowOffsetY" min="-10" max="10" step="1" value="1">
        </div>
        <div class="shadow-slider-group" title="Shadow blur radius">
          <span class="shadow-slider-label">Blur</span>
          <input type="range" id="notesShadowBlur" min="0" max="30" step="1" value="2">
        </div>
        <div class="shadow-opacity-wrap" title="Shadow opacity (0-2x)">
          <input type="range" id="notesShadowOpacity" min="0" max="2" step="0.05" value="0.5">
          <span id="notesShadowOpacityLabel" class="shadow-opacity-label">50%</span>
        </div>
        <div class="notes-toolbar__divider"></div>
        <button class="notes-toolbar-btn" data-cmd="removeFormat" title="Clear formatting">
          <svg viewBox="0 0 24 24" fill="none">
            <path d="M4 8l4-4 8 8 4-4M10 14l-4 4"
                  stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
            <path d="M18 18H7"
                  stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/>
          </svg>
        </button>
        <div class="notes-toolbar__divider"></div>
        <button class="notes-toolbar-btn" id="notesDoneBtn" title="Done editing">
          <svg viewBox="0 0 24 24" fill="none">
            <path d="M5 13l4 4L19 7" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </button>
      </div>
    </div>`;
  }

  /* ─── Render: Main Orchestrator ─────────────────────────────────────────── */

  /**
   * Full render pass.  Rebuilds the sidebar list always; only reloads the
   * editor when `forceEditorUpdate` is true or the selected note is invalid.
   *
   * The editor is treated as the source-of-truth while the user is actively
   * editing, so the store's `notes:changed` callback must NOT trigger a full
   * editor reload — it only refreshes the sidebar list.
   */
  function render(options) {
    closePreview();
    var opts = options || {};
    var forceEditorUpdate = opts.forceEditorUpdate === true;

    var notes = App.Store.state.notes;
    var list = $('#notesList');
    var editor = $('#notesEditor');
    var empty = $('#notesEmpty');
    if (!list || !editor || !empty) return;

    /* ── No notes ───────────────────────────────────────────────────── */
    if (notes.length === 0) {
      list.innerHTML = '';
      editor.innerHTML = '';
      editor.classList.remove('is-visible');
      editor.style.display = 'none';
      list.classList.remove('is-hidden');
      empty.innerHTML = '<svg viewBox="0 0 24 24" fill="none"><path d="M6 4h12v2l-4 4 4 4v2H6v-2l4-4-4-4V4z" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg><h3>No notes yet</h3><p>Tap the Add note button to create your first note.</p>';
      empty.hidden = false;
      selectedNoteId = null;
      toolbarBuilt = false;
      adjustMobileView();
      return;
    }

    renderList();

    if (selectedNoteId) {
      empty.hidden = true;
      editor.style.display = '';
      editor.classList.add('is-visible');
      list.classList.add('is-hidden');
      var needEditorUpdate = forceEditorUpdate || !App.Store.getNote(selectedNoteId);
      if (needEditorUpdate) {
        loadNoteIntoEditor(selectedNoteId);
        setEditMode(true);
      }
    } else {
      editor.style.display = 'none';
      editor.classList.remove('is-visible');
      list.classList.remove('is-hidden');
      empty.hidden = true;
    }

    adjustMobileView();
  }

  /* ─── Render: Editor Content ───────────────────────────────────────────── */

  /** Build the editor DOM (title + toolbar + contenteditable) exactly once. */
  function ensureEditorBuilt() {
    if (toolbarBuilt) return;
    var editor = $('#notesEditor');
    if (!editor) return;

    editor.innerHTML =
      '<div class="notes-editor__header">' +
      '<input class="notes-editor__title" id="noteTitleInput" value="" placeholder="Note title\u2026">' +
      '<button id="notesSaveBtn" class="btn btn-primary btn-sm notes-editor__save-btn">Save</button>' +
      '</div>' +
      buildToolbarHTML() +
      '<div class="notes-content" id="noteContent" contenteditable="true" data-placeholder="Start writing\u2026"></div>' +
      '<div class="notes-linked-tasks"><div class="notes-linked-tasks__header"><label>Linked tasks</label><div class="flex-row" style="gap:6px;"><select id="notesLinkTaskSelect" class="select" style="flex:1;min-width:120px;"><option value="">Link a task\u2026</option></select><button id="notesLinkTaskBtn" type="button" class="btn btn-secondary btn-sm">Link</button></div></div><div id="notesLinkedTasksList" class="notes-linked-tasks__list"></div></div>';

    toolbarBuilt = true;
  }

  /** Load a note's title and content into the already-built editor. */
  function loadNoteIntoEditor(id) {
    var note = App.Store.getNote(id);
    if (!note) return;

    ensureEditorBuilt();

    var titleInput = $('#noteTitleInput');
    var contentEl = $('#noteContent');
    if (titleInput) titleInput.value = note.title;
    if (contentEl) contentEl.innerHTML = note.content;

    resetToolbarState();
    updateToolbarState();
    renderLinkedTasks();
  }

  /* ─── Linked Tasks ──────────────────────────────────────────────────────── */

  function populateNoteLinkTaskSelect() {
    var sel = $('#notesLinkTaskSelect');
    if (!sel) return;
    var note = App.Store.getNote(selectedNoteId);
    if (!note) return;
    var linked = note.linkedTaskIds || [];
    sel.innerHTML = '<option value="">Link a task\u2026</option>' +
      App.Store.state.tasks.filter(function (t) { return linked.indexOf(t.id) === -1; })
        .map(function (t) { return '<option value="' + t.id + '">' + esc(t.title) + '</option>'; })
        .join('');
  }

  function renderLinkedTasks() {
    populateNoteLinkTaskSelect();
    var container = $('#notesLinkedTasksList');
    if (!container) return;
    var note = App.Store.getNote(selectedNoteId);
    if (!note) return;
    container.innerHTML = '';
    (note.linkedTaskIds || []).forEach(function (taskId) {
      var task = App.Store.getTask(taskId);
      if (!task) return;
      var chip = document.createElement('span');
      chip.className = 'linked-item';
      chip.innerHTML = '<span class="linked-item__label">' + esc(task.title) + '</span>' +
        '<button type="button" class="linked-item__nav" data-task-id="' + taskId + '" aria-label="Go to task" title="Open task">' +
        '<svg viewBox="0 0 24 24" fill="none" width="12" height="12"><path d="M7 17l10-10M7 7h10v10" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg></button>' +
        '<button type="button" class="linked-item__remove" data-task-id="' + taskId + '" aria-label="Unlink task">' +
        '<svg viewBox="0 0 24 24" fill="none" width="12" height="12"><path d="M6 6l12 12M18 6L6 18" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/></svg></button>';
      chip.querySelector('.linked-item__nav').addEventListener('click', function (e) {
        e.stopPropagation();
        saveCurrentNote();
        App.Views.show('tasks');
      });
      chip.querySelector('.linked-item__remove').addEventListener('click', function (e) {
        e.stopPropagation();
        App.Store.unlinkNoteFromTask(taskId, selectedNoteId);
        renderLinkedTasks();
      });
      container.appendChild(chip);
    });
  }

  function linkCurrentTaskToNote() {
    var sel = $('#notesLinkTaskSelect');
    if (!sel || !sel.value || !selectedNoteId) return;
    App.Store.linkNoteToTask(sel.value, selectedNoteId);
    sel.value = '';
    renderLinkedTasks();
  }

  /** Reset toolbar controls to their defaults when switching notes. */
  function resetToolbarState() {
    strokeThickness = 1;
    shadowOpacity = 0.5;
    shadowColor = '#000000';
    shadowOffsetX = 1;
    shadowOffsetY = 1;
    shadowBlur = 2;
    updateStrokeLabel();

    var preview = $('#notesColorPreview');
    if (preview) preview.style.background = '#000000';

    var fontSelect = $('#notesFontSelect');
    if (fontSelect) fontSelect.value = 'sans-serif';

    var sizeSelect = $('#notesSizeSelect');
    if (sizeSelect) sizeSelect.value = '16px';

    var opacitySlider = $('#notesShadowOpacity');
    if (opacitySlider) opacitySlider.value = '0.5';
    var label = $('#notesShadowOpacityLabel');
    if (label) label.textContent = '50%';
    var oxSlider = $('#notesShadowOffsetX');
    if (oxSlider) oxSlider.value = '1';
    var oySlider = $('#notesShadowOffsetY');
    if (oySlider) oySlider.value = '1';
    var blurSlider = $('#notesShadowBlur');
    if (blurSlider) blurSlider.value = '2';

    closeEmojiPicker();
  }

  /* ─── Note Actions ─────────────────────────────────────────────────────── */

  function selectNote(id) {
    if (id === selectedNoteId) return;
    closePreview();
    saveCurrentNote(); // BUG FIX: save before switching to prevent data loss
    selectedNoteId = id;
    renderList();
    loadNoteIntoEditor(id);
    setEditMode(true); // Open in editing mode
    var editor = $('#notesEditor');
    var list = $('#notesList');
    var empty = $('#notesEmpty');
    if (editor) { editor.style.display = ''; editor.classList.add('is-visible'); }
    if (list) list.classList.add('is-hidden');
    if (empty) empty.hidden = true;
    adjustMobileView();
  }

  function addNote() {
    closePreview();
    saveCurrentNote(); // BUG FIX: save current note before creating a new one
    var note = App.Store.addNote({ title: 'Untitled', content: '' });
    selectedNoteId = note.id;
    var editor = $('#notesEditor');
    var list = $('#notesList');
    var empty = $('#notesEmpty');
    if (empty) empty.hidden = true;
    if (editor) { editor.style.display = ''; editor.classList.add('is-visible'); }
    if (list) list.classList.add('is-hidden');
    renderList();
    loadNoteIntoEditor(note.id);
    setEditMode(true); // Start in editing mode for new notes

    setTimeout(function () {
      var input = $('#noteTitleInput');
      if (input) {
        input.focus();
        input.select();
      }
    }, 50);

    adjustMobileView();
    App.Toast.show({ message: 'Note created', type: 'success', duration: 2000 });
  }

  function deleteNote(id) {
    var note = App.Store.getNote(id);
    if (!note) return;

    // BUG FIX: require confirmation before permanent deletion
    if (!window.confirm('Delete "' + note.title + '"?')) return;

    App.Store.deleteNote(id);

    var remaining = App.Store.state.notes;
    if (remaining.length === 0) {
      selectedNoteId = null;
      toolbarBuilt = false;
      var editor = $('#notesEditor');
      var list = $('#notesList');
      if (editor) { editor.classList.remove('is-visible'); editor.style.display = 'none'; }
      if (list) list.classList.remove('is-hidden');
    } else if (selectedNoteId === id) {
      selectedNoteId = null;
    }

    render({ forceEditorUpdate: true });
    App.Toast.show({ message: 'Note deleted', type: 'info', duration: 2000 });
  }

  /* ─── Toolbar State ────────────────────────────────────────────────────── */

  var TOOLBAR_COMMANDS = [
    'bold', 'italic', 'underline', 'strikeThrough',
    'insertOrderedList', 'insertUnorderedList',
    'justifyLeft', 'justifyCenter', 'justifyRight',
  ];

  function updateToolbarState() {
    for (var i = 0; i < TOOLBAR_COMMANDS.length; i++) {
      var cmd = TOOLBAR_COMMANDS[i];
      var btn = $('[data-cmd="' + cmd + '"]');
      if (btn) {
        try {
          btn.classList.toggle('is-active', document.queryCommandState(cmd));
        } catch (_) {
          // queryCommandState may throw for unsupported commands
        }
      }
    }
  }

  /* ─── Formatting Helpers ───────────────────────────────────────────────── */

  /**
   * Remove ONLY the background/highlight color from the selection, preserving
   * all other inline formatting (bold, italic, font, etc.).
   *
   * Uses extractContents → clean → re-insert to avoid modifying the live DOM
   * during traversal, and preserves block-level structure (paragraphs, lists).
   */
  function removeHighlightColor() {
    var sel = window.getSelection();
    if (!sel || !sel.rangeCount || sel.isCollapsed) return;

    var range = sel.getRangeAt(0);

    try {
      var fragment = range.extractContents();

      // Remove background-color from every styled element in the fragment
      var styled = fragment.querySelectorAll('[style]');
      for (var i = 0; i < styled.length; i++) {
        styled[i].style.removeProperty('background-color');
        // Clean up empty style attributes to keep HTML tidy
        if (!styled[i].getAttribute('style')) {
          styled[i].removeAttribute('style');
        }
      }

      var first = fragment.firstChild;
      var last = fragment.lastChild;
      if (!first) return;

      range.insertNode(fragment);

      // Re-select the cleaned content so the user sees the selection is still active
      var newRange = document.createRange();
      newRange.setStartBefore(first);
      newRange.setEndAfter(last);
      sel.removeAllRanges();
      sel.addRange(newRange);
    } catch (_) {
      // Fallback: if extractContents fails on a complex selection, use the
      // built-in removeFormat which strips all formatting but at least works.
      document.execCommand('removeFormat');
    }
  }

  /**
   * Strip ALL inline formatting from the selection using the built-in command,
   * which correctly preserves block-level structure (paragraphs, lists, etc.).
   */
  function clearAllFormatting() {
    document.execCommand('removeFormat');
  }

  /**
   * Toggle a CSS inline style on the current selection.
   * If the selection's common ancestor is inside a span already carrying the
   * given CSS property, that span is unwrapped (toggle off).  Otherwise the
   * selected content is wrapped in a new span with the style (toggle on).
   */
  function toggleInlineStyle(prop, value) {
    var sel = window.getSelection();
    if (!sel.rangeCount || sel.isCollapsed) return;

    var range = sel.getRangeAt(0);
    var container = range.commonAncestorContainer;
    var el = container.nodeType === 3 ? container.parentElement : container;
    var content = $('#noteContent');
    if (!content) return;

    // Walk up from the selection to find a span with this style property
    var parent = el;
    while (parent && parent !== content) {
      if (parent.tagName === 'SPAN' && parent.style[prop]) {
        // Unwrap the styled span (remove style, keep children)
        var p = parent.parentNode;
        while (parent.firstChild) p.insertBefore(parent.firstChild, parent);
        p.removeChild(parent);
        sel.removeAllRanges();
        var r = document.createRange();
        r.selectNodeContents(content);
        sel.addRange(r);
        return;
      }
      parent = parent.parentElement;
    }

    // Wrap selected content in a styled span
    var html = range.extractContents();
    var span = document.createElement('span');
    span.style[prop] = value;
    span.appendChild(html);
    range.insertNode(span);

    // Collapse selection to end
    sel.removeAllRanges();
    var r = document.createRange();
    r.setStartAfter(span);
    sel.addRange(r);
  }

  /* ─── Save Logic ───────────────────────────────────────────────────────── */

  /**
   * Persist the current editor state to the store and refresh the sidebar.
   * This is the single source of truth for syncing editor → store.
   */
  function saveCurrentNote() {
    if (!selectedNoteId) return;
    var titleInput = $('#noteTitleInput');
    var contentEl = $('#noteContent');
    if (!titleInput || !contentEl) return;

    var title = titleInput.value.trim() || 'Untitled';
    var content = contentEl.innerHTML;

    App.Store.updateNote(selectedNoteId, { title: title, content: content });
    renderList(); // Update sidebar with new title / date
  }

  /** Save the current note and close the editor, returning to the card grid. */
  function saveAndClose() {
    saveCurrentNote();
    selectedNoteId = null;
    setEditMode(false);
    var editor = $('#notesEditor');
    var list = $('#notesList');
    var empty = $('#notesEmpty');
    if (editor) { editor.classList.remove('is-visible'); editor.style.display = ''; }
    if (list) list.classList.remove('is-hidden');
    if (empty) empty.hidden = true;
    adjustMobileView();
  }

  var saveNoteDebounced = debounce(saveCurrentNote, 400);

  /* ─── Preview Mode ─────────────────────────────────────────────────────── */

  var previewNoteIds = [];
  var previewIndex = -1;

  /** Build the preview overlay HTML once and append to body. */
  function ensurePreviewBuilt() {
    if ($('#notesPreview')) return;
    var div = document.createElement('div');
    div.id = 'notesPreview';
    div.className = 'notes-preview-overlay';
    div.innerHTML =
      '<div class="notes-preview">' +
      '<div class="notes-preview__header">' +
      '<button class="notes-preview__nav" data-dir="prev" title="Previous note" aria-label="Previous note">\u2039</button>' +
      '<div class="notes-preview__title" id="notesPreviewTitle"></div>' +
      '<button class="notes-preview__nav" data-dir="next" title="Next note" aria-label="Next note">\u203A</button>' +
      '<button class="notes-preview__close" id="notesPreviewClose" title="Close preview" aria-label="Close preview">\u2715</button>' +
      '</div>' +
      '<div class="notes-preview__content" id="notesPreviewContent"></div>' +
      '<div class="notes-preview__footer" id="notesPreviewFooter"></div>' +
      '</div>';
    document.body.appendChild(div);
  }

  /** Open the preview overlay for a specific note. */
  function openPreview(id) {
    saveCurrentNote(); // Save any in-progress edits before previewing
    // Close the editor if it is open
    if (selectedNoteId) {
      selectedNoteId = null;
      setEditMode(false);
      var ed = $('#notesEditor');
      var lst = $('#notesList');
      if (ed) { ed.classList.remove('is-visible'); ed.style.display = ''; }
      if (lst) lst.classList.remove('is-hidden');
    }
    var note = App.Store.getNote(id);
    if (!note) return;
    ensurePreviewBuilt();

    // Build ordered list of note ids for navigation
    previewNoteIds = App.Store.state.notes.map(function (n) { return n.id; });
    previewIndex = previewNoteIds.indexOf(id);
    if (previewIndex === -1) return;

    var overlay = $('#notesPreview');
    var titleEl = $('#notesPreviewTitle');
    var contentEl = $('#notesPreviewContent');
    var footerEl = $('#notesPreviewFooter');

    if (titleEl) titleEl.textContent = note.title || 'Untitled';
    if (contentEl) {
      contentEl.innerHTML = note.content || '<p style="color:var(--color-text-tertiary);font-style:italic;">No content</p>';
    }
    if (footerEl) {
      footerEl.textContent = (previewIndex + 1) + ' / ' + previewNoteIds.length;
    }

    if (overlay) overlay.classList.add('is-open');
    document.body.style.overflow = 'hidden';
  }

  /** Close the preview overlay. */
  function closePreview() {
    var overlay = $('#notesPreview');
    if (overlay) overlay.classList.remove('is-open');
    document.body.style.overflow = '';
    previewIndex = -1;
    previewNoteIds = [];
  }

  /** Navigate to the previous or next note in the preview. */
  function navigatePreview(dir) {
    var len = previewNoteIds.length;
    if (len === 0) return;
    var next = previewIndex + dir;
    if (next < 0 || next >= len) return;
    openPreview(previewNoteIds[next]);
  }

  /* ─── Mobile View ──────────────────────────────────────────────────────── */

  /** Synchronously toggle list/editor visibility on narrow screens. */
  function adjustMobileView() {
    if (window.innerWidth > 720) return;
    var list = $('#notesList');
    var editor = $('#notesEditor');
    if (selectedNoteId) {
      if (list) list.classList.add('is-hidden');
      if (editor) { editor.classList.add('is-visible'); editor.style.display = ''; }
    } else {
      if (list) list.classList.remove('is-hidden');
      if (editor) { editor.classList.remove('is-visible'); editor.style.display = 'none'; }
    }
  }

  /* ─── Command Execution ────────────────────────────────────────────────── */

  /**
   * Execute a contenteditable command.  Ensures the editable area is focused
   * before running the command, then updates toolbar state and schedules a
   * debounced save.
   */
  function exec(cmd, val) {
    var content = $('#noteContent');
    if (!content) return;
    content.focus();
    if (val !== undefined) {
      document.execCommand(cmd, false, val);
    } else {
      document.execCommand(cmd);
    }
    updateToolbarState();
    saveNoteDebounced();
  }

  /* ─── Emoji Picker ─────────────────────────────────────────────────────── */

  function closeEmojiPicker() {
    var picker = $('#notesEmojiPicker');
    if (picker) picker.hidden = true;
  }

  function toggleEmojiPicker() {
    var picker = $('#notesEmojiPicker');
    if (picker) picker.hidden = !picker.hidden;
  }

  /* ─── Init & Event Binding ─────────────────────────────────────────────── */

  function init() {
    var list = $('#notesList');
    var editor = $('#notesEditor');
    if (!list || !editor) return;

    /* ── Store callback ───────────────────────────────────────────────────
     * Only refreshes the sidebar list.  The editor is the source-of-truth
     * while the user is editing, so we intentionally do NOT reload it here.
     *
     * ARCHITECTURE FIX: the original code called render() from this callback,
     * which re-entered the editor and wiped the user's selection / unsaved
     * work.  The old skipNextRender flag was a fragile workaround.
     */
    App.Store.on('notes:changed', function (payload) {
      renderList();

      // Refresh linked tasks if the current note was updated externally
      if (selectedNoteId && payload && payload.note && payload.note.id === selectedNoteId) {
        renderLinkedTasks();
      }

      // Edge case: if the currently selected note was deleted by external
      // code, deselect and show the select prompt.
      if (selectedNoteId && !App.Store.getNote(selectedNoteId)) {
        selectedNoteId = null;
        toolbarBuilt = false;
        render();
      }
    });

    /* ── Add note button ───────────────────────────────────────────────── */
    var addBtn = $('#notesAddBtn');
    if (addBtn) addBtn.addEventListener('click', addNote);

    /* ── Global keyboard shortcuts ───────────────────────────────────────
     * Scoped to #noteContent so Ctrl+B/I/U don't fire while the title
     * input has focus.
     */
    document.addEventListener('keydown', function (e) {
      var inContent = e.target.closest('#noteContent');
      if (inContent && (e.ctrlKey || e.metaKey)) {
        var cmdMap = { b: 'bold', i: 'italic', u: 'underline' };
        var cmd = cmdMap[e.key.toLowerCase()];
        if (cmd) {
          e.preventDefault();
          exec(cmd);
        }
        if (e.key === 's') {
          e.preventDefault();
          saveCurrentNote();
        }
      }
      if (e.key === 'Escape') {
        closeEmojiPicker();
        clearSavedSelection();
      }
    });

    /* ── Note list: click delegation ───────────────────────────────────── */
    list.addEventListener('click', function (e) {
      var previewBtn = e.target.closest('.notes-list-item__preview');
      var delBtn = e.target.closest('.notes-list-item__delete');
      var editBtn = e.target.closest('.notes-list-item__edit');
      var item = e.target.closest('.notes-list-item');

      if (previewBtn) {
        e.stopPropagation();
        openPreview(previewBtn.dataset.id);
        return;
      }
      if (delBtn) {
        e.stopPropagation();
        deleteNote(delBtn.dataset.id);
        return;
      }
      if (editBtn) {
        e.stopPropagation();
        selectNote(editBtn.dataset.id);
        return;
      }
      if (item) {
        openPreview(item.dataset.id);
      }
    });

    /* ── Note list: keyboard navigation (a11y) ─────────────────────────── */
    list.addEventListener('keydown', function (e) {
      var item = e.target.closest('.notes-list-item');
      if (!item) return;
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        openPreview(item.dataset.id);
      }
    });

    /* ── Editor: prevent focus loss on ALL toolbar interactions ──────────
     * BUG FIX: the original only saved selection for color inputs and
     * selects.  Color swatches and emoji buttons lost the selection,
     * causing execCommand to apply formatting at the wrong position (or
     * not at all).
     */
    editor.addEventListener('pointerdown', function (e) {
      if (!e.target.closest('.notes-toolbar')) return;

      // Save selection before any toolbar interaction that might steal focus
      saveSelection();

      // Prevent default on interactive toolbar children so they don't
      // steal focus from the contenteditable area.
      var isInteractive =
        e.target.closest('.notes-toolbar-btn') ||
        e.target.closest('.notes-toolbar-swatch') ||
        e.target.closest('[data-emoji]') ||
        e.target.closest('.emoji-tab');

      if (isInteractive) {
        e.preventDefault();
      }
    });

    /* ── Editor: clicks ────────────────────────────────────────────────── */
    editor.addEventListener('click', function (e) {
      // Enter editing mode when clicking the content area in preview
      if (e.target.closest('#noteContent') && !isEditing) {
        setEditMode(true);
        return;
      }

      // Native color inputs are handled by 'change' events — ignore clicks here
      if (e.target.closest('#notesColorInput') || e.target.closest('#notesHighlightInput') ||
          e.target.closest('#notesStrokeColorInput') || e.target.closest('#notesShadowColorInput')) {
        return;
      }

      var content = $('#noteContent');
      if (!content) return;

      /* ── Color / highlight swatches ─────────────────────────────────── */
      var swatch = e.target.closest('.notes-toolbar-swatch');
      if (swatch) {
        var color = swatch.dataset.color;
        var type = swatch.dataset.type;
        if (!color) return;

        restoreSelection();
        content.focus();

        if (type === 'highlight') {
          if (color === '#ffffff00') {
            // Transparent swatch: only remove background color, not all formatting.
            removeHighlightColor();
          } else {
            document.execCommand('backColor', false, color);
          }
        } else {
          document.execCommand('foreColor', false, color);
          var preview = $('#notesColorPreview');
          if (preview) preview.style.background = color;
        }

        updateToolbarState();
        saveNoteDebounced();
        content.focus();
        return;
      }

      /* ── Save button (in editor header) ─────────────────────────────── */
      if (e.target.id === 'notesSaveBtn' || e.target.closest('#notesSaveBtn')) {
        saveAndClose();
        return;
      }

      /* ── Link task button ──────────────────────────────────────────── */
      if (e.target.id === 'notesLinkTaskBtn' || e.target.closest('#notesLinkTaskBtn')) {
        linkCurrentTaskToNote();
        return;
      }

      /* ── Emoji toggle ──────────────────────────────────────────────── */
      if (e.target.closest('#notesEmojiBtn')) {
        toggleEmojiPicker();
        return;
      }

      /* ── Emoji tab switch ──────────────────────────────────────────── */
      var emojiTab = e.target.closest('.emoji-tab');
      if (emojiTab) {
        var cat = parseInt(emojiTab.dataset.cat);
        emojiCategoryIndex = cat;
        var tabs = e.target.closest('.emoji-tabs');
        if (tabs) tabs.querySelectorAll('.emoji-tab').forEach(function(t) { t.classList.remove('is-active'); });
        emojiTab.classList.add('is-active');
        var picker = $('#notesEmojiPicker');
        if (picker) {
          picker.querySelectorAll('[data-emoji], .emoji-category-label').forEach(function(el) {
            el.hidden = parseInt(el.dataset.cat) !== cat;
          });
        }
        return;
      }

      /* ── Emoji insert ──────────────────────────────────────────────── */
      var emojiItem = e.target.closest('[data-emoji]');
      if (emojiItem) {
        restoreSelection();
        content.focus();
        document.execCommand('insertText', false, emojiItem.dataset.emoji);
        closeEmojiPicker();
        saveNoteDebounced();
        return;
      }

      /* ── Toolbar command buttons ────────────────────────────────────── */
      var btn = e.target.closest('.notes-toolbar-btn');
      if (btn) {
        // Done button exits editing mode (save + back to grid)
        if (btn.id === 'notesDoneBtn') {
          saveAndClose();
          return;
        }

        var cmd = btn.dataset.cmd;
        restoreSelection();
        content.focus();

        if (cmd === 'removeFormat') {
          clearAllFormatting();
        } else if (cmd === 'toggleStroke') {
          var si = $('#notesStrokeColorInput');
          var val = (si ? si.value : '#000000');
          if (findStyleSpan('-webkit-text-stroke')) {
            removeStyleSpan('-webkit-text-stroke');
          } else {
            applyOrUpdateStyle('-webkit-text-stroke', strokeThickness + 'px ' + val);
          }
        } else if (cmd === 'strokeThinner') {
          strokeThickness = Math.max(0.5, +(strokeThickness - 0.5).toFixed(1));
          updateStrokeLabel();
          var span = findStyleSpan('-webkit-text-stroke');
          if (span) {
            var si = $('#notesStrokeColorInput');
            span.style['-webkit-text-stroke'] = strokeThickness + 'px ' + (si ? si.value : '#000000');
            saveNoteDebounced();
          }
        } else if (cmd === 'strokeThicker') {
          strokeThickness = Math.min(5, +(strokeThickness + 0.5).toFixed(1));
          updateStrokeLabel();
          var span = findStyleSpan('-webkit-text-stroke');
          if (span) {
            var si = $('#notesStrokeColorInput');
            span.style['-webkit-text-stroke'] = strokeThickness + 'px ' + (si ? si.value : '#000000');
            saveNoteDebounced();
          }
        } else if (cmd === 'toggleShadow') {
          if (findStyleSpan('text-shadow')) {
            removeStyleSpan('text-shadow');
          } else {
            var si2 = $('#notesShadowColorInput');
            var opacity = parseFloat($('#notesShadowOpacity').value || '0.5');
            var ox = parseInt($('#notesShadowOffsetX').value || '1');
            var oy = parseInt($('#notesShadowOffsetY').value || '1');
            var blur = parseInt($('#notesShadowBlur').value || '2');
            var color = si2 ? si2.value : '#000000';
            applyOrUpdateStyle('text-shadow', buildShadowCSS(color, opacity, ox, oy, blur));
          }
        } else if (cmd) {
          document.execCommand(cmd);
        }

        updateToolbarState();
        saveNoteDebounced();
        content.focus();
        return;
      }

      // Clicked somewhere else in the editor — close picker
      closeEmojiPicker();
    });

    /* ── Editor: input events ────────────────────────────────────────────
     * 'input' fires continuously (e.g. while dragging a color picker).
     * We only use it for lightweight UI updates; actual content commands
     * are deferred to the 'change' event.
     *
     * BUG FIX: the original handled color-input 'input' events by calling
     * restoreSelection() + exec(), but restoreSelection cleared savedRange
     * after the first call, so continuous dragging only worked once.
     */
    editor.addEventListener('input', function (e) {
      // Real-time color preview indicator (does NOT apply to content)
      if (e.target.id === 'notesColorInput') {
        var preview = $('#notesColorPreview');
        if (preview) preview.style.background = e.target.value;
        return;
      }
      if (e.target.id === 'notesStrokeColorInput') {
        var p = $('#notesStrokeColorPreview');
        if (p) p.style.background = e.target.value;
        return;
      }
      if (e.target.id === 'notesShadowColorInput') {
        updateShadowOnSelection();
        var p = $('#notesShadowColorPreview');
        if (p) p.style.background = e.target.value;
        return;
      }
      if (e.target.id === 'notesShadowOpacity') {
        restoreSelection();
        updateShadowOnSelection();
        return;
      }
      if (e.target.id === 'notesShadowOffsetX' || e.target.id === 'notesShadowOffsetY' || e.target.id === 'notesShadowBlur') {
        restoreSelection();
        updateShadowOnSelection();
        return;
      }
      // Highlight color: no real-time preview needed; applied on 'change'
      if (e.target.id === 'notesHighlightInput') return;
      // Font / size selects: applied on 'change'
      if (e.target.id === 'notesFontSelect' || e.target.id === 'notesSizeSelect') return;
      // Title or content edit — schedule debounced save
      if (e.target.closest('#noteTitleInput') || e.target.closest('#noteContent')) {
        saveNoteDebounced();
      }
    });

    /* ── Editor: change events for toolbar controls ──────────────────────
     * These fire once when the user finishes an interaction (closes the
     * color picker, selects a font, etc.).  We restore the saved selection
     * and apply the formatting command.
     */
    editor.addEventListener('change', function (e) {
      if (e.target.id === 'notesColorInput') {
        restoreSelection();
        clearSavedSelection();
        exec('foreColor', e.target.value);
        return;
      }
      if (e.target.id === 'notesHighlightInput') {
        restoreSelection();
        clearSavedSelection();
        exec('backColor', e.target.value);
        return;
      }
      if (e.target.id === 'notesFontSelect') {
        restoreSelection();
        clearSavedSelection();
        exec('fontName', e.target.value);
        return;
      }
      if (e.target.id === 'notesSizeSelect') {
        restoreSelection();
        clearSavedSelection();
        applyOrUpdateStyle('fontSize', e.target.value);
        saveNoteDebounced();
        return;
      }
      if (e.target.id === 'notesStrokeColorInput') {
        restoreSelection();
        clearSavedSelection();
        var span = findStyleSpan('-webkit-text-stroke');
        if (span) {
          span.style['-webkit-text-stroke'] = strokeThickness + 'px ' + e.target.value;
          saveNoteDebounced();
        }
        return;
      }
      if (e.target.id === 'notesShadowColorInput') {
        updateShadowOnSelection();
        var p = $('#notesShadowColorPreview');
        if (p) p.style.background = e.target.value;
        return;
      }
      if (e.target.id === 'notesShadowOpacity') {
        updateShadowOnSelection();
        return;
      }
      if (e.target.id === 'notesShadowOffsetX' || e.target.id === 'notesShadowOffsetY' || e.target.id === 'notesShadowBlur') {
        updateShadowOnSelection();
        return;
      }
    });

    /* ── Paste: plain text only ───────────────────────────────────────── */
    editor.addEventListener('paste', function (e) {
      if (!e.target.closest('#noteContent')) return;
      e.preventDefault();
      var text = (e.clipboardData || window.clipboardData).getData('text/plain');
      document.execCommand('insertText', false, text);
      saveNoteDebounced();
    });

    /* ── Selection change: update toolbar button active states ───────────
     * BUG FIX: the original checked editor.contains(document.activeElement)
     * which was true even when the title input was focused.  Now we check
     * specifically that the selection is inside the contenteditable.
     */
    var selTimer = null;
    document.addEventListener('selectionchange', function () {
      var content = $('#noteContent');
      if (!content) return;
      var sel = window.getSelection();
      if (!sel || !sel.rangeCount) return;
      // Only update toolbar when selection is actually inside the content area
      if (!content.contains(sel.anchorNode)) return;
      clearTimeout(selTimer);
      selTimer = setTimeout(updateToolbarState, 100);
    });

    /* ── Window resize ────────────────────────────────────────────────── */
    window.addEventListener('resize', adjustMobileView);

    /* ── Mobile back button ─────────────────────────────────────────────
     * BUG FIX: save the current note before navigating back so edits
     * are not silently lost.
     */
    var backBtn = $('#notesBackBtn');
    if (backBtn) {
      backBtn.addEventListener('click', function () {
        saveAndClose();
        closeEmojiPicker();
      });
    }

    /* ── Preview events (delegated on document) ───────────────────────── */
    document.addEventListener('click', function (e) {
      // Close preview via X button or overlay backdrop click
      if (e.target.closest('#notesPreviewClose') || e.target.closest('.notes-preview-overlay.is-open') && !e.target.closest('.notes-preview')) {
        closePreview();
        return;
      }
      // Navigate via prev/next buttons
      var navBtn = e.target.closest('.notes-preview__nav');
      if (navBtn) {
        var dir = navBtn.dataset.dir === 'prev' ? -1 : 1;
        navigatePreview(dir);
        return;
      }
    });

    // Keyboard navigation for preview
    document.addEventListener('keydown', function (e) {
      var overlay = $('#notesPreview');
      if (overlay && overlay.classList.contains('is-open')) {
        if (e.key === 'ArrowLeft') { e.preventDefault(); navigatePreview(-1); }
        if (e.key === 'ArrowRight') { e.preventDefault(); navigatePreview(1); }
        if (e.key === 'Escape') { e.preventDefault(); closePreview(); }
      }
    });

    /* ── Linked tasks ───────────────────────────────────────────────────
     * NOTE: #notesLinkTaskBtn click is handled via editor click delegation
     * above because the editor (and its button) is lazily built after init(). */

    // Refresh linked tasks section when tasks change (e.g. title edited in modal)
    App.Store.on('tasks:changed', function () {
      if (selectedNoteId) {
        var notesView = $('#view-notes');
        if (notesView && !notesView.hidden) {
          populateNoteLinkTaskSelect();
          if ($('#notesLinkedTasksList')) renderLinkedTasks();
        }
      }
    });

    /* ── Close emoji picker on outside click ──────────────────────────── */
    document.addEventListener('click', function (e) {
      if (!e.target.closest('.notes-toolbar-emoji-wrap')) {
        closeEmojiPicker();
      }
    });

    /* ── Clear saved selection when user clicks directly into content ──
     * This prevents stale saved ranges from interfering after the user
     * manually repositions the cursor. */
    editor.addEventListener('click', function (e) {
      if (e.target.closest('#noteContent')) {
        clearSavedSelection();
      }
    });

    // Initial full render
    render({ forceEditorUpdate: true });
  }

  /* ─── Public API ───────────────────────────────────────────────────────── */
  App.Notes = { init: init, render: render, selectNote: selectNote };
})();
