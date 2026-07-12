import { DependencyList, useEffect, useState } from "react";
import { InteractionManager } from "react-native";

/** Run work after the navigation transition animation finishes. */
export function useAfterTransition(effect: () => void, deps: DependencyList) {
  useEffect(() => {
    const task = InteractionManager.runAfterInteractions(() => {
      effect();
    });
    return () => task.cancel();
  }, deps);
}

/** True once the screen transition animation has finished — defer heavy UI (maps, WebViews). */
export function useTransitionReady(maxWaitMs = 350) {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    let done = false;
    const finish = () => {
      if (done) return;
      done = true;
      setReady(true);
    };
    const task = InteractionManager.runAfterInteractions(finish);
    const fallback = setTimeout(finish, maxWaitMs);
    return () => {
      task.cancel();
      clearTimeout(fallback);
    };
  }, [maxWaitMs]);
  return ready;
}
