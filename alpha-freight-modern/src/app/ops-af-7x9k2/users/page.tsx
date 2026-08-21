"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  type ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import AdminSelect from "@/components/admin/AdminSelect";
import { format } from "date-fns";
import { Loader2, Search, ShieldAlert } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  ADMIN_CARD,
  ADMIN_CARD_INTERACTIVE,
  ADMIN_INPUT,
  ADMIN_SECTION_LABEL,
  ADMIN_SECTION_TITLE,
  adminSelectStyles,
} from "@/lib/admin-ui";
import { adminProfilesQueryFn, adminProfilesQueryKey, adminQueryDefaults } from "@/lib/admin-query";
import { readCarrierExtras, readSupplierExtras } from "@/lib/profile-extras";

type UserRow = {
  name: string;
  role: "Carrier" | "Supplier" | "Admin" | "Other";
  status: "Active" | "Pending Verification" | "Review Required";
  joinedAt: string;
};

type ProfileRecord = {
  id: string;
  full_name?: string | null;
  company_name?: string | null;
  role?: string | null;
  created_at?: string | null;
  status?: string | null;
  verification_status?: string | null;
  is_approved?: boolean | null;
};

const roleOptions = [
  { value: "All", label: "All roles" },
  { value: "Carrier", label: "Carrier" },
  { value: "Supplier", label: "Supplier" },
  { value: "Admin", label: "Admin" },
];

const statusOptions = [
  { value: "All", label: "All statuses" },
  { value: "Active", label: "Active" },
  { value: "Pending Verification", label: "Pending verification" },
  { value: "Review Required", label: "Review required" },
];

function normalizeStatus(value: string | null | undefined) {
  return String(value || "").trim().toLowerCase();
}

function formatRole(role: string | null | undefined): UserRow["role"] {
  const normalized = normalizeStatus(role);
  if (normalized === "carrier") return "Carrier";
  if (normalized === "supplier") return "Supplier";
  if (normalized === "admin") return "Admin";
  return "Other";
}

function deriveStatus(
  profile: ProfileRecord,
  extras: { verificationStatus?: string; accountStatus?: string } | Record<string, unknown>
) {
  const verificationStatus =
    "verificationStatus" in extras ? String(extras.verificationStatus ?? "") : "";
  const accountStatus = "accountStatus" in extras ? String(extras.accountStatus ?? "") : "";
  const verification = normalizeStatus(verificationStatus || profile.verification_status);
  const account = normalizeStatus(accountStatus || profile.status);

  if (verification === "verified" || profile.is_approved === true || account === "active") {
    return "Active" as const;
  }
  if (verification === "pending" || account === "pending" || account === "pending_verification") {
    return "Pending Verification" as const;
  }
  return "Review Required" as const;
}

function buildUserRows(profiles: ProfileRecord[]): UserRow[] {
  return profiles
    .filter((profile) => normalizeStatus(profile.role) !== "employee")
    .map((profile) => {
      const role = formatRole(profile.role);
      const extras =
        role === "Carrier"
          ? readCarrierExtras(profile.id)
          : role === "Supplier"
            ? readSupplierExtras(profile.id)
            : {};

      const name =
        role === "Carrier"
          ? extras.companyName?.trim() ||
            profile.company_name?.trim() ||
            profile.full_name?.trim() ||
            `Carrier ${profile.id.slice(0, 8)}`
          : role === "Supplier"
            ? extras.companyName?.trim() ||
              profile.company_name?.trim() ||
              profile.full_name?.trim() ||
              `Supplier ${profile.id.slice(0, 8)}`
            : profile.full_name?.trim() ||
              profile.company_name?.trim() ||
              `Account ${profile.id.slice(0, 8)}`;

      return {
        name,
        role,
        status: deriveStatus(profile, extras),
        joinedAt: profile.created_at ?? new Date(0).toISOString(),
      };
    });
}

export default function AdminUsersPage() {
  const [search, setSearch] = useState("");
  const [role, setRole] = useState(roleOptions[0]);
  const [status, setStatus] = useState(statusOptions[0]);

  const profilesQuery = useQuery({
    queryKey: adminProfilesQueryKey("all"),
    queryFn: adminProfilesQueryFn(),
    ...adminQueryDefaults,
  });

  const data = useMemo(() => {
    if (!profilesQuery.data) return [];
    return buildUserRows((profilesQuery.data.profiles ?? []) as ProfileRecord[]);
  }, [profilesQuery.data]);

  const metrics = useMemo(
    () => [
      { label: "Total accounts", value: String(data.length) },
      {
        label: "Pending verification",
        value: String(data.filter((row) => row.status === "Pending Verification").length),
      },
      {
        label: "Review required",
        value: String(data.filter((row) => row.status === "Review Required").length),
      },
    ],
    [data]
  );

  const filteredData = useMemo(() => {
    return data.filter((row) => {
      const matchesSearch =
        row.name.toLowerCase().includes(search.toLowerCase()) ||
        row.role.toLowerCase().includes(search.toLowerCase());
      const matchesRole = role.value === "All" || row.role === role.value;
      const matchesStatus = status.value === "All" || row.status === status.value;

      return matchesSearch && matchesRole && matchesStatus;
    });
  }, [data, role.value, search, status.value]);

  const columns = useMemo<ColumnDef<UserRow>[]>(
    () => [
      {
        accessorKey: "name",
        header: "Account",
        cell: ({ row }) => (
          <div>
            <p className="font-black tracking-tight text-slate-950">{row.original.name}</p>
            <p className="mt-1 text-xs text-slate-500">
              Joined{" "}
              {row.original.joinedAt
                ? format(new Date(row.original.joinedAt), "dd MMM yyyy")
                : "Unknown"}
            </p>
          </div>
        ),
      },
      {
        accessorKey: "role",
        header: "Role",
        cell: ({ getValue }) => (
          <span className="rounded-full bg-slate-100 px-3 py-1 text-[11px] font-black uppercase tracking-[0.16em] text-slate-600">
            {String(getValue())}
          </span>
        ),
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ getValue }) => {
          const value = String(getValue());
          return (
            <span className="rounded-full bg-[#BFFF07] px-3 py-1 text-[11px] font-black uppercase tracking-[0.16em] text-slate-950">
              {value}
            </span>
          );
        },
      },
    ],
    []
  );

  // eslint-disable-next-line react-hooks/incompatible-library
  const table = useReactTable({
    data: filteredData,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  const isLoading = profilesQuery.isLoading && !profilesQuery.data;

  return (
    <div className="admin-page-stack space-y-4">
      <section className={cn(ADMIN_CARD, "p-5 sm:p-6")}>
        <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <p className={ADMIN_SECTION_LABEL}>User Management</p>
            <h2 className={cn(ADMIN_SECTION_TITLE, "mt-1")}>
              Live accounts across carriers, suppliers, and admins
            </h2>
            <p className="mt-2 max-w-3xl text-[13px] leading-6 text-slate-500">
              Employee accounts are managed under HR. This view shows marketplace and admin profiles from Supabase.
            </p>
          </div>

          <div className="grid gap-2.5 sm:grid-cols-3">
            {metrics.map((metric) => (
              <div key={metric.label} className={cn(ADMIN_CARD, "px-3.5 py-3")}>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">{metric.label}</p>
                <p className="mt-1.5 text-xl font-bold tracking-tight text-slate-900">{metric.value}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className={cn(ADMIN_CARD, ADMIN_CARD_INTERACTIVE, "p-5")}>
        <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex flex-1 items-center gap-2.5 rounded-lg border border-slate-200/90 bg-slate-50/80 px-3 py-2">
            <Search className="h-3.5 w-3.5 text-slate-400" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search account name or role"
              className={cn(ADMIN_INPUT, "h-auto border-0 bg-transparent p-0 ring-0 focus:ring-0")}
            />
          </div>

          <div className="grid gap-2.5 md:grid-cols-2 xl:w-[420px]">
            <AdminSelect
              options={roleOptions}
              value={role}
              onChange={(option) => setRole(option ?? roleOptions[0])}
              unstyled
              classNames={adminSelectStyles()}
            />
            <AdminSelect
              options={statusOptions}
              value={status}
              onChange={(option) => setStatus(option ?? statusOptions[0])}
              unstyled
              classNames={adminSelectStyles()}
            />
          </div>
        </div>

        {isLoading ? (
          <div className="mt-6 flex items-center justify-center gap-2 py-16 text-sm text-slate-500">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading live accounts...
          </div>
        ) : (
          <div className="mt-4 overflow-hidden rounded-lg border border-slate-200/90">
            <table className="min-w-full border-collapse">
              <thead className="border-b border-slate-100 bg-slate-50/90">
                {table.getHeaderGroups().map((headerGroup) => (
                  <tr key={headerGroup.id}>
                    {headerGroup.headers.map((header) => (
                      <th
                        key={header.id}
                        className="px-4 py-2.5 text-left text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-500"
                      >
                        {header.isPlaceholder
                          ? null
                          : flexRender(header.column.columnDef.header, header.getContext())}
                      </th>
                    ))}
                  </tr>
                ))}
              </thead>
              <tbody className="bg-white">
                {table.getRowModel().rows.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="px-4 py-10 text-center text-sm text-slate-500">
                      No accounts match your filters.
                    </td>
                  </tr>
                ) : (
                  table.getRowModel().rows.map((row) => (
                    <tr key={row.id} className="border-t border-slate-100">
                      {row.getVisibleCells().map((cell) => (
                        <td key={cell.id} className="px-4 py-2.5 align-middle text-[13px]">
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </td>
                      ))}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        <div className="mt-4 flex items-center gap-2 rounded-lg border border-amber-100 bg-amber-50/90 px-3.5 py-3 text-[13px] text-amber-900">
          <ShieldAlert className="h-4 w-4" />
          Focus first on pending verification and review required accounts to keep the marketplace clean.
        </div>
      </section>
    </div>
  );
}
