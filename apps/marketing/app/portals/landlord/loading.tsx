/**
 * Scoped to just this route, not root-level — a root-level loading.tsx
 * was built, tested, and reverted earlier: enabling streaming SSR
 * site-wide caused a confirmed, serious regression where 404 and 500
 * status codes got silently replaced with 200, since the streamed
 * shell's status locks in before a page's real notFound()/thrown
 * error can set the correct one.
 *
 * This route is safe from that specific failure mode by construction:
 * app/portals/landlord/page.tsx never calls notFound() and never
 * redirects — signed-out visitors get a different inline view of the
 * same 200 response, not a different status code. Verified directly
 * in the source before building this, not assumed.
 */
export default function Loading() {
  return (
    <div className="flex items-center justify-center py-32">
      <div
        className="w-8 h-8 rounded-full animate-spin"
        style={{
          border: "3px solid var(--border)",
          borderTopColor: "var(--primary)",
        }}
        role="status"
        aria-label="Loading"
      />
    </div>
  );
}
