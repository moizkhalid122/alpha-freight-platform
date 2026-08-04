import { NextRequest, NextResponse } from "next/server";
import { getAdminSupabase, isAdminServiceConfigured } from "@/lib/supabase-admin";
import type { FeedbackType, FeedbackUserRole } from "@/lib/feedback-content";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const VALID_ROLES = new Set<FeedbackUserRole>(["carrier", "supplier", "visitor", "other"]);
const VALID_TYPES = new Set<FeedbackType>(["general", "bug", "feature", "praise", "complaint"]);

export async function POST(request: NextRequest) {
  let body: {
    name: string;
    email: string;
    phone?: string;
    userRole?: string;
    feedbackType?: string;
    rating?: number;
    subject?: string;
    message?: string;
    pageUrl?: string;
  };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const name = body.name?.trim();
  const email = body.email?.trim().toLowerCase();
  const message = body.message?.trim() || "";
  const userRole = (body.userRole?.trim() || "visitor") as FeedbackUserRole;
  const feedbackType = (body.feedbackType?.trim() || "general") as FeedbackType;

  if (!name || !email) {
    return NextResponse.json({ error: "Please complete all required fields." }, { status: 400 });
  }

  if (!EMAIL_PATTERN.test(email)) {
    return NextResponse.json({ error: "Please enter a valid email address." }, { status: 400 });
  }

  if (!VALID_ROLES.has(userRole)) {
    return NextResponse.json({ error: "Invalid user role." }, { status: 400 });
  }

  if (!VALID_TYPES.has(feedbackType)) {
    return NextResponse.json({ error: "Invalid feedback type." }, { status: 400 });
  }

  const rating =
    typeof body.rating === "number" && body.rating >= 1 && body.rating <= 5
      ? Math.round(body.rating)
      : null;

  if (!rating) {
    return NextResponse.json({ error: "Please select a star rating." }, { status: 400 });
  }

  if (!isAdminServiceConfigured()) {
    return NextResponse.json({ error: "Feedback storage is not configured." }, { status: 503 });
  }

  try {
    const db = getAdminSupabase();
    const { error } = await db.from("user_feedback").insert({
      full_name: name,
      email,
      phone: body.phone?.trim() || null,
      user_role: userRole,
      feedback_type: feedbackType,
      rating,
      subject: body.subject?.trim() || null,
      message,
      page_url: body.pageUrl?.trim() || null,
      status: "new",
    });

    if (error) {
      console.error("[feedback POST]", error);
      return NextResponse.json({ error: "Unable to save feedback right now." }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[feedback POST]", error);
    return NextResponse.json({ error: "Unable to save feedback right now." }, { status: 500 });
  }
}
