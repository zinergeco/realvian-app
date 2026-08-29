import type { Metadata } from "next";
import Link from "next/link";
import { getCurrentUser } from "@/lib/public-auth";
import { listProperties, computeUrgency, sortByUrgency } from "@/lib/properties";
import { computePortfolioRentPoints } from "@/lib/rent-comparison";
import { Badge, Button, Card, SectionLabel } from "@/components/ui";
import { IlloPortfolio } from "@/components/illustrations";
import { AddPropertyForm } from "./add-property-form";
import { PropertyCard } from "./property-card";
import { PortfolioRentChart } from "@/components/portfolio-rent-chart";

export const metadata: Metadata = {
  title: "Landlord Portal — Compliance Tracker",
  description:
    "Track EPC, gas safety and EICR deadlines across your portfolio in one place.",
  alternates: { canonical: "/portals/landlord" },
};

export default async function LandlordPortalPage() {
  const user = await getCurrentUser();

  // ── Logged out: honest marketing content, same shape as the other
  // three portals, with a direct route into the real tool. ──
  if (!user) {
    return (
      <section className="relative overflow-hidden border-b border-[var(--border)]">
        <div className="absolute inset-0 grid-bg opacity-50" aria-hidden="true" />
        <div className="absolute inset-0 glow-emerald" aria-hidden="true" />
        <div className="relative z-10 mx-auto max-w-[720px] px-5 sm:px-8 pt-[104px] pb-24 lg:pt-[128px]">
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
            Landlord portal
          </h1>
          <p className="text-[16px] leading-[1.65] text-[var(--text-secondary)] max-w-[560px] mb-8">
            Track EPC, gas safety and EICR deadlines across every property you
            own, sorted by what actually needs your attention next. Free, and
            unlike the other portals, this one is live today — not coming soon.
          </p>

          <div className="w-full max-w-[280px] mb-8 opacity-90">
            <IlloPortfolio className="w-full h-auto" />
          </div>

          <div className="flex flex-wrap gap-3">
            <Link href="/auth/signup">
              <Button variant="primary">Create free account</Button>
            </Link>
            <Link href="/auth/login">
              <Button variant="secondary">Sign in</Button>
            </Link>
          </div>
        </div>
      </section>
    );
  }

  // ── Logged in: the real tool ──
  const properties = sortByUrgency((await listProperties(user.id)).map(computeUrgency));
  const portfolioRentPoints = computePortfolioRentPoints(properties);
  const overdueCount = properties.filter((p) => p.urgency === "overdue").length;
  const urgentCount = properties.filter((p) => p.urgency === "urgent").length;

  return (
    <div className="mx-auto max-w-[860px] px-5 sm:px-8 pt-[104px] pb-20 lg:pt-[128px]">
      <SectionLabel>Landlord portal</SectionLabel>
      <h1
        className="text-[var(--text-primary)] mb-3"
        style={{
          fontFamily: "var(--font-display)",
          fontSize: "clamp(30px, 4vw, 40px)",
          fontWeight: 300,
          letterSpacing: "-0.03em",
        }}
      >
        Compliance tracker
      </h1>
      <p className="text-[14.5px] text-[var(--text-secondary)] mb-8 max-w-[540px]">
        EPC, gas safety and EICR deadlines across your properties, sorted by
        what needs attention first.
      </p>

      {(overdueCount > 0 || urgentCount > 0) && (
        <div className="flex gap-3 mb-6">
          {overdueCount > 0 && (
            <Badge tone="highlight">
              {overdueCount} overdue
            </Badge>
          )}
          {urgentCount > 0 && (
            <Badge tone="accent">
              {urgentCount} due within 60 days
            </Badge>
          )}
        </div>
      )}

      <div className="grid lg:grid-cols-[1fr_340px] gap-8">
        <div className="space-y-4 order-2 lg:order-1">
          {portfolioRentPoints.length >= 2 && (
            <Card className="p-5 mb-2">
              <p className="text-[12.5px] text-[var(--text-muted)] mb-3">
                Rent across your portfolio, positioned against each property's own area average
              </p>
              <PortfolioRentChart points={portfolioRentPoints} />
            </Card>
          )}
          {properties.length === 0 ? (
            <Card className="p-10 text-center">
              <div className="w-[100px] mx-auto mb-4 opacity-60">
                <IlloPortfolio className="w-full h-auto" />
              </div>
              <p className="text-[14px] text-[var(--text-secondary)]">
                No properties yet. Add your first using the form.
              </p>
            </Card>
          ) : (
            properties.map((p) => <PropertyCard key={p.id} property={p} />)
          )}
        </div>

        <div className="order-1 lg:order-2">
          <Card className="p-6 sticky top-[100px]">
            <h2 className="text-[13px] font-semibold tracking-[0.06em] uppercase mb-4" style={{ color: "var(--primary)" }}>
              Add a property
            </h2>
            <AddPropertyForm />
          </Card>
        </div>
      </div>
    </div>
  );
}
