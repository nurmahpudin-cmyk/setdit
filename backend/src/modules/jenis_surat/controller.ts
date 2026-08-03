import { Request, Response } from 'express';
import { jenisSuratService } from './service.js';
import { apiResponse, apiError } from '../../utils/index.js';
import { z } from 'zod';

const createSchema = z.object({
  nama_jenis_surat: z.string().min(2).max(255),
  status: z.boolean().optional(),
});

const updateSchema = z.object({
  nama_jenis_surat: z.string().min(2).max(255).optional(),
  status: z.boolean().optional(),
});

export class JenisSuratController {
  async findAll(req: Request, res: Response) {
    try {
      const { search } = req.query;
      const jenisSurat = await jenisSuratService.findAll(search as string | undefined);
      apiResponse(res, jenisSurat);
    } catch (error: any) {
      apiError(res, error.message, 400);
    }
  }

  async findById(req: Request, res: Response) {
    try {
      const jenisSurat = await jenisSuratService.findById(String(req.params.id));
      apiResponse(res, jenisSurat);
    } catch (error: any) {
      apiError(res, error.message, 404);
    }
  }

  async create(req: Request, res: Response) {
    try {
      const data = createSchema.parse(req.body);
      const jenisSurat = await jenisSuratService.create(data);
      apiResponse(res, jenisSurat, 'Jenis surat created', 201);
    } catch (error: any) {
      if (error instanceof z.ZodError) apiError(res, 'Validation error', 400, error.errors);
      else apiError(res, error.message, 400);
    }
  }

  async update(req: Request, res: Response) {
    try {
      const data = updateSchema.parse(req.body);
      const jenisSurat = await jenisSuratService.update(String(req.params.id), data);
      apiResponse(res, jenisSurat, 'Jenis surat updated');
    } catch (error: any) {
      if (error instanceof z.ZodError) apiError(res, 'Validation error', 400, error.errors);
      else apiError(res, error.message, 400);
    }
  }

  async delete(req: Request, res: Response) {
    try {
      const result = await jenisSuratService.delete(String(req.params.id));
      apiResponse(res, result);
    } catch (error: any) {
      apiError(res, error.message, 400);
    }
  }
}

export const jenisSuratController = new JenisSuratController();
