import type { Metadata } from "next";
import { LegalLayout } from "@/components/legal-layout";

export const metadata: Metadata = {
  title: "AI & Content Disclosure",
  description: "How Realvian's scores and reports are generated.",
  alternates: { canonical: "/legal/ai" },
  robots: { index: true, follow: false },
};

export default function AiDisclosurePage() {
  return (
    <LegalLayout eyebrow="Legal" title="AI & Content Disclosure" lastUpdated="16 August 2026">
      <p>
        This page explains, plainly, how the numbers and reports on Realvian
        are actually produced — because "AI-generated" means very different
        things depending on the product, and we'd rather be specific than
        reassuring.
      </p>

      <h2>The Realvian Score</h2>
      <p>
        Area scores are <strong>not</strong> written or judged by a language
        model. They're computed by a fixed scoring engine: raw public data
        goes in, a documented weighting formula runs, a number comes out.
        The same inputs always produce the same score. Every score on the
        Site can be decomposed into the dimensions that produced it — that
        breakdown is shown on the area page itself, not hidden in a black
        box.
      </p>
      <p>
        Where we don't yet have enough real data for a dimension, the engine
        withholds that dimension rather than estimate it, and the area page
        says so.
      </p>

      <h2>Market reports and comparisons</h2>
      <p>
        The reports under <strong>Reports</strong> are generated from the
        area dataset using fixed templates — not free-form text written by a
        language model. A city report states the median price, the highest-
        scoring area, and the fastest-growing area because those are
        computed facts about the dataset, inserted into a template
        structure. This is why the same report updates automatically when
        the underlying data changes, and why two reports about different
        cities read with the same structure rather than different "voices."
      </p>

      <h2>Illustrations</h2>
      <p>
        The diagrams and icons across the Site are hand-built SVG, not
        AI-generated images. We made this choice deliberately — vector
        illustrations stay sharp at any size, adapt automatically to light
        and dark mode, and carry no licensing ambiguity.
      </p>

      <h2>Where AI assistance was used</h2>
      <p>
        Claude, Anthropic's AI model, was used as a development tool to help
        write the software that powers this Site — the scoring engine, the
        report templates, the page designs. That's a statement about how the
        product was built, not about how your data is processed or how the
        content you read was written. The distinction matters, so we're
        stating it explicitly rather than leaving it ambiguous.
      </p>

      <h2>Not professional advice</h2>
      <p>
        Regardless of how a figure was produced, nothing on the Site is
        financial, legal, or investment advice. See our{" "}
        <a href="/legal/terms">Terms of Use</a> for the full position.
      </p>

      <h2>Contact</h2>
      <p>
        <a href="mailto:data@realvian.co.uk">data@realvian.co.uk</a>
      </p>
    </LegalLayout>
  );
}
