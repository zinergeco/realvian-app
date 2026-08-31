import { test, expect } from "@playwright/test";

/**
 * Uses page.goto() + DOM assertions throughout, deliberately not
 * request.get() for checking the error UI's content. Confirmed while
 * building this: for a genuine server-render error, Next.js sends a
 * minimal initial HTML shell (id="__next_error__") and the actual
 * error.tsx boundary content renders via client-side hydration, not
 * in that initial response. A raw HTTP request would only ever see
 * the empty shell — real browser navigation is required to see what
 * a real visitor actually sees.
 */
test.describe("Custom error boundary", () => {
  test("a genuine thrown error returns a 500 status with the custom error page, not a bare stack trace", async ({ page }) => {
    const response = await page.goto("/dev-test-error-trigger");
    expect(response?.status()).toBe(500);

    const body = await page.locator("body").innerText();
    expect(body).toContain("That page hit a problem");
  });

  test("the full site header and footer still render around the error, not a bare error stub", async ({ page }) => {
    await page.goto("/dev-test-error-trigger");
    await expect(page.getByRole("link", { name: "Areas", exact: true }).first()).toBeVisible();
    await expect(page.getByRole("link", { name: /AI disclosure/i })).toBeVisible();
  });

  test("the debug trigger route is marked noindex, so it can never get crawled or indexed", async ({ request }) => {
    const res = await request.get("/dev-test-error-trigger");
    const html = await res.text();
    // Specifically the content this route's own metadata export
    // produces (index: false, follow: false) — the error shell also
    // carries a separate, Next.js-internal robots tag, so matching
    // the exact "noindex, nofollow" pairing confirms this route's own
    // explicit metadata, not that unrelated one.
    expect(html).toContain('name="robots" content="noindex, nofollow"');
  });

  test("the fallback navigation buttons on the error page point to real, working pages", async ({ page }) => {
    await page.goto("/dev-test-error-trigger");
    const main = page.getByRole("main");
    await expect(main.getByRole("link", { name: "Back to homepage" })).toHaveAttribute("href", "/");
    await expect(main.getByRole("link", { name: "Report this" })).toHaveAttribute("href", "/contact");
  });
});
