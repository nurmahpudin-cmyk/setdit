import { Request, Response } from 'express';
import { skemaService } from './service.js';
import { apiResponse, apiError } from '../../utils/index.js';
import { z } from 'zod';

const createSchema = z.object({
  nama_skema: z.string().min(1),
});

const updateSchema = z.object({
  nama_skema: z.string().min(1),
});

export class SkemaController {
  async findAll(req: Request, res: Response) {
    try {
      const { search } = req.query;
      const skema = await skemaService.findAll({ search: search as string });
      apiResponse(res, skema);
    } catch (error: any) {
      apiError(res, error.message, 400);
    }
  }

  async findById(req: Request, res: Response) {
    try {
      const skema = await skemaService.findById(parseInt(req.params.id));
      apiResponse(res, skema);
    } catch (error: any) {
      apiError(res, error.message, 404);
    }
  }

  async create(req: Request, res: Response) {
    try {
      const data = createSchema.parse(req.body);
      const skema = await skemaService.create(data);
      apiResponse(res, skema, 'Skema berhasil dibuat', 201);
    } catch (error: any) {
      if (error instanceof z.ZodError) apiError(res, 'Validation error', 400, error.errors);
      else apiError(res, error.message, 400);
    }
  }

  async update(req: Request, res: Response) {
    try {
      const data = updateSchema.parse(req.body);
      const skema = await skemaService.update(parseInt(req.params.id), data);
      apiResponse(res, skema, 'Skema berhasil diupdate');
    } catch (error: any) {
      if (error instanceof z.ZodError) apiError(res, 'Validation error', 400, error.errors);
      else apiError(res, error.message, 400);
    }
  }

  async delete(req: Request, res: Response) {
    try {
      await skemaService.delete(parseInt(req.params.id));
      apiResponse(res, null, 'Skema berhasil dihapus');
    } catch (error: any) {
      apiError(res, error.message, 400);
    }
  }
}

export const skemaController = new SkemaController();
