import { test, expect } from "@playwright/test";

test.describe("Pricing page", () => {
  test("all three tiers render with their real prices and features", async ({ page }) => {
    await page.goto("/pricing");
    const body = await page.locator("body").innerText();

    expect(body).toContain("Beta Access");
    expect(body).toContain("£0");
    expect(body).toContain("Pro");
    expect(body).toContain("£19");
    expect(body).toContain("Agency");
    expect(body).toContain("£79");
  });

  test("the free tier's CTA genuinely links to the real signup page, not a placeholder", async ({ page }) => {
    await page.goto("/pricing");
    const freeCta = page.getByRole("link", { name: "Create free account" });
    await expect(freeCta).toHaveAttribute("href", "/auth/signup");
  });

  test("Pro and Agency CTAs are honest mailto links, not fake payment buttons that can't actually charge anyone", async ({ page }) => {
    await page.goto("/pricing");
    const notifyLinks = page.getByRole("link", { name: "Get notified at launch" });
    await expect(notifyLinks).toHaveCount(2);

    const hrefs = await notifyLinks.evaluateAll((els) => els.map((el) => el.getAttribute("href")));
    for (const href of hrefs) {
      expect(href).toMatch(/^mailto:data@realvian\.co\.uk/);
    }
  });

  test("clearly discloses that Pro and Agency are not live yet, and won't retroactively paywall existing free features", async ({ page }) => {
    await page.goto("/pricing");
    const body = await page.locator("body").innerText();
    expect(body.toUpperCase()).toContain("COMING SOON");
    expect(body).toContain("doesn\u2019t charge you anything");
    expect(body).toContain("nothing you rely on now gets");
  });
});
