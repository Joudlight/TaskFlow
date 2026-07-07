/*
  App.Vault.Storage — IndexedDB persistence for the Vault.
  Stores only encrypted data: salt, wrapped DEK(s), and the encrypted vault blob.
  No plaintext passwords or keys are ever written to the database.

  Database: 'flow-vault'
  Object store: 'vault' (single record, key = 'main')
*/
(function () {
  'use strict';
  window.App = window.App || {};
  window.App.Vault = window.App.Vault || {};

  var DB_NAME = 'flow-vault';
  var DB_VERSION = 1;
  var STORE_NAME = 'vault';

  function openDB() {
    return new Promise(function (resolve, reject) {
      var request = indexedDB.open(DB_NAME, DB_VERSION);
      request.onupgradeneeded = function (e) {
        var db = e.target.result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME);
        }
      };
      request.onsuccess = function (e) { resolve(e.target.result); };
      request.onerror = function (e) { reject(e.target.error); };
    });
  }

  function getVault() {
    return openDB().then(function (db) {
      return new Promise(function (resolve, reject) {
        var tx = db.transaction(STORE_NAME, 'readonly');
        var store = tx.objectStore(STORE_NAME);
        var request = store.get('main');
        request.onsuccess = function () { resolve(request.result || null); };
        request.onerror = function () { reject(request.error); };
        tx.oncomplete = function () { db.close(); };
      });
    });
  }

  function saveVault(data) {
    return openDB().then(function (db) {
      return new Promise(function (resolve, reject) {
        var tx = db.transaction(STORE_NAME, 'readwrite');
        var store = tx.objectStore(STORE_NAME);
        var request = store.put(data, 'main');
        request.onsuccess = function () { resolve(); };
        request.onerror = function () { reject(request.error); };
        tx.oncomplete = function () { db.close(); };
      });
    });
  }

  function deleteVault() {
    return openDB().then(function (db) {
      return new Promise(function (resolve, reject) {
        var tx = db.transaction(STORE_NAME, 'readwrite');
        var store = tx.objectStore(STORE_NAME);
        var request = store.clear();
        request.onsuccess = function () { resolve(); };
        request.onerror = function () { reject(request.error); };
        tx.oncomplete = function () { db.close(); };
      });
    });
  }

  function vaultExists() {
    return getVault().then(function (v) { return v !== null; });
  }

  App.Vault.Storage = {
    openDB: openDB,
    getVault: getVault,
    saveVault: saveVault,
    deleteVault: deleteVault,
    vaultExists: vaultExists,
  };
})();
