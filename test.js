// Rule checks: node test.js
const R = require('./docs/rules.js'), D = require('./docs/data.js'), A = D.DEFAULT_ASSUMPTIONS;
const I = require('./docs/i18n.js').RLG_I18N;
let pass = 0, fail = 0;
const ok = (c, m) => { if (c) pass++; else { fail++; console.log('FAIL', m); } };

// Quick mode (Higher or Lower)
ok(R.waNumber('019-4783328') === '60194783328', 'WhatsApp number');
ok(R.prospectNumber('012-345 6789') === '60123456789' && R.prospectNumber('+60 11-2345 6789') === '601123456789' && R.prospectNumber('123456789') === '60123456789', 'prospect number formats');
ok(R.prospectNumber('') === null && R.prospectNumber('12345') === null && R.prospectNumber('03-1234 5678') === null, 'bad prospect numbers rejected');
ok(R.prospectNumber('+65 9123 4567') === '6591234567', 'overseas number with +');
let picksOk = true;
for (let i = 0; i < 500; i++) { const qs = R.pickQuick(); if (qs.length !== 3 || !qs.some(q => q.answer === 'lo') || new Set(qs.map(q => q.grp)).size !== 3 || new Set(qs).size !== 3) picksOk = false; }
ok(picksOk, 'every game: 3 rounds, 3 topics, at least one Lower');
R.QUICK.forEach(q => {
  ok(D.FIG[q.fig] && (!q.cmp || D.FIG[q.cmp]), 'round has sourced figures ' + q.id);
  ok((q.val > q.cmpVal) === (q.answer === 'hi') && q.val !== q.cmpVal, 'answer matches the figures ' + q.id);
  ok(R.FOLLOW[q.grp], 'round has a follow-up ' + q.id);
});
ok(R.scoreRound(10, 1, true) === 150 && R.scoreRound(0, 1, true) === 100 && R.scoreRound(8, 3, false) === 150, 'scoring');
const Qd = id => R.QUICK.find(x => x.id === id), mk = (id, guess, follow) => ({ q: Qd(id), guess, correct: guess === Qd(id).answer, follow });
ok(R.personality([mk('bypass', 'hi', 3), mk('months', 'hi', 0), mk('family', 'hi', 0)]).type === 'yolo', 'YOLO');
const pl = R.personality([mk('bypass', 'lo', 1), mk('months', 'lo', 3), mk('cancer', 'hi', 0)]);
ok(pl.type === 'planner' && pl.scores.optimist === 1 && pl.right === 1, 'Planner; low guesses lean Optimist');
ok(R.personality([mk('bypass', 'hi', 0), mk('months', 'hi', 2), mk('family', 'hi', 2)]).type === 'provider', 'Provider wins tie');
ok(R.personality([mk('stroke', null, 0), mk('baby', 'hi', 2), mk('months', 'hi', 1)]).right === 1, 'timeout and wrong Lower score nothing');

// Full mode
const p = { age: 32, income: 6000, spend: 4500, savings: 20000, investments: 10000, epf: 80000, epfMonthly: 1300, debt: 300000, kids: 1, youngest: 2, parents: 500, life: 100000, ci: 0, med: 50000, premiums: 300 };
const plan = [0, 1, 2].map(() => ({ life: 75, save: 10, invest: 10, protect: 5 }));
const st = R.stages(p.age, A);
ok(st.length === 3 && st[2].to === 60 && st.reduce((s, x) => s + x.years, 0) === 28, 'stages add to retirement');
const calm = R.simulate(p, plan, ['smooth', 'smooth', 'smooth'], { life: p.life, ci: p.ci, med: p.med }, A);
const bad = R.simulate(p, plan, ['smooth', 'ci', 'smooth'], { life: p.life, ci: p.ci, med: p.med }, A);
ok(bad.wealth < calm.wealth, 'critical illness reduces wealth');
ok(bad.incomeLost === 3 * 12 * 6000, 'CI income lost = 3 years');
ok(bad.timeline[1].covered === 50000 && bad.timeline[1].youPaid === 45000, 'medical card pays up to limit');
const hosp = R.simulate(p, plan, ['hospital', 'smooth', 'smooth'], { life: p.life, ci: p.ci, med: p.med }, A);
ok(hosp.timeline[0].youPaid === 0, 'hospital stay fully covered → honest "covered"');
const lapse = R.simulate(p, [{ life: 80, save: 10, invest: 10, protect: 0 }, ...plan.slice(1)], ['hospital', 'smooth', 'smooth'], { life: p.life, ci: p.ci, med: p.med }, A);
ok(lapse.timeline[0].youPaid === D.FIG.F5.rm, 'protection 0% → lapsed');
const promo = R.simulate(p, plan, ['promo', 'smooth', 'smooth'], { life: p.life, ci: p.ci, med: p.med }, A);
ok(promo.wealth > calm.wealth && Math.round(promo.finalIncome) === 6600, 'promotion');
const after = R.simulate(p, plan, ['smooth', 'ci', 'smooth'], { life: 1e6, ci: 300000, med: 120000 }, A, { forceCover: true, extraPremium: 400 });
ok(after.wealth > bad.wealth, 'covered replay ends better');
const afterNoCI = R.simulate(p, plan, ['smooth', 'smooth', 'smooth'], { life: 1e6, ci: 300000, med: 120000 }, A, { forceCover: true, extraPremium: 400 });
ok(afterNoCI.wealth < calm.wealth, 'premium is a real cost when nothing happens');

const n = R.needs(p, A, calm.wealth);
ok(n.income.need === 4500 * 12 * 21 + 500 * 12 * 10 + 300000, 'income need formula');
ok(n.income.gap === Math.max(0, n.income.need - (100000 + 30000 + 80000)), 'income gap formula');
ok(n.ci.need === 3 * 6000 * 12 + (95000 - 50000), 'CI need formula');
ok(n.med.gap === 70000, 'medical gap');
const rich = R.needs({ ...p, life: 5e6, ci: 1e6, med: 1e6, kids: 0, parents: 0, debt: 0 }, A, 1e6);
ok(rich.income.covered && rich.ci.covered && rich.med.covered && rich.retire.covered, 'already covered says so');
ok(R.needs({ ...p, kids: 0, parents: 0 }, A, 0).income.noDeps, 'no dependants flagged');

const fd = R.fundDreams([{ id: 'retire', target: 390000 }, { id: 'travel', target: 50000 }, { id: 'car', target: 100000 }], 420000);
ok(fd[0].ok && !fd[1].ok && fd[1].pct === 60 && fd[2].got === 0, 'dreams funded in order');

let calmCount = 0; for (let i = 0; i < 2000; i++) if (R.realOddsCard(st[0]).card === 'smooth') calmCount++;
ok(calmCount > 1700, 'real odds mostly calm (' + calmCount + '/2000)');

// every key used in English exists in Chinese
const en = Object.keys(I.en), missing = en.filter(k => !(k in I.zh));
ok(missing.length === 0, 'Chinese missing: ' + missing.join(','));

console.log(`${pass} passed, ${fail} failed`); process.exit(fail ? 1 : 0);
