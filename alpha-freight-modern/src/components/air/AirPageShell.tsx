import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function AirPageShell({
  title,
  description,
  backHref,
  children,
  actions,
}: {
  title: string;
  description?: string;
  backHref?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          {backHref ? (
            <Link
              href={backHref}
              className="mb-3 inline-flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-gray-900"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Back
            </Link>
          ) : null}
          <h1 className="text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">{title}</h1>
          {description ? <p className="mt-1 max-w-2xl text-sm text-gray-500">{description}</p> : null}
        </div>
        {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
      </div>
      {children}
    </div>
  );
}
