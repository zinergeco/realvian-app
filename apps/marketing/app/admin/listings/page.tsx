import type { Metadata } from "next";
import { listListings } from "@/lib/admin-data";
import { moderateListingAction } from "@/lib/admin-actions";
import { Card, SectionLabel, Badge } from "@/components/ui";
import { Alert } from "@/components/admin-ui";

export const metadata: Metadata = { title: "Listings", robots: { index: false } };
export const dynamic = "force-dynamic";

export default async function ListingsPage() {
  let listings: Awaited<ReturnType<typeof listListings>> = [];
  let error: string | null = null;
  try {
    listings = await listListings();
  } catch (err) {
    error = err instanceof Error ? err.message : "Database unavailable";
  }

  const pending = listings.filter((l) => l.status === "pending");
  const rest = listings.filter((l) => l.status !== "pending");

  return (
    <>
      <SectionLabel>Directory</SectionLabel>
      <h1
        className="text-[var(--text-primary)] mb-2"
        style={{ fontFamily: "var(--font-display)", fontSize: 34, fontWeight: 300, letterSpacing: "-0.03em" }}
      >
        Business listings
      </h1>
      <p className="text-[14px] text-[var(--text-secondary)] mb-8 max-w-[620px]">
        Approving a listing publishes it. Tier controls reach: <strong>featured</strong>{" "}
        appears on its own postcode page, <strong>premium</strong> across the whole city.
      </p>

      {error && <Alert kind="error">Could not load: {error}</Alert>}

      {pending.length > 0 && (
        <>
          <h2 className="text-[15px] font-semibold text-[var(--text-primary)] mb-4">
            Awaiting review ({pending.length})
          </h2>
          <div className="space-y-3 mb-10">
            {pending.map((l) => (
              <Card key={l.id} className="p-5">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge tone="neutral" className="!text-[9.5px]">{l.category}</Badge>
                      <Badge tone="accent" className="!text-[9.5px]">{l.outcode}</Badge>
                      {l.city && <Badge tone="neutral" className="!text-[9.5px]">{l.city}</Badge>}
                    </div>
                    <h3 className="text-[16px] font-semibold text-[var(--text-primary)]">
                      {l.businessName}
                    </h3>
                    <p className="text-[13.5px] text-[var(--text-secondary)] mt-1.5 max-w-[560px]">
                      {l.description}
                    </p>
                    <p className="text-[12px] text-[var(--text-muted)] mt-2">
                      {l.postcode}{l.website && ` · ${l.website}`}{l.phone && ` · ${l.phone}`}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {(["free", "featured", "premium"] as const).map((tier) => (
                      <form key={tier} action={moderateListingAction}>
                        <input type="hidden" name="id" value={l.id} />
                        <input type="hidden" name="status" value="approved" />
                        <input type="hidden" name="tier" value={tier} />
                        <button
                          type="submit"
                          className="h-9 px-3.5 text-[12.5px] font-medium rounded-[var(--radius-sm)]
                                     border border-[var(--primary-border)] text-[var(--primary)]
                                     hover:bg-[var(--primary-subtle)] transition-colors"
                        >
                          Approve · {tier}
                        </button>
                      </form>
                    ))}
                    <form action={moderateListingAction}>
                      <input type="hidden" name="id" value={l.id} />
                      <input type="hidden" name="status" value="rejected" />
                      <button
                        type="submit"
                        className="h-9 px-3.5 text-[12.5px] rounded-[var(--radius-sm)]
                                   border border-[var(--border)] text-[var(--text-muted)]
                                   hover:border-[var(--danger)] hover:text-[var(--danger)] transition-colors"
                      >
                        Reject
                      </button>
                    </form>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </>
      )}

      <h2 className="text-[15px] font-semibold text-[var(--text-primary)] mb-4">
        All listings ({listings.length})
      </h2>
      {listings.length === 0 ? (
        <Card className="p-10 text-center">
          <p className="text-[14px] text-[var(--text-muted)] mb-1">No listings yet.</p>
          <p className="text-[13px] text-[var(--text-muted)]">
            Businesses submit via <code>/list-your-business</code>.
          </p>
        </Card>
      ) : (
        <Card className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-[13.5px]">
            <thead>
              <tr className="border-b border-[var(--border)] bg-[var(--bg-subtle)]">
                {["Business", "Category", "Area", "Tier", "Status", ""].map((h) => (
                  <th key={h} className="text-left px-4 py-2.5 text-[10.5px] tracking-[0.08em] uppercase text-[var(--text-muted)] font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rest.map((l) => (
                <tr key={l.id} className="border-b border-[var(--border)] last:border-0">
                  <td className="px-4 py-3 text-[var(--text-primary)]">{l.businessName}</td>
                  <td className="px-4 py-3 text-[var(--text-secondary)]">{l.category}</td>
                  <td className="px-4 py-3 text-[var(--text-secondary)]">{l.outcode}{l.city ? ` · ${l.city}` : ""}</td>
                  <td className="px-4 py-3">
                    <Badge tone={l.tier === "premium" ? "accent" : "neutral"} className="!text-[9.5px]">{l.tier}</Badge>
                  </td>
                  <td className="px-4 py-3">
                    <Badge tone={l.status === "approved" ? "primary" : "neutral"} className="!text-[9.5px]">{l.status}</Badge>
                  </td>
                  <td className="px-4 py-3 text-right">
                    {l.status === "approved" && (
                      <form action={moderateListingAction}>
                        <input type="hidden" name="id" value={l.id} />
                        <input type="hidden" name="status" value="pending" />
                        <button type="submit" className="text-[12.5px] text-[var(--text-muted)] hover:text-[var(--danger)]">
                          Unpublish
                        </button>
                      </form>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
    </>
  );
}
