"use client";

import { useActionState } from "react";
import { createProgramAction, createProductAction } from "@/lib/admin-actions";
import { Alert, Field, SelectField, SubmitButton } from "@/components/admin-ui";

const CATEGORIES = [
  "mortgage", "conveyancing", "survey", "insurance", "removals",
  "utilities", "furniture", "trades", "banking", "education", "investment", "other",
].map((v) => ({ value: v, label: v[0]!.toUpperCase() + v.slice(1) }));

export function ProgramForm() {
  const [state, action] = useActionState(createProgramAction, {});
  return (
    <form action={action} className="space-y-4">
      {state?.error && <Alert kind="error">{state.error}</Alert>}
      {state?.ok && <Alert kind="success">Programme created — inactive until you activate it.</Alert>}
      <Field label="Name" name="name" required placeholder="Habito mortgages" />
      <SelectField label="Category" name="category" required options={CATEGORIES} />
      <Field label="Base URL" name="baseUrl" required placeholder="https://partner.example.com" hint="Must be https://" />
      <div className="grid grid-cols-2 gap-3">
        <SelectField label="Commission type" name="commissionType" options={[
          { value: "", label: "—" },
          { value: "cpa", label: "CPA" },
          { value: "cpl", label: "CPL" },
          { value: "percentage", label: "Percentage" },
        ]} />
        <Field label="Value" name="commissionValue" type="number" placeholder="45" />
      </div>
      <SubmitButton pendingLabel="Creating…" className="w-full">Create programme</SubmitButton>
    </form>
  );
}

export function ProductForm({ programs }: { programs: { id: string; name: string }[] }) {
  const [state, action] = useActionState(createProductAction, {});

  if (programs.length === 0) {
    return <Alert kind="info">Create a programme first — products belong to one.</Alert>;
  }

  return (
    <form action={action} className="space-y-4">
      {state?.error && <Alert kind="error">{state.error}</Alert>}
      {state?.ok && <Alert kind="success">Product created and live.</Alert>}
      <SelectField
        label="Programme"
        name="programId"
        required
        options={programs.map((p) => ({ value: p.id, label: p.name }))}
      />
      <Field label="Name" name="name" required placeholder="Fee-free mortgage advice" />
      <Field label="Description" name="description" required rows={2}
             placeholder="Whole-of-market advice with no broker fee." />
      <Field label="Destination URL" name="destinationUrl" required
             placeholder="https://partner.example.com/realvian" hint="Must be https://" />
      <Field label="CTA label" name="ctaLabel" defaultValue="Learn more" />
      <Field label="Match topics" name="matchTopics"
             placeholder="mortgage, affordability, firstTimeBuyer"
             hint="Comma-separated. Controls where this appears — leave blank and it will rarely show." />
      <div className="grid grid-cols-2 gap-3">
        <SelectField label="Scope" name="scopeType" options={[
          { value: "national", label: "National" },
          { value: "region", label: "Region" },
          { value: "city", label: "City" },
          { value: "outcode", label: "Outcode" },
        ]} />
        <Field label="Scope value" name="scopeValue" placeholder="Manchester" hint="Blank for national" />
      </div>
      <SubmitButton pendingLabel="Creating…" className="w-full">Create product</SubmitButton>
    </form>
  );
}
