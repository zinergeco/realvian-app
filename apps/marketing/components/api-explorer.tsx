"use client";

import { useState } from "react";

type Status = "idle" | "loading" | "success" | "error";

export interface ApiExplorerField {
  /** query string key */
  key: string;
  /** short label shown before the input, e.g. "?postcode=" */
  prefix: string;
  defaultValue: string;
  ariaLabel: string;
}

/**
 * Generic, reusable across every endpoint documented on this page —
 * calls the real, live API directly from the browser (same-origin,
 * no CORS needed). This is the actual production API responding, not
 * a mocked response; the same rate limits documented elsewhere on
 * this page apply to requests made here too.
 */
export function ApiExplorer({
  endpoint,
  fields,
}: {
  endpoint: string;
  fields: ApiExplorerField[];
}) {
  const [values, setValues] = useState<Record<string, string>>(
    Object.fromEntries(fields.map((f) => [f.key, f.defaultValue])),
  );
  const [status, setStatus] = useState<Status>("idle");
  const [response, setResponse] = useState<string>("");
  const [statusCode, setStatusCode] = useState<number | null>(null);
  const [copied, setCopied] = useState(false);

  function buildUrl(): string {
    const params = fields
      .filter((f) => values[f.key]?.trim())
      .map((f) => `${f.key}=${encodeURIComponent(values[f.key]!.trim())}`)
      .join("&");
    return params ? `${endpoint}?${params}` : endpoint;
  }

  async function runRequest() {
    setStatus("loading");
    setResponse("");
    setStatusCode(null);
    setCopied(false);
    try {
      const res = await fetch(buildUrl());
      const data = await res.json();
      setStatusCode(res.status);
      setResponse(JSON.stringify(data, null, 2));
      setStatus("success");
    } catch (err) {
      setStatus("error");
      setResponse(err instanceof Error ? err.message : "Request failed");
    }
  }

  async function copyResponse() {
    try {
      await navigator.clipboard.writeText(response);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      // Clipboard API can be unavailable (permissions, insecure
      // context) — failing silently here is correct: the response is
      // still fully visible and selectable by hand, so there's no
      // broken state to recover from, just a convenience that didn't
      // fire.
    }
  }

  return (
    <div
      className="rounded-[var(--radius-md)] border border-[var(--border)] overflow-hidden"
      style={{ background: "var(--bg-subtle)" }}
    >
      <div className="p-4 border-b border-[var(--border)]">
        <p className="text-[12px] text-[var(--text-muted)] mb-3">
          Try it live — this calls the real API, right now, from your browser.
        </p>
        <div className="flex flex-wrap gap-2">
          {fields.map((f) => (
            <div
              key={f.key}
              className="flex items-center flex-1 min-w-[180px] rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--surface)] overflow-hidden"
            >
              <span
                className="px-3 py-2 text-[12.5px] text-[var(--text-muted)] shrink-0"
                style={{ fontFamily: "var(--font-mono)" }}
              >
                {f.prefix}
              </span>
              <input
                value={values[f.key]}
                onChange={(e) => setValues((v) => ({ ...v, [f.key]: e.target.value }))}
                onKeyDown={(e) => e.key === "Enter" && runRequest()}
                aria-label={f.ariaLabel}
                className="flex-1 min-w-0 px-2 py-2 text-[13px] bg-transparent outline-none text-[var(--text-primary)]"
                style={{ fontFamily: "var(--font-mono)" }}
              />
            </div>
          ))}
          <button
            type="button"
            onClick={runRequest}
            disabled={status === "loading"}
            className="px-4 py-2 rounded-[var(--radius-sm)] text-[13.5px] font-medium text-white transition-opacity disabled:opacity-60"
            style={{ background: "var(--primary)" }}
          >
            {status === "loading" ? "Running…" : "Run request"}
          </button>
        </div>
      </div>

      {status !== "idle" && (
        <div className="p-4">
          {statusCode !== null && (
            <div className="flex items-center justify-between gap-2 mb-2">
              <div className="flex items-center gap-2 min-w-0">
                <span
                  className="text-[11px] font-semibold px-2 py-0.5 rounded-full shrink-0"
                  style={{
                    background: statusCode < 400 ? "var(--primary)" : "var(--highlight)",
                    color: "white",
                  }}
                >
                  {statusCode}
                </span>
                <span className="text-[11.5px] text-[var(--text-muted)] truncate">
                  GET {buildUrl()}
                </span>
              </div>
              {status === "success" && (
                <button
                  type="button"
                  onClick={copyResponse}
                  className="text-[11.5px] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors shrink-0"
                >
                  {copied ? "Copied ✓" : "Copy"}
                </button>
              )}
            </div>
          )}
          <pre
            tabIndex={0}
            className="text-[12px] leading-relaxed p-3 rounded-[var(--radius-sm)] overflow-x-auto max-h-[280px] overflow-y-auto"
            style={{
              fontFamily: "var(--font-mono)",
              background: "var(--surface)",
              border: "1px solid var(--border)",
              color: status === "error" ? "var(--highlight)" : "var(--text-primary)",
            }}
          >
            <code>{response}</code>
          </pre>
        </div>
      )}
    </div>
  );
}
