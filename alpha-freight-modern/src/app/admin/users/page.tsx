"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  type ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import Select from "react-select";
import { format } from "date-fns";
import { Search, ShieldAlert } from "lucide-react";

type UserRow = {
  name: string;
  role: "Carrier" | "Supplier" | "Admin";
  status: "Active" | "Pending Verification" | "Review Required";
  joinedAt: string;
  score: string;
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

const fetchUsers = async (): Promise<UserRow[]> => {
  await new Promise((resolve) => setTimeout(resolve, 120));

  return [
    {
      name: "Horizon Route Ltd",
      role: "Carrier",
      status: "Pending Verification",
      joinedAt: "2026-06-25",
      score: "92%",
    },
    {
      name: "NorthPort Supply",
      role: "Supplier",
      status: "Active",
      joinedAt: "2026-06-22",
      score: "96%",
    },
    {
      name: "Atlas Distribution",
      role: "Carrier",
      status: "Review Required",
      joinedAt: "2026-06-20",
      score: "73%",
    },
    {
      name: "Alpha Internal Ops",
      role: "Admin",
      status: "Active",
      joinedAt: "2026-06-14",
      score: "100%",
    },
  ];
};

export default function AdminUsersPage() {
  const [search, setSearch] = useState("");
  const [role, setRole] = useState(roleOptions[0]);
  const [status, setStatus] = useState(statusOptions[0]);
  const { data = [] } = useQuery({
    queryKey: ["admin-users"],
    queryFn: fetchUsers,
  });

  const metrics = [
    { label: "Total accounts", value: "12,480" },
    { label: "Pending verification", value: "54" },
    { label: "Restricted profiles", value: "11" },
  ];

  const filteredData = useMemo(() => {
    return data.filter((row) => {
      const matchesSearch =
        row.name.toLowerCase().includes(search.toLowerCase()) ||
        row.role.toLowerCase().includes(search.toLowerCase());
      const matchesRole = role.value === "All" || row.role === role.value;
      const matchesStatus =
        status.value === "All" || row.status === status.value;

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
            <p className="font-black tracking-tight text-slate-950">
              {row.original.name}
            </p>
            <p className="mt-1 text-xs text-slate-500">
              Joined {format(new Date(row.original.joinedAt), "dd MMM yyyy")}
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
      {
        accessorKey: "score",
        header: "Health Score",
        cell: ({ getValue }) => (
          <span className="text-sm font-black text-slate-950">
            {String(getValue())}
          </span>
        ),
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

  return (
    <div className="mx-auto max-w-[1500px] space-y-6">
      <section className="rounded-[34px] border border-white/70 bg-white/90 p-6 shadow-[0_20px_50px_rgba(15,23,42,0.06)] backdrop-blur-xl sm:p-8">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <p className="text-[11px] font-black uppercase tracking-[0.24em] text-slate-400">
              User Management
            </p>
            <h2 className="mt-2 text-3xl font-black tracking-tight text-slate-950">
              Premium user control across carriers, suppliers, and admins
            </h2>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-500">
              Filter users faster, identify risky accounts, and keep verification
              operations under one clean control layer.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            {metrics.map((metric) => (
              <div
                key={metric.label}
                className="rounded-[24px] border border-slate-200 bg-slate-50 px-4 py-4"
              >
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                  {metric.label}
                </p>
                <p className="mt-3 text-2xl font-black tracking-tight text-slate-950">
                  {metric.value}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="rounded-[34px] border border-white/70 bg-white/90 p-6 shadow-[0_20px_50px_rgba(15,23,42,0.06)] backdrop-blur-xl">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex flex-1 items-center gap-3 rounded-[24px] border border-slate-200 bg-slate-50 px-4 py-3">
            <Search className="h-4 w-4 text-slate-400" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search account name or role"
              className="w-full bg-transparent text-sm font-medium text-slate-900 outline-none placeholder:text-slate-400"
            />
          </div>

          <div className="grid gap-3 md:grid-cols-2 xl:w-[460px]">
            <Select
              options={roleOptions}
              value={role}
              onChange={(option) => setRole(option ?? roleOptions[0])}
              unstyled
              classNames={{
                control: () =>
                  "flex min-h-12 items-center rounded-[20px] border border-slate-200 bg-slate-50 px-3",
                menu: () =>
                  "mt-2 rounded-[20px] border border-slate-200 bg-white p-2 shadow-xl",
                option: ({ isFocused }) =>
                  `cursor-pointer rounded-2xl px-3 py-2 text-sm ${isFocused ? "bg-slate-100" : ""}`,
                placeholder: () => "text-sm text-slate-400",
                singleValue: () => "text-sm font-semibold text-slate-900",
              }}
            />
            <Select
              options={statusOptions}
              value={status}
              onChange={(option) => setStatus(option ?? statusOptions[0])}
              unstyled
              classNames={{
                control: () =>
                  "flex min-h-12 items-center rounded-[20px] border border-slate-200 bg-slate-50 px-3",
                menu: () =>
                  "mt-2 rounded-[20px] border border-slate-200 bg-white p-2 shadow-xl",
                option: ({ isFocused }) =>
                  `cursor-pointer rounded-2xl px-3 py-2 text-sm ${isFocused ? "bg-slate-100" : ""}`,
                placeholder: () => "text-sm text-slate-400",
                singleValue: () => "text-sm font-semibold text-slate-900",
              }}
            />
          </div>
        </div>

        <div className="mt-6 overflow-hidden rounded-[28px] border border-slate-200">
          <table className="min-w-full border-collapse">
            <thead className="bg-slate-50">
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <th
                      key={header.id}
                      className="px-5 py-4 text-left text-[11px] font-black uppercase tracking-[0.22em] text-slate-400"
                    >
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody className="bg-white">
              {table.getRowModel().rows.map((row) => (
                <tr key={row.id} className="border-t border-slate-100">
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id} className="px-5 py-4 align-middle">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-5 flex items-center gap-2 rounded-[24px] border border-amber-100 bg-amber-50 px-4 py-4 text-sm text-amber-900">
          <ShieldAlert className="h-4 w-4" />
          Focus first on pending verification and review required accounts to keep
          the marketplace clean.
        </div>
      </section>
    </div>
  );
}
