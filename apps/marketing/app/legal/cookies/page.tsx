import type { Metadata } from "next";
import { LegalLayout } from "@/components/legal-layout";

export const metadata: Metadata = {
  title: "Cookie Policy",
  description: "Which cookies Realvian uses and why.",
  alternates: { canonical: "/legal/cookies" },
  robots: { index: true, follow: false },
};

export default function CookiesPage() {
  return (
    <LegalLayout eyebrow="Legal" title="Cookie Policy" lastUpdated="16 August 2026">
      <p>
        This is a short policy because the Site currently uses very few
        cookies. No cookie-consent banner is shown because every cookie
        below is strictly necessary — nothing here tracks you across
        sites or builds an advertising profile.
      </p>

      <h2>Cookies we use</h2>
      <ul>
        <li><strong>realvian-theme</strong> — remembers whether you're using light or dark mode. No personal data, expires after one year.</li>
        <li><strong>rv_admin_session</strong> — keeps staff signed in to the admin area. HttpOnly, only set for logged-in administrators, never set for ordinary visitors. Expires after 12 hours.</li>
      </ul>

      <h2>What we don't use — yet</h2>
      <p>
        No analytics cookies, no advertising cookies, and no third-party
        tracking pixels are currently in place. If that changes — for
        example, if we add analytics to understand traffic — this policy
        will be updated first, and a consent banner will be added before any
        non-essential cookie is set, in line with UK PECR rules.
      </p>

      <h2>Controlling cookies</h2>
      <p>
        You can block or delete cookies through your browser settings at any
        time. Blocking the theme cookie just means the Site won't remember
        your preference between visits — nothing else will break.
      </p>

      <h2>Contact</h2>
      <p>
        <a href="mailto:data@realvian.co.uk">data@realvian.co.uk</a>
      </p>
    </LegalLayout>
  );
}
