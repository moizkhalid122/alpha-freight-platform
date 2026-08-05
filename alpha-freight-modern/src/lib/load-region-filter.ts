import { supabase } from "@/lib/supabase";
import { parseLoadMarketMeta } from "@/lib/load-market-meta";

export async function fetchSupplierCountryMap(supplierIds: string[]) {
  const uniqueIds = [...new Set(supplierIds.filter(Boolean))];
  const map = new Map<string, string>();

  if (!uniqueIds.length) return map;

  const { data } = await supabase
    .from("profiles")
    .select("id, profile_extras")
    .in("id", uniqueIds);

  for (const row of data || []) {
    const extras = (row.profile_extras ?? {}) as { countryCode?: string };
    map.set(String(row.id), String(extras.countryCode || "GB").toUpperCase());
  }

  return map;
}

export function getLoadCountryCode(
  load: { notes?: string | null; supplier_id?: string | null },
  supplierCountryMap: Map<string, string>
) {
  const fromNotes = parseLoadMarketMeta(load.notes);
  if (fromNotes?.countryCode) return fromNotes.countryCode;
  if (load.supplier_id && supplierCountryMap.has(load.supplier_id)) {
    return supplierCountryMap.get(load.supplier_id)!;
  }
  return "GB";
}

export function filterLoadsByCountry<T extends { notes?: string | null; supplier_id?: string | null }>(
  loads: T[],
  viewerCountryCode: string,
  supplierCountryMap: Map<string, string>,
  includeAllRegions = false
) {
  if (includeAllRegions) return loads;
  const viewer = viewerCountryCode.toUpperCase();
  return loads.filter((load) => getLoadCountryCode(load, supplierCountryMap) === viewer);
}
