import { Request, Response } from 'express';
import { positionsService } from './service.js';
import { apiResponse, apiError } from '../../utils/index.js';
import { z } from 'zod';

const createSchema = z.object({
  name: z.string().min(2).max(100),
  code: z.string().min(2).max(50),
});

const updateSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  code: z.string().min(2).max(50).optional(),
  is_active: z.boolean().optional(),
});

export class PositionsController {
  async findAll(req: Request, res: Response) {
    try {
      const { search, is_active } = req.query;
      const positions = await positionsService.findAll({
        search: search as string,
        is_active: is_active === 'true' ? true : is_active === 'false' ? false : undefined,
      });
      apiResponse(res, positions);
    } catch (error: any) {
      apiError(res, error.message, 400);
    }
  }

  async findById(req: Request, res: Response) {
    try {
      const position = await positionsService.findById(parseInt(req.params.id));
      apiResponse(res, position);
    } catch (error: any) {
      apiError(res, error.message, 404);
    }
  }

  async create(req: Request, res: Response) {
    try {
      const data = createSchema.parse(req.body);
      const position = await positionsService.create(data);
      apiResponse(res, position, 'Position created', 201);
    } catch (error: any) {
      if (error instanceof z.ZodError) apiError(res, 'Validation error', 400, error.errors);
      else apiError(res, error.message, 400);
    }
  }

  async update(req: Request, res: Response) {
    try {
      const data = updateSchema.parse(req.body);
      const position = await positionsService.update(parseInt(req.params.id), data);
      apiResponse(res, position, 'Position updated');
    } catch (error: any) {
      if (error instanceof z.ZodError) apiError(res, 'Validation error', 400, error.errors);
      else apiError(res, error.message, 400);
    }
  }

  async delete(req: Request, res: Response) {
    try {
      const result = await positionsService.delete(parseInt(req.params.id));
      apiResponse(res, result);
    } catch (error: any) {
      apiError(res, error.message, 400);
    }
  }
}

export const positionsController = new PositionsController();