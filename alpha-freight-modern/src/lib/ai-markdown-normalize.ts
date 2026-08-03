const SECTION_LABELS = ["Quick Answer", "Explanation", "Example", "Next step", "Next Step"];

function latexToPlain(latex: string): string {
  let s = latex.trim();
  s = s.replace(/\\frac\{([^}]*)\}\{([^}]*)\}/g, "$1 ÷ $2");
  s = s.replace(/\\text\{([^}]*)\}/g, "$1");
  s = s.replace(/\\times/g, "×");
  s = s.replace(/\\cdot/g, "·");
  s = s.replace(/\\,/g, " ");
  s = s.replace(/\\[a-zA-Z]+/g, "");
  s = s.replace(/[{}]/g, "");
  return s.replace(/\s+/g, " ").trim();
}

function isLatexBlock(inner: string): boolean {
  return /\\frac|\\text|\\times|\\cdot|\\[a-zA-Z]/.test(inner);
}

/** Normalize OpenAI markdown so tables, callouts, and maths render in the UI. */
export function normalizeAiMarkdown(source: string): string {
  let text = source;

  text = text.replace(/\\\[([\s\S]*?)\\\]/g, (_, inner) => `\n\n**${latexToPlain(inner)}**\n\n`);
  text = text.replace(/\\\(([\s\S]*?)\\\)/g, (_, inner) => latexToPlain(inner));
  text = text.replace(/\$\$([\s\S]*?)\$\$/g, (_, inner) => `\n\n**${latexToPlain(inner)}**\n\n`);
  text = text.replace(/\$([^$\n]+)\$/g, (_, inner) => latexToPlain(inner));

  text = text.replace(/^\[([^\]\n]+)\]$/gm, (match, inner) => {
    if (!isLatexBlock(inner)) return match;
    return `\n\n**${latexToPlain(inner)}**\n\n`;
  });

  for (const section of SECTION_LABELS) {
    text = text.replace(new RegExp(`^\\*\\*${section}\\*\\*\\s*$`, "gim"), `### ${section}`);
    text = text.replace(new RegExp(`^${section}\\s*$`, "gim"), `### ${section}`);
  }

  return text;
}
