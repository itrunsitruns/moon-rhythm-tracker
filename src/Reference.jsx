import { useState, useContext, createContext } from "react";
import { useLang } from "./i18n";
import REFS from "./data/references.json";

// ══════════════════════════════════
// ── Literature references (bundled JSON, works offline) ──
// ══════════════════════════════════
// src/data/references.json is an array of
//   { topic, title, authors, journal_or_source, year, doi, url,
//     key_finding_zh, how_to_use_in_app_zh }
// how_to_use_in_app_zh is a note for developers (how a source may be used in
// copy). It is never rendered.

// Stable ids for the topic strings used in the JSON.
const TOPIC_IDS = {
  "排卵時間與易孕窗": "ovulation",
  "日曆法與生育意識法效力": "fam_efficacy",
  "基礎體溫與子宮頸黏液訊號": "bbt_mucus",
  "週期與生育 App 的準確度與宣稱": "app_accuracy",
  "斷食、時間限制飲食與生殖荷爾蒙": "fasting",
  "鐵需求、月經與缺鐵": "iron",
  "個人化營養反應": "personal_nutrition",
  "腸道菌相、飲食與雌激素軸": "gut",
  "週期與睡眠、情緒、PMS／PMDD、運動": "sleep_mood",
  "臺灣健康 App 與廣告宣稱指引": "taiwan_regulation",
};
const topicId = (topic) => TOPIC_IDS[topic] || `other:${topic}`;

// Which topics back which screens.
export const REF_GROUPS = {
  fertility: ["ovulation", "fam_efficacy", "app_accuracy"],     // ovulation day, fertile window, contraception/conception modes
  signals: ["bbt_mucus"],                                        // BBT & mucus logging
  fasting: ["fasting"],                                          // fasting advice
  wellness: ["iron", "personal_nutrition", "gut", "sleep_mood"], // deep guide, daily explainers
};

// Topics in first-appearance order, each with its references.
const BY_TOPIC = REFS.reduce((acc, r) => {
  const id = topicId(r.topic);
  if (!acc.has(id)) acc.set(id, { id, topic: r.topic, refs: [] });
  acc.get(id).refs.push(r);
  return acc;
}, new Map());
export const ALL_TOPICS = [...BY_TOPIC.keys()];
export const REF_COUNT = REFS.length;

export function countRefs(topics) {
  return topics.reduce((n, id) => n + (BY_TOPIC.get(id)?.refs.length || 0), 0);
}

// Lets any reference block open the full "Scientific basis" page.
export const ScienceNavContext = createContext(null);

function topicTitle(id, t) {
  const g = BY_TOPIC.get(id);
  const key = `refTopic.${id}`;
  const label = t(key);
  return label === key ? g?.topic || id : label;
}

const trimDot = (s) => String(s || "").trim().replace(/[.。．]+$/, "");

function shortAuthors(authors) {
  const list = String(authors || "").split(/,\s*/);
  if (list.length <= 6) return trimDot(authors);
  return `${list.slice(0, 3).join(", ")}, et al`;
}

function linkFor(r) {
  if (r.doi) return { href: `https://doi.org/${r.doi}`, text: `doi:${r.doi}` };
  if (r.url) {
    let host = r.url;
    try { host = new URL(r.url).hostname.replace(/^www\./, ""); } catch { /* keep raw */ }
    return { href: r.url, text: host };
  }
  return null;
}

// 作者（年份）．標題．期刊．連結   /   Authors (Year). Title. Journal. Link
export function Reference({ r, showSummary = false }) {
  const { lang } = useLang();
  const zh = lang === "zh";
  const sep = zh ? "．" : ". ";
  const link = linkFor(r);
  const summary = zh ? r.key_finding_zh : r.key_finding_en; // English summaries don't exist yet → hidden
  return (
    <div style={{ fontSize: 11.5, color: "#a6a3b4", lineHeight: 1.6 }}>
      <span style={{ color: "#cfc8a8" }}>{shortAuthors(r.authors)}{zh ? `（${r.year}）` : ` (${r.year})`}</span>
      {sep}<span style={{ color: "#dcdcdc" }}>{trimDot(r.title)}</span>
      {sep}<span style={{ fontStyle: "italic" }}>{trimDot(r.journal_or_source)}</span>
      {link && <>{sep}<a href={link.href} target="_blank" rel="noopener noreferrer"
        style={{ color: "#D4A017", textDecoration: "none", wordBreak: "break-all" }}>{link.text} ↗</a></>}
      {showSummary && summary && (
        <div style={{ fontSize: 12, color: "#bdbdbd", marginTop: 4, paddingLeft: 10, borderLeft: "2px solid #D4A01744" }}>{summary}</div>
      )}
    </div>
  );
}

function TopicList({ topics, showSummary }) {
  const { t } = useLang();
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      {topics.filter(id => BY_TOPIC.has(id)).map(id => (
        <div key={id}>
          <div style={{ fontSize: 11, color: "#D4A017", fontFamily: "monospace", marginBottom: 6 }}>{topicTitle(id, t)}</div>
          <div style={{ display: "flex", flexDirection: "column", gap: showSummary ? 12 : 7 }}>
            {BY_TOPIC.get(id).refs.map((r, i) => <Reference key={i} r={r} showSummary={showSummary} />)}
          </div>
        </div>
      ))}
    </div>
  );
}

// Collapsible "References" block placed at the bottom of a screen or card.
export function ReferenceBlock({ topics, style }) {
  const { t } = useLang();
  const openScience = useContext(ScienceNavContext);
  const [open, setOpen] = useState(false);
  const n = countRefs(topics);
  if (!n) return null;
  return (
    <div style={{ borderTop: "1px dashed #D4A01733", marginTop: 12, paddingTop: 8, ...style }}>
      <button type="button" onClick={() => setOpen(o => !o)} aria-expanded={open} style={{
        background: "none", border: "none", padding: "4px 0", cursor: "pointer", width: "100%",
        display: "flex", justifyContent: "space-between", alignItems: "center",
        color: "#b0a070", fontFamily: "monospace", fontSize: 11,
      }}>
        <span>📚 {t("refsTitle")}（{n}）</span>
        <span>{open ? "▾" : "▸"}</span>
      </button>
      {open && (
        <div style={{ marginTop: 8 }}>
          <TopicList topics={topics} showSummary={false} />
          {openScience && (
            <button type="button" onClick={openScience} style={{
              marginTop: 10, background: "none", border: "none", padding: 0, cursor: "pointer",
              color: "#D4A017", fontFamily: "monospace", fontSize: 11,
            }}>{t("science.viewAll")}</button>
          )}
        </div>
      )}
    </div>
  );
}

// Entry button used in Settings / Consult / Guide.
export function ScienceEntry() {
  const { t } = useLang();
  const openScience = useContext(ScienceNavContext);
  if (!openScience) return null;
  return (
    <button type="button" onClick={openScience} style={{
      width: "100%", padding: 12, background: "transparent", color: "#D4A017",
      border: "1px solid #D4A01755", borderRadius: 8, fontFamily: "monospace", fontSize: 12, cursor: "pointer",
    }}>📚 {t("science.open")}</button>
  );
}

// ── "Scientific basis" page: every reference, grouped by topic ──
export function SciencePage({ onBack }) {
  const { t, lang } = useLang();
  const sectionStyle = { background: "#111118", borderRadius: 12, padding: 16, marginBottom: 12 };
  return (
    <div>
      <button type="button" onClick={onBack} style={{
        background: "none", border: "none", padding: "0 0 12px", cursor: "pointer", color: "#888", fontFamily: "monospace", fontSize: 12,
      }}>{t("science.back")}</button>
      <div style={{ ...sectionStyle, border: "1px solid #D4A01744" }}>
        <div style={{ fontSize: 17, color: "#D4A017", fontFamily: "serif", marginBottom: 8 }}>📚 {t("science.title")}</div>
        <div style={{ fontSize: 12.5, color: "#bbb", lineHeight: 1.7 }}>{t("science.intro", { n: REF_COUNT })}</div>
        <div style={{ fontSize: 11.5, color: "#FF8B8B", lineHeight: 1.6, marginTop: 8 }}>{t("science.notAdvice")}</div>
        {lang !== "zh" && <div style={{ fontSize: 11, color: "#888", fontFamily: "monospace", marginTop: 8 }}>{t("science.summaryZhOnly")}</div>}
      </div>
      {ALL_TOPICS.map(id => (
        <div key={id} style={sectionStyle}>
          <TopicList topics={[id]} showSummary />
        </div>
      ))}
    </div>
  );
}
