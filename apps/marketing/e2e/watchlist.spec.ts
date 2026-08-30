import { test, expect } from "@playwright/test";

/**
 * The watchlist page requires a signed-in session with real database
 * data to show the actual Kanban board — not something this
 * environment can drive end-to-end (no DATABASE_URL here). What's
 * genuinely verified here is the redirect behaviour for an
 * unauthenticated visit; the grouping logic itself (groupByStatus)
 * has its own real unit tests in lib/watchlist-constants.test.ts,
 * exercised with synthetic data covering exactly the properties that
 * matter for a Kanban board — every status present even when empty,
 * no items dropped or duplicated, order preserved within a column.
 */
test.describe("Property watchlist", () => {
  test("redirects an unauthenticated visitor to sign in, rather than erroring or showing an empty board", async ({ page }) => {
    const response = await page.goto("/account/properties");
    // Next.js redirects resolve to the final page's response, so this
    // checks where we actually land, not the redirect status itself.
    expect(page.url()).toContain("/auth/login");
    expect(response?.status()).toBeLessThan(400);
  });
});
