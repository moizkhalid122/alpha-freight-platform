export type ConciergeUserEmotion = "neutral" | "confused" | "excited" | "frustrated";

export type EmotionDetectInput = {
  text: string;
  isFinal?: boolean;
  speechDurationMs?: number;
  hesitantStartMs?: number;
};

type EmotionScore = {
  emotion: ConciergeUserEmotion;
  confidence: number;
};

const CONFUSED_PATTERNS = [
  /\b(u+h+m+|um+|er+|ah+|eh+|hmm+)\b/i,
  /\b(i don'?t (?:get|understand)|not sure|confused|what do you mean|kya matlab|samajh nahi|pata nahi|samajh nahi aa)/i,
  /\b(how do i|where do i|which one|kya karna|kaise)\b/i,
  /\?\s*$/,
];

const FRUSTRATED_PATTERNS = [
  /\b(frustrated|annoyed|angry|fed up|sick of|not working|doesn'?t work|didn'?t work|why won'?t|still not|bar bar|again\?|hurry up|jaldi|fix this|useless|waste of time|bakwas|pagal)/i,
  /\b(you said|you told me|already told|i already|still waiting)\b/i,
  /\b(wrong|incorrect|not updated|change nahi|update nahi)\b/i,
];

const EXCITED_PATTERNS = [
  /\b(wow|amazing|brilliant|love it|perfect|awesome|fantastic|excited|great news|yes!|yay|maza|bohat acha|shukriya|thank you so much|lets go|let's go)/i,
  /!{2,}/,
  /\b(brilliant|lovely|brill)\b/i,
];

function scorePatterns(text: string, patterns: RegExp[]): number {
  const lower = text.toLowerCase();
  let score = 0;
  for (const pattern of patterns) {
    if (pattern.test(lower)) score += pattern.source.length > 20 ? 3 : 2;
  }
  return score;
}

export function detectConciergeUserEmotion(input: EmotionDetectInput): EmotionScore {
  const text = input.text.trim();
  if (!text) return { emotion: "neutral", confidence: 0 };

  const confusedScore = scorePatterns(text, CONFUSED_PATTERNS);
  const frustratedScore = scorePatterns(text, FRUSTRATED_PATTERNS);
  const excitedScore = scorePatterns(text, EXCITED_PATTERNS);

  const wordCount = text.split(/\s+/).filter(Boolean).length;
  const slowSpeech =
    input.isFinal &&
    input.speechDurationMs != null &&
    input.speechDurationMs > 4500 &&
    wordCount <= 8;
  const hesitantStart =
    input.hesitantStartMs != null && input.hesitantStartMs > 1600 && wordCount <= 10;

  let finalConfused = confusedScore + (slowSpeech ? 3 : 0) + (hesitantStart ? 2 : 0);
  let finalFrustrated = frustratedScore;
  let finalExcited = excitedScore;

  if (text === text.toUpperCase() && text.length > 6) finalFrustrated += 2;

  const max = Math.max(finalConfused, finalFrustrated, finalExcited, 0);
  if (max < 2) return { emotion: "neutral", confidence: 0 };

  if (finalFrustrated >= max) {
    return { emotion: "frustrated", confidence: Math.min(1, finalFrustrated / 6) };
  }
  if (finalExcited >= max) {
    return { emotion: "excited", confidence: Math.min(1, finalExcited / 5) };
  }
  return { emotion: "confused", confidence: Math.min(1, finalConfused / 5) };
}

export function mergeEmotionTone(
  current: ConciergeUserEmotion,
  detected: EmotionScore,
): ConciergeUserEmotion {
  if (detected.emotion === "neutral" || detected.confidence < 0.25) {
    return current === "neutral" ? "neutral" : current;
  }
  if (detected.confidence >= 0.5) return detected.emotion;
  if (detected.emotion === "frustrated") return "frustrated";
  if (current === "frustrated") return current;
  return detected.emotion;
}

export function buildEmotionPromptBlock(emotion: ConciergeUserEmotion): string {
  switch (emotion) {
    case "confused":
      return `USER EMOTION: confused or hesitant.
- Speak slower and calmer — one step only, no info dump.
- Offer to highlight the exact form field or open the right page.
- Check they understood before moving on.`;
    case "excited":
      return `USER EMOTION: excited / positive.
- Match their energy briefly (warm, upbeat) — then guide the next step clearly.
- Keep momentum — open the page or fill the form if they hinted at action.`;
    case "frustrated":
      return `USER EMOTION: frustrated.
- ONE short sentence maximum — no filler, no re-greeting.
- Take direct action immediately (navigate_page, fill_page_form, highlight_element, click_element).
- Do NOT ask confirmation questions — just fix it.`;
    default:
      return "";
  }
}

export type OrbEmotionStyle = {
  yScale: number;
  scaleBoost: number;
  playbackMult: number;
  glowOpacity: number;
  springStiffness: number;
  springDamping: number;
  userGlow: string;
  aiGlow: string;
  idleGlow: string;
};

export function orbStyleForEmotion(emotion: ConciergeUserEmotion): OrbEmotionStyle {
  switch (emotion) {
    case "confused":
      return {
        yScale: 0.35,
        scaleBoost: 0.04,
        playbackMult: 0.78,
        glowOpacity: 0.22,
        springStiffness: 95,
        springDamping: 32,
        userGlow: "radial-gradient(circle, rgba(196,181,253,0.45), transparent 72%)",
        aiGlow: "radial-gradient(circle, rgba(167,139,250,0.35), transparent 72%)",
        idleGlow: "radial-gradient(circle, rgba(196,181,253,0.2), transparent 72%)",
      };
    case "excited":
      return {
        yScale: 1.25,
        scaleBoost: 0.14,
        playbackMult: 1.14,
        glowOpacity: 0.52,
        springStiffness: 320,
        springDamping: 18,
        userGlow: "radial-gradient(circle, rgba(251,191,36,0.55), rgba(34,211,238,0.25) 65%, transparent 72%)",
        aiGlow: "radial-gradient(circle, rgba(251,191,36,0.45), rgba(167,139,250,0.35) 68%, transparent 72%)",
        idleGlow: "radial-gradient(circle, rgba(251,191,36,0.3), transparent 72%)",
      };
    case "frustrated":
      return {
        yScale: 0.15,
        scaleBoost: 0.03,
        playbackMult: 0.86,
        glowOpacity: 0.38,
        springStiffness: 200,
        springDamping: 30,
        userGlow: "radial-gradient(circle, rgba(45,212,191,0.5), transparent 70%)",
        aiGlow: "radial-gradient(circle, rgba(45,212,191,0.4), rgba(56,189,248,0.2) 68%, transparent 72%)",
        idleGlow: "radial-gradient(circle, rgba(45,212,191,0.25), transparent 72%)",
      };
    default:
      return {
        yScale: 1,
        scaleBoost: 0.12,
        playbackMult: 1,
        glowOpacity: 0.35,
        springStiffness: 260,
        springDamping: 22,
        userGlow: "radial-gradient(circle, rgba(34,211,238,0.55), transparent 70%)",
        aiGlow: "radial-gradient(circle, rgba(167,139,250,0.5), rgba(232,121,249,0.2) 68%, transparent 72%)",
        idleGlow: "radial-gradient(circle, rgba(196,181,253,0.25), transparent 72%)",
      };
  }
}
