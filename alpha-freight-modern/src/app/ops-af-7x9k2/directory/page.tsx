"use client";

import Link from "next/link";
import { ADMIN_CARD } from "@/lib/admin-ui";
import { Clock, ExternalLink } from "lucide-react";

export default function AdminDirectoryPage() {
  return (
    <div className="admin-page-stack space-y-4">
      <section className={`${ADMIN_CARD} p-6 sm:p-8`}>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.22em] text-slate-400">Directory Review</p>
            <h2 className="mt-2 text-3xl font-black tracking-tight text-slate-900">Carrier directory approvals</h2>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-500">
              Demo directory requests have been removed. This queue will show live listing submissions once the
              directory request table is connected.
            </p>
          </div>
        </div>
      </section>

      <section className={`${ADMIN_CARD} px-6 py-16 text-center sm:px-8`}>
        <div className="mx-auto flex max-w-md flex-col items-center gap-3">
          <div className="rounded-2xl bg-slate-100 p-3 text-slate-500">
            <Clock className="h-6 w-6" />
          </div>
          <h3 className="text-lg font-bold text-slate-900">No directory requests yet</h3>
          <p className="text-sm leading-6 text-slate-500">
            There is no fake sample data on this page anymore. Verified carriers can still be reviewed from the live
            carrier workflows.
          </p>
          <Link
            href="/ops-af-7x9k2/carriers/pending-verifications"
            className="mt-2 inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
          >
            Open pending verifications
            <ExternalLink className="h-4 w-4" />
          </Link>
        </div>
      </section>
    </div>
  );
}
