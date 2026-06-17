import { validateConfig, config } from './config'
import { WorkerService } from './services/worker.service'

async function main() {
  console.log('🚀 Flight Path Worker Starting...')
  console.log(`🔧 Environment: ${process.env.NODE_ENV || 'development'}`)

  try {
    // Validate configuration
    validateConfig()

    // Create worker service
    const worker = new WorkerService()

    // Determine worker mode
    switch (config.worker.mode) {
      case 'manual':
        console.log('🎯 Manual mode: Running single crawl...')
        await worker.runManualCrawl()
        console.log('✅ Manual crawl complete. Exiting.')
        process.exit(0)
        break

      case 'schedule':
        console.log('⏰ Schedule mode: Starting scheduled crawling...')
        worker.startScheduledCrawl()
        console.log('✅ Worker is now running. Press Ctrl+C to stop.')
        break

      case 'cron':
        console.log('⏰ Cron mode: Starting cron-based crawling...')
        worker.startScheduledCrawl()
        console.log('✅ Worker is now running. Press Ctrl+C to stop.')
        break

      default:
        throw new Error(`Unknown worker mode: ${config.worker.mode}`)
    }

    // Handle graceful shutdown
    process.on('SIGINT', () => {
      console.log('🛑 Shutting down worker gracefully...')
      process.exit(0)
    })

    process.on('SIGTERM', () => {
      console.log('🛑 Shutting down worker gracefully...')
      process.exit(0)
    })

  } catch (error) {
    console.error('❌ Worker failed to start:', error)
    process.exit(1)
  }
}

// Start the worker
main().catch(error => {
  console.error('❌ Fatal error:', error)
  process.exit(1)
})
