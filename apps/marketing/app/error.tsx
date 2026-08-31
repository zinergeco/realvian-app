"use client";

import { useEffect } from "react";
import Link from "next/link";
import { IlloEmpty } from "@/components/illustrations";
import { Button } from "@/components/ui";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Server-side console.error here lands in the real deployment
    // logs (Coolify/Docker), which is the only error tracking this
    // project currently has — no Sentry or similar integration
    // exists yet. Logging the digest specifically matters: it's
    // Next.js's own reference ID for this exact error occurrence,
    // useful for correlating a user's report with the actual server
    // log entry without needing to expose the raw error to them.
    console.error("Unhandled page error:", error.digest ?? error.message);
  }, [error]);

  return (
    <section className="mx-auto max-w-[720px] px-5 sm:px-8 py-24 text-center">
      <div className="w-[140px] mx-auto mb-8 opacity-70">
        <IlloEmpty className="w-full h-auto" />
      </div>

      <p className="text-[13px] font-semibold tracking-[0.06em] uppercase mb-3" style={{ color: "var(--highlight)" }}>
        Something went wrong
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
        That page hit a problem
      </h1>
      <p className="text-[15px] text-[var(--text-secondary)] mb-3 max-w-[440px] mx-auto">
        This wasn&rsquo;t a dead link — something failed loading this page.
        It&rsquo;s often temporary; trying again usually fixes it.
      </p>
      {error.digest && (
        <p className="text-[12px] text-[var(--text-muted)] mb-8 font-mono">
          Reference: {error.digest}
        </p>
      )}

      <div className="flex flex-wrap items-center justify-center gap-3 mt-6">
        <Button variant="primary" onClick={() => reset()}>
          Try again
        </Button>
        <Link href="/">
          <Button variant="secondary">Back to homepage</Button>
        </Link>
        <Link href="/contact">
          <Button variant="secondary">Report this</Button>
        </Link>
      </div>
    </section>
  );
}
