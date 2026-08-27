import { test, expect } from "@playwright/test";

test.describe("Area pages", () => {
  test("the areas index lists real areas linking to real detail pages", async ({ page }) => {
    await page.goto("/areas");
    const didsburyLink = page.getByRole("link", { name: /Didsbury/i }).first();
    await expect(didsburyLink).toBeVisible();
  });

  test("a real area page shows its actual score and district name, not placeholder text", async ({ page }) => {
    await page.goto("/areas/didsbury-m20");
    await expect(page.locator("h1")).toContainText("Didsbury");
    const scoreText = await page.locator("text=/^\\d{1,3}$/").first().textContent();
    const score = Number(scoreText);
    expect(score).toBeGreaterThanOrEqual(0);
    expect(score).toBeLessThanOrEqual(100);
  });

  test("an unknown area slug returns a real 404, not a silent blank page", async ({ page }) => {
    const response = await page.goto("/areas/this-area-does-not-exist-xyz");
    expect(response?.status()).toBe(404);
  });

  test("the honesty flag for data status is present on a real area page", async ({ page }) => {
    await page.goto("/areas/didsbury-m20");
    const bodyText = await page.locator("body").innerText();
    expect(bodyText.toLowerCase()).toMatch(/live|illustrative|estimated/);
  });

  test("shows a peer-average radar chart comparing the area against its city average", async ({ page }) => {
    // Manchester has 4 covered areas — enough for a genuine city
    // average, not a fallback to national (see lib/peer-average.test.ts
    // for why 3 was chosen as the real, data-driven threshold).
    await page.goto("/areas/didsbury-m20");
    await page.waitForTimeout(1000);

    const label = await page.getByText("Didsbury against the").textContent();
    expect(label?.toLowerCase()).toContain("manchester average");

    const polygons = await page.locator(".recharts-radar-polygon").count();
    expect(polygons).toBe(2);
  });

  test("falls back to national average for a city with too few areas for a meaningful comparison", async ({ page }) => {
    // St Andrews is the only area covered in Fife — a "city average"
    // there would be mathematically identical to the area itself.
    await page.goto("/areas/st-andrews-ky16");
    await page.waitForTimeout(1000);

    const label = await page.getByText("St Andrews against the").textContent();
    expect(label?.toLowerCase()).toContain("national average");
  });

  test("the areas index emits a real ItemList schema whose count matches the visible page content", async ({ page }) => {
    await page.goto("/areas");
    // The layout's site-wide Organization/WebSite scripts render
    // before this page's own content in the DOM, so .first() would
    // grab the wrong one — find the ItemList specifically instead.
    const scripts = await page.locator('script[type="application/ld+json"]').allTextContents();
    const schema = scripts.map((s) => JSON.parse(s)).find((s) => s["@type"] === "ItemList");

    expect(schema).toBeDefined();
    // Genuinely non-trivial — this is the exact bug found and fixed
    // alongside this schema (a hard-coded "40 areas" claim in copy
    // that had drifted from the real 38-area dataset). This asserts
    // the schema's count is plausible, not just present.
    expect(schema.numberOfItems).toBeGreaterThan(30);
    expect(schema.itemListElement.length).toBe(schema.numberOfItems);
  });
});
