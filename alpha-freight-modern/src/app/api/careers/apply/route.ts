import { NextRequest, NextResponse } from "next/server";
import { getAdminSupabase, isAdminServiceConfigured } from "@/lib/supabase-admin";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type ApplicationPayload = {
  roleSlug: string;
  roleTitle: string;
  name: string;
  email: string;
  phone?: string;
  linkedin?: string;
  portfolio?: string;
  coverLetter: string;
};

export async function POST(request: NextRequest) {
  let body: ApplicationPayload;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const name = body.name?.trim();
  const email = body.email?.trim().toLowerCase();
  const coverLetter = body.coverLetter?.trim();
  const roleSlug = body.roleSlug?.trim();
  const roleTitle = body.roleTitle?.trim();

  if (!name || !email || !coverLetter || !roleSlug || !roleTitle) {
    return NextResponse.json({ error: "Please complete all required fields." }, { status: 400 });
  }

  if (!EMAIL_PATTERN.test(email)) {
    return NextResponse.json(
      { error: "Please enter a valid email address (example: you@company.com)." },
      { status: 400 },
    );
  }

  if (coverLetter.length < 20) {
    return NextResponse.json(
      { error: "Please write a short cover letter (at least 20 characters)." },
      { status: 400 },
    );
  }

  if (!isAdminServiceConfigured()) {
    return NextResponse.json(
      { error: "Application storage is not configured on the server." },
      { status: 503 },
    );
  }

  try {
    const db = getAdminSupabase();
    const { error } = await db.from("career_applications").insert({
      role_slug: roleSlug,
      role_title: roleTitle,
      full_name: name,
      email,
      phone: body.phone?.trim() || null,
      linkedin: body.linkedin?.trim() || null,
      portfolio: body.portfolio?.trim() || null,
      cover_letter: coverLetter,
    });

    if (error) {
      console.error("[careers/apply]", error);
      return NextResponse.json(
        {
          error:
            error.code === "42P01"
              ? "Applications table is not set up yet. Please contact support@alphafreightuk.com."
              : "Unable to save your application right now.",
        },
        { status: 500 },
      );
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[careers/apply]", error);
    return NextResponse.json({ error: "Unable to save your application right now." }, { status: 500 });
  }
}
