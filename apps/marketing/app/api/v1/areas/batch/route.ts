import { NextResponse } from "next/server";
import { getAreaBySlug } from "@/lib/areas";
import { toAreaDetail, API_CORS_HEADERS } from "@/lib/api-shapes";

const MAX_SLUGS = 50;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const raw = searchParams.get("slugs");

  if (!raw) {
    return NextResponse.json(
      { error: "missing_params", message: "Provide ?slugs= as a comma-separated list of area slugs." },
      { status: 400, headers: API_CORS_HEADERS },
    );
  }

  const slugs = raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  if (slugs.length === 0) {
    return NextResponse.json(
      { error: "missing_params", message: "No valid slugs found in ?slugs=." },
      { status: 400, headers: API_CORS_HEADERS },
    );
  }

  if (slugs.length > MAX_SLUGS) {
    return NextResponse.json(
      { error: "too_many_slugs", message: `Request at most ${MAX_SLUGS} slugs per batch. Got ${slugs.length}.` },
      { status: 400, headers: API_CORS_HEADERS },
    );
  }

  // Deliberately partial-success rather than all-or-nothing like
  // /compare — a batch fetch is a convenience for many independent
  // areas, not a pairing where every item has to resolve for the
  // result to mean anything. One bad slug shouldn't fail the other 49.
  const found: ReturnType<typeof toAreaDetail>[] = [];
  const notFound: string[] = [];

  for (const slug of slugs) {
    const area = getAreaBySlug(slug);
    if (area) {
      found.push(toAreaDetail(area));
    } else {
      notFound.push(slug);
    }
  }

  return NextResponse.json(
    {
      data: found,
      meta: {
        requested: slugs.length,
        found: found.length,
        notFound,
        generatedAt: new Date().toISOString(),
      },
    },
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
