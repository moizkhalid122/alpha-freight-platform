import { Platform } from "react-native";

export function getReelVideoFit(isLandscape: boolean): "cover" | "contain" {
  return isLandscape ? "contain" : "cover";
}

export function configureReelPlayer(instance: {
  loop: boolean;
  muted: boolean;
  volume: number;
  playbackRate: number;
}) {
  instance.loop = true;
  instance.muted = false;
  instance.volume = 1;
  instance.playbackRate = 1;
}
