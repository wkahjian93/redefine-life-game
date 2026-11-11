// Small generated sounds + background music (no files, works offline).
// Mute (top bar) silences everything; music on/off is a separate setting. Both are remembered on this phone.
(function (root) {
  let ctx = null, muted = false, musicOn = true;
  try { muted = localStorage.getItem('rlg.mute') === '1'; musicOn = localStorage.getItem('rlg.music') !== '0'; } catch (e) {}
  function ac() { if (!ctx) { const C = window.AudioContext || window.webkitAudioContext; if (C) ctx = new C(); } if (ctx && ctx.state === 'suspended') ctx.resume(); return ctx; }
  function tone(freq, start, dur, type = 'sine', vol = 0.18, dest, at) {
    const c = ac(); if (!c) return;
    const o = c.createOscillator(), g = c.createGain(), t = at != null ? at : c.currentTime + start;
    o.type = type; o.frequency.setValueAtTime(freq, t);
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + 0.02); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(dest || c.destination); o.start(t); o.stop(t + dur + 0.05);
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

  /* ---- background music: a light, cheerful loop (C – G – Am – F), 104 bpm ---- */
  const BPM = 104, STEP = 60 / BPM / 2;          // eighth notes
  const hz = n => 440 * Math.pow(2, (n - 69) / 12); // MIDI note → Hz
  const CHORDS = [[60, 64, 67], [55, 59, 62], [57, 60, 64], [53, 57, 60]];
  const BASS = [36, 31, 33, 29];
  const ARP = [0, 1, 2, 1, 0, 2, 1, 2];            // order of chord tones per bar
  const MELODY = [[72, 0], [74, 2], [76, 4], [74, 6], [71, 8], [67, 11], [72, 16], [76, 18], [77, 20], [76, 22], [72, 24], [69, 27]]; // [note, step] over 32 steps
  let bus = null, timer = null, nextT = 0, step = 0;
  function schedule() {
    const c = ctx; if (!c) return;
    while (nextT < c.currentTime + 0.25) {
      const bar = Math.floor(step / 8) % 4, s = step % 8, chord = CHORDS[bar];
      if (s === 0 || s === 4) tone(hz(BASS[bar]), 0, STEP * 3.5, 'triangle', 0.5, bus, nextT);
      tone(hz(chord[ARP[s]] + 12), 0, STEP * 0.9, 'sine', 0.18, bus, nextT);
      if (s % 2 === 1) tone(6000, 0, 0.03, 'square', 0.025, bus, nextT);                // soft hi-hat tick
      const m = MELODY.find(x => x[1] === step % 32); if (m && Math.floor(step / 32) % 2 === 1) tone(hz(m[0]), 0, STEP * 1.8, 'triangle', 0.22, bus, nextT); // melody every 2nd round
      nextT += STEP; step++;
    }
  }
  function startMusic() {
    if (muted || !musicOn || timer) return;
    const c = ac(); if (!c) return;
    if (!bus) { bus = c.createGain(); bus.connect(c.destination); }
    bus.gain.cancelScheduledValues(c.currentTime); bus.gain.setValueAtTime(0.0001, c.currentTime); bus.gain.exponentialRampToValueAtTime(0.09, c.currentTime + 1.5);
    nextT = c.currentTime + 0.1; timer = setInterval(schedule, 100); schedule();
  }
  function stopMusic() {
    if (!timer) return; clearInterval(timer); timer = null;
    if (bus && ctx) { bus.gain.cancelScheduledValues(ctx.currentTime); bus.gain.setValueAtTime(bus.gain.value, ctx.currentTime); bus.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.4); }
  }
  // browsers only allow sound after a tap, so music starts on the first tap; it pauses when the app is in the background
  document.addEventListener('pointerdown', () => startMusic(), { once: true });
  document.addEventListener('visibilitychange', () => { if (document.hidden) stopMusic(); else if (ctx) startMusic(); });

  root.SFX = {
    play(name) { if (!muted && SOUNDS[name]) try { SOUNDS[name](); } catch (e) {} },
    get muted() { return muted; },
    get musicOn() { return musicOn; },
    toggle() { muted = !muted; try { localStorage.setItem('rlg.mute', muted ? '1' : '0'); } catch (e) {} if (muted) stopMusic(); else { this.play('tap'); startMusic(); } return muted; },
    setMusic(on) { musicOn = !!on; try { localStorage.setItem('rlg.music', on ? '1' : '0'); } catch (e) {} if (on) startMusic(); else stopMusic(); },
    get playing() { return !!timer; }
  };
})(this);
