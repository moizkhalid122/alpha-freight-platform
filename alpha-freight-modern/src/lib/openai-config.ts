/** Client-safe OpenAI config check — no Node.js imports. */
export function isOpenAiConfigured(): boolean {
  return Boolean(process.env.OPENAI_API_KEY?.trim());
}
