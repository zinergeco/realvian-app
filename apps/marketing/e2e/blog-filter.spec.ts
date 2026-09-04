import { test, expect } from "@playwright/test";

test.describe("Blog city filter", () => {
  test("filtering by Manchester genuinely narrows results, excluding other cities' content", async ({ page }) => {
    await page.goto("/blog");
    await page.getByRole("button", { name: "Manchester" }).click();

    const body = await page.locator("body").innerText();
    expect(body).toContain("Manchester");
    expect(body).not.toContain("Birmingham Property Market Report");
  });

  test("a ranking post appears under a city filter even though it carries no city tag", async ({ page }) => {
    // The real reason this filter resolves through areaSlugs instead
    // of post.tags — ranking posts have generic topic tags only, no
    // city, despite referencing areas across many cities.
    await page.goto("/blog");
    await page.getByRole("button", { name: "Leeds" }).click();
    const body = await page.locator("body").innerText();
    expect(body).toContain("Highest Rental Yield");
  });

  test("clicking All cities restores the full, unfiltered list", async ({ page }) => {
    await page.goto("/blog");
    const allLinksBefore = await page.locator('a[href^="/blog/"]').count();

    await page.getByRole("button", { name: "Manchester" }).click();
    const filteredCount = await page.locator('a[href^="/blog/"]').count();
    expect(filteredCount).toBeLessThan(allLinksBefore);

    await page.getByRole("button", { name: "All cities" }).click();
    const restoredCount = await page.locator('a[href^="/blog/"]').count();
    expect(restoredCount).toBe(allLinksBefore);
  });
});
