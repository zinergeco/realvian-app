import type { Metadata } from "next";
import { listMedia } from "@/lib/admin-data";
import { deleteMediaAction } from "@/lib/admin-actions";
import { Card, SectionLabel } from "@/components/ui";
import { Alert } from "@/components/admin-ui";
import { UploadForm } from "./upload-form";

export const metadata: Metadata = { title: "Media", robots: { index: false } };
export const dynamic = "force-dynamic";

const fmtBytes = (n: number) =>
  n > 1_048_576 ? `${(n / 1_048_576).toFixed(1)} MB` : `${Math.round(n / 1024)} KB`;

export default async function MediaPage() {
  let items: Awaited<ReturnType<typeof listMedia>> = [];
  let error: string | null = null;
  try {
    items = await listMedia();
  } catch (err) {
    error = err instanceof Error ? err.message : "Database unavailable";
  }

  return (
    <>
      <SectionLabel>Media library</SectionLabel>
      <h1
        className="text-[var(--text-primary)] mb-2"
        style={{ fontFamily: "var(--font-display)", fontSize: 34, fontWeight: 300, letterSpacing: "-0.03em" }}
      >
        Images
      </h1>
      <p className="text-[14px] text-[var(--text-secondary)] mb-8 max-w-[560px]">
        Upload images here, then attach them to any page from Content &amp; images.
        Alt text is required on every upload — it is both an accessibility
        obligation and an SEO signal.
      </p>

      <div className="grid lg:grid-cols-[380px_1fr] gap-8">
        <div>
          <Card className="p-6">
            <h2 className="text-[16px] font-semibold text-[var(--text-primary)] mb-5">
              Upload
            </h2>
            <UploadForm />
          </Card>
        </div>

        <div>
          {error && <Alert kind="error">Could not load media: {error}</Alert>}
          {!error && items.length === 0 && (
            <Card className="p-10 text-center">
              <p className="text-[14px] text-[var(--text-muted)]">
                No images yet. Upload your first on the left.
              </p>
            </Card>
          )}
          {items.length > 0 && (
            <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
              {items.map((m) => (
                <Card key={m.id} className="overflow-hidden">
                  <div className="aspect-[4/3] bg-[var(--bg-inset)] overflow-hidden">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={`/media/${m.storageKey}`}
                      alt={m.altText}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="p-3.5">
                    <p className="text-[13px] font-medium text-[var(--text-primary)] truncate">
                      {m.filename}
                    </p>
                    <p className="text-[11.5px] text-[var(--text-muted)] mt-1 line-clamp-2">
                      {m.altText}
                    </p>
                    <div className="flex items-center justify-between gap-2 mt-3 pt-3 border-t border-[var(--border)]">
                      <span className="tnum text-[11px] text-[var(--text-muted)]">
                        {fmtBytes(m.bytes)}
                      </span>
                      <form action={deleteMediaAction}>
                        <input type="hidden" name="id" value={m.id} />
                        <button
                          type="submit"
                          className="text-[11.5px] text-[var(--text-muted)] hover:text-[var(--danger)] transition-colors"
                        >
                          Delete
                        </button>
                      </form>
                    </div>
                    {/* Copyable id for attaching in the content editor */}
                    <code className="block mt-2 text-[10px] text-[var(--text-muted)] break-all">
                      {m.id}
                    </code>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
