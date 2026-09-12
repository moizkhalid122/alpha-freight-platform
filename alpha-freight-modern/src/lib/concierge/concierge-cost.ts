export type ConciergeVoiceMode = "realtime" | "premium" | "smart" | "legacy";
export type ConciergeTtsMode = "browser" | "openai" | "premium";

/**
 * Voice modes:
 * - realtime  → full WebRTC (best feel, most expensive)
 * - premium   → OpenAI TTS + mini chat (recommended — ~same voice, ~85% cheaper)
 * - smart     → browser TTS (cheapest)
 * - legacy    → same as premium
 */
export function getConciergeVoiceMode(): ConciergeVoiceMode {
  const mode =
    process.env.NEXT_PUBLIC_CONCIERGE_VOICE_MODE?.trim() ||
    process.env.CONCIERGE_VOICE_MODE?.trim() ||
    "realtime";
  if (mode === "realtime" || mode === "smart" || mode === "legacy" || mode === "premium") return mode;
  return "realtime";
}

export function isPremiumConciergeMode(): boolean {
  const mode = getConciergeVoiceMode();
  return mode === "premium" || mode === "legacy";
}

export function shouldUseRealtimeVoice(): boolean {
  return getConciergeVoiceMode() === "realtime";
}

/** Pause Realtime billing on navigate/signup/hidden tab (Option B). */
export function isBudgetRealtimeEnabled(): boolean {
  if (!shouldUseRealtimeVoice()) return false;
  const flag =
    process.env.NEXT_PUBLIC_CONCIERGE_BUDGET_REALTIME?.trim() ||
    process.env.CONCIERGE_BUDGET_REALTIME?.trim() ||
    "true";
  return flag !== "false";
}

export function getConciergeTtsMode(): ConciergeTtsMode {
  const explicit =
    process.env.NEXT_PUBLIC_CONCIERGE_TTS?.trim() || process.env.CONCIERGE_TTS?.trim();
  if (explicit === "openai" || explicit === "premium" || explicit === "browser") {
    return explicit;
  }
  if (shouldUseRealtimeVoice() || isPremiumConciergeMode()) return "openai";
  return "browser";
}

export function shouldUseOpenAiTts(): boolean {
  const mode = getConciergeTtsMode();
  return mode === "openai" || mode === "premium";
}

export function shouldUseElevenLabsTts(): boolean {
  return getConciergeTtsMode() === "premium" && Boolean(process.env.ELEVENLABS_API_KEY?.trim());
}

export function shouldPreloadConciergeGreeting(): boolean {
  return shouldUseOpenAiTts();
}

/** Whisper costs per utterance and breaks continuous listen — opt-in only. */
export function shouldUseWhisperStt(): boolean {
  const stt = process.env.NEXT_PUBLIC_CONCIERGE_STT?.trim() || process.env.CONCIERGE_STT?.trim();
  return stt === "whisper";
}

export function getConciergeIdleDisconnectMs(): number {
  const raw = Number(
    process.env.NEXT_PUBLIC_CONCIERGE_IDLE_MS ||
      process.env.CONCIERGE_IDLE_DISCONNECT_MS ||
      180_000,
  );
  return Number.isFinite(raw) && raw >= 30_000 ? raw : 180_000;
}

/** Faster turns + shorter prompts (recommended). Set CONCIERGE_REALTIME_FAST=false to disable. */
/** VIP: always use gpt-realtime-2.1 + premium conversational voice (marin/cedar). */
export function isVipPremiumVoiceEnabled(): boolean {
  const flag =
    process.env.NEXT_PUBLIC_CONCIERGE_VIP_PREMIUM_VOICE?.trim() ||
    process.env.CONCIERGE_VIP_PREMIUM_VOICE?.trim() ||
    "true";
  return flag !== "false";
}

export function isFastRealtimeLatencyMode(): boolean {
  const flag =
    process.env.NEXT_PUBLIC_CONCIERGE_REALTIME_FAST?.trim() ||
    process.env.CONCIERGE_REALTIME_FAST?.trim() ||
    "true";
  return flag !== "false";
}

export function getConciergeRealtimeTranscribeModel(): string {
  return (
    process.env.NEXT_PUBLIC_CONCIERGE_REALTIME_TRANSCRIBE?.trim() ||
    process.env.CONCIERGE_REALTIME_TRANSCRIBE?.trim() ||
    "gpt-4o-mini-transcribe"
  );
}

export function getConciergeCostSummary(): {
  voiceMode: ConciergeVoiceMode;
  ttsMode: ConciergeTtsMode;
  useRealtime: boolean;
  idleDisconnectMs: number;
} {
  return {
    voiceMode: getConciergeVoiceMode(),
    ttsMode: getConciergeTtsMode(),
    useRealtime: shouldUseRealtimeVoice(),
    idleDisconnectMs: getConciergeIdleDisconnectMs(),
  };
}
