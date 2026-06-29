import { Request, Response } from 'express';
import { logsService } from './service.js';
import { apiResponse, apiError, paginatedResponse } from '../../utils/index.js';

export class LogsController {
  async activityLogs(req: Request, res: Response) {
    try {
      const { page, limit, user_id, module, action, date_from, date_to } = req.query;
      const result = await logsService.activityLogs({
        page: page ? parseInt(page as string) : undefined,
        limit: limit ? parseInt(limit as string) : undefined,
        user_id: user_id ? parseInt(user_id as string) : undefined,
        module: module as string,
        action: action as string,
        date_from: date_from as string,
        date_to: date_to as string,
      });
      paginatedResponse(res, result.logs, result.pagination);
    } catch (error: any) {
      apiError(res, error.message, 400);
    }
  }

  async waLogs(req: Request, res: Response) {
    try {
      const { page, limit, phone, status } = req.query;
      const result = await logsService.waLogs({
        page: page ? parseInt(page as string) : undefined,
        limit: limit ? parseInt(limit as string) : undefined,
        phone: phone as string,
        status: status as string,
      });
      paginatedResponse(res, result.logs, result.pagination);
    } catch (error: any) {
      apiError(res, error.message, 400);
    }
  }
}

export const logsController = new LogsController();