import { DependencyList, useCallback } from "react";
import { useFocusEffect } from "expo-router";
import { deferAfterInteractions } from "@/lib/defer-work";

/** Run tab refresh after the navigation transition — keeps taps feeling instant. */
export function useDeferredFocusRefresh(effect: () => void, deps: DependencyList) {
  useFocusEffect(
    useCallback(() => deferAfterInteractions(effect), deps)
  );
}
