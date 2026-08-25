import { describe, it, expect } from "vitest";
import { checkRateLimit, rateLimitHeaders } from "./rate-limit";

// The limiter's bucket map is module-level state, so each test uses a
// unique identifier to avoid interfering with the others — the same
// isolation a real production instance gets naturally from different
// callers having different IPs/keys.
let counter = 0;
function freshId(): string {
  counter += 1;
  return `test-${counter}-${Date.now()}`;
}

describe("checkRateLimit", () => {
  it("allows the first request and reports the correct remaining count", () => {
    const id = freshId();
    const result = checkRateLimit(id, false);
    expect(result.allowed).toBe(true);
    expect(result.limit).toBe(30);
    expect(result.remaining).toBe(29);
  });

  it("grants a higher limit when hasApiKey is true", () => {
    const id = freshId();
    const result = checkRateLimit(id, true);
    expect(result.limit).toBe(120);
    expect(result.remaining).toBe(119);
  });

  it("allows exactly 30 anonymous requests then rejects the 31st", () => {
    // Manually verified live against production earlier this session
    // with the exact same threshold — this test exists so that
    // verification doesn't have to be repeated by hand every time.
    const id = freshId();
    let lastResult;
    for (let i = 0; i < 30; i++) {
      lastResult = checkRateLimit(id, false);
      expect(lastResult.allowed).toBe(true);
    }
    const thirtyFirst = checkRateLimit(id, false);
    expect(thirtyFirst.allowed).toBe(false);
    expect(thirtyFirst.remaining).toBe(0);
  });

  it("allows exactly 120 requests with an API key then rejects the 121st", () => {
    const id = freshId();
    for (let i = 0; i < 120; i++) {
      expect(checkRateLimit(id, true).allowed).toBe(true);
    }
    expect(checkRateLimit(id, true).allowed).toBe(false);
  });

  it("tracks separate identifiers independently — one caller's usage never affects another's", () => {
    const idA = freshId();
    const idB = freshId();
    for (let i = 0; i < 30; i++) checkRateLimit(idA, false);
    // idA is now exhausted; idB should be completely unaffected.
    const resultB = checkRateLimit(idB, false);
    expect(resultB.allowed).toBe(true);
    expect(resultB.remaining).toBe(29);
  });
});

describe("rateLimitHeaders", () => {
  it("formats the result as the exact header names clients are documented to check", () => {
    const headers = rateLimitHeaders({ allowed: true, limit: 30, remaining: 12, resetAt: 1_700_000_000_000 });
    expect(headers).toEqual({
      "X-RateLimit-Limit": "30",
      "X-RateLimit-Remaining": "12",
      "X-RateLimit-Reset": "1700000000",
    });
  });
});
