import { Request, Response } from 'express';
import { pegawaiService } from './service.js';
import { apiResponse, apiError, paginatedResponse } from '../../utils/index.js';
import { z } from 'zod';
import { AuthRequest } from '../../middleware/auth.js';

const createSchema = z.object({
  nama_lengkap: z.string().min(1, 'Nama lengkap harus diisi'),
  nama_panggilan: z.string().optional(),
  nip: z.string().min(1, 'NIP harus diisi'),
  nomor_wa: z.string().optional(),
  unit_code: z.string().optional(),
  jabatan: z.string().optional(),
  is_disposisi_recipient: z.boolean().optional(),
});

const updateSchema = z.object({
  nama_lengkap: z.string().min(1).optional(),
  nama_panggilan: z.string().optional().nullable(),
  nip: z.string().min(1).optional(),
  nomor_wa: z.string().optional().nullable(),
  unit_code: z.string().optional().nullable(),
  jabatan: z.string().optional().nullable(),
  is_disposisi_recipient: z.boolean().optional(),
  is_active: z.boolean().optional(),
});

export class PegawaiController {
  async findAll(req: Request, res: Response) {
    try {
      const { page, limit, search } = req.query;
      const result = await pegawaiService.findAll({
        page: page ? parseInt(page as string) : undefined,
        limit: limit ? parseInt(limit as string) : undefined,
        search: search as string,
      });
      res.json({
        success: true,
        data: result.pegawai,
        pagination: result.pagination,
      });
    } catch (error: any) {
      apiError(res, error.message, 400);
    }
  }

  async findById(req: Request, res: Response) {
    try {
      const pegawai = await pegawaiService.findById(parseInt(String(req.params.id)));
      apiResponse(res, pegawai);
    } catch (error: any) {
      apiError(res, error.message, 404);
    }
  }

  async create(req: Request, res: Response) {
    try {
      const data = createSchema.parse(req.body);
      const pegawai = await pegawaiService.create(data);
      res.status(201).json({
        success: true,
        message: 'Pegawai berhasil ditambahkan',
        data: pegawai,
      });
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        apiError(res, 'Validation error', 400, error.errors);
      } else {
        apiError(res, error.message, 400);
      }
    }
  }

  async update(req: Request, res: Response) {
    try {
      const data = updateSchema.parse(req.body);
      const pegawai = await pegawaiService.update(parseInt(String(req.params.id)), data as any);
      apiResponse(res, pegawai, 'Pegawai berhasil diperbarui');
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
      const result = await pegawaiService.delete(parseInt(String(req.params.id)));
      apiResponse(res, result);
    } catch (error: any) {
      apiError(res, error.message, 400);
    }
  }

  async getAll(req: Request, res: Response) {
    try {
      const pegawai = await pegawaiService.getAll();
      apiResponse(res, pegawai);
    } catch (error: any) {
      apiError(res, error.message, 400);
    }
  }
}

export const pegawaiController = new PegawaiController();
