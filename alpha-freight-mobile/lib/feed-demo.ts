import type { FeedPost } from "@/lib/feed-posts";

type DemoFeedRow = {
  distribution_id?: string | null;
  author_email?: string | null;
  author_profile_key?: string | null;
  video_url?: string | null;
};

export function isDemoFeedDistributionId(id?: string | null) {
  const normalized = id?.trim().toLowerCase() || "";
  return normalized.startsWith("demo-") || normalized.startsWith("demo_");
}

export function isDemoFeedEmail(value?: string | null) {
  const normalized = value?.trim().toLowerCase() || "";
  return normalized.startsWith("demo.") || normalized.includes("@demo.");
}

export function isDemoFeedMediaUrl(url?: string | null) {
  const normalized = url?.trim().toLowerCase() || "";
  return normalized.includes("mixkit.co/videos") || normalized.includes("assets.mixkit.co");
}

export function isDemoFeedPostRow(row: DemoFeedRow) {
  if (isDemoFeedDistributionId(row.distribution_id)) return true;
  if (isDemoFeedEmail(row.author_email)) return true;
  if (isDemoFeedEmail(row.author_profile_key)) return true;
  if (isDemoFeedMediaUrl(row.video_url)) return true;
  return false;
}

export function isDemoFeedPost(post: Pick<FeedPost, "id" | "authorEmail" | "authorProfileKey" | "videoSrc">) {
  if (isDemoFeedDistributionId(post.id)) return true;
  if (isDemoFeedEmail(post.authorEmail)) return true;
  if (isDemoFeedEmail(post.authorProfileKey)) return true;
  if (isDemoFeedMediaUrl(post.videoSrc)) return true;
  return false;
}

export function withoutDemoFeedPosts<T extends FeedPost>(posts: T[]) {
  return posts.filter((post) => !isDemoFeedPost(post));
}
