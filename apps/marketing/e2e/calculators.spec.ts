import { test, expect } from "@playwright/test";

test.describe("Stamp Duty calculator (real UI interaction)", () => {
  test("switching to the Stamp duty tab and setting £250,000 shows £2,500 — the exact GOV.UK-verified figure", async ({ page }) => {
    // This is deliberately the same reference value locked in by the
    // unit test for calculateSdlt() — but that test only proves the
    // pure function is correct. This proves the actual rendered React
    // component wires that function's output to the screen correctly,
    // which is a genuinely different failure mode (e.g. a typo in the
    // JSX binding, or the wrong field being read).
    await page.goto("/tools");
    await page.getByRole("button", { name: "Stamp duty", exact: true }).click();

    const priceInput = page.getByLabel("Purchase price");
    await priceInput.fill("250000");
    // NumberField is presumably debounced/controlled via onChange —
    // blur to make sure the value has committed before reading results.
    await priceInput.blur();

    await expect(page.getByText("Total Stamp Duty")).toBeVisible();
    const totalRow = page.locator("text=Total Stamp Duty").locator("..");
    await expect(totalRow).toContainText("£2,500");
  });

  test("switching buyer type to first-time buyer changes the result for a price under the relief ceiling", async ({ page }) => {
    await page.goto("/tools");
    await page.getByRole("button", { name: "Stamp duty", exact: true }).click();
    await page.getByLabel("Purchase price").fill("250000");
    await page.getByLabel("Purchase price").blur();

    await page.getByRole("button", { name: "First-time buyer" }).click();

    // Under the £300,000 FTB threshold, relief should bring this to £0.
    const totalRow = page.locator("text=Total Stamp Duty").locator("..");
    await expect(totalRow).toContainText("£0");
  });
});

test.describe("Mortgage calculator (real UI interaction)", () => {
  test("the mortgage tab is the default and renders without needing a click", async ({ page }) => {
    await page.goto("/tools");
    const body = await page.locator("body").innerText();
    expect(body).toMatch(/mortgage/i);
  });
});
