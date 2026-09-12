import { NextResponse } from "next/server";
import {
  getOpenAiTtsModel,
  getOpenAiTtsVoice,
  isOpenAiTtsConfigured,
  OPENAI_TTS_MAX_CHARS,
} from "@/lib/openai-tts-config";

export const runtime = "nodejs";

const UPSTREAM_TIMEOUT_MS = 12000;

export async function POST(request: Request) {
  if (!isOpenAiTtsConfigured()) {
    return NextResponse.json({ error: "OpenAI voice not configured" }, { status: 503 });
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
  if (text.length > OPENAI_TTS_MAX_CHARS) {
    return NextResponse.json({ error: "Text too long" }, { status: 400 });
  }

  const apiKey = process.env.OPENAI_API_KEY!.trim();
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), UPSTREAM_TIMEOUT_MS);

  try {
    const upstream = await fetch("https://api.openai.com/v1/audio/speech", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      signal: controller.signal,
      body: JSON.stringify({
        model: getOpenAiTtsModel(),
        input: text,
        voice: getOpenAiTtsVoice(),
        response_format: "mp3",
        speed: 1.02,
      }),
    });

    if (!upstream.ok) {
      const detail = await upstream.text().catch(() => "");
      console.warn("[voice/openai/speak] failed:", upstream.status, detail.slice(0, 160));
      return NextResponse.json({ error: "Voice generation failed" }, { status: 502 });
    }

    const audioBuffer = await upstream.arrayBuffer();
    return new NextResponse(audioBuffer, {
      status: 200,
      headers: {
        "Content-Type": "audio/mpeg",
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.warn("[voice/openai/speak] network error:", error);
    return NextResponse.json({ error: "Voice service unreachable" }, { status: 502 });
  } finally {
    clearTimeout(timeoutId);
  }
}
