"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, ChevronDown, Sparkles } from "lucide-react";

import type { CopilotQuickAction, StructuredAssistantReply } from "@/lib/chat-types";

interface CopilotResponseCardProps {
  response?: StructuredAssistantReply;
  fallbackText: string;
  onQuickAction?: (action: CopilotQuickAction) => void;
}

function actionClass(variant: CopilotQuickAction["variant"] = "secondary"): string {
  if (variant === "primary") {
    return "border-slate-900 bg-slate-900 text-white hover:bg-slate-800";
  }

  if (variant === "ghost") {
    return "border-transparent bg-slate-100 text-slate-700 hover:bg-slate-200";
  }

  return "border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50";
}

export default function CopilotResponseCard({
  response,
  fallbackText,
  onQuickAction,
}: CopilotResponseCardProps) {
  const initialOpenSections = useMemo(
    () =>
      Object.fromEntries(
        (response?.sections || []).map((section, index) => [section.id, Boolean(section.defaultOpen ?? index === 0)])
      ),
    [response]
  );
  const [openSections, setOpenSections] = useState<Record<string, boolean>>(initialOpenSections);

  if (!response) {
    return (
      <div className="px-0 py-1 text-slate-900">
        <p className="text-sm leading-7 whitespace-pre-line">{fallbackText}</p>
      </div>
    );
  }

  return (
    <div className="px-0 py-1">
      <div className="flex flex-wrap items-start justify-between gap-3 pb-2">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-600">
              <Sparkles className="h-3 w-3" />
              {response.modeLabel || "Logistics Copilot"}
            </span>
            {typeof response.confidence === "number" ? (
              <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-emerald-700">
                {response.confidence}% confident
              </span>
            ) : null}
          </div>
          <h3 className="mt-3 text-[1.05rem] font-semibold leading-[1.28] tracking-[-0.03em] text-slate-950 sm:text-[1.16rem]">
            {response.title}
          </h3>
          <p className="mt-2 text-sm leading-7 text-slate-700">{response.shortExplanation}</p>
        </div>
        {response.knowledgeSource ? (
          <p className="text-[11px] font-medium text-slate-400">
            Source: {response.knowledgeSource}
          </p>
        ) : null}
      </div>

      <div className="space-y-5 pt-4">

        {!!response.metrics?.length && (
          <div>
            <div className="mt-1 flex flex-wrap gap-2">
              {response.metrics.map((metric) => (
                <div
                  key={`${metric.label}-${metric.value}`}
                  className={`rounded-full border px-3 py-1.5 text-xs ${
                    metric.tone === "positive"
                      ? "border-emerald-100 bg-emerald-50 text-emerald-700"
                      : metric.tone === "warning"
                        ? "border-amber-100 bg-amber-50 text-amber-700"
                        : "border-slate-200 bg-slate-50 text-slate-600"
                  }`}
                >
                  <span className="font-semibold">
                    {metric.icon ? `${metric.icon} ` : ""}
                    {metric.label}:
                  </span>{" "}
                  {metric.value}
                </div>
              ))}
            </div>
          </div>
        )}

        {!!response.keyPoints.length && (
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400">
              Key Points
            </p>
            <div className="mt-3 space-y-2">
              {response.keyPoints.map((point) => (
                <p key={point} className="text-sm leading-7 text-slate-700">
                  <span className="mr-2 text-slate-400">•</span>
                  {point}
                </p>
              ))}
            </div>
          </div>
        )}

        {!!response.sections?.length && (
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400">
              Detailed Breakdown
            </p>
            <div className="mt-3 space-y-2">
              {response.sections.map((section) => {
                const isOpen = openSections[section.id] ?? false;
                return (
                  <div
                    key={section.id}
                    className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white"
                  >
                    <button
                      type="button"
                      onClick={() =>
                        setOpenSections((current) => ({
                          ...current,
                          [section.id]: !isOpen,
                        }))
                      }
                      className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left"
                    >
                      <div>
                        <p className="text-sm font-semibold text-slate-900">
                          {section.icon} {section.title}
                        </p>
                        <p className="mt-1 text-xs leading-5 text-slate-500">{section.summary}</p>
                      </div>
                      <ChevronDown
                        className={`h-4 w-4 shrink-0 text-slate-400 transition-transform ${
                          isOpen ? "rotate-180" : ""
                        }`}
                      />
                    </button>
                    {isOpen ? (
                      <div className="border-t border-slate-100 px-4 py-3">
                        <div className="space-y-2">
                          {section.details.map((detail) => (
                            <p key={detail} className="text-sm leading-6 text-slate-600">
                              <span className="mr-2 text-slate-400">•</span>
                              {detail}
                            </p>
                          ))}
                        </div>
                      </div>
                    ) : null}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {response.routePreview ? (
          <div className="rounded-2xl border border-slate-200/80 bg-slate-50/60 px-4 py-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400">
              Route Preview
            </p>
            <div className="mt-3 flex flex-col gap-2 text-sm font-medium text-slate-700">
              <div className="rounded-xl border border-slate-200 bg-white px-4 py-3">
                📍 {response.routePreview.pickup}
              </div>
              <div className="pl-4 text-slate-400">↓ {response.routePreview.transit}</div>
              <div className="rounded-xl border border-slate-200 bg-white px-4 py-3">
                📦 {response.routePreview.delivery}
              </div>
            </div>
          </div>
        ) : null}

        {(response.recommendation || response.nextStep) && (
          <div className="grid gap-4 border-t border-slate-100 pt-4 md:grid-cols-2">
            {response.recommendation ? (
              <div className="rounded-2xl bg-transparent px-1 py-1">
                <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-emerald-700/80">
                  Recommendation
                </p>
                <p className="mt-2 text-sm leading-6 text-emerald-950">{response.recommendation}</p>
              </div>
            ) : null}

            {response.nextStep ? (
              <div className="rounded-2xl bg-transparent px-1 py-1">
                <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">
                  Next Step
                </p>
                <p className="mt-2 text-sm leading-6 text-slate-800">{response.nextStep}</p>
              </div>
            ) : null}
          </div>
        )}

        {response.platformResult?.loads?.length ? (
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400">
              Live Platform Results
            </p>
            <div className="mt-3 rounded-[1.4rem] border border-slate-200/80 bg-slate-50/60 p-4">
              <div className="mb-4">
                <p className="text-sm font-semibold text-slate-900">{response.platformResult.title}</p>
                <p className="mt-1 text-xs leading-5 text-slate-500">
                  {response.platformResult.subtitle}
                  {typeof response.platformResult.totalCount === "number"
                    ? ` (${response.platformResult.totalCount} matches)`
                    : ""}
                </p>
              </div>
              <div className="space-y-3">
                {response.platformResult.loads.map((load) => (
                  <div
                    key={load.id}
                    className="rounded-2xl border border-slate-200/80 bg-white px-4 py-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-slate-900">{load.title}</p>
                        <p className="mt-1 text-xs leading-5 text-slate-500">{load.subtitle}</p>
                      </div>
                      {typeof load.score === "number" ? (
                          <div className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                          🚛 Load Score: {load.score}/100
                        </div>
                      ) : null}
                    </div>
                    <div className="mt-3 grid gap-2 sm:grid-cols-2">
                      {load.metrics.map((metric) => (
                        <div
                          key={`${load.id}-${metric.label}`}
                          className="rounded-xl border border-slate-200/80 bg-slate-50/80 px-3 py-2 text-sm text-slate-700"
                        >
                          <span className="font-semibold">{metric.label}:</span> {metric.value}
                        </div>
                      ))}
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {load.primaryAction?.href ? (
                        <Link
                          href={load.primaryAction.href}
                          className={`inline-flex items-center gap-2 rounded-full border px-3.5 py-2 text-xs font-semibold transition ${actionClass(load.primaryAction.variant || "primary")}`}
                        >
                          {load.primaryAction.label}
                          <ArrowRight className="h-3.5 w-3.5" />
                        </Link>
                      ) : load.primaryAction ? (
                        <button
                          type="button"
                          onClick={() => onQuickAction?.(load.primaryAction as CopilotQuickAction)}
                          className={`inline-flex items-center gap-2 rounded-full border px-3.5 py-2 text-xs font-semibold transition ${actionClass(load.primaryAction.variant || "primary")}`}
                        >
                          {load.primaryAction.label}
                          <ArrowRight className="h-3.5 w-3.5" />
                        </button>
                      ) : null}
                      {load.secondaryActions?.map((action) =>
                        action.href ? (
                          <Link
                            key={`${load.id}-${action.label}-${action.href}`}
                            href={action.href}
                            className={`inline-flex items-center gap-2 rounded-full border px-3.5 py-2 text-xs font-semibold transition ${actionClass(action.variant)}`}
                          >
                            {action.label}
                            <ArrowRight className="h-3.5 w-3.5" />
                          </Link>
                        ) : (
                          <button
                            key={`${load.id}-${action.label}-${action.action}`}
                            type="button"
                            onClick={() => onQuickAction?.(action)}
                            className={`inline-flex items-center gap-2 rounded-full border px-3.5 py-2 text-xs font-semibold transition ${actionClass(action.variant)}`}
                          >
                            {action.label}
                            <ArrowRight className="h-3.5 w-3.5" />
                          </button>
                        )
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : null}

        {!!response.quickActions.length && (
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400">
              Quick Actions
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {response.quickActions.map((action) =>
                action.href ? (
                  <Link
                    key={`${action.label}-${action.href}`}
                    href={action.href}
                    className={`inline-flex items-center gap-2 rounded-full border px-3.5 py-2 text-xs font-semibold transition ${actionClass(action.variant)}`}
                  >
                    {action.label}
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                ) : (
                  <button
                    key={`${action.label}-${action.action}`}
                    type="button"
                    onClick={() => onQuickAction?.(action)}
                    className={`inline-flex items-center gap-2 rounded-full border px-3.5 py-2 text-xs font-semibold transition ${actionClass(action.variant)}`}
                  >
                    {action.label}
                    <ArrowRight className="h-3.5 w-3.5" />
                  </button>
                )
              )}
            </div>
          </div>
        )}

        {!!response.suggestedQuestions?.length && (
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400">
              Suggested Questions
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {response.suggestedQuestions.map((question) => (
                <button
                  key={question}
                  type="button"
                  onClick={() => onQuickAction?.({ label: question, action: question, variant: "ghost" })}
                  className="rounded-full border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs font-semibold text-slate-600 transition hover:border-slate-300 hover:bg-white"
                >
                  {question}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
