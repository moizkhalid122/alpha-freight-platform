import { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import FeedLikeButton from "@/components/feed/FeedLikeButton";
import FeedAuthorName from "@/components/feed/FeedAuthorName";
import FeedCommentsSheet, { FeedCommentsSheetRef } from "@/components/feed/FeedCommentsSheet";
import {
  FeedPost,
  fetchFeedPostById,
  fetchLikedDistributionIds,
  formatEngagementCount,
  formatFeedCategoryLabel,
  persistFeedPostLike,
  removeFeedPostLike,
} from "@/lib/feed-posts";
import { fetchSavedDistributionIds, persistFeedSave, removeFeedSave } from "@/lib/feed-saves";
import { trackFeedPostView } from "@/lib/feed-views";
import { getCachedFeedPostById } from "@/lib/feed-cache";
import { openFeedProfileFromPost } from "@/lib/feed-profile-nav";
import { supabase } from "@/lib/supabase";
import { colors, radius, spacing } from "@/lib/theme";

type FeedPostDetailScreenProps = {
  postId: string;
  viewerRole?: "carrier" | "supplier";
};

function AuthorAvatar({ name, avatarSrc, size = 28 }: { name: string; avatarSrc?: string; size?: number }) {
  const initials = name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  if (avatarSrc && !avatarSrc.startsWith("/")) {
    return (
      <Image
        source={{ uri: avatarSrc }}
        style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: colors.canvas }}
      />
    );
  }

  return (
    <View style={[styles.avatarFallback, { width: size, height: size, borderRadius: size / 2 }]}>
      <Text style={[styles.avatarFallbackText, { fontSize: size * 0.32 }]}>{initials || "AF"}</Text>
    </View>
  );
}

export default function FeedPostDetailScreen({
  postId,
  viewerRole = "carrier",
}: FeedPostDetailScreenProps) {
  const [post, setPost] = useState<FeedPost | null>(() => getCachedFeedPostById(postId));
  const [loading, setLoading] = useState(!getCachedFeedPostById(postId));
  const [saved, setSaved] = useState(false);
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(() => getCachedFeedPostById(postId)?.likes ?? 0);
  const [commentCount, setCommentCount] = useState(() => getCachedFeedPostById(postId)?.comments ?? 0);
  const [userId, setUserId] = useState<string | null>(null);
  const commentsSheetRef = useRef<FeedCommentsSheetRef>(null);

  useEffect(() => {
    void (async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;
      setUserId(user.id);
      const [{ ids }, { ids: savedPostIds }] = await Promise.all([
        fetchLikedDistributionIds(user.id),
        fetchSavedDistributionIds(user.id),
      ]);
      setLiked(ids.includes(postId));
      setSaved(savedPostIds.includes(postId));
    })();
  }, [postId]);

  useEffect(() => {
    void trackFeedPostView(postId);
  }, [postId]);

  useEffect(() => {
    if (post) return;

    void (async () => {
      const { post: fetched } = await fetchFeedPostById(postId);
      if (fetched) {
        setPost(fetched);
        setLikeCount(fetched.likes);
        setCommentCount(fetched.comments);
      }
      setLoading(false);
    })();
  }, [post, postId]);

  const handleOpenComments = useCallback(() => {
    commentsSheetRef.current?.open(postId);
  }, [postId]);

  const handleCommentCountChange = useCallback((_id: string, count: number) => {
    setCommentCount(count);
  }, []);

  const handleShare = useCallback(async () => {
    if (!post) return;
    await Share.share({
      title: post.headline,
      message: `${post.headline}\n\n${post.content}\n\n— ${post.author} on Alpha Freight`,
    });
  }, [post]);

  const handleLike = useCallback(() => {
    if (!userId || !post) return;
    setLiked(true);
    setLikeCount((value) => value + 1);
    void persistFeedPostLike(userId, postId);
  }, [post, postId, userId]);

  const handleUnlike = useCallback(() => {
    if (!userId) return;
    setLiked(false);
    setLikeCount((value) => Math.max(0, value - 1));
    void removeFeedPostLike(userId, postId);
  }, [postId, userId]);

  const handleToggleSave = useCallback(() => {
    if (!userId) return;
    setSaved((current) => {
      const nextSaved = !current;
      void (nextSaved ? persistFeedSave(userId, postId) : removeFeedSave(userId, postId));
      return nextSaved;
    });
  }, [postId, userId]);

  if (loading && !post) {
    return (
      <View style={styles.root}>
        <SafeAreaView style={styles.safeTop} edges={["top"]}>
          <View style={styles.topBar}>
            <Pressable style={styles.backBtn} onPress={() => router.back()} hitSlop={12}>
              <Ionicons name="chevron-back" size={24} color={colors.black} />
            </Pressable>
          </View>
        </SafeAreaView>
        <View style={styles.loadingCenter}>
          <ActivityIndicator color={colors.ink} />
        </View>
      </View>
    );
  }

  if (!post) {
    return (
      <View style={styles.loadingRoot}>
        <Text style={styles.errorText}>Post not found</Text>
        <Pressable style={styles.backLink} onPress={() => router.back()}>
          <Text style={styles.backLinkText}>Go back</Text>
        </Pressable>
      </View>
    );
  }

  const categoryLabel = formatFeedCategoryLabel(post);

  return (
    <View style={styles.root}>
      <SafeAreaView style={styles.safeTop} edges={["top"]}>
        <View style={styles.topBar}>
          <Pressable style={styles.backBtn} onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={24} color={colors.black} />
          </Pressable>
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.category}>{categoryLabel}</Text>
          <Text style={styles.headline}>{post.headline}</Text>
          {post.summary ? <Text style={styles.lead}>{post.summary}</Text> : null}

          <Pressable
            style={({ pressed }) => [styles.authorRow, pressed && styles.authorRowPressed]}
            onPress={() => post && openFeedProfileFromPost(post, viewerRole)}
          >
            <AuthorAvatar name={post.author} avatarSrc={post.avatarSrc} />
            <View style={styles.authorCopy}>
              <FeedAuthorName
                name={post.author}
                verified={post.isOfficial}
                textStyle={styles.authorName}
              />
              <Text style={styles.authorMeta}>
                {post.role} · {post.time}
              </Text>
            </View>
          </Pressable>

          {post.imageSrc ? (
            <Image source={{ uri: post.imageSrc }} style={styles.heroImage} resizeMode="cover" />
          ) : (
            <View style={styles.heroPlaceholder}>
              <Ionicons name="image-outline" size={32} color={colors.mutedLight} />
            </View>
          )}

          <Text style={styles.body}>{post.content}</Text>
        </ScrollView>
      </SafeAreaView>

      <SafeAreaView style={styles.actionBarWrap} edges={["bottom"]}>
        <View style={styles.actionBar}>
          <FeedLikeButton liked={liked} count={likeCount} onLike={handleLike} onUnlike={handleUnlike} />

          <Pressable style={styles.actionItem} onPress={handleOpenComments}>
            <Ionicons name="chatbubble-outline" size={22} color={colors.black} />
            <Text style={styles.actionCount}>{formatEngagementCount(commentCount)}</Text>
          </Pressable>

          <Pressable style={styles.actionItem} onPress={() => void handleShare()}>
            <Ionicons name="share-outline" size={22} color={colors.black} />
          </Pressable>

          <Pressable style={styles.actionItem} onPress={handleToggleSave}>
            <Ionicons
              name={saved ? "bookmark" : "bookmark-outline"}
              size={22}
              color={colors.black}
            />
          </Pressable>
        </View>
      </SafeAreaView>

      <FeedCommentsSheet ref={commentsSheetRef} onCommentCountChange={handleCommentCountChange} />
    </View>
  );
}

const SCREEN_PAD = spacing.md;

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.white,
  },
  loadingRoot: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.white,
    gap: spacing.md,
  },
  loadingCenter: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  errorText: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.ink,
  },
  backLink: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  backLinkText: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.ink,
  },
  safeTop: {
    flex: 1,
  },
  topBar: {
    paddingHorizontal: SCREEN_PAD,
    paddingBottom: spacing.sm,
  },
  backBtn: {
    width: 40,
    height: 40,
    alignItems: "flex-start",
    justifyContent: "center",
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: SCREEN_PAD,
    paddingBottom: spacing.xl,
    gap: 14,
  },
  category: {
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 0.6,
    color: "#2563EB",
    textTransform: "uppercase",
  },
  headline: {
    fontSize: 30,
    lineHeight: 36,
    fontWeight: "800",
    letterSpacing: -0.6,
    color: colors.black,
  },
  lead: {
    fontSize: 15,
    lineHeight: 22,
    color: colors.muted,
  },
  authorRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginTop: 2,
  },
  authorCopy: {
    flex: 1,
    gap: 2,
  },
  authorName: {
    fontSize: 15,
    fontWeight: "800",
    color: colors.ink,
  },
  authorRowPressed: {
    opacity: 0.82,
  },
  avatarFallback: {
    backgroundColor: colors.black,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarFallbackText: {
    fontWeight: "800",
    color: colors.white,
  },
  authorMeta: {
    flex: 1,
    fontSize: 13,
    color: colors.muted,
    textTransform: "capitalize",
  },
  heroImage: {
    width: "100%",
    height: 280,
    borderRadius: radius.md,
    backgroundColor: colors.canvas,
    marginTop: 4,
  },
  heroPlaceholder: {
    width: "100%",
    height: 220,
    borderRadius: radius.md,
    backgroundColor: colors.canvas,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 4,
  },
  body: {
    fontSize: 16,
    lineHeight: 26,
    color: colors.inkSoft,
    marginTop: 4,
  },
  actionBarWrap: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    backgroundColor: colors.white,
  },
  actionBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: SCREEN_PAD,
    paddingTop: spacing.sm,
    paddingBottom: spacing.sm,
  },
  actionItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    minWidth: 56,
    justifyContent: "center",
    paddingVertical: 8,
  },
  actionCount: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.black,
  },
});
