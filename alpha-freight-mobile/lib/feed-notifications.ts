import { supabase } from "@/lib/supabase";
import type { FeedPost } from "@/lib/feed-posts";
import type { FeedPublisherProfile } from "@/lib/feed-publish";

export type FeedNotificationType = "follow" | "like" | "reply" | "mention";

export type FeedNotificationRow = {
  id: string;
  recipient_id: string;
  recipient_profile_key?: string | null;
  actor_id?: string | null;
  actor_name?: string | null;
  actor_avatar?: string | null;
  actor_role?: string | null;
  actor_profile_key?: string | null;
  notification_type?: string | null;
  message?: string | null;
  href?: string | null;
  read_at?: string | null;
  created_at?: string | null;
};

export type FeedInboxNotification = {
  id: string;
  source: "feed";
  type: "feed_follow" | "feed_like" | "feed_reply";
  title: string;
  body: string;
  readAt: string | null;
  createdAt: string;
  actorName: string;
  actorAvatar?: string;
  actorProfileKey?: string;
  actorId?: string;
  actorRole?: string;
  postId?: string;
  viewerRole?: "carrier" | "supplier";
};

const isMissingTableError = (message: string) =>
  /feed_notifications|schema cache|relation.*does not exist|could not find the table/i.test(message);

export async function resolveFeedRecipientUserId(profileKey: string, profileId?: string) {
  const directId = profileId?.trim();
  if (directId) return directId;

  const normalizedKey = profileKey.trim().toLowerCase();
  if (!normalizedKey) return null;

  try {
    const { data } = await supabase
      .from("feed_posts")
      .select("author_id")
      .eq("author_profile_key", normalizedKey)
      .order("published_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (data?.author_id?.trim()) {
      return data.author_id.trim();
    }

    if (normalizedKey.includes("@")) {
      const { data: profileRow } = await supabase
        .from("profiles")
        .select("id")
        .ilike("company_name", normalizedKey.replace(/@.*/, ""))
        .limit(1)
        .maybeSingle();
      if (profileRow?.id) return profileRow.id;
    }
  } catch {
    // fall through
  }

  return null;
}

export async function persistFeedNotification(input: {
  recipientId: string;
  recipientProfileKey?: string;
  actorId: string;
  actorName: string;
  actorAvatar?: string;
  actorRole: "carrier" | "supplier";
  actorProfileKey?: string;
  notificationType: FeedNotificationType;
  message?: string;
  href?: string;
}) {
  if (!input.recipientId.trim() || !input.actorId.trim()) {
    return { ok: false as const, error: "Missing recipient or actor id" };
  }

  if (input.recipientId.trim() === input.actorId.trim()) {
    return { ok: true as const };
  }

  const defaultMessage =
    input.notificationType === "like"
      ? "liked your post"
      : input.notificationType === "reply"
        ? "replied to your post"
        : input.notificationType === "mention"
          ? "mentioned you"
          : "started following you";

  try {
    const { data, error } = await supabase
      .from("feed_notifications")
      .insert([
        {
          recipient_id: input.recipientId.trim(),
          recipient_profile_key: input.recipientProfileKey?.trim().toLowerCase() || null,
          actor_id: input.actorId.trim(),
          actor_name: input.actorName,
          actor_avatar: input.actorAvatar || null,
          actor_role: input.actorRole,
          actor_profile_key: input.actorProfileKey?.trim().toLowerCase() || null,
          notification_type: input.notificationType,
          message: input.message || defaultMessage,
          href: input.href || null,
        },
      ])
      .select("id")
      .single();

    if (error) {
      if (isMissingTableError(error.message)) {
        if (__DEV__) {
          console.warn("[feed-notifications] Run feed-notifications.sql in Supabase.");
        }
        return { ok: false as const, error: "Feed notifications are not set up yet." };
      }
      if (__DEV__) {
        console.warn("[feed-notifications] insert failed:", error.message);
      }
      return { ok: false as const, error: error.message };
    }

    return { ok: true as const, notificationId: data?.id };
  } catch (error) {
    return {
      ok: false as const,
      error: error instanceof Error ? error.message : "Unable to save notification",
    };
  }
}

export async function notifyFeedFollow(input: {
  recipientId?: string;
  recipientProfileKey: string;
  actor: Pick<FeedPublisherProfile, "userId" | "name" | "avatar" | "role" | "profileKey">;
}) {
  const recipientId =
    input.recipientId?.trim() ||
    (await resolveFeedRecipientUserId(input.recipientProfileKey, input.recipientId));

  if (!recipientId) {
    if (__DEV__) {
      console.warn("[feed-notifications] follow notify skipped: missing recipient id");
    }
    return { ok: false as const, error: "Missing recipient profile id" };
  }

  return persistFeedNotification({
    recipientId,
    recipientProfileKey: input.recipientProfileKey,
    actorId: input.actor.userId,
    actorName: input.actor.name,
    actorAvatar: input.actor.avatar,
    actorRole: input.actor.role,
    actorProfileKey: input.actor.profileKey,
    notificationType: "follow",
  });
}

export async function notifyFeedPostLike(input: {
  post: Pick<FeedPost, "id" | "authorId" | "authorProfileKey">;
  actor: Pick<FeedPublisherProfile, "userId" | "name" | "avatar" | "role" | "profileKey">;
}) {
  if (!input.post.authorId?.trim() || input.post.authorId === input.actor.userId) {
    return { ok: true as const };
  }

  return persistFeedNotification({
    recipientId: input.post.authorId,
    recipientProfileKey: input.post.authorProfileKey,
    actorId: input.actor.userId,
    actorName: input.actor.name,
    actorAvatar: input.actor.avatar,
    actorRole: input.actor.role,
    actorProfileKey: input.actor.profileKey,
    notificationType: "like",
    href: `/feed-post/${input.post.id}`,
  });
}

function mapFeedRow(row: FeedNotificationRow, viewerRole: "carrier" | "supplier"): FeedInboxNotification {
  const notificationType = row.notification_type || "follow";
  const type =
    notificationType === "like"
      ? "feed_like"
      : notificationType === "reply"
        ? "feed_reply"
        : "feed_follow";
  const postId =
    (type === "feed_like" || type === "feed_reply") && row.href?.includes("/feed-post/")
      ? row.href.split("/feed-post/")[1]?.split(/[?#]/)[0]
      : undefined;

  const defaultBody =
    type === "feed_like"
      ? "liked your post"
      : type === "feed_reply"
        ? "commented on your post"
        : "started following you";

  return {
    id: row.id,
    source: "feed",
    type,
    title: row.actor_name || "Alpha Freight",
    body: row.message || defaultBody,
    readAt: row.read_at ?? null,
    createdAt: row.created_at || new Date().toISOString(),
    actorName: row.actor_name || "Someone",
    actorAvatar: row.actor_avatar || undefined,
    actorProfileKey: row.actor_profile_key || undefined,
    actorId: row.actor_id || undefined,
    actorRole: row.actor_role || undefined,
    postId,
    viewerRole,
  };
}

export async function fetchFeedInboxNotifications(
  viewerRole: "carrier" | "supplier",
  limit = 40
): Promise<FeedInboxNotification[]> {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return [];

  try {
    const { data, error } = await supabase
      .from("feed_notifications")
      .select("*")
      .eq("recipient_id", user.id)
      .in("notification_type", ["follow", "like", "reply"])
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) {
      if (isMissingTableError(error.message)) return [];
      throw error;
    }

    return ((data || []) as FeedNotificationRow[]).map((row) => mapFeedRow(row, viewerRole));
  } catch {
    return [];
  }
}

export async function fetchUnreadFeedNotificationCount() {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return 0;

  try {
    const { count, error } = await supabase
      .from("feed_notifications")
      .select("id", { count: "exact", head: true })
      .eq("recipient_id", user.id)
      .in("notification_type", ["follow", "like", "reply"])
      .is("read_at", null);

    if (error) {
      if (isMissingTableError(error.message)) return 0;
      return 0;
    }

    return count ?? 0;
  } catch {
    return 0;
  }
}

export async function markFeedNotificationRead(notificationId: string) {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return;

  await supabase
    .from("feed_notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("id", notificationId)
    .eq("recipient_id", user.id);
}

export async function markAllFeedNotificationsRead() {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return;

  await supabase
    .from("feed_notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("recipient_id", user.id)
    .is("read_at", null);
}

export function subscribeToFeedNotifications(userId: string, onChange: () => void) {
  const channel = supabase
    .channel(`feed-notifications-${userId}`)
    .on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "feed_notifications",
        filter: `recipient_id=eq.${userId}`,
      },
      () => onChange()
    )
    .subscribe();

  return () => {
    void supabase.removeChannel(channel);
  };
}
