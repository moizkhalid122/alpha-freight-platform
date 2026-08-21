"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Box,
  Clock,
  FileText,
  Globe,
  HelpCircle,
  LayoutDashboard,
  LogOut,
  Plane,
  Plus,
  Receipt,
  Search,
  UserCircle,
  Wallet,
} from "lucide-react";
import BrandMark from "@/components/BrandMark";
import type { AirRole } from "@/lib/air-portal";
import { AIR_PORTAL, airRoleLabel } from "@/lib/air-portal";
import {
  getForwarderSidebar,
  getShipperSidebar,
  type AirNavIcon,
} from "@/lib/air-storage";
import { supabase } from "@/lib/supabase";

const ICONS = {
  layout: LayoutDashboard,
  plane: Plane,
  globe: Globe,
  wallet: Wallet,
  plus: Plus,
  search: Search,
  box: Box,
  file: FileText,
  user: UserCircle,
  help: HelpCircle,
  clock: Clock,
  receipt: Receipt,
} as const;

export default function AirSidebar({
  role,
  userName,
  onClose,
}: {
  role: AirRole;
  userName?: string | null;
  onClose?: () => void;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const categories = role === "carrier" ? getForwarderSidebar() : getShipperSidebar();

  const signOut = async () => {
    await supabase.auth.signOut();
    router.push(AIR_PORTAL.login);
  };

  const isActive = (path: string) => pathname === path;

  return (
    <aside className="flex h-full w-64 flex-col overflow-y-auto border-r border-gray-100 bg-[#FDFDFD] shadow-2xl lg:shadow-none">
      <div className="mb-2 flex flex-col gap-4 px-7 py-6">
        <BrandMark href="/" />
        <div className="h-[1px] w-full bg-gray-100/80" />
      </div>

      <nav className="flex-1 space-y-6 px-3.5">
        {categories.map((category) => (
          <div key={category.name}>
            <p className="mb-2 px-3.5 text-[10px] font-bold tracking-widest text-gray-400">
              {category.name}
            </p>
            <div className="space-y-0.5">
              {category.items.map((item) => {
                const Icon = ICONS[item.icon as AirNavIcon];
                const active = isActive(item.path);

                return (
                  <Link key={item.path} href={item.path} onClick={onClose}>
                    <div
                      className={`flex items-center gap-3.5 rounded-lg px-3.5 py-2 transition-all duration-200 group ${
                        active
                          ? "bg-blue-50 text-blue-600 shadow-sm"
                          : "text-gray-500 hover:bg-gray-50 hover:text-gray-900"
                      }`}
                    >
                      <Icon
                        className={`h-4 w-4 shrink-0 transition-colors ${
                          active ? "text-blue-600" : "text-gray-400 group-hover:text-gray-900"
                        }`}
                      />
                      <span className="text-[13px] font-semibold">{item.name}</span>
                      {item.badge ? (
                        <span className="ml-auto text-[8px] font-bold leading-tight rounded bg-blue-100 px-1.5 py-0.5 text-blue-600">
                          {item.badge}
                        </span>
                      ) : null}
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      <div className="mt-auto border-t border-gray-50 bg-gray-50/30 px-3.5 py-5">
        <div className="flex items-center gap-3 rounded-lg px-3.5 py-2.5">
          <div className="flex h-7 w-7 items-center justify-center rounded-full border border-blue-100 bg-blue-50 text-[10px] font-bold text-blue-600">
            {userName?.charAt(0)?.toUpperCase() || "U"}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-bold text-gray-900">{userName || "Loading..."}</p>
            <p className="truncate text-[9px] font-bold uppercase tracking-tighter text-gray-500">
              Air {airRoleLabel(role)}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={signOut}
          className="mt-3 flex w-full items-center gap-3 rounded-lg px-3.5 py-2 text-[13px] font-medium text-red-500 transition-colors hover:bg-red-50 hover:text-red-700"
        >
          <LogOut className="h-4 w-4" />
          Logout
        </button>
      </div>
    </aside>
  );
}
