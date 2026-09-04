import Link from "next/link";

/**
 * Compact three-building skyline mark — a tall central tower flanked
 * by two shorter buildings. Theme-aware (uses CSS variables), unlike
 * public/favicon.svg, which necessarily uses fixed hex colours since
 * a browser-tab favicon renders outside the page's own DOM/theme
 * context and has no CSS variables to resolve against.
 */
export function LogoMark({ size = 22 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      aria-hidden="true"
      className="shrink-0"
    >
      <rect width="64" height="64" rx="14" fill="var(--primary)" />
      <rect x="10" y="34" width="12" height="20" fill="#FFFFFF" />
      <rect x="26" y="16" width="14" height="38" fill="#FFFFFF" />
      <rect x="44" y="26" width="11" height="28" fill="#FFFFFF" />
      <rect x="30" y="22" width="3" height="3" fill="var(--primary)" />
      <rect x="36" y="22" width="3" height="3" fill="var(--primary)" />
      <rect x="30" y="30" width="3" height="3" fill="var(--primary)" />
      <rect x="36" y="30" width="3" height="3" fill="var(--primary)" />
      <rect x="30" y="38" width="3" height="3" fill="var(--primary)" />
      <rect x="36" y="38" width="3" height="3" fill="var(--primary)" />
    </svg>
  );
}

/**
 * Realvian wordmark. Originally text-only by deliberate choice (see
 * BUILD_SPEC 2.1 — "an icon mark comes after the brand has lived in
 * the world for 90 days"); the icon mark (LogoMark, above) was added
 * on explicit request, ahead of that original timeline.
 *
 * "Real" is styled as the whole, meaningful word — split against
 * "vian" — rather than the earlier version, which italicised only
 * "eal" (missing its leading R), breaking the word illegibly and
 * losing the "Real Estate" association entirely.
 */
export function Wordmark({ size = 22, showMark = true }: { size?: number; showMark?: boolean }) {
  return (
    <Link
      href="/"
      className="inline-flex items-center gap-2 transition-opacity hover:opacity-75"
      aria-label="Realvian — home"
    >
      {showMark && <LogoMark size={size} />}
      <span
        style={{
          fontFamily: "var(--font-display)",
          fontSize: size,
          fontWeight: 500,
          letterSpacing: "-0.03em",
          color: "var(--text-primary)",
        }}
      >
        <span style={{ fontStyle: "italic", color: "var(--primary)" }}>Real</span>
        vian
      </span>
    </Link>
  );
}
