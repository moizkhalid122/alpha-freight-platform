import { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { AiChatConversationSummary } from "@/lib/ai-chat-history";
import { formatAiConversationSubtitle } from "@/lib/ai-chat-history";
import { colors, radius, shadow, spacing } from "@/lib/theme";

type ChatHistorySheetProps = {
  visible: boolean;
  loading: boolean;
  conversations: AiChatConversationSummary[];
  activeConversationId?: string | null;
  onClose: () => void;
  onSelect: (conversationId: string) => void;
};

const DISMISS_DISTANCE = 110;
const DISMISS_VELOCITY = 650;

export default function ChatHistorySheet({
  visible,
  loading,
  conversations,
  activeConversationId,
  onClose,
  onSelect,
}: ChatHistorySheetProps) {
  const insets = useSafeAreaInsets();
  const [mounted, setMounted] = useState(false);
  const isClosingRef = useRef(false);
  const translateY = useSharedValue(480);
  const backdropOpacity = useSharedValue(0);
  const dragStartY = useSharedValue(0);

  const finishDismiss = useCallback(() => {
    isClosingRef.current = false;
    setMounted(false);
    onClose();
  }, [onClose]);

  const dismissSheet = useCallback(() => {
    if (isClosingRef.current) return;

    isClosingRef.current = true;
    backdropOpacity.value = withTiming(0, { duration: 200 });
    translateY.value = withTiming(480, { duration: 260 }, (finished) => {
      if (finished) {
        runOnJS(finishDismiss)();
      }
    });
  }, [backdropOpacity, finishDismiss, translateY]);

  const presentSheet = useCallback(() => {
    translateY.value = 480;
    backdropOpacity.value = 0;
    translateY.value = withSpring(0, { damping: 26, stiffness: 290 });
    backdropOpacity.value = withTiming(1, { duration: 220 });
  }, [backdropOpacity, translateY]);

  useEffect(() => {
    if (visible) {
      isClosingRef.current = false;
      setMounted(true);
      requestAnimationFrame(() => {
        presentSheet();
      });
      return;
    }

    if (mounted && !isClosingRef.current) {
      dismissSheet();
    }
  }, [dismissSheet, mounted, presentSheet, visible]);

  const panGesture = Gesture.Pan()
    .activeOffsetY(8)
    .failOffsetX([-28, 28])
    .onBegin(() => {
      dragStartY.value = translateY.value;
    })
    .onUpdate((event) => {
      const nextY = dragStartY.value + Math.max(0, event.translationY);
      translateY.value = nextY;
      backdropOpacity.value = Math.max(0, 1 - nextY / 360);
    })
    .onEnd((event) => {
      const shouldDismiss =
        event.translationY > DISMISS_DISTANCE || event.velocityY > DISMISS_VELOCITY;

      if (shouldDismiss) {
        runOnJS(dismissSheet)();
        return;
      }

      translateY.value = withSpring(0, { damping: 26, stiffness: 290 });
      backdropOpacity.value = withTiming(1, { duration: 180 });
    });

  const backdropStyle = useAnimatedStyle(() => ({
    opacity: backdropOpacity.value,
  }));

  const sheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  if (!mounted) {
    return null;
  }

  return (
    <Modal visible={mounted} transparent animationType="none" onRequestClose={dismissSheet}>
      <View style={styles.overlay}>
        <Pressable
          style={StyleSheet.absoluteFill}
          onPress={dismissSheet}
          accessibilityLabel="Close chat history"
        >
          <Animated.View style={[styles.backdrop, backdropStyle]} />
        </Pressable>

        <GestureDetector gesture={panGesture}>
          <Animated.View
            style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, spacing.md) }, sheetStyle]}
          >
            <View style={styles.dragZone}>
              <View style={styles.grabber} />
            </View>

            <View style={styles.header}>
              <View style={styles.headerCopy}>
                <Text style={styles.title}>Chat History</Text>
                <Text style={styles.subtitle}>Select a saved chat to open it</Text>
              </View>

              <Pressable
                style={({ pressed }) => [styles.closeBtn, pressed && styles.closeBtnPressed]}
                onPress={dismissSheet}
                hitSlop={10}
                accessibilityLabel="Close chat history"
              >
                <Ionicons name="close" size={18} color={colors.inkSoft} />
              </Pressable>
            </View>

            {loading ? (
              <View style={styles.loadingWrap}>
                <ActivityIndicator size="small" color={colors.muted} />
                <Text style={styles.loadingText}>Loading saved chats…</Text>
              </View>
            ) : conversations.length ? (
              <ScrollView
                style={styles.list}
                contentContainerStyle={styles.listContent}
                showsVerticalScrollIndicator={false}
                bounces
              >
                {conversations.map((conversation, index) => {
                  const isActive = conversation.id === activeConversationId;
                  const isLast = index === conversations.length - 1;

                  return (
                    <Pressable
                      key={conversation.id}
                      style={({ pressed }) => [
                        styles.row,
                        !isLast && styles.rowBorder,
                        isActive && styles.rowActive,
                        pressed && styles.rowPressed,
                      ]}
                      onPress={() => onSelect(conversation.id)}
                    >
                      <View style={styles.rowIconWrap}>
                        <Ionicons
                          name={isActive ? "chatbubble" : "chatbubble-outline"}
                          size={18}
                          color={isActive ? colors.ink : colors.inkSoft}
                        />
                      </View>
                      <View style={styles.rowCopy}>
                        <Text style={styles.rowTitle} numberOfLines={2}>
                          {conversation.title}
                        </Text>
                        <Text style={styles.rowSubtitle}>
                          {formatAiConversationSubtitle(conversation)}
                        </Text>
                      </View>
                      <Ionicons name="chevron-forward" size={16} color={colors.mutedLight} />
                    </Pressable>
                  );
                })}
              </ScrollView>
            ) : (
              <View style={styles.emptyWrap}>
                <View style={styles.emptyIconWrap}>
                  <Ionicons name="chatbubbles-outline" size={28} color={colors.muted} />
                </View>
                <Text style={styles.emptyTitle}>No saved chats yet</Text>
                <Text style={styles.emptyText}>
                  Start a new conversation and it will appear here with its first message as the heading.
                </Text>
              </View>
            )}
          </Animated.View>
        </GestureDetector>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "flex-end",
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(15, 15, 15, 0.42)",
  },
  sheet: {
    maxHeight: "72%",
    backgroundColor: colors.white,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    ...shadow.card,
  },
  dragZone: {
    alignItems: "center",
    paddingTop: spacing.sm,
    paddingBottom: spacing.xs,
  },
  grabber: {
    width: 42,
    height: 5,
    borderRadius: 3,
    backgroundColor: "#D4D4D4",
  },
  header: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
  },
  headerCopy: {
    flex: 1,
    gap: 4,
  },
  closeBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "#F4F4F5",
    borderWidth: 1,
    borderColor: "#EBEBEB",
    alignItems: "center",
    justifyContent: "center",
  },
  closeBtnPressed: {
    backgroundColor: "#ECECEC",
    transform: [{ scale: 0.96 }],
  },
  title: {
    fontSize: 20,
    fontWeight: "800",
    color: colors.ink,
    letterSpacing: -0.4,
  },
  subtitle: {
    fontSize: 13,
    fontWeight: "500",
    color: colors.muted,
  },
  loadingWrap: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: spacing.xl,
    gap: spacing.sm,
  },
  loadingText: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.muted,
  },
  list: {
    maxHeight: 420,
  },
  listContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.sm,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingVertical: 14,
  },
  rowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: "#F1F1F1",
  },
  rowActive: {
    backgroundColor: "#FAFAFA",
    marginHorizontal: -spacing.sm,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.md,
  },
  rowPressed: {
    opacity: 0.82,
  },
  rowIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#F4F4F5",
    alignItems: "center",
    justifyContent: "center",
  },
  rowCopy: {
    flex: 1,
    gap: 3,
  },
  rowTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.ink,
    lineHeight: 20,
  },
  rowSubtitle: {
    fontSize: 12,
    fontWeight: "500",
    color: colors.muted,
  },
  emptyWrap: {
    alignItems: "center",
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.xl,
    gap: spacing.sm,
  },
  emptyIconWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#F4F4F5",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.xs,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.ink,
  },
  emptyText: {
    fontSize: 13,
    lineHeight: 20,
    fontWeight: "500",
    color: colors.muted,
    textAlign: "center",
  },
});
