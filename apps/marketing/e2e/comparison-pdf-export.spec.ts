import { test, expect } from "@playwright/test";

test.describe("Comparison PDF export", () => {
  test("clicking Download PDF triggers a real download with the correct combined filename", async ({ page }) => {
    await page.goto("/compare?a=didsbury-m20&b=chorlton-m21");

    const [download] = await Promise.all([
      page.waitForEvent("download", { timeout: 10000 }),
      page.getByRole("button", { name: "Download PDF" }).click(),
    ]);

    expect(download.suggestedFilename()).toBe("realvian-didsbury-m20-vs-chorlton-m21.pdf");
  });

  test("the downloaded comparison PDF is a real, non-trivial file", async ({ page }, testInfo) => {
    await page.goto("/compare?a=didsbury-m20&b=chorlton-m21");

    const [download] = await Promise.all([
      page.waitForEvent("download", { timeout: 10000 }),
      page.getByRole("button", { name: "Download PDF" }).click(),
    ]);

    const path = testInfo.outputPath("comparison-report.pdf");
    await download.saveAs(path);

    const fs = await import("fs");
    const stats = fs.statSync(path);
    expect(stats.size).toBeGreaterThan(3000);

    const buffer = fs.readFileSync(path);
    expect(buffer.subarray(0, 4).toString()).toBe("%PDF");
  });

  test("a different area pair produces its own correctly-named file, not a hardcoded one", async ({ page }) => {
    await page.goto("/compare?a=ancoats-m4&b=levenshulme-m19");

    const [download] = await Promise.all([
      page.waitForEvent("download", { timeout: 10000 }),
      page.getByRole("button", { name: "Download PDF" }).click(),
    ]);

    expect(download.suggestedFilename()).toBe("realvian-ancoats-m4-vs-levenshulme-m19.pdf");
  });
});
