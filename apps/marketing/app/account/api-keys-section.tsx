"use client";

import { useActionState, useState } from "react";
import { generateApiKeyAction, revokeApiKeyAction } from "@/lib/api-key-actions";
import type { ApiKey } from "@/lib/api-keys";
import { Badge, Card } from "@/components/ui";
import { Alert, Field, SubmitButton } from "@/components/admin-ui";

function CopyableKey({ rawKey }: { rawKey: string }) {
  const [copied, setCopied] = useState(false);

  return (
    <div className="mt-3">
      <div className="flex items-center gap-2">
        <code
          className="flex-1 text-[12.5px] p-3 rounded-[var(--radius-sm)] bg-[var(--bg-subtle)]
                     border border-[var(--border-strong)] overflow-x-auto whitespace-nowrap"
          style={{ fontFamily: "var(--font-mono)" }}
        >
          {rawKey}
        </code>
        <button
          type="button"
          onClick={() => {
            navigator.clipboard.writeText(rawKey);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
          }}
          className="shrink-0 text-[12.5px] font-medium px-3 py-2 rounded-[var(--radius-sm)]
                     bg-[var(--primary)] text-white"
        >
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
      <p className="text-[12px] text-[var(--color-gold)] mt-2">
        This is shown once. Copy it now — Realvian doesn't store the raw key and can't show it again.
      </p>
    </div>
  );
}

export function ApiKeysSection({ keys }: { keys: ApiKey[] }) {
  const [state, action] = useActionState(generateApiKeyAction, {});

  return (
    <Card className="p-6 mb-6">
      <div className="flex items-center justify-between gap-4 mb-4">
        <div>
          <h2 className="text-[13px] font-semibold tracking-[0.06em] uppercase mb-1.5" style={{ color: "var(--primary)" }}>
            API keys
          </h2>
          <p className="text-[14px] text-[var(--text-secondary)]">
            Free, self-serve keys for the{" "}
            <a href="/developers" style={{ color: "var(--primary)" }}>public API</a> — 120
            requests/minute instead of the 30/minute anonymous limit.
          </p>
        </div>
      </div>

      {keys.length > 0 && (
        <ul className="space-y-2.5 mb-5">
          {keys.map((k) => (
            <li
              key={k.id}
              className="flex items-center justify-between gap-4 p-3.5 rounded-[var(--radius-md)]
                         border border-[var(--border)] bg-[var(--bg-subtle)]"
            >
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[13.5px] font-medium text-[var(--text-primary)]">{k.name}</span>
                  <Badge tone="neutral" className="!text-[10px]">{k.keyPrefix}…</Badge>
                </div>
                <p className="text-[11.5px] text-[var(--text-muted)] mt-0.5">
                  Created {new Date(k.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                  {k.lastUsedAt
                    ? ` · last used ${new Date(k.lastUsedAt).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}`
                    : " · never used"}
                </p>
              </div>
              <form action={revokeApiKeyAction}>
                <input type="hidden" name="keyId" value={k.id} />
                <button
                  type="submit"
                  className="text-[12px] text-[var(--text-muted)] hover:text-[var(--danger)] transition-colors shrink-0"
                >
                  Revoke
                </button>
              </form>
            </li>
          ))}
        </ul>
      )}

      {state?.error && <Alert kind="error">{state.error}</Alert>}
      {state?.rawKey && <CopyableKey rawKey={state.rawKey} />}

      <form action={action} className="flex items-end gap-3 mt-4">
        <div className="flex-1">
          <Field label="Name this key" name="name" placeholder="e.g. My analytics script" />
        </div>
        <SubmitButton pendingLabel="Generating…">Generate key</SubmitButton>
      </form>
    </Card>
  );
}
