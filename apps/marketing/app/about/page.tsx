import type { Metadata } from "next";
import Link from "next/link";
import { Button, SectionLabel } from "@/components/ui";

export const metadata: Metadata = {
  title: "About Realvian",
  description:
    "Realvian is building the data layer above the UK property market — area intelligence fused from public sources, not guesswork.",
  alternates: { canonical: "/about" },
};

export default function AboutPage() {
  return (
    <>
      <section className="relative overflow-hidden border-b border-[var(--border)]">
        <div className="absolute inset-0 grid-bg opacity-50" aria-hidden="true" />
        <div className="absolute inset-0 glow-emerald" aria-hidden="true" />
        <div className="relative z-10 mx-auto max-w-[720px] px-5 sm:px-8 pt-[104px] pb-16 lg:pt-[128px]">
          <SectionLabel>About</SectionLabel>
          <h1
            className="text-[var(--text-primary)] mb-6"
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "clamp(34px, 5vw, 52px)",
              lineHeight: 1.03,
              letterSpacing: "-0.03em",
              fontWeight: 300,
            }}
          >
            The data layer the UK
            <br />
            property market has been
            <br />
            <em style={{ fontStyle: "italic", color: "var(--primary)", fontWeight: 300 }}>
              missing.
            </em>
          </h1>
        </div>
      </section>

      <article className="mx-auto max-w-[680px] px-5 sm:px-8 py-16 space-y-6 text-[16px] leading-[1.75] text-[var(--text-secondary)]">
        <p>
          Most UK property sites answer one question: what's for sale. Realvian
          answers a different one — is this actually a good area, and how does
          it compare to the other one you're considering. That question sits
          underneath every property decision, and it's usually answered with
          a Sunday afternoon and a lot of open browser tabs.
        </p>

        <p>
          We fuse public data — HM Land Registry, ONS, Police.uk, Ofsted and
          more — into a single score per area, normalised nationally so a
          score in Glasgow means the same thing as a score in Bristol. Every
          number traces back to a source. Where we don't have real data yet
          for a dimension, we say so, rather than show a plausible-looking
          guess.
        </p>

        <p>
          Realvian is being built in the open, in stages. The area
          intelligence and comparison tools are live today. Dedicated
          workspaces for landlords, investors, agents and developers, along
          with calculators and portfolio tools, are still being built — see
          the <Link href="/portals" style={{ color: "var(--primary)" }}>portals</Link> page
          for what's coming.
        </p>

        <h2
          className="text-[24px] text-[var(--text-primary)] pt-4"
          style={{ fontFamily: "var(--font-display)", fontWeight: 500, letterSpacing: "-0.02em" }}
        >
          What we won't do
        </h2>
        <p>
          We don't scrape listing portals — their data belongs to them, and
          we license or fuse open data instead. We don't publish a score we
          can't explain: every figure decomposes into the inputs that produced
          it. And we don't quietly upgrade a description from "illustrative"
          to "live" without the data behind it actually changing — every area
          page says clearly which parts are real.
        </p>

        <div className="pt-6">
          <Link href="/areas">
            <Button variant="primary">See the area intelligence live</Button>
          </Link>
        </div>
      </article>
    </>
  );
}
