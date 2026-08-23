"use client";

import { useActionState, useState } from "react";
import { updatePropertyDatesAction, deletePropertyAction } from "@/lib/property-actions";
import type { PropertyWithUrgency, UrgencyLevel } from "@/lib/properties";
import { compareRentToArea } from "@/lib/rent-comparison";
import { Badge, Card } from "@/components/ui";
import { Alert, Field, SelectField, SubmitButton } from "@/components/admin-ui";

const URGENCY_LABEL: Record<UrgencyLevel, string> = {
  overdue: "Overdue",
  urgent: "Due soon",
  ok: "Up to date",
  unknown: "No dates set",
};

const URGENCY_TONE: Record<UrgencyLevel, "highlight" | "accent" | "primary" | "neutral"> = {
  overdue: "highlight",
  urgent: "accent",
  ok: "primary",
  unknown: "neutral",
};

const EPC_OPTIONS = [
  { value: "", label: "Don't know" },
  ...["A", "B", "C", "D", "E", "F", "G"].map((v) => ({ value: v, label: v })),
];

function fmtDate(iso: string | null): string {
  if (!iso) return "Not set";
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

function DateRow({ label, date, isNext }: { label: string; date: string | null; isNext: boolean }) {
  return (
    <div className="flex items-center justify-between py-1.5">
      <span className="text-[13px] text-[var(--text-muted)]">{label}</span>
      <span
        className="text-[13px] font-medium"
        style={{ color: isNext ? "var(--text-primary)" : "var(--text-secondary)" }}
      >
        {fmtDate(date)}
      </span>
    </div>
  );
}

export function PropertyCard({ property: p }: { property: PropertyWithUrgency }) {
  const [editing, setEditing] = useState(false);
  const [updateState, updateAction] = useActionState(updatePropertyDatesAction, {});
  const rentComparison = compareRentToArea(p.outcode, p.currentRent);

  return (
    <Card className="p-5">
      <div className="flex items-start justify-between gap-4 mb-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
            <Badge tone={URGENCY_TONE[p.urgency]}>{URGENCY_LABEL[p.urgency]}</Badge>
            {p.epcRating && (
              <Badge tone="neutral">EPC {p.epcRating}</Badge>
            )}
          </div>
          <h3 className="text-[16px] font-semibold text-[var(--text-primary)] truncate">
            {p.nickname}
          </h3>
          <p className="text-[12.5px] text-[var(--text-muted)] mt-0.5">
            {p.postcode}{p.city ? ` · ${p.city}` : ""}
          </p>
        </div>
        <form action={deletePropertyAction} className="shrink-0">
          <input type="hidden" name="id" value={p.id} />
          <button
            type="submit"
            className="text-[12px] text-[var(--text-muted)] hover:text-[var(--danger)] transition-colors"
          >
            Remove
          </button>
        </form>
      </div>

      {!editing ? (
        <>
          <div className="border-t border-[var(--border)] pt-2 mt-2">
            <DateRow label="EPC expiry" date={p.epcExpiry} isNext={p.nextDeadline?.label === "EPC"} />
            <DateRow label="Gas safety" date={p.gasSafetyExpiry} isNext={p.nextDeadline?.label === "Gas safety"} />
            <DateRow label="EICR" date={p.eicrExpiry} isNext={p.nextDeadline?.label === "EICR"} />
          </div>
          {rentComparison && (
            <div className="flex items-center justify-between py-2 mt-1 border-t border-[var(--border)]">
              <span className="text-[13px] text-[var(--text-muted)]">
                Rent vs. {rentComparison.dataStatus === "illustrative" ? "estimated" : "live"} area avg
              </span>
              <span
                className="text-[13px] font-medium"
                style={{
                  color:
                    rentComparison.diffPct >= 0 ? "var(--primary)" : "var(--color-gold)",
                }}
              >
                {rentComparison.diffPct >= 0 ? "+" : ""}
                {rentComparison.diffPct}% ({new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP", maximumFractionDigits: 0 }).format(rentComparison.areaAvgRent)} avg)
              </span>
            </div>
          )}
          {p.notes && (
            <p className="text-[12.5px] text-[var(--text-secondary)] mt-2.5 pt-2.5 border-t border-[var(--border)]">
              {p.notes}
            </p>
          )}
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="mt-3 text-[12.5px] font-medium"
            style={{ color: "var(--primary)" }}
          >
            Update dates →
          </button>
        </>
      ) : (
        <form action={updateAction} className="border-t border-[var(--border)] pt-4 mt-2 space-y-3">
          {updateState?.error && <Alert kind="error">{updateState.error}</Alert>}
          <input type="hidden" name="id" value={p.id} />
          <SelectField label="EPC rating" name="epcRating" options={EPC_OPTIONS} defaultValue={p.epcRating ?? ""} />
          <Field label="EPC expiry" name="epcExpiry" type="date" defaultValue={p.epcExpiry ?? ""} />
          <Field label="Gas safety expiry" name="gasSafetyExpiry" type="date" defaultValue={p.gasSafetyExpiry ?? ""} />
          <Field label="EICR expiry" name="eicrExpiry" type="date" defaultValue={p.eicrExpiry ?? ""} />
          <Field
            label="Current monthly rent"
            name="currentRent"
            type="number"
            defaultValue={p.currentRent !== null ? String(p.currentRent) : ""}
            hint="Optional — shown against the area average"
          />
          <div className="flex gap-2">
            <SubmitButton pendingLabel="Saving…">Save</SubmitButton>
            <button
              type="button"
              onClick={() => setEditing(false)}
              className="h-10 px-4 text-[13.5px] text-[var(--text-secondary)]"
            >
              Cancel
            </button>
          </div>
        </form>
      )}
    </Card>
  );
}
