import { NextResponse } from "next/server";
import { getAllAreas } from "@/lib/areas";
import { toAreaSummary, API_CORS_HEADERS } from "@/lib/api-shapes";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const city = searchParams.get("city");
  const region = searchParams.get("region");

  let areas = getAllAreas();

  // Case-insensitive filtering — an external caller shouldn't need to
  // know we store "Manchester" exactly capitalised that way.
  if (city) {
    areas = areas.filter((a) => a.city.toLowerCase() === city.toLowerCase());
  }
  if (region) {
    areas = areas.filter((a) => a.region.toLowerCase() === region.toLowerCase());
  }

  const data = areas.map(toAreaSummary);

  return NextResponse.json(
    {
      data,
      meta: {
        count: data.length,
        generatedAt: new Date().toISOString(),
      },
    },
    {
      headers: {
        ...API_CORS_HEADERS,
        // Public, cacheable data — safe to let CDNs/browsers cache
        // briefly rather than hit the server on every request.
        "Cache-Control": "public, max-age=60, stale-while-revalidate=300",
      },
    },
  );
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: API_CORS_HEADERS });
}
