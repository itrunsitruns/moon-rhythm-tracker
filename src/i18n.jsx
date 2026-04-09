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
  moonPhase: { zh: "月相", en: "Moon phase" },
  fastingAdvice: { zh: "斷食建議", en: "Fasting advice" },
  pregnancyRisk: { zh: "懷孕風險", en: "Pregnancy risk" },
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
  syncToGCal: { zh: "同步到 Google Calendar", en: "Sync to Google Calendar" },
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
