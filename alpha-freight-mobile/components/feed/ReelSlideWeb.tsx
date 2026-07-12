import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Image, Platform, Pressable, StyleSheet, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import ReelSlideOverlay from "@/components/feed/ReelSlideOverlay";
import ReelVideoTapControls from "@/components/feed/ReelVideoTapControls";
import { useReelShare } from "@/components/feed/reel-share";
import { FeedPost } from "@/lib/feed-posts";
import {
  buildReelPlayerHtml,
  buildReelStopScript,
  buildReelSyncScript,
  getWebViewModule,
} from "@/lib/optional-webview";
import { registerReelStopHandler } from "@/lib/reel-player-registry";
import { useReelPlaybackState } from "@/lib/use-reel-playback-state";
import { colors } from "@/lib/theme";

type ReelSlideWebProps = {
  post: FeedPost;
  isActive: boolean;
  isPreload?: boolean;
  playbackEnabled?: boolean;
  height: number;
  liked: boolean;
  likeCount: number;
  commentCount: number;
  bottomInset?: number;
  viewerRole: "carrier" | "supplier";
  onLike: () => void;
  onUnlike: () => void;
  onOpenComments: () => void;
};

const OVERLAY_CLEARANCE = 210;

function ReelSlideWeb({
  post,
  isActive,
  isPreload = false,
  playbackEnabled = true,
  height,
  liked,
  likeCount,
  commentCount,
  bottomInset = 0,
  viewerRole,
  onLike,
  onUnlike,
  onOpenComments,
}: ReelSlideWebProps) {
  const videoUri = (post.videoHlsSrc || post.videoSrc)?.trim() ?? "";
  const showMedia = isActive || isPreload;
  const posterUri = showMedia
    ? post.videoPosterSrc?.trim() || post.imageSrc?.trim() || undefined
    : undefined;
  const [isLandscape, setIsLandscape] = useState(false);
  const handleShare = useReelShare(post);
  const mountPlayer = Boolean(videoUri && showMedia && playbackEnabled);
  const {
    muted,
    paused,
    showControls,
    handleVideoTap,
    handlePlay,
    handleToggleMute,
  } = useReelPlaybackState(isActive, playbackEnabled);
  const webViewModule = getWebViewModule();
  const WebView = webViewModule?.WebView;
  const webViewRef = useRef<{ injectJavaScript: (script: string) => void } | null>(null);

  const html = useMemo(
    () => (videoUri ? buildReelPlayerHtml(videoUri, posterUri) : ""),
    [videoUri, posterUri]
  );

  const stopPlayback = useCallback(() => {
    webViewRef.current?.injectJavaScript(buildReelStopScript());
  }, []);

  const syncPlayback = useCallback(() => {
    if (!mountPlayer) return;
    webViewRef.current?.injectJavaScript(
      buildReelSyncScript(isActive && !isPreload, isPreload || muted, paused || isPreload, isLandscape)
    );
  }, [mountPlayer, isActive, isPreload, muted, paused, isLandscape]);

  useEffect(() => {
    return registerReelStopHandler(stopPlayback);
  }, [stopPlayback]);

  useEffect(() => {
    setIsLandscape(false);
  }, [videoUri]);

  useEffect(() => {
    syncPlayback();
  }, [mountPlayer, syncPlayback]);

  useEffect(() => {
    if (!mountPlayer || !isActive || isPreload) return;
    syncPlayback();
  }, [mountPlayer, isActive, isPreload, syncPlayback]);

  return (
    <View style={[styles.slide, { height }]}>
      <View style={[styles.videoShell, { height }]} collapsable={false}>
        {posterUri ? (
          <Image source={{ uri: posterUri }} style={styles.poster} resizeMode="cover" />
        ) : (
          <View style={styles.posterFallback} />
        )}

        {mountPlayer && WebView ? (
          <WebView
            ref={webViewRef as never}
            key={videoUri}
            source={{ html, baseUrl: "https://alphafreight.local" }}
            style={[styles.video, { height }]}
            pointerEvents="none"
            scrollEnabled={false}
            bounces={false}
            overScrollMode="never"
            javaScriptEnabled
            domStorageEnabled={false}
            allowsInlineMediaPlayback
            mediaPlaybackRequiresUserAction={false}
            allowsFullscreenVideo={false}
            originWhitelist={["*"]}
            setSupportMultipleWindows={false}
            androidLayerType="hardware"
            mixedContentMode="always"
            cacheEnabled={false}
            onLoadEnd={syncPlayback}
            onMessage={(event) => {
              try {
                const payload = JSON.parse(event.nativeEvent.data) as {
                  type?: string;
                  landscape?: boolean;
                };
                if (payload.type === "orientation") {
                  setIsLandscape((current) => {
                    const next = Boolean(payload.landscape);
                    return current === next ? current : next;
                  });
                }
              } catch {
                // Ignore malformed webview messages.
              }
            }}
          />
        ) : null}
      </View>

      <ReelSlideOverlay
        post={post}
        liked={liked}
        likeCount={likeCount}
        commentCount={commentCount}
        bottomInset={bottomInset}
        viewerRole={viewerRole}
        onLike={onLike}
        onUnlike={onUnlike}
        onOpenComments={onOpenComments}
        onShare={() => void handleShare()}
      />

      {mountPlayer && isActive && !showControls ? (
        <Pressable
          style={[styles.tapZone, { bottom: OVERLAY_CLEARANCE }]}
          onPress={handleVideoTap}
          accessibilityRole="button"
          accessibilityLabel="Pause reel"
        />
      ) : null}

      <ReelVideoTapControls
        visible={mountPlayer && isActive && showControls && paused}
        muted={muted}
        onPlay={handlePlay}
        onToggleMute={handleToggleMute}
      />
    </View>
  );
}

export default memo(ReelSlideWeb);

const styles = StyleSheet.create({
  slide: {
    width: "100%",
    backgroundColor: colors.black,
    overflow: "hidden",
  },
  videoShell: {
    width: "100%",
    backgroundColor: colors.black,
    ...(Platform.OS === "android" ? { elevation: 0 } : null),
  },
  poster: {
    ...StyleSheet.absoluteFill,
    backgroundColor: colors.black,
  },
  posterFallback: {
    ...StyleSheet.absoluteFill,
    backgroundColor: colors.black,
  },
  video: {
    width: "100%",
    backgroundColor: "transparent",
  },
  tapZone: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    elevation: 10,
  },
});
