import pg from 'pg'
import { config } from '../config'
import { NotionPage } from './notion.service'
import { blocksToSearchText } from './searchText'

const { Pool } = pg

// ─────────────────────────────────────────────────────────────────────────
// Database service (LOCAL Postgres). Replaces the old SupabaseService.
//
// Only the worker imports this. It writes crawled Notion pages into the same
// `notion_pages` table the web app reads from. Schema: db/init/01-schema.sql.
// ─────────────────────────────────────────────────────────────────────────

export interface CrawlStats {
  pagesProcessed: number
  pagesCreated: number
  pagesUpdated: number
}

export class DatabaseService {
  private pool: pg.Pool

  constructor() {
    this.pool = new Pool({ connectionString: config.database.url, max: 5 })
  }

  /**
   * Save crawled pages to Postgres (insert-or-update by notion_page_id).
   *
   * Slug is generated only on insert (kept stable on update so URLs don't move).
   */
  async savePages(pages: NotionPage[]): Promise<CrawlStats> {
    console.log(`💾 Saving ${pages.length} pages to Postgres...`)

    const stats: CrawlStats = {
      pagesProcessed: pages.length,
      pagesCreated: 0,
      pagesUpdated: 0,
    }

    for (const page of pages) {
      try {
        const existed = await this.pageExists(page.id)
        if (existed) {
          await this.updatePage(page)
          stats.pagesUpdated++
        } else {
          await this.insertPage(page)
          stats.pagesCreated++
        }
        // Snapshot for change tracking (best-effort, never fatal).
        await this.createPageVersion(page)
      } catch (error) {
        console.error(`❌ Failed to save page ${page.id}:`, error)
        // Continue with other pages even if one fails.
      }
    }

    // Refresh the "last sync" summary used by the admin portal.
    await this.updateSyncMeta(pages.length)

    // TODO (deletion handling): pages removed from Notion are currently left in
    // the database as stale rows (e.g. "Door Pitch" was de-listed from the
    // wiki). On the next pass, mark pages not seen in `pages` as deleted/
    // hidden, or remove them. Do NOT delete on a failed/partial crawl — only
    // after a fully successful one. Tracked separately from this method.

    console.log(`✅ Pages saved: ${stats.pagesCreated} created, ${stats.pagesUpdated} updated`)
    return stats
  }

  /** Does a row for this Notion page id already exist? */
  private async pageExists(notionPageId: string): Promise<boolean> {
    const { rows } = await this.pool.query(
      `SELECT 1 FROM notion_pages WHERE notion_page_id = $1 LIMIT 1`,
      [notionPageId]
    )
    return rows.length > 0
  }

  /** Insert a brand-new page (generates a unique slug). */
  private async insertPage(page: NotionPage): Promise<void> {
    const slug = await this.generateUniqueSlug(page.title)

    await this.pool.query(
      `INSERT INTO notion_pages
         (notion_page_id, parent_page_id, child_ids, title, slug,
          icon, cover, url, tags, is_hidden, content, search_text)
       VALUES ($1, $2, $3::text[], $4, $5, $6, $7, $8, $9::text[], $10, $11, $12)`,
      [
        page.id,
        page.parent_id,
        page.children ?? [],
        page.title,
        slug,
        page.icon,
        page.cover,
        page.url,
        [], // TODO: extract Tags multi-select in notion.service.ts (spec section 11)
        Boolean(page.is_hidden),
        page.content,
        blocksToSearchText(page.content.blocks),
      ]
    )
    console.log(`✅ Created page: ${page.title} (${slug})`)
  }

  /** Update an existing page (keeps its slug stable). */
  private async updatePage(page: NotionPage): Promise<void> {
    await this.pool.query(
      `UPDATE notion_pages SET
          parent_page_id = $2,
          child_ids      = $3::text[],
          title          = $4,
          icon           = $5,
          cover          = $6,
          url            = $7,
          is_hidden      = $8,
          content        = $9,
          search_text    = $10,
          last_synced_at = NOW()
        WHERE notion_page_id = $1`,
      [
        page.id,
        page.parent_id,
        page.children ?? [],
        page.title,
        page.icon,
        page.cover,
        page.url,
        Boolean(page.is_hidden),
        page.content,
        blocksToSearchText(page.content.blocks),
      ]
    )
    console.log(`🔄 Updated page: ${page.title}`)
  }

  /** Append a snapshot of the page body for change history. */
  private async createPageVersion(page: NotionPage): Promise<void> {
    try {
      const { rows } = await this.pool.query<{ id: string }>(
        `SELECT id FROM notion_pages WHERE notion_page_id = $1 LIMIT 1`,
        [page.id]
      )
      const dbId = rows[0]?.id
      if (!dbId) return

      const next = await this.nextVersionNumber(dbId)
      await this.pool.query(
        `INSERT INTO page_versions (page_id, content, version_number, change_summary)
         VALUES ($1, $2, $3, $4)`,
        [dbId, page.content, next, 'Sync from Notion']
      )
    } catch (error) {
      console.error(`⚠️  Failed to create version for page ${page.id}:`, error)
    }
  }

  private async nextVersionNumber(dbId: string): Promise<number> {
    const { rows } = await this.pool.query<{ max: string | null }>(
      `SELECT MAX(version_number)::text AS max FROM page_versions WHERE page_id = $1`,
      [dbId]
    )
    return Number(rows[0]?.max ?? 0) + 1
  }

  /** URL-friendly kebab slug, de-duplicated against existing rows. */
  private async generateUniqueSlug(baseTitle: string): Promise<string> {
    const base = baseTitle
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '') || 'untitled'

    let slug = base
    let counter = 0
    while (await this.slugExists(slug)) {
      counter++
      slug = `${base}-${counter}`
    }
    return slug
  }

  private async slugExists(slug: string): Promise<boolean> {
    const { rows } = await this.pool.query(
      `SELECT 1 FROM notion_pages WHERE slug = $1 LIMIT 1`,
      [slug]
    )
    return rows.length > 0
  }

  /** Update the single-row sync summary the admin portal displays. */
  private async updateSyncMeta(pageCount: number): Promise<void> {
    await this.pool.query(
      `UPDATE sync_meta SET last_sync = NOW(), page_count = $1 WHERE id = 1`,
      [pageCount]
    )
  }

  /** Create a crawl-log row, return its id. */
  async logCrawl(
    stats: CrawlStats,
    status: 'running' | 'completed' | 'failed',
    errorMessage?: string
  ): Promise<string> {
    const { rows } = await this.pool.query<{ id: string }>(
      `INSERT INTO crawl_logs
         (status, pages_processed, pages_created, pages_updated,
          error_message, started_at, completed_at)
       VALUES ($1, $2, $3, $4, $5::text, NOW(), $6)
       RETURNING id`,
      [
        status,
        stats.pagesProcessed,
        stats.pagesCreated,
        stats.pagesUpdated,
        errorMessage ?? null,
        status === 'completed' || status === 'failed' ? new Date().toISOString() : null,
      ]
    )
    return rows[0].id
  }

  /** Mark an existing crawl log as finished (with final stats). */
  async updateCrawlLog(
    logId: string,
    stats: CrawlStats,
    status: 'completed' | 'failed',
    errorMessage?: string
  ): Promise<void> {
    await this.pool.query(
      `UPDATE crawl_logs SET
          status           = $2,
          pages_processed  = $3,
          pages_created    = $4,
          pages_updated    = $5,
          error_message    = $6::text,
          completed_at     = NOW()
        WHERE id = $1`,
      [
        logId,
        status,
        stats.pagesProcessed,
        stats.pagesCreated,
        stats.pagesUpdated,
        errorMessage ?? null,
      ]
    )
  }

  /** When did the last successful crawl start? */
  async getLastCrawlTime(): Promise<string | null> {
    const { rows } = await this.pool.query<{ started_at: string | null }>(
      `SELECT started_at FROM crawl_logs
        WHERE status = 'completed'
        ORDER BY started_at DESC
        LIMIT 1`
    )
    return rows[0]?.started_at ?? null
  }

  /** Smoke-test the database connection at startup. */
  async testConnection(): Promise<boolean> {
    try {
      await this.pool.query(`SELECT 1`)
      console.log('✅ Postgres connection successful')
      return true
    } catch (error) {
      console.error('❌ Postgres connection failed:', error)
      return false
    }
  }

  /** Close the pool on shutdown. */
  async close(): Promise<void> {
    await this.pool.end()
  }
}
