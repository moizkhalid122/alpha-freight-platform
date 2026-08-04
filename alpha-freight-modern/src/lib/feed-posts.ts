import { supabase } from "@/lib/supabase";
import { formatActivityTime } from "@/components/feed/feed-activity";

export type FeedPostRow = {
  id: string;
  distribution_id: string;
  author_id: string;
  author_name: string;
  author_email?: string | null;
  author_profile_key: string;
  author_role: string;
  author_avatar?: string | null;
  content: string;
  image_url?: string | null;
  video_url?: string | null;
  image_storage_path?: string | null;
  video_storage_path?: string | null;
  likes_count?: number | null;
  comments_count?: number | null;
  interest_tags?: string[] | null;
  share_count?: number | null;
  save_count?: number | null;
  view_count?: number | null;
  engagement_score?: number | null;
  distribution_stage?: string | null;
  published_at?: string | null;
  created_at?: string | null;
};

export type RemoteFeedPost = {
  author: string;
  avatarSrc: string;
  time: string;
  role: string;
  content: string;
  likes: number;
  comments: number;
  imageSrc?: string;
  videoSrc?: string;
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
  videoUrl?: string;
  imageStoragePath?: string;
  videoStoragePath?: string;
  interestTags?: string[];
  publishedAt?: string;
};

export type UploadedFeedMedia = {
  path?: string;
  publicUrl: string;
  isDataUrl?: boolean;
};

export type UploadFeedMediaResult =
  | ({ ok: true } & UploadedFeedMedia)
  | { ok: false; error: string };

const FEED_MEDIA_BUCKET = "feed-media";
const MAX_IMAGE_DATA_URL_BYTES = 2_500_000;

const isMissingTableError = (message: string) =>
  /feed_posts|feed_follows|schema cache|relation.*does not exist|could not find the table/i.test(message);

const fileToDataUrl = (file: Blob) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(typeof reader.result === "string" ? reader.result : "");
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });

export const extractFeedMediaStoragePath = (value?: string | null) => {
  const trimmed = value?.trim();
  if (!trimmed || trimmed.startsWith("data:")) return null;

  if (!trimmed.startsWith("http") && trimmed.includes("/")) {
    return trimmed.replace(/^\/+/, "");
  }

  const bucketMatch = trimmed.match(/\/feed-media\/(.+?)(?:\?|$)/);
  return bucketMatch?.[1] ? decodeURIComponent(bucketMatch[1]) : null;
};

export async function resolveFeedMediaUrl(
  storagePath?: string | null,
  fallbackUrl?: string | null
): Promise<string | undefined> {
  if (fallbackUrl?.trim().startsWith("data:")) {
    return fallbackUrl.trim();
  }

  const path = extractFeedMediaStoragePath(storagePath) || extractFeedMediaStoragePath(fallbackUrl);
  const directUrl = fallbackUrl?.trim();

  if (path) {
    const { data, error } = await supabase.storage
      .from(FEED_MEDIA_BUCKET)
      .createSignedUrl(path, 60 * 60 * 24);

    if (!error && data?.signedUrl) {
      return data.signedUrl;
    }
  }

  if (!directUrl) return undefined;
  if (directUrl.startsWith("blob:")) return directUrl;

  return directUrl;
}

export async function uploadFeedMediaToSupabase(
  userId: string,
  file: File | Blob,
  kind: "image" | "video",
  fileName?: string
): Promise<UploadFeedMediaResult> {
  const extension =
    fileName?.split(".").pop()?.toLowerCase() || (kind === "image" ? "jpg" : "mp4");
  const contentType =
    file instanceof File && file.type
      ? file.type
      : kind === "image"
        ? "image/jpeg"
        : "video/mp4";
  const path = `${userId}/${kind}-${Date.now()}.${extension}`;

  const { error } = await supabase.storage.from(FEED_MEDIA_BUCKET).upload(path, file, {
    upsert: true,
    contentType,
  });

  if (error) {
    const canUseImageDataUrl =
      kind === "image" && file.size > 0 && file.size <= MAX_IMAGE_DATA_URL_BYTES;

    if (canUseImageDataUrl) {
      try {
        const dataUrl = await fileToDataUrl(file);
        if (dataUrl.startsWith("data:")) {
          return { ok: true, publicUrl: dataUrl, isDataUrl: true };
        }
      } catch {
        // Fall through to the storage error below.
      }
    }

    return { ok: false, error: error.message };
  }

  const { data } = supabase.storage.from(FEED_MEDIA_BUCKET).getPublicUrl(path);
  const signedUrl = await resolveFeedMediaUrl(path, data.publicUrl);

  return {
    ok: true,
    path,
    publicUrl: signedUrl || data.publicUrl || "",
  };
}

export async function persistFeedPostToSupabase(input: PersistFeedPostInput) {
  if (!input.authorId?.trim() || !input.distributionId?.trim()) {
    return { ok: false as const, error: "Missing author or distribution id" };
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
          video_url: input.videoUrl || null,
          image_storage_path: input.imageStoragePath || null,
          video_storage_path: input.videoStoragePath || null,
          interest_tags: input.interestTags || [],
          published_at: input.publishedAt || new Date().toISOString(),
        },
      ],
      { onConflict: "distribution_id" }
    );

    if (error) {
      if (isMissingTableError(error.message)) {
        console.warn(
          "[feed-posts] Table missing. Run feed-social.sql in Supabase SQL editor for cross-browser posts."
        );
      }

      return { ok: false as const, error: error.message };
    }

    return { ok: true as const };
  } catch (error) {
    return {
      ok: false as const,
      error: error instanceof Error ? error.message : "Unable to save feed post",
    };
  }
}

export const mapFeedPostRowToRemotePost = async (row: FeedPostRow): Promise<RemoteFeedPost> => {
  const publishedAt = row.published_at || row.created_at || new Date().toISOString();
  const [imageSrc, videoSrc] = await Promise.all([
    resolveFeedMediaUrl(row.image_storage_path, row.image_url),
    resolveFeedMediaUrl(row.video_storage_path, row.video_url),
  ]);

  return {
    author: row.author_name,
    avatarSrc: row.author_avatar || "/default-avatar-square.png",
    time: formatActivityTime(publishedAt),
    role: row.author_role,
    content: row.content,
    likes: row.likes_count || 0,
    comments: row.comments_count || 0,
    imageSrc,
    videoSrc,
    distributionId: row.distribution_id,
    ownerIdentityKey: row.author_profile_key,
    ownerEmail: row.author_email || undefined,
    interestTags: row.interest_tags || [],
    shareCount: row.share_count || 0,
    saveCount: row.save_count || 0,
    viewCount: row.view_count || 0,
    engagementScore: row.engagement_score || 0,
    distributionStage: row.distribution_stage === "for-you" ? "for-you" : "interest",
    publishedAt,
  };
};

export async function fetchFeedPostsFromSupabase(limit = 100) {
  try {
    const { data, error } = await supabase
      .from("feed_posts")
      .select("*")
      .order("published_at", { ascending: false })
      .limit(limit);

    if (error) {
      if (isMissingTableError(error.message)) {
        console.warn(
          "[feed-posts] Table missing. Run feed-social.sql in Supabase SQL editor for cross-browser posts."
        );
      }

      return { data: [] as RemoteFeedPost[], error: error.message };
    }

    const mappedPosts = await Promise.all(((data || []) as FeedPostRow[]).map(mapFeedPostRowToRemotePost));

    return {
      data: mappedPosts,
      error: null as string | null,
    };
  } catch (error) {
    return {
      data: [] as RemoteFeedPost[],
      error: error instanceof Error ? error.message : "Unable to load feed posts",
    };
  }
}

export async function persistFeedFollowToSupabase(input: {
  followerId: string;
  followerProfileKey: string;
  followedProfileKey: string;
  followedProfileId?: string;
}) {
  if (!input.followerId?.trim() || !input.followedProfileKey?.trim()) {
    return { ok: false as const, error: "Missing follower or followed profile" };
  }

  try {
    const { error } = await supabase.from("feed_follows").upsert(
      [
        {
          follower_id: input.followerId,
          follower_profile_key: input.followerProfileKey,
          followed_profile_key: input.followedProfileKey,
          followed_profile_id: input.followedProfileId || null,
        },
      ],
      { onConflict: "follower_id,followed_profile_key" }
    );

    if (error) {
      if (isMissingTableError(error.message)) {
        console.warn(
          "[feed-posts] feed_follows table missing. Run feed-social.sql in Supabase SQL editor."
        );
      }

      return { ok: false as const, error: error.message };
    }

    return { ok: true as const };
  } catch (error) {
    return {
      ok: false as const,
      error: error instanceof Error ? error.message : "Unable to save follow",
    };
  }
}

export async function removeFeedFollowFromSupabase(input: {
  followerId: string;
  followedProfileKey: string;
}) {
  if (!input.followerId?.trim() || !input.followedProfileKey?.trim()) {
    return { ok: false as const, error: "Missing follower or followed profile" };
  }

  try {
    const { error } = await supabase
      .from("feed_follows")
      .delete()
      .eq("follower_id", input.followerId)
      .eq("followed_profile_key", input.followedProfileKey);

    if (error) {
      return { ok: false as const, error: error.message };
    }

    return { ok: true as const };
  } catch (error) {
    return {
      ok: false as const,
      error: error instanceof Error ? error.message : "Unable to remove follow",
    };
  }
}

export async function fetchFollowedProfileKeysFromSupabase(followerId: string) {
  if (!followerId?.trim()) {
    return { data: [] as string[], error: null as string | null };
  }

  try {
    const { data, error } = await supabase
      .from("feed_follows")
      .select("followed_profile_key")
      .eq("follower_id", followerId);

    if (error) {
      if (isMissingTableError(error.message)) {
        return { data: [] as string[], error: null as string | null };
      }

      return { data: [] as string[], error: error.message };
    }

    return {
      data: (data || [])
        .map((row) => row.followed_profile_key?.trim().toLowerCase())
        .filter(Boolean) as string[],
      error: null as string | null,
    };
  } catch (error) {
    return {
      data: [] as string[],
      error: error instanceof Error ? error.message : "Unable to load follows",
    };
  }
}

export async function fetchFeedPostsByProfileKey(profileKey: string, limit = 50) {
  const normalizedKey = profileKey.trim().toLowerCase();
  if (!normalizedKey) {
    return { data: [] as RemoteFeedPost[], error: null as string | null };
  }

  try {
    const { data, error } = await supabase
      .from("feed_posts")
      .select("*")
      .eq("author_profile_key", normalizedKey)
      .order("published_at", { ascending: false })
      .limit(limit);

    if (error) {
      if (isMissingTableError(error.message)) {
        return { data: [] as RemoteFeedPost[], error: null as string | null };
      }

      return { data: [] as RemoteFeedPost[], error: error.message };
    }

    const mappedPosts = await Promise.all(((data || []) as FeedPostRow[]).map(mapFeedPostRowToRemotePost));

    return { data: mappedPosts, error: null as string | null };
  } catch (error) {
    return {
      data: [] as RemoteFeedPost[],
      error: error instanceof Error ? error.message : "Unable to load profile posts",
    };
  }
}

export async function persistFeedPostLikeToSupabase(userId: string, distributionId: string) {
  if (!userId?.trim() || !distributionId?.trim()) {
    return { ok: false as const, error: "Missing user or post id" };
  }

  try {
    const { error } = await supabase.from("feed_post_likes").upsert(
      [
        {
          user_id: userId.trim(),
          distribution_id: distributionId.trim(),
        },
      ],
      { onConflict: "user_id,distribution_id" }
    );

    if (error) {
      if (isMissingTableError(error.message)) {
        return { ok: false as const, error: error.message };
      }

      return { ok: false as const, error: error.message };
    }

    await supabase.rpc("adjust_feed_post_likes_count", {
      p_distribution_id: distributionId.trim(),
      p_delta: 1,
    });

    return { ok: true as const };
  } catch (error) {
    return {
      ok: false as const,
      error: error instanceof Error ? error.message : "Unable to save like",
    };
  }
}

export async function removeFeedPostLikeFromSupabase(userId: string, distributionId: string) {
  if (!userId?.trim() || !distributionId?.trim()) {
    return { ok: false as const, error: "Missing user or post id" };
  }

  try {
    const { error } = await supabase
      .from("feed_post_likes")
      .delete()
      .eq("user_id", userId.trim())
      .eq("distribution_id", distributionId.trim());

    if (error) {
      if (isMissingTableError(error.message)) {
        return { ok: false as const, error: error.message };
      }

      return { ok: false as const, error: error.message };
    }

    await supabase.rpc("adjust_feed_post_likes_count", {
      p_distribution_id: distributionId.trim(),
      p_delta: -1,
    });

    return { ok: true as const };
  } catch (error) {
    return {
      ok: false as const,
      error: error instanceof Error ? error.message : "Unable to remove like",
    };
  }
}

export async function fetchLikedDistributionIdsFromSupabase(userId: string) {
  if (!userId?.trim()) {
    return { data: [] as string[], error: null as string | null };
  }

  try {
    const { data, error } = await supabase
      .from("feed_post_likes")
      .select("distribution_id")
      .eq("user_id", userId.trim());

    if (error) {
      if (isMissingTableError(error.message)) {
        return { data: [] as string[], error: null as string | null };
      }

      return { data: [] as string[], error: error.message };
    }

    return {
      data: (data || [])
        .map((row) => row.distribution_id?.trim())
        .filter(Boolean) as string[],
      error: null as string | null,
    };
  } catch (error) {
    return {
      data: [] as string[],
      error: error instanceof Error ? error.message : "Unable to load likes",
    };
  }
}
