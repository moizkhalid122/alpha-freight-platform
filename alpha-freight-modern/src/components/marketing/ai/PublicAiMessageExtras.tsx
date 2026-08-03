"use client";

import AiFuelChart from "@/components/marketing/ai/AiFuelChart";
import AiRpmCalculator from "@/components/marketing/ai/AiRpmCalculator";
import AiSmartLoadCards from "@/components/marketing/ai/AiSmartLoadCards";
import AiRouteMiniMap from "@/components/marketing/ai/AiRouteMiniMap";
import AiComparisonChart from "@/components/marketing/ai/AiComparisonChart";
import AiMetricPills from "@/components/marketing/ai/AiMetricPills";
import { isFuelChartQuery, isRpmCalculatorQuery } from "@/lib/ai-input-suggestions";
import { parseRouteQuery } from "@/lib/public-ai-widgets";
import type { StructuredAssistantReply } from "@/lib/chat-types";

type PublicAiMessageExtrasProps = {
  structuredMessage?: StructuredAssistantReply;
  userQuery?: string;
  hasContent: boolean;
  isStreaming: boolean;
  onAskFollowUp: (question: string) => void;
};

export default function PublicAiMessageExtras({
  structuredMessage,
  userQuery,
  hasContent,
  isStreaming,
  onAskFollowUp,
}: PublicAiMessageExtrasProps) {
  if (isStreaming || !hasContent) return null;

  const route = userQuery ? parseRouteQuery(userQuery) : null;

  return (
    <>
      {structuredMessage?.platformResult?.loads?.length ? (
        <AiSmartLoadCards result={structuredMessage.platformResult} />
      ) : null}

      {structuredMessage?.inlineTool === "route_map" && route ? (
        <AiRouteMiniMap origin={route.origin} destination={route.destination} />
      ) : null}

      {structuredMessage?.inlineTool === "comparison_chart" && structuredMessage.chartType ? (
        <AiComparisonChart chartType={structuredMessage.chartType} />
      ) : null}

      {structuredMessage?.metrics?.length && structuredMessage.inlineTool !== "route_map" ? (
        <div className="mt-3">
          <AiMetricPills metrics={structuredMessage.metrics} />
        </div>
      ) : null}

      {userQuery && isFuelChartQuery(userQuery) ? <AiFuelChart /> : null}

      {userQuery &&
      (structuredMessage?.inlineTool === "rpm_calculator" || isRpmCalculatorQuery(userQuery)) ? (
        <AiRpmCalculator onAskFollowUp={onAskFollowUp} />
      ) : null}
    </>
  );
}
