"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Wordmark } from "./wordmark";
import { ThemeToggle } from "./theme-toggle";
import { Button, cx } from "./ui";

const NAV = [
  { label: "Areas", href: "/areas" },
  { label: "Compare", href: "/compare" },
  { label: "Portals", href: "/portals" },
  { label: "Reports", href: "/blog" },
  { label: "Tools", href: "/tools" },
  { label: "Pricing", href: "/pricing" },
];

export function SiteHeader({
  user,
}: {
  user: { name: string | null; email: string } | null;
}) {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Lock body scroll when the mobile sheet is open
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <>
      <header
        className={cx(
          "fixed top-0 inset-x-0 z-50 transition-all duration-300",
          scrolled
            ? "bg-[color-mix(in_srgb,var(--bg)_88%,transparent)] backdrop-blur-xl border-b border-[var(--border)]"
            : "bg-transparent border-b border-transparent",
        )}
      >
        <div className="mx-auto max-w-[1240px] px-5 sm:px-8">
          <div className="h-[68px] flex items-center justify-between gap-6">
            <Wordmark />

            {/* Desktop nav */}
            <nav className="hidden lg:flex items-center gap-1" aria-label="Main">
              {NAV.map((n) => (
                <Link
                  key={n.href}
                  href={n.href}
                  className="px-3.5 py-2 text-[14px] text-[var(--text-secondary)]
                             rounded-[var(--radius-sm)] transition-colors
                             hover:text-[var(--text-primary)] hover:bg-[var(--surface-hover)]"
                >
                  {n.label}
                </Link>
              ))}
            </nav>

            <div className="flex items-center gap-2.5">
              <ThemeToggle />
              {user ? (
                <Link href="/account" className="hidden sm:block">
                  <Button variant="primary" size="sm">
                    {user.name ? user.name.split(" ")[0] : "My account"}
                  </Button>
                </Link>
              ) : (
                <>
                  <Link href="/auth/login" className="hidden sm:block">
                    <Button variant="ghost" size="sm">
                      Sign in
                    </Button>
                  </Link>
                  <Link href="/auth/signup" className="hidden sm:block">
                    <Button variant="primary" size="sm">
                      Get started
                    </Button>
                  </Link>
                </>
              )}

              {/* Mobile menu trigger */}
              <button
                onClick={() => setOpen(true)}
                aria-label="Open menu"
                className="lg:hidden w-10 h-10 grid place-items-center
                           rounded-[var(--radius-md)] border border-[var(--border)]
                           bg-[var(--surface)] text-[var(--text-secondary)]
                           active:scale-95 transition-transform"
              >
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.9"
                  strokeLinecap="round"
                  aria-hidden="true"
                >
                  <path d="M3 6h18M3 12h18M3 18h18" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* ── Mobile sheet: bottom-sheet pattern, the mobile-app-feel choice ── */}
      <div
        className={cx(
          "lg:hidden fixed inset-0 z-[60] transition-opacity duration-300",
          open ? "opacity-100" : "opacity-0 pointer-events-none",
        )}
      >
        <div
          className="absolute inset-0 bg-black/50 backdrop-blur-sm"
          onClick={() => setOpen(false)}
          aria-hidden="true"
        />
        <div
          className={cx(
            "absolute bottom-0 inset-x-0 bg-[var(--surface)]",
            "rounded-t-[var(--radius-xl)] border-t border-[var(--border)]",
            "shadow-[var(--shadow-xl)] transition-transform duration-400",
            open ? "translate-y-0" : "translate-y-full",
          )}
          style={{
            transitionTimingFunction: "var(--ease-out-expo)",
            paddingBottom: "max(24px, env(safe-area-inset-bottom))",
          }}
          role="dialog"
          aria-modal="true"
          aria-label="Menu"
        >
          {/* Grab handle */}
          <div className="pt-3 pb-1 grid place-items-center">
            <div className="w-10 h-1 rounded-full bg-[var(--border-strong)]" />
          </div>

          <div className="px-5 pt-3">
            <nav className="grid gap-1 mb-5">
              {NAV.map((n) => (
                <Link
                  key={n.href}
                  href={n.href}
                  onClick={() => setOpen(false)}
                  className="px-4 py-3.5 text-[16px] text-[var(--text-primary)]
                             rounded-[var(--radius-md)] transition-colors
                             active:bg-[var(--surface-hover)]"
                >
                  {n.label}
                </Link>
              ))}
            </nav>

            <div className="grid gap-2.5 pt-4 border-t border-[var(--border)]">
              {user ? (
                <Link href="/account" onClick={() => setOpen(false)}>
                  <Button variant="primary" size="lg" className="w-full">
                    My account
                  </Button>
                </Link>
              ) : (
                <>
                  <Link href="/auth/signup" onClick={() => setOpen(false)}>
                    <Button variant="primary" size="lg" className="w-full">
                      Get started
                    </Button>
                  </Link>
                  <Link href="/auth/login" onClick={() => setOpen(false)}>
                    <Button variant="secondary" size="lg" className="w-full">
                      Sign in
                    </Button>
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
