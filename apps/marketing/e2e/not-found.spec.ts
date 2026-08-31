import { test, expect } from "@playwright/test";

test.describe("Custom 404 page", () => {
  test("a genuinely bad URL returns a real 404 status with the custom page, not Next.js's generic default", async ({ page }) => {
    const response = await page.goto("/this-page-genuinely-does-not-exist");
    expect(response?.status()).toBe(404);

    const body = await page.locator("body").innerText();
    expect(body).toContain("That page doesn");
    expect(body).not.toContain("This page could not be found");
  });

  test("the full site header and footer still render on the 404 page, not a bare error stub", async ({ page }) => {
    await page.goto("/this-page-genuinely-does-not-exist");
    await expect(page.getByRole("link", { name: "Areas", exact: true }).first()).toBeVisible();
    await expect(page.getByRole("link", { name: /AI disclosure/i })).toBeVisible();
  });

  test("the inline search box on the 404 page finds a real area and links to its real page", async ({ page }) => {
    await page.goto("/this-page-genuinely-does-not-exist");
    const input = page.getByPlaceholder("Search areas and reports…");
    await expect(input).toBeVisible();
    await input.fill("didsbury");

    const resultLink = page.getByRole("link", { name: /Didsbury/ }).first();
    await expect(resultLink).toBeVisible();
    await expect(resultLink).toHaveAttribute("href", "/areas/didsbury-m20");
  });

  test("clicking the inline search result on the 404 page navigates to the real area page", async ({ page }) => {
    await page.goto("/this-page-genuinely-does-not-exist");
    await page.getByPlaceholder("Search areas and reports…").fill("didsbury");

    const resultLink = page.getByRole("link", { name: /Didsbury/ }).first();
    await expect(resultLink).toBeVisible();
    await resultLink.click();
    await expect(page).toHaveURL(/\/areas\/didsbury-m20/);
  });

  test("the fallback navigation buttons point to real, working pages", async ({ page }) => {
    await page.goto("/this-page-genuinely-does-not-exist");
    // Scoped to <main> specifically — "Market reports" also
    // genuinely appears in the footer's own nav on every page, which
    // would otherwise make this selector ambiguous.
    const main = page.getByRole("main");
    await expect(main.getByRole("link", { name: "Back to homepage" })).toHaveAttribute("href", "/");
    await expect(main.getByRole("link", { name: "Browse areas" })).toHaveAttribute("href", "/areas");
    await expect(main.getByRole("link", { name: "Market reports" })).toHaveAttribute("href", "/blog");
  });
});
