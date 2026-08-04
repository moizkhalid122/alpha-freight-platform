"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  BookOpen,
  CalendarOff,
  CircleDollarSign,
  FileText,
  LayoutDashboard,
  ListTodo,
  LogOut,
  Phone,
  Settings,
  Sparkles,
  Target,
} from "lucide-react";
import BrandMark from "@/components/BrandMark";
import { EMPLOYEE_PANEL_PATH, employeeRoute } from "@/lib/employee-path";
import { supabase } from "@/lib/supabase";

const sidebarCategories = [
  {
    name: "OVERVIEW",
    items: [
      { name: "Dashboard", path: employeeRoute(), icon: <LayoutDashboard className="h-4 w-4" /> },
      { name: "My Tasks", path: employeeRoute("/tasks"), icon: <ListTodo className="h-4 w-4" /> },
      { name: "My Leads", path: employeeRoute("/leads"), icon: <Target className="h-4 w-4" /> },
      { name: "My Calls", path: employeeRoute("/calls"), icon: <Phone className="h-4 w-4" /> },
      { name: "My Commission", path: employeeRoute("/commission"), icon: <CircleDollarSign className="h-4 w-4" /> },
    ],
  },
  {
    name: "RESOURCES",
    items: [
      { name: "Team AI", path: employeeRoute("/ai"), icon: <Sparkles className="h-4 w-4" /> },
      { name: "Documents", path: employeeRoute("/documents"), icon: <FileText className="h-4 w-4" /> },
      { name: "Training", path: employeeRoute("/training"), icon: <BookOpen className="h-4 w-4" /> },
      { name: "Leave Request", path: employeeRoute("/leave"), icon: <CalendarOff className="h-4 w-4" /> },
    ],
  },
  {
    name: "ACCOUNT",
    items: [{ name: "Settings", path: employeeRoute("/settings"), icon: <Settings className="h-4 w-4" /> }],
  },
];

function isActive(pathname: string, itemPath: string) {
  if (itemPath === employeeRoute()) return pathname === EMPLOYEE_PANEL_PATH;
  return pathname === itemPath || pathname.startsWith(`${itemPath}/`);
}

export default function EmployeeSidebar({ onClose }: { onClose?: () => void }) {
  const pathname = usePathname();
  const router = useRouter();
  const [profile, setProfile] = useState<{ full_name?: string | null; job_title?: string | null } | null>(null);

  useEffect(() => {
    async function load() {
      const {
        data: { user },
      } = await supabase.auth.getSession().then((r) => ({ data: { user: r.data.session?.user ?? null } }));
      if (!user) return;
      const { data } = await supabase
        .from("employee_profiles")
        .select("job_title, department")
        .eq("id", user.id)
        .maybeSingle();
      const { data: profileRow } = await supabase.from("profiles").select("full_name").eq("id", user.id).maybeSingle();
      setProfile({
        full_name: profileRow?.full_name ?? String(user.user_metadata?.full_name ?? "Team member"),
        job_title: data?.job_title ?? String(user.user_metadata?.position ?? "Employee"),
      });
    }
    void load();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push(employeeRoute("/login"));
  };

  return (
    <aside className="flex h-full w-64 flex-col overflow-y-auto border-r border-gray-100 bg-[#FDFDFD] shadow-2xl lg:shadow-none">
      <div className="mb-2 flex flex-col gap-4 px-7 py-6">
        <BrandMark href={employeeRoute()} />
        <div className="h-px w-full bg-gray-100/80" />
      </div>

      <nav className="flex-1 space-y-6 px-3.5">
        {sidebarCategories.map((category) => (
          <div key={category.name}>
            <p className="mb-2 px-3.5 text-[10px] font-bold tracking-widest text-gray-400">{category.name}</p>
            <div className="space-y-0.5">
              {category.items.map((item, idx) => {
                const active = isActive(pathname, item.path);
                return (
                  <motion.div key={item.path} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: idx * 0.03 }}>
                    <Link
                      href={item.path}
                      onClick={onClose}
                      className={`flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-[13px] font-semibold transition-all ${
                        active ? "bg-blue-50 text-blue-600 shadow-sm" : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                      }`}
                    >
                      {item.icon}
                      <span>{item.name}</span>
                    </Link>
                  </motion.div>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      <div className="border-t border-gray-100 p-4">
        <div className="mb-3 flex items-center gap-3 rounded-xl bg-gray-50 p-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-900 text-xs font-bold text-[#FFD666]">
            {(profile?.full_name ?? "T").charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-bold text-gray-900">{profile?.full_name ?? "Team member"}</p>
            <p className="truncate text-[10px] font-medium text-gray-400">{profile?.job_title ?? "Employee"}</p>
          </div>
        </div>
        <button
          type="button"
          onClick={handleLogout}
          className="flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-[13px] font-semibold text-red-500 transition hover:bg-red-50"
        >
          <LogOut className="h-4 w-4" />
          Logout
        </button>
      </div>
    </aside>
  );
}
