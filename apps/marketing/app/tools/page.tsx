import type { Metadata } from "next";
import { ComingSoon } from "@/components/coming-soon";

export const metadata: Metadata = {
  title: "Property Calculators",
  description:
    "Mortgage affordability, stamp duty, rental yield and ROI calculators. In development.",
  alternates: { canonical: "/tools" },
};

export default function ToolsPage() {
  return (
    <ComingSoon
      eyebrow="Tools"
      title="Calculators"
      description="A set of calculators for the numbers that actually decide whether a property works — built on the same area data as the rest of the site, not generic UK-wide assumptions."
      bullets={[
        "Mortgage affordability, based on current rates",
        "Stamp duty — including additional-property surcharge",
        "Gross and net rental yield, using real area-level rent data once it's live",
        "Return on investment, with editable assumptions you can stress-test",
      ]}
      eta="Not started — next up after the area data pipeline is fully live."
    />
  );
}
