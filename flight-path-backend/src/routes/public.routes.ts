import { Router } from 'express';
import { PublicController } from '../controllers/public.controller';

const router = Router();
const controller = new PublicController();

/**
 * @route   POST /api/public/fetch
 * @desc    Fetch a published Notion page by URL
 * @access  Public (no authentication required)
 */
router.post('/public/fetch', (req, res) => controller.fetchPage(req, res));

/**
 * @route   GET /api/health
 * @desc    Health check endpoint
 * @access  Public
 */
router.get('/health', (req, res) => controller.health(req, res));

export default router;
