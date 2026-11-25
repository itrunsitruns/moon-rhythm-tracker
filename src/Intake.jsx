import { useState } from "react";
import { useLang } from "./i18n";
import { BOOKING_URL } from "./config";

// ══════════════════════════════════
// ── Health intake (local only), consult summary, booking ──
// ══════════════════════════════════
// Everything here stays in localStorage. Nothing is uploaded: the summary is
// shown on screen and leaves the device only if the user copies or downloads it.

export const INTAKE_GOALS = ["fasting", "conceive", "avoid", "sleep", "mood", "digestion", "cramps", "energy"];
export const INTAKE_CONTRA = ["ed", "pregnant", "breastfeeding", "underweight", "diabetes", "minor", "doctor"];
const REGULARITY = ["regular", "somewhat", "irregular", "unsure"];
const DIETS = ["omnivore", "vegetarian", "vegan", "lowcarb", "other"];
export const SUMMARY_FIELDS = ["cycle", "goals", "history", "meds", "diet", "contra", "notes", "logs"];
export const DEFAULT_SUMMARY_FIELDS = ["cycle", "goals"];

const EMPTY_INTAKE = {
  goals: [], regularity: "", history: "", meds: "", diet: "", notes: "",
  contra: [], doctorNote: "", updatedAt: null,
};

// Any contraindication ticked → the app stops showing long-fast suggestions.
export function intakeHasContra(intake) {
  return !!(intake && Array.isArray(intake.contra) && intake.contra.length > 0);
}

function isoDate(d) { return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`; }
function addDays(date, n) { const d = new Date(date); d.setDate(d.getDate() + n); return d; }

// Last 28 days of logs, reduced to a few plain numbers.
function summarizeLogs(logs) {
  const today = new Date();
  const fastH = [], bbt = [];
  const mucus = { sticky: 0, eggwhite: 0, watery: 0 };
  for (let i = 0; i < 28; i++) {
    const log = logs[isoDate(addDays(today, -i))];
    if (!log) continue;
    if (log.hours > 0) fastH.push(log.hours);
    if (log.bbt) bbt.push(Number(log.bbt));
    if (log.mucus && mucus[log.mucus] !== undefined) mucus[log.mucus]++;
  }
  return {
    fastDays: fastH.length,
    fastAvg: fastH.length ? (fastH.reduce((a, b) => a + b, 0) / fastH.length).toFixed(1) : null,
    fastMax: fastH.length ? Math.max(...fastH) : null,
    bbtCount: bbt.length,
    bbtMin: bbt.length ? Math.min(...bbt).toFixed(2) : null,
    bbtMax: bbt.length ? Math.max(...bbt).toFixed(2) : null,
    mucus,
  };
}

export function buildSummary({ fields, intake, cycleInfo, logs, t }) {
  const it = intake || EMPTY_INTAKE;
  const L = [];
  const sec = (title, lines) => { const body = lines.filter(Boolean); if (body.length) L.push("", `【${title}】`, ...body); };
  const list = (keys, prefix) => keys.map(k => t(`${prefix}.${k}`)).join(t("summary.sep"));

  L.push(`🌙 ${t("summary.header")}`, `${t("summary.generatedAt")}：${isoDate(new Date())}`);

  if (fields.includes("cycle") && cycleInfo) {
    sec(t("summary.field.cycle"), [
      t("summary.cycleLine1", { start: cycleInfo.periodStart, len: cycleInfo.cycleLen }),
      cycleInfo.cycleDay ? t("summary.cycleLine2", { day: cycleInfo.cycleDay, phase: cycleInfo.phaseLabel }) : "",
      t("summary.cycleLine3", { ov: cycleInfo.ovDate, win: cycleInfo.fertileWindow, next: cycleInfo.nextPeriod }),
      t("summary.cycleEstimate"),
    ]);
  }
  if (fields.includes("goals")) sec(t("summary.field.goals"), [it.goals.length ? list(it.goals, "intake.goal") : t("summary.none")]);
  if (fields.includes("history")) sec(t("summary.field.history"), [
    it.regularity ? `${t("intake.regularity")}：${t(`intake.reg.${it.regularity}`)}` : "",
    it.history || (!it.regularity ? t("summary.none") : ""),
  ]);
  if (fields.includes("meds")) sec(t("summary.field.meds"), [it.meds || t("summary.none")]);
  if (fields.includes("diet")) sec(t("summary.field.diet"), [it.diet ? t(`intake.diet.${it.diet}`) : t("summary.none")]);
  if (fields.includes("contra")) sec(t("summary.field.contra"), [
    it.contra.length ? list(it.contra, "intake.contra") : t("summary.none"),
    it.doctorNote ? `${t("intake.doctorNote")}：${it.doctorNote}` : "",
  ]);
  if (fields.includes("notes")) sec(t("summary.field.notes"), [it.notes || t("summary.none")]);
  if (fields.includes("logs")) {
    const s = summarizeLogs(logs || {});
    const m = s.mucus;
    sec(t("summary.field.logs"), [
      s.fastDays ? t("summary.logsFast", { n: s.fastDays, avg: s.fastAvg, max: s.fastMax }) : t("summary.logsFastNone"),
      s.bbtCount ? t("summary.logsBbt", { n: s.bbtCount, min: s.bbtMin, max: s.bbtMax }) : "",
      (m.sticky + m.eggwhite + m.watery) ? t("summary.logsMucus", { e: m.eggwhite, s: m.sticky, w: m.watery }) : "",
    ]);
  }
  L.push("", "—", t("summary.footer"));
  return L.join("\n");
}

// Copy synchronously (keeps the user gesture alive for a following window.open);
// falls back to the async Clipboard API.
export function copyText(text) {
  try {
    const ta = document.createElement("textarea");
    ta.value = text; ta.setAttribute("readonly", ""); ta.style.position = "fixed"; ta.style.opacity = "0";
    document.body.appendChild(ta); ta.select();
    const ok = document.execCommand("copy");
    document.body.removeChild(ta);
    if (ok) return true;
  } catch { /* fall through */ }
  try { navigator.clipboard?.writeText(text); return true; } catch { return false; }
}

// ── Shared styles ──
const card = { background: "#111118", border: "1px solid #2a2a3e", borderRadius: 12, padding: 16 };
const label = { fontSize: 11, color: "#D4A017", fontFamily: "monospace", display: "block", marginBottom: 6 };
const input = {
  width: "100%", padding: 8, background: "#0A0A0F", color: "#ddd", border: "1px solid #2a2a3e",
  borderRadius: 6, fontFamily: "inherit", fontSize: 13, boxSizing: "border-box",
};
const btn = (accent = "#aaa") => ({
  padding: "9px 12px", background: "transparent", color: accent, border: `1px solid ${accent}55`,
  borderRadius: 8, fontFamily: "monospace", fontSize: 12, cursor: "pointer",
});
const chip = (on, accent = "#D4A017") => ({
  padding: "6px 10px", borderRadius: 16, fontSize: 12, cursor: "pointer", fontFamily: "inherit",
  background: on ? accent + "22" : "transparent", color: on ? accent : "#888",
  border: `1px solid ${on ? accent + "88" : "#2a2a3e"}`,
});

function toggleIn(arr, v) { return arr.includes(v) ? arr.filter(x => x !== v) : [...arr, v]; }

// ══════════════════════════════════
// ── Intake card ──
// ══════════════════════════════════
export function IntakeCard({ intake, setIntake, appGoals }) {
  const { t } = useLang();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(EMPTY_INTAKE);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const startEdit = () => {
    setDraft(intake ? { ...EMPTY_INTAKE, ...intake } : { ...EMPTY_INTAKE, goals: appGoals.filter(g => INTAKE_GOALS.includes(g)) });
    setEditing(true); setConfirmDelete(false);
  };
  const save = () => { setIntake({ ...draft, updatedAt: isoDate(new Date()) }); setEditing(false); };
  const set = (k, v) => setDraft(d => ({ ...d, [k]: v }));

  return (
    <div style={card}>
      <div style={{ fontSize: 14, color: "#D4A017", fontFamily: "serif", marginBottom: 4 }}>📝 {t("intake.title")}</div>
      <div style={{ fontSize: 11, color: "#888", fontFamily: "monospace", lineHeight: 1.6, marginBottom: 12 }}>🔒 {t("intake.privacy")}</div>

      {editing ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div>
            <span style={label}>{t("intake.goals")}</span>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {INTAKE_GOALS.map(g => (
                <button key={g} type="button" onClick={() => set("goals", toggleIn(draft.goals, g))} style={chip(draft.goals.includes(g))}>{t(`intake.goal.${g}`)}</button>
              ))}
            </div>
          </div>
          <div>
            <span style={label}>{t("intake.regularity")}</span>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {REGULARITY.map(r => (
                <button key={r} type="button" onClick={() => set("regularity", draft.regularity === r ? "" : r)} style={chip(draft.regularity === r)}>{t(`intake.reg.${r}`)}</button>
              ))}
            </div>
          </div>
          <label>
            <span style={label}>{t("intake.history")}</span>
            <textarea rows={3} value={draft.history} onChange={e => set("history", e.target.value)} placeholder={t("intake.historyPh")} style={input} />
          </label>
          <label>
            <span style={label}>{t("intake.meds")}</span>
            <textarea rows={2} value={draft.meds} onChange={e => set("meds", e.target.value)} placeholder={t("intake.medsPh")} style={input} />
          </label>
          <div>
            <span style={label}>{t("intake.diet")}</span>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {DIETS.map(d => (
                <button key={d} type="button" onClick={() => set("diet", draft.diet === d ? "" : d)} style={chip(draft.diet === d)}>{t(`intake.diet.${d}`)}</button>
              ))}
            </div>
          </div>
          <div>
            <span style={label}>{t("intake.contra")}</span>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {INTAKE_CONTRA.map(c => (
                <button key={c} type="button" onClick={() => set("contra", toggleIn(draft.contra, c))} style={chip(draft.contra.includes(c), "#FF6B6B")}>{t(`intake.contra.${c}`)}</button>
              ))}
            </div>
            {draft.contra.includes("doctor") && (
              <input value={draft.doctorNote} onChange={e => set("doctorNote", e.target.value)} placeholder={t("intake.doctorNote")} style={{ ...input, marginTop: 8 }} />
            )}
          </div>
          <label>
            <span style={label}>{t("intake.notes")}</span>
            <textarea rows={2} value={draft.notes} onChange={e => set("notes", e.target.value)} style={input} />
          </label>
          <div style={{ display: "flex", gap: 8 }}>
            <button type="button" onClick={save} style={{ ...btn("#4A9E8E"), flex: 1 }}>{t("intake.save")}</button>
            <button type="button" onClick={() => setEditing(false)} style={btn()}>{t("booking.cancel")}</button>
          </div>
        </div>
      ) : intake ? (
        <div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6, fontSize: 12.5, color: "#ccc", lineHeight: 1.6 }}>
            {intake.goals?.length > 0 && <div><span style={{ color: "#888" }}>{t("summary.field.goals")}：</span>{intake.goals.map(g => t(`intake.goal.${g}`)).join(t("summary.sep"))}</div>}
            {intake.regularity && <div><span style={{ color: "#888" }}>{t("intake.regularity")}：</span>{t(`intake.reg.${intake.regularity}`)}</div>}
            {intake.history && <div><span style={{ color: "#888" }}>{t("summary.field.history")}：</span>{intake.history}</div>}
            {intake.meds && <div><span style={{ color: "#888" }}>{t("summary.field.meds")}：</span>{intake.meds}</div>}
            {intake.diet && <div><span style={{ color: "#888" }}>{t("summary.field.diet")}：</span>{t(`intake.diet.${intake.diet}`)}</div>}
            {intake.contra?.length > 0 && <div><span style={{ color: "#888" }}>{t("summary.field.contra")}：</span><span style={{ color: "#FF8B8B" }}>{intake.contra.map(c => t(`intake.contra.${c}`)).join(t("summary.sep"))}</span></div>}
            {intake.notes && <div><span style={{ color: "#888" }}>{t("summary.field.notes")}：</span>{intake.notes}</div>}
          </div>
          {intakeHasContra(intake) && (
            <div style={{ fontSize: 11, color: "#FF8B8B", fontFamily: "monospace", lineHeight: 1.6, marginTop: 10 }}>{t("intake.contraActive")}</div>
          )}
          <div style={{ fontSize: 10, color: "#666", fontFamily: "monospace", marginTop: 8 }}>{t("intake.updated", { d: intake.updatedAt || "—" })}</div>
          {confirmDelete ? (
            <div style={{ marginTop: 10 }}>
              <div style={{ fontSize: 12, color: "#FF8B8B", marginBottom: 8 }}>{t("intake.deleteConfirm")}</div>
              <div style={{ display: "flex", gap: 8 }}>
                <button type="button" onClick={() => { setIntake(null); setConfirmDelete(false); }} style={{ ...btn("#FF6B6B"), flex: 1 }}>{t("intake.deleteYes")}</button>
                <button type="button" onClick={() => setConfirmDelete(false)} style={btn()}>{t("booking.cancel")}</button>
              </div>
            </div>
          ) : (
            <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
              <button type="button" onClick={startEdit} style={{ ...btn(), flex: 1 }}>{t("intake.edit")}</button>
              <button type="button" onClick={() => setConfirmDelete(true)} style={btn("#C0392B")}>{t("intake.delete")}</button>
            </div>
          )}
        </div>
      ) : (
        <div>
          <div style={{ fontSize: 12, color: "#aaa", lineHeight: 1.6, marginBottom: 10 }}>{t("intake.empty")}</div>
          <button type="button" onClick={startEdit} style={{ ...btn("#D4A017"), width: "100%" }}>{t("intake.start")}</button>
        </div>
      )}
    </div>
  );
}

// ══════════════════════════════════
// ── Consult summary card ──
// ══════════════════════════════════
export function SummaryCard({ fields, setFields, makeSummary }) {
  const { t } = useLang();
  const [text, setText] = useState("");
  const [copied, setCopied] = useState(false);

  const generate = () => { setText(makeSummary()); setCopied(false); };
  const copy = () => { if (copyText(text)) setCopied(true); };
  const download = () => {
    const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `moonyou-summary-${isoDate(new Date())}.txt`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  };

  return (
    <div style={card}>
      <div style={{ fontSize: 14, color: "#D4A017", fontFamily: "serif", marginBottom: 4 }}>📄 {t("summary.title")}</div>
      <div style={{ fontSize: 11, color: "#888", fontFamily: "monospace", lineHeight: 1.6, marginBottom: 12 }}>{t("summary.desc")}</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 12 }}>
        {SUMMARY_FIELDS.map(f => (
          <label key={f} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12.5, color: "#ccc", cursor: "pointer" }}>
            <input type="checkbox" checked={fields.includes(f)} onChange={() => { setFields(toggleIn(fields, f)); setText(""); }} />
            {t(`summary.field.${f}`)}
          </label>
        ))}
      </div>
      <button type="button" onClick={generate} disabled={!fields.length} style={{ ...btn("#D4A017"), width: "100%", opacity: fields.length ? 1 : 0.4 }}>{t("summary.generate")}</button>
      {text && (
        <>
          <textarea readOnly value={text} rows={Math.min(18, text.split("\n").length + 1)} style={{ ...input, marginTop: 10, fontFamily: "monospace", fontSize: 11.5, lineHeight: 1.5 }} />
          <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
            <button type="button" onClick={copy} style={{ ...btn("#4A9E8E"), flex: 1 }}>{copied ? t("summary.copied") : t("summary.copy")}</button>
            <button type="button" onClick={download} style={{ ...btn(), flex: 1 }}>{t("summary.download")}</button>
          </div>
        </>
      )}
    </div>
  );
}

// ══════════════════════════════════
// ── Human consult booking ──
// ══════════════════════════════════
export function BookingCard({ fields, makeSummary }) {
  const { t } = useLang();
  const [open, setOpen] = useState(false);
  const [attach, setAttach] = useState(false);
  const [done, setDone] = useState(false);
  const ready = !!BOOKING_URL;

  const go = () => {
    if (attach) copyText(makeSummary());
    window.open(BOOKING_URL, "_blank", "noopener");
    setDone(true);
  };

  return (
    <div style={{ ...card, border: "1px solid #4A9E8E33" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
        <div style={{ fontSize: 14, color: "#4A9E8E", fontFamily: "serif" }}>👩‍⚕️ {t("consult.humanTitle")}</div>
        <div style={{ fontSize: 9, color: "#4A9E8E", border: "1px solid #4A9E8E55", borderRadius: 4, padding: "1px 6px", fontFamily: "monospace", flexShrink: 0 }}>{t("addonTag")}</div>
      </div>
      <div style={{ fontSize: 11, color: "#4A9E8E", fontFamily: "monospace", marginBottom: 8 }}>{t("consult.humanPrice")}</div>
      <div style={{ fontSize: 12, color: "#aaa", lineHeight: 1.7, marginBottom: 12 }}>{t("consult.humanDesc")}</div>

      {!open ? (
        <button type="button" onClick={() => { setOpen(true); setDone(false); }} style={{ ...btn("#4A9E8E"), width: "100%", padding: 11 }}>
          {t("consult.humanCta")} →
        </button>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10, borderTop: "1px dashed #4A9E8E33", paddingTop: 12 }}>
          <div style={{ fontSize: 12, color: "#4A9E8E", fontFamily: "monospace" }}>{t("booking.scopeTitle")}</div>
          <div style={{ fontSize: 12.5, color: "#ccc", lineHeight: 1.7 }}>✓ {t("booking.scopeDo")}</div>
          <div style={{ fontSize: 12.5, color: "#ccc", lineHeight: 1.7 }}>✕ {t("booking.scopeDont")}</div>
          <div style={{ fontSize: 13, color: "#FF8B8B", fontWeight: "bold" }}>⚠️ {t("booking.notDiagnosis")}</div>

          {ready ? (
            <>
              <label style={{ display: "flex", alignItems: "flex-start", gap: 8, fontSize: 12.5, color: "#ccc", lineHeight: 1.6, cursor: "pointer" }}>
                <input type="checkbox" checked={attach} onChange={e => setAttach(e.target.checked)} style={{ marginTop: 4 }} />
                <span>
                  {t("booking.attach")}
                  {attach && <span style={{ display: "block", fontSize: 11, color: "#888", fontFamily: "monospace" }}>
                    {t("booking.attachFields", { list: fields.length ? fields.map(f => t(`summary.field.${f}`)).join(t("summary.sep")) : t("summary.none") })}
                  </span>}
                </span>
              </label>
              <div style={{ fontSize: 10.5, color: "#777", fontFamily: "monospace", lineHeight: 1.6 }}>{t("booking.external")}</div>
              {done && <div style={{ fontSize: 12, color: "#4A9E8E", lineHeight: 1.6 }}>{attach ? t("booking.copiedOpen") : t("booking.opened")}</div>}
              <div style={{ display: "flex", gap: 8 }}>
                <button type="button" onClick={go} style={{ ...btn("#4A9E8E"), flex: 1, padding: 11 }}>{t("booking.continue")} →</button>
                <button type="button" onClick={() => setOpen(false)} style={btn()}>{t("booking.cancel")}</button>
              </div>
            </>
          ) : (
            <>
              <div style={{ fontSize: 12.5, color: "#D4A017", lineHeight: 1.6 }}>{t("booking.notReady")}</div>
              <button type="button" onClick={() => setOpen(false)} style={btn()}>{t("close")}</button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
