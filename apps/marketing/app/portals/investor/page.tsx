import type { Metadata } from "next";
import { getAllAreas } from "@/lib/areas";
import { Badge, Card, SectionLabel } from "@/components/ui";
import { OpportunityFinder } from "./opportunity-finder";

export const metadata: Metadata = {
  title: "Investor Portal — Yield & Growth Opportunity Finder",
  description:
    "Rank every UK area Realvian covers by gross yield, five-year growth or investment score. Free, no account required.",
  alternates: { canonical: "/portals/investor" },
};

export default function InvestorPortalPage() {
  const areas = getAllAreas();

  return (
    <>
      <section className="relative overflow-hidden border-b border-[var(--border)]">
        <div className="absolute inset-0 grid-bg opacity-50" aria-hidden="true" />
        <div className="absolute inset-0 glow-emerald" aria-hidden="true" />
        <div className="relative z-10 mx-auto max-w-[900px] px-5 sm:px-8 pt-[104px] pb-16 lg:pt-[128px]">
          <SectionLabel>Portals</SectionLabel>
          <div className="mb-5">
            <Badge tone="primary">Live</Badge>
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
            Investor portal
          </h1>
          <p className="text-[16px] leading-[1.65] text-[var(--text-secondary)] max-w-[620px]">
            Rank every area Realvian covers by gross yield, five-year growth
            or investment score, and filter to what actually fits your
            budget. Built for evaluating where to put capital, not one
            listing at a time.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-[900px] px-5 sm:px-8 py-14">
        <OpportunityFinder areas={areas} />

        <Card className="p-6 mt-10">
          <h2 className="text-[13px] font-semibold tracking-[0.06em] uppercase mb-4" style={{ color: "var(--primary)" }}>
            Still coming to this portal
          </h2>
          <ul className="space-y-3">
            {[
              "Off-market deal flow as partnerships come online",
              "Hot-spot maps built from live demand signals, not just price history",
              "Portfolio-level return tracking across multiple properties",
            ].map((t) => (
              <li key={t} className="flex gap-2.5 text-[14px] leading-relaxed text-[var(--text-secondary)]">
                <span aria-hidden="true" style={{ color: "var(--color-gold)" }}>→</span>
                <span>{t}</span>
              </li>
            ))}
          </ul>
        </Card>
      </section>
    </>
  );
}
