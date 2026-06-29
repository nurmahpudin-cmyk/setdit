import { Request, Response } from 'express';
import { whatsappService } from './service.js';
import { apiResponse, apiError, paginatedResponse } from '../../utils/index.js';
import { z } from 'zod';
import type { AuthRequest } from '../../middleware/auth.js';

const createSessionSchema = z.object({
  name: z.string().min(1, 'Session name is required'),
});

const sendMessageSchema = z.object({
  phone: z.string().min(1, 'Phone number is required'),
  message: z.string().min(1, 'Message is required'),
});

export class WhatsAppController {
  async findAll(req: Request, res: Response) {
    try {
      const sessions = await whatsappService.getSessions();
      apiResponse(res, sessions);
    } catch (error: any) {
      apiError(res, error.message, 400);
    }
  }

  async findById(req: Request, res: Response) {
    try {
      const session = await whatsappService.getSession(parseInt(req.params.id));
      apiResponse(res, session);
    } catch (error: any) {
      apiError(res, error.message, error.message === 'Session not found' ? 404 : 400);
    }
  }

  async create(req: Request, res: Response) {
    try {
      const data = createSessionSchema.parse(req.body);
      const session = await whatsappService.createSession(data.name);
      apiResponse(res, session, 'Session created', 201);
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        apiError(res, 'Validation error', 400, error.errors);
      } else {
        apiError(res, error.message, 400);
      }
    }
  }

  async delete(req: Request, res: Response) {
    try {
      await whatsappService.deleteSession(parseInt(req.params.id));
      apiResponse(res, null, 'Session deleted');
    } catch (error: any) {
      apiError(res, error.message, 400);
    }
  }

  async getQRCode(req: Request, res: Response) {
    try {
      const qr = await whatsappService.getQRCode(parseInt(req.params.id));
      apiResponse(res, qr);
    } catch (error: any) {
      apiError(res, error.message, error.message === 'Session not found' ? 404 : 400);
    }
  }

  async sendMessage(req: Request, res: Response) {
    try {
      const data = sendMessageSchema.parse(req.body);
      const authReq = req as AuthRequest;
      const result = await whatsappService.sendMessage(
        parseInt(req.params.id),
        data.phone,
        data.message,
        authReq.user!.id
      );
      apiResponse(res, result, 'Message sent');
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        apiError(res, 'Validation error', 400, error.errors);
      } else {
        apiError(res, error.message, 400);
      }
    }
  }

  async getLogs(req: Request, res: Response) {
    try {
      const { session_id, phone, status, page, limit } = req.query;
      const result = await whatsappService.getLogs({
        session_id: session_id ? parseInt(session_id as string) : undefined,
        phone: phone as string,
        status: status as string,
        page: page ? parseInt(page as string) : 1,
        limit: limit ? parseInt(limit as string) : 20,
      });
      paginatedResponse(res, result.items, result.pagination);
    } catch (error: any) {
      apiError(res, error.message, 400);
    }
  }
}

export const whatsappController = new WhatsAppController();
