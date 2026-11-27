import { useState, useCallback, useMemo, useEffect, useContext, createContext } from "react";
import useLocalStorage from "./useLocalStorage";
import { useLang } from "./i18n";
import { syncToGoogleCalendar, downloadICS } from "./googleCalendar";
import { getVedicPositions } from "./astrology";
import { getDailyDraw, getPersonalSeed } from "./tarot";
import { ReferenceBlock, ScienceEntry, SciencePage, ScienceNavContext, REF_GROUPS } from "./Reference";
import FertilityNotice from "./FertilityNotice";
import { IntakeCard, SummaryCard, BookingCard, buildSummary, intakeHasContra, DEFAULT_SUMMARY_FIELDS } from "./Intake";

// Fasting is shown as a *reference rhythm* (max 16h) for everyone. Anything
// longer only exists as the user's own per-phase goal (Settings), and goals
// above 16h only show after every contraindication is confirmed absent and
// nothing rules them out (conception mode, intake contraindications).
// goalFor(phase) → the user's own goal in hours for that phase, or null.
const PrefsContext = createContext({ goalFor: () => null });
const GOAL_PHASES = ["menstrual", "follicular", "ovulation", "luteal"];
const GOAL_CHECKS = ["pregnant", "breastfeeding", "ed", "underweight", "diabetes", "minor", "organ"];

// ── Phase configuration ──
const PHASE_CONFIG = {
  menstrual:       { color: "#8B1A1A", bg: "#2A0A0A" },
  follicular_gold: { color: "#D4A017", bg: "#1A1400" },
  follicular_late: { color: "#D4A017", bg: "#1A1400" },
  ovulation:       { color: "#FF6B6B", bg: "#1A0505" },
  luteal:          { color: "#7B68AE", bg: "#0D0A14" },
  safe:            { color: "#4A9E8E", bg: "#051210" },
};

// ── Real moon phase ──
const MOON_EMOJIS = ["🌑", "🌒", "🌓", "🌔", "🌕", "🌖", "🌗", "🌘"];
const KNOWN_NEW_MOON = new Date(2000, 0, 6).getTime();
const LUNAR_CYCLE = 29.53059;

function getMoonPhase(date, t) {
  const diffDays = (date.getTime() - KNOWN_NEW_MOON) / 86400000;
  const moonAge = ((diffDays % LUNAR_CYCLE) + LUNAR_CYCLE) % LUNAR_CYCLE;
  const idx = Math.floor((moonAge / LUNAR_CYCLE) * 8) % 8;
  return { emoji: MOON_EMOJIS[idx], name: t(`moon.${idx}`) };
}

// ── Chinese lunar calendar date (農曆), via the runtime's built-in chinese calendar ──
const LUNAR_MONTHS = ["正月","二月","三月","四月","五月","六月","七月","八月","九月","十月","十一月","十二月"];
const LUNAR_DAYS = ["初一","初二","初三","初四","初五","初六","初七","初八","初九","初十",
  "十一","十二","十三","十四","十五","十六","十七","十八","十九","二十",
  "廿一","廿二","廿三","廿四","廿五","廿六","廿七","廿八","廿九","三十"];
let _lunarFmt = null;
function lunarLabel(date, lang) {
  try {
    if (!_lunarFmt) _lunarFmt = new Intl.DateTimeFormat("zh-TW-u-ca-chinese", { month: "numeric", day: "numeric" });
    const parts = _lunarFmt.formatToParts(date);
    const mRaw = parts.find(p => p.type === "month")?.value ?? "";
    const dRaw = parts.find(p => p.type === "day")?.value ?? "";
    const leap = /閏|bis/.test(mRaw);
    const m = parseInt(mRaw.replace(/\D/g, ""), 10), d = parseInt(dRaw, 10);
    if (!m || !d) return "";
    if (lang === "en") return `Lunar ${leap ? "leap " : ""}${m}/${d}`;
    return `農曆${leap ? "閏" : ""}${LUNAR_MONTHS[m - 1] ?? m + "月"}${LUNAR_DAYS[d - 1] ?? d}`;
  } catch { return ""; }
}

// ── Reference rhythm by phase (general reference, never above 16h) ──
function phaseDefaultHours(phase) {
  if (phase === "follicular_gold" || phase === "follicular_late") return 16;
  return 12;
}

// Checks the estimated fertile window before the follicular days, matching getPhase.
function getFastingAdvice(cycleDay, cycleLen, t) {
  const ovDay = cycleLen - 14;
  if (cycleDay <= 5) return { fast: t("fast.menstrual"), tip: t("tip.menstrual"), defaultH: 12 };
  if (cycleDay >= ovDay - 5 && cycleDay <= ovDay + 1) return { fast: t("fast.ovulation"), tip: t("tip.ovulation"), defaultH: 12 };
  if (cycleDay <= 10) return { fast: t("fast.follicular_gold"), tip: t("tip.follicular_gold"), defaultH: 16 };
  if (cycleDay < ovDay - 5) return { fast: t("fast.follicular_late"), tip: t("tip.follicular_late"), defaultH: 16 };
  return { fast: t("fast.luteal"), tip: t("tip.luteal"), defaultH: 12 };
}

// ── Utilities ──
function addDays(date, n) { const d = new Date(date); d.setDate(d.getDate() + n); return d; }
// Whole calendar days from a to b. Both are snapped to local midnight first;
// rounding raw milliseconds made every afternoon count as the next day.
function dayStart(d) { const x = new Date(d); x.setHours(0, 0, 0, 0); return x; }
function daysBetween(a, b) { return Math.round((dayStart(b) - dayStart(a)) / 86400000); }
function fmt(d) { return `${d.getMonth() + 1}/${d.getDate()}`; }
function isoDate(d) { return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`; }
function parseLocal(s) { const [y, m, d] = s.split("-").map(Number); return new Date(y, m - 1, d); }

function getPhase(date, periodStart, cycleLen) {
  const start = new Date(periodStart);
  const diff = daysBetween(start, date);
  if (diff < 0) return "safe";
  const day = (diff % cycleLen) + 1;
  const ovDay = cycleLen - 14;
  if (day <= 5) return "menstrual";
  if (day >= ovDay - 5 && day <= ovDay + 1) return "ovulation";
  if (day <= 10) return "follicular_gold";
  if (day < ovDay - 5) return "follicular_late";
  if (day > ovDay + 1) return "luteal";
  return "safe";
}

function getCycleDay(date, periodStart, cycleLen) {
  const start = new Date(periodStart);
  const diff = daysBetween(start, date);
  if (diff < 0) return null;
  return (diff % cycleLen) + 1;
}

// Start date of the cycle that contains `date` (falls back to periodStart before tracking began)
function getCycleStart(date, periodStart, cycleLen) {
  const start = new Date(periodStart);
  const diff = daysBetween(start, date);
  if (diff < 0) return start;
  return addDays(start, Math.floor(diff / cycleLen) * cycleLen);
}
// Walk backwards from cycle day `day` to find the phase that came before this one
function getPrevPhase(day, periodStart, cycleLen) {
  const cur = getPhase(addDays(periodStart, day - 1), periodStart, cycleLen);
  for (let k = 1; k < cycleLen; k++) {
    const d = ((day - 1 - k) % cycleLen + cycleLen) % cycleLen;
    const ph = getPhase(addDays(periodStart, d), periodStart, cycleLen);
    if (ph !== cur) return ph;
  }
  return null;
}
// Calendar-method estimate, deliberately coarse (no percentages):
// "high" inside the estimated fertile window (5 days before → 1 day after the
// estimated ovulation day), "low" outside it, "none" before tracking began.
function getFertilityLevel(date, periodStart, cycleLen) {
  const day = getCycleDay(date, periodStart, cycleLen);
  if (!day) return "none";
  const ovDay = cycleLen - 14;
  return day >= ovDay - 5 && day <= ovDay + 1 ? "high" : "low";
}

// ── Ovulation reference signals from BBT/mucus ──
// Reference only, never "detected ovulation": egg-white mucus tends to appear
// in the days before ovulation; a raised temperature usually only after it.
function detectOvulationSignals(logs) {
  const out = {};
  Object.entries(logs).forEach(([dateKey, log]) => {
    const mucus = log.mucus === "eggwhite";
    const bbt = !!(log.bbt && log.bbt > 36.7);
    if (mucus || bbt) out[dateKey] = { mucus, bbt };
  });
  return out;
}

// ── Goal flags ──
function useGoalFlags(goals) {
  const g = new Set(goals);
  return {
    hasFasting: g.has("fasting"), hasAvoid: g.has("avoid"), hasConceive: g.has("conceive"),
    showFasting: g.has("fasting"), showFertility: g.has("avoid") || g.has("conceive"),
    showAvoidWarn: g.has("avoid"), showConceive: g.has("conceive"), showFastingLog: g.has("fasting"),
  };
}

function resolvePhaseLabel(phase, flags, t) {
  if (phase === "ovulation" && flags.hasFasting && flags.hasConceive) return t("phase.ovulation.fastConceive");
  if (phase === "ovulation" && flags.hasConceive) return t("phase.ovulation.conceive");
  return t(`phase.${phase}`);
}
function resolvePhaseDesc(phase, flags, t) {
  if (phase === "ovulation" && flags.hasFasting && flags.hasConceive) return t("desc.ovulation.fastConceive");
  if (phase === "ovulation" && flags.hasConceive) return t("desc.ovulation.conceive");
  return t(`desc.${phase}`);
}

// ── Fasting statistics helpers ──
function getWeekRange(date) {
  const d = new Date(date);
  const day = d.getDay();
  const mon = new Date(d); mon.setDate(d.getDate() - ((day + 6) % 7));
  const sun = new Date(mon); sun.setDate(mon.getDate() + 6);
  return { start: isoDate(mon), end: isoDate(sun) };
}

function computeStats(logs, t) {
  const today = new Date();
  const todayKey = isoDate(today);

  // This week
  const week = getWeekRange(today);
  let weekTotal = 0, weekDays = 0;
  for (let d = parseLocal(week.start); isoDate(d) <= week.end && isoDate(d) <= todayKey; d = addDays(d, 1)) {
    const log = logs[isoDate(d)];
    if (log && log.hours) { weekTotal += log.hours; weekDays++; }
  }

  // This month
  const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
  const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0);
  let monthTotal = 0, monthDays = 0;
  for (let d = new Date(monthStart); d <= monthEnd && d <= today; d = addDays(d, 1)) {
    const log = logs[isoDate(d)];
    if (log && log.hours) { monthTotal += log.hours; monthDays++; }
  }

  // Past 4 weeks bar chart
  const weeks = [];
  for (let w = 3; w >= 0; w--) {
    const refDate = addDays(today, -w * 7);
    const wr = getWeekRange(refDate);
    let total = 0;
    for (let d = parseLocal(wr.start); isoDate(d) <= wr.end; d = addDays(d, 1)) {
      const log = logs[isoDate(d)];
      if (log && log.hours) total += log.hours;
    }
    weeks.push({ label: t("weekLabel", { n: 4 - w }), total });
  }

  // No score against a target: just how much was logged.
  return {
    weekTotal, weekDays, weekAvg: weekDays > 0 ? (weekTotal / weekDays).toFixed(1) : 0,
    monthTotal, monthDays,
    weeks, maxWeek: Math.max(...weeks.map(w => w.total), 1),
  };
}

// ══════════════════════════════════
// ── Moon disc component ──
// ══════════════════════════════════
function MoonDisc({ cycleStart, cycleLen, today, flags, selectedDay, onSelectDay }) {
  const { t } = useLang();
  const segments = [];
  const cx = 150, cy = 150, r = 120;
  const todayKey = isoDate(today);
  const todayDay = getCycleDay(today, cycleStart, cycleLen);
  const focusDay = selectedDay || todayDay;
  let selectedSeg = null;
  for (let i = 0; i < cycleLen; i++) {
    const date = addDays(cycleStart, i);
    const phase = getPhase(date, cycleStart, cycleLen);
    const cfg = PHASE_CONFIG[phase];
    const a1 = (i / cycleLen) * 360 - 90, a2 = ((i + 1) / cycleLen) * 360 - 90;
    const r1 = (a1 * Math.PI) / 180, r2 = (a2 * Math.PI) / 180;
    const isToday = isoDate(date) === todayKey;
    const isSel = selectedDay === i + 1 && !isToday;
    const mid = ((a1 + a2) / 2) * Math.PI / 180;
    const pop = isSel ? 10 : 0;
    const seg = (
      <path key={i}
        d={`M${cx},${cy} L${cx + r * Math.cos(r1)},${cy + r * Math.sin(r1)} A${r},${r} 0 ${a2 - a1 > 180 ? 1 : 0} 1 ${cx + r * Math.cos(r2)},${cy + r * Math.sin(r2)} Z`}
        transform={pop ? `translate(${pop * Math.cos(mid)},${pop * Math.sin(mid)})` : undefined}
        fill={cfg.color} opacity={isToday || isSel ? 1 : 0.55}
        stroke={isToday ? "#fff" : isSel ? "#FFD24A" : "#000"} strokeWidth={isToday ? 2.5 : isSel ? 2 : 0.5}
        style={{ cursor: "pointer", transition: "transform .15s, opacity .15s" }}
        onClick={() => onSelectDay && onSelectDay(i + 1)} />
    );
    if (isSel) selectedSeg = seg; else segments.push(seg);
  }
  if (selectedSeg) segments.push(selectedSeg); // draw the popped wedge on top
  const focusDate = addDays(cycleStart, (focusDay || 1) - 1);
  const focusPhase = getPhase(focusDate, cycleStart, cycleLen);
  const focusMoon = getMoonPhase(focusDate, t);
  const fa = focusDay ? getFastingAdvice(focusDay, cycleLen, t) : { fast: "—" };
  const isExploring = selectedDay && selectedDay !== todayDay;
  return (
    <svg viewBox="0 0 300 300" style={{ width: "100%", maxWidth: 300, overflow: "visible" }}>
      {segments}
      <circle cx={cx} cy={cy} r={48} fill="#0A0A0F" stroke={isExploring ? "#FFD24A55" : "none"} strokeWidth={1} />
      <text x={cx} y={cy - 14} textAnchor="middle" fill="#ddd" fontSize="22">{focusMoon.emoji}</text>
      <text x={cx} y={cy + 4} textAnchor="middle" fill={isExploring ? "#FFD24A" : "#ccc"} fontSize="10" fontFamily="monospace">{resolvePhaseLabel(focusPhase, flags, t)}</text>
      <text x={cx} y={cy + 17} textAnchor="middle" fill="#888" fontSize="8" fontFamily="monospace">
        {isExploring ? `${t("day", { n: focusDay })} · ${fmt(focusDate)}` : (flags.showFasting ? fa.fast : t("today"))}
      </text>
      {isExploring && flags.showFasting && <text x={cx} y={cy + 29} textAnchor="middle" fill="#777" fontSize="7" fontFamily="monospace">{fa.fast}</text>}
    </svg>
  );
}

// ══════════════════════════════════
// ── Fasting Stats Section ──
// ══════════════════════════════════
function FastingStats({ logs, periodStart, cycleLen }) {
  const { t } = useLang();
  const stats = useMemo(() => computeStats(logs, t), [logs, t]);
  const hasData = stats.weekTotal > 0 || stats.monthTotal > 0;

  return (
    <div style={{ background: "#111118", borderRadius: 12, padding: 16, marginBottom: 12 }}>
      <div style={{ fontSize: 14, color: "#ccc", marginBottom: 12, fontFamily: "serif" }}>{t("statsTitle")}</div>

      {!hasData ? (
        <div style={{ fontSize: 12, color: "#8a8a8a", fontFamily: "monospace", textAlign: "center", padding: 12 }}>{t("noData")}</div>
      ) : (
        <>
          {/* Week & Month row */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 14 }}>
            <div style={{ background: "#0A0A0F", borderRadius: 8, padding: 10 }}>
              <div style={{ fontSize: 10, color: "#666", fontFamily: "monospace" }}>{t("thisWeek")}</div>
              <div style={{ fontSize: 18, color: "#D4A017", fontFamily: "monospace" }}>{stats.weekTotal}h</div>
              <div style={{ fontSize: 10, color: "#8a8a8a", fontFamily: "monospace" }}>{t("avgPerDay")} {stats.weekAvg}h</div>
            </div>
            <div style={{ background: "#0A0A0F", borderRadius: 8, padding: 10 }}>
              <div style={{ fontSize: 10, color: "#666", fontFamily: "monospace" }}>{t("thisMonth")}</div>
              <div style={{ fontSize: 18, color: "#4A9E8E", fontFamily: "monospace" }}>{stats.monthTotal}h</div>
              <div style={{ fontSize: 10, color: "#8a8a8a", fontFamily: "monospace" }}>{t("loggedDays", { n: stats.monthDays })}</div>
            </div>
          </div>

          {/* Weekly bar chart */}
          <div style={{ fontSize: 10, color: "#666", fontFamily: "monospace", marginBottom: 6 }}>{t("weeklyChart")}</div>
          <div style={{ display: "flex", alignItems: "flex-end", gap: 6, height: 60 }}>
            {stats.weeks.map((w, i) => (
              <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
                <div style={{ fontSize: 9, color: "#888", fontFamily: "monospace" }}>{w.total > 0 ? `${w.total}h` : ""}</div>
                <div style={{
                  width: "100%", borderRadius: 3,
                  height: Math.max(4, (w.total / stats.maxWeek) * 44),
                  background: i === 3 ? "#D4A017" : "#D4A01755",
                  transition: "height 0.3s",
                }} />
                <div style={{ fontSize: 8, color: "#8a8a8a", fontFamily: "monospace" }}>{w.label}</div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// ══════════════════════════════════
// ── Vedic astrology card (Sun / Moon / Mercury) ──
// ══════════════════════════════════
function AstroCard() {
  const { t } = useLang();
  const pos = useMemo(() => {
    try { return getVedicPositions(new Date()); } catch { return null; }
  }, []);
  if (!pos) return null;

  const row = (label, body, showMotion) => (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "6px 0", borderBottom: "1px solid #ffffff08" }}>
      <span style={{ fontSize: 12, color: "#888", fontFamily: "monospace" }}>{label}</span>
      <span style={{ fontSize: 13, color: "#cfc6ea" }}>
        <span style={{ fontSize: 15, marginRight: 4 }}>{body.glyph}</span>
        {t(`sign.${body.key}`)}
        {showMotion && (
          <span style={{ fontSize: 10, fontFamily: "monospace", marginLeft: 6,
            color: body.motion === "retro" ? "#FF6B6B" : body.motion === "station" ? "#E8C45A" : "#4A9E8E" }}>
            {body.motion === "retro"
              ? `℞ ${t("astroRetro")}`
              : body.motion === "station"
                ? `${t("astroStation")}${body.turning === "retro" ? " · " + t("astroTurningRetro") : body.turning === "direct" ? " · " + t("astroTurningDirect") : ""}`
                : t("astroDirect")}
          </span>
        )}
      </span>
    </div>
  );

  return (
    <div style={{ background: "linear-gradient(160deg, #120F1C 0%, #111118 70%)", border: "1px solid #7B68AE44", borderRadius: 12, padding: 16, marginBottom: 12 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
        <span style={{ fontSize: 14, color: "#9d8cd4", fontFamily: "serif" }}>✦ {t("astroTitle")}</span>
        <span style={{ fontSize: 9, color: "#9d8cd4", border: "1px solid #7B68AE66", borderRadius: 4, padding: "1px 6px", fontFamily: "monospace" }}>{t("astroSystem")}</span>
      </div>
      {row(t("astroSun"), pos.sun, false)}
      {row(t("astroMoon"), pos.moon, false)}
      {row(t("astroMercury"), pos.mercury, true)}
      <div style={{ fontSize: 10, color: "#9a91b8", fontFamily: "monospace", lineHeight: 1.6, marginTop: 8 }}>{t("astroNote")}</div>
    </div>
  );
}

// ══════════════════════════════════
// ── Daily Tarot card ──
// ══════════════════════════════════
function TarotCard() {
  const { t, lang } = useLang();
  const [seed] = useState(getPersonalSeed);
  const draw = useMemo(() => getDailyDraw(new Date(), seed), [seed]);
  const [revealedDay, setRevealedDay] = useLocalStorage("moon-tarotRevealed", "");
  const revealed = revealedDay === draw.dayKey;

  const card = draw.card;
  const name = lang === "zh" ? card.zh : card.en;
  // Always upright. Both facets are shown together — light and shadow coexist.
  const lightText = lang === "zh" ? card.up_zh : card.up_en;
  const shadowText = lang === "zh" ? card.rv_zh : card.rv_en;

  const cardFace = (faceUp) => (
    <div style={{
      width: 132, height: 210, borderRadius: 12, flexShrink: 0,
      background: faceUp ? "linear-gradient(160deg, #1A1530 0%, #0E0B1A 100%)" : "linear-gradient(160deg, #15131F 0%, #0A0A0F 100%)",
      border: "1.5px solid #D4A01788", boxShadow: "0 6px 24px #00000055",
      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
      position: "relative", overflow: "hidden", cursor: faceUp ? "default" : "pointer",
    }}>
      {faceUp ? (
        <>
          <span style={{ position: "absolute", top: 8, left: 10, fontSize: 11, color: "#D4A017", fontFamily: "serif" }}>{card.n}</span>
          <span style={{ position: "absolute", top: 8, right: 10, fontSize: 11, color: "#D4A017" }}>✦</span>
          <span style={{ fontSize: 52, lineHeight: 1 }}>{card.glyph}</span>
          <span style={{ marginTop: 14, fontSize: 14, color: "#e8e0ff", fontFamily: "serif", textAlign: "center", padding: "0 6px" }}>{name}</span>
        </>
      ) : (
        <>
          <span style={{ fontSize: 40, color: "#D4A01766" }}>🌙</span>
          <span style={{ position: "absolute", inset: 8, border: "1px solid #D4A01733", borderRadius: 8 }} />
        </>
      )}
    </div>
  );

  return (
    <div style={{ background: "linear-gradient(160deg, #120F1C 0%, #111118 70%)", border: "1px solid #D4A01744", borderRadius: 12, padding: 16, marginBottom: 12 }}>
      <div style={{ fontSize: 14, color: "#D4A017", fontFamily: "serif", marginBottom: 12 }}>🔮 {t("tarotTitle")}</div>

      {!revealed ? (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
          <div onClick={() => setRevealedDay(draw.dayKey)}>{cardFace(false)}</div>
          <button onClick={() => setRevealedDay(draw.dayKey)} style={{
            padding: "10px 22px", background: "#D4A017", color: "#0A0A0F", border: "none",
            borderRadius: 8, fontFamily: "serif", fontSize: 13, fontWeight: "bold", cursor: "pointer",
          }}>✦ {t("tarotReveal")}</button>
          <div style={{ fontSize: 11, color: "#888", fontFamily: "monospace" }}>{t("tarotHint")}</div>
        </div>
      ) : (
        <div style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
          {cardFace(true)}
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 16, color: "#e8e0ff", fontFamily: "serif", marginBottom: 10 }}>{name}</div>
            {/* Light facet */}
            <div style={{ marginBottom: 10 }}>
              <div style={{ fontSize: 10, fontFamily: "monospace", color: "#E8C45A", marginBottom: 2 }}>☀︎ {t("tarotLight")}</div>
              <div style={{ fontSize: 13, color: "#e6dffb", lineHeight: 1.6 }}>{lightText}</div>
            </div>
            {/* Shadow facet — coexisting */}
            <div>
              <div style={{ fontSize: 10, fontFamily: "monospace", color: "#9d8cd4", marginBottom: 2 }}>☾ {t("tarotShadow")}</div>
              <div style={{ fontSize: 13, color: "#bdb4d6", lineHeight: 1.6 }}>{shadowText}</div>
            </div>
          </div>
        </div>
      )}

      <div style={{ fontSize: 10, color: "#9a91b8", fontFamily: "monospace", lineHeight: 1.6, marginTop: 12 }}>{t("tarotBothNote")}</div>
    </div>
  );
}

// ══════════════════════════════════
// ── Small shared pieces: fertility line, long-fast warning, signal note ──
// ══════════════════════════════════
function FertilityLine({ level }) {
  const { t } = useLang();
  if (level === "none") return null;
  return (
    <div style={{ fontSize: 12, color: "#aaa", marginBottom: 4, lineHeight: 1.6 }}>
      {t("fertilityLabel")}：<span style={{ color: level === "high" ? "#FF6B6B" : "#4A9E8E" }}>{t(`fert.${level}`)}</span>
      <span style={{ fontSize: 10, color: "#666", marginLeft: 6 }}>{t("riskNote")}</span>
    </div>
  );
}

// The user's own goal for this phase, clearly labelled as theirs.
function PersonalGoalLine({ phase }) {
  const { t } = useLang();
  const { goalFor } = useContext(PrefsContext);
  const h = goalFor(phase);
  if (!h) return null;
  return (
    <div style={{ fontSize: 12.5, color: "#cfc8a8", marginTop: 4, lineHeight: 1.6 }}>
      🎯 {t("myGoal")}：<span style={{ color: "#E8C45A", fontWeight: "bold" }}>{h}h</span>
      <span style={{ fontSize: 10.5, color: "#888", marginLeft: 6 }}>{t("myGoalNote")}</span>
    </div>
  );
}

// Safety note for a logged fast of 24h+. Opens fully the first time ever,
// then stays a one-line toggle so it informs without nagging.
function LongLogNote({ hours }) {
  const { t } = useLang();
  const [seen, setSeen] = useLocalStorage("moon-longLogNoticeSeen", false);
  const [open, setOpen] = useState(!seen);
  if (!(Number(hours) >= 24)) return null;
  return (
    <div style={{ marginTop: 8, padding: "8px 10px", border: "1px solid #FFB34744", borderRadius: 8, background: "#1a1408" }}>
      <button type="button" onClick={() => setOpen(o => !o)} aria-expanded={open} style={{
        background: "none", border: "none", padding: 0, cursor: "pointer", width: "100%", textAlign: "left",
        display: "flex", justifyContent: "space-between", color: "#FFB347", fontSize: 12,
      }}>
        <span>⚠️ {t("longLog.title")}</span><span>{open ? "▾" : "▸"}</span>
      </button>
      {open && (
        <div style={{ fontSize: 12, color: "#ddd", lineHeight: 1.7, marginTop: 6 }}>
          {t("longLog.body24")}
          {Number(hours) >= 72 && <div style={{ marginTop: 4, color: "#FFB347" }}>{t("longLog.body72")}</div>}
          {!seen && (
            <button type="button" onClick={() => { setSeen(true); setOpen(false); }} style={{
              marginTop: 8, padding: "6px 12px", background: "transparent", color: "#FFB347",
              border: "1px solid #FFB34766", borderRadius: 6, fontSize: 12, cursor: "pointer",
            }}>{t("pwaDismiss")}</button>
          )}
          <ReferenceBlock topics={REF_GROUPS.fasting} />
        </div>
      )}
    </div>
  );
}

function LongFastWarn() {
  const { t } = useLang();
  return (
    <div style={{ fontSize: 11, color: "#FFB347", lineHeight: 1.6, marginTop: 4, padding: "6px 8px", border: "1px solid #FFB34733", borderRadius: 6 }}>
      ⚠️ {t("longFastWarn")}
    </div>
  );
}

function SignalNote({ sig }) {
  const { t } = useLang();
  if (!sig) return null;
  return (
    <div style={{ fontSize: 12, color: "#FF8B8B", marginBottom: 6, lineHeight: 1.6 }}>
      {t("possibleOvulation")}
      {sig.mucus && <div style={{ color: "#ccc" }}>· {t("signal.mucus")}</div>}
      {sig.bbt && <div style={{ color: "#ccc" }}>· {t("signal.bbt")}</div>}
      <div style={{ color: "#888", fontSize: 11 }}>{t("signal.note")}</div>
    </div>
  );
}

// ══════════════════════════════════
// ── Moonyou＋ Deep Guidance (premium) ──
// ══════════════════════════════════
function deepKey(phase) {
  if (phase === "menstrual") return "menstrual";
  if (phase === "follicular_gold" || phase === "follicular_late") return "follicular";
  if (phase === "ovulation") return "ovulation";
  return "luteal"; // luteal + safe
}

// Which "what the body may show" bucket a cycle day falls in. Anchored to
// ovulation (cycleLen - 14) so it stays sensible for cycles other than 28 days.
function bodyKeyFor(day, cycleLen) {
  if (!day) return null;
  const ov = cycleLen - 14;
  if (day === 1) return "d1";
  if (day === 2) return "d2";
  if (day <= 5 && day < ov - 5) return "d3_5";
  const post = day - ov;
  if (post >= 0) {
    if (day >= cycleLen - 2) return "pre_period";
    if (post === 0) return "ov";
    if (post <= 2) return "post_ov";
    if (post <= 7) return "lut_mid";
    return "lut_late";
  }
  const pre = ov - day;
  if (pre <= 2) return "preov_2";
  if (pre <= 5) return "preov_5";
  return "post_period";
}

function DeepGuidance({ phase, cycleDay, cycleLen, preview, onUnlock }) {
  const { t } = useLang();
  const [open, setOpen] = useState(true);
  const dk = deepKey(phase);
  const rows = [
    ["⏳", t("deep.label.protocol"), t(`deep.${dk}.protocol`)],
    ["🍽️", t("deep.label.eat"), t(`deep.${dk}.eat`)],
    ["🚫", t("deep.label.avoid"), t(`deep.${dk}.avoid`)],
    ["🏃", t("deep.label.move"), t(`deep.${dk}.move`)],
    ["💊", t("deep.label.support"), t(`deep.${dk}.support`)],
    ["🩸", t("deep.label.hormone"), t(`deep.${dk}.hormone`)],
  ];
  const bk = bodyKeyFor(cycleDay, cycleLen);
  if (bk) rows.push(["💧", t("deep.label.body") + (cycleDay ? ` · ${t("day", { n: cycleDay })}` : ""), t(`body.${bk}`) + " " + t("bodyNote")]);

  return (
    <div style={{
      background: "linear-gradient(160deg, #16130A 0%, #111118 70%)",
      border: "1px solid #D4A01755", borderRadius: 12, padding: 16, marginBottom: 12,
      boxShadow: "0 0 0 1px #D4A01711, 0 4px 20px #00000040",
    }}>
      {/* Header */}
      <div onClick={() => setOpen(o => !o)} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", cursor: "pointer" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 15, color: "#D4A017", fontFamily: "serif" }}>✦ {t("deepTitle")}</span>
          <span style={{ fontSize: 9, color: "#0A0A0F", background: "#D4A017", borderRadius: 4, padding: "1px 6px", fontFamily: "monospace", fontWeight: "bold" }}>
            {t("deepPlusTag")}
          </span>
          {preview && (
            <span style={{ fontSize: 9, color: "#D4A017", border: "1px solid #D4A01766", borderRadius: 4, padding: "1px 5px", fontFamily: "monospace" }}>
              {t("deepPreviewBadge")}
            </span>
          )}
        </div>
        <span style={{ color: "#888", fontSize: 12 }}>{open ? "▾" : "▸"}</span>
      </div>

      {open && (
        <div style={{ marginTop: 12, display: "flex", flexDirection: "column", gap: 10 }}>
          {rows.map(([icon, label, body], i) => (
            <div key={i} style={{ display: "flex", gap: 10 }}>
              <div style={{ fontSize: 15, flexShrink: 0, width: 20, textAlign: "center" }}>{icon}</div>
              <div>
                <div style={{ fontSize: 11, color: "#D4A017", fontFamily: "monospace", marginBottom: 2 }}>{label}</div>
                <div style={{ fontSize: 12.5, color: "#cfcfcf", lineHeight: 1.65 }}>{body}</div>
              </div>
            </div>
          ))}

          {/* References: iron, personalised nutrition, gut, sleep/mood/PMS */}
          <ReferenceBlock topics={REF_GROUPS.wellness} style={{ marginTop: 4 }} />
          <div style={{ fontSize: 10, color: "#6a6a7a", fontFamily: "monospace", lineHeight: 1.5 }}>{t("refsNote")}</div>

          {preview && (
            <div style={{ marginTop: 6, borderTop: "1px dashed #D4A01733", paddingTop: 12 }}>
              <div style={{ fontSize: 11, color: "#888", lineHeight: 1.6, marginBottom: 10, fontFamily: "monospace" }}>
                {t("deepPremiumNote")}
              </div>
              <button onClick={onUnlock} style={{
                width: "100%", padding: 11, background: "#D4A017", color: "#0A0A0F",
                border: "none", borderRadius: 8, fontFamily: "serif", fontSize: 13, fontWeight: "bold",
                cursor: "pointer",
              }}>
                ✦ {t("deepUnlockCta")} · {t("plusPrice")}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ══════════════════════════════════
// ── Calendar grid ──
// ══════════════════════════════════
function CalendarGrid({ periodStart, cycleLen, year, month, logs, onSelectDate, selectedDate, flags, ovSignals }) {
  const { t } = useLang();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const startDow = new Date(year, month, 1).getDay();
  const today = new Date();
  const cells = [];
  for (let i = 0; i < startDow; i++) cells.push(<div key={`e${i}`} />);
  for (let d = 1; d <= daysInMonth; d++) {
    const date = new Date(year, month, d);
    const phase = getPhase(date, periodStart, cycleLen);
    const cfg = PHASE_CONFIG[phase];
    const key = isoDate(date);
    const log = logs[key];
    const isToday = isoDate(date) === isoDate(today);
    const isSelected = selectedDate === key;
    const moon = getMoonPhase(date, t);
    const cDay = getCycleDay(date, periodStart, cycleLen);
    const isGoldWindow = cDay && cDay >= 6 && cDay <= 10;
    const isDanger = phase === "ovulation";
    const isOvDetected = !!ovSignals[key];

    let badge = "";
    if (flags.showAvoidWarn && isDanger) badge += "⚠️";
    if (flags.showConceive && isDanger) badge += "🪺";
    if (flags.showFasting && isGoldWindow && !isDanger) badge += "🔥";
    if (isOvDetected) badge += "⚡";

    cells.push(
      <div key={d} onClick={() => onSelectDate(key)} style={{
        background: isSelected ? cfg.color + "22" : cfg.bg,
        borderLeft: `3px solid ${isOvDetected ? "#FF6B6B" : cfg.color}`,
        borderRadius: 6, padding: "3px 5px", cursor: "pointer", position: "relative",
        outline: isToday ? "3px solid #FFD24A" : isSelected ? `1px solid ${cfg.color}88` : "none",
        outlineOffset: isToday ? "-2px" : 0, zIndex: isToday ? 1 : "auto",
        minHeight: 48,
        boxShadow: isToday ? "0 0 8px 1px #FFD24A88"
          : flags.showAvoidWarn && isDanger ? "inset 0 0 0 1px #FF6B6B88" : "none",
      }}>
        <div style={{ fontSize: 10, color: isToday ? "#FFD24A" : "#aaa", fontWeight: isToday ? "bold" : "normal", fontFamily: "monospace" }}>{d}{badge}</div>
        <div style={{ fontSize: 13 }}>{moon.emoji}</div>
        {log && log.hours > 0 && (
          <div style={{ position: "absolute", bottom: 2, right: 3, fontSize: 8, color: "#4A9E8E", fontFamily: "monospace" }}>
            {log.hours}h
          </div>
        )}
      </div>
    );
  }
  return (
    <div>
      <div style={{ textAlign: "center", color: "#ccc", fontFamily: "serif", fontSize: 16, marginBottom: 8 }}>
        {year} {t(`month.${month}`)}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 3, fontSize: 9, color: "#666", textAlign: "center", marginBottom: 4, fontFamily: "monospace" }}>
        {[0,1,2,3,4,5,6].map(i => <div key={i}>{t(`dow.${i}`)}</div>)}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 3 }}>{cells}</div>
    </div>
  );
}

// ══════════════════════════════════
// ── Date detail panel (fasting hours + BBT + mucus) ──
// ══════════════════════════════════
const MUCUS_OPTIONS = ["none", "sticky", "eggwhite", "watery"];

function DateDetail({ dateKey, periodStart, cycleLen, logs, onSaveLog, onDeleteLog, flags, ovSignals }) {
  const { t, lang } = useLang();
  const { goalFor } = useContext(PrefsContext);
  const date = parseLocal(dateKey);
  const phase = getPhase(date, periodStart, cycleLen);
  const cfg = PHASE_CONFIG[phase];
  const moon = getMoonPhase(date, t);
  const cDay = getCycleDay(date, periodStart, cycleLen);
  const fasting = cDay ? getFastingAdvice(cDay, cycleLen, t) : { fast: "—", tip: "", defaultH: 12 };
  const prefillH = (cDay && goalFor(phase)) || fasting.defaultH;
  const fertLevel = getFertilityLevel(date, periodStart, cycleLen);
  const isDanger = phase === "ovulation";
  const sig = ovSignals[dateKey];

  const existing = logs[dateKey];
  const [hours, setHours] = useState(existing?.hours ?? prefillH);
  const [bbt, setBbt] = useState(existing?.bbt ?? "");
  const [mucus, setMucus] = useState(existing?.mucus ?? "none");
  const [editing, setEditing] = useState(!existing);

  // Reset form when dateKey changes
  const [prevKey, setPrevKey] = useState(dateKey);
  if (dateKey !== prevKey) {
    setPrevKey(dateKey);
    const ex = logs[dateKey];
    setHours(ex?.hours ?? prefillH);
    setBbt(ex?.bbt ?? "");
    setMucus(ex?.mucus ?? "none");
    setEditing(!ex);
  }

  const handleSave = () => {
    onSaveLog(dateKey, {
      hours: Number(hours) || 0,
      bbt: bbt !== "" ? Number(bbt) : null,
      mucus,
      ts: Date.now(),
    });
    setEditing(false);
  };

  const inputStyle = {
    width: "100%", padding: 8, background: "#0A0A0F", color: "#ddd",
    border: "1px solid #2a2a3e", borderRadius: 6, fontFamily: "monospace", fontSize: 13, boxSizing: "border-box",
  };

  return (
    <div style={{
      background: cfg.bg, border: `1px solid ${flags.showAvoidWarn && isDanger ? "#FF6B6B" : cfg.color + "33"}`,
      borderWidth: flags.showAvoidWarn && isDanger ? 2 : 1, borderRadius: 12, padding: 14, marginTop: 12,
    }}>
      {flags.showAvoidWarn && isDanger && (
        <div style={{ background: "#FF6B6B22", border: "1px solid #FF6B6B55", borderRadius: 8, padding: "8px 12px", marginBottom: 10, fontSize: 13, color: "#FF6B6B", fontWeight: "bold", textAlign: "center" }}>
          {t("avoidDangerWarn")}
        </div>
      )}

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
        <div style={{ fontSize: 15, color: cfg.color }}>
          {moon.emoji} {dateKey} · {resolvePhaseLabel(phase, flags, t)}
        </div>
        <div style={{ fontSize: 11, color: "#888", fontFamily: "monospace" }}>
          {cDay ? t("day", { n: cDay }) : ""}
        </div>
      </div>

      {/* Moon + ovulation detection */}
      <div style={{ fontSize: 12, color: "#aaa", marginBottom: 4 }}>{t("moonPhase")}：{moon.emoji} {moon.name}{lunarLabel(date, lang) && <span style={{ color: "#777" }}> · {lunarLabel(date, lang)}</span>}</div>
      <SignalNote sig={sig} />
      {flags.showFertility && <FertilityLine level={fertLevel} />}
      {flags.showConceive && (
        <div style={{ fontSize: 12, color: isDanger ? "#FF6B6B" : "#888", marginBottom: 4 }}>
          {isDanger ? t("conceiveTip") : t("conceiveNonOvTip")}
        </div>
      )}
      {bodyKeyFor(cDay, cycleLen) && (
        <div style={{ fontSize: 12, color: "#bbb", lineHeight: 1.6, marginBottom: 8, padding: "8px 10px", background: "#0d0d14", borderRadius: 8, border: "1px solid #2a2a3e" }}>
          <span style={{ color: "#FFD24A", fontFamily: "monospace", fontSize: 10 }}>💧 {t("deep.label.body")}</span><br />
          {t(`body.${bodyKeyFor(cDay, cycleLen)}`)} <span style={{ color: "#777", fontSize: 11 }}>{t("bodyNote")}</span>
        </div>
      )}
      {flags.showFasting && (
        <div style={{ fontSize: 12, color: "#ccc", marginBottom: 8 }}>
          {t("fastingAdvice")}：<span style={{ color: cfg.color, fontWeight: "bold" }}>{fasting.fast}</span>
          <span style={{ color: "#666", fontSize: 11 }}> — {fasting.tip}</span>
          {cDay && <PersonalGoalLine phase={phase} />}
        </div>
      )}

      {/* Form / Display */}
      {editing ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 4 }}>
          {/* Fasting hours */}
          {flags.showFastingLog && (
            <div>
              <label style={{ fontSize: 10, color: "#666", fontFamily: "monospace" }}>{t("fastHours")}</label>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <input type="number" min={0} max={168} step={1} value={hours}
                  onChange={e => setHours(e.target.value)} style={{ ...inputStyle, flex: 1 }} />
                <span style={{ color: "#666", fontSize: 12, fontFamily: "monospace" }}>{t("fastHoursUnit")}</span>
              </div>
            </div>
          )}
          {/* BBT */}
          <div>
            <label style={{ fontSize: 10, color: "#666", fontFamily: "monospace" }}>{t("bbtLabel")}</label>
            <input type="number" min={35} max={39} step={0.01} value={bbt} placeholder="36.50"
              onChange={e => setBbt(e.target.value)} style={inputStyle} />
          </div>
          {/* Mucus */}
          <div>
            <label style={{ fontSize: 10, color: "#666", fontFamily: "monospace" }}>{t("mucusLabel")}</label>
            <select value={mucus} onChange={e => setMucus(e.target.value)}
              style={{ ...inputStyle, appearance: "auto" }}>
              {MUCUS_OPTIONS.map(m => <option key={m} value={m}>{t(`mucus.${m}`)}</option>)}
            </select>
          </div>
          <button onClick={handleSave} style={{
            padding: 10, background: "#1a1a2e", color: "#4A9E8E", border: "1px solid #4A9E8E44",
            borderRadius: 8, fontFamily: "monospace", fontSize: 12, cursor: "pointer",
          }}>{t("saveLog")}</button>
        </div>
      ) : (
        <div>
          {/* Show saved data */}
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, fontSize: 12, fontFamily: "monospace", color: "#aaa", marginBottom: 8 }}>
            {existing?.hours > 0 && <span style={{ color: "#4A9E8E" }}>⏱ {existing.hours}h</span>}
            {existing?.bbt && <span>🌡 {existing.bbt}°C</span>}
            {existing?.mucus && existing.mucus !== "none" && <span>💧 {t(`mucus.${existing.mucus}`)}</span>}
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={() => setEditing(true)} style={{
              flex: 1, padding: 8, background: "#1a1a2e", color: "#aaa", border: "1px solid #2a2a3e",
              borderRadius: 8, fontFamily: "monospace", fontSize: 11, cursor: "pointer",
            }}>{t("editLog")}</button>
            <button onClick={() => { onDeleteLog(dateKey); setEditing(true); }} style={{
              padding: 8, background: "transparent", color: "#8B1A1A", border: "1px solid #8B1A1A44",
              borderRadius: 8, fontFamily: "monospace", fontSize: 11, cursor: "pointer",
            }}>{t("deleteLog")}</button>
          </div>
        </div>
      )}
      <LongLogNote hours={editing ? hours : existing?.hours} />
      <ReferenceBlock topics={REF_GROUPS.signals} />
    </div>
  );
}

// ══════════════════════════════════
// ── Consult tab: today's little note + intake + summary + booking ──
// ══════════════════════════════════
// "Today's little note" is assembled from the user's own logs with fixed rules.
// It is shown in the UI as rule-based text, not as AI or personalised care.
// TODO: designed to be swapped for a real Claude call later; when that happens,
// the UI wording (consult.badge / consult.ruleNote) must change with it.
function generateConsultAdvice({ phase, cycleDay, cycleLen, logs, goals, ovSignals }, t) {
  const dk = deepKey(phase);
  const stats = computeStats(logs, t);
  const rhythm = cycleDay ? getFastingAdvice(cycleDay, cycleLen, t).fast : null;
  const weekAvg = Number(stats.weekAvg) || 0;
  const phaseLabel = t(`phase.${phase}`).replace(" 🔥", "");
  const lines = [];

  lines.push(t("consult.greeting", { phase: phaseLabel, day: cycleDay ?? "—" }));

  if (goals.includes("fasting")) {
    // Describes what was logged; never nudges toward longer fasts.
    if (stats.weekDays === 0) { if (rhythm) lines.push(t("consult.fastNone", { rhythm })); }
    else lines.push(t("consult.fastLogged", { n: stats.weekDays, avg: weekAvg }));
  }

  lines.push(t("consult.nutrition", { eat: t(`deep.${dk}.eat`) }));

  if (goals.includes("conceive")) lines.push(t(phase === "ovulation" ? "consult.conceiveOv" : "consult.conceiveOff"));
  else if (goals.includes("avoid")) lines.push(t(phase === "ovulation" ? "consult.avoidOv" : "consult.avoidOff"));

  const weekAgo = isoDate(addDays(new Date(), -6));
  if (Object.keys(ovSignals).some(k => k >= weekAgo)) lines.push(t("consult.ovDetected"));

  lines.push(t("consult.closing"));
  return { lines, weekAvg };
}

function ConsultantView({ phase, cycleDay, cycleLen, logs, periodStart, goals, ovSignals, intake, setIntake, cycleInfo }) {
  const { t } = useLang();
  const advice = useMemo(
    () => generateConsultAdvice({ phase, cycleDay, cycleLen, logs, goals, ovSignals }, t),
    [phase, cycleDay, cycleLen, logs, goals, ovSignals, t]
  );
  const [fields, setFields] = useState(DEFAULT_SUMMARY_FIELDS);
  const makeSummary = () => buildSummary({ fields, intake, cycleInfo, logs, t });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      {/* Today's little note (rule-based) */}
      <div style={{ background: "linear-gradient(160deg, #16130A 0%, #111118 70%)", border: "1px solid #D4A01755", borderRadius: 12, padding: 16, boxShadow: "0 4px 20px #00000040" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
          <span style={{ fontSize: 22 }}>🌙</span>
          <div>
            <div style={{ fontSize: 15, color: "#D4A017", fontFamily: "serif" }}>{t("consult.title")}</div>
            <div style={{ fontSize: 9, color: "#888", fontFamily: "monospace" }}>
              {t("consult.badge")} · {t("consult.dataLabel")}
            </div>
          </div>
        </div>

        <div style={{ marginTop: 12, display: "flex", flexDirection: "column", gap: 10 }}>
          {advice.lines.map((line, i) => (
            <div key={i} style={{ fontSize: 13, color: "#d6d6d6", lineHeight: 1.7, paddingLeft: 12, borderLeft: "2px solid #D4A01733" }}>
              {line}
            </div>
          ))}
        </div>

        <div style={{ fontSize: 10, color: "#666", fontFamily: "monospace", lineHeight: 1.6, marginTop: 14, borderTop: "1px dashed #D4A01722", paddingTop: 10 }}>
          {t("consult.ruleNote")}
        </div>
      </div>

      <IntakeCard intake={intake} setIntake={setIntake} appGoals={goals} />
      <SummaryCard fields={fields} setFields={setFields} makeSummary={makeSummary} />
      <BookingCard fields={fields} makeSummary={makeSummary} />
      <ScienceEntry />

      {/* Disclaimer */}
      <div style={{ fontSize: 10, color: "#8a8a8a", fontFamily: "monospace", lineHeight: 1.6, textAlign: "center", padding: "0 8px" }}>
        {t("disclaimer")}
      </div>
    </div>
  );
}

// ══════════════════════════════════
// ── Guide view ──
// ══════════════════════════════════
function GuideView() {
  const { t } = useLang();
  const sectionStyle = { background: "#111118", borderRadius: 12, padding: 16, marginBottom: 12 };
  const headStyle = { fontSize: 15, color: "#D4A017", marginBottom: 10, fontFamily: "serif" };
  const paraStyle = { fontSize: 12, color: "#aaa", lineHeight: 1.7, fontFamily: "monospace", marginBottom: 8 };
  const phaseRow = (color, text) => (
    <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
      <div style={{ width: 4, borderRadius: 2, background: color, flexShrink: 0 }} />
      <div style={paraStyle}>{text}</div>
    </div>
  );

  return (
    <div>
      {/* How to use */}
      <div style={sectionStyle}>
        <div style={headStyle}>📖 {t("guide.howToUse")}</div>
        {["guide.step1", "guide.step2", "guide.step3", "guide.step4"].map(k => (
          <div key={k} style={paraStyle}>{t(k)}</div>
        ))}
      </div>

      {/* Cycle phases */}
      <div style={sectionStyle}>
        <div style={headStyle}>🔄 {t("guidePhaseTitle")}</div>
        {phaseRow("#8B1A1A", t("guide.menstrual"))}
        {phaseRow("#D4A017", t("guide.follicular"))}
        {phaseRow("#FF6B6B", t("guide.ovulation"))}
        {phaseRow("#7B68AE", t("guide.luteal"))}
      </div>

      {/* Moon & cycle */}
      <div style={sectionStyle}>
        <div style={headStyle}>🌙 {t("guideMoonTitle")}</div>
        <div style={paraStyle}>{t("guide.moonInfo")}</div>
      </div>

      {/* Important: estimates, not a device, fasting limits, privacy */}
      <div style={{ ...sectionStyle, border: "1px solid #FF6B6B33" }}>
        <div style={{ ...headStyle, color: "#FF8B8B" }}>⚠️ {t("guideAboutTitle")}</div>
        {["about.calendar", "about.notDevice", "about.signals", "about.fasting", "about.dailyNote", "about.privacy"].map(k => (
          <div key={k} style={paraStyle}>{t(k)}</div>
        ))}
        <a href="/privacy.html" target="_blank" rel="noopener" style={{ fontSize: 12, color: "#D4A017", fontFamily: "monospace", textDecoration: "none" }}>{t("privacyLink")}</a>
        <div style={{ marginTop: 12 }}><ScienceEntry /></div>
      </div>

      {/* Medical disclaimer */}
      <div style={{ fontSize: 10, color: "#8a8a8a", fontFamily: "monospace", lineHeight: 1.6, textAlign: "center", padding: "0 8px", marginTop: 4 }}>
        {t("disclaimer")}
      </div>
    </div>
  );
}

// ══════════════════════════════════
// ── Inline date picker (replaces <input type="date">, which fails to open
//    the native picker in some Android/Samsung home-screen PWA setups) ──
// ══════════════════════════════════
function DatePickerField({ value, onChange, accent }) {
  const { t } = useLang();
  const [open, setOpen] = useState(false);
  const hasValue = typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value);
  const selected = hasValue ? parseLocal(value) : new Date();
  const [year, setYear] = useState(selected.getFullYear());
  const [month, setMonth] = useState(selected.getMonth());
  const today = new Date();
  const todayKey = isoDate(today);

  const openPicker = () => {
    setYear(selected.getFullYear());
    setMonth(selected.getMonth());
    setOpen(o => !o);
  };
  const shiftMonth = (n) => {
    const d = new Date(year, month + n, 1);
    setYear(d.getFullYear());
    setMonth(d.getMonth());
  };
  const pick = (key) => { onChange(key); setOpen(false); };

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const startDow = new Date(year, month, 1).getDay();
  const cells = [];
  for (let i = 0; i < startDow; i++) cells.push(<div key={`e${i}`} />);
  for (let d = 1; d <= daysInMonth; d++) {
    const key = isoDate(new Date(year, month, d));
    const isSel = key === value;
    const isToday = key === todayKey;
    const isFuture = key > todayKey;
    cells.push(
      <button key={d} type="button" onClick={() => pick(key)} disabled={isFuture} style={{
        padding: "8px 0", minHeight: 36, borderRadius: 6, fontFamily: "monospace", fontSize: 13,
        background: isSel ? accent + "33" : "transparent",
        color: isFuture ? "#444" : isSel ? accent : isToday ? "#FFD24A" : "#ccc",
        border: `1px solid ${isSel ? accent : isToday ? "#FFD24A66" : "#2a2a3e"}`,
        cursor: isFuture ? "default" : "pointer",
      }}>{d}</button>
    );
  }

  const navBtn = { background: "transparent", color: "#aaa", border: "1px solid #2a2a3e", borderRadius: 6, padding: "6px 14px", fontSize: 14, cursor: "pointer" };

  return (
    <div>
      <button type="button" onClick={openPicker} style={{
        width: "100%", padding: 10, background: "#111118", color: "#ddd", textAlign: "left",
        border: `1px solid ${open ? accent : "#2a2a3e"}`, borderRadius: 8, fontFamily: "monospace", fontSize: 14,
        boxSizing: "border-box", cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center",
      }}>
        <span style={{ color: hasValue ? "#ddd" : "#888" }}>{hasValue ? `${selected.getFullYear()} ${t(`month.${selected.getMonth()}`)} ${selected.getDate()}` : t("setup.pick")}</span>
        <span style={{ fontSize: 12, color: "#888" }}>{open ? "▲" : "📅 " + t("tapToChange")}</span>
      </button>
      {open && (
        <div style={{ marginTop: 8, padding: 10, background: "#0d0d14", border: "1px solid #2a2a3e", borderRadius: 8 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
            <button type="button" onClick={() => shiftMonth(-1)} style={navBtn}>‹</button>
            <div style={{ color: "#ccc", fontFamily: "serif", fontSize: 15 }}>{year} {t(`month.${month}`)}</div>
            <button type="button" onClick={() => shiftMonth(1)} style={navBtn}>›</button>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 3, fontSize: 9, color: "#666", textAlign: "center", marginBottom: 4, fontFamily: "monospace" }}>
            {[0,1,2,3,4,5,6].map(i => <div key={i}>{t(`dow.${i}`)}</div>)}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 3 }}>{cells}</div>
          <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
            <button type="button" onClick={() => pick(todayKey)} style={{ ...navBtn, flex: 1, color: "#FFD24A" }}>{t("today")}</button>
            <button type="button" onClick={() => pick(isoDate(addDays(today, -1)))} style={{ ...navBtn, flex: 1 }}>{t("yesterday")}</button>
            <button type="button" onClick={() => setOpen(false)} style={{ ...navBtn, flex: 1 }}>{t("close")}</button>
          </div>
        </div>
      )}
    </div>
  );
}

// ══════════════════════════════════
// ── Explore card: what a tapped disc day means ──
// ══════════════════════════════════
function ExploreCard({ day, cycleStart, cycleLen, today, flags, logs, onClose, onShift }) {
  const { t, lang } = useLang();
  const date = addDays(cycleStart, day - 1);
  const phase = getPhase(date, cycleStart, cycleLen);
  const cfg = PHASE_CONFIG[phase];
  const moon = getMoonPhase(date, t);
  const rel = daysBetween(new Date(isoDate(today)), new Date(isoDate(date)));
  const relText = rel === 0 ? t("today") : rel > 0 ? t("inDays", { n: rel }) : t("daysAgo", { n: -rel });
  const prev = getPrevPhase(day, cycleStart, cycleLen);
  const fa = getFastingAdvice(day, cycleLen, t);
  const fertLevel = getFertilityLevel(date, cycleStart, cycleLen);
  const log = logs[isoDate(date)];
  const ovDay = cycleLen - 14;
  const navBtn = { background: "transparent", color: "#aaa", border: "1px solid #2a2a3e", borderRadius: 6, padding: "6px 12px", fontSize: 13, cursor: "pointer", fontFamily: "monospace" };
  return (
    <div style={{ background: cfg.bg, border: `1px solid #FFD24A66`, borderRadius: 12, padding: 16, marginBottom: 12 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
        <div style={{ fontSize: 17, color: cfg.color }}>
          {moon.emoji} {t("day", { n: day })} · {fmt(date)} · {resolvePhaseLabel(phase, flags, t)}
        </div>
        <div style={{ fontSize: 11, color: "#FFD24A", fontFamily: "monospace", whiteSpace: "nowrap", marginLeft: 8 }}>{relText}</div>
      </div>
      <div style={{ fontSize: 12, color: "#888", marginBottom: 6 }}>
        {t("moonPhase")}：{moon.emoji} {moon.name}{lunarLabel(date, lang) && <span style={{ color: "#777" }}> · {lunarLabel(date, lang)}</span>}
        {day === ovDay && <span style={{ color: "#FF6B6B", marginLeft: 8 }}>● {t("ovulationDay")}</span>}
      </div>
      <div style={{ fontSize: 13, color: "#aaa", marginBottom: 10 }}>{resolvePhaseDesc(phase, flags, t)}</div>

      <div style={{ fontSize: 11, color: "#FFD24A", fontFamily: "monospace", marginBottom: 2 }}>{t("learnTitle")}</div>
      <div style={{ fontSize: 13, color: "#ccc", lineHeight: 1.6, marginBottom: 10 }}>{t(`learn.${phase}`)}</div>

      {prev && (
        <>
          <div style={{ fontSize: 11, color: "#FFD24A", fontFamily: "monospace", marginBottom: 2 }}>
            {t("diffTitle", { prev: t(`phase.${prev}`) })}
          </div>
          <div style={{ fontSize: 13, color: "#ccc", lineHeight: 1.6, marginBottom: 10 }}>{t(`diff.${phase}`)}</div>
        </>
      )}

      {bodyKeyFor(day, cycleLen) && (
        <>
          <div style={{ fontSize: 11, color: "#FFD24A", fontFamily: "monospace", marginBottom: 2 }}>💧 {t("deep.label.body")}</div>
          <div style={{ fontSize: 13, color: "#ccc", lineHeight: 1.6, marginBottom: 10 }}>{t(`body.${bodyKeyFor(day, cycleLen)}`)} <span style={{ color: "#777", fontSize: 11 }}>{t("bodyNote")}</span></div>
        </>
      )}

      {flags.showFasting && (
        <div style={{ fontSize: 13, color: "#ccc", marginBottom: 4 }}>
          {t("fastingAdvice")}：<span style={{ color: cfg.color, fontWeight: "bold" }}>{fa.fast}</span>
          <span style={{ fontSize: 11, color: "#888", marginLeft: 6 }}>{fa.tip}</span>
          <PersonalGoalLine phase={phase} />
        </div>
      )}
      {flags.showFertility && <FertilityLine level={fertLevel} />}
      {log && log.hours > 0 && (
        <div style={{ fontSize: 12, color: "#4A9E8E", fontFamily: "monospace", marginTop: 4 }}>✓ {log.hours}h {t("logged").replace("✓ ", "")}</div>
      )}

      <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
        <button type="button" onClick={() => onShift(-1)} disabled={day <= 1} style={{ ...navBtn, opacity: day <= 1 ? 0.3 : 1 }}>‹</button>
        <button type="button" onClick={() => onShift(1)} disabled={day >= cycleLen} style={{ ...navBtn, opacity: day >= cycleLen ? 0.3 : 1 }}>›</button>
        <button type="button" onClick={onClose} style={{ ...navBtn, flex: 1, color: "#FFD24A" }}>{t("backToToday")}</button>
      </div>
      <div style={{ fontSize: 10, color: "#666", fontFamily: "monospace", marginTop: 8, textAlign: "center" }}>{t("autoReturnHint")}</div>
      <ReferenceBlock topics={REF_GROUPS.wellness} />
    </div>
  );
}

// ══════════════════════════════════
// ── Main App ──
// ══════════════════════════════════
export default function MoonRhythm() {
  const { t, lang, toggle: toggleLang } = useLang();

  const [cycleLen, setCycleLen] = useLocalStorage("moon-cycleLen", 28);
  // No made-up default: until the user enters a date, nothing is estimated.
  const [periodStart, setPeriodStart] = useLocalStorage("moon-periodStart", null);
  const hasCycle = typeof periodStart === "string" && /^\d{4}-\d{2}-\d{2}$/.test(periodStart);
  const [goals, setGoals] = useLocalStorage("moon-goals", ["fasting"]);
  const [logs, setLogs] = useLocalStorage("moon-logs", {});
  const [intake, setIntake] = useLocalStorage("moon-intake", null);
  const [personalGoals, setPersonalGoals] = useLocalStorage("moon-personalFastGoals", {});
  const [goalAck, setGoalAck] = useLocalStorage("moon-personalGoalAck", []);
  // Contraception / conception notice: shown on open while a mode is on,
  // and again whenever a mode is switched on; "this week" snoozes 7 days.
  const [noticeSnoozeUntil, setNoticeSnoozeUntil] = useLocalStorage("moon-fertilityNoticeSnoozeUntil", 0);
  const [noticeDismissed, setNoticeDismissed] = useState(false);
  const [noticeForced, setNoticeForced] = useState(false);
  // Paid-download model: everyone who has the app paid US$1.99, so the full
  // Moonyou＋ base (deep guidance + AI coach) is always unlocked. Extended
  // services (real nutritionist consult) are separate paid add-ons.

  const flags = useGoalFlags(goals);

  const toggleGoal = useCallback((g) => {
    if ((g === "avoid" || g === "conceive") && !goals.includes(g)) {
      setNoticeDismissed(false);
      setNoticeForced(true);
    }
    setGoals(prev => {
      const set = new Set(prev);
      if (set.has(g)) { set.delete(g); if (set.size === 0) return prev; return [...set]; }
      if (g === "avoid") set.delete("conceive");
      if (g === "conceive") set.delete("avoid");
      set.add(g);
      return [...set];
    });
  }, [goals, setGoals]);

  const noticeMode = goals.includes("avoid") ? "avoid" : goals.includes("conceive") ? "conceive" : null;
  const showNotice = !!noticeMode && !noticeDismissed && (noticeForced || Date.now() > noticeSnoozeUntil);
  const closeNotice = (snooze) => {
    if (snooze) setNoticeSnoozeUntil(Date.now() + 7 * 86400000);
    setNoticeDismissed(true);
    setNoticeForced(false);
  };

  // Personal goals above 16h need every contraindication confirmed absent,
  // and are hidden in conception mode or when the intake lists one.
  const longBlockedBy = goals.includes("conceive") ? "conceive" : intakeHasContra(intake) ? "intake" : null;
  const ackOk = GOAL_CHECKS.every(k => (goalAck || []).includes(k));
  const hasLongGoal = GOAL_PHASES.some(k => Number(personalGoals?.[k]) > 16);
  const goalFor = useCallback((phase) => {
    const h = Number(personalGoals?.[deepKey(phase)]);
    if (!h || h <= 0) return null;
    if (h > 16 && (longBlockedBy || !ackOk)) return null;
    return h;
  }, [personalGoals, longBlockedBy, ackOk]);
  const prefs = useMemo(() => ({ goalFor }), [goalFor]);
  const setGoal = (k, v) => setPersonalGoals(g => ({ ...(g || {}), [k]: v === "" ? "" : Math.max(0, Math.min(168, Math.round(Number(v)) || 0)) }));
  const toggleAck = (k) => setGoalAck(a => (a || []).includes(k) ? a.filter(x => x !== k) : [...(a || []), k]);

  const [view, setView] = useState("dashboard");
  const [prevView, setPrevView] = useState("dashboard");
  const openScience = useCallback(() => {
    setView(v => { if (v !== "science") setPrevView(v); return "science"; });
    setNoticeDismissed(true); // opened from the notice card → close it
    window.scrollTo?.(0, 0);
  }, []);
  const [calMonth, setCalMonth] = useState(new Date().getMonth());
  const [calYear, setCalYear] = useState(new Date().getFullYear());
  const [selectedDate, setSelectedDate] = useState(null);
  const [syncStatus, setSyncStatus] = useState(null);
  const [exploreDay, setExploreDay] = useState(null); // disc day being inspected (1-based), null = today

  // Auto-return to today after a pause, so the disc never stays stuck on another day
  useEffect(() => {
    if (exploreDay == null) return;
    const id = setTimeout(() => setExploreDay(null), 20000);
    return () => clearTimeout(id);
  }, [exploreDay]);

  const today = new Date();
  // Without a date every day is "before tracking began" → phase "safe" (no cycle data).
  const pStart = hasCycle ? parseLocal(periodStart) : new Date(9999, 0, 1);
  const cycleStart = getCycleStart(today, pStart, cycleLen);
  const nextPeriod = addDays(cycleStart, cycleLen);
  const todayCycleDay = getCycleDay(today, cycleStart, cycleLen);
  const todayPhase = getPhase(today, pStart, cycleLen);
  const todayCfg = PHASE_CONFIG[todayPhase];
  const todayMoon = getMoonPhase(today, t);
  const fertLevel = getFertilityLevel(today, pStart, cycleLen);
  const ovDay = cycleLen - 14;
  const ovDate = addDays(cycleStart, ovDay - 1); // ovulation of the current cycle
  const dangerStart = addDays(ovDate, -5);
  const dangerEnd = addDays(ovDate, 1);
  const diff = daysBetween(pStart, today);
  const cycleDay = diff >= 0 ? (diff % cycleLen) + 1 : null;
  const todayFasting = cycleDay ? getFastingAdvice(cycleDay, cycleLen, t) : { fast: "—", tip: "", defaultH: 12 };

  // Ovulation reference signals (egg-white mucus / raised BBT)
  const ovSignals = useMemo(() => detectOvulationSignals(logs), [logs]);

  const saveLog = useCallback((key, data) => {
    setLogs(prev => ({ ...prev, [key]: data }));
  }, [setLogs]);

  const deleteLog = useCallback((key) => {
    setLogs(prev => { const next = { ...prev }; delete next[key]; return next; });
  }, [setLogs]);

  const handleSyncGCal = async () => {
    if (!hasCycle) return;
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
    if (!clientId) { setSyncStatus("no-config"); return; }
    setSyncStatus("syncing");
    try {
      const count = await syncToGoogleCalendar({ periodStart, cycleLen, numCycles: 3, t });
      setSyncStatus(`done:${count}`);
    } catch { setSyncStatus("error"); }
  };

  const handleDownloadICS = () => { if (hasCycle) downloadICS({ periodStart, cycleLen, numCycles: 6, t }); };

  const syncLabel = (() => {
    if (syncStatus === "syncing") return t("syncing");
    if (syncStatus === "no-config") return t("gcalNotConfigured");
    if (syncStatus === "error") return t("syncError");
    if (syncStatus?.startsWith("done:")) return t("syncDone", { n: syncStatus.split(":")[1] });
    return t("syncToGCal");
  })();

  const navBtn = (label, v) => (
    <button onClick={() => setView(v)} style={{
      flex: 1, padding: "10px 0", background: view === v ? "#1a1a2e" : "transparent",
      color: view === v ? todayCfg.color : "#666", border: "none",
      borderTop: view === v ? `2px solid ${todayCfg.color}` : "2px solid transparent",
      fontFamily: "monospace", fontSize: 10.5, cursor: "pointer", whiteSpace: "nowrap",
    }}>{label}</button>
  );

  const todayPhaseLabel = resolvePhaseLabel(todayPhase, flags, t);
  const todayLog = logs[isoDate(today)];
  const cycleInfo = !hasCycle ? null : {
    periodStart, cycleLen, cycleDay, phaseLabel: todayPhaseLabel,
    ovDate: fmt(ovDate), fertileWindow: `${fmt(dangerStart)}–${fmt(dangerEnd)}`, nextPeriod: fmt(nextPeriod),
  };

  return (
    <PrefsContext.Provider value={prefs}>
    <ScienceNavContext.Provider value={openScience}>
    <div style={{ background: "#0A0A0F", color: "#ddd", minHeight: "100vh", fontFamily: "'Crimson Text', Georgia, serif", maxWidth: 420, margin: "0 auto" }}>
      {/* Header */}
      <div style={{ padding: "20px 16px 8px", borderBottom: "1px solid #1a1a2e", display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 20, letterSpacing: 2, color: todayCfg.color, fontFamily: "serif" }}>
            🌙 <span style={{ fontFamily: "'Cormorant Garamond', serif", fontStyle: "italic", fontWeight: 600 }}>Moonyou</span> 你的月亮
          </h1>
          <div style={{ fontSize: 11, color: "#666", fontFamily: "monospace", marginTop: 2 }}>
            {cycleDay ? t("cycleDay", { n: cycleDay }) : "—"} · {todayPhaseLabel} · {todayMoon.emoji} {todayMoon.name}{lunarLabel(today, lang) && ` · ${lunarLabel(today, lang)}`}
          </div>
        </div>
        <button onClick={toggleLang} style={{ background: "#1a1a2e", color: "#aaa", border: "1px solid #2a2a3e", borderRadius: 6, padding: "4px 10px", fontFamily: "monospace", fontSize: 11, cursor: "pointer", flexShrink: 0, marginTop: 2 }}>
          {lang === "zh" ? "EN" : "中"}
        </button>
      </div>

      <div style={{ padding: 16 }}>
        {/* ─── DASHBOARD, before any period date is entered ─── */}
        {view === "dashboard" && !hasCycle && (
          <div>
            <div style={{ background: "#111118", border: "1px solid #D4A01755", borderRadius: 12, padding: 16, marginBottom: 12 }}>
              <div style={{ fontSize: 16, color: "#D4A017", fontFamily: "serif", marginBottom: 6 }}>🌙 {t("setup.title")}</div>
              <div style={{ fontSize: 12.5, color: "#bbb", lineHeight: 1.7, marginBottom: 12 }}>{t("setup.body")}</div>
              <label style={{ fontSize: 12, color: "#888", fontFamily: "monospace", display: "block", marginBottom: 4 }}>{t("periodStartLabel")}</label>
              <DatePickerField value={periodStart} onChange={setPeriodStart} accent="#D4A017" />
              <div style={{ fontSize: 11, color: "#777", fontFamily: "monospace", lineHeight: 1.6, marginTop: 8 }}>{t("setup.note")}</div>
            </div>
            <AstroCard />
            <TarotCard />
            {flags.showFasting && <FastingStats logs={logs} periodStart={periodStart} cycleLen={cycleLen} />}
          </div>
        )}

        {/* ─── DASHBOARD ─── */}
        {view === "dashboard" && hasCycle && (
          <div>
            <div style={{ display: "flex", justifyContent: "center", marginBottom: 6 }}>
              <MoonDisc cycleStart={cycleStart} cycleLen={cycleLen} today={today} flags={flags}
                selectedDay={exploreDay}
                onSelectDay={d => setExploreDay(d === todayCycleDay ? null : d)} />
            </div>
            <div style={{ textAlign: "center", fontSize: 10, color: "#555", fontFamily: "monospace", marginBottom: 10 }}>{t("tapDiscHint")}</div>

            {/* Key dates of this cycle */}
            <div style={{ display: "flex", justifyContent: "center", gap: 14, flexWrap: "wrap", fontSize: 11, fontFamily: "monospace", color: "#888", marginBottom: 14 }}>
              <span>● <span style={{ color: "#FF6B6B" }}>{t("ovulationDay")}</span> {fmt(ovDate)}</span>
              {flags.showFertility && <span>● <span style={{ color: "#FF6B6B" }}>{t("fertileWindow")}</span> {fmt(dangerStart)}–{fmt(dangerEnd)}</span>}
              <span>● <span style={{ color: "#8B1A1A" }}>{t("nextPeriod")}</span> {fmt(nextPeriod)}</span>
            </div>
            <div style={{ textAlign: "center", fontSize: 10, color: "#555", fontFamily: "monospace", marginTop: -8, marginBottom: 14 }}>{t("ovulationVaries")}</div>
            {!flags.showFertility && <ReferenceBlock topics={REF_GROUPS.fertility} style={{ marginTop: -8, marginBottom: 12, borderTop: "none" }} />}

            {exploreDay != null && exploreDay !== todayCycleDay && (
              <ExploreCard day={exploreDay} cycleStart={cycleStart} cycleLen={cycleLen} today={today} flags={flags} logs={logs}
                onClose={() => setExploreDay(null)}
                onShift={n => setExploreDay(d => Math.min(cycleLen, Math.max(1, d + n)))} />
            )}

            {flags.showAvoidWarn && todayPhase === "ovulation" && (
              <div style={{ background: "#FF6B6B22", border: "2px solid #FF6B6B", borderRadius: 12, padding: "12px 16px", marginBottom: 12, fontSize: 14, color: "#FF6B6B", fontWeight: "bold", textAlign: "center" }}>
                {t("avoidDangerWarn")}
              </div>
            )}

            {/* Today's card */}
            <div style={{
              background: todayCfg.bg,
              border: `1px solid ${flags.showAvoidWarn && todayPhase === "ovulation" ? "#FF6B6B" : todayCfg.color + "33"}`,
              borderWidth: flags.showAvoidWarn && todayPhase === "ovulation" ? 2 : 1,
              borderRadius: 12, padding: 16, marginBottom: 12,
            }}>
              <div style={{ fontSize: 18, color: todayCfg.color, marginBottom: 6 }}>
                {todayMoon.emoji} {t("today")}：{todayPhaseLabel}
              </div>
              <div style={{ fontSize: 12, color: "#888", marginBottom: 4 }}>{t("moonPhase")}：{todayMoon.emoji} {todayMoon.name}{lunarLabel(today, lang) && <span style={{ color: "#666" }}> · {lunarLabel(today, lang)}</span>}</div>
              <div style={{ fontSize: 13, color: "#aaa", marginBottom: 8 }}>{resolvePhaseDesc(todayPhase, flags, t)}</div>
              {todayCycleDay && (
                <>
                  <div style={{ fontSize: 11, color: "#FFD24A", fontFamily: "monospace", marginBottom: 2 }}>{t("learnTitle")}</div>
                  <div style={{ fontSize: 13, color: "#ccc", lineHeight: 1.6, marginBottom: 8 }}>{t(`learn.${todayPhase}`)}</div>
                  {getPrevPhase(todayCycleDay, cycleStart, cycleLen) && (
                    <>
                      <div style={{ fontSize: 11, color: "#FFD24A", fontFamily: "monospace", marginBottom: 2 }}>
                        {t("diffTitle", { prev: t(`phase.${getPrevPhase(todayCycleDay, cycleStart, cycleLen)}`) })}
                      </div>
                      <div style={{ fontSize: 13, color: "#ccc", lineHeight: 1.6, marginBottom: 8 }}>{t(`diff.${todayPhase}`)}</div>
                    </>
                  )}
                </>
              )}
              {flags.showConceive && (
                <div style={{ fontSize: 12, color: todayPhase === "ovulation" ? "#FF6B6B" : "#888", marginBottom: 4 }}>
                  {todayPhase === "ovulation" ? t("conceiveTip") : t("conceiveNonOvTip")}
                </div>
              )}
              {flags.showFasting && (
                <>
                  <div style={{ fontSize: 13, color: "#ccc", marginBottom: 4 }}>
                    {t("fastingAdvice")}：<span style={{ color: todayCfg.color, fontWeight: "bold" }}>{todayFasting.fast}</span>
                  </div>
                  <div style={{ fontSize: 11, color: "#888" }}>{todayFasting.tip}</div>
                  {cycleDay && <PersonalGoalLine phase={todayPhase} />}
                </>
              )}
              {todayLog && todayLog.hours > 0 && (
                <div style={{ fontSize: 12, color: "#4A9E8E", fontFamily: "monospace", marginTop: 6 }}>
                  ✓ {todayLog.hours}h {t("logged").replace("✓ ", "")}
                </div>
              )}
              <ReferenceBlock topics={flags.showFasting ? [...REF_GROUPS.fasting, ...REF_GROUPS.wellness] : REF_GROUPS.wellness} />
            </div>

            {/* Vedic sidereal astrology — Sun / Moon / Mercury */}
            <AstroCard />

            {/* Daily tarot draw */}
            <TarotCard />

            {/* Moonyou＋ deep guidance (unlocked — included with the paid app) */}
            {flags.showFasting && (
              <DeepGuidance phase={todayPhase} cycleDay={cycleDay} cycleLen={cycleLen} preview={false} />
            )}

            {/* Chance of conception: calendar estimate, described as a level, not a percentage */}
            {flags.showFertility && (
              <div style={{ background: "#111118", borderRadius: 12, padding: 16, marginBottom: 12 }}>
                <div style={{ fontSize: 13, color: "#888", marginBottom: 8, fontFamily: "monospace" }}>{t("fertilityLabel")}</div>
                <div style={{ fontSize: 15, color: fertLevel === "high" ? "#FF6B6B" : fertLevel === "low" ? "#4A9E8E" : "#888", marginBottom: 10 }}>
                  {fertLevel === "high" ? "● " : "○ "}{t(`fert.${fertLevel}`)}
                </div>
                <div style={{ display: "flex", gap: 2, alignItems: "center", height: 14, marginBottom: 8 }} aria-hidden="true">
                  {Array.from({ length: cycleLen }, (_, i) => {
                    const d = i + 1;
                    const inWin = d >= ovDay - 5 && d <= ovDay + 1;
                    const isT = d === todayCycleDay;
                    return <div key={i} style={{
                      flex: 1, height: isT ? 14 : 8, borderRadius: 2,
                      background: inWin ? "#FF6B6B" : "#2a2a3e", opacity: inWin && d !== ovDay ? 0.6 : 1,
                      outline: isT ? "2px solid #FFD24A" : "none",
                    }} />;
                  })}
                </div>
                <div style={{ fontSize: 11, color: "#666", fontFamily: "monospace" }}>
                  {t("ovulationEstimate")}：{fmt(ovDate)} · {t("dangerPeriod")}：{fmt(dangerStart)}–{fmt(dangerEnd)}
                </div>
                {fertLevel === "low" && <div style={{ fontSize: 11, color: "#888", marginTop: 6, lineHeight: 1.6 }}>{t("fert.lowNote")}</div>}
                <div style={{ fontSize: 10, color: "#555", marginTop: 4, fontFamily: "monospace", lineHeight: 1.6 }}>{t("ovulationVaries")}{t("riskNote")}</div>
                <ReferenceBlock topics={REF_GROUPS.fertility} />
              </div>
            )}

            {/* Fasting statistics */}
            {flags.showFasting && <FastingStats logs={logs} periodStart={periodStart} cycleLen={cycleLen} />}

            {/* Phase legend */}
            <div style={{ marginTop: 12, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
              {["menstrual", "follicular_gold", "ovulation", "luteal", "safe"].map(k => (
                <div key={k} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, color: "#888" }}>
                  <div style={{ width: 10, height: 10, borderRadius: 2, background: PHASE_CONFIG[k].color, flexShrink: 0 }} />
                  <span>{t(`phase.${k}`)}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ─── CALENDAR ─── */}
        {view === "calendar" && (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <button onClick={() => { if (calMonth === 0) { setCalMonth(11); setCalYear(y => y - 1); } else setCalMonth(m => m - 1); }}
                style={{ background: "none", border: "none", color: "#888", fontSize: 18, cursor: "pointer" }}>◀</button>
              <button onClick={() => { if (calMonth === 11) { setCalMonth(0); setCalYear(y => y + 1); } else setCalMonth(m => m + 1); }}
                style={{ background: "none", border: "none", color: "#888", fontSize: 18, cursor: "pointer" }}>▶</button>
            </div>
            <CalendarGrid periodStart={pStart} cycleLen={cycleLen} year={calYear} month={calMonth}
              logs={logs} onSelectDate={setSelectedDate} selectedDate={selectedDate} flags={flags} ovSignals={ovSignals} />
            {selectedDate ? (
              <DateDetail dateKey={selectedDate} periodStart={pStart} cycleLen={cycleLen}
                logs={logs} onSaveLog={saveLog} onDeleteLog={deleteLog} flags={flags} ovSignals={ovSignals} />
            ) : (
              <div style={{ marginTop: 12, fontSize: 11, color: "#666", fontFamily: "monospace", textAlign: "center" }}>{t("clickToView")}</div>
            )}
          </div>
        )}

        {/* ─── CONSULTANT (Moonyou＋) ─── */}
        {view === "consult" && (
          <ConsultantView
            phase={todayPhase} cycleDay={cycleDay} cycleLen={cycleLen}
            logs={logs} periodStart={periodStart} goals={goals} ovSignals={ovSignals}
            intake={intake} setIntake={setIntake} cycleInfo={cycleInfo} />
        )}

        {/* ─── GUIDE ─── */}
        {view === "guide" && <GuideView />}

        {/* ─── SCIENTIFIC BASIS (from Settings / Consult / Guide / any reference block) ─── */}
        {view === "science" && <SciencePage onBack={() => setView(prevView)} />}

        {/* ─── SETTINGS ─── */}
        {view === "settings" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div>
              <label style={{ fontSize: 12, color: "#888", fontFamily: "monospace", display: "block", marginBottom: 4 }}>{t("periodStartLabel")}</label>
              <DatePickerField value={periodStart} onChange={setPeriodStart} accent={todayCfg.color} />
            </div>
            <div>
              <label style={{ fontSize: 12, color: "#888", fontFamily: "monospace", display: "block", marginBottom: 4 }}>{t("cycleLenLabel", { n: cycleLen })}</label>
              <input type="range" min={21} max={40} value={cycleLen} onChange={e => setCycleLen(Number(e.target.value))}
                style={{ width: "100%", accentColor: todayCfg.color }} />
            </div>
            <div>
              <label style={{ fontSize: 12, color: "#888", fontFamily: "monospace", display: "block", marginBottom: 4 }}>{t("goalLabel")}</label>
              <div style={{ display: "flex", gap: 8 }}>
                {[["fasting", "goalFasting"], ["avoid", "goalAvoid"], ["conceive", "goalConceive"]].map(([v, lk]) => {
                  const active = goals.includes(v);
                  return (
                    <button key={v} onClick={() => toggleGoal(v)} style={{
                      flex: 1, padding: 10, background: active ? "#1a1a2e" : "transparent",
                      color: active ? todayCfg.color : "#666", border: `1px solid ${active ? todayCfg.color + "44" : "#2a2a3e"}`,
                      borderRadius: 8, fontFamily: "monospace", fontSize: 12, cursor: "pointer", position: "relative",
                    }}>
                      {active && <span style={{ position: "absolute", top: 2, right: 4, fontSize: 9 }}>✓</span>}
                      {t(lk)}
                    </button>
                  );
                })}
              </div>
              <div style={{ fontSize: 10, color: "#8a8a8a", fontFamily: "monospace", marginTop: 4 }}>{t("goalExclusive")}</div>
            </div>

            {/* Personal fasting goals: the user's own numbers, per phase. The app's
                own reference rhythm never goes above 16h. */}
            {flags.showFasting && (
              <div style={{ borderTop: "1px solid #1a1a2e", paddingTop: 16 }}>
                <label style={{ fontSize: 12, color: "#888", fontFamily: "monospace", display: "block", marginBottom: 4 }}>🎯 {t("goalsTitle")}</label>
                <div style={{ fontSize: 11, color: "#8a8a8a", fontFamily: "monospace", lineHeight: 1.6, marginBottom: 10 }}>{t("goalsDesc")}</div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                  {GOAL_PHASES.map(k => (
                    <label key={k} style={{ fontSize: 11, color: "#aaa", fontFamily: "monospace" }}>
                      {t(`goalPhase.${k}`)}
                      <div style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 3 }}>
                        <input type="number" inputMode="numeric" min={0} max={168} step={1} placeholder="—"
                          value={personalGoals?.[k] ?? ""} onChange={e => setGoal(k, e.target.value)}
                          style={{ width: "100%", padding: 8, background: "#0A0A0F", color: "#ddd", border: "1px solid #2a2a3e", borderRadius: 6, fontFamily: "monospace", fontSize: 13, boxSizing: "border-box" }} />
                        <span style={{ color: "#666" }}>h</span>
                      </div>
                    </label>
                  ))}
                </div>
                {hasLongGoal && (
                  <div style={{ marginTop: 12 }}>
                    <LongFastWarn />
                    <div style={{ fontSize: 11.5, color: "#ccc", lineHeight: 1.6, margin: "10px 0 6px" }}>{t("goalsCheckIntro")}</div>
                    {GOAL_CHECKS.map(k => (
                      <label key={k} style={{ display: "flex", alignItems: "flex-start", gap: 8, fontSize: 12, color: "#aaa", lineHeight: 1.6, cursor: "pointer", marginBottom: 2 }}>
                        <input type="checkbox" checked={(goalAck || []).includes(k)} onChange={() => toggleAck(k)} style={{ marginTop: 3 }} />
                        {t("goalsCheckNone", { x: t(`goalCheck.${k}`) })}
                      </label>
                    ))}
                    <div style={{ fontSize: 11, fontFamily: "monospace", lineHeight: 1.6, marginTop: 6, color: longBlockedBy || !ackOk ? "#FFB347" : "#4A9E8E" }}>
                      {longBlockedBy ? t(longBlockedBy === "conceive" ? "goalsBlockedConceive" : "goalsBlockedIntake")
                        : ackOk ? t("goalsLongActive") : t("goalsLongPending")}
                    </div>
                  </div>
                )}
                <ReferenceBlock topics={REF_GROUPS.fasting} />
              </div>
            )}

            <div style={{ borderTop: "1px solid #1a1a2e", paddingTop: 16 }}>
              <label style={{ fontSize: 12, color: "#888", fontFamily: "monospace", display: "block", marginBottom: 8 }}>Google Calendar</label>
              <button onClick={handleSyncGCal} disabled={syncStatus === "syncing"} style={{
                width: "100%", padding: 12, background: syncStatus?.startsWith("done") ? "#0D2818" : "#1a1a2e",
                color: syncStatus?.startsWith("done") ? "#4A9E8E" : syncStatus === "error" || syncStatus === "no-config" ? "#FF6B6B" : "#aaa",
                border: `1px solid ${syncStatus?.startsWith("done") ? "#4A9E8E44" : "#2a2a3e"}`,
                borderRadius: 8, fontFamily: "monospace", fontSize: 12, cursor: syncStatus === "syncing" ? "wait" : "pointer", marginBottom: 8,
              }}>{syncLabel}</button>
              <button onClick={handleDownloadICS} style={{
                width: "100%", padding: 12, background: "transparent", color: "#888", border: "1px solid #2a2a3e",
                borderRadius: 8, fontFamily: "monospace", fontSize: 12, cursor: "pointer",
              }}>{t("downloadICS")}</button>
            </div>

            <div style={{ fontSize: 11, color: "#8a8a8a", fontFamily: "monospace", marginTop: 8, lineHeight: 1.6, whiteSpace: "pre-line" }}>
              {t("settingsNote")}
            </div>

            <ScienceEntry />

            <div style={{ fontSize: 10, color: "#8a8a8a", fontFamily: "monospace", lineHeight: 1.6, textAlign: "center", padding: "0 8px" }}>
              {t("disclaimer")}
            </div>
          </div>
        )}
      </div>

      {/* Bottom nav */}
      <div style={{ position: "sticky", bottom: 0, display: "flex", background: "#0A0A0F", borderTop: "1px solid #1a1a2e" }}>
        {navBtn(`🌙 ${t("dashboard")}`, "dashboard")}
        {navBtn(`📅 ${t("calendar")}`, "calendar")}
        {navBtn(`✦ ${t("consult")}`, "consult")}
        {navBtn(`📖 ${t("guide")}`, "guide")}
        {navBtn(`⚙️ ${t("settings")}`, "settings")}
      </div>

      {showNotice && <FertilityNotice mode={noticeMode} onClose={closeNotice} />}
    </div>
    </ScienceNavContext.Provider>
    </PrefsContext.Provider>
  );
}
