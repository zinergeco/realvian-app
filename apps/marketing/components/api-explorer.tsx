"use client";

import { useState } from "react";

type Status = "idle" | "loading" | "success" | "error";

/**
 * Calls the real, live /api/v1/lookup endpoint directly from the
 * browser — same-origin (this page and the API both live on
 * realvian.co.uk), so no CORS configuration is needed. This is the
 * actual production API responding, not a mocked or simulated
 * response; the same rate limits documented elsewhere on this page
 * apply to requests made here too.
 */
export function ApiExplorer() {
  const [postcode, setPostcode] = useState("M20 2RN");
  const [status, setStatus] = useState<Status>("idle");
  const [response, setResponse] = useState<string>("");
  const [statusCode, setStatusCode] = useState<number | null>(null);

  async function runRequest() {
    setStatus("loading");
    setResponse("");
    setStatusCode(null);
    try {
      const url = `/api/v1/lookup?postcode=${encodeURIComponent(postcode)}`;
      const res = await fetch(url);
      const data = await res.json();
      setStatusCode(res.status);
      setResponse(JSON.stringify(data, null, 2));
      setStatus("success");
    } catch (err) {
      setStatus("error");
      setResponse(err instanceof Error ? err.message : "Request failed");
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
          <div className="flex items-center flex-1 min-w-[220px] rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--surface)] overflow-hidden">
            <span
              className="px-3 py-2 text-[12.5px] text-[var(--text-muted)] shrink-0"
              style={{ fontFamily: "var(--font-mono)" }}
            >
              ?postcode=
            </span>
            <input
              value={postcode}
              onChange={(e) => setPostcode(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && runRequest()}
              aria-label="Postcode to look up"
              className="flex-1 min-w-0 px-2 py-2 text-[13px] bg-transparent outline-none text-[var(--text-primary)]"
              style={{ fontFamily: "var(--font-mono)" }}
            />
          </div>
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
            <div className="flex items-center gap-2 mb-2">
              <span
                className="text-[11px] font-semibold px-2 py-0.5 rounded-full"
                style={{
                  background: statusCode < 400 ? "var(--primary)" : "var(--highlight)",
                  color: "white",
                }}
              >
                {statusCode}
              </span>
              <span className="text-[11.5px] text-[var(--text-muted)]">
                GET /api/v1/lookup?postcode={encodeURIComponent(postcode)}
              </span>
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
