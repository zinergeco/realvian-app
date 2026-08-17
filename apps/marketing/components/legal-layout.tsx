import { SectionLabel } from "./ui";

export function LegalLayout({
  eyebrow,
  title,
  lastUpdated,
  children,
}: {
  eyebrow: string;
  title: string;
  lastUpdated: string;
  children: React.ReactNode;
}) {
  return (
    <>
      <section className="border-b border-[var(--border)]">
        <div className="mx-auto max-w-[720px] px-5 sm:px-8 pt-[104px] pb-10 lg:pt-[128px]">
          <SectionLabel>{eyebrow}</SectionLabel>
          <h1
            className="text-[var(--text-primary)] mb-3"
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "clamp(30px, 4.4vw, 44px)",
              lineHeight: 1.05,
              letterSpacing: "-0.03em",
              fontWeight: 300,
            }}
          >
            {title}
          </h1>
          <p className="text-[13px] text-[var(--text-muted)]">Last updated {lastUpdated}</p>
        </div>
      </section>

      <article className="mx-auto max-w-[720px] px-5 sm:px-8 py-14 legal-body">
        {children}
      </article>
    </>
  );
}
