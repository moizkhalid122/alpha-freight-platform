export const OPENAI_TTS_VOICES = [
  "alloy",
  "ash",
  "ballad",
  "coral",
  "echo",
  "fable",
  "nova",
  "onyx",
  "sage",
  "shimmer",
  "verse",
] as const;

export type OpenAiTtsVoice = (typeof OPENAI_TTS_VOICES)[number];

export function isOpenAiTtsConfigured(): boolean {
  return Boolean(process.env.OPENAI_API_KEY?.trim());
}

export function getOpenAiTtsVoice(): OpenAiTtsVoice {
  const configured = process.env.OPENAI_TTS_VOICE?.trim().toLowerCase();
  if (configured && OPENAI_TTS_VOICES.includes(configured as OpenAiTtsVoice)) {
    return configured as OpenAiTtsVoice;
  }
  return "alloy";
}

export function getOpenAiTtsModel(): string {
  return process.env.OPENAI_TTS_MODEL?.trim() || "tts-1";
}

export const OPENAI_TTS_MAX_CHARS = 480;
