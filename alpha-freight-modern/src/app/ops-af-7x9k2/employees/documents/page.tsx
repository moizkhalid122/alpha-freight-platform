"use client";

import { AdminHrHeader, AdminHrTabs, AdminPanel } from "@/components/admin/AdminHrShell";
import { useAdminTable } from "@/hooks/useAdminEmployeeData";

type DocRow = {
  id: string;
  employee_id: string | null;
  title: string;
  category: string;
  created_at: string;
};

export default function AdminEmployeeDocumentsPage() {
  const { rows, loading } = useAdminTable<DocRow>("employee_documents");

  return (
    <div className="admin-page-stack space-y-4">
      <AdminHrHeader title="Documents" description="Company and employee document library." />
      <AdminHrTabs activePath="/ops-af-7x9k2/employees/documents" />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {loading ? (
          <AdminPanel>Loading…</AdminPanel>
        ) : rows.length === 0 ? (
          <AdminPanel>No documents yet</AdminPanel>
        ) : (
          rows.map((doc) => (
            <AdminPanel key={doc.id}>
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">{doc.category}</p>
              <h3 className="mt-1 text-base font-black text-slate-900">{doc.title}</h3>
              <p className="mt-3 text-xs text-slate-500">
                {doc.employee_id ? "Employee-specific" : "Company-wide"} ·{" "}
                {new Date(doc.created_at).toLocaleDateString("en-GB")}
              </p>
            </AdminPanel>
          ))
        )}
      </div>
    </div>
  );
}
