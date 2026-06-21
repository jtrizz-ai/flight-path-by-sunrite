import { config as loadEnv } from 'dotenv'
import { z } from 'zod'

// Load environment variables
loadEnv()

// Environment variable schema with validation.
//
// NOTE: This previously required Supabase URL + service key. We now talk to the
// REMOTE Postgres cluster on the trashcan (100.117.75.7:5432) over Tailscale,
// via DATABASE_URL only.
const envSchema = z.object({
  // Notion Configuration
  NOTION_API_KEY: z.string().min(1, 'NOTION_API_KEY is required'),
  NOTION_ROOT_PAGE_ID: z
    .string()
    .min(1, 'NOTION_ROOT_PAGE_ID is required (the Flight Path Program wiki id)'),

  // Remote Postgres on the trashcan. Must match web/.env.
  DATABASE_URL: z
    .string()
    .min(1, 'DATABASE_URL is required (e.g. postgres://flightpath_user:pw@100.117.75.7:5432/flightpath?sslmode=disable)'),

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
  database: {
    url: env.DATABASE_URL,
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
