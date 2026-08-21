"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUser } from "./public-auth";
import {
  addToWatchlist,
  updateWatchlistStatus,
  removeFromWatchlist,
  WATCHLIST_STATUSES,
  type WatchlistStatus,
} from "./property-watchlist";

export interface WatchlistActionState {
  ok?: boolean;
  error?: string;
}

export async function addWatchlistAction(
  _prev: WatchlistActionState | undefined,
  formData: FormData,
): Promise<WatchlistActionState> {
  const user = await getCurrentUser();
  if (!user) return { error: "Sign in to add a property." };

  const nickname = String(formData.get("nickname") ?? "").trim();
  const postcode = String(formData.get("postcode") ?? "").trim();
  if (!nickname || !postcode) {
    return { error: "Give it a name and a postcode." };
  }

  const priceRaw = String(formData.get("price") ?? "").trim();
  const price = priceRaw ? Number(priceRaw) : null;
  if (priceRaw && (Number.isNaN(price) || (price ?? 0) < 0)) {
    return { error: "Price must be a positive number." };
  }

  const listingUrl = String(formData.get("listingUrl") ?? "").trim() || null;
  if (listingUrl && !/^https:\/\//.test(listingUrl)) {
    return { error: "Listing link must start with https://" };
  }

  const notes = String(formData.get("notes") ?? "").trim() || null;

  const result = await addToWatchlist(user.id, { nickname, postcode, price, listingUrl, notes });
  if (!result.ok) return { error: result.error };

  revalidatePath("/account/properties");
  return { ok: true };
}

export async function updateWatchlistStatusAction(formData: FormData): Promise<void> {
  const user = await getCurrentUser();
  if (!user) return;

  const id = String(formData.get("id") ?? "");
  const status = String(formData.get("status") ?? "");
  if (!id || !(WATCHLIST_STATUSES as readonly string[]).includes(status)) return;

  await updateWatchlistStatus(user.id, id, status as WatchlistStatus);
  revalidatePath("/account/properties");
}

export async function removeWatchlistAction(formData: FormData): Promise<void> {
  const user = await getCurrentUser();
  if (!user) return;

  const id = String(formData.get("id") ?? "");
  if (!id) return;

  await removeFromWatchlist(user.id, id);
  revalidatePath("/account/properties");
}
