"use client";

import { Suspense, useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Menu, X } from "lucide-react";
import AirSidebar from "@/components/air/AirSidebar";
import BrandMark from "@/components/BrandMark";
import { supabase } from "@/lib/supabase";
import type { AirRole } from "@/lib/air-portal";
import { AIR_PORTAL } from "@/lib/air-portal";

export default function AirPortalLayout({
  children,
  role,
}: {
  children: React.ReactNode;
  role: AirRole;
}) {
  const [open, setOpen] = useState(false);
  const [userName, setUserName] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.replace(`${AIR_PORTAL.login}?role=${role === "carrier" ? "carrier" : "supplier"}`);
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name, role")
        .eq("id", user.id)
        .maybeSingle();

      if (!cancelled) {
        setUserName(profile?.full_name ?? user.email ?? null);
        setReady(true);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [router, role, pathname]);

  if (!ready) {
    return (
      <div className="flex min-h-[100dvh] items-center justify-center bg-[#FDFDFD]">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-200 border-t-sky-500" />
      </div>
    );
  }

  return (
    <div className="flex min-h-[100dvh] flex-col bg-[#FDFDFD] text-gray-900 lg:flex-row">
      <div className="sticky top-0 z-50 flex items-center justify-between border-b border-gray-100 bg-[#FDFDFD] px-4 py-4 sm:px-6 lg:hidden">
        <BrandMark href="/" textClassName="text-lg font-bold tracking-tight text-gray-900" />
        <button
          type="button"
          onClick={() => setOpen(!open)}
          className="rounded-xl p-2 transition-colors hover:bg-gray-50"
        >
          {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      <div
        className={`fixed inset-y-0 left-0 z-50 transform transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <Suspense fallback={null}>
          <AirSidebar role={role} userName={userName} onClose={() => setOpen(false)} />
        </Suspense>
      </div>

      {open ? (
        <button
          type="button"
          aria-label="Close menu"
          className="fixed inset-0 z-40 bg-black/30 lg:hidden"
          onClick={() => setOpen(false)}
        />
      ) : null}

      <main className="min-h-screen min-w-0 flex-1 bg-[#FDFDFD] px-4 py-6 sm:px-8 sm:py-10 lg:ml-64 lg:px-12">
        {children}
      </main>
    </div>
  );
}
