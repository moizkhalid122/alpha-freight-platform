import { supabase } from "@/lib/supabase";
import type { MarketplaceRole } from "@/lib/account-verification";

const MAX_FILE_BYTES = 8 * 1024 * 1024;
const COMPRESS_IF_LARGER_THAN = 900 * 1024;
const ALLOWED_TYPES = new Set([
  "application/pdf",
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
]);

async function compressImageIfNeeded(file: File): Promise<File> {
  if (!file.type.startsWith("image/") || file.size <= COMPRESS_IF_LARGER_THAN) {
    return file;
  }

  const bitmap = await createImageBitmap(file);
  const maxEdge = 1600;
  const scale = Math.min(1, maxEdge / Math.max(bitmap.width, bitmap.height));
  const width = Math.max(1, Math.round(bitmap.width * scale));
  const height = Math.max(1, Math.round(bitmap.height * scale));

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) return file;

  ctx.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();

  const blob = await new Promise<Blob | null>((resolve) => {
    canvas.toBlob(resolve, "image/jpeg", 0.82);
  });

  if (!blob || blob.size >= file.size) return file;

  const baseName = file.name.replace(/\.[^.]+$/, "") || "document";
  return new File([blob], `${baseName}.jpg`, { type: "image/jpeg" });
}

export async function uploadVerificationDocument(
  userId: string,
  role: MarketplaceRole,
  docKey: string,
  file: File,
) {
  if (!ALLOWED_TYPES.has(file.type)) {
    throw new Error("Upload PDF, JPG, PNG, or WEBP files only.");
  }

  if (file.size > MAX_FILE_BYTES) {
    throw new Error("Each document must be 8MB or smaller.");
  }

  const preparedFile = await compressImageIfNeeded(file);
  const extension = preparedFile.type === "application/pdf"
    ? "pdf"
    : preparedFile.name.split(".").pop()?.toLowerCase() || "jpg";

  // First path segment MUST be auth.uid() — matches carrier-pod-setup.sql storage RLS.
  const path = `${userId}/verification/${docKey}-${Date.now()}.${extension}`;

  const { error: uploadError } = await supabase.storage.from("pods").upload(path, preparedFile, {
    upsert: true,
    contentType: preparedFile.type,
  });

  if (uploadError) {
    const message = uploadError.message.toLowerCase();
    if (message.includes("policy") || message.includes("row-level security") || message.includes("violates")) {
      throw new Error(
        "Document upload blocked by storage policy. Open Supabase → SQL Editor → run carrier-pod-setup.sql, then try again.",
      );
    }
    if (message.includes("bucket not found")) {
      throw new Error(
        "Storage bucket missing. Run carrier-pod-setup.sql in Supabase SQL Editor, then try again.",
      );
    }
    throw new Error(uploadError.message);
  }

  const { data } = supabase.storage.from("pods").getPublicUrl(path);
  return data.publicUrl;
}
