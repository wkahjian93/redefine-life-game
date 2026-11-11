// Game rules: Quick Mode questions + personality, Full Mode life simulation, needs (gap) formulas.
// Pure functions, no DOM — tested by test.js with Node.
(function (root) {
  const D = typeof module !== 'undefined' ? require('./data.js') : root.RLG_DATA;
  const F = D.FIG;

  /* ---------------- QUICK MODE: Higher or Lower ---------------- */
  // Each round compares a real cost (fig) with an everyday item (cmp). `answer` says whether the cost is higher ('hi') or lower ('lo').
  // val / cmpVal are the numbers compared (the cautious end of any range); cs is the comparison's display value.
  // After each round a "what would you do" tap (FOLLOW[grp]) feeds the personality.
  const QUICK = [
    { id: 'bypass', fig: 'F1', cmp: 'C1', answer: 'hi', grp: 'med', ea: '🫀', eb: '🚗', val: F.F1.min, cmpVal: F.C1.max, cs: 'RM46.5k–59.9k' },
    { id: 'angio', fig: 'F6', cmp: 'C2', answer: 'hi', grp: 'med', ea: '🩺', eb: '📱', val: F.F6.rm, cmpVal: F.C2.rm, cs: 'RM5,999' },
    { id: 'stroke', fig: 'F8', cmp: 'C1', answer: 'lo', grp: 'med', ea: '🧠', eb: '🚗', val: F.F8.rm, cmpVal: F.C1.min, cs: 'RM46.5k–59.9k' },
    { id: 'visit', fig: 'F5', cmp: 'C3', answer: 'hi', grp: 'med', ea: '🏥', eb: '💵', val: F.F5.rm, cmpVal: F.C3.malaysia, cs: 'RM7,017' },
    { id: 'family', fig: 'F3', cmp: 'C3', answer: 'hi', grp: 'family', ea: '👨‍👩‍👧‍👦', eb: '💵', val: F.F3.rm, cmpVal: F.C3.malaysia, cs: 'RM7,017' },
    { id: 'months', fig: 'F2', cmp: null, answer: 'hi', grp: 'months', ea: '🐷', eb: '➗', val: F.F2.le3m, cmpVal: 50, cs: '50%', unit: 'pct' },
    { id: 'cancer', fig: 'F7', cmp: 'F12', answer: 'hi', grp: 'retire', ea: '🎗️', eb: '🌴', val: F.F7.rm, cmpVal: F.F12.basic, cs: 'RM390,000' },
    { id: 'baby', fig: 'F13', cmp: 'C1', answer: 'lo', grp: 'family', ea: '👶', eb: '🚗', val: F.F13.firstYear, cmpVal: F.C1.min, cs: 'RM46,500' }
  ];
  const FOLLOW = {
    med: { q: 'f_bypass', opts: [['guardian', 'q_bypass_f0'], ['planner', 'q_bypass_f1'], ['hustler', 'q_bypass_f2'], ['yolo', 'q_bypass_f3']] },
    months: { q: 'f_months', opts: [['yolo', 'q_months_f0'], ['optimist', 'q_months_f1'], ['hustler', 'q_months_f2'], ['planner', 'q_months_f3']] },
    family: { q: 'f_family', opts: [['yolo', 'q_family_f0'], ['planner', 'q_family_f1'], ['provider', 'q_family_f2'], ['provider', 'q_family_f3']] },
    retire: { q: 'f_retire', opts: [['planner', 'q_retire_f0'], ['hustler', 'q_retire_f1'], ['optimist', 'q_retire_f2'], ['yolo', 'q_retire_f3']] }
  };
  const TYPES = ['provider', 'guardian', 'planner', 'hustler', 'optimist', 'yolo'];   // order = tie-break
  const TYPE_EMOJI = { provider: '💪', guardian: '🛡️', planner: '🧭', hustler: '🚀', optimist: '🌞', yolo: '👑' };

  // Pick 3 rounds: three different topics, always at least one "Lower" answer (so "always swipe up" doesn't win).
  function pickQuick(rnd = Math.random) {
    const any = a => a[Math.floor(rnd() * a.length)];
    const lo = any(QUICK.filter(q => q.answer === 'lo'));
    const groups = [...new Set(QUICK.map(q => q.grp))].filter(g => g !== lo.grp).sort(() => rnd() - 0.5).slice(0, 2);
    const rest = groups.map(g => any(QUICK.filter(q => q.grp === g && q.answer === 'hi')));
    return [lo, ...rest].sort(() => rnd() - 0.5);
  }

  // Points for a correct answer: 100 + up to 50 for speed (timer on) + 25 for each answer already in the streak.
  function scoreRound(secsLeft, streak, timerOn) {
    return 100 + (timerOn ? Math.round(Math.min(10, Math.max(0, secsLeft)) * 5) : 0) + Math.max(0, streak - 1) * 25;
  }

  // answers: [{q, guess:'hi'|'lo'|null, correct, follow}] → { type, scores, right }
  function personality(answers) {
    const s = Object.fromEntries(TYPES.map(t => [t, 0]));
    let right = 0;
    answers.forEach(a => {
      if (a.correct) right++;
      else if (a.q.answer === 'hi' && a.guess === 'lo') s.optimist += 0.5;   // guessed the cost too low
      if (a.follow != null) s[FOLLOW[a.q.grp].opts[a.follow][0]] += 1;
    });
    const type = TYPES.reduce((best, t) => (s[t] > s[best] ? t : best), TYPES[0]);
    return { type, scores: s, right };
  }

  // Prospect's number typed on the agent's device → WhatsApp number, or null if it doesn't look valid.
  // Malaysian mobiles (01x…, 601x…, +601x…) or any +country number. Never stored.
  function prospectNumber(raw) {
    const s = String(raw || '').trim(), intl = s.startsWith('+') || s.startsWith('00');
    let d = s.replace(/\D/g, ''); if (d.startsWith('00')) d = d.slice(2);
    if (!intl) { if (d.startsWith('0')) d = '6' + d; else if (d.startsWith('1')) d = '60' + d; }
    if (d.startsWith('60')) return /^601\d{8,9}$/.test(d) ? d : null;
    return intl && d.length >= 8 && d.length <= 15 ? d : null;
  }
  function waNumber(phone) {   // "019-4783328" → "60194783328"
    let d = String(phone || '').replace(/\D/g, '');
    if (d.startsWith('0')) d = '6' + d;
    return d;
  }

  /* ---------------- FULL MODE ---------------- */
  const DREAMS = ['home', 'edu', 'travel', 'retire', 'parents', 'business', 'car', 'wedding', 'early', 'family', 'give', 'health'];
  const DREAM_EMOJI = { home: '🏡', edu: '🎓', travel: '✈️', retire: '🌴', parents: '👵', business: '🏪', car: '🚗', wedding: '💍', early: '⏳', family: '👨‍👩‍👧', give: '🤝', health: '💚' };

  const CARDS = ['promo', 'baby', 'hospital', 'ci', 'stop2', 'stopall', 'smooth'];
  const CARD_EMOJI = { promo: '📈', baby: '👶', hospital: '🏥', ci: '💔', stop2: '⛔', stopall: '🕯️', smooth: '☀️' };

  function stages(age, A) {
    const total = Math.max(6, A.retireAge - age);
    const a = Math.round(total / 3), b = Math.round(total / 3), c = total - a - b;
    let from = age; return [a, b, c].map(n => { const s = { from, to: from + n, years: n }; from += n; return s; });
  }

  // p = profile (setup), plan = [{life,save,invest,protect} %] x3, events = [cardId] x3, cov = {life, ci, med}, opts = {extraPremium}
  function simulate(p, plan, events, cov, A, opts = {}) {
    const st = stages(p.age, A);
    const s = { sav: p.savings, inv: p.investments, epf: p.epf, debt: 0, income: p.income, E: p.spend, epfM: p.epfMonthly,
      offMonths: 0, stopped: false, lost: 0, lump: 0, billsUncovered: 0, incomeLost: 0, paid: 0, log: [] };
    const draw = amt => {   // pay from savings → investments → borrow
      const a = Math.min(amt, Math.max(0, s.sav)); s.sav -= a; amt -= a;
      const b = Math.min(amt, Math.max(0, s.inv)); s.inv -= b; amt -= b;
      s.debt += amt;
    };
    const timeline = [];
    st.forEach((stage, i) => {
      const al = plan[i], inForce = al.protect > 0 || opts.forceCover;
      const c = inForce ? cov : { life: 0, ci: 0, med: 0 };
      const ev = events[i] || 'smooth', evYear = Math.floor(stage.years / 2);
      const entry = { stage: i, card: ev, from: stage.from, to: stage.to, inForce, cost: 0, covered: 0, youPaid: 0, incomeLost: 0 };
      for (let y = 0; y < stage.years; y++) {
        if (y === evYear) applyEvent(ev, entry, c);
        const off = s.stopped ? 12 : Math.min(12, s.offMonths), m = 12 - off;
        s.offMonths = Math.max(0, s.offMonths - 12);
        // working months: income split by the player's allocation
        const lifeAmt = Math.max(s.E, s.income * al.life / 100);
        let saveAmt = s.income * al.save / 100, invAmt = s.income * al.invest / 100;
        const protAmt = s.income * al.protect / 100 + (opts.extraPremium || 0);
        // extra premium (after-scenario) comes out of savings first, then investment, then lifestyle extra
        let over = (lifeAmt + saveAmt + invAmt + s.income * al.protect / 100 + (opts.extraPremium || 0)) - s.income;
        if (over > 0) { const cut = Math.min(over, saveAmt); saveAmt -= cut; over -= cut; }
        if (over > 0) { const cut = Math.min(over, invAmt); invAmt -= cut; over -= cut; }
        s.sav += m * saveAmt; s.inv += m * invAmt; s.epf += m * s.epfM;
        if (over > 0) draw(m * over);                 // spending more than income
        if (off) {                                    // no income: family still spends, premiums still due
          const need = off * (s.E + (inForce ? protAmt : 0));
          draw(need); s.incomeLost += off * s.income; entry.incomeLost += off * s.income;
        }
        // repay borrowing from savings when possible, then grow
        const rep = Math.min(s.debt, Math.max(0, s.sav)); s.debt -= rep; s.sav -= rep;
        s.sav *= 1 + A.saveRate / 100; s.inv *= 1 + A.investRate / 100; s.epf *= 1 + A.epfRate / 100;
      }
      entry.wealth = Math.round(s.sav + s.inv + s.epf - s.debt);
      timeline.push(entry);
    });

    function applyEvent(ev, e, c) {
      if (ev === 'promo') s.income *= 1 + A.promo / 100;
      if (ev === 'baby') { e.cost = F.F13.firstYear; e.youPaid = e.cost; draw(e.cost); s.E += F.F13.childcare; s.billsUncovered += e.cost; }
      if (ev === 'hospital') {
        e.cost = F.F5.rm; e.covered = Math.min(e.cost, c.med); e.youPaid = e.cost - e.covered;
        draw(e.youPaid); s.billsUncovered += e.youPaid; s.paid += e.covered;
      }
      if (ev === 'ci') {
        e.cost = F.F1.mid; e.covered = Math.min(e.cost, c.med); e.youPaid = e.cost - e.covered;
        draw(e.youPaid); s.billsUncovered += e.youPaid; s.paid += e.covered;
        e.lump = c.ci; s.sav += c.ci; s.paid += c.ci; s.lump += c.ci;
        s.offMonths += A.ciYears * 12;
      }
      if (ev === 'stop2') s.offMonths += 24;
      if (ev === 'stopall') { s.stopped = true; s.epfM = 0; e.lump = c.life; s.sav += c.life; s.paid += c.life; s.lump += c.life; }
    }

    const wealth = Math.round(s.sav + s.inv + s.epf - s.debt);
    return { stages: st, timeline, wealth, sav: Math.round(s.sav), inv: Math.round(s.inv), epf: Math.round(s.epf), debt: Math.round(s.debt),
      billsUncovered: Math.round(s.billsUncovered), incomeLost: Math.round(s.incomeLost), insurancePaid: Math.round(s.paid),
      moneyLost: Math.round(s.billsUncovered + s.incomeLost), lumpPaid: Math.round(s.lump),
      outOfPocket: Math.round(Math.max(0, s.billsUncovered + s.incomeLost - s.lump)), finalIncome: Math.round(s.income) };
  }

  // Dreams are funded, in the player's order of importance, from what the family has at retirement age.
  function fundDreams(dreams, wealth) {
    let left = Math.max(0, wealth);
    return dreams.map(d => { const got = Math.min(d.target, left); left -= got; return { ...d, got, pct: d.target ? Math.round(got / d.target * 100) : 100, ok: got >= d.target }; });
  }

  // Needs summary. Every number here can be shown with its formula (see app "formula" pop-up).
  function needs(p, A, projectedWealth) {
    const liquid = p.savings + p.investments;
    const kidYears = p.kids > 0 ? Math.max(0, A.indepAge - p.youngest) : 0;
    const famNeed = p.spend * 12 * kidYears, parentNeed = p.parents * 12 * (p.parents > 0 ? A.parentYears : 0);
    const incNeed = famNeed + parentNeed + p.debt, incHave = p.life + liquid + p.epf;
    const ciTreat = Math.max(0, F.F1.mid - p.med), ciNeed = A.ciYears * p.income * 12 + ciTreat, ciHave = p.ci + liquid;
    const medBench = F.F1.max;
    const retNeed = F.F12.basic;
    const out = {
      income: { need: incNeed, have: incHave, gap: Math.max(0, incNeed - incHave), parts: { famNeed, kidYears, parentNeed, debt: p.debt, life: p.life, liquid, epf: p.epf }, noDeps: kidYears === 0 && p.parents === 0 },
      ci: { need: ciNeed, have: ciHave, gap: Math.max(0, ciNeed - ciHave), parts: { years: A.ciYears, income: p.income, ciTreat, ci: p.ci, liquid } },
      med: { need: medBench, have: p.med, gap: Math.max(0, medBench - p.med), parts: { limit: p.med, min: F.F1.min, max: F.F1.max, cancer: F.F7.rm } },
      retire: { need: retNeed, have: Math.max(0, projectedWealth), gap: Math.max(0, retNeed - projectedWealth), parts: { projected: projectedWealth } }
    };
    Object.values(out).forEach(n => { n.covered = n.gap === 0; });
    return out;
  }

  // Real odds: only sourced odds are used — cancer 1 in 8 by age 75 (F9), spread evenly over the years (real risk rises with age).
  function realOddsCard(stage, rnd = Math.random) {
    const pStage = (1 / F.F9.oneIn) * (stage.years / F.F9.byAge);
    return { card: rnd() < pStage ? 'ci' : 'smooth', chance: pStage };
  }

  const api = { prospectNumber, QUICK, FOLLOW, scoreRound, TYPES, TYPE_EMOJI, pickQuick, personality, waNumber, DREAMS, DREAM_EMOJI, CARDS, CARD_EMOJI, stages, simulate, fundDreams, needs, realOddsCard };
  if (typeof module !== 'undefined') module.exports = api; else root.RLG_RULES = api;
})(this);
