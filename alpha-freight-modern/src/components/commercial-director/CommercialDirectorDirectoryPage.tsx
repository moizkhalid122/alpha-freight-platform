"use client";

import { Building2, ClipboardList, Plane, Truck, UserCog } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import CommercialPageShell from "@/components/commercial-director/CommercialPageShell";
import { DIRECTORY_ICONS } from "@/lib/commercial-director-permissions";
import { useCommercialProfiles } from "@/lib/use-commercial-metrics";

type DirectoryPageProps = {
  title: string;
  description: string;
  apiRole: "supplier" | "carrier" | "employee";
  iconKey: keyof typeof DIRECTORY_ICONS;
  nameKey?: "company_name" | "full_name";
  initialProfiles?: ProfileRow[];
};

const DIRECTORY_ICON_MAP = {
  shippers: Building2,
  forwarders: Truck,
  loads: ClipboardList,
  employees: UserCog,
  air: Plane,
} as const satisfies Record<keyof typeof DIRECTORY_ICONS, LucideIcon>;

type ProfileRow = {
  id: string;
  full_name?: string | null;
  company_name?: string | null;
  email?: string | null;
  role?: string | null;
  created_at?: string | null;
  industry?: string | null;
};

function pickProfiles(
  data: ReturnType<typeof useCommercialProfiles>["data"],
  apiRole: DirectoryPageProps["apiRole"],
  initialProfiles?: ProfileRow[]
): ProfileRow[] {
  if (data?.profiles?.length) return data.profiles;
  if (initialProfiles?.length) return initialProfiles;
  if (apiRole === "supplier" || apiRole === "carrier" || apiRole === "employee") {
    return data?.profiles ?? [];
  }
  return [];
}

export default function CommercialDirectorDirectoryPage({
  title,
  description,
  apiRole,
  iconKey,
  nameKey = "company_name",
  initialProfiles,
}: DirectoryPageProps) {
  const Icon = DIRECTORY_ICON_MAP[iconKey];
  const { data, isLoading, error, isFetching } = useCommercialProfiles(apiRole, { initialProfiles });
  const profiles = pickProfiles(data, apiRole, initialProfiles);
  const showSkeleton = profiles.length === 0 && (isLoading || isFetching) && !error;

  return (
    <CommercialPageShell title={title} description={description}>
      <section className="air-card overflow-hidden rounded-[24px]">
        <div className="flex items-center justify-between gap-3 border-b border-gray-100 px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
              <Icon className="h-4 w-4" />
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-900">{title}</p>
              <p className="text-[11px] text-gray-500">
                {showSkeleton ? "Loading network..." : `${profiles.length} total records`}
                {isFetching && !showSkeleton ? " · refreshing" : ""}
              </p>
            </div>
          </div>
        </div>

        {showSkeleton ? (
          <div className="space-y-3 p-4">
            {Array.from({ length: 8 }).map((_, index) => (
              <div key={index} className="cd-skeleton h-10 rounded-lg" />
            ))}
          </div>
        ) : error ? (
          <p className="px-4 py-10 text-[13px] text-red-600">
            {error instanceof Error ? error.message : "Unable to load records."}
          </p>
        ) : profiles.length === 0 ? (
          <p className="px-4 py-10 text-[13px] text-gray-500">No records found yet.</p>
        ) : (
          <div className="max-h-[min(70vh,720px)] overflow-auto">
            <table className="min-w-full text-left text-[13px]">
              <thead className="cd-table-head sticky top-0 z-10 border-b border-gray-100 text-[10px] font-bold uppercase tracking-wider text-gray-400">
                <tr>
                  <th className="px-4 py-3">Name</th>
                  <th className="px-4 py-3">Contact</th>
                  <th className="px-4 py-3">Role</th>
                  <th className="px-4 py-3">Joined</th>
                </tr>
              </thead>
              <tbody>
                {profiles.map((row) => (
                  <tr key={row.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50/70">
                    <td className="px-4 py-3 font-semibold text-gray-900">
                      {(nameKey === "company_name" ? row.company_name : row.full_name) ||
                        row.full_name ||
                        "—"}
                    </td>
                    <td className="px-4 py-3 text-gray-600">{row.full_name || "—"}</td>
                    <td className="px-4 py-3 capitalize text-gray-600">{row.role || "—"}</td>
                    <td className="px-4 py-3 text-gray-500">
                      {row.created_at ? new Date(row.created_at).toLocaleDateString("en-GB") : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </CommercialPageShell>
  );
}
