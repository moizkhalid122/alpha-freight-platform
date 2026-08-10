"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Loader2, Wand2, X } from "lucide-react";
import AiOrbLottie from "@/components/chat/AiOrbLottie";
import { supabase } from "@/lib/supabase";
import type { PageObservation } from "@/lib/copilot/page-observer";
import type { PostLoadCopilotReply, PostLoadCopilotTrigger } from "@/lib/copilot/post-load-copilot-instant";
import { dedupeObservationLines } from "@/lib/copilot/post-load-copilot-instant";
import { analyzeSupplierLoadDraft, type SupplierLoadAdvisory, type SupplierLoadDraft } from "@/lib/copilot/supplier-load-advisor";
import {
  detectBrowserLanguage,
  type LanguagePreference,
} from "@/lib/copilot/language";

export type PostLoadAutoFixes = Partial<
  Pick<
    SupplierLoadDraft,
    | "origin"
    | "destination"
    | "equipment"
    | "weight"
    | "cargo_type"
    | "load_price"
    | "pickup_date"
    | "delivery_date"
    | "urgency"
  >
>;

type PostLoadProactiveCopilotProps = {
  draft: SupplierLoadDraft;
  currentStep: number;
  currency?: string;
  formatMoney: (value: number) => string;
  lastActivityAt: number;
  agreementAccepted?: boolean;
  onApplyFixes: (fixes: PostLoadAutoFixes) => void;
  onGoToStep?: (step: number) => void;
};

const IDLE_MS = 60_000;
const ROUTE_NUDGE_MS = 25_000;
const REOPEN_AFTER_DISMISS_MS = 50_000;

async function buildAuthHeaders() {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (session?.access_token) {
    headers.Authorization = `Bearer ${session.access_token}`;
  }
  return headers;
}

function stepIncomplete(draft: SupplierLoadDraft, currentStep: number) {
  if (currentStep === 1) return !draft.origin || !draft.destination || !draft.pickup_date;
  if (currentStep === 2) return !draft.cargo_type || !draft.weight;
  if (currentStep === 3) {
    return (
      Boolean(draft.refrigerated) &&
      draft.equipment &&
      !/reef|fridge|chiller|temp/i.test(String(draft.equipment))
    );
  }
  if (currentStep === 4) return !(draft.load_price || draft.max_budget);
  return false;
}

export default function PostLoadProactiveCopilot({
  draft,
  currentStep,
  currency = "GBP",
  formatMoney,
  lastActivityAt,
  agreementAccepted = false,
  onApplyFixes,
  onGoToStep,
}: PostLoadProactiveCopilotProps) {
  const [bubbleOpen, setBubbleOpen] = useState(false);
  const [dismissedAt, setDismissedAt] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [advisory, setAdvisory] = useState<SupplierLoadAdvisory | null>(null);
  const [observation, setObservation] = useState<PageObservation | null>(null);
  const [reply, setReply] = useState<PostLoadCopilotReply | null>(null);
  const [tick, setTick] = useState(Date.now());
  const fetchedKeyRef = useRef("");
  const language = useMemo(() => detectBrowserLanguage(), []);

  const draftKey = useMemo(() => JSON.stringify({ draft, currentStep }), [draft, currentStep]);

  useEffect(() => {
    const timer = window.setInterval(() => setTick(Date.now()), 4000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    setAdvisory(analyzeSupplierLoadDraft(draft, [], currency));

    const timer = window.setTimeout(async () => {
      try {
        const headers = await buildAuthHeaders();
        const response = await fetch("/api/supplier/advise-load", {
          method: "POST",
          headers,
          body: JSON.stringify({ draft, currency }),
        });
        const payload = (await response.json()) as { advisory?: SupplierLoadAdvisory };
        if (response.ok && payload.advisory) setAdvisory(payload.advisory);
      } catch {
        /* keep instant advisory */
      }
    }, 250);

    return () => window.clearTimeout(timer);
  }, [draftKey, currency, draft]);

  const idleMs = tick - lastActivityAt;
  const isIdle = idleMs >= IDLE_MS;
  const errors = advisory?.issues.filter((issue) => issue.severity === "error") || [];
  const warnings = advisory?.issues.filter((issue) => issue.severity === "warning") || [];
  const missingRoute = currentStep === 1 && (!draft.origin || !draft.destination);
  const missingBudget = currentStep === 4 && !(draft.load_price || draft.max_budget) && Boolean(advisory?.suggestedPrice);
  const routeNudge = missingRoute && idleMs >= ROUTE_NUDGE_MS;
  const incompleteStep = stepIncomplete(draft, currentStep);
  const equipmentMismatch =
    currentStep >= 3 &&
    Boolean(draft.refrigerated) &&
    draft.equipment &&
    !/reef|fridge|chiller|temp/i.test(String(draft.equipment));

  const needsAttention =
    isIdle ||
    errors.length > 0 ||
    warnings.length > 0 ||
    routeNudge ||
    Boolean(missingBudget) ||
    (incompleteStep && isIdle) ||
    equipmentMismatch;

  const dismissedRecently = dismissedAt !== null && tick - dismissedAt < REOPEN_AFTER_DISMISS_MS;
  const canReopenAfterDismiss =
    dismissedAt !== null && tick - dismissedAt >= REOPEN_AFTER_DISMISS_MS && needsAttention;

  const resolveTrigger = useCallback((): PostLoadCopilotTrigger | null => {
    if (canReopenAfterDismiss) return "return_after_dismiss";
    if (dismissedRecently && !canReopenAfterDismiss) return null;
    if (errors.length > 0) return "validation_error";
    if (equipmentMismatch) return "equipment_mismatch";
    if (missingBudget) return "missing_budget";
    if (routeNudge) return "missing_route";
    if (incompleteStep && isIdle) return "step_incomplete";
    if (isIdle) return "idle";
    return null;
  }, [
    canReopenAfterDismiss,
    dismissedRecently,
    errors.length,
    equipmentMismatch,
    missingBudget,
    routeNudge,
    incompleteStep,
    isIdle,
  ]);

  const fetchCopilotReply = useCallback(
    async (trigger: PostLoadCopilotTrigger, returningAfterDismiss = false) => {
      const fetchKey = `${draftKey}:${trigger}:${returningAfterDismiss}`;
      if (fetchedKeyRef.current === fetchKey) return;
      fetchedKeyRef.current = fetchKey;

      setLoading(true);
      setReply(null);

      try {
        const headers = await buildAuthHeaders();
        const response = await fetch("/api/supplier/post-load-copilot", {
          method: "POST",
          headers,
          body: JSON.stringify({
            draft,
            currentStep,
            trigger,
            returningAfterDismiss,
            agreementAccepted,
            idleMs,
            currency,
            language,
          }),
        });
        const payload = (await response.json()) as {
          reply?: PostLoadCopilotReply;
          observation?: PageObservation;
          advisory?: SupplierLoadAdvisory;
          error?: string;
        };
        if (response.ok && payload.reply) {
          setReply(payload.reply);
          if (payload.observation) setObservation(payload.observation);
          if (payload.advisory) setAdvisory(payload.advisory);
          return;
        }

        fetchedKeyRef.current = "";
      } catch {
        fetchedKeyRef.current = "";
      } finally {
        setLoading(false);
      }
    },
    [agreementAccepted, currency, currentStep, draft, draftKey, idleMs, language]
  );

  const activeTrigger = resolveTrigger();

  useEffect(() => {
    if (!activeTrigger) return;
    setBubbleOpen(true);
    void fetchCopilotReply(activeTrigger, activeTrigger === "return_after_dismiss");
  }, [activeTrigger, fetchCopilotReply, draftKey]);

  const handleDismiss = () => {
    setBubbleOpen(false);
    setDismissedAt(Date.now());
    fetchedKeyRef.current = "";
  };

  const applyFixes = (fixes: PostLoadAutoFixes) => {
    if (Object.keys(fixes).length > 0) onApplyFixes(fixes);
  };

  const handleAutoComplete = () => {
    const fixes: PostLoadAutoFixes = { ...(reply?.suggestedFixes as PostLoadAutoFixes) };

    if (!fixes.load_price && advisory?.suggestedPrice && advisory.suggestedPrice > 0) {
      fixes.load_price = String(advisory.suggestedPrice);
    }

    if (!fixes.weight && !draft.weight && draft.cargo_type) {
      fixes.weight = "1000 kg";
    }

    if (
      !fixes.equipment &&
      draft.refrigerated &&
      draft.equipment &&
      !/reef|fridge|chiller/i.test(String(draft.equipment))
    ) {
      fixes.equipment = "refrigerated";
    }

    applyFixes(fixes);

    if (missingRoute && onGoToStep) {
      onGoToStep(1);
    } else if (currentStep < 4 && onGoToStep && (isIdle || errors.length > 0 || incompleteStep)) {
      onGoToStep(Math.min(currentStep + 1, 4));
    }

    handleDismiss();
  };

  const toggleBubble = async () => {
    if (bubbleOpen) {
      handleDismiss();
      return;
    }
    setBubbleOpen(true);
    fetchedKeyRef.current = "";
    await fetchCopilotReply("manual");
  };

  const displayObservations = dedupeObservationLines(
    reply?.observations?.length
      ? reply.observations
      : observation?.priorityActions?.length
        ? observation.priorityActions
        : observation?.missingItems || []
  );

  return (
    <div
      className="pointer-events-none fixed z-50 flex flex-col items-end gap-2"
      style={{
        bottom: "max(1rem, env(safe-area-inset-bottom, 0px))",
        right: "max(0.75rem, env(safe-area-inset-right, 0px))",
      }}
    >
      <AnimatePresence>
        {bubbleOpen ? (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.94 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.96 }}
            transition={{ type: "spring", stiffness: 420, damping: 32 }}
            className="pointer-events-auto max-h-[min(70vh,420px)] w-[min(calc(100vw-1.25rem),280px)] overflow-y-auto rounded-xl border border-slate-200/90 bg-white shadow-xl shadow-slate-900/10 sm:w-[292px]"
          >
            <div className="sticky top-0 flex items-start gap-2 border-b border-slate-100 bg-white px-3 py-2.5">
              <div className="mt-0.5 shrink-0">
                <AiOrbLottie className="h-7 w-7" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[9px] font-semibold uppercase tracking-[0.16em] text-violet-600">
                  Supplier Co-Pilot
                </p>
                <p className="text-[12px] font-semibold leading-snug text-slate-900">
                  {reply?.greeting || "Need a hand?"}
                </p>
                {loading ? (
                  <p className="text-[10px] text-violet-600">Getting live guidance…</p>
                ) : reply?.source === "openai" ? (
                  <p className="text-[10px] text-emerald-600">Live AI guidance</p>
                ) : null}
                {observation?.stepLabel ? (
                  <p className="text-[10px] text-slate-500">
                    Step {currentStep}/4 · {observation.stepLabel}
                    {observation.readinessScore != null ? ` · ${observation.readinessScore}% ready` : ""}
                  </p>
                ) : null}
              </div>
              <button
                type="button"
                onClick={handleDismiss}
                className="shrink-0 rounded-md p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
                aria-label="Close"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>

            <div className="space-y-2.5 px-3 py-2.5">
              {loading ? (
                <div className="flex items-center gap-2 text-[11px] text-slate-500">
                  <Loader2 className="h-3.5 w-3.5 animate-spin text-violet-500" />
                  Analysing your form…
                </div>
              ) : reply ? (
                <>
                  <p className="text-[11px] leading-relaxed text-slate-600">{reply.message}</p>

                  {displayObservations.length > 0 ? (
                    <ul className="space-y-1 rounded-lg bg-slate-50 px-2.5 py-2">
                      {displayObservations.map((item, index) => (
                        <li key={`obs-${index}-${item.slice(0, 24)}`} className="flex gap-1.5 text-[10px] leading-relaxed text-slate-700">
                          <span className="mt-1 h-1 w-1 shrink-0 rounded-full bg-violet-500" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  ) : null}

                  {advisory?.suggestedPrice && currentStep >= 4 ? (
                    <p className="rounded-lg bg-violet-50 px-2.5 py-1.5 text-[10px] font-medium text-violet-800">
                      Live rate: {formatMoney(advisory.suggestedPrice)}
                    </p>
                  ) : null}

                  {reply?.nextStepHint ? (
                    <p className="text-[10px] font-medium text-emerald-700">{reply.nextStepHint}</p>
                  ) : null}
                </>
              ) : (
                <div className="flex items-center gap-2 text-[11px] text-slate-500">
                  <Loader2 className="h-3.5 w-3.5 animate-spin text-violet-500" />
                  One moment…
                </div>
              )}

              <div className="flex flex-wrap gap-1.5 pt-0.5">
                <button
                  type="button"
                  onClick={handleAutoComplete}
                  disabled={!reply || loading}
                  className="inline-flex items-center gap-1 rounded-lg bg-violet-700 px-2.5 py-1.5 text-[10px] font-semibold text-white transition hover:bg-violet-800 disabled:opacity-60"
                >
                  <Wand2 className="h-3 w-3" />
                  {reply?.ctaLabel || "Help me"}
                </button>
                <button
                  type="button"
                  onClick={handleDismiss}
                  className="rounded-lg border border-slate-200 px-2.5 py-1.5 text-[10px] font-semibold text-slate-600 transition hover:bg-slate-50"
                >
                  {reply?.secondaryLabel || "Not now"}
                </button>
              </div>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>

      <motion.button
        type="button"
        onClick={() => void toggleBubble()}
        whileTap={{ scale: 0.94 }}
        className="pointer-events-auto relative flex h-11 w-11 items-center justify-center rounded-full border border-violet-200/80 bg-white shadow-lg shadow-violet-900/10 transition hover:shadow-xl sm:h-12 sm:w-12"
        aria-label={bubbleOpen ? "Close AI assistant" : "Open AI assistant"}
      >
        <AiOrbLottie className="h-9 w-9 sm:h-10 sm:w-10" />
        {needsAttention && !bubbleOpen ? (
          <span className="absolute -right-0.5 -top-0.5 flex h-3 w-3">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-violet-400 opacity-60" />
            <span className="relative inline-flex h-3 w-3 rounded-full bg-violet-600 ring-2 ring-white" />
          </span>
        ) : null}
      </motion.button>
    </div>
  );
}
