import { useState, useEffect } from "react";
import { useLang } from "./i18n";

const DISMISSED_KEY = "moon-pwa-dismissed";

/**
 * Shows a one-time bottom banner on mobile browsers suggesting
 * the user add the app to their home screen.
 * - Only shows on mobile (touch device + narrow viewport)
 * - Only shows once (dismissed state saved to localStorage)
 * - Hidden if already running as installed PWA (standalone mode)
 */
export default function InstallPrompt() {
  const { t } = useLang();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Already dismissed?
    try { if (localStorage.getItem(DISMISSED_KEY)) return; } catch {}

    // Already installed as PWA?
    if (window.matchMedia("(display-mode: standalone)").matches) return;
    if (window.navigator.standalone === true) return; // iOS

    // Only show on mobile-sized touch devices
    const isMobile = "ontouchstart" in window && window.innerWidth < 768;
    if (!isMobile) return;

    // Small delay so it doesn't flash on load
    const timer = setTimeout(() => setVisible(true), 2000);
    return () => clearTimeout(timer);
  }, []);

  const dismiss = () => {
    setVisible(false);
    try { localStorage.setItem(DISMISSED_KEY, "1"); } catch {}
  };

  if (!visible) return null;

  return (
    <div style={{
      position: "fixed",
      bottom: 48, // above nav bar
      left: 8,
      right: 8,
      background: "#1a1a2e",
      border: "1px solid #2a2a3e",
      borderRadius: 12,
      padding: "12px 16px",
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 12,
      zIndex: 1000,
      boxShadow: "0 -4px 20px rgba(0,0,0,0.5)",
      animation: "slideUp 0.3s ease-out",
    }}>
      <style>{`@keyframes slideUp { from { transform: translateY(100%); opacity: 0; } to { transform: translateY(0); opacity: 1; } }`}</style>
      <div style={{ fontSize: 12, color: "#ccc", fontFamily: "monospace", lineHeight: 1.4 }}>
        🌙 {t("pwaInstall")}
      </div>
      <button
        onClick={dismiss}
        style={{
          background: "#4A9E8E33",
          color: "#4A9E8E",
          border: "1px solid #4A9E8E44",
          borderRadius: 6,
          padding: "6px 12px",
          fontFamily: "monospace",
          fontSize: 11,
          cursor: "pointer",
          whiteSpace: "nowrap",
          flexShrink: 0,
        }}
      >
        {t("pwaDismiss")}
      </button>
    </div>
  );
}
