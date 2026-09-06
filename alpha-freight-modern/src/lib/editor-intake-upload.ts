import { createClient } from "@supabase/supabase-js";
import { EDITOR_INTAKE_BUCKET, editorIntakePath } from "@/lib/editor-intake-path";

const MAX_BYTES = 8 * 1024 * 1024;

/** Public form — always use anon role (ignore any logged-in site session). */
function editorIntakeClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) {
    throw new Error("Form is not configured. Contact the team.");
  }
  return createClient(url, anonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });
}

export type EditorIntakeUpload = { path: string; url: string };

function uploadErrorMessage(error: { message: string }, kind: "photo" | "id") {
  const raw = error.message;
  if (/bucket/i.test(raw)) {
    return `Storage bucket missing for ${kind}. Run editor-intake-storage.sql in Supabase SQL Editor.`;
  }
  if (/policy|row-level security|violates|permission/i.test(raw)) {
    return `Upload blocked for ${kind}. Run editor-intake-storage.sql in Supabase SQL Editor, then try again.`;
  }
  if (/fetch failed|network|timeout/i.test(raw)) {
    return `Could not upload ${kind}. Check your internet connection and try again.`;
  }
  return `Upload failed (${kind}): ${raw}`;
}

function saveErrorMessage(error: { message: string; code?: string }) {
  if (error.code === "42P01") {
    return "Inquiry table missing. Run website-inquiries.sql in Supabase.";
  }
  if (/policy|row-level security|violates|permission/i.test(error.message)) {
    return "Could not save form. Run editor-intake-inquiries.sql in Supabase SQL Editor.";
  }
  return error.message || "Unable to save your submission right now.";
}

export async function uploadEditorIntakeFile(
  submissionId: string,
  kind: "photo" | "id",
  file: File,
): Promise<EditorIntakeUpload> {
  if (!file.size) {
    throw new Error(kind === "photo" ? "Profile photo is required." : "ID document is required.");
  }
  if (file.size > MAX_BYTES) {
    throw new Error(`${kind === "photo" ? "Profile photo" : "ID document"} must be 8MB or smaller.`);
  }

  const ext = file.name.split(".").pop()?.toLowerCase() || "bin";
  const path = `${submissionId}/${kind}-${Date.now()}.${ext}`;

  const client = editorIntakeClient();
  const { error } = await client.storage.from(EDITOR_INTAKE_BUCKET).upload(path, file, {
    contentType: file.type || "application/octet-stream",
    upsert: false,
  });

  if (error) {
    throw new Error(uploadErrorMessage(error, kind));
  }

  const { data } = client.storage.from(EDITOR_INTAKE_BUCKET).getPublicUrl(path);
  return { path, url: data.publicUrl };
}

type SaveEditorIntakeInput = {
  submissionId: string;
  fullName: string;
  gender: string;
  email: string;
  phone: string;
  whatsapp: string;
  city: string;
  country: string;
  address: string;
  editorRole: string;
  portfolioUrl: string;
  linkedinUrl: string;
  instagramUrl: string;
  tools: string;
  experienceYears: string;
  startDate: string;
  equipment: string;
  about: string;
  photoUpload: EditorIntakeUpload;
  idUpload: EditorIntakeUpload;
};

export async function saveEditorIntakeSubmission(input: SaveEditorIntakeInput) {
  const metadata = {
    submission_id: input.submissionId,
    gender: input.gender,
    whatsapp: input.whatsapp || null,
    city: input.city || null,
    country: input.country || null,
    address: input.address || null,
    editor_role: input.editorRole,
    portfolio_url: input.portfolioUrl,
    linkedin_url: input.linkedinUrl || null,
    instagram_url: input.instagramUrl || null,
    tools: input.tools || null,
    experience_years: input.experienceYears || null,
    preferred_start_date: input.startDate || null,
    equipment: input.equipment || null,
    photo_url: input.photoUpload.url,
    photo_path: input.photoUpload.path,
    id_document_url: input.idUpload.url,
    id_document_path: input.idUpload.path,
  };

  const message = [
    `Role: ${input.editorRole}`,
    `Gender: ${input.gender === "male" ? "Male" : "Female"}`,
    `Portfolio: ${input.portfolioUrl}`,
    `Photo: ${input.photoUpload.url}`,
    `ID: ${input.idUpload.url}`,
    metadata.experience_years ? `Experience: ${metadata.experience_years} years` : null,
    metadata.preferred_start_date ? `Preferred start: ${metadata.preferred_start_date}` : null,
    metadata.linkedin_url ? `LinkedIn: ${metadata.linkedin_url}` : null,
    metadata.instagram_url ? `Instagram: ${metadata.instagram_url}` : null,
    metadata.tools ? `Tools: ${metadata.tools}` : null,
    metadata.equipment ? `Equipment: ${metadata.equipment}` : null,
    metadata.whatsapp ? `WhatsApp: ${metadata.whatsapp}` : null,
    [metadata.city, metadata.country].filter(Boolean).join(", ")
      ? `Location: ${[metadata.city, metadata.country].filter(Boolean).join(", ")}`
      : null,
    metadata.address ? `Address: ${metadata.address}` : null,
    "",
    input.about || "No additional notes provided.",
  ]
    .filter(Boolean)
    .join("\n");

  const { error } = await editorIntakeClient().from("website_inquiries").insert({
    inquiry_type: "editor_intake",
    source_page: editorIntakePath(),
    full_name: input.fullName,
    email: input.email.toLowerCase(),
    phone: input.phone,
    subject: `Editor intake — ${input.editorRole}`,
    message,
    metadata,
    status: "new",
  });

  if (error) {
    throw new Error(saveErrorMessage(error));
  }
}
