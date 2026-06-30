import { Request, Response } from 'express';
import { provinsiService } from './service.js';
import { apiResponse, apiError } from '../../utils/index.js';
import { z } from 'zod';

const createSchema = z.object({
  proid: z.string().min(1),
  provinsi: z.string().min(1),
  nama_gubern: z.string().optional(),
  email: z.string().email().optional().or(z.string().optional()),
  wilayah: z.string().optional(),
  nama_dinas: z.string().optional(),
});

const updateSchema = z.object({
  provinsi: z.string().optional(),
  nama_gubern: z.string().optional(),
  email: z.string().email().optional().or(z.string().optional()),
  wilayah: z.string().optional(),
  nama_dinas: z.string().optional(),
});

export class ProvinsiController {
  async findAll(req: Request, res: Response) {
    try {
      const { search } = req.query;
      const provinsi = await provinsiService.findAll({ search: search as string });
      apiResponse(res, provinsi);
    } catch (error: any) {
      apiError(res, error.message, 400);
    }
  }

  async findById(req: Request, res: Response) {
    try {
      const provinsi = await provinsiService.findById(req.params.id);
      apiResponse(res, provinsi);
    } catch (error: any) {
      apiError(res, error.message, 404);
    }
  }

  async create(req: Request, res: Response) {
    try {
      const data = createSchema.parse(req.body);
      const provinsi = await provinsiService.create(data);
      apiResponse(res, provinsi, 'Provinsi berhasil dibuat', 201);
    } catch (error: any) {
      if (error instanceof z.ZodError) apiError(res, 'Validation error', 400, error.errors);
      else apiError(res, error.message, 400);
    }
  }

  async update(req: Request, res: Response) {
    try {
      const data = updateSchema.parse(req.body);
      const provinsi = await provinsiService.update(req.params.id, data);
      apiResponse(res, provinsi, 'Provinsi berhasil diupdate');
    } catch (error: any) {
      if (error instanceof z.ZodError) apiError(res, 'Validation error', 400, error.errors);
      else apiError(res, error.message, 400);
    }
  }

  async delete(req: Request, res: Response) {
    try {
      await provinsiService.delete(req.params.id);
      apiResponse(res, null, 'Provinsi berhasil dihapus');
    } catch (error: any) {
      apiError(res, error.message, 400);
    }
  }
}

export const provinsiController = new ProvinsiController();
