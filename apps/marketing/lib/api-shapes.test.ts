import { describe, it, expect } from "vitest";
import { paginate, areasToCsv, type AreaSummaryResponse } from "./api-shapes";

describe("paginate", () => {
  const items = Array.from({ length: 75 }, (_, i) => ({ n: i }));

  it("defaults to 50 items when no limit is given", () => {
    const { page, meta } = paginate(items, new URLSearchParams());
    expect(page).toHaveLength(50);
    expect(meta).toEqual({ limit: 50, offset: 0, total: 75, hasMore: true });
  });

  it("respects an explicit limit within the cap", () => {
    const { page, meta } = paginate(items, new URLSearchParams("limit=10"));
    expect(page).toHaveLength(10);
    expect(meta.hasMore).toBe(true);
  });

  it("caps limit at 100 even if a caller asks for more", () => {
    const { meta } = paginate(items, new URLSearchParams("limit=9999"));
    expect(meta.limit).toBe(100);
  });

  it("moves to genuinely different items when offset is applied", () => {
    const first = paginate(items, new URLSearchParams("limit=10&offset=0")).page;
    const second = paginate(items, new URLSearchParams("limit=10&offset=10")).page;
    expect(first).not.toEqual(second);
    expect(first[0]).toEqual({ n: 0 });
    expect(second[0]).toEqual({ n: 10 });
  });

  it("reports hasMore=false on the final page", () => {
    const { meta } = paginate(items, new URLSearchParams("limit=50&offset=50"));
    expect(meta.hasMore).toBe(false);
    expect(meta.total).toBe(75);
  });

  it("treats a negative or non-numeric limit as the default rather than crashing", () => {
    expect(paginate(items, new URLSearchParams("limit=-5")).meta.limit).toBe(50);
    expect(paginate(items, new URLSearchParams("limit=banana")).meta.limit).toBe(50);
  });

  it("treats a negative offset as zero rather than erroring", () => {
    const { meta } = paginate(items, new URLSearchParams("offset=-10"));
    expect(meta.offset).toBe(0);
  });
});

describe("areasToCsv", () => {
  const sample: AreaSummaryResponse[] = [
    {
      slug: "didsbury-m20",
      district: "Didsbury",
      city: "Manchester",
      region: "North West",
      outcode: "M20",
      realvianScore: 87,
      investmentScore: 79,
      avgPrice: 412_500,
      avgRent: 1450,
      grossYield: 5.2,
      fiveYearGrowth: 18.4,
      dataStatus: "geography-live",
    },
  ];

  it("produces a header row plus one data row per area", () => {
    const csv = areasToCsv(sample);
    const lines = csv.split("\r\n");
    expect(lines).toHaveLength(2);
    expect(lines[0]).toBe(
      "slug,district,city,region,outcode,realvianScore,investmentScore,avgPrice,avgRent,grossYield,fiveYearGrowth,dataStatus",
    );
    expect(lines[1]).toContain("didsbury-m20");
    expect(lines[1]).toContain("Manchester");
  });

  it("quotes and escapes a field containing a comma, so a spreadsheet doesn't misparse it as two columns", () => {
    const withComma: AreaSummaryResponse[] = [
      { ...sample[0]!, district: "Something, With A Comma" },
    ];
    const csv = areasToCsv(withComma);
    expect(csv).toContain('"Something, With A Comma"');
  });

  it("escapes an embedded quote by doubling it, per the CSV spec", () => {
    const withQuote: AreaSummaryResponse[] = [
      { ...sample[0]!, district: 'Say "hello"' },
    ];
    const csv = areasToCsv(withQuote);
    expect(csv).toContain('"Say ""hello"""');
  });

  it("does not quote a field with no special characters, keeping the output compact", () => {
    const csv = areasToCsv(sample);
    expect(csv).toContain(",Didsbury,");
    expect(csv).not.toContain('"Didsbury"');
  });
});
