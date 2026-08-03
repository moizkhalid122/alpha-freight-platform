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

const ROBOTIC_HEADERS = ["Quick Answer", "Explanation", "Example", "Next step", "Next Step"];

/** Normalize OpenAI markdown so tables, callouts, and maths render in the UI. */
export function normalizeAiMarkdown(source: string): string {
  let text = source;

  for (const header of ROBOTIC_HEADERS) {
    text = text.replace(new RegExp(`^###\\s+${header}\\s*$`, "gim"), "");
    text = text.replace(new RegExp(`^\\*\\*${header}\\*\\*\\s*$`, "gim"), "");
  }

  text = text.replace(/\n{3,}/g, "\n\n").trim();

  text = text.replace(/\\\[([\s\S]*?)\\\]/g, (_, inner) => `\n\n**${latexToPlain(inner)}**\n\n`);
  text = text.replace(/\\\(([\s\S]*?)\\\)/g, (_, inner) => latexToPlain(inner));
  text = text.replace(/\$\$([\s\S]*?)\$\$/g, (_, inner) => `\n\n**${latexToPlain(inner)}**\n\n`);
  text = text.replace(/\$([^$\n]+)\$/g, (_, inner) => latexToPlain(inner));

  text = text.replace(/^\[([^\]\n]+)\]$/gm, (match, inner) => {
    if (!isLatexBlock(inner)) return match;
    return `\n\n**${latexToPlain(inner)}**\n\n`;
  });

  return text;
}
