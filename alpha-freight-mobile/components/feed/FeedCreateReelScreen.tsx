import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
import { useVideoPlayer, VideoView } from "expo-video";
import { FEED_CATEGORIES, type FeedCategory } from "@/lib/feed-posts";
import { setCachedFeedPosts, prefetchFeedPosts } from "@/lib/feed-cache";
import { compressReelVideoForUpload } from "@/lib/reel-video-compress";
import { generateReelPosterFromVideo } from "@/lib/reel-poster";
import {
  categoryToInterestTag,
  createReelDistributionId,
  extractFeedInterestTags,
  fetchFeedPublisherProfile,
  persistFeedPost,
  pickFeedReelCoverImage,
  pickFeedReelVideo,
  registerReelForStreamProcessing,
  uploadFeedReelCoverFromUri,
  uploadFeedVideoFromUri,
  type FeedPublisherProfile,
} from "@/lib/feed-publish";
import { colors, radius, spacing } from "@/lib/theme";
import ReelUploadProgressSheet from "@/components/feed/ReelUploadProgressSheet";

type FeedCreateReelScreenProps = {
  role: "carrier" | "supplier";
};

const COMPOSER_CATEGORIES = FEED_CATEGORIES.filter((item) => item !== "ALL");

function ReelVideoPreview({ uri }: { uri: string }) {
  const player = useVideoPlayer(uri, (instance) => {
    instance.loop = true;
    instance.muted = true;
    instance.play();
  });

  return (
    <VideoView
      player={player}
      style={styles.previewVideo}
      contentFit="cover"
      nativeControls={false}
      allowsPictureInPicture={false}
    />
  );
}

export default function FeedCreateReelScreen({ role }: FeedCreateReelScreenProps) {
  const [caption, setCaption] = useState("");
  const [category, setCategory] = useState<FeedCategory>("LOADS");
  const [videoUri, setVideoUri] = useState<string | null>(null);
  const [videoMimeType, setVideoMimeType] = useState<string | undefined>();
  const [coverUri, setCoverUri] = useState<string | null>(null);
  const [coverMimeType, setCoverMimeType] = useState<string | undefined>();
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [publisher, setPublisher] = useState<FeedPublisherProfile | null>(null);
  const [publishing, setPublishing] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadLabel, setUploadLabel] = useState("");
  const [uploadComplete, setUploadComplete] = useState(false);
  const [uploadSheetVisible, setUploadSheetVisible] = useState(false);
  const uploadTickRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const clearUploadTick = useCallback(() => {
    if (uploadTickRef.current) {
      clearInterval(uploadTickRef.current);
      uploadTickRef.current = null;
    }
  }, []);

  const startUploadTick = useCallback((from: number, to: number) => {
    clearUploadTick();
    let value = from;
    uploadTickRef.current = setInterval(() => {
      value = Math.min(to - 1, value + 1);
      setUploadProgress(value);
    }, 160);
  }, [clearUploadTick]);

  useEffect(() => () => clearUploadTick(), [clearUploadTick]);

  const canPublish = useMemo(
    () => Boolean(videoUri && caption.trim()) && !publishing,
    [videoUri, caption, publishing]
  );

  useEffect(() => {
    let mounted = true;

    void (async () => {
      try {
        const profile = await fetchFeedPublisherProfile(role);
        if (!mounted) return;

        if (!profile) {
          Alert.alert("Sign in required", "Please sign in to upload a reel.", [
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

  const handlePickVideo = useCallback(async () => {
    try {
      const asset = await pickFeedReelVideo();
      if (!asset?.uri) return;
      setVideoUri(asset.uri);
      setVideoMimeType(asset.mimeType || undefined);
    } catch (error) {
      Alert.alert(
        "Video unavailable",
        error instanceof Error ? error.message : "Unable to open your video library."
      );
    }
  }, []);

  const handlePickCover = useCallback(async () => {
    try {
      const asset = await pickFeedReelCoverImage();
      if (!asset?.uri) return;
      setCoverUri(asset.uri);
      setCoverMimeType(asset.mimeType || undefined);
    } catch (error) {
      Alert.alert(
        "Cover unavailable",
        error instanceof Error ? error.message : "Unable to open your photo library."
      );
    }
  }, []);

  const handlePublish = useCallback(async () => {
    if (!canPublish || !publisher || !videoUri) return;

    const profile = publisher;
    const trimmedCaption = caption.trim();
    if (!trimmedCaption) {
      Alert.alert("Add a caption", "Write a short description for your reel.");
      return;
    }

    setPublishing(true);
    setUploadComplete(false);
    setUploadProgress(0);
    setUploadLabel("Optimizing video...");
    setUploadSheetVisible(true);

    try {
      const { uri: optimizedUri } = await compressReelVideoForUpload(videoUri, (progress) => {
        if (progress > 0) {
          const mapped = Math.round(progress * 0.35);
          setUploadProgress(mapped);
          if (progress < 100) {
            setUploadLabel(`Optimizing video... ${progress}%`);
          }
        }
      });

      setUploadProgress(35);
      setUploadLabel("Uploading video...");
      startUploadTick(35, 80);

      const videoUpload = await uploadFeedVideoFromUri(
        profile.userId,
        optimizedUri,
        "video/mp4"
      );
      clearUploadTick();
      if (!videoUpload.ok) {
        throw new Error(videoUpload.error);
      }

      setUploadProgress(82);

      let imageUrl = profile.avatar;
      let imageStoragePath: string | undefined;
      let posterPublicUrl: string | undefined;

      const coverSourceUri = coverUri || (await generateReelPosterFromVideo(optimizedUri));
      if (coverSourceUri) {
        setUploadLabel("Uploading cover...");
        setUploadProgress(88);
        const coverUpload = await uploadFeedReelCoverFromUri(
          profile.userId,
          coverSourceUri,
          coverMimeType || "image/jpeg"
        );
        if (!coverUpload.ok) {
          throw new Error(coverUpload.error);
        }
        imageUrl = coverUpload.publicUrl;
        imageStoragePath = coverUpload.path;
        posterPublicUrl = coverUpload.publicUrl;
        setUploadProgress(92);
      }

      const categoryTag = categoryToInterestTag(category);
      const interestTags = extractFeedInterestTags(trimmedCaption, categoryTag, "reel video");
      if (categoryTag && !interestTags.includes(categoryTag)) {
        interestTags.unshift(categoryTag);
      }
      if (!interestTags.includes("reels")) {
        interestTags.unshift("reels");
      }

      setUploadLabel("Publishing reel...");
      setUploadProgress(96);
      const distributionId = createReelDistributionId(profile.identityKey);
      const result = await persistFeedPost({
        distributionId,
        authorId: profile.userId,
        authorName: profile.name,
        authorEmail: profile.email,
        authorProfileKey: profile.profileKey,
        authorRole: profile.role,
        authorAvatar: profile.avatar,
        content: trimmedCaption,
        imageUrl,
        imageStoragePath,
        videoUrl: videoUpload.publicUrl,
        videoStoragePath: videoUpload.path,
        videoPosterUrl: posterPublicUrl,
        videoProcessingStatus: "pending",
        interestTags,
      });

      if (!result.ok) {
        throw new Error(result.error);
      }

      void registerReelForStreamProcessing({
        distributionId,
        videoUrl: videoUpload.publicUrl,
        posterUrl: posterPublicUrl,
        authorId: profile.userId,
      });

      setCachedFeedPosts(null);
      await prefetchFeedPosts(true);

      setUploadProgress(100);
      setUploadComplete(true);
      setUploadLabel("Reel uploaded successfully");

      await new Promise((resolve) => setTimeout(resolve, 850));
      setUploadSheetVisible(false);
    } catch (error) {
      clearUploadTick();
      setUploadSheetVisible(false);
      Alert.alert(
        "Publish failed",
        error instanceof Error ? error.message : "Unable to publish your reel."
      );
    } finally {
      setPublishing(false);
    }
  }, [
    canPublish,
    caption,
    category,
    clearUploadTick,
    coverMimeType,
    coverUri,
    publisher,
    startUploadTick,
    videoUri,
  ]);

  const handleUploadSheetDismissed = useCallback(() => {
    if (uploadComplete) {
      router.back();
    }
    setUploadComplete(false);
    setUploadProgress(0);
    setUploadLabel("");
  }, [uploadComplete]);

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
          <Text style={styles.toolbarTitle}>Upload reel</Text>
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

          {videoUri ? (
            <View style={styles.previewWrap}>
              <ReelVideoPreview uri={videoUri} />
              <Pressable
                style={styles.changeVideoBtn}
                onPress={() => void handlePickVideo()}
                disabled={publishing}
              >
                <Ionicons name="film-outline" size={16} color={colors.white} />
                <Text style={styles.changeVideoText}>Change video</Text>
              </Pressable>
            </View>
          ) : (
            <Pressable
              style={({ pressed }) => [styles.pickVideoBtn, pressed && styles.pickVideoBtnPressed]}
              onPress={() => void handlePickVideo()}
              disabled={publishing}
            >
              <Ionicons name="videocam-outline" size={28} color={colors.ink} />
              <Text style={styles.pickVideoTitle}>Choose reel video</Text>
              <Text style={styles.pickVideoHint}>Vertical video works best (9:16)</Text>
            </Pressable>
          )}

          <TextInput
            value={caption}
            onChangeText={setCaption}
            placeholder="Write a caption for your reel..."
            placeholderTextColor={colors.mutedLight}
            style={styles.input}
            multiline
            maxLength={800}
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

          {coverUri ? (
            <View style={styles.coverWrap}>
              <Image source={{ uri: coverUri }} style={styles.coverImage} resizeMode="cover" />
              <Pressable style={styles.removeCoverBtn} onPress={() => setCoverUri(null)} hitSlop={8}>
                <Ionicons name="close-circle" size={24} color={colors.white} />
              </Pressable>
            </View>
          ) : (
            <Pressable
              style={({ pressed }) => [styles.attachBtn, pressed && styles.attachBtnPressed]}
              onPress={() => void handlePickCover()}
              disabled={publishing}
            >
              <Ionicons name="image-outline" size={20} color={colors.ink} />
              <Text style={styles.attachBtnText}>Add cover photo (optional)</Text>
            </Pressable>
          )}
        </ScrollView>

        <ReelUploadProgressSheet
          visible={uploadSheetVisible}
          progress={uploadProgress}
          label={uploadLabel}
          complete={uploadComplete}
          onDismissed={handleUploadSheetDismissed}
        />
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
  pickVideoBtn: {
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    minHeight: 220,
    borderRadius: radius.lg,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderStyle: "dashed",
    backgroundColor: colors.canvas,
    padding: spacing.lg,
  },
  pickVideoBtnPressed: {
    opacity: 0.75,
  },
  pickVideoTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: colors.ink,
  },
  pickVideoHint: {
    fontSize: 13,
    color: colors.muted,
    textAlign: "center",
  },
  previewWrap: {
    borderRadius: radius.lg,
    overflow: "hidden",
    backgroundColor: colors.black,
    aspectRatio: 9 / 16,
    maxHeight: 420,
    alignSelf: "center",
    width: "100%",
  },
  previewVideo: {
    width: "100%",
    height: "100%",
    backgroundColor: colors.black,
  },
  changeVideoBtn: {
    position: "absolute",
    top: spacing.sm,
    right: spacing.sm,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: radius.pill,
    backgroundColor: "rgba(0,0,0,0.55)",
  },
  changeVideoText: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.white,
  },
  input: {
    minHeight: 120,
    fontSize: 16,
    lineHeight: 22,
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
  coverWrap: {
    width: 120,
    height: 180,
    borderRadius: radius.md,
    overflow: "hidden",
    backgroundColor: colors.canvas,
  },
  coverImage: {
    width: "100%",
    height: "100%",
  },
  removeCoverBtn: {
    position: "absolute",
    top: 6,
    right: 6,
    backgroundColor: "rgba(0,0,0,0.35)",
    borderRadius: 12,
  },
});
