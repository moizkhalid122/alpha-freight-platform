import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import FeedAuthorName from "@/components/feed/FeedAuthorName";
import FeedProfileEditSheet, {
  type FeedProfileEditSheetRef,
} from "@/components/feed/FeedProfileEditSheet";
import { fetchFeedPublisherProfile } from "@/lib/feed-publish";
import {
  fetchProfileFollowerCount,
  isFollowedByProfile,
  isFollowingProfile,
  persistFeedFollow,
  removeFeedFollow,
} from "@/lib/feed-follows";
import {
  fetchFeedProfileDetails,
  formatFeedProfileLink,
  normalizeFeedProfileLink,
} from "@/lib/feed-profile";
import { resolveFeedRecipientUserId } from "@/lib/feed-notifications";
import { fetchSavedFeedPosts } from "@/lib/feed-saves";
import {
  FeedPost,
  deleteFeedPost,
  fetchFeedPostsByProfileKey,
  filterFeedReels,
  formatEngagementCount,
} from "@/lib/feed-posts";
import { optimizeFeedImageUrl } from "@/lib/feed-image-url";
import { colors, radius, spacing } from "@/lib/theme";

type FeedProfileTab = "all" | "posts" | "reels" | "saved";

type FeedProfileScreenProps = {
  profileKey: string;
  name: string;
  role: string;
  avatarSrc?: string;
  authorId?: string;
  viewerRole: "carrier" | "supplier";
};

function ProfileAvatar({ name, avatarSrc }: { name: string; avatarSrc?: string }) {
  const initials = name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  if (avatarSrc?.trim()) {
    return (
      <Image
        source={{ uri: optimizeFeedImageUrl(avatarSrc, 160) }}
        style={styles.heroAvatar}
      />
    );
  }

  return (
    <View style={styles.heroAvatarFallback}>
      <Text style={styles.heroAvatarText}>{initials || "AF"}</Text>
    </View>
  );
}

function PostGridItem({
  post,
  onPress,
  onLongPress,
}: {
  post: FeedPost;
  onPress: () => void;
  onLongPress?: () => void;
}) {
  const isReel = Boolean(post.videoSrc?.trim());
  const thumb = post.imageSrc || post.videoSrc;

  return (
    <Pressable
      style={({ pressed }) => [styles.gridItem, pressed && styles.pressed]}
      onPress={onPress}
      onLongPress={onLongPress}
      delayLongPress={400}
    >
      {thumb ? (
        <Image source={{ uri: optimizeFeedImageUrl(thumb, 360) }} style={styles.gridImage} />
      ) : (
        <View style={styles.gridPlaceholder}>
          <Ionicons name="newspaper-outline" size={22} color={colors.mutedLight} />
        </View>
      )}
      {isReel ? (
        <View style={styles.gridReelBadge}>
          <Ionicons name="play" size={12} color={colors.white} />
        </View>
      ) : null}
      <View style={styles.gridOverlay}>
        <Ionicons name="heart" size={12} color={colors.white} />
        <Text style={styles.gridStat}>{formatEngagementCount(post.likes)}</Text>
      </View>
    </Pressable>
  );
}

export default function FeedProfileScreen({
  profileKey,
  name,
  role,
  avatarSrc,
  authorId,
  viewerRole,
}: FeedProfileScreenProps) {
  const editSheetRef = useRef<FeedProfileEditSheetRef>(null);
  const [loading, setLoading] = useState(true);
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [savedPosts, setSavedPosts] = useState<FeedPost[]>([]);
  const [tab, setTab] = useState<FeedProfileTab>("all");
  const [followBusy, setFollowBusy] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const [isFollowedByViewer, setIsFollowedByViewer] = useState(false);
  const [followerCount, setFollowerCount] = useState(0);
  const [viewerUserId, setViewerUserId] = useState<string | null>(null);
  const [viewerProfileKey, setViewerProfileKey] = useState<string | null>(null);
  const [displayName, setDisplayName] = useState(name);
  const [profileAvatar, setProfileAvatar] = useState(avatarSrc);
  const [bio, setBio] = useState("");
  const [link, setLink] = useState("");
  const [isOfficial, setIsOfficial] = useState(false);
  const [profileUserId, setProfileUserId] = useState<string | null>(authorId || null);

  const isOwnProfile = Boolean(
    viewerProfileKey && viewerProfileKey.toLowerCase() === profileKey.trim().toLowerCase()
  );

  const loadProfile = useCallback(async () => {
    setLoading(true);
    try {
      const [postsResult, followers, publisher, details] = await Promise.all([
        fetchFeedPostsByProfileKey(profileKey),
        fetchProfileFollowerCount(profileKey),
        fetchFeedPublisherProfile(viewerRole),
        fetchFeedProfileDetails(profileKey, {
          authorId,
          fallbackName: name,
          fallbackAvatar: avatarSrc,
          fallbackEmail: undefined,
        }),
      ]);

      setPosts(postsResult.posts);
      setFollowerCount(followers);
      setDisplayName(details.displayName || name);
      setProfileAvatar(details.avatarUrl || avatarSrc || postsResult.posts[0]?.avatarSrc);
      setBio(details.bio);
      setLink(details.link);
      setIsOfficial(details.isOfficial);
      const resolvedProfileUserId =
        details.userId || authorId || postsResult.posts[0]?.authorId || null;
      setProfileUserId(resolvedProfileUserId);

      if (publisher) {
        setViewerUserId(publisher.userId);
        setViewerProfileKey(publisher.profileKey);
        const [following, followedByViewer, savedResult] = await Promise.all([
          isFollowingProfile(publisher.userId, profileKey),
          isFollowedByProfile({
            profileUserId: resolvedProfileUserId,
            profileKey,
            viewerUserId: publisher.userId,
            viewerProfileKey: publisher.profileKey,
          }),
          publisher.profileKey.toLowerCase() === profileKey.trim().toLowerCase()
            ? fetchSavedFeedPosts(publisher.userId)
            : Promise.resolve({ posts: [] as FeedPost[], error: null }),
        ]);
        setIsFollowing(following);
        setIsFollowedByViewer(followedByViewer);
        setSavedPosts(savedResult.posts);
      } else {
        setIsFollowedByViewer(false);
        setSavedPosts([]);
      }
    } finally {
      setLoading(false);
    }
  }, [authorId, avatarSrc, name, profileKey, viewerRole]);

  useEffect(() => {
    void loadProfile();
  }, [loadProfile]);

  const reels = useMemo(() => filterFeedReels(posts), [posts]);
  const plainPosts = useMemo(() => posts.filter((post) => !post.videoSrc?.trim()), [posts]);

  const visibleItems = useMemo(() => {
    if (tab === "saved") return savedPosts;
    if (tab === "reels") return reels;
    if (tab === "posts") return plainPosts;
    return posts;
  }, [plainPosts, posts, reels, savedPosts, tab]);

  const handleDeletePost = useCallback(
    (post: FeedPost) => {
      if (!isOwnProfile || !profileUserId) return;
      const isReel = Boolean(post.videoSrc?.trim());

      Alert.alert(
        isReel ? "Delete reel?" : "Delete post?",
        "This cannot be undone.",
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Delete",
            style: "destructive",
            onPress: () => {
              void (async () => {
                const result = await deleteFeedPost(post.id, profileUserId);
                if (!result.ok) {
                  Alert.alert("Unable to delete", result.error || "Try again.");
                  return;
                }
                setPosts((current) => current.filter((item) => item.id !== post.id));
                setSavedPosts((current) => current.filter((item) => item.id !== post.id));
              })();
            },
          },
        ]
      );
    },
    [isOwnProfile, profileUserId]
  );

  const openPost = useCallback((postId: string) => {
    router.push({ pathname: `/feed-post/${postId}`, params: { viewerRole } });
  }, [viewerRole]);

  const handleToggleFollow = useCallback(async () => {
    if (!viewerUserId || !viewerProfileKey || isOwnProfile || followBusy) return;

    setFollowBusy(true);
    try {
      if (isFollowing) {
        const result = await removeFeedFollow({
          followerId: viewerUserId,
          followedProfileKey: profileKey,
        });
        if (!result.ok) return;
        setIsFollowing(false);
        setFollowerCount((count) => Math.max(0, count - 1));
        return;
      }

      const followedUserId =
        profileUserId ||
        posts[0]?.authorId ||
        (await resolveFeedRecipientUserId(profileKey, authorId));

      const result = await persistFeedFollow({
        followerId: viewerUserId,
        followerProfileKey: viewerProfileKey,
        followedProfileKey: profileKey,
        followedProfileId: followedUserId || undefined,
      });
      if (!result.ok) return;
      setIsFollowing(true);
      setIsFollowedByViewer(false);
      setFollowerCount((count) => count + 1);
    } finally {
      setFollowBusy(false);
    }
  }, [
    followBusy,
    isFollowing,
    isOwnProfile,
    posts,
    profileKey,
    profileUserId,
    viewerProfileKey,
    viewerUserId,
  ]);

  const openEditSheet = useCallback(() => {
    if (!isOwnProfile || !profileUserId) return;
    editSheetRef.current?.open({ userId: profileUserId, bio, link });
  }, [bio, isOwnProfile, link, profileUserId]);

  const handleOpenLink = useCallback(async () => {
    if (!link.trim()) return;
    const url = normalizeFeedProfileLink(link);
    const canOpen = await Linking.canOpenURL(url);
    if (canOpen) {
      await Linking.openURL(url);
    }
  }, [link]);

  const profileTabs = useMemo(() => {
    const tabs: FeedProfileTab[] = ["all", "posts", "reels"];
    if (isOwnProfile) tabs.push("saved");
    return tabs;
  }, [isOwnProfile]);

  const showFollowBack = !isFollowing && isFollowedByViewer;
  const followLabel = isFollowing ? "Following" : showFollowBack ? "Follow back" : "Follow";

  return (
    <SafeAreaView style={styles.root} edges={["top", "bottom"]}>
      <View style={styles.toolbar}>
        <Pressable onPress={() => router.back()} hitSlop={8} style={styles.toolbarSide}>
          <Ionicons name="chevron-back" size={24} color={colors.ink} />
        </Pressable>
        <FeedAuthorName
          name={displayName}
          verified={isOfficial}
          textStyle={styles.toolbarTitle}
          numberOfLines={1}
          badgeSize={16}
          style={styles.toolbarTitleWrap}
        />
        {isOwnProfile ? (
          <Pressable onPress={openEditSheet} hitSlop={8} style={styles.toolbarSide}>
            <Ionicons name="create-outline" size={22} color={colors.ink} />
          </Pressable>
        ) : (
          <View style={styles.toolbarSide} />
        )}
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <View style={styles.hero}>
          <ProfileAvatar name={displayName} avatarSrc={profileAvatar} />
          <View style={styles.heroStats}>
            <View style={styles.statBlock}>
              <Text style={styles.statValue}>{posts.length}</Text>
              <Text style={styles.statLabel}>Posts</Text>
            </View>
            <View style={styles.statBlock}>
              <Text style={styles.statValue}>{reels.length}</Text>
              <Text style={styles.statLabel}>Reels</Text>
            </View>
            <View style={styles.statBlock}>
              <Text style={styles.statValue}>{formatEngagementCount(followerCount)}</Text>
              <Text style={styles.statLabel}>Followers</Text>
            </View>
          </View>
        </View>

        <View style={styles.metaBlock}>
          <FeedAuthorName
            name={displayName}
            verified={isOfficial}
            textStyle={styles.displayName}
            badgeSize={18}
          />
          <Text style={styles.roleMeta}>{role} · Alpha Freight network</Text>

          {bio ? (
            <Pressable
              style={({ pressed }) => [styles.infoRow, isOwnProfile && pressed && styles.pressed]}
              onPress={isOwnProfile ? openEditSheet : undefined}
            >
              <Ionicons name="document-text-outline" size={16} color={colors.muted} />
              <Text style={styles.bioText}>{bio}</Text>
            </Pressable>
          ) : isOwnProfile ? (
            <Pressable
              style={({ pressed }) => [styles.addRow, pressed && styles.pressed]}
              onPress={openEditSheet}
            >
              <Ionicons name="create-outline" size={16} color={colors.ink} />
              <Text style={styles.addRowText}>Add bio</Text>
            </Pressable>
          ) : null}

          {link ? (
            <Pressable
              style={({ pressed }) => [styles.infoRow, pressed && styles.pressed]}
              onPress={() => void handleOpenLink()}
            >
              <Ionicons name="link-outline" size={16} color={colors.ink} />
              <Text style={styles.linkText}>{formatFeedProfileLink(link)}</Text>
            </Pressable>
          ) : isOwnProfile ? (
            <Pressable
              style={({ pressed }) => [styles.addRow, pressed && styles.pressed]}
              onPress={openEditSheet}
            >
              <Ionicons name="link-outline" size={16} color={colors.ink} />
              <Text style={styles.addRowText}>Add link</Text>
            </Pressable>
          ) : null}
        </View>

        {!isOwnProfile ? (
          <Pressable
            style={({ pressed }) => [
              styles.followBtn,
              isFollowing && styles.followBtnActive,
              showFollowBack && styles.followBackBtn,
              pressed && styles.pressed,
              followBusy && styles.followBtnDisabled,
            ]}
            onPress={() => void handleToggleFollow()}
            disabled={followBusy || !viewerUserId}
          >
            {followBusy ? (
              <ActivityIndicator
                size="small"
                color={isFollowing || showFollowBack ? colors.ink : colors.white}
              />
            ) : (
              <View style={styles.followBtnInner}>
                {showFollowBack ? (
                  <Ionicons name="person-add" size={16} color={colors.ink} />
                ) : null}
                <Text
                  style={[
                    styles.followBtnText,
                    (isFollowing || showFollowBack) && styles.followBtnTextActive,
                  ]}
                >
                  {followLabel}
                </Text>
              </View>
            )}
          </Pressable>
        ) : null}

        <View style={styles.tabs}>
          {profileTabs.map((item) => {
            const active = tab === item;
            const label =
              item === "all"
                ? "All"
                : item === "posts"
                  ? "Posts"
                  : item === "reels"
                    ? "Reels"
                    : "Saved";
            return (
              <Pressable
                key={item}
                style={[styles.tabBtn, active && styles.tabBtnActive]}
                onPress={() => setTab(item)}
              >
                <Text style={[styles.tabText, active && styles.tabTextActive]}>{label}</Text>
              </Pressable>
            );
          })}
        </View>

        {loading ? (
          <View style={styles.loadingWrap}>
            <ActivityIndicator color={colors.ink} />
          </View>
        ) : visibleItems.length ? (
          <View style={styles.grid}>
            {visibleItems.map((item) => (
              <View key={item.id} style={styles.gridCell}>
                <PostGridItem
                  post={item}
                  onPress={() => openPost(item.id)}
                  onLongPress={
                    isOwnProfile && tab !== "saved" ? () => handleDeletePost(item) : undefined
                  }
                />
              </View>
            ))}
          </View>
        ) : (
          <View style={styles.emptyWrap}>
            <Ionicons
              name={tab === "saved" ? "bookmark-outline" : "images-outline"}
              size={34}
              color={colors.mutedLight}
            />
            <Text style={styles.emptyTitle}>
              {tab === "saved"
                ? "No saved posts yet"
                : `No ${tab === "all" ? "content" : tab} yet`}
            </Text>
            <Text style={styles.emptyBody}>
              {tab === "saved"
                ? "Bookmark posts from the feed to find them here."
                : isOwnProfile
                  ? "Share your first post or reel from the feed composer."
                  : "This profile has not published here yet."}
            </Text>
          </View>
        )}
      </ScrollView>

      <FeedProfileEditSheet
        ref={editSheetRef}
        onSaved={({ bio: nextBio, link: nextLink }) => {
          setBio(nextBio);
          setLink(nextLink);
        }}
      />
    </SafeAreaView>
  );
}

const GRID_GAP = 2;

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.white,
  },
  toolbar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  toolbarSide: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  toolbarTitleWrap: {
    flex: 1,
    justifyContent: "center",
  },
  toolbarTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: colors.ink,
    textAlign: "center",
  },
  scrollContent: {
    paddingBottom: spacing.xxl,
  },
  hero: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    gap: spacing.lg,
  },
  heroAvatar: {
    width: 86,
    height: 86,
    borderRadius: 43,
    backgroundColor: colors.canvas,
    borderWidth: 1,
    borderColor: colors.border,
  },
  heroAvatarFallback: {
    width: 86,
    height: 86,
    borderRadius: 43,
    backgroundColor: colors.brand,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: colors.ink,
  },
  heroAvatarText: {
    fontSize: 28,
    fontWeight: "800",
    color: colors.ink,
  },
  heroStats: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  statBlock: {
    alignItems: "center",
    gap: 2,
  },
  statValue: {
    fontSize: 18,
    fontWeight: "800",
    color: colors.ink,
  },
  statLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.muted,
  },
  metaBlock: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    gap: 8,
  },
  displayName: {
    fontSize: 18,
    fontWeight: "800",
    color: colors.ink,
  },
  roleMeta: {
    fontSize: 13,
    fontWeight: "500",
    color: colors.muted,
    textTransform: "capitalize",
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
  },
  bioText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
    color: colors.ink,
    fontWeight: "500",
  },
  linkText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
    color: colors.ink,
    fontWeight: "700",
  },
  addRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    alignSelf: "flex-start",
    paddingVertical: 2,
  },
  addRowText: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.ink,
  },
  followBtn: {
    marginHorizontal: spacing.lg,
    marginTop: spacing.md,
    height: 42,
    borderRadius: radius.pill,
    backgroundColor: colors.black,
    alignItems: "center",
    justifyContent: "center",
  },
  followBtnActive: {
    backgroundColor: colors.canvas,
    borderWidth: 1,
    borderColor: colors.border,
  },
  followBackBtn: {
    backgroundColor: colors.brand,
    borderWidth: 1,
    borderColor: colors.ink,
  },
  followBtnInner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  followBtnDisabled: {
    opacity: 0.7,
  },
  followBtnText: {
    fontSize: 14,
    fontWeight: "800",
    color: colors.white,
  },
  followBtnTextActive: {
    color: colors.ink,
  },
  tabs: {
    flexDirection: "row",
    marginTop: spacing.lg,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  tabBtn: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 2,
    borderBottomColor: "transparent",
  },
  tabBtnActive: {
    borderBottomColor: colors.black,
  },
  tabText: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.muted,
  },
  tabTextActive: {
    color: colors.ink,
  },
  loadingWrap: {
    paddingVertical: spacing.xxl,
    alignItems: "center",
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: GRID_GAP,
    paddingTop: GRID_GAP,
  },
  gridCell: {
    width: "33.333%",
    paddingHorizontal: GRID_GAP / 2,
    marginBottom: GRID_GAP,
  },
  gridItem: {
    width: "100%",
    aspectRatio: 1,
    backgroundColor: colors.canvas,
    overflow: "hidden",
  },
  gridImage: {
    width: "100%",
    height: "100%",
  },
  gridPlaceholder: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.canvas,
  },
  gridReelBadge: {
    position: "absolute",
    top: 6,
    right: 6,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: "rgba(0,0,0,0.55)",
    alignItems: "center",
    justifyContent: "center",
  },
  gridOverlay: {
    position: "absolute",
    left: 6,
    bottom: 6,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  gridStat: {
    fontSize: 11,
    fontWeight: "700",
    color: colors.white,
  },
  emptyWrap: {
    alignItems: "center",
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.xxl,
    gap: spacing.sm,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: colors.ink,
  },
  emptyBody: {
    fontSize: 14,
    color: colors.muted,
    textAlign: "center",
    lineHeight: 20,
  },
  pressed: {
    opacity: 0.82,
  },
});
