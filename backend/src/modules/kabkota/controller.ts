import { Request, Response } from 'express';
import { kabkotaService } from './service.js';
import { apiResponse, apiError } from '../../utils/index.js';
import { z } from 'zod';

const createSchema = z.object({
  kabid: z.string().min(1),
  kabkota: z.string().min(1),
  proid: z.string().optional(),
  nama_walikota: z.string().optional(),
  email: z.string().email().optional().or(z.string().optional()),
});

const updateSchema = z.object({
  kabkota: z.string().optional(),
  proid: z.string().optional(),
  nama_walikota: z.string().optional(),
  email: z.string().email().optional().or(z.string().optional()),
});

export class KabkotaController {
  async findAll(req: Request, res: Response) {
    try {
      const { search, proid } = req.query;
      const kabkota = await kabkotaService.findAll({
        search: search as string,
        proid: proid as string,
      });
      apiResponse(res, kabkota);
    } catch (error: any) {
      apiError(res, error.message, 400);
    }
  }

  async findById(req: Request, res: Response) {
    try {
      const kabkota = await kabkotaService.findById(req.params.id);
      apiResponse(res, kabkota);
    } catch (error: any) {
      apiError(res, error.message, 404);
    }
  }

  async create(req: Request, res: Response) {
    try {
      const data = createSchema.parse(req.body);
      const kabkota = await kabkotaService.create(data);
      apiResponse(res, kabkota, 'Kabupaten/Kota berhasil dibuat', 201);
    } catch (error: any) {
      if (error instanceof z.ZodError) apiError(res, 'Validation error', 400, error.errors);
      else apiError(res, error.message, 400);
    }
  }

  async update(req: Request, res: Response) {
    try {
      const data = updateSchema.parse(req.body);
      const kabkota = await kabkotaService.update(req.params.id, data);
      apiResponse(res, kabkota, 'Kabupaten/Kota berhasil diupdate');
    } catch (error: any) {
      if (error instanceof z.ZodError) apiError(res, 'Validation error', 400, error.errors);
      else apiError(res, error.message, 400);
    }
  }

  async delete(req: Request, res: Response) {
    try {
      await kabkotaService.delete(req.params.id);
      apiResponse(res, null, 'Kabupaten/Kota berhasil dihapus');
    } catch (error: any) {
      apiError(res, error.message, 400);
    }
  }
}

export const kabkotaController = new KabkotaController();
