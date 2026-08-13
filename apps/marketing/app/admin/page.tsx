import Link from "next/link";
import type { Metadata } from "next";
import { getDashboardStats, listAudit } from "@/lib/admin-data";
import { Badge, Card, SectionLabel } from "@/components/ui";
import { Alert } from "@/components/admin-ui";

export const metadata: Metadata = { title: "Dashboard", robots: { index: false } };
export const dynamic = "force-dynamic";

export default async function AdminDashboard() {
  let stats = null;
  let audit: Awaited<ReturnType<typeof listAudit>> = [];
  let error: string | null = null;

  try {
    [stats, audit] = await Promise.all([getDashboardStats(), listAudit(12)]);
  } catch (err) {
    error = err instanceof Error ? err.message : "Database unavailable";
  }

  if (error || !stats) {
    return (
      <Alert kind="error">
        Could not reach the database: {error}. Check DATABASE_URL and that
        migrations 0001 and 0002 have been applied.
      </Alert>
    );
  }

  const cards = [
    { label: "Media items", value: stats.mediaCount, href: "/admin/media" },
    { label: "Content overrides", value: stats.overrideCount, href: "/admin/content" },
    { label: "Affiliate programmes", value: stats.programCount, href: "/admin/affiliates" },
    { label: "Affiliate products", value: stats.productCount, href: "/admin/affiliates" },
    { label: "Listings pending", value: stats.listingsPending, href: "/admin/listings", urgent: stats.listingsPending > 0 },
    { label: "Listings live", value: stats.listingsApproved, href: "/admin/listings" },
    { label: "Clicks (7 days)", value: stats.clicks7d, href: "/admin" },
    { label: "Areas in database", value: stats.areasInDb, href: "/admin" },
  ];

  return (
    <>
      <SectionLabel>Overview</SectionLabel>
      <h1
        className="text-[var(--text-primary)] mb-8"
        style={{ fontFamily: "var(--font-display)", fontSize: 34, fontWeight: 300, letterSpacing: "-0.03em" }}
      >
        Dashboard
      </h1>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
        {cards.map((c) => (
          <Link key={c.label} href={c.href}>
            <Card hover className="p-5">
              <div className="text-[11px] tracking-[0.09em] uppercase text-[var(--text-muted)] mb-2">
                {c.label}
              </div>
              <div
                className="tnum text-[30px] font-semibold leading-none"
                style={{ color: c.urgent ? "var(--color-gold)" : "var(--text-primary)" }}
              >
                {c.value}
              </div>
            </Card>
          </Link>
        ))}
      </div>

      {stats.areasInDb < 10 && (
        <div className="mb-8">
          <Alert kind="info">
            Only {stats.areasInDb} areas in the database. The public site is
            currently served from the seed file, not from live data. Run the
            ingest to populate real figures.
          </Alert>
        </div>
      )}

      <SectionLabel>Recent activity</SectionLabel>
      <Card className="overflow-hidden mt-4">
        {audit.length === 0 ? (
          <p className="p-6 text-[13.5px] text-[var(--text-muted)] text-center">
            No activity recorded yet.
          </p>
        ) : (
          <table className="w-full text-[13.5px]">
            <thead>
              <tr className="border-b border-[var(--border)] bg-[var(--bg-subtle)]">
                {["When", "Who", "Action", "Entity"].map((h) => (
                  <th key={h} className="text-left px-4 py-2.5 text-[10.5px] tracking-[0.08em] uppercase text-[var(--text-muted)] font-medium">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {audit.map((a) => (
                <tr key={a.id} className="border-b border-[var(--border)] last:border-0">
                  <td className="px-4 py-2.5 text-[var(--text-muted)] whitespace-nowrap">
                    {new Date(a.createdAt).toLocaleString("en-GB", { dateStyle: "short", timeStyle: "short" })}
                  </td>
                  <td className="px-4 py-2.5 text-[var(--text-secondary)]">{a.actorEmail ?? "—"}</td>
                  <td className="px-4 py-2.5">
                    <Badge tone={a.action.includes("failed") ? "highlight" : "neutral"} className="!text-[9.5px]">
                      {a.action}
                    </Badge>
                  </td>
                  <td className="px-4 py-2.5 text-[var(--text-muted)]">
                    {a.entityType}{a.entityKey ? ` · ${a.entityKey.slice(0, 28)}` : ""}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
    </>
  );
}
