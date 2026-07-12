import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  ActivityIndicator,
  Alert,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import {
  BottomSheetBackdrop,
  BottomSheetFlatList,
  BottomSheetModal,
  type BottomSheetBackdropProps,
} from "@gorhom/bottom-sheet";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useKeyboardInset } from "@/lib/use-keyboard-inset";
import {
  FeedComment,
  countFeedComments,
  fetchCommenterProfile,
  fetchFeedComments,
  submitFeedComment,
} from "@/lib/feed-comments";
import { supabase } from "@/lib/supabase";
import { colors, radius, shadow, spacing } from "@/lib/theme";

export type FeedCommentsSheetRef = {
  open: (distributionId: string) => void;
  close: () => void;
};

type FeedCommentsSheetProps = {
  onCommentCountChange?: (distributionId: string, count: number) => void;
};

type CommentListItem = FeedComment & { depth: number };

const COMPOSER_MIN_HEIGHT = 54;

function flattenComments(comments: FeedComment[], depth = 0): CommentListItem[] {
  return comments.flatMap((comment) => [
    { ...comment, depth },
    ...flattenComments(comment.replies, depth + 1),
  ]);
}

function CommentAvatar({ name }: { name: string }) {
  const initial = name.trim().charAt(0).toUpperCase() || "A";
  return (
    <View style={styles.commentAvatar}>
      <Text style={styles.commentAvatarText}>{initial}</Text>
    </View>
  );
}

function CommentRow({
  comment,
  reaction,
  onReact,
  onReply,
}: {
  comment: CommentListItem;
  reaction: "like" | "dislike" | null;
  onReact: (commentId: string, next: "like" | "dislike" | null) => void;
  onReply: (comment: FeedComment) => void;
}) {
  const likeActive = reaction === "like";
  const dislikeActive = reaction === "dislike";

  return (
    <View style={[styles.commentRow, comment.depth > 0 && styles.commentRowReply]}>
      <CommentAvatar name={comment.authorName} />
      <View style={styles.commentBody}>
        <Text style={styles.commentMeta}>
          <Text style={styles.commentAuthor}>{comment.authorName}</Text>
          <Text style={styles.commentTime}> · {comment.time}</Text>
        </Text>
        <Text style={styles.commentText}>{comment.content}</Text>

        <View style={styles.commentActions}>
          <Pressable
            style={styles.commentActionBtn}
            onPress={() => onReact(comment.id, likeActive ? null : "like")}
          >
            <Ionicons
              name={likeActive ? "thumbs-up" : "thumbs-up-outline"}
              size={16}
              color={likeActive ? "#2563EB" : colors.muted}
            />
            <Text style={[styles.commentActionText, likeActive && styles.commentActionTextActive]}>
              {comment.likesCount + (likeActive ? 1 : 0) || 0}
            </Text>
          </Pressable>

          <Pressable
            style={styles.commentActionBtn}
            onPress={() => onReact(comment.id, dislikeActive ? null : "dislike")}
          >
            <Ionicons
              name={dislikeActive ? "thumbs-down" : "thumbs-down-outline"}
              size={16}
              color={dislikeActive ? colors.ink : colors.muted}
            />
            <Text style={styles.commentActionText}>
              {comment.dislikesCount + (dislikeActive ? 1 : 0) || 0}
            </Text>
          </Pressable>

          <Pressable style={styles.replyBtn} onPress={() => onReply(comment)}>
            <Text style={styles.replyBtnText}>Reply</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

type CommentComposerProps = {
  replyTo: FeedComment | null;
  submitting: boolean;
  resetKey: string;
  composerBottomInset: number;
  composerPadBottom: number;
  onClearReply: () => void;
  onSubmit: (text: string) => Promise<boolean>;
  onHeightChange: (height: number) => void;
};

function CommentComposer({
  replyTo,
  submitting,
  resetKey,
  composerBottomInset,
  composerPadBottom,
  onClearReply,
  onSubmit,
  onHeightChange,
}: CommentComposerProps) {
  const [draft, setDraft] = useState("");

  useEffect(() => {
    setDraft("");
  }, [resetKey]);

  const handleSend = useCallback(async () => {
    const content = draft.trim();
    if (!content || submitting) return;
    const ok = await onSubmit(content);
    if (ok) setDraft("");
  }, [draft, onSubmit, submitting]);

  return (
    <View
      onLayout={(event) => {
        const nextHeight = Math.ceil(event.nativeEvent.layout.height);
        if (nextHeight > 0) onHeightChange(nextHeight);
      }}
      style={[
        styles.composerDock,
        {
          bottom: composerBottomInset,
          paddingBottom: composerPadBottom,
        },
      ]}
    >
      {replyTo ? (
        <View style={styles.replyBanner}>
          <Text style={styles.replyBannerText} numberOfLines={1}>
            Replying to {replyTo.authorName}
          </Text>
          <Pressable onPress={onClearReply} hitSlop={8}>
            <Ionicons name="close" size={16} color={colors.muted} />
          </Pressable>
        </View>
      ) : null}

      <View style={styles.composerPill}>
        <TextInput
          value={draft}
          onChangeText={setDraft}
          placeholder="What do you think?"
          placeholderTextColor="#A3A3A3"
          style={styles.composerInput}
          multiline
          maxLength={500}
          editable={!submitting}
          blurOnSubmit={false}
          returnKeyType="default"
        />
        <Pressable
          style={({ pressed }) => [
            styles.sendBtn,
            (!draft.trim() || submitting) && styles.sendBtnDisabled,
            pressed && draft.trim() && !submitting && styles.sendBtnPressed,
          ]}
          disabled={!draft.trim() || submitting}
          onPress={() => void handleSend()}
        >
          {submitting ? (
            <ActivityIndicator size="small" color={colors.white} />
          ) : (
            <Ionicons name="arrow-up" size={17} color={colors.white} />
          )}
        </Pressable>
      </View>
    </View>
  );
}

const FeedCommentsSheet = forwardRef<FeedCommentsSheetRef, FeedCommentsSheetProps>(
  ({ onCommentCountChange }, ref) => {
    const sheetRef = useRef<BottomSheetModal>(null);
    const listRef = useRef<any>(null);
    const snapPoints = useMemo(() => ["88%"], []);
    const insets = useSafeAreaInsets();
    const { inset: keyboardInset, isVisible: isKeyboardVisible } = useKeyboardInset();

    const [distributionId, setDistributionId] = useState("");
    const [comments, setComments] = useState<FeedComment[]>([]);
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [replyTo, setReplyTo] = useState<FeedComment | null>(null);
    const [reactions, setReactions] = useState<Record<string, "like" | "dislike" | null>>({});
    const [composerHeight, setComposerHeight] = useState(COMPOSER_MIN_HEIGHT);
    const [viewer, setViewer] = useState<{ id: string; name: string; avatar?: string } | null>(
      null
    );

    const flatComments = useMemo(() => flattenComments(comments), [comments]);
    const totalCount = useMemo(() => countFeedComments(comments), [comments]);

    const composerBottomInset = isKeyboardVisible ? keyboardInset : 0;
    const composerPadBottom = isKeyboardVisible
      ? 0
      : Math.max(insets.bottom, spacing.sm);
    const scrollBottomPad =
      composerHeight + composerPadBottom + composerBottomInset + spacing.md;

    const loadComments = useCallback(
      async (postId: string) => {
        setLoading(true);
        const { comments: nextComments } = await fetchFeedComments(postId);
        setComments(nextComments);
        onCommentCountChange?.(postId, countFeedComments(nextComments));
        setLoading(false);
      },
      [onCommentCountChange]
    );

    const loadViewer = useCallback(async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return null;
      const profile = await fetchCommenterProfile(user.id);
      return { id: user.id, name: profile.name, avatar: profile.avatar };
    }, []);

    useImperativeHandle(ref, () => ({
      open: (postId: string) => {
        setDistributionId(postId);
        setReplyTo(null);
        setReactions({});
        sheetRef.current?.present();
        void loadComments(postId);
        void loadViewer().then((result) => {
          if (result) setViewer(result);
        });
      },
      close: () => sheetRef.current?.dismiss(),
    }));

    useEffect(() => {
      if (!isKeyboardVisible || flatComments.length === 0) return;
      const timer = setTimeout(() => {
        listRef.current?.scrollToEnd?.({ animated: true });
      }, 80);
      return () => clearTimeout(timer);
    }, [flatComments.length, isKeyboardVisible, keyboardInset]);

    const handleClose = useCallback(() => {
      sheetRef.current?.dismiss();
    }, []);

    const handleReact = useCallback((commentId: string, next: "like" | "dislike" | null) => {
      setReactions((current) => ({ ...current, [commentId]: next }));
    }, []);

    const handleReply = useCallback((comment: FeedComment) => {
      setReplyTo(comment);
    }, []);

    const appendComment = useCallback(
      (comment: FeedComment) => {
        setComments((current) => {
          if (!comment.parentCommentId) {
            const next = [...current, { ...comment, replies: [] }];
            onCommentCountChange?.(distributionId, countFeedComments(next));
            return next;
          }

          const insertReply = (items: FeedComment[]): FeedComment[] =>
            items.map((item) => {
              if (item.id === comment.parentCommentId) {
                return {
                  ...item,
                  replies: [...item.replies, { ...comment, replies: [] }],
                };
              }
              return { ...item, replies: insertReply(item.replies) };
            });

          const next = insertReply(current);
          onCommentCountChange?.(distributionId, countFeedComments(next));
          return next;
        });
      },
      [distributionId, onCommentCountChange]
    );

    const handleSubmitComment = useCallback(
      async (content: string): Promise<boolean> => {
        if (!content.trim() || !distributionId || submitting) return false;

        if (!viewer) {
          Alert.alert("Sign in required", "Please sign in to comment.");
          return false;
        }

        setSubmitting(true);
        const { comment, error } = await submitFeedComment({
          distributionId,
          authorId: viewer.id,
          authorName: viewer.name,
          authorAvatar: viewer.avatar,
          content: content.trim(),
          parentCommentId: replyTo?.id,
        });
        setSubmitting(false);

        if (error || !comment) {
          Alert.alert("Comment failed", error || "Unable to post your comment.");
          return false;
        }

        appendComment({ ...comment, replies: [] });
        setReplyTo(null);
        return true;
      },
      [appendComment, distributionId, replyTo, submitting, viewer]
    );

    const renderBackdrop = useCallback(
      (props: BottomSheetBackdropProps) => (
        <BottomSheetBackdrop {...props} disappearsOnIndex={-1} appearsOnIndex={0} opacity={0.5} />
      ),
      []
    );

    const handleComposerHeightChange = useCallback((height: number) => {
      setComposerHeight((current) => (current === height ? current : height));
    }, []);

    return (
      <BottomSheetModal
        ref={sheetRef}
        snapPoints={snapPoints}
        enablePanDownToClose
        enableDynamicSizing={false}
        keyboardBehavior="fillParent"
        keyboardBlurBehavior="none"
        android_keyboardInputMode="adjustPan"
        enableBlurKeyboardOnGesture={false}
        backdropComponent={renderBackdrop}
        backgroundStyle={styles.sheetBackground}
        handleIndicatorStyle={styles.handle}
      >
        <View style={styles.sheetBody}>
          <View style={styles.sheetHeader}>
            <Text style={styles.sheetTitle}>
              {totalCount} Comment{totalCount === 1 ? "" : "s"}
            </Text>
            <Pressable onPress={handleClose} hitSlop={8}>
              <Text style={styles.closeText}>Close</Text>
            </Pressable>
          </View>

          {loading ? (
            <View style={styles.loadingWrap}>
              <ActivityIndicator color={colors.ink} />
            </View>
          ) : (
            <BottomSheetFlatList
              ref={listRef}
              data={flatComments}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <CommentRow
                  comment={item}
                  reaction={reactions[item.id] ?? null}
                  onReact={handleReact}
                  onReply={handleReply}
                />
              )}
              style={styles.list}
              contentContainerStyle={[
                styles.listContent,
                flatComments.length === 0 && styles.listContentEmpty,
                { paddingBottom: scrollBottomPad },
              ]}
              ListEmptyComponent={
                <View style={styles.emptyState}>
                  <Ionicons name="chatbubble-outline" size={28} color={colors.mutedLight} />
                  <Text style={styles.emptyTitle}>No comments yet</Text>
                  <Text style={styles.emptyBody}>Start the conversation below.</Text>
                </View>
              }
              keyboardShouldPersistTaps="handled"
              keyboardDismissMode="none"
            />
          )}

          <CommentComposer
            replyTo={replyTo}
            submitting={submitting}
            resetKey={distributionId}
            composerBottomInset={composerBottomInset}
            composerPadBottom={composerPadBottom}
            onClearReply={() => setReplyTo(null)}
            onSubmit={handleSubmitComment}
            onHeightChange={handleComposerHeightChange}
          />
        </View>
      </BottomSheetModal>
    );
  }
);

FeedCommentsSheet.displayName = "FeedCommentsSheet";

export default FeedCommentsSheet;

const styles = StyleSheet.create({
  sheetBackground: {
    backgroundColor: colors.white,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
  },
  handle: {
    width: 44,
    height: 4,
    backgroundColor: colors.border,
  },
  sheetBody: {
    flex: 1,
    position: "relative",
  },
  sheetHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
  },
  sheetTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: colors.black,
  },
  closeText: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.muted,
  },
  loadingWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: spacing.xxl,
  },
  list: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: spacing.lg,
    gap: 18,
  },
  listContentEmpty: {
    flexGrow: 1,
    justifyContent: "center",
  },
  commentRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
  },
  commentRowReply: {
    marginLeft: 28,
  },
  commentAvatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: colors.canvas,
    alignItems: "center",
    justifyContent: "center",
  },
  commentAvatarText: {
    fontSize: 14,
    fontWeight: "800",
    color: colors.ink,
  },
  commentBody: {
    flex: 1,
    gap: 6,
  },
  commentMeta: {
    fontSize: 13,
  },
  commentAuthor: {
    fontWeight: "800",
    color: colors.black,
  },
  commentTime: {
    color: colors.mutedLight,
    fontWeight: "500",
  },
  commentText: {
    fontSize: 15,
    lineHeight: 22,
    color: colors.inkSoft,
  },
  commentActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    marginTop: 2,
  },
  commentActionBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  commentActionText: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.muted,
  },
  commentActionTextActive: {
    color: "#2563EB",
  },
  replyBtn: {
    paddingVertical: 2,
  },
  replyBtnText: {
    fontSize: 12,
    fontWeight: "800",
    color: colors.muted,
  },
  emptyState: {
    alignItems: "center",
    gap: 8,
    paddingVertical: spacing.xxl,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: colors.ink,
  },
  emptyBody: {
    fontSize: 14,
    color: colors.muted,
  },
  replyBanner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.sm,
    marginBottom: spacing.xs,
    paddingHorizontal: spacing.xs,
  },
  replyBannerText: {
    flex: 1,
    fontSize: 12,
    fontWeight: "600",
    color: colors.muted,
  },
  composerDock: {
    position: "absolute",
    left: 0,
    right: 0,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.xs,
    backgroundColor: colors.white,
    zIndex: 12,
    elevation: 12,
  },
  composerPill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.white,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: "#E5E5E5",
    paddingLeft: spacing.md,
    paddingRight: 4,
    paddingVertical: 4,
    minHeight: COMPOSER_MIN_HEIGHT,
    gap: 2,
    ...shadow.soft,
  },
  composerInput: {
    flex: 1,
    minHeight: 36,
    maxHeight: 96,
    fontSize: 15,
    lineHeight: 20,
    fontWeight: "500",
    color: colors.ink,
    paddingHorizontal: 6,
    paddingVertical: Platform.OS === "ios" ? 8 : 6,
    textAlignVertical: "center",
  },
  sendBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.ink,
    alignItems: "center",
    justifyContent: "center",
  },
  sendBtnDisabled: {
    opacity: 0.28,
  },
  sendBtnPressed: {
    opacity: 0.88,
    transform: [{ scale: 0.96 }],
  },
});
