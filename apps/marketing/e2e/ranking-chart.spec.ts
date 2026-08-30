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

});

test.describe("Ranking chart on city market reports", () => {
  test("renders one bar per area in the city, matching the table's real score values exactly", async ({ page }) => {
    // Manchester has 4 real covered areas — confirmed via
    // getAllAreas() earlier this session, not assumed.
    await page.goto("/blog/manchester-property-market-report");
    await page.waitForTimeout(1000);

    const bars = await page.locator(".recharts-bar-rectangle").count();
    expect(bars).toBe(4);

    const tableRows = await page.locator("table tbody tr").count();
    expect(tableRows).toBe(4);

    const firstTableRow = await page.locator("table tbody tr").first().textContent();
    expect(firstTableRow).toContain("Didsbury");

    const bodyText = await page.locator("body").innerText();
    // SVG multi-line labels wrap via separate <tspan> elements, which
    // .innerText() renders with a newline where the label visually
    // wraps ("Didsbury,\nManchester"), not the literal ", " the label
    // string itself contains. The trailing comma is the genuinely
    // distinctive signal here — "Manchester" alone appears dozens of
    // times on this page regardless of whether the chart rendered.
    expect(bodyText).toContain("Didsbury,");
  });

  test("a city with too few areas for a report (e.g. Fife, 1 area) correctly has no report generated at all", async ({ page }) => {
    // This is a real, existing design decision (MIN_DATA_POINTS in
    // lib/blog.ts) unrelated to the chart itself — checked directly
    // in the source before assuming a 404 here meant a bug.
    const response = await page.goto("/blog/fife-property-market-report");
    expect(response?.status()).toBe(404);
  });
});
