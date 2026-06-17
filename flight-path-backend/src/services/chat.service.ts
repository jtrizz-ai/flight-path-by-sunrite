import { config } from '../config';
import { retrievalService } from './retrieval.service';
import { buildPrompt, formatSources } from '../utils/buildPrompt';
import { validateRequest, validateResponse } from '../utils/guardrails';

export interface ChatResponse {
  answer: string;
  sources: Array<{
    moduleId: string;
    title: string;
    snippet: string;
  }>;
}

export class ChatService {
  private llmAvailable: boolean = false;

  constructor() {
    this.checkLLMAvailability();
  }

  /**
   * Check if the local LLM is available
   */
  private async checkLLMAvailability(): Promise<void> {
    try {
      const response = await fetch(`${config.llm.baseUrl}/models`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${config.llm.apiKey}`,
        },
      });

      this.llmAvailable = response.ok;
      console.log(this.llmAvailable ? '✅ LLM is available' : '⚠️  LLM is not available');
    } catch (error) {
      console.log('⚠️  Could not reach LLM');
      this.llmAvailable = false;
    }
  }

  /**
   * Main chat method - processes user question and returns answer with sources
   */
  async chat(message: string, moduleScope?: string): Promise<ChatResponse> {
    // Validate request
    const requestValidation = validateRequest(message);
    if (!requestValidation.valid) {
      throw new Error(requestValidation.warning);
    }

    // Retrieve relevant chunks
    const retrievedChunks = retrievalService.search(message, 4);

    // Build prompt with context
    const prompt = buildPrompt(message, retrievedChunks);

    try {
      // Call local LLM
      const answer = await this.callLLM(prompt);

      // Validate response
      const responseValidation = validateResponse(answer);
      if (!responseValidation.valid) {
        throw new Error(responseValidation.warning);
      }

      // Format sources
      const sources = formatSources(retrievedChunks);

      return {
        answer,
        sources,
      };
    } catch (error) {
      console.error('Chat error:', error);
      throw error;
    }
  }

  /**
   * Call the local LLM (OpenAI-compatible endpoint)
   */
  private async callLLM(prompt: string): Promise<string> {
    if (!this.llmAvailable) {
      throw new Error('Local LLM is not available. Please ensure LM Studio or Ollama is running.');
    }

    try {
      const response = await fetch(`${config.llm.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${config.llm.apiKey}`,
        },
        body: JSON.stringify({
          model: config.llm.model,
          messages: [
            {
              role: 'user',
              content: prompt,
            },
          ],
          temperature: 0.7,
          max_tokens: 1000,
        }),
      });

      if (!response.ok) {
        throw new Error(`LLM responded with status ${response.status}`);
      }

      const data = await response.json();
      const answer = data.choices[0]?.message?.content || 'No response from LLM';

      return answer;
    } catch (error) {
      console.error('Error calling LLM:', error);
      throw new Error('Failed to get response from local LLM');
    }
  }

  /**
   * Check if LLM is available
   */
  isLLMAvailable(): boolean {
    return this.llmAvailable;
  }

  /**
   * Re-check LLM availability
   */
  async refreshLLMStatus(): Promise<void> {
    await this.checkLLMAvailability();
  }
}

// Export singleton instance
export const chatService = new ChatService();
