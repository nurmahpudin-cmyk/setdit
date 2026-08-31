import { prisma } from '../../config/database.js';

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
  'Sesdit PS',
  'Dit. PKPS',
  'Dit. PKTHA',
  'Dit. PUPS',
  'Dit. PPS',
] as const;

export const UNIT_CODES: Record<string, string> = {
  'Sesdit PS': 'SESDIT_PS',
  'Dit. PKPS': 'DIT_PKPS',
  'Dit. PKTHA': 'DIT_PKTHA',
  'Dit. PUPS': 'DIT_PUPS',
  'Dit. PPS': 'DIT_PPS',
};

export const PIC_OPTIONS = [
  'Lucky',
  'Nabila',
  'Nurlia',
  'Tommy',
  'Dian',
  'Ika',
  'Rizma',
] as const;

export const JENIS_SURAT_OPTIONS = ['Undangan', 'Surat Dinas'] as const;

// Jabatan codes for role-based access
export const JABATAN_CODES = {
  TU_SETDITJEN: 'TU_SETDITJEN',
  DIRJEN_PS: 'DIRJEN_PS',
  SETDITJEN_PS: 'SETDITJEN_PS',
  SEKDITJEN_PS: 'SEKDITJEN_PS',
} as const;

// ============================================
// Service Class
// ============================================

export class DisposisiSuratService {
  // Check if user has admin access (SETDITJEN/SESDIT/Sekditjen)
  async isAdmin(jabatanCodes: string[]): Promise<boolean> {
    const adminCodes: string[] = [
      JABATAN_CODES.SETDITJEN_PS,
      JABATAN_CODES.SEKDITJEN_PS,
    ];
    return jabatanCodes.some((code) => adminCodes.includes(code));
  }

  // Check if user can create (TU_SETDITJEN)
  async canCreate(jabatanCodes: string[]): Promise<boolean> {
    return jabatanCodes.includes(JABATAN_CODES.TU_SETDITJEN);
  }

  // Check if user can dispose (DIRJEN_PS)
  async canDispose(jabatanCodes: string[]): Promise<boolean> {
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

    const where: any = {};

    // Access control - if not admin, filter by accessible units
    if (!isAdminUser && accessibleUnits.length > 0) {
      where.unit_code = { in: accessibleUnits };
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
      where.unit_code = query.unit_code;
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

  async create(data: {
    nomor_surat?: string;
    tanggal_surat: string;
    hal: string;
    jenis_surat: string;
    disposisi: string;
    isi_disposisi?: string;
    tujuan_disposisi: string;
    unit_code: string;
    tanggal_disposisi: string;
    tanggal_deadline?: string;
    pic: string;
  }, userId: number) {
    const item = await prisma.tr_disposisi_surat.create({
      data: {
        nomor_surat: data.nomor_surat || null,
        tanggal_surat: new Date(data.tanggal_surat),
        hal: data.hal,
        jenis_surat: data.jenis_surat,
        disposisi: data.disposisi,
        isi_disposisi: data.isi_disposisi || null,
        tujuan_disposisi: data.tujuan_disposisi,
        unit_code: data.unit_code,
        tanggal_disposisi: new Date(data.tanggal_disposisi),
        tanggal_deadline: data.tanggal_deadline ? new Date(data.tanggal_deadline) : null,
        pic: data.pic,
        status_tl: 'PROSES_TINDAK_LANJUT',
        created_by: userId,
      },
    });

    return item;
  }

  async update(id: number, data: {
    nomor_surat?: string;
    tanggal_surat?: string;
    hal?: string;
    jenis_surat?: string;
    disposisi?: string;
    isi_disposisi?: string;
    tujuan_disposisi?: string;
    unit_code?: string;
    tanggal_disposisi?: string;
    tanggal_deadline?: string;
    pic?: string;
    status_tl?: string;
  }, userId: number) {
    const existing = await prisma.tr_disposisi_surat.findUnique({ where: { id } });
    if (!existing) throw new Error('Disposisi Surat tidak ditemukan');

    const updateData: any = { ...data };

    if (data.tanggal_surat) {
      updateData.tanggal_surat = new Date(data.tanggal_surat);
    }
    if (data.tanggal_disposisi) {
      updateData.tanggal_disposisi = new Date(data.tanggal_disposisi);
    }
    if (data.tanggal_deadline) {
      updateData.tanggal_deadline = new Date(data.tanggal_deadline);
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
    const accessibleUnits = await this.getUserUnitCodes(userId, jabatanCodes);

    const where: any = {};

    if (!isAdminUser && accessibleUnits.length > 0) {
      where.unit_code = { in: accessibleUnits };
    }

    const [total, proses, selesai] = await Promise.all([
      prisma.tr_disposisi_surat.count({ where }),
      prisma.tr_disposisi_surat.count({
        where: { ...where, status_tl: 'PROSES_TINDAK_LANJUT' },
      }),
      prisma.tr_disposisi_surat.count({
        where: { ...where, status_tl: 'TINDAK_LANJUT_SELESAI' },
      }),
    ]);

    return { total, proses, selesai };
  }

  async getDropdownOptions() {
    return {
      disposisi: DISPOSISI_OPTIONS,
      tujuan_disposisi: TUJUAN_DISPOSISI_OPTIONS,
      unit_codes: Object.keys(UNIT_CODES).map((k) => ({ label: k, value: UNIT_CODES[k] })),
      pic: PIC_OPTIONS,
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
