import { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  View,
  type LayoutChangeEvent,
  type ViewToken,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import ReelSlide from "@/components/feed/ReelSlide";
import { FeedPost, fetchFeedPostById } from "@/lib/feed-posts";
import { prefetchAdjacentReelPosters } from "@/lib/reel-prefetch";
import { trackFeedPostView } from "@/lib/feed-views";
import { colors, spacing } from "@/lib/theme";

type FeedReelsViewProps = {
  reels: FeedPost[];
  loading: boolean;
  playbackEnabled?: boolean;
  viewerRole: "carrier" | "supplier";
  followingOnly?: boolean;
  likedIds: Record<string, boolean>;
  likeCounts: Record<string, number>;
  commentCounts: Record<string, number>;
  onLike: (postId: string) => void;
  onUnlike: (postId: string) => void;
  onOpenComments: (postId: string) => void;
};

export default function FeedReelsView({
  reels,
  loading,
  playbackEnabled = true,
  viewerRole,
  followingOnly = false,
  likedIds,
  likeCounts,
  commentCounts,
  onLike,
  onUnlike,
  onOpenComments,
}: FeedReelsViewProps) {
  const insets = useSafeAreaInsets();
  const [viewportHeight, setViewportHeight] = useState(0);
  const [activeIndex, setActiveIndex] = useState(0);
  const [streamOverrides, setStreamOverrides] = useState<Record<string, FeedPost>>({});
  const reelHeight = viewportHeight;

  const mergedReels = useMemo(
    () => reels.map((reel) => streamOverrides[reel.id] || reel),
    [reels, streamOverrides]
  );

  const onViewableItemsChanged = useRef(({ viewableItems }: { viewableItems: ViewToken[] }) => {
    const nextIndex = viewableItems[0]?.index;
    if (typeof nextIndex === "number") {
      setActiveIndex(nextIndex);
    }
  }).current;

  useEffect(() => {
    const post = mergedReels[activeIndex];
    if (post?.id) {
      void trackFeedPostView(post.id);
    }
    prefetchAdjacentReelPosters(mergedReels, activeIndex);
  }, [activeIndex, mergedReels]);

  useEffect(() => {
    const post = mergedReels[activeIndex];
    if (!post?.id) return;

    const needsStreamPoll =
      !post.videoHlsSrc &&
      (post.videoProcessingStatus === "processing" || post.videoProcessingStatus === "pending");
    if (!needsStreamPoll) return;

    let cancelled = false;

    const pollStreamStatus = async () => {
      const { post: freshPost } = await fetchFeedPostById(post.id);
      if (cancelled || !freshPost) return;

      const streamReady =
        Boolean(freshPost.videoHlsSrc) ||
        freshPost.videoProcessingStatus === "ready" ||
        freshPost.videoProcessingStatus === "failed";
      if (streamReady) {
        setStreamOverrides((current) => ({ ...current, [post.id]: freshPost }));
      }
    };

    void pollStreamStatus();
    const intervalId = setInterval(() => {
      void pollStreamStatus();
    }, 4000);

    return () => {
      cancelled = true;
      clearInterval(intervalId);
    };
  }, [activeIndex, mergedReels]);

  const handleLayout = (event: LayoutChangeEvent) => {
    const nextHeight = Math.round(event.nativeEvent.layout.height);
    if (nextHeight > 0 && nextHeight !== viewportHeight) {
      setViewportHeight(nextHeight);
    }
  };

  if (loading && !mergedReels.length) {
    return (
      <View style={styles.loadingWrap}>
        <ActivityIndicator color={colors.white} size="large" />
      </View>
    );
  }

  if (!mergedReels.length) {
    return (
      <View style={styles.emptyWrap}>
        <Ionicons name="film-outline" size={36} color={colors.mutedLight} />
        <Text style={styles.emptyTitle}>
          {followingOnly ? "No reels from people you follow" : "No reels yet"}
        </Text>
        <Text style={styles.emptyBody}>
          {followingOnly
            ? "Follow carriers and suppliers to see their reels here."
            : "Video posts from the network will appear here. Publish a reel from web or mobile soon."}
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.listWrap} onLayout={handleLayout}>
      {reelHeight > 0 ? (
        <FlatList
          data={mergedReels}
          keyExtractor={(item) => item.id}
          renderItem={({ item, index }) => {
            const isActive = playbackEnabled && index === activeIndex;
            const isPreload = playbackEnabled && index === activeIndex + 1;

            return (
              <ReelSlide
                post={item}
                isActive={isActive}
                isPreload={isPreload}
                playbackEnabled={playbackEnabled}
                height={reelHeight}
                bottomInset={Math.max(insets.bottom, spacing.sm)}
                viewerRole={viewerRole}
                liked={Boolean(likedIds[item.id])}
                likeCount={likeCounts[item.id] ?? item.likes}
                commentCount={commentCounts[item.id] ?? item.comments}
                onLike={() => onLike(item.id)}
                onUnlike={() => onUnlike(item.id)}
                onOpenComments={() => onOpenComments(item.id)}
              />
            );
          }}
          pagingEnabled
          decelerationRate="fast"
          snapToInterval={reelHeight}
          snapToAlignment="start"
          disableIntervalMomentum
          showsVerticalScrollIndicator={false}
          onViewableItemsChanged={onViewableItemsChanged}
          viewabilityConfig={{ itemVisiblePercentThreshold: 85 }}
          extraData={`${activeIndex}-${playbackEnabled ? 1 : 0}`}
          windowSize={3}
          maxToRenderPerBatch={2}
          initialNumToRender={2}
          removeClippedSubviews
          updateCellsBatchingPeriod={50}
          getItemLayout={(_, index) => ({
            length: reelHeight,
            offset: reelHeight * index,
            index,
          })}
          style={styles.list}
          contentContainerStyle={styles.listContent}
        />
      ) : (
        <View style={styles.loadingWrap}>
          <ActivityIndicator color={colors.white} size="large" />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  listWrap: {
    flex: 1,
    backgroundColor: colors.black,
  },
  list: {
    flex: 1,
    backgroundColor: colors.black,
  },
  listContent: {
    backgroundColor: colors.black,
  },
  loadingWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.black,
    paddingVertical: spacing.xxl,
  },
  emptyWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.xxl,
    backgroundColor: colors.black,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: colors.white,
    textAlign: "center",
  },
  emptyBody: {
    fontSize: 14,
    lineHeight: 21,
    color: "rgba(255,255,255,0.72)",
    textAlign: "center",
  },
});
