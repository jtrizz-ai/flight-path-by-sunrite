import { Client } from '@notionhq/client'
import { config } from '../config'
import { normalizeBlocks, type Block } from './normalize'

export interface NotionPage {
  id: string
  parent_id: string | null
  title: string
  content: { blocks: Block[] }   // normalized, canonical Block[] (CLAUDE.md section 10)
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
  children?: NotionBlock[]   // nested blocks (toggles/columns/tables), fetched recursively
}

export class NotionService {
  private client: Client

  constructor() {
    this.client = new Client({
      auth: config.notion.apiKey,
    })
  }

  /**
   * Recursively crawl Notion pages starting from root.
   *
   * The root may be either a PAGE or a DATABASE (CLAUDE.md: the root is the
   * "Flight Path Program" *wiki database*). If it's a database we do TWO
   * things: (a) crawl the database's OWN page (the wiki homepage — the
   * callouts/headings/images/links the author placed above the table), and
   * (b) crawl each database row as a page. Without (a) the homepage content
   * (including its images) is silently lost.
   */
  async crawlPages(maxDepth: number = config.worker.maxDepth): Promise<NotionPage[]> {
    console.log(`🔍 Starting recursive crawl from root: ${config.notion.rootPageId}`)
    console.log(`📏 Max depth: ${maxDepth}`)

    const pages: Map<string, NotionPage> = new Map()
    const queue: Array<{ pageId: string; depth: number }> = []
    const processed = new Set<string>()

    // Detect whether the root is a database. If so, crawl the database's own
    // page first (the homepage), then queue its rows. Otherwise queue the
    // root page directly.
    const rootIsDb = await this.isDatabase(config.notion.rootPageId)
    if (rootIsDb) {
      console.log(`🗂️  Root is a database; crawling its homepage + rows...`)
      // (a) the database's own page (homepage): callouts, images, links, etc.
      try {
        const home = await this.fetchDatabasePage(config.notion.rootPageId)
        pages.set(home.id, home)
        processed.add(home.id)
        // Any child_page references found on the homepage get queued too
        // (they're often the same ids as the rows; the processed set dedupes).
        for (const childId of home.children) {
          queue.push({ pageId: childId, depth: 0 })
        }
      } catch (error) {
        console.error(`❌ Failed to crawl database homepage ${config.notion.rootPageId}:`, error)
      }
      // (b) the database rows
      const rowIds = await this.queryDatabasePageIds(config.notion.rootPageId)
      for (const id of rowIds) queue.push({ pageId: id, depth: 0 })
    } else {
      queue.push({ pageId: config.notion.rootPageId, depth: 0 })
    }

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

  /** True if the given Notion id points to a database (vs a page). */
  private async isDatabase(id: string): Promise<boolean> {
    try {
      await this.client.pages.retrieve({ page_id: id })
      return false
    } catch (err: any) {
      return err?.code === 'validation_error' && /database/i.test(String(err?.message || ''))
    }
  }

  /**
   * Crawl the database's OWN page (the wiki homepage). Databases in Notion are
   * also pages: the author can place callouts/headings/images/links above the
   * table view. This reads those blocks (recursively, so toggles/columns fill
   * in) and returns a NotionPage for the homepage.
   */
  private async fetchDatabasePage(databaseId: string): Promise<NotionPage> {
    const db = (await this.client.databases.retrieve({ database_id: databaseId })) as any
    const blocks = await this.fetchAllBlocks(databaseId)
    const children = this.extractChildPages(blocks)
    const title = this.extractDatabaseTitle(db)

    console.log(`🏠 Crawled database homepage: "${title}" (${blocks.length} top-level blocks)`)

    return {
      id: databaseId,
      parent_id: this.extractParentId(db) ?? null,
      title,
      content: { blocks: normalizeBlocks(blocks) },
      url: db.url ?? '',
      icon: db.icon?.emoji || db.icon?.external?.url || null,
      cover: db.cover?.external?.url || null,
      is_hidden: false,
      children,
    }
  }

  /** Title of a database (it's an array of rich text, unlike a page title). */
  private extractDatabaseTitle(db: any): string {
    const arr = db?.title
    if (Array.isArray(arr) && arr.length > 0) {
      const t = arr.map((x: any) => x?.plain_text ?? '').join('').trim()
      if (t) return t
    }
    return 'Flight Path Program'
  }

  /**
   * Turn the configured root into a list of PAGE ids to crawl.
   * - If root is a PAGE -> [rootId]
   * - If root is a DATABASE -> the page id of every row (handles pagination)
   *
   * NOTE: crawlPages() now uses isDatabase() + queryDatabasePageIds() so the
   * database's own homepage can be crawled separately. This wrapper is kept
   * for any future caller that wants the old behavior.
   */
  private async resolveRootToPageIds(rootId: string): Promise<string[]> {
    // Try as a page first (most common, and a database id will error here).
    const isDb = await this.isDatabase(rootId)
    return isDb ? this.queryDatabasePageIds(rootId) : [rootId]
  }

  /**
   * Return the page id of every row in a database (handles pagination) via
   * the stable REST endpoint. (SDK v5 removed databases.query; calling REST
   * directly is version-stable and is exactly what the old method did.)
   */
  private async queryDatabasePageIds(databaseId: string): Promise<string[]> {
    const pageIds: string[] = []
    let startCursor: string | undefined = undefined
    let hasMore = true

    while (hasMore) {
      const response = await this.queryDatabaseRest(databaseId, startCursor)
      for (const row of response.results || []) {
        // Each database row IS a page.
        if (row?.id) pageIds.push(row.id as string)
      }
      hasMore = Boolean(response.has_more)
      startCursor = response.next_cursor || undefined
    }

    console.log(`🗂️  Database has ${pageIds.length} row page(s).`)
    return pageIds
  }

  /**
   * Query a Notion database's rows directly via the REST API.
   * POST https://api.notion.com/v1/databases/{id}/query
   * Handles pagination via start_cursor / has_more.
   */
  private async queryDatabaseRest(
    databaseId: string,
    startCursor?: string
  ): Promise<{ results: Array<{ id: string }>; has_more: boolean; next_cursor?: string }> {
    const url = `https://api.notion.com/v1/databases/${databaseId}/query`
    const body: Record<string, unknown> = { page_size: 100 }
    if (startCursor) body.start_cursor = startCursor

    const res = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${config.notion.apiKey}`,
        'Notion-Version': '2022-06-28',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    })

    if (!res.ok) {
      const detail = await res.text()
      throw new Error(`Notion database query failed (${res.status}): ${detail}`)
    }
    return res.json()
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

    // Normalize raw Notion blocks into the canonical Block[] shape the front
    // end renders. Raw Notion text lives inside rich_text arrays; without this
    // step, paragraphs/headings render blank.
    const content = {
      blocks: normalizeBlocks(blocks),
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
   * Fetch all blocks from a page/database (handles pagination), recursing into
   * any block that has children so nested content is captured. Nested children
   * are attached as `children` on the raw block. This is what lets toggles,
   * columns, column_lists, and tables expose their inner content — and is a
   * prerequisite for the "Hidden Pages" toggle rule (spec section 4).
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
          const nb: NotionBlock = {
            id: blockData.id,
            type: blockData.type,
            content: blockData[blockData.type] || {},
            has_children: blockData.has_children || false,
            children: [],
          }
          // Recurse into blocks that have children (toggles, columns, tables…).
          if (nb.has_children) {
            try {
              nb.children = await this.fetchAllBlocks(blockData.id)
            } catch (error) {
              console.error(`⚠️  Failed to fetch children of ${blockData.id}:`, error)
            }
          }
          blocks.push(nb)
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
   * Check if page should be hidden.
   *
   * TODO (spec section 4 — NON-NEGOTIABLE): the rule is NOT title/tag based.
   * It is: if a page contains a TOGGLE whose label is exactly "Hidden Pages",
   * every page nested inside that toggle AND all their descendants are hidden.
   * The current implementation is a temporary heuristic (title/tag keyword
   * match) that does NOT satisfy the spec. Implement the toggle walk during
   * the normalize/hidden-pages phase.
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
