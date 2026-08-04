import type { EmployeeDocument } from "@/lib/employee-types";

export const DOCUMENT_CATEGORIES = [
  { value: "all", label: "All documents" },
  { value: "policy", label: "Policies" },
  { value: "contract", label: "Contracts" },
  { value: "training", label: "Training" },
  { value: "sales", label: "Sales" },
  { value: "compliance", label: "Compliance" },
  { value: "hr", label: "HR & Payroll" },
  { value: "personal", label: "My uploads" },
] as const;

export const CATEGORY_META: Record<string, { label: string; tone: string; icon: string }> = {
  policy: { label: "Policy", tone: "bg-violet-50 text-violet-700", icon: "📋" },
  contract: { label: "Contract", tone: "bg-blue-50 text-blue-700", icon: "📝" },
  training: { label: "Training", tone: "bg-emerald-50 text-emerald-700", icon: "🎓" },
  sales: { label: "Sales", tone: "bg-amber-50 text-amber-700", icon: "📈" },
  compliance: { label: "Compliance", tone: "bg-red-50 text-red-700", icon: "✅" },
  hr: { label: "HR", tone: "bg-pink-50 text-pink-700", icon: "👤" },
  personal: { label: "Personal", tone: "bg-slate-100 text-slate-700", icon: "📁" },
  other: { label: "Other", tone: "bg-slate-100 text-slate-600", icon: "📄" },
};

export type DocumentStats = {
  total: number;
  company: number;
  personal: number;
  required: number;
  requiredRead: number;
};

export function computeDocumentStats(docs: EmployeeDocument[], readIds: Set<string>): DocumentStats {
  const required = docs.filter((d) => d.is_required);
  return {
    total: docs.length,
    company: docs.filter((d) => !d.employee_id).length,
    personal: docs.filter((d) => d.employee_id).length,
    required: required.length,
    requiredRead: required.filter((d) => readIds.has(d.id)).length,
  };
}

export function filterDocuments(
  docs: EmployeeDocument[],
  category: string,
  scope: "all" | "company" | "personal",
  search: string
): EmployeeDocument[] {
  const q = search.trim().toLowerCase();
  return docs.filter((d) => {
    if (category !== "all" && d.category !== category) return false;
    if (scope === "company" && d.employee_id) return false;
    if (scope === "personal" && !d.employee_id) return false;
    if (q) {
      const hay = [d.title, d.description, d.category, d.file_name].filter(Boolean).join(" ").toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });
}

export function formatFileSize(kb: number | null | undefined): string {
  if (!kb) return "—";
  if (kb < 1024) return `${kb} KB`;
  return `${(kb / 1024).toFixed(1)} MB`;
}

export function fileExtension(name: string | null | undefined): string {
  if (!name) return "PDF";
  const ext = name.split(".").pop()?.toUpperCase();
  return ext && ext.length <= 5 ? ext : "FILE";
}

const READ_KEY = "af_docs_read";

export function loadReadDocIds(userId: string): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const arr = JSON.parse(localStorage.getItem(`${READ_KEY}_${userId}`) || "[]") as string[];
    return new Set(arr);
  } catch {
    return new Set();
  }
}

export function markDocRead(userId: string, docId: string) {
  if (typeof window === "undefined") return;
  const set = loadReadDocIds(userId);
  set.add(docId);
  localStorage.setItem(`${READ_KEY}_${userId}`, JSON.stringify([...set]));
}

export function documentsToCsv(docs: EmployeeDocument[]): string {
  const headers = ["title", "category", "scope", "file_name", "file_size_kb", "is_required", "created_at"];
  const rows = docs.map((d) =>
    headers
      .map((h) => {
        let v: string | number | boolean = "";
        if (h === "scope") v = d.employee_id ? "personal" : "company";
        else v = (d[h as keyof EmployeeDocument] as string | number | boolean | null | undefined) ?? "";
        const s = String(v);
        return s.includes(",") ? `"${s.replace(/"/g, '""')}"` : s;
      })
      .join(",")
  );
  return [headers.join(","), ...rows].join("\n");
}

export function downloadDocListCsv(filename: string, content: string) {
  const blob = new Blob([content], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
