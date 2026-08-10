export type LanguagePreference = "english" | "roman_urdu" | "urdu" | "finnish";

const FINNISH_WORDS =
  /\b(auta|apua|apuaa|hei|moi|kiitos|haluan|haluaisin|tarvitsen|voitko|voisitko|miten|kuinka|paljon|hinta|hinnat|tarjous|budjetti|rahti|lasti|kuorma|matka|reitti|mistä|mihin|mennessä|tänään|huomenna|kerro|selitä|english|suomeksi|suomen|suomea)\b/i;

const FINNISH_CHARS = /[äöå]/i;

export function detectLanguage(message: string, explicit?: LanguagePreference): LanguagePreference {
  if (explicit && explicit !== "english") return explicit;

  if (/[\u0600-\u06FF]/.test(message)) return "urdu";

  const lower = message.toLowerCase();

  if (FINNISH_WORDS.test(lower) || (FINNISH_CHARS.test(message) && /\b(on|ja|ei|vai|minun|minua|tämä|load|price)\b/i.test(lower))) {
    return "finnish";
  }

  const urduWords = /\b(kya|kaise|hai|hain|mujhe|batao|kamai|paisa|ker|karo|bata|smjhao|chahiye|mera|meri)\b/i;
  if (urduWords.test(lower)) return "roman_urdu";

  return "english";
}

export function detectBrowserLanguage(): LanguagePreference {
  if (typeof navigator === "undefined") return "english";
  const code = navigator.language?.split("-")[0]?.toLowerCase();
  if (code === "fi") return "finnish";
  if (code === "ur") return "urdu";
  return "english";
}

export function prefersNaturalLanguageReply(lang: LanguagePreference): boolean {
  return lang === "finnish" || lang === "urdu" || lang === "roman_urdu";
}

export function getLanguageInstruction(lang: LanguagePreference): string {
  switch (lang) {
    case "urdu":
      return "Reply in proper Urdu script (اردو). Use English only for technical freight terms like RPM, POD, HGV.";
    case "roman_urdu":
      return "Reply in Roman Urdu mixed with English freight terms — natural Pakistani carrier style.";
    case "finnish":
      return "Reply entirely in Finnish (suomi). Use clear professional Finnish. Keep freight terms like RPM, POD, HGV in English where standard. Be helpful and warm.";
    default:
      return "Reply in clear professional English.";
  }
}

const GLOSSARY: Record<string, { en: string; ur: string; fi?: string }> = {
  rpm: {
    en: "Revenue Per Mile — earnings divided by loaded miles",
    ur: "Revenue Per Mile — har mile par kamai",
    fi: "Revenue Per Mile — tulo jaettuna ajettuihin mailiin",
  },
  pod: {
    en: "Proof of Delivery — signed document confirming goods delivered",
    ur: "Proof of Delivery — delivery ki tasdeeq wala document",
    fi: "Proof of Delivery — toimituksen kuittaus",
  },
  deadhead: {
    en: "Empty miles driven without a paying load",
    ur: "Khali gaari — bina load ke chalne wale miles",
    fi: "Tyhjät mailit ilman maksullista kuormaa",
  },
  backhaul: {
    en: "Return load to avoid driving empty",
    ur: "Wapasi load — khali wapas na jana",
    fi: "Paluukuorma — välttääksesi tyhjän ajon",
  },
  artic: {
    en: "Articulated lorry (tractor + trailer)",
    ur: "Tractor-trailer lorry",
    fi: "Puoliperävaunu (veturi + perävaunu)",
  },
  hgv: {
    en: "Heavy Goods Vehicle — truck over 3.5 tonnes",
    ur: "Bhaari gaari — 3.5 ton se zyada",
    fi: "Raskas ajoneuvo — yli 3,5 tonnin kuorma-auto",
  },
};

export function getGlossaryHint(term: string, lang: LanguagePreference = "english"): string | null {
  const entry = GLOSSARY[term.toLowerCase()];
  if (!entry) return null;
  if (lang === "finnish" && entry.fi) return `${term}: ${entry.fi}`;
  if (lang === "urdu" || lang === "roman_urdu") return `${term}: ${entry.ur}`;
  return `${term}: ${entry.en}`;
}

export function buildGlossaryContext(message: string, lang: LanguagePreference = "english"): string {
  const terms = Object.keys(GLOSSARY).filter((t) => message.toLowerCase().includes(t));
  if (!terms.length) return "";
  return "Glossary:\n" + terms.map((t) => getGlossaryHint(t, lang)).filter(Boolean).join("\n");
}
