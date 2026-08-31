import type { Metadata } from "next";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

/**
 * Deliberately kept as a permanent route, unlike other temporary test
 * pages used elsewhere in this codebase's history. The error boundary
 * (app/error.tsx) has almost no independently unit-testable logic —
 * it's fundamentally a rendering component — so without a real way to
 * trigger a genuine thrown error, there would be zero ongoing
 * automated regression coverage for it at all. This route exists
 * purely so e2e/error-boundary.spec.ts can verify the boundary still
 * catches errors correctly after future changes, the same way a
 * production app might keep a dedicated debug/test-error endpoint.
 * It throws immediately and renders nothing else — no data exposure risk.
 *
 * A plain Server Component, not a Client Component — Next.js's error
 * boundary catches thrown errors from both, and staying a Server
 * Component is what allows this file to also export `metadata`
 * cleanly (a Client Component file cannot export metadata at all).
 */
export default function DevTestErrorTrigger() {
  throw new Error("Deliberate test error - verifying the error boundary");
}
