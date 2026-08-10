"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

export type Theme = "light" | "dark";

interface ThemeContextValue {
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (t: Theme) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

const COOKIE = "realvian-theme";
const ONE_YEAR = 60 * 60 * 24 * 365;

/**
 * Inline script injected into <head> before first paint.
 *
 * This is what prevents the flash of wrong theme: it runs synchronously,
 * before React hydrates and before the browser paints, reading the cookie
 * (or the OS preference as a fallback) and setting the class on <html>.
 *
 * Do not move this into a useEffect — that runs after paint, which is the
 * exact bug this exists to avoid.
 */
export const themeScript = `
(function() {
  try {
    var m = document.cookie.match(/(?:^|;\\s*)realvian-theme=(light|dark)/);
    var t = m ? m[1] : (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    if (t === 'dark') document.documentElement.classList.add('dark');
    document.documentElement.style.colorScheme = t;
  } catch (e) {}
})();
`;

export function ThemeProvider({
  children,
  initialTheme = "light",
}: {
  children: ReactNode;
  initialTheme?: Theme;
}) {
  const [theme, setThemeState] = useState<Theme>(initialTheme);

  // Sync React state with whatever the inline script already decided,
  // so the toggle button shows the correct icon on first render.
  useEffect(() => {
    const isDark = document.documentElement.classList.contains("dark");
    setThemeState(isDark ? "dark" : "light");
  }, []);

  const apply = useCallback((next: Theme) => {
    const root = document.documentElement;
    root.classList.toggle("dark", next === "dark");
    root.style.colorScheme = next;
    // Cookie (not localStorage) so the server can render the right theme
    document.cookie = `${COOKIE}=${next};path=/;max-age=${ONE_YEAR};SameSite=Lax`;
    setThemeState(next);
  }, []);

  const toggleTheme = useCallback(() => {
    apply(theme === "dark" ? "light" : "dark");
  }, [theme, apply]);

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setTheme: apply }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used inside <ThemeProvider>");
  return ctx;
}
