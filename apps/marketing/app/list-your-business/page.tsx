import type { Metadata } from "next";
import { SectionLabel } from "@/components/ui";
import { SubmitForm } from "./submit-form";

export const metadata: Metadata = {
  title: "List Your Business",
  description:
    "Get your business in front of people actively researching property in your area. Free basic listing.",
  alternates: { canonical: "/list-your-business" },
};

export default async function ListYourBusinessPage({
  searchParams,
}: {
  searchParams: Promise<{ area?: string }>;
}) {
  const { area } = await searchParams;

  return (
    <>
      <section className="relative overflow-hidden border-b border-[var(--border)]">
        <div className="absolute inset-0 grid-bg opacity-50" aria-hidden="true" />
        <div className="absolute inset-0 glow-emerald" aria-hidden="true" />
        <div className="relative z-10 mx-auto max-w-[820px] px-5 sm:px-8 pt-[104px] pb-12 lg:pt-[128px]">
          <SectionLabel>Directory</SectionLabel>
          <h1
            className="text-[var(--text-primary)]"
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "clamp(34px, 5vw, 52px)",
              lineHeight: 1.04,
              letterSpacing: "-0.03em",
              fontWeight: 300,
            }}
          >
            Get found by people
            <br />
            <em style={{ fontStyle: "italic", color: "var(--primary)", fontWeight: 300 }}>
              already researching.
            </em>
          </h1>
          <p className="mt-5 max-w-[520px] text-[16px] leading-[1.65] text-[var(--text-secondary)]">
            People arrive on Realvian researching a specific postcode before
            they buy, move or renovate. A listing puts you in front of them at
            exactly that moment.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-[820px] px-5 sm:px-8 py-12">
        <SubmitForm defaultArea={area ?? ""} />
      </section>
    </>
  );
}
