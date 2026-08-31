import { test, expect } from "@playwright/test";

/**
 * Every interaction waits on a real, observable condition rather than
 * a fixed delay or an assumption about timing. The real, genuine race
 * this uncovered: SiteSearch defers focusing its input via
 * requestAnimationFrame (see components/site-search.tsx) so the
 * modal's mount animation isn't janky, but page.keyboard.type()
 * sends keystrokes to whatever's focused *right now* — typing
 * immediately after the Cmd+K keypress could race ahead of that
 * deferred focus and land on the wrong element (or nothing).
 * Explicitly waiting for and clicking the input first, or filling it
 * directly, avoids depending on that timing at all.
 */
test.describe("Site search (Cmd+K)", () => {
  async function openAndSearch(page: import("@playwright/test").Page, query: string) {
    await page.keyboard.press("Meta+k");
    const input = page.getByPlaceholder("Search areas and reports…");
    await expect(input).toBeVisible();
    await input.fill(query);
  }

  test("Cmd+K opens the search modal from anywhere, and Escape closes it", async ({ page }) => {
    await page.goto("/");
    await page.keyboard.press("Meta+k");
    const dialog = page.getByRole("dialog", { name: "Search" });
    await expect(dialog).toBeVisible();

    await page.keyboard.press("Escape");
    await expect(dialog).not.toBeVisible();
  });

  test("typing a real area name shows it as a result with the correct subtitle", async ({ page }) => {
    await page.goto("/");
    await openAndSearch(page, "didsbury");

    const resultButton = page.locator('button:has-text("Didsbury")').first();
    await expect(resultButton).toBeVisible();
    await expect(resultButton).toContainText("Manchester");
  });

  test("clicking a result navigates to the real, correct page", async ({ page }) => {
    await page.goto("/");
    await openAndSearch(page, "didsbury");

    const resultButton = page.locator('button:has-text("Didsbury")').first();
    await expect(resultButton).toBeVisible();
    await resultButton.click();
    await expect(page).toHaveURL(/\/areas\/didsbury-m20/);
  });

  test("full keyboard-only navigation works — arrow keys move selection, Enter navigates", async ({ page }) => {
    await page.goto("/");
    await openAndSearch(page, "manchester");

    await expect(page.locator("button", { hasText: "Manchester" }).first()).toBeVisible();

    await page.keyboard.press("ArrowDown");
    await page.keyboard.press("ArrowDown");
    await page.keyboard.press("Enter");

    // Not asserting a specific destination — just that keyboard-only
    // navigation genuinely triggers a real page navigation, since
    // which result lands at index 2 could shift as content changes.
    await expect(page).not.toHaveURL("http://localhost:3100/");
  });

  test("an empty query shows a prompt, not every item or a blank list", async ({ page }) => {
    await page.goto("/");
    await page.keyboard.press("Meta+k");
    await expect(page.getByText("Type a place name or report topic")).toBeVisible();
  });

  test("a query matching nothing real shows a clear no-results message", async ({ page }) => {
    await page.goto("/");
    await openAndSearch(page, "zzzznonexistentplace");
    await expect(page.getByText("No matches")).toBeVisible();
  });
});
