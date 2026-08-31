import { Request, Response } from 'express';
import { notificationsService } from './service.js';
import { apiResponse, apiError, paginatedResponse } from '../../utils/index.js';
import type { AuthRequest } from '../../middleware/auth.js';

export class NotificationsController {
  async findAll(req: Request, res: Response) {
    try {
      const authReq = req as AuthRequest;
      if (!authReq.user?.id) {
        apiError(res, 'Unauthorized', 401);
        return;
      }
      const { page, limit, unread_only } = req.query;
      const result = await notificationsService.findByUser(authReq.user.id, {
        page: page ? parseInt(page as string) : undefined,
        limit: limit ? parseInt(limit as string) : undefined,
        unread_only: unread_only === 'true',
      });
      apiResponse(res, result);
    } catch (error: any) {
      apiError(res, error.message, 400);
    }
  }

  async unreadCount(req: Request, res: Response) {
    try {
      const authReq = req as AuthRequest;
      if (!authReq.user?.id) {
        apiError(res, 'Unauthorized', 401);
        return;
      }
      const result = await notificationsService.unreadCount(authReq.user.id);
      apiResponse(res, result);
    } catch (error: any) {
      apiError(res, error.message, 400);
    }
  }

  async markRead(req: Request, res: Response) {
    try {
      const authReq = req as AuthRequest;
      if (!authReq.user?.id) {
        apiError(res, 'Unauthorized', 401);
        return;
      }
      const result = await notificationsService.markRead(authReq.user.id, parseInt(String(req.params.id)));
      apiResponse(res, result);
    } catch (error: any) {
      apiError(res, error.message, 400);
    }
  }

  async markAllRead(req: Request, res: Response) {
    try {
      const authReq = req as AuthRequest;
      if (!authReq.user?.id) {
        apiError(res, 'Unauthorized', 401);
        return;
      }
      const result = await notificationsService.markAllRead(authReq.user.id);
      apiResponse(res, result);
    } catch (error: any) {
      apiError(res, error.message, 400);
    }
  }
}

export const notificationsController = new NotificationsController();
