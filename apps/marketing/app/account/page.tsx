import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/public-auth";
import { logoutAction } from "@/lib/public-auth-actions";
import { Badge, Card, SectionLabel, Button } from "@/components/ui";
import Link from "next/link";

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

      <Card className="p-6 mb-6">
        <h2 className="text-[13px] font-semibold tracking-[0.06em] uppercase mb-4" style={{ color: "var(--primary)" }}>
          Coming to this account
        </h2>
        <ul className="space-y-3">
          {[
            "Save comparisons and revisit them later",
            "Follow areas and get notified when their score changes",
            "A single place to track properties you're evaluating",
          ].map((t) => (
            <li key={t} className="flex gap-2.5 text-[14px] leading-relaxed text-[var(--text-secondary)]">
              <span aria-hidden="true" style={{ color: "var(--color-gold)" }}>→</span>
              <span>{t}</span>
            </li>
          ))}
        </ul>
        <p className="text-[12.5px] text-[var(--text-muted)] mt-4">
          Your account works today — these features are next, not live yet.
        </p>
      </Card>

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
