import type { Metadata } from "next";
import Link from "next/link";
import { Badge, Button, Card, SectionLabel } from "@/components/ui";

export const metadata: Metadata = {
  title: "Agent Portal — List Your Agency & Client Tools",
  description:
    "Get listed on every area page you cover, and use Realvian's comparison tool in client conversations.",
  alternates: { canonical: "/portals/agent" },
};

export default function AgentPortalPage() {
  return (
    <>
      <section className="relative overflow-hidden border-b border-[var(--border)]">
        <div className="absolute inset-0 grid-bg opacity-50" aria-hidden="true" />
        <div className="absolute inset-0 glow-emerald" aria-hidden="true" />
        <div className="relative z-10 mx-auto max-w-[820px] px-5 sm:px-8 pt-[104px] pb-16 lg:pt-[128px]">
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
            Agent portal
          </h1>
          <p className="text-[16px] leading-[1.65] text-[var(--text-secondary)] max-w-[620px]">
            Two things are genuinely useful to an agent today: a listing
            presence on the area pages you cover, and a live comparison
            tool you can pull up in front of a client. Both are built on
            exactly the same data as the public site — nothing separate
            or agent-only about the numbers.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-[820px] px-5 sm:px-8 py-14">
        <div className="grid sm:grid-cols-2 gap-5 mb-10">
          <Card className="p-6 flex flex-col">
            <Badge tone="primary" className="self-start mb-3">Live now</Badge>
            <h2 className="text-[17px] font-semibold text-[var(--text-primary)] mb-2">
              Get listed on your areas
            </h2>
            <p className="text-[14px] leading-relaxed text-[var(--text-secondary)] flex-1">
              Submit your agency once and — once approved — you appear in
              the Local Services section of every area page in your
              coverage, right where someone is actively researching
              before they buy or let.
            </p>
            <Link href="/list-your-business" className="mt-5">
              <Button variant="primary" className="w-full">List your agency</Button>
            </Link>
          </Card>

          <Card className="p-6 flex flex-col">
            <Badge tone="primary" className="self-start mb-3">Live now</Badge>
            <h2 className="text-[17px] font-semibold text-[var(--text-primary)] mb-2">
              Compare areas with clients
            </h2>
            <p className="text-[14px] leading-relaxed text-[var(--text-secondary)] flex-1">
              Pull up a side-by-side of any two areas — price, yield,
              growth, all six liveability dimensions — live, in front of
              a client weighing up where to buy. The same tool the public
              site uses, no separate login needed.
            </p>
            <Link href="/compare" className="mt-5">
              <Button variant="secondary" className="w-full">Open the comparison tool</Button>
            </Link>
          </Card>
        </div>

        <Card className="p-6">
          <h2 className="text-[13px] font-semibold tracking-[0.06em] uppercase mb-4" style={{ color: "var(--primary)" }}>
            Still coming to this portal
          </h2>
          <ul className="space-y-3">
            {[
              "Locally qualified leads from people researching your patch",
              "White-label area reports you can send to clients under your own name",
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
