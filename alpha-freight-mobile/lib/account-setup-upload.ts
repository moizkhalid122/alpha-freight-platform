import type { IdentityDocument } from "@/lib/account-setup-types";
import { supabase } from "@/lib/supabase";

function extensionFromUri(uri: string) {
  const match = uri.match(/\.([a-zA-Z0-9]+)(?:\?|$)/);
  const ext = match?.[1]?.toLowerCase();
  if (ext === "png") return "png";
  if (ext === "webp") return "webp";
  if (ext === "heic") return "heic";
  return "jpg";
}

function contentTypeFromExtension(ext: string) {
  if (ext === "png") return "image/png";
  if (ext === "webp") return "image/webp";
  if (ext === "heic") return "image/heic";
  return "image/jpeg";
}

export async function uploadIdentityDocument(
  localUri: string,
  documentType: IdentityDocument,
  fileName?: string | null
): Promise<string> {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("Not signed in");

  const ext = extensionFromUri(localUri);
  const safeName = (fileName || `identity-${documentType}`).replace(/[^\w.-]+/g, "-");
  const path = `${user.id}/identity/${documentType}-${Date.now()}-${safeName}.${ext}`;

  const response = await fetch(localUri);
  const arrayBuffer = await response.arrayBuffer();

  const { error: uploadError } = await supabase.storage.from("pods").upload(path, arrayBuffer, {
    upsert: true,
    contentType: contentTypeFromExtension(ext),
  });

  if (uploadError) {
    const message = uploadError.message.toLowerCase();
    if (message.includes("bucket not found") || message.includes("row-level security")) {
      return localUri;
    }
    throw uploadError;
  }

  const { data: publicData } = supabase.storage.from("pods").getPublicUrl(path);
  const publicUrl = publicData?.publicUrl;
  if (!publicUrl) throw new Error("Uploaded document URL could not be generated.");
  return publicUrl;
}

export function identityDocumentExtrasKey(documentType: IdentityDocument) {
  if (documentType === "driving_licence") return "operatorLicenseUrl";
  if (documentType === "company_registration") return "companyRegistrationUrl";
  return "identityDocumentUrl";
}
