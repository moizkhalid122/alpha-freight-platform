import { memo, useCallback, useEffect, useRef, useState } from "react";
import { ActivityIndicator, Image, Platform, Pressable, StyleSheet, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useVideoPlayer, VideoView } from "expo-video";
import ReelSlideOverlay from "@/components/feed/ReelSlideOverlay";
import ReelVideoTapControls from "@/components/feed/ReelVideoTapControls";
import { useReelShare } from "@/components/feed/reel-share";
import { FeedPost } from "@/lib/feed-posts";
import { registerReelStopHandler } from "@/lib/reel-player-registry";
import { configureReelPlayer, getReelVideoFit } from "@/lib/reel-video-fit";
import { useReelPlaybackState } from "@/lib/use-reel-playback-state";
import { useReelVideoOrientation } from "@/lib/use-reel-video-orientation";
import { colors } from "@/lib/theme";

type ReelSlideVideoProps = {
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
  onNativePlaybackFailed?: () => void;
};

const OVERLAY_CLEARANCE = 210;
const NATIVE_FRAME_TIMEOUT_MS = 2800;

function ReelSlideVideo({
  post,
  isActive,
  isPreload = false,
  playbackEnabled = true,
  height,
  bottomInset = 0,
  viewerRole,
  liked,
  likeCount,
  commentCount,
  onLike,
  onUnlike,
  onOpenComments,
  onNativePlaybackFailed,
}: ReelSlideVideoProps) {
  const videoUri = (post.videoHlsSrc || post.videoSrc)?.trim() ?? "";
  const showMedia = isActive || isPreload;
  const posterUri = showMedia
    ? post.videoPosterSrc?.trim() || post.imageSrc?.trim() || undefined
    : undefined;
  const mountPlayer = Boolean(videoUri && showMedia && playbackEnabled);
  const [videoReady, setVideoReady] = useState(false);
  const failedRef = useRef(false);
  const handleShare = useReelShare(post);
  const {
    muted,
    paused,
    showControls,
    handleVideoTap,
    handlePlay,
    handleToggleMute,
  } = useReelPlaybackState(isActive, playbackEnabled);

  const player = useVideoPlayer(mountPlayer ? videoUri : null, configureReelPlayer);
  const isLandscape = useReelVideoOrientation(mountPlayer ? player : null);

  const stopPlayback = useCallback(() => {
    try {
      player.pause();
      player.muted = true;
      player.currentTime = 0;
    } catch {
      // Player may already be released.
    }
  }, [player]);

  useEffect(() => {
    return registerReelStopHandler(stopPlayback);
  }, [stopPlayback]);

  useEffect(() => {
    failedRef.current = false;
    if (!isActive && !isPreload) {
      setVideoReady(false);
    }
  }, [videoUri, isActive, isPreload]);

  const markVideoReady = useCallback(() => {
    setVideoReady(true);
  }, []);

  const applyPlayerPlayback = useCallback(() => {
    if (!mountPlayer || !videoUri) return;

    player.loop = true;

    if (isPreload || !isActive) {
      player.muted = true;
      player.volume = 0;
      player.pause();
      return;
    }

    player.muted = muted;
    player.volume = muted ? 0 : 1;

    if (paused) {
      player.pause();
      return;
    }

    player.play();
  }, [isActive, isPreload, mountPlayer, muted, paused, player, videoUri]);

  useEffect(() => {
    applyPlayerPlayback();
  }, [applyPlayerPlayback, videoReady]);

  useEffect(() => {
    if (!mountPlayer || !videoUri) return;

    const statusSub = player.addListener("statusChange", ({ status }) => {
      if (status === "readyToPlay") {
        markVideoReady();
        applyPlayerPlayback();
      }
    });

    return () => {
      statusSub.remove();
    };
  }, [player, videoUri, mountPlayer, markVideoReady, applyPlayerPlayback]);

  useEffect(() => {
    if (!mountPlayer || videoReady || !onNativePlaybackFailed || failedRef.current) return;

    const timer = setTimeout(() => {
      if (!videoReady && !failedRef.current) {
        failedRef.current = true;
        stopPlayback();
        onNativePlaybackFailed();
      }
    }, NATIVE_FRAME_TIMEOUT_MS);

    return () => clearTimeout(timer);
  }, [mountPlayer, videoReady, onNativePlaybackFailed, stopPlayback, videoUri]);

  return (
    <View style={[styles.slide, { height }]}>
      <View style={[styles.videoShell, { height }]} collapsable={false}>
        {posterUri ? (
          <Image
            source={{ uri: posterUri }}
            style={[styles.poster, videoReady && isActive && styles.posterHidden]}
            resizeMode="cover"
          />
        ) : (
          <View style={styles.posterFallback} />
        )}

        {mountPlayer ? (
          <VideoView
            key={videoUri}
            player={player}
            style={[styles.video, { height }, !videoReady && styles.videoHidden]}
            contentFit={getReelVideoFit(isLandscape)}
            nativeControls={false}
            allowsPictureInPicture={false}
            surfaceType={Platform.OS === "android" ? "textureView" : undefined}
            useExoShutter={false}
            onFirstFrameRender={() => markVideoReady()}
          />
        ) : null}

        {isActive && mountPlayer && !videoReady ? (
          <View style={styles.bufferOverlay} pointerEvents="none">
            <ActivityIndicator color={colors.white} size="large" />
          </View>
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

      {mountPlayer && !showControls ? (
        <Pressable
          style={[styles.tapZone, { bottom: OVERLAY_CLEARANCE }]}
          onPress={handleVideoTap}
          accessibilityRole="button"
          accessibilityLabel="Pause reel"
        />
      ) : null}

      <ReelVideoTapControls
        visible={mountPlayer && showControls && paused}
        muted={muted}
        onPlay={handlePlay}
        onToggleMute={handleToggleMute}
      />
    </View>
  );
}

export default memo(ReelSlideVideo);

const styles = StyleSheet.create({
  slide: {
    width: "100%",
    backgroundColor: colors.black,
    overflow: "hidden",
  },
  videoShell: {
    width: "100%",
    backgroundColor: colors.black,
  },
  poster: {
    ...StyleSheet.absoluteFill,
    backgroundColor: colors.black,
  },
  posterHidden: {
    opacity: 0,
  },
  posterFallback: {
    ...StyleSheet.absoluteFill,
    backgroundColor: colors.black,
  },
  video: {
    width: "100%",
    backgroundColor: colors.black,
  },
  videoHidden: {
    opacity: 0,
  },
  bufferOverlay: {
    ...StyleSheet.absoluteFill,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.35)",
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
