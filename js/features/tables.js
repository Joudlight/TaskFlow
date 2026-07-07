(function () {
  'use strict';
  window.App = window.App || {};
  var tmApi = null;

  function render() {
    try {
      var editor = App.Helpers.$('#tablesEditor');
      if (!editor) return;
      if (!tmApi) {
        if (typeof TableManager === 'undefined') return;
        tmApi = TableManager.init(editor, { loadFromAppStore: true });
      } else {
        tmApi.render();
      }
    } catch (e) {
      console.warn('Tables render error:', e);
    }
  }

  function init() {
    render();
  }

  App.Tables = { init: init, render: render };
})();
