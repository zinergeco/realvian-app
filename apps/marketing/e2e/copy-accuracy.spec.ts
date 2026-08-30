import { test, expect } from "@playwright/test";

test.describe("About page accuracy", () => {
  test("does not claim the live landlord/investor/agent portals are still being built", async ({ page }) => {
    // Found stale: this paragraph said three fully-built, live portals
    // and the entire calculator suite were "still being built," months
    // after they shipped. Only the genuinely unbuilt developer portal
    // should be described that way.
    await page.goto("/about");
    const body = await page.locator("body").innerText();
    expect(body).not.toContain(
      "Dedicated workspaces for landlords, investors, agents and developers",
    );
    expect(body).toContain("live today");
    expect(body).toContain("developer workspace is still being built");
  });
});

test.describe("Pricing page accuracy", () => {
  test("does not cite the now-live portfolio tools as a reason pricing isn't published yet", async ({ page }) => {
    await page.goto("/pricing");
    const body = await page.locator("body").innerText();
    expect(body).not.toContain("off-market data and portfolio tools");
  });
});
