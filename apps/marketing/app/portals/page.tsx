import type { Metadata } from "next";
import Link from "next/link";
import { Badge, Card, SectionLabel } from "@/components/ui";
import { IlloPortfolio, IlloAlerts, IlloMap, IlloDataFusion } from "@/components/illustrations";

export const metadata: Metadata = {
  title: "Portals for Landlords, Investors, Agents & Developers",
  description:
    "Dedicated workspaces for the four roles that use property data differently. In development — see what each portal will include.",
  alternates: { canonical: "/portals" },
};

const PORTALS = [
  {
    type: "landlord",
    name: "Landlords",
    desc: "Compliance deadlines, EPC modelling, rent reviews and portfolio yield in one place.",
    illo: IlloPortfolio,
  },
  {
    type: "investor",
    name: "Investors",
    desc: "Off-market deal flow, yield forecasts, and hot-spot maps built on demand signals.",
    illo: IlloMap,
  },
  {
    type: "agent",
    name: "Agents",
    desc: "Qualified local leads, white-label area reports, and comparable market analysis.",
    illo: IlloDataFusion,
  },
  {
    type: "developer",
    name: "Developers",
    desc: "Site feasibility, planning application radar, and absorption-rate analysis.",
    illo: IlloAlerts,
  },
];

export default function PortalsHubPage() {
  return (
    <>
      <section className="relative overflow-hidden border-b border-[var(--border)]">
        <div className="absolute inset-0 grid-bg opacity-50" aria-hidden="true" />
        <div className="absolute inset-0 glow-emerald" aria-hidden="true" />
        <div className="relative z-10 mx-auto max-w-[1100px] px-5 sm:px-8 pt-[104px] pb-16 lg:pt-[128px]">
          <SectionLabel>Portals</SectionLabel>
          <div className="mb-5">
            <Badge tone="accent">In development</Badge>
          </div>
          <h1
            className="text-[var(--text-primary)] max-w-[680px]"
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "clamp(34px, 5vw, 52px)",
              lineHeight: 1.03,
              letterSpacing: "-0.03em",
              fontWeight: 300,
            }}
          >
            One data layer,
            <br />
            <em style={{ fontStyle: "italic", color: "var(--primary)", fontWeight: 300 }}>
              four workspaces.
            </em>
          </h1>
          <p className="mt-5 max-w-[560px] text-[16px] leading-[1.65] text-[var(--text-secondary)]">
            Landlords, investors, agents and developers all read the same
            underlying data, but need to act on it differently. Each portal
            below is a dedicated workspace for one role — none are live yet.
            The area intelligence, comparison tool and reports that feed them
            already are.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-[1100px] px-5 sm:px-8 py-16">
        <div className="grid sm:grid-cols-2 gap-5">
          {PORTALS.map((p) => (
            <Link key={p.type} href={`/portals/${p.type}`} className="group">
              <Card hover className="h-full overflow-hidden flex flex-col">
                <div className="relative h-[132px] bg-[var(--bg)] border-b border-[var(--border)] overflow-hidden shrink-0">
                  <div className="absolute inset-0 grid-bg opacity-40" aria-hidden="true" />
                  <div className="absolute inset-0 grid place-items-center p-5">
                    <div className="w-full max-w-[200px]">
                      <p.illo className="w-full h-auto" />
                    </div>
                  </div>
                </div>
                <div className="p-6 flex-1">
                  <h3
                    className="text-[20px] text-[var(--text-primary)] mb-2"
                    style={{ fontFamily: "var(--font-display)", fontWeight: 500, letterSpacing: "-0.02em" }}
                  >
                    {p.name}
                  </h3>
                  <p className="text-[14px] leading-relaxed text-[var(--text-secondary)]">{p.desc}</p>
                  <span
                    className="mt-4 inline-flex items-center gap-1.5 text-[13px] font-medium transition-transform duration-300 group-hover:translate-x-1"
                    style={{ color: "var(--primary)" }}
                  >
                    See what's planned →
                  </span>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      </section>
    </>
  );
}
