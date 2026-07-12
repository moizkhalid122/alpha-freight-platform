import { supabase } from "@/lib/supabase";
import { createProfileIdentityKey } from "@/lib/feed-publish";
import { isOfficialFeedEmail } from "@/lib/feed-official-accounts";
import { fetchFeedPosts, type FeedPost } from "@/lib/feed-posts";

export type DiscoverProfileResult = {
  profileKey: string;
  userId: string;
  name: string;
  role: string;
  avatarUrl?: string;
  bio: string;
  isOfficial: boolean;
  postCount: number;
};

function parseExtras(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  return value as Record<string, unknown>;
}

function readString(extras: Record<string, unknown>, keys: string[]) {
  for (const key of keys) {
    const value = extras[key];
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return "";
}

async function resolveProfileKey(userId: string, name: string, extras: Record<string, unknown>) {
  const { data: postRow } = await supabase
    .from("feed_posts")
    .select("author_profile_key, author_email")
    .eq("author_id", userId)
    .order("published_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (postRow?.author_profile_key?.trim()) {
    return postRow.author_profile_key.trim().toLowerCase();
  }

  const email = readString(extras, ["email", "ownerEmail"]);
  return createProfileIdentityKey({
    ownerEmail: email || postRow?.author_email || undefined,
    author: name,
  });
}

async function mapProfileRow(
  row: {
    id: string;
    full_name?: string | null;
    company_name?: string | null;
    role?: string | null;
    avatar_url?: string | null;
    profile_extras?: unknown;
    is_official?: boolean | null;
  },
  postCounts: Record<string, number>,
  authorEmails: Record<string, string | undefined>
): Promise<DiscoverProfileResult> {
  const extras = parseExtras(row.profile_extras);
  const name = row.company_name?.trim() || row.full_name?.trim() || "Network member";
  const profileKey = await resolveProfileKey(row.id, name, extras);
  const bio = readString(extras, ["feedBio", "feed_bio", "bio"]);
  const email = authorEmails[row.id];
  const isOfficial = row.is_official === true || isOfficialFeedEmail(email);

  return {
    profileKey,
    userId: row.id,
    name,
    role: row.role?.trim() || "carrier",
    avatarUrl: row.avatar_url?.trim() || undefined,
    bio,
    isOfficial,
    postCount: postCounts[row.id] || 0,
  };
}

export async function searchFeedNetworkProfiles(query: string, limit = 24) {
  const needle = query.trim().toLowerCase();
  if (!needle) return [] as DiscoverProfileResult[];

  try {
    const { data: profiles, error } = await supabase
      .from("profiles")
      .select("id, full_name, company_name, role, avatar_url, profile_extras, is_official")
      .in("role", ["carrier", "supplier"])
      .or(`full_name.ilike.%${needle}%,company_name.ilike.%${needle}%`)
      .limit(limit);

    if (error || !profiles?.length) {
      return await searchProfilesFromFeedAuthors(needle, limit);
    }

    const userIds = profiles.map((row) => row.id);
    const postCounts = await fetchPostCountsByAuthorIds(userIds);
    const authorEmails = await fetchAuthorEmailsByUserIds(userIds);

    const mapped = await Promise.all(
      profiles.map((row) => mapProfileRow(row, postCounts, authorEmails))
    );

    return mapped.sort((a, b) => {
      if (a.isOfficial !== b.isOfficial) return a.isOfficial ? -1 : 1;
      return b.postCount - a.postCount;
    });
  } catch {
    return [];
  }
}

async function searchProfilesFromFeedAuthors(needle: string, limit: number) {
  const { data: posts } = await supabase
    .from("feed_posts")
    .select("author_id, author_name, author_profile_key, author_role, author_avatar, author_email")
    .or(`author_name.ilike.%${needle}%,author_email.ilike.%${needle}%`)
    .order("published_at", { ascending: false })
    .limit(40);

  const unique = new Map<string, DiscoverProfileResult>();
  for (const row of posts || []) {
    const key = row.author_profile_key?.trim().toLowerCase();
    const userId = row.author_id?.trim();
    if (!key || !userId || unique.has(userId)) continue;

    unique.set(userId, {
      profileKey: key,
      userId,
      name: row.author_name?.trim() || "Network member",
      role: row.author_role?.trim() || "carrier",
      avatarUrl: row.author_avatar?.trim() || undefined,
      bio: "",
      isOfficial: isOfficialFeedEmail(row.author_email),
      postCount: 0,
    });

    if (unique.size >= limit) break;
  }

  return Array.from(unique.values());
}

async function fetchPostCountsByAuthorIds(userIds: string[]) {
  if (!userIds.length) return {} as Record<string, number>;

  const { data } = await supabase
    .from("feed_posts")
    .select("author_id")
    .in("author_id", userIds);

  const counts: Record<string, number> = {};
  for (const row of data || []) {
    const id = row.author_id?.trim();
    if (!id) continue;
    counts[id] = (counts[id] || 0) + 1;
  }
  return counts;
}

async function fetchAuthorEmailsByUserIds(userIds: string[]) {
  const emails: Record<string, string | undefined> = {};
  if (!userIds.length) return emails;

  const { data } = await supabase
    .from("feed_posts")
    .select("author_id, author_email")
    .in("author_id", userIds)
    .order("published_at", { ascending: false });

  for (const row of data || []) {
    const id = row.author_id?.trim();
    if (!id || emails[id]) continue;
    emails[id] = row.author_email || undefined;
  }
  return emails;
}

export async function fetchDiscoverGridPosts(limit = 60) {
  const { posts } = await fetchFeedPosts(limit);
  return posts.filter((post) => Boolean(post.imageSrc?.trim() || post.videoSrc?.trim()));
}

export function getDiscoverTileUri(post: FeedPost) {
  return post.imageSrc?.trim() || post.videoSrc?.trim() || "";
}
