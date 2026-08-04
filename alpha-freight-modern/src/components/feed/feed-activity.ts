import { readStoredCollection, writeStoredCollection } from "./feed-storage";

export type FeedActivityType = "like" | "reply" | "follow" | "mention";

export type FeedActivityItem = {
  id: string;
  type: FeedActivityType;
  actor: string;
  actorAvatar: string;
  message: string;
  time: string;
  createdAt: string;
  direction?: "incoming" | "outgoing";
  postIndex?: number;
  href?: string;
  targetProfileKey?: string;
  targetName?: string;
  actorProfileKey?: string;
  actorProfileId?: string;
  actorRole?: "carrier" | "supplier";
  targetDistributionId?: string;
};

const MAX_ACTIVITY_ITEMS = 100;

export const getFeedActivityStorageKey = (role: "carrier" | "supplier", userEmail?: string, userId?: string) => {
  const scope = (userEmail || userId || "guest").trim().toLowerCase() || "guest";
  return `alpha-freight:feed-activity:${role}:${scope}`;
};

export const getIncomingActivityStorageKeyByProfileId = (profileId?: string) => {
  const normalizedProfileId = profileId?.trim();
  if (!normalizedProfileId) return "";
  return `alpha-freight:incoming-feed-activity:id:${normalizedProfileId}`;
};

export const getIncomingActivityStorageKeyByIdentity = (profileIdentityKey?: string) => {
  const normalizedIdentityKey = profileIdentityKey?.trim().toLowerCase();
  if (!normalizedIdentityKey) return "";
  return `alpha-freight:incoming-feed-activity:profile:${normalizedIdentityKey}`;
};

export const formatActivityTime = (createdAt: string) => {
  const ageMs = Date.now() - new Date(createdAt).getTime();
  if (!Number.isFinite(ageMs) || ageMs < 0) return "Just now";
  if (ageMs < 60_000) return "Just now";
  if (ageMs < 3_600_000) return `${Math.max(1, Math.floor(ageMs / 60_000))}m ago`;
  if (ageMs < 86_400_000) return `${Math.max(1, Math.floor(ageMs / 3_600_000))}h ago`;
  return `${Math.max(1, Math.floor(ageMs / 86_400_000))}d ago`;
};

export const readFeedActivityItems = (
  role: "carrier" | "supplier",
  userEmail?: string,
  userId?: string
): FeedActivityItem[] => {
  const storageKeys = Array.from(
    new Set(
      [
        getFeedActivityStorageKey(role, userEmail, userId),
        userEmail ? getFeedActivityStorageKey(role, userEmail) : "",
        userId ? getFeedActivityStorageKey(role, undefined, userId) : "",
      ].filter(Boolean)
    )
  );

  const itemMap = new Map<string, FeedActivityItem>();

  storageKeys.forEach((storageKey) => {
    readStoredCollection<FeedActivityItem>(storageKey).forEach((item) => {
      if (!item?.id || !item?.type || !item?.createdAt) return;
      itemMap.set(item.id, { ...item, direction: item.direction || "outgoing" });
    });
  });

  return [...itemMap.values()].sort(
    (left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime()
  );
};

export const readIncomingFeedActivityItems = (
  profileId?: string,
  profileIdentityKey?: string
): FeedActivityItem[] => {
  const storageKeys = [
    getIncomingActivityStorageKeyByProfileId(profileId),
    getIncomingActivityStorageKeyByIdentity(profileIdentityKey),
  ].filter(Boolean);

  const itemMap = new Map<string, FeedActivityItem>();

  storageKeys.forEach((storageKey) => {
    readStoredCollection<FeedActivityItem>(storageKey).forEach((item) => {
      if (!item?.id || !item?.type || !item?.createdAt) return;
      itemMap.set(item.id, { ...item, direction: "incoming" });
    });
  });

  return [...itemMap.values()].sort(
    (left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime()
  );
};

export const readCombinedFeedActivityItems = ({
  role,
  userEmail,
  profileId,
  profileIdentityKey,
}: {
  role: "carrier" | "supplier";
  userEmail?: string;
  profileId?: string;
  profileIdentityKey?: string;
}) => {
  const itemMap = new Map<string, FeedActivityItem>();

  readFeedActivityItems(role, userEmail, profileId).forEach((item) => {
    itemMap.set(item.id, item);
  });

  readIncomingFeedActivityItems(profileId, profileIdentityKey).forEach((item) => {
    itemMap.set(item.id, item);
  });

  followEventsToActivityItems(
    readFollowEventsForRecipient(profileId, profileIdentityKey, userEmail)
  ).forEach((item) => {
    itemMap.set(item.id, item);
  });

  return [...itemMap.values()].sort(
    (left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime()
  );
};

export async function loadCombinedFeedActivityItems({
  role,
  userEmail,
  profileId,
  profileIdentityKey,
}: {
  role: "carrier" | "supplier";
  userEmail?: string;
  profileId?: string;
  profileIdentityKey?: string;
}) {
  const itemMap = new Map<string, FeedActivityItem>();

  readCombinedFeedActivityItems({ role, userEmail, profileId, profileIdentityKey }).forEach((item) => {
    itemMap.set(item.id, item);
  });

  if (profileId) {
    try {
      const { fetchFeedNotificationsFromSupabase } = await import("@/lib/feed-notifications");
      const { data: remoteNotifications, error: remoteError } =
        await fetchFeedNotificationsFromSupabase(profileId);

      if (remoteError && process.env.NODE_ENV === "development") {
        console.warn("[feed-activity] Supabase feed notifications:", remoteError);
      }

      remoteNotifications.forEach((notification) => {
        const createdAt = notification.created_at || new Date().toISOString();
        const notificationType = (notification.notification_type || "follow") as FeedActivityType;
        const defaultMessage =
          notificationType === "like"
            ? "liked your post"
            : notificationType === "reply"
              ? "replied to your post"
              : notificationType === "mention"
                ? "mentioned you"
                : "started following you";

        itemMap.set(`remote-${notification.id}`, {
          id: `remote-${notification.id}`,
          type: notificationType,
          actor: notification.actor_name || "Someone",
          actorAvatar: notification.actor_avatar || "/default-avatar-square.png",
          message: notification.message || defaultMessage,
          time: formatActivityTime(createdAt),
          createdAt,
          direction: "incoming",
          href: notification.href || undefined,
          actorProfileKey: notification.actor_profile_key || undefined,
          actorProfileId: notification.actor_id || undefined,
          actorRole: notification.actor_role === "supplier" ? "supplier" : "carrier",
          targetProfileKey: notification.recipient_profile_key || undefined,
        });
      });
    } catch {
      // Supabase table may not exist yet; local activity still works.
    }
  }

  return [...itemMap.values()].sort(
    (left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime()
  );
}

export type FollowEventRecord = {
  id: string;
  targetProfileId: string;
  targetProfileIdentityKey: string;
  actorProfileId: string;
  actorProfileKey: string;
  actorName: string;
  actorAvatar: string;
  actorRole: "carrier" | "supplier";
  href: string;
  createdAt: string;
};

const GLOBAL_FOLLOW_EVENTS_KEY = "alpha-freight:global-follow-events";

export const getGlobalFollowEventsStorageKey = () => GLOBAL_FOLLOW_EVENTS_KEY;

export const recordFollowEvent = (
  event: Omit<FollowEventRecord, "id" | "createdAt"> & { id?: string; createdAt?: string }
) => {
  const nextEvent: FollowEventRecord = {
    ...event,
    id: event.id || `follow-event-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    createdAt: event.createdAt || new Date().toISOString(),
  };

  const current = readStoredCollection<FollowEventRecord>(GLOBAL_FOLLOW_EVENTS_KEY);
  const filtered = current.filter(
    (existing) =>
      !(
        existing.targetProfileId === nextEvent.targetProfileId &&
        existing.actorProfileKey === nextEvent.actorProfileKey
      ) &&
      !(
        existing.targetProfileIdentityKey === nextEvent.targetProfileIdentityKey &&
        existing.actorProfileKey === nextEvent.actorProfileKey
      )
  );

  writeStoredCollection(GLOBAL_FOLLOW_EVENTS_KEY, [nextEvent, ...filtered].slice(0, 200));
  dispatchActivityUpdated();
};

export const removeFollowEvent = (
  targetProfileId: string | undefined,
  targetProfileIdentityKey: string | undefined,
  actorProfileKey: string
) => {
  const normalizedActorKey = actorProfileKey.trim().toLowerCase();
  const current = readStoredCollection<FollowEventRecord>(GLOBAL_FOLLOW_EVENTS_KEY);
  const nextEvents = current.filter((event) => {
    const matchesTarget =
      (targetProfileId && event.targetProfileId === targetProfileId) ||
      (targetProfileIdentityKey &&
        event.targetProfileIdentityKey.trim().toLowerCase() === targetProfileIdentityKey.trim().toLowerCase());

    if (!matchesTarget) return true;

    return event.actorProfileKey.trim().toLowerCase() !== normalizedActorKey;
  });

  writeStoredCollection(GLOBAL_FOLLOW_EVENTS_KEY, nextEvents);
  dispatchActivityUpdated();
};

export const readFollowEventsForRecipient = (
  profileId?: string,
  ...identityKeys: Array<string | undefined>
) => {
  const normalizedTargets = new Set(
    [profileId, ...identityKeys]
      .map((value) => value?.trim().toLowerCase())
      .filter(Boolean) as string[]
  );

  return readStoredCollection<FollowEventRecord>(GLOBAL_FOLLOW_EVENTS_KEY).filter((event) => {
    const targetProfileId = event.targetProfileId?.trim().toLowerCase();
    const targetProfileIdentityKey = event.targetProfileIdentityKey?.trim().toLowerCase();

    return (
      (targetProfileId && normalizedTargets.has(targetProfileId)) ||
      (targetProfileIdentityKey && normalizedTargets.has(targetProfileIdentityKey))
    );
  });
};

export const followEventsToActivityItems = (events: FollowEventRecord[]): FeedActivityItem[] =>
  events.map((event) => ({
    id: event.id,
    type: "follow",
    actor: event.actorName,
    actorAvatar: event.actorAvatar || "/default-avatar-square.png",
    message: "started following you",
    time: formatActivityTime(event.createdAt),
    createdAt: event.createdAt,
    direction: "incoming",
    href: event.href,
    actorProfileKey: event.actorProfileKey,
    actorProfileId: event.actorProfileId,
    actorRole: event.actorRole,
    targetProfileKey: event.targetProfileIdentityKey,
  }));

export const isIncomingFollowActivity = (item: FeedActivityItem) =>
  item.type === "follow" &&
  (item.direction === "incoming" || item.message.trim().toLowerCase().includes("following you"));

export const isOutgoingFollowActivity = (item: FeedActivityItem) =>
  item.type === "follow" &&
  (item.direction === "outgoing" || item.actor.trim().toLowerCase() === "you");

export const getActivityLastSeenStorageKey = (
  role: "carrier" | "supplier",
  userEmail?: string,
  userId?: string
) => {
  const scope = (userId || userEmail || "guest").trim().toLowerCase() || "guest";
  return `alpha-freight:feed-activity-last-seen:${role}:${scope}`;
};

export const readActivityLastSeenAt = (
  role: "carrier" | "supplier",
  userEmail?: string,
  userId?: string
) => {
  if (typeof window === "undefined") return null;

  const storageKey = getActivityLastSeenStorageKey(role, userEmail, userId);
  const storedValue = window.localStorage.getItem(storageKey)?.trim();
  return storedValue || null;
};

export const writeActivityLastSeenAt = (
  role: "carrier" | "supplier",
  userEmail: string | undefined,
  userId: string | undefined,
  seenAt: string
) => {
  if (typeof window === "undefined") return;

  const storageKey = getActivityLastSeenStorageKey(role, userEmail, userId);
  window.localStorage.setItem(storageKey, seenAt);
  window.dispatchEvent(new CustomEvent("alpha_feed_activity_seen"));
};

export const markActivityAsSeen = (
  role: "carrier" | "supplier",
  userEmail?: string,
  userId?: string,
  seenAt?: string
) => {
  writeActivityLastSeenAt(role, userEmail, userId, seenAt || new Date().toISOString());
};

export const isIncomingLikeActivity = (item: FeedActivityItem) =>
  item.type === "like" &&
  (item.direction === "incoming" ||
    item.message.trim().toLowerCase().includes("your post") ||
    item.message.trim().toLowerCase().includes("your reel"));

export const isIncomingReplyActivity = (item: FeedActivityItem) =>
  item.type === "reply" &&
  (item.direction === "incoming" || item.message.trim().toLowerCase().includes("your post"));

export const isNotificationActivityItem = (item: FeedActivityItem) => {
  if (isIncomingFollowActivity(item)) return true;
  if (isIncomingLikeActivity(item)) return true;
  if (isIncomingReplyActivity(item)) return true;
  if (item.direction === "incoming") return true;
  if (item.actor.trim().toLowerCase() === "you") return false;
  if (isOutgoingFollowActivity(item)) return false;
  return item.type === "mention";
};

export const hasUnreadNotificationActivity = (
  items: FeedActivityItem[],
  lastSeenAt: string | null
) => {
  const notificationItems = items.filter(isNotificationActivityItem);
  if (!notificationItems.length) return false;

  if (!lastSeenAt) return true;

  const lastSeenMs = new Date(lastSeenAt).getTime();
  if (!Number.isFinite(lastSeenMs)) return true;

  return notificationItems.some((item) => {
    const createdAtMs = new Date(item.createdAt).getTime();
    return Number.isFinite(createdAtMs) && createdAtMs > lastSeenMs;
  });
};

const dispatchActivityUpdated = () => {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent("alpha_feed_activity_updated"));
};

export const appendFeedActivityItem = (
  role: "carrier" | "supplier",
  userEmail: string | undefined,
  item: Omit<FeedActivityItem, "id" | "time" | "createdAt"> & {
    id?: string;
    createdAt?: string;
  },
  userId?: string
) => {
  const storageKey = getFeedActivityStorageKey(role, userEmail, userId);
  const current = readFeedActivityItems(role, userEmail, userId);
  const createdAt = item.createdAt || new Date().toISOString();
  const nextItem: FeedActivityItem = {
    ...item,
    direction: "outgoing",
    id: item.id || `activity-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    createdAt,
    time: formatActivityTime(createdAt),
  };

  const filtered = current.filter((existing) => {
    if (item.type === "follow" && existing.type === "follow") {
      if (item.targetProfileKey && existing.targetProfileKey === item.targetProfileKey) {
        return false;
      }
      if (item.href && existing.href === item.href) {
        return false;
      }
    }

    return true;
  });

  writeStoredCollection(storageKey, [nextItem, ...filtered].slice(0, MAX_ACTIVITY_ITEMS));
  dispatchActivityUpdated();
};

export const appendIncomingFeedActivityItem = (
  targetProfileId: string | undefined,
  targetProfileIdentityKey: string | undefined,
  item: Omit<FeedActivityItem, "id" | "time" | "createdAt" | "direction"> & {
    id?: string;
    createdAt?: string;
  }
) => {
  const createdAt = item.createdAt || new Date().toISOString();
  const nextItem: FeedActivityItem = {
    ...item,
    direction: "incoming",
    id: item.id || `incoming-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    createdAt,
    time: formatActivityTime(createdAt),
  };

  const storageKeys = [
    getIncomingActivityStorageKeyByProfileId(targetProfileId),
    getIncomingActivityStorageKeyByIdentity(targetProfileIdentityKey),
  ].filter(Boolean);

  storageKeys.forEach((storageKey) => {
    const current = readStoredCollection<FeedActivityItem>(storageKey);
    const filtered = current.filter((existing) => {
      if (item.type === "follow" && existing.type === "follow") {
        if (item.actorProfileKey && existing.actorProfileKey === item.actorProfileKey) {
          return false;
        }
        if (item.actorProfileId && existing.actorProfileId === item.actorProfileId) {
          return false;
        }
      }

      if (item.type === "like" && existing.type === "like") {
        if (
          item.actorProfileKey &&
          existing.actorProfileKey === item.actorProfileKey &&
          item.targetDistributionId &&
          existing.targetDistributionId === item.targetDistributionId
        ) {
          return false;
        }
      }

      if (item.type === "reply" && existing.type === "reply") {
        if (
          item.actorProfileKey &&
          existing.actorProfileKey === item.actorProfileKey &&
          item.targetDistributionId &&
          existing.targetDistributionId === item.targetDistributionId
        ) {
          return false;
        }
      }

      return true;
    });

    writeStoredCollection(storageKey, [nextItem, ...filtered].slice(0, MAX_ACTIVITY_ITEMS));
  });

  dispatchActivityUpdated();
};

export const removeIncomingFollowActivityItem = (
  targetProfileId: string | undefined,
  targetProfileIdentityKey: string | undefined,
  actorProfileKey?: string,
  actorProfileId?: string
) => {
  const storageKeys = [
    getIncomingActivityStorageKeyByProfileId(targetProfileId),
    getIncomingActivityStorageKeyByIdentity(targetProfileIdentityKey),
  ].filter(Boolean);

  storageKeys.forEach((storageKey) => {
    const current = readStoredCollection<FeedActivityItem>(storageKey);
    const nextItems = current.filter((item) => {
      if (item.type !== "follow") return true;

      if (actorProfileKey && item.actorProfileKey === actorProfileKey) {
        return false;
      }

      if (actorProfileId && item.actorProfileId === actorProfileId) {
        return false;
      }

      return true;
    });

    writeStoredCollection(storageKey, nextItems);
  });

  dispatchActivityUpdated();
};

export const removeFollowActivityItem = (
  role: "carrier" | "supplier",
  userEmail: string | undefined,
  targetProfileKey?: string
) => {
  if (!targetProfileKey?.trim()) return;

  const storageKey = getFeedActivityStorageKey(role, userEmail);
  const normalizedTarget = targetProfileKey.trim().toLowerCase();
  const current = readFeedActivityItems(role, userEmail);
  const nextItems = current.filter(
    (item) => !(item.type === "follow" && item.targetProfileKey?.trim().toLowerCase() === normalizedTarget)
  );

  writeStoredCollection(storageKey, nextItems);
  dispatchActivityUpdated();
};

export const extractMentionHandles = (value: string) => {
  const matches = value.match(/@[a-z0-9._-]+/gi) || [];
  return Array.from(new Set(matches.map((match) => match.trim())));
};
