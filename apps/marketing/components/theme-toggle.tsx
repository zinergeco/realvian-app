"use client";

import { useTheme } from "./theme-provider";

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === "dark";

  return (
    <button
      onClick={toggleTheme}
      aria-label={isDark ? "Switch to light theme" : "Switch to dark theme"}
      title={isDark ? "Switch to light theme" : "Switch to dark theme"}
      className="relative w-10 h-10 grid place-items-center rounded-[var(--radius-md)]
                 border border-[var(--border)] bg-[var(--surface)]
                 text-[var(--text-secondary)] transition-all duration-200
                 hover:border-[var(--primary-border)] hover:text-[var(--primary)]
                 active:scale-95"
    >
      {/* Sun */}
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        className="absolute w-[18px] h-[18px] transition-all duration-400"
        style={{
          opacity: isDark ? 0 : 1,
          transform: isDark ? "rotate(-90deg) scale(0.4)" : "rotate(0) scale(1)",
          transitionTimingFunction: "var(--ease-spring)",
        }}
        aria-hidden="true"
      >
        <circle cx="12" cy="12" r="4.2" />
        <path d="M12 2.5v2M12 19.5v2M2.5 12h2M19.5 12h2M5.3 5.3l1.4 1.4M17.3 17.3l1.4 1.4M18.7 5.3l-1.4 1.4M6.7 17.3l-1.4 1.4" />
      </svg>

      {/* Moon */}
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="absolute w-[18px] h-[18px] transition-all duration-400"
        style={{
          opacity: isDark ? 1 : 0,
          transform: isDark ? "rotate(0) scale(1)" : "rotate(90deg) scale(0.4)",
          transitionTimingFunction: "var(--ease-spring)",
        }}
        aria-hidden="true"
      >
        <path d="M20 14.5A8.5 8.5 0 1 1 9.5 4a6.8 6.8 0 0 0 10.5 10.5z" />
      </svg>
    </button>
  );
}
