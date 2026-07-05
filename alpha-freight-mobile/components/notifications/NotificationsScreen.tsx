import { useCallback, useEffect, useState } from "react";
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from "react-native";
import LottieView from "lottie-react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  fetchUnreadNotificationCount,
  fetchUserNotifications,
  formatNotificationTime,
  markAllNotificationsRead,
  markNotificationRead,
  subscribeToUserNotifications,
  type UserNotification,
} from "@/lib/user-notifications";
import { initializePushNotifications, setBadgeCountAsync } from "@/lib/push-notifications";
import { supabase } from "@/lib/supabase";
import { colors, radius, spacing } from "@/lib/theme";
import {
  isCarrierVerifiedNotification,
  showVerifiedCelebration,
} from "@/lib/verified-celebration";

function iconForType(type: string): keyof typeof Ionicons.glyphMap {
  if (type === "carrier_verified") return "shield-checkmark-outline";
  return "notifications-outline";
}

function VerifiedNotificationCard({
  item,
  onPress,
}: {
  item: UserNotification;
  onPress: () => void;
}) {
  const unread = !item.readAt;

  return (
    <Pressable
      style={({ pressed }) => [
        styles.card,
        styles.verifiedCard,
        unread && styles.cardUnread,
        pressed && styles.pressed,
      ]}
      onPress={onPress}
    >
      <View style={[styles.iconWrap, styles.verifiedIconWrap, unread && styles.iconWrapUnread]}>
        <Ionicons name="shield-checkmark" size={18} color={colors.ink} />
      </View>
      <View style={styles.cardCopy}>
        <View style={styles.cardTop}>
          <Text style={styles.cardTitle}>{item.title}</Text>
          <Text style={styles.cardTime}>{formatNotificationTime(item.createdAt)}</Text>
        </View>
        <Text style={styles.cardBody}>{item.body}</Text>
        <View style={styles.confettiStrip}>
          <LottieView
            source={require("@/assets/lottie/confetti-pop.json")}
            autoPlay
            loop={false}
            resizeMode="cover"
            style={styles.confettiLottie}
          />
        </View>
      </View>
      {unread ? <View style={styles.unreadDot} /> : null}
    </Pressable>
  );
}

function NotificationCard({
  item,
  onPress,
}: {
  item: UserNotification;
  onPress: () => void;
}) {
  const unread = !item.readAt;

  return (
    <Pressable
      style={({ pressed }) => [styles.card, unread && styles.cardUnread, pressed && styles.pressed]}
      onPress={onPress}
    >
      <View style={[styles.iconWrap, unread && styles.iconWrapUnread]}>
        <Ionicons name={iconForType(item.type)} size={18} color={colors.ink} />
      </View>
      <View style={styles.cardCopy}>
        <View style={styles.cardTop}>
          <Text style={styles.cardTitle}>{item.title}</Text>
          <Text style={styles.cardTime}>{formatNotificationTime(item.createdAt)}</Text>
        </View>
        <Text style={styles.cardBody}>{item.body}</Text>
      </View>
      {unread ? <View style={styles.unreadDot} /> : null}
    </Pressable>
  );
}

export default function NotificationsScreen() {
  const [items, setItems] = useState<UserNotification[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const result = await fetchUserNotifications();
      setItems(result);
      const unread = await fetchUnreadNotificationCount();
      await setBadgeCountAsync(unread);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
    void initializePushNotifications();
  }, [load]);

  useEffect(() => {
    let unsubscribe: (() => void) | undefined;

    void (async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;
      unsubscribe = subscribeToUserNotifications(user.id, () => {
        void load();
      });
    })();

    return () => unsubscribe?.();
  }, [load]);

  const handleOpen = useCallback(async (item: UserNotification) => {
    if (!item.readAt) {
      await markNotificationRead(item.id);
    }

    if (isCarrierVerifiedNotification(item.type)) {
      showVerifiedCelebration({
        title: item.title,
        body: item.body,
        onClose: () => {
          const route = typeof item.data.route === "string" ? item.data.route : null;
          if (route) {
            router.push(route as never);
          } else {
            void load();
          }
        },
      });
      void load();
      return;
    }

    const route = typeof item.data.route === "string" ? item.data.route : null;
    if (route) {
      router.push(route as never);
      return;
    }

    void load();
  }, [load]);

  const handleMarkAllRead = useCallback(async () => {
    await markAllNotificationsRead();
    await setBadgeCountAsync(0);
    void load();
  }, [load]);

  return (
    <View style={styles.root}>
      <SafeAreaView style={styles.safe} edges={["top"]}>
        <View style={styles.header}>
          <Pressable style={styles.backBtn} onPress={() => router.back()} hitSlop={12}>
            <Ionicons name="chevron-back" size={22} color={colors.ink} />
          </Pressable>
          <Text style={styles.title}>Notifications</Text>
          <Pressable style={styles.markBtn} onPress={() => void handleMarkAllRead()} hitSlop={8}>
            <Text style={styles.markText}>Mark all read</Text>
          </Pressable>
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          refreshControl={<RefreshControl refreshing={loading} onRefresh={() => void load()} />}
          showsVerticalScrollIndicator={false}
        >
          {items.length ? (
            items.map((item) =>
              isCarrierVerifiedNotification(item.type) ? (
                <VerifiedNotificationCard
                  key={item.id}
                  item={item}
                  onPress={() => void handleOpen(item)}
                />
              ) : (
                <NotificationCard key={item.id} item={item} onPress={() => void handleOpen(item)} />
              )
            )
          ) : (
            <View style={styles.empty}>
              <View style={styles.emptyIcon}>
                <Ionicons name="notifications-off-outline" size={28} color={colors.muted} />
              </View>
              <Text style={styles.emptyTitle}>No notifications yet</Text>
              <Text style={styles.emptySub}>
                We'll notify you here when your account is verified or when important updates arrive.
              </Text>
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.white,
  },
  safe: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    gap: 8,
  },
  backBtn: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    flex: 1,
    fontSize: 24,
    fontWeight: "800",
    color: colors.ink,
    letterSpacing: -0.5,
  },
  markBtn: {
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  markText: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.ink,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
    gap: 10,
  },
  card: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    padding: 14,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.white,
  },
  cardUnread: {
    backgroundColor: colors.canvas,
    borderColor: "#DCE3EA",
  },
  verifiedCard: {
    borderColor: colors.ink,
    overflow: "hidden",
  },
  verifiedIconWrap: {
    backgroundColor: colors.brand,
    borderWidth: 1,
    borderColor: colors.ink,
  },
  confettiStrip: {
    height: 52,
    marginTop: 8,
    borderRadius: radius.md,
    overflow: "hidden",
    backgroundColor: colors.brandSoft,
  },
  confettiLottie: {
    width: "100%",
    height: "100%",
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.inputFill,
    alignItems: "center",
    justifyContent: "center",
  },
  iconWrapUnread: {
    backgroundColor: colors.brandSoft,
  },
  cardCopy: {
    flex: 1,
    gap: 4,
  },
  cardTop: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 8,
  },
  cardTitle: {
    flex: 1,
    fontSize: 14,
    fontWeight: "800",
    color: colors.ink,
  },
  cardTime: {
    fontSize: 11,
    fontWeight: "600",
    color: colors.mutedLight,
  },
  cardBody: {
    fontSize: 13,
    lineHeight: 19,
    fontWeight: "500",
    color: colors.muted,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.brand,
    marginTop: 6,
  },
  empty: {
    alignItems: "center",
    paddingTop: 80,
    paddingHorizontal: spacing.lg,
    gap: 10,
  },
  emptyIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.inputFill,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: colors.ink,
  },
  emptySub: {
    fontSize: 13,
    lineHeight: 20,
    textAlign: "center",
    color: colors.muted,
    fontWeight: "500",
  },
  pressed: {
    opacity: 0.9,
  },
});
