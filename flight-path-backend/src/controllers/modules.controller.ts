import { Request, Response } from 'express';
import { NotionService } from '../services/notion.service';

export class ModuleController {
  private notionService: NotionService;

  constructor() {
    try {
      this.notionService = new NotionService();
    } catch (error) {
      console.error('Failed to initialize NotionService:', error);
      // Will throw error when first request is made
    }
  }

  /**
   * Health check endpoint
   * GET /api/health
   */
  async health(req: Request, res: Response): Promise<void> {
    try {
      res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Health check error:', error);
      res.status(500).json({
        status: 'error',
        message: 'Internal server error',
      });
    }
  }

  /**
   * Get all modules
   * GET /api/modules
   */
  async getAllModules(req: Request, res: Response): Promise<void> {
    try {
      if (!this.notionService) {
        throw new Error('Notion service not initialized');
      }

      const modules = await this.notionService.getAllModules();
      res.json(modules);
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
      if (!this.notionService) {
        throw new Error('Notion service not initialized');
      }

      const { id } = req.params;

      if (!id) {
        res.status(400).json({
          error: 'Module ID is required',
        });
        return;
      }

      const module = await this.notionService.getModuleById(id);
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
