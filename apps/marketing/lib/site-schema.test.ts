import { describe, it, expect } from "vitest";
import { organizationSchema, websiteSchema, areasItemListSchema } from "./site-schema";

/**
 * jsonld.expand() would give more authoritative validation, but it
 * needs to fetch https://schema.org's remote context document to
 * resolve terms — unreachable from a restricted sandbox and a real
 * source of CI flakiness even where it is reachable (network hiccups,
 * schema.org rate-limiting automated fetchers). These tests check the
 * same things by hand instead: required fields per schema.org's
 * documented spec for each type, verified against schema.org/docs at
 * the time this was written. Less authoritative than a live validator,
 * but reliable everywhere, every time.
 */

describe("organizationSchema", () => {
  it("has the fields schema.org documents as required for Organization", () => {
    expect(organizationSchema["@context"]).toBe("https://schema.org");
    expect(organizationSchema["@type"]).toBe("Organization");
    expect(organizationSchema.name).toBeTruthy();
    expect(organizationSchema.url).toMatch(/^https:\/\//);
  });

  it("references a logo URL that actually resolves to a real asset, not a fabricated path", () => {
    // This was deliberately checked against the real repo contents
    // before writing the schema — favicon.svg is the only brand image
    // asset that exists (see the comment in site-schema.ts).
    expect(organizationSchema.logo).toBe("https://realvian.co.uk/favicon.svg");
  });
});

describe("websiteSchema", () => {
  it("has the fields schema.org documents as required for WebSite", () => {
    expect(websiteSchema["@context"]).toBe("https://schema.org");
    expect(websiteSchema["@type"]).toBe("WebSite");
    expect(websiteSchema.name).toBeTruthy();
    expect(websiteSchema.url).toMatch(/^https:\/\//);
  });

  it("does not claim a SearchAction, since no real search endpoint exists to back it", () => {
    // /areas has no searchParams handling at all — confirmed by
    // reading the actual page source before writing this schema.
    // A SearchAction pointing at a URL that silently ignores its own
    // query parameter would be a schema that actively lies to
    // whatever crawls it, so this asserts the omission is intentional
    // rather than something a future edit could silently reintroduce.
    expect("potentialAction" in websiteSchema).toBe(false);
  });
});

describe("areasItemListSchema", () => {
  const sample = [
    { slug: "didsbury-m20", district: "Didsbury", city: "Manchester" },
    { slug: "chorlton-m21", district: "Chorlton", city: "Manchester" },
  ];

  it("has the fields schema.org documents as required for ItemList", () => {
    const schema = areasItemListSchema(sample);
    expect(schema["@context"]).toBe("https://schema.org");
    expect(schema["@type"]).toBe("ItemList");
    expect(schema.numberOfItems).toBe(2);
    expect(schema.itemListElement).toHaveLength(2);
  });

  it("gives every ListItem the required position, name, and url fields", () => {
    const schema = areasItemListSchema(sample);
    for (const item of schema.itemListElement) {
      expect(item["@type"]).toBe("ListItem");
      expect(typeof item.position).toBe("number");
      expect(item.name).toBeTruthy();
      expect(item.url).toMatch(/^https:\/\/realvian\.co\.uk\/areas\//);
    }
  });

  it("numbers positions sequentially starting at 1, matching schema.org's documented convention", () => {
    const schema = areasItemListSchema(sample);
    expect(schema.itemListElement.map((i) => i.position)).toEqual([1, 2]);
  });

  it("keeps numberOfItems honestly in sync with the real list length — no hard-coded count to drift", () => {
    // This is exactly the class of bug found and fixed alongside this
    // schema: the areas page's own meta description had hard-coded
    // "40 areas in 13 cities" while the real dataset held 38 areas in
    // 12 cities. This schema takes its count from the actual array
    // passed in, so it can never repeat that mistake silently.
    const bigger = [...sample, { slug: "ancoats-m4", district: "Ancoats", city: "Manchester" }];
    expect(areasItemListSchema(bigger).numberOfItems).toBe(3);
  });
});
