import { test, expect } from "@playwright/test";

test.describe("Compare tool", () => {
  test("loading two real areas via URL params shows both districts side by side", async ({ page }) => {
    await page.goto("/compare?a=didsbury-m20&b=chorlton-m21");
    const body = await page.locator("body").innerText();
    expect(body).toContain("Didsbury");
    expect(body).toContain("Chorlton");
  });

  test("comparing an area against itself doesn't crash, even if it's a strange case", async ({ page }) => {
    const response = await page.goto("/compare?a=didsbury-m20&b=didsbury-m20");
    expect(response?.status()).toBeLessThan(500);
  });

  test("the tool page loads without URL params, for browsing/picking areas", async ({ page }) => {
    const response = await page.goto("/compare");
    expect(response?.status()).toBe(200);
  });

  test("comparing two real areas renders a radar chart with both areas' real shapes overlaid", async ({ page }) => {
    await page.goto("/compare?a=didsbury-m20&b=chorlton-m21");
    await page.waitForTimeout(1000);

    // Two distinct polygon shapes — one per area, not a single merged
    // or missing shape.
    const polygons = await page.locator(".recharts-radar-polygon").count();
    expect(polygons).toBe(2);

    // Real dimension labels on the chart's axes, not placeholder text.
    const axisLabels = await page.locator(".recharts-polar-angle-axis-tick").allTextContents();
    expect(axisLabels).toContain("Schools");
    expect(axisLabels).toContain("Safety");
    expect(axisLabels.length).toBe(6);

    // Both real district names appear in the legend.
    const legendText = await page.locator(".recharts-legend-wrapper").textContent();
    expect(legendText).toContain("Didsbury");
    expect(legendText).toContain("Chorlton");
  });
});
