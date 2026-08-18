import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ComingSoon } from "@/components/coming-soon";

const PORTALS: Record<
  string,
  { name: string; description: string; bullets: string[] }
> = {
  // "landlord" deliberately not listed here — it has its own real page at
  // app/portals/landlord/page.tsx (a static route, which Next.js resolves
  // ahead of this dynamic [type] segment for the exact same path). Keeping
  // a second, unreachable "landlord" entry here would just be confusing
  // dead content generating a phantom static path.
  investor: {
    name: "Investor portal",
    description:
      "Built for people evaluating where to put capital, not just one property. Surfaces opportunity across areas rather than one listing at a time.",
    bullets: [
      "Yield and growth forecasts by area, not just by listing",
      "Off-market deal flow as partnerships come online",
      "Hot-spot maps built from demand signals, not just historic price data",
      "Portfolio-level return tracking across multiple properties",
    ],
  },
  agent: {
    name: "Agent portal",
    description:
      "A way for estate and letting agents to generate qualified local leads and hand clients something more substantial than a printed brochure.",
    bullets: [
      "Locally qualified leads from people researching your patch",
      "White-label area reports you can send to clients under your own name",
      "Comparable market analysis pulled from the same data as the public site",
      "A listing presence on every area page you cover",
    ],
  },
  developer: {
    name: "Developer portal",
    description:
      "Site-level feasibility and planning intelligence for people evaluating land or existing stock for development.",
    bullets: [
      "Site feasibility modelling against local demand and pricing",
      "Planning application radar for sites and areas you're watching",
      "Absorption-rate analysis — how fast comparable new stock has sold or let",
      "Early access to planning and land data as partnerships come online",
    ],
  },
};

export function generateStaticParams() {
  return Object.keys(PORTALS).map((type) => ({ type }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ type: string }>;
}): Promise<Metadata> {
  const { type } = await params;
  const portal = PORTALS[type];
  if (!portal) return { title: "Portal not found" };
  return {
    title: portal.name,
    description: portal.description,
    alternates: { canonical: `/portals/${type}` },
  };
}

export default async function PortalDetailPage({
  params,
}: {
  params: Promise<{ type: string }>;
}) {
  const { type } = await params;
  const portal = PORTALS[type];
  if (!portal) notFound();

  return (
    <ComingSoon
      eyebrow="Portals"
      title={portal.name}
      description={portal.description}
      bullets={portal.bullets}
      eta="No fixed date yet — the area intelligence and comparison tools these portals will sit on top of are live today."
    />
  );
}
