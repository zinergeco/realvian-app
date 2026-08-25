import { test, expect } from "@playwright/test";

test.describe("Public API (real HTTP requests)", () => {
  test("GET /api/v1/areas returns real, correctly-shaped data with rate limit headers", async ({ request }) => {
    const res = await request.get("/api/v1/areas?city=Manchester");
    expect(res.status()).toBe(200);
    expect(res.headers()["x-ratelimit-limit"]).toBe("30");

    const body = await res.json();
    expect(Array.isArray(body.data)).toBe(true);
    expect(body.data.length).toBeGreaterThan(0);
    for (const area of body.data) {
      expect(area.city).toBe("Manchester");
    }
  });

  test("GET /api/v1/areas/{slug} returns full detail for a real area", async ({ request }) => {
    const res = await request.get("/api/v1/areas/didsbury-m20");
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.data.district).toBe("Didsbury");
    expect(Array.isArray(body.data.dimensions)).toBe(true);
  });

  test("GET /api/v1/areas/{slug} returns 404 for a bad slug, not a crash", async ({ request }) => {
    const res = await request.get("/api/v1/areas/not-a-real-place");
    expect(res.status()).toBe(404);
    const body = await res.json();
    expect(body.error).toBe("not_found");
  });

  test("GET /api/v1/compare requires both slugs and 400s when one is missing", async ({ request }) => {
    const res = await request.get("/api/v1/compare?a=didsbury-m20");
    expect(res.status()).toBe(400);
  });

  test("GET /api/v1/areas/batch reports partial success for a mix of good and bad slugs", async ({ request }) => {
    const res = await request.get("/api/v1/areas/batch?slugs=didsbury-m20,not-real-xyz");
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.meta.found).toBe(1);
    expect(body.meta.notFound).toContain("not-real-xyz");
  });

  test("GET /api/v1/lookup resolves a real postcode to its area", async ({ request }) => {
    const res = await request.get("/api/v1/lookup?postcode=M20+2RN");
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.data.covered).toBe(true);
    expect(body.data.area.district).toBe("Didsbury");
  });

  test("GET /api/v1/status is not rate-limited and reports real coverage numbers", async ({ request }) => {
    const res = await request.get("/api/v1/status");
    expect(res.status()).toBe(200);
    expect(res.headers()["x-ratelimit-limit"]).toBeUndefined();
    const body = await res.json();
    expect(body.data.areasCovered).toBeGreaterThan(0);
  });

  test("GET /api/v1/openapi.json returns a spec whose paths match the real routes", async ({ request }) => {
    const res = await request.get("/api/v1/openapi.json");
    expect(res.status()).toBe(200);
    const spec = await res.json();
    expect(spec.paths["/api/v1/status"]).toBeDefined();
    expect(spec.openapi).toMatch(/^3\.0/);
  });

  test("GET /api/v1/areas?format=csv returns a real CSV, not JSON", async ({ request }) => {
    const res = await request.get("/api/v1/areas?format=csv");
    expect(res.status()).toBe(200);
    expect(res.headers()["content-type"]).toContain("text/csv");
    const text = await res.text();
    expect(text.split("\r\n")[0]).toContain("slug,district,city");
  });
});
