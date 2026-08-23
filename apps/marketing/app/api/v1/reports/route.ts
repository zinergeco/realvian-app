import { NextResponse } from "next/server";
import { getAllPosts } from "@/lib/blog";
import { toPostSummary, API_CORS_HEADERS } from "@/lib/api-shapes";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const areaSlug = searchParams.get("area");
  const kind = searchParams.get("kind");

  let posts = getAllPosts();

  if (areaSlug) {
    posts = posts.filter((p) => p.areaSlugs.includes(areaSlug));
  }
  if (kind) {
    posts = posts.filter((p) => p.kind === kind);
  }

  const data = [...posts]
    .sort((a, b) => new Date(b.dataDate).getTime() - new Date(a.dataDate).getTime())
    .map(toPostSummary);

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
        "Cache-Control": "public, max-age=60, stale-while-revalidate=300",
      },
    },
  );
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: API_CORS_HEADERS });
}
