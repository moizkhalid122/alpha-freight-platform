import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

import { getAdminSupabase, isAdminServiceConfigured } from "@/lib/supabase-admin";
import { EMPLOYEE_DOCUMENTS_BUCKET } from "@/lib/employee-onboarding";

const ALLOWED_KINDS = new Set(["photo", "cv", "id"]);

export async function POST(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;

  if (!token) {
    return NextResponse.json({ error: "Missing session. Please sign in again." }, { status: 401 });
  }

  if (!isAdminServiceConfigured()) {
    return NextResponse.json(
      {
        error:
          "Document upload is not configured on the server. Ask your admin to run employee-documents-storage.sql in Supabase and set SUPABASE_SERVICE_ROLE_KEY on Vercel.",
      },
      { status: 503 }
    );
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  const authClient = createClient(url, anonKey, {
    global: { headers: { Authorization: `Bearer ${token}` } },
  });

  const {
    data: { user },
    error: userError,
  } = await authClient.auth.getUser();

  if (userError || !user) {
    return NextResponse.json({ error: "Invalid session. Please sign in again." }, { status: 401 });
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ error: "Invalid upload request." }, { status: 400 });
  }

  const file = formData.get("file");
  const kind = String(formData.get("kind") ?? "").trim();

  if (!(file instanceof File) || !file.size) {
    return NextResponse.json({ error: "No file provided." }, { status: 400 });
  }

  if (!ALLOWED_KINDS.has(kind)) {
    return NextResponse.json({ error: "Invalid document type." }, { status: 400 });
  }

  const ext = file.name.split(".").pop()?.toLowerCase() || "bin";
  const path = `${user.id}/${kind}-${Date.now()}.${ext}`;
  const admin = getAdminSupabase();
  const bytes = Buffer.from(await file.arrayBuffer());

  const { error: uploadError } = await admin.storage.from(EMPLOYEE_DOCUMENTS_BUCKET).upload(path, bytes, {
    contentType: file.type || "application/octet-stream",
    upsert: true,
  });

  if (uploadError) {
    const hint = /bucket/i.test(uploadError.message)
      ? " Run employee-documents-storage.sql in Supabase SQL Editor."
      : "";
    return NextResponse.json(
      { error: `Upload failed: ${uploadError.message}.${hint}` },
      { status: 500 }
    );
  }

  const { data } = admin.storage.from(EMPLOYEE_DOCUMENTS_BUCKET).getPublicUrl(path);
  return NextResponse.json({ url: data.publicUrl, path });
}
