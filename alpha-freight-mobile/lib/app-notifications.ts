import { AppState, AppStateStatus } from "react-native";
import { presentLocalNotification, setBadgeCountAsync } from "@/lib/push-notifications";
import { fetchUnreadNotificationCount } from "@/lib/user-notifications";
import { LAUNCH_FEATURES } from "@/lib/launch-config";
import { supabase } from "@/lib/supabase";

export type AppAlertPayload = {
  type: string;
  title: string;
  body: string;
  route?: string;
  data?: Record<string, unknown>;
};

const seenAlertKeys = new Set<string>();
const activeChannels = new Map<string, ReturnType<typeof supabase.channel>>();
let feedPollTimer: ReturnType<typeof setInterval> | null = null;
let feedPollSeeded = false;
let feedAppStateSub: { remove: () => void } | null = null;
const knownFeedNotificationIds = new Set<string>();
let alertsUserId: string | null = null;
let alertsSessionStartedAt = 0;

function alertKey(type: string, id: string) {
  return `${type}:${id}`;
}

function rememberAlert(type: string, id: string) {
  const key = alertKey(type, id);
  if (seenAlertKeys.has(key)) return false;
  seenAlertKeys.add(key);
  if (seenAlertKeys.size > 400) {
    const first = seenAlertKeys.values().next().value;
    if (first) seenAlertKeys.delete(first);
  }
  return true;
}

export async function showAppNotification(payload: AppAlertPayload, dedupeId: string) {
  if (!rememberAlert(payload.type, dedupeId)) return;

  await presentLocalNotification({
    title: payload.title,
    body: payload.body,
    data: {
      type: payload.type,
      route: payload.route,
      ...(payload.data ?? {}),
    },
  });

  try {
    const unread = await fetchUnreadNotificationCount();
    await setBadgeCountAsync(unread);
  } catch {
    // badge optional
  }
}

function feedRowToPayload(row: Record<string, unknown>): AppAlertPayload {
  const notificationType = String(row.notification_type || "follow");
  const type =
    notificationType === "like"
      ? "feed_like"
      : notificationType === "reply"
        ? "feed_reply"
        : "feed_follow";
  const href = typeof row.href === "string" ? row.href : undefined;
  const postId =
    href?.includes("/feed-post/") ? href.split("/feed-post/")[1]?.split(/[?#]/)[0] : undefined;

  const defaultBody =
    type === "feed_like"
      ? "liked your post"
      : type === "feed_reply"
        ? "commented on your post"
        : "started following you";

  return {
    type,
    title: String(row.actor_name || "Alpha Freight"),
    body: String(row.message || defaultBody),
    route:
      (type === "feed_like" || type === "feed_reply") && postId
        ? `/feed-post/${postId}`
        : "/feed-profile",
    data: {
      profileKey: row.actor_profile_key,
      name: row.actor_name,
      role: row.actor_role,
      avatarSrc: row.actor_avatar,
      authorId: row.actor_id,
      postId,
    },
  };
}

function userRowToPayload(row: Record<string, unknown>): AppAlertPayload {
  const type = String(row.type || "system");
  const data =
    typeof row.data === "object" && row.data !== null
      ? (row.data as Record<string, unknown>)
      : {};

  return {
    type,
    title: String(row.title || "Alpha Freight"),
    body: String(row.body || ""),
    route: typeof data.route === "string" ? data.route : undefined,
    data,
  };
}

function handleFeedNotificationRow(row: Record<string, unknown>) {
  const id = String(row.id || `${row.notification_type}-${Date.now()}`);
  knownFeedNotificationIds.add(id);
  void showAppNotification(feedRowToPayload(row), id);
}

function handleUserNotificationRow(row: Record<string, unknown>) {
  const type = String(row.type || "system");
  const id = String(row.id || `${type}-${Date.now()}`);
  void showAppNotification(userRowToPayload(row), `inbox-${id}`);
}

async function pollFeedNotifications(userId: string) {
  const { data, error } = await supabase
    .from("feed_notifications")
    .select(
      "id, recipient_id, actor_name, actor_avatar, actor_role, actor_profile_key, actor_id, notification_type, message, href, created_at"
    )
    .eq("recipient_id", userId)
    .in("notification_type", ["follow", "like", "reply"])
    .order("created_at", { ascending: false })
    .limit(20);

  if (error) {
    if (__DEV__) console.warn("[app-notifications] feed poll failed:", error.message);
    return;
  }

  const rows = data ?? [];

  if (!feedPollSeeded) {
    const seedCutoff = alertsSessionStartedAt || Date.now();
    for (const row of rows) {
      const id = String(row.id);
      const createdAt = new Date(String(row.created_at || 0)).getTime();
      if (!Number.isFinite(createdAt) || createdAt < seedCutoff - 3000) {
        knownFeedNotificationIds.add(id);
        continue;
      }
      handleFeedNotificationRow(row as Record<string, unknown>);
    }
    feedPollSeeded = true;
    return;
  }

  for (const row of rows) {
    const id = String(row.id);
    if (knownFeedNotificationIds.has(id)) continue;
    handleFeedNotificationRow(row as Record<string, unknown>);
  }
}

function startFeedNotificationPolling(userId: string) {
  if (!LAUNCH_FEATURES.socialFeed) return;

  stopFeedNotificationPolling();
  feedPollSeeded = false;
  knownFeedNotificationIds.clear();
  alertsSessionStartedAt = Date.now();

  void pollFeedNotifications(userId);
  feedPollTimer = setInterval(() => {
    void pollFeedNotifications(userId);
  }, 8000);

  feedAppStateSub = AppState.addEventListener("change", (state: AppStateStatus) => {
    if (state === "active") {
      void pollFeedNotifications(userId);
    }
  });
}

function stopFeedNotificationPolling() {
  if (feedPollTimer) {
    clearInterval(feedPollTimer);
    feedPollTimer = null;
  }
  feedAppStateSub?.remove();
  feedAppStateSub = null;
  feedPollSeeded = false;
  knownFeedNotificationIds.clear();
}

/** Same delivery path as load alerts — local notification + realtime + polling. */
export function startAppNotificationAlerts(userId: string) {
  if (alertsUserId === userId && activeChannels.has(userId)) return;

  stopAppNotificationAlerts();
  alertsUserId = userId;
  startFeedNotificationPolling(userId);

  const channel = supabase.channel(`app-notifications-${userId}`).on(
    "postgres_changes",
    {
      event: "INSERT",
      schema: "public",
      table: "user_notifications",
      filter: `user_id=eq.${userId}`,
    },
    (payload) => {
      handleUserNotificationRow(payload.new as Record<string, unknown>);
    }
  );

  if (LAUNCH_FEATURES.socialFeed) {
    channel.on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "feed_notifications",
        filter: `recipient_id=eq.${userId}`,
      },
      (payload) => {
        handleFeedNotificationRow(payload.new as Record<string, unknown>);
      }
    );
  }

  channel.subscribe((status) => {
    if (__DEV__) {
      console.log("[app-notifications] channel status:", status);
    }
  });

  activeChannels.set(userId, channel);
}

export function stopAppNotificationAlerts() {
  alertsUserId = null;
  stopFeedNotificationPolling();

  for (const [userId, channel] of activeChannels.entries()) {
    void supabase.removeChannel(channel);
    activeChannels.delete(userId);
  }
}
