import { NextRequest, NextResponse } from "next/server";
import { verifyAdminApiAccess } from "@/lib/admin-api-auth";
import { getSupabaseForAdminApi } from "@/lib/admin-api-db";
import {
  approveReferredUserForReferral,
  fetchAdminReferrals,
  releaseReferralReward,
  type AdminReferralType,
} from "@/lib/admin-referrals";

export async function GET(request: NextRequest) {
  const access = await verifyAdminApiAccess(request);
  if (!access.ok) {
    return NextResponse.json({ error: access.error }, { status: access.status });
  }

  const { searchParams } = new URL(request.url);
  const type = (searchParams.get("type") || "all") as "all" | AdminReferralType;

  try {
    const db = getSupabaseForAdminApi(request);
    const payload = await fetchAdminReferrals(db, type);
    return NextResponse.json(payload);
  } catch (error) {
    console.error("[admin/referrals GET]", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to fetch referrals." },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  const access = await verifyAdminApiAccess(request);
  if (!access.ok) {
    return NextResponse.json({ error: access.error }, { status: access.status });
  }

  try {
    const body = (await request.json()) as {
      action?: "approve_user" | "release_reward";
      referralId?: string;
      type?: AdminReferralType;
      referredUserId?: string;
    };

    const db = getSupabaseForAdminApi(request);

    if (body.action === "approve_user") {
      if (!body.referredUserId) {
        return NextResponse.json({ error: "referredUserId is required." }, { status: 400 });
      }

      const profile = await approveReferredUserForReferral(db, body.referredUserId);
      return NextResponse.json({ ok: true, profile });
    }

    if (body.action === "release_reward") {
      if (!body.referralId || !body.type) {
        return NextResponse.json(
          { error: "referralId and type are required." },
          { status: 400 }
        );
      }

      const referral = await releaseReferralReward(db, {
        referralId: body.referralId,
        type: body.type,
      });
      return NextResponse.json({ ok: true, referral });
    }

    return NextResponse.json({ error: "Unsupported action." }, { status: 400 });
  } catch (error) {
    console.error("[admin/referrals PATCH]", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to update referral." },
      { status: 500 }
    );
  }
}
