import type { Metadata } from "next";
import Link from "next/link";
import { Badge, Button, Card, SectionLabel } from "@/components/ui";

export const metadata: Metadata = {
  title: "Pricing",
  description:
    "Realvian is free to use in beta — area intelligence, comparisons, reports and portal tools, no card required. See what's planned for Pro and Agency tiers ahead.",
  alternates: { canonical: "/pricing" },
};

interface PlanFeature {
  text: string;
}

function Check({ muted = false }: { muted?: boolean }) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke={muted ? "var(--text-muted)" : "var(--primary)"}
      strokeWidth="2.5"
      className="shrink-0 mt-0.5"
      aria-hidden="true"
    >
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}

function FeatureList({ features, muted = false }: { features: PlanFeature[]; muted?: boolean }) {
  return (
    <ul className="space-y-2.5">
      {features.map((f) => (
        <li key={f.text} className="flex items-start gap-2.5 text-[13.5px] leading-snug" style={{ color: muted ? "var(--text-muted)" : "var(--text-secondary)" }}>
          <Check muted={muted} />
          <span>{f.text}</span>
        </li>
      ))}
    </ul>
  );
}

const FREE_FEATURES: PlanFeature[] = [
  { text: "Full area intelligence — all 38 covered areas, six liveability dimensions each" },
  { text: "Unlimited side-by-side area comparisons" },
  { text: "All four calculators — mortgage, yield, ROI, stamp duty" },
  { text: "Every market report, plus PDF downloads on areas, comparisons and reports" },
  { text: "Save comparisons and follow areas to your account" },
  { text: "Landlord, investor and agent portal tools, including their PDF exports" },
  { text: "List your agency on the areas you cover" },
  { text: "Public API access with a self-serve key" },
];

const PRO_FEATURES: PlanFeature[] = [
  { text: "Everything in Beta Access" },
  { text: "Off-market and pre-listing data as coverage expands" },
  { text: "Real-time alerts — price drops, new listings, score changes" },
  { text: "Higher API rate limits for automated workflows" },
  { text: "Bulk PDF exports across a whole portfolio in one action" },
];

const AGENCY_FEATURES: PlanFeature[] = [
  { text: "Everything in Pro" },
  { text: "Priority placement in the Local Services section you cover" },
  { text: "White-label reports you can send to clients under your own name" },
  { text: "Multiple team seats on one account" },
  { text: "Direct support line for onboarding and integration" },
];

export default function PricingPage() {
  return (
    <>
      {/* ══════════ HERO ══════════ */}
      <section className="relative overflow-hidden border-b border-[var(--border)]">
        <div className="absolute inset-0 grid-bg opacity-50" aria-hidden="true" />
        <div className="relative z-10 mx-auto max-w-[720px] px-5 sm:px-8 pt-[104px] pb-16 lg:pt-[128px] text-center">
          <SectionLabel>Pricing</SectionLabel>
          <h1
            className="text-[var(--text-primary)] mb-5"
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "clamp(32px, 5vw, 52px)",
              lineHeight: 1.05,
              letterSpacing: "-0.03em",
              fontWeight: 300,
            }}
          >
            Free to explore.
            <br />
            <em style={{ color: "var(--primary)", fontStyle: "italic" }}>Simple when you're ready to pay.</em>
          </h1>
          <p className="text-[16px] leading-relaxed text-[var(--text-secondary)] max-w-[560px] mx-auto">
            Every feature that's actually live today — area scores, comparisons,
            calculators, reports, portal tools — is free during beta, no card
            required. Pro and Agency below are what we're building toward, not
            what you're charged for now.
          </p>
        </div>
      </section>

      {/* ══════════ PLANS ══════════ */}
      <section className="mx-auto max-w-[1160px] px-5 sm:px-8 py-16">
        <div className="grid lg:grid-cols-3 gap-6 items-start">
          {/* FREE — Beta Access */}
          <Card className="p-7 lg:-mt-4 relative !border-2 !border-[var(--primary)]">
            <Badge tone="primary" className="mb-4">Available now</Badge>
            <h2 className="text-[22px] font-semibold text-[var(--text-primary)] mb-1">Beta Access</h2>
            <p className="text-[13px] text-[var(--text-muted)] mb-5">
              Everything on the site today, free while we're in beta
            </p>
            <div className="mb-6">
              <span className="text-[38px] font-semibold text-[var(--text-primary)] tnum">£0</span>
              <span className="text-[14px] text-[var(--text-muted)]"> forever, during beta</span>
            </div>
            <Link href="/auth/signup" className="block mb-6">
              <Button variant="primary" className="w-full justify-center">
                Create free account
              </Button>
            </Link>
            <FeatureList features={FREE_FEATURES} />
          </Card>

          {/* PRO */}
          <Card className="p-7">
            <Badge tone="accent" className="mb-4">Coming soon</Badge>
            <h2 className="text-[22px] font-semibold text-[var(--text-primary)] mb-1">Pro</h2>
            <p className="text-[13px] text-[var(--text-muted)] mb-5">
              For individual investors and landlords running this as a real workflow
            </p>
            <div className="mb-6">
              <span className="text-[38px] font-semibold text-[var(--text-primary)] tnum">£19</span>
              <span className="text-[14px] text-[var(--text-muted)]"> / month, planned</span>
            </div>
            <a href="mailto:data@realvian.co.uk?subject=Notify%20me%20-%20Pro%20plan" className="block mb-6">
              <Button variant="premium" className="w-full justify-center">
                Get notified at launch
              </Button>
            </a>
            <FeatureList features={PRO_FEATURES} />
          </Card>

          {/* AGENCY */}
          <Card className="p-7">
            <Badge tone="neutral" className="mb-4">Coming soon</Badge>
            <h2 className="text-[22px] font-semibold text-[var(--text-primary)] mb-1">Agency</h2>
            <p className="text-[13px] text-[var(--text-muted)] mb-5">
              For estate agents and letting teams working multiple areas
            </p>
            <div className="mb-6">
              <span className="text-[38px] font-semibold text-[var(--text-primary)] tnum">£79</span>
              <span className="text-[14px] text-[var(--text-muted)]"> / month, planned</span>
            </div>
            <a href="mailto:data@realvian.co.uk?subject=Notify%20me%20-%20Agency%20plan" className="block mb-6">
              <Button variant="secondary" className="w-full justify-center">
                Get notified at launch
              </Button>
            </a>
            <FeatureList features={AGENCY_FEATURES} />
          </Card>
        </div>
      </section>

      {/* ══════════ HONESTY NOTE ══════════ */}
      <section className="border-t border-[var(--border)] bg-[var(--bg-subtle)]">
        <div className="mx-auto max-w-[720px] px-5 sm:px-8 py-14 text-center">
          <h2
            className="text-[var(--text-primary)] mb-4"
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "clamp(20px, 2.5vw, 26px)",
              fontWeight: 300,
              letterSpacing: "-0.02em",
            }}
          >
            Why Pro and Agency say &ldquo;coming soon&rdquo;
          </h2>
          <p className="text-[14.5px] leading-relaxed text-[var(--text-secondary)]">
            We&rsquo;d rather show you real prices for real plans than make you
            guess — but we don&rsquo;t take payments yet, because the features
            above aren&rsquo;t all built yet either. &ldquo;Get notified&rdquo;
            sends us an email; it doesn&rsquo;t charge you anything. When Pro
            and Agency actually launch, everyone who's free today stays free
            on Beta Access — nothing you rely on now gets pulled behind a
            paywall retroactively.
          </p>
        </div>
      </section>
    </>
  );
}
