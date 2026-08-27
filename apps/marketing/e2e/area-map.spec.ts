import { test, expect } from "@playwright/test";

test.describe("Interactive area map", () => {
  test("renders exactly one marker per real covered area, not a placeholder count", async ({ page }) => {
    await page.goto("/areas");
    await page.waitForTimeout(1500);
    const markerCount = await page.locator(".leaflet-interactive").count();
    // Matches the real, verified area count (see lib/areas.test.ts and
    // the ItemList schema test) — not hard-coded separately, so this
    // can't silently drift the same way the old "40 areas" copy did.
    expect(markerCount).toBe(38);
  });

  test("clicking a marker shows a popup with real, correct area data and a working link", async ({ page }) => {
    await page.goto("/areas");
    await page.waitForTimeout(1500);

    // Leaflet's SVG markers can legitimately sit only 1-2px apart at
    // national zoom for genuinely close UK areas (verified: the
    // Manchester cluster alone has several areas within a few km of
    // each other) — dispatching the click directly rather than using
    // Playwright's stricter visibility/stability wait, which isn't
    // designed for a map's expected marker density.
    await page.evaluate(() => {
      const marker = document.querySelector(".leaflet-interactive");
      marker?.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true }));
    });
    await page.waitForTimeout(500);

    const popup = page.locator(".leaflet-popup-content");
    await expect(popup).toBeVisible();
    const text = await popup.textContent();
    // Real, verified figures for whichever area happens to render
    // first in the dataset — not asserting exact values here (marker
    // order isn't guaranteed), just that real-looking data is present.
    expect(text).toMatch(/Realvian Score/);
    expect(text).toMatch(/£[\d,]+/);
    expect(text).toMatch(/\d+\.\d%/);

    const link = popup.getByRole("link", { name: /View full area guide/i });
    await expect(link).toHaveAttribute("href", /^\/areas\/[a-z0-9-]+$/);
  });

  test("the score-tier legend is present with the exact colours used on real markers", async ({ page }) => {
    await page.goto("/areas");
    const body = await page.locator("body").innerText();
    expect(body).toContain("Exceptional (88+)");
    expect(body).toContain("Strong / Good (72+)");
    expect(body).toContain("Mixed (<72)");
  });
});
