// Thread title derivation — kept in its own module so it can be unit-tested
// without spinning up the chat route. Used the first time a user sends a
// message in a new thread.

const MAX_TITLE_LEN = 50;

/**
 * Derive a short, human-readable thread title from the first user message.
 *
 * Rules:
 *   • Collapse all whitespace (including newlines) to single spaces.
 *   • Trim to MAX_TITLE_LEN characters on a word boundary when possible.
 *   • Append an ellipsis ("…") when the input was truncated.
 *   • Never return an empty string — fall back to "New conversation".
 *
 * Examples:
 *   "Explain the door pitch"                       -> "Explain the door pitch"
 *   "What should I focus on today?"                -> "What should I focus on today?"
 *   "Can you summarize the forty-day plan for new hires please?"
 *                                                   -> "Can you summarize the forty-day plan for new…"
 *   "   \n\n  "                                     -> "New conversation"
 */
export function deriveThreadTitle(input: string): string {
  const collapsed = input.replace(/\s+/g, " ").trim();
  if (collapsed.length === 0) return "New conversation";
  if (collapsed.length <= MAX_TITLE_LEN) return collapsed;

  // Walk backwards from the limit to find a word boundary.
  const slice = collapsed.slice(0, MAX_TITLE_LEN);
  const lastSpace = slice.lastIndexOf(" ");
  const head = lastSpace > 20 ? slice.slice(0, lastSpace) : slice;
  return `${head}…`;
}
