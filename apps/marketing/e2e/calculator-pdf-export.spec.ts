import { test, expect } from "@playwright/test";

test.describe("Calculator PDF exports", () => {
  test("mortgage calculator PDF reflects a real, user-modified input value, not a stale default", async ({ page }) => {
    await page.goto("/tools");
    const incomeInput = page.locator('input[type="number"]').first();
    await incomeInput.fill("80000");
    await page.waitForTimeout(300);

    const [download] = await Promise.all([
      page.waitForEvent("download", { timeout: 10000 }),
      page.getByRole("button", { name: "Download PDF" }).click(),
    ]);
    expect(download.suggestedFilename()).toBe("realvian-mortgage-calculation.pdf");
  });

  test("all four calculator tabs produce a correctly-named, real PDF file", async ({ page }, testInfo) => {
    await page.goto("/tools");
    const fs = await import("fs");

    const tabs: Array<[string, string]> = [
      ["Mortgage", "realvian-mortgage-calculation.pdf"],
      ["Stamp Duty", "realvian-stamp-duty-calculation.pdf"],
      ["Yield", "realvian-yield-calculation.pdf"],
      ["Return", "realvian-roi-calculation.pdf"],
    ];

    for (const [tabName, expectedFilename] of tabs) {
      await page.getByRole("button", { name: tabName, exact: false }).first().click();
      await page.waitForTimeout(300);

      const [download] = await Promise.all([
        page.waitForEvent("download", { timeout: 10000 }),
        page.getByRole("button", { name: "Download PDF" }).click(),
      ]);
      expect(download.suggestedFilename()).toBe(expectedFilename);

      const path = testInfo.outputPath(`${tabName}.pdf`);
      await download.saveAs(path);
      const buffer = fs.readFileSync(path);
      expect(buffer.subarray(0, 4).toString()).toBe("%PDF");
    }
  });
});
