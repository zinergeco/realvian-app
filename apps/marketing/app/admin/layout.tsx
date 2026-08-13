import Link from "next/link";
import { getCurrentAdmin } from "@/lib/admin-auth";
import { logoutAction } from "@/lib/admin-actions";
import { Wordmark } from "@/components/wordmark";
import { ThemeToggle } from "@/components/theme-toggle";
import { Badge } from "@/components/ui";

const NAV = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/media", label: "Media" },
  { href: "/admin/content", label: "Content & images" },
  { href: "/admin/affiliates", label: "Affiliates" },
  { href: "/admin/listings", label: "Listings" },
];

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const admin = await getCurrentAdmin();

  // The login page renders inside this layout too, so we can't redirect
  // here — middleware handles route protection. When there's no session we
  // render the bare shell so /admin/login still works.
  if (!admin) return <>{children}</>;

  return (
    <div className="min-h-screen bg-[var(--bg)]">
      <header className="sticky top-0 z-40 border-b border-[var(--border)] bg-[var(--surface)]">
        <div className="mx-auto max-w-[1240px] px-5 sm:px-8">
          <div className="h-[60px] flex items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <Wordmark size={18} />
              <Badge tone="neutral" className="!text-[9.5px]">Admin</Badge>
            </div>
            <div className="flex items-center gap-3">
              <span className="hidden sm:block text-[12.5px] text-[var(--text-muted)]">
                {admin.email}
              </span>
              <ThemeToggle />
              <form action={logoutAction}>
                <button
                  type="submit"
                  className="h-9 px-4 text-[13px] rounded-[var(--radius-sm)]
                             border border-[var(--border)] text-[var(--text-secondary)]
                             hover:border-[var(--primary)] hover:text-[var(--primary)]
                             transition-colors"
                >
                  Sign out
                </button>
              </form>
            </div>
          </div>
          <nav className="flex gap-1 -mb-px overflow-x-auto">
            {NAV.map((n) => (
              <Link
                key={n.href}
                href={n.href}
                className="px-3.5 py-2.5 text-[13.5px] whitespace-nowrap
                           text-[var(--text-secondary)] border-b-2 border-transparent
                           hover:text-[var(--primary)] hover:border-[var(--primary-border)]
                           transition-colors"
              >
                {n.label}
              </Link>
            ))}
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-[1240px] px-5 sm:px-8 py-9">{children}</main>
    </div>
  );
}
