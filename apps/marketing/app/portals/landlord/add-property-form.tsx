"use client";

import { useActionState, useRef } from "react";
import { addPropertyAction } from "@/lib/property-actions";
import { Alert, Field, SelectField, SubmitButton } from "@/components/admin-ui";

const EPC_OPTIONS = [
  { value: "", label: "Don't know" },
  ...["A", "B", "C", "D", "E", "F", "G"].map((v) => ({ value: v, label: v })),
];

export function AddPropertyForm() {
  const [state, action] = useActionState(addPropertyAction, {});
  const formRef = useRef<HTMLFormElement>(null);

  return (
    <form
      ref={formRef}
      action={async (fd) => {
        const result = await action(fd);
        // Clear the form on success so adding a second property doesn't
        // start from stale values — reset() is the plain DOM way to do
        // this without fighting React's uncontrolled-input model here.
        formRef.current?.reset();
        return result;
      }}
      className="space-y-4"
    >
      {state?.error && <Alert kind="error">{state.error}</Alert>}
      {state?.ok && <Alert kind="success">Property added.</Alert>}

      <Field label="Name" name="nickname" required placeholder="14 Elm Street" />
      <Field label="Postcode" name="postcode" required placeholder="M20 2RN" />

      <SelectField label="EPC rating" name="epcRating" options={EPC_OPTIONS} />
      <Field label="EPC expiry" name="epcExpiry" type="date" />
      <Field label="Gas safety expiry" name="gasSafetyExpiry" type="date" hint="Leave blank if no gas appliances" />
      <Field label="EICR expiry" name="eicrExpiry" type="date" />
      <Field
        label="Current monthly rent"
        name="currentRent"
        type="number"
        placeholder="1200"
        hint="Optional — shown against the area average"
      />
      <Field label="Notes" name="notes" rows={2} placeholder="Optional" />

      <SubmitButton pendingLabel="Adding…" className="w-full">
        Add property
      </SubmitButton>
    </form>
  );
}
