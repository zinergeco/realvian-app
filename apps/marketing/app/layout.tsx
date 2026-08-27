import type { Metadata, Viewport } from "next";
import { cookies, headers } from "next/headers";
import { ThemeProvider, themeScript, type Theme } from "@/components/theme-provider";
import { SiteHeader } from "@/components/site-header";
import { getCurrentUser } from "@/lib/public-auth";
import { SiteFooter } from "@/components/site-footer";
import { organizationSchema, websiteSchema } from "@/lib/site-schema";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://realvian.co.uk"),
  title: {
    default: "Realvian — UK Property Intelligence Platform",
    template: "%s · Realvian",
  },
  description:
    "Score any UK postcode across 24 data dimensions. Area intelligence, yield analysis, and market data for landlords, investors, agents and developers.",
  alternates: {
    types: {
      "application/rss+xml": [{ url: "/feed.xml", title: "Realvian — UK Property Market Reports" }],
    },
  },
  keywords: [
    "UK property data",
    "area intelligence",
    "property investment analysis",
    "postcode comparison",
    "rental yield calculator",
  ],
  openGraph: {
    type: "website",
    locale: "en_GB",
    url: "https://realvian.co.uk",
    siteName: "Realvian",
    title: "Realvian — UK Property Intelligence Platform",
    description:
      "Score any UK postcode across 24 data dimensions. Built on fused public data, not guesswork.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Realvian — UK Property Intelligence Platform",
    description: "Score any UK postcode across 24 data dimensions.",
  },
  robots: { index: true, follow: true },
  icons: { icon: "/favicon.svg" },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#FFFFFF" },
    { media: "(prefers-color-scheme: dark)", color: "#0B0F17" },
  ],
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Read the theme cookie server-side so the initial HTML is already correct
  const cookieStore = await cookies();
  const cookieTheme = cookieStore.get("realvian-theme")?.value;
  const theme: Theme = cookieTheme === "dark" ? "dark" : "light";

  // Set by middleware.ts on every request — matched against the CSP
  // header it also sets, so this specific inline script is allowed to
  // execute while any injected/XSS script (which wouldn't know this
  // per-request value) is not.
  const nonce = (await headers()).get("x-csp-nonce") ?? undefined;

  // Auth state resolved once here, server-side, and passed down — the
  // header must never guess or default to "signed out" while a valid
  // session cookie exists. Fails closed if the database is briefly down.
  const user = await getCurrentUser();

  return (
    <html
      lang="en-GB"
      className={theme === "dark" ? "dark" : ""}
      suppressHydrationWarning
    >
      <head>
        {/* Runs before first paint — prevents flash of wrong theme */}
        <script nonce={nonce} dangerouslySetInnerHTML={{ __html: themeScript }} />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,300;0,9..144,400;0,9..144,500;0,9..144,600;1,9..144,300;1,9..144,400&family=Inter:wght@300;400;500;600&family=IBM+Plex+Mono:wght@400;500&display=swap"
        />
      </head>
      <body>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }}
        />
        <ThemeProvider initialTheme={theme}>
          <SiteHeader user={user ? { name: user.name, email: user.email } : null} />
          <main>{children}</main>
          <SiteFooter />
        </ThemeProvider>
      </body>
    </html>
  );
}
