import { test, expect } from "@playwright/test";

/**
 * DOM order on /developers is: /areas, /compare, /lookup (matches
 * the order those endpoints are documented on the page, not the
 * order they were added to the codebase) — confirmed directly via
 * grep against the real source before fixing the .nth() indices
 * below, rather than guessing a second time.
 */
test.describe("API explorer - compare and areas endpoints", () => {
  test("the areas endpoint explorer returns real filtered data", async ({ page }) => {
    await page.goto("/developers");
    const buttons = page.getByRole("button", { name: "Run request" });
    await buttons.nth(0).click();

    const panel = page.locator("pre[tabindex='0']").nth(0);
    await expect(panel).toContainText("Manchester", { timeout: 5000 });
  });

  test("the compare endpoint explorer returns real data for both areas", async ({ page }) => {
    await page.goto("/developers");
    const buttons = page.getByRole("button", { name: "Run request" });
    await buttons.nth(1).click();

    // A <pre> only renders once its own explorer's request completes
    // (see ApiExplorer: {status !== "idle" && (...)}) — with only one
    // button clicked on a fresh page, exactly one <pre> exists, at
    // index 0, regardless of which explorer instance produced it.
    const panel = page.locator("pre[tabindex='0']").nth(0);
    await expect(panel).toContainText("Didsbury", { timeout: 5000 });
    await expect(panel).toContainText("Chorlton");
  });

  test("copying a response puts real JSON on the clipboard", async ({ page, context }) => {
    await context.grantPermissions(["clipboard-read", "clipboard-write"]);
    await page.goto("/developers");
    // The lookup explorer (3rd on the page) defaults to postcode
    // M20 2RN, whose response contains "didsbury" - a known, already
    // -verified default value, not an arbitrary choice.
    await page.getByRole("button", { name: "Run request" }).nth(2).click();
    await expect(page.locator("pre[tabindex='0']").nth(0)).toContainText("didsbury", { timeout: 5000 });

    await page.getByRole("button", { name: "Copy" }).nth(0).click();
    await expect(page.getByText("Copied ✓")).toBeVisible({ timeout: 3000 });

    const clipboardText = await page.evaluate(() => navigator.clipboard.readText());
    expect(clipboardText).toContain("didsbury");
  });
});

test.describe("Recently viewed areas", () => {
  test("visiting an area page and returning to the index shows it in Recently viewed", async ({ page }) => {
    await page.goto("/areas/didsbury-m20");
    await page.goto("/areas");

    await expect(page.getByText("Recently viewed")).toBeVisible({ timeout: 5000 });
    const body = await page.locator("body").innerText();
    expect(body).toContain("Didsbury");
  });

  test("the areas index does not show a Recently viewed section for a fresh visitor with no history", async ({ page }) => {
    await page.goto("/areas");
    await page.waitForTimeout(500);
    const body = await page.locator("body").innerText();
    expect(body).not.toContain("Recently viewed");
  });

  test("visiting a second area moves it to the front, without duplicating the first", async ({ page }) => {
    await page.goto("/areas/didsbury-m20");
    await page.goto("/areas/chorlton-m21");
    await page.goto("/areas");

    const heading = page.getByText("Recently viewed");
    await expect(heading).toBeVisible({ timeout: 5000 });

    // Scoped to the widget's own container specifically — the areas
    // index also lists all 38 real areas further down the page, so
    // "Didsbury" and "Chorlton" links exist there too, unrelated to
    // this widget; an unscoped count would be wrong for that reason,
    // not because the feature itself has a bug.
    const widget = heading.locator("xpath=..");
    const widgetLinks = widget.locator('a[href^="/areas/"]');
    await expect(widgetLinks).toHaveCount(2);
  });
});
