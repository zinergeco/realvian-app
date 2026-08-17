"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUser } from "./public-auth";
import { saveComparison, deleteComparison } from "./comparisons";

export interface SaveComparisonState {
  ok?: boolean;
  error?: string;
  requiresLogin?: boolean;
}

export async function saveComparisonAction(
  _prev: SaveComparisonState | undefined,
  formData: FormData,
): Promise<SaveComparisonState> {
  const user = await getCurrentUser();
  if (!user) {
    // Not an error state — the UI reads this to show a sign-in prompt
    // instead of a red error, since "you need an account" isn't a failure.
    return { requiresLogin: true };
  }

  const a = String(formData.get("areaA") ?? "");
  const b = String(formData.get("areaB") ?? "");
  if (!a || !b) return { error: "Choose two areas first." };

  const result = await saveComparison(user.id, a, b);
  if (!result.ok) return { error: result.error };

  revalidatePath("/account");
  return { ok: true };
}

export async function deleteComparisonAction(formData: FormData): Promise<void> {
  const user = await getCurrentUser();
  if (!user) return;

  const id = String(formData.get("id") ?? "");
  if (!id) return;

  await deleteComparison(user.id, id);
  revalidatePath("/account");
}
