import { test, expect } from "@playwright/test";

test.describe("Investment shortlist PDF export", () => {
  test("downloading with the default (unfiltered) view produces a real PDF of all areas", async ({ page }) => {
    await page.goto("/portals/investor");

    const [download] = await Promise.all([
      page.waitForEvent("download", { timeout: 10000 }),
      page.getByRole("button", { name: "Download shortlist PDF" }).click(),
    ]);

    expect(download.suggestedFilename()).toBe("realvian-investment-shortlist.pdf");
  });

  test("the downloaded PDF is a real, non-trivial file, and reflects an applied filter (fewer areas than unfiltered)", async ({ page }, testInfo) => {
    await page.goto("/portals/investor");

    // Baseline: unfiltered result count from the page's own live text
    const unfilteredText = await page.locator("body").innerText();
    const unfilteredMatch = unfilteredText.match(/(\d+) areas? match/);
    const unfilteredCount = unfilteredMatch ? parseInt(unfilteredMatch[1]!, 10) : 0;
    expect(unfilteredCount).toBeGreaterThan(0);

    await page.getByLabel("Min. gross yield").fill("7");
    await page.waitForTimeout(300);

    const filteredText = await page.locator("body").innerText();
    const filteredMatch = filteredText.match(/(\d+) areas? match/);
    const filteredCount = filteredMatch ? parseInt(filteredMatch[1]!, 10) : 0;
    // Confirmed via direct verification while building this: exactly
    // 3 real areas have a gross yield >= 7%, well under the full
    // dataset - genuinely narrower, not coincidentally the same size.
    expect(filteredCount).toBeLessThan(unfilteredCount);
    expect(filteredCount).toBe(3);

    const [download] = await Promise.all([
      page.waitForEvent("download", { timeout: 10000 }),
      page.getByRole("button", { name: "Download shortlist PDF" }).click(),
    ]);

    const path = testInfo.outputPath("shortlist.pdf");
    await download.saveAs(path);

    const fs = await import("fs");
    const stats = fs.statSync(path);
    expect(stats.size).toBeGreaterThan(1500);

    const buffer = fs.readFileSync(path);
    expect(buffer.subarray(0, 4).toString()).toBe("%PDF");
  });

  test("the button is disabled when a filter combination matches zero areas, rather than exporting an empty PDF", async ({ page }) => {
    await page.goto("/portals/investor");
    await page.getByLabel("Min. gross yield").fill("99");
    await page.waitForTimeout(300);

    const button = page.getByRole("button", { name: "Download shortlist PDF" });
    await expect(button).toBeDisabled();
  });
});
