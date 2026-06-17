import { Request, Response, NextFunction } from 'express';
import { config } from '../config';

/**
 * Middleware to validate app token (x-app-token header)
 * Used for all app-facing routes
 */
export function validateAppToken(req: Request, res: Response, next: NextFunction) {
  const appToken = req.headers['x-app-token'];

  if (!appToken) {
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Missing x-app-token header',
    });
  }

  if (appToken !== config.auth.appToken) {
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Invalid app token',
    });
  }

  next();
}

/**
 * Middleware to validate admin token (x-admin-token header)
 * Also validates app token first
 * Used for sensitive operations like sync and reindex
 */
export function validateAdminToken(req: Request, res: Response, next: NextFunction) {
  // First validate app token
  const appToken = req.headers['x-app-token'];
  if (!appToken || appToken !== config.auth.appToken) {
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Missing or invalid x-app-token header',
    });
  }

  // Then validate admin token
  const adminToken = req.headers['x-admin-token'];
  if (!adminToken) {
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Missing x-admin-token header',
    });
  }

  if (adminToken !== config.auth.adminToken) {
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Invalid admin token',
    });
  }

  next();
}
