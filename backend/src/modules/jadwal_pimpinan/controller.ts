import { Request, Response } from 'express';
import { jadwalPimpinanService } from './service.js';
import { apiResponse, apiError, paginatedResponse } from '../../utils/index.js';
import { z } from 'zod';
import { AuthRequest } from '../../middleware/auth.js';
import { prisma } from '../../config/database.js';

const createSchema = z.object({
  acara: z.string().min(1, 'Acara harus diisi'),
  lokasi: z.string().min(1, 'Lokasi harus diisi'),
  sebagai: z.string().min(1, 'Sebagai apa harus diisi'),
  tanggal_awal: z.string().transform((s) => new Date(s)),
  tanggal_akhir: z.string().transform((s) => new Date(s)),
  pendamping_pegawai: z
    .array(
      z.object({
        pegawai_id: z.number(),
      })
    )
    .optional(),
  pendamping_direktur: z
    .array(
      z.object({
        kode_direktur: z.string(),
        nama_direktur: z.string(),
      })
    )
    .optional(),
});

const updateSchema = z.object({
  acara: z.string().min(1).optional(),
  lokasi: z.string().min(1).optional(),
  sebagai: z.string().min(1).optional(),
  tanggal_awal: z.string().transform((s) => new Date(s)).optional(),
  tanggal_akhir: z.string().transform((s) => new Date(s)).optional(),
  pendamping_pegawai: z
    .array(
      z.object({
        pegawai_id: z.number(),
      })
    )
    .optional(),
  pendamping_direktur: z
    .array(
      z.object({
        kode_direktur: z.string(),
        nama_direktur: z.string(),
      })
    )
    .optional(),
});

const sendNotificationSchema = z.object({
  type: z.enum(['weekly', 'monthly']),
  phone: z.string().min(1, 'Nomor telepon harus diisi'),
});

export class JadwalPimpinanController {
  async findAll(req: Request, res: Response) {
    try {
      const { page, limit, search, tanggal_awal, tanggal_akhir } = req.query;
      const result = await jadwalPimpinanService.findAll({
        page: page ? parseInt(page as string) : undefined,
        limit: limit ? parseInt(limit as string) : undefined,
        search: search as string,
        tanggal_awal: tanggal_awal as string,
        tanggal_akhir: tanggal_akhir as string,
      });
      paginatedResponse(res, result.jadwal, result.pagination);
    } catch (error: any) {
      apiError(res, error.message, 400);
    }
  }

  async findById(req: Request, res: Response) {
    try {
      const jadwal = await jadwalPimpinanService.findById(parseInt(req.params.id));
      apiResponse(res, jadwal);
    } catch (error: any) {
      apiError(res, error.message, 404);
    }
  }

  async create(req: Request, res: Response) {
    try {
      const authReq = req as AuthRequest;
      const data = createSchema.parse(req.body);
      const jadwal = await jadwalPimpinanService.create({
        ...data,
        created_by: authReq.user!.id,
      });
      apiResponse(res, jadwal, 'Jadwal berhasil ditambahkan', 201);
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
      const jadwal = await jadwalPimpinanService.update(parseInt(req.params.id), data);
      apiResponse(res, jadwal, 'Jadwal berhasil diperbarui');
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
      const result = await jadwalPimpinanService.delete(parseInt(req.params.id));
      apiResponse(res, result);
    } catch (error: any) {
      apiError(res, error.message, 400);
    }
  }

  async getUpcoming(req: Request, res: Response) {
    try {
      const { type } = req.query;
      if (!type || !['weekly', 'monthly'].includes(type as string)) {
        apiError(res, 'Parameter type wajib weekly atau monthly', 400);
        return;
      }
      const jadwal = await jadwalPimpinanService.getUpcomingJadwal({
        type: type as 'weekly' | 'monthly',
      });
      apiResponse(res, jadwal);
    } catch (error: any) {
      apiError(res, error.message, 400);
    }
  }

  async getPegawai(req: Request, res: Response) {
    try {
      const pegawai = await jadwalPimpinanService.getPegawai();
      apiResponse(res, pegawai);
    } catch (error: any) {
      apiError(res, error.message, 400);
    }
  }

  async sendNotification(req: Request, res: Response) {
    try {
      const authReq = req as AuthRequest;
      const { type, phone } = sendNotificationSchema.parse(req.body);

      const jadwal = await jadwalPimpinanService.getUpcomingJadwal({
        type: type as 'weekly' | 'monthly',
      });

      if (jadwal.length === 0) {
        apiResponse(res, { message: 'Tidak ada jadwal untuk periode ini' });
        return;
      }

      // Generate message
      const now = new Date();
      const bulanNames = [
        'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
        'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
      ];
      const bulan = bulanNames[now.getMonth()];
      const tahun = now.getFullYear();

      let message = `Izin kami sampaikan agenda Ibu Dirjen Bulan ${bulan} ${tahun} untuk:\n\n`;

      for (const j of jadwal) {
        const tglAwal = new Date(j.tanggal_awal);
        const tglAkhir = new Date(j.tanggal_akhir);
        const formatTgl = (d: Date) =>
          `${d.getDate().toString().padStart(2, '0')}-${(d.getMonth() + 1).toString().padStart(2, '0')}-${d.getFullYear()}`;

        message += `Tanggal : ${formatTgl(tglAwal)}`;
        if (tglAwal.toDateString() !== tglAkhir.toDateString()) {
          message += ` - ${formatTgl(tglAkhir)}`;
        }
        message += `\n`;
        message += `${j.acara} (${j.lokasi})\n`;

        if (j.pendamping_pegawai.length > 0) {
          message += `Pendamping:\n`;
          j.pendamping_pegawai.forEach((p, idx) => {
            message += `${idx + 1}. ${p.pegawai?.nama_lengkap || '-'}\n`;
          });
        }

        if (j.pendamping_direktur.length > 0) {
          message += `Pendamping Direktorat:\n`;
          j.pendamping_direktur.forEach((d) => {
            message += `Dir ${d.nama_direktur}\n`;
          });
        }

        message += '\n';
      }

      // Send via WhatsApp
      const { whatsappService } = await import('../whatsapp/service.js');
      const session = await prisma.wa_sessions.findFirst({ where: { is_active: true } });

      if (!session) {
        apiError(res, 'Tidak ada sesi WhatsApp yang aktif', 400);
        return;
      }

      await whatsappService.sendMessage(session.id, phone, message, authReq.user!.id);

      apiResponse(res, { message: 'Notifikasi berhasil dikirim' });
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        apiError(res, 'Validation error', 400, error.errors);
      } else {
        apiError(res, error.message, 400);
      }
    }
  }

  async previewNotification(req: Request, res: Response) {
    try {
      const { type } = req.query;
      if (!type || !['weekly', 'monthly'].includes(type as string)) {
        apiError(res, 'Parameter type wajib weekly atau monthly', 400);
        return;
      }

      const jadwal = await jadwalPimpinanService.getUpcomingJadwal({
        type: type as 'weekly' | 'monthly',
      });

      if (jadwal.length === 0) {
        apiResponse(res, { message: 'Tidak ada jadwal untuk periode ini', preview: '' });
        return;
      }

      // Generate message
      const now = new Date();
      const bulanNames = [
        'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
        'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
      ];
      const bulan = bulanNames[now.getMonth()];
      const tahun = now.getFullYear();

      let preview = `Izin kami sampaikan agenda Ibu Dirjen Bulan ${bulan} ${tahun} untuk:\n\n`;

      for (const j of jadwal) {
        const tglAwal = new Date(j.tanggal_awal);
        const tglAkhir = new Date(j.tanggal_akhir);
        const formatTgl = (d: Date) =>
          `${d.getDate().toString().padStart(2, '0')}-${(d.getMonth() + 1).toString().padStart(2, '0')}-${d.getFullYear()}`;

        preview += `Tanggal : ${formatTgl(tglAwal)}`;
        if (tglAwal.toDateString() !== tglAkhir.toDateString()) {
          preview += ` - ${formatTgl(tglAkhir)}`;
        }
        preview += `\n`;
        preview += `${j.acara} (${j.lokasi})\n`;

        if (j.pendamping_pegawai.length > 0) {
          preview += `Pendamping:\n`;
          j.pendamping_pegawai.forEach((p, idx) => {
            preview += `${idx + 1}. ${p.pegawai?.nama_lengkap || '-'}\n`;
          });
        }

        if (j.pendamping_direktur.length > 0) {
          preview += `Pendamping Direktorat:\n`;
          j.pendamping_direktur.forEach((d) => {
            preview += `Dir ${d.nama_direktur}\n`;
          });
        }

        preview += '\n';
      }

      apiResponse(res, { preview, count: jadwal.length });
    } catch (error: any) {
      apiError(res, error.message, 400);
    }
  }
}

export const jadwalPimpinanController = new JadwalPimpinanController();
