// "Don't Wait" maze chase: collect coins and [?] life boxes to reach 100 purpose points before age 65.
// Critical illness, accident and disability chase you (faster and faster). The insurance agent follows you:
// touch the agent to pause and choose Buy or Reject. Health boxes picked up before buying make cover
// more expensive or impossible. All money in this game is game coins, never real premiums.
(function (root) {
  /* ---------- pure rules (tested by test.js) ---------- */
  const MAZE = [
    '###############',
    '#......#......#',
    '#.###..#..###.#',
    '#.............#',
    '#.##.#####.##.#',
    '#....#...#....#',
    '###.##.#.##.###',
    '#......#......#',
    '#.##.#...#.##.#',
    '#....#.#.#....#',
    '###.##.#.##.###',
    '#.............#',
    '#.##.##.##.##.#',
    '#..#.......#..#',
    '#..#.#.#.#.#..#',
    '#....#...#....#',
    '###############'
  ];
  const RULES = {
    BASE_PRICE: 15,          // game coins to buy cover when healthy
    LOADING: 3,              // price × 3 after 1 health problem
    DECLINE_AT: 2,           // 2 or more health problems, or any after getting sick → cannot buy
    PAYOUT: 120,             // game coins paid when insured and caught
    WIN: 100, START_AGE: 25, END_AGE: 65, LIFE_SECS: 180,
    MAX_HITS: 3              // caught 3 times by illness / accident / disability = game over
  };
  // what the agent can offer, given the player's health history
  function quote(flags, sick) {
    if (sick || flags.length >= RULES.DECLINE_AT) return { kind: 'decline', price: 0 };
    if (flags.length) return { kind: 'loading', price: RULES.BASE_PRICE * RULES.LOADING };
    return { kind: 'ok', price: RULES.BASE_PRICE };
  }
  const walk = (c, r) => r >= 0 && r < MAZE.length && c >= 0 && c < MAZE[0].length && MAZE[r][c] !== '#';
  function bfs(c0, r0) {
    const d = MAZE.map(row => [...row].map(() => Infinity)); if (!walk(c0, r0)) return d;
    d[r0][c0] = 0; const q = [[c0, r0]];
    while (q.length) { const [c, r] = q.shift(); [[1, 0], [-1, 0], [0, 1], [0, -1]].forEach(([dx, dy]) => { const nc = c + dx, nr = r + dy; if (walk(nc, nr) && d[nr][nc] === Infinity) { d[nr][nc] = d[r][c] + 1; q.push([nc, nr]); } }); }
    return d;
  }
  const API = { MAZE, RULES, quote, walk, bfs };
  if (typeof module !== 'undefined' && module.exports) { module.exports = API; return; }

  /* ---------- the game ---------- */
  const COLS = MAZE[0].length, ROWS = MAZE.length, T = 24, W = COLS * T, H = ROWS * T;
  const EF = '"Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif', TF = '-apple-system,"Segoe UI","PingFang SC","Microsoft YaHei",sans-serif';
  const DIRS = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] };
  const HEALTH = [['glucose', '🩸'], ['bp', '💓'], ['cyst', '🔬'], ['bmi', '🍔'], ['chol', '🧈'], ['uric', '🦶']];
  const PURPOSE = [['house', '🏠', 20], ['car', '🚗', 15], ['baby', '👶', 20], ['love', '💕', 10], ['travel', '✈️', 15], ['edu', '🎓', 20]];

  root.RLG_CHASE = function (host, opts) {
    const t = opts.t, sfx = n => opts.sfx && opts.sfx(n), music = (tr, sp) => opts.music && opts.music(tr, sp);
    host.innerHTML = `<div class="ch-hud"><span id="chLives"></span><span id="chAge"></span><span id="chMoney"></span><span id="chIns"></span><span id="chFlags"></span></div>
      <div class="ch-pbar"><i id="chP"></i><b id="chPt"></b></div>
      <div class="ch-stage"><canvas></canvas><div class="ch-pop" hidden></div></div>
      <div class="ch-msg" id="chMsg"></div>
      <div class="ch-pad"><button type="button" data-d="up">▲</button><button type="button" data-d="left">◀</button><button type="button" data-d="down">▼</button><button type="button" data-d="right">▶</button></div>`;
    const cv = host.querySelector('canvas'), ctx = cv.getContext('2d'), pop = host.querySelector('.ch-pop'), $ = id => host.querySelector('#' + id);
    let raf = 0, last = 0, stopped = false, paused = false, time = 0, dpr = 1;

    const S = {
      money: 20, purpose: 0, insured: false, insuredAge: null, sick: false, flags: [], rejects: 0, offers: 0, claims: 0, hitsNoCover: 0, hits: 0, outAt: 0, declined: false,
      agentGone: false, allPurpose: false, safeUntil: 0, won: false, events: []
    };
    const ent = (c, r, speed, e, tag) => ({ c, r, tc: null, tr: null, p: 0, dir: [0, 0], want: null, speed, e, tag, x: c, y: r, home: [c, r], on: true });
    const P = ent(7, 13, 4.6, '🧑');
    const chasers = [ent(1, 1, 2.2, '🤒', 'ciTag'), ent(13, 1, 2.2, '🚑', 'accTag'), ent(7, 5, 2.2, '🧑‍🦽', 'tpdTag')];
    chasers.forEach((c, i) => { c.on = false; c.wakeAt = [2, 9, 16][i]; });
    const agent = ent(7, 15, 3.0, '🧑‍💼'); agent.on = false; agent.wakeAt = 5; agent.anim = null;
    let coins = [], boxes = [], floats = [], parts = [], nextBox = 3, dist = null, msgT = '', msgAt = -9;

    // coins on every path tile except the start areas
    for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) if (walk(c, r) && !(r === 13 && c === 7)) coins.push({ c, r });
    const freeCell = () => { for (let i = 0; i < 80; i++) { const c = 1 + Math.floor(Math.random() * (COLS - 2)), r = 1 + Math.floor(Math.random() * (ROWS - 2));
      if (walk(c, r) && Math.abs(c - P.c) + Math.abs(r - P.r) > 3 && !boxes.some(b => b.c === c && b.r === r)) return [c, r]; } return null; };

    const age = () => Math.min(RULES.END_AGE, Math.floor(RULES.START_AGE + time / RULES.LIFE_SECS * (RULES.END_AGE - RULES.START_AGE)));
    const say = (txt, good) => { msgT = txt; msgAt = time; const el = $('chMsg'); el.textContent = txt; el.className = 'ch-msg on ' + (good === true ? 'good' : good === false ? 'bad' : ''); };
    const float = (txt, c, r, col = '#14213D') => floats.push({ txt, x: c * T + T / 2, y: r * T, col, life: 1.4 });
    const burst = (e, c, r, n = 10) => { for (let i = 0; i < n; i++) { const a = Math.random() * 6.28, v = 60 + Math.random() * 90; parts.push({ e, x: c * T + T / 2, y: r * T + T / 2, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 70, life: 1.2 }); } };
    const flagNames = () => S.flags.map(f => t('hh_' + f)).join(', ');

    function hud() {
      $('chLives').textContent = '❤️'.repeat(Math.max(0, RULES.MAX_HITS - S.hits)) + '🖤'.repeat(Math.min(RULES.MAX_HITS, S.hits));
      $('chAge').textContent = '🎂 ' + t('chAge', { a: age() });
      $('chMoney').textContent = '💰 ' + Math.round(S.money);
      $('chIns').textContent = S.insured ? '🛡️ ' + t('chInsured') : S.sick ? '🚫 ' + t('chSick') : '⚠️ ' + t('chNoCover');
      $('chIns').className = S.insured ? 'ok' : 'bad';
      $('chFlags').textContent = S.flags.map(f => HEALTH.find(h => h[0] === f)[1]).join('');
      $('chP').style.width = Math.min(100, S.purpose) + '%'; $('chPt').textContent = '⭐ ' + Math.round(S.purpose) + ' / ' + RULES.WIN;
    }

    /* ---- movement ---- */
    const can = (e, d) => d && walk(e.c + d[0], e.r + d[1]);
    function step(e, dt, choose) {
      if (e.tc == null) { const d = choose(e); if (!d) return; e.dir = d; e.tc = e.c + d[0]; e.tr = e.r + d[1]; e.p = 0; }
      e.p += e.speed * dt;
      while (e.p >= 1) { e.c = e.tc; e.r = e.tr; e.p -= 1; const d = choose(e); if (d) { e.dir = d; e.tc = e.c + d[0]; e.tr = e.r + d[1]; } else { e.tc = null; e.p = 0; break; } }
      e.x = e.tc == null ? e.c : e.c + (e.tc - e.c) * e.p; e.y = e.tc == null ? e.r : e.r + (e.tr - e.r) * e.p;
    }
    const playerChoose = e => can(e, e.want) ? e.want : can(e, e.dir) ? e.dir : null;
    const hunt = (rand) => e => {
      const opts = Object.values(DIRS).filter(d => can(e, d)), back = opts.filter(d => !(d[0] === -e.dir[0] && d[1] === -e.dir[1]));
      const list = back.length ? back : opts; if (!list.length) return null;
      if (Math.random() < rand) return list[Math.floor(Math.random() * list.length)];
      return list.reduce((b, d) => dist[e.r + d[1]][e.c + d[0]] < dist[e.r + b[1]][e.c + b[0]] ? d : b, list[0]);
    };
    function setWant(d) {
      P.want = d;
      if (P.tc != null && d[0] === -P.dir[0] && d[1] === -P.dir[1]) { const c = P.c, r = P.r; P.c = P.tc; P.r = P.tr; P.tc = c; P.tr = r; P.p = 1 - P.p; P.dir = d; }
    }

    /* ---- input: swipe on the maze, the pad, or arrow keys ---- */
    let sw = null;
    cv.addEventListener('pointerdown', e => { e.preventDefault(); sw = [e.clientX, e.clientY]; try { cv.setPointerCapture(e.pointerId); } catch (x) {} });
    cv.addEventListener('pointermove', e => { if (!sw) return; const dx = e.clientX - sw[0], dy = e.clientY - sw[1]; if (Math.max(Math.abs(dx), Math.abs(dy)) > 18) { setWant(Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? DIRS.right : DIRS.left) : (dy > 0 ? DIRS.down : DIRS.up)); sw = [e.clientX, e.clientY]; } });
    cv.addEventListener('pointerup', () => { sw = null; });
    host.querySelectorAll('.ch-pad button').forEach(b => b.addEventListener('pointerdown', e => { e.preventDefault(); setWant(DIRS[b.dataset.d]); }));
    const key = e => { const m = { ArrowUp: 'up', ArrowDown: 'down', ArrowLeft: 'left', ArrowRight: 'right' }[e.key]; if (m && !paused) { e.preventDefault(); setWant(DIRS[m]); } };
    document.addEventListener('keydown', key);

    /* ---- the agent pop-up: buy or reject ---- */
    function meetAgent() {
      paused = true; S.offers++; sfx('drum');
      const q = quote(S.flags, S.sick), price = q.price, enough = S.money >= price;
      const head = `<div class="ch-agent">🧑‍💼</div><h3>${t('chOffer')}</h3>`;
      let body, btns;
      if (q.kind === 'decline') { S.declined = true; body = `<p>${t('chDecline', { list: flagNames() })}</p>`; btns = `<button type="button" class="btn wide" data-v="ok">😞 ${t('chOk')}</button>`; }
      else {
        body = `<p>${q.kind === 'loading' ? t('chLoading', { list: flagNames(), p: price }) : t('chPrice', { p: price })}</p>` + (enough ? '' : `<p class="bad">${t('chNoMoney', { p: price })}</p>`);
        btns = `<div class="row2"><button type="button" class="btn hi" data-v="buy" ${enough ? '' : 'disabled'}>🛡️ ${t('chBuy')}</button><button type="button" class="btn lo" data-v="no">✋ ${t('chReject')}</button></div>`;
      }
      pop.innerHTML = head + body + btns + `<p class="small">${t('chGameNote')}</p>`; pop.hidden = false;
      pop.querySelectorAll('button').forEach(b => b.addEventListener('click', () => {
        pop.hidden = true; paused = false; last = 0;
        if (b.dataset.v === 'buy') {
          S.money -= price; S.insured = true; S.insuredAge = age(); sfx('cheer'); agent.anim = { kind: 'happy', at: time }; burst('🎉', agent.c, agent.r, 14);
          say(t('chBought'), true); S.events.push(['buy', age()]);
        } else {
          if (b.dataset.v === 'no') { S.rejects++; S.events.push(['reject', age()]); say(t('chRejected')); } else say(t('chDeclined'), false);
          sfx('swoosh'); if (q.kind === 'decline') { S.agentGone = true; agent.anim = { kind: 'flip', at: time }; } else sendAgentAway(7);
        }
        hud();
      }));
    }
    function sendAgentAway(secs) { const far = [[1, 15], [13, 15], [1, 11], [13, 11]].sort((a, b) => (Math.abs(b[0] - P.c) + Math.abs(b[1] - P.r)) - (Math.abs(a[0] - P.c) + Math.abs(a[1] - P.r)))[0];
      Object.assign(agent, { c: far[0], r: far[1], x: far[0], y: far[1], tc: null, p: 0, on: false, wakeAt: time + secs }); }

    /* ---- caught by illness / accident / disability ---- */
    function caught(ch) {
      S.safeUntil = time + 2.5; sfx('bad'); flash = { c: S.insured ? '#2EC4B6' : '#E63946', at: time }; shake = time + 0.6;
      const what = t(ch.tag);
      S.hits++;
      if (S.hits >= RULES.MAX_HITS) { S.outAt = time + 2.2; S.safeUntil = time + 99; }
      if (S.insured) {
        S.claims++; S.money += RULES.PAYOUT; S.allPurpose = true; boxes.forEach(b => { b.kind = 'purpose'; b.item = PURPOSE[Math.floor(Math.random() * PURPOSE.length)]; });
        burst('💰', P.c, P.r, 18); float('+' + RULES.PAYOUT + ' 💰', P.c, P.r, '#2A9D8F'); say(t(S.claims > 1 ? 'chClaim2' : 'chClaim', { what, p: RULES.PAYOUT }), true); setTimeout(() => sfx('cheer'), 300);
        S.events.push(['claim', age(), ch.tag]);
      } else {
        S.hitsNoCover++; S.sick = true; S.events.push(['hit', age(), ch.tag]);
        if (agent.on) agent.anim = { kind: 'flip', at: time }; S.agentGone = true;
        sad = { at: time, money: S.money, purpose: S.purpose };
        burst('💸', P.c, P.r, 16); burst('💔', P.c, P.r, 6); say(t('chHit', { what }), false);
      }
      chasers.forEach(c => { if (c.on) Object.assign(c, { c: c.home[0], r: c.home[1], x: c.home[0], y: c.home[1], tc: null, p: 0, dir: [0, 0] }); });
      hud();
    }
    let flash = null, shake = 0, sad = null;

    function openBox(b) {
      sfx('flip'); boxes.splice(boxes.indexOf(b), 1);
      if (b.kind === 'purpose' || S.allPurpose) {
        const it = b.kind === 'purpose' ? b.item : PURPOSE[Math.floor(Math.random() * PURPOSE.length)];
        S.purpose = Math.min(RULES.WIN, S.purpose + it[2]); float('+' + it[2] + ' ⭐ ' + it[1], b.c, b.r, '#E09F00'); burst('⭐', b.c, b.r, 6); say(t('pp_' + it[0], { n: it[2] }), true); sfx('good');
      } else if (b.kind === 'invest') { S.money += 30; float('+30 💰 📈', b.c, b.r, '#2A9D8F'); say(t('chInvest'), true); sfx('coin'); }
      else {
        const h = b.item;
        if (S.insured) { float(h[1] + ' ✅', b.c, b.r, '#2A9D8F'); say(t('chHealthCovered', { what: t('hh_' + h[0]) }), true); }
        else if (S.sick) { float(h[1], b.c, b.r, '#E63946'); say(t('chHealthSick', { what: t('hh_' + h[0]) }), false); }
        else { if (!S.flags.includes(h[0])) S.flags.push(h[0]); S.events.push(['health', age(), h[0]]); float(h[1] + ' ⚠️', b.c, b.r, '#E63946');
          say(t(S.flags.length >= RULES.DECLINE_AT ? 'chHealth2' : 'chHealth1', { what: t('hh_' + h[0]) }), false); sfx('bad'); }
      }
      hud();
    }

    /* ---- loop ---- */
    function update(dt) {
      time += dt;
      const sp = Math.min(4.4, 2.2 + time * 0.016);                     // chasers get faster and faster
      if (Math.floor(time) !== Math.floor(time - dt)) music('arcade', 1 + (sp - 2.2) / 2.2 * 0.4);   // and so does the music
      chasers.forEach(c => { if (!c.on && time >= c.wakeAt) { c.on = true; say(t('chWake', { what: t(c.tag) }), false); sfx('drum'); } c.speed = sp; });
      if (!agent.on && !S.agentGone && !S.insured && time >= agent.wakeAt) { agent.on = true; if (S.offers === 0) say(t('chAgentCome')); }
      step(P, dt, playerChoose);
      dist = bfs(P.tc != null && P.p > 0.5 ? P.tc : P.c, P.tc != null && P.p > 0.5 ? P.tr : P.r);
      chasers.forEach(c => c.on && step(c, dt, hunt(0.18)));
      if (agent.on && !agent.anim) step(agent, dt, hunt(0.1));
      // coins
      const pc = Math.round(P.x), pr = Math.round(P.y);
      const ci = coins.findIndex(k => k.c === pc && k.r === pr); if (ci >= 0) { coins.splice(ci, 1); S.money += 1; sfx('coin'); hud(); }
      if (coins.length < 25 && Math.random() < dt * 2) { const f = freeCell(); if (f && !coins.some(k => k.c === f[0] && k.r === f[1])) coins.push({ c: f[0], r: f[1] }); }
      // [?] boxes
      if (time > nextBox && boxes.length < 4) { const f = freeCell(); if (f) { const roll = Math.random(); const kind = S.allPurpose ? 'purpose' : roll < 0.42 ? 'health' : roll < 0.55 ? 'invest' : 'purpose';
        boxes.push({ c: f[0], r: f[1], kind, item: kind === 'health' ? HEALTH[Math.floor(Math.random() * HEALTH.length)] : kind === 'purpose' ? PURPOSE[Math.floor(Math.random() * PURPOSE.length)] : null, until: time + 14 }); }
        nextBox = time + 2.6 + Math.random() * 2; }
      boxes = boxes.filter(b => b.until > time);
      const bx = boxes.find(b => b.c === pc && b.r === pr); if (bx) openBox(bx);
      // agent touch
      if (agent.on && !agent.anim && Math.hypot(agent.x - P.x, agent.y - P.y) < 0.7) meetAgent();
      // chasers touch
      if (time > S.safeUntil) { const hit = chasers.find(c => c.on && Math.hypot(c.x - P.x, c.y - P.y) < 0.65); if (hit) caught(hit); }
      // sad drain after an uninsured hit
      if (sad) { const k = Math.min(1, (time - sad.at) / 1.6); S.money = sad.money * (1 - k); S.purpose = sad.purpose * (1 - k); hud(); if (k >= 1) sad = null; }
      // agent animations
      if (agent.anim && time - agent.anim.at > 2) { agent.on = false; agent.anim = null; }
      // end
      if (S.outAt) { if (time >= S.outAt - 1.2) say(t('chOut', { n: RULES.MAX_HITS }), false); if (time >= S.outAt) finish(false, true); }
      else if (S.purpose >= RULES.WIN && !S.won) { S.won = true; finish(true); }
      else if (age() >= RULES.END_AGE) finish(false);
    }
    function finish(win, out) {
      if (stopped) return; stop(); sfx(win ? 'cheer' : 'bad');
      opts.onEnd && setTimeout(() => opts.onEnd({ win, age: age(), purpose: Math.round(S.purpose), money: Math.round(S.money), insured: S.insured, insuredAge: S.insuredAge,
        rejects: S.rejects, offers: S.offers, flags: S.flags.slice(), declined: S.declined, claims: S.claims, hitsNoCover: S.hitsNoCover, hits: S.hits, out: !!out, events: S.events }), 900);
    }

    function draw() {
      const sc = cv.width / W; ctx.setTransform(sc, 0, 0, sc, 0, 0);
      if (time < shake) ctx.translate((Math.random() - 0.5) * 6, (Math.random() - 0.5) * 6);
      ctx.fillStyle = '#FFF8EE'; ctx.fillRect(-10, -10, W + 20, H + 20);
      for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) if (MAZE[r][c] === '#') { ctx.fillStyle = '#14213D'; ctx.beginPath(); (ctx.roundRect ? ctx.roundRect(c * T + 1, r * T + 1, T - 2, T - 2, 6) : ctx.rect(c * T + 1, r * T + 1, T - 2, T - 2)); ctx.fill(); }
      ctx.fillStyle = '#FFC93C'; coins.forEach(k => { ctx.beginPath(); ctx.arc(k.c * T + T / 2, k.r * T + T / 2, 3.6, 0, 7); ctx.fill(); });
      boxes.forEach(b => { const bob = Math.sin(time * 5 + b.c) * 2, gold = b.kind === 'purpose' && S.allPurpose, blink = b.until - time < 3 && Math.floor(time * 6) % 2;
        if (blink) return; ctx.fillStyle = gold ? '#FFC93C' : '#FF6B4A'; ctx.beginPath(); (ctx.roundRect ? ctx.roundRect(b.c * T + 3, b.r * T + 3 + bob, T - 6, T - 6, 5) : ctx.rect(b.c * T + 3, b.r * T + 3 + bob, T - 6, T - 6)); ctx.fill();
        txt(gold ? '⭐' : '?', b.c * T + T / 2, b.r * T + T / 2 + bob + 1, gold ? 12 : 14, '#fff', gold); });
      const blinkP = time < S.safeUntil && Math.floor(time * 10) % 2;
      chasers.forEach(c => { if (!c.on) return; emo(c.e, c.x * T + T / 2, c.y * T + T / 2, 22); tag(t(c.tag), c.x * T + T / 2, c.y * T - 3); });
      if (agent.on) { const a = agent.anim, k = a ? (time - a.at) / 2 : 0;
        if (a && a.kind === 'happy') { emo('🥳', agent.x * T + T / 2, agent.y * T + T / 2 - k * 40, 22 + k * 10, 1 - k); }
        else if (a && a.kind === 'flip') { emo('🧑‍💼', agent.x * T + T / 2 + k * 60, agent.y * T + T / 2, 22, 1 - k, Math.PI * Math.min(1, k * 2)); }
        else { emo('🧑‍💼', agent.x * T + T / 2, agent.y * T + T / 2, 22); tag(t('chAgentTag'), agent.x * T + T / 2, agent.y * T - 3, '#2A9D8F'); } }
      if (!blinkP) emo(sad ? '😭' : S.insured ? '😎' : '🧑', P.x * T + T / 2, P.y * T + T / 2, 22);
      if (S.insured && !blinkP) emo('🛡️', P.x * T + T / 2 + 9, P.y * T + T / 2 + 8, 10);
      for (let i = parts.length - 1; i >= 0; i--) { const p = parts[i]; p.life -= 1 / 60; if (p.life <= 0) { parts.splice(i, 1); continue; } p.vy += 4; p.x += p.vx / 60; p.y += p.vy / 60; emo(p.e, p.x, p.y, 13, Math.min(1, p.life * 2)); }
      for (let i = floats.length - 1; i >= 0; i--) { const f = floats[i]; f.life -= 1 / 60; f.y -= 0.6; if (f.life <= 0) { floats.splice(i, 1); continue; } ctx.globalAlpha = Math.min(1, f.life); txt(f.txt, f.x, f.y, 12, f.col, true, 'rgba(255,255,255,.9)'); ctx.globalAlpha = 1; }
      if (flash && time - flash.at < 0.4) { ctx.globalAlpha = 0.5 * (1 - (time - flash.at) / 0.4); ctx.fillStyle = flash.c; ctx.fillRect(0, 0, W, H); ctx.globalAlpha = 1; }
      if (time < 2.2) txt('👆 ' + t('chHow'), W / 2, H / 2, 14, '#14213D', true, '#FFC93C');
    }
    function emo(e, x, y, s, a = 1, rot = 0) { ctx.save(); ctx.globalAlpha = Math.max(0, a); ctx.translate(x, y); if (rot) ctx.rotate(rot); ctx.font = `${s}px ${EF}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(e, 0, 0); ctx.restore(); }
    function txt(s, x, y, size, col, bold, bg) { ctx.save(); ctx.font = `${bold ? 800 : 600} ${size}px ${TF}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      if (bg) { const w = ctx.measureText(s).width + 10; ctx.fillStyle = bg; ctx.beginPath(); (ctx.roundRect ? ctx.roundRect(x - w / 2, y - size * 0.75, w, size * 1.5, 6) : ctx.rect(x - w / 2, y - size * 0.75, w, size * 1.5)); ctx.fill(); }
      ctx.fillStyle = col; ctx.fillText(s, x, y); ctx.restore(); }
    function tag(s, x, y, bg = '#E63946') { txt(s, x, y, 7, '#fff', true, bg); }

    function size() { const w = Math.min(host.clientWidth || 340, 560); dpr = Math.min(2, window.devicePixelRatio || 1); cv.width = Math.round(w * dpr); cv.height = Math.round(w * H / W * dpr); cv.style.width = w + 'px'; cv.style.height = Math.round(w * H / W) + 'px'; }
    function frame(now) {
      if (stopped) return; if (!host.isConnected) return stop();
      const dt = Math.min(0.05, last ? (now - last) / 1000 : 0); last = now;
      if (!paused) update(dt);
      if (!stopped) draw();
      raf = requestAnimationFrame(frame);
    }
    function stop() { stopped = true; music('main', 1); cancelAnimationFrame(raf); document.removeEventListener('keydown', key); window.removeEventListener('resize', size); }
    size(); window.addEventListener('resize', size); hud(); say(t('chStart')); music('arcade', 1);
    raf = requestAnimationFrame(frame);
    return { stop, skip: () => finish(S.purpose >= RULES.WIN) };
  };
  Object.assign(root.RLG_CHASE, API);
})(this);
