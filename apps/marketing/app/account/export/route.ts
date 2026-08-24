import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/public-auth";
import { listUserComparisons } from "@/lib/comparisons";
import { listFollowedAreas } from "@/lib/followed-areas";
import { listWatchlist } from "@/lib/property-watchlist";

/**
 * GDPR Article 20 (right to data portability). A user can create real
 * data now — saved comparisons, followed areas, a property watchlist —
 * with no way to get it back out except asking us directly. This
 * closes that gap with a straightforward JSON export of exactly what
 * they've stored, nothing more and nothing inferred.
 */
export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json(
      { error: "unauthorized", message: "Sign in to export your data." },
      { status: 401 },
    );
  }

  try {
    const [comparisons, followedAreas, watchlist] = await Promise.all([
      listUserComparisons(user.id),
      listFollowedAreas(user.id),
      listWatchlist(user.id),
    ]);

    const payload = {
      exportedAt: new Date().toISOString(),
      account: {
        email: user.email,
        name: user.name,
        tier: user.tier,
        createdAt: user.createdAt,
      },
      savedComparisons: comparisons,
      followedAreas,
      propertyWatchlist: watchlist,
    };

    return new NextResponse(JSON.stringify(payload, null, 2), {
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Content-Disposition": 'attachment; filename="realvian-my-data.json"',
        // Personal data — never cache this response.
        "Cache-Control": "no-store",
      },
    });
  } catch (err) {
    // This handler was returning a bare 503 with zero logging before
    // this fix — a real, live failure that left no trace to debug
    // from. Never let a route fail silently again.
    console.error("[account/export] failed:", err);
    return NextResponse.json(
      { error: "export_failed", message: "Could not build your export. Please try again." },
      { status: 500 },
    );
  }
}
