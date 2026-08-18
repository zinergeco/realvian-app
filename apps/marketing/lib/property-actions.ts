"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUser } from "./public-auth";
import { addProperty, updatePropertyDates, deleteProperty } from "./properties";

export interface PropertyActionState {
  ok?: boolean;
  error?: string;
}

function strOrNull(formData: FormData, key: string): string | null {
  const v = String(formData.get(key) ?? "").trim();
  return v || null;
}

export async function addPropertyAction(
  _prev: PropertyActionState | undefined,
  formData: FormData,
): Promise<PropertyActionState> {
  const user = await getCurrentUser();
  if (!user) return { error: "Sign in to add a property." };

  const nickname = String(formData.get("nickname") ?? "").trim();
  const postcode = String(formData.get("postcode") ?? "").trim();
  if (!nickname || !postcode) {
    return { error: "Give the property a name and a postcode." };
  }

  const result = await addProperty(user.id, {
    nickname,
    postcode,
    epcRating: strOrNull(formData, "epcRating"),
    epcExpiry: strOrNull(formData, "epcExpiry"),
    gasSafetyExpiry: strOrNull(formData, "gasSafetyExpiry"),
    eicrExpiry: strOrNull(formData, "eicrExpiry"),
    notes: strOrNull(formData, "notes"),
  });

  if (!result.ok) return { error: result.error };

  revalidatePath("/portals/landlord");
  return { ok: true };
}

export async function updatePropertyDatesAction(
  _prev: PropertyActionState | undefined,
  formData: FormData,
): Promise<PropertyActionState> {
  const user = await getCurrentUser();
  if (!user) return { error: "Sign in to update this property." };

  const id = String(formData.get("id") ?? "");
  if (!id) return { error: "Missing property." };

  const ok = await updatePropertyDates(user.id, id, {
    epcRating: strOrNull(formData, "epcRating"),
    epcExpiry: strOrNull(formData, "epcExpiry"),
    gasSafetyExpiry: strOrNull(formData, "gasSafetyExpiry"),
    eicrExpiry: strOrNull(formData, "eicrExpiry"),
  });

  if (!ok) return { error: "Could not update — that property may not exist." };

  revalidatePath("/portals/landlord");
  return { ok: true };
}

export async function deletePropertyAction(formData: FormData): Promise<void> {
  const user = await getCurrentUser();
  if (!user) return;

  const id = String(formData.get("id") ?? "");
  if (!id) return;

  await deleteProperty(user.id, id);
  revalidatePath("/portals/landlord");
}
