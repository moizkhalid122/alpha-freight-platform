"use client";

import { useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import type { ConciergeAgentTool } from "@/lib/chat-types";
import { storeConciergePrefill } from "@/lib/concierge/concierge-session";
import { isAllowedConciergePath } from "@/lib/concierge/concierge-site-map";
import {
  dispatchConciergeCelebrate,
  dispatchConciergeClick,
  dispatchConciergeFieldFill,
  dispatchConciergeHighlight,
  enableConciergeCompanion,
  pathsMatch,
} from "@/lib/concierge/concierge-companion";
import {
  buildWhatsAppShareUrl,
  copyReferralToClipboard,
} from "@/lib/concierge/concierge-referral-share";

function normalizeFillFields(
  form: "signup" | "contact",
  fields: Record<string, string>,
): Record<string, string> {
  const next = { ...fields };
  if (form === "contact") {
    if (next.fullName && !next.name) next.name = next.fullName;
    if (next.name && !next.fullName) next.fullName = next.name;
  }
  if (form === "signup") {
    if (next.name && !next.fullName) next.fullName = next.name;
  }
  return next;
}

export function useConciergeAgent() {
  const router = useRouter();
  const busyRef = useRef(false);
  const lastActionRef = useRef<{ key: string; at: number } | null>(null);

  const executeAgentTools = useCallback(
    async (tools: ConciergeAgentTool[] | undefined, options?: { delayMs?: number }) => {
      if (!tools?.length || busyRef.current) return;

      const actionKey = tools
        .map((tool) => {
          if (tool.type === "fill_field") {
            return `${tool.type}:${tool.path}:${JSON.stringify(tool.fields)}`;
          }
          if (tool.type === "navigate") return `${tool.type}:${tool.path}`;
          if (tool.type === "click") return `${tool.type}:${tool.target}`;
          return tool.type;
        })
        .join("|");
      const last = lastActionRef.current;
      if (last && last.key === actionKey && Date.now() - last.at < 4000) return;
      lastActionRef.current = { key: actionKey, at: Date.now() };

      busyRef.current = true;

      const hasNavigate = tools.some((tool) => tool.type === "navigate");
      const delayMs = options?.delayMs ?? 0;
      if (delayMs > 0) {
        await new Promise((r) => window.setTimeout(r, delayMs));
      }

      for (const tool of tools) {
        if (tool.type === "navigate") {
          if (!isAllowedConciergePath(tool.path)) break;
          enableConciergeCompanion(tool.path);
          router.push(tool.path);
          break;
        }

        if (tool.type === "highlight") {
          dispatchConciergeHighlight(tool.target);
          continue;
        }

        if (tool.type === "click") {
          dispatchConciergeClick(tool.target);
          continue;
        }

        if (tool.type === "share_referral") {
          const code = tool.code?.trim();
          if (code) {
            void copyReferralToClipboard(code, tool.role).then((ok) => {
              if (ok) dispatchConciergeCelebrate();
            });
            const wa = buildWhatsAppShareUrl(
              `Join Alpha Freight with my code ${code}`,
            );
            window.open(wa, "_blank", "noopener,noreferrer");
          }
          continue;
        }

        if (tool.type === "fill_field") {
          if (!isAllowedConciergePath(tool.path)) break;
          enableConciergeCompanion(tool.path);
          const fields = normalizeFillFields(tool.form, tool.fields);
          storeConciergePrefill({
            form: tool.form,
            role: tool.role,
            fields,
            path: tool.path,
          });

          const alreadyOnPage = pathsMatch(
            window.location.pathname,
            window.location.search,
            tool.path,
          );

          window.setTimeout(() => {
            dispatchConciergeFieldFill(fields);
          }, alreadyOnPage ? 80 : 650);

          if (!alreadyOnPage) {
            router.push(tool.path);
          }
          break;
        }

        if (tool.type === "human_handoff") {
          window.open("mailto:support@alphafreight.co.uk?subject=Alpha%20Concierge%20handoff", "_blank");
        }
      }

      window.setTimeout(() => {
        busyRef.current = false;
      }, 120);
    },
    [router],
  );

  return { executeAgentTools };
}
