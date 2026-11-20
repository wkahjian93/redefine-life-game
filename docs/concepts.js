// Concept Games: 7 short games that let the agent deliver REDEFINE's concept selling
// (medical, income protection, savings, legacy) while the customer plays on the agent's iPad.
// Built from the REDEFINE portal lessons (Nov 2026). Numbers come from the customer, the agent,
// or figures already approved in data.js. Nothing typed here is saved.
(function (root) {
  /* ---------------- pure maths (tested by test.js) ---------------- */
  const M = {
    earningValue: (income, age, retire) => Math.max(0, Math.round(income * 12 * Math.max(0, retire - age))),
    // sum assured vs real earning power → price tag
    saleTag(sa, value) {
      if (!value) return { kind: 'na', pct: 0, off: 0 };
      if (!sa || sa <= 0) return { kind: 'free', pct: 0, off: 100 };
      const pct = Math.min(100, Math.round(sa / value * 100));
      return { kind: pct >= 80 ? 'fair' : 'sale', pct, off: 100 - pct };
    },
    monthsLast: (savings, cover, spend) => spend > 0 ? Math.floor(Math.max(0, savings + cover) / spend) : 999,
    fv(monthly, ratePct, years) { const r = ratePct / 100 / 12, n = Math.round(years * 12); return Math.round(r ? monthly * ((Math.pow(1 + r, n) - 1) / r) : monthly * n); },
    grow: (amount, ratePct, years) => Math.round(amount * Math.pow(1 + ratePct / 100 / 12, Math.round(years * 12))),
    // Temptation jar: each temptation you give in to takes 6 months of savings from an open (ATM) jar
    jar(monthly, years, spent, perTemptation = 6) { const full = monthly * 12 * years; return { open: Math.max(0, full - spent * monthly * perTemptation), locked: full }; },
    // Legacy: without a plan, every dream reduces what the kids get; with a plan, a small cost creates the legacy
    legacy(assets, dreams, chosen, planCost, planLegacy) {
      const all = dreams.reduce((s, d) => s + d.cost, 0), mine = dreams.filter((d, i) => chosen[i]).reduce((s, d) => s + d.cost, 0);
      return { noPlan: { me: mine, kids: Math.max(0, assets - mine) },
        plan: { me: all, kids: Math.max(0, assets - all - planCost) + planLegacy, cost: planCost } };
    }
  };
  if (typeof module !== 'undefined' && module.exports) { module.exports = M; return; }

  /* ---------------- words ---------------- */
  const TX = {
    en: {
      cgBtn: 'Concept Games', cgSub: '3–5 min each · feel the idea', cgTitle: 'Concept Games', cgPick: 'Pick a game to play together. Tap 🎤 any time for your script.',
      th_med: '🏥 Medical', th_inc: '💼 Income protection', th_sav: '🐷 Savings', th_leg: '🌳 Legacy',
      g_m1: 'Insure it or not?', gs_m1: 'Sort life’s bills: which can you really pay?',
      g_m2: 'The Organ Robber', gs_m2: 'Will you sell your liver? He takes it anyway…',
      g_i1: 'Sell your earning power', gs_i1: 'An auction for your ability to work',
      g_i2: 'The Money Tree', gs_i2: 'Grow your tree with salary rain. What if the rain stops?',
      g_s1: 'Temptation Jar', gs_s1: 'Say no to temptations. Which jar keeps your money?',
      g_s2: 'The Monk’s Well', gs_s2: 'Dig 5 minutes a day. Then the drought comes.',
      g_l1: 'Spend it or leave it?', gs_l1: 'Your dreams or your kids? Why not both?',
      script: 'Agent script', cgNext: 'Next', cgStart: 'Start', cgAgain: 'Play again', cgOther: 'Other concept games', cgFull: 'Full Life Game', cgClose: 'Ask them',
      cgAvg: 'average', cgUpTo: 'up to', cgNote: 'Numbers here are for this game only. They are not saved.', yourNums: 'Your numbers',
      c_age: 'Age', c_income: 'Monthly income (RM)', c_spend: 'Family spending per month (RM)', c_savings: 'Savings you can use (RM)', c_med: 'Medical card yearly limit (RM, 0 if none)',
      c_sa: 'Total life / TPD / critical illness cover (RM)', c_cover: 'Critical illness / TPD cover paid in one lump sum (RM)', c_monthly: 'How much you can save each month (RM)', c_assets: 'What you own now, roughly (RM)',
      // M1
      m1_intro: 'Life sends bills. Swipe each one: can you pay it yourself, or can’t you afford it?',
      m1_pay: 'I can pay myself 💪', m1_lose: 'I can’t afford this 🧯', m1_of: 'Card {n} of {of}',
      m1c_flu: 'Flu, clinic visit', m1c_phone: 'Cracked phone screen', m1c_scratch: 'Scratch on your car',
      m1c_stroke: 'Stroke: private hospital stay', m1c_bypass: 'Heart bypass, private hospital', m1c_cancer: 'Cancer treatment', m1c_fire: 'Your house burns down',
      m1h_flu: 'Happens almost every year', m1h_phone: 'Happens often', m1h_scratch: 'Happens often',
      m1h_stroke: 'Rare · average RM15,671', m1h_bypass: 'Rare · RM70k–120k', m1h_cancer: '1 in 8 Malaysians by age 75 · up to RM395,000', m1h_fire: 'Very rare',
      m1_board: 'Your risk board', m1_likely: 'Happens often', m1_rare: 'Rare', m1_small: 'Small bill', m1_huge: 'Huge bill',
      m1_feel: 'We don’t buy insurance because it will happen. We buy it because if it happens, we can’t afford it.',
      m1_feel2: 'Look at your board: the bills you can’t afford are the ones that rarely happen. That is what insurance is for.',
      m1_close: 'Which of these “rare but huge” bills do you want covered if it happens next year?',
      // M2
      m2_bid: 'Psst… I buy your {organ} for {price}. Deal?', m2_liver: 'liver', m2_eyes: 'two eyes', m2_deal: 'Deal 🤝', m2_no: 'No way! ✋',
      m2_dealR: 'Really?! 😳 Most people say no. For this story, let’s say no…', m2_noR: 'Of course not. It’s priceless.',
      m2_steal: 'He didn’t ask again… 🦹 He just took them!', m2_sell: 'Now he sells them back: liver {a} + eyes {b} = {c}. Will you find the money to get them back?',
      m2_yes: 'Yes, any way I can!', m2_real: 'In real life, the robber is sickness and accidents. They don’t ask first. Then the hospital sells your health back to you.',
      m2_bills: 'Real private hospital bills', m2_cardOk: 'Your card can cover it ✅', m2_cardShort: 'Not enough by {a}',
      m2_feel: 'The robber won’t tell you when he comes. Is this money ready now?',
      m2_bonus: 'Bonus round: red or white?', m2_red: '🔴 RED: get RM1,000,000 for sure', m2_white: '⚪ WHITE: 50% win RM10,000,000, 50% LOSE RM1,000,000',
      m2_redR: 'Red! We don’t gamble with what we can’t afford to lose. That’s why we buy a medical card.',
      m2_whiteW: 'You won this time! 🎉 But will you bet your family’s house on a coin flip every month?', m2_whiteL: 'You lost RM1,000,000. 😱 Can you play again?',
      m2_close: 'If the robber came next year, which bill would worry you most?',
      // I1
      i1_intro: 'Mr. TPD (total disability) wants to buy your ability to work, forever. Once you sell, you can never earn again.',
      i1_bid: 'Mr. TPD offers', i1_sell: 'SOLD 🤝', i1_no: 'NO! 🙅', i1_never: 'Priceless! You won’t sell at any price.', i1_sold: 'You will sell for {a}.',
      i1_value: 'What you are really selling', i1_formula: '{inc} × 12 months × {yrs} years to age {ret}',
      i1_sa: 'Now check your policies. If Mr. TPD came today, how much would you get?',
      i1_free: 'FREE GIFT 🎁', i1_freeT: 'No cover means Mr. TPD takes your earning power for free.',
      i1_sale: 'SALE: {off}% OFF', m2_top: 'RM120k = highest price', i1_saleT: 'You are selling {v} of earning power for only {sa}.', i1_fair: 'FAIR PRICE ✅', i1_fairT: 'Your cover is close to what your earning power is worth. Well protected!',
      i1_feel: 'You won’t sell it for {a}, so why is your sum assured only {b}? Don’t sell something precious cheap.',
      i1_close: 'If you put a price on your ability to earn, how much should you protect?',
      // I2
      i2_warm: 'Quick question first', i2_w1: 'Does your phone have warranty?', i2_w2: 'Does your car have warranty?', i2_w3: 'Does your SALARY have warranty?',
      i2_wYes: 'Yes', i2_wNo: 'No', i2_wHint: 'We give warranty to precious things. Which is more precious: your phone or your salary?',
      i2_grow: 'Tap the cloud. Each tap = 1 year of salary rain. Grow your tree!', i2_rain: 'Make it rain 🌧️', i2_year: 'Year {n}: +{a}',
      i2_full: 'Beautiful! House, car, family, dreams: all fruit from your salary.', i2_stop: 'Agent: choose what stops the rain', i2_ci: '💔 Critical illness', i2_tpd: '♿ Accident / disability',
      i2_drought: 'The rain stopped. The family still spends {a} a month…', i2_months: 'Your savings keep the tree alive for',
      i2_mo: '{n} months', i2_need: 'Recovery usually takes about {n} months (game setting).',
      i2_tank: 'Play again with a water tank: protection that pays one lump sum when the rain stops',
      i2_withTank: 'With the tank', i2_without: 'Savings only', i2_okTank: 'Your tank lasts the whole recovery ✅', i2_noTank: 'To last {n} months, you need about {a} more.',
      i2_feel: 'We bought a medical card to protect the fruit. But we forgot to protect the root: the salary that waters everything.',
      i2_close: 'If the rain stopped for 3 years, which fruit do you want to keep?',
      // S1
      s1_intro: 'Every month, your savings drop into a jar. Temptations will try to grab them. Tap SAY NO fast!',
      s1_roundA: 'Round 1: the ATM jar (lid open, easy to take)', s1_roundB: 'Round 2: the locked jar (save first, then spend)',
      s1_resist: 'SAY NO 💪', s1_spend: 'Spend 🛍️', s1_took: 'It took 6 months of savings!', s1_saved: 'Saved! 💪',
      s1_t: ['Big SALE 50% off!', 'New phone is out!', 'Weekend trip with friends?', 'Change to a new car', '11.11 online shopping', 'Concert tickets!', 'Renovate the kitchen', 'Treat yourself, you deserve it', 'New gadget', 'Nice dinner every week'],
      s1_yearN: 'Year {n}', s1_jarA: 'ATM jar after 10 years', s1_jarB: 'Locked jar after 10 years', s1_bounce: 'Temptations bounce off the lock 🔒',
      s1_mum: 'Kah Jian’s mum: “I didn’t gain 20k. I gained 70k. If I didn’t lock it away, your dad would have spent it all.”',
      s1_feel: 'Income − savings = spending. Not income − spending = savings. Save first, then spend what is left.',
      s1_close: 'Which of your accounts is a “spending account” pretending to be savings?',
      // S2
      s2_intro: 'Two monks fetch water from the river every day. Monk B (you!) also digs for 5 minutes. Tap to dig.',
      s2_dig: 'Dig 5 minutes ⛏️', s2_depth: 'Well progress', s2_done: 'The well is ready! 💧',
      s2_drought: '3 years later, a drought…', s2_a: 'Monk A still walks down the hill for water 🥵', s2_b: 'Monk B does tai chi next to his own well 🧘',
      s2_quiz: 'RM1,000 a month, 6% a year, 30 years ≈ {a}. What is the real key?',
      s2_o1: 'The RM1,000', s2_o2: 'The 6%', s2_o3: '30 years, never stop', s2_right: 'Yes! 30 years, never stop.', s2_wrong: 'Close. The key is 30 years, never stop.',
      s2_c1: 'Save 30 years, never stop', s2_c2: 'Save 15 years, then stop', s2_c3: 'Start 15 years late',
      s2_illus: 'Example maths at 6% a year from the lesson. Not a promised return.',
      s2_feel: 'Your future depends on what you quietly do today, while others spend. Later, they can’t catch up.',
      s2_close: 'What is your “5 minutes of digging” every month?',
      // L1
      l1_intro: 'You worked hard for what you own. Let’s see how you want to use it.', l1_dreams: 'Pick the dreams you want to do (up to 4) and the rough cost',
      ld_trip: '✈️ Family trips', ld_parents: '👵 Treat my parents', ld_car: '🚗 Dream car', ld_retire: '🏖️ Retire earlier', ld_hobby: '🎨 My hobby / passion', ld_give: '🤝 Give back',
      l1_scale: 'No plan: every ringgit you spend is taken from the kids’ inheritance.', l1_do: 'Do it', l1_skip: 'Skip',
      l1_me: 'For me', l1_kids: 'For the kids', l1_guilt: 'Many parents skip their own dreams to leave more for the kids.',
      l1_plan: 'With a legacy plan: a small part of your money creates the legacy.',
      l1_cost: 'Total cost of the plan (RM)', l1_leg: 'Amount the kids get from the plan (RM)', l1_agent: 'Agent: enter both from the latest approved benefit illustration.',
      l1_need: 'Enter the plan cost and the legacy amount to see the result.', l1_both: 'Both sides. No need to choose! 🎉', l1_less: 'With these numbers, the kids get less than with no plan. Try a different plan.',
      l1_before: 'No plan', l1_after: 'With a plan', l1_dreamsDone: 'Dreams done', l1_kidsGet: 'Kids get',
      l1_feel: 'Remove the worry about what you leave behind. Then your money can be spent on what you worked so hard for.',
      l1_feel2: 'You don’t need to choose between living your life and leaving something for your kids.',
      l1_close: 'If your kids’ legacy is already settled, what do you want to spend on first?'
    },
    zh: {
      cgBtn: '概念游戏', cgSub: '每个 3–5 分钟 · 感受概念', cgTitle: '概念游戏', cgPick: '选一个一起玩。随时点 🎤 看你的话术。',
      th_med: '🏥 医药', th_inc: '💼 收入保障', th_sav: '🐷 储蓄', th_leg: '🌳 传承',
      g_m1: '保还是不保？', gs_m1: '把人生账单分类：哪些你真的付得起？',
      g_m2: '强盗抢器官', gs_m2: '你会卖你的肝吗？他还是抢走了……',
      g_i1: '拍卖你的赚钱能力', gs_i1: '一场拍卖：你的工作能力值多少？',
      g_i2: '摇钱树', gs_i2: '用薪水的雨灌溉你的树。如果雨停了呢？',
      g_s1: '诱惑存钱罐', gs_s1: '抵抗诱惑！哪个罐子能留住你的钱？',
      g_s2: '和尚挖井', gs_s2: '每天挖 5 分钟，然后旱灾来了',
      g_l1: '花掉还是留下？', gs_l1: '你的梦想还是孩子？为什么不能两个都要',
      script: '代理话术', cgNext: '下一步', cgStart: '开始', cgAgain: '再玩一次', cgOther: '其他概念游戏', cgFull: '完整人生游戏', cgClose: '问他',
      cgAvg: '平均', cgUpTo: '最高', cgNote: '这里输入的数字只用在这个游戏，不会保存。', yourNums: '你的数字',
      c_age: '年龄', c_income: '每月收入（RM）', c_spend: '家庭每月开销（RM）', c_savings: '可动用的储蓄（RM）', c_med: '医药卡每年限额（RM，没有填 0）',
      c_sa: '人寿 / 残废 / 危疾总保额（RM）', c_cover: '一次过赔付的危疾 / 残废保额（RM）', c_monthly: '每个月可以存多少（RM）', c_assets: '你现在大概拥有多少（RM）',
      m1_intro: '人生会寄来账单。滑每一张：你自己付得起，还是输不起？',
      m1_pay: '我自己付得起 💪', m1_lose: '我输不起 🧯', m1_of: '第 {n} / {of} 张',
      m1c_flu: '感冒看诊', m1c_phone: '手机屏幕摔裂', m1c_scratch: '车子刮花',
      m1c_stroke: '中风：私立医院住院', m1c_bypass: '私立医院心脏搭桥', m1c_cancer: '癌症治疗', m1c_fire: '房子被火烧掉',
      m1h_flu: '几乎每年都会发生', m1h_phone: '常常发生', m1h_scratch: '常常发生',
      m1h_stroke: '很少发生 · 平均 RM15,671', m1h_bypass: '很少发生 · RM70k–120k', m1h_cancer: '75 岁前每 8 人有 1 人 · 可高达 RM395,000', m1h_fire: '非常少发生',
      m1_board: '你的风险图', m1_likely: '常发生', m1_rare: '很少发生', m1_small: '小账单', m1_huge: '大账单',
      m1_feel: '不是因为发生的可能性很高才买保险，而是因为后果很严重，发生的时候我们输不起。',
      m1_feel2: '看你的风险图：你输不起的，刚好都是很少发生的。保险就是为了这个。',
      m1_close: '这些「很少发生但很严重」的账单，如果明年发生，你希望哪一张有人帮你处理？',
      m2_bid: '嘘……我出 {price} 买你的{organ}，卖不卖？', m2_liver: '肝', m2_eyes: '两颗眼睛', m2_deal: '成交 🤝', m2_no: '不卖！✋',
      m2_dealR: '真的吗？！😳 大部分人都说不卖。这个故事我们就当你不卖……', m2_noR: '当然不卖，这是无价的。',
      m2_steal: '他没再问了……🦹 直接抢走了！', m2_sell: '现在他卖回给你：肝 {a} + 眼睛 {b} = {c}。你会不会想尽办法把它赎回来？',
      m2_yes: '会！想尽办法也要！', m2_real: '现实生活里，强盗就是疾病和意外。它们不会先问你，而医院会把你的健康「卖回」给你。',
      m2_bills: '真实的私立医院账单', m2_cardOk: '你的医药卡够 ✅', m2_cardShort: '还差 {a}',
      m2_feel: '强盗不会告诉你他什么时候来。这笔钱，你准备好了吗？',
      m2_bonus: '加分题：红键还是白键？', m2_red: '🔴 红键：马上得到 RM1,000,000', m2_white: '⚪ 白键：50% 得到 RM10,000,000，50% 亏掉 RM1,000,000',
      m2_redR: '红键！输不起的，我们不赌。这就是为什么我们买医药卡。',
      m2_whiteW: '这次你赢了！🎉 但你会每个月都拿全家的房子来赌一次吗？', m2_whiteL: '你亏了 RM1,000,000。😱 你还玩得起第二次吗？',
      m2_close: '如果强盗明年来，哪一张账单最让你担心？',
      i1_intro: '完全残废先生想买你的工作能力，永久的。卖了以后，你再也不能赚钱。',
      i1_bid: '残废先生出价', i1_sell: '卖了 🤝', i1_no: '不卖！🙅', i1_never: '无价！多少钱都不卖。', i1_sold: '你愿意以 {a} 卖掉。',
      i1_value: '你真正卖掉的是', i1_formula: '{inc} × 12 个月 × 到 {ret} 岁的 {yrs} 年',
      i1_sa: '现在打开你的保单。如果残废先生今天来，你会拿到多少？',
      i1_free: '免费送 🎁', i1_freeT: '没有保障，残废先生就免费拿走你的赚钱能力。',
      i1_sale: '大减价：便宜 {off}%', m2_top: 'RM120k = 最高价', i1_saleT: '你把价值 {v} 的赚钱能力，以 {sa} 贱卖了。', i1_fair: '价钱合理 ✅', i1_fairT: '你的保额接近你赚钱能力的价值，保护得很好！',
      i1_feel: '你自己说 {a} 都不卖，那为什么你的保额只有 {b}？珍贵的东西，不要贱卖。',
      i1_close: '如果要给你的赚钱能力定一个价，你觉得该保护多少？',
      i2_warm: '先问一个问题', i2_w1: '你的手机有保修吗？', i2_w2: '你的车有保修吗？', i2_w3: '你的「薪水」有保修吗？',
      i2_wYes: '有', i2_wNo: '没有', i2_wHint: '我们会给珍贵的东西保修。手机比较珍贵，还是薪水比较珍贵？',
      i2_grow: '点云朵：每点一下是一年的薪水雨。把你的树养大！', i2_rain: '下雨 🌧️', i2_year: '第 {n} 年：+{a}',
      i2_full: '好漂亮！房子、车子、家庭、梦想：全都是薪水灌溉出来的果实。', i2_stop: '代理：选择是什么让雨停了', i2_ci: '💔 危疾', i2_tpd: '♿ 意外 / 残废',
      i2_drought: '雨停了。家里每个月还是要花 {a}……', i2_months: '你的储蓄可以让树撑',
      i2_mo: '{n} 个月', i2_need: '康复通常需要大约 {n} 个月（游戏设定）。',
      i2_tank: '加一个水塔再玩一次：雨停时一次过赔付的保障', i2_withTank: '有水塔', i2_without: '只有储蓄',
      i2_okTank: '你的水塔撑得过康复期 ✅', i2_noTank: '要撑 {n} 个月，大约还需要 {a}。',
      i2_feel: '我们买了医药卡保护果实，却忘了保护根源：灌溉一切的薪水。',
      i2_close: '如果雨停了 3 年，你最想留住哪一颗果实？',
      s1_intro: '每个月你的储蓄掉进罐子里。诱惑会来抢，快点「抵抗」！',
      s1_roundA: '第 1 回合：ATM 罐（盖子开着，很容易拿）', s1_roundB: '第 2 回合：上锁的罐（先存，再花）',
      s1_resist: '抵抗 💪', s1_spend: '买 🛍️', s1_took: '被拿走 6 个月的储蓄！', s1_saved: '守住了！💪',
      s1_t: ['大减价，半价！', '新手机出了！', '周末和朋友去旅行？', '换一辆新车', '11.11 网购', '演唱会门票！', '装修厨房', '犒赏自己，你值得', '新电子产品', '每个星期吃大餐'],
      s1_yearN: '第 {n} 年', s1_jarA: '10 年后的 ATM 罐', s1_jarB: '10 年后的上锁罐', s1_bounce: '诱惑被锁弹开了 🔒',
      s1_mum: 'Kah Jian 的妈妈：「哪里只赚 20 多千，我赚了 70 多千，因为如果不存起来，早就被你爸爸花掉了。」',
      s1_feel: '收入 − 储蓄 = 开销，而不是收入 − 开销 = 储蓄。先存，剩下的才花。',
      s1_close: '你的哪一个户口，其实是假装成储蓄的「花钱户口」？',
      s2_intro: '两个和尚每天下山打水。和尚 B（就是你！）每天还多挖 5 分钟的井。点一下来挖。',
      s2_dig: '挖 5 分钟 ⛏️', s2_depth: '挖井进度', s2_done: '井挖好了！💧',
      s2_drought: '三年后，旱灾来了……', s2_a: '和尚 A 还是每天下山打水 🥵', s2_b: '和尚 B 在自己的井旁打太极 🧘',
      s2_quiz: '每月 RM1,000，每年 6%，存 30 年 ≈ {a}。真正的关键是什么？',
      s2_o1: '那 RM1,000', s2_o2: '那 6%', s2_o3: '30 年，不间断', s2_right: '对！关键是 30 年不间断。', s2_wrong: '差一点，关键是 30 年不间断。',
      s2_c1: '存 30 年，不间断', s2_c2: '存 15 年就停', s2_c3: '晚 15 年才开始',
      s2_illus: '用课程里每年 6% 的示意计算，不是承诺的回报。',
      s2_feel: '以后的成就，取决于你今天默默做的事。等别人看懂时，已经追不上了。',
      s2_close: '每个月，你的「挖 5 分钟井」会是什么？',
      l1_intro: '你辛苦赚来了现在拥有的一切。来看看你会怎么用。', l1_dreams: '选你很想做的梦想（最多 4 个）和大概费用',
      ld_trip: '✈️ 家庭旅行', ld_parents: '👵 孝敬父母', ld_car: '🚗 梦想的车', ld_retire: '🏖️ 提早退休', ld_hobby: '🎨 我的热爱 / 嗜好', ld_give: '🤝 回馈社会',
      l1_scale: '没有规划：你花的每一块钱，都是从孩子的遗产里拿出来的。', l1_do: '去做', l1_skip: '算了',
      l1_me: '给自己', l1_kids: '给孩子', l1_guilt: '很多父母为了留多一点给孩子，放弃了自己的梦想。',
      l1_plan: '有传承规划：用一小部分资产，创造一笔传承。',
      l1_cost: '这个规划的总费用（RM）', l1_leg: '留给孩子的传承金额（RM）', l1_agent: '代理：两个数字都以最新核准的利益说明书为准。',
      l1_need: '输入规划费用和传承金额来看结果。', l1_both: '两边都有，不需要二选一！🎉', l1_less: '用这些数字，孩子拿到的比没有规划还少。试试别的规划。',
      l1_before: '没有规划', l1_after: '有规划', l1_dreamsDone: '完成的梦想', l1_kidsGet: '孩子拿到',
      l1_feel: '把后顾之忧拿掉，你的钱才能真正花在你努力的意义上。',
      l1_feel2: '活出自己的人生，和留钱给孩子，两边不耽误，不需要二选一。',
      l1_close: '如果留给孩子的已经安排好了，你第一个想花在什么上？'
    }
  };
  // Live movie subtitles and controls
  Object.assign(TX.en, {
    mv_hint: 'Live movie: the customer controls the character. ⏭ skips.', mv_drag: 'Drag to move', mv_hold: 'Hold the screen to walk →', mv_tapJump: 'Tap to jump!', mv_tapFast: 'Tap fast!', mv_dragCloud: 'Drag the cloud ☁️',
    mv1_a: 'This is you. Life drops bills on you.', mv1_b: 'Catch the small bills. You can pay these yourself.', mv1_warn: 'Rare… but HUGE!',
    mv1_hit: 'Too big to dodge. Savings gone!', mv1_r2: 'Same life again. Now you have an umbrella ☂️ for HUGE bills only.', mv1_small2: 'Small bills? Still pay yourself.',
    mv1_cov: 'Covered ✅ Your savings are safe.', mv1_savings: 'Savings', mv1_caught: 'Paid myself: {n}',
    mv2_walk: 'Night time. You walk home alone…', mv2_run: 'RUN! He is coming!', mv2_caught: 'He caught you. Sickness and accidents don’t ask first.',
    mv3_work: 'Work! Each tap = 1 year of salary.', mv3_btn: 'WORK 💪', mv3_done: 'Your earning power until retirement: {a}', mv3_age: 'Age {a}',
    mv3_tpd: 'Mr. TPD walks in…', mv3_bid: 'I buy your ability to work, forever: {a}', mv3_back: 'He comes back with more money…',
    mv3_take: 'But Mr. TPD doesn’t need your permission. He can take it anyway.',
    mv4_grow: 'Salary rain grows your tree. Move the cloud over it!', mv4_tree: 'Tree', mv4_stop: 'Agent: what stops the rain?', mv4_month: 'Month {n}',
    mv4_out: 'Savings lasted {n} months. Recovery needs {m} months.', mv4_ok: 'Savings last {n} months. Recovery needs {m}. You’re OK ✅',
    mv5_r1: 'Round 1: ATM jar, lid open. Run 10 years!', mv5_r2: 'Round 2: locked jar 🔒. Save first, spend later.', mv5_hit: 'Spent! −6 months',
    mv5_end1: 'ATM jar after 10 years: {a}', mv5_end2: 'Locked jar after 10 years: {a}', mv5_spent: 'Temptations that got you in round 1: {n}',
    mv6_a: 'Every day, both monks fetch water from the river.', mv6_dig: 'Monk B (you!): tap fast to DIG ⛏️', mv6_btn: 'DIG ⛏️', mv6_enough: 'Enough for today. Back tomorrow!', mv6_day: 'Day {n}', mv6_well: 'Well',
    mv7_walk: 'Your life road. Each stall is a dream.', mv7_stall: '{d} · {c}. Do it?', mv7_kidsSad: 'That money comes out of the kids’ bag…',
    mv7_plan: 'With a legacy plan: a small amount goes into a gift box for the kids 🎁', mv7_free: 'Now you can say YES to your dreams!',
    mv7_yes: '{d} · {c}. YES! ✅', mv7_me: 'Me', mv7_kids: 'Kids', mv7_ready: 'Play again with a plan'
  });
  Object.assign(TX.zh, {
    mv_hint: '互动小电影：由客户控制角色。⏭ 可跳过。', mv_drag: '拖动来移动', mv_hold: '按住屏幕往前走 →', mv_tapJump: '点一下跳！', mv_tapFast: '快点点！', mv_dragCloud: '拖动云朵 ☁️',
    mv1_a: '这是你。人生不停丢账单给你。', mv1_b: '接住小账单，这些你自己付得起。', mv1_warn: '很少发生……但很大！',
    mv1_hit: '太大了，躲不开。储蓄没了！', mv1_r2: '同样的人生再来一次。现在你有一把伞 ☂️，只挡大账单。', mv1_small2: '小账单？还是自己付。',
    mv1_cov: '挡住了 ✅ 你的储蓄安全。', mv1_savings: '储蓄', mv1_caught: '自己付了：{n}',
    mv2_walk: '晚上，你一个人走路回家……', mv2_run: '快跑！他追来了！', mv2_caught: '他抓到你了。疾病和意外不会先问你。',
    mv3_work: '工作！每点一下 = 1 年薪水。', mv3_btn: '工作 💪', mv3_done: '你到退休的赚钱能力：{a}', mv3_age: '{a} 岁',
    mv3_tpd: '残废先生走进来了……', mv3_bid: '我买你的工作能力，永久的：{a}', mv3_back: '他带着更多钱回来了……',
    mv3_take: '可是残废先生不需要你同意，他可以直接拿走。',
    mv4_grow: '薪水雨让你的树长大。把云移到树上面！', mv4_tree: '树', mv4_stop: '代理：是什么让雨停了？', mv4_month: '第 {n} 个月',
    mv4_out: '储蓄撑了 {n} 个月。康复要 {m} 个月。', mv4_ok: '储蓄撑 {n} 个月，康复要 {m} 个月。你撑得过 ✅',
    mv5_r1: '第 1 回合：ATM 罐，盖子开着。跑 10 年！', mv5_r2: '第 2 回合：上锁的罐 🔒。先存，后花。', mv5_hit: '花掉了！−6 个月',
    mv5_end1: '10 年后的 ATM 罐：{a}', mv5_end2: '10 年后的上锁罐：{a}', mv5_spent: '第 1 回合被诱惑抓到：{n} 次',
    mv6_a: '每天，两个和尚都下山到河边打水。', mv6_dig: '和尚 B（就是你！）：快点点来挖井 ⛏️', mv6_btn: '挖 ⛏️', mv6_enough: '今天挖够了，明天继续！', mv6_day: '第 {n} 天', mv6_well: '井',
    mv7_walk: '你的人生路。每个摊位是一个梦想。', mv7_stall: '{d} · {c}。要去做吗？', mv7_kidsSad: '这笔钱是从孩子的袋子里拿的……',
    mv7_plan: '有传承规划：拿一小笔钱放进给孩子的礼物盒 🎁', mv7_free: '现在你可以对梦想说「好」！',
    mv7_yes: '{d} · {c}。去做！✅', mv7_me: '我', mv7_kids: '孩子', mv7_ready: '有规划，再玩一次'
  });
  Object.assign(TX.en, {"th_delay":"⏰ Don’t wait","g_c1":"Don’t Wait!","gs_c1":"Maze chase: collect, dodge illness, meet the agent","c1_intro":"Run through life collecting money and dreams. Illness, accidents and disability are chasing you. An insurance agent is following you too.","c1_r1":"🕹️ Swipe on the maze, or use the ▲▼◀▶ buttons.","c1_r2":"🪙 Coins = money. ❓ boxes = life: dreams (⭐ purpose points), investment, or health problems.","c1_r3":"🧑‍💼 Touch the agent: the game pauses. Buy or say “not now”. Health problems first = cost 3×, or cannot buy.","c1_r4":"🤒🚑🧑‍🦽 If they catch you with no insurance: purpose points and money go to zero. With insurance: you get a big payout. Caught 3 times = game over ❤️❤️❤️.","c1_r5":"🏆 Reach 100 purpose points before age 65. The chasers are slow when you are young, faster at 40, very fast at 50!","c1_endNow":"End game now","c1_win":"You made it! 100 purpose points 🎉","c1_lose":"Game over at age {a}","c1_out":"Caught 3 times. Game over at age {a} 💔","chOut":"Caught {n} times… GAME OVER 💔","c1_rP":"Purpose points","c1_rM":"Money left","c1_rIns":"Insured","c1_atAge":"Yes, at age {a}","c1_never":"Never","c1_rRej":"Said “not now” to the agent","c1_rFlags":"Health problems before buying","c1_none":"None","c1_rDec":"Could not buy (health)","c1_rClaims":"Claims paid to you","c1_rHits":"Caught with no cover","c1_lLate":"You said “not now” {n} time(s). When you wanted it, your health had already changed the answer.","c1_lHit":"Life caught you before you were covered. Purpose and money: gone in one moment.","c1_lGood":"You bought early. When life caught you, the payout kept your dreams going.","c1_lSafe":"You bought early, while you were healthy and it was cheap. 👍","c1_lNone":"Lucky this time. But the chasers only get faster.","c1_feel":"Insurance is bought with your health, not with your money. Don’t wait until it’s too late.","c1_feel2":"The best time to buy is when you don’t need it yet.","c1_note":"Game rules are simplified, with game coins (not real prices). In real life the insurer decides after checking your health: extra cost, exclusions or decline are possible.","c1_close":"If you met an agent today, would you say “later”? What would “later” cost you?","chAge":"Age {a}","chInsured":"Insured","chNoCover":"No cover","chSick":"Can’t buy","ciTag":"Critical illness","accTag":"Accident","tpdTag":"Disability","chAgentTag":"Agent","chHow":"Swipe or use the buttons","chStart":"Go! Collect coins and ❓ boxes. Watch out behind you!","chWake":"{what} is coming for you!","chAgentCome":"🧑‍💼 An insurance agent is following you…","chOffer":"Insurance agent: “Protect yourself now?”","chPrice":"Price: {p} 💰 (game coins).","chLoading":"Because of {list}, the price is 3×: {p} 💰.","chDecline":"Sorry… because of {list}, you cannot buy insurance now.","chNoMoney":"You need {p} 💰. Collect more coins first.","chBuy":"Buy","chReject":"Not now","chOk":"OK","chGameNote":"Game coins only. Not a real price or product.","chBought":"Protected! 🛡️ The agent leaves happy.","chRejected":"You said “not now”. The agent will be back…","chDeclined":"Too late to buy. The agent has to leave.","chClaim":"{what} caught you, but you’re insured: +{p} 💰! All ❓ boxes are now dreams ⭐","chHit":"{what} caught you with no cover… Purpose points and money: gone. 😭","chInvest":"Investment paid off: +30 💰","chClaim2":"{what} caught you. Insured again: +{p} 💰","chFaster40":"Age 40! ⚠️ Illness, accident and disability now move FASTER.","chFaster50":"Age 50! 🚨 They now move VERY FAST!","chHealth1":"{what}! ⚠️ Insurance now costs more.","chHealth2":"{what}! ⚠️ Too many health problems: you can’t buy insurance now.","chHealthCovered":"{what}, but you’re already covered ✅","chHealthSick":"{what}. Your health keeps getting worse…","hh_glucose":"High blood sugar","hh_bp":"High blood pressure","hh_cyst":"Cyst found","hh_bmi":"High BMI","hh_chol":"High cholesterol","hh_uric":"High uric acid","pp_house":"New house! +{n} ⭐","pp_car":"New car! +{n} ⭐","pp_baby":"New baby! +{n} ⭐","pp_love":"New girlfriend! +{n} ⭐","pp_travel":"Travel the world! +{n} ⭐","pp_edu":"Paid for the kids’ education! +{n} ⭐"});
  Object.assign(TX.zh, {"th_delay":"⏰ 不要拖","g_c1":"不要等！","gs_c1":"迷宫追逐：收集、躲疾病、遇见代理","c1_intro":"在人生里跑，收集钱和梦想。疾病、意外和残废在后面追你。一位保险代理也在跟着你。","c1_r1":"🕹️ 在迷宫上滑动，或用 ▲▼◀▶ 按钮。","c1_r2":"🪙 金币 = 钱。❓ 箱子 = 人生：梦想（⭐ 目标分）、投资，或健康问题。","c1_r3":"🧑‍💼 碰到代理：游戏暂停，选择买或「以后再说」。先有健康问题 = 价钱 3 倍，或买不到。","c1_r4":"🤒🚑🧑‍🦽 没保险被抓到：目标分和钱归零。有保险：拿到一大笔赔偿。被抓到 3 次 = 游戏结束 ❤️❤️❤️。","c1_r5":"🏆 65 岁前拿到 100 目标分。年轻时它们跑得慢，40 岁变快，50 岁非常快！","c1_endNow":"现在结束","c1_win":"你做到了！100 目标分 🎉","c1_lose":"{a} 岁：游戏结束","c1_out":"被抓到 3 次。{a} 岁游戏结束 💔","chOut":"被抓到 {n} 次……游戏结束 💔","c1_rP":"目标分","c1_rM":"剩下的钱","c1_rIns":"有买保险","c1_atAge":"有，{a} 岁时","c1_never":"从来没有","c1_rRej":"对代理说「以后再说」","c1_rFlags":"买保险前的健康问题","c1_none":"没有","c1_rDec":"买不到（健康问题）","c1_rClaims":"拿到的赔偿次数","c1_rHits":"没保障时被抓到","c1_lLate":"你说了 {n} 次「以后再说」。等你想买的时候，健康已经替你做了决定。","c1_lHit":"还没保障，人生就抓到你了。目标和钱，一瞬间全没了。","c1_lGood":"你很早就买了。人生抓到你的时候，赔偿让你的梦想继续。","c1_lSafe":"你在健康、便宜的时候就买了。👍","c1_lNone":"这次运气好。但追你的只会越来越快。","c1_feel":"保险是用健康买的，不是用钱买的。不要等到太迟。","c1_feel2":"最好的购买时间，是你还不需要它的时候。","c1_note":"游戏规则已简化，用的是游戏金币（不是真实价格）。现实中，保险公司会检查你的健康再决定：可能加价、不保某些病，或拒保。","c1_close":"如果今天遇到代理，你会说「以后再说」吗？「以后」会让你付出什么？","chAge":"{a} 岁","chInsured":"有保障","chNoCover":"没保障","chSick":"买不到","ciTag":"危疾","accTag":"意外","tpdTag":"残废","chAgentTag":"代理","chHow":"滑动或用按钮","chStart":"出发！收集金币和 ❓ 箱子。小心后面！","chWake":"{what}来追你了！","chAgentCome":"🧑‍💼 一位保险代理在跟着你……","chOffer":"保险代理：「现在保护自己吗？」","chPrice":"价钱：{p} 💰（游戏金币）。","chLoading":"因为{list}，价钱变 3 倍：{p} 💰。","chDecline":"对不起……因为{list}，你现在买不到保险。","chNoMoney":"你需要 {p} 💰，先收集多点金币。","chBuy":"买","chReject":"以后再说","chOk":"好","chGameNote":"只是游戏金币，不是真实价格或产品。","chBought":"有保障了！🛡️ 代理开心地离开。","chRejected":"你说「以后再说」。代理会再回来……","chDeclined":"太迟买不到了，代理只好离开。","chClaim":"{what}抓到你，但你有保险：+{p} 💰！所有 ❓ 箱子都变成梦想 ⭐","chHit":"{what}抓到没保障的你……目标分和钱：全没了。😭","chInvest":"投资赚了：+30 💰","chClaim2":"{what}抓到你。有保险：+{p} 💰","chFaster40":"40 岁了！⚠️ 疾病、意外和残废现在跑得更快。","chFaster50":"50 岁了！🚨 它们现在跑得非常快！","chHealth1":"{what}！⚠️ 保险现在更贵了。","chHealth2":"{what}！⚠️ 健康问题太多：你现在买不到保险。","chHealthCovered":"{what}，但你已经有保障 ✅","chHealthSick":"{what}。你的健康越来越差……","hh_glucose":"血糖高","hh_bp":"血压高","hh_cyst":"身体有肿瘤/囊肿","hh_bmi":"BMI 太高","hh_chol":"胆固醇高","hh_uric":"尿酸高","pp_house":"买新房子！+{n} ⭐","pp_car":"买新车！+{n} ⭐","pp_baby":"新宝宝！+{n} ⭐","pp_love":"有女朋友了！+{n} ⭐","pp_travel":"环游世界！+{n} ⭐","pp_edu":"付了孩子的教育费！+{n} ⭐"});
  // Agent scripts (from the REDEFINE portal lessons; shown when the agent taps 🎤)
  const SCRIPT = {
    c1: {"zh":["保险不是用钱买的，是用健康买的。","很多人说「以后再说」。可是以后，血糖、血压、身体检查出来的问题，会让保费变贵，甚至买不到。","疾病和意外不会等你准备好，它们只会越来越近。","最好的购买时间，是你还不需要它的时候。今天健康，就是你最便宜、最容易的一天。"],"en":["Insurance is bought with your health, not your money.","Many people say “later”. But later, high sugar, high blood pressure or a check-up finding can make it cost more, or impossible to buy.","Illness and accidents don’t wait until you are ready. They only get closer.","The best time to buy is when you don’t need it yet. Today, while you are healthy, is your cheapest and easiest day."]},
    m1: { zh: ['不是因为发生的可能性很高才买保险，而是因为后果很严重。', '灭火器：这间店以前有火灾过吗？（没有）以后会吗？（不大会）那为什么还要准备灭火器？因为火灾的时候，我们输不起性命，输不起钱财，输不起辛苦打拼回来的一切。', '栏杆理论：人们建栏杆不是因为对走路没信心，而是万一失足掉下去，那个状况输不起。', '保险，是一个方案来解决那个不大会发生的问题，但是如果发生的时候，你却输不起。'],
      en: ['We don’t insure because it’s likely; we insure because the result is serious.', 'Fire extinguisher: has this shop ever burned? (No.) Will it? (Probably not.) So why keep one? Because in a fire we can’t afford to lose our lives, our money, everything we built.', 'Railings on a bridge aren’t there because we can’t walk. They’re there because if we fall, we can’t afford it.', 'Insurance is a solution for something unlikely that you can’t afford if it happens.'] },
    m2: { zh: ['假设有个强盗要买你的肝，一个一百万，你会卖吗？眼睛一粒两百万呢？', '如果你不卖，他向你抢，然后卖回给你。你会不会想尽办法找钱赎回？', '现实生活里真的有这个强盗，就是疾病和意外。我们不知道几时被盯上。你有准备好这笔钱吗？', '红白键：我们不选白键，是因为这个选择的风险我们承担不起。我宁愿拿每个月输得起的钱，化解那个我输不起的医药费。'],
      en: ['A robber offers RM1m for your liver, RM2m per eye. Would you sell?', 'If you refuse, he takes them and sells them back. Would you find the money?', 'In real life the robber is illness and accidents. We don’t know when. Is your money ready?', 'Red or white: we don’t pick white because we can’t afford that risk. I’d rather use an amount I can afford each month to handle a bill I can’t afford.'] },
    i1: { zh: ['风险的基础是价值。越是珍贵越需要上保险。', 'Mr Death / TPD / CI 来买你的工作能力，等于买掉你能赚的钱。如果卖，你会卖多少？一个亿？无价？', '那么现在打开你的 policy，sum assured 多少钱？如果只有 50K，会不会好像贱卖？', '如果没有买，是不是好像把一个亿才卖的工作能力免费送给它？买一份 income protection，不卖一个亿，至少不要贱卖。'],
      en: ['Risk is based on value. The more precious, the more it needs protecting.', 'Mr Death / TPD / CI wants to buy your ability to work, which means everything you could earn. What would you sell it for? RM100m? Priceless?', 'Now open your policy: what’s the sum assured? If it’s RM50k, isn’t that selling it cheap?', 'With no cover, you’re giving it away for free. Income protection: if not RM100m, at least don’t sell at a discount.'] },
    i2: { zh: ['门前的一棵大树，因为雨水长年累月的灌溉而茂盛，开花结果。', '我们的人生就像这棵树：努力赚钱，买车买房，建立家庭。我们买医药卡保护这些结果。', '可是人们忘了，财富不断成长，是因为有个珍贵的薪水不断灌溉着。人们只记得保护结果，忘了保护根源。', '为什么手机、车、电视都要 warranty？因为珍贵。你的薪水比较珍贵还是手机？如果薪水坏了，需要 warranty 几年？'],
      en: ['A tree flourishes because rain waters it year after year.', 'Our life is like this tree: we work, buy a car and a house, build a family, and we buy a medical card to protect all that fruit.', 'But we forget the wealth grows because a precious salary keeps watering it. We protect the fruit and forget the root.', 'Why do phones, cars and TVs have warranties? Because they’re precious. What about your salary? If it breaks, how many years of warranty would you want?'] },
    s1: { zh: ['不是花剩的钱才存，而是存剩的钱才花。收入 − 储蓄 = 开销。', '很多年轻人把钱存在 spending account（随时可以提款的户口），容易拿，花钱的欲望高。', '存一下花一下：其实我们都有存钱，只不过存一下花一下，所以到了今天都没存到钱。', '我妈：「我赚了 70 多千，因为如果不存起来，早就被你爸爸花掉了。」把会不小心花掉的钱存起来，你就赚了 100%。'],
      en: ['Don’t save what’s left after spending; spend what’s left after saving.', 'Many young people keep savings in a spending account (ATM): easy to take, easy to spend.', 'We all save, but we save a bit and spend a bit, so today there’s nothing left.', 'My mum: “I gained 70k, because if I hadn’t saved it, your dad would have spent it.” Save what you would have wasted and you gain 100%.'] },
    s2: { zh: ['两个和尚每天下山打水。三年后，和尚 A 没下山，原来他每天花五分钟挖井，三年后就有了一口井。', '当别人持续花钱时，我们默默持续存钱。时间久了大家才发现我们过得比较好，那时他们已经太迟了。', '每个月存 1000，6% 利息，30 年后就是百万富翁。关键是哪个？1000？6%？还是 30 年不间断？', '唯有 30 年不间断存钱，哪怕利息少，到最后肯定不会失望。'],
      en: ['Two monks fetch water daily. Three years later Monk A stops coming down: he dug 5 minutes a day and now has a well.', 'While others keep spending, we quietly keep saving. By the time they notice, it’s too late to catch up.', 'RM1,000 a month at 6% for 30 years makes a millionaire. What’s the key: the 1,000, the 6%, or 30 years without stopping?', 'Only 30 years without stopping, even at a low rate, won’t disappoint you.'] },
    l1: { zh: ['很多人不敢花钱，是因为想留给孩子。', '用一小部分资产，透过保险放大一笔传承给孩子。传承准备好了，现在的钱就不需要刻意留着。', '把后顾之忧拿掉，改变花钱的态度和意义：最大化钱的意义，为了自己花。', '本来有 1M，走的时候可以变 2–3M。既可以留钱给孩子，也可以自己花，两边不耽误，不需要二选一。'],
      en: ['Many people don’t dare to spend because they want to leave it to their children.', 'Insurance uses a small part of your assets to create a bigger legacy. Once that’s set, today’s money doesn’t need to be kept aside.', 'Remove the worry, and you change how and why you spend: your money can serve its real meaning, for you.', 'You had RM1m; your legacy could be RM2–3m. You can leave for your children and still spend for yourself. No need to choose.'] }
  };
  ['en', 'zh'].forEach(l => { if (root.RLG_I18N && root.RLG_I18N[l]) Object.assign(root.RLG_I18N[l], TX[l]); });

  /* ---------------- screens ---------------- */
  root.RLG_CONCEPTS = function (H) {
    const { t, esc, rm, rmShort, go, render, modal, confetti, countUp, S, F } = H;
    const sh = () => H.settings, L = () => H.lang;
    const fsrc = f => (H.lang === 'zh' && f.srcZh) || f.src;
    // the customer's numbers, kept in memory only while the app is open
    let cust = { age: 30, income: 5000, spend: 4000, savings: 20000, med: 100000, sa: 100000, cover: 0, monthly: 500, assets: 1000000 };
    let C = null, timer = null;
    const shuffle = a => a.map(x => [Math.random(), x]).sort((p, q) => p[0] - q[0]).map(p => p[1]);
    const TL = k => TX[L()][k] || TX.en[k];
    const GAMES = [['delay', ['c1']], ['med', ['m1', 'm2']], ['inc', ['i1', 'i2']], ['sav', ['s1', 's2']], ['leg', ['l1']]];
    const EMO = { c1: '🏃', m1: '🧯', m2: '🦹', i1: '🔨', i2: '🌳', s1: '🫙', s2: '⛏️', l1: '🎁' };
    const stop = () => { clearInterval(timer); clearTimeout(timer); timer = null; };
    const field = (k) => `<label class="field"><span>${t('c_' + k)}</span><input type="number" inputmode="numeric" data-c="${k}" value="${cust[k]}"/></label>`;
    const readCust = () => document.querySelectorAll('[data-c]').forEach(el => { cust[el.dataset.c] = Math.max(0, Number(el.value) || 0); });
    const head = () => `<div class="cghead"><button class="chip" data-act="concepts">← ${t('cgTitle')}</button><b>${EMO[C.g]} ${t('g_' + C.g)}</b><button class="chip mic" data-act="cgScript">🎤 ${t('script')}</button></div>`;
    const feel = (txt, sub) => `<div class="feel pop"><span>💡</span><p>${txt}</p>${sub ? `<small>${sub}</small>` : ''}</div>`;
    const nextBtn = (lbl) => `<button class="btn wide hot" data-act="cgStep">${lbl || t('cgNext')} →</button>`;
    const end = () => `<div class="cgend card"><div class="sub">🎤 ${t('cgClose')}</div><h3>${t(C.g + '_close')}</h3></div>
      <div class="row2"><button class="btn" data-act="cgGo" data-g="${C.g}">🔁 ${t('cgAgain')}</button><button class="btn" data-act="concepts">🎯 ${t('cgOther')}</button></div>
      <button class="btn wide cool" data-act="full">🧬 ${t('cgFull')}</button>`;

    const screens = {}, after = {}, actions = {};
    screens.concepts = () => { stop(); return `<h2>🎯 ${t('cgTitle')}</h2><p class="sub">${t('cgPick')}</p>` + GAMES.map(([th, gs]) =>
      `<h3 class="cgth">${t('th_' + th)}</h3><div class="cgtiles">${gs.map(g => `<button class="cgtile t-${th}" data-act="cgGo" data-g="${g}"><span>${EMO[g]}</span><b>${t('g_' + g)}</b><small>${t('gs_' + g)}</small></button>`).join('')}</div>`).join('') +
      `<p class="small">🔒 ${t('cgNote')}</p>`; };

    /* ---- per-game steps: intro → live movie (customer controls the hero) → numbers + feeling → closing question ---- */
    const G = {};
    const movie = (key) => `<div class="mvhost" id="mvhost" data-mv="${key}"></div><p class="small center">🎬 ${t('mv_hint')}</p>`;
    // M1 Insure it or not?
    const M1CARDS = [['flu', '🤧', 1, 0], ['phone', '📱', 1, 0], ['scratch', '🚗', 1, 0], ['stroke', '🧠', 0, 1], ['bypass', '🫀', 0, 1], ['cancer', '🎗️', 0, 1], ['fire', '🔥', 0, 1]];
    G.m1 = {
      init: () => ({}),
      steps: [
        () => `<p class="cgintro">${t('m1_intro')}</p>` + nextBtn('🎬 ' + t('cgStart')),
        () => movie('m1'),
        () => { const cell = (lk, big) => M1CARDS.filter(c => c[2] === lk && c[3] === big).map(c => `<span class="chipe" title="${t('m1c_' + c[0])}">${c[1]}</span>`).join('');
          return `<h3>${t('m1_board')}</h3><div class="board"><div class="ax y">${t('m1_likely')} ↑</div>
            <div class="q q1">${cell(1, 0)}<small>${t('m1_likely')} · ${t('m1_small')}</small></div><div class="q q2">${cell(1, 1)}<small>${t('m1_likely')} · ${t('m1_huge')}</small></div>
            <div class="q q3">${cell(0, 0)}<small>${t('m1_rare')} · ${t('m1_small')}</small></div><div class="q q4 hot">${cell(0, 1)}<small>${t('m1_rare')} · ${t('m1_huge')}</small></div>
            <div class="ax x">${t('m1_huge')} →</div></div><p class="small">💪 ${t('m1_pay')} → ${t('m1_likely')} · ${t('m1_small')}<br/>🧯 ${t('m1_lose')} → ${t('m1_rare')} · ${t('m1_huge')}</p>` +
            feel(t('m1_feel'), t('m1_feel2')) + `<p class="src">${t('source')}: ${esc(fsrc(F.F1))}; ${esc(fsrc(F.F7))}; ${esc(fsrc(F.F8))}; ${esc(fsrc(F.F9))}</p>` + nextBtn(); },
        end
      ]
    };

    // M2 Organ Robber
    const bills = () => [['m1c_stroke', F.F8.rm], ['m1c_bypass', F.F1.max], ['m1c_cancer', F.F7.rm]];
    G.m2 = {
      init: () => ({ bonus: null }),
      steps: [
        () => movie('m2'),
        () => `<p class="cgintro">${t('m2_real')}</p><div class="card">${field('med')}<button class="btn" data-act="cgRefresh">${t('update')}</button></div>
          <div class="card"><h3>${t('m2_bills')}</h3>${bills().map(([k, v]) => { const gap = Math.max(0, v - cust.med);
            return `<div class="ln"><span>${t(k)}<small> ${k === 'm1c_stroke' ? t('cgAvg') : t('cgUpTo')} ${rm(v)}</small></span><b class="${gap ? 'bad' : 'good'}">${gap ? t('m2_cardShort', { a: rm(gap) }) : t('m2_cardOk')}</b></div>`; }).join('')}
            <p class="src">${t('source')}: ${esc(fsrc(F.F8))}; ${esc(fsrc(F.F1))} (${t('m2_top')}); ${esc(fsrc(F.F7))}</p></div>` + feel(t('m2_feel')) + nextBtn(t('m2_bonus')),
        () => C.bonus == null ? `<h3>${t('m2_bonus')}</h3><button class="btn big redk" data-act="m2Btn" data-v="red">${t('m2_red')}</button><button class="btn big whitek" data-act="m2Btn" data-v="white">${t('m2_white')}</button>`
          : `<div class="feel pop"><span>${C.bonus === 'red' ? '🔴' : C.bonus === 'win' ? '🎉' : '😱'}</span><p>${t(C.bonus === 'red' ? 'm2_redR' : C.bonus === 'win' ? 'm2_whiteW' : 'm2_whiteL')}</p></div>` + (C.bonus !== 'red' ? `<p class="cgintro">${t('m2_redR')}</p>` : '') + nextBtn(),
        end
      ]
    };
    actions.m2Btn = b => { if (b.dataset.v === 'red') { C.bonus = 'red'; S.play('good'); } else { S.play('drum'); C.bonus = Math.random() < 0.5 ? 'win' : 'lose'; setTimeout(() => S.play(C.bonus === 'win' ? 'cheer' : 'bad'), 400); } render(); };

    // I1 Sell your earning power
    G.i1 = {
      init: () => ({ sold: null }),
      steps: [
        () => `<p class="cgintro">${t('i1_intro')}</p><div class="card">${field('age')}${field('income')}</div>` + nextBtn('🎬 ' + t('cgStart')),
        () => movie('i1'),
        () => { const A = sh().A, v = M.earningValue(cust.income, cust.age, A.retireAge), tag = M.saleTag(cust.sa, v);
          return `<div class="center"><div class="sub">${t('i1_value')}</div><div class="bigval">${rm(v)}</div><p class="calc">${t('i1_formula', { inc: rm(cust.income), yrs: Math.max(0, A.retireAge - cust.age), ret: A.retireAge })}</p></div>
            <p class="cgintro">${t('i1_sa')}</p><div class="card">${field('sa')}<button class="btn" data-act="cgRefresh">${t('update')}</button></div>
            <div class="pricetag ${tag.kind} pop"><b>${tag.kind === 'free' ? t('i1_free') : tag.kind === 'fair' ? t('i1_fair') : t('i1_sale', { off: tag.off })}</b>
            <small>${tag.kind === 'free' ? t('i1_freeT') : tag.kind === 'fair' ? t('i1_fairT') : t('i1_saleT', { v: rm(v), sa: rm(cust.sa) })}</small></div>` +
            (tag.kind !== 'fair' ? feel(t('i1_feel', { a: C.sold ? rm(C.sold) : (L() === 'zh' ? '一千万' : 'RM10 million'), b: rm(cust.sa) })) : '') + nextBtn(); },
        end
      ]
    };

    // I2 Money Tree
    G.i2 = {
      init: () => ({ w: [], cause: null }),
      steps: [
        () => { const qs = ['i2_w1', 'i2_w2', 'i2_w3'], k = C.w.length;
          return `<h3>${t('i2_warm')}</h3>` + (k < 3 ? `<h2 class="q pop">${t(qs[k])}</h2><div class="row2"><button class="btn" data-act="i2W" data-v="1">${t('i2_wYes')}</button><button class="btn" data-act="i2W" data-v="0">${t('i2_wNo')}</button></div>`
            : `${feel(t('i2_wHint'))}<div class="card">${field('income')}${field('spend')}${field('savings')}</div>` + nextBtn('🎬 ' + t('cgStart'))); },
        () => movie('i2'),
        () => { const need = sh().A.ciYears * 12, n0 = M.monthsLast(cust.savings, 0, cust.spend), n1 = M.monthsLast(cust.savings, cust.cover, cust.spend), mx = Math.max(need, n0, n1, 1);
          const gap = Math.max(0, need * cust.spend - cust.savings - cust.cover);
          return `<p class="cgintro">${t('i2_tank')}</p><div class="card">${field('cover')}<button class="btn" data-act="cgRefresh">${t('update')}</button></div>
            <div class="card"><div class="mrow"><span>💧</span><div class="bar"><i style="width:${Math.min(100, n0 / mx * 100)}%"></i></div><b>${t('i2_mo', { n: n0 })}</b></div><small>${t('i2_without')}</small>
            <div class="mrow"><span>🛢️</span><div class="bar ok"><i style="width:${Math.min(100, n1 / mx * 100)}%"></i></div><b>${t('i2_mo', { n: n1 })}</b></div><small>${t('i2_withTank')}</small>
            <p class="small">${t('i2_need', { n: need })}</p></div>
            ${n1 >= need ? `<div class="okbox">${t('i2_okTank')}</div>` : `<div class="warn">${t('i2_noTank', { n: need, a: rm(gap) })}</div>`}` + feel(t('i2_feel')) + nextBtn(); },
        end
      ]
    };
    actions.i2W = b => { C.w.push(b.dataset.v); S.play('tap'); render(); };

    // S1 Temptation Jar
    G.s1 = {
      init: () => ({ spent: 0, list: shuffle(TL('s1_t')) }),
      steps: [
        () => `<p class="cgintro">${t('s1_intro')}</p><div class="card">${field('monthly')}</div>` + nextBtn('🎬 ' + t('cgStart')),
        () => movie('s1'),
        () => { const j = M.jar(cust.monthly, 10, C.spent);
          return `<div class="jars"><div class="jar open"><span>🫙</span><b>${rm(j.open)}</b><small>${t('s1_jarA')}</small></div><div class="jar locked pop"><span>🔒🫙</span><b id="s1lock">${rm(0)}</b><small>${t('s1_jarB')}</small></div></div>
            <p class="small center">${t('mv5_spent', { n: C.spent })}</p><p class="cgintro">${t('s1_mum')}</p>` + feel(t('s1_feel')) + nextBtn(); },
        end
      ]
    };
    after.s1lock = () => { const el = document.getElementById('s1lock'); if (el) { countUp(el, M.jar(cust.monthly, 10, C.spent).locked, 1300); S.play('cheer'); } };

    // S2 Monk's Well
    G.s2 = {
      init: () => ({ ans: null }),
      steps: [
        () => movie('s2'),
        () => { const full = M.fv(1000, 6, 30);
          if (C.ans == null) return `<h3 class="q">${t('s2_quiz', { a: rm(full) })}</h3><div class="opts">${['s2_o1', 's2_o2', 's2_o3'].map((o, i) => `<button class="btn opt" data-act="s2Ans" data-v="${i}">${t(o)}</button>`).join('')}</div><p class="small">${t('s2_illus')}</p>`;
          const half = M.grow(M.fv(1000, 6, 15), 6, 15), late = M.fv(1000, 6, 15), mx = full;
          return `<div class="feel pop"><span>${C.ans === 2 ? '🎯' : '💡'}</span><p>${t(C.ans === 2 ? 's2_right' : 's2_wrong')}</p></div>
            <div class="card">${[['s2_c1', full], ['s2_c2', half], ['s2_c3', late]].map(([k, v]) => `<div class="mrow"><span>${k === 's2_c1' ? '🏆' : k === 's2_c2' ? '⏸️' : '⏰'}</span><div class="bar"><i style="width:${v / mx * 100}%"></i></div><b>${rmShort(v)}</b></div><small>${t(k)}</small>`).join('')}
            <p class="small">${t('s2_illus')}</p></div>` + feel(t('s2_feel')) + nextBtn(); },
        end
      ]
    };
    actions.s2Ans = b => { C.ans = +b.dataset.v; S.play(C.ans === 2 ? 'good' : 'bad'); render(); };

    // L1 Spend it or leave it?
    const LD = ['trip', 'parents', 'car', 'retire', 'hobby', 'give'], LCH = [20000, 50000, 100000, 200000, 300000];
    G.l1 = {
      init: () => ({ dreams: [], chosen: [], planCost: '', planLeg: '' }),
      steps: [
        () => `<p class="cgintro">${t('l1_intro')}</p><div class="card">${field('assets')}</div><h3>${t('l1_dreams')}</h3>` +
          LD.map(id => { const d = C.dreams.find(x => x.id === id); return `<div class="card ldream ${d ? 'on' : ''}"><button class="ldtog" data-act="l1Dream" data-id="${id}">${d ? '✅' : '⬜'} ${t('ld_' + id)}</button>
            ${d ? `<div class="chips">${LCH.map(v => `<button class="chip ${d.cost === v ? 'on' : ''}" data-act="l1Cost" data-id="${id}" data-v="${v}">${rmShort(v)}</button>`).join('')}</div>` : ''}</div>`; }).join('') +
          (C.dreams.length ? nextBtn('🎬 ' + t('cgStart')) : ''),
        () => movie('l1a'),
        () => { const r = M.legacy(cust.assets, C.dreams, C.chosen, 0, 0).noPlan, ready = Number(C.planCost) > 0 && Number(C.planLeg) > 0;
          return `<div class="center"><div class="sub">${t('l1_before')}</div></div>${scale(r.me, r.kids, Math.max(1, cust.assets))}<div class="note">${t('l1_guilt')}</div>
            <p class="cgintro">${t('l1_plan')}</p><div class="card agentbox"><label class="field"><span>🧑‍💼 ${t('l1_cost')}</span><input type="number" inputmode="numeric" id="l1c" value="${esc(C.planCost)}"/></label>
            <label class="field"><span>🧑‍💼 ${t('l1_leg')}</span><input type="number" inputmode="numeric" id="l1l" value="${esc(C.planLeg)}"/></label><p class="small">${t('l1_agent')}</p><button class="btn" data-act="l1Plan">${t('update')}</button></div>` +
            (ready ? nextBtn('🎬 ' + t('mv7_ready')) : `<div class="warn">${t('l1_need')}</div>`); },
        () => movie('l1b'),
        () => { const cost = Number(C.planCost) || 0, leg = Number(C.planLeg) || 0, r = M.legacy(cust.assets, C.dreams, C.chosen, cost, leg);
          const done0 = C.chosen.filter(Boolean).length, both = r.plan.kids >= r.noPlan.kids;
          return `${scale(r.plan.me, r.plan.kids, Math.max(cust.assets, r.plan.kids + r.plan.me))}
              <table class="rt"><tr><th></th><th>${t('l1_before')}</th><th>${t('l1_after')}</th></tr><tr><td>${t('l1_dreamsDone')}</td><td>${done0}/${C.dreams.length}</td><td>${C.dreams.length}/${C.dreams.length}</td></tr>
              <tr><td>${t('l1_kidsGet')}</td><td>${rm(r.noPlan.kids)}</td><td>${rm(r.plan.kids)}</td></tr></table>
              ${both ? `<div class="okbox">${t('l1_both')}</div>` + feel(t('l1_feel'), t('l1_feel2')) : `<div class="warn">${t('l1_less')}</div>`}` + nextBtn(); },
        end
      ]
    };
    function scale(me, kids, tot) {
      const tilt = Math.max(-6, Math.min(6, (me - kids) / Math.max(1, tot) * 12));
      return `<div class="scale"><div class="beam" style="transform:rotate(${-tilt}deg)"><div class="pan"><span>🧑</span><b>${rmShort(me)}</b><small>${t('l1_me')}</small></div><div class="pan"><span>👧👦</span><b>${rmShort(kids)}</b><small>${t('l1_kids')}</small></div></div><div class="post">▲</div></div>`;
    }
    actions.l1Dream = b => { readCust(); const id = b.dataset.id, k = C.dreams.findIndex(x => x.id === id);
      if (k >= 0) { C.dreams.splice(k, 1); C.chosen.splice(k, 1); } else if (C.dreams.length < 4) { C.dreams.push({ id, cost: 100000 }); C.chosen.push(false); } else S.play('bad'); render(); };
    actions.l1Cost = b => { readCust(); C.dreams.find(x => x.id === b.dataset.id).cost = +b.dataset.v; render(); };
    actions.l1Plan = () => { C.planCost = Math.max(0, Number(document.getElementById('l1c').value) || 0) || ''; C.planLeg = Math.max(0, Number(document.getElementById('l1l').value) || 0) || ''; render(); };

    // C1 Don't Wait: maze chase (illness, accident and disability chase you; the agent follows you)
    G.c1 = {
      init: () => ({ res: null }),
      steps: [
        () => `<p class="cgintro">${t('c1_intro')}</p><div class="card c1rules">${['c1_r1', 'c1_r2', 'c1_r3', 'c1_r4', 'c1_r5'].map(k => `<p>${t(k)}</p>`).join('')}</div>` + nextBtn('🎮 ' + t('cgStart')),
        () => `<div class="chhost" id="chhost"></div><button class="chip chskip" data-act="c1End">⏭ ${t('c1_endNow')}</button>`,
        () => { const r = C.res || {};
          const lesson = r.insured && r.claims ? 'c1_lGood' : r.insured ? 'c1_lSafe' : (r.declined || (r.flags || []).length) && r.rejects ? 'c1_lLate' : r.hitsNoCover ? 'c1_lHit' : 'c1_lNone';
          const row = (k, v, cls = '') => `<div class="ln"><span>${t(k)}</span><b class="${cls}">${v}</b></div>`;
          const fl = r.flags || [];
          return `<div class="center"><div class="bige">${r.win ? '🏆' : r.out ? '💔' : '⏳'}</div><h2>${t(r.win ? 'c1_win' : r.out ? 'c1_out' : 'c1_lose', { a: r.age })}</h2></div>
            <div class="card">${row('c1_rP', '⭐ ' + (r.purpose || 0) + ' / 100', r.win ? 'good' : '')}${row('c1_rM', '💰 ' + (r.money || 0))}
            ${row('c1_rIns', r.insured ? t('c1_atAge', { a: r.insuredAge }) : t('c1_never'), r.insured ? 'good' : 'bad')}
            ${row('c1_rRej', (r.rejects || 0) + ' / ' + (r.offers || 0))}
            ${row('c1_rFlags', fl.length ? fl.map(f => t('hh_' + f)).join(', ') : t('c1_none'), fl.length ? 'bad' : 'good')}
            ${r.declined ? row('c1_rDec', '🚫', 'bad') : ''}${row('c1_rClaims', r.claims || 0, r.claims ? 'good' : '')}${row('c1_rHits', r.hitsNoCover || 0, r.hitsNoCover ? 'bad' : '')}</div>
            <div class="note pop">${t(lesson, { n: r.rejects || 0 })}</div>` + feel(t('c1_feel'), t('c1_feel2')) + `<p class="small">${t('c1_note')}</p>` + nextBtn(); },
        end
      ]
    };
    let chase = null;
    actions.c1End = () => { if (chase) chase.skip(); };

    /* ---- game screen + shared actions ---- */
    const SC = window.RLG_SCENES ? window.RLG_SCENES({ t, rm, rmShort, F, M, get cust() { return cust; }, A: () => sh().A, C: () => C }) : null;
    screens.cg = () => { stop(); return head() + `<div class="cgdots">${G[C.g].steps.map((_, i) => `<i class="${i <= C.step ? 'on' : ''}"></i>`).join('')}</div>` + G[C.g].steps[C.step](); };
    after.cg = () => {
      if (C.g === 's1' && C.step === 2) after.s1lock();
      if (C.step === G[C.g].steps.length - 1) S.play('cheer');
      const ch = document.getElementById('chhost');
      if (ch && window.RLG_CHASE) { const mine = C; chase = window.RLG_CHASE(ch, { t, sfx: n => S.play(n), music: (tr, sp) => { if (S.setTrack) { S.setTrack(tr); S.setSpeed(sp); } },
        onEnd: res => { if (C !== mine) return; C.res = res; C.step = 2; chase = null; render(); window.scrollTo(0, 0); } }); }
      const host = document.getElementById('mvhost');
      if (host && SC && window.RLG_MOVIE) {
        const key = host.dataset.mv, mine = C;
        window.RLG_MOVIE(host, SC[key](), { t, sfx: n => S.play(n),
          onEnd: res => { if (C !== mine) return; Object.assign(C, res); C.step = Math.min(C.step + 1, G[C.g].steps.length - 1); render(); window.scrollTo(0, 0); } });
      }
    };
    actions.concepts = () => { stop(); go('concepts'); };
    actions.cgGo = b => { stop(); C = { g: b.dataset.g, step: 0, ...G[b.dataset.g].init() }; S.play('drum'); go('cg'); };
    actions.cgStep = () => { readCust(); stop(); C.step = Math.min(C.step + 1, G[C.g].steps.length - 1); S.play('tap'); render(); window.scrollTo(0, 0); };
    actions.cgRefresh = () => { readCust(); render(); };
    actions.cgScript = () => { const s = SCRIPT[C.g]; modal(`<h3>🎤 ${t('script')} · ${t('g_' + C.g)}</h3>` + (L() === 'zh' ? s.zh : s.en).map(x => `<p class="scriptline">${esc(x)}</p>`).join('') +
      (L() === 'zh' ? '' : `<details><summary>中文原句</summary>${s.zh.map(x => `<p class="scriptline zh">${esc(x)}</p>`).join('')}</details>`)); };
    return { screens, after, actions, isPlaying: () => !!C };
  };
})(this);
