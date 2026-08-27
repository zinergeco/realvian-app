/**
 * ADMIN ROUTE PROTECTION + SITE-WIDE CSP NONCE
 *
 * Cookie-presence check only — the real session validation happens in
 * getCurrentAdmin() against the database, and every Server Action re-checks
 * independently. Middleware runs on the edge without database access, so
 * treating it as the sole gate would be a mistake; it exists to bounce
 * unauthenticated users quickly, not to be the security boundary.
 *
 * The nonce generation below is unrelated to the admin check above — it
 * runs on every request (not just /admin) so every page can embed the
 * same per-request random value in its inline scripts (the theme-init
 * script and the JSON-LD structured data) and have that value match
 * what the CSP header allows. This is why the matcher was widened from
 * admin-only to (almost) everything: a nonce that doesn't cover the
 * page requesting it is useless.
 */

import { NextResponse, type NextRequest } from "next/server";

const SESSION_COOKIE = "rv_admin_session";

function buildCsp(nonce: string): string {
  // Scoped to exactly what this site actually loads — checked against
  // the real codebase before writing this, not a generic template:
  // Google Fonts is the only external resource (no remote images, no
  // iframes, no other third-party scripts). 'unsafe-inline' for
  // style-src only, not script-src — inline style={{}} attributes are
  // used extensively throughout this codebase and a nonce-per-style
  // tag isn't practical, but style-based XSS is a much narrower attack
  // surface than script-based, so this is a deliberate, scoped
  // trade-off rather than a blanket weakening.
  return [
    `default-src 'self'`,
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'`,
    `style-src 'self' 'unsafe-inline' https://fonts.googleapis.com`,
    `font-src 'self' https://fonts.gstatic.com`,
    `img-src 'self' data:`,
    `connect-src 'self'`,
    `frame-ancestors 'self'`,
    `base-uri 'self'`,
    `form-action 'self'`,
  ].join("; ");
}

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (pathname.startsWith("/admin") && !pathname.startsWith("/admin/login")) {
    if (!req.cookies.get(SESSION_COOKIE)?.value) {
      const url = req.nextUrl.clone();
      url.pathname = "/admin/login";
      return NextResponse.redirect(url);
    }
  }

  // crypto.randomUUID() is available on the Edge Runtime middleware
  // runs on (standard Web Crypto API) — deliberately not Node's
  // crypto module, which isn't available here.
  const nonce = crypto.randomUUID();

  // Set on the request headers too, not just the response — this is
  // how the root layout (a Server Component) reads the same nonce via
  // headers() to embed in its own script tags, so the value the
  // browser receives in the CSP header and the value stamped on each
  // <script nonce=""> tag are guaranteed to be identical.
  const requestHeaders = new Headers(req.headers);
  requestHeaders.set("x-csp-nonce", nonce);

  const res = NextResponse.next({ request: { headers: requestHeaders } });
  res.headers.set("Content-Security-Policy", buildCsp(nonce));

  // Never index the admin surface
  if (pathname.startsWith("/admin")) {
    res.headers.set("X-Robots-Tag", "noindex, nofollow");
  }
  return res;
}

export const config = {
  matcher: [
    // Everything except static assets and Next.js internals — a CSP
    // nonce only matters for actual HTML page requests.
    "/((?!_next/static|_next/image|favicon\\.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|css|js)$).*)",
  ],
};
