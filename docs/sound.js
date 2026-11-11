// Small generated sounds (no files, works offline). Muted state is remembered on this phone.
(function (root) {
  let ctx = null, muted = false;
  try { muted = localStorage.getItem('rlg.mute') === '1'; } catch (e) {}
  function ac() { if (!ctx) { const C = window.AudioContext || window.webkitAudioContext; if (C) ctx = new C(); } if (ctx && ctx.state === 'suspended') ctx.resume(); return ctx; }
  function tone(freq, start, dur, type = 'sine', vol = 0.18) {
    const c = ac(); if (!c) return;
    const o = c.createOscillator(), g = c.createGain(), t = c.currentTime + start;
    o.type = type; o.frequency.setValueAtTime(freq, t);
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + 0.02); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(c.destination); o.start(t); o.stop(t + dur + 0.05);
  }
  const SOUNDS = {
    tap: () => tone(660, 0, 0.07, 'triangle', 0.1),
    good: () => { tone(660, 0, 0.12, 'triangle'); tone(880, 0.1, 0.12, 'triangle'); tone(1320, 0.2, 0.25, 'triangle'); },
    bad: () => { tone(300, 0, 0.18, 'sawtooth', 0.08); tone(220, 0.15, 0.3, 'sawtooth', 0.08); },
    flip: () => { tone(400, 0, 0.06, 'square', 0.05); tone(800, 0.06, 0.08, 'square', 0.05); },
    coin: () => { tone(988, 0, 0.08, 'square', 0.06); tone(1319, 0.08, 0.2, 'square', 0.06); },
    cheer: () => [523, 659, 784, 1047].forEach((f, i) => tone(f, i * 0.09, 0.35, 'triangle', 0.14)),
    drum: () => { for (let i = 0; i < 6; i++) tone(120 + i * 15, i * 0.08, 0.07, 'square', 0.05); }
  };
  root.SFX = {
    play(name) { if (!muted && SOUNDS[name]) try { SOUNDS[name](); } catch (e) {} },
    get muted() { return muted; },
    toggle() { muted = !muted; try { localStorage.setItem('rlg.mute', muted ? '1' : '0'); } catch (e) {} if (!muted) this.play('tap'); return muted; }
  };
})(this);
