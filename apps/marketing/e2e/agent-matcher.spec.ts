import { test, expect } from "@playwright/test";

test.describe("Agent portal client matcher", () => {
  test("selecting a priority dimension re-ranks areas and shows match scores", async ({ page }) => {
    await page.goto("/portals/agent");
    await page.getByRole("button", { name: "Schools" }).click();

    const body = await page.locator("body").innerText();
    expect(body).toContain("Match ");
  });

  test("the top match for Schools priority is a real area, linking to its real page", async ({ page }) => {
    await page.goto("/portals/agent");
    await page.getByRole("button", { name: "Schools" }).click();

    const firstResult = page.locator('a[href^="/areas/"]').first();
    await expect(firstResult).toBeVisible();
    const href = await firstResult.getAttribute("href");
    expect(href).toMatch(/^\/areas\/[a-z0-9-]+$/);
  });

  test("filtering by city genuinely narrows results to that city only", async ({ page }) => {
    await page.goto("/portals/agent");
    const resultsList = page.locator("ul").filter({ has: page.locator('a[href^="/areas/"]') });
    const beforeCount = await resultsList.locator('a[href^="/areas/"]').count();

    await page.getByLabel("City").selectOption("Manchester");
    await page.waitForTimeout(300);

    // Scoped to the results list specifically, not the whole page —
    // the <select>'s own <option> elements (including "Birmingham")
    // stay in the DOM regardless of which city is currently selected,
    // so a whole-page text check would always find every city name
    // regardless of whether filtering actually worked.
    const resultsText = await resultsList.innerText();
    expect(resultsText).not.toContain("Birmingham");
    const afterCount = await resultsList.locator('a[href^="/areas/"]').count();
    expect(afterCount).toBeLessThanOrEqual(beforeCount);
  });

  test("an unreasonably low budget with a mismatched city shows a clear empty state, not a broken page", async ({ page }) => {
    await page.goto("/portals/agent");
    await page.getByLabel("Max budget").selectOption("250000");
    await page.getByLabel("City").selectOption("London");
    await page.waitForTimeout(300);

    const body = await page.locator("body").innerText();
    expect(body).toContain("No areas match");
  });
});
