import Link from "next/link";
import {
  type AffiliateProduct,
  type BusinessListing,
  CATEGORY_LABELS,
  COMMERCIAL_LINK_ATTRS,
  trackedUrl,
} from "@/lib/monetisation";
import { Badge, Card, cx } from "./ui";
import { IlloEmpty } from "./illustrations";

/* ══════════════════════════════════════════════════════
   DISCLOSURE LABEL
   Required on every paid placement. CAP Code s.2 requires advertising
   to be obviously identifiable as such — this is not decorative.
   ══════════════════════════════════════════════════════ */
export function AdLabel({ kind }: { kind: "sponsored" | "affiliate" | "promoted" }) {
  const text = {
    sponsored: "Sponsored",
    affiliate: "Affiliate link — we may earn a commission",
    promoted: "Promoted listing",
  }[kind];

  return (
    <span className="inline-flex items-center gap-1.5 text-[10.5px] tracking-[0.08em] uppercase text-[var(--text-muted)]">
      <span
        className="w-1 h-1 rounded-full bg-[var(--text-muted)]"
        aria-hidden="true"
      />
      {text}
    </span>
  );
}

/* ══════════════════════════════════════════════════════
   BUSINESS LISTING CARD
   ══════════════════════════════════════════════════════ */
export function ListingCard({
  listing,
  context,
}: {
  listing: BusinessListing;
  context?: { path?: string; slot?: string; outcode?: string };
}) {
  const href = trackedUrl("business_listing", listing.id, context);
  const logoUrl = listing.logoKey ? `/media/${listing.logoKey}` : null;
  const coverUrl = listing.coverKey ? `/media/${listing.coverKey}` : null;

  return (
    <Card hover className="h-full flex flex-col overflow-hidden">
      {coverUrl && (
        <div className="relative h-[120px] shrink-0 bg-[var(--bg-subtle)] border-b border-[var(--border)]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={coverUrl}
            alt=""
            aria-hidden="true"
            className="w-full h-full object-cover"
          />
          {logoUrl && (
            <div
              className="absolute top-3 left-3 w-11 h-11 rounded-[var(--radius-md)] overflow-hidden
                         border-2 border-[var(--bg)] bg-[var(--bg)] shadow-md"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={logoUrl} alt={`${listing.businessName} logo`} className="w-full h-full object-cover" />
            </div>
          )}
        </div>
      )}

      <div className="p-5 flex flex-col flex-1">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="min-w-0 flex items-start gap-2.5">
            {/* Logo shown inline next to the name only when there's no
                cover photo to badge it onto above — never render it twice. */}
            {logoUrl && !coverUrl && (
              <div className="w-9 h-9 rounded-[var(--radius-sm)] overflow-hidden shrink-0 border border-[var(--border)]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={logoUrl} alt={`${listing.businessName} logo`} className="w-full h-full object-cover" />
              </div>
            )}
            <div className="min-w-0">
              <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                <Badge tone="neutral" className="!text-[9.5px] !py-0.5">
                  {CATEGORY_LABELS[listing.category]}
                </Badge>
                {listing.verified && (
                  <Badge tone="primary" className="!text-[9.5px] !py-0.5">
                    ✓ Verified
                  </Badge>
                )}
              </div>
              <h3 className="text-[16px] font-semibold text-[var(--text-primary)] leading-snug">
                {listing.businessName}
              </h3>
            </div>
          </div>
          {listing.ratingAvg !== null && listing.reviewCount > 0 && (
            <div className="text-right shrink-0">
              <div
                className="tnum text-[15px] font-semibold"
                style={{ color: "var(--primary)" }}
              >
                {listing.ratingAvg.toFixed(1)}
              </div>
              <div className="text-[10.5px] text-[var(--text-muted)]">
                {listing.reviewCount} review{listing.reviewCount === 1 ? "" : "s"}
              </div>
            </div>
          )}
        </div>

        <p className="text-[13.5px] leading-relaxed text-[var(--text-secondary)] flex-1">
          {listing.description}
        </p>

        <div className="flex items-center justify-between gap-3 mt-4 pt-3.5 border-t border-[var(--border)]">
          {listing.isPaid ? <AdLabel kind="promoted" /> : <span />}
          {listing.website && (
            <a
              href={href}
              {...COMMERCIAL_LINK_ATTRS}
              className="text-[13px] font-medium transition-transform duration-200 hover:translate-x-0.5"
              style={{ color: "var(--primary)" }}
            >
              Visit site →
            </a>
          )}
        </div>
      </div>
    </Card>
  );
}

/* ══════════════════════════════════════════════════════
   AFFILIATE OFFER
   ══════════════════════════════════════════════════════ */
export function AffiliateOffer({
  product,
  context,
  variant = "card",
}: {
  product: AffiliateProduct;
  context?: { path?: string; slot?: string; outcode?: string; postSlug?: string };
  variant?: "card" | "inline";
}) {
  const href = trackedUrl("affiliate_product", product.id, context);

  if (variant === "inline") {
    return (
      <div className="my-8 p-5 rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--bg-subtle)]">
        <div className="mb-2.5">
          <AdLabel kind="affiliate" />
        </div>
        <h4 className="text-[15.5px] font-semibold text-[var(--text-primary)] mb-1.5">
          {product.name}
        </h4>
        <p className="text-[13.5px] leading-relaxed text-[var(--text-secondary)] mb-4">
          {product.description}
        </p>
        <a
          href={href}
          {...COMMERCIAL_LINK_ATTRS}
          className="inline-flex items-center justify-center h-10 px-5
                     rounded-[var(--radius-md)] text-[13.5px] font-medium
                     text-white transition-all active:scale-[0.98]"
          style={{ background: "var(--primary)" }}
        >
          {product.ctaLabel}
        </a>
      </div>
    );
  }

  return (
    <Card hover className="p-5 h-full flex flex-col">
      <div className="mb-3">
        <AdLabel kind="affiliate" />
      </div>
      <h4 className="text-[15.5px] font-semibold text-[var(--text-primary)] mb-2">
        {product.name}
      </h4>
      <p className="text-[13.5px] leading-relaxed text-[var(--text-secondary)] flex-1">
        {product.description}
      </p>
      <a
        href={href}
        {...COMMERCIAL_LINK_ATTRS}
        className="mt-4 inline-flex items-center gap-1.5 text-[13.5px] font-medium
                   transition-transform duration-200 hover:translate-x-0.5"
        style={{ color: "var(--primary)" }}
      >
        {product.ctaLabel} →
      </a>
    </Card>
  );
}

/* ══════════════════════════════════════════════════════
   LOCAL SERVICES BLOCK — the area-page module
   ══════════════════════════════════════════════════════ */
export function LocalServices({
  listings,
  areaName,
  outcode,
  path,
}: {
  listings: BusinessListing[];
  areaName: string;
  outcode: string;
  path: string;
}) {
  // Empty state is deliberate: an honest "none yet, add yours" outperforms
  // a hidden section, and it doubles as the acquisition funnel for listings.
  if (listings.length === 0) {
    return (
      <Card className="p-8 text-center">
        <div className="w-[120px] mx-auto mb-4 opacity-60">
          <IlloEmpty className="w-full h-auto" />
        </div>
        <h3 className="text-[16px] font-semibold text-[var(--text-primary)] mb-2">
          No local services listed for {areaName} yet
        </h3>
        <p className="text-[13.5px] text-[var(--text-secondary)] max-w-[380px] mx-auto mb-5">
          Run a business here? Get listed in front of people actively
          researching {outcode}.
        </p>
        <Link
          href={`/list-your-business?area=${outcode}`}
          className="inline-flex items-center justify-center h-10 px-5
                     rounded-[var(--radius-md)] text-[13.5px] font-medium text-white"
          style={{ background: "var(--primary)" }}
        >
          List your business
        </Link>
      </Card>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between gap-4 mb-5">
        <p className="text-[13.5px] text-[var(--text-secondary)]">
          Businesses serving {areaName}
        </p>
        <Link
          href={`/list-your-business?area=${outcode}`}
          className="text-[13px] font-medium whitespace-nowrap"
          style={{ color: "var(--primary)" }}
        >
          List your business →
        </Link>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        {listings.map((l) => (
          <ListingCard
            key={l.id}
            listing={l}
            context={{ path, slot: "area_services", outcode }}
          />
        ))}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════
   OFFERS BLOCK
   ══════════════════════════════════════════════════════ */
export function OffersBlock({
  products,
  context,
  className,
}: {
  products: AffiliateProduct[];
  context?: { path?: string; slot?: string; outcode?: string; postSlug?: string };
  className?: string;
}) {
  if (products.length === 0) return null;

  return (
    <div className={cx("grid sm:grid-cols-2 lg:grid-cols-3 gap-4", className)}>
      {products.map((p) => (
        <AffiliateOffer key={p.id} product={p} context={context} />
      ))}
    </div>
  );
}
