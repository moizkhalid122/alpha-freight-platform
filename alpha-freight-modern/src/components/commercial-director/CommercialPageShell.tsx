"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function CommercialPageShell({
  eyebrow,
  title,
  description,
  backHref,
  actions,
  children,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  backHref?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="mx-auto max-w-6xl space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          {backHref ? (
            <Link
              href={backHref}
              className="mb-2 inline-flex items-center gap-1.5 text-[11px] font-semibold text-gray-500 hover:text-gray-900"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Back
            </Link>
          ) : null}
          {eyebrow ? (
            <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-gray-400">{eyebrow}</p>
          ) : null}
          <h1 className="air-font-display text-2xl font-medium tracking-tight text-gray-900 sm:text-[1.75rem]">
            {title}
          </h1>
          {description ? <p className="mt-1 max-w-2xl text-[13px] leading-6 text-gray-500">{description}</p> : null}
        </div>
        {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
      </div>
      {children}
    </div>
  );
}
