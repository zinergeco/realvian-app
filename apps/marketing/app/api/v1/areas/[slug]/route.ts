import { NextResponse } from "next/server";
import { getAreaBySlug } from "@/lib/areas";
import { toAreaDetail, enforceRateLimit, API_CORS_HEADERS } from "@/lib/api-shapes";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const limitCheck = await enforceRateLimit(request);
  if (!limitCheck.ok) return limitCheck.response;

  const { slug } = await params;
  const area = getAreaBySlug(slug);

  if (!area) {
    return NextResponse.json(
      { error: "not_found", message: `No area found for slug "${slug}".` },
      { status: 404, headers: limitCheck.headers },
    );
  }

  return NextResponse.json(
    { data: toAreaDetail(area) },
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
