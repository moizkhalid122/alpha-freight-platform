import { supabase } from "@/lib/supabase";
import { isOfficialFeedEmail } from "@/lib/feed-official-accounts";
import { isDemoFeedPost, isDemoFeedPostRow, withoutDemoFeedPosts } from "@/lib/feed-demo";
import { resolveFeedMediaUrlSync } from "@/lib/feed-media-url";

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
  video_hls_url?: string | null;
  video_poster_url?: string | null;
  video_processing_status?: string | null;
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

export type FeedPost = {
  id: string;
  author: string;
  authorId: string;
  authorProfileKey: string;
  authorEmail?: string;
  isOfficial: boolean;
  avatarSrc?: string;
  time: string;
  role: string;
  content: string;
  headline: string;
  summary: string;
  likes: number;
  comments: number;
  shareCount: number;
  saveCount: number;
  views: number;
  engagementScore: number;
  imageSrc?: string;
  videoSrc?: string;
  videoHlsSrc?: string;
  videoPosterSrc?: string;
  videoProcessingStatus?: string;
  interestTags: string[];
  publishedAt: string;
};

const isMissingTableError = (message: string) =>
  /feed_posts|feed_follows|schema cache|relation.*does not exist|could not find the table/i.test(message);

export function formatFeedTime(createdAt: string) {
  const ageMs = Date.now() - new Date(createdAt).getTime();
  if (!Number.isFinite(ageMs) || ageMs < 0) return "Just now";
  if (ageMs < 60_000) return "Just now";
  if (ageMs < 3_600_000) return `${Math.max(1, Math.floor(ageMs / 60_000))}m`;
  if (ageMs < 86_400_000) return `${Math.max(1, Math.floor(ageMs / 3_600_000))}h`;
  return `${Math.max(1, Math.floor(ageMs / 86_400_000))}d`;
}

export function formatEngagementCount(value: number) {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1).replace(/\.0$/, "")}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(1).replace(/\.0$/, "")}K`;
  return String(value);
}

function splitContent(content: string) {
  const trimmed = content.trim();
  if (!trimmed) return { headline: "Network update", summary: "" };

  const sentenceBreak = trimmed.search(/[.!?]\s/);
  if (sentenceBreak > 0 && sentenceBreak <= 120) {
    return {
      headline: trimmed.slice(0, sentenceBreak + 1).trim(),
      summary: trimmed.slice(sentenceBreak + 1).trim(),
    };
  }

  if (trimmed.length <= 90) {
    return { headline: trimmed, summary: "" };
  }

  const cut = trimmed.lastIndexOf(" ", 90);
  return {
    headline: `${trimmed.slice(0, cut > 40 ? cut : 90).trim()}…`,
    summary: trimmed.slice(cut > 40 ? cut : 90).trim(),
  };
}

function mapFeedPostRow(row: FeedPostRow): FeedPost {
  const publishedAt = row.published_at || row.created_at || new Date().toISOString();
  const posterFallback = row.video_poster_url || row.image_url;
  const imageSrc = resolveFeedMediaUrlSync(row.image_storage_path, posterFallback);
  const videoHlsSrc = row.video_hls_url?.trim() || undefined;
  const mp4Src = resolveFeedMediaUrlSync(row.video_storage_path, row.video_url);
  const videoSrc = videoHlsSrc || mp4Src;
  const { headline, summary } = splitContent(row.content);

  return {
    id: row.distribution_id || row.id,
    author: row.author_name,
    authorId: row.author_id,
    authorProfileKey: row.author_profile_key,
    authorEmail: row.author_email || undefined,
    isOfficial: isOfficialFeedEmail(row.author_email),
    avatarSrc: row.author_avatar || undefined,
    time: formatFeedTime(publishedAt),
    role: row.author_role,
    content: row.content,
    headline,
    summary,
    likes: row.likes_count || 0,
    comments: row.comments_count || 0,
    shareCount: row.share_count || 0,
    saveCount: row.save_count || 0,
    views: row.view_count || 0,
    engagementScore: row.engagement_score || 0,
    imageSrc,
    videoSrc,
    videoHlsSrc,
    videoPosterSrc: imageSrc,
    videoProcessingStatus: row.video_processing_status || undefined,
    interestTags: row.interest_tags || [],
    publishedAt,
  };
}

export function filterFeedReels(posts: FeedPost[]) {
  return posts.filter((post) => Boolean(post.videoSrc?.trim()));
}

export async function fetchFeedPosts(limit = 80) {
  try {
    const { data, error } = await supabase
      .from("feed_posts")
      .select("*")
      .order("published_at", { ascending: false })
      .limit(limit);

    if (error) {
      if (isMissingTableError(error.message)) {
        return { posts: [] as FeedPost[], error: null };
      }
      return { posts: [] as FeedPost[], error: error.message };
    }

    const posts = withoutDemoFeedPosts(((data || []) as FeedPostRow[]).map(mapFeedPostRow));
    return { posts, error: null };
  } catch (error) {
    return {
      posts: [] as FeedPost[],
      error: error instanceof Error ? error.message : "Unable to load feed",
    };
  }
}

export const FEED_CATEGORIES = ["ALL", "LOADS", "FLEET", "MARKET"] as const;
export type FeedCategory = (typeof FEED_CATEGORIES)[number];

export function filterFeedPlainPosts(posts: FeedPost[]) {
  return posts.filter((post) => !post.videoSrc?.trim());
}

export function filterFeedPosts(
  posts: FeedPost[],
  category: FeedCategory,
  role?: "carrier" | "supplier"
) {
  let filtered = posts;

  if (role) {
    filtered = filtered.filter(
      (post) => post.role.toLowerCase() === role || post.role.toLowerCase() === "all"
    );
  }

  if (category === "ALL") return filtered;

  const needle = category.toLowerCase();
  return filtered.filter((post) =>
    post.interestTags.some((tag) => tag.toLowerCase().includes(needle)) ||
    post.content.toLowerCase().includes(needle) ||
    post.role.toLowerCase().includes(needle)
  );
}

export function sortFeedPosts(posts: FeedPost[], mode: "popular" | "latest") {
  const copy = [...posts];
  if (mode === "latest") {
    return copy.sort(
      (a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
    );
  }
  return copy.sort((a, b) => {
    const scoreA = a.engagementScore + a.likes * 2 + a.comments * 3 + a.shareCount * 4;
    const scoreB = b.engagementScore + b.likes * 2 + b.comments * 3 + b.shareCount * 4;
    if (scoreB !== scoreA) return scoreB - scoreA;
    return new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime();
  });
}

export async function persistFeedPostLike(userId: string, distributionId: string) {
  if (!userId.trim() || !distributionId.trim()) {
    return { ok: false as const, error: "Missing user or post id" };
  }

  try {
    const { error } = await supabase.from("feed_post_likes").upsert(
      [{ user_id: userId.trim(), distribution_id: distributionId.trim() }],
      { onConflict: "user_id,distribution_id" }
    );

    if (error) {
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

export async function removeFeedPostLike(userId: string, distributionId: string) {
  if (!userId.trim() || !distributionId.trim()) {
    return { ok: false as const, error: "Missing user or post id" };
  }

  try {
    const { error } = await supabase
      .from("feed_post_likes")
      .delete()
      .eq("user_id", userId.trim())
      .eq("distribution_id", distributionId.trim());

    if (error) {
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

export async function fetchLikedDistributionIds(userId: string) {
  if (!userId.trim()) return { ids: [] as string[], error: null as string | null };

  try {
    const { data, error } = await supabase
      .from("feed_post_likes")
      .select("distribution_id")
      .eq("user_id", userId.trim());

    if (error) {
      if (isMissingTableError(error.message)) {
        return { ids: [] as string[], error: null };
      }
      return { ids: [] as string[], error: error.message };
    }

    return {
      ids: (data || [])
        .map((row) => row.distribution_id?.trim())
        .filter(Boolean) as string[],
      error: null,
    };
  } catch (error) {
    return {
      ids: [] as string[],
      error: error instanceof Error ? error.message : "Unable to load likes",
    };
  }
}

export async function fetchFeedPostById(postId: string) {
  if (!postId.trim()) {
    return { post: null as FeedPost | null, error: "Missing post id" };
  }

  try {
    const { data, error } = await supabase
      .from("feed_posts")
      .select("*")
      .eq("distribution_id", postId.trim())
      .maybeSingle();

    if (error) {
      if (isMissingTableError(error.message)) {
        return { post: null, error: null };
      }
      return { post: null, error: error.message };
    }

    if (!data) {
      return { post: null, error: "Post not found" };
    }

    if (isDemoFeedPostRow(data as FeedPostRow)) {
      return { post: null, error: "Post not found" };
    }

    const post = mapFeedPostRow(data as FeedPostRow);
    return { post, error: null };
  } catch (error) {
    return {
      post: null,
      error: error instanceof Error ? error.message : "Unable to load post",
    };
  }
}

export async function fetchFeedPostsByProfileKey(profileKey: string, limit = 60) {
  const normalizedKey = profileKey.trim().toLowerCase();
  if (!normalizedKey) {
    return { posts: [] as FeedPost[], error: null as string | null };
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
        return { posts: [] as FeedPost[], error: null };
      }
      return { posts: [] as FeedPost[], error: error.message };
    }

    const posts = withoutDemoFeedPosts(((data || []) as FeedPostRow[]).map(mapFeedPostRow));
    return { posts, error: null };
  } catch (error) {
    return {
      posts: [] as FeedPost[],
      error: error instanceof Error ? error.message : "Unable to load profile posts",
    };
  }
}

export function formatFeedCategoryLabel(post: FeedPost) {
  const tag = post.interestTags.find(Boolean);
  if (tag) {
    return tag.replace(/^#/, "").trim().toUpperCase();
  }
  return post.role ? `${post.role.charAt(0).toUpperCase()}${post.role.slice(1)}` : "Network";
}

export async function deleteFeedPost(distributionId: string, userId: string) {
  if (!distributionId.trim() || !userId.trim()) {
    return { ok: false as const, error: "Missing post or user id" };
  }

  try {
    const { error } = await supabase
      .from("feed_posts")
      .delete()
      .eq("distribution_id", distributionId.trim())
      .eq("author_id", userId.trim());

    if (error) {
      if (isMissingTableError(error.message)) {
        return { ok: false as const, error: "Unable to delete post." };
      }
      return { ok: false as const, error: error.message };
    }

    return { ok: true as const };
  } catch (error) {
    return {
      ok: false as const,
      error: error instanceof Error ? error.message : "Unable to delete post",
    };
  }
}
