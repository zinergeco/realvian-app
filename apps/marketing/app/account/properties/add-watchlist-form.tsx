"use client";

import { useActionState, useRef } from "react";
import { addWatchlistAction } from "@/lib/property-watchlist-actions";
import { Alert, Field, SubmitButton } from "@/components/admin-ui";

export function AddWatchlistForm() {
  const [state, action] = useActionState(addWatchlistAction, {});
  const formRef = useRef<HTMLFormElement>(null);

  return (
    <form
      ref={formRef}
      action={async (fd) => {
        const result = await action(fd);
        formRef.current?.reset();
        return result;
      }}
      className="space-y-4"
    >
      {state?.error && <Alert kind="error">{state.error}</Alert>}
      {state?.ok && <Alert kind="success">Added to your watchlist.</Alert>}

      <Field label="Name" name="nickname" required placeholder="3-bed semi, Chorlton" />
      <Field label="Postcode" name="postcode" required placeholder="M21 0RN" />
      <Field label="Asking price" name="price" type="number" placeholder="350000" />
      <Field label="Listing link" name="listingUrl" placeholder="https://rightmove.co.uk/..." hint="Optional — link to the original listing" />
      <Field label="Notes" name="notes" rows={2} placeholder="Optional" />

      <SubmitButton pendingLabel="Adding…" className="w-full">
        Add to watchlist
      </SubmitButton>
    </form>
  );
}
