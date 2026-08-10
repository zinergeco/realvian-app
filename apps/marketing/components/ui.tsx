import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode } from "react";

/* ── utility ─────────────────────────────────────── */
export function cx(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(" ");
}

/* ══════════════════════════════════════════════════
   BUTTON
   ══════════════════════════════════════════════════ */
type ButtonVariant = "primary" | "secondary" | "ghost" | "premium" | "danger";
type ButtonSize = "sm" | "md" | "lg";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  children: ReactNode;
}

const buttonBase =
  "inline-flex items-center justify-center gap-2 font-medium whitespace-nowrap " +
  "transition-all duration-150 active:scale-[0.975] disabled:opacity-45 " +
  "disabled:pointer-events-none select-none";

const buttonSizes: Record<ButtonSize, string> = {
  sm: "h-9 px-4 text-[13px] rounded-[var(--radius-sm)]",
  md: "h-11 px-6 text-[14.5px] rounded-[var(--radius-md)]",
  lg: "h-[52px] px-8 text-[15.5px] rounded-[var(--radius-md)]",
};

export function Button({
  variant = "primary",
  size = "md",
  className,
  children,
  ...rest
}: ButtonProps) {
  const styles: Record<ButtonVariant, string> = {
    primary:
      "bg-[var(--primary)] text-white shadow-[var(--shadow-sm)] " +
      "hover:bg-[var(--primary-hover)] hover:shadow-[var(--shadow-md)]",
    secondary:
      "bg-[var(--surface)] text-[var(--text-primary)] border " +
      "border-[var(--border-strong)] hover:border-[var(--primary)] " +
      "hover:bg-[var(--surface-hover)]",
    ghost:
      "bg-transparent text-[var(--text-secondary)] " +
      "hover:bg-[var(--surface-hover)] hover:text-[var(--text-primary)]",
    // Gold — reserved strictly for upgrade / premium-tier CTAs
    premium:
      "bg-[var(--color-gold)] text-[#2A1F05] shadow-[var(--shadow-sm)] " +
      "hover:bg-[var(--color-gold-deep)] hover:shadow-[var(--shadow-md)]",
    danger:
      "bg-[var(--danger)] text-white hover:brightness-110",
  };

  return (
    <button
      className={cx(buttonBase, buttonSizes[size], styles[variant], className)}
      {...rest}
    >
      {children}
    </button>
  );
}

/* ══════════════════════════════════════════════════
   CARD
   ══════════════════════════════════════════════════ */
export function Card({
  className,
  children,
  hover = false,
}: {
  className?: string;
  children: ReactNode;
  hover?: boolean;
}) {
  return (
    <div
      className={cx(
        "bg-[var(--surface)] border border-[var(--border)]",
        "rounded-[var(--radius-lg)] shadow-[var(--shadow-sm)]",
        hover &&
          "transition-all duration-300 hover:-translate-y-1 " +
            "hover:shadow-[var(--shadow-lg)] hover:border-[var(--primary-border)]",
        className,
      )}
    >
      {children}
    </div>
  );
}

/* ══════════════════════════════════════════════════
   BADGE
   ══════════════════════════════════════════════════ */
type BadgeTone = "primary" | "accent" | "neutral" | "info" | "highlight";

export function Badge({
  tone = "primary",
  children,
  className,
}: {
  tone?: BadgeTone;
  children: ReactNode;
  className?: string;
}) {
  const tones: Record<BadgeTone, string> = {
    primary:
      "text-[var(--primary)] bg-[var(--primary-subtle)] border-[var(--primary-border)]",
    accent:
      "text-[var(--color-gold-deep)] dark:text-[var(--color-gold)] " +
      "bg-[var(--accent-subtle)] border-[color-mix(in_srgb,var(--color-gold)_30%,transparent)]",
    neutral:
      "text-[var(--text-secondary)] bg-[var(--bg-subtle)] border-[var(--border)]",
    info: "text-[var(--info)] bg-[color-mix(in_srgb,var(--info)_10%,transparent)] border-[color-mix(in_srgb,var(--info)_25%,transparent)]",
    highlight:
      "text-[var(--highlight)] bg-[color-mix(in_srgb,var(--highlight)_12%,transparent)] border-[color-mix(in_srgb,var(--highlight)_28%,transparent)]",
  };

  return (
    <span
      className={cx(
        "inline-flex items-center gap-1.5 px-3 py-1 border",
        "rounded-[var(--radius-full)] text-[11.5px] font-medium",
        "tracking-[0.08em] uppercase",
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

/* ══════════════════════════════════════════════════
   INPUT
   ══════════════════════════════════════════════════ */
export function Input({
  className,
  ...rest
}: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cx(
        "w-full h-11 px-4 bg-[var(--bg-subtle)] text-[var(--text-primary)]",
        "border border-[var(--border-strong)] rounded-[var(--radius-md)]",
        "text-[14.5px] placeholder:text-[var(--text-muted)]",
        "transition-colors duration-200 outline-none",
        "focus:border-[var(--primary)] focus:bg-[var(--surface)]",
        className,
      )}
      {...rest}
    />
  );
}

/* ══════════════════════════════════════════════════
   SKELETON — every data view needs one, never a bare spinner
   ══════════════════════════════════════════════════ */
export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={cx("skeleton rounded-[var(--radius-sm)]", className)}
      aria-hidden="true"
    />
  );
}

/* ══════════════════════════════════════════════════
   SECTION LABEL — the structural eyebrow
   ══════════════════════════════════════════════════ */
export function SectionLabel({ children }: { children: ReactNode }) {
  return (
    <p className="text-[11.5px] font-medium tracking-[0.18em] uppercase text-[var(--primary)] mb-4">
      {children}
    </p>
  );
}
