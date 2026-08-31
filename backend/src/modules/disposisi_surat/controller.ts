import { Request, Response } from 'express';
import { disposisiSuratService } from './service.js';
import { apiResponse, apiError, paginatedResponse } from '../../utils/index.js';
import { z } from 'zod';
import type { AuthRequest } from '../../middleware/auth.js';

// ============================================
// Validation Schemas
// ============================================

const createSchema = z.object({
  nomor_surat: z.string().optional(),
  tanggal_surat: z.string().min(1, 'Tanggal surat wajib diisi'),
  hal: z.string().min(1, 'Perihal wajib diisi'),
  jenis_surat: z.enum(['Undangan', 'Surat Dinas'], {
    errorMap: () => ({ message: 'Jenis surat harus Undangan atau Surat Dinas' }),
  }),
  disposisi: z.string().min(1, 'Disposisi wajib diisi'),
  isi_disposisi: z.string().optional(),
  tujuan_disposisi: z.string().min(1, 'Tujuan disposisi wajib diisi'),
  unit_code: z.string().min(1, 'Unit code wajib diisi'),
  tanggal_disposisi: z.string().min(1, 'Tanggal disposisi wajib diisi'),
  tanggal_deadline: z.string().optional(),
  pic: z.string().min(1, 'PIC wajib diisi'),
});

const updateSchema = createSchema.partial();

const updateStatusTLSchema = z.object({
  status_tl: z.enum(['PROSES_TINDAK_LANJUT', 'TINDAK_LANJUT_SELESAI'], {
    errorMap: () => ({ message: 'Status TL harus PROSES_TINDAK_LANJUT atau TINDAK_LANJUT_SELESAI' }),
  }),
});

const grantAccessSchema = z.object({
  user_id: z.number().int().positive('User ID wajib diisi'),
  unit_code: z.string().min(1, 'Unit code wajib diisi'),
  role: z.enum(['INPUTER', 'DISPOSITOR', 'ADMIN']).optional().default('INPUTER'),
});

// ============================================
// Controller Class
// ============================================

export class DisposisiSuratController {
  async findAll(req: Request, res: Response) {
    try {
      const authReq = req as AuthRequest;
      const userId = authReq.user!.id;
      const jabatanCodes = authReq.user!.jabatan_codes || [];

      const { page, limit, search, status_tl, tujuan_disposisi, unit_code, pic, jenis_surat, start_date, end_date } = req.query;

      const result = await disposisiSuratService.findAll(
        {
          page: page ? parseInt(String(page)) : undefined,
          limit: limit ? parseInt(String(limit)) : undefined,
          search: search ? String(search) : undefined,
          status_tl: status_tl ? String(status_tl) : undefined,
          tujuan_disposisi: tujuan_disposisi ? String(tujuan_disposisi) : undefined,
          unit_code: unit_code ? String(unit_code) : undefined,
          pic: pic ? String(pic) : undefined,
          jenis_surat: jenis_surat ? String(jenis_surat) : undefined,
          start_date: start_date ? String(start_date) : undefined,
          end_date: end_date ? String(end_date) : undefined,
        },
        userId,
        jabatanCodes
      );

      paginatedResponse(res, result.items, result.pagination);
    } catch (error: any) {
      apiError(res, error.message, 400);
    }
  }

  async findById(req: Request, res: Response) {
    try {
      const id = String(req.params.id);
      const item = await disposisiSuratService.findById(parseInt(id));
      apiResponse(res, item, 'Disposisi Surat retrieved successfully');
    } catch (error: any) {
      apiError(res, error.message, 400);
    }
  }

  async create(req: Request, res: Response) {
    try {
      const data = createSchema.parse(req.body);
      const authReq = req as AuthRequest;
      const userId = authReq.user!.id;
      const jabatanCodes = authReq.user!.jabatan_codes || [];

      // Check if user can create
      if (!(await disposisiSuratService.canCreate(jabatanCodes))) {
        apiError(res, 'Anda tidak memiliki akses untuk membuat disposisi surat', 403);
        return;
      }

      const item = await disposisiSuratService.create(data as any, userId);
      apiResponse(res, item, 'Disposisi Surat berhasil dibuat', 201);
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        apiError(res, 'Validasi gagal', 400, error.errors);
      } else {
        apiError(res, error.message, 400);
      }
    }
  }

  async update(req: Request, res: Response) {
    try {
      const id = String(req.params.id);
      const data = updateSchema.parse(req.body);
      const authReq = req as AuthRequest;
      const userId = authReq.user!.id;
      const jabatanCodes = authReq.user!.jabatan_codes || [];

      // Check if user can dispose (DIRJEN) or is admin
      const canDispose = await disposisiSuratService.canDispose(jabatanCodes);
      const isAdmin = await disposisiSuratService.isAdmin(jabatanCodes);

      if (!canDispose && !isAdmin) {
        apiError(res, 'Anda tidak memiliki akses untuk mengubah disposisi surat', 403);
        return;
      }

      const item = await disposisiSuratService.update(parseInt(id), data as any, userId);
      apiResponse(res, item, 'Disposisi Surat berhasil diperbarui');
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        apiError(res, 'Validasi gagal', 400, error.errors);
      } else {
        apiError(res, error.message, 400);
      }
    }
  }

  async delete(req: Request, res: Response) {
    try {
      const id = String(req.params.id);
      const authReq = req as AuthRequest;
      const jabatanCodes = authReq.user!.jabatan_codes || [];

      // Only admin can delete
      if (!(await disposisiSuratService.isAdmin(jabatanCodes))) {
        apiError(res, 'Anda tidak memiliki akses untuk menghapus disposisi surat', 403);
        return;
      }

      const result = await disposisiSuratService.delete(parseInt(id));
      apiResponse(res, result, 'Disposisi Surat berhasil dihapus');
    } catch (error: any) {
      apiError(res, error.message, 400);
    }
  }

  async updateStatusTL(req: Request, res: Response) {
    try {
      const id = String(req.params.id);
      const data = updateStatusTLSchema.parse(req.body);

      const item = await disposisiSuratService.updateStatusTL(parseInt(id), data.status_tl);
      apiResponse(res, item, 'Status TL berhasil diperbarui');
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        apiError(res, 'Validasi gagal', 400, error.errors);
      } else {
        apiError(res, error.message, 400);
      }
    }
  }

  async getStats(req: Request, res: Response) {
    try {
      const authReq = req as AuthRequest;
      const userId = authReq.user!.id;
      const jabatanCodes = authReq.user!.jabatan_codes || [];

      const stats = await disposisiSuratService.getStats(userId, jabatanCodes);
      apiResponse(res, stats, 'Stats retrieved successfully');
    } catch (error: any) {
      apiError(res, error.message, 400);
    }
  }

  async getDropdownOptions(req: Request, res: Response) {
    try {
      const options = await disposisiSuratService.getDropdownOptions();
      apiResponse(res, options, 'Dropdown options retrieved successfully');
    } catch (error: any) {
      apiError(res, error.message, 400);
    }
  }

  // ============================================
  // Access Management Endpoints
  // ============================================

  async getAccessList(req: Request, res: Response) {
    try {
      const authReq = req as AuthRequest;
      const jabatanCodes = authReq.user!.jabatan_codes || [];

      // Only admin can view access list
      if (!(await disposisiSuratService.isAdmin(jabatanCodes))) {
        apiError(res, 'Anda tidak memiliki akses untuk melihat daftar akses', 403);
        return;
      }

      const accesses = await disposisiSuratService.getAccessList();
      apiResponse(res, accesses, 'Access list retrieved successfully');
    } catch (error: any) {
      apiError(res, error.message, 400);
    }
  }

  async getUserAccess(req: Request, res: Response) {
    try {
      const authReq = req as AuthRequest;
      const userId = authReq.user!.id;

      const accesses = await disposisiSuratService.getUserAccess(userId);
      apiResponse(res, accesses, 'User access retrieved successfully');
    } catch (error: any) {
      apiError(res, error.message, 400);
    }
  }

  async grantAccess(req: Request, res: Response) {
    try {
      const data = grantAccessSchema.parse(req.body);
      const authReq = req as AuthRequest;
      const jabatanCodes = authReq.user!.jabatan_codes || [];

      // Only admin can grant access
      if (!(await disposisiSuratService.isAdmin(jabatanCodes))) {
        apiError(res, 'Anda tidak memiliki akses untuk memberikan hak akses', 403);
        return;
      }

      const access = await disposisiSuratService.grantAccess(data.user_id, data.unit_code, data.role);
      apiResponse(res, access, 'Akses berhasil diberikan', 201);
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        apiError(res, 'Validasi gagal', 400, error.errors);
      } else {
        apiError(res, error.message, 400);
      }
    }
  }

  async revokeAccess(req: Request, res: Response) {
    try {
      const id = String(req.params.id);
      const authReq = req as AuthRequest;
      const jabatanCodes = authReq.user!.jabatan_codes || [];

      // Only admin can revoke access
      if (!(await disposisiSuratService.isAdmin(jabatanCodes))) {
        apiError(res, 'Anda tidak memiliki akses untuk mencabut hak akses', 403);
        return;
      }

      const result = await disposisiSuratService.revokeAccess(parseInt(id));
      apiResponse(res, result, 'Akses berhasil dicabut');
    } catch (error: any) {
      apiError(res, error.message, 400);
    }
  }

  async getAllUsers(req: Request, res: Response) {
    try {
      const authReq = req as AuthRequest;
      const jabatanCodes = authReq.user!.jabatan_codes || [];

      // Only admin can view all users
      if (!(await disposisiSuratService.isAdmin(jabatanCodes))) {
        apiError(res, 'Anda tidak memiliki akses untuk melihat daftar pengguna', 403);
        return;
      }

      const users = await disposisiSuratService.getAllUsers();
      apiResponse(res, users, 'Users retrieved successfully');
    } catch (error: any) {
      apiError(res, error.message, 400);
    }
  }
}

export const disposisiSuratController = new DisposisiSuratController();
