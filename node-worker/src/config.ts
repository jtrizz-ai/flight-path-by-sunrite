import { config as loadEnv } from 'dotenv'
import { z } from 'zod'

// Load environment variables
loadEnv()

// Environment variable schema with validation
const envSchema = z.object({
  // Notion Configuration
  NOTION_API_KEY: z.string().min(1, "NOTION_API_KEY is required"),
  NOTION_ROOT_PAGE_ID: z.string().min(1, "NOTION_ROOT_PAGE_ID is required"),

  // Supabase Configuration
  SUPABASE_URL: z.string().url("SUPABASE_URL must be a valid URL"),
  SUPABASE_SERVICE_KEY: z.string().min(1, "SUPABASE_SERVICE_KEY is required"),

  // Worker Configuration
  WORKER_MODE: z.enum(['schedule', 'manual', 'cron']).default('schedule'),
  CRON_EXPRESSION: z.string().default('*/30 * * * *'),
  MAX_DEPTH: z.string().transform(Number).pipe(z.number().min(1).max(10)).default(5),
  CONCURRENT_REQUESTS: z.string().transform(Number).pipe(z.number().min(1).max(10)).default(3),
  DELAY_BETWEEN_REQUESTS: z.string().transform(Number).pipe(z.number().min(100)).default(1000),

  // Logging
  LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error']).default('info'),
})

// Validate and export environment variables
export const env = envSchema.parse(process.env)

// Export typed config object
export const config = {
  notion: {
    apiKey: env.NOTION_API_KEY,
    rootPageId: env.NOTION_ROOT_PAGE_ID,
  },
  supabase: {
    url: env.SUPABASE_URL,
    serviceKey: env.SUPABASE_SERVICE_KEY,
  },
  worker: {
    mode: env.WORKER_MODE,
    cronExpression: env.CRON_EXPRESSION,
    maxDepth: env.MAX_DEPTH,
    concurrentRequests: env.CONCURRENT_REQUESTS,
    delayBetweenRequests: env.DELAY_BETWEEN_REQUESTS,
  },
  logging: {
    level: env.LOG_LEVEL,
  },
}

// Helper function to validate config on startup
export function validateConfig(): void {
  try {
    envSchema.parse(process.env)
    console.log('✅ Configuration validated successfully')
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('❌ Configuration validation failed:')
      error.issues.forEach((issue: any) => {
        console.error(`  - ${issue.path.join('.')}: ${issue.message}`)
      })
      throw new Error('Invalid configuration. Please check your .env file.')
    }
    throw error
  }
}
