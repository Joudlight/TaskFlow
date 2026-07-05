/*
  App.Quotes — shows a quote card (dashboard + dedicated panel), rotates daily,
  lets people favorite/copy/share, and pull a new random one on demand.
*/
(function () {
  'use strict';
  window.App = window.App || {};
  const { $, escapeHtml } = App.Helpers;
  const D = App.DateUtils;

  let currentQuote = null;

  function quoteOfTheDay() {
    const seed = D.toISODate(new Date()).split('-').reduce((a, n) => a + Number(n), 0);
    return App.QuotesData[seed % App.QuotesData.length];
  }

  function randomQuote() {
    let q;
    do { q = App.QuotesData[Math.floor(Math.random() * App.QuotesData.length)]; } while (q.id === (currentQuote && currentQuote.id) && App.QuotesData.length > 1);
    return q;
  }

  function render(quote, targetSelector) {
    currentQuote = quote;
    const target = $(targetSelector || '#quoteCard');
    if (!target) return;
    const isFav = App.Store.state.quoteFavorites.includes(quote.id);
    target.innerHTML = `
      <div class="quote-card__text pop-in">\u201C${escapeHtml(quote.text)}\u201D</div>
      <div class="quote-card__author">${escapeHtml(quote.category)}</div>
      <div class="quote-card__actions">
        <button class="btn-icon" id="quoteFavBtn" aria-label="${isFav ? 'Remove favorite' : 'Favorite'}" aria-pressed="${isFav}">${isFav ? App.Tasks.ICON.star : App.Tasks.ICON.starOutline}</button>
        <button class="btn-icon" id="quoteCopyBtn" aria-label="Copy quote"><svg viewBox="0 0 24 24" fill="none"><rect x="8" y="8" width="12" height="12" rx="2" stroke="currentColor" stroke-width="1.8"/><path d="M16 8V6a2 2 0 00-2-2H6a2 2 0 00-2 2v8a2 2 0 002 2h2" stroke="currentColor" stroke-width="1.8"/></svg></button>
        <button class="btn-icon" id="quoteShareBtn" aria-label="Share quote"><svg viewBox="0 0 24 24" fill="none"><circle cx="18" cy="5" r="2.5" stroke="currentColor" stroke-width="1.8"/><circle cx="6" cy="12" r="2.5" stroke="currentColor" stroke-width="1.8"/><circle cx="18" cy="19" r="2.5" stroke="currentColor" stroke-width="1.8"/><path d="M8.2 10.8l7.6-4.6M8.2 13.2l7.6 4.6" stroke="currentColor" stroke-width="1.8"/></svg></button>
        <button class="btn-icon" id="quoteRefreshBtn" aria-label="New quote"><svg viewBox="0 0 24 24" fill="none"><path d="M4 12a8 8 0 0114-5.3M20 12a8 8 0 01-14 5.3" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/><path d="M18 3v4h-4M6 21v-4h4" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg></button>
      </div>`;
    target.querySelector('#quoteFavBtn').addEventListener('click', () => toggleFavorite(quote.id, targetSelector));
    target.querySelector('#quoteCopyBtn').addEventListener('click', () => copyQuote(quote));
    target.querySelector('#quoteShareBtn').addEventListener('click', () => shareQuote(quote));
    target.querySelector('#quoteRefreshBtn').addEventListener('click', () => render(randomQuote(), targetSelector));
  }

  function toggleFavorite(id, targetSelector) {
    const favs = App.Store.state.quoteFavorites;
    const idx = favs.indexOf(id);
    if (idx === -1) { favs.push(id); App.Sounds.play('click'); } else favs.splice(idx, 1);
    App.Store.save();
    render(currentQuote, targetSelector);
    renderFavoritesList();
  }

  function copyQuote(quote) {
    const text = `"${quote.text}" \u2014 Flow`;
    if (navigator.clipboard) navigator.clipboard.writeText(text).then(() => App.Toast.show({ type: 'success', message: 'Quote copied' })).catch(() => {});
  }

  function shareQuote(quote) {
    const text = `"${quote.text}"`;
    if (navigator.share) navigator.share({ text }).catch(() => {});
    else copyQuote(quote);
  }

  function renderFavoritesList() {
    const wrap = $('#quoteFavoritesList');
    if (!wrap) return;
    const favs = App.Store.state.quoteFavorites.map((id) => App.QuotesData.find((q) => q.id === id)).filter(Boolean);
    wrap.innerHTML = favs.length ? favs.map((q) => `<div class="card" style="margin-bottom:8px;padding:12px 16px;"><em>\u201C${escapeHtml(q.text)}\u201D</em></div>`).join('') : '<p class="text-secondary">No favorite quotes yet \u2014 star one to save it here.</p>';
  }

  function init() {
    render(quoteOfTheDay(), '#quoteCard');
    renderFavoritesList();
  }

  App.Quotes = { init, render, quoteOfTheDay, randomQuote, renderFavoritesList };
})();
