// Draws the shareable images with <canvas> (no libraries, works offline):
// personality card (Quick Mode) and needs summary (Full Mode).
(function (root) {
  const FONT = '"Segoe UI","PingFang SC","Microsoft YaHei","Noto Sans SC","Helvetica Neue",Arial,sans-serif';
  const THEMES = {
    provider: ['#FF6B4A', '#C2185B'], guardian: ['#2EC4B6', '#14213D'], planner: ['#7B61FF', '#14213D'],
    hustler: ['#FF9F1C', '#E63946'], optimist: ['#FFC93C', '#FF6B4A'], yolo: ['#E63946', '#7B61FF']
  };
  function wrap(ctx, text, x, y, maxW, lh, maxLines = 9) {
    // splits on spaces for Latin text and per character for Chinese
    const tokens = String(text).match(/[　-鿿＀-￯]|[^\s　-鿿＀-￯]+\s*|\s+/g) || [];
    let line = '', lines = 0;
    for (const tk of tokens) {
      const test = line + tk;
      if (ctx.measureText(test.trimEnd()).width > maxW && line) { ctx.fillText(line.trimEnd(), x, y); y += lh; line = tk.trimStart(); if (++lines >= maxLines) return y; }
      else line = test;
    }
    if (line.trim()) { ctx.fillText(line.trimEnd(), x, y); y += lh; }
    return y;
  }
  function rr(ctx, x, y, w, h, r) { ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r); ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath(); }

  function personality(res, lang, settings, t) {
    const W = 1080, H = 1350, c = document.createElement('canvas'); c.width = W; c.height = H;
    const x = c.getContext('2d'), [a, b] = THEMES[res.type];
    const g = x.createLinearGradient(0, 0, W, H); g.addColorStop(0, a); g.addColorStop(1, b); x.fillStyle = g; x.fillRect(0, 0, W, H);
    // playful circles
    x.globalAlpha = 0.12; x.fillStyle = '#fff';
    [[900, 180, 220], [120, 1180, 260], [980, 1100, 120], [160, 260, 90]].forEach(([cx, cy, r]) => { x.beginPath(); x.arc(cx, cy, r, 0, 7); x.fill(); });
    x.globalAlpha = 1; x.textAlign = 'center'; x.fillStyle = '#fff';
    x.font = `700 40px ${FONT}`; x.fillText('REDEFINE LIFE GAME', W / 2, 110);
    x.font = `500 38px ${FONT}`; x.globalAlpha = 0.9; x.fillText(t('myMoneyType'), W / 2, 200); x.globalAlpha = 1;
    x.font = `220px ${FONT}`; x.fillText(window.RLG_RULES.TYPE_EMOJI[res.type], W / 2, 450);
    x.font = `800 96px ${FONT}`; wrap(x, t('t_' + res.type), W / 2, 590, W - 140, 104, 2);
    x.font = `italic 500 42px ${FONT}`; let y = wrap(x, '“' + t('tl_' + res.type) + '”', W / 2, 700, W - 180, 54, 3);
    // white panel with strength / watch out
    y = Math.max(y + 20, 820); x.fillStyle = 'rgba(255,255,255,0.95)'; rr(x, 80, y, W - 160, 330, 36); x.fill();
    x.textAlign = 'left'; x.fillStyle = '#14213D';
    x.font = `800 36px ${FONT}`; x.fillText('💪 ' + t('strength'), 130, y + 70);
    x.font = `500 34px ${FONT}`; let y2 = wrap(x, t('st_' + res.type), 130, y + 118, W - 260, 44, 2);
    x.font = `800 36px ${FONT}`; x.fillText('👀 ' + t('watchOut'), 130, y2 + 30);
    x.font = `500 34px ${FONT}`; wrap(x, t('wo_' + res.type), 130, y2 + 78, W - 260, 44, 2);
    x.textAlign = 'center'; x.fillStyle = '#fff';
    x.font = `700 40px ${FONT}`; x.fillText(t('guessedRight', { n: res.right }), W / 2, y + 410);
    x.font = `500 30px ${FONT}`; x.globalAlpha = 0.9; x.fillText(t('playedWith', { name: settings.name }), W / 2, H - 70); x.globalAlpha = 1;
    return c;
  }

  function summary({ G, r, settings, lang, t, rm }) {
    const R = window.RLG_RULES, W = 1080, H = 2400, c = document.createElement('canvas'); c.width = W; c.height = H;
    const x = c.getContext('2d'); x.fillStyle = '#FFF8EE'; x.fillRect(0, 0, W, H);
    x.fillStyle = '#14213D'; x.fillRect(0, 0, W, 210);
    x.fillStyle = '#FFC93C'; x.font = `800 52px ${FONT}`; x.fillText('REDEFINE ' + t('appShort'), 60, 95);
    x.fillStyle = '#fff'; x.font = `500 34px ${FONT}`; x.fillText(t('summaryTitle'), 60, 150);
    x.textAlign = 'right'; x.font = `700 36px ${FONT}`; x.fillText(G.p.name || t('player'), W - 60, 95);
    x.font = `400 28px ${FONT}`; x.fillText(new Date().toLocaleDateString(lang === 'zh' ? 'zh-CN' : 'en-MY'), W - 60, 145); x.textAlign = 'left';
    let y = 280;
    const h = s => { x.fillStyle = '#FF6B4A'; x.font = `800 34px ${FONT}`; x.fillText(s, 60, y); y += 52; x.fillStyle = '#14213D'; x.font = `500 30px ${FONT}`; };
    const row = (l, v, col) => { x.fillStyle = '#14213D'; x.font = `500 30px ${FONT}`; x.fillText(l, 60, y); x.textAlign = 'right'; x.fillStyle = col || '#14213D'; x.font = `700 30px ${FONT}`; x.fillText(v, W - 60, y); x.textAlign = 'left'; y += 46; };
    h(t('workingFor'));
    r.dB.forEach((d, i) => row(`${R.DREAM_EMOJI[d.id]} ${i + 1}. ${t('d_' + d.id)} (${rm(d.target)})`, d.ok ? '✅' : d.pct + '%', d.ok ? '#1b8a5a' : '#E63946'));
    y += 20; h(t('scorecard') + ' — ' + t(G.mode === 'real' ? 'real' : 'whatif'));
    x.fillStyle = '#14213D'; y = wrap(x, t('events') + ': ' + G.events.map(e => R.CARD_EMOJI[e] + ' ' + t('c_' + e)).join(' · '), 60, y, W - 120, 42, 3);
    row(t('moneyLost'), rm(r.before.moneyLost), '#E63946'); row(t('insPaid'), rm(r.before.insurancePaid), '#1b8a5a');
    y += 20; h(t('beforeAfter'));
    row(t('familyLeft', { a: settings.A.retireAge }) + ' — ' + t('before'), rm(r.before.wealth));
    row(t('familyLeft', { a: settings.A.retireAge }) + ' — ' + t('after'), rm(r.after.wealth), '#1b8a5a');
    row(t('dreamsSurvivedShort'), `${r.dB.filter(d => d.ok).length}/3 → ${r.dA.filter(d => d.ok).length}/3`);
    row(t('premiumRow'), r.prem ? rm(r.prem) + t('perMonth') : t('notQuoted'), r.prem ? '#14213D' : '#E63946');
    y += 20; h(t('needsTitle'));
    ['income', 'ci', 'med', 'retire'].forEach(k => { const n = r.need[k]; row(t('n_' + k), n.covered ? '✅ ' + t('coveredHere') : rm(n.gap), n.covered ? '#1b8a5a' : '#E63946'); });
    x.fillStyle = '#555'; x.font = `400 24px ${FONT}`; y += 10;
    y = wrap(x, t('formulaInApp'), 60, y, W - 120, 32, 2);
    // footer, placed right after the content; the image is then cropped to fit
    const top = y + 30;
    x.fillStyle = '#14213D'; x.fillRect(0, top, W, 400); x.fillStyle = '#fff'; x.font = `400 24px ${FONT}`;
    let fy = wrap(x, t('disclaimer'), 60, top + 55, W - 120, 32, 4);
    x.font = `700 28px ${FONT}`; x.fillStyle = '#FFC93C';
    fy = wrap(x, t('preparedBy', { name: settings.name, agency: settings.agency, phone: settings.phone }), 60, fy + 20, W - 120, 38, 3);
    const out = document.createElement('canvas'); out.width = W; out.height = Math.min(H, fy + 20);
    out.getContext('2d').drawImage(c, 0, 0);
    return out;
  }

  function download(canvas, name) {
    canvas.toBlob(b => { const a = document.createElement('a'); a.href = URL.createObjectURL(b); a.download = name; document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 1000); }, 'image/png');
  }
  function share(canvas, name, text) {
    canvas.toBlob(async b => {
      const file = new File([b], name, { type: 'image/png' });
      if (navigator.canShare && navigator.canShare({ files: [file] })) { try { await navigator.share({ files: [file], text }); return; } catch (e) { if (e.name === 'AbortError') return; } }
      download(canvas, name);
    }, 'image/png');
  }
  root.RLG_CARDS = { personality, summary, download, share };
})(this);
