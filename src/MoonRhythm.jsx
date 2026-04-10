import { useState, useCallback, useMemo } from "react";
import useLocalStorage from "./useLocalStorage";
import { useLang } from "./i18n";
import { syncToGoogleCalendar, downloadICS } from "./googleCalendar";

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

// ── Default fasting hours by phase ──
const PHASE_DEFAULT_HOURS = {
  menstrual: 12, follicular_gold: 72, follicular_late: 36,
  ovulation: 12, luteal: 12, safe: 12,
};

function getFastingAdvice(cycleDay, cycleLen, t) {
  const ovDay = cycleLen - 14;
  if (cycleDay <= 5) return { fast: t("fast.menstrual"), tip: t("tip.menstrual"), defaultH: 12 };
  if (cycleDay <= 10) return { fast: t("fast.follicular_gold"), tip: t("tip.follicular_gold"), defaultH: 72 };
  if (cycleDay < ovDay - 5) return { fast: t("fast.follicular_late"), tip: t("tip.follicular_late"), defaultH: 36 };
  if (cycleDay >= ovDay - 5 && cycleDay <= ovDay + 1) return { fast: t("fast.ovulation"), tip: t("tip.ovulation"), defaultH: 12 };
  return { fast: t("fast.luteal"), tip: t("tip.luteal"), defaultH: 12 };
}

// ── Utilities ──
function addDays(date, n) { const d = new Date(date); d.setDate(d.getDate() + n); return d; }
function daysBetween(a, b) { return Math.round((b - a) / 86400000); }
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

function getFertility(date, periodStart, cycleLen) {
  const start = new Date(periodStart);
  const diff = daysBetween(start, date);
  if (diff < 0) return 0;
  const day = (diff % cycleLen) + 1;
  const ovDay = cycleLen - 14;
  const dist = Math.abs(day - ovDay);
  if (dist === 0) return 95;
  if (dist <= 2) return 70;
  if (dist <= 5) return 30;
  return 5;
}

// ── Dynamic ovulation detection from BBT/mucus ──
function detectOvulationFromLogs(logs) {
  const detected = [];
  Object.entries(logs).forEach(([dateKey, log]) => {
    if ((log.bbt && log.bbt > 36.7) || log.mucus === "eggwhite") {
      detected.push(dateKey);
    }
  });
  return detected.sort();
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

function computeStats(logs, periodStart, cycleLen, t) {
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
  let monthTotal = 0, monthSuggested = 0, monthDays = 0;
  const pStart = parseLocal(periodStart);
  for (let d = new Date(monthStart); d <= monthEnd && d <= today; d = addDays(d, 1)) {
    const phase = getPhase(d, pStart, cycleLen);
    monthSuggested += PHASE_DEFAULT_HOURS[phase] || 12;
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

  const daysInWeekSoFar = Math.max(1, (today.getDay() + 6) % 7 + 1);
  return {
    weekTotal, weekAvg: weekTotal > 0 ? (weekTotal / daysInWeekSoFar).toFixed(1) : 0,
    monthTotal, monthRate: monthSuggested > 0 ? Math.round((monthTotal / monthSuggested) * 100) : 0,
    weeks, maxWeek: Math.max(...weeks.map(w => w.total), 1),
  };
}

// ══════════════════════════════════
// ── Moon disc component ──
// ══════════════════════════════════
function MoonDisc({ periodStart, cycleLen, today, flags }) {
  const { t } = useLang();
  const segments = [];
  const cx = 150, cy = 150, r = 120;
  for (let i = 0; i < cycleLen; i++) {
    const date = addDays(periodStart, i);
    const phase = getPhase(date, periodStart, cycleLen);
    const cfg = PHASE_CONFIG[phase];
    const a1 = (i / cycleLen) * 360 - 90, a2 = ((i + 1) / cycleLen) * 360 - 90;
    const r1 = (a1 * Math.PI) / 180, r2 = (a2 * Math.PI) / 180;
    const isToday = isoDate(date) === isoDate(today);
    segments.push(
      <path key={i}
        d={`M${cx},${cy} L${cx + r * Math.cos(r1)},${cy + r * Math.sin(r1)} A${r},${r} 0 ${a2 - a1 > 180 ? 1 : 0} 1 ${cx + r * Math.cos(r2)},${cy + r * Math.sin(r2)} Z`}
        fill={cfg.color} opacity={isToday ? 1 : 0.55}
        stroke={isToday ? "#fff" : "#000"} strokeWidth={isToday ? 2.5 : 0.5} />
    );
  }
  const todayPhase = getPhase(today, periodStart, cycleLen);
  const todayMoon = getMoonPhase(today, t);
  const cDay = getCycleDay(today, periodStart, cycleLen);
  const fa = cDay ? getFastingAdvice(cDay, cycleLen, t) : { fast: "—" };
  return (
    <svg viewBox="0 0 300 300" style={{ width: "100%", maxWidth: 300 }}>
      {segments}
      <circle cx={cx} cy={cy} r={48} fill="#0A0A0F" />
      <text x={cx} y={cy - 12} textAnchor="middle" fill="#ddd" fontSize="24">{todayMoon.emoji}</text>
      <text x={cx} y={cy + 8} textAnchor="middle" fill="#ccc" fontSize="10" fontFamily="monospace">{resolvePhaseLabel(todayPhase, flags, t)}</text>
      {flags.showFasting && <text x={cx} y={cy + 22} textAnchor="middle" fill="#888" fontSize="8" fontFamily="monospace">{fa.fast}</text>}
    </svg>
  );
}

// ══════════════════════════════════
// ── Fasting Stats Section ──
// ══════════════════════════════════
function FastingStats({ logs, periodStart, cycleLen }) {
  const { t } = useLang();
  const stats = useMemo(() => computeStats(logs, periodStart, cycleLen, t), [logs, periodStart, cycleLen, t]);
  const hasData = stats.weekTotal > 0 || stats.monthTotal > 0;

  return (
    <div style={{ background: "#111118", borderRadius: 12, padding: 16, marginBottom: 12 }}>
      <div style={{ fontSize: 14, color: "#ccc", marginBottom: 12, fontFamily: "serif" }}>{t("statsTitle")}</div>

      {!hasData ? (
        <div style={{ fontSize: 12, color: "#555", fontFamily: "monospace", textAlign: "center", padding: 12 }}>{t("noData")}</div>
      ) : (
        <>
          {/* Week & Month row */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 14 }}>
            <div style={{ background: "#0A0A0F", borderRadius: 8, padding: 10 }}>
              <div style={{ fontSize: 10, color: "#666", fontFamily: "monospace" }}>{t("thisWeek")}</div>
              <div style={{ fontSize: 18, color: "#D4A017", fontFamily: "monospace" }}>{stats.weekTotal}h</div>
              <div style={{ fontSize: 10, color: "#555", fontFamily: "monospace" }}>{t("avgPerDay")} {stats.weekAvg}h</div>
            </div>
            <div style={{ background: "#0A0A0F", borderRadius: 8, padding: 10 }}>
              <div style={{ fontSize: 10, color: "#666", fontFamily: "monospace" }}>{t("thisMonth")}</div>
              <div style={{ fontSize: 18, color: "#4A9E8E", fontFamily: "monospace" }}>{stats.monthTotal}h</div>
              <div style={{ fontSize: 10, color: "#555", fontFamily: "monospace" }}>{t("completionRate")} {stats.monthRate}%</div>
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
                <div style={{ fontSize: 8, color: "#555", fontFamily: "monospace" }}>{w.label}</div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// ══════════════════════════════════
// ── Calendar grid ──
// ══════════════════════════════════
function CalendarGrid({ periodStart, cycleLen, year, month, logs, onSelectDate, selectedDate, flags, ovDetected }) {
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
    const isOvDetected = ovDetected.includes(key);

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
        outline: isToday ? `2px solid ${cfg.color}` : isSelected ? `1px solid ${cfg.color}88` : "none",
        minHeight: 48, boxShadow: flags.showAvoidWarn && isDanger ? "inset 0 0 0 1px #FF6B6B88" : "none",
      }}>
        <div style={{ fontSize: 10, color: "#aaa", fontFamily: "monospace" }}>{d}{badge}</div>
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

function DateDetail({ dateKey, periodStart, cycleLen, logs, onSaveLog, onDeleteLog, flags, ovDetected }) {
  const { t } = useLang();
  const date = parseLocal(dateKey);
  const phase = getPhase(date, periodStart, cycleLen);
  const cfg = PHASE_CONFIG[phase];
  const moon = getMoonPhase(date, t);
  const cDay = getCycleDay(date, periodStart, cycleLen);
  const fasting = cDay ? getFastingAdvice(cDay, cycleLen, t) : { fast: "—", tip: "", defaultH: 12 };
  const fertility = getFertility(date, periodStart, cycleLen);
  const isDanger = phase === "ovulation";
  const isOvDetected = ovDetected.includes(dateKey);

  const existing = logs[dateKey];
  const [hours, setHours] = useState(existing?.hours ?? fasting.defaultH);
  const [bbt, setBbt] = useState(existing?.bbt ?? "");
  const [mucus, setMucus] = useState(existing?.mucus ?? "none");
  const [editing, setEditing] = useState(!existing);

  // Reset form when dateKey changes
  const [prevKey, setPrevKey] = useState(dateKey);
  if (dateKey !== prevKey) {
    setPrevKey(dateKey);
    const ex = logs[dateKey];
    setHours(ex?.hours ?? fasting.defaultH);
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
      <div style={{ fontSize: 12, color: "#aaa", marginBottom: 4 }}>{t("moonPhase")}：{moon.emoji} {moon.name}</div>
      {isOvDetected && (
        <div style={{ fontSize: 12, color: "#FF6B6B", marginBottom: 4 }}>
          {t("possibleOvulation")} — {t("bbtDetected")}
        </div>
      )}
      {flags.showFertility && (
        <div style={{ fontSize: 12, color: "#aaa", marginBottom: 4 }}>
          {t("pregnancyRisk")}：<span style={{ color: fertility > 60 ? "#FF6B6B" : "#4A9E8E" }}>{fertility}%</span>
        </div>
      )}
      {flags.showConceive && (
        <div style={{ fontSize: 12, color: isDanger ? "#FF6B6B" : "#888", marginBottom: 4 }}>
          {isDanger ? t("conceiveTip") : t("conceiveNonOvTip")}
        </div>
      )}
      {flags.showFasting && (
        <div style={{ fontSize: 12, color: "#ccc", marginBottom: 8 }}>
          {t("fastingAdvice")}：<span style={{ color: cfg.color, fontWeight: "bold" }}>{fasting.fast}</span>
          <span style={{ color: "#666", fontSize: 11 }}> — {fasting.tip}</span>
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

      {/* Medical disclaimer */}
      <div style={{ fontSize: 10, color: "#555", fontFamily: "monospace", lineHeight: 1.6, textAlign: "center", padding: "0 8px", marginTop: 4 }}>
        {t("disclaimer")}
      </div>
    </div>
  );
}

// ══════════════════════════════════
// ── Main App ──
// ══════════════════════════════════
export default function MoonRhythm() {
  const { t, lang, toggle: toggleLang } = useLang();

  const [cycleLen, setCycleLen] = useLocalStorage("moon-cycleLen", 28);
  const [periodStart, setPeriodStart] = useLocalStorage("moon-periodStart", isoDate(addDays(new Date(), -5)));
  const [goals, setGoals] = useLocalStorage("moon-goals", ["fasting"]);
  const [logs, setLogs] = useLocalStorage("moon-logs", {});

  const flags = useGoalFlags(goals);

  const toggleGoal = useCallback((g) => {
    setGoals(prev => {
      const set = new Set(prev);
      if (set.has(g)) { set.delete(g); if (set.size === 0) return prev; return [...set]; }
      if (g === "avoid") set.delete("conceive");
      if (g === "conceive") set.delete("avoid");
      set.add(g);
      return [...set];
    });
  }, [setGoals]);

  const [view, setView] = useState("dashboard");
  const [calMonth, setCalMonth] = useState(new Date().getMonth());
  const [calYear, setCalYear] = useState(new Date().getFullYear());
  const [selectedDate, setSelectedDate] = useState(null);
  const [syncStatus, setSyncStatus] = useState(null);

  const today = new Date();
  const pStart = parseLocal(periodStart);
  const todayPhase = getPhase(today, pStart, cycleLen);
  const todayCfg = PHASE_CONFIG[todayPhase];
  const todayMoon = getMoonPhase(today, t);
  const fertility = getFertility(today, pStart, cycleLen);
  const ovDay = cycleLen - 14;
  const ovDate = addDays(pStart, ovDay - 1);
  const dangerStart = addDays(ovDate, -5);
  const dangerEnd = addDays(ovDate, 1);
  const diff = daysBetween(pStart, today);
  const cycleDay = diff >= 0 ? (diff % cycleLen) + 1 : null;
  const todayFasting = cycleDay ? getFastingAdvice(cycleDay, cycleLen, t) : { fast: "—", tip: "", defaultH: 12 };

  // Dynamic ovulation detection
  const ovDetected = useMemo(() => detectOvulationFromLogs(logs), [logs]);

  const saveLog = useCallback((key, data) => {
    setLogs(prev => ({ ...prev, [key]: data }));
  }, [setLogs]);

  const deleteLog = useCallback((key) => {
    setLogs(prev => { const next = { ...prev }; delete next[key]; return next; });
  }, [setLogs]);

  const handleSyncGCal = async () => {
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
    if (!clientId) { setSyncStatus("no-config"); return; }
    setSyncStatus("syncing");
    try {
      const count = await syncToGoogleCalendar({ periodStart, cycleLen, numCycles: 3, t });
      setSyncStatus(`done:${count}`);
    } catch { setSyncStatus("error"); }
  };

  const handleDownloadICS = () => downloadICS({ periodStart, cycleLen, numCycles: 6, t });

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
      fontFamily: "monospace", fontSize: 12, cursor: "pointer",
    }}>{label}</button>
  );

  const todayPhaseLabel = resolvePhaseLabel(todayPhase, flags, t);
  const todayLog = logs[isoDate(today)];

  return (
    <div style={{ background: "#0A0A0F", color: "#ddd", minHeight: "100vh", fontFamily: "'Crimson Text', Georgia, serif", maxWidth: 420, margin: "0 auto" }}>
      {/* Header */}
      <div style={{ padding: "20px 16px 8px", borderBottom: "1px solid #1a1a2e", display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 20, letterSpacing: 2, color: todayCfg.color, fontFamily: "serif" }}>
            🌙 <span style={{ fontFamily: "'Cormorant Garamond', serif", fontStyle: "italic", fontWeight: 600 }}>Moonyou</span> 你的月亮
          </h1>
          <div style={{ fontSize: 11, color: "#666", fontFamily: "monospace", marginTop: 2 }}>
            {cycleDay ? t("cycleDay", { n: cycleDay }) : "—"} · {todayPhaseLabel} · {todayMoon.emoji} {todayMoon.name}
          </div>
        </div>
        <button onClick={toggleLang} style={{ background: "#1a1a2e", color: "#aaa", border: "1px solid #2a2a3e", borderRadius: 6, padding: "4px 10px", fontFamily: "monospace", fontSize: 11, cursor: "pointer", flexShrink: 0, marginTop: 2 }}>
          {lang === "zh" ? "EN" : "中"}
        </button>
      </div>

      <div style={{ padding: 16 }}>
        {/* ─── DASHBOARD ─── */}
        {view === "dashboard" && (
          <div>
            <div style={{ display: "flex", justifyContent: "center", marginBottom: 16 }}>
              <MoonDisc periodStart={pStart} cycleLen={cycleLen} today={today} flags={flags} />
            </div>

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
              <div style={{ fontSize: 12, color: "#888", marginBottom: 4 }}>{t("moonPhase")}：{todayMoon.emoji} {todayMoon.name}</div>
              <div style={{ fontSize: 13, color: "#aaa", marginBottom: 8 }}>{resolvePhaseDesc(todayPhase, flags, t)}</div>
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
                </>
              )}
              {todayLog && todayLog.hours > 0 && (
                <div style={{ fontSize: 12, color: "#4A9E8E", fontFamily: "monospace", marginTop: 6 }}>
                  ✓ {todayLog.hours}h {t("logged").replace("✓ ", "")}
                </div>
              )}
            </div>

            {/* Fertility bar */}
            {flags.showFertility && (
              <div style={{ background: "#111118", borderRadius: 12, padding: 16, marginBottom: 12 }}>
                <div style={{ fontSize: 13, color: "#888", marginBottom: 6, fontFamily: "monospace" }}>{t("pregnancyRisk")}</div>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{ flex: 1, height: 8, background: "#1a1a2e", borderRadius: 4, overflow: "hidden" }}>
                    <div style={{ width: `${fertility}%`, height: "100%", background: fertility > 60 ? "#FF6B6B" : fertility > 25 ? "#D4A017" : "#4A9E8E", borderRadius: 4, transition: "width 0.3s" }} />
                  </div>
                  <span style={{ fontSize: 14, fontFamily: "monospace", color: fertility > 60 ? "#FF6B6B" : "#4A9E8E", minWidth: 36 }}>{fertility}%</span>
                </div>
                <div style={{ fontSize: 11, color: "#666", marginTop: 6, fontFamily: "monospace" }}>
                  {t("ovulationEstimate")}：{fmt(ovDate)} · {t("dangerPeriod")}：{fmt(dangerStart)}–{fmt(dangerEnd)}
                </div>
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
              logs={logs} onSelectDate={setSelectedDate} selectedDate={selectedDate} flags={flags} ovDetected={ovDetected} />
            {selectedDate ? (
              <DateDetail dateKey={selectedDate} periodStart={pStart} cycleLen={cycleLen}
                logs={logs} onSaveLog={saveLog} onDeleteLog={deleteLog} flags={flags} ovDetected={ovDetected} />
            ) : (
              <div style={{ marginTop: 12, fontSize: 11, color: "#666", fontFamily: "monospace", textAlign: "center" }}>{t("clickToView")}</div>
            )}
          </div>
        )}

        {/* ─── GUIDE ─── */}
        {view === "guide" && <GuideView />}

        {/* ─── SETTINGS ─── */}
        {view === "settings" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div>
              <label style={{ fontSize: 12, color: "#888", fontFamily: "monospace", display: "block", marginBottom: 4 }}>{t("periodStartLabel")}</label>
              <input type="date" value={periodStart} onChange={e => setPeriodStart(e.target.value)}
                style={{ width: "100%", padding: 10, background: "#111118", color: "#ddd", border: "1px solid #2a2a3e", borderRadius: 8, fontFamily: "monospace", fontSize: 14, boxSizing: "border-box" }} />
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
              <div style={{ fontSize: 10, color: "#555", fontFamily: "monospace", marginTop: 4 }}>{t("goalExclusive")}</div>
            </div>

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

            <div style={{ fontSize: 11, color: "#555", fontFamily: "monospace", marginTop: 8, lineHeight: 1.6, whiteSpace: "pre-line" }}>
              {t("settingsNote")}
            </div>

            <div style={{ fontSize: 10, color: "#555", fontFamily: "monospace", lineHeight: 1.6, textAlign: "center", padding: "0 8px" }}>
              {t("disclaimer")}
            </div>
          </div>
        )}
      </div>

      {/* Bottom nav */}
      <div style={{ position: "sticky", bottom: 0, display: "flex", background: "#0A0A0F", borderTop: "1px solid #1a1a2e" }}>
        {navBtn(`🌙 ${t("dashboard")}`, "dashboard")}
        {navBtn(`📅 ${t("calendar")}`, "calendar")}
        {navBtn(`📖 ${t("guide")}`, "guide")}
        {navBtn(`⚙️ ${t("settings")}`, "settings")}
      </div>
    </div>
  );
}
