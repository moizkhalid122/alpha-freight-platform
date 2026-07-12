import { InteractionManager } from "react-native";

/** Run after navigation / animations so tab taps stay responsive. */
export function deferAfterInteractions(work: () => void, delayMs = 0) {
  const task = InteractionManager.runAfterInteractions(() => {
    if (delayMs > 0) {
      setTimeout(work, delayMs);
      return;
    }
    work();
  });
  return () => task.cancel();
}
