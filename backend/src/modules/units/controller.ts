import { Request, Response } from 'express';
import { unitsService } from './service.js';
import { apiResponse, apiError } from '../../utils/index.js';
import { z } from 'zod';

const createSchema = z.object({
  name: z.string().min(2).max(100),
  code: z.string().min(2).max(50),
  parent_id: z.number().int().positive().optional(),
});

const updateSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  code: z.string().min(2).max(50).optional(),
  parent_id: z.number().int().positive().nullable().optional(),
  is_active: z.boolean().optional(),
});

export class UnitsController {
  async findAll(req: Request, res: Response) {
    try {
      const { search, is_active, parent_id } = req.query;
      const units = await unitsService.findAll({
        search: search as string,
        is_active: is_active === 'true' ? true : is_active === 'false' ? false : undefined,
        parent_id: parent_id ? parseInt(parent_id as string) : undefined,
      });
      apiResponse(res, units);
    } catch (error: any) {
      apiError(res, error.message, 400);
    }
  }

  async findById(req: Request, res: Response) {
    try {
      const unit = await unitsService.findById(parseInt(req.params.id));
      apiResponse(res, unit);
    } catch (error: any) {
      apiError(res, error.message, 404);
    }
  }

  async create(req: Request, res: Response) {
    try {
      const data = createSchema.parse(req.body);
      const unit = await unitsService.create(data);
      apiResponse(res, unit, 'Unit created', 201);
    } catch (error: any) {
      if (error instanceof z.ZodError) apiError(res, 'Validation error', 400, error.errors);
      else apiError(res, error.message, 400);
    }
  }

  async update(req: Request, res: Response) {
    try {
      const data = updateSchema.parse(req.body);
      const unit = await unitsService.update(parseInt(req.params.id), data);
      apiResponse(res, unit, 'Unit updated');
    } catch (error: any) {
      if (error instanceof z.ZodError) apiError(res, 'Validation error', 400, error.errors);
      else apiError(res, error.message, 400);
    }
  }

  async delete(req: Request, res: Response) {
    try {
      const result = await unitsService.delete(parseInt(req.params.id));
      apiResponse(res, result);
    } catch (error: any) {
      apiError(res, error.message, 400);
    }
  }
}

export const unitsController = new UnitsController();