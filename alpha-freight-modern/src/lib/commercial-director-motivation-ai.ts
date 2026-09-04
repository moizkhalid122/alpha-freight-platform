import { isOpenAiConfigured } from "@/lib/openai-config";
import { COMMERCIAL_DIRECTOR_PROFILE } from "@/lib/commercial-director-permissions";
import {
  buildRevenueTaskAiContext,
  taskStats,
  loadTaskStore,
} from "@/lib/commercial-director-tasks";
import { COMMERCIAL_DIRECTOR_ROLE_BRIEF } from "@/lib/commercial-director-role";
import { formatRevenueGbp } from "@/lib/commercial-director-revenue-plan";

export type MotivationPayload = {
  message: string;
  focus?: string;
  generatedAt: string;
};

type MotivateOptions = {
  actualMtd?: number;
  monthTarget?: number;
};

function fallbackMotivation(options?: MotivateOptions): MotivationPayload {
  const ctx = buildRevenueTaskAiContext({
    actualMtd: options?.actualMtd,
    monthTarget: options?.monthTarget,
  });
  const store = typeof window !== "undefined" ? loadTaskStore() : null;
  const stats = store ? taskStats(store.tasks) : { completed: 0, pending: 5, progress: 0 };
  const gap = ctx.revenueGap;
  const firstName = COMMERCIAL_DIRECTOR_PROFILE.name.split(" ")[0];

  const lines = [
    `${firstName}, make your next call now — today's revenue gap is ${formatRevenueGbp(gap)}.`,
    stats.completed > 0
      ? `${stats.completed} task${stats.completed === 1 ? "" : "s"} done — focus on the remaining ${stats.pending}.`
      : "Complete your first task — momentum builds from there.",
    "A face-to-face or phone meeting strengthens the relationship — move one deal forward today.",
  ];

  return {
    message: lines.join(" "),
    focus: ctx.focus,
    generatedAt: new Date().toISOString(),
  };
}

export async function generateCommercialDirectorMotivation(
  options?: MotivateOptions
): Promise<MotivationPayload> {
  const ctx = buildRevenueTaskAiContext({
    actualMtd: options?.actualMtd,
    monthTarget: options?.monthTarget,
  });

  if (!isOpenAiConfigured()) {
    return fallbackMotivation(options);
  }

  const apiKey = process.env.OPENAI_API_KEY?.trim();
  if (!apiKey) return fallbackMotivation(options);

  const firstName = COMMERCIAL_DIRECTOR_PROFILE.name.split(" ")[0];

  const system = `You motivate Alpha Freight UK's Commercial Director (${firstName}).
Write ONE short motivational message (2-3 sentences max) in professional UK English.
Reference: sales, calls, face-to-face deals, contracts, revenue growth, funding when relevant.
Be energising but not cheesy. No bullet points.
Return JSON only: {"message":"...","focus":"one word focus e.g. calls|contracts|revenue"}`;

  const user = JSON.stringify({
    name: firstName,
    role: "Commercial Director",
    roleBrief: COMMERCIAL_DIRECTOR_ROLE_BRIEF,
    monthLabel: ctx.monthLabel,
    revenueTarget: ctx.monthRevenueTarget,
    revenueGap: ctx.revenueGap,
    focus: ctx.focus,
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
        temperature: 0.7,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: system },
          { role: "user", content: user },
        ],
      }),
    });

    if (!res.ok) return fallbackMotivation(options);

    const data = (await res.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const content = data.choices?.[0]?.message?.content;
    if (!content) return fallbackMotivation(options);

    const parsed = JSON.parse(content) as { message?: string; focus?: string };
    if (!parsed.message?.trim()) return fallbackMotivation(options);

    return {
      message: parsed.message.trim(),
      focus: parsed.focus?.trim(),
      generatedAt: new Date().toISOString(),
    };
  } catch {
    return fallbackMotivation(options);
  }
}
