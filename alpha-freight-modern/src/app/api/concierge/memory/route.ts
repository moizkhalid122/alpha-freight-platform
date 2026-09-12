import { createServerClient } from "@supabase/ssr";
import { NextRequest, NextResponse } from "next/server";
import type { ConciergeVoiceMemory } from "@/lib/concierge/concierge-session";
import { mergeProfileIntoMemory } from "@/lib/concierge/concierge-return-visitor";

export const runtime = "nodejs";

function createSupabaseFromRequest(request: NextRequest, response: NextResponse) {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => {
            request.cookies.set(name, value);
          });
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options);
          });
        },
      },
    },
  );
}

async function loadMergedMemory(
  request: NextRequest,
  clientMemory: ConciergeVoiceMemory = {},
): Promise<{ memory: ConciergeVoiceMemory; profile: Record<string, string | null> | null }> {
  const response = NextResponse.next();
  const supabase = createSupabaseFromRequest(request, response);
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { memory: clientMemory, profile: null };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, role, referral_code")
    .eq("id", user.id)
    .maybeSingle();

  const merged = mergeProfileIntoMemory(clientMemory, {
    ...profile,
    email: user.email || null,
  });

  return {
    memory: merged,
    profile: {
      id: user.id,
      email: user.email || null,
      full_name: profile?.full_name || null,
      role: profile?.role || null,
      referral_code: profile?.referral_code || null,
    },
  };
}

export async function GET(request: NextRequest) {
  try {
    const { memory, profile } = await loadMergedMemory(request);
    return Response.json({ profile, memory });
  } catch {
    return Response.json({ profile: null, memory: {} });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as { memory?: ConciergeVoiceMemory };
    const { memory } = await loadMergedMemory(request, body.memory || {});
    return Response.json({ ok: true, memory });
  } catch {
    return Response.json({ ok: false }, { status: 500 });
  }
}
