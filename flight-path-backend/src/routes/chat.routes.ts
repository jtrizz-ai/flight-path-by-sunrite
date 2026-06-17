import { Router } from 'express';
import { ChatController } from '../controllers/chat.controller';
import { validateAppToken } from '../middleware/auth';
import { validateAdminToken } from '../middleware/auth';

const router = Router();
const controller = new ChatController();

/**
 * @route   POST /api/chat
 * @desc    Send a message to the chat assistant
 * @access  Private (requires app token)
 */
router.post('/chat', validateAppToken, (req, res) => controller.chatHandler(req, res));

/**
 * @route   GET /api/chat/health
 * @desc    Check chat health and LLM status
 * @access  Public
 */
router.get('/chat/health', (req, res) => controller.healthHandler(req, res));

/**
 * @route   POST /api/chat/reindex
 * @desc    Rebuild retrieval index from cached modules
 * @access  Admin (requires both app and admin tokens)
 */
router.post('/chat/reindex', validateAdminToken, (req, res) => controller.reindexHandler(req, res));

export default router;
