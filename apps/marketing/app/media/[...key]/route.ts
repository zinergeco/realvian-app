/**
 * MEDIA SERVING
 *
 * Serves uploaded files from the persistent volume.
 *
 * SECURITY: the key is validated against a strict allowlist pattern before
 * touching the filesystem. Without this, `../../etc/passwd` becomes a path
 * traversal read of arbitrary server files — one of the most common and
 * most severe file-serving bugs.
 */

import { readFile, stat } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";

const UPLOAD_DIR = process.env.UPLOAD_DIR ?? "/app/data/uploads";

// uuid.ext only — no slashes, no dots beyond the extension
const SAFE_KEY = /^[0-9a-f-]{36}\.[a-z0-9]{1,8}$/i;

const MIME: Record<string, string> = {
  jpg: "image/jpeg", jpeg: "image/jpeg", png: "image/png",
  webp: "image/webp", avif: "image/avif", svg: "image/svg+xml",
};

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ key: string[] }> },
) {
  const { key } = await params;
  const filename = key.join("/");

  if (!SAFE_KEY.test(filename)) {
    return new NextResponse("Not found", { status: 404 });
  }

  const filePath = path.join(UPLOAD_DIR, filename);

  // Belt and braces: confirm the resolved path is still inside UPLOAD_DIR
  if (!path.resolve(filePath).startsWith(path.resolve(UPLOAD_DIR))) {
    return new NextResponse("Not found", { status: 404 });
  }

  try {
    const [buf, info] = await Promise.all([readFile(filePath), stat(filePath)]);
    const ext = filename.split(".").pop()!.toLowerCase();
    return new NextResponse(new Uint8Array(buf), {
      headers: {
        "Content-Type": MIME[ext] ?? "application/octet-stream",
        "Content-Length": String(info.size),
        "Cache-Control": "public, max-age=31536000, immutable",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch {
    return new NextResponse("Not found", { status: 404 });
  }
}
