import { NextResponse } from "next/server";
import { buildPublicSupplierListings } from "@/lib/public-directory";
import {
  fetchPublicLoadsWithPartyRest,
  fetchPublicProfilesRest,
} from "@/lib/public-directory-rest";

export async function GET() {
  try {
    const [profiles, loads] = await Promise.all([
      fetchPublicProfilesRest("supplier"),
      fetchPublicLoadsWithPartyRest("supplier_id"),
    ]);

    const suppliers = buildPublicSupplierListings(profiles, loads);
    return NextResponse.json({ suppliers });
  } catch (error) {
    console.error("[public/suppliers]", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Unable to fetch suppliers.",
        suppliers: [],
      },
      { status: 500 }
    );
  }
}
