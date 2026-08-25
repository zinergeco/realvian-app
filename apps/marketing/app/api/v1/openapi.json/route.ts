import { NextResponse } from "next/server";
import { openApiSpec } from "@/lib/openapi-spec";
import { API_CORS_HEADERS } from "@/lib/api-shapes";

// Deliberately not rate-limited, same reasoning as /api/v1/status —
// tools like Swagger UI or Postman fetch a spec automatically and
// sometimes repeatedly; throttling spec discovery serves no purpose.
export async function GET() {
  return NextResponse.json(openApiSpec, {
    headers: {
      ...API_CORS_HEADERS,
      "Cache-Control": "public, max-age=3600, stale-while-revalidate=86400",
    },
  });
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: API_CORS_HEADERS });
}
