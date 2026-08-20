"use server";

/**
 * ADMIN SERVER ACTIONS
 *
 * Every action re-checks authentication. Middleware protects the routes,
 * but Server Actions are separately addressable endpoints — relying on
 * middleware alone would leave them callable without a session. Defence
 * in depth, not paranoia: this is a documented Next.js footgun.
 */

import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { cookies, headers } from "next/headers";
import {
  audit,
  getCurrentAdmin,
  login as doLogin,
  destroySession,
  SESSION_COOKIE_NAME,
  SESSION_COOKIE_OPTIONS,
} from "./admin-auth";
import * as data from "./admin-data";
import { toOutcode, resolveGeography } from "./monetisation";
import { getAllAreas } from "./areas";

const UPLOAD_DIR = process.env.UPLOAD_DIR ?? "/app/data/uploads";
const MAX_UPLOAD_BYTES = 8 * 1024 * 1024; // 8 MB
const ALLOWED_MIME = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/avif",
  "image/svg+xml",
]);

// Deliberately narrower than ALLOWED_MIME above. This set is for uploads
// from anonymous, unauthenticated visitors (the business listing form) —
// SVG is excluded specifically because an SVG can carry embedded script
// content, a real XSS vector when the uploader isn't a trusted admin.
// Admin uploads stay on the wider set; this one is for public submission.
const PUBLIC_ALLOWED_MIME = new Set(["image/jpeg", "image/png", "image/webp"]);

/**
 * Validates and stores an uploaded image, inserting a media row.
 * Shared by admin media uploads and public listing-image uploads — the
 * only difference between callers is the MIME allowlist and whether
 * uploadedBy is a real admin id or null.
 */
async function storeUploadedImage(
  file: File,
  opts: {
    altText: string;
    uploadedBy: string | null;
    allowedMime: Set<string>;
    credit?: string | null;
    licence?: string | null;
  },
): Promise<{ ok: true; mediaId: string } | { ok: false; error: string }> {
  if (file.size === 0) return { ok: false, error: "Empty file." };
  if (file.size > MAX_UPLOAD_BYTES) return { ok: false, error: "File is too large. Maximum 8 MB." };
  if (!opts.allowedMime.has(file.type)) {
    return { ok: false, error: `Unsupported file type: ${file.type}. Use JPEG, PNG or WebP.` };
  }

  const ext = (file.name.split(".").pop() ?? "bin").toLowerCase().slice(0, 8);
  const key = `${randomUUID()}.${ext}`;
  const dest = path.join(UPLOAD_DIR, key);

  // Everything below touches the filesystem or the database — both can
  // fail for reasons entirely outside the caller's control (permissions,
  // disk full, a transient DB blip). Without this try/catch, any such
  // failure throws straight past this function and crashes the whole
  // page with an opaque Next.js error screen — confirmed happening live
  // when this upload path first shipped with an unwritable directory.
  // A form submission failing with a clear message is a minor
  // inconvenience; the same failure taking down the entire page is not.
  try {
    await mkdir(UPLOAD_DIR, { recursive: true });
    const buf = Buffer.from(await file.arrayBuffer());
    await writeFile(dest, buf);

    const mediaId = await data.insertMedia({
      filename: file.name.slice(0, 200),
      storageKey: key,
      mimeType: file.type,
      bytes: file.size,
      width: null,
      height: null,
      altText: opts.altText,
      credit: opts.credit ?? null,
      licence: opts.licence ?? null,
      uploadedBy: opts.uploadedBy,
    });

    return { ok: true, mediaId };
  } catch (err) {
    console.error("[upload] storeUploadedImage failed:", err);
    return { ok: false, error: "Could not save this image. Please try again." };
  }
}

async function requireAdmin() {
  const admin = await getCurrentAdmin();
  if (!admin) redirect("/admin/login");
  return admin;
}

async function clientIp(): Promise<string | undefined> {
  const h = await headers();
  return (
    h.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    h.get("x-real-ip") ??
    undefined
  );
}

/* ══════════════════════════════════════════════════════
   AUTH
   ══════════════════════════════════════════════════════ */
export async function loginAction(
  _prev: { error?: string } | undefined,
  formData: FormData,
): Promise<{ error?: string }> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) return { error: "Enter your email and password." };

  const h = await headers();
  const result = await doLogin(email, password, {
    ip: await clientIp(),
    userAgent: h.get("user-agent") ?? undefined,
  });

  if (!result.ok || !result.sessionId) {
    return { error: result.error ?? "Sign-in failed." };
  }

  const store = await cookies();
  store.set(SESSION_COOKIE_NAME, result.sessionId, SESSION_COOKIE_OPTIONS);
  redirect("/admin");
}

export async function logoutAction(): Promise<void> {
  await destroySession();
  redirect("/admin/login");
}

/* ══════════════════════════════════════════════════════
   MEDIA
   ══════════════════════════════════════════════════════ */
export async function uploadMediaAction(
  _prev: { error?: string; ok?: boolean } | undefined,
  formData: FormData,
): Promise<{ error?: string; ok?: boolean }> {
  const admin = await requireAdmin();

  const file = formData.get("file");
  const altText = String(formData.get("altText") ?? "").trim();
  const credit = String(formData.get("credit") ?? "").trim() || null;
  const licence = String(formData.get("licence") ?? "").trim() || null;

  if (!(file instanceof File) || file.size === 0) {
    return { error: "Choose a file to upload." };
  }
  // Alt text is mandatory, enforced here as well as in the schema.
  // An image library without alt text becomes an accessibility debt that
  // is far harder to fix retrospectively.
  if (!altText) {
    return { error: "Alt text is required — describe the image for screen readers." };
  }

  try {
    const result = await storeUploadedImage(file, {
      altText,
      uploadedBy: admin.id,
      allowedMime: ALLOWED_MIME,
      credit,
      licence,
    });
    if (!result.ok) return { error: result.error };
    const id = result.mediaId;

    await audit({
      actorId: admin.id,
      actorEmail: admin.email,
      action: "create",
      entityType: "media",
      entityKey: id,
      ip: await clientIp(),
    });

    revalidatePath("/admin/media");
    return { ok: true };
  } catch (err) {
    console.error("[admin] upload failed:", err);
    // Surface the real reason — a silent failure here wastes the user's time
    return {
      error:
        err instanceof Error && err.message.includes("EACCES")
          ? "Upload directory is not writable. Check the persistent volume mount."
          : "Upload failed. Check the server logs.",
    };
  }
}

export async function deleteMediaAction(formData: FormData): Promise<void> {
  const admin = await requireAdmin();
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  await data.softDeleteMedia(id);
  await audit({
    actorId: admin.id,
    actorEmail: admin.email,
    action: "delete",
    entityType: "media",
    entityKey: id,
    ip: await clientIp(),
  });
  revalidatePath("/admin/media");
}

/* ══════════════════════════════════════════════════════
   CONTENT OVERRIDES — image swapping and copy edits
   ══════════════════════════════════════════════════════ */
export async function saveOverrideAction(
  _prev: { error?: string; ok?: boolean } | undefined,
  formData: FormData,
): Promise<{ error?: string; ok?: boolean }> {
  const admin = await requireAdmin();

  const entityType = String(formData.get("entityType") ?? "post");
  const entityKey = String(formData.get("entityKey") ?? "").trim();
  const title = String(formData.get("title") ?? "").trim() || null;
  const description = String(formData.get("description") ?? "").trim() || null;
  const heroMediaId = String(formData.get("heroMediaId") ?? "").trim() || null;
  const hidden = formData.get("hidden") === "on";

  if (!entityKey) return { error: "Select a page to edit." };

  try {
    await data.upsertOverride({
      entityType,
      entityKey,
      title,
      description,
      heroMediaId,
      hidden,
      updatedBy: admin.id,
    });

    await audit({
      actorId: admin.id,
      actorEmail: admin.email,
      action: "update",
      entityType: `override:${entityType}`,
      entityKey,
      ip: await clientIp(),
    });

    // Regenerate the affected public page so the change is visible immediately
    revalidatePath(entityType === "post" ? `/blog/${entityKey}` : `/areas/${entityKey}`);
    revalidatePath("/admin/content");
    return { ok: true };
  } catch (err) {
    console.error("[admin] override save failed:", err);
    return { error: "Save failed. Check the server logs." };
  }
}

/* ══════════════════════════════════════════════════════
   AFFILIATE PROGRAMMES & PRODUCTS
   ══════════════════════════════════════════════════════ */
export async function createProgramAction(
  _prev: { error?: string; ok?: boolean } | undefined,
  formData: FormData,
): Promise<{ error?: string; ok?: boolean }> {
  const admin = await requireAdmin();

  const name = String(formData.get("name") ?? "").trim();
  const category = String(formData.get("category") ?? "").trim();
  const baseUrl = String(formData.get("baseUrl") ?? "").trim();
  const commissionType = String(formData.get("commissionType") ?? "").trim() || null;
  const cvRaw = String(formData.get("commissionValue") ?? "").trim();
  const commissionValue = cvRaw ? Number(cvRaw) : null;

  if (!name || !category || !baseUrl) {
    return { error: "Name, category and base URL are required." };
  }
  if (!/^https:\/\//i.test(baseUrl)) {
    return { error: "Base URL must start with https://" };
  }

  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

  try {
    await data.createProgram({
      name,
      slug,
      category,
      baseUrl,
      commissionType,
      commissionValue,
    });
    await audit({
      actorId: admin.id,
      actorEmail: admin.email,
      action: "create",
      entityType: "affiliate_program",
      entityKey: slug,
      ip: await clientIp(),
    });
    revalidatePath("/admin/affiliates");
    return { ok: true };
  } catch (err) {
    console.error("[admin] program create failed:", err);
    return { error: "Could not create — the slug may already exist." };
  }
}

export async function toggleProgramAction(formData: FormData): Promise<void> {
  const admin = await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const active = formData.get("active") === "true";
  if (!id) return;
  await data.setProgramActive(id, active);
  await audit({
    actorId: admin.id,
    actorEmail: admin.email,
    action: active ? "activate" : "deactivate",
    entityType: "affiliate_program",
    entityKey: id,
    ip: await clientIp(),
  });
  revalidatePath("/admin/affiliates");
}

export async function createProductAction(
  _prev: { error?: string; ok?: boolean } | undefined,
  formData: FormData,
): Promise<{ error?: string; ok?: boolean }> {
  const admin = await requireAdmin();

  const programId = String(formData.get("programId") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const destinationUrl = String(formData.get("destinationUrl") ?? "").trim();
  const ctaLabel = String(formData.get("ctaLabel") ?? "Learn more").trim();
  const topicsRaw = String(formData.get("matchTopics") ?? "").trim();
  const scopeType = String(formData.get("scopeType") ?? "national");
  const scopeValue = String(formData.get("scopeValue") ?? "").trim() || null;

  if (!programId || !name || !description || !destinationUrl) {
    return { error: "Programme, name, description and destination URL are required." };
  }
  if (!/^https:\/\//i.test(destinationUrl)) {
    return { error: "Destination URL must start with https://" };
  }

  const matchTopics = topicsRaw
    ? topicsRaw.split(",").map((t) => t.trim()).filter(Boolean)
    : [];
  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

  try {
    await data.createProduct({
      programId,
      name,
      slug,
      description,
      destinationUrl,
      ctaLabel,
      matchTopics,
      scopeType,
      scopeValue,
    });
    await audit({
      actorId: admin.id,
      actorEmail: admin.email,
      action: "create",
      entityType: "affiliate_product",
      entityKey: slug,
      ip: await clientIp(),
    });
    revalidatePath("/admin/affiliates");
    return { ok: true };
  } catch (err) {
    console.error("[admin] product create failed:", err);
    return { error: "Could not create — the slug may already exist." };
  }
}

export async function toggleProductAction(formData: FormData): Promise<void> {
  const admin = await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const active = formData.get("active") === "true";
  if (!id) return;
  await data.setProductActive(id, active);
  await audit({
    actorId: admin.id,
    actorEmail: admin.email,
    action: active ? "activate" : "deactivate",
    entityType: "affiliate_product",
    entityKey: id,
    ip: await clientIp(),
  });
  revalidatePath("/admin/affiliates");
}

/* ══════════════════════════════════════════════════════
   LISTINGS
   ══════════════════════════════════════════════════════ */
export async function moderateListingAction(formData: FormData): Promise<void> {
  const admin = await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const status = String(formData.get("status") ?? "") as
    | "approved"
    | "rejected"
    | "pending";
  const tier = String(formData.get("tier") ?? "").trim() || undefined;

  if (!id || !["approved", "rejected", "pending"].includes(status)) return;

  await data.setListingStatus(id, status, admin.id, tier);
  await audit({
    actorId: admin.id,
    actorEmail: admin.email,
    action: `listing_${status}`,
    entityType: "business_listing",
    entityKey: id,
    ip: await clientIp(),
  });
  revalidatePath("/admin/listings");
  // Area pages show approved listings — regenerate so the change appears
  revalidatePath("/areas", "layout");
}

/* ══════════════════════════════════════════════════════
   PUBLIC: business listing submission
   ══════════════════════════════════════════════════════ */
export async function submitListingAction(
  _prev: { error?: string; ok?: boolean } | undefined,
  formData: FormData,
): Promise<{ error?: string; ok?: boolean }> {
  const businessName = String(formData.get("businessName") ?? "").trim();
  const category = String(formData.get("category") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const website = String(formData.get("website") ?? "").trim() || null;
  const phone = String(formData.get("phone") ?? "").trim() || null;
  const email = String(formData.get("email") ?? "").trim() || null;
  const postcode = String(formData.get("postcode") ?? "").trim();

  if (!businessName || !category || !description || !postcode) {
    return { error: "Business name, category, description and postcode are required." };
  }
  if (description.length < 40) {
    return { error: "Please write at least 40 characters describing your business." };
  }
  if (website && !/^https?:\/\//i.test(website)) {
    return { error: "Website must start with http:// or https://" };
  }

  // Geographic routing: postcode → outcode → city + region, automatically
  const outcode = toOutcode(postcode);
  if (!outcode) {
    return { error: "That doesn't look like a valid UK postcode." };
  }
  const geo = resolveGeography(postcode, getAllAreas());

  const slug =
    businessName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") +
    "-" +
    outcode.toLowerCase();

  // Images are optional. If a file WAS chosen but fails validation, we
  // surface that clearly and stop — silently dropping an image the
  // business owner thought they'd attached would be more confusing than
  // an error asking them to fix the file and resubmit.
  let logoMediaId: string | null = null;
  const logoFile = formData.get("logo");
  if (logoFile instanceof File && logoFile.size > 0) {
    const result = await storeUploadedImage(logoFile, {
      altText: `${businessName} logo`,
      uploadedBy: null,
      allowedMime: PUBLIC_ALLOWED_MIME,
    });
    if (!result.ok) return { error: `Logo: ${result.error}` };
    logoMediaId = result.mediaId;
  }

  let coverMediaId: string | null = null;
  const coverFile = formData.get("coverImage");
  if (coverFile instanceof File && coverFile.size > 0) {
    const result = await storeUploadedImage(coverFile, {
      altText: `${businessName} cover photo`,
      uploadedBy: null,
      allowedMime: PUBLIC_ALLOWED_MIME,
    });
    if (!result.ok) return { error: `Cover image: ${result.error}` };
    coverMediaId = result.mediaId;
  }

  try {
    await data.createListing({
      businessName,
      slug,
      category,
      description,
      website,
      phone,
      email,
      postcode: postcode.toUpperCase(),
      outcode,
      city: geo?.city ?? null,
      region: geo?.region ?? null,
      logoMediaId,
      coverMediaId,
    });
    await audit({
      actorEmail: email ?? undefined,
      action: "listing_submitted",
      entityType: "business_listing",
      entityKey: slug,
      ip: await clientIp(),
    });
    return { ok: true };
  } catch (err) {
    console.error("[listing] submit failed:", err);
    return { error: "Submission failed. You may already be listed." };
  }
}
