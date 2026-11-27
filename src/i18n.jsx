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
  "phase.ovulation": { zh: "推估易受孕期", en: "Est. fertile window" },
  "phase.luteal": { zh: "黃體期", en: "Luteal" },
  "phase.safe": { zh: "尚無週期資料", en: "No cycle data" },

  // ── Phase descriptions ──
  "desc.menstrual": { zh: "溫和節奏，多留意含鐵食物", en: "Gentle rhythm; include iron-rich foods" },
  "desc.follicular_gold": { zh: "許多人這幾天體力較好", en: "Many feel more energetic these days" },
  "desc.follicular_late": { zh: "可維持規律斷食", en: "Steady fasting suits these days" },
  "desc.ovulation": { zh: "⚠️ 推估易受孕期", en: "⚠️ Est. fertile window" },
  "desc.luteal": { zh: "多加入複合碳水", en: "Add complex carbs" },
  "desc.safe": { zh: "登記月經第一天後才能推估", en: "Log your period start to get estimates" },

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
  "fast.follicular_gold": { zh: "14–16h", en: "14–16h" },
  "fast.follicular_late": { zh: "14–16h", en: "14–16h" },
  "fast.ovulation": { zh: "最多 12–14h", en: "Max 12–14h" },
  "fast.luteal": { zh: "12–14h", en: "12–14h" },

  "tip.menstrual": { zh: "經期溫和就好，可以多留意含鐵食物", en: "Keep it gentle during your period; include iron-rich foods" },
  "tip.follicular_gold": { zh: "許多人這幾天體力較好，照妳自己的節奏就好", en: "Many feel more energetic now; follow your own rhythm" },
  "tip.follicular_late": { zh: "濾泡期後段，越接近排卵越該縮短斷食", en: "Late follicular — shorten fasts as ovulation nears" },
  "tip.ovulation": { zh: "這幾天維持溫和的節奏就好", en: "Keep a gentle rhythm these days" },
  "tip.luteal": { zh: "黃體期維持溫和節奏，可以多加入複合碳水", en: "Keep a gentle rhythm in the luteal phase; add complex carbs" },

  // ── Dashboard ──
  today: { zh: "今日", en: "Today" },
  yesterday: { zh: "昨天", en: "Yesterday" },
  close: { zh: "關閉", en: "Close" },
  tapToChange: { zh: "點選修改", en: "Tap to change" },
  moonPhase: { zh: "月相", en: "Moon phase" },
  fastingAdvice: { zh: "參考節奏", en: "Reference rhythm" },
  riskNote: { zh: "（僅供參考，以個人狀況為主）", en: "(for reference only; your own body comes first)" },
  ovulationEstimate: { zh: "推估排卵日", en: "Est. ovulation" },
  dangerPeriod: { zh: "推估易受孕期", en: "Est. fertile window" },
  logFastingDone: { zh: "✓ 今日斷食已記錄", en: "✓ Today's fast logged" },
  logFasting: { zh: "記錄今日斷食 ✏️", en: "Log today's fast ✏️" },
  logged: { zh: "✓ 已記錄斷食", en: "✓ Fast logged" },
  logBtn: { zh: "記錄斷食 ✏️", en: "Log fast ✏️" },

  // ── Goal: avoid (contraception) ──
  avoidDangerWarn: {
    zh: "⚠️ 推估易受孕期：日曆法無法保證哪一天不會懷孕，請使用保險套或其他可靠的避孕方法。",
    en: "⚠️ Estimated fertile window: the calendar method cannot guarantee any day is safe — use condoms or another reliable method.",
  },

  // ── Goal: conceive ──
  "phase.ovulation.conceive": { zh: "推估受孕窗口 🪺", en: "Est. conception window 🪺" },
  "desc.ovulation.conceive": { zh: "日曆推估的易受孕期，可多留意分泌物與體溫等身體訊號", en: "Calendar-estimated fertile window — watch body signs like mucus and temperature" },
  conceiveTip: {
    zh: "🪺 推估易受孕期。研究顯示，排卵前 1–2 天到排卵當天同房的受孕機會最高。",
    en: "🪺 Estimated fertile window. Research shows the highest chance of conception from intercourse 1–2 days before ovulation through ovulation day.",
  },
  conceiveNonOvTip: {
    zh: "推估不在易受孕期，受孕機會較低；實際排卵可能提早或延後。",
    en: "Outside the estimated fertile window — lower chance of conception; actual ovulation can shift earlier or later.",
  },

  // ── Goal combo: fasting + conceive during ovulation ──
  "phase.ovulation.fastConceive": { zh: "溫和節奏 + 推估受孕窗口 🪺", en: "Gentle rhythm + Est. conception window 🪺" },
  "desc.ovulation.fastConceive": { zh: "維持溫和節奏，同時留意推估的易受孕期", en: "Keep a gentle rhythm and watch the estimated fertile window" },
  goalExclusive: { zh: "避孕與備孕不能同時選", en: "Avoid & Conceive are mutually exclusive" },

  // ── Calendar ──
  clickToView: { zh: "點擊日期查看詳情", en: "Tap a date for details" },
  day: { zh: "第 {n} 天", en: "Day {n}" },
  inDays: { zh: "{n} 天後", en: "in {n} days" },
  daysAgo: { zh: "{n} 天前", en: "{n} days ago" },
  tapDiscHint: { zh: "點圓盤上的任何一格，看那天是什麼階段", en: "Tap any wedge on the disc to inspect that day" },
  ovulationDay: { zh: "推估排卵日", en: "Est. ovulation" },
  fertileWindow: { zh: "推估易受孕期", en: "Est. fertile window" },
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
    zh: "卵巢裡幾顆濾泡開始競爭長大，雌激素從谷底慢慢爬升。有些研究觀察到濾泡期的血糖反應比黃體期穩定，但結果不一致；目前沒有研究證實依週期調整斷食時數比較好。",
    en: "Several follicles in the ovary start competing to grow, and estrogen climbs from its low. Some studies see steadier blood-sugar responses in the follicular phase than the luteal phase, but results are mixed; no study has shown that adjusting fasting hours by phase works better.",
  },
  "diff.follicular_gold": {
    zh: "跟月經期比，出血停了、鐵質不再流失，雌激素回升，很多人這幾天比較有精神。",
    en: "Compared with menstruation, bleeding has stopped, iron is no longer being lost, and estrogen rises; many people feel more energetic these days.",
  },
  "learn.follicular_late": {
    zh: "一顆主導濾泡勝出，其他的退場。雌激素持續上升接近高峰，子宮內膜重新增厚，身體在為排卵做準備。",
    en: "One dominant follicle wins and the others fade. Estrogen keeps rising toward its peak, the uterine lining thickens again, and the body prepares for ovulation.",
  },
  "diff.follicular_late": {
    zh: "跟濾泡期前段比，雌激素更高、距離排卵更近。越靠近排卵，節奏可以放溫和一點。",
    en: "Compared with the early follicular days, estrogen is higher and ovulation is closer. As ovulation nears, a gentler rhythm is fine.",
  },
  "learn.ovulation": {
    zh: "雌激素衝到頂點，觸發 LH（黃體生成素）高峰，大約 24–36 小時後卵子釋出。卵子大約只能存活一天，但精子在體內最多可活約 5 天，所以推估易受孕期從排卵前 5 天算到排卵當天，app 再多留排卵後 1 天當緩衝。實際排卵每月可能提早或延後。",
    en: "Estrogen peaks and triggers the LH surge; the egg is released about 24–36 hours later. The egg survives only about a day, but sperm can survive up to about 5 days in the body, so the estimated fertile window runs from 5 days before ovulation to ovulation day, and the app adds 1 day after as a buffer. Actual ovulation can shift earlier or later each month.",
  },
  "diff.ovulation": {
    zh: "跟濾泡期比，身體從「累積」切換到「釋放」：分泌物變成透明蛋清狀，排卵後基礎體溫會升高約 0.3–0.5°C。目前沒有研究直接證實這幾天斷食會干擾排卵；維持溫和的節奏就好。",
    en: "Compared with the follicular phase, the body switches from building up to releasing: mucus turns clear and egg-white-like, and basal temperature rises about 0.3–0.5°C after ovulation. No study has directly shown that fasting in these days disrupts ovulation; a gentle rhythm is enough.",
  },
  "learn.luteal": {
    zh: "排出卵子後的濾泡變成黃體，開始分泌黃體素，體溫維持在高溫期，子宮內膜變厚準備著床。沒有受孕的話，黃體在大約 12–14 天後萎縮，週期重來。",
    en: "After releasing the egg, the follicle becomes the corpus luteum and secretes progesterone. Temperature stays on the high plateau and the lining thickens for implantation. If there is no pregnancy, the corpus luteum fades after about 12–14 days and the cycle restarts.",
  },
  "diff.luteal": {
    zh: "跟排卵前後比，主角從雌激素換成黃體素：食慾上升、體溫偏高、容易水腫或情緒波動，後半段可能出現經前症狀。黃體期長度通常比濾泡期穩定（大型研究平均約 12 天，多在 7–17 天之間），所以週期長短的差異主要來自前面的濾泡期。",
    en: "Compared with ovulation, progesterone takes over from estrogen: appetite rises, temperature stays higher, and bloating or mood swings are more likely, with PMS possible in the second half. The luteal phase is usually steadier than the follicular phase (about 12 days on average in a large study, mostly 7–17 days), so differences in cycle length come mostly from the follicular phase.",
  },
  "learn.safe": {
    zh: "這一天在妳登記的月經第一天之前，app 沒有這段時間的週期資料，所以無法推估。",
    en: "This day is before the period start you entered, so the app has no cycle data for it and cannot estimate anything.",
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
    zh: "推估排卵日 = 月經第1天 + (週期 − 14)\n推估易受孕期 = 排卵前5天 → 排卵後1天\n日曆法推估：實際排卵每月可能提早或延後\n參考節奏依週期階段提供；目前沒有研究證實依週期調整斷食時數比較好",
    en: "Est. ovulation = Period day 1 + (cycle − 14)\nEst. fertile window = 5 days before → 1 day after ovulation\nCalendar-method estimates: actual ovulation can shift each month\nThe reference rhythm follows the cycle phase; no study has shown that adjusting fasting hours by phase works better",
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
  possibleOvulation: { zh: "⚡ 排卵參考訊號", en: "⚡ Ovulation reference signal" },

  // ── Fasting statistics ──
  statsTitle: { zh: "斷食統計", en: "Fasting Stats" },
  thisWeek: { zh: "本週", en: "This week" },
  thisMonth: { zh: "本月", en: "This month" },
  totalHours: { zh: "累計", en: "Total" },
  avgPerDay: { zh: "記錄日平均", en: "Avg per logged day" },
  weeklyChart: { zh: "週斷食趨勢", en: "Weekly trend" },
  weekLabel: { zh: "第{n}週", en: "Wk {n}" },
  noData: { zh: "尚無資料", en: "No data" },

  // ── PWA install prompt ──
  pwaInstall: { zh: "加到主畫面即可像 App 一樣使用", en: "Add to Home Screen to use like an app" },
  pwaDismiss: { zh: "知道了", en: "Got it" },

  // ── GCal event titles ──
  "event.fertile": { zh: "⚠️ 明天進入推估易受孕期", en: "⚠️ Estimated fertile window starts tomorrow" },
  "event.fasting": { zh: "🌱 濾泡期開始", en: "🌱 Follicular phase begins" },
  "event.period": { zh: "🌑 月經快來了", en: "🌑 Period expected in 2 days" },

  // ── Guide tab ──
  guideTitle: { zh: "使用指南", en: "User Guide" },
  guidePhaseTitle: { zh: "週期階段說明", en: "Cycle Phases" },
  guideFastingTitle: { zh: "斷食建議", en: "Fasting Advice" },
  guideMoonTitle: { zh: "月相與週期", en: "Moon & Cycle" },
  "guide.menstrual": {
    zh: "月經期（第1–5天）：身體正在排出子宮內膜。參考節奏 12–14h；經期是缺鐵的高風險時期，可以多留意含鐵食物。",
    en: "Menstrual (Day 1–5): the body sheds the uterine lining. Reference rhythm 12–14h; periods raise the risk of low iron, so include iron-rich foods.",
  },
  "guide.follicular": {
    zh: "濾泡期（第6–10天）：雌激素上升，許多人這幾天體力較好。參考節奏 14–16h；目前沒有研究證實依週期調整斷食時數比較好。",
    en: "Follicular (Day 6–10): estrogen rises and many feel more energetic. Reference rhythm 14–16h; no study has shown that adjusting fasting hours by phase works better.",
  },
  "guide.ovulation": {
    zh: "推估易受孕期（推估排卵前5天～後1天，含排卵日）：日曆推估，實際排卵每月可能不同。參考節奏 12–14h。",
    en: "Est. fertile window (est. 5 days before → 1 day after ovulation, including ovulation day): a calendar estimate; actual ovulation varies month to month. Reference rhythm 12–14h.",
  },
  "guide.luteal": {
    zh: "黃體期（排卵後～下次月經前）：黃體素上升，情緒起伏很常見。參考節奏 12–14h，可以多加入複合碳水。",
    en: "Luteal (after ovulation → next period): progesterone rises and mood swings are common. Reference rhythm 12–14h; add complex carbs.",
  },
  "guide.moonInfo": {
    zh: "App 顯示真實天文月相。月經週期和月亮週期（約 29.5 天）長度相近；2021 年一項研究分析 22 位女性長達數十年的記錄，發現週期較長的人有時會和月亮「暫時」同步，但樣本很小、仍有爭議，夜間燈光和年齡會讓這種同步消失。「新月內省、滿月能量」不是研究結論；在 Moonyou 裡，月相是陪伴與覺察的節奏，不是健康建議。",
    en: "The app shows real astronomical moon phases. Menstrual and lunar cycles (about 29.5 days) are similar in length; a 2021 study of 22 women's decades-long records found that longer cycles sometimes synchronised with the Moon temporarily, but the sample was small and it remains debated, and night-time light and age removed the effect. \"New moon for reflection, full moon for energy\" is not a research finding; in Moonyou the moon is a rhythm for reflection and company, not health advice.",
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
    zh: "Moonyou 提供一般性的生活與自我覺察資訊，不是醫療建議、診斷或治療，也不是避孕醫療器材。參考節奏最多 16 小時；更長的斷食是個人設定，請在醫療專業人員指導下進行。真人諮詢不能取代醫師、營養師或心理專業人員。身體有異狀請直接就醫；情緒困擾可撥衛福部安心專線 1925。",
    en: "Moonyou offers general lifestyle and self-awareness information. It is not medical advice, diagnosis or treatment, and not a contraceptive device. The reference rhythm is at most 16h; longer fasts are a personal setting and should be done under professional guidance. Human consults do not replace a doctor, dietitian or mental-health professional. If something feels wrong, see a doctor; in Taiwan, the 1925 line offers emotional support.",
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
    zh: "一次 US$1.99 解鎖 Moonyou＋(深度指南 ＋ 今日小建議)。真人諮詢等延伸服務在裡面再另外開通。",
    en: "One-time US$1.99 unlocks Moonyou＋ (deep guidance + daily note). Extended services like real consults unlock separately inside.",
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
  consult: { zh: "諮詢", en: "Consult" },
  "consult.title": { zh: "今日小建議", en: "Today's little note" },
  "consult.dataLabel": { zh: "非 AI・非診斷", en: "Not AI · not a diagnosis" },
  "consult.lockedTitle": { zh: "Moonyou＋ 健康顧問", en: "Moonyou＋ Health Coach" },
  "consult.lockedDesc": {
    zh: "一次 US$1.99 解鎖：每天依你記錄的週期、斷食與體溫，組合一段今日小建議。解鎖後還能另外加購一對一真人諮詢。",
    en: "Unlock for a one-time US$1.99: each day the app assembles a little note from your cycle, fasting and temperature logs. One-on-one human consults are available as an add-on once unlocked.",
  },

  "consult.greeting": { zh: "嗨,根據你的記錄——你現在在{phase}、週期第 {day} 天。", en: "Hi — based on your logs, you're in your {phase}, cycle day {day}." },
  "consult.fastNone": {
    zh: "這週還沒有斷食記錄。這個階段的參考節奏是 {rhythm}；有記錄之後，這裡會跟著妳的數字。",
    en: "No fasting logged this week. This phase's reference rhythm is {rhythm}; once you log, this note follows your numbers.",
  },
  "consult.nutrition": { zh: "飲食上,這幾天我建議:{eat}", en: "On food, for these days I'd suggest: {eat}" },
  "consult.conceiveOv": {
    zh: "你正在備孕，現在是推估的易受孕期——可以多留意分泌物變化，同時別讓身體餓著。",
    en: "You're trying to conceive and this is the estimated fertile window — watch for mucus changes, and don't let your body run on empty.",
  },
  "consult.conceiveOff": {
    zh: "備孕方面，推估目前不在易受孕期，放輕鬆養好身體；實際排卵可能提早或延後。",
    en: "For conception, you're outside the estimated fertile window — rest and nourish; actual ovulation can shift earlier or later.",
  },
  "consult.avoidOv": {
    zh: "你選了避孕——現在是推估易受孕期，請務必使用可靠的避孕方法。",
    en: "You've set contraception — this is the estimated fertile window, so be sure to use a reliable method.",
  },
  "consult.avoidOff": {
    zh: "避孕方面，日曆推估目前不在易受孕期，但排卵可能提早，請持續使用可靠的避孕方法。",
    en: "For contraception, the calendar estimate puts you outside the fertile window, but ovulation can come early — keep using a reliable method.",
  },
  "consult.ovDetected": {
    zh: "你最近記錄到排卵參考訊號（蛋清狀分泌物或體溫偏高）。這只是參考，不代表確定排卵。",
    en: "You recently logged an ovulation reference signal (egg-white mucus or a raised temperature). It's a reference only, not confirmation of ovulation.",
  },
  "consult.closing": {
    zh: "有任何不舒服或想更深入，可以預約一對一的真人諮詢。照顧好自己 🌙",
    en: "If anything feels off or you want to go deeper, you can book a one-on-one human consult. Take care of yourself 🌙",
  },

  "consult.humanTitle": { zh: "真人諮詢・一對一", en: "One-on-one human consult" },
  "consult.humanDesc": {
    zh: "想有人陪妳釐清目標、建立習慣？可以預約一對一諮詢，並自己決定要不要附上諮詢摘要。",
    en: "Want someone to help you clarify goals and build habits? Book one-on-one, and decide for yourself whether to attach your consult summary.",
  },
  "consult.humanPrice": { zh: "一次 NT$880 起", en: "From NT$880 / session" },
  "consult.humanCta": { zh: "預約諮詢", en: "Book a consult" },
  deepFreeTag: { zh: "免費版", en: "FREE" },
  deepPlusTag: { zh: "Moonyou＋", en: "Moonyou＋" },

  "deep.label.protocol": { zh: "參考節奏", en: "Reference rhythm" },
  "deep.label.eat": { zh: "建議吃", en: "Eat" },
  "deep.label.avoid": { zh: "可以少一點", en: "Could have less of" },
  "deep.label.move": { zh: "運動", en: "Movement" },
  "deep.label.support": { zh: "補充品", en: "Supplements" },
  "deep.label.hormone": { zh: "身體訊號", en: "What's happening" },
  "deep.label.body": { zh: "今天身體可能出現的狀況", en: "What your body may show today" },

  // ── Day-by-day body signs for a typical cycle (anchored to ovulation; see bodyKeyFor) ──
  "body.d1": {
    zh: "出血第一天。子宮內膜開始剝落，前 24–48 小時通常是整個經期血量最多的時候。子宮收縮（前列腺素）讓下腹悶痛最明顯，有些人會腰痠、頭痛、拉肚子。雌激素和黃體素都在最低點。分泌物以經血為主，看不到黏液。",
    en: "First day of bleeding. The uterine lining starts to shed; the first 24–48 hours are usually the heaviest of the whole period. Uterine contractions (prostaglandins) make cramps strongest now; some people also get low-back ache, headache or loose stools. Estrogen and progesterone are both at their lowest. Discharge is menstrual blood, with no visible mucus.",
  },
  "body.d2": {
    zh: "多數人第 2 天血量仍然偏多，可能有小血塊。悶痛通常在第 1–2 天最強，之後減輕。體溫還在低溫期。",
    en: "For most people day 2 is still heavy, sometimes with small clots. Cramps are usually strongest on days 1–2 and ease afterwards. Temperature is still on the low plateau.",
  },
  "body.d3_5": {
    zh: "血量逐漸變少、顏色變深偏褐，多數人的經期在 3–5 天內結束（2–7 天都算正常）。雌激素開始從谷底回升，體力慢慢回來。",
    en: "Flow tapers and turns darker or brownish; most periods end within 3–5 days (2–7 days is normal). Estrogen starts climbing from its low and energy gradually returns.",
  },
  "body.post_period": {
    zh: "經血結束後的幾天通常比較乾：分泌物很少、偏黏、白色或淡黃，摸起來不滑。這時精子不容易存活，受孕機會較低。卵巢裡的濾泡正在長大，雌激素持續上升，精神和專注力多半不錯。",
    en: "The days right after bleeding are usually dry: little mucus, sticky, white or pale yellow, not slippery. Sperm survive poorly in it, so the chance of conceiving is lower. Follicles are growing in the ovary, estrogen keeps rising, and focus and energy are often good.",
  },
  "body.preov_5": {
    zh: "分泌物開始變多、變成乳霜或優格狀、偏白偏濁、摸起來濕潤。這表示雌激素已經升到一定程度，受孕窗口開始打開：精子大約從這幾天起可以在黏液裡存活，最長約 5 天，所以這幾天同房也可能懷孕。",
    en: "Mucus starts to increase and turns creamy or yogurt-like, cloudy and moist. This means estrogen has risen enough for the fertile window to open: from around now sperm can survive in the mucus for up to about 5 days, so intercourse in these days can lead to pregnancy.",
  },
  "body.preov_2": {
    zh: "排卵前 1–2 天。分泌物變成透明、滑、可以拉成好幾公分的「蛋清狀」，有時偏水狀，量是整個週期最多的。這是最容易受孕的日子之一。雌激素達到頂峰，觸發 LH 高峰（排卵試紙會變陽性），大約 24–36 小時後排卵。有些人這時性慾上升、精神特別好。",
    en: "The 1–2 days before ovulation. Mucus becomes clear, slippery and stretchy like raw egg white, sometimes watery, and is at its most abundant. These are among the most fertile days. Estrogen peaks and triggers the LH surge (ovulation test strips turn positive); ovulation follows about 24–36 hours later. Some people notice higher libido and energy.",
  },
  "body.ov": {
    zh: "排卵日（預估）。卵子釋出後大約只能存活一天，所以這天是受孕機率最高的一天。分泌物可能還是蛋清狀或水狀，也可能開始變少。有些人會有單側下腹短暫刺痛（排卵痛，通常幾分鐘到幾小時）、少量點狀出血。基礎體溫通常在排卵後 1–3 天內上升 0.2–0.5°C。",
    en: "Estimated ovulation day. The egg survives only about a day after release, so this is the day with the highest chance of conceiving. Mucus may still be egg-white or watery, or may start to decrease. Some people feel a brief one-sided twinge (ovulation pain, usually minutes to hours) or light spotting. Basal temperature usually rises 0.2–0.5°C within 1–3 days after ovulation.",
  },
  "body.post_ov": {
    zh: "排卵後 1–2 天。黃體素開始上升，分泌物很快變少、變稠、偏白，不再拉絲。基礎體溫升到高溫期並維持。卵子壽命已過，受孕機率快速下降；app 的推估易受孕期多保留排卵後一天當作緩衝。",
    en: "1–2 days after ovulation. Progesterone starts rising; mucus quickly becomes scanty, thicker and whitish, and no longer stretches. Basal temperature moves up to the high plateau and stays there. The egg's lifespan has passed, so the chance of conceiving drops fast; the app keeps one extra day in the estimated fertile window as a buffer.",
  },
  "body.lut_mid": {
    zh: "黃體期中段。黃體素在排卵後約 6–8 天達到最高，子宮內膜增厚準備著床。分泌物少、乾或黏。體溫維持高溫。有些人開始覺得胸脹、容易水腫、食慾（尤其想吃甜食和碳水）上升、比較嗜睡。",
    en: "Mid luteal phase. Progesterone peaks about 6–8 days after ovulation and the lining thickens for implantation. Mucus is scanty, dry or sticky. Temperature stays high. Some people start to notice breast fullness, bloating, more appetite (especially for sweets and carbs) and sleepiness.",
  },
  "body.lut_late": {
    zh: "黃體期後段。如果沒有受孕，黃體開始萎縮，黃體素和雌激素往下掉。這是經前症狀最常出現的時段（約月經前 5 天開始）：情緒起伏、易怒、胸脹、水腫、長痘、頭痛、睡不好。分泌物仍少，偶爾偏稠。",
    en: "Late luteal phase. If there is no pregnancy, the corpus luteum starts to break down and progesterone and estrogen fall. This is when premenstrual symptoms most often appear (from about 5 days before the period): mood swings, irritability, breast tenderness, bloating, breakouts, headache, poor sleep. Mucus stays scanty, occasionally thick.",
  },
  "body.pre_period": {
    zh: "月經前 1–3 天。荷爾蒙降到低點，經前症狀可能最明顯，有些人會先看到少量褐色或粉色分泌物，下腹開始有輕微悶痛。基礎體溫可能開始往下掉。接著出血，週期重新開始。",
    en: "The last 1–3 days before the period. Hormones reach their low; premenstrual symptoms may be at their strongest, some people see a little brown or pink discharge first, and mild cramping begins. Basal temperature may start to fall. Then bleeding starts and the cycle begins again.",
  },
  bodyNote: { zh: "每個人的週期都不同，以上是一般 28 天週期的典型描述，僅供參考，以妳自己的狀況為主。", en: "Every cycle is different; this describes a typical 28-day cycle, for reference only — your own body comes first." },

  // —— Menstrual ——
  "deep.menstrual.protocol": {
    zh: "參考節奏 12–14 小時，進食時間可以放在白天（例如 10:00–18:00）。",
    en: "Reference rhythm 12–14h; eating can sit in the daytime (e.g. 10:00–18:00).",
  },
  "deep.menstrual.eat": {
    zh: "富鐵食物(紅肉、肝、菠菜、紅豆)、搭配維生素 C 幫助吸收、溫熱湯品、含 Omega-3 的魚類。",
    en: "Iron-rich foods (red meat, liver, spinach, beans) with vitamin C to aid absorption, warm soups, fish with Omega-3.",
  },
  "deep.menstrual.avoid": {
    zh: "多喝溫熱的湯和水，自然會少一點生冷、咖啡因、酒精和重鹹。",
    en: "More warm soups and water naturally leave less room for cold food, caffeine, alcohol and salt.",
  },
  "deep.menstrual.move": {
    zh: "散步、輕瑜伽、伸展。避免高強度訓練,身體正需要修復。",
    en: "Walking, gentle yoga, stretching. Skip high-intensity — your body needs to recover.",
  },
  "deep.menstrual.support": {
    zh: "有月經的女性是缺鐵的高風險群。要不要補鐵，請先和醫療專業人員討論、必要時驗血，不建議自己開始補充。",
    en: "People who menstruate are at higher risk of iron deficiency. Talk to a healthcare professional — and get a blood test if needed — before starting iron yourself.",
  },
  "deep.menstrual.hormone": {
    zh: "雌激素與黃體素都在最低點,子宮內膜正在排出,能量自然偏低——順著它休息。",
    en: "Estrogen and progesterone are at their lowest as the lining sheds; low energy is normal — lean into rest.",
  },

  // —— Follicular ——
  "deep.follicular.protocol": {
    zh: "參考節奏 14–16 小時，可以從 14:10 慢慢延長到 16:8。更長的斷食是個人選擇，可以在設定裡設成妳自己的目標。",
    en: "Reference rhythm 14–16h; you can ease from 14:10 toward 16:8. Longer fasts are a personal choice you can set as your own goal in Settings.",
  },
  "deep.follicular.eat": {
    zh: "復食以優質蛋白、發酵食物、十字花科蔬菜、亞麻籽/南瓜籽。",
    en: "Break fasts with quality protein, fermented foods, cruciferous veg, flax/pumpkin seeds.",
  },
  "deep.follicular.avoid": { zh: "多加入原型食物，自然會少一點精緻糖和加工碳水。", en: "More whole foods naturally leave less room for refined sugar and processed carbs." },
  "deep.follicular.move": { zh: "精神好的話，可以安排較有強度的運動，依自己的感覺調整。", en: "If you feel energetic, you can plan more intense workouts; adjust to how you feel." },
  "deep.follicular.support": {
    zh: "益生菌、維生素 B 群、亞麻籽常被提到，但沒有證據顯示能平衡荷爾蒙；需不需要補充，請先問醫療專業人員。",
    en: "Probiotics, B vitamins and flaxseed are often mentioned, but there is no evidence they balance hormones; ask a healthcare professional before supplementing.",
  },
  "deep.follicular.hormone": {
    zh: "雌激素上升，很多人這幾天精神比較好，但每個人不同。",
    en: "Estrogen rises; many people feel more energetic these days, but everyone is different.",
  },

  // —— Ovulation ——
  "deep.ovulation.protocol": {
    zh: "參考節奏 12–14 小時。目前沒有研究直接證實這幾天斷食會干擾排卵，溫和就好。",
    en: "Reference rhythm 12–14h. No study has directly shown fasting now disrupts ovulation; gentle is enough.",
  },
  "deep.ovulation.eat": {
    zh: "抗氧化蔬果(莓果、深色蔬菜)、足夠纖維、充足蛋白。",
    en: "Antioxidant produce (berries, dark veg), plenty of fiber, adequate protein.",
  },
  "deep.ovulation.avoid": { zh: "多加入新鮮蔬果和優質蛋白，吃得夠，就比較不會吃得太少。", en: "More fresh produce and good protein help you eat enough rather than too little." },
  "deep.ovulation.move": {
    zh: "可做中高強度,但開始往下調。外向期適合團體或社交型運動。",
    en: "Moderate-to-high intensity is fine but start tapering. Great time for group or social workouts.",
  },
  "deep.ovulation.support": { zh: "以食物為主就好；需要補充品，請先問醫療專業人員。", en: "Food first; ask a healthcare professional before taking supplements." },
  "deep.ovulation.hormone": {
    zh: "雌激素達到頂峰後排卵，有些人這幾天精力與性慾較高。",
    en: "Estrogen peaks and ovulation follows; some people notice more energy and libido these days.",
  },

  // —— Luteal ——
  "deep.luteal.protocol": {
    zh: "參考節奏 12–14 小時。經前一週可以更溫和，以吃得穩定為主。",
    en: "Reference rhythm 12–14h. The week before your period can be even gentler; focus on eating steadily.",
  },
  "deep.luteal.eat": {
    zh: "複合碳水（地瓜、糙米、南瓜）、含鎂的食物（黑巧克力、堅果）、含色胺酸的食物（火雞、香蕉）。",
    en: "Complex carbs (sweet potato, brown rice, squash), magnesium-rich foods (dark chocolate, nuts), tryptophan-rich foods (turkey, banana).",
  },
  "deep.luteal.avoid": {
    zh: "多加入複合碳水和堅果，自然會少一點重鹹、咖啡因、酒精和精緻糖。",
    en: "More complex carbs and nuts naturally leave less room for salt, caffeine, alcohol and refined sugar.",
  },
  "deep.luteal.move": {
    zh: "低強度為主:瑜伽、皮拉提斯、散步,重訓減量。",
    en: "Keep it low-intensity: yoga, Pilates, walking; scale back heavy lifting.",
  },
  "deep.luteal.support": {
    zh: "經前症狀明顯影響生活時，請就醫討論，可能是經前症候群（PMS）或經前不悅症（PMDD）；補充品是否適合你，請先問醫療專業人員。",
    en: "If premenstrual symptoms clearly affect daily life, see a doctor — it may be PMS or PMDD; ask a healthcare professional whether any supplement suits you.",
  },
  "deep.luteal.hormone": {
    zh: "黃體素上升主導，基礎體溫升高；有些研究觀察到這段血糖反應較不穩，但結果不一致。疲倦、嘴饞、情緒波動都很常見，溫柔對待自己。",
    en: "Progesterone takes over and basal temperature rises; some studies see less steady blood sugar now, but results are mixed. Fatigue, cravings and mood swings are common; be gentle with yourself.",
  },

  // ══════════════════════════════════
  // ── Estimates, notices, long fasts, intake, summary, booking ──
  // ══════════════════════════════════
  "consult.badge": { zh: "依你的記錄自動組合", en: "Assembled from your logs" },
  "consult.ruleNote": {
    zh: "這段文字由 app 依你的記錄套用固定規則組合，不是 AI，也不是個人化診療。",
    en: "This note is assembled by the app from your logs using fixed rules. It is not AI and not personalised medical care.",
  },
  fertilityLabel: { zh: "受孕機會（日曆推估）", en: "Chance of conception (calendar estimate)" },
  "fert.high": { zh: "可能較易受孕的幾天", en: "Days you may be more likely to conceive" },
  "fert.low": { zh: "受孕機會較低的推估日", en: "Estimated lower-chance day" },
  "fert.none": { zh: "尚無週期資料", en: "No cycle data" },
  "fert.lowNote": { zh: "較低不等於零：排卵可能提早，精子在體內可存活數天。", en: "Lower is not zero: ovulation can come early, and sperm can survive several days." },
  ovulationVaries: { zh: "實際排卵每月可能提早或延後，日期為日曆推估", en: "Actual ovulation can shift earlier or later each month; dates are calendar estimates" },
  "signal.mucus": {
    zh: "蛋清狀分泌物：通常出現在排卵前幾天，是易受孕的參考訊號。",
    en: "Egg-white mucus usually appears in the days before ovulation — a reference sign of fertility.",
  },
  "signal.bbt": {
    zh: "體溫高於 36.7°C：體溫通常在排卵「之後」才上升，表示排卵可能已經發生，不能用來預測何時排卵。",
    en: "Temperature above 36.7°C: temperature usually rises only after ovulation, so it suggests ovulation may already have happened; it can't predict when ovulation will happen.",
  },
  "signal.note": { zh: "這是參考訊號，不是確認排卵。", en: "This is a reference signal, not confirmation of ovulation." },
  "notice.title.avoid": { zh: "避孕模式說明", en: "About contraception mode" },
  "notice.title.conceive": { zh: "備孕模式說明", en: "About conception mode" },
  "notice.body": {
    zh: "本 App 以日曆法推估，不是避孕醫療器材，不能取代保險套或其他避孕方法；備孕或避孕請與醫療專業人員討論。",
    en: "This app uses the calendar method to estimate. It is not a contraceptive medical device and cannot replace condoms or other contraception. Talk with a healthcare professional about trying to conceive or avoiding pregnancy.",
  },
  "notice.extra": {
    zh: "易受孕期是用你登記的月經第一天和平均週期長度推算的。實際排卵每月可能提早或延後，週期不規律時誤差更大。",
    en: "The fertile window is calculated from your logged period start and average cycle length. Actual ovulation can shift earlier or later each month, and more so when cycles are irregular.",
  },
  "notice.stats": {
    zh: "研究數字：用生育意識法避孕，一般使用（包含偶爾算錯或沒照做）第一年約每 100 人有 24 人意外懷孕；就算完全正確且持續使用，依方法不同仍約有 0.4–5 人（Trussell 2011）。",
    en: "The numbers: with fertility-awareness methods, typical use (including mistakes and lapses) leads to about 24 unintended pregnancies per 100 people in the first year; even with perfect, consistent use it is still about 0.4–5, depending on the method (Trussell 2011).",
  },
  "notice.snooze": { zh: "本週不再顯示", en: "Don't show again this week" },
  "notice.ok": { zh: "我了解了", en: "I understand" },
  longFastWarn: {
    zh: "超過 16 小時的斷食不適用於：懷孕或正在備孕、哺乳中、有進食障礙史、體重過輕、糖尿病或正在服藥、未滿 18 歲、肝腎疾病或正在接受癌症治療。長時間斷食的研究多在醫療監督下進行，開始前請先諮詢醫師或營養師。",
    en: "Fasts longer than 16h are not for people who are pregnant or trying to conceive, breastfeeding, with a history of eating disorders, underweight, with diabetes or on medication, under 18, or with liver or kidney disease or in cancer treatment. Research on long fasts was mostly done under medical supervision; talk to a doctor or dietitian first.",
  },
  refsTitle: { zh: "參考文獻", en: "References" },
  refsNote: {
    zh: "文獻支持的是研究發現；飲食、運動與補充品屬一般性生活建議，不是醫療效能宣稱。",
    en: "The references support research findings; food, movement and supplement suggestions are general lifestyle advice, not claims of medical effect.",
  },
  guideAboutTitle: { zh: "重要說明", en: "Important" },
  "about.calendar": {
    zh: "Moonyou 用日曆法推估排卵日與易受孕期：以你登記的月經第一天和平均週期長度計算（排卵日 = 週期長度 − 14）。實際排卵每月可能提早或延後；一項超過 60 萬個週期的研究發現，只有約 13% 的週期剛好是 28 天。",
    en: "Moonyou estimates ovulation and the fertile window with the calendar method, from your logged period start and average cycle length (ovulation = cycle length − 14). Actual ovulation can shift each month; a study of over 600,000 cycles found only about 13% were exactly 28 days.",
  },
  "about.notDevice": {
    zh: "Moonyou 不是避孕醫療器材，不能取代保險套或其他避孕方法，也不能保證受孕。受孕機會只以「較易受孕」或「較低」描述，不提供百分比。備孕或避孕請與醫療專業人員討論。",
    en: "Moonyou is not a contraceptive medical device. It cannot replace condoms or other contraception, and it cannot guarantee conception. Chance of conception is described only as \"more likely\" or \"lower\", never as a percentage. Talk with a healthcare professional about conceiving or contraception.",
  },
  "about.signals": {
    zh: "分泌物與基礎體溫是參考訊號：蛋清狀分泌物通常出現在排卵前，體溫通常在排卵後才上升。",
    en: "Mucus and basal temperature are reference signals: egg-white mucus usually appears before ovulation, and temperature usually rises only after it.",
  },
  "about.fasting": {
    zh: "參考節奏是一般性的參考，最多 16 小時，不是處方。更長的斷食只能在設定裡設成個人目標，而且不適用於：懷孕或正在備孕、哺乳中、有進食障礙史、體重過輕、糖尿病或正在服藥、未滿 18 歲、肝腎疾病或正在接受癌症治療。",
    en: "The reference rhythm is general guidance of at most 16h, not a prescription. Longer fasts exist only as a personal goal you set in Settings, and are not for people who are pregnant or trying to conceive, breastfeeding, with a history of eating disorders, underweight, with diabetes or on medication, under 18, or with liver or kidney disease or in cancer treatment.",
  },
  "about.dailyNote": {
    zh: "「今日小建議」是 app 依你的記錄套用固定規則組合的文字，不是 AI，也不是個人化診療。",
    en: "\"Today's little note\" is text the app assembles from your logs with fixed rules. It is not AI and not personalised medical care.",
  },
  "about.privacy": {
    zh: "所有資料，包括健康問卷，只存在你的裝置上，不會上傳。",
    en: "All your data, including the health intake, stays on your device and is never uploaded.",
  },
  privacyLink: { zh: "隱私政策與完整免責聲明 →", en: "Privacy policy & full disclaimer →" },
  "intake.title": { zh: "健康問卷", en: "Health intake" },
  "intake.privacy": { zh: "只存在這支手機的瀏覽器裡，不會上傳。可以隨時修改或一鍵刪除。", en: "Stored only in this phone's browser, never uploaded. Edit or delete it any time." },
  "intake.goals": { zh: "想照顧的方向（可複選）", en: "What you want to look after (pick any)" },
  "intake.goal.fasting": { zh: "斷食", en: "Fasting" },
  "intake.goal.conceive": { zh: "備孕", en: "Conceiving" },
  "intake.goal.avoid": { zh: "避孕", en: "Contraception" },
  "intake.goal.sleep": { zh: "睡眠", en: "Sleep" },
  "intake.goal.mood": { zh: "情緒", en: "Mood" },
  "intake.goal.digestion": { zh: "消化", en: "Digestion" },
  "intake.goal.cramps": { zh: "經期不適", en: "Period discomfort" },
  "intake.goal.energy": { zh: "精力", en: "Energy" },
  "intake.regularity": { zh: "週期規律嗎", en: "Is your cycle regular" },
  "intake.reg.regular": { zh: "規律（每次差不到 7 天）", en: "Regular (varies < 7 days)" },
  "intake.reg.somewhat": { zh: "有時不規律", en: "Sometimes irregular" },
  "intake.reg.irregular": { zh: "很不規律", en: "Very irregular" },
  "intake.reg.unsure": { zh: "不確定", en: "Not sure" },
  "intake.history": { zh: "週期與病史摘要", en: "Cycle & medical history" },
  "intake.historyPh": { zh: "例：經痛、多囊性卵巢、子宮內膜異位、甲狀腺、手術史…", en: "e.g. painful periods, PCOS, endometriosis, thyroid, surgeries…" },
  "intake.meds": { zh: "用藥與補充品", en: "Medications & supplements" },
  "intake.medsPh": { zh: "例：鐵劑、口服避孕藥、甲狀腺藥、益生菌…", en: "e.g. iron, the pill, thyroid medication, probiotics…" },
  "intake.diet": { zh: "飲食型態", en: "Eating pattern" },
  "intake.diet.omnivore": { zh: "一般雜食", en: "Omnivore" },
  "intake.diet.vegetarian": { zh: "蛋奶素", en: "Vegetarian" },
  "intake.diet.vegan": { zh: "全素", en: "Vegan" },
  "intake.diet.lowcarb": { zh: "低碳／生酮", en: "Low-carb / keto" },
  "intake.diet.other": { zh: "其他", en: "Other" },
  "intake.contra": { zh: "禁忌事項（有的請勾選）", en: "Contraindications (tick any that apply)" },
  "intake.contra.ed": { zh: "進食障礙史", en: "History of eating disorder" },
  "intake.contra.pregnant": { zh: "懷孕中", en: "Pregnant" },
  "intake.contra.breastfeeding": { zh: "哺乳中", en: "Breastfeeding" },
  "intake.contra.underweight": { zh: "體重過輕", en: "Underweight" },
  "intake.contra.diabetes": { zh: "糖尿病或血糖用藥", en: "Diabetes or glucose medication" },
  "intake.contra.minor": { zh: "未滿 18 歲", en: "Under 18" },
  "intake.contra.doctor": { zh: "醫囑限制飲食", en: "Doctor-advised diet restriction" },
  "intake.doctorNote": { zh: "醫囑內容（選填）", en: "Doctor's instructions (optional)" },
  "intake.notes": { zh: "其他想讓顧問知道的事", en: "Anything else for the consultant" },
  "intake.save": { zh: "儲存在這支手機", en: "Save on this phone" },
  "intake.edit": { zh: "修改", en: "Edit" },
  "intake.delete": { zh: "刪除問卷", en: "Delete" },
  "intake.deleteConfirm": { zh: "確定刪除整份問卷？刪除後無法復原。", en: "Delete the whole intake? This can't be undone." },
  "intake.deleteYes": { zh: "確定刪除", en: "Delete" },
  "intake.empty": { zh: "還沒填寫。填了之後，產生諮詢摘要時可以自己選擇要附上哪些。", en: "Not filled in yet. Once filled, you choose what to include in a consult summary." },
  "intake.start": { zh: "開始填寫", en: "Start" },
  "intake.updated": { zh: "最後更新：{d}", en: "Last updated: {d}" },
  "intake.contraActive": {
    zh: "你勾選了禁忌事項，超過 16 小時的個人斷食目標不會顯示。",
    en: "You ticked a contraindication, so personal fasting goals above 16h won't be shown.",
  },
  "summary.title": { zh: "產生諮詢摘要", en: "Create a consult summary" },
  "summary.desc": {
    zh: "勾選要分享的內容，產生一份文字摘要。摘要只出現在你的手機上；要不要複製、下載、交給顧問，由你決定。",
    en: "Tick what to share and generate a text summary. It stays on your phone; you decide whether to copy, download or hand it to a consultant.",
  },
  "summary.field.cycle": { zh: "週期資料（月經日期、週期長度、推估日期）", en: "Cycle data (period date, cycle length, estimates)" },
  "summary.field.goals": { zh: "想照顧的方向", en: "Goals" },
  "summary.field.history": { zh: "週期與病史摘要", en: "Cycle & medical history" },
  "summary.field.meds": { zh: "用藥與補充品", en: "Medications & supplements" },
  "summary.field.diet": { zh: "飲食型態", en: "Eating pattern" },
  "summary.field.contra": { zh: "禁忌事項", en: "Contraindications" },
  "summary.field.notes": { zh: "其他補充", en: "Other notes" },
  "summary.field.logs": { zh: "近 4 週記錄（斷食、體溫、分泌物）", en: "Last 4 weeks of logs (fasting, temperature, mucus)" },
  "summary.generate": { zh: "產生摘要", en: "Generate" },
  "summary.copy": { zh: "複製", en: "Copy" },
  "summary.copied": { zh: "✓ 已複製", en: "✓ Copied" },
  "summary.download": { zh: "下載 .txt", en: "Download .txt" },
  "summary.header": { zh: "Moonyou 諮詢摘要", en: "Moonyou consult summary" },
  "summary.generatedAt": { zh: "產生日期", en: "Generated" },
  "summary.sep": { zh: "、", en: ", " },
  "summary.none": { zh: "（未填寫）", en: "(not filled in)" },
  "summary.cycleLine1": { zh: "月經第一天：{start}・平均週期：{len} 天", en: "Period start: {start} · Average cycle: {len} days" },
  "summary.cycleLine2": { zh: "今天：週期第 {day} 天（{phase}）", en: "Today: cycle day {day} ({phase})" },
  "summary.cycleLine3": {
    zh: "推估排卵日：{ov}・推估易受孕期：{win}・推估下次月經：{next}",
    en: "Est. ovulation: {ov} · Est. fertile window: {win} · Est. next period: {next}",
  },
  "summary.cycleEstimate": { zh: "（以上推估日期皆為日曆法計算）", en: "(all estimated dates use the calendar method)" },
  "summary.logsFast": { zh: "斷食記錄 {n} 天，平均 {avg} 小時，最長 {max} 小時", en: "Fasting logged on {n} days, avg {avg}h, longest {max}h" },
  "summary.logsFastNone": { zh: "沒有斷食記錄", en: "No fasting logged" },
  "summary.logsBbt": { zh: "基礎體溫 {n} 筆，{min}–{max}°C", en: "{n} temperature readings, {min}–{max}°C" },
  "summary.logsMucus": { zh: "分泌物：蛋清狀 {e} 天、黏稠 {s} 天、水狀 {w} 天", en: "Mucus: egg-white {e} days, sticky {s}, watery {w}" },
  "summary.footer": {
    zh: "此摘要由使用者自行產生並決定是否分享；Moonyou 不會上傳任何資料。",
    en: "Generated by the user, who decides whether to share it; Moonyou uploads nothing.",
  },
  "booking.scopeTitle": { zh: "顧問的服務範圍", en: "What the consultant does" },
  "booking.scopeDo": {
    zh: "可以協助：釐清妳想改變的事、一起設定小目標、建立習慣、回顧進度；也可以幫妳整理資訊，帶去跟醫師討論。",
    en: "Can help with: clarifying what you want to change, setting small goals together, building habits, reviewing progress, and organising information to discuss with your doctor.",
  },
  "booking.scopeDont": {
    zh: "不提供：醫療診斷、開藥或停藥建議、餐單或飲食處方、補充品或劑量建議、懷孕與急症處理、進食障礙治療。有慢性病或正在服藥的人，請同時維持醫師的照護。",
    en: "Does not provide: medical diagnosis, prescribing or stopping medication, meal plans or diet prescriptions, supplement or dose advice, pregnancy or emergency care, eating-disorder treatment. If you have a chronic condition or take medication, stay under your doctor's care too.",
  },
  "booking.notDiagnosis": { zh: "這不是醫療診斷。", en: "This is not a medical diagnosis." },
  "booking.attach": {
    zh: "附上我的諮詢摘要（會先複製到剪貼簿，到預約頁面貼上即可）",
    en: "Attach my consult summary (it's copied to your clipboard — paste it on the booking page)",
  },
  "booking.attachFields": { zh: "會包含：{list}（可在上方「產生諮詢摘要」調整）", en: "Includes: {list} (change this under \"Create a consult summary\" above)" },
  "booking.external": {
    zh: "預約頁面由第三方服務提供，你在那裡填寫的內容依該服務的隱私政策處理。",
    en: "The booking page is run by a third-party service; what you enter there is handled under its privacy policy.",
  },
  "booking.continue": { zh: "前往預約", en: "Continue to booking" },
  "booking.cancel": { zh: "取消", en: "Cancel" },
  "booking.notReady": { zh: "線上預約還沒開放，預約連結設定好之後這裡就能用。", en: "Online booking isn't open yet; this will work once the booking link is set up." },
  "booking.copiedOpen": { zh: "摘要已複製。預約頁面在新分頁開啟，貼到備註欄即可。", en: "Summary copied. The booking page opened in a new tab — paste it into the notes field." },
  "booking.opened": { zh: "預約頁面已在新分頁開啟。", en: "The booking page opened in a new tab." },

  // ── Literature references & the Scientific basis page ──
  "refTopic.ovulation": { zh: "排卵時間與易孕窗", en: "Ovulation timing & the fertile window" },
  "refTopic.fam_efficacy": { zh: "日曆法與生育意識法效力", en: "Effectiveness of calendar & fertility-awareness methods" },
  "refTopic.bbt_mucus": { zh: "基礎體溫與子宮頸黏液訊號", en: "Basal body temperature & cervical mucus" },
  "refTopic.app_accuracy": { zh: "週期與生育 App 的準確度與宣稱", en: "Accuracy & claims of cycle and fertility apps" },
  "refTopic.fasting": { zh: "斷食、時間限制飲食與生殖荷爾蒙", en: "Fasting, time-restricted eating & reproductive hormones" },
  "refTopic.iron": { zh: "鐵需求、月經與缺鐵", en: "Iron needs, menstruation & iron deficiency" },
  "refTopic.personal_nutrition": { zh: "個人化營養反應", en: "Personalised nutrition responses" },
  "refTopic.gut": { zh: "腸道菌相、飲食與雌激素軸", en: "Gut microbiome, diet & the estrogen axis" },
  "refTopic.sleep_mood": { zh: "週期與睡眠、情緒、PMS／PMDD、運動", en: "Cycle, sleep, mood, PMS/PMDD & exercise" },
  "refTopic.taiwan_regulation": { zh: "臺灣健康 App 與廣告宣稱指引", en: "Taiwan guidance on health apps & advertising claims" },
  "science.title": { zh: "科學依據", en: "Scientific basis" },
  "science.intro": {
    zh: "這裡列出 Moonyou 文案所依據的 {n} 筆文獻，依主題分組。每一筆都經 PubMed、DOI 或官方頁面核實；摘要用我們自己的話寫，細節請以原文為準。",
    en: "These are the {n} sources Moonyou's text draws on, grouped by topic. Each was checked against PubMed, its DOI or the official page; for details, rely on the original.",
  },
  "science.notAdvice": {
    zh: "文獻支持的是研究發現，不代表 Moonyou 能診斷、治療或避孕。",
    en: "These sources support research findings; they do not mean Moonyou can diagnose, treat or prevent pregnancy.",
  },
  "science.summaryZhOnly": { zh: "（一句話摘要目前只有中文版）", en: "One-line summaries are only available in Chinese for now." },
  "science.open": { zh: "科學依據 →", en: "Scientific basis →" },
  "science.viewAll": { zh: "查看全部科學依據 →", en: "See all sources →" },
  "science.back": { zh: "← 返回", en: "← Back" },

  // ── Reference rhythm, personal goals, long-log safety, first-run setup ──
  myGoal: { zh: "我的目標", en: "My goal" },
  myGoalNote: { zh: "（妳自己設定的，不是 app 的建議）", en: "(your own setting, not the app's advice)" },
  goalsTitle: { zh: "我的個人斷食目標（選填）", en: "My personal fasting goals (optional)" },
  goalsDesc: {
    zh: "參考節奏是給大家的一般參考，最多 16 小時。如果妳有自己的節奏，可以依階段設定目標；這是妳自己的設定，不是 app 的建議。留空就不顯示。",
    en: "The reference rhythm is general guidance for everyone, at most 16h. If you have your own rhythm, set a goal per phase; it's your own setting, not the app's advice. Leave blank to hide.",
  },
  "goalPhase.menstrual": { zh: "月經期", en: "Menstrual" },
  "goalPhase.follicular": { zh: "濾泡期", en: "Follicular" },
  "goalPhase.ovulation": { zh: "推估易受孕期", en: "Est. fertile window" },
  "goalPhase.luteal": { zh: "黃體期", en: "Luteal" },
  goalsCheckIntro: { zh: "有目標超過 16 小時，請逐項確認：", en: "A goal is above 16h. Please confirm each item:" },
  goalsCheckNone: { zh: "我沒有：{x}", en: "This doesn't apply to me: {x}" },
  "goalCheck.pregnant": { zh: "懷孕或正在備孕", en: "pregnant or trying to conceive" },
  "goalCheck.breastfeeding": { zh: "哺乳中", en: "breastfeeding" },
  "goalCheck.ed": { zh: "進食障礙史", en: "history of an eating disorder" },
  "goalCheck.underweight": { zh: "體重過輕", en: "underweight" },
  "goalCheck.diabetes": { zh: "糖尿病或正在服藥", en: "diabetes or taking medication" },
  "goalCheck.minor": { zh: "未滿 18 歲", en: "under 18" },
  "goalCheck.organ": { zh: "肝腎疾病或正在接受癌症治療", en: "liver or kidney disease, or in cancer treatment" },
  goalsLongActive: { zh: "✓ 超過 16 小時的目標會顯示，標示為妳自己的設定。", en: "✓ Goals above 16h will show, labelled as your own setting." },
  goalsLongPending: { zh: "全部確認後，超過 16 小時的目標才會顯示。", en: "Goals above 16h show only after every item is confirmed." },
  goalsBlockedConceive: { zh: "備孕模式開啟中，超過 16 小時的目標不會顯示。", en: "Conception mode is on, so goals above 16h are hidden." },
  goalsBlockedIntake: { zh: "健康問卷勾選了禁忌事項，超過 16 小時的目標不會顯示。", en: "Your health intake lists a contraindication, so goals above 16h are hidden." },
  "longLog.title": { zh: "長時間斷食的安全提醒", en: "Safety note for long fasts" },
  "longLog.body24": {
    zh: "記得補充水分與電解質（鈉、鉀、鎂）。結束時慢慢復食，先從少量、好消化的食物開始。出現頭暈、心悸、極度疲倦或意識混亂，就停止並就醫。",
    en: "Keep up fluids and electrolytes (sodium, potassium, magnesium). Break the fast gradually, starting with small, easy-to-digest food. If you feel dizzy, have palpitations, extreme fatigue or confusion, stop and seek medical care.",
  },
  "longLog.body72": { zh: "72 小時以上的斷食研究，幾乎都在醫療監督下進行。", en: "Studies of fasts of 72h or more were almost all done under medical supervision." },
  loggedDays: { zh: "記錄 {n} 天", en: "{n} days logged" },
  "consult.fastLogged": { zh: "這週妳記錄了 {n} 天，平均 {avg} 小時。", en: "This week you logged {n} days, averaging {avg}h." },
  "setup.title": { zh: "先告訴 Moonyou 妳的月經第一天", en: "First, tell Moonyou the first day of your period" },
  "setup.body": {
    zh: "輸入最近一次月經的第一天後，Moonyou 才會開始推估週期階段。在那之前，不會顯示任何推估。",
    en: "Moonyou starts estimating cycle phases once you enter the first day of your most recent period. Until then, no estimates are shown.",
  },
  "setup.note": { zh: "週期長度預設 28 天，可以在「設定」調整。", en: "Cycle length defaults to 28 days; adjust it in Settings." },
  "setup.pick": { zh: "點選設定日期", en: "Tap to set a date" },

  // ── Consult credentials, moon note ──
  "consult.credentialLabel": { zh: "諮詢者資格", en: "Consultant credentials" },
  "guide.moonNote": {
    zh: "月相、星象與塔羅都是陪伴與覺察的工具，不是健康建議。",
    en: "Moon phases, astrology and tarot are tools for reflection and company, not health advice.",
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
