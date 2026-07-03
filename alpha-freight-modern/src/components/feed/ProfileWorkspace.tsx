"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  Film,
  Grid3X3,
  Heart,
  ImageOff,
  PlayCircle,
  Trash2,
  Users,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { readCarrierExtras, readSupplierExtras } from "@/lib/profile-extras";
import {
  getDiscoveryFeedPostsStorageKey,
  getDiscoveryReelsStorageKey,
  getCustomFeedPostsStorageKey,
  getCustomReelsStorageKey,
  deleteStoredMedia,
  hydrateStoredMediaUrls,
  readAllNetworkFeedPosts,
  readAllNetworkReels,
  readProfileFollowerKeys,
  readStoredCollection,
  revokeGeneratedObjectUrls,
  toggleProfileFollower,
  writeStoredCollection,
} from "./feed-storage";
import {
  appendIncomingFeedActivityItem,
  recordFollowEvent,
  removeFollowEvent,
  removeIncomingFollowActivityItem,
} from "./feed-activity";
import { persistFollowNotificationToSupabase, resolveRecipientProfileId } from "@/lib/feed-notifications";
import {
  persistFeedFollowToSupabase,
  removeFeedFollowFromSupabase,
  fetchFeedPostsByProfileKey,
} from "@/lib/feed-posts";
import {
  buildFeedProfileHref,
  buildNetworkProfiles,
  createProfileIdentityKey,
  findAvatarInFeedContent,
  isShareableImageParam,
  mergeDirectoryProfilesIntoMap,
  pickBestAvatarSrc,
  postMatchesProfileKey,
  readLocalDirectoryProfiles,
  resolveLocalProfileAvatar,
  resolveLocalProfileBanner,
  sortNetworkProfiles,
  isShareableAvatarParam,
  type DirectoryProfileRecord,
} from "./profile-search";

type ProfileWorkspaceProps = {
  role: "carrier" | "supplier";
};

type ProfileRecord = {
  full_name?: string | null;
  company_name?: string | null;
  created_at?: string | null;
  avatar_url?: string | null;
};

type UserFeedPost = {
  author: string;
  avatarSrc: string;
  time: string;
  role: string;
  content: string;
  likes: number;
  comments: number;
  imageSrc?: string;
  videoSrc?: string;
  imageWrapClassName?: string;
  imageClassName?: string;
  detailImageWrapClassName?: string;
  detailImageClassName?: string;
  imageStorageKey?: string;
  videoStorageKey?: string;
  distributionId?: string;
  ownerEmail?: string;
  ownerIdentityKey?: string;
  shareCount?: number;
  saveCount?: number;
  viewCount?: number;
  publishedAt?: string;
};

type UserReelPost = {
  author: string;
  avatarSrc: string;
  handle: string;
  role: string;
  time: string;
  bio: string;
  title: string;
  caption: string;
  likes: string;
  comments: string;
  videoSrc: string;
  thumbnailSrc?: string;
  lane?: string;
  vehicleType?: string;
  capacity?: string;
  videoStorageKey?: string;
  thumbnailStorageKey?: string;
  distributionId?: string;
  ownerEmail?: string;
  ownerIdentityKey?: string;
  shareCount?: number;
  saveCount?: number;
  viewCount?: number;
  publishedAt?: string;
};

type DeleteDialogState =
  | {
      type: "post";
      index: number;
      title: string;
      message: string;
    }
  | {
      type: "reel";
      index: number;
      title: string;
      message: string;
    };

const getProfileMediaStateKey = (post: UserFeedPost, fallbackKey: string | number): string =>
  post.imageStorageKey ||
  post.videoStorageKey ||
  post.imageSrc ||
  post.videoSrc ||
  `${post.author}-${post.time}-${post.content.slice(0, 48)}-${fallbackKey}`;

const roleConfig = {
  carrier: {
    basePath: "/carrier/feed",
    fallbackName: "Carrier Account",
    roleLabel: "Carrier",
    defaultBio: "Capacity-led carrier profile with live fleet posts, reels, and trusted lane updates.",
  },
  supplier: {
    basePath: "/supplier/feed",
    fallbackName: "Supplier Account",
    roleLabel: "Supplier",
    defaultBio: "Network-ready supplier profile with shipment updates, reels, and booking activity.",
  },
};

const formatCompactNumber = (value: number) => {
  if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
  if (value >= 1000) return `${(value / 1000).toFixed(1)}K`;
  return `${value}`;
};

function AnimatedFollowerCount({ value, bumpKey }: { value: number; bumpKey: number }) {
  return (
    <motion.span
      key={`${value}-${bumpKey}`}
      initial={bumpKey > 0 ? { scale: 1.55, y: -2, color: "#BFFF07" } : false}
      animate={{ scale: 1, y: 0, color: "#ffffff" }}
      transition={{ duration: 0.42, ease: [0.22, 1, 0.36, 1] }}
      className="inline-block text-white"
    >
      {formatCompactNumber(value)}
    </motion.span>
  );
}

const parseMetricNumber = (value: string | number | undefined) => {
  if (typeof value === "number") return value;

  const parsedValue = Number.parseInt(value || "0", 10);
  return Number.isNaN(parsedValue) ? 0 : parsedValue;
};

const normalizeIdentityValue = (value?: string | null) => (value || "").trim().toLowerCase();

export default function ProfileWorkspace({ role }: ProfileWorkspaceProps) {
  const searchParams = useSearchParams();
  const config = roleConfig[role];
  const [profile, setProfile] = useState<ProfileRecord | null>(null);
  const [userEmail, setUserEmail] = useState("");
  const [userId, setUserId] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [bannerUrl, setBannerUrl] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [bio, setBio] = useState(config.defaultBio);
  const [feedPosts, setFeedPosts] = useState<UserFeedPost[]>([]);
  const [reelPosts, setReelPosts] = useState<UserReelPost[]>([]);
  const [discoveryFeedPosts, setDiscoveryFeedPosts] = useState<UserFeedPost[]>([]);
  const [discoveryReels, setDiscoveryReels] = useState<UserReelPost[]>([]);
  const [externalNetworkPosts, setExternalNetworkPosts] = useState<UserFeedPost[]>([]);
  const [externalNetworkReels, setExternalNetworkReels] = useState<UserReelPost[]>([]);
  const [networkProfiles, setNetworkProfiles] = useState<ReturnType<typeof buildNetworkProfiles>>([]);
  const [activeTab, setActiveTab] = useState<"all" | "posts" | "reels">("all");
  const [autoPortraitFeedPostImages, setAutoPortraitFeedPostImages] = useState<Record<string, boolean>>(
    {}
  );
  const [erroredFeedPostImages, setErroredFeedPostImages] = useState<Record<string, boolean>>({});
  const [deletingPostIndex, setDeletingPostIndex] = useState<number | null>(null);
  const [deletingReelIndex, setDeletingReelIndex] = useState<number | null>(null);
  const [deleteDialog, setDeleteDialog] = useState<DeleteDialogState | null>(null);
  const [externalAvatarUrl, setExternalAvatarUrl] = useState("");
  const [externalBannerUrl, setExternalBannerUrl] = useState("");
  const [externalBio, setExternalBio] = useState("");
  const [followedProfileKeys, setFollowedProfileKeys] = useState<string[]>([]);
  const [followerCount, setFollowerCount] = useState(0);
  const [followerBumpKey, setFollowerBumpKey] = useState(0);
  const [isDisplayAvatarErrored, setIsDisplayAvatarErrored] = useState(false);
  const persistedMediaObjectUrlsRef = useRef<string[]>([]);
  const followStorageKey = useMemo(
    () => `alpha-freight:followed-profiles:${role}:${normalizeIdentityValue(userEmail) || "guest"}`,
    [role, userEmail]
  );

  useEffect(() => {
    async function loadProfileWorkspace() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return;

      setUserId(user.id);
      setUserEmail(user.email || "");

      const profileResponse = await supabase
        .from("profiles")
        .select("full_name, company_name, created_at, avatar_url")
        .eq("id", user.id)
        .single();

      setProfile((profileResponse.data || null) as ProfileRecord | null);

      if (role === "carrier") {
        const extras = readCarrierExtras(user.id);
        setAvatarUrl(extras.avatarUrl?.trim() || extras.logoUrl?.trim() || profileResponse.data?.avatar_url?.trim() || "");
        setBannerUrl(extras.bannerUrl?.trim() || "");
        setCompanyName(extras.companyName?.trim() || "");
        setBio(extras.description?.trim() || config.defaultBio);
      } else {
        const extras = readSupplierExtras(user.id);
        setAvatarUrl(extras.avatarUrl?.trim() || profileResponse.data?.avatar_url?.trim() || "");
        setBannerUrl(extras.bannerUrl?.trim() || "");
        setCompanyName(extras.companyName?.trim() || "");
        setBio(extras.industry?.trim() || config.defaultBio);
      }
    }

    loadProfileWorkspace();
  }, [config.defaultBio, role]);

  useEffect(() => {
    let isActive = true;

    const loadStoredProfileContent = async () => {
      const storedFeedPosts = readStoredCollection<UserFeedPost>(getCustomFeedPostsStorageKey(role, userEmail));
      const storedReelPosts = readStoredCollection<UserReelPost>(getCustomReelsStorageKey(role, userEmail));
      const storedDiscoveryFeedPosts = readStoredCollection<UserFeedPost>(getDiscoveryFeedPostsStorageKey());
      const storedDiscoveryReels = readStoredCollection<UserReelPost>(getDiscoveryReelsStorageKey());
      const [hydratedFeedPosts, hydratedReelPosts] = await Promise.all([
        hydrateStoredMediaUrls(storedFeedPosts),
        hydrateStoredMediaUrls(storedReelPosts),
      ]);

      if (!isActive) {
        revokeGeneratedObjectUrls([
          ...hydratedFeedPosts.generatedObjectUrls,
          ...hydratedReelPosts.generatedObjectUrls,
        ]);
        return;
      }

      revokeGeneratedObjectUrls(persistedMediaObjectUrlsRef.current);
      persistedMediaObjectUrlsRef.current = [
        ...hydratedFeedPosts.generatedObjectUrls,
        ...hydratedReelPosts.generatedObjectUrls,
      ];
      setFeedPosts(hydratedFeedPosts.items);
      setReelPosts(hydratedReelPosts.items);
      setDiscoveryFeedPosts(storedDiscoveryFeedPosts);
      setDiscoveryReels(storedDiscoveryReels);
    };

    void loadStoredProfileContent();

    return () => {
      isActive = false;
    };
  }, [role, userEmail]);

  useEffect(() => {
    let isActive = true;

    const loadNetworkProfiles = async () => {
      const allFeedPosts = readAllNetworkFeedPosts<UserFeedPost>();
      const allReelPosts = readAllNetworkReels<UserReelPost>();
      const nextProfiles = buildNetworkProfiles(allFeedPosts, allReelPosts);
      const profileMap = new Map(nextProfiles.map((profile) => [profile.identityKey, profile] as const));

      const { data: directoryProfiles } = await supabase
        .from("profiles")
        .select("*")
        .in("role", ["carrier", "supplier"]);

      mergeDirectoryProfilesIntoMap(
        profileMap,
        (directoryProfiles || []) as DirectoryProfileRecord[],
        readLocalDirectoryProfiles()
      );

      if (!isActive) return;

      setNetworkProfiles(sortNetworkProfiles([...profileMap.values()]));
    };

    void loadNetworkProfiles();

    return () => {
      isActive = false;
    };
  }, [discoveryFeedPosts, discoveryReels]);

  useEffect(() => {
    return () => {
      revokeGeneratedObjectUrls(persistedMediaObjectUrlsRef.current);
    };
  }, []);

  const profileName = useMemo(() => {
    return (
      companyName ||
      profile?.company_name?.trim() ||
      profile?.full_name?.trim() ||
      userEmail.split("@")[0] ||
      config.fallbackName
    );
  }, [companyName, config.fallbackName, profile, userEmail]);

  const profileHandle = useMemo(() => {
    const source = userEmail || profileName;
    return `@${source.split("@")[0].replace(/\s+/g, "").toLowerCase()}`;
  }, [profileName, userEmail]);

  const profileInitials = useMemo(() => {
    const parts = profileName
      .split(" ")
      .map((item) => item.trim())
      .filter(Boolean)
      .slice(0, 2);

    if (!parts.length) return role === "carrier" ? "C" : "S";

    return parts.map((item) => item[0]?.toUpperCase() || "").join("");
  }, [profileName, role]);
  const selectedProfileKey = useMemo(
    () => normalizeIdentityValue(searchParams.get("profile")),
    [searchParams]
  );
  const selectedProfileId = useMemo(() => searchParams.get("profileId")?.trim() || "", [searchParams]);
  const selectedProfileName = useMemo(() => searchParams.get("name")?.trim() || "", [searchParams]);
  const selectedProfileRoleLabel = useMemo(() => searchParams.get("roleLabel")?.trim() || "", [searchParams]);
  const selectedProfileRole = useMemo(
    () => normalizeIdentityValue(searchParams.get("profileRole") || selectedProfileRoleLabel),
    [searchParams, selectedProfileRoleLabel]
  );
  const selectedProfileAvatarParam = useMemo(() => {
    const rawAvatar = searchParams.get("avatarSrc")?.trim() || "";
    return isShareableAvatarParam(rawAvatar) ? rawAvatar : "";
  }, [searchParams]);
  const selectedProfileBannerParam = useMemo(() => {
    const rawBanner = searchParams.get("bannerSrc")?.trim() || "";
    return isShareableImageParam(rawBanner) ? rawBanner : "";
  }, [searchParams]);
  const ownProfileIdentityKey = useMemo(
    () =>
      createProfileIdentityKey({
        ownerEmail: userEmail,
        author: profileName,
      }),
    [profileName, userEmail]
  );
  const networkProfilesFromFeed = networkProfiles;
  const selectedNetworkProfile = useMemo(() => {
    const byIdentityKey = networkProfilesFromFeed.find((item) => item.identityKey === selectedProfileKey);
    if (byIdentityKey) return byIdentityKey;

    if (selectedProfileId) {
      return networkProfilesFromFeed.find((item) => item.profileId === selectedProfileId) || null;
    }

    return null;
  }, [networkProfilesFromFeed, selectedProfileId, selectedProfileKey]);
  const selectedProfileFallback = useMemo(
    () =>
      selectedProfileKey && selectedProfileName
        ? {
            author: selectedProfileName,
            role: selectedProfileRoleLabel,
          }
        : null,
    [selectedProfileKey, selectedProfileName, selectedProfileRoleLabel]
  );
  const isExternalProfile = Boolean(
    selectedProfileKey &&
      selectedProfileKey !== ownProfileIdentityKey &&
      (selectedNetworkProfile || selectedProfileFallback)
  );
  const isFollowingExternalProfile = Boolean(
    selectedProfileKey && followedProfileKeys.includes(selectedProfileKey)
  );

  useEffect(() => {
    if (!isExternalProfile || !selectedProfileKey) {
      setExternalNetworkPosts([]);
      setExternalNetworkReels([]);
      return;
    }

    let isActive = true;

    const loadExternalProfileContent = async () => {
      const localPosts = readAllNetworkFeedPosts<UserFeedPost>().filter((post) =>
        postMatchesProfileKey(post, selectedProfileKey)
      );
      const localReels = readAllNetworkReels<UserReelPost>().filter((reel) =>
        postMatchesProfileKey(
          {
            ownerEmail: reel.ownerEmail,
            ownerIdentityKey: reel.ownerIdentityKey,
            author: reel.author,
          },
          selectedProfileKey
        )
      );

      const { data: remotePosts } = await fetchFeedPostsByProfileKey(selectedProfileKey, 100);

      if (!isActive) return;

      const postMap = new Map<string, UserFeedPost>();
      localPosts.forEach((post) => {
        if (post.distributionId) postMap.set(post.distributionId, post);
      });
      discoveryFeedPosts
        .filter((post) => postMatchesProfileKey(post, selectedProfileKey))
        .forEach((post) => {
          if (post.distributionId) postMap.set(post.distributionId, post);
        });
      remotePosts.forEach((post) => {
        if (post.distributionId) {
          postMap.set(post.distributionId, post as UserFeedPost);
        }
      });

      const reelMap = new Map<string, UserReelPost>();
      localReels.forEach((reel) => {
        if (reel.distributionId) reelMap.set(reel.distributionId, reel);
      });
      discoveryReels
        .filter((reel) =>
          postMatchesProfileKey(
            {
              ownerEmail: reel.ownerEmail,
              ownerIdentityKey: reel.ownerIdentityKey,
              author: reel.author,
            },
            selectedProfileKey
          )
        )
        .forEach((reel) => {
          if (reel.distributionId) reelMap.set(reel.distributionId, reel);
        });

      const sortPostsByDate = (items: UserFeedPost[]) =>
        [...items].sort(
          (left, right) =>
            new Date(right.publishedAt || right.time || 0).getTime() -
            new Date(left.publishedAt || left.time || 0).getTime()
        );

      const sortReelsByDate = (items: UserReelPost[]) =>
        [...items].sort(
          (left, right) =>
            new Date(right.publishedAt || right.time || 0).getTime() -
            new Date(left.publishedAt || left.time || 0).getTime()
        );

      setExternalNetworkPosts(sortPostsByDate([...postMap.values()]));
      setExternalNetworkReels(sortReelsByDate([...reelMap.values()]));
    };

    void loadExternalProfileContent();

    return () => {
      isActive = false;
    };
  }, [discoveryFeedPosts, discoveryReels, isExternalProfile, selectedProfileKey]);

  const externalFeedPosts = externalNetworkPosts;
  const externalReelPosts = externalNetworkReels;

  const normalizedUserEmail = useMemo(() => normalizeIdentityValue(userEmail), [userEmail]);
  const profileDistributionIds = useMemo(() => {
    const ids = [
      ...feedPosts.map((post) => post.distributionId),
      ...reelPosts.map((reel) => reel.distributionId),
    ].filter((value): value is string => Boolean(value));

    return new Set(ids);
  }, [feedPosts, reelPosts]);

  const ownDiscoveryFeedPosts = useMemo(
    () =>
      discoveryFeedPosts.filter(
        (post) =>
          (post.distributionId && profileDistributionIds.has(post.distributionId)) ||
          (normalizedUserEmail && normalizeIdentityValue(post.ownerEmail) === normalizedUserEmail)
      ),
    [discoveryFeedPosts, normalizedUserEmail, profileDistributionIds]
  );
  const ownDiscoveryReels = useMemo(
    () =>
      discoveryReels.filter(
        (reel) =>
          (reel.distributionId && profileDistributionIds.has(reel.distributionId)) ||
          (normalizedUserEmail && normalizeIdentityValue(reel.ownerEmail) === normalizedUserEmail)
      ),
    [discoveryReels, normalizedUserEmail, profileDistributionIds]
  );
  const feedMetricsByDistributionId = useMemo(() => {
    const nextMap = new Map<string, UserFeedPost>();
    ownDiscoveryFeedPosts.forEach((post) => {
      if (post.distributionId) {
        nextMap.set(post.distributionId, post);
      }
    });
    return nextMap;
  }, [ownDiscoveryFeedPosts]);
  const reelMetricsByDistributionId = useMemo(() => {
    const nextMap = new Map<string, UserReelPost>();
    ownDiscoveryReels.forEach((reel) => {
      if (reel.distributionId) {
        nextMap.set(reel.distributionId, reel);
      }
    });
    return nextMap;
  }, [ownDiscoveryReels]);
  const profileStats = useMemo(() => {
    const totalPosts = feedPosts.length;
    const totalReels = reelPosts.length;
    const totalLikes =
      ownDiscoveryFeedPosts.reduce((sum, post) => sum + post.likes, 0) +
      ownDiscoveryReels.reduce((sum, reel) => sum + parseMetricNumber(reel.likes), 0);
    const totalComments =
      ownDiscoveryFeedPosts.reduce((sum, post) => sum + post.comments, 0) +
      ownDiscoveryReels.reduce((sum, reel) => sum + parseMetricNumber(reel.comments), 0);
    const totalShares =
      ownDiscoveryFeedPosts.reduce((sum, post) => sum + (post.shareCount || 0), 0) +
      ownDiscoveryReels.reduce((sum, reel) => sum + (reel.shareCount || 0), 0);
    const totalSaves =
      ownDiscoveryFeedPosts.reduce((sum, post) => sum + (post.saveCount || 0), 0) +
      ownDiscoveryReels.reduce((sum, reel) => sum + (reel.saveCount || 0), 0);
    const totalViews =
      ownDiscoveryFeedPosts.reduce((sum, post) => sum + (post.viewCount || 0), 0) +
      ownDiscoveryReels.reduce((sum, reel) => sum + (reel.viewCount || 0), 0);

    return {
      posts: totalPosts,
      reels: totalReels,
      followers: followerCount,
      following: followedProfileKeys.length,
      views: totalViews,
      engagement: totalLikes + totalComments + totalShares + totalSaves,
    };
  }, [feedPosts, followerCount, followedProfileKeys.length, ownDiscoveryFeedPosts, ownDiscoveryReels, reelPosts]);
  const displayProfileName = isExternalProfile
    ? selectedNetworkProfile?.author || selectedProfileFallback?.author || profileName
    : profileName;
  const displayProfileHandle = isExternalProfile
    ? selectedNetworkProfile?.handle ||
      `@${(selectedNetworkProfile?.author || selectedProfileFallback?.author || profileName)
        .replace(/\s+/g, "")
        .toLowerCase()}`
    : profileHandle;
  const displayProfileInitials = useMemo(() => {
    const parts = displayProfileName
      .split(" ")
      .map((item) => item.trim())
      .filter(Boolean)
      .slice(0, 2);

    if (!parts.length) return role === "carrier" ? "C" : "S";

    return parts.map((item) => item[0]?.toUpperCase() || "").join("");
  }, [displayProfileName, role]);
  const displayAvatarUrl = isExternalProfile
    ? pickBestAvatarSrc(
        externalAvatarUrl,
        selectedProfileAvatarParam,
        selectedNetworkProfile?.avatarSrc,
        findAvatarInFeedContent(
          selectedProfileKey,
          selectedProfileId,
          discoveryFeedPosts,
          discoveryReels,
          displayProfileName
        )
      ) || "/default-avatar-square.png"
    : pickBestAvatarSrc(avatarUrl) || "/default-avatar-square.png";
  const displayBannerUrl = isExternalProfile
    ? selectedProfileBannerParam ||
      externalBannerUrl ||
      selectedNetworkProfile?.bannerSrc ||
      resolveLocalProfileBanner(selectedProfileId, selectedProfileRole) ||
      ""
    : bannerUrl;
  const displayBio = isExternalProfile
    ? selectedNetworkProfile?.bio || externalBio || "Profile details and published content appear here."
    : bio;
  const displayRoleLabel = isExternalProfile
    ? selectedNetworkProfile?.role || selectedProfileFallback?.role || config.roleLabel
    : config.roleLabel;
  const displayProfileStats = isExternalProfile
    ? {
        posts: externalFeedPosts.length || selectedNetworkProfile?.posts || 0,
        reels: externalReelPosts.length || selectedNetworkProfile?.reels || 0,
        followers: followerCount,
        following: 0,
        views:
          externalFeedPosts.reduce((sum, post) => sum + (post.viewCount || 0), 0) ||
          selectedNetworkProfile?.views ||
          0,
        engagement:
          externalFeedPosts.reduce((sum, post) => sum + post.likes + post.comments, 0) ||
          selectedNetworkProfile?.engagement ||
          0,
      }
    : profileStats;

  useEffect(() => {
    setIsDisplayAvatarErrored(false);
  }, [displayAvatarUrl, selectedProfileKey]);

  useEffect(() => {
    setFollowerBumpKey(0);
  }, [selectedProfileKey]);

  useEffect(() => {
    const storedFollowedProfiles = readStoredCollection<string>(followStorageKey);
    setFollowedProfileKeys(storedFollowedProfiles);
  }, [followStorageKey]);

  useEffect(() => {
    const profileKey = isExternalProfile ? selectedProfileKey : ownProfileIdentityKey;
    if (!profileKey) {
      setFollowerCount(0);
      return;
    }

    let nextFollowerCount = readProfileFollowerKeys(profileKey).length;

    if (
      isExternalProfile &&
      ownProfileIdentityKey &&
      followedProfileKeys.includes(profileKey) &&
      !readProfileFollowerKeys(profileKey).includes(ownProfileIdentityKey)
    ) {
      nextFollowerCount = toggleProfileFollower(profileKey, ownProfileIdentityKey, true);
    }

    setFollowerCount(nextFollowerCount);
  }, [
    followedProfileKeys,
    isExternalProfile,
    ownProfileIdentityKey,
    selectedProfileKey,
  ]);

  useEffect(() => {
    const handleFollowersUpdated = (event: Event) => {
      const customEvent = event as CustomEvent<{ profileKey?: string }>;
      const updatedProfileKey = customEvent.detail?.profileKey?.trim().toLowerCase();
      const activeProfileKey = isExternalProfile ? selectedProfileKey : ownProfileIdentityKey;

      if (!updatedProfileKey || !activeProfileKey || updatedProfileKey !== activeProfileKey) return;

      setFollowerCount(readProfileFollowerKeys(activeProfileKey).length);
    };

    window.addEventListener("alpha_profile_followers_updated", handleFollowersUpdated);

    return () => {
      window.removeEventListener("alpha_profile_followers_updated", handleFollowersUpdated);
    };
  }, [isExternalProfile, ownProfileIdentityKey, selectedProfileKey]);

  useEffect(() => {
    if (!isExternalProfile) {
      setExternalAvatarUrl("");
      setExternalBannerUrl("");
      setExternalBio("");
      return;
    }

    let isActive = true;

    const loadExternalProfileAssets = async () => {
      let supabaseAvatar = "";

      if (selectedProfileId) {
        const extras =
          selectedProfileRole === "supplier"
            ? readSupplierExtras(selectedProfileId)
            : readCarrierExtras(selectedProfileId);

        const profileResponse = await supabase
          .from("profiles")
          .select("avatar_url, banner_url, full_name, company_name")
          .eq("id", selectedProfileId)
          .maybeSingle();

        if (!isActive) return;

        supabaseAvatar = profileResponse.data?.avatar_url?.trim() || "";
        const supabaseBanner = profileResponse.data?.banner_url?.trim() || "";

        setExternalBannerUrl(
          selectedProfileBannerParam ||
            supabaseBanner ||
            extras.bannerUrl?.trim() ||
            selectedNetworkProfile?.bannerSrc ||
            resolveLocalProfileBanner(selectedProfileId, selectedProfileRole) ||
            ""
        );
        setExternalBio(
          ("description" in extras ? extras.description : undefined)?.trim?.() ||
            ("industry" in extras ? extras.industry : undefined)?.trim?.() ||
            ""
        );
      } else {
        setExternalBannerUrl(
          selectedProfileBannerParam || selectedNetworkProfile?.bannerSrc || ""
        );
      }

      const feedAvatar = findAvatarInFeedContent(
        selectedProfileKey,
        selectedProfileId,
        discoveryFeedPosts,
        discoveryReels,
        selectedProfileName || selectedNetworkProfile?.author
      );

      if (!isActive) return;

      setExternalAvatarUrl(
        pickBestAvatarSrc(
          selectedProfileAvatarParam,
          selectedProfileId ? resolveLocalProfileAvatar(selectedProfileId, selectedProfileRole) : "",
          feedAvatar,
          selectedNetworkProfile?.avatarSrc,
          supabaseAvatar
        )
      );
    };

    void loadExternalProfileAssets();

    return () => {
      isActive = false;
    };
  }, [
    discoveryFeedPosts,
    discoveryReels,
    isExternalProfile,
    selectedNetworkProfile?.avatarSrc,
    selectedProfileAvatarParam,
    selectedProfileBannerParam,
    selectedProfileId,
    selectedProfileKey,
    selectedProfileName,
    selectedProfileRole,
    selectedNetworkProfile?.author,
    selectedNetworkProfile?.bannerSrc,
  ]);

  const handleToggleFollowProfile = async () => {
    if (!selectedProfileKey || !ownProfileIdentityKey) return;

    const willFollow = !isFollowingExternalProfile;
    const nextFollowedKeys = willFollow
      ? followedProfileKeys.includes(selectedProfileKey)
        ? followedProfileKeys
        : [...followedProfileKeys, selectedProfileKey]
      : followedProfileKeys.filter((item) => item !== selectedProfileKey);

    setFollowedProfileKeys(nextFollowedKeys);
    writeStoredCollection(followStorageKey, nextFollowedKeys);

    const nextFollowerCount = toggleProfileFollower(selectedProfileKey, ownProfileIdentityKey, willFollow);
    setFollowerCount(nextFollowerCount);

    const followedProfileName =
      selectedNetworkProfile?.author || selectedProfileName || displayProfileName;

    if (willFollow) {
      setFollowerBumpKey((current) => current + 1);

      const followerProfileHref = buildFeedProfileHref(config.basePath, {
        identityKey: ownProfileIdentityKey,
        profileId: userId || "",
        author: profileName,
        role: config.roleLabel,
        avatarSrc: pickBestAvatarSrc(avatarUrl),
        bannerSrc: bannerUrl,
      });

      const recipientProfileId = await resolveRecipientProfileId({
        profileId: selectedProfileId || selectedNetworkProfile?.profileId,
        profileIdentityKey: selectedProfileKey,
        displayName: followedProfileName,
      });

      appendIncomingFeedActivityItem(recipientProfileId || undefined, selectedProfileKey, {
        type: "follow",
        actor: profileName,
        actorAvatar: pickBestAvatarSrc(avatarUrl) || "/default-avatar-square.png",
        message: "started following you",
        href: followerProfileHref,
        actorProfileKey: ownProfileIdentityKey,
        actorProfileId: userId || undefined,
        actorRole: role,
      });

      recordFollowEvent({
        targetProfileId: recipientProfileId || "",
        targetProfileIdentityKey: selectedProfileKey,
        actorProfileId: userId || "",
        actorProfileKey: ownProfileIdentityKey,
        actorName: profileName,
        actorAvatar: pickBestAvatarSrc(avatarUrl) || "/default-avatar-square.png",
        actorRole: role,
        href: followerProfileHref,
      });

      if (userId && recipientProfileId) {
        const result = await persistFollowNotificationToSupabase({
          recipientId: recipientProfileId,
          recipientProfileKey: selectedProfileKey,
          actorId: userId,
          actorName: profileName,
          actorAvatar: pickBestAvatarSrc(avatarUrl) || "/default-avatar-square.png",
          actorRole: role,
          actorProfileKey: ownProfileIdentityKey,
          href: followerProfileHref,
        });

        if (!result.ok) {
          console.warn("[ProfileWorkspace] Follow notification not saved:", result.error);
        }
      } else if (userId && !recipientProfileId) {
        console.warn(
          "[ProfileWorkspace] Could not resolve recipient account id. Cross-browser follow notifications need a registered Supabase profile."
        );
      }

      if (userId) {
        const followResult = await persistFeedFollowToSupabase({
          followerId: userId,
          followerProfileKey: ownProfileIdentityKey,
          followedProfileKey: selectedProfileKey,
          followedProfileId: recipientProfileId || selectedProfileId || selectedNetworkProfile?.profileId,
        });

        if (!followResult.ok) {
          console.warn("[ProfileWorkspace] Follow not saved to Supabase:", followResult.error);
        }
      }
    } else {
      const recipientProfileId =
        selectedProfileId ||
        selectedNetworkProfile?.profileId ||
        (await resolveRecipientProfileId({
          profileId: selectedProfileId || selectedNetworkProfile?.profileId,
          profileIdentityKey: selectedProfileKey,
          displayName: followedProfileName,
        })) ||
        undefined;

      removeIncomingFollowActivityItem(
        recipientProfileId,
        selectedProfileKey,
        ownProfileIdentityKey,
        userId || undefined
      );
      removeFollowEvent(recipientProfileId || "", selectedProfileKey, ownProfileIdentityKey);

      if (userId) {
        void removeFeedFollowFromSupabase({
          followerId: userId,
          followedProfileKey: selectedProfileKey,
        });
      }
    }

    window.dispatchEvent(
      new CustomEvent("alpha_profile_followers_updated", {
        detail: { profileKey: selectedProfileKey },
      })
    );
  };

  const visibleFeedPosts = activeTab === "reels" ? [] : isExternalProfile ? externalFeedPosts : feedPosts;
  const visibleReels = activeTab === "posts" ? [] : isExternalProfile ? externalReelPosts : reelPosts;

  const handleDeleteFeedPost = async (postIndex: number) => {
    const targetPost = feedPosts[postIndex];
    if (!targetPost) return;

    setDeleteDialog({
      type: "post",
      index: postIndex,
      title: "Delete Post",
      message: "This post will be removed from your profile and feed.",
    });
  };

  const handleConfirmDeleteFeedPost = async (postIndex: number) => {
    const targetPost = feedPosts[postIndex];
    if (!targetPost) return;

    setDeleteDialog(null);
    setDeletingPostIndex(postIndex);

    try {
      if (targetPost.imageSrc?.startsWith("blob:")) {
        URL.revokeObjectURL(targetPost.imageSrc);
      }
      if (targetPost.videoSrc?.startsWith("blob:")) {
        URL.revokeObjectURL(targetPost.videoSrc);
      }

      await Promise.all([
        deleteStoredMedia(targetPost.imageStorageKey),
        deleteStoredMedia(targetPost.videoStorageKey),
      ]);

      const nextPosts = feedPosts.filter((_, index) => index !== postIndex);
      const discoveryFeedStorageKey = getDiscoveryFeedPostsStorageKey();
      const discoveryFeedPosts = readStoredCollection<UserFeedPost>(discoveryFeedStorageKey);
      const nextDiscoveryFeedPosts = targetPost.distributionId
        ? discoveryFeedPosts.filter((post) => post.distributionId !== targetPost.distributionId)
        : discoveryFeedPosts;
      setFeedPosts(nextPosts);
      writeStoredCollection(getCustomFeedPostsStorageKey(role, userEmail), nextPosts);
      writeStoredCollection(discoveryFeedStorageKey, nextDiscoveryFeedPosts);
    } finally {
      setDeletingPostIndex(null);
    }
  };

  const handleDeleteReel = async (reelIndex: number) => {
    const targetReel = reelPosts[reelIndex];
    if (!targetReel) return;

    setDeleteDialog({
      type: "reel",
      index: reelIndex,
      title: "Delete Reel",
      message: "This reel will be removed from your profile and saved media.",
    });
  };

  const handleConfirmDeleteReel = async (reelIndex: number) => {
    const targetReel = reelPosts[reelIndex];
    if (!targetReel) return;

    setDeleteDialog(null);
    setDeletingReelIndex(reelIndex);

    try {
      if (targetReel.videoSrc?.startsWith("blob:")) {
        URL.revokeObjectURL(targetReel.videoSrc);
      }
      if (targetReel.thumbnailSrc?.startsWith("blob:")) {
        URL.revokeObjectURL(targetReel.thumbnailSrc);
      }

      await Promise.all([
        deleteStoredMedia(targetReel.videoStorageKey),
        deleteStoredMedia(targetReel.thumbnailStorageKey),
      ]);

      const nextReels = reelPosts.filter((_, index) => index !== reelIndex);
      const discoveryReelStorageKey = getDiscoveryReelsStorageKey();
      const discoveryReels = readStoredCollection<UserReelPost>(discoveryReelStorageKey);
      const nextDiscoveryReels = targetReel.distributionId
        ? discoveryReels.filter((reel) => reel.distributionId !== targetReel.distributionId)
        : discoveryReels;
      setReelPosts(nextReels);
      writeStoredCollection(getCustomReelsStorageKey(role, userEmail), nextReels);
      writeStoredCollection(discoveryReelStorageKey, nextDiscoveryReels);
    } finally {
      setDeletingReelIndex(null);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteDialog) return;

    if (deleteDialog.type === "post") {
      await handleConfirmDeleteFeedPost(deleteDialog.index);
      return;
    }

    await handleConfirmDeleteReel(deleteDialog.index);
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.05),transparent_22%),linear-gradient(180deg,#020202_0%,#040404_48%,#020202_100%)] text-white">
      <div className="border-b border-white/8 px-3 pb-3 pt-3 sm:px-4 lg:px-5">
        <div className="flex w-full items-center justify-between gap-3">
          <Link
            href={config.basePath}
            className="inline-flex items-center gap-2 rounded-[10px] bg-white/[0.06] px-3 py-1.5 text-[11px] font-black text-white transition hover:bg-white/[0.1]"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Link>
          <div className="inline-flex items-center gap-2 rounded-[10px] bg-white/[0.04] px-3 py-1.5 text-[11px] font-bold text-slate-300">
            <Users className="h-4 w-4 text-white/90" />
            {displayProfileName}
          </div>
        </div>
      </div>

      <div className="px-3 pb-8 pt-4 sm:px-4 lg:px-5">
        <div className="mx-auto max-w-[1180px] space-y-5">
            <section className="overflow-hidden rounded-[30px] border border-white/7 bg-[linear-gradient(180deg,rgba(10,10,10,0.96)_0%,rgba(5,5,5,0.98)_100%)] shadow-[0_28px_90px_rgba(0,0,0,0.36)]">
              <div className="relative h-[208px] overflow-hidden border-b border-white/7 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.10),transparent_34%),linear-gradient(135deg,#141414_0%,#090909_50%,#030303_100%)]">
                {displayBannerUrl ? (
                  <img src={displayBannerUrl} alt={displayProfileName} className="h-full w-full object-cover" />
                ) : null}
                <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,0.10)_0%,rgba(0,0,0,0.26)_55%,rgba(0,0,0,0.64)_100%)]" />
              </div>

              <div className="relative px-4 pb-7 pt-4 sm:px-5 sm:pb-8">
                <div className="-mt-2 flex flex-col gap-6">
                  <div className="flex min-w-0 items-start justify-between gap-3.5">
                    <div className="flex min-w-0 items-start gap-3.5">
                    {displayAvatarUrl ? (
                      <img
                        src={isDisplayAvatarErrored ? "/default-avatar-square.png" : displayAvatarUrl}
                        alt={displayProfileName}
                        className="mt-2 h-[82px] w-[82px] rounded-[24px] border border-white/10 bg-[#050505] object-cover shadow-[0_18px_40px_rgba(0,0,0,0.32)]"
                        onError={() => setIsDisplayAvatarErrored(true)}
                      />
                    ) : (
                      <div className="mt-2 flex h-[82px] w-[82px] items-center justify-center rounded-[24px] border border-white/10 bg-[#0d0d0d] text-[24px] font-black text-white shadow-[0_18px_40px_rgba(0,0,0,0.32)]">
                        {displayProfileInitials}
                      </div>
                    )}
                    <div className="min-w-0 pt-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <h1 className="truncate text-[18px] font-black tracking-[-0.03em] text-white sm:text-[20px]">
                          {displayProfileName}
                        </h1>
                        <span className="rounded-full border border-white/8 bg-white/[0.04] px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.18em] text-slate-300">
                          {displayRoleLabel}
                        </span>
                      </div>
                      <p className="mt-1 text-[11px] font-semibold text-slate-500">{displayProfileHandle}</p>
                      <p className="mt-2.5 max-w-[640px] text-[12px] leading-6 text-slate-300">{displayBio}</p>
                      <div className="mt-3.5 flex flex-wrap items-center justify-start gap-x-2.5 gap-y-1 text-[12px] font-semibold text-slate-400">
                        <span className="inline-flex items-center gap-1.5">
                          <Users className="h-4 w-4 text-slate-500" />
                          <span className="text-white">{formatCompactNumber(displayProfileStats.following)}</span>
                          <span>Following</span>
                        </span>
                        <span className="text-slate-600">·</span>
                        <span className="inline-flex items-center gap-1.5">
                          <AnimatedFollowerCount value={displayProfileStats.followers} bumpKey={followerBumpKey} />
                          <span>Followers</span>
                        </span>
                        <span className="text-slate-600">·</span>
                        <span className="inline-flex items-center gap-1.5">
                          <span className="text-white">{formatCompactNumber(displayProfileStats.posts)}</span>
                          <span>Posts</span>
                        </span>
                        <span className="text-slate-600">·</span>
                        <span className="inline-flex items-center gap-1.5">
                          <span className="text-white">{formatCompactNumber(displayProfileStats.views)}</span>
                          <span>Views</span>
                        </span>
                      </div>
                    </div>
                    </div>
                    {isExternalProfile ? (
                      <button
                        type="button"
                        onClick={handleToggleFollowProfile}
                        className={`mt-3 inline-flex shrink-0 items-center self-start rounded-full px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.16em] transition ${
                          isFollowingExternalProfile
                            ? "border border-white/10 bg-white/[0.04] text-slate-200 hover:bg-white/[0.08]"
                            : "border border-[#1292FF]/30 bg-[#1292FF]/14 text-[#8DCCFF] hover:bg-[#1292FF]/20"
                        }`}
                      >
                        {isFollowingExternalProfile ? "Following" : "Follow"}
                      </button>
                    ) : null}
                  </div>
                </div>
              </div>
            </section>

            <section className="flex flex-wrap items-center justify-between gap-3 border-b border-white/8 pb-4">
              <div className="flex items-center gap-5">
                {[
                  { id: "all", label: "All", icon: Grid3X3 },
                  { id: "posts", label: "Posts", icon: Heart },
                  { id: "reels", label: "Reels", icon: Film },
                ].map((item) => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id;

                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setActiveTab(item.id as "all" | "posts" | "reels")}
                      className={`inline-flex items-center gap-2 pb-1 text-[11px] font-black uppercase tracking-[0.14em] transition ${
                        isActive ? "border-b-2 border-white text-white" : "text-slate-500 hover:text-white"
                      }`}
                    >
                      <Icon className="h-3.5 w-3.5" />
                      {item.label}
                    </button>
                  );
                })}
              </div>
              <div className="rounded-full border border-white/6 bg-white/[0.02] px-3.5 py-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                {displayProfileStats.posts} posts . {displayProfileStats.reels} reels . {formatCompactNumber(displayProfileStats.engagement)} engagement
              </div>
            </section>

            {visibleFeedPosts.length ? (
              <section className="space-y-4">
                {visibleFeedPosts.map((post, index) => (
                  (() => {
                    const mediaStateKey = getProfileMediaStateKey(post, index);
                    const livePostMetrics = post.distributionId ? feedMetricsByDistributionId.get(post.distributionId) : undefined;
                    const displayedLikes = livePostMetrics?.likes ?? post.likes;
                    const displayedComments = livePostMetrics?.comments ?? post.comments;
                    const displayedViews = livePostMetrics?.viewCount ?? post.viewCount ?? 0;
                    return (
                  <motion.article
                    key={`${post.author}-${post.time}-${index}`}
                    initial={{ opacity: 0, y: 18 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.24, ease: "easeOut", delay: index * 0.03 }}
                    className="rounded-[28px] border border-white/8 bg-[#070707] p-4 shadow-[0_24px_60px_rgba(0,0,0,0.24)]"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <img
                          src={post.avatarSrc || "/default-avatar-square.png"}
                          alt={post.author}
                          className="h-11 w-11 rounded-[14px] object-cover"
                        />
                        <div className="min-w-0">
                          <p className="truncate text-[13px] font-black text-white">{post.author}</p>
                          <p className="truncate text-[11px] font-semibold text-slate-500">
                            {post.role} . {post.time}
                          </p>
                        </div>
                      </div>
                      {isExternalProfile ? null : (
                        <button
                          type="button"
                          onClick={() => void handleDeleteFeedPost(index)}
                          disabled={deletingPostIndex === index}
                          className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/8 bg-white/[0.03] text-slate-400 transition hover:border-rose-400/40 hover:bg-rose-500/10 hover:text-rose-300 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                    <p className="mt-4 text-[14px] leading-7 text-slate-200">{post.content}</p>
                    {post.imageSrc ? (
                      erroredFeedPostImages[mediaStateKey] ? (
                        <div className="mt-4 flex items-center gap-2 rounded-[24px] border border-white/8 bg-white/[0.02] px-4 py-3 text-[11px] font-semibold text-slate-500">
                          <ImageOff className="h-4 w-4" />
                          Media unavailable
                        </div>
                      ) : (
                        <div
                          className={`${
                            post.imageWrapClassName
                              ? post.imageWrapClassName
                              : autoPortraitFeedPostImages[mediaStateKey]
                                ? "mt-4 flex items-center justify-center overflow-hidden rounded-[24px] border border-white/8 bg-black"
                                : "mt-4 overflow-hidden rounded-[24px] border border-white/8 bg-black"
                          }`}
                        >
                          <img
                            src={post.imageSrc}
                            alt={post.author}
                            onLoad={(event) => {
                              if (post.imageClassName) return;
                              const element = event.currentTarget;
                              const isPortrait = element.naturalHeight > element.naturalWidth * 1.08;
                              if (!isPortrait) return;
                              setAutoPortraitFeedPostImages((current) =>
                                current[mediaStateKey] ? current : { ...current, [mediaStateKey]: true }
                              );
                            }}
                            onError={() => {
                              setErroredFeedPostImages((current) =>
                                current[mediaStateKey] ? current : { ...current, [mediaStateKey]: true }
                              );
                            }}
                            className={post.imageClassName ? post.imageClassName : autoPortraitFeedPostImages[mediaStateKey] ? "h-auto w-auto max-h-[440px] max-w-[320px] object-contain" : "h-auto w-full object-cover"}
                          />
                        </div>
                      )
                    ) : null}
                    {post.videoSrc ? (
                      <div className="mt-4 overflow-hidden rounded-[24px] border border-white/8 bg-black">
                        <video
                          src={post.videoSrc}
                          controls
                          playsInline
                          preload="metadata"
                          controlsList="nofullscreen nodownload noplaybackrate"
                          disablePictureInPicture
                          className="w-full"
                        />
                      </div>
                    ) : null}
                    <div className="mt-4 flex items-center gap-5 border-t border-white/8 pt-4 text-[11px] font-bold text-slate-400">
                      <span>{displayedLikes} Likes</span>
                      <span>{displayedComments} Comments</span>
                      <span>{formatCompactNumber(displayedViews)} Views</span>
                    </div>
                  </motion.article>
                    );
                  })()
                ))}
              </section>
            ) : null}

            {visibleReels.length ? (
              <section className="grid w-fit max-w-full grid-cols-1 gap-2.5 sm:grid-cols-2 xl:grid-cols-3">
                {visibleReels.map((reel, index) => {
                  const liveReelMetrics = reel.distributionId ? reelMetricsByDistributionId.get(reel.distributionId) : undefined;
                  const displayedLikes = liveReelMetrics?.likes ?? reel.likes;
                  const displayedComments = liveReelMetrics?.comments ?? reel.comments;
                  const displayedViews = liveReelMetrics?.viewCount ?? reel.viewCount ?? 0;

                  return (
                    <motion.article
                      key={`${reel.author}-${reel.title}-${index}`}
                      initial={{ opacity: 0, y: 18 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.24, ease: "easeOut", delay: index * 0.04 }}
                      className="w-full max-w-[268px] overflow-hidden rounded-[24px] border border-white/8 bg-[#070707] shadow-[0_20px_48px_rgba(0,0,0,0.22)]"
                    >
                      <div className="relative aspect-[9/13] bg-black">
                        {reel.thumbnailSrc ? (
                          <img src={reel.thumbnailSrc} alt={reel.title} className="h-full w-full object-cover" />
                        ) : (
                          <video
                            src={reel.videoSrc}
                            muted
                            loop
                            playsInline
                            preload="metadata"
                            className="h-full w-full object-cover"
                          />
                        )}
                        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black via-black/45 to-transparent p-3">
                          <div className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-black/40 px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.16em] text-white backdrop-blur-md">
                            <PlayCircle className="h-3 w-3" />
                            Reel
                          </div>
                          <p className="mt-2.5 text-[13px] font-black text-white">{reel.title}</p>
                          <p className="mt-1 text-[10px] leading-4.5 text-slate-300">{reel.caption}</p>
                        </div>
                      </div>
                      <div className="p-3.5">
                        <div className="flex items-start justify-between gap-2.5">
                          <div className="flex items-center gap-2.5">
                            <img
                              src={reel.avatarSrc || "/default-avatar-square.png"}
                              alt={reel.author}
                              className="h-9 w-9 rounded-[12px] object-cover"
                            />
                            <div className="min-w-0">
                              <p className="truncate text-[12px] font-black text-white">{reel.author}</p>
                              <p className="truncate text-[10px] font-semibold text-slate-500">{reel.handle}</p>
                            </div>
                          </div>
                          {isExternalProfile ? null : (
                            <button
                              type="button"
                              onClick={() => void handleDeleteReel(index)}
                              disabled={deletingReelIndex === index}
                              className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-white/8 bg-white/[0.03] text-slate-400 transition hover:border-rose-400/40 hover:bg-rose-500/10 hover:text-rose-300 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          )}
                        </div>
                        <p className="mt-2.5 text-[11px] leading-5 text-slate-300">{reel.bio}</p>
                        <div className="mt-2.5 flex items-center gap-3 text-[10px] font-bold text-slate-400">
                          <span>{displayedLikes} Likes</span>
                          <span>{displayedComments} Comments</span>
                          <span>{formatCompactNumber(displayedViews)} Views</span>
                        </div>
                        <div className="mt-2.5 flex flex-wrap gap-1.5 text-[9px] font-bold text-slate-400">
                          {reel.lane ? (
                            <span className="rounded-full border border-white/8 bg-white/[0.03] px-2.5 py-1">
                              {reel.lane}
                            </span>
                          ) : null}
                          {reel.vehicleType ? (
                            <span className="rounded-full border border-white/8 bg-white/[0.03] px-2.5 py-1">
                              {reel.vehicleType}
                            </span>
                          ) : null}
                          {reel.capacity ? (
                            <span className="rounded-full border border-white/8 bg-white/[0.03] px-2.5 py-1">
                              {reel.capacity}
                            </span>
                          ) : null}
                        </div>
                      </div>
                    </motion.article>
                  );
                })}
              </section>
            ) : null}

            {!visibleFeedPosts.length && !visibleReels.length ? (
              <section className="px-6 py-14 text-center">
                <p className="text-[26px] font-black tracking-[-0.04em] text-white">No profile content yet</p>
                <p className="mx-auto mt-3 max-w-[620px] text-[13px] leading-6 text-slate-500">
                  As soon as you publish a post or reel, your uploaded content, profile activity, and performance insights will appear here.
                </p>
              </section>
            ) : null}

            {deleteDialog ? (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 px-4 backdrop-blur-sm">
                <motion.div
                  initial={{ opacity: 0, scale: 0.96, y: 12 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  transition={{ duration: 0.18, ease: "easeOut" }}
                  className="w-full max-w-[360px] rounded-[24px] border border-white/10 bg-[linear-gradient(180deg,rgba(17,17,17,0.96)_0%,rgba(7,7,7,0.98)_100%)] p-4 shadow-[0_30px_90px_rgba(0,0,0,0.4)]"
                >
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-rose-400/20 bg-rose-500/10 text-rose-300">
                      <Trash2 className="h-4 w-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[14px] font-black text-white">{deleteDialog.title}</p>
                      <p className="mt-1 text-[11px] leading-5 text-slate-400">{deleteDialog.message}</p>
                    </div>
                  </div>
                  <div className="mt-4 flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setDeleteDialog(null)}
                      className="rounded-full border border-white/8 bg-white/[0.03] px-3.5 py-1.5 text-[10px] font-black uppercase tracking-[0.14em] text-slate-300 transition hover:bg-white/[0.06] hover:text-white"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={() => void handleConfirmDelete()}
                      className="rounded-full border border-rose-400/20 bg-rose-500/12 px-3.5 py-1.5 text-[10px] font-black uppercase tracking-[0.14em] text-rose-200 transition hover:bg-rose-500/18 hover:text-white"
                    >
                      Delete
                    </button>
                  </div>
                </motion.div>
              </div>
            ) : null}
        </div>
      </div>
    </div>
  );
}
