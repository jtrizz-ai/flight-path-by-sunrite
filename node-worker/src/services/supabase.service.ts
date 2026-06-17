import { createClient } from '@supabase/supabase-js'
import { config } from '../config'
import { NotionPage } from './notion.service'

export interface CrawlStats {
  pagesProcessed: number
  pagesCreated: number
  pagesUpdated: number
}

export class SupabaseService {
  private client: any

  constructor() {
    this.client = createClient(
      config.supabase.url,
      config.supabase.serviceKey,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )
  }

  /**
   * Save crawled pages to Supabase
   */
  async savePages(pages: NotionPage[]): Promise<CrawlStats> {
    console.log(`💾 Saving ${pages.length} pages to Supabase...`)

    const stats: CrawlStats = {
      pagesProcessed: pages.length,
      pagesCreated: 0,
      pagesUpdated: 0,
    }

    for (const page of pages) {
      try {
        const exists = await this.pageExists(page.id)

        if (exists) {
          await this.updatePage(page)
          stats.pagesUpdated++
        } else {
          await this.insertPage(page)
          stats.pagesCreated++
        }

        // Create page version for change tracking
        await this.createPageVersion(page)

      } catch (error) {
        console.error(`❌ Failed to save page ${page.id}:`, error)
        // Continue with other pages even if one fails
      }
    }

    console.log(`✅ Pages saved: ${stats.pagesCreated} created, ${stats.pagesUpdated} updated`)
    return stats
  }

  /**
   * Check if a page already exists in database
   */
  private async pageExists(notionPageId: string): Promise<boolean> {
    const { data, error } = await this.client
      .from('notion_pages')
      .select('id')
      .eq('notion_page_id', notionPageId)
      .single()

    return !error && !!data
  }

  /**
   * Insert a new page
   */
  private async insertPage(page: NotionPage): Promise<void> {
    // Generate unique slug
    const slug = await this.generateUniqueSlug(page.title)

    const { error } = await this.client
      .from('notion_pages')
      .insert({
        notion_page_id: page.id,
        parent_page_id: page.parent_id,
        title: page.title,
        content: page.content,
        url: page.url,
        icon: page.icon,
        cover: page.cover,
        is_hidden: page.is_hidden,
        subscription_required: page.is_hidden ? 'premium' : null,  // Hidden pages require premium
        slug: slug,
        order_index: null,
      })

    if (error) {
      throw new Error(`Failed to insert page ${page.id}: ${error.message}`)
    }

    console.log(`✅ Created page: ${page.title} (${slug})`)
  }

  /**
   * Update an existing page
   */
  private async updatePage(page: NotionPage): Promise<void> {
    const { error } = await this.client
      .from('notion_pages')
      .update({
        title: page.title,
        content: page.content,
        url: page.url,
        icon: page.icon,
        cover: page.cover,
        is_hidden: page.is_hidden,
        subscription_required: page.is_hidden ? 'premium' : null,
        last_synced_at: new Date().toISOString(),
      })
      .eq('notion_page_id', page.id)

    if (error) {
      throw new Error(`Failed to update page ${page.id}: ${error.message}`)
    }

    console.log(`🔄 Updated page: ${page.title}`)
  }

  /**
   * Create a page version for change tracking
   */
  private async createPageVersion(page: NotionPage): Promise<void> {
    // Get current version number
    const { data: pageData } = await this.client
      .from('notion_pages')
      .select('id')
      .eq('notion_page_id', page.id)
      .single()

    if (!pageData) return

    // Get current max version number
    const { data: lastVersion } = await this.client
      .from('page_versions')
      .select('version_number')
      .eq('page_id', pageData.id)
      .order('version_number', { ascending: false })
      .limit(1)
      .single()

    const nextVersion = (lastVersion?.version_number || 0) + 1

    const { error } = await this.client
      .from('page_versions')
      .insert({
        page_id: pageData.id,
        content: page.content,
        version_number: nextVersion,
        change_summary: 'Sync from Notion',
      })

    if (error) {
      console.error(`⚠️  Failed to create version for page ${page.id}:`, error.message)
    }
  }

  /**
   * Generate a unique slug for a page
   */
  private async generateUniqueSlug(baseTitle: string): Promise<string> {
    // Convert title to URL-friendly slug
    let baseSlug = baseTitle
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')

    let slug = baseSlug
    let counter = 0

    // Check if slug exists and make unique if needed
    while (await this.slugExists(slug)) {
      counter++
      slug = `${baseSlug}-${counter}`
    }

    return slug
  }

  /**
   * Check if a slug already exists
   */
  private async slugExists(slug: string): Promise<boolean> {
    const { data, error } = await this.client
      .from('notion_pages')
      .select('id')
      .eq('slug', slug)
      .single()

    return !error && !!data
  }

  /**
   * Log crawl activity
   */
  async logCrawl(stats: CrawlStats, status: 'running' | 'completed' | 'failed', errorMessage?: string): Promise<string> {
    const logData = {
      status,
      pages_processed: stats.pagesProcessed,
      pages_created: stats.pagesCreated,
      pages_updated: stats.pagesUpdated,
      error_message: errorMessage || null,
      started_at: new Date().toISOString(),
      completed_at: status === 'completed' || status === 'failed' ? new Date().toISOString() : null,
    }

    const { data, error } = await this.client
      .from('crawl_logs')
      .insert(logData)
      .select('id')
      .single()

    if (error) {
      console.error('❌ Failed to create crawl log:', error)
      throw error
    }

    return data.id
  }

  /**
   * Update crawl log
   */
  async updateCrawlLog(logId: string, stats: CrawlStats, status: 'completed' | 'failed', errorMessage?: string): Promise<void> {
    const { error } = await this.client
      .from('crawl_logs')
      .update({
        status,
        pages_processed: stats.pagesProcessed,
        pages_created: stats.pagesCreated,
        pages_updated: stats.pagesUpdated,
        error_message: errorMessage || null,
        completed_at: new Date().toISOString(),
      })
      .eq('id', logId)

    if (error) {
      console.error('❌ Failed to update crawl log:', error)
    }
  }

  /**
   * Get last crawl timestamp
   */
  async getLastCrawlTime(): Promise<string | null> {
    const { data, error } = await this.client
      .from('crawl_logs')
      .select('started_at')
      .eq('status', 'completed')
      .order('started_at', { ascending: false })
      .limit(1)
      .single()

    return data?.started_at || null
  }

  /**
   * Test database connection
   */
  async testConnection(): Promise<boolean> {
    try {
      const { data, error } = await this.client
        .from('admin_settings')
        .select('key')
        .limit(1)

      if (error) throw error
      console.log('✅ Supabase connection successful')
      return true
    } catch (error) {
      console.error('❌ Supabase connection failed:', error)
      return false
    }
  }
}
