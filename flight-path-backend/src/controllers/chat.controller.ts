import { Request, Response } from 'express';
import { chatService } from '../services/chat.service';
import { chunkService } from '../services/chunk.service';
import { cacheService } from '../services/cache.service';

export class ChatController {
  /**
   * Handle chat requests
   * POST /api/chat
   */
  async chatHandler(req: Request, res: Response): Promise<void> {
    try {
      const { message, moduleScope } = req.body;

      if (!message || typeof message !== 'string') {
        res.status(400).json({
          error: 'Invalid request',
          message: 'Message is required and must be a string',
        });
        return;
      }

      const response = await chatService.chat(message, moduleScope);

      res.json(response);
    } catch (error) {
      console.error('Chat error:', error);
      res.status(500).json({
        error: 'Chat failed',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Check chat health and LLM status
   * GET /api/chat/health
   */
  async healthHandler(req: Request, res: Response): Promise<void> {
    try {
      const llmAvailable = chatService.isLLMAvailable();
      const hasChunks = chunkService.getChunkCount() > 0;

      res.json({
        ok: true,
        llm: llmAvailable ? 'reachable' : 'unreachable',
        hasChunks,
        chunkCount: chunkService.getChunkCount(),
      });
    } catch (error) {
      console.error('Chat health check error:', error);
      res.status(500).json({
        ok: false,
        error: 'Health check failed',
      });
    }
  }

  /**
   * Rebuild the retrieval index from cached modules
   * POST /api/chat/reindex
   */
  async reindexHandler(req: Request, res: Response): Promise<void> {
    try {
      console.log('🔄 Rebuilding retrieval index...');

      // Get modules from cache
      const cachedModules = cacheService.getModulesFromMemory();

      if (cachedModules.length === 0) {
        res.status(503).json({
          error: 'No cached modules available',
          message: 'Please run /api/sync first to populate the cache',
        });
        return;
      }

      // Rebuild chunks
      const chunks = chunkService.chunkModules(cachedModules);

      // Refresh LLM status
      await chatService.refreshLLMStatus();

      res.json({
        ok: true,
        chunks: chunks.length,
        message: 'Retrieval index rebuilt successfully',
      });
    } catch (error) {
      console.error('Reindex error:', error);
      res.status(500).json({
        error: 'Reindex failed',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
}
