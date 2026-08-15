"use client";

import { useState, type ReactNode } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { normalizeAiMarkdown } from "@/lib/ai-markdown-normalize";
import {
  ChevronDown,
  Info,
  Lightbulb,
  AlertTriangle,
  CheckCircle2,
  Truck,
  Sparkles,
  BookOpen,
  Calculator,
  ArrowRightCircle,
  ChevronRight,
  ListOrdered,
  ExternalLink,
} from "lucide-react";

type BlockPart =
  | { kind: "markdown"; content: string }
  | { kind: "collapse"; title: string; content: string };

function nodeToText(node: ReactNode): string {
  if (node == null || typeof node === "boolean") return "";
  if (typeof node === "string") return node;
  if (typeof node === "number") return String(node);
  if (Array.isArray(node)) return node.map(nodeToText).join("");
  if (typeof node === "object" && "props" in node) {
    const el = node as { props?: { children?: ReactNode } };
    return nodeToText(el.props?.children);
  }
  return "";
}

const CALLOUT_ICONS = {
  tip: Lightbulb,
  info: Info,
  warning: AlertTriangle,
  success: CheckCircle2,
} as const;

type CalloutKind = keyof typeof CALLOUT_ICONS;

const SECTION_ICONS: Record<string, typeof Sparkles> = {
  "quick answer": Sparkles,
  explanation: BookOpen,
  example: Calculator,
  "for example": Calculator,
  "next step": ArrowRightCircle,
  "is mein": ListOrdered,
  "in this": ListOrdered,
  "key points": ListOrdered,
  "main points": ListOrdered,
  steps: ListOrdered,
  overview: BookOpen,
  summary: BookOpen,
};

function headingIcon(text: string) {
  const key = text.toLowerCase().trim().replace(/:$/, "");
  return SECTION_ICONS[key] || null;
}

const CALLOUT_STYLES: Record<CalloutKind, string> = {
  tip: "border-[#BFFF07]/50 bg-[#f7ffe8] text-[#3d4d00]",
  info: "border-[#93c5fd]/60 bg-[#eff6ff] text-[#1e3a5f]",
  warning: "border-[#fcd34d]/70 bg-[#fffbeb] text-[#78350f]",
  success: "border-[#86efac]/60 bg-[#f0fdf4] text-[#14532d]",
};

function parseCalloutKind(text: string): { kind: CalloutKind; body: string } | null {
  const tagMatch = text.match(/^\s*\[!?(TIP|INFO|WARNING|SUCCESS|NOTE)\]\s*/i);
  if (tagMatch) {
    const tag = tagMatch[1].toUpperCase();
    const kind: CalloutKind =
      tag === "TIP" ? "tip" : tag === "WARNING" ? "warning" : tag === "SUCCESS" ? "success" : "info";
    return { kind, body: text.slice(tagMatch[0].length).trim() };
  }

  if (/^💡|^tip:/i.test(text)) {
    return { kind: "tip", body: text.replace(/^💡\s*|^tip:\s*/i, "").trim() };
  }
  if (/^⚠️|^⚠|^warning:/i.test(text)) {
    return { kind: "warning", body: text.replace(/^⚠️?\s*|^warning:\s*/i, "").trim() };
  }
  if (/^✅|^success:/i.test(text)) {
    return { kind: "success", body: text.replace(/^✅\s*|^success:\s*/i, "").trim() };
  }
  if (/^ℹ️|^ℹ|^note:/i.test(text)) {
    return { kind: "info", body: text.replace(/^ℹ️?\s*|^note:\s*/i, "").trim() };
  }

  return null;
}

function splitCollapsibleBlocks(source: string): BlockPart[] {
  const parts: BlockPart[] = [];
  const regex = /<<collapse:([^>]+)>>([\s\S]*?)<<\/collapse>>/gi;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(source)) !== null) {
    if (match.index > lastIndex) {
      parts.push({ kind: "markdown", content: source.slice(lastIndex, match.index).trim() });
    }
    parts.push({ kind: "collapse", title: match[1].trim(), content: match[2].trim() });
    lastIndex = regex.lastIndex;
  }

  if (lastIndex < source.length) {
    parts.push({ kind: "markdown", content: source.slice(lastIndex).trim() });
  }

  return parts.filter((p) => (p.kind === "markdown" ? p.content.length > 0 : true));
}

function CollapsibleBlock({ title, content }: { title: string; content: string }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="my-4 overflow-hidden rounded-xl border border-[#e5e5e5] bg-white">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left text-[15px] font-medium text-[#0d0d0d] transition hover:bg-[#fafafa]"
      >
        <span className="flex items-center gap-2">
          <Truck className="h-4 w-4 shrink-0 text-[#7a9900]" />
          {title}
        </span>
        <ChevronDown className={`h-4 w-4 shrink-0 text-[#666] transition ${open ? "rotate-180" : ""}`} />
      </button>
      {open ? (
        <div className="border-t border-[#ececec] px-4 py-3">
          <MarkdownBody content={content} />
        </div>
      ) : null}
    </div>
  );
}

function CalloutBox({ kind, children }: { kind: CalloutKind; children: ReactNode }) {
  const Icon = CALLOUT_ICONS[kind];
  return (
    <div className={`my-4 flex gap-3 rounded-xl border px-4 py-3.5 ${CALLOUT_STYLES[kind]}`}>
      <Icon className="mt-0.5 h-5 w-5 shrink-0 opacity-80" />
      <div className="min-w-0 flex-1 text-[14px] leading-relaxed [&>p]:m-0">{children}</div>
    </div>
  );
}

function MarkdownBody({ content, isStreaming }: { content: string; isStreaming?: boolean }) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        h1: ({ children }) => (
          <h2 className="mb-3 mt-6 text-xl font-bold tracking-tight text-[#0d0d0d] first:mt-0">{children}</h2>
        ),
        h2: ({ children }) => (
          <h3 className="mb-2.5 mt-5 flex items-center gap-2 text-lg font-semibold text-[#0d0d0d] first:mt-0">
            <Sparkles className="h-4 w-4 shrink-0 text-[#7a9900]" strokeWidth={2.25} />
            {children}
          </h3>
        ),
        h3: ({ children }) => {
          const label = nodeToText(children).trim();
          const Icon = headingIcon(label);
          return (
            <h4 className="mb-2 mt-5 flex items-center gap-2 text-base font-semibold text-[#222] first:mt-0">
              {Icon ? <Icon className="h-4 w-4 shrink-0 text-[#7a9900]" /> : (
                <span className="inline-block h-2 w-2 shrink-0 rounded-full bg-[#BFFF07]" />
              )}
              {children}
            </h4>
          );
        },
        p: ({ children }) => <p className="mb-3 leading-[1.8] text-[#1a1a1a] last:mb-0">{children}</p>,
        strong: ({ children }) => <strong className="font-semibold text-[#0d0d0d]">{children}</strong>,
        ul: ({ children }) => <ul className="my-3 space-y-2.5 pl-0">{children}</ul>,
        ol: ({ children }) => <ol className="my-3 list-decimal space-y-2.5 pl-5 marker:text-[#7a9900] marker:font-semibold">{children}</ol>,
        li: ({ children }) => (
          <li className="flex gap-2.5 text-[15px] leading-relaxed text-[#1a1a1a] [&>span]:min-w-0 [&>span]:flex-1">
            <ChevronRight className="mt-0.5 h-4 w-4 shrink-0 text-[#7a9900] [.list-decimal_&]:hidden" strokeWidth={2.5} />
            <span>{children}</span>
          </li>
        ),
        blockquote: ({ children }) => {
          const text = nodeToText(children).trim();
          const callout = parseCalloutKind(text);
          if (callout) {
            return (
              <CalloutBox kind={callout.kind}>
                <MarkdownBody content={callout.body} />
              </CalloutBox>
            );
          }
          return (
            <blockquote className="my-4 border-l-4 border-[#BFFF07] bg-[#fafafa] py-2 pl-4 pr-3 text-[#444] italic">
              {children}
            </blockquote>
          );
        },
        table: ({ children }) => (
          <div className="my-4 overflow-x-auto rounded-xl border border-[#e5e5e5]">
            <table className="w-full min-w-[280px] border-collapse text-left text-sm">{children}</table>
          </div>
        ),
        thead: ({ children }) => <thead className="bg-[#f7f7f8] text-[#0d0d0d]">{children}</thead>,
        th: ({ children }) => (
          <th className="border-b border-[#ececec] px-4 py-2.5 text-xs font-semibold uppercase tracking-wide">
            <span className="inline-flex items-center gap-1.5">
              <ListOrdered className="h-3 w-3 text-[#7a9900]" />
              {children}
            </span>
          </th>
        ),
        td: ({ children }) => (
          <td className="border-b border-[#f0f0f0] px-4 py-2.5 text-[#333]">{children}</td>
        ),
        tr: ({ children }) => <tr className="even:bg-[#fafafa]/80">{children}</tr>,
        hr: () => <hr className="my-6 border-[#ececec]" />,
        a: ({ href, children }) => (
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 font-medium text-[#2563eb] underline decoration-[#2563eb]/30 underline-offset-2 hover:decoration-[#2563eb]"
          >
            {children}
            <ExternalLink className="h-3 w-3 shrink-0 opacity-70" />
          </a>
        ),
        code: ({ className, children }) => {
          const isBlock = className?.includes("language-");
          if (isBlock) {
            return (
              <pre className="my-4 overflow-x-auto rounded-xl bg-[#1a1a1a] p-4 text-[13px] leading-relaxed text-[#f5f5f5]">
                <code>{children}</code>
              </pre>
            );
          }
          return (
            <code className="rounded-md bg-[#f4f4f4] px-1.5 py-0.5 text-[13px] font-medium text-[#c7254e]">
              {children}
            </code>
          );
        },
      }}
    >
      {content}
    </ReactMarkdown>
  );
}

export default function AiRichMarkdown({
  content,
  isStreaming,
}: {
  content: string;
  isStreaming?: boolean;
}) {
  const normalized = isStreaming ? content : normalizeAiMarkdown(content);
  const blocks = splitCollapsibleBlocks(normalized);

  if (!blocks.length) {
    return <MarkdownBody content={normalized} isStreaming={isStreaming} />;
  }

  return (
    <div className={`ai-rich-markdown space-y-1 text-[15px] ${isStreaming ? "streaming-cursor" : ""}`}>
      {blocks.map((block, i) =>
        block.kind === "collapse" ? (
          <CollapsibleBlock key={`c-${i}`} title={block.title} content={block.content} />
        ) : (
          <MarkdownBody key={`m-${i}`} content={block.content} isStreaming={isStreaming} />
        )
      )}
      {isStreaming ? (
        <span className="ml-0.5 inline-block h-[1.1em] w-0.5 animate-pulse bg-[#BFFF07]" aria-hidden />
      ) : null}
    </div>
  );
}
