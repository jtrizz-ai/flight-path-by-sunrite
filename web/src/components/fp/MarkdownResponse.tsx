"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkBreaks from "remark-breaks";

type Props = {
  children: string;
  isMe?: boolean;
};

// Renders an LLM markdown response with dark-theme styling that matches
// the Flight Path design tokens. Used inside chat bubbles.
//
// Plugins:
//   remarkGfm   — GitHub-flavored markdown: tables, strikethrough, task lists.
//   remarkBreaks — single newlines become <br> (instead of being ignored).
export function MarkdownResponse({ children, isMe = false }: Props) {
  const textColor = isMe ? "#fff" : "var(--color-fp-ink)";
  const mutedColor = isMe ? "rgba(255,255,255,0.7)" : "var(--color-fp-ink-3)";
  const borderColor = isMe ? "rgba(255,255,255,0.16)" : "var(--color-fp-line)";

  // Preprocess: convert literal <br>, <br/>, <br /> into newlines so
  // remarkBreaks can turn them into real line breaks.
  const cleaned = children
    .replace(/<br\s*\/?>(?!])/gi, "\n")
    .replace(/<br>/gi, "\n");

  return (
    <div
      className="fp-markdown font-[var(--font-fp-sans)] text-[15px]"
      style={{
        color: textColor,
        lineHeight: 1.6,
      }}
    >
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkBreaks]}
        components={{
          // ── Headings ──────────────────────────────────────────────
          h1: ({ node, ...props }) => (
            <h1
              className="font-bold text-[17px] mt-4 mb-2 first:mt-0"
              style={{ color: textColor, lineHeight: 1.4 }}
              {...props}
            />
          ),
          h2: ({ node, ...props }) => (
            <h2
              className="font-bold text-[16px] mt-3.5 mb-2 first:mt-0"
              style={{ color: textColor, lineHeight: 1.4 }}
              {...props}
            />
          ),
          h3: ({ node, ...props }) => (
            <h3
              className="font-semibold text-[15px] mt-3 mb-1.5 first:mt-0"
              style={{ color: textColor, lineHeight: 1.4 }}
              {...props}
            />
          ),
          // ── Paragraphs ────────────────────────────────────────────
          p: ({ node, ...props }) => (
            <p className="my-[0.75em] first:mt-0 last:mb-0" {...props} />
          ),
          // ── Strong / emphasis ─────────────────────────────────────
          strong: ({ node, ...props }) => <strong className="font-bold" {...props} />,
          em: ({ node, ...props }) => <em className="italic" {...props} />,
          // ── Inline code ───────────────────────────────────────────
          code: ({ node, className, children, ...props }) => {
            const isBlock = className?.includes("language-");
            if (isBlock) {
              return (
                <code
                  className="block font-mono text-[13px]"
                  style={{
                    background: "rgba(255,255,255,0.06)",
                    color: textColor,
                  }}
                  {...props}
                >
                  {children}
                </code>
              );
            }
            return (
              <code
                className="font-mono text-[13px] px-1.5 py-0.5 rounded-[4px]"
                style={{
                  background: "rgba(255,255,255,0.08)",
                  color: textColor,
                }}
                {...props}
              >
                {children}
              </code>
            );
          },
          // ── Code blocks ───────────────────────────────────────────
          pre: ({ node, ...props }) => (
            <pre
              className="my-2.5 p-3 rounded-[8px] overflow-x-auto"
              style={{ background: "rgba(255,255,255,0.06)" }}
              {...props}
            />
          ),
          // ── Bullet lists ──────────────────────────────────────────
          ul: ({ node, ...props }) => (
            <ul
              className="my-[0.75em] ml-5 list-disc space-y-[0.4em] first:mt-0 last:mb-0"
              {...props}
            />
          ),
          // ── Numbered lists ────────────────────────────────────────
          ol: ({ node, ...props }) => (
            <ol
              className="my-[0.75em] ml-5 list-decimal space-y-[0.4em] first:mt-0 last:mb-0"
              {...props}
            />
          ),
          // ── List items ────────────────────────────────────────────
          li: ({ node, ...props }) => (
            <li className="pl-1" style={{ lineHeight: 1.6 }} {...props} />
          ),
          // ── Blockquote ────────────────────────────────────────────
          blockquote: ({ node, ...props }) => (
            <blockquote
              className="my-2.5 pl-3.5 italic border-l-2"
              style={{
                borderColor: borderColor,
                color: mutedColor,
              }}
              {...props}
            />
          ),
          // ── Horizontal rule ───────────────────────────────────────
          hr: ({ node, ...props }) => (
            <hr
              className="my-3.5 border-0 h-px"
              style={{
                background: borderColor,
              }}
              {...props}
            />
          ),
          // ── Links ─────────────────────────────────────────────────
          a: ({ node, ...props }) => (
            <a
              className="underline underline-offset-2"
              style={{
                color: isMe ? "#fff" : "var(--color-fp-accent)",
              }}
              target="_blank"
              rel="noopener noreferrer"
              {...props}
            />
          ),
          // ── Tables (GFM) ──────────────────────────────────────────
          table: ({ node, ...props }) => (
            <div className="my-2.5 w-full overflow-x-auto">
              <table
                className="w-full border-collapse text-[14px] first:mt-0 last:mb-0"
                style={{ minWidth: "100%" }}
                {...props}
              />
            </div>
          ),
          thead: ({ node, ...props }) => <thead {...props} />,
          tbody: ({ node, ...props }) => <tbody {...props} />,
          tr: ({ node, ...props }) => (
            <tr style={{ borderBottom: `1px solid ${borderColor}` }} {...props} />
          ),
          th: ({ node, ...props }) => (
            <th
              className="text-left font-semibold px-3 py-2 whitespace-nowrap"
              style={{
                borderBottom: `1px solid ${borderColor}`,
                color: textColor,
                background: "rgba(255,255,255,0.04)",
              }}
              {...props}
            />
          ),
          td: ({ node, ...props }) => (
            <td
              className="px-3 py-2 align-top"
              style={{ color: textColor }}
              {...props}
            />
          ),
        }}
      >
        {cleaned}
      </ReactMarkdown>
    </div>
  );
}
