import { prisma } from '../../config/database.js';
import { formatTanggal } from '../../utils/tanggal.js';

// ============================================
// Constants
// ============================================

export const DISPOSISI_OPTIONS = [
  'Dijadwalkan',
  'Untuk Diketahui',
  'File',
  'Tindak lanjut sesuai Peraturan Perundangan',
  'Dampingi',
  'Untuk menjadi perhatian',
  'Koordinasikan',
  'Perbaiki',
  'Ditolak',
  'Dapat disetujui',
  'Siapkan Laporan/Laporkan',
  'Siapkan jawaban sesuai peraturan perundangan',
  'Siapkan Draft / Bahan',
  'Teliti dan tanggapi',
  'Dibahas bersama',
  'Bicarakan dengan saya',
  'Mohon dihadiri/diwakili',
  'Edarkan',
] as const;

export const TUJUAN_DISPOSISI_OPTIONS = [
  'Ditjen PS',
  'Sesdit PS',
  'Dit. PKPS',
  'Dit. PKTHA',
  'Dit. PUPS',
  'Dit. PPS',
] as const;

export const UNIT_CODES: Record<string, string> = {
  'Ditjen PS': 'DITJEN_PS',
  'Sesdit PS': 'SESDIT_PS',
  'Dit. PKPS': 'DIT_PKPS',
  'Dit. PKTHA': 'DIT_PKTHA',
  'Dit. PUPS': 'DIT_PUPS',
  'Dit. PPS': 'DIT_PPS',
};

// Reverse lookup: unit_code -> nama tampilan (untuk mengisi tujuan_disposisi otomatis)
export const UNIT_DISPLAY_NAMES: Record<string, string> = Object.fromEntries(
  Object.entries(UNIT_CODES).map(([label, code]) => [code, label])
);

export const JENIS_SURAT_OPTIONS = ['Undangan', 'Surat Dinas'] as const;

// Jabatan codes for role-based access
export const JABATAN_CODES = {
  TU_SETDITJEN: 'TU_SETDITJEN',
  KASUBBAG_TU: 'KASUBBAG_TU',
  DIRJEN_PS: 'DIRJEN_PS',
  SETDITJEN_PS: 'SETDITJEN_PS',
  SEKDITJEN_PS: 'SEKDITJEN_PS',
  SUPERADMIN: 'SUPERADMIN',
} as const;

// ============================================
// Service Class
// ============================================

export class DisposisiSuratService {
  // Check if user has admin access - bisa lihat SEMUA disposisi tanpa batas unit.
  // TU Setditjen & Kasubbag TU termasuk admin karena merekalah yang menginput
  // setiap disposisi, jadi wajar bisa melihat semua yang mereka proses.
  async isAdmin(jabatanCodes: string[]): Promise<boolean> {
    if (jabatanCodes.includes(JABATAN_CODES.SUPERADMIN)) return true;

    const adminCodes: string[] = [
      JABATAN_CODES.SETDITJEN_PS,
      JABATAN_CODES.SEKDITJEN_PS,
      JABATAN_CODES.TU_SETDITJEN,
      JABATAN_CODES.KASUBBAG_TU,
    ];
    return jabatanCodes.some((code) => adminCodes.includes(code));
  }

  // Check if user can create (TU Setditjen / Kasubbag TU / Super Admin)
  async canCreate(jabatanCodes: string[]): Promise<boolean> {
    if (jabatanCodes.includes(JABATAN_CODES.SUPERADMIN)) return true;

    const createCodes: string[] = [
      JABATAN_CODES.TU_SETDITJEN,
      JABATAN_CODES.KASUBBAG_TU,
    ];
    return jabatanCodes.some((code) => createCodes.includes(code));
  }

  // Check if user can dispose (DIRJEN_PS / Super Admin)
  async canDispose(jabatanCodes: string[]): Promise<boolean> {
    if (jabatanCodes.includes(JABATAN_CODES.SUPERADMIN)) return true;
    return jabatanCodes.includes(JABATAN_CODES.DIRJEN_PS);
  }

  // Get user's accessible unit codes
  async getUserUnitCodes(userId: number, jabatanCodes: string[]): Promise<string[]> {
    // Admin can access all units
    if (await this.isAdmin(jabatanCodes)) {
      return Object.values(UNIT_CODES);
    }

    // Get from access table
    const accesses = await prisma.tr_disposisi_surat_access.findMany({
      where: { user_id: userId },
      select: { unit_code: true },
    });

    return accesses.map((a) => a.unit_code);
  }

  // Find all records with access control
  async findAll(query: {
    page?: number;
    limit?: number;
    search?: string;
    status_tl?: string;
    tujuan_disposisi?: string;
    unit_code?: string;
    pic?: string;
    jenis_surat?: string;
    start_date?: string;
    end_date?: string;
  }, userId: number, jabatanCodes: string[]) {
    const page = query.page || 1;
    const limit = query.limit || 10;
    const skip = (page - 1) * limit;

    // Build where clause with access control
    const isAdminUser = await this.isAdmin(jabatanCodes);
    const accessibleUnits = await this.getUserUnitCodes(userId, jabatanCodes);

    // Non-admin tanpa akses unit sama sekali tidak boleh melihat baris apapun.
    if (!isAdminUser && accessibleUnits.length === 0) {
      return { items: [], pagination: { page, limit, total: 0 } };
    }

    const where: any = {};

    // Access control - non-admin hanya melihat disposisi yang SEMUA unit tujuannya
    // ada dalam daftar unit yang jadi aksesnya. Prisma tidak punya operator "array
    // baris adalah subset dari nilai" untuk String[], jadi kandidat diambil dulu
    // pakai hasSome (irisan tidak kosong) lalu difilter presisi setelah query.
    if (!isAdminUser) {
      where.unit_code = { hasSome: accessibleUnits };
    }

    // Search filter
    if (query.search) {
      where.OR = [
        { nomor_surat: { contains: query.search, mode: 'insensitive' } },
        { hal: { contains: query.search, mode: 'insensitive' } },
        { disposisi: { contains: query.search, mode: 'insensitive' } },
        { isi_disposisi: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    // Status filter
    if (query.status_tl) {
      where.status_tl = query.status_tl;
    }

    // Tujuan filter (convert display name to code)
    if (query.tujuan_disposisi) {
      where.tujuan_disposisi = query.tujuan_disposisi;
    }

    // Unit code filter
    if (query.unit_code) {
      where.unit_code = { has: query.unit_code };
    }

    // PIC filter
    if (query.pic) {
      where.pic = query.pic;
    }

    // Jenis surat filter
    if (query.jenis_surat) {
      where.jenis_surat = query.jenis_surat;
    }

    // Date range filter
    if (query.start_date && query.end_date) {
      where.tanggal_surat = {
        gte: new Date(query.start_date),
        lte: new Date(query.end_date + 'T23:59:59'),
      };
    }

    if (isAdminUser) {
      const [items, total] = await Promise.all([
        prisma.tr_disposisi_surat.findMany({
          where,
          include: {
            creator: { select: { id: true, fullname: true } },
          },
          skip,
          take: limit,
          orderBy: { created_at: 'desc' },
        }),
        prisma.tr_disposisi_surat.count({ where }),
      ]);

      return { items, pagination: { page, limit, total } };
    }

    // Non-admin: subset check presisi tidak bisa dilakukan di SQL untuk String[],
    // jadi ambil kandidat (irisan tidak kosong) lalu saring & paginasi di aplikasi.
    const candidates = await prisma.tr_disposisi_surat.findMany({
      where,
      include: {
        creator: { select: { id: true, fullname: true } },
      },
      orderBy: { created_at: 'desc' },
    });

    const filtered = candidates.filter((row) =>
      row.unit_code.every((code) => accessibleUnits.includes(code))
    );

    const total = filtered.length;
    const items = filtered.slice(skip, skip + limit);

    return { items, pagination: { page, limit, total } };
  }

  async findById(id: number) {
    const item = await prisma.tr_disposisi_surat.findUnique({
      where: { id },
      include: {
        creator: { select: { id: true, fullname: true } },
      },
    });

    if (!item) {
      throw new Error('Disposisi Surat tidak ditemukan');
    }

    return item;
  }

  // Ambil semua penerima notifikasi disposisi untuk sebuah unit tujuan
  async getRecipientsByUnit(unitCode: string) {
    return prisma.mst_pegawai.findMany({
      where: {
        unit_code: unitCode,
        is_disposisi_recipient: true,
        is_active: true,
      },
      select: {
        id: true,
        nama_lengkap: true,
        nama_panggilan: true,
        nomor_wa: true,
        jabatan: true,
        unit_code: true,
      },
      orderBy: { nama_lengkap: 'asc' },
    });
  }

  // Ambil penerima untuk beberapa unit sekaligus, dikelompokkan per unit
  async getRecipientsByUnits(unitCodes: string[]) {
    const grouped: { unitCode: string; unitName: string; recipients: Awaited<ReturnType<DisposisiSuratService['getRecipientsByUnit']>> }[] = [];
    for (const unitCode of unitCodes) {
      const recipients = await this.getRecipientsByUnit(unitCode);
      grouped.push({ unitCode, unitName: UNIT_DISPLAY_NAMES[unitCode] || unitCode, recipients });
    }
    return grouped;
  }

  async create(data: {
    nomor_surat?: string;
    tanggal_surat: string;
    hal: string;
    jenis_surat: string;
    disposisi: string;
    isi_disposisi?: string;
    unit_codes: string[];
    tanggal_disposisi: string;
    tanggal_deadline?: string;
  }, userId: number) {
    if (!data.unit_codes || data.unit_codes.length === 0) {
      throw new Error('Unit tujuan wajib dipilih minimal 1');
    }

    // PIC dan tujuan_disposisi diisi otomatis, digabung dari semua unit tujuan,
    // sehingga user tidak perlu memilih orang lagi di form.
    const grouped = await this.getRecipientsByUnits(data.unit_codes);
    const picNames = grouped.flatMap((g) => g.recipients.map((r) => r.nama_lengkap)).join(', ');
    const tujuanNames = data.unit_codes.map((code) => UNIT_DISPLAY_NAMES[code] || code).join(', ');

    // Deadline default = tanggal disposisi + 14 hari kalender, kalau tidak diisi user.
    const tanggalDisposisi = new Date(data.tanggal_disposisi);
    const tanggalDeadline = data.tanggal_deadline
      ? new Date(data.tanggal_deadline)
      : new Date(tanggalDisposisi.getTime() + 14 * 24 * 60 * 60 * 1000);

    const item = await prisma.tr_disposisi_surat.create({
      data: {
        nomor_surat: data.nomor_surat || null,
        tanggal_surat: new Date(data.tanggal_surat),
        hal: data.hal,
        jenis_surat: data.jenis_surat,
        disposisi: data.disposisi,
        isi_disposisi: data.isi_disposisi || null,
        tujuan_disposisi: tujuanNames,
        unit_code: data.unit_codes,
        tanggal_disposisi: tanggalDisposisi,
        tanggal_deadline: tanggalDeadline,
        pic: picNames || '-',
        status_tl: 'PROSES_TINDAK_LANJUT',
        created_by: userId,
      },
    });

    // Kegagalan notifikasi tidak boleh membatalkan penyimpanan disposisi.
    let notification;
    try {
      notification = await this.sendDisposisiNotification(item.id, userId);
    } catch (error: any) {
      console.error('[DisposisiSurat] Gagal mengirim notifikasi:', error);
      notification = {
        sent: 0,
        message: `Notifikasi gagal dikirim: ${error.message}`,
        results: [],
      };
    }

    // Disposisi berjenis Undangan otomatis dibuatkan entri di Jadwal Pimpinan,
    // supaya tidak perlu diinput ulang manual. Lokasi & Sebagai diisi placeholder
    // karena disposisi surat tidak menyimpan data itu - dilengkapi manual di
    // halaman Jadwal Pimpinan.
    let jadwalPimpinan: { id: number } | null = null;
    if (data.jenis_surat === 'Undangan') {
      try {
        const { jadwalPimpinanService } = await import('../jadwal_pimpinan/service.js');
        const jadwal = await jadwalPimpinanService.create({
          acara: data.hal,
          lokasi: '-',
          sebagai: '-',
          tanggal_awal: tanggalDisposisi,
          tanggal_akhir: tanggalDisposisi,
          catatan: `Dibuat otomatis dari Disposisi Surat${item.nomor_surat ? ` (${item.nomor_surat})` : ''}.`,
          created_by: userId,
        });
        jadwalPimpinan = { id: jadwal.id };
      } catch (error: any) {
        console.error('[DisposisiSurat] Gagal membuat entri Jadwal Pimpinan otomatis:', error);
      }
    }

    return { ...item, notification, jadwalPimpinan };
  }

  // Kirim notifikasi WhatsApp ke sekretaris semua unit tujuan.
  // Mengikuti pola jadwal_pimpinan.sendNotificationToPendamping(), diperluas untuk banyak unit.
  async sendDisposisiNotification(disposisiId: number, userId: number) {
    const item = await prisma.tr_disposisi_surat.findUnique({
      where: { id: disposisiId },
    });

    if (!item) {
      throw new Error('Disposisi Surat tidak ditemukan');
    }

    const unitCodes = item.unit_code; // String[]
    const grouped = await this.getRecipientsByUnits(unitCodes);
    const unitResults: {
      unitCode: string;
      unitName: string;
      results: { nama: string; phone: string; status: string }[];
    }[] = [];

    const totalRecipients = grouped.reduce((n, g) => n + g.recipients.length, 0);
    if (totalRecipients === 0) {
      return {
        sent: 0,
        total: 0,
        message: `Tidak ada penerima notifikasi terdaftar untuk unit ${grouped.map((g) => g.unitName).join(', ')}`,
        unitResults: grouped.map((g) => ({ unitCode: g.unitCode, unitName: g.unitName, results: [] })),
      };
    }

    const session = await prisma.wa_sessions.findFirst({ where: { is_active: true } });

    // Dynamic import supaya tidak terjadi circular import
    const whatsappService = session ? (await import('../whatsapp/service.js')).whatsappService : null;

    for (const group of grouped) {
      const results: { nama: string; phone: string; status: string }[] = [];

      for (const r of group.recipients) {
        const namaSapaan = r.nama_panggilan || r.nama_lengkap;

        if (!session || !whatsappService) {
          results.push({
            nama: r.nama_lengkap,
            phone: r.nomor_wa || '-',
            status: 'gagal - sesi WhatsApp tidak aktif',
          });
          continue;
        }

        if (!r.nomor_wa) {
          results.push({
            nama: r.nama_lengkap,
            phone: '-',
            status: 'gagal - nomor WA tidak ada',
          });
          continue;
        }

        let message = `Yth. ${namaSapaan},\n\n`;
        message += `Terdapat disposisi baru untuk ${group.unitName}:\n\n`;
        message += `📄 Nomor Surat : ${item.nomor_surat || '-'}\n`;
        message += `📅 Tanggal Surat : ${formatTanggal(new Date(item.tanggal_surat))}\n`;
        message += `📋 Perihal : ${item.hal}\n`;
        message += `🏷️ Jenis : ${item.jenis_surat}\n`;
        message += `✍️ Disposisi : ${item.disposisi}\n`;
        message += `📝 Arahan : ${item.isi_disposisi || '-'}\n`;
        message += `📆 Tanggal Dispo : ${formatTanggal(new Date(item.tanggal_disposisi))}\n`;
        message += `⏰ Deadline : ${item.tanggal_deadline ? formatTanggal(new Date(item.tanggal_deadline)) : '-'}\n`;
        message += `\nMohon segera ditindaklanjuti.\n\n`;
        message += `Terima kasih.\n\n`;
        message += `- SETDIT PS`;

        try {
          await whatsappService.sendMessage(session.id, r.nomor_wa, message, userId);
          results.push({ nama: r.nama_lengkap, phone: r.nomor_wa, status: 'berhasil' });
        } catch (error: any) {
          results.push({
            nama: r.nama_lengkap,
            phone: r.nomor_wa,
            status: `gagal - ${error.message}`,
          });
        }
      }

      unitResults.push({ unitCode: group.unitCode, unitName: group.unitName, results });
    }

    const allResults = unitResults.flatMap((u) => u.results);
    const sent = allResults.filter((r) => r.status === 'berhasil').length;

    return {
      sent,
      total: allResults.length,
      message: session
        ? `Notifikasi dikirim ke ${sent} dari ${allResults.length} penerima di ${grouped.length} unit`
        : 'Tidak ada sesi WhatsApp yang aktif, notifikasi tidak terkirim',
      unitResults,
    };
  }

  async update(id: number, data: {
    nomor_surat?: string;
    tanggal_surat?: string;
    hal?: string;
    jenis_surat?: string;
    disposisi?: string;
    isi_disposisi?: string;
    tujuan_disposisi?: string;
    unit_codes?: string[];
    tanggal_disposisi?: string;
    tanggal_deadline?: string;
    pic?: string;
    status_tl?: string;
  }, userId: number) {
    const existing = await prisma.tr_disposisi_surat.findUnique({ where: { id } });
    if (!existing) throw new Error('Disposisi Surat tidak ditemukan');

    const { unit_codes, ...rest } = data;
    const updateData: any = { ...rest };

    if (data.tanggal_surat) {
      updateData.tanggal_surat = new Date(data.tanggal_surat);
    }
    if (data.tanggal_disposisi) {
      updateData.tanggal_disposisi = new Date(data.tanggal_disposisi);
    }
    if (data.tanggal_deadline) {
      updateData.tanggal_deadline = new Date(data.tanggal_deadline);
    }

    // Kalau unit tujuan diubah, hitung ulang pic & tujuan_disposisi otomatis
    if (unit_codes && unit_codes.length > 0) {
      const grouped = await this.getRecipientsByUnits(unit_codes);
      updateData.unit_code = unit_codes;
      updateData.tujuan_disposisi = unit_codes.map((code) => UNIT_DISPLAY_NAMES[code] || code).join(', ');
      updateData.pic = grouped.flatMap((g) => g.recipients.map((r) => r.nama_lengkap)).join(', ') || '-';
    }

    const updated = await prisma.tr_disposisi_surat.update({
      where: { id },
      data: updateData,
    });

    return updated;
  }

  async delete(id: number) {
    const existing = await prisma.tr_disposisi_surat.findUnique({ where: { id } });
    if (!existing) throw new Error('Disposisi Surat tidak ditemukan');

    await prisma.tr_disposisi_surat.delete({ where: { id } });
    return { message: 'Disposisi Surat berhasil dihapus' };
  }

  async updateStatusTL(id: number, status_tl: string) {
    const validStatuses = ['PROSES_TINDAK_LANJUT', 'TINDAK_LANJUT_SELESAI'];
    if (!validStatuses.includes(status_tl)) {
      throw new Error('Status TL tidak valid');
    }

    const updated = await prisma.tr_disposisi_surat.update({
      where: { id },
      data: { status_tl: status_tl as any },
    });

    return updated;
  }

  async getStats(userId: number, jabatanCodes: string[]) {
    const isAdminUser = await this.isAdmin(jabatanCodes);

    if (isAdminUser) {
      const [total, proses, selesai] = await Promise.all([
        prisma.tr_disposisi_surat.count(),
        prisma.tr_disposisi_surat.count({ where: { status_tl: 'PROSES_TINDAK_LANJUT' } }),
        prisma.tr_disposisi_surat.count({ where: { status_tl: 'TINDAK_LANJUT_SELESAI' } }),
      ]);
      return { total, proses, selesai };
    }

    // Non-admin: sama seperti findAll(), hanya hitung disposisi yang SEMUA unit
    // tujuannya ada dalam akses user (subset check, tidak bisa dilakukan di SQL).
    const accessibleUnits = await this.getUserUnitCodes(userId, jabatanCodes);

    if (accessibleUnits.length === 0) {
      return { total: 0, proses: 0, selesai: 0 };
    }

    const rows = await prisma.tr_disposisi_surat.findMany({
      where: { unit_code: { hasSome: accessibleUnits } },
      select: { unit_code: true, status_tl: true },
    });

    const visible = rows.filter((row) => row.unit_code.every((code) => accessibleUnits.includes(code)));

    return {
      total: visible.length,
      proses: visible.filter((r) => r.status_tl === 'PROSES_TINDAK_LANJUT').length,
      selesai: visible.filter((r) => r.status_tl === 'TINDAK_LANJUT_SELESAI').length,
    };
  }

  async getDropdownOptions() {
    // Opsi PIC diambil dari daftar penerima disposisi yang terdaftar,
    // dipakai hanya untuk filter tabel (form tidak lagi memilih PIC manual).
    const recipients = await prisma.mst_pegawai.findMany({
      where: { is_disposisi_recipient: true, is_active: true },
      select: { nama_lengkap: true },
      orderBy: { nama_lengkap: 'asc' },
    });

    return {
      disposisi: DISPOSISI_OPTIONS,
      tujuan_disposisi: TUJUAN_DISPOSISI_OPTIONS,
      unit_codes: Object.keys(UNIT_CODES).map((k) => ({ label: k, value: UNIT_CODES[k] })),
      pic: recipients.map((r) => r.nama_lengkap),
      jenis_surat: JENIS_SURAT_OPTIONS,
    };
  }

  // ============================================
  // Access Management
  // ============================================

  async getAccessList() {
    const accesses = await prisma.tr_disposisi_surat_access.findMany({
      include: {
        user: { select: { id: true, fullname: true, email: true } },
      },
      orderBy: { user: { fullname: 'asc' } },
    });

    return accesses;
  }

  async getUserAccess(userId: number) {
    const accesses = await prisma.tr_disposisi_surat_access.findMany({
      where: { user_id: userId },
    });

    return accesses;
  }

  async grantAccess(userId: number, unitCode: string, role: string = 'INPUTER') {
    const existing = await prisma.tr_disposisi_surat_access.findUnique({
      where: {
        user_id_unit_code: {
          user_id: userId,
          unit_code: unitCode,
        },
      },
    });

    if (existing) {
      throw new Error('User sudah memiliki akses ke unit ini');
    }

    const access = await prisma.tr_disposisi_surat_access.create({
      data: {
        user_id: userId,
        unit_code: unitCode,
        role: role as any,
      },
    });

    return access;
  }

  async revokeAccess(id: number) {
    const existing = await prisma.tr_disposisi_surat_access.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new Error('Akses tidak ditemukan');
    }

    await prisma.tr_disposisi_surat_access.delete({
      where: { id },
    });

    return { message: 'Akses berhasil dicabut' };
  }

  async getAllUsers() {
    const users = await prisma.mst_users.findMany({
      where: {
        deleted_at: null,
        status: 'ACTIVE',
      },
      select: {
        id: true,
        fullname: true,
        email: true,
        position: {
          select: { name: true, code: true },
        },
      },
      orderBy: { fullname: 'asc' },
    });

    return users;
  }
}

export const disposisiSuratService = new DisposisiSuratService();
