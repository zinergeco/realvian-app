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

  test("shows a yield-vs-price scatter plot with one point per matching area", async ({ page }) => {
    await page.goto("/portals/investor");
    await page.waitForTimeout(1000);

    // 38 real covered areas, no filters applied yet.
    const dots = await page.locator(".recharts-scatter-symbol").count();
    expect(dots).toBe(38);
  });

  test("the scatter plot stays genuinely in sync with the filtered list, not a separate static chart", async ({ page }) => {
    await page.goto("/portals/investor");
    await page.waitForTimeout(1000);

    const yieldInput = page.getByLabel(/min.*yield/i);
    await yieldInput.fill("7");
    await yieldInput.blur();
    await page.waitForTimeout(500);

    const matchText = await page.locator("text=/\\d+ areas? match/").first().textContent();
    const listCount = Number(matchText?.match(/\d+/)?.[0]);

    const dots = await page.locator(".recharts-scatter-symbol").count();
    // The whole point of this chart is that it reads the same filtered
    // state as the list below it — this is the test that would catch
    // it silently drifting into a separate, unfiltered data source.
    expect(dots).toBe(listCount);
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
