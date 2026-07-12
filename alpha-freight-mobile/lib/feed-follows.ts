import { supabase } from "@/lib/supabase";

const isMissingTableError = (message: string) =>
  /feed_follows|schema cache|relation.*does not exist|could not find the table/i.test(message);

export async function persistFeedFollow(input: {
  followerId: string;
  followerProfileKey: string;
  followedProfileKey: string;
  followedProfileId?: string;
}) {
  if (!input.followerId.trim() || !input.followedProfileKey.trim()) {
    return { ok: false as const, error: "Missing follower or followed profile" };
  }

  try {
    const { error } = await supabase.from("feed_follows").upsert(
      [
        {
          follower_id: input.followerId.trim(),
          follower_profile_key: input.followerProfileKey.trim().toLowerCase(),
          followed_profile_key: input.followedProfileKey.trim().toLowerCase(),
          followed_profile_id: input.followedProfileId?.trim() || null,
        },
      ],
      { onConflict: "follower_id,followed_profile_key" }
    );

    if (error) {
      if (isMissingTableError(error.message)) {
        return { ok: false as const, error: "Follows are not set up yet." };
      }
      return { ok: false as const, error: error.message };
    }

    return { ok: true as const };
  } catch (error) {
    return {
      ok: false as const,
      error: error instanceof Error ? error.message : "Unable to follow profile",
    };
  }
}

export async function removeFeedFollow(input: {
  followerId: string;
  followedProfileKey: string;
}) {
  if (!input.followerId.trim() || !input.followedProfileKey.trim()) {
    return { ok: false as const, error: "Missing follower or followed profile" };
  }

  try {
    const { error } = await supabase
      .from("feed_follows")
      .delete()
      .eq("follower_id", input.followerId.trim())
      .eq("followed_profile_key", input.followedProfileKey.trim().toLowerCase());

    if (error) {
      return { ok: false as const, error: error.message };
    }

    return { ok: true as const };
  } catch (error) {
    return {
      ok: false as const,
      error: error instanceof Error ? error.message : "Unable to unfollow profile",
    };
  }
}

export async function fetchFollowedProfileKeys(followerId: string) {
  if (!followerId.trim()) {
    return { keys: [] as string[], error: null as string | null };
  }

  try {
    const { data, error } = await supabase
      .from("feed_follows")
      .select("followed_profile_key")
      .eq("follower_id", followerId.trim());

    if (error) {
      if (isMissingTableError(error.message)) {
        return { keys: [] as string[], error: null };
      }
      return { keys: [] as string[], error: error.message };
    }

    return {
      keys: (data || [])
        .map((row) => row.followed_profile_key?.trim().toLowerCase())
        .filter(Boolean) as string[],
      error: null,
    };
  } catch (error) {
    return {
      keys: [] as string[],
      error: error instanceof Error ? error.message : "Unable to load follows",
    };
  }
}

export async function isFollowingProfile(followerId: string, followedProfileKey: string) {
  if (!followerId.trim() || !followedProfileKey.trim()) {
    return false;
  }

  const { data, error } = await supabase
    .from("feed_follows")
    .select("id")
    .eq("follower_id", followerId.trim())
    .eq("followed_profile_key", followedProfileKey.trim().toLowerCase())
    .maybeSingle();

  if (error) return false;
  return Boolean(data);
}

/** True when profileUserId already follows the signed-in viewer. */
export async function isFollowedByProfile(input: {
  profileUserId?: string | null;
  profileKey: string;
  viewerUserId: string;
  viewerProfileKey: string;
}) {
  const followerId = input.profileUserId?.trim();
  const viewerUserId = input.viewerUserId.trim();
  const viewerProfileKey = input.viewerProfileKey.trim().toLowerCase();

  if (!followerId || !viewerUserId || followerId === viewerUserId) {
    return false;
  }

  try {
    const { data: byUserId, error: byUserIdError } = await supabase
      .from("feed_follows")
      .select("id")
      .eq("follower_id", followerId)
      .eq("followed_profile_id", viewerUserId)
      .maybeSingle();

    if (!byUserIdError && byUserId) return true;

    const { data: byProfileKey, error: byProfileKeyError } = await supabase
      .from("feed_follows")
      .select("id")
      .eq("follower_id", followerId)
      .eq("followed_profile_key", viewerProfileKey)
      .maybeSingle();

    if (byProfileKeyError) return false;
    return Boolean(byProfileKey);
  } catch {
    return false;
  }
}

export async function fetchProfileFollowerCount(profileKey: string) {
  const normalized = profileKey.trim().toLowerCase();
  if (!normalized) return 0;

  try {
    const { count, error } = await supabase
      .from("feed_follows")
      .select("*", { count: "exact", head: true })
      .eq("followed_profile_key", normalized);

    if (error) return 0;
    return count ?? 0;
  } catch {
    return 0;
  }
}
