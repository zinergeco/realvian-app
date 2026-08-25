import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/public-auth";
import { logoutAction } from "@/lib/public-auth-actions";
import { deleteComparisonAction } from "@/lib/comparison-actions";
import { listUserComparisons } from "@/lib/comparisons";
import { unfollowAreaFormAction } from "@/lib/followed-area-actions";
import { listFollowedAreas } from "@/lib/followed-areas";
import { getAreaBySlug } from "@/lib/areas";
import { listApiKeys } from "@/lib/api-keys";
import { ApiKeysSection } from "./api-keys-section";
import { Badge, Card, SectionLabel, Button } from "@/components/ui";
import { ScoreRing } from "@/components/area-viz";

export const metadata: Metadata = {
  title: "My account",
  robots: { index: false, follow: false },
};

const TIER_LABELS: Record<string, string> = {
  free: "Free",
  pro: "Pro",
  investor: "Investor",
  business: "Business",
  enterprise: "Enterprise",
};

export default async function AccountPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/auth/login");

  const joined = new Date(user.createdAt).toLocaleDateString("en-GB", {
    month: "long",
    year: "numeric",
  });

  const saved = await listUserComparisons(user.id);
  // Resolve slugs to real area data now, once, server-side — the list
  // component below stays a plain server render, no client fetch needed.
  const savedWithAreas = saved
    .map((c) => ({
      ...c,
      a: getAreaBySlug(c.areaSlugs[0]),
      b: getAreaBySlug(c.areaSlugs[1]),
    }))
    // A slug could theoretically no longer resolve if the seed dataset
    // ever changes — skip rather than crash on a stale saved row.
    .filter((c): c is typeof c & { a: NonNullable<typeof c.a>; b: NonNullable<typeof c.b> } =>
      Boolean(c.a && c.b),
    );

  const followed = await listFollowedAreas(user.id);
  const apiKeys = await listApiKeys(user.id);
  const followedWithAreas = followed
    .map((f) => ({ ...f, area: getAreaBySlug(f.areaSlug) }))
    .filter((f): f is typeof f & { area: NonNullable<typeof f.area> } => Boolean(f.area));

  return (
    <div className="mx-auto max-w-[720px] px-5 sm:px-8 pt-[104px] pb-20 lg:pt-[128px]">
      <SectionLabel>Account</SectionLabel>
      <h1
        className="text-[var(--text-primary)] mb-8"
        style={{
          fontFamily: "var(--font-display)",
          fontSize: "clamp(30px, 4vw, 40px)",
          fontWeight: 300,
          letterSpacing: "-0.03em",
        }}
      >
        {user.name ? `Welcome back, ${user.name.split(" ")[0]}` : "Your account"}
      </h1>

      <Card className="p-6 mb-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <div className="text-[11px] tracking-[0.08em] uppercase text-[var(--text-muted)] mb-1.5">
              Email
            </div>
            <div className="text-[15px] text-[var(--text-primary)]">{user.email}</div>
          </div>
          <div>
            <div className="text-[11px] tracking-[0.08em] uppercase text-[var(--text-muted)] mb-1.5">
              Plan
            </div>
            <Badge tone="primary">{TIER_LABELS[user.tier] ?? user.tier}</Badge>
          </div>
          <div>
            <div className="text-[11px] tracking-[0.08em] uppercase text-[var(--text-muted)] mb-1.5">
              Member since
            </div>
            <div className="text-[15px] text-[var(--text-primary)]">{joined}</div>
          </div>
        </div>
      </Card>

      {/* ══════════ SAVED COMPARISONS ══════════ */}
      <Card className="p-6 mb-6">
        <div className="flex items-center justify-between gap-4 mb-4">
          <h2
            className="text-[13px] font-semibold tracking-[0.06em] uppercase"
            style={{ color: "var(--primary)" }}
          >
            Saved comparisons
          </h2>
          <Link href="/compare" className="text-[13px] font-medium" style={{ color: "var(--primary)" }}>
            New comparison →
          </Link>
        </div>

        {savedWithAreas.length === 0 ? (
          <p className="text-[14px] text-[var(--text-secondary)] leading-relaxed">
            Nothing saved yet.{" "}
            <Link href="/compare" style={{ color: "var(--primary)" }}>
              Compare two areas
            </Link>{" "}
            and hit "Save this comparison" to keep it here.
          </p>
        ) : (
          <ul className="space-y-3">
            {savedWithAreas.map((c) => (
              <li
                key={c.id}
                className="flex items-center gap-4 p-3.5 rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--bg-subtle)]"
              >
                <div className="flex items-center gap-2 shrink-0">
                  <ScoreRing score={c.a.realvianScore} size={40} />
                  <span className="text-[11px] text-[var(--text-muted)]">vs</span>
                  <ScoreRing score={c.b.realvianScore} size={40} />
                </div>
                <div className="min-w-0 flex-1">
                  <Link
                    href={`/compare?a=${c.a.slug}&b=${c.b.slug}`}
                    className="text-[14.5px] font-medium text-[var(--text-primary)] hover:text-[var(--primary)] transition-colors"
                  >
                    {c.a.district} vs {c.b.district}
                  </Link>
                  <p className="text-[12px] text-[var(--text-muted)] mt-0.5">
                    {c.a.city} · {c.b.city} — saved{" "}
                    {new Date(c.createdAt).toLocaleDateString("en-GB", {
                      day: "numeric",
                      month: "short",
                    })}
                  </p>
                </div>
                <form action={deleteComparisonAction}>
                  <input type="hidden" name="id" value={c.id} />
                  <button
                    type="submit"
                    className="text-[12.5px] text-[var(--text-muted)] hover:text-[var(--danger)] transition-colors shrink-0"
                  >
                    Remove
                  </button>
                </form>
              </li>
            ))}
          </ul>
        )}
      </Card>

      {/* ══════════ FOLLOWED AREAS — now real ══════════ */}
      <Card className="p-6 mb-6">
        <div className="flex items-center justify-between gap-4 mb-4">
          <h2
            className="text-[13px] font-semibold tracking-[0.06em] uppercase"
            style={{ color: "var(--primary)" }}
          >
            Followed areas
          </h2>
          <Link href="/areas" className="text-[13px] font-medium" style={{ color: "var(--primary)" }}>
            Browse areas →
          </Link>
        </div>

        {followedWithAreas.length === 0 ? (
          <p className="text-[14px] text-[var(--text-secondary)] leading-relaxed">
            Nothing followed yet. Open any{" "}
            <Link href="/areas" style={{ color: "var(--primary)" }}>
              area page
            </Link>{" "}
            and hit "Follow this area" to keep it here.
          </p>
        ) : (
          <ul className="space-y-3">
            {followedWithAreas.map((f) => (
              <li
                key={f.id}
                className="flex items-center gap-4 p-3.5 rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--bg-subtle)]"
              >
                <ScoreRing score={f.area.realvianScore} size={40} />
                <div className="min-w-0 flex-1">
                  <Link
                    href={`/areas/${f.area.slug}`}
                    className="text-[14.5px] font-medium text-[var(--text-primary)] hover:text-[var(--primary)] transition-colors"
                  >
                    {f.area.district}
                  </Link>
                  <p className="text-[12px] text-[var(--text-muted)] mt-0.5">
                    {f.area.city} · {f.area.outcode} — followed{" "}
                    {new Date(f.createdAt).toLocaleDateString("en-GB", {
                      day: "numeric",
                      month: "short",
                    })}
                  </p>
                </div>
                <form action={unfollowAreaFormAction}>
                  <input type="hidden" name="areaSlug" value={f.areaSlug} />
                  <button
                    type="submit"
                    className="text-[12.5px] text-[var(--text-muted)] hover:text-[var(--danger)] transition-colors shrink-0"
                  >
                    Remove
                  </button>
                </form>
              </li>
            ))}
          </ul>
        )}
        <p className="text-[12px] text-[var(--text-muted)] mt-4">
          This tracks areas here for quick access. Email alerts on score
          changes aren't built yet.
        </p>
      </Card>

      <Card className="p-6 mb-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-[13px] font-semibold tracking-[0.06em] uppercase mb-1.5" style={{ color: "var(--primary)" }}>
              Property watchlist
            </h2>
            <p className="text-[14px] text-[var(--text-secondary)]">
              Track properties as you move from researching to offer.
            </p>
          </div>
          <Link
            href="/account/properties"
            className="text-[13px] font-medium shrink-0"
            style={{ color: "var(--primary)" }}
          >
            Open →
          </Link>
        </div>
      </Card>

      <Card className="p-6 mb-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-[13px] font-semibold tracking-[0.06em] uppercase mb-1.5" style={{ color: "var(--primary)" }}>
              Your data
            </h2>
            <p className="text-[14px] text-[var(--text-secondary)]">
              Download everything stored against your account — saved
              comparisons, followed areas, and your property watchlist —
              as a single JSON file.
            </p>
          </div>
          <a
            href="/account/export"
            className="text-[13px] font-medium shrink-0"
            style={{ color: "var(--primary)" }}
          >
            Download →
          </a>
        </div>
      </Card>

      <ApiKeysSection keys={apiKeys} />

      <div className="flex flex-wrap gap-3">
        <Link href="/areas">
          <Button variant="primary">Explore areas</Button>
        </Link>
        <Link href="/compare">
          <Button variant="secondary">Compare areas</Button>
        </Link>
        <form action={logoutAction}>
          <Button variant="ghost" type="submit">Sign out</Button>
        </form>
      </div>
    </div>
  );
}
