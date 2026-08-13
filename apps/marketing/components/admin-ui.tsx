"use client";

import { useFormStatus } from "react-dom";
import { cx } from "./ui";

/** Submit button that disables and relabels while the action runs */
export function SubmitButton({
  children,
  pendingLabel = "Saving…",
  variant = "primary",
  className,
}: {
  children: React.ReactNode;
  pendingLabel?: string;
  variant?: "primary" | "secondary" | "danger";
  className?: string;
}) {
  const { pending } = useFormStatus();
  const styles = {
    primary: "bg-[var(--primary)] text-white hover:bg-[var(--primary-hover)]",
    secondary:
      "bg-[var(--surface)] text-[var(--text-primary)] border border-[var(--border-strong)] hover:border-[var(--primary)]",
    danger: "bg-[var(--danger)] text-white hover:brightness-110",
  }[variant];

  return (
    <button
      type="submit"
      disabled={pending}
      className={cx(
        "inline-flex items-center justify-center h-10 px-5 rounded-[var(--radius-md)]",
        "text-[14px] font-medium transition-all active:scale-[0.98]",
        "disabled:opacity-50 disabled:pointer-events-none",
        styles,
        className,
      )}
    >
      {pending ? pendingLabel : children}
    </button>
  );
}

export function Field({
  label,
  name,
  type = "text",
  required,
  placeholder,
  defaultValue,
  hint,
  rows,
}: {
  label: string;
  name: string;
  type?: string;
  required?: boolean;
  placeholder?: string;
  defaultValue?: string;
  hint?: string;
  rows?: number;
}) {
  const cls =
    "w-full px-3.5 py-2.5 bg-[var(--bg-subtle)] text-[var(--text-primary)] " +
    "border border-[var(--border-strong)] rounded-[var(--radius-md)] text-[14px] " +
    "placeholder:text-[var(--text-muted)] outline-none transition-colors " +
    "focus:border-[var(--primary)]";

  return (
    <label className="block">
      <span className="block text-[12.5px] font-medium text-[var(--text-primary)] mb-1.5">
        {label}
        {required && <span style={{ color: "var(--danger)" }}> *</span>}
      </span>
      {rows ? (
        <textarea
          name={name}
          required={required}
          placeholder={placeholder}
          defaultValue={defaultValue}
          rows={rows}
          className={cls}
        />
      ) : (
        <input
          type={type}
          name={name}
          required={required}
          placeholder={placeholder}
          defaultValue={defaultValue}
          className={cls}
        />
      )}
      {hint && (
        <span className="block text-[11.5px] text-[var(--text-muted)] mt-1.5">
          {hint}
        </span>
      )}
    </label>
  );
}

export function SelectField({
  label,
  name,
  options,
  required,
  defaultValue,
  hint,
}: {
  label: string;
  name: string;
  options: { value: string; label: string }[];
  required?: boolean;
  defaultValue?: string;
  hint?: string;
}) {
  return (
    <label className="block">
      <span className="block text-[12.5px] font-medium text-[var(--text-primary)] mb-1.5">
        {label}
        {required && <span style={{ color: "var(--danger)" }}> *</span>}
      </span>
      <select
        name={name}
        required={required}
        defaultValue={defaultValue}
        className="w-full px-3.5 py-2.5 bg-[var(--bg-subtle)] text-[var(--text-primary)]
                   border border-[var(--border-strong)] rounded-[var(--radius-md)]
                   text-[14px] outline-none focus:border-[var(--primary)]"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      {hint && (
        <span className="block text-[11.5px] text-[var(--text-muted)] mt-1.5">
          {hint}
        </span>
      )}
    </label>
  );
}

export function Alert({
  kind,
  children,
}: {
  kind: "error" | "success" | "info";
  children: React.ReactNode;
}) {
  const styles = {
    error: "border-[var(--danger)] text-[var(--danger)]",
    success: "border-[var(--primary)] text-[var(--primary)]",
    info: "border-[var(--border-strong)] text-[var(--text-secondary)]",
  }[kind];
  return (
    <div
      className={cx(
        "px-4 py-3 rounded-[var(--radius-md)] border bg-[var(--bg-subtle)] text-[13.5px]",
        styles,
      )}
      role={kind === "error" ? "alert" : "status"}
    >
      {children}
    </div>
  );
}
