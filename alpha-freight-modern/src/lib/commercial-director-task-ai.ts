import { isOpenAiConfigured } from "@/lib/openai-config";
import {
  buildRevenueTaskAiContext,
  type CommercialDirectorTask,
} from "@/lib/commercial-director-tasks";
import {
  COMMERCIAL_DIRECTOR_ROLE_BRIEF,
  DAILY_TASK_LIMIT,
  type CommercialDirectorTaskCategory,
} from "@/lib/commercial-director-role";
import { formatRevenueGbp } from "@/lib/commercial-director-revenue-plan";

export type CommercialTaskCategory = CommercialDirectorTaskCategory;

export type AiGeneratedTaskInput = {
  title: string;
  description?: string;
  priority?: "low" | "medium" | "high";
  category?: CommercialTaskCategory;
  streamId?: number;
  streamName?: string;
};

type GenerateOptions = {
  actualMtd?: number;
  monthTarget?: number;
  count?: number;
};

function fallbackAiTasks(options?: GenerateOptions): AiGeneratedTaskInput[] {
  const ctx = buildRevenueTaskAiContext({
    actualMtd: options?.actualMtd,
    monthTarget: options?.monthTarget,
  });
  const gap = ctx.revenueGap;
  const stream = ctx.topStreams[0];

  return [
    {
      title: "Call 5 carriers + 3 suppliers — book meetings or first loads",
      description: ctx.focus,
      priority: "high",
      category: "sales",
    },
    {
      title: "1 face-to-face or video meeting — pitch Alpha Freight",
      description: "Build trust · suppliers, carriers, or broker partners",
      priority: "high",
      category: "relationships",
    },
    {
      title: "Move 1 prospect toward signed contract or platform agreement",
      description: "Terms, onboarding paperwork, or partnership deal",
      priority: "high",
      category: "contracts",
    },
    {
      title: gap > 0 ? `Funding / revenue gap action — ${formatRevenueGbp(gap)} to target` : "Funding check — lender call or financial plan review",
      description: "Support company runway and monthly revenue plan",
      priority: "medium",
      category: "funding",
    },
    {
      title: stream
        ? `Revenue focus: ${stream.name} (${formatRevenueGbp(stream.monthTarget)} this month)`
        : `Revenue focus: ${ctx.monthLabel} target ${formatRevenueGbp(ctx.monthRevenueTarget)}`,
      description: ctx.focus,
      priority: "medium",
      category: "revenue",
      streamId: stream?.id,
      streamName: stream?.name,
    },
  ];
}

export async function generateRevenueTasksWithAi(options?: GenerateOptions): Promise<AiGeneratedTaskInput[]> {
  const ctx = buildRevenueTaskAiContext({
    actualMtd: options?.actualMtd,
    monthTarget: options?.monthTarget,
  });
  const count = options?.count ?? DAILY_TASK_LIMIT;

  if (!isOpenAiConfigured()) {
    return fallbackAiTasks(options).slice(0, count);
  }

  const apiKey = process.env.OPENAI_API_KEY?.trim();
  if (!apiKey) return fallbackAiTasks(options).slice(0, count);

  const system = `You are Alpha Freight UK's Commercial Director daily planner for Alastair (Commercial Director).
Generate exactly ${count} practical tasks for TODAY — achievable in one working day, not overwhelming.

Role priorities:
- Commercial Director: sales, suppliers/shippers, carriers/forwarders, commercial relationships, revenue growth
- Face-to-face deals, phone calls, inviting people, securing contracts and partnerships
- Operations support: coordinate loads and service delivery (light touch — escalate blockers)
- Funding/finance: discuss funding options, support company financial plan and revenue gap

Return JSON only: {"tasks":[{"title":"...","description":"...","priority":"high|medium|low","category":"sales|relationships|contracts|funding|operations|revenue","streamId":1,"streamName":"..."}]}

Rules:
- Exactly ${count} tasks — no more
- Each task = one clear action Alastair can finish today (calls, meetings, contract step, funding call)
- Mix: 1-2 sales/outreach, 1 relationship/meeting, 1 contract, 0-1 funding, 1 revenue stream focus
- UK freight context: carriers, suppliers, loads, commission
- Titles under 90 chars, specific and measurable
- streamId/streamName optional when tied to a revenue stream`;

  const user = JSON.stringify({
    ...ctx,
    roleBrief: COMMERCIAL_DIRECTOR_ROLE_BRIEF,
    tasksRequested: count,
  });

  try {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        temperature: 0.4,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: system },
          { role: "user", content: user },
        ],
      }),
    });

    if (!res.ok) return fallbackAiTasks(options).slice(0, count);

    const data = (await res.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const content = data.choices?.[0]?.message?.content;
    if (!content) return fallbackAiTasks(options).slice(0, count);

    const parsed = JSON.parse(content) as { tasks?: AiGeneratedTaskInput[] };
    const tasks = (parsed.tasks ?? []).filter((t) => t.title?.trim()).slice(0, count);
    if (tasks.length === 0) return fallbackAiTasks(options).slice(0, count);
    return tasks;
  } catch {
    return fallbackAiTasks(options).slice(0, count);
  }
}

export function toCommercialDirectorTasks(inputs: AiGeneratedTaskInput[]): Omit<
  CommercialDirectorTask,
  "id" | "taskDate" | "createdAt" | "status"
>[] {
  return inputs.map((t) => ({
    title: t.title.trim(),
    description: t.description?.trim(),
    priority: t.priority ?? "medium",
    category: t.category ?? "ai",
    streamId: t.streamId,
    streamName: t.streamName,
    source: "ai" as const,
  }));
}
