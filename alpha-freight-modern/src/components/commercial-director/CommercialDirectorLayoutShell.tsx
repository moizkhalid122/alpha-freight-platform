"use client";

import { Suspense, useState, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import BrandMark from "@/components/BrandMark";
import CommercialDirectorHeader from "@/components/commercial-director/CommercialDirectorHeader";
import CommercialDirectorPrefetch from "@/components/commercial-director/CommercialDirectorPrefetch";
import CommercialDirectorSidebar from "@/components/commercial-director/CommercialDirectorSidebar";
import {
  commercialDirectorRoute,
  isCommercialDirectorLoginPath,
} from "@/lib/commercial-director-path";

function CommercialDirectorLayoutShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="cd-portal-bg flex min-h-[100dvh] flex-col text-gray-900 lg:flex-row">
      <div className="sticky top-0 z-50 flex h-14 shrink-0 items-center justify-between border-b border-gray-100 bg-[#FDFDFD] px-4 sm:px-6 lg:hidden">
        <BrandMark href={commercialDirectorRoute()} textClassName="text-base font-bold tracking-tight text-gray-900" />
        <button
          type="button"
          onClick={() => setMobileOpen((open) => !open)}
          className="rounded-xl p-2 transition-colors hover:bg-gray-50"
          aria-label={mobileOpen ? "Close menu" : "Open menu"}
        >
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      <div
        className={`fixed inset-y-0 left-0 z-50 transform transition-transform duration-300 ease-in-out lg:static lg:translate-x-0 ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <Suspense fallback={null}>
          <CommercialDirectorSidebar onClose={() => setMobileOpen(false)} />
        </Suspense>
      </div>

      {mobileOpen ? (
        <button
          type="button"
          aria-label="Close menu"
          className="fixed inset-0 z-40 bg-black/20 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      ) : null}

      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        <CommercialDirectorPrefetch />
        <div className="hidden lg:block">
          <CommercialDirectorHeader pathname={pathname} />
        </div>
        <main className="min-h-0 flex-1 overflow-y-auto px-4 py-4 sm:px-8 lg:px-12 lg:py-5">
          {children}
        </main>
      </div>
    </div>
  );
}

export function CommercialDirectorRootLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  if (isCommercialDirectorLoginPath(pathname)) {
    return <>{children}</>;
  }

  return <CommercialDirectorLayoutShell>{children}</CommercialDirectorLayoutShell>;
}

export default CommercialDirectorLayoutShell;
