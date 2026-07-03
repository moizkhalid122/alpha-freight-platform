"use client";

import { useEffect, useMemo, useRef, useState, type ChangeEvent, type ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Bookmark,
  CalendarDays,
  ChevronDown,
  ChevronUp,
  Clapperboard,
  Ellipsis,
  Flame,
  Heart,
  ImageOff,
  MessageCircle,
  Plus,
  Repeat2,
  Send,
  Sparkles,
  Upload,
  UserPlus,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { readCarrierExtras, readSupplierExtras } from "@/lib/profile-extras";
import {
  getDiscoveryFeedPostsStorageKey,
  getDiscoveryReelsStorageKey,
  getCustomFeedPostsStorageKey,
  getCustomReelsStorageKey,
  getViewerInterestProfileStorageKey,
  hydrateStoredMediaUrls,
  readStoredCollection,
  readAllNetworkFeedPosts,
  readLikedDistributionIds,
  revokeGeneratedObjectUrls,
  setLikedDistributionId,
  storeUploadedMedia,
  writeStoredCollection,
  dispatchFeedContentUpdated,
  toggleProfileFollower,
} from "./feed-storage";
import {
  appendFeedActivityItem,
  appendIncomingFeedActivityItem,
  extractMentionHandles,
  formatActivityTime,
  isIncomingFollowActivity,
  isIncomingLikeActivity,
  isIncomingReplyActivity,
  isOutgoingFollowActivity,
  loadCombinedFeedActivityItems,
  markActivityAsSeen,
  recordFollowEvent,
  type FeedActivityItem,
} from "./feed-activity";
import {
  buildFeedProfileHref,
  createProfileIdentityKey,
  doesPostMatchFollowedProfile,
  isShareableAvatarParam,
  pickBestAvatarSrc,
} from "./profile-search";
import {
  persistFeedNotificationToSupabase,
  persistFollowNotificationToSupabase,
  resolveRecipientProfileId,
} from "@/lib/feed-notifications";
import {
  fetchFeedPostsFromSupabase,
  fetchLikedDistributionIdsFromSupabase,
  persistFeedFollowToSupabase,
  persistFeedPostLikeToSupabase,
  persistFeedPostToSupabase,
  removeFeedPostLikeFromSupabase,
  uploadFeedMediaToSupabase,
  fetchFollowedProfileKeysFromSupabase,
  type RemoteFeedPost,
} from "@/lib/feed-posts";

type FeedWorkspaceProps = {
  role: "carrier" | "supplier";
};

const roleContent = {
  carrier: {
    heroTitle: "Carrier network feed",
    heroCopy:
      "Share capacity, fleet updates, route wins, POD milestones, and market observations with the Alpha Freight community.",
    composerHint: "Share a fleet update, lane opening, capacity alert, or milestone...",
  },
  supplier: {
    heroTitle: "Supplier network feed",
    heroCopy:
      "Share urgent loads, recurring lane demand, warehouse news, booking wins, and trusted carrier recommendations.",
    composerHint: "Share a new load opportunity, logistics update, or supplier announcement...",
  },
};

const samplePosts: FeedPost[] = [];

type FeedPost = {
  author: string;
  avatarSrc: string;
  time: string;
  role: string;
  content: string;
  likes: number;
  comments: number;
  imageSrc?: string;
  videoSrc?: string;
  hypeUnboxed?: boolean;
  imageWrapClassName?: string;
  imageClassName?: string;
  detailImageWrapClassName?: string;
  detailImageClassName?: string;
  detailContent?: string[];
  imageStorageKey?: string;
  videoStorageKey?: string;
  distributionId?: string;
  ownerIdentityKey?: string;
  ownerEmail?: string;
  interestTags?: string[];
  shareCount?: number;
  saveCount?: number;
  viewCount?: number;
  engagementScore?: number;
  distributionStage?: "interest" | "for-you";
  publishedAt?: string;
};

type ViewerInterestProfile = Record<string, number>;

const hasVideoSrc = (post: FeedPost | null): post is FeedPost & { videoSrc: string } =>
  Boolean(post?.videoSrc?.trim());

const hasImageSrc = (post: FeedPost | null): post is FeedPost & { imageSrc: string } =>
  Boolean(post?.imageSrc?.trim() && !post?.videoSrc?.trim());

const getFeedMediaStateKey = (post: FeedPost | null, fallbackKey: string | number): string => {
  if (!post) return String(fallbackKey);

  return (
    post.imageStorageKey ||
    post.videoStorageKey ||
    ("imageSrc" in post && post.imageSrc) ||
    ("videoSrc" in post && post.videoSrc) ||
    `${post.author}-${post.time}-${post.content.slice(0, 48)}-${fallbackKey}`
  );
};

const urlPattern =
  /((https?:\/\/|www\.)[^\s<]+|[a-z0-9.-]+\.(?:com|net|org|io|co|ai|app|dev|pk|uk)(?:\/[^\s<]*)?)/gi;

const renderRichText = (content: string, shouldStopPropagation: boolean) => {
  const pieces: ReactNode[] = [];
  const lines = content.split("\n");

  lines.forEach((line, lineIndex) => {
    let cursor = 0;

    for (const match of line.matchAll(urlPattern)) {
      const rawUrl = match[0] || "";
      const matchIndex = match.index ?? 0;

      if (matchIndex > cursor) {
        pieces.push(line.slice(cursor, matchIndex));
      }

      const trimmedUrl = rawUrl.replace(/[)\].,!?]+$/g, "");
      const trailing = rawUrl.slice(trimmedUrl.length);
      const href = trimmedUrl.startsWith("http")
        ? trimmedUrl
        : trimmedUrl.startsWith("www.")
          ? `https://${trimmedUrl}`
          : `https://${trimmedUrl}`;

      pieces.push(
        <a
          key={`link-${lineIndex}-${matchIndex}`}
          href={href}
          target="_blank"
          rel="noreferrer noopener"
          onClick={(event) => {
            if (shouldStopPropagation) event.stopPropagation();
          }}
          onPointerDown={(event) => {
            if (shouldStopPropagation) event.stopPropagation();
          }}
          className="font-bold text-sky-400 underline decoration-sky-400/40 underline-offset-4 transition hover:text-sky-300 hover:decoration-sky-300/60"
        >
          {trimmedUrl}
        </a>
      );

      if (trailing) {
        pieces.push(trailing);
      }

      cursor = matchIndex + rawUrl.length;
    }

    if (cursor < line.length) {
      pieces.push(line.slice(cursor));
    }

    if (lineIndex < lines.length - 1) {
      pieces.push(<br key={`br-${lineIndex}`} />);
    }
  });

  return pieces;
};

const quickCommentEmojis = ["🔥", "👏", "😍", "🚛", "✅"];

type ReelBase = {
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
};

const reelItems: ReelPost[] = [];

type ReelPost = ReelBase & {
  thumbnailSrc?: string;
  description?: string;
  hashtags?: string;
  distributionId?: string;
  ownerIdentityKey?: string;
  ownerEmail?: string;
  interestTags?: string[];
  shareCount?: number;
  saveCount?: number;
  viewCount?: number;
  engagementScore?: number;
  distributionStage?: "interest" | "for-you";
  publishedAt?: string;
  videoStorageKey?: string;
  thumbnailStorageKey?: string;
};

const normalizeInterestTag = (value: string) =>
  value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

const extractInterestTags = (...sources: Array<string | undefined>) => {
  const combined = sources.join(" ").toLowerCase();
  const keywordGroups: Array<[string, string[]]> = [
    ["capacity", ["capacity", "available", "slot", "space", "open"]],
    ["urgent", ["urgent", "asap", "priority", "critical"]],
    ["reefer", ["reefer", "cold", "chilled", "frozen", "temperature"]],
    ["flatbed", ["flatbed", "steel", "timber", "construction"]],
    ["curtain", ["curtain", "curtain-sider", "sider"]],
    ["box-truck", ["box truck", "box-truck", "van"]],
    ["lane", ["lane", "route", "pickup", "delivery", "dispatch"]],
    ["warehouse", ["warehouse", "storage", "dock", "inventory"]],
    ["port", ["port", "harbor", "container", "freight"]],
    ["london", ["london"]],
    ["manchester", ["manchester"]],
    ["birmingham", ["birmingham"]],
    ["export", ["export", "import", "customs"]],
    ["retail", ["retail", "ecommerce", "store"]],
  ];
  const directTags = combined.match(/#[a-z0-9_-]+|[a-z]{3,}/g) || [];
  const inferred = keywordGroups
    .filter(([, keywords]) => keywords.some((keyword) => combined.includes(keyword)))
    .map(([tag]) => tag);

  return Array.from(
    new Set(
      [...directTags.map((tag) => normalizeInterestTag(tag.replace(/^#/, ""))), ...inferred]
        .filter(Boolean)
        .slice(0, 12)
    )
  );
};

const parseReelMetricCount = (value: string | number | undefined) => {
  if (typeof value === "number") return value;
  if (!value) return 0;
  if (/^\d+(\.\d+)?k$/i.test(value)) return Math.round(parseFloat(value) * 1000);
  if (/^\d+(\.\d+)?m$/i.test(value)) return Math.round(parseFloat(value) * 1000000);
  const numeric = Number.parseInt(value.replace(/[^\d]/g, ""), 10);
  return Number.isFinite(numeric) ? numeric : 0;
};

const computeEngagementScore = ({
  likes,
  comments,
  shareCount = 0,
  saveCount = 0,
  viewCount = 0,
}: {
  likes: number;
  comments: number;
  shareCount?: number;
  saveCount?: number;
  viewCount?: number;
}) => likes * 3 + comments * 4 + shareCount * 5 + saveCount * 2 + Math.min(12, Math.round(viewCount / 8));

const getDistributionStage = (engagementScore: number) =>
  engagementScore >= 28 ? "for-you" : "interest";

const getInterestMatchScore = (profile: ViewerInterestProfile, tags?: string[]) =>
  (tags || []).reduce((sum, tag) => sum + (profile[tag] || 0), 0);

const getFreshnessBoost = (publishedAt?: string) => {
  if (!publishedAt) return 0;
  const ageMs = Date.now() - new Date(publishedAt).getTime();
  if (!Number.isFinite(ageMs) || ageMs < 0) return 0;
  if (ageMs < 1000 * 60 * 30) return 10;
  if (ageMs < 1000 * 60 * 60 * 6) return 6;
  if (ageMs < 1000 * 60 * 60 * 24) return 3;
  return 0;
};

type ManagedVideoProps = {
  src: string;
  className: string;
  autoPlay?: boolean;
  muted?: boolean;
  loop?: boolean;
  controls?: boolean;
  playsInline?: boolean;
  controlsList?: string;
  disablePictureInPicture?: boolean;
  preload?: "none" | "metadata" | "auto";
  observeVisibility?: boolean;
};

function ManagedVideo({
  src,
  className,
  autoPlay = true,
  muted = true,
  loop = false,
  controls = false,
  playsInline = true,
  controlsList,
  disablePictureInPicture = false,
  preload = "metadata",
  observeVisibility = false,
}: ManagedVideoProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    const video = videoRef.current;

    if (!video || !autoPlay || !observeVisibility) return;

    let isVisible = false;
    const attemptPlay = () => {
      void video.play().catch(() => {
        // Ignore autoplay rejections for feed-side performance playback.
      });
    };
    const handleCanPlay = () => {
      if (isVisible) {
        attemptPlay();
      }
    };

    const observer = new IntersectionObserver(
      ([entry]) => {
        isVisible = entry.isIntersecting;

        if (entry.isIntersecting) {
          attemptPlay();
        } else {
          video.pause();
        }
      },
      { threshold: 0.6 }
    );

    video.addEventListener("canplay", handleCanPlay);
    video.addEventListener("loadeddata", handleCanPlay);
    observer.observe(video);

    return () => {
      video.removeEventListener("canplay", handleCanPlay);
      video.removeEventListener("loadeddata", handleCanPlay);
      observer.disconnect();
    };
  }, [autoPlay, observeVisibility, src]);

  useEffect(() => {
    const video = videoRef.current;

    if (!video || !autoPlay) return;

    const attemptPlay = () => {
      void video.play().catch(() => {
        // Ignore autoplay rejections for non-reel videos.
      });
    };
    const handleCanPlay = () => {
      if (!observeVisibility) {
        attemptPlay();
      }
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        video.pause();
        return;
      }

      if (!observeVisibility) {
        attemptPlay();
      }
    };

    handleVisibilityChange();
    video.addEventListener("canplay", handleCanPlay);
    video.addEventListener("loadeddata", handleCanPlay);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      video.removeEventListener("canplay", handleCanPlay);
      video.removeEventListener("loadeddata", handleCanPlay);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [autoPlay, observeVisibility, src]);

  return (
    <video
      ref={videoRef}
      src={src}
      autoPlay={autoPlay}
      muted={muted}
      loop={loop}
      controls={controls}
      playsInline={playsInline}
      controlsList={controlsList}
      disablePictureInPicture={disablePictureInPicture}
      preload={preload}
      className={className}
      onEnded={() => {
        if (!loop) return;

        const video = videoRef.current;

        if (!video) return;

        video.currentTime = 0;
        void video.play().catch(() => {
          // Ignore replay rejections on loop fallback.
        });
      }}
    />
  );
}

export default function FeedWorkspace({ role }: FeedWorkspaceProps) {
  const content = roleContent[role];
  const router = useRouter();
  const searchParams = useSearchParams();
  const introDismissStorageKey = `alpha-freight:feed-intro-dismissed:${role}`;
  const [avatarUrl, setAvatarUrl] = useState("");
  const [userId, setUserId] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [isComposerOpen, setIsComposerOpen] = useState(false);
  const [composerMode, setComposerMode] = useState<"feed" | "reel">("feed");
  const [customFeedPosts, setCustomFeedPosts] = useState<FeedPost[]>([]);
  const [customReelPosts, setCustomReelPosts] = useState<ReelPost[]>([]);
  const [discoveryFeedPosts, setDiscoveryFeedPosts] = useState<FeedPost[]>([]);
  const [discoveryReelPosts, setDiscoveryReelPosts] = useState<ReelPost[]>([]);
  const [viewerInterestProfile, setViewerInterestProfile] = useState<ViewerInterestProfile>({});
  const [feedPostDraft, setFeedPostDraft] = useState({
    content: "",
    imageSrc: "",
    videoSrc: "",
  });
  const [feedUploadMeta, setFeedUploadMeta] = useState({
    imageName: "",
    videoName: "",
  });
  const [feedDraftMediaStyle, setFeedDraftMediaStyle] = useState<{
    imageWrapClassName: string;
    imageClassName: string;
    detailImageWrapClassName: string;
    detailImageClassName: string;
  } | null>(null);
  const [feedPublishProgress, setFeedPublishProgress] = useState<number | null>(null);
  const [feedPublishError, setFeedPublishError] = useState("");
  const [reelPostDraft, setReelPostDraft] = useState({
    title: "",
    videoSrc: "",
    thumbnailSrc: "",
    description: "",
    hashtags: "",
  });
  const [reelUploadMeta, setReelUploadMeta] = useState({
    videoName: "",
    thumbnailName: "",
  });
  const [reelPublishProgress, setReelPublishProgress] = useState<number | null>(null);
  const [reelPublishError, setReelPublishError] = useState("");
  const [publishNotice, setPublishNotice] = useState<{
    title: string;
    message: string;
  } | null>(null);
  const [showIntroVideo, setShowIntroVideo] = useState<boolean | null>(null);
  const [selectedPostIndex, setSelectedPostIndex] = useState<number | null>(null);
  const [likedPosts, setLikedPosts] = useState<Record<number, boolean>>({});
  const [likedDistributionIds, setLikedDistributionIds] = useState<Record<string, boolean>>({});
  const [openCommentPosts, setOpenCommentPosts] = useState<Record<number, boolean>>({});
  const [commentDrafts, setCommentDrafts] = useState<Record<number, string>>({});
  const [submittedComments, setSubmittedComments] = useState<Record<number, string[]>>({});
  const [sharedPosts, setSharedPosts] = useState<Record<number, boolean>>({});
  const [autoPortraitImages, setAutoPortraitImages] = useState<Record<string, boolean>>({});
  const [erroredFeedImages, setErroredFeedImages] = useState<Record<string, boolean>>({});
  const [activeReelIndex, setActiveReelIndex] = useState(0);
  const [activeReelDirection, setActiveReelDirection] = useState<1 | -1>(1);
  const [activeReelIsLandscape, setActiveReelIsLandscape] = useState(false);
  const [likedReels, setLikedReels] = useState<Record<number, boolean>>({});
  const [savedReels, setSavedReels] = useState<Record<number, boolean>>({});
  const [commentedReels, setCommentedReels] = useState<Record<number, boolean>>({});
  const [sharedReels, setSharedReels] = useState<Record<number, boolean>>({});
  const [moreReels, setMoreReels] = useState<Record<number, boolean>>({});
  const [savedPostStates, setSavedPostStates] = useState<Record<number, boolean>>({});
  const [feedActivityItems, setFeedActivityItems] = useState<FeedActivityItem[]>([]);
  const [followedProfileKeys, setFollowedProfileKeys] = useState<string[]>([]);
  const [companyName, setCompanyName] = useState("");
  const [networkFeedRefreshKey, setNetworkFeedRefreshKey] = useState(0);
  const [remoteFeedPosts, setRemoteFeedPosts] = useState<RemoteFeedPost[]>([]);
  const spotlightVideoRef = useRef<HTMLVideoElement | null>(null);
  const activeReelVideoRef = useRef<HTMLVideoElement | null>(null);
  const feedUploadInputRef = useRef<HTMLInputElement | null>(null);
  const feedDraftObjectUrlsRef = useRef<string[]>([]);
  const feedDraftImageFileRef = useRef<File | null>(null);
  const feedDraftVideoFileRef = useRef<File | null>(null);
  const reelVideoUploadInputRef = useRef<HTMLInputElement | null>(null);
  const reelThumbnailUploadInputRef = useRef<HTMLInputElement | null>(null);
  const reelDraftObjectUrlsRef = useRef<string[]>([]);
  const reelDraftVideoFileRef = useRef<File | null>(null);
  const reelDraftThumbnailFileRef = useRef<File | null>(null);
  const persistedMediaObjectUrlsRef = useRef<string[]>([]);
  const reelTouchStartYRef = useRef<number | null>(null);
  const reelWheelLockRef = useRef(false);
  const shareResetTimersRef = useRef<Record<number, number>>({});
  const reelActionResetTimersRef = useRef<Record<string, number>>({});
  const hasLoadedStoredContentRef = useRef(false);
  const viewerIdentityKey = useMemo(
    () =>
      (userId || userEmail || `${role}-guest`).trim().toLowerCase().replace(/[^a-z0-9._-]+/g, "-") ||
      `${role}-guest`,
    [role, userEmail, userId]
  );
  const followStorageKey = useMemo(
    () => `alpha-freight:followed-profiles:${role}:${(userEmail || "guest").trim().toLowerCase() || "guest"}`,
    [role, userEmail]
  );

  const recordActivity = (
    item: Omit<FeedActivityItem, "id" | "time" | "createdAt" | "actor" | "actorAvatar">
  ) => {
    appendFeedActivityItem(
      role,
      userEmail,
      {
        actor: "You",
        actorAvatar: avatarUrl || "/default-avatar-square.png",
        ...item,
      },
      userId
    );
  };

  useEffect(() => {
    async function loadUserAvatar() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setAvatarUrl("");
        setUserId("");
        setUserEmail("");
        return;
      }

      setUserId(user.id);
      setUserEmail(user.email || "");

      const extras =
        role === "carrier" ? readCarrierExtras(user.id) : readSupplierExtras(user.id);

      setAvatarUrl(extras.avatarUrl?.trim() || "");
      setCompanyName(extras.companyName?.trim() || "");
    }

    loadUserAvatar();
  }, [role]);

  useEffect(() => {
    const localIds = readLikedDistributionIds(role, userEmail, userId);
    const nextLikedMap = Object.fromEntries(localIds.map((id) => [id, true]));
    setLikedDistributionIds(nextLikedMap);

    if (!userId) return;

    let isActive = true;

    void fetchLikedDistributionIdsFromSupabase(userId).then(({ data: remoteIds }) => {
      if (!isActive || !remoteIds.length) return;

      setLikedDistributionIds((current) => {
        const next = { ...current };
        remoteIds.forEach((id) => {
          next[id] = true;
        });
        return next;
      });

      remoteIds.forEach((id) => {
        setLikedDistributionId(role, userEmail, userId, id, true);
      });
    });

    return () => {
      isActive = false;
    };
  }, [role, userEmail, userId]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    let isActive = true;

    const loadStoredContent = async () => {
      const storedFeedPosts = readStoredCollection<FeedPost>(getCustomFeedPostsStorageKey(role, userEmail));
      const storedReelPosts = readStoredCollection<ReelPost>(getCustomReelsStorageKey(role, userEmail));
      const storedDiscoveryFeedPosts = readStoredCollection<FeedPost>(getDiscoveryFeedPostsStorageKey());
      const storedDiscoveryReelPosts = readStoredCollection<ReelPost>(getDiscoveryReelsStorageKey());
      const storedViewerInterestProfile = readStoredCollection<[string, number]>(
        getViewerInterestProfileStorageKey(role, userEmail)
      );
      const [hydratedFeedPosts, hydratedReelPosts, hydratedDiscoveryFeedPosts, hydratedDiscoveryReelPosts] =
        await Promise.all([
        hydrateStoredMediaUrls(storedFeedPosts),
        hydrateStoredMediaUrls(storedReelPosts),
        hydrateStoredMediaUrls(storedDiscoveryFeedPosts),
        hydrateStoredMediaUrls(storedDiscoveryReelPosts),
      ]);

      if (!isActive) {
        revokeGeneratedObjectUrls([
          ...hydratedFeedPosts.generatedObjectUrls,
          ...hydratedReelPosts.generatedObjectUrls,
          ...hydratedDiscoveryFeedPosts.generatedObjectUrls,
          ...hydratedDiscoveryReelPosts.generatedObjectUrls,
        ]);
        return;
      }

      revokeGeneratedObjectUrls(persistedMediaObjectUrlsRef.current);
      persistedMediaObjectUrlsRef.current = [
        ...hydratedFeedPosts.generatedObjectUrls,
        ...hydratedReelPosts.generatedObjectUrls,
        ...hydratedDiscoveryFeedPosts.generatedObjectUrls,
        ...hydratedDiscoveryReelPosts.generatedObjectUrls,
      ];
      setCustomFeedPosts(hydratedFeedPosts.items);
      setCustomReelPosts(hydratedReelPosts.items);
      setDiscoveryFeedPosts(hydratedDiscoveryFeedPosts.items);
      setDiscoveryReelPosts(hydratedDiscoveryReelPosts.items);
      setViewerInterestProfile(Object.fromEntries(storedViewerInterestProfile));
      hasLoadedStoredContentRef.current = true;
    };

    void loadStoredContent();

    return () => {
      isActive = false;
    };
  }, [role, userEmail]);

  useEffect(() => {
    let isActive = true;

    const loadRemoteFeed = async () => {
      const { data } = await fetchFeedPostsFromSupabase(100);
      if (isActive) {
        setRemoteFeedPosts(data);
      }
    };

    void loadRemoteFeed();

    window.addEventListener("alpha_feed_content_updated", loadRemoteFeed);
    window.addEventListener("focus", loadRemoteFeed);

    return () => {
      isActive = false;
      window.removeEventListener("alpha_feed_content_updated", loadRemoteFeed);
      window.removeEventListener("focus", loadRemoteFeed);
    };
  }, [networkFeedRefreshKey]);

  useEffect(() => {
    const refreshNetworkFeed = () => {
      setDiscoveryFeedPosts(readStoredCollection<FeedPost>(getDiscoveryFeedPostsStorageKey()));
      setNetworkFeedRefreshKey((current) => current + 1);
    };

    window.addEventListener("alpha_feed_content_updated", refreshNetworkFeed);
    window.addEventListener("storage", refreshNetworkFeed);
    window.addEventListener("focus", refreshNetworkFeed);

    return () => {
      window.removeEventListener("alpha_feed_content_updated", refreshNetworkFeed);
      window.removeEventListener("storage", refreshNetworkFeed);
      window.removeEventListener("focus", refreshNetworkFeed);
    };
  }, []);

  useEffect(() => {
    if (!hasLoadedStoredContentRef.current || typeof window === "undefined") return;

    writeStoredCollection(getCustomFeedPostsStorageKey(role, userEmail), customFeedPosts);
  }, [customFeedPosts, role, userEmail]);

  useEffect(() => {
    if (!hasLoadedStoredContentRef.current || typeof window === "undefined") return;

    writeStoredCollection(getCustomReelsStorageKey(role, userEmail), customReelPosts);
  }, [customReelPosts, role, userEmail]);

  useEffect(() => {
    if (!hasLoadedStoredContentRef.current || typeof window === "undefined") return;

    writeStoredCollection(getDiscoveryFeedPostsStorageKey(), discoveryFeedPosts);
  }, [discoveryFeedPosts]);

  useEffect(() => {
    if (!hasLoadedStoredContentRef.current || typeof window === "undefined") return;

    writeStoredCollection(getDiscoveryReelsStorageKey(), discoveryReelPosts);
  }, [discoveryReelPosts]);

  useEffect(() => {
    if (!hasLoadedStoredContentRef.current || typeof window === "undefined") return;

    writeStoredCollection(
      getViewerInterestProfileStorageKey(role, userEmail),
      Object.entries(viewerInterestProfile)
    );
  }, [role, userEmail, viewerInterestProfile]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    if (window.sessionStorage.getItem(introDismissStorageKey) === "1") {
      setShowIntroVideo(false);
      return;
    }

    setShowIntroVideo(true);

    const introTimer = window.setTimeout(() => {
      window.sessionStorage.setItem(introDismissStorageKey, "1");
      setShowIntroVideo(false);
    }, 3000);

    return () => {
      window.clearTimeout(introTimer);
    };
  }, [introDismissStorageKey]);

  useEffect(() => {
    if (showIntroVideo !== false || selectedPostIndex !== null) return;

    const spotlightVideo = spotlightVideoRef.current;

    if (!spotlightVideo) return;

    spotlightVideo.currentTime = 0;

    void spotlightVideo.play().catch(() => {
      // Ignore autoplay rejections; the browser still exposes controls-free playback when allowed.
    });
  }, [selectedPostIndex, showIntroVideo]);

  useEffect(() => {
    if (!publishNotice) return;

    const timer = window.setTimeout(() => {
      setPublishNotice(null);
    }, 3600);

    return () => {
      window.clearTimeout(timer);
    };
  }, [publishNotice]);

  useEffect(() => {
    return () => {
      Object.values(shareResetTimersRef.current).forEach((timer) => {
        window.clearTimeout(timer);
      });
      Object.values(reelActionResetTimersRef.current).forEach((timer) => {
        window.clearTimeout(timer);
      });
      feedDraftObjectUrlsRef.current.forEach((url) => {
        URL.revokeObjectURL(url);
      });
      reelDraftObjectUrlsRef.current.forEach((url) => {
        URL.revokeObjectURL(url);
      });
      revokeGeneratedObjectUrls(persistedMediaObjectUrlsRef.current);
    };
  }, []);

  const shareInitials = useMemo(() => {
    const fallbackName = userEmail.split("@")[0] || (role === "carrier" ? "Carrier" : "Supplier");
    const parts = fallbackName
      .split(" ")
      .map((part) => part.trim())
      .filter(Boolean)
      .slice(0, 2);

    return parts.map((part) => part[0]?.toUpperCase() || "").join("") || "AF";
  }, [role, userEmail]);

  const commenterName = useMemo(() => {
    const fallbackName =
      userEmail.split("@")[0] || (role === "carrier" ? "Carrier User" : "Supplier User");

    return fallbackName
      .split(/[._-]/)
      .filter(Boolean)
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(" ");
  }, [role, userEmail]);

  const viewerDisplayName = companyName || commenterName;

  const viewerProfileIdentityKey = useMemo(
    () => createProfileIdentityKey({ ownerEmail: userEmail, author: viewerDisplayName }),
    [userEmail, viewerDisplayName]
  );

  const notifyContentOwner = async ({
    author,
    ownerEmail,
    ownerIdentityKey,
    distributionId,
    type,
    message,
    postIndex,
  }: {
    author: string;
    ownerEmail?: string;
    ownerIdentityKey?: string;
    distributionId?: string;
    type: "like" | "reply";
    message: string;
    postIndex?: number;
  }) => {
    const ownerProfileKey =
      createProfileIdentityKey({ ownerEmail, author }) ||
      ownerIdentityKey?.trim().toLowerCase() ||
      "";

    if (!ownerProfileKey) return;
    if (ownerProfileKey === viewerProfileIdentityKey) return;
    if (
      ownerEmail &&
      userEmail &&
      ownerEmail.trim().toLowerCase() === userEmail.trim().toLowerCase()
    ) {
      return;
    }

    const recipientProfileId = await resolveRecipientProfileId({
      profileIdentityKey: ownerProfileKey,
      displayName: author,
    });

    const actorProfileHref = buildFeedProfileHref(`/${role}/feed`, {
      identityKey: viewerProfileIdentityKey,
      profileId: userId || "",
      author: viewerDisplayName,
      role: role === "supplier" ? "Supplier" : "Carrier",
      avatarSrc: pickBestAvatarSrc(avatarUrl),
    });

    appendIncomingFeedActivityItem(recipientProfileId || undefined, ownerProfileKey, {
      type,
      actor: viewerDisplayName,
      actorAvatar: pickBestAvatarSrc(avatarUrl) || "/default-avatar-square.png",
      message,
      href: actorProfileHref,
      actorProfileKey: viewerProfileIdentityKey,
      actorProfileId: userId || undefined,
      actorRole: role,
      postIndex,
      targetName: author,
      targetDistributionId: distributionId,
    });

    if (userId && recipientProfileId) {
      void persistFeedNotificationToSupabase({
        recipientId: recipientProfileId,
        recipientProfileKey: ownerProfileKey,
        actorId: userId,
        actorName: viewerDisplayName,
        actorAvatar: pickBestAvatarSrc(avatarUrl) || "/default-avatar-square.png",
        actorRole: role,
        actorProfileKey: viewerProfileIdentityKey,
        href: actorProfileHref,
        notificationType: type,
        message,
      });
    }
  };

  const handleFollowBack = async (item: FeedActivityItem) => {
    const actorProfileKey = item.actorProfileKey?.trim().toLowerCase();
    if (!actorProfileKey || !viewerProfileIdentityKey) return;

    const alreadyFollowing = followedProfileKeys.some(
      (key) => key.trim().toLowerCase() === actorProfileKey
    );
    if (alreadyFollowing) return;

    const nextFollowedKeys = [...followedProfileKeys, actorProfileKey];
    setFollowedProfileKeys(nextFollowedKeys);
    writeStoredCollection(followStorageKey, nextFollowedKeys);
    toggleProfileFollower(actorProfileKey, viewerProfileIdentityKey, true);

    const ownProfileHref = buildFeedProfileHref(`/${role}/feed`, {
      identityKey: viewerProfileIdentityKey,
      profileId: userId || "",
      author: viewerDisplayName,
      role: role === "supplier" ? "Supplier" : "Carrier",
      avatarSrc: pickBestAvatarSrc(avatarUrl),
    });

    const recipientProfileId = await resolveRecipientProfileId({
      profileId: item.actorProfileId,
      profileIdentityKey: actorProfileKey,
      displayName: item.actor,
    });

    appendIncomingFeedActivityItem(recipientProfileId || undefined, actorProfileKey, {
      type: "follow",
      actor: viewerDisplayName,
      actorAvatar: pickBestAvatarSrc(avatarUrl) || "/default-avatar-square.png",
      message: "started following you",
      href: ownProfileHref,
      actorProfileKey: viewerProfileIdentityKey,
      actorProfileId: userId || undefined,
      actorRole: role,
    });

    recordFollowEvent({
      targetProfileId: recipientProfileId || "",
      targetProfileIdentityKey: actorProfileKey,
      actorProfileId: userId || "",
      actorProfileKey: viewerProfileIdentityKey,
      actorName: viewerDisplayName,
      actorAvatar: pickBestAvatarSrc(avatarUrl) || "/default-avatar-square.png",
      actorRole: role,
      href: ownProfileHref,
    });

    if (userId) {
      void persistFeedFollowToSupabase({
        followerId: userId,
        followerProfileKey: viewerProfileIdentityKey,
        followedProfileKey: actorProfileKey,
        followedProfileId: item.actorProfileId,
      });
    }

    if (userId && recipientProfileId) {
      const result = await persistFollowNotificationToSupabase({
        recipientId: recipientProfileId,
        recipientProfileKey: actorProfileKey,
        actorId: userId,
        actorName: viewerDisplayName,
        actorAvatar: pickBestAvatarSrc(avatarUrl) || "/default-avatar-square.png",
        actorRole: role,
        actorProfileKey: viewerProfileIdentityKey,
        href: ownProfileHref,
      });

      if (!result.ok) {
        console.warn("[FeedWorkspace] Follow-back notification not saved:", result.error);
      }
    }
  };

  const activityTabActive = searchParams.get("tab") === "activity";

  useEffect(() => {
    if (!activityTabActive || (!userId && !userEmail)) return;
    markActivityAsSeen(role, userEmail, userId);
  }, [activityTabActive, role, userEmail, userId]);

  useEffect(() => {
    let isActive = true;

    const refreshFeedActivity = async () => {
      const items = await loadCombinedFeedActivityItems({
        role,
        userEmail,
        profileId: userId,
        profileIdentityKey: viewerProfileIdentityKey,
      });

      if (isActive) {
        setFeedActivityItems(items);
      }
    };
    const refreshFollowedProfiles = async () => {
      const localKeys = readStoredCollection<string>(followStorageKey);

      if (!userId) {
        setFollowedProfileKeys(localKeys);
        return;
      }

      const { data: remoteKeys } = await fetchFollowedProfileKeysFromSupabase(userId);
      const mergedKeys = [
        ...new Set(
          [...localKeys, ...remoteKeys]
            .map((key) => key.trim().toLowerCase())
            .filter(Boolean)
        ),
      ];

      setFollowedProfileKeys(mergedKeys);
      writeStoredCollection(followStorageKey, mergedKeys);
    };

    void refreshFeedActivity();
    void refreshFollowedProfiles();

    window.addEventListener("alpha_feed_activity_updated", refreshFeedActivity);
    window.addEventListener("alpha_profile_followers_updated", refreshFollowedProfiles);
    window.addEventListener("storage", refreshFeedActivity);
    window.addEventListener("focus", refreshFeedActivity);
    window.addEventListener("focus", refreshFollowedProfiles);

    const pollInterval =
      activityTabActive && userId
        ? window.setInterval(() => {
            void refreshFeedActivity();
          }, 15000)
        : null;

    return () => {
      isActive = false;
      window.removeEventListener("alpha_feed_activity_updated", refreshFeedActivity);
      window.removeEventListener("alpha_profile_followers_updated", refreshFollowedProfiles);
      window.removeEventListener("storage", refreshFeedActivity);
      window.removeEventListener("focus", refreshFeedActivity);
      window.removeEventListener("focus", refreshFollowedProfiles);
      if (pollInterval) {
        window.clearInterval(pollInterval);
      }
    };
  }, [activityTabActive, followStorageKey, role, userEmail, userId, viewerProfileIdentityKey]);

  const createPersistentMediaKey = (kind: string, fileName: string) => {
    const normalizedName = fileName.trim().toLowerCase().replace(/[^a-z0-9._-]+/g, "-") || "upload";
    const ownerKey =
      (userId || userEmail || `${role}-guest`).trim().toLowerCase().replace(/[^a-z0-9._-]+/g, "-");

    return `alpha-freight:${role}:${ownerKey}:${kind}:${Date.now()}:${Math.random()
      .toString(36)
      .slice(2, 8)}:${normalizedName}`;
  };

  const createDistributionId = (kind: "feed" | "reel") =>
    `alpha-freight:${kind}:${viewerIdentityKey}:${Date.now()}:${Math.random().toString(36).slice(2, 8)}`;

  const boostViewerInterest = (tags: string[] | undefined, amount: number) => {
    if (!tags?.length) return;

    setViewerInterestProfile((current) => {
      const nextProfile = { ...current };

      tags.forEach((tag) => {
        nextProfile[tag] = Math.min(24, (nextProfile[tag] || 0) + amount);
      });

      return nextProfile;
    });
  };

  const updateDiscoveryFeedPost = (
    distributionId: string | undefined,
    updater: (post: FeedPost) => FeedPost
  ): void => {
    if (!distributionId) return;

    setDiscoveryFeedPosts((current) =>
      current.map((post) => (post.distributionId === distributionId ? updater(post) : post))
    );
  };

  const updateDiscoveryReel = (
    distributionId: string | undefined,
    updater: (reel: ReelPost) => ReelPost
  ): void => {
    if (!distributionId) return;

    setDiscoveryReelPosts((current) =>
      current.map((reel) => (reel.distributionId === distributionId ? updater(reel) : reel))
    );
  };

  const isPostLiked = (post?: FeedPost, postIndex?: number) => {
    const distributionId = post?.distributionId?.trim();
    if (distributionId) {
      return Boolean(likedDistributionIds[distributionId]);
    }

    return typeof postIndex === "number" ? Boolean(likedPosts[postIndex]) : false;
  };

  const handleToggleLike = async (postIndex: number, postOverride?: FeedPost) => {
    const post: FeedPost | undefined =
      postOverride || feedEntries.find((entry) => entry.index === postIndex)?.post;

    if (!post) return;

    const distributionId = post.distributionId?.trim();
    const nextLiked = distributionId
      ? !likedDistributionIds[distributionId]
      : !likedPosts[postIndex];

    if (distributionId) {
      setLikedDistributionIds((current) => ({
        ...current,
        [distributionId]: nextLiked,
      }));
      setLikedDistributionId(role, userEmail, userId, distributionId, nextLiked);

      if (userId) {
        if (nextLiked) {
          void persistFeedPostLikeToSupabase(userId, distributionId);
        } else {
          void removeFeedPostLikeFromSupabase(userId, distributionId);
        }
      }
    } else {
      setLikedPosts((current) => ({
        ...current,
        [postIndex]: nextLiked,
      }));
    }

    if (nextLiked) {
      boostViewerInterest(post.interestTags, 2);
      await notifyContentOwner({
        author: post.author,
        ownerEmail: post.ownerEmail,
        ownerIdentityKey: post.ownerIdentityKey,
        distributionId: post.distributionId,
        type: "like",
        message: "liked your post",
        postIndex,
      });
    }

    updateDiscoveryFeedPost(post.distributionId, (currentPost) => {
      const nextLikes = Math.max(0, currentPost.likes + (nextLiked ? 1 : -1));
      const nextEngagementScore = computeEngagementScore({
        likes: nextLikes,
        comments: currentPost.comments,
        shareCount: currentPost.shareCount,
        saveCount: currentPost.saveCount,
        viewCount: currentPost.viewCount,
      });

      return {
        ...currentPost,
        likes: nextLikes,
        engagementScore: nextEngagementScore,
        distributionStage: getDistributionStage(nextEngagementScore),
      };
    });
  };

  const handleToggleComment = (postIndex: number) => {
    setOpenCommentPosts((current) => ({
      ...current,
      [postIndex]: !current[postIndex],
    }));
  };

  const handleCommentDraftChange = (postIndex: number, value: string) => {
    setCommentDrafts((current) => ({
      ...current,
      [postIndex]: value,
    }));
  };

  const handleInsertEmoji = (postIndex: number, emoji: string) => {
    setCommentDrafts((current) => {
      const existingDraft = current[postIndex]?.trimEnd() || "";
      const nextValue = existingDraft ? `${existingDraft} ${emoji}` : emoji;

      return {
        ...current,
        [postIndex]: nextValue,
      };
    });
  };

  const handleSubmitComment = async (postIndex: number, postOverride?: FeedPost) => {
    const nextComment = commentDrafts[postIndex]?.trim();
    const post: FeedPost | undefined =
      postOverride || feedEntries.find((entry) => entry.index === postIndex)?.post;

    if (!nextComment) return;

    setSubmittedComments((current) => ({
      ...current,
      [postIndex]: [...(current[postIndex] || []), nextComment],
    }));

    setCommentDrafts((current) => ({
      ...current,
      [postIndex]: "",
    }));

    setOpenCommentPosts((current) => ({
      ...current,
      [postIndex]: false,
    }));

    if (!post) return;

    boostViewerInterest(post.interestTags, 3);
    await notifyContentOwner({
      author: post.author,
      ownerEmail: post.ownerEmail,
      ownerIdentityKey: post.ownerIdentityKey,
      distributionId: post.distributionId,
      type: "reply",
      message: "replied to your post",
      postIndex,
    });

    extractMentionHandles(nextComment).forEach((handle) => {
      recordActivity({
        type: "mention",
        message: `mentioned ${handle} in a reply`,
        postIndex,
      });
    });

    updateDiscoveryFeedPost(post.distributionId, (currentPost) => {
      const nextComments = currentPost.comments + 1;
      const nextEngagementScore = computeEngagementScore({
        likes: currentPost.likes,
        comments: nextComments,
        shareCount: currentPost.shareCount,
        saveCount: currentPost.saveCount,
        viewCount: currentPost.viewCount,
      });

      return {
        ...currentPost,
        comments: nextComments,
        engagementScore: nextEngagementScore,
        distributionStage: getDistributionStage(nextEngagementScore),
      };
    });
  };

  const handleSharePost = async (postIndex: number) => {
    const post: FeedPost | undefined = feedEntries.find((entry) => entry.index === postIndex)?.post;

    if (!post) return;

    const shareUrl = `${window.location.origin}/${role}/feed#post-${postIndex + 1}`;
    const shareData = {
      title: `${post.author} on Alpha Freight`,
      text: post.content,
      url: shareUrl,
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(shareUrl);
      }

      setSharedPosts((current) => ({
        ...current,
        [postIndex]: true,
      }));

      const existingTimer = shareResetTimersRef.current[postIndex];
      if (existingTimer) {
        window.clearTimeout(existingTimer);
      }

      shareResetTimersRef.current[postIndex] = window.setTimeout(() => {
        setSharedPosts((current) => ({
          ...current,
          [postIndex]: false,
        }));
      }, 1800);

      boostViewerInterest(post.interestTags, 4);
      updateDiscoveryFeedPost(post.distributionId, (currentPost) => {
        const nextShareCount = (currentPost.shareCount || 0) + 1;
        const nextEngagementScore = computeEngagementScore({
          likes: currentPost.likes,
          comments: currentPost.comments,
          shareCount: nextShareCount,
          saveCount: currentPost.saveCount,
          viewCount: currentPost.viewCount,
        });

        return {
          ...currentPost,
          shareCount: nextShareCount,
          engagementScore: nextEngagementScore,
          distributionStage: getDistributionStage(nextEngagementScore),
        };
      });
    } catch {
      // Ignore cancelled native share actions.
    }
  };

  const handleToggleSavePost = (postIndex: number) => {
    const post: FeedPost | undefined = feedEntries.find((entry) => entry.index === postIndex)?.post;
    const nextSaved = !savedPostStates[postIndex];

    setSavedPostStates((current) => ({
      ...current,
      [postIndex]: nextSaved,
    }));

    if (!post) return;

    if (nextSaved) {
      boostViewerInterest(post.interestTags, 2);
    }

    updateDiscoveryFeedPost(post.distributionId, (currentPost) => {
      const nextSaveCount = Math.max(0, (currentPost.saveCount || 0) + (nextSaved ? 1 : -1));
      const nextEngagementScore = computeEngagementScore({
        likes: currentPost.likes,
        comments: currentPost.comments,
        shareCount: currentPost.shareCount,
        saveCount: nextSaveCount,
        viewCount: currentPost.viewCount,
      });

      return {
        ...currentPost,
        saveCount: nextSaveCount,
        engagementScore: nextEngagementScore,
        distributionStage: getDistributionStage(nextEngagementScore),
      };
    });
  };

  const handleOpenComposer = (mode: "feed" | "reel") => {
    setComposerMode(mode);
    setIsComposerOpen(true);
  };

  const resetReelDraft = () => {
    reelDraftObjectUrlsRef.current.forEach((url) => {
      URL.revokeObjectURL(url);
    });
    reelDraftObjectUrlsRef.current = [];
    reelDraftVideoFileRef.current = null;
    reelDraftThumbnailFileRef.current = null;
    setReelPostDraft({
      title: "",
      videoSrc: "",
      thumbnailSrc: "",
      description: "",
      hashtags: "",
    });
    setReelUploadMeta({
      videoName: "",
      thumbnailName: "",
    });
    setReelPublishProgress(null);
    setReelPublishError("");
    if (reelVideoUploadInputRef.current) {
      reelVideoUploadInputRef.current.value = "";
    }
    if (reelThumbnailUploadInputRef.current) {
      reelThumbnailUploadInputRef.current.value = "";
    }
  };

  const handleCloseComposer = () => {
    if (composerMode === "feed") {
      feedDraftObjectUrlsRef.current.forEach((url) => {
        URL.revokeObjectURL(url);
      });
      feedDraftObjectUrlsRef.current = [];
      setFeedPostDraft((current) => ({
        ...current,
        imageSrc: "",
        videoSrc: "",
      }));
      feedDraftImageFileRef.current = null;
      feedDraftVideoFileRef.current = null;
      setFeedUploadMeta({
        imageName: "",
        videoName: "",
      });
      setFeedPublishProgress(null);
      setFeedPublishError("");
      setFeedDraftMediaStyle(null);
      if (feedUploadInputRef.current) {
        feedUploadInputRef.current.value = "";
      }
    }

    setIsComposerOpen(false);
  };

  const handleCancelComposer = () => {
    if (composerMode === "feed") {
      setFeedPostDraft({
        content: "",
        imageSrc: "",
        videoSrc: "",
      });
      feedDraftImageFileRef.current = null;
      feedDraftVideoFileRef.current = null;
      setFeedUploadMeta({
        imageName: "",
        videoName: "",
      });
      setFeedPublishProgress(null);
      setFeedPublishError("");
      setFeedDraftMediaStyle(null);
      feedDraftObjectUrlsRef.current.forEach((url) => {
        URL.revokeObjectURL(url);
      });
      feedDraftObjectUrlsRef.current = [];
      if (feedUploadInputRef.current) {
        feedUploadInputRef.current.value = "";
      }
    } else {
      resetReelDraft();
    }

    setIsComposerOpen(false);
  };

  const handleFeedDraftChange = (
    field: keyof typeof feedPostDraft,
    value: string
  ) => {
    setFeedPostDraft((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const handleFeedUploadClick = () => {
    feedUploadInputRef.current?.click();
  };

  const handleFeedUploadSelect = (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    if (!files.length) return;

    feedDraftObjectUrlsRef.current.forEach((url) => {
      URL.revokeObjectURL(url);
    });
    feedDraftObjectUrlsRef.current = [];

    let nextImageSrc = "";
    let nextVideoSrc = "";
    let nextImageName = "";
    let nextVideoName = "";
    const nextImageFile = files.find((file) => file.type.startsWith("image/")) || null;
    const nextVideoFile = files.find((file) => file.type.startsWith("video/")) || null;

    feedDraftImageFileRef.current = nextImageFile;
    feedDraftVideoFileRef.current = nextVideoFile;
    setFeedPublishError("");
    setFeedPublishProgress(null);

    files.forEach((file) => {
      if (!nextImageSrc && file.type.startsWith("image/")) {
        nextImageSrc = URL.createObjectURL(file);
        nextImageName = file.name;
        feedDraftObjectUrlsRef.current.push(nextImageSrc);
      }

      if (!nextVideoSrc && file.type.startsWith("video/")) {
        nextVideoSrc = URL.createObjectURL(file);
        nextVideoName = file.name;
        feedDraftObjectUrlsRef.current.push(nextVideoSrc);
      }
    });

    setFeedPostDraft((current) => ({
      ...current,
      imageSrc: nextImageSrc,
      videoSrc: nextVideoSrc,
    }));
    setFeedUploadMeta({
      imageName: nextImageName,
      videoName: nextVideoName,
    });

    if (!nextImageSrc) {
      setFeedDraftMediaStyle(null);
      return;
    }

    const image = new Image();
    image.onload = () => {
      const isPortrait = image.naturalHeight > image.naturalWidth * 1.08;

      setFeedDraftMediaStyle(
        isPortrait
          ? {
              imageWrapClassName: "mt-3 flex items-center justify-center border-transparent bg-transparent p-0",
              imageClassName:
                "h-auto w-auto max-h-[460px] max-w-[320px] rounded-[22px] object-contain",
              detailImageWrapClassName:
                "mt-4 flex items-center justify-center border-transparent bg-transparent p-0",
              detailImageClassName:
                "h-auto w-auto max-h-[70vh] max-w-[380px] rounded-[24px] object-contain",
            }
          : null
      );
    };
    image.onerror = () => {
      setFeedDraftMediaStyle(null);
    };
    image.src = nextImageSrc;
  };

  const handleReelDraftChange = (
    field: keyof typeof reelPostDraft,
    value: string | boolean
  ) => {
    setReelPostDraft((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const handleReelVideoUploadClick = () => {
    reelVideoUploadInputRef.current?.click();
  };

  const handleReelThumbnailUploadClick = () => {
    reelThumbnailUploadInputRef.current?.click();
  };

  const handleReelVideoUploadSelect = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    if (!file || !file.type.startsWith("video/")) return;

    const existingVideoUrl = reelPostDraft.videoSrc;

    if (existingVideoUrl.startsWith("blob:")) {
      URL.revokeObjectURL(existingVideoUrl);
      reelDraftObjectUrlsRef.current = reelDraftObjectUrlsRef.current.filter((url) => url !== existingVideoUrl);
    }

    const nextVideoSrc = URL.createObjectURL(file);
    reelDraftObjectUrlsRef.current.push(nextVideoSrc);
    reelDraftVideoFileRef.current = file;
    setReelPostDraft((current) => ({
      ...current,
      videoSrc: nextVideoSrc,
    }));
    setReelPublishError("");
    setReelPublishProgress(null);
    setReelUploadMeta((current) => ({
      ...current,
      videoName: file.name,
    }));
  };

  const handleReelThumbnailUploadSelect = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    if (!file || !file.type.startsWith("image/")) return;

    const existingThumbnailUrl = reelPostDraft.thumbnailSrc;

    if (existingThumbnailUrl.startsWith("blob:")) {
      URL.revokeObjectURL(existingThumbnailUrl);
      reelDraftObjectUrlsRef.current = reelDraftObjectUrlsRef.current.filter(
        (url) => url !== existingThumbnailUrl
      );
    }

    const nextThumbnailSrc = URL.createObjectURL(file);
    reelDraftObjectUrlsRef.current.push(nextThumbnailSrc);
    reelDraftThumbnailFileRef.current = file;
    setReelPostDraft((current) => ({
      ...current,
      thumbnailSrc: nextThumbnailSrc,
    }));
    setReelPublishError("");
    setReelPublishProgress(null);
    setReelUploadMeta((current) => ({
      ...current,
      thumbnailName: file.name,
    }));
  };

  const handleSubmitFeedPost = async () => {
    const nextContent = feedPostDraft.content.trim();
    const nextImage = feedPostDraft.imageSrc.trim();
    const nextVideo = feedPostDraft.videoSrc.trim();
    const interestTags: string[] = extractInterestTags(
      nextContent,
      nextImage ? "image" : "",
      nextVideo ? "video" : ""
    );
    const distributionId = createDistributionId("feed");
    const publishedAt = new Date().toISOString();
    if (!nextContent && !nextImage && !nextVideo) return;

    setFeedPublishError("");
    setFeedPublishProgress(nextImage || nextVideo ? 8 : 100);

    let imageStorageKey = "";
    let videoStorageKey = "";

    try {
      const mediaSteps = [feedDraftImageFileRef.current, feedDraftVideoFileRef.current].filter(Boolean).length;
      let completedSteps = 0;
      const moveFeedProgress = () => {
        completedSteps += 1;
        const ratio = mediaSteps ? completedSteps / mediaSteps : 1;
        setFeedPublishProgress(Math.min(94, 16 + Math.round(ratio * 72)));
      };

      if (feedDraftImageFileRef.current) {
        imageStorageKey = createPersistentMediaKey("feed-image", feedDraftImageFileRef.current.name);
        const didStoreImage = await storeUploadedMedia(
          imageStorageKey,
          feedDraftImageFileRef.current,
          feedDraftImageFileRef.current.name
        );
        if (!didStoreImage) throw new Error("Image storage unavailable");
        moveFeedProgress();
      }

      if (feedDraftVideoFileRef.current) {
        videoStorageKey = createPersistentMediaKey("feed-video", feedDraftVideoFileRef.current.name);
        const didStoreVideo = await storeUploadedMedia(
          videoStorageKey,
          feedDraftVideoFileRef.current,
          feedDraftVideoFileRef.current.name
        );
        if (!didStoreVideo) throw new Error("Video storage unavailable");
        moveFeedProgress();
      }
    } catch {
      setFeedPublishError("Media save failed. Please try again.");
      setFeedPublishProgress(null);
      return;
    }

    const nextPost: FeedPost = {
      author: companyName || commenterName || (role === "carrier" ? "Carrier User" : "Supplier User"),
      avatarSrc: avatarUrl || "/default-avatar-square.png",
      time: "Just now",
      role: role === "carrier" ? "Carrier" : "Supplier",
      content:
        nextContent || "New media post shared on Alpha Freight.",
      likes: 0,
      comments: 0,
      ...(nextImage ? { imageSrc: nextImage, imageStorageKey: imageStorageKey || undefined } : {}),
      ...(nextVideo ? { videoSrc: nextVideo, videoStorageKey: videoStorageKey || undefined } : {}),
      detailContent: nextContent ? [nextContent] : ["New media post shared on Alpha Freight."],
      distributionId,
      ownerIdentityKey: viewerProfileIdentityKey,
      ownerEmail: userEmail || undefined,
      interestTags,
      shareCount: 0,
      saveCount: 0,
      viewCount: 0,
      engagementScore: 0,
      distributionStage: "interest",
      publishedAt,
      ...(nextImage && feedDraftMediaStyle ? feedDraftMediaStyle : {}),
    };

    if (userId) {
      let remoteImageUrl: string | undefined;
      let remoteVideoUrl: string | undefined;
      let imageStoragePath: string | undefined;
      let videoStoragePath: string | undefined;
      let uploadErrorMessage = "";

      if (feedDraftImageFileRef.current) {
        const uploadedImage = await uploadFeedMediaToSupabase(
          userId,
          feedDraftImageFileRef.current,
          "image",
          feedDraftImageFileRef.current.name
        );

        if (uploadedImage.ok) {
          remoteImageUrl = uploadedImage.publicUrl;
          imageStoragePath = uploadedImage.path;
          nextPost.imageSrc = uploadedImage.publicUrl;
        } else {
          uploadErrorMessage = uploadedImage.error;
        }
      }

      if (feedDraftVideoFileRef.current) {
        const uploadedVideo = await uploadFeedMediaToSupabase(
          userId,
          feedDraftVideoFileRef.current,
          "video",
          feedDraftVideoFileRef.current.name
        );

        if (uploadedVideo.ok) {
          remoteVideoUrl = uploadedVideo.publicUrl;
          videoStoragePath = uploadedVideo.path;
          nextPost.videoSrc = uploadedVideo.publicUrl;
        } else {
          uploadErrorMessage = uploadedVideo.error;
        }
      }

      if ((nextImage || nextVideo) && !remoteImageUrl && !remoteVideoUrl) {
        setFeedPublishError(
          uploadErrorMessage ||
            "Media upload failed. Run the latest feed-social.sql in Supabase to create the feed-media bucket."
        );
        setFeedPublishProgress(null);
        return;
      }

      const persistResult = await persistFeedPostToSupabase({
        distributionId,
        authorId: userId,
        authorName: nextPost.author,
        authorEmail: userEmail,
        authorProfileKey: viewerProfileIdentityKey,
        authorRole: role,
        authorAvatar: pickBestAvatarSrc(avatarUrl) || "/default-avatar-square.png",
        content: nextPost.content,
        imageUrl: remoteImageUrl,
        videoUrl: remoteVideoUrl,
        imageStoragePath,
        videoStoragePath,
        interestTags,
        publishedAt,
      });

      if (!persistResult.ok) {
        console.warn("[FeedWorkspace] Post not saved to Supabase:", persistResult.error);
      }
    }

    setFeedPublishProgress(100);
    await new Promise((resolve) => window.setTimeout(resolve, 320));
    setCustomFeedPosts((current) => [nextPost, ...current]);
    setDiscoveryFeedPosts((current) => [nextPost, ...current]);
    dispatchFeedContentUpdated();
    setPublishNotice({
      title: "Live",
      message: "Your post is live.",
    });
    setFeedPostDraft({
      content: "",
      imageSrc: "",
      videoSrc: "",
    });
    feedDraftImageFileRef.current = null;
    feedDraftVideoFileRef.current = null;
    setFeedUploadMeta({
      imageName: "",
      videoName: "",
    });
    setFeedDraftMediaStyle(null);
    feedDraftObjectUrlsRef.current = [];
    if (feedUploadInputRef.current) {
      feedUploadInputRef.current.value = "";
    }
    setComposerMode("feed");
    setIsComposerOpen(false);
    window.setTimeout(() => {
      setFeedPublishProgress(null);
    }, 400);
  };

  const handleSubmitReelPost = async () => {
    const nextVideo = reelPostDraft.videoSrc.trim();
    const nextThumbnail = reelPostDraft.thumbnailSrc.trim();
    const nextTitle = reelPostDraft.title.trim();
    const nextDescription = reelPostDraft.description.trim();
    const interestTags: string[] = extractInterestTags(
      nextTitle,
      nextDescription,
      reelPostDraft.hashtags
    );
    const distributionId = createDistributionId("reel");
    const publishedAt = new Date().toISOString();
    if (!nextVideo || !nextThumbnail || !nextTitle || !nextDescription) {
      return;
    }

    setReelPublishError("");
    setReelPublishProgress(8);

    let videoStorageKey = "";
    let thumbnailStorageKey = "";

    try {
      const mediaSteps = [reelDraftVideoFileRef.current, reelDraftThumbnailFileRef.current].filter(Boolean).length;
      let completedSteps = 0;
      const moveReelProgress = () => {
        completedSteps += 1;
        const ratio = mediaSteps ? completedSteps / mediaSteps : 1;
        setReelPublishProgress(Math.min(94, 16 + Math.round(ratio * 72)));
      };

      if (reelDraftVideoFileRef.current) {
        videoStorageKey = createPersistentMediaKey("reel-video", reelDraftVideoFileRef.current.name);
        const didStoreVideo = await storeUploadedMedia(
          videoStorageKey,
          reelDraftVideoFileRef.current,
          reelDraftVideoFileRef.current.name
        );
        if (!didStoreVideo) throw new Error("Video storage unavailable");
        moveReelProgress();
      }

      if (reelDraftThumbnailFileRef.current) {
        thumbnailStorageKey = createPersistentMediaKey(
          "reel-thumbnail",
          reelDraftThumbnailFileRef.current.name
        );
        const didStoreThumbnail = await storeUploadedMedia(
          thumbnailStorageKey,
          reelDraftThumbnailFileRef.current,
          reelDraftThumbnailFileRef.current.name
        );
        if (!didStoreThumbnail) throw new Error("Thumbnail storage unavailable");
        moveReelProgress();
      }
    } catch {
      setReelPublishError("Media save failed. Please try again.");
      setReelPublishProgress(null);
      return;
    }

    const nextReel: ReelPost = {
      author: companyName || commenterName || (role === "carrier" ? "Carrier User" : "Supplier User"),
      avatarSrc: avatarUrl || nextThumbnail || "/default-avatar-square.png",
      handle: userEmail ? `@${userEmail.split("@")[0].replace(/\s+/g, "").toLowerCase()}` : "@alphafreight",
      role: role === "carrier" ? "Carrier" : "Supplier",
      time: "Just now",
      bio: nextDescription,
      title: nextTitle,
      caption: [nextDescription, reelPostDraft.hashtags.trim()].filter(Boolean).join(" "),
      likes: "0",
      comments: "0",
      videoSrc: nextVideo,
      thumbnailSrc: nextThumbnail,
      videoStorageKey: videoStorageKey || undefined,
      thumbnailStorageKey: thumbnailStorageKey || undefined,
      description: nextDescription,
      hashtags: reelPostDraft.hashtags.trim(),
      distributionId,
      ownerIdentityKey: viewerProfileIdentityKey,
      ownerEmail: userEmail || undefined,
      interestTags,
      shareCount: 0,
      saveCount: 0,
      viewCount: 0,
      engagementScore: 0,
      distributionStage: "interest",
      publishedAt,
    };
    setReelPublishProgress(100);
    await new Promise((resolve) => window.setTimeout(resolve, 320));
    setCustomReelPosts((current) => [nextReel, ...current]);
    setDiscoveryReelPosts((current) => [nextReel, ...current]);
    dispatchFeedContentUpdated();
    reelDraftObjectUrlsRef.current = [];
    resetReelDraft();
    setLikedReels({});
    setSavedReels({});
    setCommentedReels({});
    setSharedReels({});
    setMoreReels({});
    setActiveReelDirection(-1);
    setActiveReelIndex(0);
    setComposerMode("reel");
    setIsComposerOpen(false);
    setPublishNotice({
      title: "Live",
      message: "Your reel is live.",
    });
    window.setTimeout(() => {
      setReelPublishProgress(null);
    }, 400);
  };

  const handleSaveReelDraft = () => {
    setComposerMode("reel");
    setIsComposerOpen(false);
  };

  const handleChangeReel = (direction: 1 | -1) => {
    setActiveReelDirection(direction);
    setActiveReelIndex((current) =>
      Math.min(reelPosts.length - 1, Math.max(0, current + direction))
    );
  };

  const setTemporaryReelState = (
    key: "comment" | "share" | "more",
    reelIndex: number,
    setter: React.Dispatch<React.SetStateAction<Record<number, boolean>>>,
    duration: number
  ) => {
    setter((current) => ({
      ...current,
      [reelIndex]: true,
    }));

    const timerKey = `${key}-${reelIndex}`;
    const existingTimer = reelActionResetTimersRef.current[timerKey];

    if (existingTimer) {
      window.clearTimeout(existingTimer);
    }

    reelActionResetTimersRef.current[timerKey] = window.setTimeout(() => {
      setter((current) => ({
        ...current,
        [reelIndex]: false,
      }));
    }, duration);
  };

  const handleToggleReelLike = async (reelIndex: number) => {
    const reel: ReelPost | undefined = reelPosts[reelIndex];
    const nextLiked = !likedReels[reelIndex];

    setLikedReels((current) => ({
      ...current,
      [reelIndex]: nextLiked,
    }));

    if (!reel) return;

    if (nextLiked) {
      boostViewerInterest(reel.interestTags, 2);
      await notifyContentOwner({
        author: reel.author,
        ownerEmail: reel.ownerEmail,
        ownerIdentityKey: reel.ownerIdentityKey,
        distributionId: reel.distributionId,
        type: "like",
        message: "liked your reel",
      });
    }

    updateDiscoveryReel(reel.distributionId, (currentReel) => {
      const nextLikes = Math.max(0, parseReelMetricCount(currentReel.likes) + (nextLiked ? 1 : -1));
      const nextComments = parseReelMetricCount(currentReel.comments);
      const nextEngagementScore = computeEngagementScore({
        likes: nextLikes,
        comments: nextComments,
        shareCount: currentReel.shareCount,
        saveCount: currentReel.saveCount,
        viewCount: currentReel.viewCount,
      });

      return {
        ...currentReel,
        likes: String(nextLikes),
        engagementScore: nextEngagementScore,
        distributionStage: getDistributionStage(nextEngagementScore),
      };
    });
  };

  const handleToggleReelSave = (reelIndex: number) => {
    const reel: ReelPost | undefined = reelPosts[reelIndex];
    const nextSaved = !savedReels[reelIndex];

    setSavedReels((current) => ({
      ...current,
      [reelIndex]: nextSaved,
    }));

    if (!reel) return;

    if (nextSaved) {
      boostViewerInterest(reel.interestTags, 2);
    }

    updateDiscoveryReel(reel.distributionId, (currentReel) => {
      const nextSaveCount = Math.max(0, (currentReel.saveCount || 0) + (nextSaved ? 1 : -1));
      const nextEngagementScore = computeEngagementScore({
        likes: parseReelMetricCount(currentReel.likes),
        comments: parseReelMetricCount(currentReel.comments),
        shareCount: currentReel.shareCount,
        saveCount: nextSaveCount,
        viewCount: currentReel.viewCount,
      });

      return {
        ...currentReel,
        saveCount: nextSaveCount,
        engagementScore: nextEngagementScore,
        distributionStage: getDistributionStage(nextEngagementScore),
      };
    });
  };

  const handleTriggerReelComment = (reelIndex: number) => {
    setTemporaryReelState("comment", reelIndex, setCommentedReels, 1400);
    const reel: ReelPost | undefined = reelPosts[reelIndex];

    if (!reel) return;

    boostViewerInterest(reel.interestTags, 3);
    updateDiscoveryReel(reel.distributionId, (currentReel) => {
      const nextComments = parseReelMetricCount(currentReel.comments) + 1;
      const nextEngagementScore = computeEngagementScore({
        likes: parseReelMetricCount(currentReel.likes),
        comments: nextComments,
        shareCount: currentReel.shareCount,
        saveCount: currentReel.saveCount,
        viewCount: currentReel.viewCount,
      });

      return {
        ...currentReel,
        comments: String(nextComments),
        engagementScore: nextEngagementScore,
        distributionStage: getDistributionStage(nextEngagementScore),
      };
    });
  };

  const handleShareReel = async (reelIndex: number) => {
    const reel: ReelPost | undefined = reelPosts[reelIndex];

    if (!reel) return;

    const shareUrl = `${window.location.origin}/${role}/feed?view=reel&reel=${reelIndex + 1}`;
    const shareData = {
      title: `${reel.author} reel on Alpha Freight`,
      text: reel.title,
      url: shareUrl,
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(shareUrl);
      }

      setTemporaryReelState("share", reelIndex, setSharedReels, 1800);
      boostViewerInterest(reel.interestTags, 4);
      updateDiscoveryReel(reel.distributionId, (currentReel) => {
        const nextShareCount = (currentReel.shareCount || 0) + 1;
        const nextEngagementScore = computeEngagementScore({
          likes: parseReelMetricCount(currentReel.likes),
          comments: parseReelMetricCount(currentReel.comments),
          shareCount: nextShareCount,
          saveCount: currentReel.saveCount,
          viewCount: currentReel.viewCount,
        });

        return {
          ...currentReel,
          shareCount: nextShareCount,
          engagementScore: nextEngagementScore,
          distributionStage: getDistributionStage(nextEngagementScore),
        };
      });
    } catch {
      // Ignore cancelled native share actions.
    }
  };

  const handleTriggerReelMore = (reelIndex: number) => {
    setTemporaryReelState("more", reelIndex, setMoreReels, 1200);
  };

  const handleReelWheel = (event: React.WheelEvent<HTMLDivElement>) => {
    if (reelWheelLockRef.current || Math.abs(event.deltaY) < 28) return;

    event.preventDefault();
    reelWheelLockRef.current = true;
    handleChangeReel(event.deltaY > 0 ? 1 : -1);

    window.setTimeout(() => {
      reelWheelLockRef.current = false;
    }, 320);
  };

  const handleReelTouchStart = (event: React.TouchEvent<HTMLDivElement>) => {
    reelTouchStartYRef.current = event.touches[0]?.clientY ?? null;
  };

  const handleReelTouchEnd = (event: React.TouchEvent<HTMLDivElement>) => {
    const startY = reelTouchStartYRef.current;
    const endY = event.changedTouches[0]?.clientY ?? null;

    reelTouchStartYRef.current = null;

    if (startY === null || endY === null) return;

    const deltaY = startY - endY;

    if (Math.abs(deltaY) < 44) return;

    handleChangeReel(deltaY > 0 ? 1 : -1);
  };

  const rankedDiscoveryReels = useMemo<ReelPost[]>(() => {
    return [...discoveryReelPosts]
      .filter((reel) => reel.ownerIdentityKey !== viewerIdentityKey)
      .filter((reel) => {
        const interestMatch = getInterestMatchScore(viewerInterestProfile, reel.interestTags);
        const engagementScore =
          reel.engagementScore ??
          computeEngagementScore({
            likes: parseReelMetricCount(reel.likes),
            comments: parseReelMetricCount(reel.comments),
            shareCount: reel.shareCount,
            saveCount: reel.saveCount,
            viewCount: reel.viewCount,
          });

        return reel.distributionStage === "for-you" || interestMatch >= 2 || engagementScore >= 18;
      })
      .sort((left, right) => {
        const leftInterest = getInterestMatchScore(viewerInterestProfile, left.interestTags);
        const rightInterest = getInterestMatchScore(viewerInterestProfile, right.interestTags);
        const leftScore =
          (left.engagementScore ??
            computeEngagementScore({
              likes: parseReelMetricCount(left.likes),
              comments: parseReelMetricCount(left.comments),
              shareCount: left.shareCount,
              saveCount: left.saveCount,
              viewCount: left.viewCount,
            })) +
          leftInterest * 3 +
          getFreshnessBoost(left.publishedAt) +
          (left.role.toLowerCase() === role ? 3 : 0);
        const rightScore =
          (right.engagementScore ??
            computeEngagementScore({
              likes: parseReelMetricCount(right.likes),
              comments: parseReelMetricCount(right.comments),
              shareCount: right.shareCount,
              saveCount: right.saveCount,
              viewCount: right.viewCount,
            })) +
          rightInterest * 3 +
          getFreshnessBoost(right.publishedAt) +
          (right.role.toLowerCase() === role ? 3 : 0);

        return rightScore - leftScore;
      });
  }, [discoveryReelPosts, role, viewerIdentityKey, viewerInterestProfile]);
  const reelPosts = useMemo<ReelPost[]>(() => [...rankedDiscoveryReels, ...reelItems], [rankedDiscoveryReels]);
  const rankedDiscoveryFeedEntries = useMemo<Array<{ post: FeedPost; index: number }>>(() => {
    return [...discoveryFeedPosts]
      .filter((post) => post.ownerIdentityKey !== viewerIdentityKey)
      .filter((post) => {
        const interestMatch = getInterestMatchScore(viewerInterestProfile, post.interestTags);
        const engagementScore =
          post.engagementScore ??
          computeEngagementScore({
            likes: post.likes,
            comments: post.comments,
            shareCount: post.shareCount,
            saveCount: post.saveCount,
            viewCount: post.viewCount,
          });

        return post.distributionStage === "for-you" || interestMatch >= 2 || engagementScore >= 18;
      })
      .sort((left, right) => {
        const leftInterest = getInterestMatchScore(viewerInterestProfile, left.interestTags);
        const rightInterest = getInterestMatchScore(viewerInterestProfile, right.interestTags);
        const leftScore =
          (left.engagementScore ??
            computeEngagementScore({
              likes: left.likes,
              comments: left.comments,
              shareCount: left.shareCount,
              saveCount: left.saveCount,
              viewCount: left.viewCount,
            })) +
          leftInterest * 3 +
          getFreshnessBoost(left.publishedAt) +
          (left.role.toLowerCase() === role ? 3 : 0);
        const rightScore =
          (right.engagementScore ??
            computeEngagementScore({
              likes: right.likes,
              comments: right.comments,
              shareCount: right.shareCount,
              saveCount: right.saveCount,
              viewCount: right.viewCount,
            })) +
          rightInterest * 3 +
          getFreshnessBoost(right.publishedAt) +
          (right.role.toLowerCase() === role ? 3 : 0);

        return rightScore - leftScore;
      })
      .map((post, index) => ({ post, index: -(index + 1000) }));
  }, [discoveryFeedPosts, role, viewerIdentityKey, viewerInterestProfile]);
  const authoredFeedEntries = useMemo<Array<{ post: FeedPost; index: number }>>(
    () => customFeedPosts.map((post, index) => ({ post, index: -(index + 1) })),
    [customFeedPosts]
  );
  const allNetworkFeedPosts = useMemo(() => {
    const postMap = new Map<string, FeedPost>();

    readAllNetworkFeedPosts<FeedPost>().forEach((post) => {
      const key = post.distributionId || `${post.author}-${post.publishedAt || post.content?.slice(0, 24)}`;
      postMap.set(key, post);
    });

    discoveryFeedPosts.forEach((post) => {
      const key = post.distributionId || `${post.author}-${post.publishedAt || post.content?.slice(0, 24)}`;
      postMap.set(key, post);
    });

    remoteFeedPosts.forEach((post) => {
      const key = post.distributionId || `${post.author}-${post.publishedAt || post.content?.slice(0, 24)}`;
      const existing = postMap.get(key);
      const remoteHasMedia = Boolean(post.imageSrc?.trim() || post.videoSrc?.trim());
      const existingHasMedia = Boolean(existing?.imageSrc?.trim() || existing?.videoSrc?.trim());

      if (!existing || remoteHasMedia || !existingHasMedia) {
        postMap.set(key, post as FeedPost);
      }
    });

    return [...postMap.values()];
  }, [discoveryFeedPosts, networkFeedRefreshKey, remoteFeedPosts]);
  const feedEntries = useMemo<Array<{ post: FeedPost; index: number }>>(
    () => [...rankedDiscoveryFeedEntries, ...samplePosts.map((post, index) => ({ post, index }))],
    [rankedDiscoveryFeedEntries]
  );
  const selectedPost =
    selectedPostIndex !== null
      ? feedEntries.find((entry) => entry.index === selectedPostIndex)?.post || null
      : null;
  const selectedPostIndexValue = selectedPostIndex ?? 0;
  const selectedPostMediaStateKey = getFeedMediaStateKey(selectedPost, selectedPostIndexValue);
  const selectedPostSubmittedComments =
    selectedPostIndex !== null ? submittedComments[selectedPostIndex] || [] : [];
  const isSelectedPostCommentOpen =
    selectedPostIndex !== null ? Boolean(openCommentPosts[selectedPostIndex]) : false;
  const activeTab =
    searchParams.get("tab") === "hype"
      ? "hype"
      : searchParams.get("tab") === "activity"
        ? "activity"
        : "feed";
  const activeView = searchParams.get("view") || "";
  const activityFilter = ["all", "replies", "likes", "mentions", "follow"].includes(
    searchParams.get("activity") || ""
  )
    ? (searchParams.get("activity") as "all" | "replies" | "likes" | "mentions" | "follow")
    : "all";
  const hypeMediaEntries = useMemo(() => {
    return [...feedEntries]
      .filter(({ post }) => "imageSrc" in post)
      .sort((left, right) => {
        const leftScore =
          left.post.likes * 3 +
          left.post.comments * 2 +
          ("imageSrc" in left.post ? 7 : 0);
        const rightScore =
          right.post.likes * 3 +
          right.post.comments * 2 +
          ("imageSrc" in right.post ? 7 : 0);

        return rightScore - leftScore;
      });
  }, [feedEntries]);
  const featuredHypeEntry = hypeMediaEntries[0] || null;
  const hypeStats = useMemo(
    () => ({
      moments: hypeMediaEntries.length,
      likes: hypeMediaEntries.reduce((sum, entry) => sum + entry.post.likes, 0),
      comments: hypeMediaEntries.reduce((sum, entry) => sum + entry.post.comments, 0),
    }),
    [hypeMediaEntries]
  );
  const activityEntries = useMemo(() => {
    return feedActivityItems
      .map((item) => ({
        ...item,
        time: formatActivityTime(item.createdAt),
      }))
      .filter((item) => {
      if (isOutgoingFollowActivity(item)) return false;
      if (item.actor.trim().toLowerCase() === "you" && (item.type === "like" || item.type === "reply")) {
        return false;
      }
      if (activityFilter === "all") return true;
      if (activityFilter === "replies") return isIncomingReplyActivity(item);
      if (activityFilter === "likes") return isIncomingLikeActivity(item);
      if (activityFilter === "mentions") return item.type === "mention";
      if (activityFilter === "follow") return isIncomingFollowActivity(item);

      return true;
    });
  }, [activityFilter, feedActivityItems]);
  const followingEntries = useMemo(
    () =>
      allNetworkFeedPosts
        .filter((post) => {
          if (!followedProfileKeys.length) return false;

          const isOwnPost =
            post.ownerIdentityKey === viewerIdentityKey ||
            createProfileIdentityKey({ ownerEmail: post.ownerEmail, author: post.author }) ===
              viewerProfileIdentityKey;

          if (isOwnPost) return false;

          return doesPostMatchFollowedProfile(post, followedProfileKeys);
        })
        .sort(
          (left, right) =>
            new Date(right.publishedAt || 0).getTime() - new Date(left.publishedAt || 0).getTime()
        )
        .map((post, index) => ({ post, index: -(index + 2000) })),
    [allNetworkFeedPosts, followedProfileKeys, viewerIdentityKey, viewerProfileIdentityKey]
  );
  const savedEntries = useMemo(
    () => feedEntries.filter(({ index }) => Boolean(savedPostStates[index])),
    [feedEntries, savedPostStates]
  );
  const isReelView = activeView === "reel";
  const isFollowingView = activeView === "following";
  const isSavedView = activeView === "saved";
  const feedLikeEntries = isFollowingView ? followingEntries : isSavedView ? savedEntries : feedEntries;
  const showFeedSidebar = activeTab === "feed" && (!activeView || isFollowingView || isSavedView);
  const feedEmptyState: { icon: ReactNode; title: string; copy: string } = isFollowingView
    ? {
        icon: <UserPlus className="h-5 w-5" />,
        title: "No following posts yet",
        copy: "Posts from people you follow will show up here as soon as they share something new.",
      }
    : isSavedView
      ? {
          icon: <Bookmark className="h-5 w-5" />,
          title: "No saved posts yet",
          copy: "Posts you save for later will appear here for quick access.",
        }
      : {
          icon: <Sparkles className="h-5 w-5" />,
          title: "No posts yet",
          copy: "Upload your first post to see fresh updates start flowing through your network.",
        };
  const activeReel = reelPosts[activeReelIndex] || reelPosts[0] || null;
  const isFirstReel = activeReelIndex === 0;
  const isLastReel = activeReelIndex === reelPosts.length - 1;
  const isActiveReelLiked = Boolean(likedReels[activeReelIndex]);
  const isActiveReelSaved = Boolean(savedReels[activeReelIndex]);
  const isActiveReelCommented = Boolean(commentedReels[activeReelIndex]);
  const isActiveReelShared = Boolean(sharedReels[activeReelIndex]);
  const isActiveReelMoreOpen = Boolean(moreReels[activeReelIndex]);
  const latestNetworkReel = rankedDiscoveryReels[0] || null;
  const latestNetworkVideoPost = rankedDiscoveryFeedEntries.find(({ post }) => Boolean(post.videoSrc))?.post || null;
  const spotlightMedia = latestNetworkReel
    ? {
        videoSrc: latestNetworkReel.videoSrc,
        title: latestNetworkReel.title,
        description: latestNetworkReel.caption || latestNetworkReel.bio,
      }
    : latestNetworkVideoPost
      ? {
          videoSrc: latestNetworkVideoPost.videoSrc || "",
          title: latestNetworkVideoPost.author,
          description: latestNetworkVideoPost.content,
        }
      : {
          videoSrc: "/0625 (1).mp4",
          title: "Alpha Freight Spotlight",
          description: "Featured reels and network highlights appear here.",
        };
  const networkProfiles = useMemo(
    () =>
      Array.from(
        new Map(
          [
            ...rankedDiscoveryFeedEntries.map(({ post }) => ({
              key: post.author,
              name: post.author,
              handle: post.ownerEmail
                ? `@${post.ownerEmail.split("@")[0].replace(/\s+/g, "").toLowerCase()}`
                : `@${post.author.replace(/\s+/g, "").toLowerCase()}`,
              avatarSrc: post.avatarSrc,
            })),
            ...rankedDiscoveryReels.map((reel) => ({
              key: reel.author,
              name: reel.author,
              handle: reel.handle,
              avatarSrc: reel.avatarSrc,
            })),
          ].map((profile) => [profile.key, profile])
        ).values()
      ).slice(0, 4),
    [rankedDiscoveryFeedEntries, rankedDiscoveryReels]
  );

  useEffect(() => {
    if (activeReelIndex > reelPosts.length - 1) {
      setActiveReelIndex(Math.max(0, reelPosts.length - 1));
    }
  }, [activeReelIndex, reelPosts.length]);

  useEffect(() => {
    if (!isReelView) return;
    if (!activeReel) return;

    const reelVideo = activeReelVideoRef.current;

    if (!reelVideo) return;

    const syncReelAudio = () => {
      const isLandscape = reelVideo.videoWidth > reelVideo.videoHeight;
      const reelVideoWithAudioState = reelVideo as HTMLVideoElement & {
        audioTracks?: { length: number };
        mozHasAudio?: boolean;
        webkitAudioDecodedByteCount?: number;
      };

      const hasAudio = Boolean(
        reelVideoWithAudioState.mozHasAudio ||
          (typeof reelVideoWithAudioState.webkitAudioDecodedByteCount === "number" &&
            reelVideoWithAudioState.webkitAudioDecodedByteCount > 0) ||
          (reelVideoWithAudioState.audioTracks && reelVideoWithAudioState.audioTracks.length > 0)
      );

      setActiveReelIsLandscape(isLandscape);
      reelVideo.muted = !hasAudio;
      reelVideo.defaultMuted = !hasAudio;
      reelVideo.volume = hasAudio ? 1 : 0;

      void reelVideo.play().catch(() => {
        // Browsers may block autoplay with sound; fall back to muted playback.
        reelVideo.muted = true;
        reelVideo.defaultMuted = true;
        reelVideo.volume = 0;
        void reelVideo.play().catch(() => {
          // Ignore repeated autoplay rejections.
        });
      });
    };

    if (reelVideo.readyState >= 1) {
      syncReelAudio();
      return;
    }

    setActiveReelIsLandscape(false);
    reelVideo.addEventListener("loadedmetadata", syncReelAudio, { once: true });

    return () => {
      reelVideo.removeEventListener("loadedmetadata", syncReelAudio);
    };
  }, [activeReel, activeReelIndex, isReelView]);

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#020202_0%,#040404_48%,#020202_100%)] py-3 text-white">
      <AnimatePresence>
        {showIntroVideo === true ? (
          <motion.div
            initial={{ opacity: 1 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.45, ease: "easeOut" }}
            className="fixed inset-0 z-[120] flex items-center justify-center overflow-hidden bg-black"
          >
            <video
              autoPlay
              muted
              playsInline
              preload="auto"
              className="w-[min(78vw,920px)] object-cover"
            >
              <source src="/Clean Typewriter Text Animation for Titles.mp4" type="video/mp4" />
            </video>
          </motion.div>
        ) : null}
      </AnimatePresence>

      <AnimatePresence>
        {publishNotice ? (
          <motion.div
            initial={{ opacity: 0, y: 22, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.985 }}
            transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
            className="fixed bottom-5 left-1/2 z-[150] w-[min(92vw,360px)] -translate-x-1/2 rounded-[24px] border border-white/8 bg-[linear-gradient(180deg,rgba(4,6,10,0.97)_0%,rgba(2,3,6,0.99)_100%)] px-3.5 py-3 shadow-[0_24px_80px_rgba(0,0,0,0.46)] backdrop-blur-2xl"
          >
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-white/6 bg-[#1292FF]/10 text-[#67B7FF]">
                <Sparkles className="h-3.5 w-3.5" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/90">
                  {publishNotice.title}
                </p>
                <p className="mt-0.5 text-[11px] leading-5 text-slate-300/95">{publishNotice.message}</p>
              </div>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>

      <AnimatePresence>
        {isComposerOpen ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[140] flex items-center justify-center bg-black/72 px-4 backdrop-blur-sm"
          >
            <motion.div
              initial={{ opacity: 0, y: 18, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 18, scale: 0.98 }}
              transition={{ duration: 0.24, ease: "easeOut" }}
              className="max-h-[90vh] w-full max-w-[860px] overflow-y-auto rounded-[28px] border border-white/8 bg-[#090909] p-5 shadow-[0_24px_80px_rgba(0,0,0,0.42)]"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[16px] font-black tracking-[-0.03em] text-white">Create Post</p>
                  <p className="mt-1 text-[12px] leading-5 text-slate-500">
                    Feed post ya reel post foran publish karo.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleCloseComposer}
                  className="rounded-full border border-white/8 bg-white/[0.04] px-3 py-1.5 text-[11px] font-bold text-slate-300 transition hover:bg-white/[0.08] hover:text-white"
                >
                  Close
                </button>
              </div>

              <div className="mt-4 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setComposerMode("feed")}
                  className={`rounded-[10px] px-3 py-2 text-[12px] font-bold transition ${
                    composerMode === "feed"
                      ? "bg-white/[0.08] text-white"
                      : "text-slate-500 hover:text-white"
                  }`}
                >
                  Feed Post
                </button>
                <button
                  type="button"
                  onClick={() => setComposerMode("reel")}
                  className={`rounded-[10px] px-3 py-2 text-[12px] font-bold transition ${
                    composerMode === "reel"
                      ? "bg-white/[0.08] text-white"
                      : "text-slate-500 hover:text-white"
                  }`}
                >
                  Reel Post
                </button>
              </div>

              {composerMode === "feed" ? (
                <div className="mt-4 space-y-3">
                  <input
                    ref={feedUploadInputRef}
                    type="file"
                    accept="image/*,video/*"
                    multiple
                    onChange={handleFeedUploadSelect}
                    className="hidden"
                  />
                  <div className="relative">
                    <textarea
                      value={feedPostDraft.content}
                      onChange={(event) => handleFeedDraftChange("content", event.target.value)}
                      placeholder={content.composerHint}
                      rows={5}
                      className="w-full resize-none rounded-[18px] border border-white/8 bg-[#060606] px-4 py-3 pr-14 text-[13px] leading-6 text-white outline-none placeholder:text-slate-500 focus:border-white/16"
                    />
                    <button
                      type="button"
                      onClick={handleFeedUploadClick}
                      className="absolute bottom-3 right-3 inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/8 bg-white/[0.04] text-slate-300 transition hover:bg-white/[0.08] hover:text-white"
                    >
                      <Upload className="h-4.5 w-4.5" />
                    </button>
                  </div>
                  {feedUploadMeta.imageName || feedUploadMeta.videoName ? (
                    <div className="flex flex-wrap items-center gap-2">
                      {feedUploadMeta.imageName ? (
                        <span className="rounded-full border border-white/8 bg-white/[0.04] px-3 py-1.5 text-[10px] font-semibold text-slate-300">
                          Image: {feedUploadMeta.imageName}
                        </span>
                      ) : null}
                      {feedUploadMeta.videoName ? (
                        <span className="rounded-full border border-white/8 bg-white/[0.04] px-3 py-1.5 text-[10px] font-semibold text-slate-300">
                          Video: {feedUploadMeta.videoName}
                        </span>
                      ) : null}
                    </div>
                  ) : null}
                  {feedPublishProgress !== null ? (
                    <div className="space-y-2 rounded-[16px] border border-white/8 bg-white/[0.03] px-3 py-2">
                      <div className="flex items-center justify-between gap-3 text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">
                        <span>Saving Media</span>
                        <span className="text-white">{feedPublishProgress}%</span>
                      </div>
                      <div className="h-1.5 overflow-hidden rounded-full bg-white/8">
                        <div
                          className="h-full rounded-full bg-[#1292FF] transition-all duration-300"
                          style={{ width: `${feedPublishProgress}%` }}
                        />
                      </div>
                    </div>
                  ) : null}
                  {feedPublishError ? (
                    <p className="text-[11px] font-semibold text-rose-400">{feedPublishError}</p>
                  ) : null}
                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={handleSubmitFeedPost}
                      disabled={feedPublishProgress !== null && feedPublishProgress < 100}
                      className="rounded-full bg-[#1292FF] px-4 py-2 text-[11px] font-black uppercase tracking-[0.16em] text-white transition hover:bg-[#0c83e8] disabled:cursor-not-allowed disabled:opacity-70"
                    >
                      Publish Feed Post
                    </button>
                  </div>
                </div>
              ) : (
                <div className="mt-4 space-y-5">
                  <input
                    ref={reelVideoUploadInputRef}
                    type="file"
                    accept="video/*"
                    onChange={handleReelVideoUploadSelect}
                    className="hidden"
                  />
                  <input
                    ref={reelThumbnailUploadInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleReelThumbnailUploadSelect}
                    className="hidden"
                  />

                  <div className="rounded-[22px] border border-white/8 bg-[#060606] p-4">
                    <p className="text-[12px] font-black uppercase tracking-[0.16em] text-slate-400">Video Content</p>
                    <div className="mt-4 grid gap-3 md:grid-cols-2">
                      <div className="rounded-[14px] border border-white/8 bg-[#090909] p-3">
                        <p className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-500">Video File *</p>
                        <div className="mt-2 flex items-center justify-between gap-3">
                          <p className="truncate text-[12px] text-slate-300">
                            {reelUploadMeta.videoName || "Choose reel video"}
                          </p>
                          <button
                            type="button"
                            onClick={handleReelVideoUploadClick}
                            className="inline-flex items-center gap-1.5 rounded-full border border-white/8 bg-white/[0.04] px-3 py-1.5 text-[10px] font-bold text-white transition hover:bg-white/[0.08]"
                          >
                            <Upload className="h-3.5 w-3.5" />
                            Choose File
                          </button>
                        </div>
                      </div>
                      <div className="rounded-[14px] border border-white/8 bg-[#090909] p-3">
                        <p className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-500">Thumbnail *</p>
                        <div className="mt-2 flex items-center justify-between gap-3">
                          <p className="truncate text-[12px] text-slate-300">
                            {reelUploadMeta.thumbnailName || "Choose thumbnail"}
                          </p>
                          <button
                            type="button"
                            onClick={handleReelThumbnailUploadClick}
                            className="inline-flex items-center gap-1.5 rounded-full border border-white/8 bg-white/[0.04] px-3 py-1.5 text-[10px] font-bold text-white transition hover:bg-white/[0.08]"
                          >
                            <Upload className="h-3.5 w-3.5" />
                            Choose File
                          </button>
                        </div>
                      </div>
                      <div className="rounded-[14px] border border-white/8 bg-[#090909] p-3 md:col-span-2">
                        <p className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-500">Title *</p>
                        <input
                          type="text"
                          value={reelPostDraft.title}
                          onChange={(event) => handleReelDraftChange("title", event.target.value)}
                          placeholder="Evening capacity release"
                          className="mt-2 w-full bg-transparent text-[12px] text-white outline-none placeholder:text-slate-500"
                        />
                      </div>
                      <div className="rounded-[14px] border border-white/8 bg-[#090909] p-3 md:col-span-2">
                        <p className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-500">Description *</p>
                        <textarea
                          value={reelPostDraft.description}
                          onChange={(event) => handleReelDraftChange("description", event.target.value)}
                          placeholder="Two vehicles available..."
                          rows={3}
                          className="mt-2 w-full resize-none bg-transparent text-[12px] leading-5 text-white outline-none placeholder:text-slate-500"
                        />
                      </div>
                      <div className="rounded-[14px] border border-white/8 bg-[#090909] p-3 md:col-span-2">
                        <p className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-500">Hashtags</p>
                        <input
                          type="text"
                          value={reelPostDraft.hashtags}
                          onChange={(event) => handleReelDraftChange("hashtags", event.target.value)}
                          placeholder="#CapacityAlert #LTL"
                          className="mt-2 w-full bg-transparent text-[12px] text-white outline-none placeholder:text-slate-500"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-3">
                    <button
                      type="button"
                      onClick={handleCancelComposer}
                      className="rounded-full border border-white/8 bg-white/[0.04] px-4 py-2 text-[11px] font-black uppercase tracking-[0.14em] text-slate-300 transition hover:bg-white/[0.08] hover:text-white"
                    >
                      Cancel
                    </button>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={handleSaveReelDraft}
                        className="rounded-full border border-white/8 bg-white/[0.04] px-4 py-2 text-[11px] font-black uppercase tracking-[0.14em] text-slate-300 transition hover:bg-white/[0.08] hover:text-white"
                      >
                        Save Draft
                      </button>
                      <button
                        type="button"
                        onClick={handleSubmitReelPost}
                        disabled={reelPublishProgress !== null && reelPublishProgress < 100}
                        className="rounded-full bg-[#1292FF] px-4 py-2 text-[11px] font-black uppercase tracking-[0.16em] text-white transition hover:bg-[#0c83e8] disabled:cursor-not-allowed disabled:opacity-70"
                      >
                        Publish Reel
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>

      <div className="border-b border-white/8 px-3 pb-3 sm:px-4 lg:px-5">
        <div className="flex items-center justify-between gap-3">
          {selectedPost ? (
            <button
              type="button"
              onClick={() => setSelectedPostIndex(null)}
              className="inline-flex items-center rounded-[10px] bg-white/[0.06] px-3 py-1.5 text-[11px] font-black text-white transition hover:bg-white/[0.1]"
            >
              Back
            </button>
          ) : activeTab === "activity" ? (
            <div>
              <p className="text-[13px] font-black tracking-[-0.03em] text-white">Activity</p>
              <p className="mt-1 text-[11px] text-slate-500">Track replies, likes, mentions, and follows.</p>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-2">
                {((isReelView || isFollowingView || isSavedView)
                  ? [
                      { label: "For You", href: `/${role}/feed`, isActive: false },
                      {
                        label: isReelView ? "Reels" : isFollowingView ? "Following" : "Saved",
                        href: isReelView
                          ? `/${role}/feed?view=reel`
                          : isFollowingView
                            ? `/${role}/feed?view=following`
                            : `/${role}/feed?view=saved`,
                        isActive: true,
                      },
                    ]
                  : [
                      { label: "For You", href: `/${role}/feed`, isActive: activeTab === "feed" },
                      { label: "Hype", href: `/${role}/feed?tab=hype`, isActive: activeTab === "hype" },
                    ]
                ).map((tab) => (
                  <Link
                    key={tab.label}
                    href={tab.href}
                    className={`rounded-[10px] px-3 py-2 text-[12px] font-bold tracking-[-0.02em] transition ${
                      tab.isActive
                        ? "bg-[#171717] text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]"
                        : "text-slate-400 hover:text-white"
                    }`}
                  >
                    {tab.label}
                  </Link>
                ))}
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleOpenComposer(isReelView ? "reel" : "feed")}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-[#1292FF] px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.15em] text-white shadow-[0_14px_30px_rgba(18,146,255,0.28)] transition hover:bg-[#0c83e8]"
                >
                  <Plus className="h-3 w-3" />
                  Post
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      <div className="px-3 pt-3 sm:px-4 lg:px-5">
        <div
          className={`mx-auto grid max-w-[1360px] gap-3 ${
            showFeedSidebar && !isReelView ? "xl:grid-cols-[minmax(0,1fr)_324px]" : "xl:grid-cols-[minmax(0,1fr)]"
          }`}
        >
          <div className="min-w-0 space-y-3">
            {selectedPost ? (
              <div className="mx-auto w-full max-w-[760px] space-y-4">
                <article className="border-b border-white/12 pb-5">
                  <div className="flex items-center gap-2">
                    <img
                      src={selectedPost.avatarSrc}
                      alt={selectedPost.author}
                      className="h-9 w-9 rounded-[10px] object-cover ring-1 ring-white/8"
                    />
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="truncate text-[12px] font-black text-white">{selectedPost.author}</p>
                        <span className="rounded-full border border-white/8 bg-white/5 px-2 py-0.5 text-[7px] font-black uppercase tracking-[0.16em] text-slate-400">
                          {selectedPost.role}
                        </span>
                        <span className="text-[9px] font-semibold text-slate-500">{selectedPost.time}</span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-3 space-y-3">
                    {"detailContent" in selectedPost && selectedPost.detailContent ? (
                      <div className="space-y-2">
                        {selectedPost.detailContent[0] !== selectedPost.content ? (
                          <p className="text-[13px] leading-6 text-slate-100">
                            {renderRichText(selectedPost.content, false)}
                          </p>
                        ) : null}
                        {selectedPost.detailContent.map((line) => (
                          <p key={line} className="text-[12px] leading-6 text-slate-300">
                            {renderRichText(line, false)}
                          </p>
                        ))}
                      </div>
                    ) : (
                      <p className="text-[13px] leading-6 text-slate-100">
                        {renderRichText(selectedPost.content, false)}
                      </p>
                    )}
                  </div>

                  {hasVideoSrc(selectedPost) ? (
                    <div className="mt-4 overflow-hidden rounded-[22px] border border-white/8 bg-white/[0.02]">
                      <ManagedVideo
                        src={selectedPost.videoSrc}
                        autoPlay
                        muted
                        loop
                        controls
                        controlsList="nofullscreen nodownload noplaybackrate"
                        disablePictureInPicture
                        playsInline
                        preload="metadata"
                        observeVisibility
                        className="h-auto w-full object-cover"
                      />
                    </div>
                  ) : null}

                  {hasImageSrc(selectedPost) ? (
                    erroredFeedImages[selectedPostMediaStateKey] ? (
                      <div className="mt-4 flex items-center gap-2 rounded-[22px] border border-white/8 bg-white/[0.02] px-4 py-3 text-[11px] font-semibold text-slate-500">
                        <ImageOff className="h-4 w-4" />
                        Media unavailable
                      </div>
                    ) : (
                      <div
                          className={`${
                          "detailImageWrapClassName" in selectedPost && selectedPost.detailImageWrapClassName
                            ? selectedPost.detailImageWrapClassName
                              : autoPortraitImages[selectedPostMediaStateKey]
                                ? "mt-4 flex items-center justify-center overflow-hidden rounded-[22px] border-transparent bg-transparent p-0"
                                : "mt-4 overflow-hidden rounded-[22px] border border-white/8 bg-white/[0.02]"
                        }`}
                      >
                        <img
                          src={selectedPost.imageSrc}
                          alt={`${selectedPost.author} detail post`}
                          onLoad={(event) => {
                            if ("detailImageClassName" in selectedPost && selectedPost.detailImageClassName) return;
                            const element = event.currentTarget;
                            const isPortrait = element.naturalHeight > element.naturalWidth * 1.08;
                            if (!isPortrait) return;
                            setAutoPortraitImages((current) =>
                              current[selectedPostMediaStateKey]
                                ? current
                                : { ...current, [selectedPostMediaStateKey]: true }
                            );
                          }}
                          onError={() => {
                            setErroredFeedImages((current) =>
                              current[selectedPostMediaStateKey]
                                ? current
                                : { ...current, [selectedPostMediaStateKey]: true }
                            );
                          }}
                          className={`${(() => {
                            if ("detailImageClassName" in selectedPost && selectedPost.detailImageClassName) {
                              return selectedPost.detailImageClassName;
                            }
                            return autoPortraitImages[selectedPostMediaStateKey]
                              ? "h-auto w-auto max-h-[70vh] max-w-[380px] rounded-[24px] object-contain"
                              : "h-auto w-full object-cover";
                          })()}`}
                        />
                      </div>
                    )
                  ) : null}

                  <div className="mt-4 flex items-center justify-between gap-3 border-b border-white/8 pb-3 text-slate-500">
                    <div className="flex items-center gap-4">
                      <button
                        type="button"
                        onClick={() => handleToggleLike(selectedPostIndexValue, selectedPost)}
                        className={`inline-flex items-center gap-1.5 text-[11px] font-bold transition ${
                          isPostLiked(selectedPost, selectedPostIndexValue) ? "text-rose-400" : "hover:text-white"
                        }`}
                      >
                        <Heart className={`h-3.5 w-3.5 ${isPostLiked(selectedPost, selectedPostIndexValue) ? "fill-current" : ""}`} />
                        {selectedPost.likes}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleToggleComment(selectedPostIndexValue)}
                        className="inline-flex items-center gap-1.5 text-[11px] font-bold hover:text-white"
                      >
                        <MessageCircle className="h-3.5 w-3.5" />
                        {selectedPost.comments + selectedPostSubmittedComments.length}
                      </button>
                    </div>
                    <Link
                      href={`/${role}/feed?tab=activity`}
                      className="text-[10px] font-semibold text-slate-500 transition hover:text-white"
                    >
                      View activity
                    </Link>
                  </div>

                  <AnimatePresence initial={false}>
                    {isSelectedPostCommentOpen ? (
                      <motion.div
                        initial={{ opacity: 0, height: 0, y: -6 }}
                        animate={{ opacity: 1, height: "auto", y: 0 }}
                        exit={{ opacity: 0, height: 0, y: -6 }}
                        transition={{ duration: 0.22, ease: "easeOut" }}
                        className="overflow-hidden"
                      >
                        <div className="mt-3 rounded-[18px] border border-white/8 bg-white/[0.03] p-3">
                          <div className="flex items-start gap-2.5">
                            {avatarUrl ? (
                              <img
                                src={avatarUrl}
                                alt="User profile"
                                className="h-8 w-8 rounded-[10px] object-cover"
                              />
                            ) : (
                              <div className="flex h-8 w-8 items-center justify-center rounded-[10px] bg-white/10 text-[10px] font-black text-slate-100">
                                {shareInitials}
                              </div>
                            )}
                            <div className="min-w-0 flex-1">
                              <textarea
                                value={commentDrafts[selectedPostIndexValue] || ""}
                                onChange={(event) => handleCommentDraftChange(selectedPostIndexValue, event.target.value)}
                                placeholder="Write a comment..."
                                rows={2}
                                className="w-full resize-none rounded-[14px] border border-white/8 bg-[#070707] px-3 py-2.5 text-[12px] leading-5 text-white outline-none placeholder:text-slate-500 focus:border-white/16"
                              />
                              <div className="mt-2 flex items-center justify-between gap-3">
                                <div className="flex items-center gap-1.5">
                                  {quickCommentEmojis.map((emoji) => (
                                    <button
                                      key={`detail-${selectedPostIndexValue}-${emoji}`}
                                      type="button"
                                      onClick={() => handleInsertEmoji(selectedPostIndexValue, emoji)}
                                      className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-white/8 bg-white/[0.03] text-[13px] transition hover:border-white/14 hover:bg-white/[0.06]"
                                    >
                                      {emoji}
                                    </button>
                                  ))}
                                </div>
                                <p className="text-[10px] font-semibold text-slate-500">Replying as {commenterName}</p>
                              </div>
                              <div className="mt-2 flex items-center justify-end">
                                <button
                                  type="button"
                                  onClick={() => handleSubmitComment(selectedPostIndexValue, selectedPost)}
                                  className="rounded-full bg-white px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.14em] text-black transition hover:bg-slate-200"
                                >
                                  Comment
                                </button>
                              </div>
                            </div>
                          </div>

                        </div>
                      </motion.div>
                    ) : null}
                  </AnimatePresence>

                  {selectedPostSubmittedComments.length ? (
                    <div className="mt-3 space-y-2 border-t border-white/8 pt-3">
                      {selectedPostSubmittedComments.map((comment, commentIndex) => (
                        <div key={`detail-comment-${commentIndex}`} className="flex items-start gap-2.5">
                          {avatarUrl ? (
                            <img src={avatarUrl} alt="User profile" className="h-7 w-7 rounded-[10px] object-cover" />
                          ) : (
                            <div className="flex h-7 w-7 items-center justify-center rounded-[10px] bg-white/10 text-[9px] font-black text-slate-100">
                              {shareInitials}
                            </div>
                          )}
                          <div className="min-w-0 flex-1 rounded-[14px] border border-white/8 bg-white/[0.02] px-3 py-2">
                            <div className="flex items-center gap-2">
                              <p className="text-[11px] font-bold text-white">{commenterName}</p>
                              <span className="text-[9px] font-semibold text-slate-500">Now</span>
                            </div>
                            <p className="mt-1 text-[11px] leading-5 text-slate-300">{comment}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : null}
                </article>
              </div>
            ) : (
              <>
            {activeTab === "activity" ? (
              <div className="mx-auto flex min-h-[calc(100vh-170px)] w-full max-w-[1180px] flex-col">
                <div className="border-b border-white/8 px-1 pb-2">
                  <div className="flex flex-wrap items-center gap-1.5">
                    {[
                      { label: "All", value: "all" },
                      { label: "Replies", value: "replies" },
                      { label: "Likes", value: "likes" },
                      { label: "Mentions", value: "mentions" },
                      { label: "Follow", value: "follow" },
                    ].map((filter) => (
                      <Link
                        key={filter.value}
                        href={`/${role}/feed?tab=activity${filter.value === "all" ? "" : `&activity=${filter.value}`}`}
                        className={`rounded-[8px] px-3 py-1.5 text-[11px] font-bold transition ${
                          activityFilter === filter.value
                            ? "bg-white/[0.08] text-white"
                            : "text-slate-500 hover:text-white"
                        }`}
                      >
                        {filter.label}
                      </Link>
                    ))}
                  </div>
                </div>

                {activityEntries.length ? (
                  <div className="mx-auto w-full max-w-[430px] pt-3">
                    {activityEntries.map((item, index) => {
                      const relatedPost = feedEntries.find((entry) => entry.index === item.postIndex)?.post;
                      const isIncomingFollow = isIncomingFollowActivity(item);
                      const actorProfileKey = item.actorProfileKey?.trim().toLowerCase() || "";
                      const isAlreadyFollowingActor =
                        Boolean(actorProfileKey) &&
                        followedProfileKeys.some((key) => key.trim().toLowerCase() === actorProfileKey);
                      const icon =
                        item.type === "like" ? (
                          <Heart className="h-3.5 w-3.5" />
                        ) : item.type === "reply" ? (
                          <MessageCircle className="h-3.5 w-3.5" />
                        ) : item.type === "follow" ? (
                          <UserPlus className="h-3.5 w-3.5" />
                        ) : (
                          <Sparkles className="h-3.5 w-3.5" />
                        );

                      return (
                        <div
                          key={item.id}
                          className={`flex w-full items-start gap-3 border-b border-white/8 py-3 text-left transition ${
                            index === activityEntries.length - 1 ? "border-b-white/0" : ""
                          }`}
                        >
                          <button
                            type="button"
                            onClick={() => {
                              if (item.href) {
                                try {
                                  const url = new URL(item.href, window.location.origin);
                                  if (
                                    !url.searchParams.get("avatarSrc") &&
                                    isShareableAvatarParam(item.actorAvatar)
                                  ) {
                                    url.searchParams.set("avatarSrc", item.actorAvatar.trim());
                                  }
                                  router.push(`${url.pathname}${url.search}`);
                                } catch {
                                  router.push(item.href);
                                }
                                return;
                              }

                              if (typeof item.postIndex === "number") {
                                setSelectedPostIndex(item.postIndex);
                              }
                            }}
                            className="flex min-w-0 flex-1 items-start gap-3 text-left"
                          >
                          <div
                            className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-[10px] ${
                              item.type === "like"
                                ? "bg-rose-500/12 text-rose-300"
                                : item.type === "reply"
                                  ? "bg-sky-500/12 text-sky-300"
                                  : item.type === "follow"
                                    ? "bg-violet-500/12 text-violet-300"
                                    : "bg-amber-500/12 text-amber-200"
                            }`}
                          >
                            {icon}
                          </div>
                          <img
                            src={item.actorAvatar || "/default-avatar-square.png"}
                            alt={item.actor}
                            className="mt-0.5 h-8 w-8 shrink-0 rounded-[10px] object-cover ring-1 ring-white/8"
                          />
                          <div className="min-w-0 flex-1">
                            <p className="text-[12px] font-semibold leading-5 text-slate-300">
                              <span className="font-black text-white">{item.actor}</span> {item.message}
                            </p>
                            <p className="mt-1 text-[11px] font-medium text-slate-500">{item.time}</p>
                            {relatedPost ? (
                              <p className="mt-1 truncate text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-600">
                                Related to {relatedPost.author}
                              </p>
                            ) : item.targetName && !isIncomingFollow ? (
                              <p className="mt-1 truncate text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-600">
                                {item.targetName}
                              </p>
                            ) : null}
                          </div>
                          </button>
                          {isIncomingFollow && actorProfileKey ? (
                            <button
                              type="button"
                              onClick={() => handleFollowBack(item)}
                              disabled={isAlreadyFollowingActor}
                              className={`mt-0.5 shrink-0 rounded-[8px] px-3 py-1.5 text-[11px] font-bold transition ${
                                isAlreadyFollowingActor
                                  ? "cursor-default bg-white/[0.04] text-slate-500"
                                  : "bg-sky-500 text-white hover:bg-sky-400"
                              }`}
                            >
                              {isAlreadyFollowingActor ? "Following" : "Follow Back"}
                            </button>
                          ) : null}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="flex flex-1 items-center justify-center px-4">
                    <div className="text-center">
                      <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-full border border-white/8 bg-white/[0.03] text-slate-400">
                        <Sparkles className="h-4 w-4" />
                      </div>
                      <p className="mt-4 text-[15px] font-black tracking-[-0.03em] text-white">No Activity</p>
                      <p className="mt-2 max-w-[240px] text-[12px] leading-5 text-slate-500">
                        Your likes, replies, mentions, and follows will show up here.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            ) : isReelView ? (
              <div
                onWheel={handleReelWheel}
                onTouchStart={handleReelTouchStart}
                onTouchEnd={handleReelTouchEnd}
                className="mx-auto flex min-h-[calc(100vh-170px)] w-full max-w-[980px] items-center justify-center px-2 pb-8"
              >
                {activeReel ? (
                  <div className="flex w-full items-center justify-center gap-4 lg:gap-6">
                    <AnimatePresence mode="wait" initial={false}>
                      <motion.article
                        key={`${activeReel.author}-${activeReelIndex}`}
                        initial={{ opacity: 0, y: activeReelDirection === 1 ? 72 : -72 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: activeReelDirection === 1 ? -72 : 72 }}
                        transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                        className="w-full max-w-[430px]"
                      >
                        <div className="overflow-hidden rounded-[30px] border border-white/8 bg-[#070707] shadow-[0_24px_60px_rgba(0,0,0,0.34)]">
                          <div className="relative aspect-[9/16] w-full bg-black">
                            <video
                              ref={activeReelVideoRef}
                              key={activeReel.videoSrc}
                              src={activeReel.videoSrc}
                              autoPlay
                              loop
                              playsInline
                              controls
                              controlsList="nofullscreen nodownload noplaybackrate"
                              disablePictureInPicture
                              preload="metadata"
                              className={`h-full w-full bg-black ${
                                activeReelIsLandscape ? "object-contain" : "object-cover"
                              }`}
                            />
                            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent" />
                            <div className="absolute bottom-5 right-3 z-[2] flex flex-col items-center gap-4">
                            <motion.button
                              type="button"
                              whileTap={{ scale: 0.92 }}
                              onClick={() => handleToggleReelLike(activeReelIndex)}
                              className={`flex flex-col items-center gap-1 transition ${
                                isActiveReelLiked ? "text-rose-400" : "text-white hover:opacity-90"
                              }`}
                            >
                              <motion.span
                                initial={false}
                                animate={
                                  isActiveReelLiked
                                    ? { scale: [1, 1.18, 1], rotate: [0, -10, 8, 0] }
                                    : { scale: 1, rotate: 0 }
                                }
                                transition={{ duration: 0.26, ease: "easeOut" }}
                                className="flex h-11 w-11 items-center justify-center"
                              >
                                <Heart className={`h-6 w-6 ${isActiveReelLiked ? "fill-current" : ""}`} />
                              </motion.span>
                              <motion.span
                                key={`reel-like-${activeReelIndex}-${isActiveReelLiked ? "on" : "off"}`}
                                initial={{ opacity: 0.5, y: 4 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.18, ease: "easeOut" }}
                                className="text-[11px] font-medium"
                              >
                                {isActiveReelLiked
                                  ? activeReel.likes === "Likes"
                                    ? "Liked"
                                    : `${Number(activeReel.likes) + 1}`
                                  : activeReel.likes}
                              </motion.span>
                            </motion.button>
                            <motion.button
                              type="button"
                              whileTap={{ scale: 0.92 }}
                              onClick={() => handleTriggerReelComment(activeReelIndex)}
                              className={`flex flex-col items-center gap-1 transition ${
                                isActiveReelCommented ? "text-sky-400" : "text-white hover:opacity-90"
                              }`}
                            >
                              <motion.span
                                initial={false}
                                animate={
                                  isActiveReelCommented
                                    ? { scale: [1, 1.18, 1], y: [0, -2, 0] }
                                    : { scale: 1, y: 0 }
                                }
                                transition={{ duration: 0.24, ease: "easeOut" }}
                                className="flex h-11 w-11 items-center justify-center"
                              >
                                <MessageCircle className="h-6 w-6" />
                              </motion.span>
                              <motion.span
                                key={`reel-comment-${activeReelIndex}-${isActiveReelCommented ? "on" : "off"}`}
                                initial={{ opacity: 0.5, y: 4 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.18, ease: "easeOut" }}
                                className="text-[11px] font-medium"
                              >
                                {isActiveReelCommented
                                  ? activeReel.comments === "Likes"
                                    ? "Open"
                                    : `${Number(activeReel.comments) + 1}`
                                  : activeReel.comments}
                              </motion.span>
                            </motion.button>
                            <motion.button
                              type="button"
                              whileTap={{ scale: 0.92 }}
                              onClick={() => handleShareReel(activeReelIndex)}
                              className={`flex h-11 w-11 items-center justify-center transition ${
                                isActiveReelShared ? "text-sky-400" : "text-white hover:opacity-90"
                              }`}
                            >
                              <motion.span
                                initial={false}
                                animate={
                                  isActiveReelShared
                                    ? { scale: [1, 1.18, 1], x: [0, 2, 0] }
                                    : { scale: 1, x: 0 }
                                }
                                transition={{ duration: 0.22, ease: "easeOut" }}
                              >
                                <Send className="h-5 w-5" />
                              </motion.span>
                            </motion.button>
                            <motion.button
                              type="button"
                              whileTap={{ scale: 0.92 }}
                              onClick={() => handleToggleReelSave(activeReelIndex)}
                              className={`flex h-11 w-11 items-center justify-center transition ${
                                isActiveReelSaved ? "text-amber-300" : "text-white hover:opacity-90"
                              }`}
                            >
                              <motion.span
                                initial={false}
                                animate={
                                  isActiveReelSaved
                                    ? { scale: [1, 1.16, 1], y: [0, -2, 0] }
                                    : { scale: 1, y: 0 }
                                }
                                transition={{ duration: 0.22, ease: "easeOut" }}
                              >
                                <Bookmark className={`h-5 w-5 ${isActiveReelSaved ? "fill-current" : ""}`} />
                              </motion.span>
                            </motion.button>
                            <motion.button
                              type="button"
                              whileTap={{ scale: 0.92 }}
                              onClick={() => handleTriggerReelMore(activeReelIndex)}
                              className={`flex h-11 w-11 items-center justify-center transition ${
                                isActiveReelMoreOpen ? "text-white opacity-60" : "text-white hover:opacity-90"
                              }`}
                            >
                              <motion.span
                                initial={false}
                                animate={
                                  isActiveReelMoreOpen
                                    ? { rotate: [0, 90, 0], scale: [1, 1.08, 1] }
                                    : { rotate: 0, scale: 1 }
                                }
                                transition={{ duration: 0.26, ease: "easeOut" }}
                              >
                                <Ellipsis className="h-5 w-5" />
                              </motion.span>
                            </motion.button>
                            </div>
                          </div>
                        </div>
                        <div className="mt-3 flex items-start justify-between gap-3 px-1">
                          <div className="flex min-w-0 items-start gap-2.5">
                            <img
                              src={activeReel.avatarSrc}
                              alt={activeReel.author}
                              className="h-10 w-10 rounded-[12px] object-cover ring-1 ring-white/8"
                            />
                            <div className="min-w-0">
                              <p className="truncate text-[12px] font-black text-white">{activeReel.author}</p>
                              <p className="mt-0.5 truncate text-[10px] font-semibold text-slate-400">
                                {activeReel.handle} . {activeReel.role} . {activeReel.time}
                              </p>
                              <p className="mt-1 line-clamp-2 text-[10px] leading-4 text-slate-500">
                                {activeReel.bio}
                              </p>
                            </div>
                          </div>
                        </div>
                      </motion.article>
                    </AnimatePresence>

                    <div className="flex shrink-0 flex-col items-center gap-3">
                      <button
                        type="button"
                        onClick={() => handleChangeReel(-1)}
                        disabled={isFirstReel}
                        className={`flex h-11 w-11 items-center justify-center rounded-full border transition ${
                          isFirstReel
                            ? "cursor-not-allowed border-white/6 bg-white/[0.03] text-slate-700"
                            : "border-white/10 bg-white/[0.05] text-white hover:border-white/16 hover:bg-white/[0.09]"
                        }`}
                      >
                        <ChevronUp className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleChangeReel(1)}
                        disabled={isLastReel}
                        className={`flex h-11 w-11 items-center justify-center rounded-full border transition ${
                          isLastReel
                            ? "cursor-not-allowed border-white/6 bg-white/[0.03] text-slate-700"
                            : "border-white/10 bg-white/[0.05] text-white hover:border-white/16 hover:bg-white/[0.09]"
                        }`}
                      >
                        <ChevronDown className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="w-full max-w-[430px] p-4 text-center">
                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full border border-white/8 bg-white/[0.03] text-slate-400">
                      <Clapperboard className="h-5 w-5" />
                    </div>
                    <p className="mt-4 text-[16px] font-black tracking-[-0.03em] text-white">No reels yet</p>
                    <p className="mt-2 text-[12px] leading-5 text-slate-400">
                      Upload your first reel to see it here and start reaching the right audience.
                    </p>
                  </div>
                )}
              </div>
            ) : activeTab === "hype" ? (
              <div className="mx-auto w-full max-w-[1280px]">
                <div className="mb-4 flex items-center justify-between gap-4 px-1">
                  <div>
                    <div className="inline-flex items-center gap-2 rounded-full border border-orange-400/20 bg-orange-500/10 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-orange-200">
                      <Flame className="h-3.5 w-3.5" />
                      Hype
                    </div>
                    <h2 className="mt-3 text-[26px] font-black tracking-[-0.05em] text-white">Viral Visuals</h2>
                    <p className="mt-1 text-[12px] leading-5 text-slate-400">
                      Images the Alpha Freight network is reacting to most.
                    </p>
                  </div>
                </div>
                {hypeMediaEntries.length ? (
                  <div className="columns-1 gap-4 md:columns-2 2xl:columns-3">
                    {hypeMediaEntries.map(({ post, index }, entryIndex) => (
                      <motion.button
                        key={`hype-media-${post.author}-${index}`}
                        type="button"
                        whileHover={{ y: -4 }}
                        onClick={() => setSelectedPostIndex(index)}
                        className={`group mb-4 block w-full break-inside-avoid overflow-hidden text-left transition focus:outline-none ${
                          "hypeUnboxed" in post && post.hypeUnboxed
                            ? "rounded-[28px] border-transparent bg-transparent shadow-none"
                            : "rounded-[28px] border border-white/8 bg-[#070707] shadow-[0_22px_60px_rgba(0,0,0,0.28)]"
                        } ${
                          entryIndex === 0 ? "xl:rounded-[32px]" : ""
                        }`}
                      >
                        <div
                          className={`relative ${
                            "hypeUnboxed" in post && post.hypeUnboxed ? "mx-auto w-fit" : ""
                          } ${
                            "imageWrapClassName" in post && post.imageWrapClassName
                              ? post.imageWrapClassName
                              : ""
                          }`}
                        >
                          {hasVideoSrc(post) ? (
                            <ManagedVideo
                              src={post.videoSrc}
                              autoPlay
                              muted
                              loop
                              playsInline
                              preload="metadata"
                              observeVisibility
                              className="h-auto w-full object-cover"
                            />
                          ) : hasImageSrc(post) ? (
                            <img
                              src={post.imageSrc}
                              alt={`${post.author} hype post`}
                              className={`${
                                "imageClassName" in post && post.imageClassName
                                  ? post.imageClassName
                                  : "h-auto w-full object-cover"
                              }`}
                            />
                          ) : null}
                          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-28 translate-y-3 bg-gradient-to-t from-black/80 via-black/18 to-transparent opacity-0 transition-all duration-300 ease-out group-hover:translate-y-0 group-hover:opacity-100 group-focus-visible:translate-y-0 group-focus-visible:opacity-100 group-active:translate-y-0 group-active:opacity-100" />
                          <div className="absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-full border border-orange-400/20 bg-black/35 px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.16em] text-orange-200 backdrop-blur-xl">
                            <Flame className="h-3 w-3" />
                            Viral
                          </div>
                          <div className="absolute inset-x-0 bottom-0 translate-y-4 px-3 pb-3 pt-10 opacity-0 transition-all duration-300 ease-out group-hover:translate-y-0 group-hover:opacity-100 group-focus-visible:translate-y-0 group-focus-visible:opacity-100 group-active:translate-y-0 group-active:opacity-100">
                            <div className="min-w-0">
                              <p className="truncate text-[13px] font-black text-white">{post.author}</p>
                              <p className="mt-1 line-clamp-2 text-[11px] leading-5 text-slate-200">
                                {post.content}
                              </p>
                              <div className="mt-3 flex items-center gap-3 text-[10px] font-semibold text-slate-200">
                                <div className="inline-flex items-center gap-1.5">
                                  <Heart className="h-3.5 w-3.5" />
                                  <span>{post.likes}</span>
                                </div>
                                <div className="inline-flex items-center gap-1.5">
                                  <MessageCircle className="h-3.5 w-3.5" />
                                  <span>{post.comments}</span>
                                </div>
                              </div>
                            </div>
                            {reelPublishProgress !== null ? (
                              <div className="mt-4 space-y-2 rounded-[16px] border border-white/8 bg-white/[0.03] px-3 py-2">
                                <div className="flex items-center justify-between gap-3 text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">
                                  <span>Saving Media</span>
                                  <span className="text-white">{reelPublishProgress}%</span>
                                </div>
                                <div className="h-1.5 overflow-hidden rounded-full bg-white/8">
                                  <div
                                    className="h-full rounded-full bg-[#1292FF] transition-all duration-300"
                                    style={{ width: `${reelPublishProgress}%` }}
                                  />
                                </div>
                              </div>
                            ) : null}
                            {reelPublishError ? (
                              <p className="mt-3 text-[11px] font-semibold text-rose-400">{reelPublishError}</p>
                            ) : null}
                          </div>
                        </div>
                      </motion.button>
                    ))}
                  </div>
                ) : (
                  <div className="flex min-h-[calc(100vh-280px)] items-center justify-center px-4">
                    <div className="w-full max-w-[430px] p-4 text-center">
                      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full border border-white/8 bg-white/[0.03] text-slate-400">
                        <Flame className="h-5 w-5" />
                      </div>
                      <p className="mt-4 text-[16px] font-black tracking-[-0.03em] text-white">No hype yet</p>
                      <p className="mt-2 text-[12px] leading-5 text-slate-400">
                        High-performing posts and videos will appear here once the network starts reacting.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <>
                <div className="mx-auto w-full max-w-[720px]">
                <button
                  type="button"
                  onClick={() => handleOpenComposer("feed")}
                  className="inline-flex items-center gap-2.5 px-2 py-1.5 text-left text-slate-500"
                >
                    {avatarUrl ? (
                      <img
                        src={avatarUrl}
                        alt="User profile"
                        className="h-8 w-8 rounded-[10px] object-cover"
                      />
                    ) : (
                      <div className="flex h-8 w-8 items-center justify-center rounded-[10px] bg-white/10 text-[11px] font-black text-slate-100">
                        {shareInitials}
                      </div>
                    )}
                    <span className="text-[13px] font-semibold tracking-[-0.02em] text-slate-500">Share something...</span>
                  </button>
                </div>
                <div className="mx-auto h-px w-full max-w-[720px] bg-white/14" />

          <div className="mx-auto w-full max-w-[720px] space-y-2.5">
            {feedLikeEntries.length ? feedLikeEntries.map(({ post, index }, listIndex) => {
              const displayedLikes = post.likes;
              const postIsLiked = isPostLiked(post, index);
              const postComments = submittedComments[index] || [];
              const displayedComments = post.comments + postComments.length;
              const isCommentOpen = Boolean(openCommentPosts[index]);
              const postContent = post.content || "";
              const shouldShowReadMore =
                postContent.length > 260 || postContent.split("\n").filter(Boolean).length > 4;
              const contentClampStyle = shouldShowReadMore
                ? ({
                    display: "-webkit-box",
                    WebkitLineClamp: 4,
                    WebkitBoxOrient: "vertical",
                    overflow: "hidden",
                  } as const)
                : undefined;
              const mediaStateKey = getFeedMediaStateKey(post, index);

              return (
                <article
                  key={`${post.author}-${index}`}
                  className={`pb-4 ${listIndex !== feedLikeEntries.length - 1 ? "border-b border-white/12" : ""}`}
                >
                  <button
                    type="button"
                    onClick={() => setSelectedPostIndex(index)}
                    className="block w-full text-left"
                  >
                    <div className="flex items-center gap-2">
                      <img
                        src={post.avatarSrc}
                        alt={post.author}
                        className="h-9 w-9 rounded-[10px] object-cover ring-1 ring-white/8"
                      />
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="truncate text-[12px] font-black text-white">{post.author}</p>
                          <span className="rounded-full border border-white/8 bg-white/5 px-2 py-0.5 text-[7px] font-black uppercase tracking-[0.16em] text-slate-400">
                            {post.role}
                          </span>
                        </div>
                        <p className="text-[9px] font-semibold text-slate-500">{post.time}</p>
                      </div>
                    </div>

                    <div className="mt-2.5 text-[12px] leading-5 text-slate-200">
                      <div style={contentClampStyle}>{renderRichText(post.content, true)}</div>
                      {shouldShowReadMore ? (
                        <span className="mt-1 inline-flex text-[11px] font-bold text-sky-400 transition hover:text-sky-300">
                          Read more
                        </span>
                      ) : null}
                    </div>

                    {hasVideoSrc(post) ? (
                      <div className="mt-3 overflow-hidden rounded-[20px] border border-white/8 transition hover:border-white/14">
                        <ManagedVideo
                          src={post.videoSrc}
                          autoPlay
                          muted
                          loop
                          controls
                          controlsList="nofullscreen nodownload noplaybackrate"
                          disablePictureInPicture
                          playsInline
                          preload="metadata"
                          observeVisibility
                          className="h-auto w-full object-cover"
                        />
                      </div>
                    ) : null}

                    {hasImageSrc(post) ? (
                      erroredFeedImages[mediaStateKey] ? (
                        <div className="mt-3 flex items-center gap-2 rounded-[20px] border border-white/8 bg-white/[0.02] px-4 py-3 text-[11px] font-semibold text-slate-500">
                          <ImageOff className="h-4 w-4" />
                          Media unavailable
                        </div>
                      ) : (
                        <div
                          className={`${
                            "imageWrapClassName" in post && post.imageWrapClassName
                              ? post.imageWrapClassName
                              : autoPortraitImages[mediaStateKey]
                                ? "mt-3 flex items-center justify-center overflow-hidden rounded-[20px] border-transparent bg-transparent p-0"
                                : "mt-3 overflow-hidden rounded-[20px] border border-white/8 transition hover:border-white/14"
                          }`}
                        >
                          <img
                            src={post.imageSrc}
                            alt={`${post.author} post`}
                            onLoad={(event) => {
                              if ("imageClassName" in post && post.imageClassName) return;
                              const element = event.currentTarget;
                              const isPortrait = element.naturalHeight > element.naturalWidth * 1.08;
                              if (!isPortrait) return;
                              setAutoPortraitImages((current) =>
                                current[mediaStateKey] ? current : { ...current, [mediaStateKey]: true }
                              );
                            }}
                            onError={() => {
                              setErroredFeedImages((current) =>
                                current[mediaStateKey] ? current : { ...current, [mediaStateKey]: true }
                              );
                            }}
                            className={`${(() => {
                              if ("imageClassName" in post && post.imageClassName) {
                                return post.imageClassName;
                              }
                              return autoPortraitImages[mediaStateKey]
                                ? "h-auto w-auto max-h-[460px] max-w-[320px] rounded-[22px] object-contain"
                                : "h-auto w-full object-cover";
                            })()}`}
                          />
                        </div>
                      )
                    ) : null}
                  </button>

                  <div className="mt-3 flex items-center gap-4 text-slate-500">
                    <motion.button
                      type="button"
                      whileTap={{ scale: 0.94 }}
                      onClick={() => handleToggleLike(index, post)}
                      className={`inline-flex items-center gap-1.5 text-[11px] font-bold transition ${
                        postIsLiked ? "text-rose-400" : "hover:text-white"
                      }`}
                    >
                      <motion.span
                        key={`heart-${index}-${postIsLiked ? "liked" : "idle"}`}
                        initial={false}
                        animate={
                          postIsLiked
                            ? { scale: [1, 1.28, 1], rotate: [0, -10, 10, 0] }
                            : { scale: 1, rotate: 0 }
                        }
                        transition={{ duration: 0.34, ease: "easeOut" }}
                        className="inline-flex"
                      >
                        <Heart
                          className={`h-3.5 w-3.5 ${
                            postIsLiked ? "fill-current" : ""
                          }`}
                        />
                      </motion.span>
                      <AnimatePresence mode="wait" initial={false}>
                        <motion.span
                          key={`like-count-${index}-${displayedLikes}`}
                          initial={{ opacity: 0, y: 6, scale: 0.9 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: -6, scale: 0.9 }}
                          transition={{ duration: 0.2, ease: "easeOut" }}
                        >
                          {displayedLikes}
                        </motion.span>
                      </AnimatePresence>
                    </motion.button>
                    <motion.button
                      type="button"
                      whileTap={{ scale: 0.94 }}
                      onClick={() => handleToggleComment(index)}
                      className={`inline-flex items-center gap-1.5 text-[11px] font-bold transition ${
                        isCommentOpen ? "text-sky-400" : "hover:text-white"
                      }`}
                    >
                      <motion.span
                        key={`comment-${index}-${isCommentOpen ? "active" : "idle"}`}
                        initial={false}
                        animate={
                          isCommentOpen
                            ? { scale: [1, 1.22, 1], y: [0, -1, 0] }
                            : { scale: 1, y: 0 }
                        }
                        transition={{ duration: 0.28, ease: "easeOut" }}
                        className="inline-flex"
                      >
                        <MessageCircle
                          className={`h-3.5 w-3.5 ${
                            isCommentOpen ? "fill-current/20" : ""
                          }`}
                        />
                      </motion.span>
                      <AnimatePresence mode="wait" initial={false}>
                        <motion.span
                          key={`comment-count-${index}-${displayedComments}`}
                          initial={{ opacity: 0, y: 6, scale: 0.9 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: -6, scale: 0.9 }}
                          transition={{ duration: 0.2, ease: "easeOut" }}
                        >
                          {displayedComments}
                        </motion.span>
                      </AnimatePresence>
                    </motion.button>
                    <motion.button
                      type="button"
                      whileTap={{ scale: 0.94 }}
                      onClick={() => handleSharePost(index)}
                      className={`inline-flex items-center gap-1.5 text-[11px] font-bold transition ${
                        sharedPosts[index] ? "text-sky-400" : "hover:text-white"
                      }`}
                    >
                      <Repeat2 className="h-3.5 w-3.5" />
                      <AnimatePresence mode="wait" initial={false}>
                        <motion.span
                          key={`share-label-${index}-${sharedPosts[index] ? "active" : "idle"}`}
                          initial={{ opacity: 0, y: 6, scale: 0.92 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: -6, scale: 0.92 }}
                          transition={{ duration: 0.18, ease: "easeOut" }}
                        >
                          {sharedPosts[index] ? "Shared" : "Share"}
                        </motion.span>
                      </AnimatePresence>
                    </motion.button>
                    <motion.button
                      type="button"
                      whileTap={{ scale: 0.94 }}
                      onClick={() => handleToggleSavePost(index)}
                      className={`inline-flex items-center gap-1.5 text-[11px] font-bold transition ${
                        savedPostStates[index] ? "text-amber-300" : "hover:text-white"
                      }`}
                    >
                      <motion.span
                        key={`save-icon-${index}-${savedPostStates[index] ? "saved" : "idle"}`}
                        initial={false}
                        animate={
                          savedPostStates[index]
                            ? { scale: [1, 1.16, 1], y: [0, -1, 0] }
                            : { scale: 1, y: 0 }
                        }
                        transition={{ duration: 0.22, ease: "easeOut" }}
                        className="inline-flex"
                      >
                        <Bookmark className={`h-3.5 w-3.5 ${savedPostStates[index] ? "fill-current" : ""}`} />
                      </motion.span>
                      <AnimatePresence mode="wait" initial={false}>
                        <motion.span
                          key={`save-label-${index}-${savedPostStates[index] ? "saved" : "idle"}`}
                          initial={{ opacity: 0, y: 6, scale: 0.92 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: -6, scale: 0.92 }}
                          transition={{ duration: 0.18, ease: "easeOut" }}
                        >
                          {savedPostStates[index] ? "Saved" : "Save"}
                        </motion.span>
                      </AnimatePresence>
                    </motion.button>
                  </div>

                  <AnimatePresence initial={false}>
                    {isCommentOpen ? (
                      <motion.div
                        initial={{ opacity: 0, height: 0, y: -6 }}
                        animate={{ opacity: 1, height: "auto", y: 0 }}
                        exit={{ opacity: 0, height: 0, y: -6 }}
                        transition={{ duration: 0.22, ease: "easeOut" }}
                        className="overflow-hidden"
                      >
                        <div className="mt-3 rounded-[18px] border border-white/8 bg-white/[0.03] p-3">
                          <div className="flex items-start gap-2.5">
                            {avatarUrl ? (
                              <img
                                src={avatarUrl}
                                alt="User profile"
                                className="h-8 w-8 rounded-full object-cover"
                              />
                            ) : (
                              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-[10px] font-black text-slate-100">
                                {shareInitials}
                              </div>
                            )}
                            <div className="min-w-0 flex-1">
                              <textarea
                                value={commentDrafts[index] || ""}
                                onChange={(event) => handleCommentDraftChange(index, event.target.value)}
                                placeholder="Write a comment..."
                                rows={2}
                                className="w-full resize-none rounded-[14px] border border-white/8 bg-[#070707] px-3 py-2.5 text-[12px] leading-5 text-white outline-none placeholder:text-slate-500 focus:border-white/16"
                              />
                              <div className="mt-2 flex items-center justify-between gap-3">
                                <div className="flex items-center gap-1.5">
                                  {quickCommentEmojis.map((emoji) => (
                                    <button
                                      key={`${index}-${emoji}`}
                                      type="button"
                                      onClick={() => handleInsertEmoji(index, emoji)}
                                      className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-white/8 bg-white/[0.03] text-[13px] transition hover:border-white/14 hover:bg-white/[0.06]"
                                    >
                                      {emoji}
                                    </button>
                                  ))}
                                </div>
                                <p className="text-[10px] font-semibold text-slate-500">
                                  Replying as {commenterName}
                                </p>
                              </div>
                              <div className="mt-2 flex items-center justify-end">
                                <button
                                  type="button"
                                  onClick={() => handleSubmitComment(index, post)}
                                  className="rounded-full bg-white px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.14em] text-black transition hover:bg-slate-200"
                                >
                                  Comment
                                </button>
                              </div>
                            </div>
                          </div>

                          {postComments.length ? (
                            <div className="mt-3 space-y-2 border-t border-white/8 pt-3">
                              {postComments.map((comment, commentIndex) => (
                                <div
                                  key={`${index}-comment-${commentIndex}`}
                                  className="flex items-start gap-2.5"
                                >
                                  {avatarUrl ? (
                                    <img
                                      src={avatarUrl}
                                      alt="User profile"
                                      className="h-7 w-7 rounded-full object-cover"
                                    />
                                  ) : (
                                    <div className="flex h-7 w-7 items-center justify-center rounded-full bg-white/10 text-[9px] font-black text-slate-100">
                                      {shareInitials}
                                    </div>
                                  )}
                                  <div className="min-w-0 flex-1 rounded-[14px] border border-white/8 bg-white/[0.02] px-3 py-2">
                                    <div className="flex items-center gap-2">
                                      <p className="text-[11px] font-bold text-white">{commenterName}</p>
                                      <span className="text-[9px] font-semibold text-slate-500">Now</span>
                                    </div>
                                    <p className="mt-1 text-[11px] leading-5 text-slate-300">{comment}</p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : null}
                        </div>
                      </motion.div>
                    ) : null}
                  </AnimatePresence>
                </article>
              );
              }) : (
                <div className="flex min-h-[calc(100vh-320px)] items-center justify-center px-4 py-6">
                  <div className="w-full max-w-[430px] p-4 text-center">
                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full border border-white/8 bg-white/[0.03] text-slate-400">
                      {feedEmptyState.icon}
                    </div>
                    <p className="mt-4 text-[16px] font-black tracking-[-0.03em] text-white">{feedEmptyState.title}</p>
                    <p className="mt-2 text-[12px] leading-5 text-slate-400">{feedEmptyState.copy}</p>
                  </div>
                </div>
              )}
          </div>
              </>
            )}
              </>
            )}
        </div>

          {!showFeedSidebar ? null : (
            <aside className="space-y-4">
              <div className="xl:-ml-14 rounded-[22px] border border-white/8 bg-[#111111] px-3.5 py-3.5 shadow-[0_22px_60px_rgba(0,0,0,0.34)]">
                <h3 className="text-[11px] font-black tracking-[-0.02em] text-white">Welcome back</h3>
                <p className="mt-1.5 text-[12px] leading-5 text-slate-300">
                  Your live network, recent activity, and profile content stay synced here.
                </p>
                <p className="mt-1 text-[12px] font-bold leading-5 text-white">
                  {customFeedPosts.length} posts . {customReelPosts.length} reels . {savedEntries.length} saved
                </p>
                <div className="mt-3 flex gap-2">
                  <button
                    type="button"
                    onClick={() => handleOpenComposer("feed")}
                    className="flex-1 rounded-[10px] bg-[#1292FF] px-3 py-2 text-[10px] font-black text-white transition hover:bg-[#0f85ea]"
                  >
                    Create Post
                  </button>
                  <Link
                    href={`/${role}/feed/profile`}
                    className="flex-1 rounded-[10px] bg-white/[0.08] px-3 py-2 text-center text-[10px] font-black text-white transition hover:bg-white/[0.12]"
                  >
                    Open Profile
                  </Link>
                </div>
              </div>

              {!selectedPost ? (
                <div className="xl:-ml-14 overflow-hidden rounded-[24px] border border-white/8 bg-[#101010] shadow-[0_24px_70px_rgba(0,0,0,0.34)]">
                  <div className="relative">
                    <video
                      ref={spotlightVideoRef}
                      autoPlay
                      muted
                      loop
                      playsInline
                      preload="metadata"
                      className="aspect-[1.18/1] w-full object-cover"
                    >
                      <source src={spotlightMedia.videoSrc} type="video/mp4" />
                    </video>
                    <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/10 via-transparent to-black/18" />
                  </div>
                  <div className="px-4 pb-4 pt-3">
                    <h3 className="text-[13px] font-black tracking-[-0.02em] text-white">
                      {spotlightMedia.title}
                    </h3>
                    <p className="mt-1 text-[12px] leading-5 text-slate-300">
                      {spotlightMedia.description}
                    </p>
                  </div>
                </div>
              ) : null}

              <div className="xl:-ml-14 rounded-[24px] border border-white/8 bg-[#111111] px-3.5 py-3.5 shadow-[0_22px_60px_rgba(0,0,0,0.34)]">
                <div className="flex items-center gap-2">
                  <UserPlus className="h-3.5 w-3.5 text-white" />
                  <p className="text-[11px] font-black tracking-[-0.02em] text-white">Suggested for you</p>
                </div>
                <div className="mt-3 space-y-2.5">
                  {networkProfiles.length ? networkProfiles.map((profile) => (
                    <div key={profile.handle} className="flex items-center justify-between gap-3">
                      <div className="flex min-w-0 items-center gap-2.5">
                        <img
                          src={profile.avatarSrc}
                          alt={profile.name}
                          className="h-10 w-10 rounded-[10px] object-cover object-center ring-1 ring-white/8"
                        />
                        <div className="min-w-0">
                          <p className="truncate text-[12px] font-black leading-4 text-white">{profile.name}</p>
                          <p className="truncate text-[11px] leading-4 text-slate-500">{profile.handle}</p>
                        </div>
                      </div>
                      <span className="rounded-[10px] bg-white/[0.08] px-3 py-2 text-[10px] font-black text-white">
                        Live
                      </span>
                    </div>
                  )) : (
                    <div className="rounded-[16px] border border-white/8 bg-white/[0.03] px-3 py-3 text-[11px] leading-5 text-slate-400">
                      Real network profiles will appear here once live posts or reels are available.
                    </div>
                  )}
                </div>
              </div>
            </aside>
          )}
        </div>
      </div>
    </div>
  );
}
