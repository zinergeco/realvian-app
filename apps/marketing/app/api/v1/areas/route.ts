import { NextResponse } from "next/server";
import { getAllAreas } from "@/lib/areas";
import { toAreaSummary, areasToCsv, paginate, API_CORS_HEADERS } from "@/lib/api-shapes";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const city = searchParams.get("city");
  const region = searchParams.get("region");
  const format = searchParams.get("format");

  let areas = getAllAreas();

  // Case-insensitive filtering — an external caller shouldn't need to
  // know we store "Manchester" exactly capitalised that way.
  if (city) {
    areas = areas.filter((a) => a.city.toLowerCase() === city.toLowerCase());
  }
  if (region) {
    areas = areas.filter((a) => a.region.toLowerCase() === region.toLowerCase());
  }

  const allData = areas.map(toAreaSummary);

  if (format === "csv") {
    // Deliberately unpaginated — a CSV download implies wanting the
    // full dataset, not a single page of it.
    return new NextResponse(areasToCsv(allData), {
      headers: {
        ...API_CORS_HEADERS,
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": 'attachment; filename="realvian-areas.csv"',
        "Cache-Control": "public, max-age=60, stale-while-revalidate=300",
      },
    });
  }

  const { page, meta } = paginate(allData, searchParams);

  return NextResponse.json(
    {
      data: page,
      meta: {
        // count kept as an alias for total — the original documented
        // shape had only this field; don't silently break an early
        // adopter's `data.meta.count` just because pagination is new.
        count: meta.total,
        ...meta,
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
