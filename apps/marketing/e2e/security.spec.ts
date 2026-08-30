import { test, expect } from "@playwright/test";

test.describe("Security headers", () => {
  test("the homepage response carries a correctly-scoped CSP header", async ({ request }) => {
    const res = await request.get("/");
    const csp = res.headers()["content-security-policy"];
    expect(csp).toBeTruthy();
    expect(csp).toContain("default-src 'self'");
    expect(csp).toContain("frame-ancestors 'self'");
    // script-src should use a nonce, not a blanket 'unsafe-inline' —
    // that's the entire point of this header existing at all.
    expect(csp).toMatch(/script-src 'self' 'nonce-[a-f0-9-]+' 'strict-dynamic'/);
    expect(csp).not.toContain("script-src 'unsafe-inline'");
  });

  test("the CSP allows the current map tile domain, not a stale one that no longer serves usable tiles", async ({ request }) => {
    // CARTO's free raster tile service began requiring an API key
    // after this was first built — confirmed live in production
    // (a visible "API KEY REQUIRED" watermark), not a theoretical
    // regression. Switched to standard OpenStreetMap tiles; this
    // locks in that the CSP's img-src was updated to match, since a
    // correct tile URL blocked by a stale CSP would be an equally
    // broken map with a different, more confusing failure mode.
    const res = await request.get("/");
    const csp = res.headers()["content-security-policy"] ?? "";
    expect(csp).toContain("tile.openstreetmap.org");
    expect(csp).not.toContain("basemaps.cartocdn.com");
  });

  test("the CSP nonce in the header exactly matches the nonce on the real rendered script tag", async ({ request }) => {
    // Genuinely the thing that matters — a nonce that doesn't match
    // means either the theme script silently fails to run (breaking
    // dark mode) or the CSP silently does nothing (defeating the
    // point). Deliberately checks the raw HTML source via a direct
    // request rather than the live DOM: browsers intentionally hide a
    // script tag's nonce attribute value when read back via
    // getAttribute() after the page loads (returns ""), specifically
    // so an injected/malicious script can't read the page's own
    // legitimate nonce and reuse it — that's correct, deliberate
    // browser behaviour, not something to route around by weakening
    // this test, so this checks the source text instead.
    const res = await request.get("/");
    const csp = res.headers()["content-security-policy"] ?? "";
    const headerNonce = csp.match(/nonce-([a-f0-9-]+)/)?.[1];
    expect(headerNonce).toBeTruthy();

    const html = await res.text();
    const scriptNonce = html.match(/<script nonce="([a-f0-9-]+)"/)?.[1];
    expect(scriptNonce).toBe(headerNonce);
  });

  test("the theme-init inline script actually executes under the CSP, not silently blocked", async ({ page }) => {
    await page.goto("/");
    // Set unconditionally by the script regardless of light/dark, so
    // an empty value means the script didn't run — unlike checking
    // for a "dark" class, which is only added for dark theme and
    // would be an empty (and misleadingly "failing") string on light.
    const colorScheme = await page.evaluate(() => document.documentElement.style.colorScheme);
    expect(["light", "dark"]).toContain(colorScheme);
  });

  test("JSON-LD structured data still parses correctly under the CSP without needing a nonce", async ({ page }) => {
    // script-src governs executable scripts; type="application/ld+json"
    // is inert data, not code, so it doesn't need — and doesn't get —
    // a nonce. This is the assertion that validates that architectural
    // assumption rather than just trusting it.
    await page.goto("/areas/didsbury-m20");
    const parsed = await page.evaluate(() => {
      const scripts = [...document.querySelectorAll('script[type="application/ld+json"]')];
      return scripts.map((s) => {
        try {
          return { ok: true, data: JSON.parse(s.textContent ?? "") };
        } catch {
          return { ok: false };
        }
      });
    });
    expect(parsed.length).toBeGreaterThan(0);
    for (const result of parsed) {
      expect(result.ok).toBe(true);
    }
  });

  test("other core security headers remain present alongside the new CSP", async ({ request }) => {
    const res = await request.get("/");
    const headers = res.headers();
    expect(headers["x-content-type-options"]).toBe("nosniff");
    expect(headers["x-frame-options"]).toBe("SAMEORIGIN");
    expect(headers["strict-transport-security"]).toContain("max-age=");
  });
});
