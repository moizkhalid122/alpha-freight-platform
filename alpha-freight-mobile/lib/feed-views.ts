import { supabase } from "@/lib/supabase";

const trackedPostIds = new Set<string>();

export async function trackFeedPostView(distributionId: string) {
  const postId = distributionId.trim();
  if (!postId || trackedPostIds.has(postId)) return;

  trackedPostIds.add(postId);
  if (trackedPostIds.size > 200) {
    const first = trackedPostIds.values().next().value;
    if (first) trackedPostIds.delete(first);
  }

  try {
    await supabase.rpc("track_feed_post_view", {
      p_distribution_id: postId,
    });
  } catch {
    trackedPostIds.delete(postId);
  }
}
