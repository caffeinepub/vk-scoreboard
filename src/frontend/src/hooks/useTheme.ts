import { useCallback, useEffect, useState } from "react";

export type Theme = "dark" | "neon" | "light";

const THEME_KEY = "vk_theme";

function applyTheme(theme: Theme) {
  document.documentElement.setAttribute("data-theme", theme);
  // Update color-scheme for browser chrome
  document.documentElement.style.colorScheme =
    theme === "light" ? "light" : "dark";
}

export function useTheme() {
  const [theme, setThemeState] = useState<Theme>(() => {
    try {
      const stored = localStorage.getItem(THEME_KEY);
      if (stored === "dark" || stored === "neon" || stored === "light")
        return stored;
    } catch {
      // ignore
    }
    return "dark";
  });

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  const setTheme = useCallback((t: Theme) => {
    try {
      localStorage.setItem(THEME_KEY, t);
    } catch {
      // ignore
    }
    setThemeState(t);
  }, []);

  const cycleTheme = useCallback(() => {
    setTheme(theme === "dark" ? "neon" : theme === "neon" ? "light" : "dark");
  }, [theme, setTheme]);

  return { theme, setTheme, cycleTheme };
}
