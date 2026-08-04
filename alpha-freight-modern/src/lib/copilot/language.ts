export type LanguagePreference = "english" | "roman_urdu" | "urdu";

const GLOSSARY: Record<string, { en: string; ur: string }> = {
  rpm: { en: "Revenue Per Mile — earnings divided by loaded miles", ur: "Revenue Per Mile — har mile par kamai" },
  pod: { en: "Proof of Delivery — signed document confirming goods delivered", ur: "Proof of Delivery — delivery ki tasdeeq wala document" },
  deadhead: { en: "Empty miles driven without a paying load", ur: "Khali gaari — bina load ke chalne wale miles" },
  backhaul: { en: "Return load to avoid driving empty", ur: "Wapasi load — khali wapas na jana" },
  artic: { en: "Articulated lorry (tractor + trailer)", ur: "Tractor-trailer lorry" },
  hgv: { en: "Heavy Goods Vehicle — truck over 3.5 tonnes", ur: "Bhaari gaari — 3.5 ton se zyada" },
};

export function detectLanguage(message: string, explicit?: LanguagePreference): LanguagePreference {
  if (explicit && explicit !== "english") return explicit;
  const lower = message.toLowerCase();
  if (/[\u0600-\u06FF]/.test(message)) return "urdu";
  const urduWords = /\b(kya|kaise|hai|hain|mujhe|batao|load|kamai|paisa|ker|karo|bata|smjhao|chahiye|mera|meri)\b/i;
  if (urduWords.test(lower)) return "roman_urdu";
  return "english";
}

export function getLanguageInstruction(lang: LanguagePreference): string {
  switch (lang) {
    case "urdu":
      return "Reply in proper Urdu script (اردو). Use English only for technical freight terms like RPM, POD, HGV.";
    case "roman_urdu":
      return "Reply in Roman Urdu mixed with English freight terms — natural Pakistani carrier style.";
    default:
      return "Reply in clear professional English.";
  }
}

export function getGlossaryHint(term: string): string | null {
  const entry = GLOSSARY[term.toLowerCase()];
  if (!entry) return null;
  return `${term}: ${entry.en} | ${entry.ur}`;
}

export function buildGlossaryContext(message: string): string {
  const terms = Object.keys(GLOSSARY).filter((t) => message.toLowerCase().includes(t));
  if (!terms.length) return "";
  return "Glossary:\n" + terms.map((t) => getGlossaryHint(t)).filter(Boolean).join("\n");
}
