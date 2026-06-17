import { Router } from 'express';
import { ModuleController } from '../controllers/modules.controller';

const router = Router();
const controller = new ModuleController();

/**
 * @route   GET /api/health
 * @desc    Health check endpoint
 * @access  Public
 */
router.get('/health', (req, res) => controller.health(req, res));

/**
 * @route   GET /api/modules
 * @desc    Get all modules (without content blocks)
 * @access  Public
 */
router.get('/modules', (req, res) => controller.getAllModules(req, res));

/**
 * @route   GET /api/modules/:id
 * @desc    Get a single module with content blocks
 * @access  Public
 */
router.get('/modules/:id', (req, res) => controller.getModuleById(req, res));

export default router;
