import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { setBadgeCountAsync } from "@/lib/push-notifications";
import {
  fetchUnreadFeedNotificationCount,
  subscribeToFeedNotifications,
} from "@/lib/feed-notifications";

export type UserNotification = {
  id: string;
  type: string;
  title: string;
  body: string;
  data: Record<string, unknown>;
  readAt: string | null;
  createdAt: string;
};

function mapRow(row: {
  id: string;
  type: string;
  title: string;
  body: string;
  data: unknown;
  read_at: string | null;
  created_at: string;
}): UserNotification {
  return {
    id: row.id,
    type: row.type,
    title: row.title,
    body: row.body,
    data: typeof row.data === "object" && row.data !== null ? (row.data as Record<string, unknown>) : {},
    readAt: row.read_at,
    createdAt: row.created_at,
  };
}

export async function fetchUserNotifications(limit = 30): Promise<UserNotification[]> {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return [];

  const { data, error } = await supabase
    .from("user_notifications")
    .select("id, type, title, body, data, read_at, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    if (/relation .* does not exist|schema cache/i.test(error.message)) return [];
    throw error;
  }

  return (data ?? []).map(mapRow);
}

export async function fetchUnreadNotificationCount(): Promise<number> {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return 0;

  const [inboxCount, feedCount] = await Promise.all([
    (async () => {
      const { count, error } = await supabase
        .from("user_notifications")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id)
        .is("read_at", null);

      if (error) {
        if (/relation .* does not exist|schema cache/i.test(error.message)) return 0;
        throw error;
      }

      return count ?? 0;
    })(),
    fetchUnreadFeedNotificationCount(),
  ]);

  return inboxCount + feedCount;
}

export async function markNotificationRead(notificationId: string) {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return;

  await supabase
    .from("user_notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("id", notificationId)
    .eq("user_id", user.id);
}

export async function markAllNotificationsRead() {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return;

  await supabase
    .from("user_notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("user_id", user.id)
    .is("read_at", null);
}

export function formatNotificationTime(value: string) {
  const date = new Date(value);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMinutes = Math.floor(diffMs / 60000);

  if (diffMinutes < 1) return "Just now";
  if (diffMinutes < 60) return `${diffMinutes}m ago`;
  if (diffMinutes < 1440) return `${Math.floor(diffMinutes / 60)}h ago`;
  return date.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

const activeNotificationChannels = new Map<string, ReturnType<typeof supabase.channel>>();

export function subscribeToUserNotifications(userId: string, onChange: () => void) {
  const channelName = `user-notifications-${userId}`;

  const existing = activeNotificationChannels.get(userId);
  if (existing) {
    void supabase.removeChannel(existing);
    activeNotificationChannels.delete(userId);
  }

  const channel = supabase
    .channel(channelName)
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "user_notifications",
        filter: `user_id=eq.${userId}`,
      },
      () => onChange()
    )
    .subscribe();

  activeNotificationChannels.set(userId, channel);

  return () => {
    void supabase.removeChannel(channel);
    activeNotificationChannels.delete(userId);
  };
}

export function useUnreadNotificationCount() {
  const [count, setCount] = useState(0);

  const refresh = useCallback(async () => {
    const unread = await fetchUnreadNotificationCount();
    setCount(unread);
    await setBadgeCountAsync(unread);
  }, []);

  useEffect(() => {
    void refresh();

    let unsubscribeInbox: (() => void) | undefined;
    let unsubscribeFeed: (() => void) | undefined;

    void (async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;
      unsubscribeInbox = subscribeToUserNotifications(user.id, () => {
        void refresh();
      });
      unsubscribeFeed = subscribeToFeedNotifications(user.id, () => {
        void refresh();
      });
    })();

    return () => {
      unsubscribeInbox?.();
      unsubscribeFeed?.();
    };
  }, [refresh]);

  return { count, refresh };
}
