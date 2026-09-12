import { pickRealtimeModel } from "@/lib/concierge/concierge-realtime-router";
import type { ConciergeVoiceMemory } from "@/lib/concierge/concierge-session";
import {
  buildRealtimeSessionConfig,
  getRealtimeModelFallbacks,
  isRealtimeConciergeEnabled,
} from "@/lib/concierge/realtime-config";
import type { LanguagePreference } from "@/lib/copilot/language";

export const runtime = "nodejs";

const UPSTREAM_TIMEOUT_MS = 12000;

export async function POST(request: Request) {
  if (!isRealtimeConciergeEnabled()) {
    return Response.json({ error: "Realtime voice not configured" }, { status: 503 });
  }

  let body: {
    pagePath?: string;
    language?: LanguagePreference;
    lastUserText?: string;
    historyLength?: number;
    memory?: ConciergeVoiceMemory;
    signupGuide?: boolean;
    forcePremium?: boolean;
  } = {};
  try {
    body = await request.json();
  } catch {
    /* optional body */
  }

  const pagePath = body.pagePath || "/";
  const language = body.language || "english";
  const memory = body.memory || {};
  const apiKey = process.env.OPENAI_API_KEY!.trim();

  const primaryModel = pickRealtimeModel({
    lastUserText: body.lastUserText,
    historyLength: body.historyLength,
    memory,
    pagePath,
    forcePremium: body.forcePremium,
  });

  const modelCandidates = [
    primaryModel,
    ...getRealtimeModelFallbacks().filter((m) => m !== primaryModel),
  ].slice(0, 3);

  let lastError = "Could not create voice session";

  for (const model of modelCandidates) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), UPSTREAM_TIMEOUT_MS);

    try {
      const upstream = await fetch("https://api.openai.com/v1/realtime/client_secrets", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          session: buildRealtimeSessionConfig({
            pagePath,
            language,
            model,
            memory,
            signupGuide: body.signupGuide,
          }),
        }),
        signal: controller.signal,
      });

      const payload = (await upstream.json()) as {
        value?: string;
        expires_at?: number;
        error?: { message?: string };
      };

      if (upstream.ok && payload.value) {
        return Response.json({
          token: payload.value,
          expiresAt: payload.expires_at,
          model,
        });
      }

      lastError = payload.error?.message || `Token request failed (${upstream.status})`;
      console.warn("[voice/realtime/token]", model, upstream.status, lastError);

      if (upstream.status === 401 || upstream.status === 403) break;
    } catch (error) {
      lastError = error instanceof Error ? error.message : "Network error";
      console.warn("[voice/realtime/token]", model, lastError);
    } finally {
      clearTimeout(timeoutId);
    }
  }

  return Response.json({ error: lastError }, { status: 502 });
}
