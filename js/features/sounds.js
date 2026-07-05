/*
  App.Sounds — tasteful UI sound effects synthesized with the Web Audio API.
  No audio asset files, no network requests, works fully offline. Each sound
  is a short envelope of one or two oscillator tones.
*/
(function () {
  'use strict';
  window.App = window.App || {};

  let ctx = null;
  function getCtx() {
    if (!ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      ctx = new AC();
    }
    if (ctx.state === 'suspended') ctx.resume();
    return ctx;
  }

  function tone(freq, startOffset, duration, type, gainPeak) {
    const audio = getCtx();
    if (!audio) return;
    const osc = audio.createOscillator();
    const gain = audio.createGain();
    osc.type = type || 'sine';
    osc.frequency.value = freq;
    const t0 = audio.currentTime + startOffset;
    gain.gain.setValueAtTime(0, t0);
    gain.gain.linearRampToValueAtTime(gainPeak, t0 + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + duration);
    osc.connect(gain).connect(audio.destination);
    osc.start(t0);
    osc.stop(t0 + duration + 0.02);
  }

  const RECIPES = {
    complete: () => { tone(523.25, 0, 0.12, 'sine', vol(0.22)); tone(783.99, 0.07, 0.18, 'sine', vol(0.2)); },
    uncomplete: () => { tone(440, 0, 0.1, 'sine', vol(0.14)); },
    create: () => { tone(660, 0, 0.09, 'triangle', vol(0.16)); },
    delete: () => { tone(300, 0, 0.08, 'sine', vol(0.16)); tone(220, 0.05, 0.12, 'sine', vol(0.12)); },
    timerFinish: () => { [0, 0.16, 0.32].forEach((t, i) => tone(587.33 + i * 100, t, 0.22, 'sine', vol(0.24))); },
    notification: () => { tone(880, 0, 0.08, 'sine', vol(0.16)); tone(1108.73, 0.09, 0.1, 'sine', vol(0.14)); },
    achievement: () => { [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => tone(f, i * 0.09, 0.2, 'triangle', vol(0.18))); },
    click: () => { tone(700, 0, 0.04, 'sine', vol(0.08)); },
    error: () => { tone(220, 0, 0.16, 'sawtooth', vol(0.1)); },
  };

  function vol(base) { return base * (App.Store.state.settings.soundVolume ?? 0.5) * 2; }

  function play(name) {
    if (!App.Store.state.settings.soundsEnabled) return;
    const recipe = RECIPES[name];
    if (recipe) { try { recipe(); } catch (e) { /* audio may be blocked before first gesture */ } }
  }

  function setEnabled(val) { App.Store.updateSettings({ soundsEnabled: val }); if (val) play('click'); }
  function setVolume(val) { App.Store.updateSettings({ soundVolume: val }); }

  function init() {
    // Unlock audio context on first user gesture (autoplay policies)
    const unlock = () => { getCtx(); document.removeEventListener('pointerdown', unlock); document.removeEventListener('keydown', unlock); };
    document.addEventListener('pointerdown', unlock, { once: true });
    document.addEventListener('keydown', unlock, { once: true });
  }

  App.Sounds = { init, play, setEnabled, setVolume };
})();
