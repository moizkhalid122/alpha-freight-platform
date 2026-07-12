import { Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import FeedLikeButton from "@/components/feed/FeedLikeButton";
import FeedAuthorName from "@/components/feed/FeedAuthorName";
import ReelAvatar from "@/components/feed/ReelAvatar";
import { openFeedProfileFromPost } from "@/lib/feed-profile-nav";
import { FeedPost, formatEngagementCount } from "@/lib/feed-posts";
import { colors, spacing } from "@/lib/theme";

export { useReelShare } from "@/components/feed/reel-share";

type ReelSlideOverlayProps = {
  post: FeedPost;
  liked: boolean;
  likeCount: number;
  commentCount: number;
  bottomInset?: number;
  viewerRole: "carrier" | "supplier";
  onLike: () => void;
  onUnlike: () => void;
  onOpenComments: () => void;
  onShare: () => void;
};

export default function ReelSlideOverlay({
  post,
  liked,
  likeCount,
  commentCount,
  bottomInset = 0,
  viewerRole,
  onLike,
  onUnlike,
  onOpenComments,
  onShare,
}: ReelSlideOverlayProps) {
  return (
    <View
      style={[styles.root, { paddingBottom: spacing.md + bottomInset }]}
      pointerEvents="box-none"
    >
      <View style={styles.row} pointerEvents="box-none">
        <View style={styles.metaBlock}>
          <Pressable
            style={({ pressed }) => [styles.authorRow, pressed && styles.authorRowPressed]}
            onPress={() => openFeedProfileFromPost(post, viewerRole)}
          >
            <ReelAvatar name={post.author} avatarSrc={post.avatarSrc} />
            <View style={styles.authorCopy}>
              <FeedAuthorName
                name={post.author}
                verified={post.isOfficial}
                tone="dark"
                textStyle={styles.authorName}
              />
              <Text style={styles.authorMeta} numberOfLines={1}>
                {post.role} · {post.time}
              </Text>
            </View>
          </Pressable>
          <Text style={styles.caption} numberOfLines={3}>
            {post.content}
          </Text>
        </View>

        <View style={styles.actionsColumn} pointerEvents="auto">
          <FeedLikeButton
            liked={liked}
            count={likeCount}
            tone="dark"
            layout="column"
            iconSize={26}
            onLike={onLike}
            onUnlike={onUnlike}
          />
          <Pressable style={styles.actionBtn} onPress={onOpenComments}>
            <Ionicons name="chatbubble-outline" size={26} color={colors.white} />
            <Text style={styles.actionText}>{formatEngagementCount(commentCount)}</Text>
          </Pressable>
          <Pressable style={styles.actionBtn} onPress={onShare}>
            <Ionicons name="paper-plane-outline" size={26} color={colors.white} />
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 8,
    elevation: 8,
  },
  row: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    paddingHorizontal: spacing.md,
    gap: spacing.sm,
  },
  metaBlock: {
    flex: 1,
    gap: spacing.sm,
    paddingRight: spacing.sm,
  },
  authorRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  authorRowPressed: {
    opacity: 0.82,
  },
  authorCopy: {
    flex: 1,
    gap: 2,
  },
  authorName: {
    fontSize: 15,
    fontWeight: "800",
    color: colors.white,
    textShadowColor: "rgba(0,0,0,0.6)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  authorMeta: {
    fontSize: 12,
    color: "rgba(255,255,255,0.82)",
    textTransform: "capitalize",
    textShadowColor: "rgba(0,0,0,0.6)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  caption: {
    fontSize: 14,
    lineHeight: 20,
    color: colors.white,
    fontWeight: "500",
    textShadowColor: "rgba(0,0,0,0.6)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  actionsColumn: {
    alignItems: "center",
    gap: 14,
    minWidth: 52,
  },
  actionBtn: {
    alignItems: "center",
    gap: 4,
  },
  actionText: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.white,
    textShadowColor: "rgba(0,0,0,0.6)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
});
