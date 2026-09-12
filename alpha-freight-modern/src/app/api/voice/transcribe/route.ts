import { NextResponse } from "next/server";

export const runtime = "nodejs";

const MAX_BYTES = 8 * 1024 * 1024;
const UPSTREAM_TIMEOUT_MS = 15000;

export async function POST(request: Request) {
  const apiKey = process.env.OPENAI_API_KEY?.trim();
  if (!apiKey) {
    return NextResponse.json({ error: "Transcription not configured" }, { status: 503 });
  }

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return NextResponse.json({ error: "Invalid audio upload" }, { status: 400 });
  }

  const file = form.get("file");
  if (!(file instanceof File) || !file.size) {
    return NextResponse.json({ error: "Audio file required" }, { status: 400 });
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: "Audio too large" }, { status: 413 });
  }

  const upstreamForm = new FormData();
  upstreamForm.append("file", file, file.name || "speech.webm");
  upstreamForm.append("model", "whisper-1");
  upstreamForm.append("language", "en");

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), UPSTREAM_TIMEOUT_MS);

  try {
    const upstream = await fetch("https://api.openai.com/v1/audio/transcriptions", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}` },
      body: upstreamForm,
      signal: controller.signal,
    });

    const payload = (await upstream.json()) as { text?: string; error?: { message?: string } };
    if (!upstream.ok) {
      return NextResponse.json(
        { error: payload.error?.message || "Transcription failed" },
        { status: 502 },
      );
    }

    return NextResponse.json({ text: payload.text?.trim() || "" });
  } catch (error) {
    console.warn("[voice/transcribe]", error);
    return NextResponse.json({ error: "Transcription unreachable" }, { status: 502 });
  } finally {
    clearTimeout(timeoutId);
  }
}
