import Link from "next/link";
import { Wordmark } from "./wordmark";

const COLUMNS = [
  {
    title: "Platform",
    links: [
      { label: "Area intelligence", href: "/platform" },
      { label: "Compare areas", href: "/cities/compare" },
      { label: "Calculators", href: "/tools" },
      { label: "Marketplace", href: "/marketplace" },
    ],
  },
  {
    title: "Portals",
    links: [
      { label: "Landlords", href: "/portals/landlord" },
      { label: "Investors", href: "/portals/investor" },
      { label: "Agents", href: "/portals/agent" },
      { label: "Developers", href: "/portals/developer" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "About", href: "/about" },
      { label: "Pricing", href: "/pricing" },
      { label: "Careers", href: "/careers" },
      { label: "Contact", href: "/contact" },
    ],
  },
  {
    title: "Legal",
    links: [
      { label: "Terms", href: "/legal/terms" },
      { label: "Privacy", href: "/legal/privacy" },
      { label: "Cookies", href: "/legal/cookies" },
      { label: "AI disclosure", href: "/legal/ai" },
    ],
  },
];

export function SiteFooter() {
  return (
    <footer className="border-t border-[var(--border)] bg-[var(--bg-subtle)]">
      <div className="mx-auto max-w-[1240px] px-5 sm:px-8 py-14">
        <div className="grid gap-10 lg:grid-cols-[1.4fr_repeat(4,1fr)]">
          {/* Brand block */}
          <div className="max-w-[280px]">
            <Wordmark size={20} />
            <p className="mt-4 text-[13.5px] leading-relaxed text-[var(--text-muted)]">
              The intelligence layer above the UK property market. Built on
              fused public data, not guesswork.
            </p>
          </div>

          {/* Link columns */}
          {COLUMNS.map((col) => (
            <div key={col.title}>
              <h4 className="text-[11px] font-medium tracking-[0.12em] uppercase text-[var(--text-primary)] mb-4">
                {col.title}
              </h4>
              <ul className="space-y-2.5">
                {col.links.map((l) => (
                  <li key={l.href}>
                    <Link
                      href={l.href}
                      className="text-[13.5px] text-[var(--text-muted)] transition-colors hover:text-[var(--primary)]"
                    >
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 pt-7 border-t border-[var(--border)] flex flex-wrap items-center justify-between gap-4">
          <p className="text-[12.5px] text-[var(--text-muted)]">
            © {new Date().getFullYear()} Realvian Group Ltd · Registered in England &amp; Wales
          </p>
          <p className="text-[12px] text-[var(--text-muted)]">
            Data from HM Land Registry, ONS, Police.uk and 11 other sources
          </p>
        </div>
      </div>
    </footer>
  );
}
