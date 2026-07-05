/*
  App.Print — injects a print-only header (title + date + filter context) before
  calling window.print(); the actual layout work is done by css/print.css.
*/
(function () {
  'use strict';
  window.App = window.App || {};
  const { $, el } = App.Helpers;

  function printCurrentView() {
    const active = document.querySelector('.view:not([hidden])');
    const isTasksView = active && active.id === 'view-tasks';
    let existing = $('#printHeaderInjected');
    if (existing) existing.remove();

    const title = isTasksView ? App.Filters.labelFor(App.Filters.state.activeFilter) : (active ? active.dataset.printTitle || 'Flow' : 'Flow');
    const header = el('div', { id: 'printHeaderInjected', class: 'print-header' });
    header.innerHTML = `<h1>${title}</h1><div class="meta">Flow \u00b7 Printed ${new Date().toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</div>`;
    if (active) active.prepend(header);

    window.print();
    setTimeout(() => { if (header.parentNode) header.remove(); }, 500);
  }

  function init() {
    $('#printBtn').addEventListener('click', printCurrentView);
    window.addEventListener('afterprint', () => { const h = $('#printHeaderInjected'); if (h) h.remove(); });
  }

  App.Print = { init, printCurrentView };
})();
