"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUser } from "./public-auth";
import { generateApiKey, revokeApiKey } from "./api-keys";

export interface ApiKeyActionState {
  ok?: boolean;
  error?: string;
  rawKey?: string;
}

export async function generateApiKeyAction(
  _prev: ApiKeyActionState | undefined,
  formData: FormData,
): Promise<ApiKeyActionState> {
  const user = await getCurrentUser();
  if (!user) return { error: "Sign in to generate an API key." };

  const name = String(formData.get("name") ?? "").trim() || "Unnamed key";

  const result = await generateApiKey(user.id, name);
  if (!result.ok) return { error: result.error };

  revalidatePath("/account");
  // The raw key is returned here and ONLY here — this is the one
  // moment it exists outside the database as a hash. The client
  // component is responsible for showing it once and never re-fetching it.
  return { ok: true, rawKey: result.rawKey };
}

export async function revokeApiKeyAction(formData: FormData): Promise<void> {
  const user = await getCurrentUser();
  if (!user) return;

  const keyId = String(formData.get("keyId") ?? "");
  if (!keyId) return;

  await revokeApiKey(user.id, keyId);
  revalidatePath("/account");
}
