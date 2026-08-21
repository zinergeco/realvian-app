"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUser } from "./public-auth";
import { followArea, unfollowArea } from "./followed-areas";

export interface FollowAreaState {
  ok?: boolean;
  error?: string;
  requiresLogin?: boolean;
}

export async function followAreaAction(
  _prev: FollowAreaState | undefined,
  formData: FormData,
): Promise<FollowAreaState> {
  const user = await getCurrentUser();
  if (!user) return { requiresLogin: true };

  const areaSlug = String(formData.get("areaSlug") ?? "");
  if (!areaSlug) return { error: "Missing area." };

  const result = await followArea(user.id, areaSlug);
  if (!result.ok) return { error: result.error };

  revalidatePath("/account");
  return { ok: true };
}

export async function unfollowAreaAction(
  _prev: FollowAreaState | undefined,
  formData: FormData,
): Promise<FollowAreaState> {
  const user = await getCurrentUser();
  if (!user) return { requiresLogin: true };

  const areaSlug = String(formData.get("areaSlug") ?? "");
  if (!areaSlug) return { error: "Missing area." };

  await unfollowArea(user.id, areaSlug);
  revalidatePath("/account");
  return { ok: true };
}

/** Same as unfollowAreaAction but void-returning, for the account page's plain <form action> without useActionState. */
export async function unfollowAreaFormAction(formData: FormData): Promise<void> {
  const user = await getCurrentUser();
  if (!user) return;

  const areaSlug = String(formData.get("areaSlug") ?? "");
  if (!areaSlug) return;

  await unfollowArea(user.id, areaSlug);
  revalidatePath("/account");
}
