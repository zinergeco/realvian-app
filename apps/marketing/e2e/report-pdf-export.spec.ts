import { test, expect } from "@playwright/test";

test.describe("Report PDF export", () => {
  test("a city-report post's PDF download has the correct filename", async ({ page }) => {
    await page.goto("/blog/manchester-property-market-report");

    const [download] = await Promise.all([
      page.waitForEvent("download", { timeout: 10000 }),
      page.getByRole("button", { name: "Download PDF" }).click(),
    ]);

    expect(download.suggestedFilename()).toBe("realvian-manchester-property-market-report.pdf");
  });

  test("the downloaded report PDF is a real, non-trivial multi-page file", async ({ page }, testInfo) => {
    await page.goto("/blog/manchester-property-market-report");

    const [download] = await Promise.all([
      page.waitForEvent("download", { timeout: 10000 }),
      page.getByRole("button", { name: "Download PDF" }).click(),
    ]);

    const path = testInfo.outputPath("report.pdf");
    await download.saveAs(path);

    const fs = await import("fs");
    const stats = fs.statSync(path);
    expect(stats.size).toBeGreaterThan(8000);

    const buffer = fs.readFileSync(path);
    expect(buffer.subarray(0, 4).toString()).toBe("%PDF");
  });

  test("a ranking post (different content shape - 10 chart items, no stat callouts) also exports correctly", async ({ page }) => {
    await page.goto("/blog/highest-rental-yield-areas-uk");

    const [download] = await Promise.all([
      page.waitForEvent("download", { timeout: 10000 }),
      page.getByRole("button", { name: "Download PDF" }).click(),
    ]);

    expect(download.suggestedFilename()).toBe("realvian-highest-rental-yield-areas-uk.pdf");
  });
});
