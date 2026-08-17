import type { Metadata } from "next";
import { Card, SectionLabel } from "@/components/ui";

export const metadata: Metadata = {
  title: "Contact",
  description: "Get in touch with Realvian.",
  alternates: { canonical: "/contact" },
};

const CONTACTS = [
  {
    label: "General enquiries",
    email: "hello@realvian.co.uk",
    desc: "Questions about the platform, partnerships, or anything else.",
  },
  {
    label: "Data & corrections",
    email: "data@realvian.co.uk",
    desc: "Spotted a figure that looks wrong, or have a data source to suggest?",
  },
  {
    label: "List your business",
    email: "listings@realvian.co.uk",
    desc: "Questions about business listings — or submit directly via the listing form.",
    href: "/list-your-business",
  },
];

export default function ContactPage() {
  return (
    <>
      <section className="relative overflow-hidden border-b border-[var(--border)]">
        <div className="absolute inset-0 grid-bg opacity-50" aria-hidden="true" />
        <div className="absolute inset-0 glow-emerald" aria-hidden="true" />
        <div className="relative z-10 mx-auto max-w-[720px] px-5 sm:px-8 pt-[104px] pb-16 lg:pt-[128px]">
          <SectionLabel>Contact</SectionLabel>
          <h1
            className="text-[var(--text-primary)]"
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "clamp(34px, 5vw, 50px)",
              lineHeight: 1.03,
              letterSpacing: "-0.03em",
              fontWeight: 300,
            }}
          >
            Get in touch.
          </h1>
        </div>
      </section>

      <section className="mx-auto max-w-[720px] px-5 sm:px-8 py-16">
        <div className="space-y-4">
          {CONTACTS.map((c) => (
            <Card key={c.label} className="p-6 flex flex-wrap items-center justify-between gap-4">
              <div>
                <h2 className="text-[16px] font-semibold text-[var(--text-primary)] mb-1.5">
                  {c.label}
                </h2>
                <p className="text-[13.5px] text-[var(--text-secondary)]">{c.desc}</p>
              </div>
              <a
                href={c.href ?? `mailto:${c.email}`}
                className="text-[14px] font-medium whitespace-nowrap"
                style={{ color: "var(--primary)" }}
              >
                {c.href ? "List your business →" : c.email}
              </a>
            </Card>
          ))}
        </div>

        <p className="mt-10 text-[13px] text-[var(--text-muted)] leading-relaxed">
          Realvian is a small, early-stage team. We read everything that comes
          in but replies may take a few days rather than a few hours.
        </p>
      </section>
    </>
  );
}
