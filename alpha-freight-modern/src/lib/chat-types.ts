export type AssistantKind = "general" | "carrier" | "supplier";
export type CopilotMode =
  | "logistics_copilot"
  | "tracking_assistant"
  | "load_analyst"
  | "fleet_manager"
  | "dispatcher";

export interface ChatHistoryItem {
  role: "user" | "assistant";
  content: string;
}

export interface CopilotQuickAction {
  label: string;
  action: string;
  href?: string;
  variant?: "primary" | "secondary" | "ghost";
  context?: Record<string, string | number | boolean | null>;
}

export interface CopilotMetric {
  label: string;
  value: string;
  icon?: string;
  tone?: "positive" | "neutral" | "warning";
}

export interface CopilotExpandableSection {
  id: string;
  title: string;
  icon: string;
  summary: string;
  details: string[];
  defaultOpen?: boolean;
}

export interface CopilotRoutePreview {
  pickup: string;
  transit: string;
  delivery: string;
}

export interface CopilotPlatformIntent {
  type:
    | "loads_search"
    | "active_loads_lookup"
    | "tracking_lookup"
    | "fleet_lookup"
    | "support_lookup"
    | "bids_lookup"
    | "post_load_lookup"
    | "earnings_lookup";
  equipmentType?: string | null;
  location?: string | null;
  route?: string | null;
}

export interface CopilotPlatformLoad {
  id: string;
  title: string;
  subtitle: string;
  score?: number;
  metrics: CopilotMetric[];
  primaryAction?: CopilotQuickAction;
  secondaryActions?: CopilotQuickAction[];
}

export interface CopilotPlatformResult {
  title: string;
  subtitle: string;
  totalCount?: number;
  loads?: CopilotPlatformLoad[];
}

export interface CopilotActionRequest {
  type: "create_load" | "accept_bid" | "human_handoff";
  status: "needs_input" | "ready" | "completed";
  prompt?: string;
  missingFields?: string[];
  payload?: Record<string, string | number | boolean | null>;
  successMessage?: string;
}

export interface CopilotContextMemory {
  truckType?: string | null;
  equipmentType?: string | null;
  userLocation?: string | null;
  preferredRoutes?: string[];
  previousSearches?: string[];
  recentLoads?: string[];
  activeTopic?: string | null;
  workflowStage?: string | null;
  role?: AssistantKind | string | null;
  persona?: string | null;
}

export interface StructuredAssistantReply {
  mode: CopilotMode | string;
  displayStyle?: "plain" | "card";
  userIntent?: string;
  responseLength?: "short" | "medium" | "detailed";
  modeLabel?: string;
  assistantName?: string;
  confidence?: number;
  knowledgeSource?: string;
  title: string;
  shortExplanation: string;
  keyPoints: string[];
  recommendation: string;
  nextStep: string;
  metrics?: CopilotMetric[];
  sections?: CopilotExpandableSection[];
  routePreview?: CopilotRoutePreview;
  quickActions: CopilotQuickAction[];
  suggestedQuestions?: string[];
  platformIntent?: CopilotPlatformIntent;
  platformResult?: CopilotPlatformResult;
  actionRequest?: CopilotActionRequest | null;
  memory?: CopilotContextMemory;
  rawText?: string;
}

export interface ChatApiResponse {
  message: string;
  structuredMessage?: StructuredAssistantReply;
}

export interface SendChatMessageOptions {
  assistantType?: AssistantKind;
  mode?: CopilotMode;
  history?: ChatHistoryItem[];
}
