import { useEffect, useState } from "react";

export function usePersistentBoolean(key: string, defaultValue = false) {
  const [value, setValue] = useState(() => {
    try {
      const storedValue = window.localStorage.getItem(key);

      return storedValue === null ? defaultValue : storedValue === "true";
    } catch {
      return defaultValue;
    }
  });

  useEffect(() => {
    try {
      window.localStorage.setItem(key, String(value));
    } catch {
      // Ignore storage failures; the current session state still works.
    }
  }, [key, value]);

  return [value, setValue] as const;
}
