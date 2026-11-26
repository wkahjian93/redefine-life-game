// The 7 Concept Game "live movies". Each returns a scene for RLG_MOVIE.
// The customer controls the hero (drag / tap / hold); subtitles tell the story; the result goes to the next screen.
// Only approved figures (data.js), the customer's own numbers, or the agent's numbers are shown.
(function (root) {
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const GROUND = 192;

  root.RLG_SCENES = function (X) {
    const { t, rm, rmShort, F, M: MATH } = X;   // X.cust, X.C, X.A read live
    const hero = (M, x, y, e = '🧑', size = 34, moving = false, o = {}) => M.emoji(e, x, y + (moving ? -Math.abs(Math.sin(M.t * 12)) * 4 : 0), size, o);
    const ground = (M, c = '#7BC67E', y = GROUND + 14) => { M.rect(0, y, M.W, M.H - y, c); };
    const moveTo = (s, M, speed = 10, lo = 20, hi = 340) => { if (M.down && M.px != null) s.x += (M.px - s.x) * Math.min(1, M.dt * speed); s.x = clamp(s.x, lo, hi); };

    /* ---------- M1 Bill Rain: catch the small bills, the huge rare one can't be dodged ---------- */
    function m1() {
      const SMALL = [['🤧', 'm1c_flu'], ['📱', 'm1c_phone'], ['🚗', 'm1c_scratch']];
      const s = { x: 180, wallet: 1, items: [], caught: 0, next: 0, round: 1, big: null };
      const bigs = [{ e: '🫀', label: () => t('m1c_bypass') + ' · ' + rmShort(F.F1.min) + '–' + rmShort(F.F1.max) }, { e: '🎗️', label: () => t('m1c_cancer') + ' · ' + t('cgUpTo') + ' ' + rm(F.F7.rm) }];
      return {
        init: M => M.go(s, 'intro'),
        skip: () => ({ caught: s.caught }),
        update(M) {
          moveTo(s, M); const k = M.since(s);
          if (s.ph === 'intro') { M.sub(t('mv1_a')); if (k > 2.6) M.go(s, 'small'); }
          else if (s.ph === 'small') {
            M.sub(t(s.round === 1 ? 'mv1_b' : 'mv1_small2'));
            if (M.t > s.next) { const c = SMALL[Math.floor(Math.random() * 3)]; s.items.push({ e: c[0], k: c[1], x: 30 + Math.random() * 300, y: 10, v: 70 + Math.random() * 50 }); s.next = M.t + 0.75; }
            if (k > (s.round === 1 ? 10 : 6)) { M.go(s, 'warn'); M.sfx('drum'); M.title(t('mv1_warn')); }
          } else if (s.ph === 'warn') { M.sub(t('mv1_warn')); if (k > 1.8) { s.big = { ...bigs[s.round - 1], y: -90, vy: 60 }; M.go(s, 'big'); } }
          else if (s.ph === 'big') {
            const b = s.big; b.vy += 260 * M.dt; b.y += b.vy * M.dt;
            const hitY = s.round === 1 ? 150 : 95;
            if (b.y >= hitY && !b.hit) {
              b.hit = true;
              if (s.round === 1) { b.y = hitY; b.vy = 0; M.shake(800); M.flash('#E63946'); M.sfx('bad'); M.burst(s.x, 170, '💸', 16, 120); }
              else { b.vy = -330; M.sfx('good'); M.burst(s.x, 110, '✨', 14); }
            }
            if (b.hit && s.round === 1) { b.y = hitY; s.wallet = Math.max(0, s.wallet - M.dt * 1.5); }
            if (b.hit) M.sub(t(s.round === 1 ? 'mv1_hit' : 'mv1_cov'));
            if (k > 4) { if (s.round === 1) { s.round = 2; s.items = []; s.big = null; M.go(s, 'r2'); } else M.go(s, 'done'); }
          } else if (s.ph === 'r2') { M.sub(t('mv1_r2')); s.wallet = Math.min(1, s.wallet + M.dt * 0.5); if (k > 3.4) M.go(s, 'small'); }
          else if (s.ph === 'done') { M.sub(t('m1_feel')); if (M.first(s, 'c')) M.sfx('cheer'); if (k > 5) M.end({ caught: s.caught }); }
          // small bills
          s.items.forEach(it => {
            it.y += it.v * M.dt;
            if (!it.got && Math.abs(it.x - s.x) < 28 && Math.abs(it.y - 172) < 22) { it.got = true; s.caught++; s.wallet = Math.max(0.2, s.wallet - 0.03); M.sfx('coin'); M.burst(it.x, it.y, '🪙', 4, 50); }
          });
          s.items = s.items.filter(it => !it.got && it.y < 230);
          if (s.ph === 'small') s.wallet = Math.min(1, s.wallet + M.dt * 0.02);
        },
        draw(M) {
          M.sky('#9AD0FF', '#E6F4FF'); ground(M);
          M.emoji('🏙️', 300, GROUND - 10, 70, { alpha: 0.35 }); M.emoji('🌳', 40, GROUND - 6, 46, { alpha: 0.6 });
          s.items.forEach(it => { M.emoji(it.e, it.x, it.y, 26); M.text(t(it.k), it.x, it.y + 20, { size: 8, bg: 'rgba(255,255,255,.85)', bold: false }); });
          const shield = s.round === 2;
          hero(M, s.x, 176, s.round === 1 && s.big && s.big.hit ? '😵' : '🧑', 34, M.down);
          M.emoji('👛', s.x + 16, 186, 16);
          if (shield) M.emoji('☂️', s.x, s.big && s.ph === 'big' ? 132 : 148, s.big && s.ph === 'big' ? 64 : 24);
          if (s.big) { M.emoji(s.big.e, s.round === 1 ? s.x : s.x, s.big.y, 120, { rot: Math.sin(M.t * 3) * 0.1 }); M.text(s.big.label(), M.W / 2, Math.max(28, s.big.y - 70), { size: 12, color: '#fff', bg: '#E63946', maxW: 300 }); }
          M.bar(8, 22, 120, 14, s.wallet, s.wallet < 0.3 ? '#E63946' : '#2EC4B6', t('mv1_savings'));
          M.text(t('mv1_caught', { n: s.caught }), M.W - 60, 29, { size: 10, color: '#fff', bg: 'rgba(20,33,61,.75)' });
          if (s.ph === 'intro' || (s.ph === 'small' && M.since(s) < 2)) M.text('👆 ' + t('mv_drag'), M.W / 2, 60, { size: 12, bg: '#FFC93C' });
        }
      };
    }

    /* ---------- M2 The Organ Robber: walk home, he offers, you run, he takes, he sells back ---------- */
    function m2() {
      const s = { x: 40, off: 0, rx: 420, y: 0, vy: 0, obs: [], next: 0, said: [], caught: false };
      const jump = M => { if (s.y >= 0 && M.taps.length) { s.vy = -300; M.sfx('swoosh'); } };
      return {
        init: M => M.go(s, 'walk'),
        skip: () => ({ said: s.said }),
        update(M) {
          const k = M.since(s);
          if (s.ph === 'walk') {
            M.sub(t('mv2_walk')); if (M.down) { s.x += 60 * M.dt; s.off += 40 * M.dt; }
            if (s.x > 170 || k > 9) { M.go(s, 'pop'); M.sfx('drum'); M.shake(300); }
          } else if (s.ph === 'pop') { s.rx += (270 - s.rx) * Math.min(1, M.dt * 6); if (k > 0.9) { M.go(s, 'offer'); } }
          else if (s.ph === 'offer') {
            const n = s.said.length;
            if (M.first(s, 'b')) M.buttons([{ label: t('m2_deal'), v: 'deal', cls: 'hi' }, { label: t('m2_no'), v: 'no', cls: 'lo' }], v => { s.said.push(v); M.sfx(v === 'no' ? 'bad' : 'coin'); M.go(s, 'reply'); });
            M.sub(t('m2_bid', { organ: n === 0 ? t('m2_liver') : t('m2_eyes'), price: n === 0 ? 'RM1,000,000' : 'RM4,000,000' })); s.bubble = (n === 0 ? '🫁 ' : '👀 ') + (n === 0 ? 'RM1,000,000?' : 'RM4,000,000?');
          } else if (s.ph === 'reply') {
            s.bubble = null; M.sub(t(s.said[s.said.length - 1] === 'deal' ? 'm2_dealR' : 'm2_noR'));
            if (k > 2.2) M.go(s, s.said.length < 2 ? 'offer' : 'steal');
          } else if (s.ph === 'steal') { M.sub(t('m2_steal')); if (M.first(s, 'f')) { M.flash('#000'); M.sfx('bad'); } if (k > 2.2) { M.go(s, 'run'); s.rx = -10; s.x = 170; } }
          else if (s.ph === 'run') {
            M.sub(t('mv2_run')); jump(M); s.off += 150 * M.dt;
            if (M.t > s.next) { s.obs.push({ x: 380, e: Math.random() < 0.5 ? '🚧' : '🗑️' }); s.next = M.t + 1.1 + Math.random() * 0.8; }
            s.obs.forEach(o => { o.x -= 150 * M.dt; if (!o.hit && Math.abs(o.x - s.x) < 18 && s.y > -22) { o.hit = true; s.rx += 45; M.shake(250); M.sfx('bad'); } });
            s.obs = s.obs.filter(o => o.x > -20);
            s.rx += (k > 8 ? 40 : 7) * M.dt;
            if (s.rx >= s.x - 26) { M.go(s, 'caught'); M.shake(700); M.flash('#E63946'); M.sfx('bad'); M.burst(s.x, 160, '👁️', 4, 120); M.burst(s.x, 170, '🫁', 2, 120); }
          } else if (s.ph === 'caught') { M.sub(t('mv2_caught')); if (k > 3.2) { M.go(s, 'shop'); s.rx = 260; s.x = 110; } }
          else if (s.ph === 'shop') {
            M.sub(t('m2_sell', { a: 'RM1,000,000', b: 'RM4,000,000', c: 'RM5,000,000' })); s.bubble = '🫁👀 RM5,000,000';
            if (M.first(s, 'b')) M.buttons([{ label: t('m2_yes'), v: 1, cls: 'hot' }], () => { M.sfx('coin'); M.end({ said: s.said }); });
          }
          // jump physics
          s.vy += 800 * M.dt; s.y = Math.min(0, s.y + s.vy * M.dt); if (s.y === 0) s.vy = 0;
        },
        draw(M) {
          M.sky('#0B1330', '#2A3A6B'); M.emoji('🌙', 320, 40, 26);
          for (let i = 0; i < 6; i++) { const bx = ((i * 80 - s.off * 0.5) % 480 + 480) % 480 - 60; M.emoji('🏢', bx, GROUND - 20, 64, { alpha: 0.5 }); }
          ground(M, '#3B3B4F');
          s.obs.forEach(o => M.emoji(o.e, o.x, GROUND - 4, 24));
          const running = s.ph === 'run';
          hero(M, s.x, 176 + s.y, s.ph === 'caught' ? '😵' : running ? '🏃' : '🧑', 34, running || (s.ph === 'walk' && M.down), { flip: running });
          if (s.ph !== 'walk') M.emoji('🦹', s.rx, 172, s.ph === 'shop' ? 44 : 38, { flip: !running });
          if (s.ph === 'shop') M.emoji('🏪', s.rx + 40, 150, 40);
          if (s.bubble) M.text(s.bubble, Math.min(s.rx, 230), 92, { size: 12, bg: '#fff', maxW: 220, tail: 'r' });
          if (s.ph === 'walk') M.text('👆 ' + t('mv_hold'), M.W / 2, 60, { size: 12, bg: '#FFC93C' });
          if (running) { M.text('👆 ' + t('mv_tapJump'), M.W / 2, 50, { size: 12, bg: '#FFC93C' }); M.bar(M.W / 2 - 60, 66, 120, 10, clamp((s.rx + 10) / (s.x - 16), 0, 1), '#E63946'); }
        }
      };
    }

    /* ---------- I1 Sell your earning power: tap to work, Mr. TPD bids, you push him away ---------- */
    const BIDS = [100000, 300000, 500000, 1000000, 3000000, 10000000];
    function i1() {
      const c = X.cust, A = X.A(), yrs = Math.max(1, A.retireAge - c.age);
      const s = { year: 0, b: 0, tx: 420, tsize: 40, sold: null, pile: 0, coins: [] };
      const value = () => MATH.earningValue(c.income, c.age, A.retireAge);
      const work = M => { if (s.year >= yrs) return; s.year++; s.coins.push({ x: 80, y: 150, t: 0 }); M.sfx('coin'); if (s.year >= yrs) { M.go(s, 'value'); M.clearButtons(); } };
      return {
        init(M) { M.go(s, 'work'); M.buttons([{ label: t('mv3_btn'), v: 1, cls: 'hot big', keep: true }], () => work(M)); },
        skip: () => ({ sold: s.sold }),
        update(M) {
          const k = M.since(s);
          if (s.ph === 'work') { M.sub(t('mv3_work')); M.taps.forEach(() => work(M)); }
          else if (s.ph === 'value') { M.sub(t('mv3_done', { a: rm(value()) })); if (M.first(s, 'c')) { M.sfx('cheer'); M.burst(270, 150, '✨', 14); } if (k > 3.2) M.go(s, 'walkin'); }
          else if (s.ph === 'walkin') { M.sub(t('mv3_tpd')); s.tx += (250 - s.tx) * Math.min(1, M.dt * 5); if (k > 1) M.go(s, 'bid'); }
          else if (s.ph === 'bid') {
            M.sub(t('mv3_bid', { a: rm(BIDS[s.b]) })); s.bubble = rm(BIDS[s.b]) + '?';
            if (M.first(s, 'b')) M.buttons([{ label: t('i1_sell'), v: 'sell', cls: 'lo' }, { label: t('i1_no'), v: 'no', cls: 'hi' }], v => {
              s.bubble = null;
              if (v === 'sell') { s.sold = BIDS[s.b]; M.sfx('drum'); M.go(s, 'sold'); }
              else { M.sfx('swoosh'); s.b++; M.go(s, s.b >= BIDS.length ? 'never' : 'push'); }
            });
          } else if (s.ph === 'push') { s.tx += 600 * M.dt; M.sub(t('mv3_back')); if (k > 0.8) { s.tsize = 40 + s.b * 6; M.go(s, 'walkin'); } }
          else if (s.ph === 'never') { s.tx += 600 * M.dt; M.sub(t('i1_never')); if (M.first(s, 'g')) M.sfx('good'); if (k > 2.4) { s.tx = 420; M.go(s, 'take'); } }
          else if (s.ph === 'sold') { M.sub(t('i1_sold', { a: rm(s.sold) })); if (k > 2.4) M.go(s, 'take'); }
          else if (s.ph === 'take') {
            M.sub(t('mv3_take')); if (s.tx > 280) s.tx -= 200 * M.dt; else { s.pile = Math.min(1, s.pile + M.dt * 0.8); if (M.first(s, 's')) { M.shake(500); M.sfx('bad'); } }
            if (k > 4.2) M.end({ sold: s.sold });
          }
          s.coins.forEach(co => { co.t += M.dt * 2; co.x = 80 + (270 - 80) * Math.min(1, co.t); co.y = 150 - Math.sin(Math.min(1, co.t) * Math.PI) * 70; });
          s.coins = s.coins.filter(co => co.t < 1);
        },
        draw(M) {
          M.sky('#FFE8C2', '#FFF8EE'); ground(M, '#D9C3A0');
          M.emoji('💻', 80, 178, 30); hero(M, 55, 176, s.ph === 'take' && s.pile > 0.5 ? '😱' : '🧑‍💼', 34, s.ph === 'work' && M.taps.length > 0);
          const f = s.year / yrs, px = 270 + s.pile * 120;
          M.emoji('💰', px, 178 - f * 14, 22 + f * 46, { alpha: 1 - s.pile * 0.8 });
          s.coins.forEach(co => M.emoji('🪙', co.x, co.y, 16));
          if (s.ph !== 'work' && s.ph !== 'value') M.emoji('🕴️', s.tx, 172, s.tsize);
          if (s.ph !== 'work') M.text(rm(value()), 270, 116, { size: 13, color: '#14213D', bg: '#FFC93C' });
          if (s.bubble) M.text(s.bubble, 200, 70, { size: 12, bg: '#fff', maxW: 220, tail: 'r' });
          M.hud(t('mv3_age', { a: c.age + s.year }), rm(c.income * 12 * s.year));
          if (s.ph === 'work') M.text('👆 ' + t('mv_tapFast'), M.W / 2, 60, { size: 12, bg: '#FFC93C' });
        }
      };
    }

    /* ---------- I2 The Money Tree: move the salary cloud to grow the tree; then the rain stops ---------- */
    function i2() {
      const c = X.cust, A = X.A(), need = A.ciYears * 12, n0 = Math.min(999, MATH.monthsLast(c.savings, 0, c.spend));
      const FR = ['🏠', '🚗', '🎓', '👵', '✈️', '💍', '🎁', '🏖️'], POS = [[-30, -62], [0, -78], [30, -62], [-40, -40], [40, -40], [-15, -48], [15, -50], [0, -30]];
      const s = { x: 120, g: 0, drops: [], month: 0, cause: null, next: 0 };
      return {
        init: M => M.go(s, 'grow'),
        skip: () => ({ cause: s.cause || 'ci' }),
        update(M) {
          const k = M.since(s);
          if (s.ph === 'grow') {
            M.sub(t('mv4_grow')); moveTo(s, M, 8, 40, 320);
            if (M.t > s.next) { s.drops.push({ x: s.x - 22 + Math.random() * 44, y: 58 }); s.next = M.t + 0.05; }
            if (s.g >= 1) { M.go(s, 'full'); M.sfx('cheer'); M.burst(180, 110, '✨', 16); }
          } else if (s.ph === 'full') {
            M.sub(t('i2_full'));
            if (k > 2.2 && M.first(s, 'b')) M.buttons([{ label: t('i2_ci'), v: 'ci', cls: 'lo' }, { label: t('i2_tpd'), v: 'tpd', cls: 'lo' }], v => { s.cause = v; M.sfx('bad'); M.shake(500); M.go(s, 'stop'); });
            if (k > 2.2) M.sub(t('mv4_stop'));
          } else if (s.ph === 'stop') { M.sub(t('i2_drought', { a: rm(c.spend) })); if (k > 3) M.go(s, 'drop'); }
          else if (s.ph === 'drop') {
            const target = Math.min(n0, need + 6), prev = s.month;
            s.month = Math.min(target, Math.floor(k / 3.5 * target + 0.0001) || 0);
            if (s.month !== prev && s.month % 3 === 0) M.sfx('flip');
            M.sub(t('mv4_month', { n: s.month }));
            if (k > 3.9) M.go(s, 'out');
          } else if (s.ph === 'out') {
            M.sub(n0 >= need ? t('mv4_ok', { n: n0 >= 999 ? '∞' : n0, m: need }) : t('mv4_out', { n: n0, m: need }));
            if (M.first(s, 's')) M.sfx(n0 >= need ? 'good' : 'bad');
            if (k > 4) M.end({ cause: s.cause });
          }
          s.drops.forEach(d => { d.y += 220 * M.dt; if (!d.done && d.y > 130 && Math.abs(d.x - 180) < 48) { d.done = true; s.g = Math.min(1, s.g + 0.011); } });
          s.drops = s.drops.filter(d => !d.done && d.y < GROUND + 10);
        },
        draw(M) {
          const dry = s.ph === 'stop' || s.ph === 'drop' || s.ph === 'out';
          M.sky(dry ? '#E9C9A0' : '#A8DCFF', dry ? '#FFF1DC' : '#EAF7FF'); ground(M, dry ? '#C9A26B' : '#7BC67E');
          const fruitsLeft = s.ph === 'drop' || s.ph === 'out' ? Math.max(0, Math.round(8 * (1 - s.month / Math.max(1, Math.min(n0, need + 6)) * (n0 >= need ? 0.5 : 1)))) : Math.floor(s.g * 8 + 0.001);
          M.emoji(dry && fruitsLeft === 0 ? '🪵' : '🌳', 180, 150, 40 + Math.min(1, s.g) * 70);
          FR.slice(0, fruitsLeft).forEach((f, i) => M.emoji(f, 180 + POS[i][0] * (0.5 + s.g * 0.5), 150 + POS[i][1] * (0.5 + s.g * 0.5), 16));
          if (!dry) { M.emoji('☁️', s.x, 44, 52); s.drops.forEach(d => M.emoji('💧', d.x, d.y, 10)); M.text(rmShort(c.income) + '/mo', s.x, 44, { size: 9, color: '#14213D' }); }
          else M.emoji('☀️', 300, 46, 34);
          hero(M, 60, 176, dry ? (s.cause === 'tpd' ? '🧑‍🦽' : '🤒') : '🧑', 32);
          if (dry) { M.emoji('👨‍👩‍👧', 290, 178, 30); M.hud(t('mv4_month', { n: s.month }), rm(Math.max(0, c.savings - s.month * c.spend))); }
          else M.bar(8, 22, 120, 14, s.g, '#2EC4B6', t('mv4_tree'));
          if (s.ph === 'grow' && M.since(s) < 3) M.text('👆 ' + t('mv_dragCloud'), M.W / 2, 90, { size: 12, bg: '#FFC93C' });
        }
      };
    }

    /* ---------- S1 Temptation Jar: run and jump over temptations; open jar vs locked jar ---------- */
    function s1() {
      const c = X.cust, m = c.monthly || 0, list = X.C().list;
      const s = { y: 0, vy: 0, off: 0, months: 0, spent: 0, items: [], spawned: 0, round: 1, plan: [] };
      const amount = () => s.round === 1 ? Math.max(0, m * s.months - s.spent * 6 * m) : m * s.months;
      const startRound = (M, r) => { s.round = r; s.months = 0; s.items = []; s.spawned = 0; s.plan = r === 1 ? [2.5, 5, 7.5, 10, 12.5, 15, 17.5, 20] : [2, 4.5, 7, 9.5, 12]; M.go(s, 'run'); };
      return {
        init: M => M.go(s, 'i1'),
        skip: () => ({ spent: s.spent }),
        update(M) {
          const k = M.since(s);
          if (s.ph === 'i1') { M.sub(t('mv5_r1')); if (k > 3) startRound(M, 1); }
          else if (s.ph === 'run') {
            const dur = s.round === 1 ? 23 : 15; s.months = Math.min(120, Math.floor(k / dur * 120));
            M.sub(s.round === 1 ? t('mv_tapJump') : t('s1_bounce'));
            if (M.taps.length && s.y >= 0) { s.vy = -310; M.sfx('swoosh'); }
            s.off += 120 * M.dt;
            if (s.spawned < s.plan.length && k > s.plan[s.spawned]) { s.items.push({ x: 390, txt: list[(s.spawned + (s.round - 1) * 3) % list.length], e: ['🛍️', '📱', '✈️', '🚗', '🛒', '🎫', '🛋️', '🎁', '🎮', '🍽️'][(s.spawned * 3 + s.round) % 10] }); s.spawned++; }
            s.items.forEach(it => {
              it.x -= (130 + s.spawned * 6) * M.dt;
              if (!it.done && Math.abs(it.x - 110) < 20 && s.y > -26) {
                it.done = true; it.hit = true;
                if (s.round === 1) { s.spent++; M.sfx('bad'); M.shake(300); M.burst(110, 140, '🪙', 8, 110); it.msg = t('mv5_hit'); }
                else { M.sfx('flip'); M.burst(110, 130, '🔒', 3, 80); it.vx = 200; it.msg = '🔒'; }
              }
              if (!it.done && it.x < 90) { it.done = true; M.sfx('good'); }
            });
            s.items = s.items.filter(it => it.x > -60);
            if (k > dur + 0.5) { M.go(s, s.round === 1 ? 'e1' : 'e2'); }
          } else if (s.ph === 'e1') { M.sub(t('mv5_end1', { a: rm(amount()) })); if (k > 3.4) M.go(s, 'i2'); }
          else if (s.ph === 'i2') { M.sub(t('mv5_r2')); if (k > 3.2) startRound(M, 2); }
          else if (s.ph === 'e2') { M.sub(t('mv5_end2', { a: rm(amount()) })); if (M.first(s, 'c')) M.sfx('cheer'); if (k > 3.6) M.end({ spent: s.spent }); }
          s.vy += 820 * M.dt; s.y = Math.min(0, s.y + s.vy * M.dt); if (s.y === 0) s.vy = 0;
        },
        draw(M) {
          M.sky('#FFD6E8', '#FFF5FA');
          for (let i = 0; i < 5; i++) { const bx = ((i * 100 - s.off * 0.6) % 500 + 500) % 500 - 70; M.emoji(i % 2 ? '🏬' : '🏪', bx, GROUND - 22, 56, { alpha: 0.45 }); }
          ground(M, '#B9A3C9');
          s.items.forEach(it => { M.emoji(it.e, it.x, 176, 28); M.text(it.msg || it.txt, it.x, 140, { size: 9, bg: it.hit ? (s.round === 1 ? '#E63946' : '#2EC4B6') : '#fff', color: it.hit ? '#fff' : '#14213D', maxW: 110 }); });
          hero(M, 110, 176 + s.y, '🏃', 34, s.ph === 'run', { flip: true });
          M.emoji(s.round === 1 ? '🫙' : '🔒', 110, 144 + s.y, s.round === 1 ? 20 : 18);
          M.hud(t('s1_yearN', { n: Math.min(10, Math.ceil(s.months / 12) || 0) }), (s.round === 1 ? '🫙 ' : '🔒 ') + rm(amount()));
        }
      };
    }

    /* ---------- S2 The Monk's Well: fetch water every day, tap to dig; then the drought ---------- */
    function s2() {
      const s = { day: 0, depth: 0, ax: 300, bx: 315, river: 1 };
      const dig = M => { if (s.ph !== 'dig' || s.today >= 7) return; s.today++; s.depth = Math.min(1, s.depth + 0.05); M.sfx('coin'); M.burst(255, 182, '🟫', 2, 60); };
      return {
        init: M => M.go(s, 'intro'),
        skip: () => ({}),
        update(M) {
          const k = M.since(s);
          if (s.ph === 'intro') { M.sub(t('mv6_a')); if (k > 3) M.go(s, 'walk'); }
          else if (s.ph === 'walk') {
            M.sub(t('mv6_day', { n: s.day + 1 })); const p = Math.min(1, k / 2.2), there = Math.sin(p * Math.PI);
            s.ax = 300 - there * 225; s.bx = 315 - there * 225;
            if (k > 2.2) { s.day++; s.today = 0; M.go(s, 'dig'); M.buttons([{ label: t('mv6_btn'), v: 1, cls: 'hot big', keep: true }], () => dig(M)); }
          } else if (s.ph === 'dig') {
            M.sub(s.today >= 7 ? t('mv6_enough') : t('mv6_dig')); M.taps.forEach(() => dig(M)); s.bx = 270;
            if (s.depth >= 1) { M.clearButtons(); M.go(s, 'done'); M.sfx('cheer'); M.burst(255, 170, '💧', 12); }
            else if (k > 3 || (s.today >= 7 && k > 1.2)) { M.clearButtons(); if (s.day >= 8) s.depth = Math.min(1, s.depth + 0.25); M.go(s, 'walk'); }
          } else if (s.ph === 'done') { M.sub(t('s2_done')); if (k > 2.4) M.go(s, 'drought'); }
          else if (s.ph === 'drought') { s.river = Math.max(0, 1 - k / 2); M.sub(t('s2_drought')); if (M.first(s, 'd')) M.sfx('bad'); if (k > 2.6) M.go(s, 'a'); }
          else if (s.ph === 'a') { s.ax = Math.max(-20, 300 - k * 70); M.sub(t('s2_a')); if (k > 3.2) M.go(s, 'b'); }
          else if (s.ph === 'b') { M.sub(t('s2_b')); if (M.first(s, 'b')) M.burst(255, 170, '💧', 10); if (k > 3) M.go(s, 'feel'); }
          else if (s.ph === 'feel') { M.sub(t('s2_feel')); if (k > 5) M.end({}); }
        },
        draw(M) {
          const hot = ['drought', 'a', 'b', 'feel'].includes(s.ph);
          M.sky(hot ? '#FFB36B' : '#BDE6FF', hot ? '#FFE7C2' : '#F1FAFF'); ground(M, hot ? '#D7B07A' : '#9CD38A');
          M.emoji(hot ? '☀️' : '⛅', 300, 44, hot ? 44 : 30);
          M.rect(0, GROUND + 6, 70 * s.river + 2, 22, '#4FA3E0', 6); if (s.river > 0.1) M.emoji('🌊', 30, GROUND + 8, 18, { alpha: s.river });
          M.emoji('🛕', 335, 160, 40);
          // well
          M.rect(232, GROUND + 4, 46, 10, '#6B4F2A', 5); M.bar(230, 70, 50, 10, s.depth, '#4FA3E0', '');
          M.text(t('mv6_well'), 255, 58, { size: 9, bg: '#fff' }); if (s.depth >= 1) M.emoji('💧', 255, 190, 18);
          const away = s.ph === 'a';
          hero(M, s.ax, 176, away ? '🥵' : '🧑‍🦲', 30, s.ph === 'walk' || away); M.text('A', s.ax, 150, { size: 9, bg: '#fff' }); if (s.ph === 'walk' || away) M.emoji('🪣', s.ax + 12, 186, 14);
          const relax = ['b', 'feel'].includes(s.ph);
          hero(M, s.bx, 176, relax ? '🧘' : '🧑‍🦲', 30, s.ph === 'walk'); M.text('B', s.bx, 150, { size: 9, bg: '#FFC93C' });
          if (s.ph === 'dig') M.emoji('⛏️', s.bx - 14, 184, 18, { rot: Math.sin(M.t * 18) * 0.6 });
          M.hud(t('mv6_day', { n: Math.max(1, s.day) }), Math.round(s.depth * 100) + '%');
          if (s.ph === 'dig' && M.since(s) < 1.5) M.text('👆 ' + t('mv_tapFast'), M.W / 2, 100, { size: 12, bg: '#FFC93C' });
        }
      };
    }

    /* ---------- L1 Spend it or leave it: walk your life road; each dream costs the kids — then with a plan ---------- */
    function l1(plan) {
      const c = X.cust, C = X.C(), dreams = C.dreams, cost = Number(C.planCost) || 0, leg = Number(C.planLeg) || 0;
      const s = { wx: 30, cam: 0, i: 0, chosen: plan ? dreams.map(() => true) : C.chosen.map(() => false), me: 0, kids: c.assets, gift: 0, sad: 0 };
      const stallX = i => 230 + i * 230, endX = stallX(dreams.length) - 60;
      return {
        init(M) { if (plan) { s.kids = Math.max(0, c.assets - cost); M.go(s, 'gift'); } else M.go(s, 'walk'); },
        skip: () => ({ chosen: s.chosen }),
        update(M) {
          const k = M.since(s);
          if (s.ph === 'gift') { M.sub(t('mv7_plan')); s.gift = Math.min(1, k / 2.6); if (M.first(s, 'g')) M.sfx('coin'); if (k > 2.6 && M.first(s, 'c')) { M.sfx('cheer'); M.burst(90, 150, '✨', 14); } if (k > 4) M.go(s, 'walk'); }
          else if (s.ph === 'walk') {
            M.sub(plan ? t('mv7_free') : t('mv7_walk'));
            if (M.down || plan) s.wx += (plan ? 85 : 75) * M.dt;
            if (s.i < dreams.length && s.wx >= stallX(s.i) - 40) { s.wx = stallX(s.i) - 40; M.go(s, 'stall'); }
            if (s.i >= dreams.length && s.wx >= endX) M.go(s, 'end');
          } else if (s.ph === 'stall') {
            const d = dreams[s.i];
            M.sub(t(plan ? 'mv7_yes' : 'mv7_stall', { d: t('ld_' + d.id), c: rmShort(d.cost) }));
            const decide = yes => { s.chosen[s.i] = yes; if (yes) { s.me += d.cost; s.kids = Math.max(0, s.kids - d.cost); if (!plan) { s.sad = M.t + 2.2; M.burst(s.wx - s.cam - 50, 150, '🪙', 8, 100); } else M.burst(stallX(s.i) - s.cam, 140, '🎉', 10); M.sfx(plan ? 'cheer' : 'coin'); } else M.sfx('bad'); s.i++; M.go(s, yes && !plan ? 'sad' : 'walk'); };
            if (plan) { if (k > 1.2 && M.first(s, 'a')) decide(true); }
            else if (M.first(s, 'b')) M.buttons([{ label: t('l1_do'), v: 1, cls: 'hi' }, { label: t('l1_skip'), v: 0, cls: 'lo' }], v => decide(!!v));
          } else if (s.ph === 'sad') { M.sub(t('mv7_kidsSad')); if (k > 2.4) M.go(s, 'walk'); }
          else if (s.ph === 'end') {
            const r = MATH.legacy(c.assets, dreams, plan ? s.chosen : s.chosen, cost, leg);
            M.sub(plan ? t(r.plan.kids >= r.noPlan.kids ? 'l1_both' : 'l1_less') : t('l1_guilt'));
            if (M.first(s, 'e') && plan) { M.sfx(r.plan.kids >= r.noPlan.kids ? 'cheer' : 'bad'); }
            if (k > 4) M.end({ chosen: plan ? C.chosen : s.chosen });
          }
          s.cam += (Math.max(0, s.wx - 140) - s.cam) * Math.min(1, M.dt * 5);
        },
        draw(M) {
          M.sky(plan ? '#FFE9A8' : '#CFE8FF', plan ? '#FFF8E1' : '#F4FAFF'); ground(M, '#A7D49B');
          M.rect(0, GROUND + 10, M.W, 8, '#E0C9A6');
          dreams.forEach((d, i) => { const x = stallX(i) - s.cam; if (x < -60 || x > 420) return;
            M.emoji(t('ld_' + d.id).split(' ')[0], x, 150, 40); M.text(rmShort(d.cost), x, 118, { size: 10, bg: '#fff' });
            if (s.chosen[i] && i < s.i) M.emoji('✅', x + 22, 130, 14); else if (i < s.i) M.emoji('❌', x + 22, 130, 14); });
          const hx = s.wx - s.cam, walking = s.ph === 'walk' && (M.down || plan);
          hero(M, hx, 176, '🧑', 32, walking, { flip: true });
          const kidsSad = M.t < s.sad;
          M.emoji(kidsSad ? '😢' : '👧', hx - 46, 182, 24, { flip: true }); M.emoji('👦', hx - 70, 182, 24, { flip: true });
          M.emoji('💰', hx - 58, 160, 14 + Math.min(30, s.kids / Math.max(1, c.assets) * 22));
          if (plan) M.emoji('🎁', hx - 58, 136, 14 + s.gift * 18);
          M.hud(t('mv7_me') + ' ' + rmShort(s.me), t('mv7_kids') + ' ' + rmShort(s.kids + (plan ? leg * s.gift : 0)));
          if (!plan && s.ph === 'walk' && s.i === 0 && M.since(s) < 3) M.text('👆 ' + t('mv_hold'), M.W / 2, 70, { size: 12, bg: '#FFC93C' });
          if (s.ph === 'gift') { M.emoji('🪙', 90 + (1 - s.gift) * 40, 120 + s.gift * 20, 16, { alpha: 1 - s.gift }); M.text(t('l1_leg').replace(/\s*\(RM\)/, '') + ': ' + rm(leg * s.gift), M.W / 2, 90, { size: 12, bg: '#FFC93C' }); }
        }
      };
    }

    /* ---------- G1 Kelvin's story (critical care): a cartoon movie with narration; the customer controls Kelvin ---------- */
    function g1() {
      const C = X.C(), amt = Number(C.g1amt) || 0, SAL = 8000, LIGHT = 4000;
      const lump = () => amt ? rm(amt) : t('g1_lumpGeneric');
      const TASKS = ['g1_task1', 'g1_task2', 'g1_task3', 'g1_task4', 'g1_task5', 'g1_task6', 'g1_task7'];
      const s = { x: 40, salary: SAL, prog: 0, fly: null, fight: 0, day: 0, walk: 0, tasks: [], spawned: 0, caught: 0, lost: 0, savings: 1, pay: 0, top: 0, rain: [] };
      const say = (M, k, v) => { if (M.first(s, 'n' + k)) M.narrate(t(k, v), k); };
      const next = (M, ph) => { M.clearButtons(); M.go(s, ph); };
      return {
        voice: true,
        init: M => M.go(s, 'office'),
        skip: () => ({}),
        update(M) {
          const k = M.since(s), tap = M.taps.length > 0;
          switch (s.ph) {
            case 'office':     // 1. a skilled young engineer with a bright future: tap to work
              say(M, 'g1_n1');
              if (tap) { s.prog = Math.min(1, s.prog + 0.13); M.sfx('coin'); M.burst(120, 120, '⚙️', 3, 60); }
              if (k > 7) s.prog = Math.min(1, s.prog + M.dt * 0.15);
              if (s.prog >= 1 && M.first(s, 'star')) { M.sfx('cheer'); M.burst(90, 110, '⭐', 10); M.title(t('g1_great')); }
              if (s.prog >= 1 && !M.talking() && k > 3) next(M, 'walk');
              break;
            case 'walk':       // 2. walking home: hold to walk to the crossing
              say(M, 'g1_n2');
              if (M.down || k > 7) s.x += 55 * M.dt;
              if (s.x >= 182) { s.x = 182; next(M, 'green'); }
              break;
            case 'green':      // 3. green light: tap to cross
              say(M, 'g1_n3');
              if ((tap || k > 6) && k > 0.6) next(M, 'cross');
              break;
            case 'cross':      // 4. a car runs the red light
              if (!s.fly) s.x += 45 * M.dt; s.car = -60 + k * 260;
              if (!s.fly && s.car >= s.x - 20) { s.fly = { t: M.t }; M.flash('#fff'); M.shake(800); M.sfx('bad'); M.burst(s.x, 170, '💥', 8, 120); }
              if (s.fly) { const f = Math.min(1.1, M.t - s.fly.t); s.fx = s.x + f * 95; s.fy = 176 - Math.sin(f / 1.1 * Math.PI) * 90 + (f >= 1.1 ? 8 : 0); s.rot = f / 1.1 * Math.PI * 3.5; say(M, 'g1_n4'); if (f > 1.1 && M.first(s, 'land')) { M.shake(500); M.burst(s.fx, 180, '💫', 6); } }
              if (s.fly && M.t - s.fly.t > 2 && !M.talking()) next(M, 'icu');
              break;
            case 'icu':        // 5. ICU for 2 weeks: tap with the heartbeat to keep fighting
              say(M, 'g1_n5');
              if (tap) { s.fight++; M.sfx('flip'); M.burst(250, 120, '❤️', 3, 50); }
              s.day = Math.min(14, Math.max(s.day, Math.floor(k * 0.9), Math.floor(s.fight * 1.4)));
              if (s.day >= 14 && k > 3 && M.first(s, 'ok')) { M.sfx('good'); M.narrate(t('g1_n6'), 'g1_n6'); }
              if (s.day >= 14 && s.once.ok && !M.talking()) next(M, 'physio');
              break;
            case 'physio':     // 6. 5 months of physiotherapy: hold to walk
              say(M, 'g1_n7');
              if (M.down || k > 9) s.walk = Math.min(1, s.walk + M.dt * 0.14);
              if (s.walk >= 1 && M.first(s, 'done')) { M.sfx('cheer'); M.burst(300, 150, '🎉', 12); M.narrate(t('g1_n8'), 'g1_n8'); }
              if (s.walk >= 1 && s.once.done && !M.talking()) next(M, 'work2');
              break;
            case 'work2':      // 7. back at work: tap the tasks before he forgets them
              say(M, 'g1_n9');
              if (s.spawned < TASKS.length && k > 1.5 + s.spawned * 1.3) { s.tasks.push({ k: TASKS[s.spawned], x: 70 + Math.random() * 220, y: 50 + Math.random() * 80, t: M.t }); s.spawned++; }
              M.taps.forEach(p => { const hit = s.tasks.find(q => !q.gone && Math.abs(q.x - p.x) < 50 && Math.abs(q.y - p.y) < 16 && M.t - q.t > 0.25); if (hit) { hit.gone = 'got'; s.caught++; M.sfx('coin'); } });
              s.tasks.forEach(q => { if (!q.gone && M.t - q.t > 1.1) { q.gone = 'lost'; s.lost++; M.sfx('bad'); } });
              if (s.spawned >= TASKS.length && s.tasks.every(q => q.gone) && k > 3) { M.narrate(t('g1_n10'), 'g1_n10'); next(M, 'fired'); }
              break;
            case 'fired':      // 8. he can't do the high-pressure job any more: fired
              if (!M.talking() && M.first(s, 'f')) { M.narrate(t('g1_n11'), 'g1_n11'); M.sfx('bad'); M.shake(300); }
              if (s.once.f) s.salary = Math.max(0, s.salary - M.dt * 6000);
              if (s.once.f && s.salary <= 0 && !M.talking()) next(M, 'dark');
              break;
            case 'dark':       // 9. depression: life falls apart
              say(M, 'g1_n12'); s.savings = Math.max(0, s.savings - M.dt * 0.12);
              if (Math.random() < 0.5) s.rain.push({ x: Math.random() * 360, y: 16 });
              if (k > 4 && !M.talking()) { M.title(t('g1_rewind')); M.sfx('swoosh'); next(M, 'rewind'); }
              break;
            case 'rewind':     // 10. rewind: same story with a critical care plan
              say(M, 'g1_n13'); s.rain = [];
              if (k > 2.4 && !M.talking()) { Object.assign(s, { x: 200, fly: null, salary: SAL, savings: 1 }); next(M, 'bcrash'); }
              break;
            case 'bcrash':     // 11. same accident, same ICU
              say(M, 'g1_n14'); s.car = -60 + k * 260;
              if (!s.fly && s.car >= s.x - 20) { s.fly = { t: M.t }; M.flash('#fff'); M.shake(600); M.sfx('bad'); }
              if (s.fly) { const f = Math.min(1.1, M.t - s.fly.t); s.fx = s.x + f * 95; s.fy = 176 - Math.sin(f / 1.1 * Math.PI) * 90 + (f >= 1.1 ? 8 : 0); s.rot = f / 1.1 * Math.PI * 3.5; }
              if (s.fly && M.t - s.fly.t > 1.6 && !M.talking()) next(M, 'bpay');
              break;
            case 'bpay':       // 12. this time the plan pays a lump sum: tap to collect
              say(M, 'g1_n15', { a: lump() });
              if (tap) { s.pay = Math.min(1, s.pay + 0.12); M.sfx('coin'); M.burst(250, 150, '💰', 4, 90); }
              if (k > 6) s.pay = Math.min(1, s.pay + M.dt * 0.2);
              if (s.pay >= 1 && M.first(s, 'p')) { M.sfx('cheer'); M.title('🛡️ ' + lump()); }
              if (s.pay >= 1 && !M.talking() && k > 3) next(M, 'bjob');
              break;
            case 'bjob':       // 13. lighter job + the payout tops up his income
              say(M, 'g1_n16');
              s.salary = LIGHT;
              if (tap) { s.top = Math.min(1, s.top + 0.15); M.sfx('coin'); M.burst(90, 150, '🪙', 4, 80); }
              if (k > 7) s.top = Math.min(1, s.top + M.dt * 0.2);
              if (s.top >= 1 && !M.talking() && k > 3) next(M, 'happy');
              break;
            case 'happy':      // 14. same accident, a different life
              if (M.first(s, 'h')) { M.narrate(t('g1_n17'), 'g1_n17'); M.sfx('cheer'); M.burst(180, 120, '🎉', 16); }
              if (k > 3 && !M.talking()) M.end({});
              break;
          }
          s.rain.forEach(r => { r.y += 220 * M.dt; }); s.rain = s.rain.filter(r => r.y < 224);
          s.tasks = s.tasks.filter(q => !q.gone || M.t - q.t < 2.2);
        },
        draw(M) {
          const ph = s.ph, street = ['walk', 'green', 'cross', 'bcrash'].includes(ph), office = ['office', 'work2', 'fired', 'bjob'].includes(ph), hosp = ['icu', 'bpay'].includes(ph);
          if (office) { M.sky('#DDE7F2', '#F4F8FC'); M.rect(0, 206, 360, 18, '#B8C4D6'); M.rect(230, 40, 100, 70, '#9AD0FF', 6); M.emoji('🏙️', 280, 80, 46, { alpha: 0.6 }); M.rect(70, 168, 110, 10, '#8B6B4A', 3); M.emoji('💻', 125, 154, 28); }
          else if (street) { M.sky('#FFB36B', '#FFE0B8'); for (let i = 0; i < 5; i++) M.emoji('🏢', 30 + i * 80, 150, 54, { alpha: 0.45 }); M.rect(0, 196, 360, 28, '#555A66'); for (let i = 0; i < 6; i++) M.rect(190 + i * 14, 198, 8, 24, '#fff'); M.emoji('🚦', 176, 150, 30); M.text(ph === 'green' ? '🟢' : '', 176, 120, { size: 14 }); }
          else if (hosp) { M.sky('#E6F7F5', '#FFFFFF'); M.rect(0, 206, 360, 18, '#CFE9E5'); M.rect(220, 70, 110, 60, '#14213D', 8);
            M.ctx.save(); M.ctx.strokeStyle = '#2EF2A0'; M.ctx.lineWidth = 2; M.ctx.beginPath(); for (let x = 0; x < 100; x++) { const ph2 = (x + M.t * 60) % 50, y = ph2 > 20 && ph2 < 24 ? -18 : ph2 >= 24 && ph2 < 27 ? 10 : 0; M.ctx.lineTo(225 + x, 100 + y); } M.ctx.stroke(); M.ctx.restore();
            M.text('ICU', 240, 80, { size: 10, color: '#2EF2A0' }); M.emoji('🛏️', 120, 178, 70); }
          else if (ph === 'physio') { M.sky('#FFF4D6', '#FFFDF5'); M.rect(0, 206, 360, 18, '#E8D9B0'); M.rect(40, 150, 280, 5, '#999', 2); M.rect(40, 176, 280, 5, '#999', 2); }
          else if (ph === 'dark') { M.sky('#2B2D3A', '#4A4D5E'); M.rect(0, 206, 360, 18, '#3A3C48'); M.emoji('🌧️', 180, 50, 50); s.rain.forEach(r => M.rect(r.x, r.y, 2, 8, '#8FB3FF')); }
          else if (ph === 'rewind') { M.sky('#14213D', '#2A3A6B'); for (let y = 20; y < 220; y += 6) M.rect(0, y, 360, 1, 'rgba(255,255,255,.08)'); M.emoji('⏪', 180, 110, 70, { alpha: 0.7 + Math.sin(M.t * 8) * 0.3 }); }
          else if (ph === 'happy') { M.sky('#9AD0FF', '#FFF8E1'); M.rect(0, 200, 360, 24, '#7BC67E'); M.emoji('☀️', 310, 46, 40); M.emoji('🌳', 50, 160, 60); }

          // Kelvin
          if (ph === 'office') { M.emoji('🧑‍💻', 90, 160, 40); M.bar(20, 24, 140, 14, s.prog, '#2EC4B6', t('g1_project')); }
          if (street) { if (s.fly) { M.emoji('😵', s.fx, s.fy, 34, { rot: s.rot }); if (M.t - s.fly.t > 1.1) M.emoji('💫', s.fx, s.fy - 24, 18, { rot: M.t * 4 }); } else M.emoji('🚶', s.x, 176 + (M.down || ph === 'cross' ? -Math.abs(Math.sin(M.t * 10)) * 3 : 0), 34, { flip: true });
            if (s.car != null && (ph === 'cross' || ph === 'bcrash')) M.emoji('🚗', s.car, 196, 46, { flip: true }); }
          if (hosp) { M.emoji('🤕', 110, 160, 34, { rot: -1.4 }); M.hud(t('g1_day', { n: ph === 'icu' ? Math.max(1, s.day) : 14 }), ''); }
          if (ph === 'icu') M.emoji('❤️', 250, 140, 18 + Math.abs(Math.sin(M.t * 5)) * 8);
          if (ph === 'bpay') { M.emoji('🛡️', 290, 160, 40); M.bar(200, 196, 140, 14, s.pay, '#FFC93C', lump()); }
          if (ph === 'physio') { const x = 50 + s.walk * 250; M.emoji('🧑‍🦯', x, 168 - Math.abs(Math.sin(M.t * 6)) * (M.down ? 3 : 0), 36, { flip: true }); M.hud(t('g1_month', { n: Math.max(1, Math.ceil(s.walk * 5)) }), ''); }
          if (ph === 'work2' || ph === 'fired') { M.emoji(ph === 'fired' && s.once.f ? '😰' : '🤔', 90, 160, 40);
            s.tasks.forEach(q => { const a = q.gone ? Math.max(0, 1 - (M.t - q.t - 1.1) * 2) : Math.max(0.15, 1 - (M.t - q.t) / 1.3); M.text(q.gone === 'lost' ? '❓' : q.gone === 'got' ? '✅' : t(q.k), q.x, q.y, { size: 11, bg: `rgba(255,255,255,${a})`, color: `rgba(20,33,61,${Math.max(0.2, a)})` }); });
            if (ph === 'fired') { M.emoji('🧔', 280, 160, 40); if (s.once.f) { M.text(t('g1_boss'), 270, 118, { size: 11, bg: '#fff', tail: 'r', maxW: 150 }); M.emoji('📦', 120, 196, 22); } } }
          if (office || ph === 'dark') M.hud(t('g1_salary'), rm(Math.round(s.salary)) + '/mo');
          if (ph === 'bjob') { M.emoji('🙂', 90, 160, 40); M.emoji('🛡️', 300, 120, 36); M.bar(20, 196, 200, 14, 0.5 + s.top * 0.5, '#2EC4B6', rm(LIGHT) + ' + 🛡️'); }
          if (ph === 'dark') { M.emoji('😞', 150, 180, 40); M.emoji('👨‍👩‍👧', 270, 182, 34, { alpha: 0.8 }); M.bar(20, 196, 140, 14, s.savings, '#E63946', t('g1_savings')); }
          if (ph === 'happy') { M.emoji('😊', 150, 176, 40); M.emoji('👨‍👩‍👧', 230, 178, 38); M.emoji('🛡️', 190, 140, 22); }
          // what to do now
          const hint = { office: 'g1_hWork', walk: 'mv_hold', green: 'g1_hCross', icu: 'g1_hHeart', physio: 'mv_hold', work2: 'g1_hTask', bpay: 'g1_hCollect', bjob: 'g1_hTop' }[ph];
          if (hint && M.since(s) < 4) M.text('👆 ' + t(hint), M.W / 2, 56, { size: 12, bg: '#FFC93C' });
        }
      };
    }

    return { m1, m2, i1, i2, s1, s2, g1, l1a: () => l1(false), l1b: () => l1(true) };
  };
})(this);
