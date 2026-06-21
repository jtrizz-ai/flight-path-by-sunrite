import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { requireUser } from "@/lib/auth/resolveSession";
import { retrievePages, toSources } from "@/lib/chat/retrieve";
import { callLlmWithTools, type ChatMsg, type ToolDefinition, type ToolCall } from "@/lib/chat/llm";
import type { ChatSource } from "@/lib/types";

// ─────────────────────────────────────────────────────────────────────────
// POST /api/chat
//
// Flow (LLM-directed retrieval via tool calling):
//   1. Persist the user message.
//   2. Offer the LLM a `search_flight_path` tool. It decides whether the
//      question needs a knowledge-base lookup and what query to use.
//   3. If the LLM calls the tool → run retrieval → send results back → LLM
//      produces a grounded answer with sources.
//   4. If the LLM skips the tool → it already answered from general knowledge.
//   5. Persist + return { answer, sources }.
//
// 503 if the LLM is unreachable.
// ─────────────────────────────────────────────────────────────────────────

const SYSTEM_PROMPT = `You are the Flight Path Assistant, a helpful AI assistant for the Sunrite Solar team.

You have access to a "search_flight_path" tool that searches the Flight Path knowledge base (sales training, scripts, schedules, reading lists, and program content).

RULES:
- For ANY question that could be about the Flight Path program, solar sales process, training material, scripts, schedules, or company content: call "search_flight_path" FIRST with a concise search query, then answer using the results.
- For general knowledge questions (math, writing, coding, general advice, casual chat): answer directly without the tool.
- When you search and find relevant content, base your answer on it and be specific.
- When you search and find nothing relevant, say so briefly, then offer your best general answer if applicable.
- Be concise, practical, and plain-spoken. Format answers in markdown when it improves readability.`;

const SEARCH_TOOL: ToolDefinition = {
  type: "function",
  function: {
    name: "search_flight_path",
    description:
      "Search the Flight Path knowledge base for sales training content, scripts, schedules, reading lists, and program material. Use this whenever the user asks about anything related to the Flight Path program or solar sales process.",
    parameters: {
      type: "object",
      properties: {
        query: {
          type: "string",
          description:
            "A concise search query (2-6 words). Extract the key topic from the user's question. Example: 'door pitch script' or 'recommended reading list'.",
        },
      },
      required: ["query"],
    },
  },
};

export async function POST(req: Request) {
  const user = await requireUser(req);
  if (user instanceof Response) return user;

  let body: { message?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const message = typeof body.message === "string" ? body.message.trim() : "";
  if (message.length === 0) {
    return NextResponse.json({ error: "message required" }, { status: 400 });
  }
  if (message.length > 4000) {
    return NextResponse.json({ error: "message too long (max 4000)" }, { status: 400 });
  }

  // Get or create the user's thread.
  let { rows: tRows } = await query<{ id: string }>(
    `SELECT id FROM chat_threads WHERE user_id = $1 LIMIT 1`,
    [user.id]
  );
  if (tRows.length === 0) {
    const { rows: ins } = await query<{ id: string }>(
      `INSERT INTO chat_threads (user_id) VALUES ($1) RETURNING id`,
      [user.id]
    );
    tRows = ins;
  }
  const threadId = tRows[0].id;

  // 1. Persist the user message.
  await query(
    `INSERT INTO chat_messages (thread_id, role, content) VALUES ($1, 'user', $2)`,
    [threadId, message]
  );

  // 2. First LLM call — offer the search tool.
  const messages: ChatMsg[] = [
    { role: "system", content: SYSTEM_PROMPT },
    { role: "user", content: message },
  ];

  const first = await callLlmWithTools(messages, [SEARCH_TOOL]);
  if (!first.ok) {
    return NextResponse.json({ error: "LLM unavailable", detail: first.error }, { status: 503 });
  }

  let answer: string;
  let sources: ChatSource[] = [];

  // 3. Did the LLM call the search tool?
  if (first.toolCalls && first.toolCalls.length > 0) {
    const toolMessages = await runToolCalls(first.toolCalls);
    const retrievedSources = toolMessages.flatMap((tm) => tm.sources);
    sources = retrievedSources;

    // Build the follow-up conversation: original messages + assistant tool
    // call + tool results.
    const followUp: ChatMsg[] = [
      ...messages,
      { role: "assistant", content: first.answer || null, tool_calls: first.toolCalls },
      ...toolMessages.map((tm) => ({ role: "tool" as const, content: tm.content, tool_call_id: tm.id })),
    ];

    const second = await callLlmWithTools(followUp, [SEARCH_TOOL], { toolChoice: "auto" });
    if (!second.ok) {
      return NextResponse.json({ error: "LLM unavailable", detail: second.error }, { status: 503 });
    }

    // The model might want to search again; handle one more round for safety.
    if (second.toolCalls && second.toolCalls.length > 0) {
      const more = await runToolCalls(second.toolCalls);
      sources = [...sources, ...more.flatMap((tm) => tm.sources)];
      const finalMessages: ChatMsg[] = [
        ...followUp,
        { role: "assistant", content: second.answer || null, tool_calls: second.toolCalls },
        ...more.map((tm) => ({ role: "tool" as const, content: tm.content, tool_call_id: tm.id })),
      ];
      const third = await callLlmWithTools(finalMessages, [], { toolChoice: "auto" });
      answer = third.ok ? third.answer : (second.answer || "I couldn't complete that search.");
    } else {
      answer = second.answer || "I couldn't find relevant information.";
    }
  } else {
    // 4. LLM answered directly (general knowledge question).
    answer = first.answer;
  }

  // 5. Persist the assistant message with sources.
  await query(
    `INSERT INTO chat_messages (thread_id, role, content, sources)
     VALUES ($1, 'assistant', $2, $3)`,
    [threadId, answer, JSON.stringify(sources)]
  );

  return NextResponse.json({ answer, sources });
}

// ── Tool execution ──────────────────────────────────────────────────────

async function runToolCalls(
  toolCalls: ToolCall[]
): Promise<Array<{ id: string; content: string; sources: ChatSource[] }>> {
  const results: Array<{ id: string; content: string; sources: ChatSource[] }> = [];
  for (const tc of toolCalls) {
    if (tc.function.name === "search_flight_path") {
      let searchQuery = "";
      try {
        const args = JSON.parse(tc.function.arguments);
        searchQuery = typeof args.query === "string" ? args.query : "";
      } catch {
        searchQuery = "";
      }
      const pages = await retrievePages(searchQuery, 4);
      const sources = toSources(pages);
      const content =
        pages.length > 0
          ? pages
              .map(
                (p) =>
                  `### ${p.title}\n(slug: ${p.slug})\n${p.bodyText}`
              )
              .join("\n\n---\n\n")
          : "No matching Flight Path pages were found for this query.";
      results.push({ id: tc.id, content, sources });
    } else {
      results.push({ id: tc.id, content: `Unknown tool: ${tc.function.name}`, sources: [] });
    }
  }
  return results;
}
