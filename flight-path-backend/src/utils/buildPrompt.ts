import { SearchResult } from '../services/retrieval.service';

const SYSTEM_PROMPT = `You are the Flight Path Assistant, a read-only helper.
You can ONLY use the Flight Path Program content provided below as CONTEXT.
If the answer is not in the context, say:
"I don't have that in the current Flight Path content."
Never say you changed, saved, created, or deleted anything.
Be concise, practical, and plain-spoken.`;

/**
 * Build the complete prompt for the LLM with retrieved context
 */
export function buildPrompt(query: string, retrievedChunks: SearchResult[]): string {
  let prompt = SYSTEM_PROMPT + '\n\n';

  // Add context from retrieved chunks
  if (retrievedChunks.length > 0) {
    prompt += 'CONTEXT:\n';
    for (let i = 0; i < retrievedChunks.length; i++) {
      const chunk = retrievedChunks[i];
      prompt += `\n--- Source ${i + 1} (${chunk.title}) ---\n`;
      prompt += chunk.content + '\n';
    }
    prompt += '\n';
  } else {
    prompt += 'CONTEXT: No relevant content found.\n\n';
  }

  // Add the user's question
  prompt += `QUESTION:\n${query}\n`;

  return prompt;
}

/**
 * Format sources for the response
 */
export function formatSources(retrievedChunks: SearchResult[]): Array<{
  moduleId: string;
  title: string;
  snippet: string;
}> {
  return retrievedChunks.map(chunk => ({
    moduleId: chunk.moduleId,
    title: chunk.title,
    snippet: chunk.content.substring(0, 150) + (chunk.content.length > 150 ? '...' : ''),
  }));
}
