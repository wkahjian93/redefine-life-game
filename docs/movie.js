// Tiny "live movie" engine for the Concept Games: a canvas stage with movie bars, typed subtitles,
// a character the customer controls (drag to move, tap to jump / act), action buttons, particles and sound.
// Scenes are plain objects: { init(M), update(M), draw(M), skip(M) }. No files, works offline.
(function (root) {
  const W = 360, H = 240, FONT = '"Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif';
  const TFONT = '-apple-system,"Segoe UI","PingFang SC","Microsoft YaHei",sans-serif';

  root.RLG_MOVIE = function (host, scene, opts) {
    host.innerHTML = '<div class="stage"><canvas></canvas><button class="mv-skip" type="button">⏭</button><button class="mv-voice" type="button" hidden>🗣️</button></div><div class="mv-sub"></div><div class="mv-btns"></div>';
    const stage = host.querySelector('.stage'), cv = host.querySelector('canvas'), btns = host.querySelector('.mv-btns'), subEl = host.querySelector('.mv-sub');
    const ctx = cv.getContext('2d');
    let dpr = 1, raf = 0, last = 0, stopped = false, subT = '', subAt = 0, titleT = '', titleAt = -9, shakeUntil = 0, flashC = null, flashAt = -9;
    const parts = [];
    // ---- narration (旁白): subtitle + the device's own voice (free, offline). 🗣️ on the stage turns the voice on/off.
    const synth = window.speechSynthesis, lang = opts.lang || 'en';
    let voiceOn = true, speaking = false, narrEnd = 0, narrMax = 0;
    try { voiceOn = localStorage.getItem('rlg.voice') !== '0'; } catch (e) {}
    // pick the most natural-sounding voice on this device: Premium / Enhanced / neural voices first, then well-known good ones
    const pickVoice = () => {
      if (!synth) return null; const vs = synth.getVoices().filter(v => v.lang.toLowerCase().replace('_', '-').startsWith(lang === 'zh' ? 'zh' : 'en'));
      const score = v => { const n = (v.name + ' ' + v.voiceURI).toLowerCase(), l = v.lang.toLowerCase().replace('_', '-'); let s = 0;
        if (/premium/.test(n)) s += 60; if (/enhanced|neural|natural|online/.test(n)) s += 40;
        if (lang === 'zh') { if (/zh-cn|zh-sg|zh-my/.test(l)) s += 20; if (/lili|tingting|yue|xiaoxiao|xiaoyi|yunxi|meijia/.test(n)) s += 10; if (/hk|yue|cantonese/.test(l + n)) s -= 15; }
        else { if (/en-gb|en-au|en-sg|en-my|en-ie/.test(l)) s += 12; if (/en-us/.test(l)) s += 8; if (/serena|daniel|karen|moira|samantha|ava|zoe|libby|sonia|ryan|aria|jenny|guy/.test(n)) s += 10; }
        if (/compact|eloquence|grandma|grandpa|bad news|bells|boing|bubbles|cellos|jester|organ|trinoids|whisper|zarvox|albert|fred|junior|kathy|ralph|superstar|wobble|novelty/.test(n)) s -= 80;
        return s; };
      return vs.sort((a, b) => score(b) - score(a))[0] || null; };
    const estimate = s => Math.max(2.4, lang === 'zh' ? [...s].length * 0.26 : s.split(/\s+/).length * 0.42);
    // read like a storyteller: one sentence at a time (natural pause between), a little slower, emoji removed
    function speak(text) {
      if (!synth || !voiceOn || (opts.muted && opts.muted())) { speaking = false; opts.duck && opts.duck(false); return; }
      try {
        synth.cancel(); const v = pickVoice();
        const parts = text.replace(/[🌀-🫿☀-➿⭐]/gu, '').replace(/([.!?。！？…])\s*/g, '$1|').split('|').map(x => x.trim()).filter(x => /[A-Za-z0-9一-鿿]/.test(x));
        speaking = true; opts.duck && opts.duck(true);
        parts.forEach((p, i) => { const u = new SpeechSynthesisUtterance(p);
          u.lang = v ? v.lang : (lang === 'zh' ? 'zh-CN' : 'en-GB'); if (v) u.voice = v;
          u.rate = lang === 'zh' ? 0.92 : 0.9; u.pitch = 1.02; u.volume = 1;
          if (i === parts.length - 1) u.onend = u.onerror = () => { speaking = false; opts.duck && opts.duck(false); };
          synth.speak(u); });
      } catch (e) { speaking = false; }
    }
    if (synth && synth.onvoiceschanged === null) synth.onvoiceschanged = () => {};   // some browsers load voices late
    const M = {
      W, H, t: 0, dt: 0, ctx, px: null, py: null, down: false, taps: [], data: opts.data || {}, sfx: n => opts.sfx && opts.sfx(n), tr: opts.t,
      // ---- timing helpers ----
      go(s, ph) { s.ph = ph; s.pt = M.t; s.once = {}; },
      since: s => M.t - s.pt,
      first(s, key) { if (s.once[key]) return false; s.once[key] = 1; return true; },
      // ---- story ----
      sub(text) { if (text !== subT) { subT = text || ''; subAt = M.t; } },
      title(text) { titleT = text; titleAt = M.t; },
      narrate(text) { M.sub(text); const e = estimate(text); narrEnd = M.t + e; narrMax = M.t + e * 2 + 1.5; speak(text); },
      talking: () => M.t < narrEnd || (speaking && M.t < narrMax),
      shake(ms = 400) { shakeUntil = M.t + ms / 1000; },
      flash(c = '#fff') { flashC = c; flashAt = M.t; },
      burst(x, y, e, n = 8, spd = 90) { for (let i = 0; i < n; i++) { const a = Math.random() * Math.PI * 2, v = spd * (0.4 + Math.random()); parts.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 60, e, life: 1.1, s: 12 + Math.random() * 8 }); } },
      buttons(list, cb) {
        btns.innerHTML = list.map((b, i) => `<button type="button" class="btn ${b.cls || ''}" data-i="${i}">${b.label}</button>`).join('');
        // buttons that are mashed fast (WORK, DIG) react on touch-down, so fast tapping never turns into a zoom or a lost tap
        btns.querySelectorAll('button').forEach(el => { const b = list[+el.dataset.i];
          if (b.keep === true) el.addEventListener('pointerdown', ev => { ev.preventDefault(); ev.stopPropagation(); cb(b.v); });
          else el.addEventListener('click', ev => { ev.stopPropagation(); btns.innerHTML = ''; cb(b.v); }); });
      },
      clearButtons() { btns.innerHTML = ''; },
      end(result) { if (stopped) return; stop(); opts.onEnd && opts.onEnd(result || {}); },
      // ---- drawing ----
      sky(a, b) { const g = ctx.createLinearGradient(0, 0, 0, H); g.addColorStop(0, a); g.addColorStop(1, b); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H); },
      rect(x, y, w, h, c, r = 0) { ctx.fillStyle = c; ctx.beginPath(); if (ctx.roundRect && r) ctx.roundRect(x, y, w, h, r); else ctx.rect(x, y, w, h); ctx.fill(); },
      emoji(e, x, y, size = 28, o = {}) {
        ctx.save(); ctx.globalAlpha = o.alpha == null ? 1 : o.alpha; ctx.translate(x, y); if (o.rot) ctx.rotate(o.rot); if (o.flip) ctx.scale(-1, 1);
        ctx.font = `${size}px ${FONT}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(e, 0, 0); ctx.restore();
      },
      text(s, x, y, o = {}) {
        ctx.save(); ctx.font = `${o.bold === false ? 500 : 800} ${o.size || 13}px ${TFONT}`; ctx.textAlign = o.align || 'center'; ctx.textBaseline = 'middle';
        const lines = o.maxW ? wrap(String(s), o.maxW) : [String(s)], lh = (o.size || 13) * 1.25;
        if (o.bg) { const w = Math.max(...lines.map(l => ctx.measureText(l).width)) + 14, h = lines.length * lh + 8, bx = o.align === 'left' ? x - 7 : x - w / 2;
          M.rect(bx, y - h / 2, w, h, o.bg, 8); if (o.tail) { ctx.fillStyle = o.bg; ctx.beginPath(); ctx.moveTo(x - 6, y + h / 2 - 1); ctx.lineTo(x + 6, y + h / 2 - 1); ctx.lineTo(x + (o.tail === 'l' ? -10 : 10), y + h / 2 + 9); ctx.fill(); } }
        ctx.fillStyle = o.color || '#14213D'; lines.forEach((l, i) => ctx.fillText(l, x, y + (i - (lines.length - 1) / 2) * lh)); ctx.restore();
      },
      bar(x, y, w, h, f, c = '#2EC4B6', label) {
        M.rect(x, y, w, h, 'rgba(255,255,255,.85)', h / 2); M.rect(x + 2, y + 2, Math.max(0, (w - 4) * Math.max(0, Math.min(1, f))), h - 4, c, (h - 4) / 2);
        if (label) M.text(label, x + w / 2, y + h / 2, { size: Math.min(11, h - 3), color: '#14213D' });
      },
      hud(left, right) { if (left) M.text(left, 8, 30, { align: 'left', size: 12, color: '#fff', bg: 'rgba(20,33,61,.75)' }); if (right) { ctx.save(); ctx.font = `800 12px ${TFONT}`; const w = ctx.measureText(right).width; ctx.restore(); M.text(right, W - 8 - w, 30, { align: 'left', size: 12, color: '#FFC93C', bg: 'rgba(20,33,61,.75)' }); } }
    };
    function wrap(s, maxW) { const out = []; let line = ''; const toks = /[　-鿿]/.test(s) ? [...s] : s.split(/(\s+)/);
      toks.forEach(tk => { const test = line + tk; if (ctx.measureText(test).width > maxW && line.trim()) { out.push(line.trim()); line = tk.trimStart(); } else line = test; }); if (line.trim()) out.push(line.trim()); return out; }

    // ---- input: drag to move, tap to act ----
    const pos = e => { const r = cv.getBoundingClientRect(); return [(e.clientX - r.left) / r.width * W, (e.clientY - r.top) / r.height * H]; };
    let downAt = 0, downXY = null;
    cv.addEventListener('pointerdown', e => { e.preventDefault(); try { cv.setPointerCapture(e.pointerId); } catch (x) {} [M.px, M.py] = pos(e); M.down = true; downAt = performance.now(); downXY = [M.px, M.py]; M.taps.push({ x: M.px, y: M.py }); });
    cv.addEventListener('pointermove', e => { if (!M.down) return; [M.px, M.py] = pos(e); });
    const up = () => { M.down = false; };
    cv.addEventListener('pointerup', up); cv.addEventListener('pointercancel', up);
    host.querySelector('.mv-skip').addEventListener('click', () => M.end(scene.skip ? scene.skip(M) : {}));
    const vb = host.querySelector('.mv-voice');
    if (scene.voice && synth) { vb.hidden = false; vb.classList.toggle('off', !voiceOn);
      vb.addEventListener('click', () => { voiceOn = !voiceOn; try { localStorage.setItem('rlg.voice', voiceOn ? '1' : '0'); } catch (e) {} vb.classList.toggle('off', !voiceOn);
        if (!voiceOn) { synth.cancel(); speaking = false; opts.duck && opts.duck(false); } else if (subT) speak(subT); }); }

    function size() { const w = stage.clientWidth || 340; dpr = Math.min(2, window.devicePixelRatio || 1); cv.width = Math.round(w * dpr); cv.height = Math.round(w * H / W * dpr); cv.style.height = Math.round(w * H / W) + 'px'; }
    size(); window.addEventListener('resize', size);
    function stop() { stopped = true; cancelAnimationFrame(raf); window.removeEventListener('resize', size); if (synth && speaking) synth.cancel(); speaking = false; opts.duck && opts.duck(false); }

    function frame(now) {
      if (stopped) return;
      if (!host.isConnected) return stop();
      const dt = Math.min(0.05, last ? (now - last) / 1000 : 0); last = now; M.dt = dt; M.t += dt;
      try { scene.update(M); } catch (e) { console.error(e); }
      if (stopped) return;
      ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.clearRect(0, 0, cv.width, cv.height);
      const sc = cv.width / W; ctx.setTransform(sc, 0, 0, sc, 0, 0);
      if (M.t < shakeUntil) ctx.translate((Math.random() - 0.5) * 7, (Math.random() - 0.5) * 7);
      try { scene.draw(M); } catch (e) { console.error(e); }
      // particles
      for (let i = parts.length - 1; i >= 0; i--) { const p = parts[i]; p.life -= dt; if (p.life <= 0) { parts.splice(i, 1); continue; } p.vy += 260 * dt; p.x += p.vx * dt; p.y += p.vy * dt; M.emoji(p.e, p.x, p.y, p.s, { alpha: Math.min(1, p.life * 2) }); }
      ctx.setTransform(sc, 0, 0, sc, 0, 0);
      // flash
      if (M.t - flashAt < 0.35) { ctx.globalAlpha = 1 - (M.t - flashAt) / 0.35; M.rect(0, 0, W, H, flashC); ctx.globalAlpha = 1; }
      // title card
      if (titleT && M.t - titleAt < 2.2) { const k = M.t - titleAt, a = Math.min(1, k * 4, (2.2 - k) * 3); ctx.globalAlpha = a; M.text(titleT, W / 2, H / 2 - 10, { size: 22, color: '#FFC93C', bg: 'rgba(20,33,61,.85)', maxW: W - 60 }); ctx.globalAlpha = 1; }
      // movie bars + typed subtitle
      M.rect(0, 0, W, 16, '#000'); M.rect(0, H - 16, W, 16, '#000');
      { const n = Math.floor((M.t - subAt) * 45), s = [...subT].slice(0, n).join(''); if (subEl.textContent !== s) subEl.textContent = s; subEl.classList.toggle('on', !!subT); }
      M.taps = [];
      raf = requestAnimationFrame(frame);
    }
    scene.init(M);
    raf = requestAnimationFrame(frame);
    return { stop, M };
  };
})(this);
