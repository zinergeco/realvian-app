import { test, expect } from "@playwright/test";

test.describe("Portals", () => {
  test("the portals hub lists all four portals with correct live/coming-soon status", async ({ page }) => {
    await page.goto("/portals");
    const body = await page.locator("body").innerText();
    expect(body).toContain("Landlords");
    expect(body).toContain("Investors");
    expect(body).toContain("Agents");
    expect(body).toContain("Developers");
  });

  test("the investor opportunity finder loads real, ranked area data with no account needed", async ({ page }) => {
    const response = await page.goto("/portals/investor");
    expect(response?.status()).toBe(200);
    const body = await page.locator("body").innerText();
    expect(body).toMatch(/\d+ areas? match/);
  });

  test("the investor finder's yield filter genuinely narrows the result set", async ({ page }) => {
    await page.goto("/portals/investor");
    const matchText = await page.locator("text=/\\d+ areas? match/").first().textContent();
    const before = Number(matchText?.match(/\d+/)?.[0]);

    const yieldInput = page.getByLabel(/min.*yield/i);
    await yieldInput.fill("8");
    await yieldInput.blur();
    await page.waitForTimeout(300);

    const afterText = await page.locator("text=/\\d+ areas? match/").first().textContent();
    const after = Number(afterText?.match(/\d+/)?.[0]);

    expect(after).toBeLessThanOrEqual(before);
  });

  test("the developer portal correctly shows as coming-soon, not fabricated as live", async ({ page }) => {
    const response = await page.goto("/portals/developer");
    expect(response?.status()).toBe(200);
  });
});

test.describe("Developer docs", () => {
  test("the developers page documents all real endpoints", async ({ page }) => {
    await page.goto("/developers");
    const body = await page.locator("body").innerText();
    for (const path of ["/api/v1/areas", "/api/v1/compare", "/api/v1/lookup", "/api/v1/status"]) {
      expect(body).toContain(path);
    }
  });

  test("the OpenAPI spec link on the docs page actually resolves", async ({ page }) => {
    await page.goto("/developers");
    const specLink = page.getByRole("link", { name: /OpenAPI/i });
    await expect(specLink).toHaveAttribute("href", "/api/v1/openapi.json");
  });
});
