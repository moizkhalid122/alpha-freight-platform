"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import {
  Bell,
  ChevronDown,
  Flame,
  Home,
  Clapperboard,
  Bookmark,
  AtSign,
  HeartHandshake,
  Search,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { readCarrierExtras, readSupplierExtras } from "@/lib/profile-extras";
import {
  hasUnreadNotificationActivity,
  loadCombinedFeedActivityItems,
  markActivityAsSeen,
  readActivityLastSeenAt,
} from "./feed-activity";
import { createProfileIdentityKey } from "./profile-search";

type FeedSidebarProps = {
  role: "carrier" | "supplier";
  onClose?: () => void;
};

const roleConfig = {
  carrier: {
    label: "Carrier Feed",
    basePath: "/carrier",
    fallbackName: "Carrier Account",
  },
  supplier: {
    label: "Supplier Feed",
    basePath: "/supplier",
    fallbackName: "Supplier Account",
  },
};

type ProfileRecord = {
  full_name?: string | null;
  company_name?: string | null;
};

export default function FeedSidebar({ role, onClose }: FeedSidebarProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const config = roleConfig[role];
  const [profile, setProfile] = useState<ProfileRecord | null>(null);
  const [userEmail, setUserEmail] = useState("");
  const [storedCompanyName, setStoredCompanyName] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [userId, setUserId] = useState("");
  const [hasUnreadActivity, setHasUnreadActivity] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);

  const searchKey = searchParams.toString();

  const handleNavigate = () => {
    setIsProfileMenuOpen(false);
    onClose?.();
  };

  useEffect(() => {
    async function getSidebarProfile() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setProfile(null);
        setUserEmail("");
        setUserId("");
        setStoredCompanyName("");
        setAvatarUrl("");
        setHasUnreadActivity(false);
        return;
      }

      setUserEmail(user.email || "");
      setUserId(user.id);

      const extras =
        role === "carrier" ? readCarrierExtras(user.id) : readSupplierExtras(user.id);
      setStoredCompanyName(extras.companyName?.trim() || "");
      setAvatarUrl(extras.avatarUrl?.trim() || "");

      const { data: profileData } = await supabase
        .from("profiles")
        .select("full_name, company_name")
        .eq("id", user.id)
        .single();

      setProfile((profileData || null) as ProfileRecord | null);
    }

    getSidebarProfile();
  }, [role]);

  useEffect(() => {
    setIsProfileMenuOpen(false);
  }, [pathname, searchKey]);

  const profileName = useMemo(() => {
    return (
      storedCompanyName ||
      profile?.company_name?.trim() ||
      profile?.full_name?.trim() ||
      userEmail.split("@")[0] ||
      config.fallbackName
    );
  }, [config.fallbackName, profile, storedCompanyName, userEmail]);

  const viewerProfileIdentityKey = useMemo(
    () => createProfileIdentityKey({ ownerEmail: userEmail, author: profileName }),
    [profileName, userEmail]
  );

  const activeTab = searchParams.get("tab");
  const isActivityTabActive = activeTab === "activity";

  useEffect(() => {
    if (!isActivityTabActive) return;
    markActivityAsSeen(role, userEmail, userId);
    setHasUnreadActivity(false);
  }, [isActivityTabActive, role, userEmail, userId]);

  useEffect(() => {
    let isActive = true;

    const refreshUnreadBadge = async () => {
      if (!userId && !userEmail) {
        if (isActive) setHasUnreadActivity(false);
        return;
      }

      if (isActivityTabActive) {
        if (isActive) setHasUnreadActivity(false);
        return;
      }

      const items = await loadCombinedFeedActivityItems({
        role,
        userEmail,
        profileId: userId,
        profileIdentityKey: viewerProfileIdentityKey,
      });
      const lastSeenAt = readActivityLastSeenAt(role, userEmail, userId);

      if (isActive) {
        setHasUnreadActivity(hasUnreadNotificationActivity(items, lastSeenAt));
      }
    };

    void refreshUnreadBadge();

    window.addEventListener("alpha_feed_activity_updated", refreshUnreadBadge);
    window.addEventListener("alpha_feed_activity_seen", refreshUnreadBadge);
    window.addEventListener("focus", refreshUnreadBadge);

    const pollInterval = window.setInterval(() => {
      void refreshUnreadBadge();
    }, 20000);

    return () => {
      isActive = false;
      window.removeEventListener("alpha_feed_activity_updated", refreshUnreadBadge);
      window.removeEventListener("alpha_feed_activity_seen", refreshUnreadBadge);
      window.removeEventListener("focus", refreshUnreadBadge);
      window.clearInterval(pollInterval);
    };
  }, [isActivityTabActive, role, userEmail, userId, viewerProfileIdentityKey]);

  const profileInitials = useMemo(() => {
    const parts = profileName
      .split(" ")
      .map((part) => part.trim())
      .filter(Boolean)
      .slice(0, 2);

    if (!parts.length) return role === "carrier" ? "C" : "S";

    return parts.map((part) => part[0]?.toUpperCase() || "").join("");
  }, [profileName, role]);

  const primaryLinks = [
    { label: "Feed", href: `${config.basePath}/feed`, icon: <Home className="h-4 w-4" /> },
    { label: "Search", href: `${config.basePath}/feed/search`, icon: <Search className="h-4 w-4" /> },
    { label: "Reel", href: `${config.basePath}/feed?view=reel`, icon: <Clapperboard className="h-4 w-4" /> },
    { label: "Hype", href: `${config.basePath}/feed?tab=hype`, icon: <Flame className="h-4 w-4" /> },
    { label: "Activity", href: `${config.basePath}/feed?tab=activity`, icon: <Bell className="h-4 w-4" /> },
  ];

  const communityLinks = [
    { label: "Following", href: `${config.basePath}/feed?view=following`, icon: <HeartHandshake className="h-4 w-4" /> },
    { label: "Saved", href: `${config.basePath}/feed?view=saved`, icon: <Bookmark className="h-4 w-4" /> },
    { label: "Mentions", href: `${config.basePath}/feed?view=mentions`, icon: <AtSign className="h-4 w-4" /> },
  ];

  const renderLink = (item: { label: string; href: string; icon: React.ReactNode }) => {
    const activeView = searchParams.get("view");
    const isBaseFeed = pathname === `${config.basePath}/feed`;
    const isSearchPage = pathname === `${config.basePath}/feed/search`;
    const isActive =
      (item.label === "Feed" && isBaseFeed && !activeTab && !activeView) ||
      (item.label === "Search" && isSearchPage) ||
      (item.label === "Reel" && activeView === "reel") ||
      (item.label === "Hype" && activeTab === "hype") ||
      (item.label === "Activity" && activeTab === "activity") ||
      (item.label === "Following" && activeView === "following") ||
      (item.label === "Saved" && activeView === "saved") ||
      (item.label === "Mentions" && activeView === "mentions");
    const showUnreadDot = item.label === "Activity" && hasUnreadActivity && !isActivityTabActive;

    return (
      <Link key={item.href} href={item.href} onClick={handleNavigate}>
        <div
          className={`flex items-center gap-2.5 rounded-xl px-2.5 py-1.5 text-[11px] font-semibold transition ${
            isActive
              ? "bg-white/10 text-white shadow-[0_8px_24px_rgba(0,0,0,0.18)]"
              : "text-slate-300 hover:bg-white/5 hover:text-white"
          }`}
        >
          <span className="relative text-white">{item.icon}</span>
          <span className="flex min-w-0 flex-1 items-center justify-between gap-2">
            <span>{item.label}</span>
            {showUnreadDot ? (
              <span
                aria-label="New activity"
                className="h-1.5 w-1.5 shrink-0 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.8)]"
              />
            ) : null}
          </span>
        </div>
      </Link>
    );
  };

  return (
    <aside className="flex h-full w-[248px] flex-col border-r border-white/6 bg-[linear-gradient(180deg,#020202_0%,#040404_55%,#020202_100%)] px-3 py-3 text-white">
      <div className="relative">
        <div className="flex items-center justify-between gap-3 px-1 py-1">
          <div className="flex min-w-0 items-center gap-3">
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt={profileName}
                className="h-8 w-8 rounded-[10px] border border-white/10 object-cover"
              />
            ) : (
              <div className="flex h-8 w-8 items-center justify-center rounded-[10px] border border-white/10 bg-white/[0.06] text-[11px] font-black text-white">
                {profileInitials}
              </div>
            )}
            <div className="min-w-0">
              <p className="truncate text-[12px] font-black tracking-tight text-white">{profileName}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setIsProfileMenuOpen((current) => !current)}
            className="rounded-lg p-1 text-slate-400 transition hover:bg-white/5 hover:text-white"
            aria-label={isProfileMenuOpen ? "Close profile menu" : "Open profile menu"}
            aria-expanded={isProfileMenuOpen}
          >
            <ChevronDown
              className={`h-4 w-4 transition-transform duration-200 ${
                isProfileMenuOpen ? "rotate-180 text-white" : ""
              }`}
            />
          </button>
        </div>

        {isProfileMenuOpen ? (
          <div className="absolute left-0 right-0 top-full z-20 mt-2 rounded-[16px] border border-white/8 bg-[#080808]/95 p-2.5 shadow-[0_18px_50px_rgba(0,0,0,0.38)] backdrop-blur-xl">
            <div className="rounded-[12px] bg-white/[0.03] px-3 py-2">
              <p className="text-[9px] font-black uppercase tracking-[0.18em] text-slate-500">{config.label}</p>
              <p className="mt-1 truncate text-[11px] font-semibold text-slate-200">{userEmail || "Alpha Freight member"}</p>
            </div>
            <div className="mt-2 grid gap-2">
              <Link
                href={`${config.basePath}/feed/profile`}
                onClick={handleNavigate}
                className="rounded-[12px] bg-white/[0.06] px-3 py-2 text-[11px] font-bold text-white transition hover:bg-white/[0.1]"
              >
                Open Profile
              </Link>
              {onClose ? (
                <button
                  type="button"
                  onClick={handleNavigate}
                  className="rounded-[12px] bg-white/[0.03] px-3 py-2 text-left text-[11px] font-bold text-slate-300 transition hover:bg-white/[0.08] hover:text-white"
                >
                  Close Menu
                </button>
              ) : null}
            </div>
          </div>
        ) : null}
      </div>

      <div className="mt-3 border-t border-white/8" />

      <div className="mt-3 rounded-[14px] border border-white/6 bg-white/[0.03] px-3 py-2">
        <div className="flex items-center gap-2 text-slate-300">
          <Search className="h-3.5 w-3.5 text-white/90" />
          <span className="text-[10px] font-medium">Search...</span>
        </div>
      </div>

      <div className="mt-3 border-t border-white/8" />

      <div className="mt-4">
        <p className="px-1.5 text-[9px] font-black uppercase tracking-[0.18em] text-slate-400">Explore</p>
        <div className="mt-2 space-y-1">{primaryLinks.map(renderLink)}</div>
      </div>

      <div className="mt-5">
        <p className="px-1.5 text-[9px] font-black uppercase tracking-[0.18em] text-slate-400">Community</p>
        <div className="mt-2 space-y-1">{communityLinks.map(renderLink)}</div>
      </div>

    </aside>
  );
}
