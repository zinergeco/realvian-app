"use client";

import { useActionState, useState } from "react";
import { saveOverrideAction } from "@/lib/admin-actions";
import { Alert, Field, SubmitButton } from "@/components/admin-ui";

export function OverrideForm({
  entities,
  media,
}: {
  entities: { type: string; key: string; label: string }[];
  media: { id: string; storageKey: string; filename: string; altText: string }[];
}) {
  const [state, action] = useActionState(saveOverrideAction, {});
  const [selected, setSelected] = useState(entities[0]?.key ?? "");
  const [heroId, setHeroId] = useState("");

  const entity = entities.find((e) => e.key === selected);

  return (
    <form action={action} className="space-y-4">
      {state?.error && <Alert kind="error">{state.error}</Alert>}
      {state?.ok && <Alert kind="success">Saved. The page has been regenerated.</Alert>}

      <input type="hidden" name="entityType" value={entity?.type ?? "post"} />
      <input type="hidden" name="heroMediaId" value={heroId} />

      <label className="block">
        <span className="block text-[12.5px] font-medium text-[var(--text-primary)] mb-1.5">
          Page <span style={{ color: "var(--danger)" }}>*</span>
        </span>
        <select
          name="entityKey"
          value={selected}
          onChange={(e) => setSelected(e.target.value)}
          className="w-full px-3.5 py-2.5 bg-[var(--bg-subtle)] text-[var(--text-primary)]
                     border border-[var(--border-strong)] rounded-[var(--radius-md)]
                     text-[14px] outline-none focus:border-[var(--primary)]"
        >
          <optgroup label="Blog posts">
            {entities.filter((e) => e.type === "post").map((e) => (
              <option key={e.key} value={e.key}>{e.label}</option>
            ))}
          </optgroup>
          <optgroup label="Area pages">
            {entities.filter((e) => e.type === "area").map((e) => (
              <option key={e.key} value={e.key}>{e.label}</option>
            ))}
          </optgroup>
        </select>
      </label>

      <Field
        label="Title override"
        name="title"
        placeholder="Leave blank to keep the generated title"
      />
      <Field
        label="Description override"
        name="description"
        rows={3}
        placeholder="Leave blank to keep the generated description"
      />

      {/* Image picker */}
      <div>
        <span className="block text-[12.5px] font-medium text-[var(--text-primary)] mb-2">
          Hero image
        </span>
        {media.length === 0 ? (
          <p className="text-[12.5px] text-[var(--text-muted)]">
            No images uploaded yet — add some in Media first.
          </p>
        ) : (
          <div className="grid grid-cols-4 gap-2 max-h-[220px] overflow-y-auto p-1">
            <button
              type="button"
              onClick={() => setHeroId("")}
              className={`aspect-square rounded-[var(--radius-sm)] border-2 grid place-items-center
                          text-[10px] text-[var(--text-muted)] transition-colors
                          ${heroId === "" ? "border-[var(--primary)]" : "border-[var(--border)]"}`}
            >
              None
            </button>
            {media.map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => setHeroId(m.id)}
                title={m.altText}
                className={`aspect-square rounded-[var(--radius-sm)] border-2 overflow-hidden
                            transition-colors ${heroId === m.id ? "border-[var(--primary)]" : "border-transparent"}`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={`/media/${m.storageKey}`} alt={m.altText} className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        )}
      </div>

      <label className="flex items-center gap-2.5 cursor-pointer">
        <input type="checkbox" name="hidden" className="accent-[var(--primary)]" />
        <span className="text-[13px] text-[var(--text-secondary)]">
          Hide this page from the public site
        </span>
      </label>

      <SubmitButton pendingLabel="Saving…" className="w-full">
        Save override
      </SubmitButton>
    </form>
  );
}
