import { createClient } from "@supabase/supabase-js";
import { getAdminSupabase, isAdminServiceConfigured } from "@/lib/supabase-admin";
import {
  buildPublicCarrierListings,
  buildPublicSupplierListings,
} from "@/lib/public-directory";

export async function getPublicDirectoryProfileIds() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    return { carrierIds: [] as string[], supplierIds: [] as string[] };
  }

  try {
    const db = isAdminServiceConfigured()
      ? getAdminSupabase()
      : createClient(url, anonKey);

    const [profilesResult, carrierLoadsResult, supplierLoadsResult] = await Promise.all([
      db.from("profiles").select("*"),
      db
        .from("loads")
        .select("id, carrier_id, status, created_at")
        .not("carrier_id", "is", null),
      db
        .from("loads")
        .select("id, supplier_id, status, created_at")
        .not("supplier_id", "is", null),
    ]);

    const profiles = profilesResult.data ?? [];
    const carriers = buildPublicCarrierListings(
      profiles.filter((profile) => profile.role === "carrier"),
      carrierLoadsResult.data ?? [],
    );
    const suppliers = buildPublicSupplierListings(
      profiles.filter((profile) => profile.role === "supplier"),
      supplierLoadsResult.data ?? [],
    );

    return {
      carrierIds: carriers.map((carrier) => carrier.id),
      supplierIds: suppliers.map((supplier) => supplier.id),
    };
  } catch {
    return { carrierIds: [], supplierIds: [] };
  }
}
