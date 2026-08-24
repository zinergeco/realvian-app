import { NextResponse } from "next/server";
import { getAreaBySlug } from "@/lib/areas";
import { toAreaDetail, API_CORS_HEADERS } from "@/lib/api-shapes";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const slugA = searchParams.get("a");
  const slugB = searchParams.get("b");

  if (!slugA || !slugB) {
    return NextResponse.json(
      { error: "missing_params", message: "Provide both ?a= and ?b= area slugs." },
      { status: 400, headers: API_CORS_HEADERS },
    );
  }

  const areaA = getAreaBySlug(slugA);
  const areaB = getAreaBySlug(slugB);

  if (!areaA || !areaB) {
    const missing = [!areaA && slugA, !areaB && slugB].filter(Boolean);
    return NextResponse.json(
      { error: "not_found", message: `No area found for slug(s): ${missing.join(", ")}.` },
      { status: 404, headers: API_CORS_HEADERS },
    );
  }

  return NextResponse.json(
    { data: { a: toAreaDetail(areaA), b: toAreaDetail(areaB) } },
    {
      headers: {
        ...API_CORS_HEADERS,
        "Cache-Control": "public, max-age=60, stale-while-revalidate=300",
      },
    },
  );
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: API_CORS_HEADERS });
}
