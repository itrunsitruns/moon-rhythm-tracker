import { useState, useEffect, useCallback } from "react";

/**
 * A useState-like hook that persists to localStorage.
 * - Reads initial value from localStorage (falls back to `defaultValue`)
 * - Writes on every state change
 * - Listens for cross-tab storage events so multiple tabs stay in sync
 */
export default function useLocalStorage(key, defaultValue) {
  const [value, setValue] = useState(() => {
    try {
      const raw = localStorage.getItem(key);
      return raw !== null ? JSON.parse(raw) : defaultValue;
    } catch {
      return defaultValue;
    }
  });

  // Persist whenever value changes
  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      // storage full — silently ignore
    }
  }, [key, value]);

  // Sync across tabs
  useEffect(() => {
    function onStorage(e) {
      if (e.key === key) {
        try {
          setValue(e.newValue !== null ? JSON.parse(e.newValue) : defaultValue);
        } catch {
          // ignore parse errors
        }
      }
    }
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [key, defaultValue]);

  return [value, setValue];
}
