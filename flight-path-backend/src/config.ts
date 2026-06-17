import dotenv from 'dotenv';
import { z } from 'zod';

// Load environment variables from .env file
dotenv.config();

// Define the schema for environment variables
const envSchema = z.object({
  // Server Configuration
  PORT: z.string().regex(/^\d+$/, "PORT must be a number").default("8787"),

  // Local LLM Configuration
  LLM_BASE_URL: z.string().url("LLM_BASE_URL must be a valid URL").default("http://localhost:1234/v1"),
  LLM_MODEL: z.string().min(1, "LLM_MODEL is required").default("local-model"),
  LLM_API_KEY: z.string().default("not-needed-for-local"),
});

// Validate and parse environment variables
function validateEnv() {
  try {
    const env = envSchema.parse(process.env);
    return {
      server: {
        port: parseInt(env.PORT, 10),
      },
      llm: {
        baseUrl: env.LLM_BASE_URL,
        model: env.LLM_MODEL,
        apiKey: env.LLM_API_KEY,
      },
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const missingVars = error.errors.map(err => `${err.path.join('.')} (${err.message})`).join(', ');
      throw new Error(
        `❌ Missing or invalid environment variables:\n${missingVars}\n\n` +
        `Please check your .env file. For basic functionality, only PORT is required.`
      );
    }
    throw error;
  }
}

// Export validated configuration
export const config = validateEnv();
