import type { Metadata } from "next";
import { listPrograms, listProducts } from "@/lib/admin-data";
import { toggleProgramAction, toggleProductAction } from "@/lib/admin-actions";
import { Card, SectionLabel, Badge } from "@/components/ui";
import { Alert } from "@/components/admin-ui";
import { ProgramForm, ProductForm } from "./forms";

export const metadata: Metadata = { title: "Affiliates", robots: { index: false } };
export const dynamic = "force-dynamic";

export default async function AffiliatesPage() {
  let programs: Awaited<ReturnType<typeof listPrograms>> = [];
  let products: Awaited<ReturnType<typeof listProducts>> = [];
  let error: string | null = null;
  try {
    [programs, products] = await Promise.all([listPrograms(), listProducts()]);
  } catch (err) {
    error = err instanceof Error ? err.message : "Database unavailable";
  }

  return (
    <>
      <SectionLabel>Monetisation</SectionLabel>
      <h1
        className="text-[var(--text-primary)] mb-2"
        style={{ fontFamily: "var(--font-display)", fontSize: 34, fontWeight: 300, letterSpacing: "-0.03em" }}
      >
        Affiliate programmes
      </h1>
      <p className="text-[14px] text-[var(--text-secondary)] mb-8 max-w-[620px]">
        Programmes are the commercial relationship; products are the individual
        offers placed on pages. New programmes start inactive — activate only
        once the agreement is signed and the tracking link is verified.
      </p>

      {error && <Alert kind="error">Could not load: {error}</Alert>}

      <div className="grid lg:grid-cols-2 gap-6 mb-10">
        <Card className="p-6">
          <h2 className="text-[16px] font-semibold text-[var(--text-primary)] mb-5">Add programme</h2>
          <ProgramForm />
        </Card>
        <Card className="p-6">
          <h2 className="text-[16px] font-semibold text-[var(--text-primary)] mb-5">Add product</h2>
          <ProductForm programs={programs.map((p) => ({ id: p.id, name: p.name }))} />
        </Card>
      </div>

      <h2 className="text-[15px] font-semibold text-[var(--text-primary)] mb-4">
        Programmes ({programs.length})
      </h2>
      <Card className="overflow-x-auto mb-10">
        <table className="w-full min-w-[640px] text-[13.5px]">
          <thead>
            <tr className="border-b border-[var(--border)] bg-[var(--bg-subtle)]">
              {["Name", "Category", "Commission", "Products", "Status", ""].map((h) => (
                <th key={h} className="text-left px-4 py-2.5 text-[10.5px] tracking-[0.08em] uppercase text-[var(--text-muted)] font-medium">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {programs.length === 0 && (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-[var(--text-muted)]">No programmes yet.</td></tr>
            )}
            {programs.map((p) => (
              <tr key={p.id} className="border-b border-[var(--border)] last:border-0">
                <td className="px-4 py-3 text-[var(--text-primary)]">{p.name}</td>
                <td className="px-4 py-3 text-[var(--text-secondary)]">{p.category}</td>
                <td className="px-4 py-3 tnum text-[var(--text-secondary)]">
                  {p.commissionValue !== null ? `${p.commissionValue} ${p.commissionType ?? ""}` : "—"}
                </td>
                <td className="px-4 py-3 tnum text-[var(--text-secondary)]">{p.productCount}</td>
                <td className="px-4 py-3">
                  <Badge tone={p.active ? "primary" : "neutral"} className="!text-[9.5px]">
                    {p.active ? "Active" : "Inactive"}
                  </Badge>
                </td>
                <td className="px-4 py-3 text-right">
                  <form action={toggleProgramAction}>
                    <input type="hidden" name="id" value={p.id} />
                    <input type="hidden" name="active" value={String(!p.active)} />
                    <button type="submit" className="text-[12.5px] hover:underline" style={{ color: "var(--primary)" }}>
                      {p.active ? "Deactivate" : "Activate"}
                    </button>
                  </form>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      <h2 className="text-[15px] font-semibold text-[var(--text-primary)] mb-4">
        Products ({products.length})
      </h2>
      <Card className="overflow-x-auto">
        <table className="w-full min-w-[760px] text-[13.5px]">
          <thead>
            <tr className="border-b border-[var(--border)] bg-[var(--bg-subtle)]">
              {["Product", "Programme", "Scope", "Topics", "Clicks 30d", "Status", ""].map((h) => (
                <th key={h} className="text-left px-4 py-2.5 text-[10.5px] tracking-[0.08em] uppercase text-[var(--text-muted)] font-medium">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {products.length === 0 && (
              <tr><td colSpan={7} className="px-4 py-8 text-center text-[var(--text-muted)]">No products yet.</td></tr>
            )}
            {products.map((p) => (
              <tr key={p.id} className="border-b border-[var(--border)] last:border-0">
                <td className="px-4 py-3 text-[var(--text-primary)]">{p.name}</td>
                <td className="px-4 py-3 text-[var(--text-secondary)]">{p.programName}</td>
                <td className="px-4 py-3 text-[var(--text-secondary)]">
                  {p.scopeType}{p.scopeValue ? `: ${p.scopeValue}` : ""}
                </td>
                <td className="px-4 py-3 text-[var(--text-muted)] text-[12px]">
                  {p.matchTopics.join(", ") || "—"}
                </td>
                <td className="px-4 py-3 tnum" style={{ color: p.clicks30d > 0 ? "var(--primary)" : "var(--text-muted)" }}>
                  {p.clicks30d}
                </td>
                <td className="px-4 py-3">
                  <Badge tone={p.active ? "primary" : "neutral"} className="!text-[9.5px]">
                    {p.active ? "Live" : "Off"}
                  </Badge>
                </td>
                <td className="px-4 py-3 text-right">
                  <form action={toggleProductAction}>
                    <input type="hidden" name="id" value={p.id} />
                    <input type="hidden" name="active" value={String(!p.active)} />
                    <button type="submit" className="text-[12.5px] hover:underline" style={{ color: "var(--primary)" }}>
                      {p.active ? "Turn off" : "Turn on"}
                    </button>
                  </form>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </>
  );
}
