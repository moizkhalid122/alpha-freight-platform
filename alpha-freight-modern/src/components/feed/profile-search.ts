"use client";

import { readCarrierExtras, readSupplierExtras } from "@/lib/profile-extras";
import { readProfileFollowerKeys } from "./feed-storage";

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

export type NetworkProfileRecord = {
  identityKey: string;
  profileId?: string;
  author: string;
  handle: string;
  role: string;
  avatarSrc: string;
  bannerSrc?: string;
  bio: string;
  ownerEmail?: string;
  posts: number;
  reels: number;
  views: number;
  followers: number;
  likes: number;
  comments: number;
  engagement: number;
};

const parseMetricNumber = (value: string | number | undefined) => {
  if (typeof value === "number") return value;

  const parsedValue = Number.parseInt(value || "0", 10);
  return Number.isNaN(parsedValue) ? 0 : parsedValue;
};

const normalizeValue = (value?: string | null) => (value || "").trim().toLowerCase();

export type DirectoryProfileRecord = {
  id: string;
  full_name?: string | null;
  company_name?: string | null;
  role?: string | null;
  avatar_url?: string | null;
  banner_url?: string | null;
  email?: string | null;
};

export type LocalDirectoryProfile = {
  profileId: string;
  author: string;
  role: string;
  avatarSrc: string;
  bannerSrc?: string;
  bio: string;
  ownerEmail?: string;
};

export const isUsableAvatarSrc = (value?: string | null) => {
  const trimmed = value?.trim();
  if (!trimmed) return false;
  if (trimmed.startsWith("blob:")) return false;
  if (trimmed.includes("default-avatar")) return false;
  return true;
};

export const isShareableAvatarParam = (value?: string | null) => {
  const trimmed = value?.trim();
  if (!trimmed || !isUsableAvatarSrc(trimmed)) return false;
  if (trimmed.startsWith("data:") || trimmed.startsWith("blob:")) return false;
  if (trimmed.length > 512) return false;
  return trimmed.startsWith("http://") || trimmed.startsWith("https://");
};

export const isShareableImageParam = isShareableAvatarParam;

export const buildFeedProfileHref = (
  basePath: string,
  profile: {
    identityKey: string;
    profileId?: string;
    author: string;
    role?: string;
    avatarSrc?: string;
    bannerSrc?: string;
  }
) => {
  const params = new URLSearchParams({
    profile: profile.identityKey,
    profileId: profile.profileId || "",
    name: profile.author,
    roleLabel: profile.role || "",
    profileRole: profile.role || "",
  });

  if (isShareableAvatarParam(profile.avatarSrc)) {
    params.set("avatarSrc", profile.avatarSrc!.trim());
  }

  if (isShareableImageParam(profile.bannerSrc)) {
    params.set("bannerSrc", profile.bannerSrc!.trim());
  }

  return `${basePath}/profile?${params.toString()}`;
};

export const pickBestAvatarSrc = (...sources: Array<string | null | undefined>) => {
  for (const source of sources) {
    if (isUsableAvatarSrc(source)) {
      return source!.trim();
    }
  }

  for (const source of sources) {
    const trimmed = source?.trim();
    if (trimmed && !trimmed.startsWith("blob:")) {
      return trimmed;
    }
  }

  return "";
};

export const resolveLocalProfileAvatar = (profileId?: string, role?: string | null) => {
  if (!profileId?.trim()) return "";

  const normalizedRole = (role || "").trim().toLowerCase();
  const extras =
    normalizedRole === "supplier" ? readSupplierExtras(profileId) : readCarrierExtras(profileId);

  return pickBestAvatarSrc(
    extras.avatarUrl,
    "logoUrl" in extras ? extras.logoUrl : undefined
  );
};

export const resolveLocalProfileBanner = (profileId?: string, role?: string | null) => {
  if (!profileId?.trim()) return "";

  const normalizedRole = (role || "").trim().toLowerCase();
  const extras =
    normalizedRole === "supplier" ? readSupplierExtras(profileId) : readCarrierExtras(profileId);

  const bannerUrl = extras.bannerUrl?.trim();
  return isShareableImageParam(bannerUrl) ? bannerUrl : "";
};

export const readLocalDirectoryProfiles = (): LocalDirectoryProfile[] => {
  if (typeof window === "undefined") return [];

  const profiles: LocalDirectoryProfile[] = [];

  for (let index = 0; index < window.localStorage.length; index += 1) {
    const storageKey = window.localStorage.key(index);
    if (!storageKey) continue;

    if (storageKey.startsWith("carrier-profile-extras:")) {
      const profileId = storageKey.replace("carrier-profile-extras:", "").trim();
      if (!profileId) continue;

      const extras = readCarrierExtras(profileId);
      const author = extras.companyName?.trim() || extras.contactPerson?.trim() || "";
      if (!author) continue;

      profiles.push({
        profileId,
        author,
        role: "carrier",
        avatarSrc: pickBestAvatarSrc(extras.avatarUrl, extras.logoUrl),
        bannerSrc: isShareableImageParam(extras.bannerUrl) ? extras.bannerUrl!.trim() : "",
        bio: extras.description?.trim() || extras.operatingRegion?.toString().trim() || "",
        ownerEmail: extras.email?.trim() || "",
      });
      continue;
    }

    if (storageKey.startsWith("supplier-profile-extras:")) {
      const profileId = storageKey.replace("supplier-profile-extras:", "").trim();
      if (!profileId) continue;

      const extras = readSupplierExtras(profileId);
      const author = extras.companyName?.trim() || extras.contactPerson?.trim() || "";
      if (!author) continue;

      profiles.push({
        profileId,
        author,
        role: "supplier",
        avatarSrc: pickBestAvatarSrc(extras.avatarUrl),
        bannerSrc: isShareableImageParam(extras.bannerUrl) ? extras.bannerUrl!.trim() : "",
        bio: extras.industry?.trim() || extras.city?.trim() || "",
        ownerEmail: extras.email?.trim() || "",
      });
    }
  }

  return profiles;
};

export const findAvatarInFeedContent = (
  identityKey: string | undefined,
  profileId: string | undefined,
  feedPosts: SearchableFeedPost[],
  reelPosts: SearchableReelPost[],
  authorName?: string
) => {
  const normalizedIdentityKey = identityKey?.trim().toLowerCase();
  const normalizedAuthor = normalizeValue(authorName);

  for (const post of feedPosts) {
    const postIdentityKey = createProfileIdentityKey({
      ownerEmail: post.ownerEmail,
      author: post.author,
    });

    if (
      (normalizedIdentityKey && postIdentityKey === normalizedIdentityKey) ||
      (normalizedAuthor && normalizeValue(post.author) === normalizedAuthor)
    ) {
      const avatarSrc = pickBestAvatarSrc(post.avatarSrc);
      if (avatarSrc) return avatarSrc;
    }
  }

  for (const reel of reelPosts) {
    const reelIdentityKey = createProfileIdentityKey({
      ownerEmail: reel.ownerEmail,
      handle: reel.handle,
      author: reel.author,
    });

    if (
      (normalizedIdentityKey && reelIdentityKey === normalizedIdentityKey) ||
      (normalizedAuthor && normalizeValue(reel.author) === normalizedAuthor)
    ) {
      const avatarSrc = pickBestAvatarSrc(reel.avatarSrc);
      if (avatarSrc) return avatarSrc;
    }
  }

  return "";
};

export const mergeDirectoryProfilesIntoMap = (
  profileMap: Map<string, NetworkProfileRecord>,
  directoryProfiles: DirectoryProfileRecord[],
  localDirectoryProfiles: LocalDirectoryProfile[] = []
) => {
  directoryProfiles.forEach((profile) => {
    const displayName = profile.company_name?.trim() || profile.full_name?.trim() || "";
    if (!displayName) return;

    const normalizedRole = (profile.role || "").trim().toLowerCase();
    const extras =
      normalizedRole === "supplier" ? readSupplierExtras(profile.id) : readCarrierExtras(profile.id);
    const ownerEmail = extras.email?.trim() || profile.email?.trim() || "";
    const avatarSrc = pickBestAvatarSrc(
      extras.avatarUrl,
      "logoUrl" in extras ? extras.logoUrl : undefined,
      profile.avatar_url
    );
    const bannerSrc = isShareableImageParam(extras.bannerUrl)
      ? extras.bannerUrl!.trim()
      : isShareableImageParam(profile.banner_url)
        ? profile.banner_url!.trim()
        : "";
    const identityKey = createProfileIdentityKey({ ownerEmail, author: displayName });
    if (!identityKey) return;

    const existingProfile = profileMap.get(identityKey);
    if (existingProfile) {
      profileMap.set(identityKey, {
        ...existingProfile,
        profileId: existingProfile.profileId || profile.id,
        author: displayName || existingProfile.author,
        role: profile.role || existingProfile.role,
        avatarSrc: pickBestAvatarSrc(avatarSrc, existingProfile.avatarSrc),
        bannerSrc: bannerSrc || existingProfile.bannerSrc || "",
        ownerEmail: ownerEmail || existingProfile.ownerEmail,
        handle:
          existingProfile.handle ||
          (ownerEmail ? `@${ownerEmail.split("@")[0].replace(/\s+/g, "").toLowerCase()}` : ""),
      });
      return;
    }

    profileMap.set(identityKey, {
      identityKey,
      profileId: profile.id,
      author: displayName,
      handle: ownerEmail ? `@${ownerEmail.split("@")[0].replace(/\s+/g, "").toLowerCase()}` : "",
      role: profile.role || "",
      avatarSrc,
      bannerSrc,
      bio: "",
      ownerEmail,
      posts: 0,
      reels: 0,
      views: 0,
      followers: 0,
      likes: 0,
      comments: 0,
      engagement: 0,
    });
  });

  localDirectoryProfiles.forEach((profile) => {
    const identityKey = createProfileIdentityKey({
      ownerEmail: profile.ownerEmail,
      author: profile.author,
    });
    if (!identityKey) return;

    const existingProfile = profileMap.get(identityKey);
    if (existingProfile) {
      profileMap.set(identityKey, {
        ...existingProfile,
        profileId: existingProfile.profileId || profile.profileId,
        author: profile.author || existingProfile.author,
        role: profile.role || existingProfile.role,
        avatarSrc: pickBestAvatarSrc(profile.avatarSrc, existingProfile.avatarSrc),
        bannerSrc: profile.bannerSrc || existingProfile.bannerSrc || "",
        bio: profile.bio || existingProfile.bio,
        ownerEmail: profile.ownerEmail || existingProfile.ownerEmail,
      });
      return;
    }

    profileMap.set(identityKey, {
      identityKey,
      profileId: profile.profileId,
      author: profile.author,
      handle: profile.ownerEmail ? `@${profile.ownerEmail.split("@")[0].replace(/\s+/g, "").toLowerCase()}` : "",
      role: profile.role,
      avatarSrc: profile.avatarSrc,
      bannerSrc: profile.bannerSrc || "",
      bio: profile.bio,
      ownerEmail: profile.ownerEmail,
      posts: 0,
      reels: 0,
      views: 0,
      followers: 0,
      likes: 0,
      comments: 0,
      engagement: 0,
    });
  });

  return profileMap;
};

export const getProfileFollowerCount = (
  profile: Pick<NetworkProfileRecord, "identityKey" | "ownerEmail" | "author">
) => {
  const identityKeys = Array.from(
    new Set(
      [
        profile.identityKey,
        profile.ownerEmail?.trim().toLowerCase(),
        normalizeValue(profile.author).replace(/[^a-z0-9._-]+/g, "-"),
      ].filter((key): key is string => Boolean(key))
    )
  );

  const uniqueFollowers = new Set<string>();

  identityKeys.forEach((identityKey) => {
    readProfileFollowerKeys(identityKey).forEach((followerKey) => {
      uniqueFollowers.add(followerKey);
    });
  });

  return uniqueFollowers.size;
};

export const getPostIdentityKeys = (post: {
  ownerEmail?: string;
  author?: string;
  ownerIdentityKey?: string;
}) => {
  const author = post.author?.trim() || "";
  const ownerEmail = post.ownerEmail?.trim().toLowerCase() || "";
  const ownerIdentityKey = post.ownerIdentityKey?.trim().toLowerCase() || "";

  return Array.from(
    new Set(
      [
        createProfileIdentityKey({ ownerEmail, author }),
        ownerEmail,
        ownerIdentityKey,
        normalizeValue(author).replace(/[^a-z0-9._-]+/g, "-"),
      ].filter(Boolean)
    )
  );
};

export const doesPostMatchFollowedProfile = (
  post: {
    ownerEmail?: string;
    author?: string;
    ownerIdentityKey?: string;
  },
  followedProfileKeys: string[]
) => {
  if (!followedProfileKeys.length) return false;

  const postIdentityKeys = getPostIdentityKeys(post);
  const normalizedFollowedKeys = followedProfileKeys.map((key) => key.trim().toLowerCase()).filter(Boolean);

  return normalizedFollowedKeys.some((followedKey) =>
    postIdentityKeys.some((postKey) => postKey === followedKey)
  );
};

export const enrichNetworkProfilesWithFollowers = (profiles: NetworkProfileRecord[]) =>
  profiles.map((profile) => ({
    ...profile,
    followers: getProfileFollowerCount(profile),
  }));

export const sortNetworkProfiles = (profiles: NetworkProfileRecord[]) =>
  [...profiles].sort((left, right) => {
    if (right.engagement !== left.engagement) return right.engagement - left.engagement;
    if (right.views !== left.views) return right.views - left.views;
    return left.author.localeCompare(right.author);
  });

export const createProfileIdentityKey = ({
  ownerEmail,
  handle,
  author,
}: {
  ownerEmail?: string;
  handle?: string;
  author?: string;
}) => {
  const normalizedEmail = normalizeValue(ownerEmail);
  if (normalizedEmail) return normalizedEmail;

  const normalizedHandle = normalizeValue(handle).replace(/^@/, "");
  if (normalizedHandle) return normalizedHandle;

  return normalizeValue(author).replace(/[^a-z0-9._-]+/g, "-");
};

export const postMatchesProfileKey = (
  post: { ownerEmail?: string; ownerIdentityKey?: string; author?: string },
  profileKey: string
) => {
  const normalizedKey = profileKey.trim().toLowerCase();
  if (!normalizedKey) return false;

  const ownerKey = post.ownerIdentityKey?.trim().toLowerCase();
  if (ownerKey && ownerKey === normalizedKey) return true;

  const derivedKey = createProfileIdentityKey({
    ownerEmail: post.ownerEmail,
    author: post.author,
  });
  if (derivedKey === normalizedKey) return true;

  const ownerEmail = post.ownerEmail?.trim().toLowerCase();
  if (ownerEmail && ownerEmail === normalizedKey) return true;

  return false;
};

export const buildNetworkProfiles = (
  feedPosts: SearchableFeedPost[],
  reelPosts: SearchableReelPost[]
): NetworkProfileRecord[] => {
  const profileMap = new Map<string, NetworkProfileRecord>();

  const ensureProfile = ({
    identityKey,
    author,
    handle,
    role,
    avatarSrc,
    bio,
    ownerEmail,
  }: {
    identityKey: string;
    author: string;
    handle: string;
    role: string;
    avatarSrc: string;
    bio: string;
    ownerEmail?: string;
  }) => {
    const existing = profileMap.get(identityKey);
    if (existing) {
      profileMap.set(identityKey, {
        ...existing,
        author: existing.author || author,
        handle: existing.handle || handle,
        role: existing.role || role,
        avatarSrc: pickBestAvatarSrc(existing.avatarSrc, avatarSrc),
        bio: existing.bio || bio,
        ownerEmail: existing.ownerEmail || ownerEmail,
      });
      return profileMap.get(identityKey)!;
    }

    const nextValue: NetworkProfileRecord = {
      identityKey,
      author,
      handle,
      role,
      avatarSrc,
      bio,
      ownerEmail,
      posts: 0,
      reels: 0,
      views: 0,
      followers: 0,
      likes: 0,
      comments: 0,
      engagement: 0,
    };
    profileMap.set(identityKey, nextValue);
    return nextValue;
  };

  feedPosts.forEach((post) => {
    const identityKey = createProfileIdentityKey({
      ownerEmail: post.ownerEmail,
      author: post.author,
    });
    if (!identityKey) return;

    const profile = ensureProfile({
      identityKey,
      author: post.author,
      handle: post.ownerEmail ? `@${post.ownerEmail.split("@")[0].replace(/\s+/g, "").toLowerCase()}` : "",
      role: post.role,
      avatarSrc: post.avatarSrc,
      bio: post.content,
      ownerEmail: post.ownerEmail,
    });

    profile.posts += 1;
    profile.views += post.viewCount || 0;
    profile.likes += post.likes || 0;
    profile.comments += post.comments || 0;
    profile.engagement +=
      (post.likes || 0) + (post.comments || 0) + (post.shareCount || 0) + (post.saveCount || 0);
  });

  reelPosts.forEach((reel) => {
    const identityKey = createProfileIdentityKey({
      ownerEmail: reel.ownerEmail,
      handle: reel.handle,
      author: reel.author,
    });
    if (!identityKey) return;

    const profile = ensureProfile({
      identityKey,
      author: reel.author,
      handle: reel.handle,
      role: reel.role,
      avatarSrc: reel.avatarSrc,
      bio: reel.bio || reel.caption,
      ownerEmail: reel.ownerEmail,
    });

    profile.reels += 1;
    profile.views += reel.viewCount || 0;
    profile.likes += parseMetricNumber(reel.likes);
    profile.comments += parseMetricNumber(reel.comments);
    profile.engagement +=
      parseMetricNumber(reel.likes) +
      parseMetricNumber(reel.comments) +
      (reel.shareCount || 0) +
      (reel.saveCount || 0);
  });

  return [...profileMap.values()].sort((left, right) => {
    if (right.engagement !== left.engagement) return right.engagement - left.engagement;
    if (right.views !== left.views) return right.views - left.views;
    return left.author.localeCompare(right.author);
  });
};

export const filterNetworkProfiles = (profiles: NetworkProfileRecord[], query: string) => {
  const normalizedQuery = normalizeValue(query);
  if (!normalizedQuery) return profiles;

  return profiles.filter((profile) => {
    const searchableText = [
      profile.author,
      profile.handle,
      profile.role,
      profile.bio,
      profile.ownerEmail,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    return searchableText.includes(normalizedQuery);
  });
};

export const assembleNetworkProfiles = ({
  feedPosts,
  reelPosts,
  directoryProfiles,
  localDirectoryProfiles = [],
}: {
  feedPosts: SearchableFeedPost[];
  reelPosts: SearchableReelPost[];
  directoryProfiles: DirectoryProfileRecord[];
  localDirectoryProfiles?: LocalDirectoryProfile[];
}) => {
  const profileMap = new Map(
    buildNetworkProfiles(feedPosts, reelPosts).map((profile) => [profile.identityKey, profile] as const)
  );

  mergeDirectoryProfilesIntoMap(profileMap, directoryProfiles, localDirectoryProfiles);

  return enrichNetworkProfilesWithFollowers(sortNetworkProfiles([...profileMap.values()]));
};
