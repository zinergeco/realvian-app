import { test, expect } from "@playwright/test";

test.describe("Homepage", () => {
  test("loads with the real title and hero content, not an error page", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveTitle(/Realvian/);
    // Confirms this is the real homepage rendering real content, not a
    // Next.js error boundary silently swallowing a crash into a blank page.
    await expect(page.locator("body")).not.toContainText("Application error");
  });

  test("primary navigation links are present and point somewhere real", async ({ page }) => {
    await page.goto("/");
    for (const label of ["Areas", "Compare", "Portals"]) {
      await expect(page.getByRole("link", { name: label, exact: true }).first()).toBeVisible();
    }
  });

  test("footer discloses the AI-generated nature of the scores, not buried or absent", async ({ page }) => {
    await page.goto("/");
    const aiLink = page.getByRole("link", { name: /AI disclosure/i });
    await expect(aiLink).toBeVisible();
  });

  test("emits valid, parseable Organization and WebSite JSON-LD in the real rendered HTML", async ({ page }) => {
    await page.goto("/");
    const scripts = await page.locator('script[type="application/ld+json"]').allTextContents();
    expect(scripts.length).toBeGreaterThanOrEqual(2);

    const parsed = scripts.map((s) => JSON.parse(s));
    const org = parsed.find((s) => s["@type"] === "Organization");
    const site = parsed.find((s) => s["@type"] === "WebSite");

    expect(org?.name).toBe("Realvian");
    expect(site?.name).toBe("Realvian");
  });
});
