import { supabase } from "@/lib/supabase";
import type { FeedPost } from "@/lib/feed-posts";
import { fetchFeedPostById } from "@/lib/feed-posts";

const isMissingTableError = (message: string) =>
  /feed_saves|schema cache|relation.*does not exist|could not find the table/i.test(message);

export async function persistFeedSave(userId: string, distributionId: string) {
  if (!userId.trim() || !distributionId.trim()) {
    return { ok: false as const, error: "Missing user or post id" };
  }

  try {
    const { error } = await supabase.from("feed_saves").upsert(
      [{ user_id: userId.trim(), distribution_id: distributionId.trim() }],
      { onConflict: "user_id,distribution_id" }
    );

    if (error) {
      if (isMissingTableError(error.message)) {
        return { ok: false as const, error: "Saves are not set up yet. Run feed-extras.sql in Supabase." };
      }
      return { ok: false as const, error: error.message };
    }

    await supabase.rpc("adjust_feed_post_saves_count", {
      p_distribution_id: distributionId.trim(),
      p_delta: 1,
    });

    return { ok: true as const };
  } catch (error) {
    return {
      ok: false as const,
      error: error instanceof Error ? error.message : "Unable to save post",
    };
  }
}

export async function removeFeedSave(userId: string, distributionId: string) {
  if (!userId.trim() || !distributionId.trim()) {
    return { ok: false as const, error: "Missing user or post id" };
  }

  try {
    const { error } = await supabase
      .from("feed_saves")
      .delete()
      .eq("user_id", userId.trim())
      .eq("distribution_id", distributionId.trim());

    if (error) {
      return { ok: false as const, error: error.message };
    }

    await supabase.rpc("adjust_feed_post_saves_count", {
      p_distribution_id: distributionId.trim(),
      p_delta: -1,
    });

    return { ok: true as const };
  } catch (error) {
    return {
      ok: false as const,
      error: error instanceof Error ? error.message : "Unable to remove save",
    };
  }
}

export async function fetchSavedDistributionIds(userId: string) {
  if (!userId.trim()) return { ids: [] as string[], error: null as string | null };

  try {
    const { data, error } = await supabase
      .from("feed_saves")
      .select("distribution_id")
      .eq("user_id", userId.trim())
      .order("created_at", { ascending: false });

    if (error) {
      if (isMissingTableError(error.message)) {
        return { ids: [] as string[], error: null };
      }
      return { ids: [] as string[], error: error.message };
    }

    return {
      ids: (data || []).map((row) => row.distribution_id?.trim()).filter(Boolean) as string[],
      error: null,
    };
  } catch (error) {
    return {
      ids: [] as string[],
      error: error instanceof Error ? error.message : "Unable to load saves",
    };
  }
}

export async function fetchSavedFeedPosts(userId: string, limit = 60) {
  const { ids, error } = await fetchSavedDistributionIds(userId);
  if (error) return { posts: [] as FeedPost[], error };

  const posts: FeedPost[] = [];
  for (const id of ids.slice(0, limit)) {
    const { post } = await fetchFeedPostById(id);
    if (post) posts.push(post);
  }

  return { posts, error: null };
}
