import { Request, Response } from 'express';
import { skPerhutananService } from './service.js';
import { apiResponse, apiError, paginatedResponse } from '../../utils/index.js';
import { z } from 'zod';
import type { AuthRequest } from '../../middleware/auth.js';

const createSchema = z.object({
  nomor_surat: z.string().optional(),
  tanggal_surat: z.string().optional(),
  tanggal_terima: z.string().min(1, 'Tanggal terima wajib diisi'),
  unit_pengusul: z.enum(['PKPS', 'PKTHA'], { required_error: 'Unit pengusul wajib diisi' }),
  perihal: z.string().min(1, 'Perihal wajib diisi'),
  tujuan_surat: z.string().min(1, 'Tujuan surat wajib diisi'),
  konseptor_id: z.number().optional(),
  penandatangan: z.string().optional(),
  provinsi: z.string().optional(),
  kabupaten: z.string().optional(),
  kecamatan: z.string().optional(),
  desa: z.string().optional(),
  skema: z.string().optional(),
  kelompok_ps: z.string().optional(),
  luas: z.number().optional(),
  jml_kk: z.number().optional(),
});

const updateSchema = z.object({
  nomor_surat: z.string().optional(),
  tanggal_surat: z.string().optional(),
  unit_pengusul: z.enum(['PKPS', 'PKTHA']).optional(),
  pertaining: z.string().optional(),
  tujuan_surat: z.string().optional(),
  konseptor_id: z.number().optional(),
  penandatangan: z.string().optional(),
  provinsi: z.string().optional(),
  kabupaten: z.string().optional(),
  kecamatan: z.string().optional(),
  desa: z.string().optional(),
  skema: z.string().optional(),
  kelompok_ps: z.string().optional(),
  luas: z.number().optional(),
  jml_kk: z.number().optional(),
});

const processStepSchema = z.object({
  catatan: z.string().optional(),
  kesimpulan: z.enum(['DISETUJUI', 'PERBAIKAN']).optional(),
  assignee_id: z.number().optional(),
});

const nomorNDSchema = z.object({
  nomor_nd_sk: z.string().min(1, 'Nomor ND wajib diisi'),
  tanggal_nd_sk: z.string().min(1, 'Tanggal ND wajib diisi'),
});

const nomorSKSchema = z.object({
  nomor_sk: z.string().min(1, 'Nomor SK wajib diisi'),
  tanggal_sk: z.string().min(1, 'Tanggal SK wajib diisi'),
});

export class SkPerhutananController {
  async findAll(req: Request, res: Response) {
    try {
      const { page, limit, search, status, unit_pengusul, start_date, end_date } = req.query;

      const result = await skPerhutananService.findAll({
        page: page ? parseInt(String(page)) : undefined,
        limit: limit ? parseInt(String(limit)) : undefined,
        search: search ? String(search) : undefined,
        status: status ? String(status) : undefined,
        unit_pengusul: unit_pengusul ? String(unit_pengusul) : undefined,
        start_date: start_date ? String(start_date) : undefined,
        end_date: end_date ? String(end_date) : undefined,
      });

      paginatedResponse(res, result.items, result.pagination);
    } catch (error: any) {
      apiError(res, error.message, 400);
    }
  }

  async findById(req: Request, res: Response) {
    try {
      const sk = await skPerhutananService.findById(parseInt(req.params.id));
      apiResponse(res, sk);
    } catch (error: any) {
      apiError(res, error.message, error.message === 'SK not found' ? 404 : 400);
    }
  }

  async create(req: Request, res: Response) {
    try {
      const data = createSchema.parse(req.body);
      const authReq = req as AuthRequest;

      const sk = await skPerhutananService.create(data as any, authReq.user!.id);
      apiResponse(res, sk, 'SK berhasil dibuat', 201);
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

      const sk = await skPerhutananService.update(parseInt(req.params.id), data as any);
      apiResponse(res, sk, 'SK berhasil diupdate');
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        apiError(res, 'Validation error', 400, error.errors);
      } else {
        apiError(res, error.message, 400);
      }
    }
  }

  async submit(req: Request, res: Response) {
    try {
      const authReq = req as AuthRequest;
      const result = await skPerhutananService.submit(parseInt(req.params.id), authReq.user!.id);
      apiResponse(res, result, 'SK berhasil disubmit');
    } catch (error: any) {
      apiError(res, error.message, 400);
    }
  }

  async processStep(req: Request, res: Response) {
    try {
      const data = processStepSchema.parse(req.body);
      const authReq = req as AuthRequest;

      const result = await skPerhutananService.processStep(
        parseInt(req.params.id),
        data as any,
        authReq.user!.id
      );
      apiResponse(res, result, 'Step berhasil diproses');
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        apiError(res, 'Validation error', 400, error.errors);
      } else {
        apiError(res, error.message, 400);
      }
    }
  }

  async addNomorND(req: Request, res: Response) {
    try {
      const data = nomorNDSchema.parse(req.body);
      const authReq = req as AuthRequest;

      const result = await skPerhutananService.addNomorND(
        parseInt(req.params.id),
        data as any,
        authReq.user!.id
      );
      apiResponse(res, result, 'Nomor ND berhasil ditambahkan');
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        apiError(res, 'Validation error', 400, error.errors);
      } else {
        apiError(res, error.message, 400);
      }
    }
  }

  async signSK(req: Request, res: Response) {
    try {
      const authReq = req as AuthRequest;
      const result = await skPerhutananService.signSK(parseInt(req.params.id), authReq.user!.id);
      apiResponse(res, result, 'SK berhasil ditandatangani');
    } catch (error: any) {
      apiError(res, error.message, 400);
    }
  }

  async addNomorSK(req: Request, res: Response) {
    try {
      const data = nomorSKSchema.parse(req.body);
      const authReq = req as AuthRequest;

      const result = await skPerhutananService.addNomorSK(
        parseInt(req.params.id),
        data as any,
        authReq.user!.id
      );
      apiResponse(res, result, 'Nomor SK berhasil ditambahkan');
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        apiError(res, 'Validation error', 400, error.errors);
      } else {
        apiError(res, error.message, 400);
      }
    }
  }

  async finalize(req: Request, res: Response) {
    try {
      const authReq = req as AuthRequest;
      const result = await skPerhutananService.finalize(parseInt(req.params.id), authReq.user!.id);
      apiResponse(res, result, 'SK berhasil difinalisasi');
    } catch (error: any) {
      apiError(res, error.message, 400);
    }
  }

  async getPendingByJabatan(req: Request, res: Response) {
    try {
      const { jabatanCode } = req.params;
      const result = await skPerhutananService.getPendingByJabatan(String(jabatanCode));
      apiResponse(res, result);
    } catch (error: any) {
      apiError(res, error.message, 400);
    }
  }

  async getStats(req: Request, res: Response) {
    try {
      const stats = await skPerhutananService.getStats();
      apiResponse(res, stats);
    } catch (error: any) {
      apiError(res, error.message, 400);
    }
  }

  async getUsersByJabatan(req: Request, res: Response) {
    try {
      const { jabatanCode } = req.params;
      const users = await skPerhutananService.getUsersByJabatan(String(jabatanCode));
      apiResponse(res, users);
    } catch (error: any) {
      apiError(res, error.message, 400);
    }
  }
}

export const skPerhutananController = new SkPerhutananController();
