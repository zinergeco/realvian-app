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

test.describe("Blog post OpenGraph share images", () => {
  test("a ranking post's og:image is its own route, showing the real leading area's data", async ({ page, request }) => {
    await page.goto("/blog/highest-rental-yield-areas-uk");
    const ogImage = await page.locator('meta[property="og:image"]').getAttribute("content");
    expect(ogImage).toContain("/blog/highest-rental-yield-areas-uk/opengraph-image");

    const res = await request.get(new URL(ogImage!).pathname);
    expect(res.status()).toBe(200);
    expect(res.headers()["content-type"]).toBe("image/png");
    const body = await res.body();
    expect(body.length).toBeGreaterThan(10_000);
  });

  test("a comparison post's og:image is its own route, showing both real areas head-to-head", async ({ page, request }) => {
    await page.goto("/blog/didsbury-vs-chorlton");
    const ogImage = await page.locator('meta[property="og:image"]').getAttribute("content");
    expect(ogImage).toContain("/blog/didsbury-vs-chorlton/opengraph-image");

    const res = await request.get(new URL(ogImage!).pathname);
    expect(res.status()).toBe(200);
    const body = await res.body();
    expect(body.length).toBeGreaterThan(10_000);
  });

  test("a city-report post's og:image route returns a real, substantial image", async ({ request }) => {
    const res = await request.get("/blog/manchester-property-market-report/opengraph-image");
    expect(res.status()).toBe(200);
    expect(res.headers()["content-type"]).toBe("image/png");
    const body = await res.body();
    expect(body.length).toBeGreaterThan(10_000);
  });

  test("an invalid blog slug's og:image route degrades gracefully to a real fallback image, not an error", async ({ request }) => {
    const res = await request.get("/blog/not-a-real-post-xyz/opengraph-image");
    expect(res.status()).toBe(200);
    expect(res.headers()["content-type"]).toBe("image/png");
  });
});
