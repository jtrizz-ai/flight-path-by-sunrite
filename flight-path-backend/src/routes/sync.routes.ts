import { Router } from 'express';
import { SyncController } from '../controllers/sync.controller';
import { validateAdminToken } from '../middleware/auth';

const router = Router();
const controller = new SyncController();

/**
 * @route   POST /api/sync
 * @desc    Sync all modules from Notion to cache
 * @access  Admin (requires both app and admin tokens)
 */
router.post('/sync', validateAdminToken, (req, res) => controller.syncFromNotion(req, res));

/**
 * @route   GET /api/sync/status
 * @desc    Get sync status and cache info
 * @access  Admin (requires both app and admin tokens)
 */
router.get('/sync/status', validateAdminToken, (req, res) => controller.getSyncStatus(req, res));

export default router;
