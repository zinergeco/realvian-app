import Link from "next/link";
import { getCurrentUser } from "@/lib/public-auth";
import { IntelligencePanel } from "@/components/intelligence-panel";
import { PostcodeSearch } from "@/components/postcode-search";
import { Badge, Button, Card, SectionLabel } from "@/components/ui";
import {
  AppMockup,
  CitySkyline,
  IlloAlerts,
  IlloCompare,
  IlloDataFusion,
  IlloMap,
  IlloPortfolio,
  IlloScore,
} from "@/components/illustrations";

/* ── Content ──────────────────────────────────────── */

const PORTALS = [
  {
    name: "Landlords",
    href: "/portals/landlord",
    desc: "Compliance deadlines, EPC modelling, rent reviews and portfolio yield in one place.",
    stat: "12 compliance checks",
  },
  {
    name: "Investors",
    href: "/portals/investor",
    desc: "Off-market deal flow, yield forecasts, and hot-spot maps built on demand signals.",
    stat: "5-yr forecasts",
  },
  {
    name: "Agents",
    href: "/portals/agent",
    desc: "Qualified local leads, white-label area reports, and comparable market analysis.",
    stat: "Graded leads",
  },
  {
    name: "Developers",
    href: "/portals/developer",
    desc: "Site feasibility, planning application radar, and absorption-rate analysis.",
    stat: "Planning radar",
  },
];

const CAPABILITIES = [
  {
    illo: "compare" as const,
    title: "Area comparison engine",
    desc: "Put any two UK postcodes side by side across six liveability dimensions, plus price, yield and growth — schools, crime, transport, amenities.",
    tag: "Core",
  },
  {
    illo: "score" as const,
    title: "Realvian Score",
    desc: "One proprietary composite number for liveability, and a second for investment potential. Citable, explainable, and consistent nationwide.",
    tag: "Proprietary",
  },
  {
    illo: "portfolio" as const,
    title: "Yield & ROI modelling",
    desc: "Gross yield, net yield, and cash-on-cash return with editable assumptions — purchase price, deposit, rate, rent and running costs.",
    tag: "Core",
  },
  {
    illo: "map" as const,
    title: "Planning pulse",
    desc: "Every planning application near a property you care about, aggregated and alerted the week it lands.",
    tag: "Premium",
    inDevelopment: true,
  },
  {
    illo: "fusion" as const,
    title: "Climate & resilience lens",
    desc: "Flood risk, air quality, and heat projections — the risks a mortgage survey will not tell you about.",
    tag: "Premium",
    inDevelopment: true,
  },
  {
    illo: "alerts" as const,
    title: "Smart alerts",
    desc: "Price drops, new matching listings, crime-trend shifts, and planning activity — delivered when they happen, not monthly.",
    tag: "Core",
    inDevelopment: true,
  },
];

const DATA_SOURCES = [
  "HM Land Registry",
  "ONS",
  "Police.uk",
  "Ofsted",
  "EPC Register",
  "Environment Agency",
  "DfT",
  "PlanIt",
];

/* ── Illustration mapper ──────────────────────────── */
const ILLOS = {
  compare: IlloCompare,
  score: IlloScore,
  portfolio: IlloPortfolio,
  map: IlloMap,
  fusion: IlloDataFusion,
  alerts: IlloAlerts,
} as const;

/* ── Page ─────────────────────────────────────────── */

export default async function HomePage() {
  const user = await getCurrentUser();
  return (
    <>
      {/* ══════════════ HERO ══════════════ */}
      <section className="relative overflow-hidden">
        {/* Ambient layers */}
        <div className="absolute inset-0 grid-bg opacity-70" aria-hidden="true" />
        <div className="absolute inset-0 glow-emerald" aria-hidden="true" />
        <div
          className="absolute bottom-0 inset-x-0 pointer-events-none opacity-45 -z-0"
          style={{ height: 150, maskImage: "linear-gradient(to top, black 55%, transparent 100%)", WebkitMaskImage: "linear-gradient(to top, black 55%, transparent 100%)" }}
          aria-hidden="true"
        >
          <CitySkyline className="w-full h-full" variant="highrise" />
        </div>

        <div className="relative z-10 mx-auto max-w-[1240px] px-5 sm:px-8 pt-[116px] pb-20 lg:pt-[140px] lg:pb-28">
          <div className="grid lg:grid-cols-[1.08fr_1fr] gap-12 lg:gap-14 items-center">
            {/* ── Left: the thesis ── */}
            <div>
              <div
                className="animate-rise inline-block"
                style={{ animationDelay: "80ms" }}
              >
                <Badge tone="primary">
                  <span
                    className="w-1.5 h-1.5 rounded-full animate-pulse-dot"
                    style={{ background: "currentColor" }}
                    aria-hidden="true"
                  />
                  Now in private beta
                </Badge>
              </div>

              <h1
                className="animate-rise mt-6 text-[var(--text-primary)]"
                style={{
                  fontFamily: "var(--font-display)",
                  fontSize: "clamp(44px, 6.4vw, 78px)",
                  lineHeight: 0.98,
                  letterSpacing: "-0.035em",
                  fontWeight: 300,
                  animationDelay: "160ms",
                }}
              >
                Know an area
                <br />
                before you
                <br />
                <em
                  style={{
                    fontStyle: "italic",
                    fontWeight: 300,
                    color: "var(--primary)",
                  }}
                >
                  commit to it.
                </em>
              </h1>

              <p
                className="animate-rise mt-7 max-w-[520px] text-[17px] leading-[1.65] text-[var(--text-secondary)]"
                style={{ animationDelay: "240ms" }}
              >
                Realvian scores every UK postcode across six liveability dimensions —
                schools, crime, transport, amenities — fused from
                fourteen public sources and refreshed continuously.
              </p>

              {/* Search */}
              <div
                className="animate-rise mt-9 max-w-[520px]"
                style={{ animationDelay: "320ms" }}
              >
                <PostcodeSearch />
              </div>

              {/* Trust strip */}
              <div
                className="animate-rise mt-10 flex flex-wrap items-center gap-x-7 gap-y-3"
                style={{ animationDelay: "400ms" }}
              >
                {[
                  { v: "30M+", l: "property records" },
                  { v: "1.7M", l: "postcodes scored" },
                  { v: "14", l: "data sources" },
                ].map((s) => (
                  <div key={s.l} className="flex items-baseline gap-2">
                    <span
                      className="tnum text-[19px] font-semibold"
                      style={{ color: "var(--primary)" }}
                    >
                      {s.v}
                    </span>
                    <span className="text-[13px] text-[var(--text-muted)]">
                      {s.l}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* ── Right: the signature panel ── */}
            <div className="flex justify-center lg:justify-end">
              <IntelligencePanel />
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════ DATA SOURCES MARQUEE ══════════════ */}
      <section className="border-y border-[var(--border)] bg-[var(--bg-subtle)]">
        <div className="mx-auto max-w-[1240px] px-5 sm:px-8 py-7">
          <div className="flex flex-wrap items-center gap-x-8 gap-y-3">
            <span className="text-[11px] font-medium tracking-[0.14em] uppercase text-[var(--text-muted)] shrink-0">
              Fused from
            </span>
            {DATA_SOURCES.map((s) => (
              <span
                key={s}
                className="text-[13.5px] font-medium text-[var(--text-secondary)]"
              >
                {s}
              </span>
            ))}
            <span className="text-[13px] text-[var(--text-muted)]">
              + 6 more
            </span>
          </div>
        </div>
      </section>

      {/* ══════════════ PORTALS ══════════════ */}
      <section className="mx-auto max-w-[1240px] px-5 sm:px-8 py-24 lg:py-32">
        <div className="max-w-[640px] mb-14">
          <SectionLabel>Built for four kinds of decision</SectionLabel>
          <h2
            className="text-[var(--text-primary)]"
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "clamp(32px, 4.4vw, 50px)",
              lineHeight: 1.06,
              letterSpacing: "-0.03em",
              fontWeight: 300,
            }}
          >
            One data layer,
            <br />
            four dedicated workspaces.
          </h2>
          <p className="mt-5 text-[16px] leading-relaxed text-[var(--text-secondary)]">
            The same canonical data, organised around what each role actually
            needs to decide. Not a generic dashboard with a filter dropdown.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 gap-5">
          {PORTALS.map((p) => (
            <Link key={p.href} href={p.href} className="group">
              <Card hover className="h-full p-7 flex flex-col">
                <div className="flex items-start justify-between gap-4 mb-4">
                  <h3
                    className="text-[24px] text-[var(--text-primary)]"
                    style={{
                      fontFamily: "var(--font-display)",
                      fontWeight: 400,
                      letterSpacing: "-0.02em",
                    }}
                  >
                    {p.name}
                  </h3>
                  <Badge tone="neutral" className="shrink-0 !text-[10px]">
                    {p.stat}
                  </Badge>
                </div>
                <p className="text-[14.5px] leading-relaxed text-[var(--text-secondary)] flex-1">
                  {p.desc}
                </p>
                <span
                  className="mt-6 inline-flex items-center gap-1.5 text-[13.5px] font-medium
                             transition-transform duration-300 group-hover:translate-x-1"
                  style={{ color: "var(--primary)" }}
                >
                  Explore portal
                  <svg
                    width="15"
                    height="15"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <path d="M5 12h14M13 6l6 6-6 6" />
                  </svg>
                </span>
              </Card>
            </Link>
          ))}
        </div>
      </section>

      {/* ══════════════ PRODUCT SHOWCASE ══════════════ */}
      <section className="mx-auto max-w-[1240px] px-5 sm:px-8 pb-24 lg:pb-32">
        <div className="grid lg:grid-cols-[1fr_1.15fr] gap-12 lg:gap-16 items-center">
          <div>
            <SectionLabel>The workspace</SectionLabel>
            <h2
              className="text-[var(--text-primary)]"
              style={{
                fontFamily: "var(--font-display)",
                fontSize: "clamp(30px, 4vw, 46px)",
                lineHeight: 1.06,
                letterSpacing: "-0.03em",
                fontWeight: 300,
              }}
            >
              Not a chat box.
              <br />
              A dashboard.
            </h2>
            <p className="mt-5 text-[16px] leading-relaxed text-[var(--text-secondary)] max-w-[460px]">
              Every score decomposes into the six dimensions behind it, mapped
              geographically and tracked over time. You can see exactly why an
              area scores what it scores — and challenge it.
            </p>
            <ul className="mt-7 space-y-3">
              {[
                "Every score traceable to its inputs",
                "Interactive map of every area, coloured by score",
                "Side-by-side comparison across six liveability dimensions",
              ].map((t) => (
                <li
                  key={t}
                  className="flex gap-3 text-[14.5px] text-[var(--text-secondary)]"
                >
                  <span aria-hidden="true" style={{ color: "var(--primary)" }}>
                    ✓
                  </span>
                  <span>{t}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="relative">
            <div
              className="absolute -inset-6 -z-10 rounded-full blur-3xl opacity-50"
              style={{
                background:
                  "radial-gradient(circle, var(--primary-subtle) 0%, transparent 70%)",
              }}
              aria-hidden="true"
            />
            <AppMockup className="w-full h-auto drop-shadow-2xl" />
          </div>
        </div>
      </section>

      {/* ══════════════ CAPABILITIES ══════════════ */}
      <section className="border-y border-[var(--border)] bg-[var(--bg-subtle)]">
        <div className="mx-auto max-w-[1240px] px-5 sm:px-8 py-24 lg:py-32">
          <div className="max-w-[620px] mb-14">
            <SectionLabel>Capabilities</SectionLabel>
            <h2
              className="text-[var(--text-primary)]"
              style={{
                fontFamily: "var(--font-display)",
                fontSize: "clamp(32px, 4.4vw, 50px)",
                lineHeight: 1.06,
                letterSpacing: "-0.03em",
                fontWeight: 300,
              }}
            >
              What a chatbot
              <br />
              cannot give you.
            </h2>
            <p className="mt-5 text-[16px] leading-relaxed text-[var(--text-secondary)]">
              A chat window answers a question. Decisions worth six figures are
              made from a dashboard — live maps, comparisons, alerts, and
              portfolios that carry your context forward.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {CAPABILITIES.map((c) => {
              const Illo = ILLOS[c.illo];
              return (
              <Card key={c.title} hover className="h-full overflow-hidden flex flex-col">
                {/* Illustration */}
                <div className="relative h-[132px] bg-[var(--bg)] border-b border-[var(--border)] overflow-hidden shrink-0">
                  <div className="absolute inset-0 grid-bg opacity-40" aria-hidden="true" />
                  <div className="absolute inset-0 grid place-items-center p-3">
                    <div className="w-full max-w-[200px]">
                      <Illo className="w-full h-auto" />
                    </div>
                  </div>
                </div>
                <div className="p-6 flex-1">
                <div className="flex items-center gap-2 mb-4 flex-wrap">
                  <Badge
                    tone={
                      c.tag === "Premium"
                        ? "accent"
                        : c.tag === "Proprietary"
                          ? "highlight"
                          : "neutral"
                    }
                    className="!text-[10px]"
                  >
                    {c.tag}
                  </Badge>
                  {c.inDevelopment && (
                    <Badge tone="accent" className="!text-[10px]">
                      In development
                    </Badge>
                  )}
                </div>
                <h3 className="text-[16.5px] font-semibold text-[var(--text-primary)] mb-2.5">
                  {c.title}
                </h3>
                <p className="text-[14px] leading-relaxed text-[var(--text-secondary)]">
                  {c.desc}
                </p>
                </div>
              </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* ══════════════ CTA ══════════════ */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 grid-bg opacity-60" aria-hidden="true" />
        <div className="relative mx-auto max-w-[1240px] px-5 sm:px-8 py-24 lg:py-32">
          <Card className="relative overflow-hidden p-10 sm:p-14 text-center">
            <div
              className="absolute inset-0 -z-10"
              style={{
                background:
                  "radial-gradient(ellipse 70% 100% at 50% 0%, var(--primary-subtle) 0%, transparent 65%)",
              }}
              aria-hidden="true"
            />
            <Badge tone="primary" className="mb-6">
              Private beta
            </Badge>
            <h2
              className="max-w-[620px] mx-auto text-[var(--text-primary)]"
              style={{
                fontFamily: "var(--font-display)",
                fontSize: "clamp(30px, 4vw, 46px)",
                lineHeight: 1.08,
                letterSpacing: "-0.03em",
                fontWeight: 300,
              }}
            >
              Start with one postcode.
              <br />
              See what you have been missing.
            </h2>
            <p className="mt-5 max-w-[480px] mx-auto text-[15.5px] leading-relaxed text-[var(--text-secondary)]">
              Free to search and compare. No card required until you need
              premium reports or off-market data.
            </p>
            <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
              <Link href={user ? "/account" : "/auth/signup"}>
                <Button size="lg" variant="primary">
                  {user ? "Go to my account" : "Create free account"}
                </Button>
              </Link>
              <Link href="/compare">
                <Button size="lg" variant="secondary">
                  Compare two areas
                </Button>
              </Link>
            </div>
          </Card>
        </div>
      </section>
    </>
  );
}
