import type { FeedPost } from "@/lib/feed-posts";

/** Alpha Freight official accounts get top priority in For You. */
const OFFICIAL_BOOST = 5000;
const FOLLOWED_BOOST = 2000;
const PUBLIC_BASELINE = 120;

function ageHours(publishedAt: string, now: number) {
  const ageMs = now - new Date(publishedAt).getTime();
  if (!Number.isFinite(ageMs) || ageMs < 0) return 0;
  return ageMs / 3_600_000;
}

function recencyBoost(publishedAt: string, now: number) {
  const hours = ageHours(publishedAt, now);
  if (hours < 6) return 1200;
  if (hours < 24) return 900;
  if (hours < 72) return 450;
  if (hours < 168) return 180;
  return Math.max(20, 140 - Math.floor(hours / 24));
}

export function computeForYouScore(
  post: FeedPost,
  followedProfileKeys: Set<string>,
  now = Date.now()
) {
  let score = PUBLIC_BASELINE;

  if (post.isOfficial) {
    score += OFFICIAL_BOOST;
  }

  const authorKey = post.authorProfileKey.trim().toLowerCase();
  if (authorKey && followedProfileKeys.has(authorKey)) {
    score += FOLLOWED_BOOST;
  }

  score +=
    post.likes * 3 +
    post.comments * 5 +
    post.shareCount * 4 +
    post.saveCount * 2 +
    post.engagementScore;

  score += Math.min(600, Math.floor((post.views || 0) / 8));
  score += recencyBoost(post.publishedAt, now);

  if (post.videoSrc?.trim()) {
    score += 80;
  }

  return score;
}

export function rankForYouFeed(posts: FeedPost[], followedProfileKeys: string[]) {
  const followedSet = new Set(followedProfileKeys.map((key) => key.trim().toLowerCase()).filter(Boolean));
  const now = Date.now();

  return [...posts].sort((a, b) => {
    const scoreDiff = computeForYouScore(b, followedSet, now) - computeForYouScore(a, followedSet, now);
    if (scoreDiff !== 0) return scoreDiff;
    return new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime();
  });
}

export function filterFollowingFeed(posts: FeedPost[], followedProfileKeys: string[]) {
  const followedSet = new Set(followedProfileKeys.map((key) => key.trim().toLowerCase()).filter(Boolean));
  if (!followedSet.size) return [];

  return posts
    .filter((post) => followedSet.has(post.authorProfileKey.trim().toLowerCase()))
    .sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());
}
