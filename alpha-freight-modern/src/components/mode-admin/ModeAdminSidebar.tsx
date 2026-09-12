"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LogOut, Menu } from "lucide-react";
import BrandMark from "@/components/BrandMark";
import { cn } from "@/lib/utils";
import { supabase } from "@/lib/supabase";
import type { ModeAdminPanelConfig } from "@/lib/mode-admin-nav";

function isActive(pathname: string, itemPath: string, homePath: string) {
  if (itemPath === homePath) return pathname === homePath;
  return pathname === itemPath || pathname.startsWith(`${itemPath}/`);
}

export default function ModeAdminSidebar({
  config,
  onClose,
}: {
  config: ModeAdminPanelConfig;
  onClose?: () => void;
}) {
  const pathname = usePathname();
  const router = useRouter();

  const logout = async () => {
    await supabase.auth.signOut();
    router.replace(`${config.homePath}/login`);
  };

  return (
    <aside className="flex h-full w-64 flex-col border-r border-gray-100 bg-[#FDFDFD]">
      <div className="border-b border-gray-100 px-5 py-5">
        <BrandMark href={config.homePath} textClassName="text-sm font-bold tracking-tight text-gray-900" />
        <p className="mt-2 text-[10px] font-bold uppercase tracking-[0.24em] text-gray-400">{config.badge} ADMIN</p>
        <p className="mt-1 text-xs text-gray-500">{config.subtitle}</p>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4">
        {config.sections.map((section) => (
          <div key={section.label} className="mb-5">
            <p className="mb-2 px-2 text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400">
              {section.label}
            </p>
            <ul className="space-y-0.5">
              {section.items.map((item) => {
                const active = isActive(pathname, item.path, config.homePath);
                const Icon = item.icon;
                return (
                  <li key={item.path}>
                    <Link
                      href={item.path}
                      onClick={onClose}
                      className={cn(
                        "flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-[13px] font-semibold transition",
                        active
                          ? "bg-gray-900 text-white shadow-sm"
                          : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                      )}
                    >
                      <Icon className="h-4 w-4 shrink-0" />
                      {item.name}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      <div className="border-t border-gray-100 p-3">
        <button
          type="button"
          onClick={() => void logout()}
          className="flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-[13px] font-semibold text-gray-600 transition hover:bg-rose-50 hover:text-rose-700"
        >
          <LogOut className="h-4 w-4" />
          Logout
        </button>
      </div>
    </aside>
  );
}
