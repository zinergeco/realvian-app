"use client";

import { updateWatchlistStatusAction, removeWatchlistAction } from "@/lib/property-watchlist-actions";
import { WATCHLIST_STATUSES, STATUS_LABELS } from "@/lib/watchlist-constants";
import type { WatchlistItem } from "@/lib/property-watchlist";
import { Badge, Card } from "@/components/ui";

const STATUS_TONE: Record<string, "primary" | "accent" | "neutral" | "highlight"> = {
  researching: "neutral",
  viewing_booked: "accent",
  viewed: "accent",
  offer_made: "primary",
  under_offer: "primary",
  withdrawn: "highlight",
};

function fmtGBP(n: number): string {
  return new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP", maximumFractionDigits: 0 }).format(n);
}

export function WatchlistCard({ item }: { item: WatchlistItem }) {
  return (
    <Card className="p-5">
      <div className="flex items-start justify-between gap-4 mb-3">
        <div className="min-w-0">
          <div className="mb-1.5">
            <Badge tone={STATUS_TONE[item.status] ?? "neutral"}>{STATUS_LABELS[item.status]}</Badge>
          </div>
          <h3 className="text-[16px] font-semibold text-[var(--text-primary)] truncate">
            {item.nickname}
          </h3>
          <p className="text-[12.5px] text-[var(--text-muted)] mt-0.5">
            {item.postcode}{item.city ? ` · ${item.city}` : ""}
            {item.price !== null ? ` · ${fmtGBP(item.price)}` : ""}
          </p>
        </div>
        <form action={removeWatchlistAction} className="shrink-0">
          <input type="hidden" name="id" value={item.id} />
          <button
            type="submit"
            className="text-[12px] text-[var(--text-muted)] hover:text-[var(--danger)] transition-colors"
          >
            Remove
          </button>
        </form>
      </div>

      {item.notes && (
        <p className="text-[13px] text-[var(--text-secondary)] mb-3">{item.notes}</p>
      )}

      <div className="flex items-center justify-between gap-3 pt-3 border-t border-[var(--border)]">
        <form action={updateWatchlistStatusAction} className="flex-1">
          <input type="hidden" name="id" value={item.id} />
          <select
            name="status"
            defaultValue={item.status}
            onChange={(e) => e.currentTarget.form?.requestSubmit()}
            className="text-[12.5px] bg-[var(--bg-subtle)] border border-[var(--border-strong)]
                       rounded-[var(--radius-sm)] px-2.5 py-1.5 text-[var(--text-primary)]"
          >
            {WATCHLIST_STATUSES.map((s) => (
              <option key={s} value={s}>
                {STATUS_LABELS[s]}
              </option>
            ))}
          </select>
        </form>
        {item.listingUrl && (
          <a
            href={item.listingUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[12.5px] font-medium shrink-0"
            style={{ color: "var(--primary)" }}
          >
            View listing →
          </a>
        )}
      </div>
    </Card>
  );
}
