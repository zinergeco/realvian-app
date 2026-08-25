import { NextResponse } from "next/server";
import { getAreaByOutcode, getAllAreas } from "@/lib/areas";
import { toOutcode, resolveGeography } from "@/lib/monetisation";
import { toAreaDetail, enforceRateLimit, API_CORS_HEADERS } from "@/lib/api-shapes";

export async function GET(request: Request) {
  const limitCheck = await enforceRateLimit(request);
  if (!limitCheck.ok) return limitCheck.response;

  const { searchParams } = new URL(request.url);
  const postcode = searchParams.get("postcode");

  if (!postcode) {
    return NextResponse.json(
      { error: "missing_params", message: "Provide ?postcode= (full postcode or outcode)." },
      { status: 400, headers: limitCheck.headers },
    );
  }

  const outcode = toOutcode(postcode);
  if (!outcode) {
    return NextResponse.json(
      { error: "invalid_postcode", message: `"${postcode}" doesn't look like a valid UK postcode or outcode.` },
      { status: 400, headers: limitCheck.headers },
    );
  }

  // Exact match: Realvian covers this specific outcode, full area data
  // available. No match: still resolve city/region where we can via
  // the same prefix-fallback logic the listing/watchlist forms use —
  // "M22" isn't itself covered but sits in the same city as "M20".
  const exactArea = getAreaByOutcode(outcode);
  const geo = exactArea ? null : resolveGeography(postcode, getAllAreas());

  return NextResponse.json(
    {
      data: {
        postcode: postcode.toUpperCase(),
        outcode,
        covered: Boolean(exactArea),
        area: exactArea ? toAreaDetail(exactArea) : null,
        city: exactArea?.city ?? geo?.city ?? null,
        region: exactArea?.region ?? geo?.region ?? null,
      },
    },
    {
      headers: {
        ...limitCheck.headers,
        "Cache-Control": "public, max-age=60, stale-while-revalidate=300",
      },
    },
  );
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: API_CORS_HEADERS });
}
