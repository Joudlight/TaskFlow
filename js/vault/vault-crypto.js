/*
  App.Vault.Crypto — Web Crypto API encryption layer for the Vault.
  Uses AES-256-GCM for data encryption and PBKDF2 for key derivation.

  Architecture:
  - A Data Encryption Key (DEK) is randomly generated and used to encrypt vault items.
  - The DEK is wrapped (encrypted) with a Key Encryption Key (KEK) derived from
    the user's master password via PBKDF2.
  - A second KEK is derived from the recovery key, also wrapping the same DEK.
  - To unlock: derive KEK from password, unwrap DEK, decrypt vault data.
  - To recover: derive KEK2 from recovery key, unwrap DEK, re-wrap with new password.

  Never stores plaintext passwords or encryption keys in any persistent storage.
  The DEK exists only in memory during an active session.
*/
(function () {
  'use strict';
  window.App = window.App || {};
  window.App.Vault = window.App.Vault || {};

  var PBKDF2_ITERATIONS = 600000;
  var SALT_BYTES = 32;
  var IV_BYTES = 12;
  var KEY_BYTES = 32;

  function getRandomBytes(length) {
    var arr = new Uint8Array(length);
    crypto.getRandomValues(arr);
    return arr;
  }

  function bytesToHex(bytes) {
    return Array.from(bytes).map(function (b) { return b.toString(16).padStart(2, '0'); }).join('');
  }

  function hexToBytes(hex) {
    var bytes = new Uint8Array(hex.length / 2);
    for (var i = 0; i < hex.length; i += 2) {
      bytes[i / 2] = parseInt(hex.substr(i, 2), 16);
    }
    return bytes;
  }

  function bytesToBase64url(bytes) {
    var binary = '';
    for (var i = 0; i < bytes.length; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  }

  function base64urlToBytes(str) {
    str = str.replace(/-/g, '+').replace(/_/g, '/');
    while (str.length % 4) str += '=';
    var binary = atob(str);
    var bytes = new Uint8Array(binary.length);
    for (var i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    return bytes;
  }

  function concat(a, b) {
    var result = new Uint8Array(a.length + b.length);
    result.set(a);
    result.set(b, a.length);
    return result;
  }

  function deriveKey(password, salt) {
    var enc = new TextEncoder();
    return crypto.subtle.importKey('raw', enc.encode(password), 'PBKDF2', false, ['deriveKey']).then(function (keyMaterial) {
      return crypto.subtle.deriveKey(
        { name: 'PBKDF2', salt: salt, iterations: PBKDF2_ITERATIONS, hash: 'SHA-256' },
        keyMaterial,
        { name: 'AES-GCM', length: 256 },
        false,
        ['encrypt', 'decrypt']
      );
    });
  }

  function encrypt(plaintext, key) {
    var iv = getRandomBytes(IV_BYTES);
    var enc = new TextEncoder();
    return crypto.subtle.encrypt({ name: 'AES-GCM', iv: iv }, key, enc.encode(plaintext)).then(function (ciphertext) {
      return concat(iv, new Uint8Array(ciphertext));
    });
  }

  function decrypt(data, key) {
    var iv = data.slice(0, IV_BYTES);
    var ciphertext = data.slice(IV_BYTES);
    return crypto.subtle.decrypt({ name: 'AES-GCM', iv: iv }, key, ciphertext).then(function (decrypted) {
      return new TextDecoder().decode(decrypted);
    });
  }

  function generateSalt() {
    return getRandomBytes(SALT_BYTES);
  }

  function generateDEK() {
    return getRandomBytes(KEY_BYTES);
  }

  function generateRecoveryKey() {
    return bytesToBase64url(getRandomBytes(KEY_BYTES));
  }

  function wrapDEK(dekBytes, kek) {
    var iv = getRandomBytes(IV_BYTES);
    return crypto.subtle.encrypt({ name: 'AES-GCM', iv: iv }, kek, dekBytes).then(function (encrypted) {
      return bytesToHex(concat(iv, new Uint8Array(encrypted)));
    });
  }

  function unwrapDEK(wrappedHex, kek) {
    var wrapped = hexToBytes(wrappedHex);
    var iv = wrapped.slice(0, IV_BYTES);
    var ciphertext = wrapped.slice(IV_BYTES);
    return crypto.subtle.decrypt({ name: 'AES-GCM', iv: iv }, kek, ciphertext).then(function (dek) {
      return new Uint8Array(dek);
    });
  }

  function importDEK(dekBytes) {
    return crypto.subtle.importKey('raw', dekBytes, { name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']);
  }

  App.Vault.Crypto = {
    deriveKey: deriveKey,
    encrypt: encrypt,
    decrypt: decrypt,
    generateSalt: generateSalt,
    generateDEK: generateDEK,
    generateRecoveryKey: generateRecoveryKey,
    wrapDEK: wrapDEK,
    unwrapDEK: unwrapDEK,
    importDEK: importDEK,
    getRandomBytes: getRandomBytes,
    bytesToHex: bytesToHex,
    hexToBytes: hexToBytes,
    bytesToBase64url: bytesToBase64url,
    base64urlToBytes: base64urlToBytes,
  };
})();
