import { test, expect } from "@playwright/test";

test.describe("OpenGraph share images", () => {
  test("the homepage's meta tags reference a real, working og:image", async ({ page, request }) => {
    await page.goto("/");
    const ogImage = await page.locator('meta[property="og:image"]').getAttribute("content");
    expect(ogImage).toBeTruthy();

    // The meta tag existing isn't enough — confirm the URL it points
    // to actually resolves to a real image, not a 404.
    const imgRes = await request.get(new URL(ogImage!).pathname + new URL(ogImage!).search);
    expect(imgRes.status()).toBe(200);
    expect(imgRes.headers()["content-type"]).toBe("image/png");
  });

  test("a real area page's og:image is its own area-specific route, not the generic site-wide fallback", async ({ page }) => {
    await page.goto("/areas/didsbury-m20");
    const ogImage = await page.locator('meta[property="og:image"]').getAttribute("content");
    expect(ogImage).toContain("/areas/didsbury-m20/opengraph-image");
  });

  test("the area-specific og:image route returns a real, substantial PNG, not an empty or broken response", async ({ request }) => {
    const res = await request.get("/areas/didsbury-m20/opengraph-image");
    expect(res.status()).toBe(200);
    expect(res.headers()["content-type"]).toBe("image/png");
    const body = await res.body();
    // A blank/broken image would be tiny; a real rendered og:image with
    // text and a score ring is tens of kilobytes.
    expect(body.length).toBeGreaterThan(10_000);
  });

  test("an invalid area slug's og:image route degrades gracefully to a real fallback image, not an error", async ({ request }) => {
    const res = await request.get("/areas/this-does-not-exist-xyz/opengraph-image");
    expect(res.status()).toBe(200);
    expect(res.headers()["content-type"]).toBe("image/png");
  });
});
