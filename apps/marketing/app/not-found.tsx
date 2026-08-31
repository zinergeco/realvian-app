import Link from "next/link";
import { buildSearchIndex } from "@/lib/search-index";
import { InlineSiteSearch } from "@/components/inline-site-search";
import { IlloMap } from "@/components/illustrations";
import { Button } from "@/components/ui";

export default function NotFound() {
  const index = buildSearchIndex();

  return (
    <section className="mx-auto max-w-[720px] px-5 sm:px-8 py-24 text-center">
      <div className="w-[140px] mx-auto mb-8 opacity-70">
        <IlloMap className="w-full h-auto" />
      </div>

      <p className="text-[13px] font-semibold tracking-[0.06em] uppercase mb-3" style={{ color: "var(--primary)" }}>
        404
      </p>
      <h1
        className="text-[var(--text-primary)] mb-4"
        style={{
          fontFamily: "var(--font-display)",
          fontSize: "clamp(28px, 4vw, 40px)",
          lineHeight: 1.15,
          letterSpacing: "-0.02em",
          fontWeight: 300,
        }}
      >
        That page doesn&rsquo;t exist
      </h1>
      <p className="text-[15px] text-[var(--text-secondary)] mb-10 max-w-[440px] mx-auto">
        The link might be old, mistyped, or the page may have moved. Try
        searching for what you were after, or head back to somewhere real.
      </p>

      <InlineSiteSearch index={index} />

      <div className="flex flex-wrap items-center justify-center gap-3 mt-10">
        <Link href="/">
          <Button variant="primary">Back to homepage</Button>
        </Link>
        <Link href="/areas">
          <Button variant="secondary">Browse areas</Button>
        </Link>
        <Link href="/blog">
          <Button variant="secondary">Market reports</Button>
        </Link>
      </div>
    </section>
  );
}
