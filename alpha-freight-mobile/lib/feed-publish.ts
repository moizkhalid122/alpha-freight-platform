import * as ImagePicker from "expo-image-picker";
import { Platform } from "react-native";
import { getAiApiBaseUrl } from "@/lib/ai-api-config";
import { supabase } from "@/lib/supabase";
import type { FeedCategory } from "@/lib/feed-posts";

const FEED_MEDIA_BUCKET = "feed-media";

export type FeedPublisherProfile = {
  userId: string;
  email: string;
  name: string;
  avatar?: string;
  role: "carrier" | "supplier";
  profileKey: string;
  identityKey: string;
};

export type PersistFeedPostInput = {
  distributionId: string;
  authorId: string;
  authorName: string;
  authorEmail?: string;
  authorProfileKey: string;
  authorRole: "carrier" | "supplier";
  authorAvatar?: string;
  content: string;
  imageUrl?: string;
  imageStoragePath?: string;
  videoUrl?: string;
  videoStoragePath?: string;
  videoPosterUrl?: string;
  videoProcessingStatus?: "pending" | "processing" | "ready" | "failed";
  interestTags?: string[];
  publishedAt?: string;
};

const normalizeValue = (value?: string) => value?.trim().toLowerCase() || "";

export function createProfileIdentityKey(input: {
  ownerEmail?: string;
  handle?: string;
  author?: string;
}) {
  const normalizedEmail = normalizeValue(input.ownerEmail);
  if (normalizedEmail) return normalizedEmail;

  const normalizedHandle = normalizeValue(input.handle).replace(/^@/, "");
  if (normalizedHandle) return normalizedHandle;

  return normalizeValue(input.author).replace(/[^a-z0-9._-]+/g, "-");
}

export function createFeedDistributionId(identityKey: string) {
  const ownerKey =
    identityKey.trim().toLowerCase().replace(/[^a-z0-9._-]+/g, "-") || "member";
  return `alpha-freight:feed:${ownerKey}:${Date.now()}:${Math.random().toString(36).slice(2, 8)}`;
}

export function createReelDistributionId(identityKey: string) {
  const ownerKey =
    identityKey.trim().toLowerCase().replace(/[^a-z0-9._-]+/g, "-") || "member";
  return `alpha-freight:reel:${ownerKey}:${Date.now()}:${Math.random().toString(36).slice(2, 8)}`;
}

const normalizeInterestTag = (value: string) =>
  value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

export function extractFeedInterestTags(...sources: Array<string | undefined>) {
  const combined = sources.join(" ").toLowerCase();
  const keywordGroups: Array<[string, string[]]> = [
    ["loads", ["load", "freight", "cargo", "shipment", "delivery"]],
    ["fleet", ["fleet", "truck", "vehicle", "capacity", "available"]],
    ["routes", ["route", "lane", "pickup", "dispatch", "mile"]],
    ["market", ["market", "rate", "price", "demand", "spot"]],
    ["news", ["news", "update", "announcement", "launch"]],
    ["urgent", ["urgent", "asap", "priority"]],
    ["reefer", ["reefer", "cold", "frozen"]],
    ["warehouse", ["warehouse", "storage", "dock"]],
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
}

export function categoryToInterestTag(category: FeedCategory) {
  if (category === "ALL") return "";
  return category.toLowerCase();
}

export async function fetchFeedPublisherProfile(
  role: "carrier" | "supplier"
): Promise<FeedPublisherProfile | null> {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  const user = session?.user;
  if (!user) return null;

  let name = user.email?.split("@")[0] || "Member";
  let avatar: string | undefined;

  try {
    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name, company_name, avatar_url")
      .eq("id", user.id)
      .maybeSingle();

    name = profile?.company_name?.trim() || profile?.full_name?.trim() || name;
    avatar = profile?.avatar_url || undefined;
  } catch {
    // Fall back to auth metadata if profile lookup fails.
  }

  const email = user.email?.trim() || "";
  const profileKey = createProfileIdentityKey({ ownerEmail: email, author: name });
  const identityKey =
    user.id.trim().toLowerCase().replace(/[^a-z0-9._-]+/g, "-") || profileKey;

  return {
    userId: user.id,
    email,
    name,
    avatar,
    role,
    profileKey,
    identityKey,
  };
}

export async function pickFeedPostImage(): Promise<ImagePicker.ImagePickerAsset | null> {
  const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!permission.granted) {
    throw new Error("Photo library permission is required to attach an image.");
  }

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ["images"],
    quality: 0.84,
    allowsEditing: true,
    aspect: [4, 3],
  });

  if (result.canceled || !result.assets?.[0]) return null;
  return result.assets[0];
}

export async function pickFeedReelVideo(): Promise<ImagePicker.ImagePickerAsset | null> {
  const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!permission.granted) {
    throw new Error("Photo library permission is required to choose a reel video.");
  }

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ["videos"],
    quality: 1,
    ...(Platform.OS === "ios"
      ? {
          videoQuality: ImagePicker.UIImagePickerControllerQualityType.High,
          allowsEditing: true,
          aspect: [9, 16] as [number, number],
        }
      : { allowsEditing: false }),
  });

  if (result.canceled || !result.assets?.[0]) return null;
  return result.assets[0];
}

export async function pickFeedReelCoverImage(): Promise<ImagePicker.ImagePickerAsset | null> {
  const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!permission.granted) {
    throw new Error("Photo library permission is required to choose a cover image.");
  }

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ["images"],
    quality: 0.84,
    allowsEditing: true,
    aspect: [9, 16],
  });

  if (result.canceled || !result.assets?.[0]) return null;
  return result.assets[0];
}

async function uploadFeedMediaFromUri(
  userId: string,
  localUri: string,
  folder: string,
  filePrefix: string,
  mimeType: string | undefined,
  kind: "image" | "video"
) {
  const response = await fetch(localUri);
  const arrayBuffer = await response.arrayBuffer();

  let extension = kind === "video" ? "mp4" : "jpg";
  let contentType = kind === "video" ? "video/mp4" : "image/jpeg";

  if (mimeType?.includes("png")) {
    extension = "png";
    contentType = "image/png";
  } else if (mimeType?.includes("quicktime") || mimeType?.includes("mov")) {
    extension = "mov";
    contentType = "video/quicktime";
  } else if (mimeType?.includes("mp4")) {
    extension = "mp4";
    contentType = "video/mp4";
  } else if (mimeType && kind === "image") {
    contentType = mimeType;
  } else if (mimeType && kind === "video") {
    contentType = mimeType;
  }

  const path = `${userId}/${folder}/${filePrefix}-${Date.now()}.${extension}`;

  const { error } = await supabase.storage.from(FEED_MEDIA_BUCKET).upload(path, arrayBuffer, {
    upsert: true,
    contentType,
  });

  if (error) {
    return { ok: false as const, error: error.message };
  }

  const { data: publicData } = supabase.storage.from(FEED_MEDIA_BUCKET).getPublicUrl(path);

  return {
    ok: true as const,
    path,
    publicUrl: publicData.publicUrl,
  };
}

export async function uploadFeedImageFromUri(userId: string, localUri: string, mimeType?: string) {
  return uploadFeedMediaFromUri(userId, localUri, "feed-images", "feed-image", mimeType, "image");
}

export async function uploadFeedVideoFromUri(userId: string, localUri: string, mimeType?: string) {
  return uploadFeedMediaFromUri(userId, localUri, "reels", "reel-video", mimeType, "video");
}

export async function uploadFeedReelCoverFromUri(userId: string, localUri: string, mimeType?: string) {
  return uploadFeedMediaFromUri(userId, localUri, "reels", "reel-cover", mimeType, "image");
}

export async function persistFeedPost(input: PersistFeedPostInput) {
  if (!input.authorId?.trim() || !input.distributionId?.trim()) {
    return { ok: false as const, error: "Missing author or post id" };
  }

  try {
    const { error } = await supabase.from("feed_posts").upsert(
      [
        {
          distribution_id: input.distributionId,
          author_id: input.authorId,
          author_name: input.authorName,
          author_email: input.authorEmail || null,
          author_profile_key: input.authorProfileKey,
          author_role: input.authorRole,
          author_avatar: input.authorAvatar || null,
          content: input.content,
          image_url: input.imageUrl || null,
          image_storage_path: input.imageStoragePath || null,
          video_url: input.videoUrl || null,
          video_storage_path: input.videoStoragePath || null,
          video_poster_url: input.videoPosterUrl || input.imageUrl || null,
          video_processing_status: input.videoProcessingStatus || (input.videoUrl ? "ready" : null),
          interest_tags: input.interestTags || [],
          published_at: input.publishedAt || new Date().toISOString(),
        },
      ],
      { onConflict: "distribution_id" }
    );

    if (error) {
      return { ok: false as const, error: error.message };
    }

    return { ok: true as const, distributionId: input.distributionId };
  } catch (error) {
    return {
      ok: false as const,
      error: error instanceof Error ? error.message : "Unable to publish post",
    };
  }
}

export async function registerReelForStreamProcessing(input: {
  distributionId: string;
  videoUrl: string;
  posterUrl?: string;
  authorId: string;
}) {
  try {
    const response = await fetch(`${getAiApiBaseUrl()}/api/feed/reel/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
    if (!response.ok) return { ok: false as const };
    return { ok: true as const };
  } catch {
    return { ok: false as const };
  }
}
