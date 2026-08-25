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
});
