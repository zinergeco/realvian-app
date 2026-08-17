import type { Metadata } from "next";
import { LegalLayout } from "@/components/legal-layout";

export const metadata: Metadata = {
  title: "Terms of Use",
  description: "The terms that govern use of the Realvian website and platform.",
  alternates: { canonical: "/legal/terms" },
  robots: { index: true, follow: false },
};

export default function TermsPage() {
  return (
    <LegalLayout eyebrow="Legal" title="Terms of Use" lastUpdated="16 August 2026">
      <p>
        These terms govern your use of realvian.co.uk (the "Site"), operated
        by <span className="placeholder">[Realvian Group Ltd — insert registered
        company number and registered office]</span>. By using the Site, you
        agree to these terms. If you don't agree, please don't use the Site.
      </p>

      <h2>What Realvian is</h2>
      <p>
        Realvian provides area-level property intelligence for the UK — scores,
        comparisons and market reports derived from public data sources.
        The Site is informational. It is <strong>not financial advice, legal
        advice, or a substitute for professional valuation</strong>. Nothing on
        the Site constitutes a recommendation to buy, sell, let or invest in
        any property or area.
      </p>

      <h2>Accuracy of data</h2>
      <p>
        We label every area page honestly according to how much of its data is
        drawn from live public sources versus illustrative placeholder figures.
        Where a figure is marked as illustrative, treat it as directional only,
        not a fact to rely on. Where a figure is marked as live, it is still
        derived from third-party public data (HM Land Registry, ONS, Police.uk
        and others) which may itself contain errors, lag reality, or change
        without notice. Always verify independently before making a financial
        decision.
      </p>

      <h2>Business listings</h2>
      <p>
        If you submit a business listing, you confirm the information provided
        is accurate and that you're authorised to represent that business.
        Submitted listings are reviewed before publication and we may reject,
        edit for clarity, or remove any listing at our discretion — including
        after publication. Listing tiers (free, featured, premium) determine
        visibility only; they are not a guarantee of leads, traffic or
        outcomes.
      </p>

      <h2>Affiliate and sponsored content</h2>
      <p>
        Some links on the Site are affiliate links — we may earn a commission
        if you use them, at no extra cost to you. Every affiliate link and
        paid placement is labelled at the point it appears. Commercial
        relationships never influence the area scores or rankings shown
        elsewhere on the Site.
      </p>

      <h2>Acceptable use</h2>
      <ul>
        <li>Don't scrape, bulk-extract or systematically reproduce data from the Site without written permission.</li>
        <li>Don't use the Site to build a competing product from our data.</li>
        <li>Don't attempt to bypass access controls, including on the admin area.</li>
        <li>Don't submit false, misleading, or fraudulent business listings.</li>
      </ul>

      <h2>Intellectual property</h2>
      <p>
        The Realvian name, the Realvian Score methodology, and the Site's
        design and code are owned by us or our licensors. Underlying public
        data belongs to its original sources and is used under the applicable
        open licence (see individual source attributions on area and report
        pages).
      </p>

      <h2>Liability</h2>
      <p>
        The Site is provided "as is". To the extent permitted by law, we
        exclude liability for any loss arising from reliance on information
        provided on the Site, including decisions made using illustrative
        data. Nothing in these terms excludes liability that cannot lawfully
        be excluded, such as for death or personal injury caused by
        negligence, or for fraud.
      </p>

      <h2>Changes</h2>
      <p>
        We may update these terms as the Site develops. Material changes will
        update the date at the top of this page. Continued use of the Site
        after a change means you accept the updated terms.
      </p>

      <h2>Governing law</h2>
      <p>These terms are governed by the law of England and Wales.</p>

      <h2>Contact</h2>
      <p>
        Questions about these terms: <a href="mailto:hello@realvian.co.uk">hello@realvian.co.uk</a>
      </p>
    </LegalLayout>
  );
}
