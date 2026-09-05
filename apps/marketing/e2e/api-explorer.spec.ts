import { test, expect } from "@playwright/test";

/**
 * Every check here waits on a real, observable condition (specific
 * response text appearing) rather than a fixed delay — the first
 * version of this file clicked "Run request" and immediately checked
 * body text with zero wait for the async fetch() to resolve, which
 * fails close to 100% of the time since the network round-trip
 * hasn't completed yet. Using expect(locator).toContainText(),
 * which auto-retries, is the fix, not a workaround.
 */
test.describe("Interactive API explorer", () => {
  test("running a request against a real postcode returns the real API response", async ({ page }) => {
    await page.goto("/developers");
    await page.getByRole("button", { name: "Run request" }).click();

    const responsePanel = page.locator("pre[tabindex='0']");
    await expect(responsePanel).toContainText("Didsbury", { timeout: 5000 });
    await expect(responsePanel).toContainText("Manchester");

    const body = await page.locator("body").innerText();
    expect(body).toContain("200");
  });

  test("a different postcode returns different, genuinely live data - not a cached or hardcoded response", async ({ page }) => {
    await page.goto("/developers");
    const input = page.getByLabel("Postcode to look up");
    await input.fill("EH1 1AA");
    await page.getByRole("button", { name: "Run request" }).click();

    const responsePanel = page.locator("pre[tabindex='0']");
    await expect(responsePanel).toContainText(/edinburgh/i, { timeout: 5000 });
  });

  test("an uncovered postcode is handled gracefully, not as a broken request", async ({ page }) => {
    await page.goto("/developers");
    const input = page.getByLabel("Postcode to look up");
    await input.fill("ZZ99 9ZZ");
    await page.getByRole("button", { name: "Run request" }).click();

    const responsePanel = page.locator("pre[tabindex='0']");
    await expect(responsePanel).toContainText("false", { timeout: 5000 });

    const body = await page.locator("body").innerText();
    expect(body).toContain("200");
  });

  test("the response panel is keyboard-focusable, so keyboard-only users can scroll a long response", async ({ page }) => {
    await page.goto("/developers");
    await page.getByRole("button", { name: "Run request" }).click();

    const responsePanel = page.locator("pre[tabindex='0']");
    await expect(responsePanel).toBeVisible({ timeout: 5000 });
  });
});
