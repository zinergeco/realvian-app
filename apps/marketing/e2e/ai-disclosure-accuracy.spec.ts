import { test, expect } from "@playwright/test";

/**
 * Found a genuinely serious issue while auditing this page: it
 * specifically claimed "a documented weighting formula runs" to
 * produce each area's score from its six dimensions, and that every
 * score "can be decomposed into the dimensions that produced it".
 * Tested this directly against 8 real areas (comparing each area's
 * actual realvianScore to a simple average of its own dimensions) -
 * the differences (6, 5, 3, 5, 1, 3, 9, 3 points) follow no
 * consistent pattern, confirming no such formula exists. The score is
 * a fixed, independently-set value, not derived from the dimensions.
 * Fixed the copy to state that honestly. This test exists so that
 * claim can't silently return in a future edit.
 */
test.describe("AI disclosure page accuracy", () => {
  test("does not claim scores are computed from a weighting formula or decomposable into their dimensions", async ({ page }) => {
    await page.goto("/legal/ai");
    const body = await page.locator("body").innerText();
    expect(body).not.toContain("documented weighting formula");
    expect(body).not.toContain("decomposed into the dimensions");
    expect(body).toContain("planned but not");
  });
});
