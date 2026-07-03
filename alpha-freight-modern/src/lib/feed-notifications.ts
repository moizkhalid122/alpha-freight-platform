import { supabase } from "@/lib/supabase";

export type PersistFeedNotificationInput = {
  recipientId: string;
  recipientProfileKey?: string;
  actorId: string;
  actorName: string;
  actorAvatar?: string;
  actorRole: "carrier" | "supplier";
  actorProfileKey?: string;
  href?: string;
  message?: string;
  notificationType?: "follow" | "like" | "reply" | "mention";
};

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
  created_at?: string | null;
};

const isMissingTableError = (message: string) =>
  /feed_notifications|schema cache|relation.*does not exist|could not find the table/i.test(message);

export async function resolveProfileIdByIdentityKey(
  profileIdentityKey?: string,
  displayName?: string
): Promise<string | null> {
  const normalizedKey = profileIdentityKey?.trim().toLowerCase() || "";
  const normalizedName = displayName?.trim() || "";

  if (normalizedKey.includes("@")) {
    const { data, error } = await supabase
      .from("profiles")
      .select("id")
      .ilike("email", normalizedKey)
      .limit(1)
      .maybeSingle();

    if (!error && data?.id) {
      return data.id;
    }
  }

  if (normalizedName) {
    const { data: byCompany, error: companyError } = await supabase
      .from("profiles")
      .select("id")
      .ilike("company_name", normalizedName)
      .limit(1)
      .maybeSingle();

    if (!companyError && byCompany?.id) {
      return byCompany.id;
    }

    const { data: byFullName, error: fullNameError } = await supabase
      .from("profiles")
      .select("id")
      .ilike("full_name", normalizedName)
      .limit(1)
      .maybeSingle();

    if (!fullNameError && byFullName?.id) {
      return byFullName.id;
    }
  }

  if (normalizedKey && !normalizedKey.includes("@")) {
    const slugLikeName = normalizedKey.replace(/-/g, " ");
    const { data: bySlugName, error: slugError } = await supabase
      .from("profiles")
      .select("id, company_name, full_name")
      .limit(20);

    if (!slugError && bySlugName?.length) {
      const match = bySlugName.find((profile) => {
        const company = profile.company_name?.trim().toLowerCase().replace(/[^a-z0-9._-]+/g, "-") || "";
        const fullName = profile.full_name?.trim().toLowerCase().replace(/[^a-z0-9._-]+/g, "-") || "";
        return company === normalizedKey || fullName === normalizedKey || company.includes(slugLikeName);
      });

      if (match?.id) {
        return match.id;
      }
    }
  }

  return null;
}

export async function resolveRecipientProfileId({
  profileId,
  profileIdentityKey,
  displayName,
}: {
  profileId?: string;
  profileIdentityKey?: string;
  displayName?: string;
}) {
  const directId = profileId?.trim();
  if (directId) {
    return directId;
  }

  return resolveProfileIdByIdentityKey(profileIdentityKey, displayName);
}

export async function persistFeedNotificationToSupabase(input: PersistFeedNotificationInput) {
  if (!input.recipientId?.trim() || !input.actorId?.trim()) {
    return { ok: false as const, error: "Missing recipient or actor id" };
  }

  const notificationType = input.notificationType || "follow";
  const defaultMessage =
    notificationType === "like"
      ? "liked your post"
      : notificationType === "reply"
        ? "replied to your post"
        : notificationType === "mention"
          ? "mentioned you"
          : "started following you";

  try {
    const { error } = await supabase.from("feed_notifications").insert([
      {
        recipient_id: input.recipientId.trim(),
        recipient_profile_key: input.recipientProfileKey || null,
        actor_id: input.actorId.trim(),
        actor_name: input.actorName,
        actor_avatar: input.actorAvatar || null,
        actor_role: input.actorRole,
        actor_profile_key: input.actorProfileKey || null,
        notification_type: notificationType,
        message: input.message || defaultMessage,
        href: input.href || null,
      },
    ]);

    if (error) {
      if (isMissingTableError(error.message)) {
        console.warn(
          "[feed-notifications] Table missing. Run feed-notifications.sql in Supabase SQL editor for cross-browser notifications."
        );
      }

      return { ok: false as const, error: error.message };
    }

    return { ok: true as const };
  } catch (error) {
    return {
      ok: false as const,
      error: error instanceof Error ? error.message : "Unable to save notification",
    };
  }
}

export async function persistFollowNotificationToSupabase(input: PersistFeedNotificationInput) {
  return persistFeedNotificationToSupabase({ ...input, notificationType: "follow" });
}

export async function fetchFeedNotificationsFromSupabase(recipientId: string) {
  if (!recipientId?.trim()) {
    return { data: [] as FeedNotificationRow[], error: null as string | null };
  }

  try {
    const { data, error } = await supabase
      .from("feed_notifications")
      .select("*")
      .eq("recipient_id", recipientId.trim())
      .order("created_at", { ascending: false })
      .limit(100);

    if (error) {
      if (isMissingTableError(error.message)) {
        console.warn(
          "[feed-notifications] Table missing. Run feed-notifications.sql in Supabase SQL editor for cross-browser notifications."
        );
      }

      return { data: [] as FeedNotificationRow[], error: error.message };
    }

    return { data: (data || []) as FeedNotificationRow[], error: null as string | null };
  } catch (error) {
    return {
      data: [] as FeedNotificationRow[],
      error: error instanceof Error ? error.message : "Unable to load notifications",
    };
  }
}

export async function fetchFollowNotificationsFromSupabase(recipientId: string) {
  const { data, error } = await fetchFeedNotificationsFromSupabase(recipientId);

  return {
    data: data.filter((row) => row.notification_type === "follow"),
    error,
  };
}
