import { NextResponse } from "next/server";
import {
  getElevenLabsModelId,
  getElevenLabsVoiceCandidates,
  isElevenLabsConfigured,
} from "@/lib/elevenlabs-config";

export const runtime = "nodejs";

const MAX_TEXT_LENGTH = 220;

async function synthesize(voiceId: string, text: string, apiKey: string) {
  const modelId = getElevenLabsModelId();

  return fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "xi-api-key": apiKey,
      Accept: "audio/mpeg",
    },
    body: JSON.stringify({
      text,
      model_id: modelId,
      optimize_streaming_latency: 4,
      voice_settings: {
        stability: 0.38,
        similarity_boost: 0.9,
        style: 0.22,
        use_speaker_boost: true,
      },
    }),
  });
}

export async function POST(request: Request) {
  if (!isElevenLabsConfigured()) {
    return NextResponse.json({ error: "Voice service not configured" }, { status: 503 });
  }

  let body: { text?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const text = body.text?.trim();
  if (!text) {
    return NextResponse.json({ error: "Text is required" }, { status: 400 });
  }
  if (text.length > MAX_TEXT_LENGTH) {
    return NextResponse.json({ error: "Text too long" }, { status: 400 });
  }

  const apiKey = process.env.ELEVENLABS_API_KEY!.trim();
  const candidates = getElevenLabsVoiceCandidates();

  for (const voiceId of candidates) {
    let upstream: Response;
    try {
      upstream = await synthesize(voiceId, text, apiKey);
    } catch (error) {
      console.warn("[voice/speak] network error:", voiceId, error);
      continue;
    }
    if (upstream.ok) {
      const audioBuffer = await upstream.arrayBuffer();
      return new NextResponse(audioBuffer, {
        status: 200,
        headers: {
          "Content-Type": "audio/mpeg",
          "Cache-Control": "no-store",
        },
      });
    }

    const detail = await upstream.text().catch(() => "");
    console.warn("[voice/speak] voice failed:", voiceId, upstream.status, detail.slice(0, 120));
  }

  return NextResponse.json({ error: "Voice generation failed" }, { status: 502 });
}
