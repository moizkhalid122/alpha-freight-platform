/** Auto-prefix disabled — OpenAI writes natural openers from the system prompt. */
export function shouldSkipPersonalityPrefix(_query: string): boolean {
  return true;
}

export function getPersonalityPrefix(_query: string): string {
  return "";
}

export function prependPersonality(content: string, _query: string): string {
  return content;
}
