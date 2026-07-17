import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getAdminSupabase, isAdminServiceConfigured } from "@/lib/supabase-admin";
import {
  buildPublicTrackingResult,
  isPublicTrackableLoad,
  matchLoadByReference,
  parseLoadReference,
  type RateLoadRow,
} from "@/lib/freight-tools";

const TRACK_LOAD_SELECT =
  "id, origin, destination, pickup_location, delivery_location, equipment, status, carrier_id, pickup_date, created_at";

async function fetchRecentLoads(): Promise<RateLoadRow[]> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) return [];

  const db = isAdminServiceConfigured()
    ? getAdminSupabase()
    : createClient(url, anonKey);

  const { data, error } = await db
    .from("loads")
    .select(TRACK_LOAD_SELECT)
    .order("created_at", { ascending: false })
    .limit(400);

  if (error) {
    console.error("[public/track loads]", error);
    return [];
  }

  return (data ?? []) as RateLoadRow[];
}

async function fetchLiveTrackingMeta(loadId: string) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) return { active: false, lastUpdate: null as string | null };

  const db = isAdminServiceConfigured()
    ? getAdminSupabase()
    : createClient(url, anonKey);

  const { data, error } = await db
    .from("load_live_tracking")
    .select("tracking_active, last_recorded_at, updated_at")
    .eq("load_id", loadId)
    .maybeSingle();

  if (error || !data) {
    return { active: false, lastUpdate: null };
  }

  return {
    active: Boolean(data.tracking_active),
    lastUpdate: (data.last_recorded_at as string | null) ?? (data.updated_at as string | null) ?? null,
  };
}

export async function GET(request: NextRequest) {
  const reference = request.nextUrl.searchParams.get("ref")?.trim() || "";

  if (!reference) {
    return NextResponse.json({ error: "Load reference is required (e.g. AF-1A2B3C4D)." }, { status: 400 });
  }

  if (!parseLoadReference(reference)) {
    return NextResponse.json({ error: "Invalid reference format. Use AF-XXXXXXXX." }, { status: 400 });
  }

  try {
    const loads = await fetchRecentLoads();
    const load = matchLoadByReference(loads, reference);

    if (!load) {
      return NextResponse.json({ error: "No shipment found for that reference." }, { status: 404 });
    }

    if (!isPublicTrackableLoad(load)) {
      return NextResponse.json(
        {
          error: "This load is not yet booked with a carrier or is not available for public tracking.",
        },
        { status: 403 },
      );
    }

    const live = await fetchLiveTrackingMeta(load.id);
    const tracking = buildPublicTrackingResult(load, {
      liveTrackingActive: live.active,
      lastUpdate: live.lastUpdate,
    });

    return NextResponse.json({ tracking });
  } catch (error) {
    console.error("[public/track GET]", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to fetch tracking." },
      { status: 500 },
    );
  }
}
