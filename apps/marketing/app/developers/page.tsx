import type { Metadata } from "next";
import { Badge, Card, SectionLabel } from "@/components/ui";

export const metadata: Metadata = {
  title: "Developer API",
  description: "Free, public JSON API for Realvian's UK area intelligence data.",
  alternates: { canonical: "/developers" },
};

function CodeBlock({ children }: { children: string }) {
  return (
    <pre
      className="text-[12.5px] leading-relaxed p-4 rounded-[var(--radius-md)] overflow-x-auto
                 bg-[var(--bg-subtle)] border border-[var(--border)]"
      style={{ fontFamily: "var(--font-mono)" }}
    >
      <code>{children}</code>
    </pre>
  );
}

function Endpoint({
  method,
  path,
  description,
  children,
}: {
  method: string;
  path: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <Card className="p-6 mb-6">
      <div className="flex items-center gap-2.5 mb-2">
        <Badge tone="primary">{method}</Badge>
        <code className="text-[14px]" style={{ fontFamily: "var(--font-mono)" }}>
          {path}
        </code>
      </div>
      <p className="text-[14px] text-[var(--text-secondary)] mb-4">{description}</p>
      {children}
    </Card>
  );
}

export default function DevelopersPage() {
  return (
    <>
      <section className="relative overflow-hidden border-b border-[var(--border)]">
        <div className="absolute inset-0 grid-bg opacity-50" aria-hidden="true" />
        <div className="absolute inset-0 glow-emerald" aria-hidden="true" />
        <div className="relative z-10 mx-auto max-w-[820px] px-5 sm:px-8 pt-[104px] pb-16 lg:pt-[128px]">
          <SectionLabel>Developers</SectionLabel>
          <div className="mb-5">
            <Badge tone="primary">Free · Beta</Badge>
          </div>
          <h1
            className="text-[var(--text-primary)] mb-5"
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "clamp(32px, 4.6vw, 50px)",
              lineHeight: 1.04,
              letterSpacing: "-0.03em",
              fontWeight: 300,
            }}
          >
            Realvian API
          </h1>
          <p className="text-[16px] leading-[1.65] text-[var(--text-secondary)] max-w-[600px]">
            Read-only JSON access to the same area data that powers
            realvian.co.uk — scores, prices, yields and the six liveability
            dimensions for every area we cover. Free, with an optional API
            key for a higher rate limit.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-[820px] px-5 sm:px-8 py-14">
        <Card className="p-5 mb-8">
          <p className="text-[13px] text-[var(--text-secondary)] leading-relaxed">
            <strong className="text-[var(--text-primary)]">Beta status, honestly stated:</strong>{" "}
            this API is public and free. Every endpoint is rate-limited —
            30 requests/minute for unauthenticated callers, 120/minute with
            a free API key from your account. The limiter is a single
            in-memory counter, not a distributed one: it resets on every
            deploy, and if this service ever runs as more than one
            instance the limit is enforced per-instance, not globally.
            Reasonable for where this project is today; don't build
            infrastructure that assumes today's exact numbers are
            permanent.
          </p>
        </Card>

        <Card className="p-5 mb-8">
          <p className="text-[13px] text-[var(--text-secondary)] leading-relaxed">
            <strong className="text-[var(--text-primary)]">API keys:</strong>{" "}
            generate one free from your{" "}
            <a href="/account" style={{ color: "var(--primary)" }}>account page</a> — no
            billing, no approval step. Send it as{" "}
            <code style={{ fontFamily: "var(--font-mono)" }}>Authorization: Bearer rv_...</code>{" "}
            on any request. The raw key is shown once at generation and never stored — if you lose
            it, revoke it and generate a new one.
          </p>
        </Card>

        <h2
          className="text-[22px] text-[var(--text-primary)] mb-4"
          style={{ fontFamily: "var(--font-display)", fontWeight: 500, letterSpacing: "-0.02em" }}
        >
          Endpoints
        </h2>
        <p className="text-[13.5px] text-[var(--text-secondary)] mb-6">
          Prefer to generate a client, or import into Postman/Insomnia?
          Full <a href="/api/v1/openapi.json" style={{ color: "var(--primary)" }}>OpenAPI 3.0 spec</a>{" "}
          covering every endpoint below.
        </p>

        <Endpoint
          method="GET"
          path="/api/v1/areas"
          description="List every area Realvian covers. Supports optional city and region filters, and format=csv for a spreadsheet-ready download instead of JSON."
        >
          <CodeBlock>{`curl https://realvian.co.uk/api/v1/areas?city=Manchester`}</CodeBlock>
          <p className="text-[13px] text-[var(--text-muted)] mt-3 mb-1.5">Response</p>
          <CodeBlock>{`{
  "data": [
    {
      "slug": "didsbury-m20",
      "district": "Didsbury",
      "city": "Manchester",
      "region": "North West",
      "outcode": "M20",
      "realvianScore": 87,
      "investmentScore": 79,
      "avgPrice": 412500,
      "avgRent": 1450,
      "grossYield": 5.2,
      "fiveYearGrowth": 18.4,
      "dataStatus": "geography-live"
    }
  ],
  "meta": { "count": 4, "generatedAt": "2026-08-22T12:00:00.000Z" }
}`}</CodeBlock>
          <p className="text-[13px] text-[var(--text-muted)] mt-3 mb-1.5">Or as CSV, for Excel/Sheets</p>
          <CodeBlock>{`curl -O -J https://realvian.co.uk/api/v1/areas?format=csv`}</CodeBlock>
        </Endpoint>

        <Endpoint
          method="GET"
          path="/api/v1/areas/{slug}"
          description="Full detail for a single area, including all six liveability dimensions, editorial summary, and strengths/watchouts. Returns 404 with a JSON error body if the slug doesn't exist."
        >
          <CodeBlock>{`curl https://realvian.co.uk/api/v1/areas/didsbury-m20`}</CodeBlock>
        </Endpoint>

        <Endpoint
          method="GET"
          path="/api/v1/reports"
          description="List every market report on the site — metadata only (title, description, tags, which areas it covers), not the full article body. Supports optional area and kind filters. Visit the linked slug on realvian.co.uk for the full report."
        >
          <CodeBlock>{`curl https://realvian.co.uk/api/v1/reports?area=didsbury-m20`}</CodeBlock>
        </Endpoint>

        <Endpoint
          method="GET"
          path="/api/v1/compare"
          description="Full detail for two areas side by side in a single request — the same data the public comparison tool uses. Requires both ?a= and ?b= slugs. Returns 400 if either is missing, 404 if either slug doesn't exist."
        >
          <CodeBlock>{`curl https://realvian.co.uk/api/v1/compare?a=didsbury-m20&b=chorlton-m21`}</CodeBlock>
        </Endpoint>

        <Endpoint
          method="GET"
          path="/api/v1/areas/batch"
          description="Full detail for up to 50 specific areas in one request, instead of one call per area. Partial success by design — an unknown slug is reported in meta.notFound rather than failing the whole request."
        >
          <CodeBlock>{`curl https://realvian.co.uk/api/v1/areas/batch?slugs=didsbury-m20,chorlton-m21`}</CodeBlock>
          <p className="text-[13px] text-[var(--text-muted)] mt-3 mb-1.5">meta shape</p>
          <CodeBlock>{`{ "requested": 2, "found": 2, "notFound": [], "generatedAt": "..." }`}</CodeBlock>
        </Endpoint>

        <Endpoint
          method="GET"
          path="/api/v1/lookup"
          description="Resolve any UK postcode or outcode to its Realvian area, if we cover it. Falls back to city/region from a neighbouring covered outcode when the exact one isn't in our dataset yet, same logic the listing and watchlist forms use."
        >
          <CodeBlock>{`curl https://realvian.co.uk/api/v1/lookup?postcode=M20+2RN`}</CodeBlock>
        </Endpoint>

        <Endpoint
          method="GET"
          path="/api/v1/status"
          description="API health and honest data-coverage numbers — how many of our areas currently have live liveability dimensions versus live geography only versus fully illustrative data. Useful for monitoring, and for knowing how much of the dataset to trust today."
        >
          <CodeBlock>{`curl https://realvian.co.uk/api/v1/status`}</CodeBlock>
        </Endpoint>

        <h2
          className="text-[22px] text-[var(--text-primary)] mb-4 mt-10"
          style={{ fontFamily: "var(--font-display)", fontWeight: 500, letterSpacing: "-0.02em" }}
        >
          The <code style={{ fontFamily: "var(--font-mono)" }}>dataStatus</code> field
        </h2>
        <p className="text-[14.5px] leading-relaxed text-[var(--text-secondary)] mb-4">
          Realvian is upfront on the site about which figures are drawn
          from live public data sources and which are still illustrative
          while we build out full coverage — this field carries that same
          honesty into the API rather than presenting every number with
          equal confidence.
        </p>
        <ul className="space-y-2 mb-8">
          {[
            ["dimensions-live", "The six liveability dimensions are computed from live public data sources."],
            ["geography-live", "Location (postcode, coordinates) is real; liveability scores are still illustrative."],
            ["illustrative", "Both location and scores are illustrative pending live data coverage."],
          ].map(([status, desc]) => (
            <li key={status} className="flex gap-3 text-[13.5px] text-[var(--text-secondary)]">
              <code
                className="shrink-0 text-[12px] px-2 py-0.5 rounded-[var(--radius-sm)] bg-[var(--bg-subtle)] border border-[var(--border)]"
                style={{ fontFamily: "var(--font-mono)" }}
              >
                {status}
              </code>
              <span>{desc}</span>
            </li>
          ))}
        </ul>

        <h2
          className="text-[22px] text-[var(--text-primary)] mb-4 mt-10"
          style={{ fontFamily: "var(--font-display)", fontWeight: 500, letterSpacing: "-0.02em" }}
        >
          Authentication &amp; rate limits
        </h2>
        <p className="text-[14.5px] leading-relaxed text-[var(--text-secondary)] mb-4">
          Every response carries <code style={{ fontFamily: "var(--font-mono)" }}>X-RateLimit-Limit</code>,{" "}
          <code style={{ fontFamily: "var(--font-mono)" }}>X-RateLimit-Remaining</code>, and{" "}
          <code style={{ fontFamily: "var(--font-mono)" }}>X-RateLimit-Reset</code> headers — check
          these to self-throttle before hitting a 429. An exceeded limit
          returns <code style={{ fontFamily: "var(--font-mono)" }}>429</code> with a{" "}
          <code style={{ fontFamily: "var(--font-mono)" }}>Retry-After</code> header telling you how
          many seconds to wait.
        </p>
        <CodeBlock>{`curl -H "Authorization: Bearer rv_your_key_here" \\
  https://realvian.co.uk/api/v1/areas`}</CodeBlock>

        <h2
          className="text-[22px] text-[var(--text-primary)] mb-4 mt-10"
          style={{ fontFamily: "var(--font-display)", fontWeight: 500, letterSpacing: "-0.02em" }}
        >
          Pagination
        </h2>
        <p className="text-[14.5px] leading-relaxed text-[var(--text-secondary)] mb-4">
          <code style={{ fontFamily: "var(--font-mono)" }}>/api/v1/areas</code> and{" "}
          <code style={{ fontFamily: "var(--font-mono)" }}>/api/v1/reports</code> accept{" "}
          <code style={{ fontFamily: "var(--font-mono)" }}>limit</code> (default 50, max 100) and{" "}
          <code style={{ fontFamily: "var(--font-mono)" }}>offset</code> query params. Every paginated
          response includes a <code style={{ fontFamily: "var(--font-mono)" }}>meta.hasMore</code>{" "}
          boolean — page until it's false rather than guessing from the total.
        </p>
        <CodeBlock>{`curl https://realvian.co.uk/api/v1/areas?limit=10&offset=10`}</CodeBlock>

        <h2
          className="text-[22px] text-[var(--text-primary)] mb-4 mt-10"
          style={{ fontFamily: "var(--font-display)", fontWeight: 500, letterSpacing: "-0.02em" }}
        >
          Usage
        </h2>
        <ul className="space-y-2.5 text-[14px] text-[var(--text-secondary)] leading-relaxed">
          <li>· CORS is open — call these endpoints directly from a browser on any domain.</li>
          <li>· Responses are cached for 60 seconds; don't poll faster than that.</li>
          <li>· Attribution isn't required, but a link back to realvian.co.uk is appreciated.</li>
          <li>· This is informational data, not financial advice — see our <a href="/legal/ai" style={{ color: "var(--primary)" }}>AI disclosure</a> for how scores are generated.</li>
        </ul>
      </section>
    </>
  );
}
