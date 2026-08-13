import type { Metadata } from "next";
import { listOverrides, listMedia } from "@/lib/admin-data";
import { getAllPosts } from "@/lib/blog";
import { getAllAreas } from "@/lib/areas";
import { Card, SectionLabel, Badge } from "@/components/ui";
import { Alert } from "@/components/admin-ui";
import { OverrideForm } from "./override-form";

export const metadata: Metadata = { title: "Content", robots: { index: false } };
export const dynamic = "force-dynamic";

export default async function ContentPage() {
  const posts = getAllPosts();
  const areas = getAllAreas();

  let overrides: Awaited<ReturnType<typeof listOverrides>> = [];
  let media: Awaited<ReturnType<typeof listMedia>> = [];
  let error: string | null = null;
  try {
    [overrides, media] = await Promise.all([listOverrides(), listMedia(200)]);
  } catch (err) {
    error = err instanceof Error ? err.message : "Database unavailable";
  }

  const entities = [
    ...posts.map((p) => ({ type: "post", key: p.slug, label: p.title })),
    ...areas.map((a) => ({ type: "area", key: a.slug, label: `${a.district}, ${a.city}` })),
  ];

  return (
    <>
      <SectionLabel>Content &amp; images</SectionLabel>
      <h1
        className="text-[var(--text-primary)] mb-2"
        style={{ fontFamily: "var(--font-display)", fontSize: 34, fontWeight: 300, letterSpacing: "-0.03em" }}
      >
        Override generated content
      </h1>
      <p className="text-[14px] text-[var(--text-secondary)] mb-8 max-w-[620px]">
        Pages are generated from data. Anything you set here overrides the
        generated version and survives future data refreshes — everything you
        leave blank keeps updating automatically.
      </p>

      {error && <Alert kind="error">Could not load: {error}</Alert>}

      <div className="grid lg:grid-cols-[440px_1fr] gap-8">
        <Card className="p-6 h-fit">
          <h2 className="text-[16px] font-semibold text-[var(--text-primary)] mb-5">
            Edit a page
          </h2>
          <OverrideForm entities={entities} media={media} />
        </Card>

        <div>
          <h2 className="text-[15px] font-semibold text-[var(--text-primary)] mb-4">
            Existing overrides ({overrides.length})
          </h2>
          {overrides.length === 0 ? (
            <Card className="p-10 text-center">
              <p className="text-[14px] text-[var(--text-muted)]">
                No overrides yet. Every page is showing its generated version.
              </p>
            </Card>
          ) : (
            <div className="space-y-3">
              {overrides.map((o) => (
                <Card key={`${o.entityType}:${o.entityKey}`} className="p-4">
                  <div className="flex items-start gap-4">
                    {o.heroStorageKey && (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img
                        src={`/media/${o.heroStorageKey}`}
                        alt=""
                        className="w-20 h-16 object-cover rounded-[var(--radius-sm)] shrink-0"
                      />
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-1.5">
                        <Badge tone="neutral" className="!text-[9.5px]">{o.entityType}</Badge>
                        {o.hidden && <Badge tone="highlight" className="!text-[9.5px]">Hidden</Badge>}
                      </div>
                      <p className="text-[13.5px] text-[var(--text-primary)] truncate">
                        {o.title ?? o.entityKey}
                      </p>
                      <p className="text-[11.5px] text-[var(--text-muted)] mt-1">
                        {o.entityKey}
                        {o.updatedAt && ` · ${new Date(o.updatedAt).toLocaleDateString("en-GB")}`}
                      </p>
                    </div>
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
