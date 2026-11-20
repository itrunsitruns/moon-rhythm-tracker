import { createContext, useContext, useState, useCallback } from "react";

const translations = {
  // ── App chrome ──
  appTitle: { zh: "Moonyou", en: "Moonyou" },
  dashboard: { zh: "儀表板", en: "Dashboard" },
  calendar: { zh: "日曆", en: "Calendar" },
  settings: { zh: "設定", en: "Settings" },
  guide: { zh: "指南", en: "Guide" },

  // ── Header ──
  cycleDay: { zh: "週期第 {n} 天", en: "Cycle day {n}" },

  // ── Phase labels ──
  "phase.menstrual": { zh: "月經期", en: "Menstrual" },
  "phase.follicular_gold": { zh: "濾泡期 🔥", en: "Follicular 🔥" },
  "phase.follicular_late": { zh: "濾泡期", en: "Follicular" },
  "phase.ovulation": { zh: "排卵期", en: "Ovulation" },
  "phase.luteal": { zh: "黃體期", en: "Luteal" },
  "phase.safe": { zh: "安全期", en: "Safe period" },

  // ── Phase descriptions ──
  "desc.menstrual": { zh: "輕斷食，補鐵補血", en: "Light fasting, replenish iron" },
  "desc.follicular_gold": { zh: "黃金斷食窗口", en: "Prime fasting window" },
  "desc.follicular_late": { zh: "適合中長斷食", en: "Good for medium-long fasts" },
  "desc.ovulation": { zh: "⚠️ 危險期", en: "⚠️ Fertile window" },
  "desc.luteal": { zh: "補碳水，穩情緒", en: "Add carbs, stabilize mood" },
  "desc.safe": { zh: "低懷孕風險", en: "Low pregnancy risk" },

  // ── Moon phase names ──
  "moon.0": { zh: "新月", en: "New Moon" },
  "moon.1": { zh: "眉月", en: "Waxing Crescent" },
  "moon.2": { zh: "上弦月", en: "First Quarter" },
  "moon.3": { zh: "盈凸月", en: "Waxing Gibbous" },
  "moon.4": { zh: "滿月", en: "Full Moon" },
  "moon.5": { zh: "虧凸月", en: "Waning Gibbous" },
  "moon.6": { zh: "下弦月", en: "Last Quarter" },
  "moon.7": { zh: "殘月", en: "Waning Crescent" },

  // ── Fasting advice ──
  "fast.menstrual": { zh: "12–14h", en: "12–14h" },
  "fast.follicular_gold": { zh: "可嘗試 72h", en: "Try 72h" },
  "fast.follicular_late": { zh: "適合 36h", en: "Good for 36h" },
  "fast.ovulation": { zh: "最多 12–14h", en: "Max 12–14h" },
  "fast.luteal": { zh: "12–14h", en: "12–14h" },

  "tip.menstrual": { zh: "經期輕斷食，注意補鐵補血", en: "Light fasting during period — focus on iron intake" },
  "tip.follicular_gold": { zh: "🔥 濾泡期黃金窗口，代謝最旺", en: "🔥 Prime follicular window — metabolism peaks" },
  "tip.follicular_late": { zh: "濾泡期後段，仍適合中長斷食", en: "Late follicular — still good for medium-long fasts" },
  "tip.ovulation": { zh: "排卵期停長斷食，身體需要能量", en: "Stop extended fasts — body needs energy for ovulation" },
  "tip.luteal": { zh: "黃體期穩定斷食，補碳水穩情緒", en: "Steady fasting, add carbs to stabilize mood" },

  // ── Dashboard ──
  today: { zh: "今日", en: "Today" },
  yesterday: { zh: "昨天", en: "Yesterday" },
  close: { zh: "關閉", en: "Close" },
  tapToChange: { zh: "點選修改", en: "Tap to change" },
  moonPhase: { zh: "月相", en: "Moon phase" },
  fastingAdvice: { zh: "斷食建議", en: "Fasting advice" },
  pregnancyRisk: { zh: "懷孕風險", en: "Pregnancy risk" },
  riskNote: { zh: "（僅供參考，以個人狀況為主）", en: "(for reference only; your own body comes first)" },
  ovulationEstimate: { zh: "排卵日預估", en: "Est. ovulation" },
  dangerPeriod: { zh: "危險期", en: "Fertile window" },
  logFastingDone: { zh: "✓ 今日斷食已記錄", en: "✓ Today's fast logged" },
  logFasting: { zh: "記錄今日斷食 ✏️", en: "Log today's fast ✏️" },
  logged: { zh: "✓ 已記錄斷食", en: "✓ Fast logged" },
  logBtn: { zh: "記錄斷食 ✏️", en: "Log fast ✏️" },

  // ── Goal: avoid (contraception) ──
  avoidDangerWarn: { zh: "⚠️ 目前處於危險期，請做好避孕措施！", en: "⚠️ You are in the fertile window — use protection!" },

  // ── Goal: conceive ──
  "phase.ovulation.conceive": { zh: "黃金受孕窗口 🪺", en: "Prime conception window 🪺" },
  "desc.ovulation.conceive": { zh: "排卵期是最佳受孕時機，把握這幾天", en: "Ovulation is the best time to conceive — seize these days" },
  conceiveTip: { zh: "🪺 現在是最佳受孕時機！排卵前1–2天同房受孕率最高", en: "🪺 Best time to conceive! Intercourse 1–2 days before ovulation has the highest success rate" },
  conceiveNonOvTip: { zh: "目前非排卵期，受孕機率較低", en: "Not in ovulation window — lower conception probability" },

  // ── Goal combo: fasting + conceive during ovulation ──
  "phase.ovulation.fastConceive": { zh: "停斷食 + 黃金受孕窗口 🪺", en: "Stop fasting + Prime conception window 🪺" },
  "desc.ovulation.fastConceive": { zh: "排卵期暫停長斷食，同時把握最佳受孕時機", en: "Pause extended fasts during ovulation — also the best time to conceive" },
  goalExclusive: { zh: "避孕與備孕不能同時選", en: "Avoid & Conceive are mutually exclusive" },

  // ── Calendar ──
  clickToView: { zh: "點擊日期查看詳情", en: "Tap a date for details" },
  day: { zh: "第 {n} 天", en: "Day {n}" },
  inDays: { zh: "{n} 天後", en: "in {n} days" },
  daysAgo: { zh: "{n} 天前", en: "{n} days ago" },
  tapDiscHint: { zh: "點圓盤上的任何一格，看那天是什麼階段", en: "Tap any wedge on the disc to inspect that day" },
  ovulationDay: { zh: "排卵日", en: "Ovulation" },
  fertileWindow: { zh: "危險期", en: "Fertile window" },
  nextPeriod: { zh: "下次月經", en: "Next period" },
  backToToday: { zh: "回到今天", en: "Back to today" },
  autoReturnHint: { zh: "放著不動 20 秒會自己回到今天", en: "Returns to today after 20s idle" },
  learnTitle: { zh: "這個階段在發生什麼", en: "What is happening in this phase" },
  diffTitle: { zh: "跟前一階段（{prev}）的差別", en: "How it differs from the previous phase ({prev})" },

  // ── Phase explainers (shown on the dashboard when a disc day is tapped) ──
  "learn.menstrual": {
    zh: "子宮內膜剝落排出，雌激素和黃體素都在整個週期的最低點。身體在重置：能量偏低、體溫回到低溫期、會流失鐵質。",
    en: "The uterine lining sheds. Estrogen and progesterone are both at their lowest point of the cycle. The body is resetting: energy is low, temperature drops back to the low phase, and iron is lost with the bleeding.",
  },
  "diff.menstrual": {
    zh: "黃體期末尾黃體素驟降，才觸發出血。所以跟前面比，水腫、胸脹、情緒起伏通常在開始出血後一兩天內緩解，基礎體溫也從高溫掉回低溫。",
    en: "Bleeding starts because progesterone crashes at the end of the luteal phase. Compared with the days before, bloating, breast tenderness and mood swings usually ease within a day or two of bleeding, and basal temperature falls from the high plateau back to the low one.",
  },
  "learn.follicular_gold": {
    zh: "卵巢裡幾顆濾泡開始競爭長大，雌激素從谷底慢慢爬升。這幾天胰島素敏感度是整個週期最好的，身體對斷食的耐受度最高，所以叫黃金窗口。",
    en: "Several follicles in the ovary start competing to grow, and estrogen climbs from its low. Insulin sensitivity is the best of the whole cycle in these days, so the body tolerates fasting better than at any other time. That is why it is called the golden window.",
  },
  "diff.follicular_gold": {
    zh: "跟月經期比，出血停了、鐵質不再流失，雌激素回升帶回體力和專注力。月經期只建議輕斷食，這裡可以放心拉長。",
    en: "Compared with menstruation, bleeding has stopped, iron is no longer being lost, and rising estrogen brings back energy and focus. Menstruation only suits light fasting; here you can comfortably extend it.",
  },
  "learn.follicular_late": {
    zh: "一顆主導濾泡勝出，其他的退場。雌激素持續上升接近高峰，子宮內膜重新增厚，身體在為排卵做準備。",
    en: "One dominant follicle wins and the others fade. Estrogen keeps rising toward its peak, the uterine lining thickens again, and the body prepares for ovulation.",
  },
  "diff.follicular_late": {
    zh: "跟黃金窗口比，雌激素更高、距離排卵更近。仍然適合中長斷食，但越靠近排卵，身體越需要能量，所以建議從 72h 降到 36h 左右。",
    en: "Compared with the golden window, estrogen is higher and ovulation is closer. Medium-long fasts still work, but the nearer ovulation gets, the more energy the body wants, so the suggestion drops from 72h to about 36h.",
  },
  "learn.ovulation": {
    zh: "雌激素衝到頂點，觸發 LH（黃體生成素）高峰，大約 24–36 小時後卵子釋出。卵子只活 12–24 小時，但精子在體內最多可活 5 天，所以危險期要從排卵前 5 天算起、算到排卵後 1 天。",
    en: "Estrogen peaks and triggers the LH surge; the egg is released about 24–36 hours later. The egg lives only 12–24 hours, but sperm can survive up to 5 days inside the body, so the fertile window runs from 5 days before ovulation to 1 day after.",
  },
  "diff.ovulation": {
    zh: "跟濾泡期比，身體從「累積」切換到「釋放」：分泌物變成透明蛋清狀，排卵後基礎體溫會升高約 0.3–0.5°C。這幾天長斷食會給身體壓力訊號，可能干擾排卵，所以建議停掉，只做 12–14h。",
    en: "Compared with the follicular phase, the body switches from building up to releasing: cervical mucus turns clear and egg-white-like, and basal temperature rises about 0.3–0.5°C after ovulation. Long fasts in these days send a stress signal that can interfere with ovulation, so stick to 12–14h.",
  },
  "learn.luteal": {
    zh: "排出卵子後的濾泡變成黃體，開始分泌黃體素，體溫維持在高溫期，子宮內膜變厚準備著床。沒有受孕的話，黃體在大約 14 天後萎縮，週期重來。",
    en: "After releasing the egg, the follicle becomes the corpus luteum and secretes progesterone. Temperature stays on the high plateau and the lining thickens for implantation. If there is no pregnancy, the corpus luteum fades after about 14 days and the cycle restarts.",
  },
  "diff.luteal": {
    zh: "跟排卵期比，主角從雌激素換成黃體素：食慾上升、體溫偏高、容易水腫或情緒波動，後半段可能出現經前症狀。黃體期長度幾乎固定 14 天，所以週期長短的差異主要來自前面的濾泡期。",
    en: "Compared with ovulation, progesterone takes over from estrogen: appetite rises, temperature stays higher, and bloating or mood swings are more likely, with PMS possible in the second half. The luteal phase is almost always about 14 days, so differences in cycle length come mostly from the follicular phase before it.",
  },
  "learn.safe": {
    zh: "這一天在妳登記的月經第一天之前，app 還沒有這個週期的資料，所以只能用預設的低風險顯示。",
    en: "This day is before the period start you entered, so the app has no cycle data for it and shows the default low-risk state.",
  },
  "diff.safe": {
    zh: "更新「月經第一天」之後，這裡就會換成真正的階段。",
    en: "Once you update the period start date, this will show the real phase.",
  },

  // ── Month names ──
  "month.0": { zh: "一月", en: "January" },
  "month.1": { zh: "二月", en: "February" },
  "month.2": { zh: "三月", en: "March" },
  "month.3": { zh: "四月", en: "April" },
  "month.4": { zh: "五月", en: "May" },
  "month.5": { zh: "六月", en: "June" },
  "month.6": { zh: "七月", en: "July" },
  "month.7": { zh: "八月", en: "August" },
  "month.8": { zh: "九月", en: "September" },
  "month.9": { zh: "十月", en: "October" },
  "month.10": { zh: "十一月", en: "November" },
  "month.11": { zh: "十二月", en: "December" },

  // ── Weekdays ──
  "dow.0": { zh: "日", en: "Su" },
  "dow.1": { zh: "一", en: "Mo" },
  "dow.2": { zh: "二", en: "Tu" },
  "dow.3": { zh: "三", en: "We" },
  "dow.4": { zh: "四", en: "Th" },
  "dow.5": { zh: "五", en: "Fr" },
  "dow.6": { zh: "六", en: "Sa" },

  // ── Settings ──
  periodStartLabel: { zh: "月經第一天", en: "First day of period" },
  cycleLenLabel: { zh: "平均週期長度：{n} 天", en: "Average cycle length: {n} days" },
  goalLabel: { zh: "目標", en: "Goal" },
  goalFasting: { zh: "斷食優化", en: "Fasting" },
  goalAvoid: { zh: "避孕", en: "Avoid" },
  goalConceive: { zh: "備孕", en: "Conceive" },
  settingsNote: {
    zh: "排卵日 = 月經第1天 + (週期 − 14)\n危險期 = 排卵前5天 → 排卵後1天\n斷食建議依週期階段自動調整",
    en: "Ovulation = Period day 1 + (cycle − 14)\nFertile window = 5 days before → 1 day after ovulation\nFasting advice adjusts automatically by phase",
  },

  // ── Google Calendar ──
  syncToGCal: { zh: "連接 Google Calendar", en: "Connect Google Calendar" },
  syncing: { zh: "同步中…", en: "Syncing…" },
  syncDone: { zh: "✓ 已同步 {n} 個事件", en: "✓ Synced {n} events" },
  syncError: { zh: "同步失敗，請重試", en: "Sync failed, please retry" },
  downloadICS: { zh: "下載 .ics 備份", en: "Download .ics backup" },
  gcalNotConfigured: { zh: "Google OAuth 未設定", en: "Google OAuth not configured" },

  // ── Fasting log form ──
  fastHours: { zh: "斷食時數", en: "Fast hours" },
  fastHoursUnit: { zh: "小時", en: "h" },
  saveLog: { zh: "儲存記錄", en: "Save" },
  deleteLog: { zh: "刪除記錄", en: "Delete" },
  editLog: { zh: "修改記錄", en: "Edit" },

  // ── BBT / cervical mucus ──
  bbtLabel: { zh: "基礎體溫 (BBT)", en: "Basal Body Temp (BBT)" },
  mucusLabel: { zh: "分泌物狀態", en: "Cervical mucus" },
  "mucus.none": { zh: "無", en: "None" },
  "mucus.sticky": { zh: "黏稠", en: "Sticky" },
  "mucus.eggwhite": { zh: "蛋清狀", en: "Egg white" },
  "mucus.watery": { zh: "水狀", en: "Watery" },
  possibleOvulation: { zh: "⚡ 可能排卵", en: "⚡ Possible ovulation" },
  bbtDetected: { zh: "BBT > 36.7°C 或蛋清分泌物", en: "BBT > 36.7°C or egg-white mucus" },

  // ── Fasting statistics ──
  statsTitle: { zh: "斷食統計", en: "Fasting Stats" },
  thisWeek: { zh: "本週", en: "This week" },
  thisMonth: { zh: "本月", en: "This month" },
  totalHours: { zh: "累計", en: "Total" },
  avgPerDay: { zh: "日均", en: "Avg/day" },
  completionRate: { zh: "完成率", en: "Completion" },
  weeklyChart: { zh: "週斷食趨勢", en: "Weekly trend" },
  weekLabel: { zh: "第{n}週", en: "Wk {n}" },
  noData: { zh: "尚無資料", en: "No data" },

  // ── PWA install prompt ──
  pwaInstall: { zh: "加到主畫面即可像 App 一樣使用", en: "Add to Home Screen to use like an app" },
  pwaDismiss: { zh: "知道了", en: "Got it" },

  // ── GCal event titles ──
  "event.fertile": { zh: "⚠️ 明天進入危險期", en: "⚠️ Fertile window starts tomorrow" },
  "event.fasting": { zh: "🔥 72h 斷食窗口", en: "🔥 72h fasting window opens" },
  "event.period": { zh: "🌑 月經快來了", en: "🌑 Period expected in 2 days" },

  // ── Guide tab ──
  guideTitle: { zh: "使用指南", en: "User Guide" },
  guidePhaseTitle: { zh: "週期階段說明", en: "Cycle Phases" },
  guideFastingTitle: { zh: "斷食建議", en: "Fasting Advice" },
  guideMoonTitle: { zh: "月相與週期", en: "Moon & Cycle" },
  "guide.menstrual": {
    zh: "月經期（第1–5天）：身體正在排出子宮內膜，適合輕斷食12–14h，注意補鐵補血。",
    en: "Menstrual (Day 1–5): Body sheds uterine lining. Light fasting 12–14h recommended. Focus on iron intake.",
  },
  "guide.follicular": {
    zh: "濾泡期（第6–10天）：雌激素上升、代謝旺盛，是斷食黃金窗口，可挑戰72h長斷食。",
    en: "Follicular (Day 6–10): Estrogen rises, metabolism peaks. Prime fasting window — can attempt 72h fasts.",
  },
  "guide.ovulation": {
    zh: "排卵期（排卵前5天～後1天）：受孕機率最高的危險期。停止長斷食，最多12–14h。",
    en: "Ovulation (5 days before → 1 day after): Highest fertility window. Stop extended fasts, max 12–14h.",
  },
  "guide.luteal": {
    zh: "黃體期（排卵後～下次月經前）：黃體素上升，容易情緒波動。適合穩定斷食12–14h，補碳水穩情緒。",
    en: "Luteal (After ovulation → next period): Progesterone rises, mood swings common. Steady 12–14h fasting, add carbs.",
  },
  "guide.moonInfo": {
    zh: "App 顯示真實天文月相。有研究指出月經週期與月亮週期（29.5天）可能存在微妙同步。新月適合內省休息，滿月能量最旺。",
    en: "The app shows real astronomical moon phases. Some research suggests menstrual cycles may subtly sync with the lunar cycle (29.5 days). New moon suits rest & reflection; full moon brings peak energy.",
  },
  "guide.howToUse": { zh: "如何使用", en: "How to Use" },
  "guide.step1": {
    zh: "1. 在「設定」頁輸入月經第一天與平均週期長度",
    en: "1. Go to Settings and enter your period start date & average cycle length",
  },
  "guide.step2": {
    zh: "2. 選擇目標：斷食優化、避孕、或備孕",
    en: "2. Choose your goal: Fasting, Avoid (contraception), or Conceive",
  },
  "guide.step3": {
    zh: "3. 每日查看儀表板了解當前階段與建議",
    en: "3. Check the Dashboard daily for your current phase & advice",
  },
  "guide.step4": {
    zh: "4. 在日曆頁記錄斷食時數、基礎體溫與分泌物",
    en: "4. Use Calendar to log fasting hours, BBT & cervical mucus",
  },
  disclaimer: {
    zh: "本工具僅供個人健康參考，不構成醫療建議。如有健康疑慮，請諮詢專業醫療人員。",
    en: "This tool is for personal reference only and does not constitute medical advice. Please consult a healthcare professional for any health concerns.",
  },

  // ══════════════════════════════════
  // ── Moonyou＋ deep cycle guidance (premium) ──
  // ══════════════════════════════════
  deepTitle: { zh: "深度週期指南", en: "Deep Cycle Guidance" },
  deepPreviewBadge: { zh: "預覽", en: "PREVIEW" },
  deepPremiumNote: {
    zh: "這是 Moonyou＋ 進階內容。免費版只顯示一句話建議,進階版針對你目前的階段給出完整的飲食、運動、補充與荷爾蒙說明。",
    en: "This is Moonyou＋ premium content. The free tier shows a one-line tip; the premium tier gives full nutrition, exercise, supplement and hormone guidance tailored to your current phase.",
  },
  deepUnlockCta: { zh: "解鎖 Moonyou＋", en: "Unlock Moonyou＋" },
  plusPrice: { zh: "US$1.99", en: "US$1.99" },
  plusPriceNote: {
    zh: "一次 US$1.99 解鎖 Moonyou＋(深度指南 ＋ AI 顧問)。真人諮詢等延伸服務在裡面再另外開通。",
    en: "One-time US$1.99 unlocks Moonyou＋ (deep guidance + AI coach). Extended services like real consults unlock separately inside.",
  },
  addonTag: { zh: "延伸加購", en: "Add-on" },

  // ══════════════════════════════════
  // ── Vedic astrology (sidereal) ──
  // ══════════════════════════════════
  astroTitle: { zh: "今日星象", en: "Today's Sky" },
  astroSystem: { zh: "吠陀・恆星黃道", en: "Vedic · Sidereal" },
  astroSun: { zh: "太陽", en: "Sun" },
  astroMoon: { zh: "月亮", en: "Moon" },
  astroMercury: { zh: "水星", en: "Mercury" },
  astroRetro: { zh: "逆行", en: "Retrograde" },
  astroDirect: { zh: "順行", en: "Direct" },
  astroStation: { zh: "停滯(留)", en: "Stationary" },
  astroTurningRetro: { zh: "轉逆行", en: "turning retrograde" },
  astroTurningDirect: { zh: "轉順行", en: "turning direct" },
  astroNote: {
    zh: "採用吠陀占星(恆星黃道,Lahiri ayanamsa),星座對齊真實星群。",
    en: "Vedic astrology (sidereal zodiac, Lahiri ayanamsa) — signs aligned with the actual constellations.",
  },
  "sign.aries": { zh: "牡羊座", en: "Aries" },
  "sign.taurus": { zh: "金牛座", en: "Taurus" },
  "sign.gemini": { zh: "雙子座", en: "Gemini" },
  "sign.cancer": { zh: "巨蟹座", en: "Cancer" },
  "sign.leo": { zh: "獅子座", en: "Leo" },
  "sign.virgo": { zh: "處女座", en: "Virgo" },
  "sign.libra": { zh: "天秤座", en: "Libra" },
  "sign.scorpio": { zh: "天蠍座", en: "Scorpio" },
  "sign.sagittarius": { zh: "射手座", en: "Sagittarius" },
  "sign.capricorn": { zh: "摩羯座", en: "Capricorn" },
  "sign.aquarius": { zh: "水瓶座", en: "Aquarius" },
  "sign.pisces": { zh: "雙魚座", en: "Pisces" },

  // ── Daily Tarot ──
  tarotTitle: { zh: "每日塔羅", en: "Daily Tarot" },
  tarotReveal: { zh: "翻開今日的牌", en: "Reveal today's card" },
  tarotUpright: { zh: "正位", en: "Upright" },
  tarotReversed: { zh: "逆位", en: "Reversed" },
  tarotHint: { zh: "輕觸抽出今天的指引", en: "Tap to draw your guidance" },
  tarotNote: { zh: "每天一張,午夜換新。僅供娛樂與自我覺察。", en: "One card a day, renewed at midnight. For fun & self-reflection only." },
  tarotLight: { zh: "光", en: "Light" },
  tarotShadow: { zh: "影 · 同時留意", en: "Shadow · also present" },
  tarotBothNote: { zh: "每天一張,午夜換新。光與影同時存在——一切都是同時的。僅供娛樂與自我覺察。", en: "One card a day, renewed at midnight. Light and shadow coexist — it's all at once. For fun & self-reflection only." },
  previewPlusLabel: { zh: "Moonyou＋ 進階內容(預覽)", en: "Moonyou＋ premium content (preview)" },
  previewPlusNote: {
    zh: "開啟後,儀表板會顯示完整的深度週期指南;關閉則只看免費版的一句話建議。用來比較兩者差異。",
    en: "When on, the dashboard shows full deep cycle guidance; when off, you see only the free one-line tip. Use it to compare the two.",
  },

  // ══════════════════════════════════
  // ── Moonyou＋ Consultant (premium) ──
  // ══════════════════════════════════
  consult: { zh: "顧問", en: "Coach" },
  "consult.title": { zh: "你的健康顧問", en: "Your Health Coach" },
  "consult.aiBadge": { zh: "AI 顧問", en: "AI Coach" },
  "consult.dataLabel": { zh: "依據你的數據", en: "Based on your data" },
  "consult.lockedTitle": { zh: "Moonyou＋ 健康顧問", en: "Moonyou＋ Health Coach" },
  "consult.lockedDesc": {
    zh: "一次 US$1.99 解鎖:AI 顧問會讀你記錄的週期、斷食與體溫,每天給你一段為你個人化的建議。解鎖後還能另外加購真人營養師深度諮詢。",
    en: "Unlock for a one-time US$1.99: the AI coach reads your cycle, fasting and temperature logs and gives you a personalized note each day. Real nutritionist consults are available as an add-on once unlocked.",
  },

  "consult.greeting": { zh: "嗨,根據你的記錄——你現在在{phase}、週期第 {day} 天。", en: "Hi — based on your logs, you're in your {phase}, cycle day {day}." },
  "consult.fastNone": { zh: "我看到你這週還沒記錄斷食。這個階段適合 {suggested} 小時左右,從今天開始試試,我才能更準地幫你調。", en: "I notice you haven't logged any fasting this week. This phase suits around {suggested}h — start today and I can tune it for you more precisely." },
  "consult.fastRoom": { zh: "你這週平均斷食 {avg} 小時。這個階段你的身體其實扛得住更長——可以慢慢往 {suggested} 小時靠近,但別勉強。", en: "You've averaged {avg}h of fasting this week. Your body can handle more in this phase — ease toward {suggested}h, but don't force it." },
  "consult.fastGood": { zh: "你這週平均斷食 {avg} 小時,節奏穩穩的,很好,保持。", en: "You've averaged {avg}h of fasting this week — a steady rhythm. Nicely done, keep it up." },
  "consult.nutrition": { zh: "飲食上,這幾天我建議:{eat}", en: "On food, for these days I'd suggest: {eat}" },
  "consult.conceiveOv": { zh: "你正在備孕,而現在就是黃金受孕窗口——把握這幾天,同時別讓身體餓著。", en: "You're trying to conceive, and this is your prime fertile window — seize these days, and don't let your body run on empty." },
  "consult.conceiveOff": { zh: "備孕方面,現在非排卵期,放輕鬆養好身體,等排卵窗口再衝刺。", en: "For conception, you're outside the fertile window now — rest and nourish, then focus when ovulation comes." },
  "consult.avoidOv": { zh: "你選了避孕——現在是危險期,務必做好防護。", en: "You've set avoidance — this is your fertile window, so be sure to use protection." },
  "consult.avoidOff": { zh: "避孕方面,目前風險較低,但仍建議規律防護。", en: "For contraception, risk is lower right now, but regular protection is still advised." },
  "consult.ovDetected": { zh: "另外,你最近的體溫/分泌物顯示可能正在排卵,我把這個納進考量了。", en: "Also, your recent temperature/mucus suggests you may be ovulating — I've factored that in." },
  "consult.closing": { zh: "有任何不舒服或想更深入,隨時可以預約真人營養師。照顧好自己 🌙", en: "If anything feels off or you want to go deeper, you can book a real nutritionist any time. Take care of yourself 🌙" },

  "consult.aiNote": {
    zh: "目前這段建議由 app 依你的數據即時組成;正式版會由 Claude AI 生成,更像對話、更貼近你。",
    en: "For now this note is assembled live from your data; the production version will be generated by Claude AI — more conversational and personal.",
  },
  "consult.humanTitle": { zh: "真人營養師・深度諮詢", en: "Real Nutritionist · Deep Consult" },
  "consult.humanDesc": {
    zh: "想要更專業、為你量身的計畫?預約一對一,由合格營養師看你的完整數據,給你專屬方案。",
    en: "Want a more professional, tailored plan? Book one-on-one — a qualified nutritionist reviews your full data and builds a plan just for you.",
  },
  "consult.humanPrice": { zh: "一次 NT$880 起", en: "From NT$880 / session" },
  "consult.humanCta": { zh: "預約諮詢", en: "Book a consult" },
  deepFreeTag: { zh: "免費版", en: "FREE" },
  deepPlusTag: { zh: "Moonyou＋", en: "Moonyou＋" },

  "deep.label.protocol": { zh: "斷食協議", en: "Fasting protocol" },
  "deep.label.eat": { zh: "建議吃", en: "Eat" },
  "deep.label.avoid": { zh: "避免", en: "Avoid" },
  "deep.label.move": { zh: "運動", en: "Movement" },
  "deep.label.support": { zh: "補充品", en: "Supplements" },
  "deep.label.hormone": { zh: "身體訊號", en: "What's happening" },
  "deep.label.body": { zh: "今天身體可能出現的狀況", en: "What your body may show today" },

  // —— Menstrual ——
  "deep.menstrual.protocol": {
    zh: "溫和 12–14h,進食窗口放在白天(如 10:00–18:00),晚上讓身體休息。這幾天不要嘗試長斷食。",
    en: "Gentle 12–14h with a daytime eating window (e.g. 10:00–18:00); rest at night. Avoid extended fasts these days.",
  },
  "deep.menstrual.eat": {
    zh: "富鐵食物(紅肉、肝、菠菜、紅豆)、搭配維生素 C 幫助吸收、溫熱湯品、Omega-3 抗發炎。",
    en: "Iron-rich foods (red meat, liver, spinach, beans) with vitamin C to aid absorption, warm soups, Omega-3.",
  },
  "deep.menstrual.avoid": {
    zh: "生冷食物、過量咖啡因、酒精、過鹹(容易水腫與經痛加劇)。",
    en: "Cold/raw foods, excess caffeine, alcohol, high salt (worsens bloating & cramps).",
  },
  "deep.menstrual.move": {
    zh: "散步、輕瑜伽、伸展。避免高強度訓練,身體正需要修復。",
    en: "Walking, gentle yoga, stretching. Skip high-intensity — your body needs to recover.",
  },
  "deep.menstrual.support": {
    zh: "鐵、鎂(緩解經痛)、維生素 C。",
    en: "Iron, magnesium (eases cramps), vitamin C.",
  },
  "deep.menstrual.hormone": {
    zh: "雌激素與黃體素都在最低點,子宮內膜正在排出,能量自然偏低——順著它休息。",
    en: "Estrogen and progesterone are at their lowest as the lining sheds; low energy is normal — lean into rest.",
  },
  "deep.menstrual.body": {
    zh: "出血量通常第 1–2 天最多，之後變少、顏色變深。可能有下腹悶痛、腰痠、頭痛、拉肚子、胸口悶。分泌物以經血為主，幾乎看不到黏液。每個人的經期長短、血量、痛的程度都不同，僅供參考，以妳自己的狀況為主。",
    en: "Flow is usually heaviest on days 1–2, then lighter and darker. Cramps, low-back ache, headache, loose stools and chest tightness are common. Discharge is mostly blood, with little mucus. Period length, flow and pain differ from person to person — for reference only; your own body comes first.",
  },

  // —— Follicular ——
  "deep.follicular.protocol": {
    zh: "斷食黃金期!胰島素敏感度最好,可挑戰 16:8、24h 甚至 72h 長斷食,最容易進入生酮與自噬。",
    en: "Prime fasting window! Insulin sensitivity peaks — try 16:8, 24h, even 72h fasts; ketosis & autophagy come easily.",
  },
  "deep.follicular.eat": {
    zh: "復食以優質蛋白、發酵食物(幫助雌激素代謝)、十字花科蔬菜、亞麻籽/南瓜籽。",
    en: "Break fasts with quality protein, fermented foods (support estrogen metabolism), cruciferous veg, flax/pumpkin seeds.",
  },
  "deep.follicular.avoid": {
    zh: "精緻糖與過度加工碳水——別浪費這段高代謝期。",
    en: "Refined sugar & processed carbs — don't waste this high-metabolism window.",
  },
  "deep.follicular.move": {
    zh: "最適合衝刺:高強度間歇(HIIT)、重訓。身體恢復最快、增肌效率最高。",
    en: "Go hard: HIIT and strength training. Fastest recovery and best muscle-building of the month.",
  },
  "deep.follicular.support": {
    zh: "益生菌、維生素 B 群、亞麻籽(平衡雌激素)。",
    en: "Probiotics, B-complex, flaxseed (estrogen balance).",
  },
  "deep.follicular.hormone": {
    zh: "雌激素穩定上升,精力、專注、心情、代謝全在高點——這是你一個月裡的「巔峰週」。",
    en: "Rising estrogen lifts energy, focus, mood and metabolism — this is your peak week of the month.",
  },
  "deep.follicular.body": {
    zh: "經血結束後幾天通常比較乾，分泌物少、偏白或黏稠。越接近排卵，分泌物會慢慢變多、變滑。體力和心情多半是整個週期最穩的。如果這幾天就看到透明拉絲的蛋清狀黏液，表示排卵可能比 app 預測的早：到日曆那天登記「蛋清狀」，app 會標上 ⚡ 可能排卵。僅供參考，以妳自己的狀況為主。",
    en: "The days right after bleeding are usually drier, with little, whitish or sticky mucus. Closer to ovulation it gets more plentiful and slippery. Energy and mood are often the steadiest of the cycle. If you already see clear, stretchy egg-white mucus in these days, ovulation may be earlier than the app predicts: log “Egg white” on that day in the calendar and the app marks ⚡ possible ovulation. For reference only; your own body comes first.",
  },

  // —— Ovulation ——
  "deep.ovulation.protocol": {
    zh: "停止長斷食,回到溫和 12–14h。這是受孕窗口,身體需要能量,不該處於極端壓力。",
    en: "Stop extended fasts; return to gentle 12–14h. This is the fertile window — your body needs energy, not extra stress.",
  },
  "deep.ovulation.eat": {
    zh: "抗氧化蔬果(莓果、深色蔬菜)、足夠纖維幫助代謝多餘雌激素、充足蛋白。",
    en: "Antioxidant produce (berries, dark veg), plenty of fiber to clear excess estrogen, adequate protein.",
  },
  "deep.ovulation.avoid": {
    zh: "極端熱量限制與長斷食——這幾天對壓力最敏感。",
    en: "Extreme calorie restriction and long fasts — your body is most stress-sensitive now.",
  },
  "deep.ovulation.move": {
    zh: "可做中高強度,但開始往下調。外向期適合團體或社交型運動。",
    en: "Moderate-to-high intensity is fine but start tapering. Great time for group or social workouts.",
  },
  "deep.ovulation.support": {
    zh: "抗氧化劑、鋅、纖維。",
    en: "Antioxidants, zinc, fiber.",
  },
  "deep.ovulation.hormone": {
    zh: "雌激素達頂峰後排卵,睪固酮短暫上升,精力與性慾高——但身體正全力排卵,別逼它斷食。",
    en: "Estrogen peaks then ovulation fires; a testosterone bump lifts drive — but your body is working hard, so ease off fasting.",
  },
  "deep.ovulation.body": {
    zh: "最明顯的訊號是分泌物：量變多、透明、像生蛋白一樣可以拉長幾公分，有時偏水狀。這種黏液會幫精子存活，所以看到它就代表受孕機率高，不管日曆上寫的是哪一天。有些人會有一側下腹輕微刺痛（排卵痛）、少量點狀出血、胸脹、性慾上升。排卵之後基礎體溫會升高約 0.3–0.5°C 並維持到下次月經。僅供參考，以妳自己的狀況為主。",
    en: "The clearest sign is mucus: more of it, clear, stretchy like raw egg white (it can stretch several centimetres), sometimes watery. This mucus helps sperm survive, so whenever you see it your chance of conceiving is high — whatever day the calendar says. Some people feel a mild one-sided twinge (ovulation pain), light spotting, breast fullness or a rise in libido. After ovulation, basal temperature rises about 0.3–0.5°C and stays up until the next period. For reference only; your own body comes first.",
  },

  // —— Luteal ——
  "deep.luteal.protocol": {
    zh: "穩定 12–14h,不要長斷食(會放大壓力與嘴饞)。經前一週尤其溫和,以穩定血糖為主。",
    en: "Steady 12–14h, no long fasts (they amplify stress & cravings). Especially gentle the week before your period — prioritize stable blood sugar.",
  },
  "deep.luteal.eat": {
    zh: "複合碳水(地瓜、糙米、南瓜)穩血糖與情緒、鎂(黑巧克力、堅果)、色胺酸(火雞、香蕉)助眠。",
    en: "Complex carbs (sweet potato, brown rice, squash) for mood & blood sugar, magnesium (dark chocolate, nuts), tryptophan (turkey, banana) for sleep.",
  },
  "deep.luteal.avoid": {
    zh: "重鹹、咖啡因、酒精、精緻糖——都會放大 PMS 與水腫。",
    en: "High salt, caffeine, alcohol, refined sugar — all magnify PMS & bloating.",
  },
  "deep.luteal.move": {
    zh: "低強度為主:瑜伽、皮拉提斯、散步,重訓減量。",
    en: "Keep it low-intensity: yoga, Pilates, walking; scale back heavy lifting.",
  },
  "deep.luteal.support": {
    zh: "鎂、維生素 B6(緩解 PMS)、鈣。",
    en: "Magnesium, vitamin B6 (eases PMS), calcium.",
  },
  "deep.luteal.hormone": {
    zh: "黃體素上升主導,基礎體溫升高,胰島素敏感度下降——疲倦、嘴饞、情緒波動都正常,溫柔對待自己。",
    en: "Progesterone takes over, BBT rises, insulin sensitivity dips — fatigue, cravings and mood swings are normal; be gentle with yourself.",
  },
  "deep.luteal.body": {
    zh: "排卵後分泌物通常變少、變稠、偏白或乳霜狀，不再拉絲。體溫維持高溫。後半段可能出現經前症狀：胸脹、水腫、長痘、嗜甜、情緒起伏、睡不好。快來月經前一兩天可能有少量褐色分泌物。如果這段時間又出現蛋清狀黏液，記錄下來就好，不一定代表再次排卵。僅供參考，以妳自己的狀況為主。",
    en: "After ovulation, mucus usually becomes scanty, thicker, whitish or creamy, and no longer stretches. Temperature stays on the high plateau. In the second half, PMS may appear: breast tenderness, bloating, breakouts, sugar cravings, mood swings, poor sleep. A day or two before the period there may be light brown discharge. If egg-white mucus shows up again in this phase, just log it — it does not necessarily mean a second ovulation. For reference only; your own body comes first.",
  },
};

const LangContext = createContext();

export function LangProvider({ children }) {
  const [lang, setLang] = useState(() => {
    try {
      return localStorage.getItem("moon-lang") || "zh";
    } catch {
      return "zh";
    }
  });

  const toggle = useCallback(() => {
    setLang(prev => {
      const next = prev === "zh" ? "en" : "zh";
      try { localStorage.setItem("moon-lang", next); } catch {}
      return next;
    });
  }, []);

  const t = useCallback((key, params) => {
    const entry = translations[key];
    if (!entry) return key;
    let text = entry[lang] || entry.zh || key;
    if (params) {
      Object.entries(params).forEach(([k, v]) => {
        text = text.replace(`{${k}}`, v);
      });
    }
    return text;
  }, [lang]);

  return (
    <LangContext.Provider value={{ lang, toggle, t }}>
      {children}
    </LangContext.Provider>
  );
}

export function useLang() {
  return useContext(LangContext);
}
