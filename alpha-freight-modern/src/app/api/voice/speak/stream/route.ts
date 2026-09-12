import {
  getElevenLabsModelId,
  getElevenLabsVoiceCandidates,
  isElevenLabsConfigured,
} from "@/lib/elevenlabs-config";

export const runtime = "nodejs";

const MAX_TEXT_LENGTH = 220;
const UPSTREAM_TIMEOUT_MS = 15000;

async function openStream(voiceId: string, text: string, apiKey: string) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), UPSTREAM_TIMEOUT_MS);

  try {
    const response = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}/stream`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "xi-api-key": apiKey,
          Accept: "audio/mpeg",
        },
        signal: controller.signal,
        body: JSON.stringify({
          text,
          model_id: getElevenLabsModelId(),
          optimize_streaming_latency: 4,
          voice_settings: {
            stability: 0.38,
            similarity_boost: 0.9,
            style: 0.22,
            use_speaker_boost: true,
          },
        }),
      },
    );

    return response;
  } finally {
    clearTimeout(timeoutId);
  }
}

export async function POST(request: Request) {
  if (!isElevenLabsConfigured()) {
    return new Response(JSON.stringify({ error: "Voice service not configured" }), {
      status: 503,
      headers: { "Content-Type": "application/json" },
    });
  }

  let body: { text?: string };
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON body" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const text = body.text?.trim();
  if (!text) {
    return new Response(JSON.stringify({ error: "Text is required" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }
  if (text.length > MAX_TEXT_LENGTH) {
    return new Response(JSON.stringify({ error: "Text too long" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const apiKey = process.env.ELEVENLABS_API_KEY!.trim();
  const candidates = getElevenLabsVoiceCandidates();

  for (const voiceId of candidates) {
    try {
      const upstream = await openStream(voiceId, text, apiKey);
      if (!upstream.ok || !upstream.body) {
        const detail = await upstream.text().catch(() => "");
        console.warn("[voice/stream] failed:", voiceId, upstream.status, detail.slice(0, 120));
        continue;
      }

      return new Response(upstream.body, {
        status: 200,
        headers: {
          "Content-Type": "audio/mpeg",
          "Cache-Control": "no-store",
          "Transfer-Encoding": "chunked",
        },
      });
    } catch (error) {
      console.warn("[voice/stream] network error:", voiceId, error);
    }
  }

  return new Response(JSON.stringify({ error: "Voice stream failed" }), {
    status: 502,
    headers: { "Content-Type": "application/json" },
  });
}
