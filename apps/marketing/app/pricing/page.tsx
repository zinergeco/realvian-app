import type { Metadata } from "next";
import { ComingSoon } from "@/components/coming-soon";

export const metadata: Metadata = {
  title: "Pricing",
  description:
    "Realvian is in private beta. Area intelligence, comparisons and reports are free to use while the platform is being built out.",
  alternates: { canonical: "/pricing" },
};

export default function PricingPage() {
  return (
    <ComingSoon
      eyebrow="Pricing"
      title="Free while we're in beta"
      description="Everything live today — area scores, comparisons, and market reports — is free to use with no account required. Paid tiers will follow once premium features like off-market data and portfolio tools are live, not before."
      bullets={[
        "Area intelligence and comparisons stay free",
        "A free tier will remain available once paid plans launch",
        "Paid tiers unlock portal features, alerts and premium reports",
        "No card required to use anything on the site today",
      ]}
      eta="Pricing will be published once the features it's attached to actually exist."
    />
  );
}
