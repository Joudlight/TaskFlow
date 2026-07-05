/*
  App.Share — share sheet: native Web Share where available, copy-link always,
  and a self-generated QR code as a bonus (verified against a reference
  implementation during build — see qrcode.js).
*/
(function () {
  'use strict';
  window.App = window.App || {};
  const { $ } = App.Helpers;

  function appUrl() { return location.href.split('#')[0]; }

  function open() {
    const overlay = $('#shareModal');
    $('#shareUrlText').textContent = appUrl();
    renderQR();
    overlay.classList.add('is-open');
    overlay.setAttribute('aria-hidden', 'false');
    $('#nativeShareBtn').hidden = !navigator.share;
  }
  function close() {
    const overlay = $('#shareModal');
    overlay.classList.remove('is-open');
    overlay.setAttribute('aria-hidden', 'true');
  }

  function renderQR() {
    const wrap = $('#qrCodeWrap');
    const matrix = App.QR.generate(appUrl());
    if (!matrix) { wrap.innerHTML = '<p class="text-secondary">Link is too long for an on-device QR code \u2014 use Copy Link instead.</p>'; return; }
    wrap.innerHTML = App.QR.toSVG(matrix, { dark: 'var(--color-text)', light: 'transparent' });
  }

  function copyLink() {
    navigator.clipboard.writeText(appUrl()).then(() => App.Toast.show({ type: 'success', message: 'Link copied to clipboard' }));
  }

  function nativeShare() {
    navigator.share({ title: 'Flow \u2014 Task Manager', text: 'Check out Flow, a fast offline-first to-do app.', url: appUrl() }).catch(() => {});
  }

  function downloadQR() {
    const svg = $('#qrCodeWrap svg');
    if (!svg) return;
    const xml = new XMLSerializer().serializeToString(svg);
    const svgBlob = new Blob([xml], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(svgBlob);
    const a = document.createElement('a'); a.href = url; a.download = 'flow-qr-code.svg';
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 2000);
  }

  function printQR() {
    const wrap = $('#qrCodeWrap');
    const win = window.open('', '_blank', 'width=420,height=520');
    if (!win) return;
    win.document.write(`<html><head><title>Flow QR Code</title></head><body style="display:flex;align-items:center;justify-content:center;height:100vh;margin:0;"><div style="width:280px;">${wrap.innerHTML}</div></body></html>`);
    win.document.close();
    win.focus();
    setTimeout(() => win.print(), 250);
  }

  function shareToSocial(network) {
    const url = encodeURIComponent(appUrl());
    const text = encodeURIComponent('Check out Flow \u2014 a fast, offline to-do app.');
    const urls = {
      x: `https://twitter.com/intent/tweet?text=${text}&url=${url}`,
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${url}`,
      linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${url}`,
      whatsapp: `https://wa.me/?text=${text}%20${url}`,
    };
    if (urls[network]) window.open(urls[network], '_blank', 'noopener,noreferrer,width=600,height=500');
  }

  function init() {
    $('#shareTriggerBtn').addEventListener('click', open);
    $('#shareModalCloseBtn').addEventListener('click', close);
    $('#shareModal').addEventListener('click', (e) => { if (e.target === e.currentTarget) close(); });
    $('#copyLinkBtn').addEventListener('click', copyLink);
    $('#nativeShareBtn').addEventListener('click', nativeShare);
    $('#downloadQrBtn').addEventListener('click', downloadQR);
    $('#printQrBtn').addEventListener('click', printQR);
    App.Helpers.$all('[data-social]').forEach((btn) => btn.addEventListener('click', () => shareToSocial(btn.dataset.social)));
  }

  App.Share = { init, open, close };
})();
