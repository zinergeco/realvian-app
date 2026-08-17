import Link from "next/link";
import { Badge, Button, Card, SectionLabel } from "./ui";

/**
 * Shared shell for pages that are genuinely not built yet.
 *
 * The alternative to this component is a 404 or a silently-removed nav
 * link. Both are worse: a 404 on a link the site itself put in front of
 * a visitor reads as broken, and removing links reduces how much of the
 * roadmap people can see. This tells the truth — not live yet, here's
 * roughly what it will do — which is the more honest of the three options.
 */
export function ComingSoon({
  eyebrow,
  title,
  description,
  bullets,
  eta,
}: {
  eyebrow: string;
  title: string;
  description: string;
  bullets: string[];
  /** Optional — only show a timeframe if there genuinely is one */
  eta?: string;
}) {
  return (
    <section className="relative overflow-hidden border-b border-[var(--border)]">
      <div className="absolute inset-0 grid-bg opacity-50" aria-hidden="true" />
      <div className="absolute inset-0 glow-emerald" aria-hidden="true" />
      <div className="relative z-10 mx-auto max-w-[720px] px-5 sm:px-8 pt-[104px] pb-24 lg:pt-[128px]">
        <SectionLabel>{eyebrow}</SectionLabel>
        <div className="mb-5">
          <Badge tone="accent">In development</Badge>
        </div>

        <h1
          className="text-[var(--text-primary)] mb-5"
          style={{
            fontFamily: "var(--font-display)",
            fontSize: "clamp(32px, 4.6vw, 50px)",
            lineHeight: 1.04,
            letterSpacing: "-0.03em",
            fontWeight: 300,
          }}
        >
          {title}
        </h1>

        <p className="text-[16px] leading-[1.65] text-[var(--text-secondary)] max-w-[560px] mb-8">
          {description}
        </p>

        <Card className="p-6 mb-8">
          <h2 className="text-[13px] font-semibold tracking-[0.06em] uppercase mb-4" style={{ color: "var(--primary)" }}>
            What this will include
          </h2>
          <ul className="space-y-3">
            {bullets.map((b) => (
              <li key={b} className="flex gap-2.5 text-[14.5px] leading-relaxed text-[var(--text-secondary)]">
                <span aria-hidden="true" style={{ color: "var(--primary)" }}>→</span>
                <span>{b}</span>
              </li>
            ))}
          </ul>
        </Card>

        {eta && (
          <p className="text-[13px] text-[var(--text-muted)] mb-8">{eta}</p>
        )}

        <div className="flex flex-wrap gap-3">
          <Link href="/areas">
            <Button variant="primary">Explore what's live now</Button>
          </Link>
          <Link href="/">
            <Button variant="secondary">Back to homepage</Button>
          </Link>
        </div>
      </div>
    </section>
  );
}
