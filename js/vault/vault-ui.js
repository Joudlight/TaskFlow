/*
  App.Vault.UI — all Vault user interface rendering.
  Handles onboarding, unlock, recovery, item management, password generator,
  import/export, and security education cards.

  All modals and dialogs are created dynamically from this module.
*/
(function () {
  'use strict';
  window.App = window.App || {};
  window.App.Vault = window.App.Vault || {};

  var A = App.Vault.Auth;
  var C = App.Vault.Crypto;
  var $ = App.Helpers.$;
  var $all = App.Helpers.$all;
  var el = App.Helpers.el;
  var esc = App.Helpers.escapeHtml;

  var ITEM_TYPES = [
    { id: 'secure-note', label: 'Secure Note', icon: 'note' },
    { id: 'password', label: 'Password', icon: 'key' },
    { id: 'api-key', label: 'API Key', icon: 'api' },
    { id: 'license-key', label: 'License Key', icon: 'license' },
    { id: 'recovery-code', label: 'Recovery Code', icon: 'recovery' },
    { id: 'identity', label: 'Identity', icon: 'identity' },
    { id: 'bank-info', label: 'Bank Information', icon: 'bank' },
    { id: 'custom', label: 'Custom', icon: 'custom' },
  ];

  var ICONS = {
    note: '<svg viewBox="0 0 24 24"><path d="M6 4h12v2l-4 4 4 4v2H6v-2l4-4-4-4V4z" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    key: '<svg viewBox="0 0 24 24"><path d="M15.5 7.5a4 4 0 11-5 5L9 14l-1.5-1.5L9 11l-1-1-1.5 1.5L5 10l3-3a4 4 0 017.5.5z" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/><circle cx="16.5" cy="7.5" r="1" fill="currentColor"/></svg>',
    api: '<svg viewBox="0 0 24 24"><path d="M10 13l-4 4 4 4M14 11l4-4-4-4M9 15l6-6" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    license: '<svg viewBox="0 0 24 24"><rect x="4" y="3" width="16" height="18" rx="2" stroke="currentColor" stroke-width="1.8"/><path d="M9 10h6M9 13h6M9 16h4" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>',
    recovery: '<svg viewBox="0 0 24 24"><path d="M12 2a9 9 0 00-7.5 13.5L2 22l6.5-2.5A9 9 0 1012 2z" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/><path d="M12 7v5l3 3" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>',
    identity: '<svg viewBox="0 0 24 24"><circle cx="12" cy="9" r="4" stroke="currentColor" stroke-width="1.8"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>',
    bank: '<svg viewBox="0 0 24 24"><path d="M4 10l8-6 8 6M6 10v7M10 10v7M14 10v7M18 10v7M4 19h16" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>',
    custom: '<svg viewBox="0 0 24 24"><path d="M12 2l2.4 6.6L21 9.6l-5.2 4.8L17.4 22 12 18.3 6.6 22 8.2 14.4 3 9.6l6.6-.8z" stroke="currentColor" stroke-width="1.8"/></svg>',
    lock: '<svg viewBox="0 0 24 24"><rect x="5" y="11" width="14" height="10" rx="2" stroke="currentColor" stroke-width="1.8"/><path d="M8 11V7a4 4 0 118 0v4" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>',
    shield: '<svg viewBox="0 0 24 24"><path d="M12 2l8 3v6a8 8 0 01-8 7 8 8 0 01-8-7V5l8-3z" stroke="currentColor" stroke-width="1.8"/><path d="M9 12l2 2 4-4" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    alert: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="1.8"/><path d="M12 7v5M12 16h.01" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>',
    info: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="1.8"/><path d="M12 11v6M12 7h.01" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>',
    star: '<svg viewBox="0 0 24 24"><path d="M12 2l2.9 6.6L22 9.6l-5.2 4.8L18.2 22 12 18.3 5.8 22 7.2 14.4 2 9.6l7.1-1z" stroke="currentColor" stroke-width="1.8"/></svg>',
    search: '<svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="7" stroke="currentColor" stroke-width="1.8"/><path d="M21 21l-4.3-4.3" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>',
    plus: '<svg viewBox="0 0 24 24"><path d="M12 5v14M5 12h14" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/></svg>',
    copy: '<svg viewBox="0 0 24 24"><rect x="9" y="9" width="13" height="13" rx="2" stroke="currentColor" stroke-width="1.8"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" stroke="currentColor" stroke-width="1.8"/></svg>',
    download: '<svg viewBox="0 0 24 24"><path d="M12 3v12M8 11l4 4 4-4M4 17v2a2 2 0 002 2h12a2 2 0 002-2v-2" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    eye: '<svg viewBox="0 0 24 24"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" stroke="currentColor" stroke-width="1.8"/><circle cx="12" cy="12" r="3" stroke="currentColor" stroke-width="1.8"/></svg>',
    eyeOff: '<svg viewBox="0 0 24 24"><path d="M17.9 17.9A10.1 10.1 0 0112 20c-7 0-11-8-11-8a18.5 18.5 0 015.1-5.9M9.9 4.2A10.1 10.1 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-3.3 4.8M1 1l22 22" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>',
    trash: '<svg viewBox="0 0 24 24"><path d="M4 7h16M10 7V4h4v3M6 7l1 13a2 2 0 002 2h6a2 2 0 002-2l1-13" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>',
    back: '<svg viewBox="0 0 24 24"><path d="M15 6l-6 6 6 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    filter: '<svg viewBox="0 0 24 24"><path d="M4 4h16v2l-6 7v6l-4 2v-8L4 6V4z" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  };

  var currentFilter = 'all';
  var currentSort = 'updated';
  var currentCategory = null;
  var searchQuery = '';
  var selectedItemId = null;
  var detailPanelOpen = false;

  function getIcon(type) { return ICONS[type] || ICONS.note; }

  function getTypeLabel(typeId) {
    var t = ITEM_TYPES.find(function (x) { return x.id === typeId; });
    return t ? t.label : 'Item';
  }

  function formatDate(iso) {
    if (!iso) return '';
    return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
  }

  /* ---- Warning / Info cards ---- */

  function warningCard(text, extraClass) {
    return '<div class="vault-warning-card' + (extraClass ? ' ' + extraClass : '') + '">' +
      ICONS.alert +
      '<span>' + text + '</span></div>';
  }

  function infoCard(text) {
    return '<div class="vault-info-card">' + ICONS.info + '<span>' + text + '</span></div>';
  }

  /* ---- Onboarding screen (first-time setup) ---- */

  function renderOnboarding() {
    var container = $('#vaultContent');
    if (!container) return;
    container.innerHTML =
      '<div class="vault-auth-screen">' +
      '<div class="vault-auth-card">' +
      '<div class="vault-auth-card__icon">' + ICONS.shield + '</div>' +
      '<h1>Welcome to the Vault</h1>' +
      '<p class="text-secondary">Your private, encrypted workspace. Store sensitive information like passwords, API keys, secure notes, and more. Everything is encrypted locally before storage — nothing leaves your device.</p>' +
      warningCard('This is NOT an online account. Your Vault exists only on this device and browser. If you clear your browser data without exporting a backup, your Vault will be permanently lost.') +
      '<hr class="divider">' +
      '<h2 style="font-size:var(--text-md);text-align:center;">Create your local Vault account</h2>' +

      '<div class="field"><label for="vaultUsernameInput">Username <span class="text-tertiary">(local identifier only)</span></label>' +
      '<input id="vaultUsernameInput" class="input" type="text" placeholder="Choose a username" autocomplete="off">' +
      infoCard('Your username is only for identification inside the Vault. It is never sent anywhere.') +
      '</div>' +

      '<div class="field"><label for="vaultPasswordInput">Master Password</label>' +
      '<input id="vaultPasswordInput" class="input" type="password" placeholder="Choose a strong master password" autocomplete="new-password">' +
      '<div id="vaultPwStrength"></div>' +
      infoCard('Your Master Password is never stored in plaintext. It is used to derive an encryption key locally. No one — including the app developer — can view or recover it.') +
      '</div>' +

      '<div class="field"><label for="vaultPasswordConfirmInput">Confirm Master Password</label>' +
      '<input id="vaultPasswordConfirmInput" class="input" type="password" placeholder="Re-enter your master password" autocomplete="new-password">' +
      '</div>' +

      '<div id="vaultCreateError" class="text-danger" style="font-size:var(--text-sm);text-align:center;display:none;"></div>' +

      '<button id="vaultCreateAccountBtn" class="btn btn-primary">Create Vault Account</button>' +
      '<p class="text-tertiary" style="font-size:var(--text-xs);text-align:center;">By creating a Vault, you understand that the Master Password cannot be recovered. Store your Recovery Key somewhere safe.</p>' +
      '</div></div>';

    var pwInput = $('#vaultPasswordInput');
    var strengthDiv = $('#vaultPwStrength');
    if (pwInput && strengthDiv) {
      pwInput.addEventListener('input', function () {
        strengthDiv.innerHTML = renderPasswordStrength(pwInput.value);
      });
    }

    $('#vaultCreateAccountBtn').addEventListener('click', function () {
      handleCreateAccount();
    });

    $all('#vaultPasswordInput, #vaultPasswordConfirmInput, #vaultUsernameInput').forEach(function (inp) {
      inp.addEventListener('keydown', function (e) {
        if (e.key === 'Enter') handleCreateAccount();
      });
    });
  }

  function handleCreateAccount() {
    var username = $('#vaultUsernameInput').value.trim();
    var password = $('#vaultPasswordInput').value;
    var confirm = $('#vaultPasswordConfirmInput').value;
    var errorEl = $('#vaultCreateError');
    if (errorEl) errorEl.style.display = 'none';

    if (!username) { showError('Please choose a username.'); return; }
    if (password.length < 8) { showError('Master Password must be at least 8 characters.'); return; }
    if (password !== confirm) { showError('Passwords do not match.'); return; }

    var btn = $('#vaultCreateAccountBtn');
    btn.disabled = true;
    btn.textContent = 'Creating Vault\u2026';

    A.createAccount(username, password).then(function (result) {
      showRecoveryKey(result.recoveryKey);
    }).catch(function (err) {
      btn.disabled = false;
      btn.textContent = 'Create Vault Account';
      showError(err.message || 'Failed to create Vault. Is IndexedDB available?');
    });

    function showError(msg) {
      if (errorEl) { errorEl.textContent = msg; errorEl.style.display = 'block'; }
    }
  }

  /* ---- Recovery Key display (shown once after account creation) ---- */

  function showRecoveryKey(recoveryKey) {
    var container = $('#vaultContent');
    if (!container) return;
    container.innerHTML =
      '<div class="vault-auth-screen">' +
      '<div class="vault-auth-card">' +
      '<div class="vault-auth-card__icon">' + ICONS.shield + '</div>' +
      '<h1>Your Recovery Key</h1>' +
      warningCard('This key is the ONLY way to access your Vault if you forget your Master Password. Save it somewhere safe — offline, printed, or in a password manager. If you lose both your Master Password and this key, your Vault is permanently inaccessible.') +

      '<p style="font-size:var(--text-sm);text-align:center;">Your Recovery Key:</p>' +
      '<div class="vault-recovery-key-box" id="vaultRecoveryKeyDisplay">' + esc(recoveryKey) + '</div>' +

      '<div class="flex-row" style="justify-content:center;flex-wrap:wrap;gap:var(--space-2);">' +
      '<button id="vaultCopyRecoveryBtn" class="btn btn-secondary btn-sm">' + ICONS.copy + ' Copy</button>' +
      '<button id="vaultDownloadRecoveryBtn" class="btn btn-secondary btn-sm">' + ICONS.download + ' Download</button>' +
      '</div>' +

      '<div style="display:flex;align-items:flex-start;gap:var(--space-2);">' +
      '<input type="checkbox" id="vaultRecoveryConfirmCheck" style="margin-top:3px;">' +
      '<label for="vaultRecoveryConfirmCheck" style="font-size:var(--text-sm);color:var(--color-text-secondary);cursor:pointer;">I have saved my Recovery Key in a safe place. I understand that if I lose both my Master Password and Recovery Key, my Vault cannot be recovered.</label>' +
      '</div>' +

      '<button id="vaultRecoveryConfirmBtn" class="btn btn-primary" disabled>Continue to Vault</button>' +
      '</div></div>';

    $('#vaultCopyRecoveryBtn').addEventListener('click', function () {
      navigator.clipboard.writeText(recoveryKey).then(function () {
        App.Toast.show({ message: 'Recovery Key copied', type: 'success', duration: 2000 });
      }).catch(function () {
        var el = $('#vaultRecoveryKeyDisplay');
        if (el) {
          var range = document.createRange();
          range.selectNodeContents(el);
          var sel = window.getSelection();
          sel.removeAllRanges();
          sel.addRange(range);
        }
      });
    });

    $('#vaultDownloadRecoveryBtn').addEventListener('click', function () {
      var blob = new Blob(['Flow Vault Recovery Key\n\n' + recoveryKey + '\n\nKeep this key safe. It is the only way to recover your Vault if you forget your Master Password.'], { type: 'text/plain' });
      var url = URL.createObjectURL(blob);
      var a = document.createElement('a');
      a.href = url;
      a.download = 'flow-vault-recovery-key.txt';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    });

    $('#vaultRecoveryConfirmCheck').addEventListener('change', function () {
      $('#vaultRecoveryConfirmBtn').disabled = !this.checked;
    });

    $('#vaultRecoveryConfirmBtn').addEventListener('click', function () {
      renderUnlocked();
    });
  }

  /* ---- Unlock screen ---- */

  function renderUnlockScreen() {
    var container = $('#vaultContent');
    if (!container) return;
    container.innerHTML =
      '<div class="vault-auth-screen">' +
      '<div class="vault-auth-card">' +
      '<div class="vault-auth-card__icon">' + ICONS.lock + '</div>' +
      '<h1>Vault Locked</h1>' +
      '<p class="text-secondary">Enter your Master Password to unlock the Vault.</p>' +
      '<div class="field"><label for="vaultUnlockInput">Master Password</label>' +
      '<input id="vaultUnlockInput" class="input" type="password" placeholder="Enter your master password" autocomplete="current-password">' +
      '</div>' +
      '<div id="vaultUnlockError" style="font-size:var(--text-sm);text-align:center;color:var(--danger);display:none;"></div>' +
      '<button id="vaultUnlockBtn" class="btn btn-primary">Unlock Vault</button>' +
      '<button id="vaultForgotBtn" class="btn btn-ghost" style="font-size:var(--text-sm);">Forgot Password?</button>' +
      '</div></div>';

    $('#vaultUnlockBtn').addEventListener('click', function () { handleUnlock(); });
    $('#vaultForgotBtn').addEventListener('click', function () { renderForgotPassword(); });
    $('#vaultUnlockInput').addEventListener('keydown', function (e) {
      if (e.key === 'Enter') handleUnlock();
    });
    setTimeout(function () { var inp = $('#vaultUnlockInput'); if (inp) inp.focus(); }, 100);
  }

  function handleUnlock() {
    var password = $('#vaultUnlockInput').value;
    var errorEl = $('#vaultUnlockError');
    if (errorEl) errorEl.style.display = 'none';
    if (!password) { if (errorEl) { errorEl.textContent = 'Please enter your Master Password.'; errorEl.style.display = 'block'; } return; }

    var btn = $('#vaultUnlockBtn');
    btn.disabled = true;
    btn.textContent = 'Unlocking\u2026';

    A.unlock(password).then(function () {
      renderUnlocked();
    }).catch(function (err) {
      btn.disabled = false;
      btn.textContent = 'Unlock Vault';
      if (errorEl) { errorEl.textContent = 'Incorrect password or corrupted vault data.'; errorEl.style.display = 'block'; }
    });
  }

  /* ---- Forgot Password screen ---- */

  function renderForgotPassword() {
    var container = $('#vaultContent');
    if (!container) return;
    container.innerHTML =
      '<div class="vault-auth-screen">' +
      '<div class="vault-auth-card">' +
      '<h1>Recover Vault</h1>' +
      warningCard('If you have lost both your Master Password and Recovery Key, your encrypted Vault is permanently inaccessible. The only option would be to create a new empty Vault.') +
      '<p class="text-secondary" style="font-size:var(--text-sm);">Enter your username and Recovery Key to reset your Master Password.</p>' +
      '<div class="field"><label for="vaultRecoverUserInput">Username</label>' +
      '<input id="vaultRecoverUserInput" class="input" type="text" placeholder="Your vault username">' +
      '</div>' +
      '<div class="field"><label for="vaultRecoverKeyInput">Recovery Key</label>' +
      '<input id="vaultRecoverKeyInput" class="input" type="text" placeholder="Paste your recovery key" autocomplete="off">' +
      '</div>' +
      '<div id="vaultRecoverError" style="font-size:var(--text-sm);text-align:center;color:var(--danger);display:none;"></div>' +
      '<button id="vaultRecoverVerifyBtn" class="btn btn-primary">Verify Recovery Key</button>' +
      '<button id="vaultRecoverBackBtn" class="btn btn-ghost" style="font-size:var(--text-sm);">Back to unlock</button>' +
      '</div></div>';

    $('#vaultRecoverVerifyBtn').addEventListener('click', function () { handleVerifyRecovery(); });
    $('#vaultRecoverBackBtn').addEventListener('click', function () { renderUnlockScreen(); });
    $all('#vaultRecoverUserInput, #vaultRecoverKeyInput').forEach(function (inp) {
      inp.addEventListener('keydown', function (e) { if (e.key === 'Enter') handleVerifyRecovery(); });
    });
  }

  function handleVerifyRecovery() {
    var username = $('#vaultRecoverUserInput').value.trim();
    var recoveryKey = $('#vaultRecoverKeyInput').value.trim();
    var errorEl = $('#vaultRecoverError');
    if (errorEl) errorEl.style.display = 'none';

    if (!username || !recoveryKey) { if (errorEl) { errorEl.textContent = 'Please enter both username and recovery key.'; errorEl.style.display = 'block'; } return; }

    var btn = $('#vaultRecoverVerifyBtn');
    btn.disabled = true;
    btn.textContent = 'Verifying\u2026';

    A.verifyRecoveryKey(recoveryKey).then(function () {
      renderSetNewPassword(username, recoveryKey);
    }).catch(function () {
      btn.disabled = false;
      btn.textContent = 'Verify Recovery Key';
      if (errorEl) { errorEl.textContent = 'Invalid username or recovery key. Please try again.'; errorEl.style.display = 'block'; }
    });
  }

  function renderSetNewPassword(username, recoveryKey) {
    var container = $('#vaultContent');
    if (!container) return;
    container.innerHTML =
      '<div class="vault-auth-screen">' +
      '<div class="vault-auth-card">' +
      '<div class="vault-auth-card__icon">' + ICONS.shield + '</div>' +
      '<h1>Set New Password</h1>' +
      warningCard('Your Recovery Key has been verified. Choose a new Master Password to secure your Vault.') +
      '<div class="field"><label for="vaultNewPwInput">New Master Password</label>' +
      '<input id="vaultNewPwInput" class="input" type="password" placeholder="Choose a new master password" autocomplete="new-password">' +
      '<div id="vaultNewPwStrength"></div>' +
      '</div>' +
      '<div class="field"><label for="vaultNewPwConfirmInput">Confirm New Password</label>' +
      '<input id="vaultNewPwConfirmInput" class="input" type="password" placeholder="Re-enter new password" autocomplete="new-password">' +
      '</div>' +
      '<div id="vaultNewPwError" style="font-size:var(--text-sm);text-align:center;color:var(--danger);display:none;"></div>' +
      '<button id="vaultNewPwSaveBtn" class="btn btn-primary">Set New Password &amp; Unlock</button>' +
      '</div></div>';

    $('#vaultNewPwInput').addEventListener('input', function () {
      var sd = $('#vaultNewPwStrength');
      if (sd) sd.innerHTML = renderPasswordStrength(this.value);
    });

    $('#vaultNewPwSaveBtn').addEventListener('click', function () {
      var pw = $('#vaultNewPwInput').value;
      var confirm = $('#vaultNewPwConfirmInput').value;
      var errEl = $('#vaultNewPwError');
      if (errEl) errEl.style.display = 'none';
      if (pw.length < 8) { if (errEl) { errEl.textContent = 'Password must be at least 8 characters.'; errEl.style.display = 'block'; } return; }
      if (pw !== confirm) { if (errEl) { errEl.textContent = 'Passwords do not match.'; errEl.style.display = 'block'; } return; }

      var btn = $('#vaultNewPwSaveBtn');
      btn.disabled = true;
      btn.textContent = 'Saving\u2026';

      A.recover(username, recoveryKey, pw).then(function () {
        App.Toast.show({ message: 'Vault recovered successfully', type: 'success' });
        renderUnlocked();
      }).catch(function (err) {
        btn.disabled = false;
        btn.textContent = 'Set New Password & Unlock';
        if (errEl) { errEl.textContent = err.message || 'Recovery failed. Please try again.'; errEl.style.display = 'block'; }
      });
    });
  }

  /* ---- Password strength indicator ---- */

  function renderPasswordStrength(password) {
    var score = 0;
    if (password.length >= 8) score++;
    if (password.length >= 12) score++;
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score++;
    if (/\d/.test(password)) score++;
    if (/[^a-zA-Z0-9]/.test(password)) score++;

    var bars = '';
    for (var i = 0; i < 5; i++) {
      bars += '<div class="vault-pw-strength__bar' + (i < score ? ' is-active' : '') + '"></div>';
    }

    var label = '';
    if (score <= 1) label = '<div class="vault-pw-label weak">Weak</div>';
    else if (score <= 2) label = '<div class="vault-pw-label fair">Fair</div>';
    else if (score <= 3) label = '<div class="vault-pw-label fair">Good</div>';
    else label = '<div class="vault-pw-label strong">Strong</div>';

    return '<div class="vault-pw-strength">' + bars + '</div>' + label;
  }

  /* ---- Main unlocked vault view ---- */

  function renderUnlocked() {
    var container = $('#vaultContent');
    if (!container) return;
    searchQuery = '';
    currentFilter = 'all';
    currentCategory = null;
    currentSort = 'updated';
    selectedItemId = null;
    detailPanelOpen = false;
    var items = A.getItems();
    var username = A.getUsername();

    container.innerHTML =
      '<div class="vault-layout">' +
      '  <div class="vault-sidebar-section">' +
      '    <div style="display:flex;align-items:center;justify-content:space-between;padding:var(--space-1) var(--space-2);">' +
      '      <span class="vault-username-badge">' + esc(username || 'User') + '</span>' +
      '      <button id="vaultLockBtn" class="btn-icon" title="Lock Vault" style="width:28px;height:28px;">' + ICONS.lock + '</button>' +
      '    </div>' +
      '    <div class="vault-sidebar-section__title">Categories</div>' +
      '    <button class="vault-sidebar-item is-active" data-vcat="all"><svg viewBox="0 0 24 24"><path d="M5 13l4 4L19 7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>All items<span class="count" id="vaultCountAll">' + items.length + '</span></button>' +
      '    <button class="vault-sidebar-item" data-vcat="favorites">' + ICONS.star + 'Favorites<span class="count" id="vaultCountFav">' + items.filter(function (i) { return i.favorite; }).length + '</span></button>' +
      '    <div id="vaultCategoryList"></div>' +
      '    <div style="margin-top:auto;padding-top:var(--space-3);border-top:1px solid var(--color-border);display:flex;flex-direction:column;gap:2px;">' +
      '      <button id="vaultSettingsBtn" class="vault-sidebar-item" style="font-size:var(--text-xs);">Settings</button>' +
      '      <button id="vaultExportBtn" class="vault-sidebar-item" style="font-size:var(--text-xs);">' + ICONS.download + ' Export backup</button>' +
      '      <button id="vaultImportBtn" class="vault-sidebar-item" style="font-size:var(--text-xs);">Import backup</button>' +
      '    </div>' +
      '  </div>' +
      '  <div class="vault-main-content">' +
      '    <div class="vault-items-header">' +
      '      <h2 id="vaultViewTitle">All items</h2>' +
      '      <div class="vault-items-search">' + ICONS.search + '<input id="vaultSearchInput" type="text" placeholder="Search vault\u2026">' +
      '      </div>' +
      '      <select id="vaultSortSelect" class="vault-sort-select">' +
      '        <option value="updated">Recently updated</option>' +
      '        <option value="created">Recently created</option>' +
      '        <option value="title">Title A-Z</option>' +
      '        <option value="type">Type</option>' +
      '      </select>' +
      '      <button id="vaultAddItemBtn" class="btn btn-primary btn-sm">' + ICONS.plus + ' Add item</button>' +
      '    </div>' +
      '    <div class="vault-filters-bar" id="vaultTypeFilters"></div>' +
      '    <div id="vaultItemsGrid" class="vault-items-grid"></div>' +
      '  </div>' +
      '  <div class="vault-detail-panel" id="vaultDetailPanel"></div>' +
      '</div>';

    $('#vaultLockBtn').addEventListener('click', function () {
      A.lock();
      App.Vault.resetInactivityTimer();
      renderUnlockScreen();
    });

    $('#vaultSearchInput').addEventListener('input', function () {
      searchQuery = this.value;
      renderItems();
    });

    $('#vaultSortSelect').addEventListener('change', function () {
      currentSort = this.value;
      renderItems();
    });

    $('#vaultAddItemBtn').addEventListener('click', function () { renderItemEditor(null); });

    $('#vaultExportBtn').addEventListener('click', handleExport);
    $('#vaultImportBtn').addEventListener('click', handleImport);
    $('#vaultSettingsBtn').addEventListener('click', renderSettings);

    renderTypeFilters();
    renderCategoryList(items);
    renderItems();
    wireCategoryNav();
  }

  function wireCategoryNav() {
    $all('.vault-sidebar-item[data-vcat]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        $all('.vault-sidebar-item[data-vcat]').forEach(function (b) { b.classList.remove('is-active'); });
        btn.classList.add('is-active');
        currentCategory = btn.dataset.vcat === 'all' ? null : btn.dataset.vcat;
        renderItems();
      });
    });
  }

  function renderTypeFilters() {
    var container = $('#vaultTypeFilters');
    if (!container) return;
    var html = '<button class="vault-filter-chip is-active" data-vtype="all">All</button>';
    ITEM_TYPES.forEach(function (t) {
      html += '<button class="vault-filter-chip" data-vtype="' + t.id + '">' + t.label + '</button>';
    });
    container.innerHTML = html;

    $all('.vault-filter-chip').forEach(function (chip) {
      chip.addEventListener('click', function () {
        $all('.vault-filter-chip').forEach(function (c) { c.classList.remove('is-active'); });
        chip.classList.add('is-active');
        currentFilter = chip.dataset.vtype;
        renderItems();
      });
    });
  }

  function renderCategoryList(items) {
    var container = $('#vaultCategoryList');
    if (!container) return;
    var cats = {};
    items.forEach(function (i) {
      var c = i.category || 'Uncategorized';
      cats[c] = (cats[c] || 0) + 1;
    });
    var html = '';
    Object.keys(cats).sort().forEach(function (cat) {
      var active = currentCategory === cat ? ' is-active' : '';
      html += '<button class="vault-sidebar-item' + active + '" data-vcat="' + esc(cat) + '">' +
        '<svg viewBox="0 0 24 24"><path d="M3 8l9-4 9 4-9 4-9-4z" stroke="currentColor" stroke-width="1.8"/><path d="M3 12l9 4 9-4M3 16l9 4 9-4" stroke="currentColor" stroke-width="1.8"/></svg>' +
        esc(cat) + '<span class="count">' + cats[cat] + '</span></button>';
    });
    container.innerHTML = html;
    $all(container.querySelectorAll('[data-vcat]')).forEach(function (btn) {
      btn.addEventListener('click', function () {
        $all('.vault-sidebar-item[data-vcat]').forEach(function (b) { b.classList.remove('is-active'); });
        btn.classList.add('is-active');
        currentCategory = btn.dataset.vcat;
        renderItems();
      });
    });
  }

  function renderItems() {
    var grid = $('#vaultItemsGrid');
    var titleEl = $('#vaultViewTitle');
    if (!grid) return;

    var items = A.getItems();
    var filtered = items.slice();

    if (currentCategory && currentCategory !== 'all') {
      filtered = filtered.filter(function (i) { return (i.category || 'Uncategorized') === currentCategory; });
    }

    if (currentFilter !== 'all') {
      filtered = filtered.filter(function (i) { return i.type === currentFilter; });
    }

    if (searchQuery) {
      var q = searchQuery.toLowerCase();
      filtered = filtered.filter(function (i) {
        return (i.title && i.title.toLowerCase().includes(q)) ||
          (i.description && i.description.toLowerCase().includes(q)) ||
          (i.tags && i.tags.some(function (t) { return t.toLowerCase().includes(q); })) ||
          (i.fields && i.fields.some(function (f) { return f.value && f.value.toLowerCase().includes(q); }));
      });
    }

    var favorites = filtered.filter(function (i) { return i.favorite; });
    var others = filtered.filter(function (i) { return !i.favorite; });

    if (currentSort === 'title') {
      var sorter = function (a, b) { return (a.title || '').localeCompare(b.title || ''); };
      favorites.sort(sorter);
      others.sort(sorter);
    } else if (currentSort === 'created') {
      var sorter2 = function (a, b) { return (b.createdAt || '').localeCompare(a.createdAt || ''); };
      favorites.sort(sorter2);
      others.sort(sorter2);
    } else if (currentSort === 'type') {
      var sorter3 = function (a, b) { return (a.type || '').localeCompare(b.type || ''); };
      favorites.sort(sorter3);
      others.sort(sorter3);
    } else {
      var sorter4 = function (a, b) { return (b.updatedAt || '').localeCompare(a.updatedAt || ''); };
      favorites.sort(sorter4);
      others.sort(sorter4);
    }

    var sorted = favorites.concat(others);
    if (titleEl) titleEl.textContent = currentFilter !== 'all' ? getTypeLabel(currentFilter) : (currentCategory || 'All items');

    if (sorted.length === 0) {
      grid.innerHTML = '<div class="vault-empty"><h3>No items found</h3><p>' +
        (searchQuery ? 'Try a different search term.' : 'Add your first item to get started.') +
        '</p></div>';
      return;
    }

    grid.innerHTML = sorted.map(function (item) {
      var fieldsHtml = '';
      if (item.fields && item.fields.length > 0) {
        var firstFields = item.fields.slice(0, 2);
        fieldsHtml = firstFields.map(function (f) {
          var val = f.hidden ? '\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022' : esc(String(f.value || '').substring(0, 40));
          return '<div class="vault-item-card__field"><span class="vault-item-card__field-label">' + esc(f.label) + ':</span> ' + val + '</div>';
        }).join('');
      }

      var tagsHtml = '';
      if (item.tags && item.tags.length > 0) {
        tagsHtml = '<div class="vault-item-card__tags">' +
          item.tags.slice(0, 3).map(function (t) { return '<span class="vault-item-card__tag">' + esc(t) + '</span>'; }).join('') +
          (item.tags.length > 3 ? '<span class="vault-item-card__tag">+' + (item.tags.length - 3) + '</span>' : '') +
          '</div>';
      }

      var activeClass = selectedItemId === item.id ? ' is-active' : '';
      var favClass = item.favorite ? ' is-active' : '';

      return '<div class="vault-item-card' + activeClass + (item.favorite ? ' is-favorite' : '') + '" data-vid="' + item.id + '">' +
        '<div class="vault-item-card__header">' +
        '<div class="vault-item-card__type-icon">' + getIcon(ITEM_TYPES.find(function (t) { return t.id === item.type; }) ? ITEM_TYPES.find(function (t) { return t.id === item.type; }).icon : 'note') + '</div>' +
        '<span class="vault-item-card__title">' + esc(item.title || 'Untitled') + '</span>' +
        '<button class="vault-item-card__favorite' + favClass + '" data-vfav="' + item.id + '" title="Toggle favorite">' + ICONS.star + '</button>' +
        '</div>' +
        (fieldsHtml ? '<div class="vault-item-card__fields">' + fieldsHtml + '</div>' : '') +
        tagsHtml +
        '<div class="vault-item-card__footer">' +
        '<span class="vault-item-card__date">' + formatDate(item.updatedAt) + '</span>' +
        '<span style="font-size:10px;color:var(--color-text-tertiary);">' + getTypeLabel(item.type) + '</span>' +
        '</div>' +
        '</div>';
    }).join('');

    $all('.vault-item-card').forEach(function (card) {
      card.addEventListener('click', function () {
        var id = card.dataset.vid;
        selectedItemId = id;
        renderItemDetail(id);
        $all('.vault-item-card').forEach(function (c) { c.classList.remove('is-active'); });
        card.classList.add('is-active');
      });
    });

    $all('[data-vfav]').forEach(function (btn) {
      btn.addEventListener('click', function (e) {
        e.stopPropagation();
        var id = btn.dataset.vfav;
        var items = A.getItems();
        var item = items.find(function (i) { return i.id === id; });
        if (item) {
          item.favorite = !item.favorite;
          A.saveItems().then(function () { renderItems(); });
        }
      });
    });
  }

  /* ---- Item detail panel ---- */

  function renderItemDetail(id) {
    var panel = $('#vaultDetailPanel');
    var items = A.getItems();
    var item = items.find(function (i) { return i.id === id; });
    if (!panel || !item) return;

    detailPanelOpen = true;
    panel.classList.add('is-visible');

    var fieldsHtml = '';
    if (item.fields) {
      fieldsHtml = item.fields.map(function (f, idx) {
        var hidden = f.hidden;
        return '<div class="vault-detail-field">' +
          '<label>' + esc(f.label) + '</label>' +
          '<div class="vault-detail-field__value' + (hidden ? ' is-hidden" id="vdf_' + idx + '" data-revealed="false"' : '"') + '>' +
          '<span id="vdfv_' + idx + '">' + (hidden ? '\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022' : esc(String(f.value))) + '</span>' +
          '<button class="vault-detail-field__copy" data-vcopy="' + idx + '" title="Copy">' + ICONS.copy + '</button>' +
          (hidden ? '<button class="vault-detail-field__copy" data-vreveal="' + idx + '" title="Reveal">' + ICONS.eye + '</button>' : '') +
          '</div></div>';
      }).join('');
    }

    panel.innerHTML =
      '<div class="vault-detail-panel__header">' +
      '<button class="vault-detail-panel__back" id="vaultDetailBackBtn">' + ICONS.back + ' Back</button>' +
      '<span class="vault-detail-panel__title">' + esc(item.title) + '</span>' +
      '</div>' +
      '<div style="display:flex;gap:var(--space-2);align-items:center;flex-wrap:wrap;">' +
      '<span class="vault-filter-chip is-active" style="cursor:default;">' + getTypeLabel(item.type) + '</span>' +
      (item.category ? '<span class="vault-filter-chip" style="cursor:default;">' + esc(item.category) + '</span>' : '') +
      '</div>' +
      (item.description ? '<div style="font-size:var(--text-sm);color:var(--color-text-secondary);line-height:var(--leading-relaxed);">' + App.Helpers.renderMiniMarkdown(item.description) + '</div>' : '') +
      (fieldsHtml ? '<div style="display:flex;flex-direction:column;gap:var(--space-3);">' + fieldsHtml + '</div>' : '') +
      (item.tags && item.tags.length > 0 ? '<div><label style="font-size:var(--text-xs);font-weight:700;text-transform:uppercase;letter-spacing:0.04em;color:var(--color-text-tertiary);">Tags</label><div class="vault-item-card__tags">' +
        item.tags.map(function (t) { return '<span class="vault-item-card__tag">' + esc(t) + '</span>'; }).join('') + '</div></div>' : '') +
      '<div style="font-size:var(--text-xs);color:var(--color-text-tertiary);">' +
      'Created: ' + formatDate(item.createdAt) + ' &middot; Modified: ' + formatDate(item.updatedAt) +
      '</div>' +
      '<div class="vault-detail-actions">' +
      '<button id="vaultEditItemBtn" class="btn btn-secondary btn-sm">Edit</button>' +
      '<button id="vaultDeleteItemBtn" class="btn btn-danger btn-sm">' + ICONS.trash + ' Delete</button>' +
      '</div>';

    $('#vaultDetailBackBtn').addEventListener('click', function () {
      panel.classList.remove('is-visible');
      detailPanelOpen = false;
      selectedItemId = null;
      $all('.vault-item-card').forEach(function (c) { c.classList.remove('is-active'); });
    });

    $('#vaultEditItemBtn').addEventListener('click', function () { renderItemEditor(item); });
    $('#vaultDeleteItemBtn').addEventListener('click', function () { handleDeleteItem(item); });

    $all('[data-vcopy]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var idx = parseInt(btn.dataset.vcopy);
        var field = item.fields[idx];
        if (field) {
          navigator.clipboard.writeText(String(field.value)).then(function () {
            App.Toast.show({ message: 'Copied to clipboard', type: 'success', duration: 1500 });
          });
        }
      });
    });

    $all('[data-vreveal]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var idx = parseInt(btn.dataset.vreveal);
        var field = item.fields[idx];
        var span = $('#vdfv_' + idx);
        var container = $('#vdf_' + idx);
        if (span && container) {
          var revealed = container.dataset.revealed === 'true';
          if (revealed) {
            span.textContent = '\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022';
            container.dataset.revealed = 'false';
            btn.innerHTML = ICONS.eye;
          } else {
            span.textContent = String(field.value);
            container.dataset.revealed = 'true';
            btn.innerHTML = ICONS.eyeOff;
          }
        }
      });
    });
  }

  /* ---- Item editor modal ---- */

  function renderItemEditor(item) {
    var isNew = !item;
    var modalOverlay = el('div', { class: 'modal-overlay is-open', id: 'vaultItemModal' });
    var modal = el('div', { class: 'modal modal--lg', role: 'dialog', 'aria-modal': 'true', 'aria-labelledby': 'vaultItemModalTitle' });
    var titleText = isNew ? 'Add Item' : 'Edit Item';

    var typeOptions = ITEM_TYPES.map(function (t) {
      return '<option value="' + t.id + '"' + ((item && item.type === t.id) ? ' selected' : '') + '>' + t.label + '</option>';
    }).join('');

    var fieldsHtml = '';
    if (item && item.fields) {
      fieldsHtml = item.fields.map(function (f, idx) {
        return '<div class="field-row" data-vfield="' + idx + '">' +
          '<input class="input" type="text" placeholder="Label" value="' + esc(f.label) + '" style="flex:0 0 120px;">' +
          '<input class="input" type="text" placeholder="Value" value="' + esc(f.value) + '" style="flex:1;">' +
          '<label class="checkbox-row" style="white-space:nowrap;flex-shrink:0;"><input type="checkbox" class="vfield-hidden"' + (f.hidden ? ' checked' : '') + '> Hidden</label>' +
          '<button type="button" class="btn-icon vfield-remove" style="color:var(--danger);" title="Remove field">' + ICONS.trash + '</button>' +
          '</div>';
      }).join('');
    }

    var tagsValue = item && item.tags ? item.tags.join(', ') : '';
    var categories = getCategories();

    modal.innerHTML =
      '<div class="modal__handle"></div>' +
      '<div class="modal__header"><h2 id="vaultItemModalTitle">' + titleText + '</h2><button class="btn-icon vaultItemModalClose" aria-label="Close">' +
      '<svg viewBox="0 0 24 24" fill="none"><path d="M6 6l12 12M18 6L6 18" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/></svg></button></div>' +
      '<div class="modal__body">' +
      '<div class="field"><label>Type</label><select id="vitemType" class="select">' + typeOptions + '</select></div>' +
      '<div class="field"><label>Title</label><input id="vitemTitle" class="input" type="text" placeholder="Item title" value="' + esc(item ? item.title : '') + '"></div>' +
      '<div class="field"><label>Category</label><select id="vitemCategory" class="select"><option value="">None</option>' +
        categories.map(function (c) { return '<option value="' + esc(c) + '"' + ((item && item.category === c) ? ' selected' : '') + '>' + esc(c) + '</option>'; }).join('') +
        '<option value="__new__">+ New category...\u2003</option></select></div>' +
      '<div id="vitemNewCatField" class="field" hidden><input id="vitemNewCatInput" class="input" type="text" placeholder="New category name"></div>' +
      '<div class="field"><label>Description <span class="text-tertiary">(markdown supported)</span></label>' +
      '<textarea id="vitemDesc" class="textarea" placeholder="Optional description" style="min-height:60px;">' + esc(item ? item.description : '') + '</textarea></div>' +
      '<div class="field"><label>Fields</label>' +
      '<div id="vitemFields">' + (fieldsHtml || '') + '</div>' +
      '<button id="vitemAddFieldBtn" type="button" class="btn btn-secondary btn-sm" style="margin-top:6px;">+ Add field</button>' +
      '</div>' +
      '<div class="field"><label>Tags <span class="text-tertiary">(comma separated)</span></label>' +
      '<input id="vitemTags" class="input" type="text" placeholder="tag1, tag2" value="' + esc(tagsValue) + '"></div>' +
      '</div>' +
      '<div class="modal__footer">' +
      '<button class="btn btn-secondary vaultItemModalClose">Cancel</button>' +
      '<button id="vitemSaveBtn" class="btn btn-primary">' + (isNew ? 'Add Item' : 'Save Changes') + '</button>' +
      '</div>';

    modalOverlay.appendChild(modal);
    document.body.appendChild(modalOverlay);

    $all('.vaultItemModalClose').forEach(function (btn) {
      btn.addEventListener('click', function () { modalOverlay.remove(); });
    });

    modalOverlay.addEventListener('click', function (e) {
      if (e.target === modalOverlay) modalOverlay.remove();
    });

    $('#vitemCategory').addEventListener('change', function () {
      var ncf = $('#vitemNewCatField');
      if (ncf) ncf.hidden = this.value !== '__new__';
    });

    $('#vitemAddFieldBtn').addEventListener('click', function () {
      var container = $('#vitemFields');
      if (!container) return;
      var idx = container.children.length;
      var row = el('div', { class: 'field-row', dataset: { vfield: idx } });
      row.innerHTML = '<input class="input" type="text" placeholder="Label" style="flex:0 0 120px;">' +
        '<input class="input" type="text" placeholder="Value" style="flex:1;">' +
        '<label class="checkbox-row" style="white-space:nowrap;flex-shrink:0;"><input type="checkbox" class="vfield-hidden"> Hidden</label>' +
        '<button type="button" class="btn-icon vfield-remove" style="color:var(--danger);" title="Remove field">' + ICONS.trash + '</button>';
      row.querySelector('.vfield-remove').addEventListener('click', function () { row.remove(); });
      container.appendChild(row);
    });

    $all('.vfield-remove').forEach(function (btn) {
      btn.addEventListener('click', function () { btn.closest('.field-row').remove(); });
    });

    $('#vitemSaveBtn').addEventListener('click', function () {
      var type = $('#vitemType').value;
      var title = $('#vitemTitle').value.trim();
      var category = $('#vitemCategory').value;
      var newCat = $('#vitemNewCatInput') ? $('#vitemNewCatInput').value.trim() : '';
      var desc = $('#vitemDesc').value.trim();
      var tagsStr = $('#vitemTags').value;

      if (category === '__new__' && newCat) category = newCat;
      if (category === '__new__') category = '';

      if (!title) { App.Toast.show({ message: 'Please enter a title', type: 'danger' }); return; }

      var fields = [];
      $all('#vitemFields .field-row').forEach(function (row) {
        var inputs = row.querySelectorAll('input');
        if (inputs.length >= 2) {
          var label = inputs[0].value.trim();
          var value = inputs[1].value.trim();
          if (label || value) {
            var hidden = row.querySelector('.vfield-hidden') ? row.querySelector('.vfield-hidden').checked : false;
            fields.push({ label: label || 'Field', value: value, hidden: hidden });
          }
        }
      });

      var tags = tagsStr.split(',').map(function (t) { return t.trim(); }).filter(Boolean);
      var now = new Date().toISOString();
      var items = A.getItems();

      if (isNew) {
        var newItem = {
          id: App.Helpers.uuid(),
          type: type,
          title: title,
          category: category,
          description: desc,
          fields: fields,
          tags: tags,
          favorite: false,
          createdAt: now,
          updatedAt: now,
        };
        items.unshift(newItem);
      } else {
        Object.assign(item, {
          type: type,
          title: title,
          category: category,
          description: desc,
          fields: fields,
          tags: tags,
          updatedAt: now,
        });
      }

      A.setItems(items);
      A.saveItems().then(function () {
        modalOverlay.remove();
        renderItems();
        if (!isNew && detailPanelOpen && item) renderItemDetail(item.id);
        App.Toast.show({ message: isNew ? 'Item added' : 'Item updated', type: 'success', duration: 2000 });
      }).catch(function (err) {
        App.Toast.show({ message: 'Failed to save: ' + err.message, type: 'danger' });
      });
    });

    App.Helpers.trapFocus(modal);
  }

  /* ---- Delete item ---- */

  function handleDeleteItem(item) {
    if (!window.confirm('Delete "' + item.title + '"? This cannot be undone.')) return;
    var items = A.getItems();
    A.setItems(items.filter(function (i) { return i.id !== item.id; }));
    A.saveItems().then(function () {
      var panel = $('#vaultDetailPanel');
      if (panel) { panel.classList.remove('is-visible'); detailPanelOpen = false; }
      selectedItemId = null;
      renderItems();
      App.Toast.show({ message: 'Item deleted', type: 'info', duration: 2000 });
    });
  }

  /* ---- Password generator modal ---- */

  function openPasswordGenerator(callback) {
    var overlay = el('div', { class: 'modal-overlay is-open', id: 'vaultPwGenModal' });
    var charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+-=[]{}|;:,.<>?';
    var length = 24;

    function generate() {
      var len = parseInt(($('#vpgLength') || {}).value || '24');
      var useUpper = ($('#vpgUpper') || {}).checked;
      var useLower = ($('#vpgLower') || {}).checked;
      var useDigits = ($('#vpgDigits') || {}).checked;
      var useSymbols = ($('#vpgSymbols') || {}).checked;
      var chars = '';
      if (useUpper) chars += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
      if (useLower) chars += 'abcdefghijklmnopqrstuvwxyz';
      if (useDigits) chars += '0123456789';
      if (useSymbols) chars += '!@#$%^&*()_+-=[]{}|;:,.<>?';
      if (!chars) chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';

      var result = '';
      var array = new Uint8Array(len);
      crypto.getRandomValues(array);
      for (var i = 0; i < len; i++) {
        result += chars[array[i] % chars.length];
      }
      var output = $('#vpgOutput');
      if (output) output.value = result;
      var strength = $('#vpgStrength');
      if (strength) {
        var score = 0;
        if (len >= 12) score++;
        if (len >= 18) score++;
        if (useUpper && useLower) score++;
        if (useDigits) score++;
        if (useSymbols) score++;
        var bars = '';
        for (var j = 0; j < 5; j++) bars += '<div class="vault-pw-strength__bar' + (j < score ? ' is-active' : '') + '"></div>';
        var lbl = score <= 1 ? 'Weak' : score <= 2 ? 'Fair' : score <= 3 ? 'Good' : 'Strong';
        strength.innerHTML = '<div class="vault-pw-strength">' + bars + '</div><div class="vault-pw-label ' + lbl.toLowerCase() + '">' + lbl + '</div>';
      }
    }

    overlay.innerHTML =
      '<div class="modal modal--sm" role="dialog" aria-modal="true" aria-label="Password Generator">' +
      '<div class="modal__header"><h2>Password Generator</h2><button class="btn-icon vaultPwGenClose" aria-label="Close"><svg viewBox="0 0 24 24" fill="none"><path d="M6 6l12 12M18 6L6 18" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/></svg></button></div>' +
      '<div class="modal__body">' +
      '<div class="vault-pw-generator">' +
      '<div class="vault-pw-generator__output"><input id="vpgOutput" type="text" readonly value=""><button id="vpgCopyBtn" class="btn-icon" title="Copy">' + ICONS.copy + '</button><button id="vpgRegenBtn" class="btn-icon" title="Generate new">' + ICONS.recovery + '</button></div>' +
      '<div id="vpgStrength"></div>' +
      '<div class="vault-pw-generator__options">' +
      '<label>Length: <input id="vpgLength" type="number" value="' + length + '" min="4" max="128"></label>' +
      '<label><input id="vpgUpper" type="checkbox" checked> A-Z</label>' +
      '<label><input id="vpgLower" type="checkbox" checked> a-z</label>' +
      '<label><input id="vpgDigits" type="checkbox" checked> 0-9</label>' +
      '<label style="grid-column:1/-1;"><input id="vpgSymbols" type="checkbox" checked> !@#$%^&*</label>' +
      '</div></div></div>' +
      '<div class="modal__footer">' +
      '<button class="btn btn-secondary vaultPwGenClose">Cancel</button>' +
      '<button id="vpgUseBtn" class="btn btn-primary">Use Password</button>' +
      '</div></div>';

    document.body.appendChild(overlay);
    generate();

    $all('.vaultPwGenClose').forEach(function (btn) {
      btn.addEventListener('click', function () { overlay.remove(); });
    });
    overlay.addEventListener('click', function (e) { if (e.target === overlay) overlay.remove(); });

    $('#vpgRegenBtn').addEventListener('click', generate);
    $('#vpgLength').addEventListener('input', generate);
    $('#vpgUpper').addEventListener('change', generate);
    $('#vpgLower').addEventListener('change', generate);
    $('#vpgDigits').addEventListener('change', generate);
    $('#vpgSymbols').addEventListener('change', generate);

    $('#vpgCopyBtn').addEventListener('click', function () {
      var output = $('#vpgOutput');
      if (output) {
        output.select();
        navigator.clipboard.writeText(output.value).then(function () {
          App.Toast.show({ message: 'Password copied', type: 'success', duration: 1500 });
        });
      }
    });

    $('#vpgUseBtn').addEventListener('click', function () {
      var output = $('#vpgOutput');
      if (output && callback) {
        callback(output.value);
        overlay.remove();
      }
    });
  }

  /* ---- Import / Export ---- */

  function handleExport() {
    var btn = $('#vaultExportBtn');
    if (btn) { btn.disabled = true; btn.textContent = 'Exporting\u2026'; }
    A.exportBackup().then(function (backupStr) {
      var blob = new Blob([backupStr], { type: 'application/json' });
      var url = URL.createObjectURL(blob);
      var a = document.createElement('a');
      a.href = url;
      a.download = 'flow-vault-backup-' + new Date().toISOString().slice(0, 10) + '.json';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      App.Toast.show({ message: 'Encrypted backup exported', type: 'success', duration: 3000 });
      if (btn) { btn.disabled = false; btn.textContent = 'Export backup'; }
    }).catch(function (err) {
      App.Toast.show({ message: 'Export failed: ' + err.message, type: 'danger' });
      if (btn) { btn.disabled = false; btn.textContent = 'Export backup'; }
    });
  }

  function handleImport() {
    var input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.addEventListener('change', function () {
      var file = input.files[0];
      if (!file) return;
      var reader = new FileReader();
      reader.onload = function (e) {
        if (!window.confirm('Importing a backup will replace your current Vault entirely. Continue?')) return;
        A.importBackup(e.target.result).then(function () {
          App.Toast.show({ message: 'Vault backup imported. Unlock with your password.', type: 'success', duration: 4000 });
          renderUnlockScreen();
        }).catch(function (err) {
          App.Toast.show({ message: 'Import failed: ' + err.message, type: 'danger' });
        });
      };
      reader.readAsText(file);
    });
    input.click();
  }

  /* ---- Settings modal ---- */

  function renderSettings() {
    A.getAutoLock().then(function (autoLock) {
      var overlay = el('div', { class: 'modal-overlay is-open', id: 'vaultSettingsModal' });
      overlay.innerHTML =
        '<div class="modal modal--sm" role="dialog" aria-modal="true" aria-labelledby="vaultSettingsTitle">' +
        '<div class="modal__header"><h2 id="vaultSettingsTitle">Vault Settings</h2><button class="btn-icon vaultSettingsClose" aria-label="Close"><svg viewBox="0 0 24 24" fill="none"><path d="M6 6l12 12M18 6L6 18" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/></svg></button></div>' +
        '<div class="modal__body">' +
        '<div class="field"><label>Auto-lock after inactivity (minutes)</label>' +
        '<input id="vaultAutoLockInput" class="input" type="number" min="1" max="120" value="' + autoLock + '">' +
        '</div>' +
        '<hr class="divider">' +
        '<h3 style="font-size:14px;margin-bottom:8px;">Security reminders</h3>' +
        infoCard('Your Master Password is never stored in plaintext and cannot be recovered.') +
        '<div style="height:var(--space-2);"></div>' +
        infoCard('Your Recovery Key is the only way to access your Vault if you forget your password. Keep it offline.') +
        '<div style="height:var(--space-2);"></div>' +
        infoCard('All Vault data is encrypted locally with AES-256-GCM before storage. Nothing is sent to any server.') +
        '<div style="height:var(--space-2);"></div>' +
        infoCard('If you clear your browser data without exporting a backup, your Vault will be permanently lost.') +
        '<hr class="divider">' +
        '<div class="flex-row" style="flex-wrap:wrap;">' +
        '<button id="vaultChangePwBtn" class="btn btn-secondary btn-sm">Change Master Password</button>' +
        '<button id="vaultDestroyBtn" class="btn btn-danger btn-sm">Delete Vault</button>' +
        '</div>' +
        '</div>' +
        '<div class="modal__footer"><button class="btn btn-primary vaultSettingsClose">Done</button></div></div>';

      document.body.appendChild(overlay);

      $all('.vaultSettingsClose').forEach(function (btn) {
        btn.addEventListener('click', function () {
          var val = parseInt($('#vaultAutoLockInput').value) || 15;
          A.setAutoLock(val).then(function () {
            App.Vault.updateAutoLock(val);
          });
          overlay.remove();
        });
      });

      overlay.addEventListener('click', function (e) { if (e.target === overlay) overlay.remove(); });

      $('#vaultChangePwBtn').addEventListener('click', function () {
        overlay.remove();
        renderChangePassword();
      });

      $('#vaultDestroyBtn').addEventListener('click', function () {
        if (!window.confirm('Are you sure you want to permanently delete your entire Vault? All encrypted data will be lost. This cannot be undone.')) return;
        if (!window.confirm('This is your LAST CHANCE. Your Vault contains sensitive data. Delete permanently?')) return;
        A.deleteVault().then(function () {
          App.Toast.show({ message: 'Vault deleted', type: 'info', duration: 3000 });
          App.Vault.resetInactivityTimer();
          renderOnboarding();
        });
      });
    });
  }

  /* ---- Change password modal ---- */

  function renderChangePassword() {
    var overlay = el('div', { class: 'modal-overlay is-open', id: 'vaultChangePwModal' });
    overlay.innerHTML =
      '<div class="modal modal--sm" role="dialog" aria-modal="true" aria-label="Change Master Password">' +
      '<div class="modal__header"><h2>Change Master Password</h2><button class="btn-icon vaultChangePwClose" aria-label="Close"><svg viewBox="0 0 24 24" fill="none"><path d="M6 6l12 12M18 6L6 18" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/></svg></button></div>' +
      '<div class="modal__body">' +
      infoCard('Your data will be re-encrypted with the new password. The Recovery Key will remain valid.') +
      '<div class="field"><label>Current Master Password</label><input id="vcpOldPw" class="input" type="password" autocomplete="current-password"></div>' +
      '<div class="field"><label>New Master Password</label><input id="vcpNewPw" class="input" type="password" autocomplete="new-password"><div id="vcpStrength"></div></div>' +
      '<div class="field"><label>Confirm New Password</label><input id="vcpConfirmPw" class="input" type="password" autocomplete="new-password"></div>' +
      '<div id="vcpError" style="font-size:var(--text-sm);text-align:center;color:var(--danger);display:none;"></div>' +
      '</div>' +
      '<div class="modal__footer">' +
      '<button class="btn btn-secondary vaultChangePwClose">Cancel</button>' +
      '<button id="vcpSaveBtn" class="btn btn-primary">Change Password</button>' +
      '</div></div>';

    document.body.appendChild(overlay);

    $all('.vaultChangePwClose').forEach(function (btn) {
      btn.addEventListener('click', function () { overlay.remove(); });
    });
    overlay.addEventListener('click', function (e) { if (e.target === overlay) overlay.remove(); });

    $('#vcpNewPw').addEventListener('input', function () {
      var sd = $('#vcpStrength');
      if (sd) sd.innerHTML = renderPasswordStrength(this.value);
    });

    $('#vcpSaveBtn').addEventListener('click', function () {
      var oldPw = $('#vcpOldPw').value;
      var newPw = $('#vcpNewPw').value;
      var confirm = $('#vcpConfirmPw').value;
      var errorEl = $('#vcpError');
      if (errorEl) errorEl.style.display = 'none';

      if (!oldPw) { showError('Enter your current password.'); return; }
      if (newPw.length < 8) { showError('New password must be at least 8 characters.'); return; }
      if (newPw !== confirm) { showError('Passwords do not match.'); return; }

      var btn = $('#vcpSaveBtn');
      btn.disabled = true;
      btn.textContent = 'Changing\u2026';

      A.changePassword(oldPw, newPw).then(function () {
        overlay.remove();
        App.Toast.show({ message: 'Master Password changed successfully', type: 'success' });
      }).catch(function () {
        btn.disabled = false;
        btn.textContent = 'Change Password';
        showError('Current password is incorrect.');
      });

      function showError(msg) { if (errorEl) { errorEl.textContent = msg; errorEl.style.display = 'block'; } }
    });
  }

  /* ---- Helpers ---- */

  function getCategories() {
    var items = A.getItems();
    var cats = {};
    items.forEach(function (i) { if (i.category) cats[i.category] = true; });
    return Object.keys(cats).sort();
  }

  App.Vault.UI = {
    renderOnboarding: renderOnboarding,
    renderUnlockScreen: renderUnlockScreen,
    renderForgotPassword: renderForgotPassword,
    renderUnlocked: renderUnlocked,
    renderItems: renderItems,
    renderItemEditor: renderItemEditor,
    openPasswordGenerator: openPasswordGenerator,
    renderSettings: renderSettings,
  };
})();
