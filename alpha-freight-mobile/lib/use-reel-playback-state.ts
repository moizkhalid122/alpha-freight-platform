import { useCallback, useEffect, useRef, useState } from "react";

export function useReelPlaybackState(isActive: boolean, playbackEnabled = true) {
  const [muted, setMuted] = useState(false);
  const [paused, setPaused] = useState(false);
  const [showControls, setShowControls] = useState(false);
  const pausedRef = useRef(paused);

  useEffect(() => {
    pausedRef.current = paused;
  }, [paused]);

  useEffect(() => {
    if (!playbackEnabled) {
      setPaused(true);
      setShowControls(false);
      return;
    }

    if (isActive) {
      setMuted(false);
      setPaused(false);
      setShowControls(false);
      return;
    }

    setPaused(true);
    setShowControls(false);
  }, [isActive, playbackEnabled]);

  const handleVideoTap = useCallback(() => {
    if (!isActive) return;
    setPaused(true);
    setShowControls(true);
  }, [isActive]);

  const handlePlay = useCallback(() => {
    setPaused(false);
    setShowControls(false);
  }, []);

  const handleToggleMute = useCallback(() => {
    setMuted((current) => !current);
  }, []);

  return {
    muted,
    paused,
    pausedRef,
    showControls,
    handleVideoTap,
    handlePlay,
    handleToggleMute,
  };
}
