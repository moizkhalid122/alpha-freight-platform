import { useCallback, useEffect, useMemo, useRef, useState, memo } from "react";
import {
  ActivityIndicator,
  AppState,
  FlatList,
  Image,
  Pressable,
  RefreshControl,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import FeedLikeButton from "@/components/feed/FeedLikeButton";
import FeedAuthorName from "@/components/feed/FeedAuthorName";
import FeedCommentsSheet, { FeedCommentsSheetRef } from "@/components/feed/FeedCommentsSheet";
import FeedReelsView from "@/components/feed/FeedReelsView";
import { filterFollowingFeed, rankForYouFeed } from "@/lib/feed-algorithm";
import { fetchFollowedProfileKeys } from "@/lib/feed-follows";
import {
  fetchSavedDistributionIds,
  persistFeedSave,
  removeFeedSave,
} from "@/lib/feed-saves";
import {
  FEED_CATEGORIES,
  FeedCategory,
  FeedPost,
  fetchLikedDistributionIds,
  filterFeedPlainPosts,
  filterFeedPosts,
  filterFeedReels,
  formatEngagementCount,
  persistFeedPostLike,
  removeFeedPostLike,
} from "@/lib/feed-posts";
import { getCachedFeedPosts, isFeedCacheStale, prefetchFeedPosts, setCachedFeedPosts } from "@/lib/feed-cache";
import { optimizeFeedImageUrl } from "@/lib/feed-image-url";
import { openFeedProfileFromPost, openMyFeedProfile } from "@/lib/feed-profile-nav";
import { fetchFeedPublisherProfile, type FeedPublisherProfile } from "@/lib/feed-publish";
import { prefetchReelPosters } from "@/lib/reel-prefetch";
import { stopAllReelPlayers } from "@/lib/reel-player-registry";
import { supabase } from "@/lib/supabase";
import { colors, radius, spacing } from "@/lib/theme";

type FeedViewMode = "posts" | "reels";
type FeedSourceTab = "forYou" | "following";

type FeedScreenProps = {
  role: "carrier" | "supplier";
};

const SCREEN_PAD = spacing.md;

function AuthorAvatar({ name, avatarSrc }: { name: string; avatarSrc?: string }) {
  const initials = name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  if (avatarSrc && !avatarSrc.startsWith("/")) {
    return (
      <Image
        source={{ uri: optimizeFeedImageUrl(avatarSrc, 96) }}
        style={styles.avatarImage}
      />
    );
  }

  return (
    <View style={styles.avatarFallback}>
      <Text style={styles.avatarFallbackText}>{initials || "AF"}</Text>
    </View>
  );
}

const FeedCard = memo(function FeedCard({
  post,
  saved,
  liked,
  likeCount,
  commentCount,
  viewerRole,
  onToggleSave,
  onLike,
  onUnlike,
  onOpenComments,
}: {
  post: FeedPost;
  saved: boolean;
  liked: boolean;
  likeCount: number;
  commentCount: number;
  viewerRole: "carrier" | "supplier";
  onToggleSave: () => void;
  onLike: () => void;
  onUnlike: () => void;
  onOpenComments: () => void;
}) {
  const handleShare = useCallback(async () => {
    await Share.share({
      title: post.headline,
      message: `${post.headline}\n\n${post.content}\n\n— ${post.author} on Alpha Freight`,
    });
  }, [post.author, post.content, post.headline]);

  return (
    <Pressable
      style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
      onPress={() =>
        router.push({ pathname: `/feed-post/${post.id}`, params: { viewerRole } })
      }
    >
      <Pressable
        style={({ pressed }) => [styles.cardMetaRow, pressed && styles.cardAuthorPressed]}
        onPress={() => openFeedProfileFromPost(post, viewerRole)}
      >
        <AuthorAvatar name={post.author} avatarSrc={post.avatarSrc} />
        <View style={styles.cardMetaCopy}>
          <FeedAuthorName
            name={post.author}
            verified={post.isOfficial}
            textStyle={styles.cardAuthor}
          />
          <Text style={styles.cardTime}>{post.time}</Text>
        </View>
        <View style={styles.rolePill}>
          <Text style={styles.rolePillText}>{post.role}</Text>
        </View>
      </Pressable>

      {post.imageSrc ? (
        <Image
          source={{ uri: optimizeFeedImageUrl(post.imageSrc, 720) }}
          style={styles.cardImage}
          resizeMode="cover"
        />
      ) : (
        <View style={styles.cardImagePlaceholder}>
          <Ionicons name="newspaper-outline" size={28} color={colors.mutedLight} />
        </View>
      )}

      <Text style={styles.cardHeadline}>{post.headline}</Text>
      {post.summary ? <Text style={styles.cardSummary}>{post.summary}</Text> : null}

      <View style={styles.engagementRow}>
        <View style={styles.engagementLeft}>
          <FeedLikeButton liked={liked} count={likeCount} onLike={onLike} onUnlike={onUnlike} />
          <Pressable style={styles.engagementItem} onPress={onOpenComments}>
            <Ionicons name="chatbubble-outline" size={17} color={colors.ink} />
            <Text style={styles.engagementText}>{formatEngagementCount(commentCount)}</Text>
          </Pressable>
        </View>

        <View style={styles.engagementRight}>
          <Pressable style={styles.iconBtn} onPress={() => void handleShare()}>
            <Ionicons name="share-outline" size={20} color={colors.ink} />
          </Pressable>
          <Pressable style={styles.iconBtn} onPress={onToggleSave}>
            <Ionicons
              name={saved ? "bookmark" : "bookmark-outline"}
              size={20}
              color={colors.ink}
            />
          </Pressable>
        </View>
      </View>
    </Pressable>
  );
});

export default function FeedScreen({ role }: FeedScreenProps) {
  const [posts, setPosts] = useState<FeedPost[]>(() => getCachedFeedPosts() ?? []);
  const [loading, setLoading] = useState(!getCachedFeedPosts());
  const [refreshing, setRefreshing] = useState(false);
  const [category, setCategory] = useState<FeedCategory>("ALL");
  const [viewMode, setViewMode] = useState<FeedViewMode>("posts");
  const [feedSourceTab, setFeedSourceTab] = useState<FeedSourceTab>("forYou");
  const [followedProfileKeys, setFollowedProfileKeys] = useState<string[]>([]);
  const [savedIds, setSavedIds] = useState<Record<string, boolean>>({});
  const [likedIds, setLikedIds] = useState<Record<string, boolean>>({});
  const [likeCounts, setLikeCounts] = useState<Record<string, number>>({});
  const [commentCounts, setCommentCounts] = useState<Record<string, number>>({});
  const [userId, setUserId] = useState<string | null>(null);
  const [viewerProfile, setViewerProfile] = useState<FeedPublisherProfile | null>(null);
  const [screenFocused, setScreenFocused] = useState(true);
  const [appActive, setAppActive] = useState(true);
  const commentsSheetRef = useRef<FeedCommentsSheetRef>(null);
  const reelPostsRef = useRef<FeedPost[]>([]);

  const reelsPlaybackEnabled = viewMode === "reels" && screenFocused && appActive;

  const leaveReels = useCallback(() => {
    stopAllReelPlayers();
    setViewMode("posts");
  }, []);

  const openReels = useCallback(() => {
    prefetchReelPosters(reelPostsRef.current, [0, 1]);
    setViewMode("reels");
  }, []);

  const loadFeed = useCallback(async (force = false) => {
    const result = await prefetchFeedPosts(force);
    setCachedFeedPosts(result);
    setPosts(result);
    setLikeCounts((current) => {
      const next = { ...current };
      result.forEach((post) => {
        if (next[post.id] === undefined) {
          next[post.id] = post.likes;
        }
      });
      return next;
    });
    setCommentCounts((current) => {
      const next = { ...current };
      result.forEach((post) => {
        if (next[post.id] === undefined) {
          next[post.id] = post.comments;
        }
      });
      return next;
    });
    setLoading(false);
  }, []);

  useEffect(() => {
    void (async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;
      setUserId(user.id);
      const [{ ids }, { keys }, { ids: savedPostIds }] = await Promise.all([
        fetchLikedDistributionIds(user.id),
        fetchFollowedProfileKeys(user.id),
        fetchSavedDistributionIds(user.id),
      ]);
      setLikedIds(Object.fromEntries(ids.map((id) => [id, true])));
      setFollowedProfileKeys(keys);
      setSavedIds(Object.fromEntries(savedPostIds.map((id) => [id, true])));

      const publisher = await fetchFeedPublisherProfile(role);
      if (publisher) {
        setViewerProfile(publisher);
      }
    })();
  }, [role]);

  const handleOpenMyFeedProfile = useCallback(() => {
    if (!viewerProfile) return;
    openMyFeedProfile(viewerProfile, role);
  }, [role, viewerProfile]);

  useEffect(() => {
    void loadFeed(!getCachedFeedPosts());
  }, [loadFeed]);

  useFocusEffect(
    useCallback(() => {
      setScreenFocused(true);
      void loadFeed(isFeedCacheStale());
      void fetchFeedPublisherProfile(role).then((publisher) => {
        if (publisher) setViewerProfile(publisher);
      });
      return () => {
        stopAllReelPlayers();
        setScreenFocused(false);
      };
    }, [loadFeed])
  );

  useEffect(() => {
    const subscription = AppState.addEventListener("change", (nextState) => {
      const active = nextState === "active";
      setAppActive(active);
      if (!active) {
        stopAllReelPlayers();
      }
    });

    return () => subscription.remove();
  }, []);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadFeed(true);
    if (userId) {
      const [{ ids }, { keys }, { ids: savedPostIds }] = await Promise.all([
        fetchLikedDistributionIds(userId),
        fetchFollowedProfileKeys(userId),
        fetchSavedDistributionIds(userId),
      ]);
      setLikedIds(Object.fromEntries(ids.map((id) => [id, true])));
      setFollowedProfileKeys(keys);
      setSavedIds(Object.fromEntries(savedPostIds.map((id) => [id, true])));
    }
    setRefreshing(false);
  }, [loadFeed, userId]);

  const handleToggleSave = useCallback(
    (postId: string) => {
      if (!userId) return;
      const nextSaved = !savedIds[postId];
      setSavedIds((current) => ({ ...current, [postId]: nextSaved }));
      void (nextSaved ? persistFeedSave(userId, postId) : removeFeedSave(userId, postId));
    },
    [savedIds, userId]
  );

  const handleLike = useCallback(
    (postId: string) => {
      if (!userId || !viewerProfile) return;
      setLikedIds((current) => ({ ...current, [postId]: true }));
      void persistFeedPostLike(userId, postId);
    },
    [posts, userId, viewerProfile]
  );

  const handleUnlike = useCallback(
    (postId: string) => {
      if (!userId) return;
      setLikedIds((current) => {
        const next = { ...current };
        delete next[postId];
        return next;
      });
      setLikeCounts((current) => ({
        ...current,
        [postId]: Math.max(0, (current[postId] ?? 0) - 1),
      }));
      void removeFeedPostLike(userId, postId);
    },
    [userId]
  );

  const handleCommentCountChange = useCallback((postId: string, count: number) => {
    setCommentCounts((current) => ({ ...current, [postId]: count }));
  }, []);

  const visiblePosts = useMemo(() => {
    const filtered = filterFeedPlainPosts(filterFeedPosts(posts, category));
    if (feedSourceTab === "following") {
      return filterFollowingFeed(filtered, followedProfileKeys);
    }
    return rankForYouFeed(filtered, followedProfileKeys);
  }, [category, feedSourceTab, followedProfileKeys, posts]);

  const reelPosts = useMemo(() => {
    const reels = filterFeedReels(posts);
    if (feedSourceTab === "following") {
      return filterFollowingFeed(reels, followedProfileKeys);
    }
    return rankForYouFeed(reels, followedProfileKeys);
  }, [feedSourceTab, followedProfileKeys, posts]);

  useEffect(() => {
    reelPostsRef.current = reelPosts;
    if (viewMode === "posts" && reelPosts.length) {
      prefetchReelPosters(reelPosts, [0, 1]);
    }
  }, [reelPosts, viewMode]);

  const heroCopy =
    role === "carrier"
      ? "Fleet updates, route wins, and market moves from the carrier network."
      : "Load opportunities, lane demand, and supplier news from the network.";

  const reelsSourceToggle = (
    <View style={styles.reelsToggleRow}>
      <Pressable
        style={[styles.reelsToggleBtn, feedSourceTab === "forYou" && styles.reelsToggleBtnActive]}
        onPress={() => setFeedSourceTab("forYou")}
      >
        <Text
          style={[
            styles.reelsToggleText,
            feedSourceTab === "forYou" && styles.reelsToggleTextActive,
          ]}
        >
          For You
        </Text>
      </Pressable>
      <Pressable
        style={[styles.reelsToggleBtn, feedSourceTab === "following" && styles.reelsToggleBtnActive]}
        onPress={() => setFeedSourceTab("following")}
      >
        <Text
          style={[
            styles.reelsToggleText,
            feedSourceTab === "following" && styles.reelsToggleTextActive,
          ]}
        >
          Following
        </Text>
      </Pressable>
    </View>
  );

  const topHeader = (
    <View style={[styles.topHeader, viewMode === "reels" && styles.topHeaderReels]}>
      {viewMode === "posts" ? (
        <>
          <View style={styles.headerRow}>
            <View style={styles.header}>
              <Text style={styles.brandMark}>FEED</Text>
              <Text style={styles.headerSub}>Alpha Freight network</Text>
            </View>
            <View style={styles.headerActions}>
              <Pressable
                style={({ pressed }) => [styles.headerIconBtn, pressed && styles.composeBtnPressed]}
                onPress={() => router.push({ pathname: "/discover", params: { role } })}
                hitSlop={8}
              >
                <Ionicons name="search-outline" size={22} color={colors.ink} />
              </Pressable>
              <Pressable
                style={({ pressed }) => [styles.profileBtn, pressed && styles.composeBtnPressed]}
                onPress={handleOpenMyFeedProfile}
                hitSlop={8}
                disabled={!viewerProfile}
              >
                {viewerProfile?.avatar ? (
                  <Image
                    source={{ uri: optimizeFeedImageUrl(viewerProfile.avatar, 96) }}
                    style={styles.profileBtnImage}
                  />
                ) : (
                  <Ionicons name="person-circle-outline" size={24} color={colors.ink} />
                )}
              </Pressable>
              <Pressable
                style={({ pressed }) => [styles.composeBtn, pressed && styles.composeBtnPressed]}
                onPress={() => router.push({ pathname: "/create-feed-compose", params: { role } })}
                hitSlop={8}
              >
                <Ionicons name="add" size={22} color={colors.ink} />
              </Pressable>
            </View>
          </View>

          <View style={styles.viewToggleRow}>
            <Pressable
              style={[styles.viewToggleBtn, viewMode === "posts" && styles.viewToggleBtnActive]}
              onPress={leaveReels}
            >
              <Ionicons name="newspaper-outline" size={16} color={viewMode === "posts" ? colors.white : colors.muted} />
              <Text style={[styles.viewToggleText, viewMode === "posts" && styles.viewToggleTextActive]}>
                Posts
              </Text>
            </Pressable>
            <Pressable
              style={[styles.viewToggleBtn, viewMode === "reels" && styles.viewToggleBtnActive]}
              onPress={openReels}
            >
              <Ionicons name="film-outline" size={16} color={colors.muted} />
              <Text style={styles.viewToggleText}>Reels</Text>
            </Pressable>
          </View>
          <View style={styles.categoryDivider} />
        </>
      ) : null}
    </View>
  );

  const feedSourceSortRow = (
    <View style={styles.sortRow}>
      <Pressable onPress={() => setFeedSourceTab("forYou")}>
        <Text style={[styles.sortText, feedSourceTab === "forYou" && styles.sortTextActive]}>
          For You
        </Text>
      </Pressable>
      <Pressable onPress={() => setFeedSourceTab("following")}>
        <Text style={[styles.sortText, feedSourceTab === "following" && styles.sortTextActive]}>
          Following
        </Text>
      </Pressable>
    </View>
  );

  const postsHeader = (
    <View style={styles.postsHeader}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.categoryScroll}
        contentContainerStyle={styles.categoryRow}
      >
        {FEED_CATEGORIES.map((item) => {
          const active = category === item;
          return (
            <Pressable key={item} style={styles.categoryBtn} onPress={() => setCategory(item)}>
              <Text style={[styles.categoryText, active && styles.categoryTextActive]}>
                {item}
              </Text>
              {active ? <View style={styles.categoryUnderline} /> : null}
            </Pressable>
          );
        })}
      </ScrollView>
      <View style={styles.categoryDivider} />

      {feedSourceSortRow}

      <Text style={styles.heroCopy}>
        {feedSourceTab === "following"
          ? "Posts from people you follow."
          : heroCopy}
      </Text>

      {loading && !posts.length ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator color={colors.ink} />
        </View>
      ) : null}
    </View>
  );

  const listEmpty = !loading ? (
    <View style={styles.emptyState}>
      <Ionicons
        name={feedSourceTab === "following" ? "people-outline" : "newspaper-outline"}
        size={34}
        color={colors.mutedLight}
      />
      <Text style={styles.emptyTitle}>
        {feedSourceTab === "following"
          ? "No posts from people you follow"
          : "No posts in this category yet"}
      </Text>
      <Text style={styles.emptyBody}>
        {feedSourceTab === "following"
          ? "Follow carriers and suppliers from their profile or Discover. Their posts will show here."
          : "Pull to refresh or check another category. Network updates from carriers and suppliers will appear here."}
      </Text>
    </View>
  ) : null;

  return (
    <View style={[styles.root, viewMode === "reels" && styles.rootReels]}>
      {viewMode === "reels" ? (
        <View style={styles.reelsStage}>
          <FeedReelsView
            reels={reelPosts}
            loading={loading}
            playbackEnabled={reelsPlaybackEnabled}
            viewerRole={role}
            followingOnly={feedSourceTab === "following"}
            likedIds={likedIds}
            likeCounts={likeCounts}
            commentCounts={commentCounts}
            onLike={(postId) => {
              setLikeCounts((current) => ({
                ...current,
                [postId]: (current[postId] ?? posts.find((p) => p.id === postId)?.likes ?? 0) + 1,
              }));
              handleLike(postId);
            }}
            onUnlike={handleUnlike}
            onOpenComments={(postId) => commentsSheetRef.current?.open(postId)}
          />
          <SafeAreaView style={styles.reelsHeaderOverlay} edges={["top"]} pointerEvents="box-none">
            <View style={styles.reelsHeaderRow}>
              <Pressable
                style={({ pressed }) => [styles.reelsHeaderIconBtn, pressed && styles.composeBtnPressed]}
                onPress={leaveReels}
                hitSlop={8}
              >
                <Ionicons name="chevron-back" size={24} color={colors.white} />
              </Pressable>
              {reelsSourceToggle}
              <Pressable
                style={({ pressed }) => [styles.reelsProfileBtn, pressed && styles.composeBtnPressed]}
                onPress={handleOpenMyFeedProfile}
                hitSlop={8}
                disabled={!viewerProfile}
              >
                {viewerProfile?.avatar ? (
                  <Image
                    source={{ uri: optimizeFeedImageUrl(viewerProfile.avatar, 96) }}
                    style={styles.reelsProfileImage}
                  />
                ) : (
                  <Ionicons name="person-circle-outline" size={24} color={colors.white} />
                )}
              </Pressable>
            </View>
          </SafeAreaView>
        </View>
      ) : (
        <SafeAreaView style={styles.safeTop} edges={["top"]}>
          <View style={styles.feedContentPad}>{topHeader}</View>

          <FlatList
            style={styles.feedList}
            data={visiblePosts}
            keyExtractor={(item) => item.id}
            windowSize={7}
            maxToRenderPerBatch={6}
            initialNumToRender={5}
            removeClippedSubviews
            renderItem={({ item }) => (
              <FeedCard
                post={item}
                viewerRole={role}
                saved={Boolean(savedIds[item.id])}
                liked={Boolean(likedIds[item.id])}
                likeCount={likeCounts[item.id] ?? item.likes}
                commentCount={commentCounts[item.id] ?? item.comments}
                onToggleSave={() => handleToggleSave(item.id)}
                onLike={() => {
                  setLikeCounts((current) => ({
                    ...current,
                    [item.id]: (current[item.id] ?? item.likes) + 1,
                  }));
                  handleLike(item.id);
                }}
                onUnlike={() => handleUnlike(item.id)}
                onOpenComments={() => commentsSheetRef.current?.open(item.id)}
              />
            )}
            ListHeaderComponent={postsHeader}
            ListEmptyComponent={listEmpty}
            contentContainerStyle={styles.feedContent}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={() => void handleRefresh()} />
            }
          />
        </SafeAreaView>
      )}

      <FeedCommentsSheet ref={commentsSheetRef} onCommentCountChange={handleCommentCountChange} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.white,
  },
  rootReels: {
    backgroundColor: colors.black,
  },
  reelsStage: {
    flex: 1,
    backgroundColor: colors.black,
  },
  reelsHeaderOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 5,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.xs,
  },
  reelsHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.sm,
    paddingTop: spacing.xs,
    paddingBottom: 2,
  },
  reelsHeaderIconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.18)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.22)",
  },
  reelsProfileBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    backgroundColor: "rgba(255,255,255,0.18)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.22)",
  },
  reelsProfileImage: {
    width: "100%",
    height: "100%",
  },
  reelsToggleRow: {
    flexDirection: "row",
    alignSelf: "center",
    gap: 6,
    padding: 4,
    borderRadius: radius.pill,
    backgroundColor: "rgba(0,0,0,0.28)",
  },
  reelsToggleBtn: {
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: radius.pill,
  },
  reelsToggleBtnActive: {
    backgroundColor: "rgba(255,255,255,0.18)",
  },
  reelsToggleText: {
    fontSize: 13,
    fontWeight: "700",
    color: "rgba(255,255,255,0.62)",
  },
  reelsToggleTextActive: {
    color: colors.white,
  },
  safeTop: {
    flex: 1,
  },
  feedContentPad: {
    paddingHorizontal: SCREEN_PAD,
  },
  feedContentPadReels: {
    paddingHorizontal: spacing.sm,
    backgroundColor: colors.black,
  },
  topHeader: {
    gap: spacing.sm,
    paddingBottom: spacing.xs,
  },
  topHeaderReels: {
    paddingBottom: spacing.xs,
    gap: spacing.xs,
  },
  reelsBrandMark: {
    fontSize: 22,
    fontWeight: "800",
    color: colors.white,
    letterSpacing: -0.4,
  },
  postsHeader: {
    gap: 0,
  },
  viewToggleRow: {
    flexDirection: "row",
    gap: spacing.sm,
    paddingBottom: spacing.xs,
  },
  viewToggleRowReels: {
    paddingBottom: 0,
  },
  viewToggleBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 10,
    borderRadius: radius.md,
    backgroundColor: colors.canvas,
  },
  viewToggleBtnReels: {
    backgroundColor: "rgba(255,255,255,0.08)",
  },
  viewToggleBtnActive: {
    backgroundColor: colors.black,
  },
  viewToggleBtnActiveReels: {
    backgroundColor: "rgba(255,255,255,0.18)",
  },
  viewToggleText: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.muted,
  },
  viewToggleTextReels: {
    color: "rgba(255,255,255,0.55)",
  },
  viewToggleTextActive: {
    color: colors.white,
  },
  viewToggleTextActiveReels: {
    color: colors.white,
  },
  viewToggleTextActiveOnReels: {
    color: colors.white,
  },
  listHeader: {
    gap: 0,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: spacing.sm,
  },
  header: {
    flex: 1,
    paddingTop: spacing.sm,
    paddingBottom: spacing.sm,
    gap: 4,
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: spacing.sm,
  },
  headerIconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.white,
  },
  profileBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.white,
    overflow: "hidden",
  },
  profileBtnImage: {
    width: "100%",
    height: "100%",
  },
  composeBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.white,
  },
  composeBtnPressed: {
    opacity: 0.72,
  },
  brandMark: {
    fontSize: 34,
    fontWeight: "900",
    letterSpacing: -1.2,
    color: colors.black,
  },
  headerSub: {
    fontSize: 13,
    color: colors.muted,
    fontWeight: "500",
  },
  categorySection: {
    gap: spacing.sm,
  },
  categoryScroll: {
    flexGrow: 0,
    flexShrink: 0,
  },
  categoryRow: {
    gap: 18,
    alignItems: "center",
  },
  categoryDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.border,
    marginTop: 2,
  },
  categoryBtn: {
    alignItems: "center",
    gap: 6,
    paddingVertical: 6,
  },
  categoryText: {
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0.8,
    color: colors.mutedLight,
  },
  categoryTextActive: {
    color: colors.black,
  },
  categoryUnderline: {
    width: "100%",
    height: 2,
    backgroundColor: colors.black,
  },
  sortRow: {
    flexDirection: "row",
    gap: 18,
    paddingTop: spacing.sm,
    paddingBottom: spacing.sm,
  },
  sortText: {
    fontSize: 15,
    fontWeight: "600",
    color: colors.mutedLight,
  },
  sortTextActive: {
    color: colors.black,
    fontWeight: "800",
  },
  feedList: {
    flex: 1,
  },
  feedContent: {
    paddingHorizontal: SCREEN_PAD,
    paddingBottom: 120,
  },
  heroCopy: {
    fontSize: 14,
    lineHeight: 20,
    color: colors.muted,
    marginBottom: spacing.md,
  },
  loadingWrap: {
    paddingVertical: spacing.lg,
    alignItems: "center",
  },
  card: {
    gap: 12,
    marginBottom: spacing.lg,
  },
  cardPressed: {
    opacity: 0.92,
  },
  cardAuthorPressed: {
    opacity: 0.78,
  },
  cardMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  avatarImage: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: colors.canvas,
  },
  avatarFallback: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: colors.black,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarFallbackText: {
    fontSize: 11,
    fontWeight: "800",
    color: colors.white,
  },
  cardMetaCopy: {
    flex: 1,
    gap: 2,
  },
  cardAuthor: {
    fontSize: 14,
    fontWeight: "800",
    color: colors.black,
  },
  cardTime: {
    fontSize: 12,
    color: colors.mutedLight,
  },
  rolePill: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radius.pill,
    backgroundColor: colors.canvas,
  },
  rolePillText: {
    fontSize: 10,
    fontWeight: "800",
    color: colors.ink,
    textTransform: "capitalize",
  },
  cardImage: {
    width: "100%",
    height: 220,
    borderRadius: radius.md,
    backgroundColor: colors.canvas,
  },
  cardImagePlaceholder: {
    width: "100%",
    height: 180,
    borderRadius: radius.md,
    backgroundColor: colors.canvas,
    alignItems: "center",
    justifyContent: "center",
  },
  cardHeadline: {
    fontSize: 22,
    lineHeight: 28,
    fontWeight: "800",
    color: colors.black,
    letterSpacing: -0.4,
  },
  cardSummary: {
    fontSize: 14,
    lineHeight: 21,
    color: colors.muted,
  },
  engagementRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 2,
  },
  engagementLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  engagementItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  engagementText: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.black,
  },
  engagementRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  iconBtn: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyState: {
    alignItems: "center",
    gap: 10,
    paddingVertical: spacing.xxl,
    paddingHorizontal: spacing.md,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: colors.ink,
    textAlign: "center",
  },
  emptyBody: {
    fontSize: 14,
    lineHeight: 21,
    color: colors.muted,
    textAlign: "center",
  },
});
