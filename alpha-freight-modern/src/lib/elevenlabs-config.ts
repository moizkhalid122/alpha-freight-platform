/** Premade voices that work on ElevenLabs free API (not Voice Library). */
export const ELEVENLABS_PREMADE_VOICE_IDS = [
  "pNInz6obpgDQGcFmaJgB", // Adam
  "21m00Tcm4TlvDq8ikWAM", // Rachel
  "EXAVITQu4vr4xnSDxMaL", // Bella
] as const;

export function isElevenLabsConfigured(): boolean {
  return Boolean(process.env.ELEVENLABS_API_KEY?.trim());
}

export function getElevenLabsVoiceCandidates(): string[] {
  const primary = process.env.ELEVENLABS_VOICE_ID?.trim();
  const configured = process.env.ELEVENLABS_FALLBACK_VOICE_ID?.trim();
  const ordered = [primary, configured, ...ELEVENLABS_PREMADE_VOICE_IDS].filter(Boolean) as string[];
  return [...new Set(ordered)];
}

export function getElevenLabsModelId(): string {
  return process.env.ELEVENLABS_MODEL_ID?.trim() || "eleven_flash_v2_5";
}