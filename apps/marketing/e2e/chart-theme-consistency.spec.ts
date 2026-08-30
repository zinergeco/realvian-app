import { test, expect } from "@playwright/test";

/**
 * Every chart and the interactive map used to hard-code light-mode-only
 * hex colours (#0EA672 etc), which meant they stayed visibly the wrong
 * shade of green when the site was in dark mode — confirmed as a real,
 * visible mismatch (a bright dark-mode score ring next to a duller
 * light-mode-only chart line on the same page) before fixing it by
 * switching every chart component to CSS variable references instead.
 * These tests assert the fix holds, in both themes, on real rendered
 * output — not just that the source no longer contains a hex literal.
 */
test.describe("Chart theme consistency", () => {
  test("the area map's markers resolve to the page's real --primary colour in both themes", async ({ page, context }) => {
    for (const theme of ["light", "dark"] as const) {
      await context.addCookies([{ name: "realvian-theme", value: theme, domain: "localhost", path: "/" }]);
      await page.goto("/areas");
      await page.waitForTimeout(2000);

      const pagePrimary = await page.evaluate(() => {
        const hex = getComputedStyle(document.documentElement).getPropertyValue("--primary").trim();
        const el = document.createElement("div");
        el.style.color = hex;
        document.body.appendChild(el);
        const rgb = getComputedStyle(el).color;
        el.remove();
        return rgb;
      });

      const markerFill = await page.locator(".leaflet-interactive").first().evaluate((n) => getComputedStyle(n).fill);
      expect(markerFill, `mismatch in ${theme} mode`).toBe(pagePrimary);
    }
  });

  test("the compare radar chart resolves to the page's real --primary colour in both themes", async ({ page, context }) => {
    for (const theme of ["light", "dark"] as const) {
      await context.addCookies([{ name: "realvian-theme", value: theme, domain: "localhost", path: "/" }]);
      await page.goto("/compare?a=didsbury-m20&b=chorlton-m21");
      await page.waitForTimeout(1500);

      const pagePrimary = await page.evaluate(() => {
        const hex = getComputedStyle(document.documentElement).getPropertyValue("--primary").trim();
        const el = document.createElement("div");
        el.style.color = hex;
        document.body.appendChild(el);
        const rgb = getComputedStyle(el).color;
        el.remove();
        return rgb;
      });

      const radarStroke = await page.locator(".recharts-radar path").first().evaluate((n) => getComputedStyle(n).stroke);
      expect(radarStroke, `mismatch in ${theme} mode`).toBe(pagePrimary);
    }
  });
});
