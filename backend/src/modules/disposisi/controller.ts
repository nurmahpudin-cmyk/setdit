import { Request, Response } from 'express';
import { disposisiService } from './service.js';
import { apiResponse, apiError, paginatedResponse } from '../../utils/index.js';
import { z } from 'zod';
import type { AuthRequest } from '../../middleware/auth.js';

const createSchema = z.object({
  tanggal_surat: z.string().min(1, 'Tanggal surat wajib diisi'),
  tanggal_terima: z.string().min(1, 'Tanggal terima wajib diisi'),
  pengirim: z.string().min(1, 'Pengirim wajib diisi'),
  hal: z.string().min(1, 'Perihal wajib diisi'),
  unit_tujuan: z.string().min(1, 'Unit tujuan wajib diisi'),
  jenis_surat_id: z.string().optional(),
});

const processStepSchema = z.object({
  catatan: z.string().optional(),
  kesimpulan: z.enum([
    'DISPOSISI',
    'TIDAK_TL',
    'TINDAK_LANJUTI',
    'SELESAI_TANPA_TL',
    'DISETUJUI',
    'PERBAIKAN',
  ]).optional(),
  assignee_id: z.number().optional(),
  unit_code: z.string().optional(),
});

const createTLSchema = z.object({
  concept_letter: z.string().min(1, 'Konsep surat wajib diisi'),
  attachment: z.string().optional(),
});

const updateTLSchema = z.object({
  concept_letter: z.string().optional(),
  letter_number: z.string().optional(),
  letter_date: z.string().optional(),
  attachment: z.string().optional(),
  approved_by: z.number().optional(),
});

export class DisposisiController {
  async findAll(req: Request, res: Response) {
    try {
      const { page, limit, search, status, unit_tujuan, jenis_surat_id, start_date, end_date, jabatan_code } = req.query;
      const authReq = req as AuthRequest;
      const userId = authReq.user?.id;

      const result = await disposisiService.findAll({
        page: page ? parseInt(String(page)) : undefined,
        limit: limit ? parseInt(String(limit)) : undefined,
        search: search ? String(search) : undefined,
        status: status ? String(status) : undefined,
        unit_tujuan: unit_tujuan ? String(unit_tujuan) : undefined,
        jenis_surat_id: jenis_surat_id ? String(jenis_surat_id) : undefined,
        start_date: start_date ? String(start_date) : undefined,
        end_date: end_date ? String(end_date) : undefined,
        jabatan_code: jabatan_code ? String(jabatan_code) : undefined,
        userId,
      });

      paginatedResponse(res, result.items, result.pagination);
    } catch (error: any) {
      apiError(res, error.message, 400);
    }
  }

  async findById(req: Request, res: Response) {
    try {
      const id = String(req.params.id);
      const disposisi = await disposisiService.findById(parseInt(id));
      apiResponse(res, disposisi, 'Disposisi retrieved successfully');
    } catch (error: any) {
      apiError(res, error.message, 400);
    }
  }

  async create(req: Request, res: Response) {
    try {
      const data = createSchema.parse(req.body);
      const authReq = req as AuthRequest;
      const userId = authReq.user!.id;

      const disposisi = await disposisiService.create(data as any, userId);
      apiResponse(res, disposisi, 'Disposisi created successfully', 201);
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
      const id = String(req.params.id);
      const authReq = req as AuthRequest;
      const userId = authReq.user!.id;

      const disposisi = await disposisiService.submit(parseInt(id), userId);
      apiResponse(res, disposisi, 'Disposisi submitted successfully');
    } catch (error: any) {
      apiError(res, error.message, 400);
    }
  }

  async processStep(req: Request, res: Response) {
    try {
      const id = String(req.params.id);
      const data = processStepSchema.parse(req.body);
      const authReq = req as AuthRequest;
      const userId = authReq.user!.id;
      const userJabatanCodes = authReq.user?.jabatan_codes || [];

      const result = await disposisiService.processStep(parseInt(id), data as any, userId, userJabatanCodes);
      apiResponse(res, result, 'Step processed successfully');
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        apiError(res, 'Validation error', 400, error.errors);
      } else {
        apiError(res, error.message, 400);
      }
    }
  }

  async createTindakLanjut(req: Request, res: Response) {
    try {
      const id = String(req.params.id);
      const data = createTLSchema.parse(req.body);
      const authReq = req as AuthRequest;
      const userId = authReq.user!.id;

      const tl = await disposisiService.createTindakLanjut(parseInt(id), data as any, userId);
      apiResponse(res, tl, 'Tindak lanjut created successfully', 201);
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        apiError(res, 'Validation error', 400, error.errors);
      } else {
        apiError(res, error.message, 400);
      }
    }
  }

  async updateTindakLanjut(req: Request, res: Response) {
    try {
      const id = String(req.params.id);
      const tlId = String(req.params.tlId);
      const data = updateTLSchema.parse(req.body);
      const authReq = req as AuthRequest;
      const userId = authReq.user!.id;

      const tl = await disposisiService.updateTindakLanjut(parseInt(id), parseInt(tlId), data as any, userId);
      apiResponse(res, tl, 'Tindak lanjut updated successfully');
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        apiError(res, 'Validation error', 400, error.errors);
      } else {
        apiError(res, error.message, 400);
      }
    }
  }

  async getStats(req: Request, res: Response) {
    try {
      const stats = await disposisiService.getStats();
      apiResponse(res, stats, 'Stats retrieved successfully');
    } catch (error: any) {
      apiError(res, error.message, 400);
    }
  }

  async getUnits(req: Request, res: Response) {
    try {
      const units = await disposisiService.getUnits();
      apiResponse(res, units, 'Units retrieved successfully');
    } catch (error: any) {
      apiError(res, error.message, 400);
    }
  }

  async getJenisSurat(req: Request, res: Response) {
    try {
      const jenisSurat = await disposisiService.getJenisSurat();
      apiResponse(res, jenisSurat, 'Jenis surat retrieved successfully');
    } catch (error: any) {
      apiError(res, error.message, 400);
    }
  }
}

export const disposisiController = new DisposisiController();
