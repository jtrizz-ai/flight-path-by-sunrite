import { Client } from '@notionhq/client'
import { config } from '../config'

export interface NotionPage {
  id: string
  parent_id: string | null
  title: string
  content: any
  url: string
  icon: string | null
  cover: string | null
  is_hidden: boolean
  children: string[]  // Array of child page IDs
}

export interface NotionBlock {
  id: string
  type: string
  content: any
  has_children: boolean
}

export class NotionService {
  private client: Client

  constructor() {
    this.client = new Client({
      auth: config.notion.apiKey,
    })
  }

  /**
   * Recursively crawl Notion pages starting from root
   */
  async crawlPages(maxDepth: number = config.worker.maxDepth): Promise<NotionPage[]> {
    console.log(`🔍 Starting recursive crawl from root page: ${config.notion.rootPageId}`)
    console.log(`📏 Max depth: ${maxDepth}`)

    const pages: Map<string, NotionPage> = new Map()
    const queue: Array<{ pageId: string; depth: number }> = [
      { pageId: config.notion.rootPageId, depth: 0 }
    ]
    const processed = new Set<string>()

    while (queue.length > 0) {
      const { pageId, depth } = queue.shift()!

      if (processed.has(pageId)) {
        console.log(`⏭️  Skipping already processed page: ${pageId}`)
        continue
      }

      if (depth > maxDepth) {
        console.log(`⏭️  Max depth reached for page: ${pageId}`)
        continue
      }

      try {
        console.log(`📄 Crawling page (depth ${depth}): ${pageId}`)
        const page = await this.fetchPage(pageId, depth)
        pages.set(pageId, page)
        processed.add(pageId)

        // Add child pages to queue
        for (const childId of page.children) {
          if (!processed.has(childId)) {
            queue.push({ pageId: childId, depth: depth + 1 })
          }
        }

        // Rate limiting
        await this.delay(config.worker.delayBetweenRequests)

      } catch (error) {
        console.error(`❌ Failed to crawl page ${pageId}:`, error)
        // Continue with other pages even if one fails
      }
    }

    console.log(`✅ Crawling complete. Found ${pages.size} pages.`)
    return Array.from(pages.values())
  }

  /**
   * Fetch a single page with its content and child pages
   */
  private async fetchPage(pageId: string, depth: number): Promise<NotionPage> {
    // Fetch page properties
    const pageData = await this.client.pages.retrieve({ page_id: pageId })

    // Fetch page blocks (content)
    const blocks = await this.fetchAllBlocks(pageId)

    // Extract page metadata
    const page = pageData as any
    const title = this.extractTitle(page)
    const parent_id = this.extractParentId(page)
    const url = page.url
    const icon = page.icon?.emoji || page.icon?.external?.url || null
    const cover = page.cover?.external?.url || null

    // Implement "Hidden Pages" toggle rule
    const is_hidden = this.isPageHidden(page)

    // Find child page IDs
    const children = this.extractChildPages(blocks)

    // Build content object
    const content = {
      blocks: blocks,
      properties: page.properties || {},
    }

    return {
      id: pageId,
      parent_id,
      title,
      content,
      url,
      icon,
      cover,
      is_hidden,
      children,
    }
  }

  /**
   * Fetch all blocks from a page (handles pagination)
   */
  private async fetchAllBlocks(pageId: string): Promise<NotionBlock[]> {
    const blocks: NotionBlock[] = []
    let startCursor: string | undefined = undefined
    let hasMore = true

    while (hasMore) {
      try {
        const response = await this.client.blocks.children.list({
          block_id: pageId,
          start_cursor: startCursor,
        })

        for (const block of response.results) {
          const blockData = block as any
          blocks.push({
            id: blockData.id,
            type: blockData.type,
            content: blockData[blockData.type] || {},
            has_children: blockData.has_children || false,
          })
        }

        hasMore = response.has_more
        startCursor = response.next_cursor || undefined

      } catch (error) {
        console.error(`❌ Failed to fetch blocks for page ${pageId}:`, error)
        break
      }
    }

    return blocks
  }

  /**
   * Extract title from Notion page
   */
  private extractTitle(page: any): string {
    const titleProp = Object.values(page.properties || {}).find(
      (prop: any) => prop.type === 'title'
    ) as any

    if (titleProp?.title?.length > 0) {
      return titleProp.title[0].plain_text
    }

    return 'Untitled'
  }

  /**
   * Extract parent page ID
   */
  private extractParentId(page: any): string | null {
    if (page.parent?.type === 'page_id') {
      return page.parent.page_id
    }
    return null
  }

  /**
   * Check if page should be hidden based on "Hidden Pages" toggle rule
   * Rule: If page has "🔒 Hidden" or "🔒 Premium" in title, mark as hidden
   * You can customize this logic based on your specific requirements
   */
  private isPageHidden(page: any): boolean {
    const title = this.extractTitle(page).toLowerCase()

    // Check for hidden indicators in title
    const hiddenIndicators = ['🔒', 'hidden', 'premium', 'exclusive', 'members only']
    const hasHiddenIndicator = hiddenIndicators.some(indicator =>
      title.includes(indicator)
    )

    // Check for hidden tags/properties
    const tagsProp = Object.values(page.properties || {}).find(
      (prop: any) => prop.type === 'multi_select' || prop.type === 'select'
    ) as any

    const hasHiddenTag = tagsProp?.multi_select?.some((tag: any) =>
      tag.name.toLowerCase().includes('hidden') ||
      tag.name.toLowerCase().includes('premium') ||
      tag.name.toLowerCase().includes('exclusive')
    ) || tagsProp?.select?.name.toLowerCase().includes('hidden')

    return hasHiddenIndicator || hasHiddenTag
  }

  /**
   * Extract child page IDs from blocks
   */
  private extractChildPages(blocks: NotionBlock[]): string[] {
    const childPages: string[] = []

    for (const block of blocks) {
      if (block.type === 'child_page') {
        childPages.push(block.id)
      }
    }

    return childPages
  }

  /**
   * Delay helper for rate limiting
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  /**
   * Test connection to Notion API
   */
  async testConnection(): Promise<boolean> {
    try {
      await this.client.users.me({})
      console.log('✅ Notion API connection successful')
      return true
    } catch (error) {
      console.error('❌ Notion API connection failed:', error)
      return false
    }
  }
}
