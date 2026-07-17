import { NextRequest, NextResponse } from "next/server";
import { getAdminSupabase, isAdminServiceConfigured } from "@/lib/supabase-admin";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request: NextRequest) {
  let body: {
    enrollmentType: string;
    courseId?: string;
    courseTitle: string;
    name: string;
    email: string;
    phone?: string;
  };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const name = body.name?.trim();
  const email = body.email?.trim().toLowerCase();
  const courseTitle = body.courseTitle?.trim();
  const enrollmentType = body.enrollmentType?.trim();

  if (!name || !email || !courseTitle || !enrollmentType) {
    return NextResponse.json({ error: "Please complete all required fields." }, { status: 400 });
  }

  if (!EMAIL_PATTERN.test(email)) {
    return NextResponse.json({ error: "Please enter a valid email address." }, { status: 400 });
  }

  if (!isAdminServiceConfigured()) {
    return NextResponse.json({ error: "Enrollment storage is not configured." }, { status: 503 });
  }

  try {
    const db = getAdminSupabase();
    const { error } = await db.from("academy_enrollments").insert({
      enrollment_type: enrollmentType,
      course_id: body.courseId?.trim() || null,
      course_title: courseTitle,
      full_name: name,
      email,
      phone: body.phone?.trim() || null,
    });

    if (error) {
      console.error("[academy/enroll]", error);
      return NextResponse.json({ error: "Unable to save enrollment right now." }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[academy/enroll]", error);
    return NextResponse.json({ error: "Unable to save enrollment right now." }, { status: 500 });
  }
}
