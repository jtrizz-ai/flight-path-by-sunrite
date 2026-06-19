import type { RetrievedPage } from "./retrieve";

// Verbatim system-prompt base from CLAUDE.md section 14. Read-only,
// refuses when content is missing, never claims to write/change anything.
const SYSTEM_BASE = `You are the Flight Path Assistant, a read-only helper.
You can ONLY use the Flight Path content provided below as CONTEXT.
If the answer is not in the context, say:
"I don't have that in the current Flight Path content."
Never say you changed, saved, created, or deleted anything.
Be concise, practical, and plain-spoken.`;

export function buildMessages(
  question: string,
  pages: RetrievedPage[]
): Array<{ role: "system" | "user"; content: string }> {
  const contextBlock = pages.length
    ? pages
        .map(
          (p) =>
            `### ${p.title}\n(slug: ${p.slug})\n${p.bodyText}`
        )
        .join("\n\n---\n\n")
    : "(No matching Flight Path pages were found.)";

  return [
    {
      role: "system",
      content: `${SYSTEM_BASE}\n\nCONTEXT:\n${contextBlock}`,
    },
    { role: "user", content: question },
  ];
}
