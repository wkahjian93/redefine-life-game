# Test runs — 11 Nov 2026

Played in the in-app browser at phone size (375 px wide), on the local preview (`node tools/serve.js`, port 5199). Rule checks: `node test.js`, which gave **29 passed, 0 failed**.

## Quick Mode: a stranger at a booth

| Step | What the player saw / did |
|---|---|
| Q1 | "A heart bypass at a Malaysian private hospital costs about…?" Guessed **RM25,000** → 😱 "Whoa, much more than that!" Real figure **RM70k–120k**, with sources (IJN/CodeBlue; DOSM causes of death) |
| Follow-up | "If this bill landed on you tomorrow…" → *Pay from my savings* |
| Q2 | "Out of 10 Malaysians, how many… savings last 3 months or less?" Guessed **4** → real **6** (57%, RinggitPlus RMFLS 2026) → *1–3 months* |
| Q3 | "How much does EPF say you need at 60…?" Guessed **RM390,000** ✅ → *EPF will handle it* |
| Result | **The Optimist 🌞**, 1/3 right. Card saved (samples/quick-card-EN-optimist.png) |
| WhatsApp | Opens `wa.me/60194783328` with: "Hi Wong Kah Jian, I just played REDEFINE Life Game and I'm The Optimist 🌞. Can I get my full result and the free 5-minute check?" The player sends it themselves |
| Chinese run | Same flow in 中文 → **守护者 🛡️** (samples/quick-card-ZH-guardian.png) |

**Pain point check:** a stranger had a fun reason to stop (a guessing game, not a pitch). They learned real costs for themselves, left with a shareable card carrying the agent's name, and started the WhatsApp conversation themselves. Nothing was stored.

## Full Mode: "Daniel", an existing client (sample)

Inputs: age 32, take-home RM6,000, commitments RM2,000 + other spending RM2,500, savings RM15k, investments RM5k, EPF RM70k (+RM1,300/mo), loans RM350k, 1 child aged 2, RM300/mo to parents. Existing cover: life RM100k, CI 0, medical card RM100k/yr, premiums RM250/mo.
Dreams: 🎓 Kids' education RM100k · 🌴 Retire comfortably RM390k · ✈️ Travel RM50k. Mode: **What if**.

| Stage | Allocation | Card | What happened |
|---|---|---|---|
| 1 (32–41) | Lifestyle 75 / Savings 15 / Invest 5 / Protect 5 | 📈 Promotion | Income +10% (illustrative assumption) |
| 2 (41–50) | same | 💔 Critical illness | RM95k bypass **fully paid by his medical card ✅ "Your cover handled this bill."** Then 3 years with no income: **RM237,600 lost** |
| 3 (50–60) | same | ☀️ Smooth years | — |

**Scorecard:** 3/3 dreams survived. Money lost RM237,600, insurance paid RM95,000, family left with ~RM1.6m at 60 (mostly EPF growth, before inflation).
**Before vs after** (premium not entered, so the app shows its warning): money out of pocket RM238k → RM42k; family at 60 RM1.58m → RM1.87m.
**Needs summary:** income protection gap **RM1,330,000** · critical illness gap **RM196,000** · medical gap **RM20,000** · retirement **✅ covered**. Tapping ƒx on the income gap shows: RM4,500 × 12 × 21 yrs + RM300 × 12 × 10 yrs + RM350,000 loans = RM1,520,000 need − RM100,000 life − RM20,000 savings − RM70,000 EPF = RM1,330,000.

**Pain point check:** no slides. Daniel chose his own dreams and money splits, saw his own medical card work (an honest ✅), and then saw what 3 years without income does. He discovered the CI and income-protection gaps himself, with formulas he can check. The one-page summary gives him and the agent a reason to meet again.

Also checked: **Real odds** mode (3 stages, all calm; chance shown 1.5–1.7% per stage), the Chinese screens, the summary as an image (EN + ZH) and as a PDF, and **offline**: the app reopened with the server switched off.

## Quick Mode v2: Higher or Lower (11 Nov 2026, later the same day)

The Quick game was rebuilt as a swipe game with a score. Rule checks: `node test.js` gave **49 passed, 0 failed** (including: every round's answer matches its sourced figures, and every game has 3 topics and at least one "Lower").

| Step | What the player saw / did |
|---|---|
| Card 1 | 👶 "A baby's first year" vs 🚗 "The cheapest new Perodua Myvi (RM46,500)". Tapped **Lower** ✅ → "It's LOWER", about RM42,715, **+150 points** |
| Follow-up | "Who counts on your income?" → *Me and my partner* |
| Card 2 | 🐷 "Malaysians whose savings would last 3 months or less" vs "Half of us (50%)". **Swiped up** ✅ → 57%, **+175 points**, 🔥×2 streak |
| Card 3 | 🏥 "One private hospital visit" vs "A typical household's monthly income (RM7,017)". Let the **timer run out** → ⏰ "Time's up!", real figure RM10,700 shown, no points, streak reset |
| Result | **The Planner 🧭**, score **325**, 2/3 right (samples/quick-card-EN-v2.png) |

**Pain point check:** the stranger is now playing (swiping, racing a timer, building a streak) rather than answering a quiz, and the score gives them a reason to challenge a friend.
