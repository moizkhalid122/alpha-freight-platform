import { supabaseHttpsGet } from "@/lib/supabase-node-http";
import type {
  PublicCarrierLoadRecord,
  PublicDirectoryProfileRecord,
  PublicSupplierLoadRecord,
} from "@/lib/public-directory";

const REST_TIMEOUT_MS = 12_000;

async function fetchRest<T>(table: string, query: string): Promise<T> {
  const result = await supabaseHttpsGet<T>(table, query, REST_TIMEOUT_MS);
  if (result.error) {
    throw new Error(result.error);
  }
  return result.data;
}

export async function fetchPublicProfilesRest(role: "carrier" | "supplier") {
  return fetchRest<PublicDirectoryProfileRecord[]>(
    "profiles",
    `select=*&role=eq.${role}&order=created_at.desc`
  );
}

export async function fetchPublicLoadsWithPartyRest(
  party: "carrier_id"
): Promise<PublicCarrierLoadRecord[]>;
export async function fetchPublicLoadsWithPartyRest(
  party: "supplier_id"
): Promise<PublicSupplierLoadRecord[]>;
export async function fetchPublicLoadsWithPartyRest(
  party: "carrier_id" | "supplier_id"
): Promise<PublicCarrierLoadRecord[] | PublicSupplierLoadRecord[]> {
  return fetchRest(
    "loads",
    `select=id,${party},status,created_at&${party}=not.is.null&order=created_at.desc`
  );
}
