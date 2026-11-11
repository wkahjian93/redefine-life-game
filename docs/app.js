// REDEFINE Life Game — screens and flow. Rules live in rules.js, figures in data.js, words in i18n.js.
(function () {
  const R = window.RLG_RULES, D = window.RLG_DATA, F = D.FIG, I = window.RLG_I18N;
  const $app = document.getElementById('app');
  const store = {
    get(k, d) { try { const v = localStorage.getItem(k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} },
    del(k) { try { localStorage.removeItem(k); } catch (e) {} }
  };
  const DEFAULT_SETTINGS = { name: 'Wong Kah Jian', phone: '019-4783328', agency: 'REDEFINE · WONG KAH JIAN Agency', mode: 'whatif', A: { ...D.DEFAULT_ASSUMPTIONS } };
  let settings = Object.assign({}, DEFAULT_SETTINGS, store.get('rlg.settings', {}));
  settings.A = Object.assign({}, D.DEFAULT_ASSUMPTIONS, settings.A || {});
  let lang = store.get('rlg.lang', (navigator.language || '').startsWith('zh') ? 'zh' : 'en');
  let screen = 'home', Q = null, G = store.get('rlg.full', null);   // Q = quick game (memory only), G = full game (this phone only)

  const t = (k, v) => { let s = (I[lang] && I[lang][k]) || I.en[k] || k; if (v) for (const n in v) s = s.split('{' + n + '}').join(v[n]); return s; };
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
  const rm = n => (n < 0 ? '−' : '') + 'RM' + Math.round(Math.abs(n)).toLocaleString('en-MY');
  const rmShort = n => { const a = Math.abs(n), s = n < 0 ? '−' : ''; return a >= 1e6 ? s + 'RM' + (a / 1e6).toFixed(a >= 1e7 ? 0 : 1) + 'm' : a >= 1e4 ? s + 'RM' + Math.round(a / 1e3) + 'k' : rm(n); };
  const figText = id => F[id][lang] || F[id].en;
  const saveG = () => store.set('rlg.full', G);
  const S = window.SFX;

  /* ---------- shell ---------- */
  function topbar() {
    return `<header class="top"><button class="ic" data-act="home" aria-label="${t('home')}">⌂</button>
      <div class="brand">REDEFINE <b>${t('appShort')}</b></div>
      <button class="ic pill" data-act="lang">${lang === 'en' ? '中文' : 'EN'}</button>
      <button class="ic" data-act="mute" aria-label="${t('sound')}">${S.muted ? '🔇' : '🔊'}</button></header>`;
  }
  function go(s) { screen = s; render(); window.scrollTo(0, 0); }
  function render() {
    document.documentElement.lang = lang === 'zh' ? 'zh-Hans' : 'en';
    const fn = SCREENS[screen] || SCREENS.home;
    $app.innerHTML = topbar() + `<main class="screen s-${screen}">${fn()}</main>`;
    const after = AFTER[screen]; if (after) after();
  }
  function modal(html) {
    const m = document.createElement('div'); m.className = 'modal';
    m.innerHTML = `<div class="sheet pop">${html}<button class="btn wide" data-close>${t('close')}</button></div>`;
    m.addEventListener('click', e => { if (e.target === m || e.target.hasAttribute('data-close')) m.remove(); });
    document.body.appendChild(m);
  }
  function confetti(n = 40) {
    const box = document.createElement('div'); box.className = 'confetti';
    const cols = ['#FF6B4A', '#FFC93C', '#2EC4B6', '#ffffff', '#7B61FF'];
    for (let i = 0; i < n; i++) { const p = document.createElement('i'); p.style.left = Math.random() * 100 + '%'; p.style.background = cols[i % cols.length]; p.style.animationDelay = Math.random() * 0.4 + 's'; p.style.transform = `rotate(${Math.random() * 360}deg)`; box.appendChild(p); }
    document.body.appendChild(box); setTimeout(() => box.remove(), 2600);
  }
  function countUp(el, to, ms = 900) {
    const t0 = performance.now(); const step = now => { const k = Math.min(1, (now - t0) / ms); el.textContent = rm(to * (1 - Math.pow(1 - k, 3))); if (k < 1) requestAnimationFrame(step); }; requestAnimationFrame(step);
    setTimeout(() => { el.textContent = rm(to); }, ms + 150);   // final value even if animation frames are paused
  }

  /* ---------- HOME ---------- */
  const SCREENS = {}, AFTER = {};
  SCREENS.home = () => `
    <div class="hero">
      <div class="logo bounce">🎲</div>
      <h1>${t('title')}</h1>
      <p class="tag">${t('tagline')}</p>
    </div>
    <div class="licence">ⓘ ${t('licence', { name: esc(settings.name), agency: esc(settings.agency) })}</div>
    <button class="btn big hot" data-act="quick">⚡ ${t('quickBtn')}<small>${t('quickSub')}</small></button>
    <button class="btn big cool" data-act="full">🧬 ${t('fullBtn')}<small>${t('fullSub')}</small></button>
    ${G && G.step && G.step !== 'intro' ? `<button class="btn ghost wide" data-act="resume">↩ ${t('resume')}</button>` : ''}
    <nav class="links"><button data-act="settings">⚙️ ${t('settings')}</button><button data-act="sources">📚 ${t('sources')}</button></nav>`;

  /* ---------- QUICK MODE ---------- */
  function startQuick() { Q = { qs: R.pickQuick(), i: 0, phase: 'guess', answers: [] }; S.play('drum'); go('quick'); }
  SCREENS.quick = () => {
    const q = Q.qs[Q.i], a = Q.answers[Q.i] || {};
    const dots = Q.qs.map((_, k) => `<i class="${k < Q.i || (k === Q.i && Q.phase !== 'guess') ? 'on' : ''}"></i>`).join('');
    let body = `<div class="dots">${dots}</div><div class="qnum">${t('qOf', { n: Q.i + 1, of: Q.qs.length })}</div>`;
    if (Q.phase === 'guess') {
      body += `<h2 class="q pop">${t('q_' + q.id)}</h2><div class="opts">` +
        q.opts.map((o, k) => `<button class="btn opt" data-act="guess" data-k="${k}">${esc(o)}</button>`).join('') + '</div>';
    } else if (Q.phase === 'reveal') {
      const ok = a.guess === q.answer;
      body += `<div class="reveal pop ${ok ? 'ok' : 'miss'}"><div class="react">${ok ? '🎯' : (q.low.includes(a.guess) ? '😱' : '😮')}</div>
        <div class="rtitle">${ok ? t('right') : (q.low.includes(a.guess) ? t('tooLow') : t('tooHigh'))}</div>
        <div class="real">${t('realFig')}: <b>${esc(q.opts[q.answer])}</b></div>
        <p>${t('r_' + q.id)}</p><div class="src">${t('source')}: ${esc(F[q.fig].src)} (${esc(F[q.fig].date)})${q.id === 'bypass' ? '; ' + esc(F.F10.src) : ''}</div></div>
        <button class="btn wide hot" data-act="next">${t('next')} →</button>`;
    } else {
      body += `<h2 class="q pop">${t('f_' + q.id)}</h2><div class="opts">` +
        q.follow.map((f, k) => `<button class="btn opt" data-act="follow" data-k="${k}">${t(f[1])}</button>`).join('') + '</div>';
    }
    return body;
  };
  SCREENS.quickResult = () => {
    const r = Q.result, ty = r.type;
    return `<div class="center"><div class="sub">${t('youAre')}</div>
      <img id="pcard" class="pcard pop" alt="${t('t_' + ty)}"/>
      <button class="btn wide hot" data-act="wa">💬 ${t('waBtn', { name: esc(settings.name) })}</button>
      <div class="row2"><button class="btn" data-act="saveCard">⬇️ ${t('saveImg')}</button><button class="btn" data-act="shareCard">📤 ${t('share')}</button></div>
      <p class="small">${t('waNote')}</p>
      <button class="btn ghost wide" data-act="quick">🔁 ${t('playAgain')}</button></div>`;
  };
  AFTER.quickResult = () => {
    const c = window.RLG_CARDS.personality(Q.result, lang, settings, t);
    Q.canvas = c; document.getElementById('pcard').src = c.toDataURL('image/png');
    confetti(); S.play('cheer');
  };
  function waLink() {
    const msg = t('waMsg', { name: settings.name, type: t('t_' + Q.result.type), emoji: R.TYPE_EMOJI[Q.result.type] });
    return 'https://wa.me/' + R.waNumber(settings.phone) + '?text=' + encodeURIComponent(msg);
  }

  /* ---------- FULL MODE ---------- */
  const blankProfile = () => ({ name: '', age: 30, income: 5000, commit: 1500, other: 2500, savings: 10000, investments: 0, epf: 50000, epfMonthly: 1000,
    debt: 0, kids: 0, youngest: 0, parents: 0, life: 0, ci: 0, med: 0, premiums: 0 });
  function newFull() {
    G = { step: 'intro', dreams: [], p: blankProfile(), mode: settings.mode, stage: 0, plan: [], events: [], odds: [], premium: '' };
    saveG(); go('fIntro');
  }
  const prof = () => { const p = G.p; return { ...p, spend: p.commit + p.other }; };
  const STEP_SCREEN = { intro: 'fIntro', dreams: 'fDreams', targets: 'fTargets', setup: 'fSetup', mode: 'fMode', alloc: 'fAlloc', card: 'fCard', reveal: 'fReveal', score: 'fScore', after: 'fAfter', summary: 'fSummary' };
  function step(s) { G.step = s; saveG(); go(STEP_SCREEN[s]); }

  SCREENS.fIntro = () => `<div class="center"><div class="machine bounce">🏭💰</div><h2>${t('machineTitle')}</h2><p>${t('machineText')}</p>
    <div class="note">🔒 ${t('privacyFull')}</div>
    <h3 class="big-q">${t('workingFor')}</h3>
    <button class="btn wide hot" data-act="toDreams">${t('pickDreams')} →</button></div>`;

  SCREENS.fDreams = () => `<h2>${t('workingFor')}</h2><p class="sub">${t('pick3')}</p><div class="dreams">` +
    R.DREAMS.map(d => { const k = G.dreams.findIndex(x => x.id === d); return `<button class="dream ${k >= 0 ? 'on' : ''}" data-act="dream" data-id="${d}">
      ${k >= 0 ? `<b class="badge">${k + 1}</b>` : ''}<span>${R.DREAM_EMOJI[d]}</span>${t('d_' + d)}</button>`; }).join('') +
    `</div><button class="btn wide hot" data-act="toTargets" ${G.dreams.length === 3 ? '' : 'disabled'}>${t('next')} →</button>`;

  const CHIPS = [20000, 50000, 100000, 300000, 390000, 1000000];
  SCREENS.fTargets = () => `<h2>${t('dreamCost')}</h2><p class="sub">${t('dreamCostSub')}</p>` +
    G.dreams.map((d, i) => `<div class="card dcost"><div class="dh"><span>${R.DREAM_EMOJI[d.id]}</span> <b>${i + 1}. ${t('d_' + d.id)}</b></div>
      ${d.id === 'retire' ? `<div class="hint">💡 ${t('retireHint')}</div>` : ''}
      <div class="chips">${CHIPS.map(c => `<button class="chip ${d.target === c ? 'on' : ''}" data-act="dtarget" data-i="${i}" data-v="${c}">${rmShort(c)}</button>`).join('')}</div>
      <label class="num">RM <input type="number" inputmode="numeric" data-dt="${i}" value="${d.target || ''}" placeholder="0"/></label></div>`).join('') +
    `<button class="btn wide hot" data-act="toSetup" ${G.dreams.every(d => d.target > 0) ? '' : 'disabled'}>${t('next')} →</button>`;

  const FIELDS = [
    ['you', [['name', 'text'], ['age', 'n']]],
    ['money', [['income', 'rm'], ['commit', 'rm'], ['other', 'rm'], ['savings', 'rm'], ['investments', 'rm'], ['epf', 'rm'], ['epfMonthly', 'rm'], ['debt', 'rm']]],
    ['family', [['kids', 'n'], ['youngest', 'n'], ['parents', 'rm']]],
    ['cover', [['life', 'rm'], ['ci', 'rm'], ['med', 'rm'], ['premiums', 'rm']]]
  ];
  SCREENS.fSetup = () => `<h2>${t('setupTitle')}</h2><p class="sub">${t('setupSub')}</p>` + FIELDS.map(([sec, fs]) =>
    `<div class="card"><h3>${t('sec_' + sec)}</h3>${fs.map(([k, ty]) => {
      if (k === 'youngest' && !G.p.kids) return '';
      return `<label class="field"><span>${t('p_' + k)}${I.en['h_' + k] ? `<small>${t('h_' + k)}</small>` : ''}</span>
        ${ty === 'text' ? `<input type="text" data-p="${k}" value="${esc(G.p[k])}" placeholder="${t('optional')}" autocomplete="off"/>` :
          `<div class="stepper"><button data-act="dec" data-k="${k}">−</button><input type="number" inputmode="numeric" data-p="${k}" value="${G.p[k]}"/><button data-act="inc" data-k="${k}">+</button></div>`}</label>`;
    }).join('')}</div>`).join('') +
    `<p class="small">${t('notSure')}</p><button class="btn wide hot" data-act="toMode">${t('next')} →</button>`;

  SCREENS.fMode = () => `<h2>${t('modeTitle')}</h2>
    <button class="btn big ${G.mode === 'whatif' ? 'hot' : ''}" data-act="setMode" data-m="whatif">🎴 ${t('whatif')}<small>${t('whatifSub')}</small></button>
    <button class="btn big ${G.mode === 'real' ? 'hot' : ''}" data-act="setMode" data-m="real">🎲 ${t('real')}<small>${t('realSub')}</small></button>
    <button class="btn wide cool" data-act="startLife">${t('startLife')} →</button>`;

  function defaultAlloc() {
    const p = prof(); const prot = p.premiums > 0 ? Math.min(30, Math.ceil(p.premiums / p.income * 20) * 5) : 0;
    const save = 10, inv = 5; return { life: 100 - save - inv - prot, save, invest: inv, protect: prot };
  }
  function partialSim() {
    const plan = [0, 1, 2].map(i => G.plan[i] || G.plan[G.plan.length - 1] || defaultAlloc());
    const events = [0, 1, 2].map(i => G.events[i] || 'smooth');
    return R.simulate(prof(), plan, events, { life: G.p.life, ci: G.p.ci, med: G.p.med }, settings.A);
  }
  const STAGE_NAMES = ['stage1', 'stage2', 'stage3'];
  SCREENS.fAlloc = () => {
    const st = R.stages(G.p.age, settings.A)[G.stage], al = G.plan[G.stage], p = prof();
    const sim = partialSim(), prevWealth = G.stage ? sim.timeline[G.stage - 1].wealth : p.savings + p.investments + p.epf;
    const inc = Math.round(incomeAt(G.stage));
    const lifeAmt = inc * al.life / 100;
    const rows = ['life', 'save', 'invest', 'protect'].map(k => `<div class="alloc a-${k}"><div class="al"><span>${t('al_' + k)}</span><b>${al[k]}% · ${rm(inc * al[k] / 100)}</b></div>
      <div class="bar"><i style="width:${al[k]}%"></i></div>
      ${k === 'life' ? '' : `<div class="pm"><button data-act="al" data-k="${k}" data-d="-5">−</button><button data-act="al" data-k="${k}" data-d="5">+</button></div>`}</div>`).join('');
    return `<div class="stagehead"><div class="stg">${t('stageN', { n: G.stage + 1 })}</div><h2>${t(STAGE_NAMES[G.stage])}</h2>
      <div class="sub">${t('ages', { a: st.from, b: st.to })} · ${t('years', { n: st.years })}</div></div>
      <div class="stats"><div><small>${t('income')}</small><b>${rm(inc)}</b></div><div><small>${t('wealthNow')}</small><b>${rmShort(prevWealth)}</b></div></div>
      <p class="sub">${t('allocSub')}</p>${rows}
      ${lifeAmt < p.spend + (G.events.slice(0, G.stage).includes('baby') ? F.F13.childcare : 0) ? `<div class="warn">⚠️ ${t('lifeLow', { a: rm(lifeAmt), b: rm(p.spend) })}</div>` : ''}
      ${al.protect === 0 && (G.p.life || G.p.ci || G.p.med) ? `<div class="warn">⚠️ ${t('lapse')}</div>` : ''}
      <button class="btn wide hot" data-act="lockAlloc">🔒 ${t('lockIn')}</button>`;
  };
  function incomeAt(stage) {   // income at the start of a stage, after promotions so far
    let inc = G.p.income; for (let i = 0; i < stage; i++) if (G.events[i] === 'promo') inc *= 1 + settings.A.promo / 100; return inc;
  }

  SCREENS.fCard = () => {
    if (G.mode === 'real') {
      return `<div class="center"><h2>${t('drawTitle')}</h2><p class="sub">${t('realExplain')}</p>
        <button class="deck shake" data-act="drawReal"><span>🎲</span>${t('tapDraw')}</button></div>`;
    }
    return `<h2>${t('pickCard')}</h2><p class="sub">${t('whatifExplain')}</p><div class="cards">` +
      R.CARDS.map(c => `<button class="lcard c-${c}" data-act="pickCard" data-c="${c}"><span>${R.CARD_EMOJI[c]}</span>${t('c_' + c)}</button>`).join('') +
      `</div><button class="btn wide ghost" data-act="shuffle">🔀 ${t('shuffle')}</button>`;
  };

  SCREENS.fReveal = () => {
    const i = G.stage, c = G.events[i], sim = partialSim(), e = sim.timeline[i];
    let lines = '';
    if (e.cost) lines += `<div class="ln"><span>${t('cost')}</span><b>${rm(e.cost)}</b></div>`;
    if (c === 'hospital' || c === 'ci') lines += `<div class="ln good"><span>${t('coveredBy')}</span><b>${rm(e.covered)}</b></div>`;
    if (e.lump) lines += `<div class="ln good"><span>${t(c === 'ci' ? 'ciPaid' : 'lifePaid')}</span><b>${rm(e.lump)}</b></div>`;
    if (e.cost) lines += `<div class="ln bad"><span>${t('youPaid')}</span><b>${rm(e.youPaid)}</b></div>`;
    if (e.incomeLost) lines += `<div class="ln bad"><span>${t('incomeLost')}</span><b>${rm(e.incomeLost)}</b></div>`;
    const covered = (c === 'hospital' || c === 'ci') && e.youPaid === 0;
    const odds = G.mode === 'real' && G.odds[i] != null ? `<div class="src">${t('oddsWere', { p: (G.odds[i] * 100).toFixed(1) })}</div>` : '';
    return `<div class="center"><div class="flip"><div class="lcard big c-${c}"><span>${R.CARD_EMOJI[c]}</span>${t('c_' + c)}</div></div>
      <p class="story">${t('s_' + c, { promo: settings.A.promo, years: settings.A.ciYears })}</p>
      ${G.mode === 'whatif' ? `<div class="tagline">🎴 ${t('scenarioNote')}</div>` : ''}${odds}
      ${lines ? `<div class="card lines">${lines}</div>` : ''}
      ${covered ? `<div class="okbox">✅ ${t('coverHandled')}</div>` : ''}
      ${!e.inForce && (G.p.life || G.p.ci || G.p.med) ? `<div class="warn">⚠️ ${t('lapsed')}</div>` : ''}
      <div class="src">${cardSource(c)}</div>
      <div class="stats"><div><small>${t('wealthEnd', { a: e.to })}</small><b id="wEnd">${rm(0)}</b></div></div>
      <button class="btn wide hot" data-act="afterCard">${G.stage < 2 ? t('nextStage') + ' →' : t('toRetire') + ' 🌴'}</button></div>`;
  };
  AFTER.fReveal = () => { const e = partialSim().timeline[G.stage]; countUp(document.getElementById('wEnd'), e.wealth); const c = G.events[G.stage];
    S.play(c === 'promo' || c === 'smooth' ? 'good' : c === 'baby' ? 'coin' : 'bad'); if (c === 'promo') confetti(25); };
  function cardSource(c) {
    const m = { baby: 'F13', hospital: 'F5', ci: 'F1' }[c];
    if (m) return t('source') + ': ' + esc(F[m].src);
    if (c === 'promo') return t('assumption', { what: t('al_promo', { p: settings.A.promo }) });
    if (c === 'stop2' || c === 'stopall') return t('stopSrc');
    return '';
  }

  function results() {
    const p = prof(), cov = { life: G.p.life, ci: G.p.ci, med: G.p.med };
    const before = R.simulate(p, G.plan, G.events, cov, settings.A);
    const calm = R.simulate(p, G.plan, ['smooth', 'smooth', 'smooth'].map((x, i) => G.events[i] === 'promo' ? 'promo' : x), cov, settings.A);
    const need = R.needs(p, settings.A, calm.wealth);
    const covAfter = { life: G.p.life + need.income.gap, ci: G.p.ci + need.ci.gap, med: Math.max(G.p.med, F.F1.max) };
    const prem = Number(G.premium) || 0;
    const after = R.simulate(p, G.plan, G.events, covAfter, settings.A, { forceCover: true, extraPremium: prem });
    return { p, before, after, need, calm, covAfter, prem, dB: R.fundDreams(G.dreams, before.wealth), dA: R.fundDreams(G.dreams, after.wealth) };
  }
  const dreamList = ds => ds.map(d => `<div class="dr ${d.ok ? 'ok' : 'no'}"><span>${R.DREAM_EMOJI[d.id]}</span><div><b>${t('d_' + d.id)}</b><small>${rm(d.got)} / ${rm(d.target)}</small><div class="bar"><i style="width:${d.pct}%"></i></div></div><em>${d.ok ? '✅' : d.pct + '%'}</em></div>`).join('');

  SCREENS.fScore = () => {
    const r = results(), b = r.before, ok = r.dB.filter(d => d.ok).length;
    return `<div class="center"><div class="stg">${t('scorecard')}</div><h2>${t('dreamsSurvived', { n: ok, of: 3 })}</h2></div>
      <div class="card">${dreamList(r.dB)}<p class="small">${t('dreamRule', { a: settings.A.retireAge })}</p></div>
      <div class="tiles"><div class="tile bad"><small>${t('moneyLost')}</small><b>${rmShort(b.moneyLost)}</b><span>${t('lostParts', { a: rmShort(b.billsUncovered), b: rmShort(b.incomeLost) })}</span></div>
      <div class="tile good"><small>${t('insPaid')}</small><b>${rmShort(b.insurancePaid)}</b></div>
      <div class="tile"><small>${t('familyLeft', { a: settings.A.retireAge })}</small><b>${rmShort(b.wealth)}</b>${b.debt ? `<span>${t('inclDebt', { a: rmShort(b.debt) })}</span>` : ''}</div></div>
      <div class="timeline">${b.timeline.map(e => `<div><span>${R.CARD_EMOJI[e.card]}</span><small>${e.from}–${e.to}</small><b>${rmShort(e.wealth)}</b></div>`).join('')}</div>
      <button class="btn wide cool" data-act="toAfter">🔁 ${t('replay')}</button>`;
  };
  AFTER.fScore = () => { S.play('cheer'); };

  SCREENS.fAfter = () => {
    const r = results(), allCovered = Object.values(r.need).slice(0, 3).every(n => n.covered);
    const bar = (label, a, b, good) => { const mx = Math.max(Math.abs(a), Math.abs(b), 1);
      return `<div class="cmp"><div class="cl">${label}</div><div class="cb"><span>${t('before')}</span><div class="bar ${good ? '' : 'neg'}"><i style="width:${Math.max(2, Math.abs(a) / mx * 100)}%"></i></div><b>${rmShort(a)}</b></div>
      <div class="cb after"><span>${t('after')}</span><div class="bar ${good ? '' : 'neg'}"><i style="width:${Math.max(2, Math.abs(b) / mx * 100)}%"></i></div><b>${rmShort(b)}</b></div></div>`; };
    const okB = r.dB.filter(d => d.ok).length, okA = r.dA.filter(d => d.ok).length;
    return `<h2>${t('beforeAfter')}</h2><p class="sub">${t('sameLife')}</p>
      ${allCovered ? `<div class="okbox">✅ ${t('alreadyCovered')}</div>` : ''}
      <div class="card agentbox"><label class="field"><span>🧑‍💼 ${t('premiumQ')}<small>${t('premiumHint')}</small></span>
        <div class="stepper"><input type="number" inputmode="numeric" id="prem" value="${esc(G.premium)}" placeholder="0"/></div></label>
        <button class="btn" data-act="setPrem">${t('update')}</button></div>
      ${r.prem ? '' : `<div class="warn">⚠️ ${t('noPremium')}</div>`}
      <div class="card">${bar(t('familyLeft', { a: settings.A.retireAge }), r.before.wealth, r.after.wealth, true)}
        ${bar(t('outOfPocket'), r.before.outOfPocket, r.after.outOfPocket, false)}
        <div class="cmp"><div class="cl">${t('dreamsSurvivedShort')}</div><div class="dd"><b>${okB}/3</b> → <b class="up">${okA}/3</b></div></div></div>
      <div class="card"><h3>${t('whatChanged')}</h3>
        <div class="ln"><span>${t('n_income')}</span><b>${rm(G.p.life)} → ${rm(r.covAfter.life)}</b></div>
        <div class="ln"><span>${t('n_ci')}</span><b>${rm(G.p.ci)} → ${rm(r.covAfter.ci)}</b></div>
        <div class="ln"><span>${t('n_med')}</span><b>${rm(G.p.med)} → ${rm(r.covAfter.med)}</b></div>
        <p class="small">${t('afterNote')}</p></div>
      <div class="card">${dreamList(r.dA)}</div>
      <button class="btn wide hot" data-act="toSummary">📄 ${t('toSummary')}</button>`;
  };

  function needRows(r, withTap = true) {
    return ['income', 'ci', 'med', 'retire'].map(k => { const n = r.need[k];
      return `<div class="need ${n.covered ? 'ok' : ''}" ${withTap ? `data-act="formula" data-k="${k}"` : ''}><div><b>${t('n_' + k)}</b><small>${n.covered ? '✅ ' + t('coveredHere') : t('gapLabel')}</small></div>
        <em>${n.covered ? '—' : rm(n.gap)}</em>${withTap ? '<i class="fx">ƒx</i>' : ''}</div>`; }).join('');
  }
  SCREENS.fSummary = () => {
    const r = results(), b = r.before, okB = r.dB.filter(d => d.ok).length, okA = r.dA.filter(d => d.ok).length;
    const date = new Date().toLocaleDateString(lang === 'zh' ? 'zh-CN' : 'en-MY', { day: 'numeric', month: 'short', year: 'numeric' });
    return `<div id="report" class="report">
      <div class="rhead"><div><b>REDEFINE ${t('appShort')}</b><small>${t('summaryTitle')}</small></div><div class="rd">${esc(G.p.name || t('player'))}<small>${date}</small></div></div>
      <div class="rsec"><h3>${t('workingFor')}</h3><div class="rdreams">${r.dB.map((d, i) => `<span>${R.DREAM_EMOJI[d.id]} ${i + 1}. ${t('d_' + d.id)} · ${rmShort(d.target)}</span>`).join('')}</div></div>
      <div class="rsec"><h3>${t('profile')}</h3><div class="rgrid">
        <span>${t('p_age')}: <b>${G.p.age}</b></span><span>${t('income')}: <b>${rm(G.p.income)}</b></span><span>${t('spend')}: <b>${rm(r.p.spend)}</b></span>
        <span>${t('sec_family')}: <b>${t('famShort', { k: G.p.kids, p: G.p.parents ? rm(G.p.parents) : '—' })}</b></span></div></div>
      <div class="rsec"><h3>${t('scorecard')} (${t(G.mode === 'real' ? 'real' : 'whatif')})</h3><div class="rgrid">
        <span>${t('events')}: <b>${G.events.map(c => R.CARD_EMOJI[c] + ' ' + t('c_' + c)).join(' · ')}</b></span>
        <span>${t('moneyLost')}: <b>${rm(b.moneyLost)}</b></span><span>${t('insPaid')}: <b>${rm(b.insurancePaid)}</b></span></div></div>
      <div class="rsec"><h3>${t('beforeAfter')}</h3><table class="rt"><tr><th></th><th>${t('before')}</th><th>${t('after')}</th></tr>
        <tr><td>${t('familyLeft', { a: settings.A.retireAge })}</td><td>${rm(b.wealth)}</td><td>${rm(r.after.wealth)}</td></tr>
        <tr><td>${t('dreamsSurvivedShort')}</td><td>${okB}/3</td><td>${okA}/3</td></tr>
        <tr><td>${t('premiumRow')}</td><td>—</td><td>${r.prem ? rm(r.prem) + t('perMonth') : t('notQuoted')}</td></tr></table></div>
      <div class="rsec"><h3>${t('needsTitle')}</h3>${needRows(r)}<p class="small">${t('tapFormula')}</p></div>
      <div class="rfoot">${t('disclaimer')}<br/>${t('preparedBy', { name: esc(settings.name), agency: esc(settings.agency), phone: esc(settings.phone) })}</div>
    </div>
    <div class="row2 noprint"><button class="btn" data-act="saveSummary">🖼️ ${t('saveImg')}</button><button class="btn" data-act="print">📄 ${t('savePdf')}</button></div>
    <button class="btn wide ghost noprint" data-act="newFull">🧹 ${t('newGame')}</button>`;
  };

  function formula(k) {
    const r = results(), n = r.need[k], P = n.parts, A = settings.A;
    let h = `<h3>${t('n_' + k)}</h3>`;
    if (k === 'income') h += `<p class="fx-line">${t('fx_income')}</p><div class="calc">
      ${rm(r.p.spend)} × 12 × ${P.kidYears} ${t('yrsKids', { a: A.indepAge })} = ${rm(P.famNeed)}<br/>+ ${rm(G.p.parents)} × 12 × ${G.p.parents ? A.parentYears : 0} ${t('yrsParents')} = ${rm(P.parentNeed)}<br/>
      + ${t('p_debt')} ${rm(P.debt)}<br/><b>${t('need')} = ${rm(n.need)}</b><br/>− ${t('p_life')} ${rm(P.life)} − ${t('liquid')} ${rm(P.liquid)} − EPF ${rm(P.epf)}<br/><b>${t('gapLabel')} = ${rm(n.gap)}</b></div>
      ${n.noDeps ? `<p class="small">${t('noDeps')}</p>` : ''}`;
    if (k === 'ci') h += `<p class="fx-line">${t('fx_ci')}</p><div class="calc">${P.years} × ${rm(P.income)} × 12 = ${rm(P.years * P.income * 12)}<br/>
      + ${t('treatNet', { a: rm(F.F1.mid), b: rm(G.p.med) })} = ${rm(P.ciTreat)}<br/><b>${t('need')} = ${rm(n.need)}</b><br/>− ${t('p_ci')} ${rm(P.ci)} − ${t('liquid')} ${rm(P.liquid)}<br/><b>${t('gapLabel')} = ${rm(n.gap)}</b></div>
      <p class="small">${t('source')}: F1 ${esc(F.F1.src)}</p>`;
    if (k === 'med') h += `<p class="fx-line">${t('fx_med')}</p><div class="calc">${rm(P.max)} − ${rm(P.limit)} = <b>${rm(n.gap)}</b></div>
      <p class="small">${figText('F1')}. ${figText('F7')}. ${figText('F11')}.</p>`;
    if (k === 'retire') h += `<p class="fx-line">${t('fx_retire', { a: A.retireAge })}</p><div class="calc">${rm(n.need)} − ${rm(P.projected)} = <b>${rm(n.gap)}</b></div>
      <p class="small">${figText('F12')}. ${t('retireNote', { s: A.saveRate, i: A.investRate, e: A.epfRate })}</p>`;
    h += n.covered ? `<div class="okbox">✅ ${t('coveredHere')}</div>` : '';
    modal(h);
  }

  /* ---------- SETTINGS & SOURCES ---------- */
  const AKEYS = ['promo', 'saveRate', 'investRate', 'epfRate', 'indepAge', 'ciYears', 'parentYears', 'retireAge'];
  SCREENS.settings = () => `<h2>⚙️ ${t('settings')}</h2><div class="card"><h3>${t('agentInfo')}</h3>
    <label class="field"><span>${t('agentName')}</span><input id="s_name" value="${esc(settings.name)}"/></label>
    <label class="field"><span>${t('agentPhone')}</span><input id="s_phone" inputmode="tel" value="${esc(settings.phone)}"/></label>
    <label class="field"><span>${t('agency')}</span><input id="s_agency" value="${esc(settings.agency)}"/></label></div>
    <div class="card"><h3>${t('defaultMode')}</h3><div class="row2"><button class="btn ${settings.mode === 'whatif' ? 'hot' : ''}" data-act="sMode" data-m="whatif">🎴 ${t('whatif')}</button><button class="btn ${settings.mode === 'real' ? 'hot' : ''}" data-act="sMode" data-m="real">🎲 ${t('real')}</button></div></div>
    <div class="card"><h3>${t('assumptions')}</h3><p class="small">${t('assumpNote')}</p>${AKEYS.map(k => `<label class="field"><span>${t('a_' + k)}</span><input type="number" step="0.5" inputmode="decimal" id="a_${k}" value="${settings.A[k]}"/></label>`).join('')}
    <button class="btn ghost" data-act="resetA">${t('resetDefaults')}</button></div>
    <button class="btn wide hot" data-act="saveSettings">💾 ${t('save')}</button>`;
  SCREENS.sources = () => `<h2>📚 ${t('sources')}</h2><p class="sub">${t('sourcesSub')}</p>` + Object.keys(F).map(k =>
    `<div class="card srcrow"><b>${k}</b> ${esc(figText(k))}<small>${esc(F[k].src)} · ${esc(F[k].date)}<br/><a href="${esc(F[k].url)}" target="_blank" rel="noopener">${t('openSource')}</a></small></div>`).join('') +
    `<div class="card"><h3>${t('assumptions')}</h3><p class="small">${t('assumpNote')}</p></div>`;

  /* ---------- events ---------- */
  function readSetup() {
    document.querySelectorAll('[data-p]').forEach(el => { const k = el.dataset.p; G.p[k] = el.type === 'text' ? el.value.trim().slice(0, 30) : Math.max(0, Number(el.value) || 0); });
    if (!G.p.age || G.p.age < 18) G.p.age = 18; if (G.p.age > settings.A.retireAge - 6) G.p.age = settings.A.retireAge - 6;
    if (!G.p.income) G.p.income = 1;
  }
  const STEPS = { age: 1, kids: 1, youngest: 1 };
  $app.addEventListener('input', e => {
    const el = e.target;
    if (el.dataset.dt != null) { G.dreams[+el.dataset.dt].target = Math.max(0, Number(el.value) || 0); saveG();
      const b = document.querySelector('[data-act="toTargets"],[data-act="toSetup"]'); if (b) b.disabled = !G.dreams.every(d => d.target > 0);
      document.querySelectorAll(`.chip[data-i="${el.dataset.dt}"]`).forEach(c => c.classList.toggle('on', +c.dataset.v === G.dreams[+el.dataset.dt].target)); }
    if (el.dataset.p != null) { readSetup(); saveG(); }
  });
  $app.addEventListener('change', e => { if (e.target.dataset.p === undefined) return; if (e.target.dataset.p === 'kids') { readSetup(); saveG(); render(); } });
  $app.addEventListener('click', e => {
    const b = e.target.closest('[data-act]'); if (!b || b.disabled) return;
    const a = b.dataset.act; S.play('tap');
    const A = {
      home() { if ((screen.startsWith('f') && G && G.step !== 'summary') || screen === 'quick') { if (!confirm(t('leaveQ'))) return; } go('home'); },
      lang() { lang = lang === 'en' ? 'zh' : 'en'; store.set('rlg.lang', lang); if (screen === 'fSetup') readSetup(); render(); },
      mute() { S.toggle(); render(); },
      quick: startQuick,
      full() { if (G && G.step && G.step !== 'intro' && G.step !== 'summary' && !confirm(t('newFullQ'))) return; newFull(); },
      resume() { go(STEP_SCREEN[G.step]); },
      settings() { go('settings'); }, sources() { go('sources'); },
      guess() { const k = +b.dataset.k, q = Q.qs[Q.i]; Q.answers[Q.i] = { q, guess: k }; Q.phase = 'reveal'; S.play(k === q.answer ? 'good' : 'bad'); render(); if (k === q.answer) confetti(20); },
      next() { Q.phase = 'follow'; render(); },
      follow() { Q.answers[Q.i].follow = +b.dataset.k; if (Q.i < Q.qs.length - 1) { Q.i++; Q.phase = 'guess'; render(); } else { Q.result = R.personality(Q.answers); go('quickResult'); } },
      wa() { window.open(waLink(), '_blank'); },
      saveCard() { window.RLG_CARDS.download(Q.canvas, 'REDEFINE-' + Q.result.type + '.png'); },
      shareCard() { window.RLG_CARDS.share(Q.canvas, 'REDEFINE-' + Q.result.type + '.png', t('shareText', { type: t('t_' + Q.result.type) })); },
      toDreams() { step('dreams'); },
      dream() { const id = b.dataset.id, k = G.dreams.findIndex(x => x.id === id);
        if (k >= 0) G.dreams.splice(k, 1); else if (G.dreams.length < 3) G.dreams.push({ id, target: id === 'retire' ? F.F12.basic : 0 }); saveG(); render(); },
      toTargets() { step('targets'); },
      dtarget() { G.dreams[+b.dataset.i].target = +b.dataset.v; saveG(); render(); },
      toSetup() { step('setup'); },
      inc() { readSetup(); const k = b.dataset.k; G.p[k] = (G.p[k] || 0) + (STEPS[k] || (G.p[k] >= 100000 ? 10000 : G.p[k] >= 10000 ? 1000 : 100)); saveG(); render(); },
      dec() { readSetup(); const k = b.dataset.k; G.p[k] = Math.max(0, (G.p[k] || 0) - (STEPS[k] || (G.p[k] > 100000 ? 10000 : G.p[k] > 10000 ? 1000 : 100))); saveG(); render(); },
      toMode() { readSetup(); step('mode'); },
      setMode() { G.mode = b.dataset.m; saveG(); render(); },
      startLife() { G.stage = 0; G.plan = [defaultAlloc()]; G.events = []; G.odds = []; step('alloc'); },
      al() { const al = G.plan[G.stage], k = b.dataset.k, d = +b.dataset.d; const nv = al[k] + d;
        if (nv < 0 || al.life - d < 0) { S.play('bad'); return; } al[k] = nv; al.life -= d; saveG(); render(); },
      lockAlloc() { S.play('coin'); step('card'); },
      pickCard() { G.events[G.stage] = b.dataset.c; G.odds[G.stage] = null; S.play('flip'); step('reveal'); },
      shuffle() { const pool = R.CARDS.filter(c => c !== 'stopall'); G.events[G.stage] = pool[Math.floor(Math.random() * pool.length)]; S.play('drum'); setTimeout(() => step('reveal'), 500); },
      drawReal() { const st = R.stages(G.p.age, settings.A)[G.stage], r = R.realOddsCard(st); G.events[G.stage] = r.card; G.odds[G.stage] = r.chance; S.play('drum'); b.classList.add('go'); setTimeout(() => step('reveal'), 600); },
      afterCard() { if (G.stage < 2) { G.stage++; G.plan[G.stage] = { ...G.plan[G.stage - 1] }; step('alloc'); } else step('score'); },
      toAfter() { step('after'); },
      setPrem() { G.premium = Math.max(0, Number(document.getElementById('prem').value) || 0) || ''; saveG(); render(); S.play('coin'); },
      toSummary() { const el = document.getElementById('prem'); if (el) { G.premium = Math.max(0, Number(el.value) || 0) || ''; } step('summary'); },
      formula() { formula(b.dataset.k); },
      saveSummary() { const r = results(); const c = window.RLG_CARDS.summary({ G, r, settings, lang, t, rm }); window.RLG_CARDS.download(c, 'REDEFINE-needs-summary.png'); },
      print() { window.print(); },
      newFull() { if (!confirm(t('clearQ'))) return; store.del('rlg.full'); G = null; newFull(); },
      sMode() { settings.mode = b.dataset.m; document.querySelectorAll('[data-act="sMode"]').forEach(x => x.classList.toggle('hot', x === b)); },
      resetA() { AKEYS.forEach(k => { document.getElementById('a_' + k).value = D.DEFAULT_ASSUMPTIONS[k]; }); },
      saveSettings() {
        settings.name = document.getElementById('s_name').value.trim() || DEFAULT_SETTINGS.name;
        settings.phone = document.getElementById('s_phone').value.trim() || DEFAULT_SETTINGS.phone;
        settings.agency = document.getElementById('s_agency').value.trim();
        AKEYS.forEach(k => { const v = Number(document.getElementById('a_' + k).value); if (!isNaN(v) && v >= 0) settings.A[k] = v; });
        store.set('rlg.settings', settings); S.play('good'); go('home');
      }
    };
    if (A[a]) A[a]();
  });

  // test hook (used by the test run only)
  window.RLG_APP = { get G() { return G; }, get Q() { return Q; }, go, render, results, setLang(l) { lang = l; render(); } };
  if (/[?&]demo/.test(location.search)) {
    G = { step: 'summary', mode: 'whatif', stage: 2, premium: '', odds: [],
      dreams: [{ id: 'edu', target: 100000 }, { id: 'retire', target: 390000 }, { id: 'travel', target: 50000 }],
      p: { ...blankProfile(), name: 'Daniel (sample)', age: 32, income: 6000, commit: 2000, other: 2500, savings: 15000, investments: 5000, epf: 70000, epfMonthly: 1300, debt: 350000, kids: 1, youngest: 2, parents: 300, life: 100000, ci: 0, med: 100000, premiums: 250 },
      plan: [{ life: 75, save: 15, invest: 5, protect: 5 }, { life: 75, save: 15, invest: 5, protect: 5 }, { life: 75, save: 15, invest: 5, protect: 5 }], events: ['promo', 'ci', 'smooth'] };
    if (/lang=zh/.test(location.search)) lang = 'zh';
    screen = STEP_SCREEN[(location.search.match(/demo=(\w+)/) || [])[1]] || 'fSummary';
  }
  render();
  if ('serviceWorker' in navigator && location.protocol !== 'file:') navigator.serviceWorker.register('sw.js').catch(() => {});
})();
