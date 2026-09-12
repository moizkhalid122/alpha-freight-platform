"use client";

import { useEffect } from "react";
import {
  CONCIERGE_CLICK_EVENT,
  CONCIERGE_HIGHLIGHT_EVENT,
} from "@/lib/concierge/concierge-companion";
import {
  findConciergeTargetElement,
  performConciergeClick,
  pulseConciergeTarget,
} from "@/lib/concierge/concierge-dom-target";

export function useConciergeDomActions() {
  useEffect(() => {
    const onHighlight = (event: Event) => {
      const target = (event as CustomEvent<{ target?: string }>).detail?.target?.trim();
      if (!target) return;
      const el = findConciergeTargetElement(target);
      if (!el) return;
      pulseConciergeTarget(el);
    };

    const onClick = (event: Event) => {
      const target = (event as CustomEvent<{ target?: string }>).detail?.target?.trim();
      if (!target) return;
      performConciergeClick(target);
    };

    window.addEventListener(CONCIERGE_HIGHLIGHT_EVENT, onHighlight);
    window.addEventListener(CONCIERGE_CLICK_EVENT, onClick);
    return () => {
      window.removeEventListener(CONCIERGE_HIGHLIGHT_EVENT, onHighlight);
      window.removeEventListener(CONCIERGE_CLICK_EVENT, onClick);
    };
  }, []);
}
