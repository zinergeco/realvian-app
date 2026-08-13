/**
 * ADMIN ROUTE PROTECTION
 *
 * Cookie-presence check only — the real session validation happens in
 * getCurrentAdmin() against the database, and every Server Action re-checks
 * independently. Middleware runs on the edge without database access, so
 * treating it as the sole gate would be a mistake; it exists to bounce
 * unauthenticated users quickly, not to be the security boundary.
 */

import { NextResponse, type NextRequest } from "next/server";

const SESSION_COOKIE = "rv_admin_session";

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (pathname.startsWith("/admin") && !pathname.startsWith("/admin/login")) {
    if (!req.cookies.get(SESSION_COOKIE)?.value) {
      const url = req.nextUrl.clone();
      url.pathname = "/admin/login";
      return NextResponse.redirect(url);
    }
  }

  // Never index the admin surface
  const res = NextResponse.next();
  if (pathname.startsWith("/admin")) {
    res.headers.set("X-Robots-Tag", "noindex, nofollow");
  }
  return res;
}

export const config = { matcher: ["/admin/:path*"] };
