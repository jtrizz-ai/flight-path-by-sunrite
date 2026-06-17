/**
 * Validate that the request is appropriate for a read-only assistant
 */
export function validateRequest(message: string): { valid: boolean; warning?: string } {
  const lowerMessage = message.toLowerCase();

  // Obvious attempts to manipulate or get the assistant to do things it shouldn't
  const dangerousPatterns = [
    /ignore\s+(previous|all)\s+(instructions?|rules?)/i,
    /you\s+are\s+now/i,
    /act\s+as\s+(a|an)\s+/i,
    /pretend\s+to\s+be/i,
    /roleplay\s+as/i,
    /forget\s+(everything|all|previous)/i,
  ];

  for (const pattern of dangerousPatterns) {
    if (pattern.test(message)) {
      return {
        valid: false,
        warning: 'This request appears to be trying to manipulate the assistant. Please ask a straightforward question about the Flight Path content.',
      };
    }
  }

  return { valid: true };
}

/**
 * Validate that the response doesn't claim to have taken actions
 */
export function validateResponse(answer: string): { valid: boolean; warning?: string } {
  const lowerAnswer = answer.toLowerCase();

  // Phrases that suggest the assistant took action
  const actionPhrases = [
    "i've saved",
    "i've created",
    "i've updated",
    "i've deleted",
    "i've modified",
    "i've changed",
    "i've archived",
    "i stored",
    "i added",
    "i removed",
    "i updated",
  ];

  for (const phrase of actionPhrases) {
    if (lowerAnswer.includes(phrase)) {
      return {
        valid: false,
        warning: `Response appears to claim write actions (contains "${phrase}"). Assistant must be read-only.`,
      };
    }
  }

  return { valid: true };
}
