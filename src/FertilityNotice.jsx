import { useState } from "react";
import { useLang } from "./i18n";

// Explanation card shown when contraception or conception mode is active.
// "Don't show again this week" snoozes it for 7 days (stored by the parent).
export default function FertilityNotice({ mode, onClose }) {
  const { t } = useLang();
  const [snooze, setSnooze] = useState(false);

  return (
    <div role="dialog" aria-modal="true" aria-labelledby="fertility-notice-title" style={{
      position: "fixed", inset: 0, background: "#000000B3", zIndex: 50,
      display: "flex", alignItems: "center", justifyContent: "center", padding: 16,
    }}>
      <div style={{
        maxWidth: 380, width: "100%", background: "#111118", border: "1px solid #D4A01766",
        borderRadius: 14, padding: 20, boxShadow: "0 10px 40px #00000080",
      }}>
        <div id="fertility-notice-title" style={{ fontSize: 16, color: "#D4A017", fontFamily: "serif", marginBottom: 10 }}>
          {mode === "avoid" ? "🛡️ " : "🪺 "}{t(mode === "avoid" ? "notice.title.avoid" : "notice.title.conceive")}
        </div>
        <div style={{ fontSize: 14, color: "#e0e0e0", lineHeight: 1.75, marginBottom: 10 }}>{t("notice.body")}</div>
        <div style={{ fontSize: 12, color: "#aaa", lineHeight: 1.7, marginBottom: 14 }}>{t("notice.extra")}</div>
        <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, color: "#aaa", fontFamily: "monospace", marginBottom: 14, cursor: "pointer" }}>
          <input type="checkbox" checked={snooze} onChange={e => setSnooze(e.target.checked)} />
          {t("notice.snooze")}
        </label>
        <button type="button" onClick={() => onClose(snooze)} style={{
          width: "100%", padding: 11, background: "#D4A017", color: "#0A0A0F", border: "none",
          borderRadius: 8, fontFamily: "serif", fontSize: 14, fontWeight: "bold", cursor: "pointer",
        }}>{t("notice.ok")}</button>
      </div>
    </div>
  );
}
