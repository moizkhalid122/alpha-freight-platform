import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import FeedAuthorName from "@/components/feed/FeedAuthorName";
import {
  DiscoverProfileResult,
  fetchDiscoverGridPosts,
  searchFeedNetworkProfiles,
} from "@/lib/feed-profile-search";
import { openFeedProfile } from "@/lib/feed-profile-nav";
import { optimizeFeedImageUrl } from "@/lib/feed-image-url";
import type { FeedPost } from "@/lib/feed-posts";
import { colors, radius, spacing } from "@/lib/theme";

type FeedDiscoverScreenProps = {
  role: "carrier" | "supplier";
};

function DiscoverGridTile({ post, onPress }: { post: FeedPost; onPress: () => void }) {
  const thumb = post.imageSrc || post.videoSrc;
  const isReel = Boolean(post.videoSrc?.trim());

  return (
    <Pressable style={({ pressed }) => [styles.gridCell, pressed && styles.pressed]} onPress={onPress}>
      {thumb ? (
        <Image source={{ uri: optimizeFeedImageUrl(thumb, 360) }} style={styles.gridImage} resizeMode="cover" />
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
    </Pressable>
  );
}

function DiscoverProfileRow({
  profile,
  onPress,
}: {
  profile: DiscoverProfileResult;
  onPress: () => void;
}) {
  const initials = profile.name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <Pressable
      style={({ pressed }) => [styles.profileRow, pressed && styles.pressed]}
      onPress={onPress}
    >
      {profile.avatarUrl ? (
        <Image
          source={{ uri: optimizeFeedImageUrl(profile.avatarUrl, 120) }}
          style={styles.profileAvatar}
        />
      ) : (
        <View style={styles.profileAvatarFallback}>
          <Text style={styles.profileAvatarText}>{initials || "AF"}</Text>
        </View>
      )}

      <View style={styles.profileCopy}>
        <FeedAuthorName
          name={profile.name}
          verified={profile.isOfficial}
          textStyle={styles.profileName}
          badgeSize={16}
        />
        <Text style={styles.profileMeta}>
          {profile.role} · {profile.postCount} posts
        </Text>
        {profile.bio ? (
          <Text style={styles.profileBio} numberOfLines={1}>
            {profile.bio}
          </Text>
        ) : null}
      </View>

      <Ionicons name="chevron-forward" size={18} color={colors.mutedLight} />
    </Pressable>
  );
}

export default function FeedDiscoverScreen({ role }: FeedDiscoverScreenProps) {
  const [query, setQuery] = useState("");
  const [loadingSearch, setLoadingSearch] = useState(false);
  const [loadingGrid, setLoadingGrid] = useState(true);
  const [results, setResults] = useState<DiscoverProfileResult[]>([]);
  const [gridPosts, setGridPosts] = useState<FeedPost[]>([]);

  const isSearching = query.trim().length > 0;

  useEffect(() => {
    void (async () => {
      setLoadingGrid(true);
      try {
        const posts = await fetchDiscoverGridPosts();
        setGridPosts(posts);
      } finally {
        setLoadingGrid(false);
      }
    })();
  }, []);

  useEffect(() => {
    const needle = query.trim();
    if (!needle) {
      setResults([]);
      setLoadingSearch(false);
      return;
    }

    setLoadingSearch(true);
    const timer = setTimeout(() => {
      void (async () => {
        try {
          const profiles = await searchFeedNetworkProfiles(needle);
          setResults(profiles);
        } finally {
          setLoadingSearch(false);
        }
      })();
    }, 260);

    return () => clearTimeout(timer);
  }, [query]);

  const openProfile = useCallback(
    (profile: DiscoverProfileResult) => {
      openFeedProfile({
        profileKey: profile.profileKey,
        name: profile.name,
        role: profile.role,
        avatarSrc: profile.avatarUrl,
        authorId: profile.userId,
        viewerRole: role,
      });
    },
    [role]
  );

  const openPost = useCallback(
    (postId: string) => {
      router.push({ pathname: `/feed-post/${postId}`, params: { viewerRole: role } });
    },
    [role]
  );

  return (
    <SafeAreaView style={styles.root} edges={["top"]}>
      <View style={styles.toolbar}>
        <Pressable onPress={() => router.back()} hitSlop={8} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color={colors.ink} />
        </Pressable>
        <Text style={styles.title}>Discover</Text>
        <View style={styles.backBtn} />
      </View>

      <View style={styles.searchWrap}>
        <Ionicons name="search-outline" size={18} color={colors.muted} />
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Search the Alpha Freight network"
          placeholderTextColor={colors.mutedLight}
          style={styles.searchInput}
          autoCapitalize="none"
          autoCorrect={false}
          returnKeyType="search"
        />
        {query ? (
          <Pressable onPress={() => setQuery("")} hitSlop={8}>
            <Ionicons name="close-circle" size={18} color={colors.mutedLight} />
          </Pressable>
        ) : null}
      </View>

      {isSearching ? (
        loadingSearch ? (
          <View style={styles.loadingWrap}>
            <ActivityIndicator color={colors.ink} />
          </View>
        ) : results.length ? (
          <FlatList
            data={results}
            keyExtractor={(item) => item.userId}
            contentContainerStyle={styles.listContent}
            keyboardShouldPersistTaps="handled"
            renderItem={({ item }) => (
              <DiscoverProfileRow profile={item} onPress={() => openProfile(item)} />
            )}
          />
        ) : (
          <View style={styles.emptyWrap}>
            <Ionicons name="people-outline" size={36} color={colors.mutedLight} />
            <Text style={styles.emptyTitle}>No profiles found</Text>
            <Text style={styles.emptyBody}>Try a company name, carrier, or supplier.</Text>
          </View>
        )
      ) : loadingGrid ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator color={colors.ink} />
        </View>
      ) : gridPosts.length ? (
        <FlatList
          data={gridPosts}
          keyExtractor={(item) => item.id}
          numColumns={3}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.gridContent}
          columnWrapperStyle={styles.gridRow}
          renderItem={({ item }) => (
            <DiscoverGridTile post={item} onPress={() => openPost(item.id)} />
          )}
        />
      ) : (
        <View style={styles.emptyWrap}>
          <Ionicons name="images-outline" size={36} color={colors.mutedLight} />
          <Text style={styles.emptyTitle}>No posts yet</Text>
          <Text style={styles.emptyBody}>
            Real posts and reels from the network will appear here as members publish.
          </Text>
        </View>
      )}
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
  },
  backBtn: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontSize: 18,
    fontWeight: "800",
    color: colors.ink,
    letterSpacing: -0.3,
  },
  searchWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
    paddingHorizontal: spacing.md,
    height: 46,
    borderRadius: radius.lg,
    backgroundColor: colors.canvas,
    borderWidth: 1,
    borderColor: colors.border,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: colors.ink,
    fontWeight: "500",
  },
  loadingWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  listContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxl,
    gap: 10,
  },
  profileRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  profileAvatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.canvas,
  },
  profileAvatarFallback: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.brand,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: colors.ink,
  },
  profileAvatarText: {
    fontSize: 16,
    fontWeight: "800",
    color: colors.ink,
  },
  profileCopy: {
    flex: 1,
    gap: 2,
  },
  profileName: {
    fontSize: 16,
    fontWeight: "800",
    color: colors.ink,
  },
  profileMeta: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.muted,
    textTransform: "capitalize",
  },
  profileBio: {
    fontSize: 13,
    color: colors.muted,
  },
  gridContent: {
    paddingHorizontal: GRID_GAP,
    paddingBottom: spacing.xxl,
  },
  gridRow: {
    gap: GRID_GAP,
    marginBottom: GRID_GAP,
  },
  gridCell: {
    flex: 1,
    aspectRatio: 1,
    backgroundColor: colors.canvas,
    overflow: "hidden",
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
  gridImage: {
    width: "100%",
    height: "100%",
  },
  emptyWrap: {
    alignItems: "center",
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xxl,
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
