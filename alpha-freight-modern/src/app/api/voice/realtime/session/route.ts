import {
  buildRealtimeSessionConfig,
  getRealtimeModelFallbacks,
  isRealtimeConciergeEnabled,
} from "@/lib/concierge/realtime-config";
import type { LanguagePreference } from "@/lib/copilot/language";

export const runtime = "nodejs";

const UPSTREAM_TIMEOUT_MS = 25000;

function isValidSdp(sdp: string): boolean {
  return sdp.trim().startsWith("v=0");
}

async function createRealtimeCall(sdp: string, sessionJson: string, apiKey: string) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), UPSTREAM_TIMEOUT_MS);

  try {
    const form = new FormData();
    form.set("sdp", sdp);
    form.set("session", sessionJson);

    return await fetch("https://api.openai.com/v1/realtime/calls", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}` },
      body: form,
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timeoutId);
  }
}

export async function POST(request: Request) {
  if (!isRealtimeConciergeEnabled()) {
    return new Response(JSON.stringify({ error: "Realtime voice not configured" }), {
      status: 503,
      headers: { "Content-Type": "application/json" },
    });
  }

  const sdp = await request.text();
  if (!sdp.trim()) {
    return new Response(JSON.stringify({ error: "SDP offer required" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const url = new URL(request.url);
  const pagePath = url.searchParams.get("pagePath") || "/";
  const language = (url.searchParams.get("language") || "english") as LanguagePreference;
  const apiKey = process.env.OPENAI_API_KEY!.trim();

  let lastError = "Realtime session failed";

  for (const model of getRealtimeModelFallbacks()) {
    const sessionConfig = JSON.stringify(
      buildRealtimeSessionConfig({ pagePath, language, model }),
    );

    try {
      const upstream = await createRealtimeCall(sdp, sessionConfig, apiKey);
      const answerSdp = await upstream.text();

      if (upstream.ok && isValidSdp(answerSdp)) {
        return new Response(answerSdp, {
          status: 200,
          headers: { "Content-Type": "application/sdp" },
        });
      }

      lastError = answerSdp.slice(0, 240);
      console.warn("[voice/realtime/session]", model, upstream.status, lastError);

      if (upstream.status === 401 || upstream.status === 403) break;
    } catch (error) {
      lastError = error instanceof Error ? error.message : "Network error";
      console.warn("[voice/realtime/session]", model, lastError);
    }
  }

  return new Response(JSON.stringify({ error: lastError }), {
    status: 502,
    headers: { "Content-Type": "application/json" },
  });
}
