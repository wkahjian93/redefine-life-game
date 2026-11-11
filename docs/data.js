// Every real-world figure the game uses. Approved by the user on 2026-11-11 (F1–F13).
// Change a figure here only after checking the source again; the Sources screen reads this list.
(function (root) {
  const FIG = {
    F1: { min: 70000, max: 120000, mid: 95000, en: 'Heart bypass (CABG), private hospital: RM70k–RM120k', zh: '私立医院心脏搭桥手术：RM70k–RM120k',
      src: 'IJN CEO (2024): RM100k–120k; private-sector doctor cited by CodeBlue (Jan 2026): RM70k–80k without complications', date: '2024–2026',
      url: 'https://codeblue.galencentre.org/2026/01/base-mhits-rm100k-cover-likely-insufficient-for-major-heart-surgery-aphm/' },
    F2: { le3m: 57, lt1m: 22, en: '57% of Malaysians: savings last 3 months or less without income (22%: under 1 month)', zh: '57% 马来西亚人没收入后储蓄撑不过 3 个月（22% 撑不过 1 个月）',
      src: 'RinggitPlus Malaysian Financial Literacy Survey 2026 (n=3,005)', date: '2026',
      url: 'https://ringgitplus.com/en/blog/ringgitplus/rmfls-2026-how-long-your-savings-would-last-in-a-survival-game.html' },
    F3: { rm: 7440, en: 'Couple with 2 children, Klang Valley: RM7,440 a month', zh: '巴生谷夫妇 + 2 个孩子：每月 RM7,440',
      src: 'EPF Belanjawanku 2024/2025 expenditure guide', date: 'Dec 2024',
      url: 'https://www.malaymail.com/news/malaysia/2024/12/17/belanjawanku-guide-from-alor-setar-to-klang-valley-how-much-do-malaysians-need-monthly-to-manage-expenses/159799' },
    F4: { penang: 5850, malaysia: 5566, en: 'Average household spending: Penang RM5,850 / Malaysia RM5,566 a month', zh: '家庭平均开销：槟城每月 RM5,850 / 全国 RM5,566',
      src: 'DOSM Household Expenditure Survey 2024', date: 'Oct 2025', url: 'https://storage.dosm.gov.my/hies/household_expenditure_2024.pdf' },
    F5: { rm: 10700, en: 'Average cost per private hospital visit: about RM10,700 (2023)', zh: '私立医院每次住院平均约 RM10,700（2023）',
      src: 'Bank Negara Malaysia / Ministry of Finance figure, cited with the LIAM/MTA/PIAM price guide', date: '2023 data',
      url: 'https://www.thestar.com.my/news/nation/2026/02/10/medical-price-guide-launched' },
    F6: { rm: 11700, en: 'Angiogram, private hospital: typical (median) bill RM11,700', zh: '私立医院血管造影：典型（中位数）账单 RM11,700',
      src: 'LIAM / MTA / PIAM medical price guide (2024 claims data)', date: 'Feb 2026',
      url: 'https://www.thestar.com.my/news/nation/2026/02/10/medical-price-guide-launched' },
    F7: { rm: 395000, en: 'Cancer treatment can cost up to RM395,000', zh: '癌症治疗费用可高达 RM395,000',
      src: 'CodeBlue (Galen Centre), "The Real Cost of Cancer in Malaysia"', date: 'Jun 2022',
      url: 'https://codeblue.galencentre.org/2022/06/the-real-cost-of-cancer-in-malaysia/' },
    F8: { rm: 15671, en: 'Acute stroke stay, private hospital: average RM15,671', zh: '私立医院急性中风住院：平均 RM15,671',
      src: 'ISPOR 2024 study, 180 admissions (2022)', date: '2024',
      url: 'https://www.ispor.org/heor-resources/presentations-database/presentation/intl2024-3900/136290' },
    F9: { oneIn: 8, byAge: 75, en: '1 in 8 Malaysians get cancer by age 75', zh: '每 8 个马来西亚人就有 1 人在 75 岁前患癌',
      src: 'Malaysia National Cancer Registry Report 2017–2021', date: '2024',
      url: 'https://nci.moh.gov.my/images/pdf/SUMMARY-OF-MALAYSIA-NATIONAL-CANCER-REGISTRY-REPORT-2017-2021.pdf' },
    F10: { pct: 13.0, en: 'Ischaemic heart disease: No. 1 cause of death, 13.0% of medically certified deaths', zh: '缺血性心脏病：头号死因，占医学认证死亡的 13.0%',
      src: 'DOSM Statistics on Causes of Death, Malaysia 2025 (2024 data)', date: 'Dec 2025',
      url: 'https://dosm.gov.my/portal-main/release-content/statistics-on-causes-of-death-malaysia-2025' },
    F11: { claims: 12.28, cpi: 3.0, en: 'Medical claims inflation 12.28% (2025); official health price inflation 3.0% (2025)', zh: '医疗索赔通胀 12.28%（2025）；官方医疗价格通胀 3.0%（2025）',
      src: 'NST (Aug 2026) on insurer claims; DOSM via The Star (Jul 2026)', date: '2026',
      url: 'https://www.nst.com.my/amp/business/corporate/2026/08/1519860/medical-claims-growth-set-stay-double-digits-insurers-pay' },
    F12: { basic: 390000, monthly: 2690, en: 'Retirement: RM390,000 basic savings at 60; RM2,690 a month for a reasonable retiree budget', zh: '退休：60 岁基本储蓄 RM390,000；合理退休生活每月 RM2,690',
      src: 'EPF retirement income framework / Belanjawanku 2024/25', date: 'Dec 2024',
      url: 'https://www.nst.com.my/amp/business/corporate/2024/12/1147195/epf-raises-basic-retirement-income-benchmark-62pct-rm390k-bttv' },
    F13: { firstYear: 42715, childcare: 670, en: 'New baby: about RM42,715 from pregnancy to first birthday; childcare RM670 a month', zh: '新生儿：怀孕到一岁约 RM42,715；托儿每月 RM670',
      src: 'iMoney estimate (both parents working); EPF Belanjawanku 2024/25 childcare', date: '2024–2025',
      url: 'https://www.imoney.my/articles/malaysia-declining-birth-rate-2025-causes-costs-economic-impact' },
    // Everyday comparison items for the Quick game (approved by the user on 2026-11-11)
    C1: { min: 46500, max: 59900, en: 'New Perodua Myvi: RM46,500–RM59,900 on the road', zh: '全新 Perodua Myvi：上路价 RM46,500–RM59,900',
      src: 'CarBase.my and paultan.org price listings (no official Perodua price list found)', date: 'mid-2026',
      url: 'https://paultan.org/2026/06/22/perodua-myvi-price-specs-variants-and-the-next-gen/' },
    C2: { rm: 5999, en: 'iPhone 17 Pro Max (256GB): RM5,999 at launch', zh: 'iPhone 17 Pro Max（256GB）：发售价 RM5,999',
      src: 'Apple Malaysia launch pricing, reported by Malay Mail and SoyaCincau', date: 'Sep 2025',
      url: 'https://www.malaymail.com/news/tech-gadgets/2025/09/10/iphone-17-and-iphone-17-pro-malaysia-heres-the-official-pricing-pre-order-opens-september-12/190591' },
    C3: { malaysia: 7017, penang: 7386, en: 'Median monthly household income: Malaysia RM7,017 / Penang RM7,386', zh: '家庭月收入中位数：全国 RM7,017 / 槟城 RM7,386',
      src: 'DOSM Household Income Survey 2024', date: 'Oct 2025',
      url: 'https://www.dosm.gov.my/portal-main/release-content/household-income-survey-report--malaysia--states-2024' }
  };

  // Illustrative assumptions the agent can edit in Settings (not real-world facts).
  const DEFAULT_ASSUMPTIONS = {
    promo: 10,        // % pay rise on a Promotion card
    saveRate: 2.5,    // % a year on savings
    investRate: 5,    // % a year on investments
    epfRate: 5,       // % a year on EPF balance (illustrative, not a declared dividend)
    indepAge: 23,     // age a child stops depending on the parents
    ciYears: 3,       // years of income needed to recover from a critical illness
    parentYears: 10,  // years the player keeps supporting parents
    retireAge: 60
  };

  const api = { FIG, DEFAULT_ASSUMPTIONS };
  if (typeof module !== 'undefined') module.exports = api; else root.RLG_DATA = api;
})(this);
