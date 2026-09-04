import { test, expect } from "@playwright/test";

/**
 * Regression test for a real bug: ScoreRing's label ("Score") has a
 * minimum legible font size (Math.max(8, size*0.085)) that doesn't
 * account for how much room a small ring actually has to fit it in —
 * at size=40 (the account page's old value) and size=44 (the
 * investor portal's real, current value), the label silently clipped
 * to "Cor" with both ends cut off. Fixed by hiding the label entirely
 * below size=60, where it can no longer fit without clipping — a
 * clean small ring with just the number, not a broken one.
 *
 * Tests against the investor portal specifically because it's real,
 * shipping production code that already uses a small size (44) —
 * not a temporary debug route, so this stays meaningful over time.
 */
test.describe("ScoreRing small-size label fix", () => {
  test("a small ScoreRing (investor portal, size=44) renders its number without a label element that would clip", async ({ page }) => {
    await page.goto("/portals/investor");
    await page.waitForTimeout(1000);
    // Every ScoreRing on this page uses size=44 (real production
    // code, not a test fixture) — below the fix's 60px threshold, so
    // the label element (identified by its distinctive class) should
    // not exist in the DOM at all, not just be styled differently.
    const labelCount = await page.locator('.tracking-\\[0\\.1em\\].uppercase').count();
    expect(labelCount).toBe(0);
  });

  test("a full-size ScoreRing (area detail page, size=128) still shows its label correctly - the fix didn't remove it where it always fit", async ({ page }) => {
    await page.goto("/areas/didsbury-m20");
    const body = await page.locator("body").innerText();
    expect(body).toContain("SCORE");
  });
});
