import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentUser } from "@/lib/public-auth";
import { listWatchlist } from "@/lib/property-watchlist";
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

      <div className="grid lg:grid-cols-[1fr_340px] gap-8">
        <div className="space-y-4 order-2 lg:order-1">
          {items.length === 0 ? (
            <Card className="p-10 text-center">
              <p className="text-[14px] text-[var(--text-secondary)]">
                Nothing on your watchlist yet. Add your first using the form.
              </p>
            </Card>
          ) : (
            items.map((item) => <WatchlistCard key={item.id} item={item} />)
          )}
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
    </div>
  );
}
