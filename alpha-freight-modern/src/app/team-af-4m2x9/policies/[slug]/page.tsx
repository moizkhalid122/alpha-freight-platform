import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import BrandMark from "@/components/BrandMark";
import EmployeePolicyDocument from "@/components/employee/EmployeePolicyDocument";
import EmployeePolicySaveButton from "@/components/employee/EmployeePolicySaveButton";
import { employeeRoute } from "@/lib/employee-path";
import { getEmployeePolicy } from "@/lib/employee-policies";

export default async function EmployeePolicyPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ from?: string }>;
}) {
  const { slug } = await params;
  const { from } = await searchParams;
  const policy = getEmployeePolicy(slug);
  if (!policy) notFound();

  const backHref = from === "settings" ? employeeRoute("/settings") : employeeRoute("/onboarding");
  const backLabel = from === "settings" ? "Back to settings" : "Back to onboarding";

  return (
    <div className="min-h-[100dvh] bg-white font-sans">
      <header className="border-b border-slate-100 px-6 py-5">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-4">
          <BrandMark href="/" iconClassName="h-8 w-8" textClassName="text-base font-bold" />
          <Link
            href={backHref}
            className="inline-flex items-center gap-1 text-xs font-bold uppercase tracking-wider text-slate-500 hover:text-slate-800"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            {backLabel}
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-6 py-10">
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between print:hidden">
          <p className="text-xs text-slate-500">
            To save your copy: click <strong className="text-slate-700">Save as PDF</strong>, then choose{" "}
            <strong className="text-slate-700">Save as PDF</strong> or <strong className="text-slate-700">Microsoft Print to PDF</strong> as the printer.
          </p>
          <EmployeePolicySaveButton />
        </div>
        <EmployeePolicyDocument policy={policy} />
      </main>
    </div>
  );
}
