import { Request, Response } from 'express';
import { NotionService } from '../services/notion.service';
import { cacheService } from '../services/cache.service';

export class SyncController {
  private notionService: NotionService;

  constructor() {
    this.notionService = new NotionService();
  }

  /**
   * Sync all modules from Notion to cache
   * Fetches all modules with their full content blocks
   */
  async syncFromNotion(req: Request, res: Response): Promise<void> {
    try {
      console.log('🔄 Starting sync from Notion...');

      // First, get all modules (basic info)
      const basicModules = await this.notionService.getAllModules();

      // Then, fetch full content for each module
      const modulesWithContent = await Promise.all(
        basicModules.map(async (module) => {
          try {
            const fullModule = await this.notionService.getModuleById(module.id);
            return fullModule;
          } catch (error) {
            console.error(`Error fetching module ${module.id}:`, error);
            // Return basic module if full content fails
            return module;
          }
        })
      );

      // Save to cache
      await cacheService.saveToCache(modulesWithContent);

      // Return success response
      const lastSync = cacheService.getLastSyncTimestamp();
      res.json({
        ok: true,
        count: modulesWithContent.length,
        lastSync,
      });
    } catch (error) {
      console.error('Error syncing from Notion:', error);
      res.status(500).json({
        error: 'Sync failed',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Get sync status (health check for sync)
   */
  async getSyncStatus(req: Request, res: Response): Promise<void> {
    const lastSync = cacheService.getLastSyncTimestamp();
    const hasCache = cacheService.hasValidCache();

    res.json({
      ok: true,
      hasCache,
      lastSync,
      moduleCount: cacheService.getModulesFromMemory().length,
    });
  }
}
