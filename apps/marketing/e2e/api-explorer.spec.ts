import { test, expect } from "@playwright/test";

/**
 * Written when this page had a single explorer instance (/lookup).
 * A later batch generalized ApiExplorer to a reusable component and
 * added two more instances (/areas, /compare) on the same page,
 * which broke this file's unclick-scoped `getByRole('button', ...)`
 * calls — "strict mode violation: resolved to 3 elements". Fixed by
 * targeting the lookup explorer specifically (nth(2), its real DOM
 * position — confirmed directly against the page source, not
 * assumed), since these tests are semantically about postcode
 * lookups specifically, not about whichever explorer happens to be
 * first on the page.
 */
test.describe("Interactive API explorer", () => {
  test("running a request against a real postcode returns the real API response", async ({ page }) => {
    await page.goto("/developers");
    await page.getByRole("button", { name: "Run request" }).nth(2).click();

    const responsePanel = page.locator("pre[tabindex='0']").nth(0);
    await expect(responsePanel).toContainText("Didsbury", { timeout: 5000 });
    await expect(responsePanel).toContainText("Manchester");

    const body = await page.locator("body").innerText();
    expect(body).toContain("200");
  });

  test("a different postcode returns different, genuinely live data - not a cached or hardcoded response", async ({ page }) => {
    await page.goto("/developers");
    const input = page.getByLabel("Postcode to look up");
    await input.fill("EH1 1AA");
    await page.getByRole("button", { name: "Run request" }).nth(2).click();

    const responsePanel = page.locator("pre[tabindex='0']").nth(0);
    await expect(responsePanel).toContainText(/edinburgh/i, { timeout: 5000 });
  });

  test("an uncovered postcode is handled gracefully, not as a broken request", async ({ page }) => {
    await page.goto("/developers");
    const input = page.getByLabel("Postcode to look up");
    await input.fill("ZZ99 9ZZ");
    await page.getByRole("button", { name: "Run request" }).nth(2).click();

    const responsePanel = page.locator("pre[tabindex='0']").nth(0);
    await expect(responsePanel).toContainText("false", { timeout: 5000 });

    const body = await page.locator("body").innerText();
    expect(body).toContain("200");
  });

  test("the response panel is keyboard-focusable, so keyboard-only users can scroll a long response", async ({ page }) => {
    await page.goto("/developers");
    await page.getByRole("button", { name: "Run request" }).nth(2).click();

    const responsePanel = page.locator("pre[tabindex='0']").nth(0);
    await expect(responsePanel).toBeVisible({ timeout: 5000 });
  });
});
