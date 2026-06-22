import { useEffect, useState } from "preact/hooks";

export type ThemePreference = "system" | "light" | "dark";

const STORAGE_KEY = "quick-palette-theme";

export function useTheme(): readonly [ThemePreference, (theme: ThemePreference) => void] {
  const [preference, setPreference] = useState<ThemePreference>(() => readPreference());

  useEffect(() => {
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const apply = () => applyTheme(preference, media.matches);
    apply();
    if (preference === "system") media.addEventListener("change", apply);
    try {
    window.localStorage.setItem(STORAGE_KEY, preference);
    } catch {
      // Theme persistence is optional when storage is unavailable.
    }
    return () => media.removeEventListener("change", apply);
  }, [preference]);

  return [preference, setPreference] as const;
}

function readPreference(): ThemePreference {
  try {
    const value = window.localStorage.getItem(STORAGE_KEY);
    if (value === "light" || value === "dark" || value === "system") return value;
  } catch {
    // Fall back to the system setting when storage is unavailable.
  }
  return "system";
}

function applyTheme(preference: ThemePreference, systemDark: boolean): void {
  const effective = preference === "system" ? (systemDark ? "dark" : "light") : preference;
  document.documentElement.dataset.theme = effective;
  document.documentElement.style.colorScheme = effective;
}
