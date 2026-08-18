import type { Metadata } from "next";
import { SectionLabel } from "@/components/ui";
import { Calculators } from "./calculators";

export const metadata: Metadata = {
  title: "Property Calculators — Mortgage, Stamp Duty, Yield & ROI",
  description:
    "Free UK property calculators: mortgage affordability, Stamp Duty Land Tax, rental yield and cash-on-cash return.",
  alternates: { canonical: "/tools" },
};

export default function ToolsPage() {
  return (
    <>
      <section className="relative overflow-hidden border-b border-[var(--border)]">
        <div className="absolute inset-0 grid-bg opacity-50" aria-hidden="true" />
        <div className="absolute inset-0 glow-emerald" aria-hidden="true" />
        <div className="relative z-10 mx-auto max-w-[1100px] px-5 sm:px-8 pt-[104px] pb-16 lg:pt-[128px]">
          <SectionLabel>Tools</SectionLabel>
          <h1
            className="text-[var(--text-primary)] mb-5"
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "clamp(32px, 4.6vw, 50px)",
              lineHeight: 1.04,
              letterSpacing: "-0.03em",
              fontWeight: 300,
            }}
          >
            Calculators
          </h1>
          <p className="text-[16px] leading-[1.65] text-[var(--text-secondary)] max-w-[600px]">
            The numbers that actually decide whether a property works. Free,
            instant, no account required — figures update as you type.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-[1100px] px-5 sm:px-8 py-14">
        <Calculators />
      </section>
    </>
  );
}
