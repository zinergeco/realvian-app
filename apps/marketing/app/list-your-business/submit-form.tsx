"use client";

import { useActionState } from "react";
import { submitListingAction } from "@/lib/admin-actions";
import { Alert, Field, SelectField, SubmitButton } from "@/components/admin-ui";
import { Card } from "@/components/ui";

const CATEGORIES = [
  { value: "estate_agent", label: "Estate agent" },
  { value: "mortgage_broker", label: "Mortgage broker" },
  { value: "solicitor", label: "Conveyancing solicitor" },
  { value: "surveyor", label: "Surveyor" },
  { value: "builder", label: "Builder / trades" },
  { value: "removals", label: "Removals" },
  { value: "cleaner", label: "Cleaning" },
  { value: "other", label: "Other" },
];

export function SubmitForm({ defaultArea }: { defaultArea: string }) {
  const [state, action] = useActionState(submitListingAction, {});

  if (state?.ok) {
    return (
      <Card className="p-10 text-center">
        <h2
          className="text-[24px] text-[var(--text-primary)] mb-3"
          style={{ fontFamily: "var(--font-display)", fontWeight: 500 }}
        >
          Submitted for review
        </h2>
        <p className="text-[14.5px] text-[var(--text-secondary)] max-w-[420px] mx-auto">
          We check every listing before publishing, usually within two working
          days. You'll hear from us at the email address you gave.
        </p>
      </Card>
    );
  }

  return (
    <Card className="p-7 sm:p-9">
      <form action={action} className="space-y-5">
        {state?.error && <Alert kind="error">{state.error}</Alert>}

        <Field label="Business name" name="businessName" required placeholder="Didsbury Property Services" />
        <SelectField label="Category" name="category" required options={CATEGORIES} />
        <Field
          label="Description"
          name="description"
          required
          rows={4}
          placeholder="What you do, who you serve, what makes you worth calling."
          hint="At least 40 characters. This is what people read before choosing you."
        />

        <div className="grid sm:grid-cols-2 gap-4">
          <Field
            label="Postcode"
            name="postcode"
            required
            defaultValue={defaultArea}
            placeholder="M20 2RN"
            hint="Determines which area pages you appear on."
          />
          <Field label="Website" name="website" placeholder="https://yoursite.co.uk" />
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="Phone" name="phone" placeholder="0161 000 0000" />
          <Field label="Email" name="email" type="email" required placeholder="you@business.co.uk"
                 hint="We'll use this to confirm your listing." />
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <label className="block">
            <span className="block text-[12.5px] font-medium text-[var(--text-primary)] mb-1.5">
              Logo
            </span>
            <input
              type="file"
              name="logo"
              accept="image/jpeg,image/png,image/webp"
              className="w-full text-[13px] text-[var(--text-secondary)]
                         file:mr-3 file:py-2 file:px-4 file:rounded-[var(--radius-sm)]
                         file:border-0 file:text-[13px] file:font-medium
                         file:bg-[var(--primary-subtle)] file:text-[var(--primary)]"
            />
            <span className="block text-[11.5px] text-[var(--text-muted)] mt-1.5">
              Square works best. Shown next to your name everywhere you appear.
            </span>
          </label>

          <label className="block">
            <span className="block text-[12.5px] font-medium text-[var(--text-primary)] mb-1.5">
              Cover image
            </span>
            <input
              type="file"
              name="coverImage"
              accept="image/jpeg,image/png,image/webp"
              className="w-full text-[13px] text-[var(--text-secondary)]
                         file:mr-3 file:py-2 file:px-4 file:rounded-[var(--radius-sm)]
                         file:border-0 file:text-[13px] file:font-medium
                         file:bg-[var(--primary-subtle)] file:text-[var(--primary)]"
            />
            <span className="block text-[11.5px] text-[var(--text-muted)] mt-1.5">
              Wide banner photo — your premises, team or work. Optional.
            </span>
          </label>
        </div>

        <p className="text-[12.5px] text-[var(--text-muted)] leading-relaxed">
          Basic listings are free. We review every submission before it goes
          live, and we may contact you to verify details. By submitting you
          confirm the information is accurate and that you're authorised to
          represent this business.
        </p>

        <SubmitButton pendingLabel="Submitting…">Submit listing</SubmitButton>
      </form>
    </Card>
  );
}
