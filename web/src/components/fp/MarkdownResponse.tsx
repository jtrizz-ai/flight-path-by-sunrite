"use client";

import ReactMarkdown from "react-markdown";

type Props = {
  children: string;
  isMe?: boolean;
};

// Renders an LLM markdown response with dark-theme styling that matches
// the Flight Path design tokens. Used inside chat bubbles.
export function MarkdownResponse({ children, isMe = false }: Props) {
  const textColor = isMe ? "#fff" : "var(--color-fp-ink)";
  const mutedColor = isMe ? "rgba(255,255,255,0.7)" : "var(--color-fp-ink-3)";

  return (
    <div
      className="font-[var(--font-fp-sans)] text-[13.5px] leading-relaxed"
      style={{
        color: textColor,
        // react-markdown renders block elements; let them flow.
      }}
    >
      <ReactMarkdown
        components={{
          // Headings
          h1: ({ node, ...props }) => (
            <h1
              className="font-bold text-[15px] mt-3 mb-1.5 first:mt-0"
              style={{ color: textColor }}
              {...props}
            />
          ),
          h2: ({ node, ...props }) => (
            <h2
              className="font-bold text-[14px] mt-3 mb-1.5 first:mt-0"
              style={{ color: textColor }}
              {...props}
            />
          ),
          h3: ({ node, ...props }) => (
            <h3
              className="font-semibold text-[13.5px] mt-2.5 mb-1 first:mt-0"
              style={{ color: textColor }}
              {...props}
            />
          ),
          // Paragraphs
          p: ({ node, ...props }) => <p className="my-1.5 first:mt-0 last:mb-0" {...props} />,
          // Strong / emphasis
          strong: ({ node, ...props }) => <strong className="font-bold" {...props} />,
          em: ({ node, ...props }) => <em className="italic" {...props} />,
          // Inline code
          code: ({ node, className, children, ...props }) => {
            const isBlock = className?.includes("language-");
            if (isBlock) {
              return (
                <code
                  className="block font-mono text-[12px] whitespace-pre-wrap"
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
                className="font-mono text-[12px] px-1 py-0.5 rounded"
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
          // Code blocks
          pre: ({ node, ...props }) => (
            <pre
              className="my-2 p-2.5 rounded-[8px] overflow-x-auto"
              style={{ background: "rgba(255,255,255,0.06)" }}
              {...props}
            />
          ),
          // Bullet lists
          ul: ({ node, ...props }) => (
            <ul className="my-1.5 ml-4 list-disc space-y-0.5" {...props} />
          ),
          // Numbered lists
          ol: ({ node, ...props }) => (
            <ol className="my-1.5 ml-4 list-decimal space-y-0.5" {...props} />
          ),
          // List items
          li: ({ node, ...props }) => <li className="pl-1" {...props} />,
          // Blockquote
          blockquote: ({ node, ...props }) => (
            <blockquote
              className="my-2 pl-3 italic border-l-2"
              style={{
                borderColor: isMe ? "rgba(255,255,255,0.2)" : "var(--color-fp-line)",
                color: mutedColor,
              }}
              {...props}
            />
          ),
          // Horizontal rule
          hr: ({ node, ...props }) => (
            <hr
              className="my-3 border-0 h-px"
              style={{
                background: isMe ? "rgba(255,255,255,0.15)" : "var(--color-fp-line)",
              }}
              {...props}
            />
          ),
          // Links
          a: ({ node, ...props }) => (
            <a
              className="underline"
              style={{
                color: isMe ? "#fff" : "var(--color-fp-accent)",
              }}
              target="_blank"
              rel="noopener noreferrer"
              {...props}
            />
          ),
        }}
      >
        {children}
      </ReactMarkdown>
    </div>
  );
}
