import { Request, Response } from 'express';
import { cacheService } from '../services/cache.service';

export class ModuleController {
  /**
   * Health check endpoint
   * GET /api/health
   */
  async health(req: Request, res: Response): Promise<void> {
    try {
      const lastSync = cacheService.getLastSyncTimestamp();
      const hasCache = cacheService.hasValidCache();

      res.json({
        ok: true,
        lastSync,
        hasCache,
        moduleCount: cacheService.getModulesFromMemory().length,
      });
    } catch (error) {
      console.error('Health check error:', error);
      res.status(500).json({
        ok: false,
        error: 'Internal server error',
      });
    }
  }

  /**
   * Get all modules
   * GET /api/modules
   */
  async getAllModules(req: Request, res: Response): Promise<void> {
    try {
      const modules = cacheService.getModulesFromMemory();

      if (!modules || modules.length === 0) {
        res.status(503).json({
          error: 'No cached data available',
          message: 'Please sync with Notion first using POST /api/sync',
        });
        return;
      }

      // Return modules without content blocks (lighter response)
      const modulesWithoutContent = modules.map(({ contentBlocks, ...rest }) => rest);

      res.json(modulesWithoutContent);
    } catch (error) {
      console.error('Error getting all modules:', error);
      res.status(500).json({
        error: 'Failed to fetch modules',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Get a single module by ID
   * GET /api/modules/:id
   */
  async getModuleById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      if (!id) {
        res.status(400).json({
          error: 'Module ID is required',
        });
        return;
      }

      const module = cacheService.getModuleByIdFromMemory(id);

      if (!module) {
        res.status(404).json({
          error: 'Module not found',
          message: `Module with ID ${id} not found in cache`,
        });
        return;
      }

      res.json(module);
    } catch (error) {
      console.error(`Error getting module ${req.params.id}:`, error);
      res.status(500).json({
        error: 'Failed to fetch module',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
}
