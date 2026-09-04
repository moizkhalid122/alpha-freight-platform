import { NextRequest, NextResponse } from "next/server";
import { getAdminSupabase, isAdminServiceConfigured } from "@/lib/supabase-admin";
import type { InquiryType } from "@/lib/inquiry-content";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const VALID_TYPES = new Set<InquiryType>([
  "support",
  "contact",
  "quote",
  "partnership",
  "awards",
  "air_support",
  "carrier_support",
  "supplier_support",
  "general",
]);

export async function POST(request: NextRequest) {
  let body: {
    inquiryType?: string;
    sourcePage?: string;
    name?: string;
    email?: string;
    phone?: string;
    subject?: string;
    message?: string;
    metadata?: Record<string, unknown>;
  };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const name = body.name?.trim();
  const email = body.email?.trim().toLowerCase();
  const message = body.message?.trim() || "";
  const inquiryType = (body.inquiryType?.trim() || "general") as InquiryType;

  if (!name || !email || !message) {
    return NextResponse.json({ error: "Please complete all required fields." }, { status: 400 });
  }

  if (!EMAIL_PATTERN.test(email)) {
    return NextResponse.json({ error: "Please enter a valid email address." }, { status: 400 });
  }

  if (!VALID_TYPES.has(inquiryType)) {
    return NextResponse.json({ error: "Invalid inquiry type." }, { status: 400 });
  }

  if (!isAdminServiceConfigured()) {
    return NextResponse.json({ error: "Message storage is not configured." }, { status: 503 });
  }

  try {
    const db = getAdminSupabase();
    const { error } = await db.from("website_inquiries").insert({
      inquiry_type: inquiryType,
      source_page: body.sourcePage?.trim() || null,
      full_name: name,
      email,
      phone: body.phone?.trim() || null,
      subject: body.subject?.trim() || null,
      message,
      metadata: body.metadata ?? {},
      status: "new",
    });

    if (error) {
      console.error("[inquiries POST]", error);
      return NextResponse.json(
        {
          error:
            error.code === "42P01"
              ? "Inquiry storage is not set up yet. Please email support@alphafreightuk.com."
              : "Unable to save your message right now.",
        },
        { status: 500 },
      );
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[inquiries POST]", error);
    return NextResponse.json({ error: "Unable to save your message right now." }, { status: 500 });
  }
}
