import { test, expect } from "@playwright/test";

test.describe("Area PDF export", () => {
  test("clicking Download PDF report genuinely triggers a real PDF download with the correct filename", async ({ page }) => {
    await page.goto("/areas/didsbury-m20");

    const [download] = await Promise.all([
      page.waitForEvent("download", { timeout: 10000 }),
      page.getByRole("button", { name: "Download PDF report" }).click(),
    ]);

    expect(download.suggestedFilename()).toBe("realvian-didsbury-m20.pdf");
  });

  test("the downloaded PDF is a real, non-trivial file, not an empty or broken one", async ({ page }, testInfo) => {
    await page.goto("/areas/didsbury-m20");

    const [download] = await Promise.all([
      page.waitForEvent("download", { timeout: 10000 }),
      page.getByRole("button", { name: "Download PDF report" }).click(),
    ]);

    const path = testInfo.outputPath("downloaded-report.pdf");
    await download.saveAs(path);

    const fs = await import("fs");
    const stats = fs.statSync(path);
    expect(stats.size).toBeGreaterThan(3000);

    const buffer = fs.readFileSync(path);
    expect(buffer.subarray(0, 4).toString()).toBe("%PDF");
  });

  test("the PDF export button is present on a different real area too, not hardcoded to one", async ({ page }) => {
    await page.goto("/areas/chorlton-m21");
    const [download] = await Promise.all([
      page.waitForEvent("download", { timeout: 10000 }),
      page.getByRole("button", { name: "Download PDF report" }).click(),
    ]);
    expect(download.suggestedFilename()).toBe("realvian-chorlton-m21.pdf");
  });
});
