import { NextResponse } from "next/server";
import { getAllAreas, isLiveData, hasLiveGeography, liveDataGeneratedAt } from "@/lib/areas";
import { API_CORS_HEADERS } from "@/lib/api-shapes";

/**
 * A status endpoint earns its place when there's something real to
 * report beyond "yes I'm up" — here that's genuine data-coverage
 * transparency, the same honesty the dataStatus field on every area
 * already carries, just summarised for anyone building against this
 * API who wants to know how much of it is real right now.
 *
 * Deliberately NOT rate-limited, unlike every other v1 route — a
 * monitoring system polling this every 30 seconds is exactly the
 * intended use, and blocking that would defeat the endpoint's purpose.
 */
export async function GET() {
  const areas = getAllAreas();

  let dimensionsLive = 0;
  let geographyLive = 0;
  let illustrative = 0;

  for (const area of areas) {
    if (isLiveData(area.outcode)) dimensionsLive++;
    else if (hasLiveGeography(area.outcode)) geographyLive++;
    else illustrative++;
  }

  return NextResponse.json(
    {
      data: {
        status: "ok",
        apiVersion: "v1",
        areasCovered: areas.length,
        dataCoverage: {
          dimensionsLive,
          geographyLive,
          illustrative,
        },
        liveDataGeneratedAt: liveDataGeneratedAt(),
        checkedAt: new Date().toISOString(),
      },
    },
    {
      headers: {
        ...API_CORS_HEADERS,
        // Deliberately short-lived cache — this is a status check,
        // callers polling it want a fresh answer, not a stale one.
        "Cache-Control": "public, max-age=30",
      },
    },
  );
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: API_CORS_HEADERS });
}
