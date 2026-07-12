import { supabase } from "@/lib/supabase";
import { isOfficialFeedEmail } from "@/lib/feed-official-accounts";

export type FeedProfileDetails = {
  userId: string | null;
  displayName: string;
  avatarUrl?: string;
  bio: string;
  link: string;
  isOfficial: boolean;
  authorEmail?: string;
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

async function resolveAuthorId(profileKey: string, authorId?: string) {
  if (authorId?.trim()) return authorId.trim();

  const normalizedKey = profileKey.trim().toLowerCase();
  if (!normalizedKey) return null;

  const { data } = await supabase
    .from("feed_posts")
    .select("author_id")
    .eq("author_profile_key", normalizedKey)
    .order("published_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  return data?.author_id?.trim() || null;
}

export async function fetchFeedProfileDetails(
  profileKey: string,
  options?: { authorId?: string; fallbackName?: string; fallbackAvatar?: string; fallbackEmail?: string }
): Promise<FeedProfileDetails> {
  const userId = await resolveAuthorId(profileKey, options?.authorId);
  let bio = "";
  let link = "";
  let displayName = options?.fallbackName?.trim() || "Profile";
  let avatarUrl = options?.fallbackAvatar;
  let authorEmail = options?.fallbackEmail;
  let isOfficial = isOfficialFeedEmail(authorEmail);

  if (userId) {
    let profile: {
      full_name?: string | null;
      company_name?: string | null;
      avatar_url?: string | null;
      profile_extras?: unknown;
      is_official?: boolean | null;
    } | null = null;

    const { data, error } = await supabase
      .from("profiles")
      .select("full_name, company_name, avatar_url, profile_extras, is_official")
      .eq("id", userId)
      .maybeSingle();

    if (error && /is_official/i.test(error.message)) {
      const fallback = await supabase
        .from("profiles")
        .select("full_name, company_name, avatar_url, profile_extras")
        .eq("id", userId)
        .maybeSingle();
      profile = fallback.data;
    } else {
      profile = data;
    }

    if (profile) {
      const extras = parseExtras(profile.profile_extras);
      bio = readString(extras, ["feedBio", "feed_bio", "bio"]);
      link = readString(extras, ["feedLink", "feed_link", "website", "link"]);
      displayName =
        profile.company_name?.trim() ||
        profile.full_name?.trim() ||
        displayName;
      avatarUrl = profile.avatar_url?.trim() || avatarUrl;
      if (profile.is_official === true) {
        isOfficial = true;
      }
    }

    const { data: authData } = await supabase.auth.getUser();
    if (authData.user?.id === userId && authData.user.email) {
      authorEmail = authData.user.email;
      isOfficial = isOfficial || isOfficialFeedEmail(authorEmail);
    }
  }

  if (!authorEmail) {
    const { data: postRow } = await supabase
      .from("feed_posts")
      .select("author_email")
      .eq("author_profile_key", profileKey.trim().toLowerCase())
      .order("published_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    authorEmail = postRow?.author_email || undefined;
    isOfficial = isOfficial || isOfficialFeedEmail(authorEmail);
  }

  return {
    userId,
    displayName,
    avatarUrl,
    bio,
    link,
    isOfficial,
    authorEmail,
  };
}

export async function updateFeedProfileDetails(
  userId: string,
  input: { bio: string; link: string }
) {
  if (!userId.trim()) {
    return { ok: false as const, error: "Missing profile id" };
  }

  try {
    const { data: current } = await supabase
      .from("profiles")
      .select("profile_extras")
      .eq("id", userId.trim())
      .maybeSingle();

    const extras = parseExtras(current?.profile_extras);
    const mergedExtras = {
      ...extras,
      feedBio: input.bio.trim(),
      feedLink: input.link.trim(),
    };

    const { error } = await supabase
      .from("profiles")
      .update({ profile_extras: mergedExtras })
      .eq("id", userId.trim());

    if (error) {
      return { ok: false as const, error: error.message };
    }

    return { ok: true as const };
  } catch (error) {
    return {
      ok: false as const,
      error: error instanceof Error ? error.message : "Unable to update profile",
    };
  }
}

export function formatFeedProfileLink(link: string) {
  return link.trim().replace(/^https?:\/\//i, "").replace(/\/$/, "");
}

export function normalizeFeedProfileLink(link: string) {
  const trimmed = link.trim();
  if (!trimmed) return "";
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
}
