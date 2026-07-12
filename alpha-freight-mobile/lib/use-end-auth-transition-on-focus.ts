import { useEffect } from "react";
import { useIsFocused } from "@/lib/use-is-focused";
import { endAuthTransition } from "@/lib/auth-transition";

export function useEndAuthTransitionOnFocus() {
  const focused = useIsFocused();

  useEffect(() => {
    if (focused) {
      endAuthTransition();
    }
  }, [focused]);
}
