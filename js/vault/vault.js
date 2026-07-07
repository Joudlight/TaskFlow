/*
  App.Vault — main Vault module. Integrates the Vault with the app shell,
  handles view switching, auto-lock timer, and keyboard shortcuts.

  The Vault is a fully client-side, encrypted workspace for storing sensitive
  information. It uses AES-256-GCM encryption via the Web Crypto API, with
  PBKDF2 key derivation and IndexedDB for persistent storage.

  Everything remains entirely local — no server, no cloud, no external database.
*/
(function () {
  'use strict';
  window.App = window.App || {};
  window.App.Vault = window.App.Vault || {};

  var inactivityTimer = null;
  var autoLockMinutes = 15;
  var isActive = false;

  /*
    Show the Vault view. Checks the vault status and renders the appropriate UI:
    - uninitialized: onboarding screen
    - locked: unlock screen
    - unlocked: vault dashboard
  */
  function show() {
    isActive = true;
    App.Vault.Auth.getStatus().then(function (status) {
      if (status === 'uninitialized') {
        App.Vault.UI.renderOnboarding();
      } else if (status === 'locked') {
        App.Vault.UI.renderUnlockScreen();
      } else {
        App.Vault.UI.renderUnlocked();
        startInactivityTimer();
      }
    });
  }

  function init() {
    App.Vault.Auth.getAutoLock().then(function (val) {
      autoLockMinutes = val;
    });
  }

  /*
    Lock the vault: clear in-memory session and show the unlock screen.
  */
  function lock() {
    App.Vault.Auth.lock();
    stopInactivityTimer();
    if (isActive) {
      App.Vault.UI.renderUnlockScreen();
    }
  }

  /*
    Reset the inactivity timer whenever the user interacts with the vault.
  */
  function resetInactivityTimer() {
    if (!isActive) return;
    stopInactivityTimer();
    startInactivityTimer();
  }

  function startInactivityTimer() {
    if (autoLockMinutes <= 0) return;
    stopInactivityTimer();
    inactivityTimer = setTimeout(function () {
      if (isActive) {
        App.Vault.Auth.lock();
        App.Vault.UI.renderUnlockScreen();
        App.Toast.show({ message: 'Vault locked due to inactivity', type: 'info', duration: 3000 });
      }
    }, autoLockMinutes * 60 * 1000);
  }

  function stopInactivityTimer() {
    if (inactivityTimer) {
      clearTimeout(inactivityTimer);
      inactivityTimer = null;
    }
  }

  function updateAutoLock(minutes) {
    autoLockMinutes = minutes;
    resetInactivityTimer();
  }

  /*
    Handle user activity for auto-lock: listens for scroll, click, keydown,
    and pointer events on the vault view to reset the inactivity timer.
  */
  function wireActivityListener() {
    var view = document.getElementById('view-vault');
    if (!view) return;
    var events = ['click', 'keydown', 'scroll', 'pointerdown', 'pointermove'];
    var handler = function () { resetInactivityTimer(); };
    events.forEach(function (evt) { view.addEventListener(evt, handler, { passive: true }); });
  }

  /*
    Initialize the vault module. Called from app.js during bootstrap.
  */
  function initModule() {
    init();
    wireActivityListener();

    App.Store.on('settings:changed', function () {
      var view = document.getElementById('view-vault');
      if (view && !view.hidden) {
        resetInactivityTimer();
      }
    });
  }

  App.Vault.init = initModule;
  App.Vault.show = show;
  App.Vault.lock = lock;
  App.Vault.resetInactivityTimer = resetInactivityTimer;
  App.Vault.updateAutoLock = updateAutoLock;
})();
