import { randomUUID } from "crypto";
import { NextRequest, NextResponse } from "next/server";

import { EDITOR_INTAKE_BUCKET, editorIntakePath } from "@/lib/editor-intake-path";
import { getAdminSupabase, isAdminServiceConfigured } from "@/lib/supabase-admin";

export const runtime = "nodejs";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type EditorIntakePayload = {
  submissionId?: string;
  fullName?: string;
  gender?: string;
  email?: string;
  phone?: string;
  whatsapp?: string;
  city?: string;
  country?: string;
  address?: string;
  editorRole?: string;
  portfolioUrl?: string;
  linkedinUrl?: string;
  instagramUrl?: string;
  tools?: string;
  experienceYears?: string;
  startDate?: string;
  equipment?: string;
  about?: string;
  photoUpload?: { path?: string; url?: string };
  idUpload?: { path?: string; url?: string };
};

function read(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function isValidUpload(
  upload: EditorIntakePayload["photoUpload"],
  submissionId: string,
  kind: "photo" | "id",
) {
  const path = read(upload?.path);
  const url = read(upload?.url);
  const supabaseHost = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/^https?:\/\//, "").replace(/\/+$/, "");

  if (!path || !url || !supabaseHost) return false;
  if (!path.startsWith(`${submissionId}/${kind}-`)) return false;
  if (!url.includes(supabaseHost) || !url.includes(EDITOR_INTAKE_BUCKET)) return false;
  return true;
}

export async function POST(request: NextRequest) {
  if (!isAdminServiceConfigured()) {
    return NextResponse.json({ error: "Form storage is not configured on the server." }, { status: 503 });
  }

  let body: EditorIntakePayload;
  try {
    body = (await request.json()) as EditorIntakePayload;
  } catch {
    return NextResponse.json({ error: "Invalid form submission." }, { status: 400 });
  }

  const submissionId = read(body.submissionId) || randomUUID();
  const fullName = read(body.fullName);
  const gender = read(body.gender);
  const email = read(body.email).toLowerCase();
  const phone = read(body.phone);
  const portfolioUrl = read(body.portfolioUrl);
  const editorRole = read(body.editorRole) || "video_editor";

  if (!fullName || !email || !phone || !portfolioUrl) {
    return NextResponse.json({ error: "Please complete all required fields." }, { status: 400 });
  }

  if (gender !== "male" && gender !== "female") {
    return NextResponse.json({ error: "Please select gender." }, { status: 400 });
  }

  if (!EMAIL_PATTERN.test(email)) {
    return NextResponse.json({ error: "Please enter a valid email address." }, { status: 400 });
  }

  if (!isValidUpload(body.photoUpload, submissionId, "photo")) {
    return NextResponse.json({ error: "Profile photo upload is missing or invalid." }, { status: 400 });
  }

  if (!isValidUpload(body.idUpload, submissionId, "id")) {
    return NextResponse.json({ error: "ID document upload is missing or invalid." }, { status: 400 });
  }

  const photoUpload = body.photoUpload!;
  const idUpload = body.idUpload!;

  try {
    const admin = getAdminSupabase();

    const metadata = {
      submission_id: submissionId,
      gender,
      whatsapp: read(body.whatsapp) || null,
      city: read(body.city) || null,
      country: read(body.country) || null,
      address: read(body.address) || null,
      editor_role: editorRole,
      portfolio_url: portfolioUrl,
      linkedin_url: read(body.linkedinUrl) || null,
      instagram_url: read(body.instagramUrl) || null,
      tools: read(body.tools) || null,
      experience_years: read(body.experienceYears) || null,
      preferred_start_date: read(body.startDate) || null,
      equipment: read(body.equipment) || null,
      photo_url: photoUpload.url,
      photo_path: photoUpload.path,
      id_document_url: idUpload.url,
      id_document_path: idUpload.path,
    };

    const about = read(body.about);
    const message = [
      `Role: ${editorRole}`,
      `Gender: ${gender === "male" ? "Male" : "Female"}`,
      `Portfolio: ${portfolioUrl}`,
      `Photo: ${photoUpload.url}`,
      `ID: ${idUpload.url}`,
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
      about || "No additional notes provided.",
    ]
      .filter(Boolean)
      .join("\n");

    const { error } = await admin.from("website_inquiries").insert({
      inquiry_type: "editor_intake",
      source_page: editorIntakePath(),
      full_name: fullName,
      email,
      phone,
      subject: `Editor intake — ${editorRole}`,
      message,
      metadata,
      status: "new",
    });

    if (error) {
      console.error("[editor-intake POST]", error);
      return NextResponse.json(
        {
          error:
            error.code === "42P01"
              ? "Inquiry storage is not set up yet. Run website-inquiries.sql in Supabase."
              : "Unable to save your submission right now.",
        },
        { status: 500 },
      );
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[editor-intake POST]", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to submit the form." },
      { status: 500 },
    );
  }
}
