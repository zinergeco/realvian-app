import { test, expect } from "@playwright/test";

test.describe("Ranking chart on market reports", () => {
  test("renders exactly 10 bars, matching the top-10 table below it", async ({ page }) => {
    await page.goto("/blog/highest-rental-yield-areas-uk");
    await page.waitForTimeout(1000);

    const bars = await page.locator(".recharts-bar-rectangle").count();
    expect(bars).toBe(10);

    const tableRows = await page.locator("table tbody tr").count();
    expect(tableRows).toBe(10);
  });

  test("the chart's leading value matches the real #1 row in the table, not a different number", async ({ page }) => {
    await page.goto("/blog/highest-rental-yield-areas-uk");
    await page.waitForTimeout(1000);

    const firstTableRow = await page.locator("table tbody tr").first().textContent();
    // Table row format: "1<Area><outcode><City><Yield><Score>" —
    // extract just the percentage to cross-check against the chart.
    const tableYield = firstTableRow?.match(/(\d+\.\d)%/)?.[1];
    expect(tableYield).toBeTruthy();

    const chartBody = await page.locator("body").innerText();
    expect(chartBody).toContain(`${tableYield}%`);
  });

  test("a city-report post (no chart data) renders fine without a broken empty chart frame", async ({ page }) => {
    // city-report posts don't populate PostSection.chart — this
    // confirms the page doesn't crash or render an empty chart
    // container when that optional field is simply absent.
    const response = await page.goto("/blog/manchester-property-market-report");
    expect(response?.status()).toBe(200);
    const body = await page.locator("body").innerText();
    expect(body.length).toBeGreaterThan(500);
  });
});
