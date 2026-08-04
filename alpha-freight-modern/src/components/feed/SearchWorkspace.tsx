"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowLeft, Search, X } from "lucide-react";
import { supabase } from "@/lib/supabase";
import {
  readAllNetworkFeedPosts,
  readAllNetworkReels,
  readStoredCollection,
} from "./feed-storage";
import {
  assembleNetworkProfiles,
  buildFeedProfileHref,
  filterNetworkProfiles,
  pickBestAvatarSrc,
  readLocalDirectoryProfiles,
  type DirectoryProfileRecord,
  type NetworkProfileRecord,
} from "./profile-search";

type SearchWorkspaceProps = {
  role: "carrier" | "supplier";
};

type SearchableFeedPost = {
  author: string;
  avatarSrc: string;
  role: string;
  content: string;
  likes: number;
  comments: number;
  distributionId?: string;
  ownerEmail?: string;
  viewCount?: number;
  shareCount?: number;
  saveCount?: number;
};

type SearchableReelPost = {
  author: string;
  avatarSrc: string;
  handle: string;
  role: string;
  bio: string;
  title: string;
  caption: string;
  likes: string | number;
  comments: string | number;
  distributionId?: string;
  ownerEmail?: string;
  viewCount?: number;
  shareCount?: number;
  saveCount?: number;
};

const roleConfig = {
  carrier: {
    basePath: "/carrier/feed",
    label: "Search",
  },
  supplier: {
    basePath: "/supplier/feed",
    label: "Search",
  },
};

const RECENT_SEARCHES_LIMIT = 6;

const buildProfileHref = (
  basePath: string,
  profile: NetworkProfileRecord
) =>
  buildFeedProfileHref(basePath, {
    identityKey: profile.identityKey,
    profileId: profile.profileId,
    author: profile.author,
    role: profile.role,
    avatarSrc: profile.avatarSrc,
    bannerSrc: profile.bannerSrc,
  });

export default function SearchWorkspace({ role }: SearchWorkspaceProps) {
  const config = roleConfig[role];
  const recentSearchesStorageKey = `alpha-freight:recent-profile-searches:${role}`;
  const [searchQuery, setSearchQuery] = useState("");
  const [networkProfiles, setNetworkProfiles] = useState<NetworkProfileRecord[]>([]);
  const [recentSearches, setRecentSearches] = useState<NetworkProfileRecord[]>([]);
  const [erroredAvatarKeys, setErroredAvatarKeys] = useState<Record<string, boolean>>({});

  useEffect(() => {
    let isActive = true;

    const loadProfiles = async () => {
      const storedFeedPosts = readAllNetworkFeedPosts<SearchableFeedPost>();
      const storedReels = readAllNetworkReels<SearchableReelPost>();
      const localDirectoryProfiles = readLocalDirectoryProfiles();

      const { data: directoryProfiles } = await supabase
        .from("profiles")
        .select("*")
        .in("role", ["carrier", "supplier"]);

      if (!isActive) return;

      const mergedProfiles = assembleNetworkProfiles({
        feedPosts: storedFeedPosts,
        reelPosts: storedReels,
        directoryProfiles: (directoryProfiles || []) as DirectoryProfileRecord[],
        localDirectoryProfiles,
      });

      setNetworkProfiles(mergedProfiles);

      const storedRecentKeys = readStoredCollection<string>(recentSearchesStorageKey);
      const nextRecentProfiles = storedRecentKeys
        .map((identityKey) => mergedProfiles.find((profile) => profile.identityKey === identityKey) || null)
        .filter((profile): profile is NetworkProfileRecord => Boolean(profile))
        .slice(0, RECENT_SEARCHES_LIMIT);
      setRecentSearches(nextRecentProfiles);
    };

    void loadProfiles();

    window.addEventListener("alpha_profile_followers_updated", loadProfiles);
    window.addEventListener("storage", loadProfiles);
    window.addEventListener("focus", loadProfiles);

    return () => {
      isActive = false;
      window.removeEventListener("alpha_profile_followers_updated", loadProfiles);
      window.removeEventListener("storage", loadProfiles);
      window.removeEventListener("focus", loadProfiles);
    };
  }, [recentSearchesStorageKey]);

  const filteredProfiles = useMemo(
    () => filterNetworkProfiles(networkProfiles, searchQuery).slice(0, 12),
    [networkProfiles, searchQuery]
  );

  const persistRecentProfiles = (profiles: NetworkProfileRecord[]) => {
    setRecentSearches(profiles);
    window.localStorage.setItem(
      recentSearchesStorageKey,
      JSON.stringify(profiles.map((profile) => profile.identityKey))
    );
  };

  const handleSelectProfile = (profile: NetworkProfileRecord) => {
    const nextProfiles = [
      profile,
      ...recentSearches.filter((item) => item.identityKey !== profile.identityKey),
    ].slice(0, RECENT_SEARCHES_LIMIT);
    persistRecentProfiles(nextProfiles);
  };

  const handleRemoveRecent = (identityKey: string) => {
    persistRecentProfiles(recentSearches.filter((item) => item.identityKey !== identityKey));
  };

  const handleClearAllRecent = () => {
    persistRecentProfiles([]);
  };

  const renderProfileRow = (profile: NetworkProfileRecord, showRemove?: boolean) => {
    const avatarSrc = pickBestAvatarSrc(profile.avatarSrc) || "/default-avatar-square.png";

    return (
      <div key={profile.identityKey} className="flex items-center gap-3">
        <Link
          href={buildProfileHref(config.basePath, profile)}
          onClick={() => handleSelectProfile(profile)}
          className="flex min-w-0 flex-1 items-center gap-3 rounded-[16px] px-2 py-2 transition hover:bg-white/[0.04]"
        >
          <img
            src={erroredAvatarKeys[profile.identityKey] ? "/default-avatar-square.png" : avatarSrc}
            alt={profile.author}
            className="h-11 w-11 rounded-[14px] border border-white/10 object-cover"
            onError={() =>
              setErroredAvatarKeys((current) =>
                current[profile.identityKey] ? current : { ...current, [profile.identityKey]: true }
              )
            }
          />
          <div className="min-w-0 flex-1">
            <p className="truncate text-[13px] font-black text-white">{profile.author}</p>
            <p className="truncate text-[11px] font-semibold text-slate-400">
              {[profile.handle, profile.role].filter(Boolean).join(" . ")}
            </p>
            <p className="truncate text-[11px] text-slate-500">
              {profile.posts} posts · {profile.reels} reels · {profile.followers} followers
            </p>
          </div>
        </Link>
        {showRemove ? (
          <button
            type="button"
            onClick={() => handleRemoveRecent(profile.identityKey)}
            className="inline-flex h-8 w-8 items-center justify-center rounded-full text-slate-500 transition hover:bg-white/[0.05] hover:text-white"
            aria-label={`Remove ${profile.author} from recent searches`}
          >
            <X className="h-4 w-4" />
          </button>
        ) : null}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.05),transparent_22%),linear-gradient(180deg,#020202_0%,#040404_48%,#020202_100%)] text-white">
      <div className="mx-auto max-w-[920px] px-4 pb-10 pt-5 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3">
          <Link
            href={config.basePath}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/8 bg-white/[0.03] text-slate-300 transition hover:bg-white/[0.06] hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div className="flex-1 rounded-full border border-white/8 bg-white/[0.03] px-4 py-2.5">
            <div className="flex items-center gap-3">
              <Search className="h-4 w-4 text-slate-500" />
              <input
                autoFocus
                type="text"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Search"
                className="w-full bg-transparent text-[13px] font-medium text-white outline-none placeholder:text-slate-500"
              />
              {searchQuery ? (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="inline-flex h-7 w-7 items-center justify-center rounded-full text-slate-500 transition hover:bg-white/[0.05] hover:text-white"
                  aria-label="Clear search"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              ) : null}
            </div>
          </div>
        </div>

        <div className="mx-auto mt-8 max-w-[640px]">
          {searchQuery.trim() ? (
            <section>
              <div className="mb-3 flex items-center justify-between gap-3">
                <p className="text-[12px] font-black uppercase tracking-[0.18em] text-slate-500">
                  Search Results
                </p>
                <p className="text-[11px] font-semibold text-slate-500">
                  {filteredProfiles.length} profiles
                </p>
              </div>
              {filteredProfiles.length ? (
                <div className="space-y-1.5">
                  {filteredProfiles.map((profile, index) => (
                    <motion.div
                      key={profile.identityKey}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.18, delay: index * 0.02 }}
                    >
                      {renderProfileRow(profile)}
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="px-2 py-10 text-center">
                  <p className="text-[22px] font-black tracking-[-0.04em] text-white">No profiles found</p>
                  <p className="mx-auto mt-3 max-w-[360px] text-[13px] leading-6 text-slate-500">
                    Try another name, handle, role, or keyword to find a profile in your network.
                  </p>
                </div>
              )}
            </section>
          ) : (
            <section>
              <div className="mb-3 flex items-center justify-between gap-3">
                <p className="text-[12px] font-black uppercase tracking-[0.18em] text-slate-500">Recent</p>
                {recentSearches.length ? (
                  <button
                    type="button"
                    onClick={handleClearAllRecent}
                    className="text-[11px] font-bold text-sky-400 transition hover:text-sky-300"
                  >
                    Clear all
                  </button>
                ) : null}
              </div>
              {recentSearches.length ? (
                <div className="space-y-1.5">{recentSearches.map((profile) => renderProfileRow(profile, true))}</div>
              ) : (
                <div className="px-2 py-10 text-center">
                  <p className="text-[22px] font-black tracking-[-0.04em] text-white">No recent searches</p>
                  <p className="mx-auto mt-3 max-w-[360px] text-[13px] leading-6 text-slate-500">
                    Search for people in your network and your recent profile lookups will appear here.
                  </p>
                </div>
              )}
            </section>
          )}
        </div>
      </div>
    </div>
  );
}
