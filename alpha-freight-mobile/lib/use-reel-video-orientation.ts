import { useEffect, useState } from "react";
import type { VideoPlayer } from "expo-video";

function isLandscapeTrack(width: number, height: number) {
  return width > height;
}

export function useReelVideoOrientation(player: VideoPlayer | null) {
  const [isLandscape, setIsLandscape] = useState(false);

  useEffect(() => {
    if (!player) return;

    const applyTrackSize = (width?: number | null, height?: number | null) => {
      if (!width || !height) return;
      setIsLandscape(isLandscapeTrack(width, height));
    };

    const trackSub = player.addListener("videoTrackChange", ({ videoTrack }) => {
      applyTrackSize(videoTrack?.size?.width, videoTrack?.size?.height);
    });

    const loadSub = player.addListener("sourceLoad", ({ availableVideoTracks }) => {
      const track = availableVideoTracks?.[0];
      applyTrackSize(track?.size?.width, track?.size?.height);
    });

    return () => {
      trackSub.remove();
      loadSub.remove();
    };
  }, [player]);

  return isLandscape;
}
