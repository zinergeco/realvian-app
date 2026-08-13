"use client";

import { useActionState } from "react";
import { uploadMediaAction } from "@/lib/admin-actions";
import { Alert, Field, SubmitButton } from "@/components/admin-ui";

export function UploadForm() {
  const [state, action] = useActionState(uploadMediaAction, {});

  return (
    <form action={action} className="space-y-4">
      {state?.error && <Alert kind="error">{state.error}</Alert>}
      {state?.ok && <Alert kind="success">Uploaded.</Alert>}

      <label className="block">
        <span className="block text-[12.5px] font-medium text-[var(--text-primary)] mb-1.5">
          File <span style={{ color: "var(--danger)" }}>*</span>
        </span>
        <input
          type="file"
          name="file"
          required
          accept="image/jpeg,image/png,image/webp,image/avif,image/svg+xml"
          className="w-full text-[13px] text-[var(--text-secondary)]
                     file:mr-3 file:py-2 file:px-4 file:rounded-[var(--radius-sm)]
                     file:border-0 file:text-[13px] file:font-medium
                     file:bg-[var(--primary-subtle)] file:text-[var(--primary)]"
        />
        <span className="block text-[11.5px] text-[var(--text-muted)] mt-1.5">
          JPEG, PNG, WebP, AVIF or SVG. Max 8 MB.
        </span>
      </label>

      <Field
        label="Alt text"
        name="altText"
        required
        rows={2}
        placeholder="Victorian terraced houses on a tree-lined street"
        hint="Describe what's in the image for screen-reader users."
      />
      <Field label="Credit" name="credit" placeholder="Photographer or source" />
      <Field
        label="Licence"
        name="licence"
        placeholder="owned / unsplash / shutterstock-12345"
        hint="Record where you got the right to use this. Needed if ownership is ever challenged."
      />

      <SubmitButton pendingLabel="Uploading…" className="w-full">
        Upload image
      </SubmitButton>
    </form>
  );
}
