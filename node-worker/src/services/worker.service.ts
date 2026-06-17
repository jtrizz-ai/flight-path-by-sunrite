import { NotionService } from './notion.service'
import { SupabaseService, CrawlStats } from './supabase.service'
import { config } from '../config'

export class WorkerService {
  private notionService: NotionService
  private supabaseService: SupabaseService

  constructor() {
    this.notionService = new NotionService()
    this.supabaseService = new SupabaseService()
  }

  /**
   * Execute full crawl workflow
   */
  async executeCrawl(): Promise<void> {
    let logId: string | null = null

    try {
      console.log('🚀 Starting Flight Path crawler...')
      console.log(`⚙️  Config: maxDepth=${config.worker.maxDepth}, concurrent=${config.worker.concurrentRequests}`)

      // Test connections
      const notionOk = await this.notionService.testConnection()
      const supabaseOk = await this.supabaseService.testConnection()

      if (!notionOk || !supabaseOk) {
        throw new Error('Connection tests failed')
      }

      // Create crawl log
      logId = await this.supabaseService.logCrawl({
        pagesProcessed: 0,
        pagesCreated: 0,
        pagesUpdated: 0,
      }, 'running')

      // Get last crawl time
      const lastCrawl = await this.supabaseService.getLastCrawlTime()
      if (lastCrawl) {
        console.log(`📅 Last crawl: ${lastCrawl}`)
      }

      // Execute recursive crawl
      console.log('🔍 Starting recursive Notion crawl...')
      const pages = await this.notionService.crawlPages(config.worker.maxDepth)

      if (pages.length === 0) {
        console.warn('⚠️  No pages found during crawl')
        await this.supabaseService.updateCrawlLog(logId!, {
          pagesProcessed: 0,
          pagesCreated: 0,
          pagesUpdated: 0,
        }, 'completed', 'No pages found')
        return
      }

      // Save to Supabase
      console.log('💾 Saving pages to Supabase...')
      const stats = await this.supabaseService.savePages(pages)

      // Update crawl log as completed
      await this.supabaseService.updateCrawlLog(logId!, stats, 'completed')

      console.log('✅ Crawl completed successfully!')
      console.log(`📊 Results: ${stats.pagesCreated} created, ${stats.pagesUpdated} updated, ${stats.pagesProcessed} total`)

    } catch (error) {
      console.error('❌ Crawl failed:', error)

      if (logId) {
        await this.supabaseService.updateCrawlLog(logId, {
          pagesProcessed: 0,
          pagesCreated: 0,
          pagesUpdated: 0,
        }, 'failed', error instanceof Error ? error.message : 'Unknown error')
      }

      throw error
    }
  }

  /**
   * Run single manual crawl
   */
  async runManualCrawl(): Promise<void> {
    console.log('🎯 Running manual crawl...')
    await this.executeCrawl()
  }

  /**
   * Start scheduled crawling (cron mode)
   */
  startScheduledCrawl(): void {
    const cronPattern = config.worker.cronExpression
    console.log(`⏰ Starting scheduled crawl with pattern: ${cronPattern}`)
    console.log(`📅 Worker mode: ${config.worker.mode}`)

    // Parse cron expression and schedule
    // For now, we'll use a simple interval
    const interval = this.parseCronToInterval(cronPattern)

    setInterval(async () => {
      try {
        await this.executeCrawl()
      } catch (error) {
        console.error('❌ Scheduled crawl failed:', error)
      }
    }, interval)

    // Run initial crawl
    this.executeCrawl().catch(error => {
      console.error('❌ Initial crawl failed:', error)
    })
  }

  /**
   * Simple cron parser (basic implementation)
   * For production, consider using node-cron or similar library
   */
  private parseCronToInterval(cronExpression: string): number {
    // Default: every 30 minutes
    const defaultInterval = 30 * 60 * 1000

    try {
      const parts = cronExpression.split(' ')
      if (parts.length !== 5) {
        console.warn('Invalid cron expression, using default 30-minute interval')
        return defaultInterval
      }

      const minutePart = parts[0]

      // Simple patterns
      if (minutePart === '*/30') {
        return 30 * 60 * 1000  // 30 minutes
      } else if (minutePart === '*/15') {
        return 15 * 60 * 1000  // 15 minutes
      } else if (minutePart === '*/60' || minutePart === '*') {
        return 60 * 60 * 1000  // 1 hour
      } else if (minutePart === '0') {
        return 60 * 60 * 1000  // 1 hour (every hour)
      } else {
        console.warn('Complex cron patterns not fully supported, using default 30-minute interval')
        return defaultInterval
      }
    } catch (error) {
      console.error('Failed to parse cron expression:', error)
      return defaultInterval
    }
  }

  /**
   * Get worker status
   */
  async getStatus(): Promise<{
    healthy: boolean
    lastCrawl: string | null
    config: any
  }> {
    try {
      const lastCrawl = await this.supabaseService.getLastCrawlTime()

      return {
        healthy: true,
        lastCrawl,
        config: {
          mode: config.worker.mode,
          cronExpression: config.worker.cronExpression,
          maxDepth: config.worker.maxDepth,
        },
      }
    } catch (error) {
      return {
        healthy: false,
        lastCrawl: null,
        config: null,
      }
    }
  }
}
