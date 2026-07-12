import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { FEED_CATEGORIES, type FeedCategory } from "@/lib/feed-posts";
import { setCachedFeedPosts, prefetchFeedPosts } from "@/lib/feed-cache";
import {
  categoryToInterestTag,
  createFeedDistributionId,
  extractFeedInterestTags,
  fetchFeedPublisherProfile,
  pickFeedPostImage,
  persistFeedPost,
  uploadFeedImageFromUri,
  type FeedPublisherProfile,
} from "@/lib/feed-publish";
import { colors, radius, spacing } from "@/lib/theme";

type FeedCreatePostScreenProps = {
  role: "carrier" | "supplier";
};

const COMPOSER_CATEGORIES = FEED_CATEGORIES.filter((item) => item !== "ALL");

export default function FeedCreatePostScreen({ role }: FeedCreatePostScreenProps) {
  const [content, setContent] = useState("");
  const [category, setCategory] = useState<FeedCategory>("LOADS");
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [imageMimeType, setImageMimeType] = useState<string | undefined>();
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [publisher, setPublisher] = useState<FeedPublisherProfile | null>(null);
  const [publishing, setPublishing] = useState(false);

  const canPublish = useMemo(
    () => Boolean(content.trim() || imageUri) && !publishing,
    [content, imageUri, publishing]
  );

  useEffect(() => {
    let mounted = true;

    void (async () => {
      try {
        const profile = await fetchFeedPublisherProfile(role);
        if (!mounted) return;

        if (!profile) {
          Alert.alert("Sign in required", "Please sign in to create a feed post.", [
            { text: "OK", onPress: () => router.back() },
          ]);
          router.back();
          return;
        }

        setPublisher(profile);
      } catch (error) {
        if (!mounted) return;
        Alert.alert(
          "Unable to open composer",
          error instanceof Error ? error.message : "Please try again."
        );
        router.back();
      } finally {
        if (mounted) {
          setLoadingProfile(false);
        }
      }
    })();

    return () => {
      mounted = false;
    };
  }, [role]);

  const handlePickImage = useCallback(async () => {
    try {
      const asset = await pickFeedPostImage();
      if (!asset?.uri) return;
      setImageUri(asset.uri);
      setImageMimeType(asset.mimeType || undefined);
    } catch (error) {
      Alert.alert(
        "Photo unavailable",
        error instanceof Error ? error.message : "Unable to open your photo library."
      );
    }
  }, []);

  const handleRemoveImage = useCallback(() => {
    setImageUri(null);
    setImageMimeType(undefined);
  }, []);

  const handlePublish = useCallback(async () => {
    if (!canPublish || !publisher) return;

    const profile = publisher;

    const trimmedContent = content.trim();
    if (!trimmedContent && !imageUri) {
      Alert.alert("Add content", "Write something or attach an image before posting.");
      return;
    }

    setPublishing(true);

    try {
      let imageUrl: string | undefined;
      let imageStoragePath: string | undefined;

      if (imageUri) {
        const upload = await uploadFeedImageFromUri(profile.userId, imageUri, imageMimeType);
        if (!upload.ok) {
          throw new Error(upload.error);
        }
        imageUrl = upload.publicUrl;
        imageStoragePath = upload.path;
      }

      const categoryTag = categoryToInterestTag(category);
      const interestTags = extractFeedInterestTags(
        trimmedContent,
        categoryTag,
        imageUri ? "image" : ""
      );
      if (categoryTag && !interestTags.includes(categoryTag)) {
        interestTags.unshift(categoryTag);
      }

      const distributionId = createFeedDistributionId(profile.identityKey);
      const result = await persistFeedPost({
        distributionId,
        authorId: profile.userId,
        authorName: profile.name,
        authorEmail: profile.email,
        authorProfileKey: profile.profileKey,
        authorRole: profile.role,
        authorAvatar: profile.avatar,
        content: trimmedContent || "Shared an update on Alpha Freight.",
        imageUrl,
        imageStoragePath,
        interestTags,
      });

      if (!result.ok) {
        throw new Error(result.error);
      }

      setCachedFeedPosts(null);
      await prefetchFeedPosts(true);
      router.back();
    } catch (error) {
      Alert.alert(
        "Publish failed",
        error instanceof Error ? error.message : "Unable to publish your post."
      );
    } finally {
      setPublishing(false);
    }
  }, [canPublish, category, content, imageMimeType, imageUri, publisher]);

  if (loadingProfile) {
    return (
      <View style={styles.loadingWrap}>
        <ActivityIndicator color={colors.ink} />
      </View>
    );
  }

  if (!publisher) {
    return null;
  }

  return (
    <SafeAreaView style={styles.root} edges={["top", "bottom"]}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View style={styles.toolbar}>
          <Pressable onPress={() => router.back()} hitSlop={8} style={styles.toolbarBtn}>
            <Ionicons name="close" size={24} color={colors.ink} />
          </Pressable>
          <Text style={styles.toolbarTitle}>Create post</Text>
          <Pressable
            onPress={() => void handlePublish()}
            disabled={!canPublish}
            style={[styles.postBtn, !canPublish && styles.postBtnDisabled]}
          >
            {publishing ? (
              <ActivityIndicator size="small" color={colors.ink} />
            ) : (
              <Text style={styles.postBtnText}>Post</Text>
            )}
          </Pressable>
        </View>

        <ScrollView
          style={styles.flex}
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={styles.publisherLabel}>Posting as {publisher.name}</Text>

          <TextInput
            value={content}
            onChangeText={setContent}
            placeholder={
              role === "carrier"
                ? "Share a fleet update, route win, or market insight..."
                : "Share load demand, lane updates, or supplier news..."
            }
            placeholderTextColor={colors.mutedLight}
            style={styles.input}
            multiline
            maxLength={1200}
            textAlignVertical="top"
            editable={!publishing}
          />

          <View style={styles.categoryBlock}>
            <Text style={styles.sectionLabel}>Category</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.categoryRow}>
                {COMPOSER_CATEGORIES.map((item) => {
                  const active = category === item;
                  return (
                    <Pressable
                      key={item}
                      style={[styles.categoryChip, active && styles.categoryChipActive]}
                      onPress={() => setCategory(item)}
                      disabled={publishing}
                    >
                      <Text style={[styles.categoryChipText, active && styles.categoryChipTextActive]}>
                        {item}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </ScrollView>
          </View>

          {imageUri ? (
            <View style={styles.previewWrap}>
              <Image source={{ uri: imageUri }} style={styles.previewImage} resizeMode="cover" />
              <Pressable style={styles.removeImageBtn} onPress={handleRemoveImage} hitSlop={8}>
                <Ionicons name="close-circle" size={24} color={colors.white} />
              </Pressable>
            </View>
          ) : (
            <Pressable
              style={({ pressed }) => [styles.attachBtn, pressed && styles.attachBtnPressed]}
              onPress={() => void handlePickImage()}
              disabled={publishing}
            >
              <Ionicons name="image-outline" size={20} color={colors.ink} />
              <Text style={styles.attachBtnText}>Add photo</Text>
            </Pressable>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.white,
  },
  flex: {
    flex: 1,
  },
  loadingWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.white,
  },
  toolbar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  toolbarBtn: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  toolbarTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: colors.black,
  },
  postBtn: {
    minWidth: 64,
    height: 36,
    paddingHorizontal: spacing.md,
    borderRadius: radius.pill,
    backgroundColor: colors.brand,
    borderWidth: 1,
    borderColor: colors.ink,
    alignItems: "center",
    justifyContent: "center",
  },
  postBtnDisabled: {
    opacity: 0.45,
  },
  postBtnText: {
    fontSize: 14,
    fontWeight: "800",
    color: colors.ink,
  },
  content: {
    padding: spacing.lg,
    gap: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  publisherLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.muted,
  },
  input: {
    minHeight: 160,
    fontSize: 17,
    lineHeight: 24,
    color: colors.black,
    fontWeight: "500",
  },
  categoryBlock: {
    gap: spacing.sm,
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.muted,
  },
  categoryRow: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  categoryChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.white,
  },
  categoryChipActive: {
    backgroundColor: colors.black,
    borderColor: colors.black,
  },
  categoryChipText: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.muted,
    letterSpacing: 0.4,
  },
  categoryChipTextActive: {
    color: colors.white,
  },
  attachBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    alignSelf: "flex-start",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  attachBtnPressed: {
    opacity: 0.75,
  },
  attachBtnText: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.ink,
  },
  previewWrap: {
    borderRadius: radius.lg,
    overflow: "hidden",
    backgroundColor: colors.canvas,
  },
  previewImage: {
    width: "100%",
    height: 220,
  },
  removeImageBtn: {
    position: "absolute",
    top: spacing.sm,
    right: spacing.sm,
    backgroundColor: "rgba(0,0,0,0.35)",
    borderRadius: 12,
  },
});
