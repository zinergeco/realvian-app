"use client";

import { useActionState } from "react";
import { loginAction } from "@/lib/admin-actions";
import { Alert, Field, SubmitButton } from "@/components/admin-ui";
import { Card } from "@/components/ui";

export function LoginForm() {
  const [state, action] = useActionState(loginAction, {});

  return (
    <Card className="p-8">
      <h1
        className="text-[26px] text-[var(--text-primary)] mb-1.5"
        style={{ fontFamily: "var(--font-display)", fontWeight: 500, letterSpacing: "-0.02em" }}
      >
        Realvian admin
      </h1>
      <p className="text-[13.5px] text-[var(--text-muted)] mb-7">
        Sign in to manage content, media and listings.
      </p>

      <form action={action} className="space-y-4">
        {state?.error && <Alert kind="error">{state.error}</Alert>}
        <Field label="Email" name="email" type="email" required placeholder="you@realvian.co.uk" />
        <Field label="Password" name="password" type="password" required />
        <SubmitButton pendingLabel="Signing in…" className="w-full">
          Sign in
        </SubmitButton>
      </form>
    </Card>
  );
}
