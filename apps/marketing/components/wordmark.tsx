import Link from "next/link";

/**
 * Realvian wordmark — text-based by deliberate choice (see BUILD_SPEC 2.1).
 * An icon mark comes after the brand has lived in the world for 90 days.
 */
export function Wordmark({ size = 22 }: { size?: number }) {
  return (
    <Link
      href="/"
      className="inline-flex items-baseline transition-opacity hover:opacity-75"
      style={{
        fontFamily: "var(--font-display)",
        fontSize: size,
        fontWeight: 500,
        letterSpacing: "-0.03em",
        color: "var(--text-primary)",
      }}
      aria-label="Realvian — home"
    >
      R
      <span style={{ fontStyle: "italic", color: "var(--primary)" }}>eal</span>
      vian
    </Link>
  );
}
