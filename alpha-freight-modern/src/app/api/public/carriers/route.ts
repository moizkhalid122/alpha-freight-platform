import { NextResponse } from "next/server";
import { buildPublicCarrierListings } from "@/lib/public-directory";
import {
  fetchPublicLoadsWithPartyRest,
  fetchPublicProfilesRest,
} from "@/lib/public-directory-rest";

export async function GET() {
  try {
    const [profiles, loads] = await Promise.all([
      fetchPublicProfilesRest("carrier"),
      fetchPublicLoadsWithPartyRest("carrier_id"),
    ]);

    const carriers = buildPublicCarrierListings(profiles, loads);
    return NextResponse.json({ carriers });
  } catch (error) {
    console.error("[public/carriers]", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Unable to fetch carriers.",
        carriers: [],
      },
      { status: 500 }
    );
  }
}
