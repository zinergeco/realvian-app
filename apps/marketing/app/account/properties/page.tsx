import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentUser } from "@/lib/public-auth";
import { listWatchlist } from "@/lib/property-watchlist";
import { groupByStatus, WATCHLIST_STATUSES, STATUS_LABELS } from "@/lib/watchlist-constants";
import { Card, SectionLabel } from "@/components/ui";
import { AddWatchlistForm } from "./add-watchlist-form";
import { WatchlistCard } from "./watchlist-card";

export const metadata: Metadata = {
  title: "Properties you're evaluating",
  robots: { index: false, follow: false },
};

export default async function PropertyWatchlistPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/auth/login");

  const items = await listWatchlist(user.id);

  return (
    <div className="mx-auto max-w-[860px] px-5 sm:px-8 pt-[104px] pb-20 lg:pt-[128px]">
      <Link href="/account" className="text-[13px] font-medium" style={{ color: "var(--primary)" }}>
        ← Back to account
      </Link>
      <SectionLabel>Watchlist</SectionLabel>
      <h1
        className="text-[var(--text-primary)] mb-3"
        style={{
          fontFamily: "var(--font-display)",
          fontSize: "clamp(30px, 4vw, 40px)",
          fontWeight: 300,
          letterSpacing: "-0.03em",
        }}
      >
        Properties you're evaluating
      </h1>
      <p className="text-[14.5px] text-[var(--text-secondary)] mb-8 max-w-[540px]">
        A single place to track properties as you move from researching to
        offer. Realvian doesn't hold listing data itself, so link out to
        wherever you found each one.
      </p>

      {items.length === 0 ? (
        <div className="grid lg:grid-cols-[1fr_340px] gap-8">
          <div className="order-2 lg:order-1">
            <Card className="p-10 text-center">
              <p className="text-[14px] text-[var(--text-secondary)]">
                Nothing on your watchlist yet. Add your first using the form.
              </p>
            </Card>
          </div>
          <div className="order-1 lg:order-2">
            <Card className="p-6 sticky top-[100px]">
              <h2 className="text-[13px] font-semibold tracking-[0.06em] uppercase mb-4" style={{ color: "var(--primary)" }}>
                Add a property
              </h2>
              <AddWatchlistForm />
            </Card>
          </div>
        </div>
      ) : (
        <div className="grid lg:grid-cols-[1fr_340px] gap-8">
          <div className="order-2 lg:order-1 -mx-5 sm:mx-0">
            {/* Horizontal scroll on narrow screens is deliberate, not
                a fallback — swiping between pipeline columns is the
                standard, well-understood mobile pattern for a Kanban
                board, and stacking six columns vertically would lose
                the entire point of grouping by stage. */}
            <div className="overflow-x-auto pb-3">
              <div className="flex gap-4 px-5 sm:px-0" style={{ minWidth: "max-content" }}>
                {(() => {
                  const grouped = groupByStatus(items);
                  return WATCHLIST_STATUSES.map((status) => (
                    <div key={status} className="w-[280px] shrink-0">
                      <div className="flex items-center justify-between mb-3 px-1">
                        <h3 className="text-[12.5px] font-semibold tracking-[0.04em] uppercase text-[var(--text-secondary)]">
                          {STATUS_LABELS[status]}
                        </h3>
                        <span className="text-[12px] text-[var(--text-muted)] tnum">
                          {grouped[status].length}
                        </span>
                      </div>
                      <div className="space-y-3">
                        {grouped[status].length === 0 ? (
                          <div className="border border-dashed border-[var(--border)] rounded-[var(--radius-md)] p-4 text-center">
                            <p className="text-[12px] text-[var(--text-muted)]">Nothing here</p>
                          </div>
                        ) : (
                          grouped[status].map((item) => <WatchlistCard key={item.id} item={item} />)
                        )}
                      </div>
                    </div>
                  ));
                })()}
              </div>
            </div>
          </div>

          <div className="order-1 lg:order-2">
            <Card className="p-6 sticky top-[100px]">
              <h2 className="text-[13px] font-semibold tracking-[0.06em] uppercase mb-4" style={{ color: "var(--primary)" }}>
                Add a property
              </h2>
              <AddWatchlistForm />
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
