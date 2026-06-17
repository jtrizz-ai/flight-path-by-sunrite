import { Request, Response } from 'express';
import { notionPublicService } from '../services/notionPublic.service';

export class PublicController {
  /**
   * Fetch a published Notion page by URL
   * POST /api/public/fetch
   */
  async fetchPage(req: Request, res: Response): Promise<void> {
    try {
      const { url } = req.body;

      if (!url || typeof url !== 'string') {
        res.status(400).json({
          error: 'Invalid request',
          message: 'URL is required and must be a string',
        });
        return;
      }

      // Validate Notion URL
      if (!notionPublicService.isValidNotionUrl(url)) {
        res.status(400).json({
          error: 'Invalid Notion URL',
          message: 'URL must be a valid published Notion page URL',
        });
        return;
      }

      // Fetch the published page
      const page = await notionPublicService.fetchPublishedPage(url);

      // Convert to Module format for frontend compatibility
      const module = notionPublicService.publicPageToModule(page);

      // Return both the page structure and module content
      res.json({
        page: {
          id: page.id,
          title: page.title,
          url: page.url,
          childPages: page.childPages,
        },
        module,
      });
    } catch (error) {
      console.error('Error fetching published page:', error);
      res.status(500).json({
        error: 'Failed to fetch published page',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Health check endpoint
   * GET /api/health
   */
  async health(req: Request, res: Response): Promise<void> {
    try {
      res.json({
        ok: true,
        service: 'Flight Path Public API',
        version: '1.0.0',
      });
    } catch (error) {
      console.error('Health check error:', error);
      res.status(500).json({
        ok: false,
        error: 'Health check failed',
      });
    }
  }
}
