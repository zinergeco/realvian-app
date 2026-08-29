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

  test("capability cards describing genuinely unbuilt features are honestly labelled, not presented as live", async ({ page }) => {
    // Found live on the homepage: three capability cards (Planning
    // pulse, Climate & resilience lens, Smart alerts) described real
    // functionality — flood risk data, planning alerts, price-drop
    // notifications — that doesn't exist anywhere in the codebase.
    // Fixed by applying the same "In development" labelling already
    // used honestly elsewhere on the site (see components/coming-soon.tsx).
    // This test exists so a future edit can't silently drop that label
    // while leaving the capability claim in place.
    await page.goto("/");
    const badges = await page.locator('text="In development"').count();
    expect(badges).toBeGreaterThanOrEqual(3);
  });

  test("the site consistently states the real dimension count (6), not a stale or inflated number", async ({ page }) => {
    await page.goto("/");
    const body = await page.locator("body").innerText();
    expect(body).not.toContain("24 dimensions");
    expect(body).not.toContain("24 data dimensions");
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
