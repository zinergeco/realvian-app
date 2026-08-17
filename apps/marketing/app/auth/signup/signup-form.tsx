"use client";

import { useActionState } from "react";
import { signupAction } from "@/lib/public-auth-actions";
import { Alert, Field, SubmitButton } from "@/components/admin-ui";
import { Card } from "@/components/ui";
import { Wordmark } from "@/components/wordmark";

export function SignupForm() {
  const [state, action] = useActionState(signupAction, {});

  return (
    <Card className="p-8">
      <div className="mb-6">
        <Wordmark size={20} />
      </div>
      <h1
        className="text-[24px] text-[var(--text-primary)] mb-1.5"
        style={{ fontFamily: "var(--font-display)", fontWeight: 500, letterSpacing: "-0.02em" }}
      >
        Create your account
      </h1>
      <p className="text-[13.5px] text-[var(--text-muted)] mb-7">
        Free — no card required. Save comparisons and pick up where you left off.
      </p>

      <form action={action} className="space-y-4">
        {state?.error && <Alert kind="error">{state.error}</Alert>}
        <Field label="Name" name="name" placeholder="Optional" />
        <Field label="Email" name="email" type="email" required placeholder="you@example.com" />
        <Field
          label="Password"
          name="password"
          type="password"
          required
          hint="At least 8 characters."
        />
        <SubmitButton pendingLabel="Creating account…" className="w-full">
          Create account
        </SubmitButton>
      </form>

      <p className="text-[11.5px] text-[var(--text-muted)] mt-6 leading-relaxed">
        By creating an account you agree to our{" "}
        <a href="/legal/terms" style={{ color: "var(--text-secondary)" }}>Terms</a> and{" "}
        <a href="/legal/privacy" style={{ color: "var(--text-secondary)" }}>Privacy Policy</a>.
      </p>
    </Card>
  );
}
