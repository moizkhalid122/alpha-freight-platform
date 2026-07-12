import { formatMoney } from "@/lib/carrier-dashboard";
import { supabase } from "@/lib/supabase";

export type InstantBookResult = {
  loadId: string;
  amount: number;
  amountLabel: string;
};

export async function bookLoadInstantly(
  loadId: string,
  amount: number
): Promise<InstantBookResult> {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("Please sign in again.");

  if (!Number.isFinite(amount) || amount <= 0) {
    throw new Error("This load does not have a valid listed rate.");
  }

  const { data: bidData, error: bidError } = await supabase
    .from("bids")
    .insert({
      load_id: loadId,
      carrier_id: user.id,
      amount,
      status: "accepted",
      created_at: new Date().toISOString(),
    })
    .select("id")
    .maybeSingle();

  if (bidError) throw bidError;
  if (!bidData?.id) throw new Error("Bid could not be created.");

  const { error: rejectError } = await supabase
    .from("bids")
    .update({ status: "rejected" })
    .eq("load_id", loadId)
    .neq("id", bidData.id);

  if (rejectError && !/policy|permission|row-level security/i.test(rejectError.message)) {
    throw rejectError;
  }

  const { data: updatedLoad, error: updateLoadError } = await supabase
    .from("loads")
    .update({ carrier_id: user.id, status: "booked" })
    .eq("id", loadId)
    .select("id, carrier_id, status")
    .maybeSingle();

  if (updateLoadError) throw updateLoadError;
  if (!updatedLoad || updatedLoad.carrier_id !== user.id || updatedLoad.status !== "booked") {
    throw new Error(
      "Load could not be assigned. Ask admin to run carrier-platform-rls-fix.sql in Supabase."
    );
  }

  return {
    loadId,
    amount,
    amountLabel: formatMoney(amount),
  };
}
