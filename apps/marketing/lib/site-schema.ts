/**
 * Site-wide structured data — Organization and WebSite schema.org
 * markup for the root layout, applying to every page rather than
 * being page-specific like the Place/Dataset schema on area pages or
 * the Article schema on blog posts (both already existed before this).
 *
 * This is what's actually missing for things like Google's brand
 * knowledge panel and the sitelinks search box — per-page schema for
 * individual areas doesn't substitute for a site-level identity.
 *
 * Kept as a plain data export (not inline JSX) specifically so it can
 * be unit-tested the same way the OpenAPI spec is: import the object,
 * assert on it directly, no need to render a page to check it.
 */

const BASE_URL = "https://realvian.co.uk";

export const organizationSchema = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "Realvian",
  url: BASE_URL,
  // favicon.svg is the only brand image asset that actually exists in
  // this repo — deliberately not inventing a path to a dedicated PNG
  // logo that doesn't exist. Google's Organization guidance prefers
  // PNG/JPG, so this is a real, current limitation worth revisiting
  // once a proper logo asset exists, not something to paper over.
  logo: `${BASE_URL}/favicon.svg`,
  description:
    "UK property intelligence platform. Area scores, yield analysis, and market data for landlords, investors, agents and developers, built on fused public data.",
} as const;

export const websiteSchema = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "Realvian",
  url: BASE_URL,
  // Deliberately no potentialAction/SearchAction here — that requires
  // a real search URL that actually reads the query parameter it's
  // given, and /areas doesn't (checked before writing this: it has no
  // searchParams handling at all). Claiming a SearchAction that leads
  // to a page silently ignoring the query would be a schema that
  // actively lies to whatever crawls it. Add this back if/when a real
  // search page exists.
} as const;

/**
 * ItemList schema for the /areas index — genuine curated content (the
 * real, current set of covered areas), not a fabricated summary.
 * Takes the count from the caller rather than hard-coding it, so this
 * can never drift out of sync with the actual dataset the way the
 * page's own meta description text once did (was "40 areas in 13
 * cities" in copy while the real dataset held 38 areas / 12 cities —
 * found and fixed alongside this schema addition).
 */
export function areasItemListSchema(areas: { slug: string; district: string; city: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "UK areas covered by Realvian",
    numberOfItems: areas.length,
    itemListElement: areas.map((area, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: `${area.district}, ${area.city}`,
      url: `${BASE_URL}/areas/${area.slug}`,
    })),
  } as const;
}
