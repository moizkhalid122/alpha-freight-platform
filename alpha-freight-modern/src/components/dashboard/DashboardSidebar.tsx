import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { supabase } from "@/lib/supabase";
import { isAdminPanelEmail } from "@/lib/admin-access";
import { 
  LogOut, 
  LayoutDashboard, 
  ChevronRight,
  Search,
  Box,
  Zap,
  Users,
  Truck,
  UserCircle,
  Wallet,
  TrendingUp,
  Settings,
  HelpCircle,
  Clock,
  Gift,
  Sparkles,
  Newspaper,
  ShieldCheck,
} from "lucide-react";
import BrandMark from "@/components/BrandMark";

const sidebarCategories = [
  {
    name: "OVERVIEW",
    items: [
      { name: "Dashboard", path: "/carrier/dashboard", icon: <LayoutDashboard className="w-4 h-4" /> },
      { name: "Feed", path: "/carrier/feed", icon: <Newspaper className="w-4 h-4" />, badge: "NEW" },
      { name: "AI Assistant", path: "/carrier/ai-assistant", icon: <Sparkles className="w-4 h-4" />, badge: "NEW" },
    ]
  },
  {
    name: "LOAD MANAGEMENT",
    items: [
      { name: "Available Loads", path: "/carrier/available-loads", icon: <Search className="w-4 h-4" />, badge: "NEW" },
      { name: "My Loads", path: "/carrier/my-loads", icon: <Box className="w-4 h-4" /> },
      { name: "Smart Loads", path: "/carrier/smart-loads", icon: <Zap className="w-4 h-4" /> },
      { name: "My Bids", path: "/carrier/my-bids", icon: <Clock className="w-4 h-4" /> },
    ]
  },
  {
    name: "FLEET & TOOLS",
    items: [
      { name: "My Vehicles", path: "/carrier/vehicles", icon: <Truck className="w-4 h-4" /> },
      { name: "Driver Panel", path: "/carrier/driver-panel", icon: <Users className="w-4 h-4" /> },
    ]
  },
  {
    name: "FINANCE",
    items: [
      { name: "Wallet", path: "/carrier/wallet", icon: <Wallet className="w-4 h-4" /> },
      { name: "Earnings", path: "/carrier/earnings", icon: <TrendingUp className="w-4 h-4" /> },
    ]
  },
  {
    name: "ACCOUNT",
    items: [
      { name: "Profile", path: "/carrier/profile", icon: <UserCircle className="w-4 h-4" /> },
      { name: "Settings", path: "/carrier/settings", icon: <Settings className="w-4 h-4" /> },
      { name: "Referrals", path: "/carrier/referrals", icon: <Gift className="w-4 h-4" /> },
      { name: "Support", path: "/carrier/support", icon: <HelpCircle className="w-4 h-4" /> },
    ]
  }
];

export default function DashboardSidebar({
  onClose,
  workspaceLabel = "Carrier",
}: {
  onClose?: () => void;
  workspaceLabel?: string;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [userProfile, setUserProfile] = useState<any>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);

  useEffect(() => {
    async function getProfile() {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserEmail(user.email ?? null);
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();
        setUserProfile(profile);
      }
    }
    getProfile();
  }, []);

  const showAdminPanel = isAdminPanelEmail(userEmail);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/auth/login');
  };

  return (
    <aside className="h-full w-64 bg-[#FDFDFD] border-r border-gray-100 flex flex-col overflow-y-auto shadow-2xl lg:shadow-none">
      <div className="mb-2 flex flex-col gap-4 px-7 py-6">
        <BrandMark href="/" />
        <div className="h-[1px] w-full bg-gray-100/80" />
      </div>

      <nav className="flex-1 px-3.5 space-y-6">
        {sidebarCategories.map((category) => (
          <div key={category.name}>
            <p className="px-3.5 text-[10px] font-bold text-gray-400 tracking-widest mb-2">
              {category.name}
            </p>
            <div className="space-y-0.5">
              {category.items.map((item) => {
                const isActive = pathname === item.path;
                return (
                  <Link key={item.path} href={item.path} onClick={onClose}>
                    <div
                      className={`flex items-center gap-3.5 px-3.5 py-2 rounded-lg transition-all duration-200 group ${
                        isActive
                          ? "bg-blue-50 text-blue-600 shadow-sm"
                          : "text-gray-500 hover:text-gray-900 hover:bg-gray-50"
                      }`}
                    >
                      <span className={`${isActive ? "text-blue-600" : "text-gray-400 group-hover:text-gray-900"} transition-colors scale-105`}>
                        {item.icon}
                      </span>
                      <span className="text-[13px] font-semibold">{item.name}</span>
                      {item.badge && (
                        <span className="ml-auto text-[8px] font-bold bg-blue-100 text-blue-600 px-1.5 py-0.5 rounded leading-tight">
                          {item.badge}
                        </span>
                      )}
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
        {showAdminPanel ? (
          <div>
            <p className="px-3.5 text-[10px] font-bold text-gray-400 tracking-widest mb-2">
              ADMIN
            </p>
            <div className="space-y-0.5">
              <Link href="/admin" onClick={onClose}>
                <div
                  className={`flex items-center gap-3.5 px-3.5 py-2 rounded-lg transition-all duration-200 group ${
                    pathname.startsWith("/admin")
                      ? "bg-slate-900 text-white shadow-sm"
                      : "text-gray-500 hover:text-gray-900 hover:bg-gray-50"
                  }`}
                >
                  <span
                    className={`${
                      pathname.startsWith("/admin")
                        ? "text-[#BFFF07]"
                        : "text-gray-400 group-hover:text-gray-900"
                    } transition-colors scale-105`}
                  >
                    <ShieldCheck className="w-4 h-4" />
                  </span>
                  <span className="text-[13px] font-semibold">Admin Panel</span>
                </div>
              </Link>
            </div>
          </div>
        ) : null}
      </nav>

      <div className="mt-auto px-3.5 py-5 border-t border-gray-50 bg-gray-50/30">
        <div className="flex items-center gap-3 px-3.5 py-2.5 rounded-lg hover:bg-gray-100 cursor-pointer transition-colors">
          <div className="w-7 h-7 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 text-[10px] font-bold border border-blue-100">
            {userProfile?.full_name?.charAt(0) || 'U'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold text-gray-900 truncate">{userProfile?.full_name || 'Loading...'}</p>
            <p className="text-[9px] text-gray-500 truncate uppercase font-bold tracking-tighter">
              {workspaceLabel}
            </p>
          </div>
        </div>
        <button 
          onClick={handleLogout}
          className="w-full mt-3 flex items-center gap-3 px-3.5 py-2 text-[13px] font-medium text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
        >
          <LogOut className="w-4 h-4" />
          Logout
        </button>
      </div>
    </aside>
  );
}
