import type { RetrievedPage } from "./retrieve";

const SYSTEM_BASE = `You are the Flight Path Assistant, a helpful AI assistant for the Sunrite Solar team.
You can answer any question — general knowledge, advice, writing help, coding, or questions about Flight Path content.
When relevant Flight Path content is provided below as CONTEXT, use it to ground your answers and prefer it over your own knowledge for those topics.
If no context is provided or the question is unrelated to Flight Path, answer normally using your own knowledge.
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
    : "(No matching Flight Path pages were found for this question.)";

  return [
    {
      role: "system",
      content: `${SYSTEM_BASE}\n\nCONTEXT:\n${contextBlock}`,
    },
    { role: "user", content: question },
  ];
}
