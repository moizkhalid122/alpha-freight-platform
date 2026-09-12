"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { adminFetch } from "@/lib/admin-data-client";
import { ADMIN_CARD, ADMIN_SECTION_TITLE } from "@/lib/admin-ui";
import { adminQueryDefaults } from "@/lib/admin-query";
import { hqAdminRoute } from "@/lib/mode-admin-paths";

export default function HqUsersPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["hq-all-users"],
    queryFn: () => adminFetch<{ profiles: Record<string, unknown>[] }>("/api/admin/profiles"),
    ...adminQueryDefaults,
  });

  const profiles = data?.profiles ?? [];

  return (
    <div className="space-y-6">
      <div className={ADMIN_CARD + " p-6"}>
        <Link href={hqAdminRoute()} className="text-xs font-semibold text-gray-500 hover:text-gray-900">
          ← HQ Overview
        </Link>
        <h1 className={ADMIN_SECTION_TITLE + " mt-2"}>All platform users</h1>
        <p className="text-sm text-gray-500">{profiles.length} accounts across road, air, and sea.</p>
      </div>

      {isLoading ? (
        <p className="text-sm text-gray-500">Loading…</p>
      ) : (
        <div className="space-y-2">
          {profiles.slice(0, 100).map((profile) => (
            <div key={String(profile.id)} className={ADMIN_CARD + " p-4 text-sm"}>
              <p className="font-semibold text-gray-900">
                {String(profile.full_name || profile.company_name || profile.id)}
              </p>
              <p className="text-gray-500">
                {String(profile.role ?? "—")} · {String(profile.transport_mode ?? "road")}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
