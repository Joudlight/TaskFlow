/*
  App.Vault.Auth — Authentication, account creation, and recovery for the Vault.

  Flow:
  1. Create account: generate salt + DEK + recovery key, derive KEK from password,
     wrap DEK with KEK, wrap DEK with KEK2 (recovery key), encrypt empty vault data.
  2. Unlock: derive KEK from entered password, unwrap DEK, decrypt vault data.
  3. Recover: derive KEK2 from recovery key, unwrap DEK, re-wrap with new password.
  4. Change password: unwrap DEK with old KEK, re-wrap with new KEK.

  Session state (kept only in memory):
  - dek: raw DEK bytes for the current session
  - items: decrypted vault items array
  - username: the vault account username
*/
(function () {
  'use strict';
  window.App = window.App || {};
  window.App.Vault = window.App.Vault || {};
  var C = App.Vault.Crypto;
  var S = App.Vault.Storage;

  var session = { dek: null, items: null, username: null };

  /*
    Create a new vault account.
    - Generates salt, DEK, recovery key
    - Derives KEK from master password
    - Wraps DEK with KEK
    - Derives KEK2 from recovery key
    - Wraps DEK with KEK2
    - Encrypts empty vault items with DEK
    - Stores everything in IndexedDB

    Returns: { recoveryKey: base64url string }
  */
  function createAccount(username, masterPassword) {
    var salt = C.generateSalt();
    var dek = C.generateDEK();
    var recoveryKey = C.generateRecoveryKey();

    return C.deriveKey(masterPassword, salt).then(function (kek) {
      return C.wrapDEK(dek, kek).then(function (wrappedDEK) {
        return C.deriveKey(recoveryKey, salt).then(function (kek2) {
          return C.wrapDEK(dek, kek2).then(function (wrappedDEK2) {
            var emptyItems = JSON.stringify([]);
            return C.importDEK(dek).then(function (dekKey) {
              return C.encrypt(emptyItems, dekKey).then(function (encryptedData) {
                var vaultRecord = {
                  salt: C.bytesToHex(salt),
                  wrappedDEK: wrappedDEK,
                  wrappedDEK2: wrappedDEK2,
                  encryptedData: C.bytesToHex(encryptedData),
                  username: username,
                  autoLockMinutes: 15,
                  createdAt: new Date().toISOString(),
                  updatedAt: new Date().toISOString(),
                };
                return S.saveVault(vaultRecord).then(function () {
                  session.dek = dek;
                  session.items = [];
                  session.username = username;
                  return { recoveryKey: recoveryKey };
                });
              });
            });
          });
        });
      });
    });
  }

  /*
    Unlock the vault with the master password.
    Derives KEK, unwraps DEK, decrypts vault data.
    On success, populates session.
    Returns: { items: array, username: string }
  */
  function unlock(masterPassword) {
    return S.getVault().then(function (vault) {
      if (!vault) throw new Error('No vault found');
      var salt = C.hexToBytes(vault.salt);
      return C.deriveKey(masterPassword, salt).then(function (kek) {
        return C.unwrapDEK(vault.wrappedDEK, kek).then(function (dek) {
          return C.importDEK(dek).then(function (dekKey) {
            return C.decrypt(C.hexToBytes(vault.encryptedData), dekKey).then(function (json) {
              session.dek = dek;
              session.items = JSON.parse(json);
              session.username = vault.username;
              return { items: session.items, username: session.username };
            });
          });
        });
      });
    });
  }

  /*
    Verify the recovery key without fully unlocking (used in forgot-password flow).
    Returns: { valid: boolean, dek: Uint8Array } on success, throws on failure.
  */
  function verifyRecoveryKey(recoveryKey) {
    return S.getVault().then(function (vault) {
      if (!vault) throw new Error('No vault found');
      var salt = C.hexToBytes(vault.salt);
      return C.deriveKey(recoveryKey, salt).then(function (kek2) {
        return C.unwrapDEK(vault.wrappedDEK2, kek2).then(function (dek) {
          return { dek: dek };
        });
      });
    });
  }

  /*
    Recover vault: verify recovery key, set new master password.
    Unwraps DEK from recovery key, re-wraps with new password, stores updated record.
  */
  function recover(username, recoveryKey, newPassword) {
    return S.getVault().then(function (vault) {
      if (!vault) throw new Error('No vault found');
      if (vault.username !== username) throw new Error('Username does not match');
      var salt = C.hexToBytes(vault.salt);
      return C.deriveKey(recoveryKey, salt).then(function (kek2) {
        return C.unwrapDEK(vault.wrappedDEK2, kek2).then(function (dek) {
          return C.deriveKey(newPassword, salt).then(function (newKek) {
            return C.wrapDEK(dek, newKek).then(function (newWrappedDEK) {
              vault.wrappedDEK = newWrappedDEK;
              vault.updatedAt = new Date().toISOString();
              return S.saveVault(vault).then(function () {
                session.dek = dek;
                session.username = vault.username;
                return C.importDEK(dek).then(function (dekKey) {
                  return C.decrypt(C.hexToBytes(vault.encryptedData), dekKey).then(function (json) {
                    session.items = JSON.parse(json);
                    return { items: session.items, username: session.username };
                  });
                });
              });
            });
          });
        });
      });
    });
  }

  /*
    Change the master password. Requires the current password.
  */
  function changePassword(oldPassword, newPassword) {
    return S.getVault().then(function (vault) {
      if (!vault) throw new Error('No vault found');
      var salt = C.hexToBytes(vault.salt);
      return C.deriveKey(oldPassword, salt).then(function (oldKek) {
        return C.unwrapDEK(vault.wrappedDEK, oldKek).then(function (dek) {
          return C.deriveKey(newPassword, salt).then(function (newKek) {
            return C.wrapDEK(dek, newKek).then(function (newWrappedDEK) {
              vault.wrappedDEK = newWrappedDEK;
              vault.updatedAt = new Date().toISOString();
              return S.saveVault(vault);
            });
          });
        });
      });
    });
  }

  /*
    Set auto-lock minutes.
  */
  function setAutoLock(minutes) {
    return S.getVault().then(function (vault) {
      if (!vault) throw new Error('No vault found');
      vault.autoLockMinutes = minutes;
      return S.saveVault(vault);
    });
  }

  /*
    Get auto-lock minutes setting.
  */
  function getAutoLock() {
    return S.getVault().then(function (vault) {
      return vault ? (vault.autoLockMinutes || 15) : 15;
    });
  }

  /*
    Lock the vault: clear in-memory session data.
  */
  function lock() {
    session.dek = null;
    session.items = null;
    session.username = null;
  }

  /*
    Check current session status.
    Returns: 'uninitialized' | 'locked' | 'unlocked'
  */
  function getStatus() {
    return S.vaultExists().then(function (exists) {
      if (!exists) return 'uninitialized';
      if (session.dek && session.items) return 'unlocked';
      return 'locked';
    });
  }

  function getSession() { return session; }

  function getUsername() { return session.username; }

  function getItems() { return session.items || []; }

  function setItems(items) {
    session.items = items;
  }

  /*
    Persist the current items array to IndexedDB (re-encrypt with session DEK).
  */
  function saveItems() {
    if (!session.dek || !session.items) return Promise.reject(new Error('Vault is locked'));
    var json = JSON.stringify(session.items);
    return C.importDEK(session.dek).then(function (dekKey) {
      return C.encrypt(json, dekKey).then(function (encryptedData) {
        return S.getVault().then(function (vault) {
          if (!vault) throw new Error('No vault found');
          vault.encryptedData = C.bytesToHex(encryptedData);
          vault.updatedAt = new Date().toISOString();
          return S.saveVault(vault);
        });
      });
    });
  }

  /*
    Export an encrypted backup of the entire vault (portable format).
    Returns a JSON blob string containing all vault metadata + encrypted data.
  */
  function exportBackup() {
    return S.getVault().then(function (vault) {
      if (!vault) throw new Error('No vault found');
      var backup = {
        type: 'flow-vault-backup',
        version: 1,
        exportedAt: new Date().toISOString(),
        salt: vault.salt,
        wrappedDEK: vault.wrappedDEK,
        wrappedDEK2: vault.wrappedDEK2,
        encryptedData: vault.encryptedData,
        username: vault.username,
        autoLockMinutes: vault.autoLockMinutes,
      };
      return JSON.stringify(backup, null, 2);
    });
  }

  /*
    Import an encrypted backup. Restores the vault record in IndexedDB.
    The user must know their password or recovery key to access the data afterward.
  */
  function importBackup(backupJson) {
    var backup;
    try { backup = JSON.parse(backupJson); } catch (e) { return Promise.reject(new Error('Invalid backup file')); }
    if (!backup || backup.type !== 'flow-vault-backup') {
      return Promise.reject(new Error('Not a valid Flow Vault backup'));
    }
    var vaultRecord = {
      salt: backup.salt,
      wrappedDEK: backup.wrappedDEK,
      wrappedDEK2: backup.wrappedDEK2,
      encryptedData: backup.encryptedData,
      username: backup.username || 'Vault User',
      autoLockMinutes: backup.autoLockMinutes || 15,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    return S.saveVault(vaultRecord).then(function () {
      session.dek = null;
      session.items = null;
      session.username = null;
    });
  }

  /*
    Delete the entire vault (for factory reset).
  */
  function deleteVault() {
    lock();
    return S.deleteVault();
  }

  App.Vault.Auth = {
    createAccount: createAccount,
    unlock: unlock,
    verifyRecoveryKey: verifyRecoveryKey,
    recover: recover,
    changePassword: changePassword,
    setAutoLock: setAutoLock,
    getAutoLock: getAutoLock,
    lock: lock,
    getStatus: getStatus,
    getSession: getSession,
    getUsername: getUsername,
    getItems: getItems,
    setItems: setItems,
    saveItems: saveItems,
    exportBackup: exportBackup,
    importBackup: importBackup,
    deleteVault: deleteVault,
  };
})();
