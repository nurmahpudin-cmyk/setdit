import { prisma } from '../../config/database.js';

export class PegawaiService {
  async findAll(query?: { search?: string; page?: number; limit?: number }) {
    const page = query?.page || 1;
    const limit = query?.limit || 10;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (query?.search) {
      where.OR = [
        { nama_lengkap: { contains: query.search, mode: 'insensitive' } },
        { nama_panggilan: { contains: query.search, mode: 'insensitive' } },
        { nip: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    const [pegawai, total] = await Promise.all([
      prisma.mst_pegawai.findMany({
        where,
        include: {
          _count: { select: { jadwal_pendamping: true } },
        },
        skip,
        take: limit,
        orderBy: { nama_lengkap: 'asc' },
      }),
      prisma.mst_pegawai.count({ where }),
    ]);

    return {
      pegawai,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async findById(id: number) {
    const pegawai = await prisma.mst_pegawai.findUnique({
      where: { id },
      include: {
        jadwal_pendamping: {
          include: {
            jadwal: { select: { id: true, acara: true, tanggal_awal: true } },
          },
        },
      },
    });
    if (!pegawai) throw new Error('Pegawai tidak ditemukan');
    return pegawai;
  }

  async create(data: { nama_lengkap: string; nama_panggilan?: string; nip: string; nomor_wa?: string }) {
    const existing = await prisma.mst_pegawai.findFirst({
      where: { OR: [{ nip: data.nip }] },
    });
    if (existing) throw new Error('Pegawai dengan NIP ini sudah ada');

    return prisma.mst_pegawai.create({
      data: {
        nama_lengkap: data.nama_lengkap,
        nama_panggilan: data.nama_panggilan,
        nip: data.nip,
        nomor_wa: data.nomor_wa,
      },
    });
  }

  async update(id: number, data: { nama_lengkap?: string; nama_panggilan?: string; nip?: string; nomor_wa?: string; is_active?: boolean }) {
    const existing = await prisma.mst_pegawai.findUnique({ where: { id } });
    if (!existing) throw new Error('Pegawai tidak ditemukan');

    if (data.nip && data.nip !== existing.nip) {
      const dup = await prisma.mst_pegawai.findFirst({ where: { nip: data.nip } });
      if (dup) throw new Error('NIP sudah digunakan pegawai lain');
    }

    return prisma.mst_pegawai.update({
      where: { id },
      data,
    });
  }

  async delete(id: number) {
    const existing = await prisma.mst_pegawai.findUnique({ where: { id } });
    if (!existing) throw new Error('Pegawai tidak ditemukan');

    await prisma.mst_pegawai.delete({ where: { id } });
    return { message: 'Pegawai berhasil dihapus' };
  }

  async getAll() {
    return prisma.mst_pegawai.findMany({
      where: { is_active: true },
      select: { id: true, nama_lengkap: true, nama_panggilan: true, nip: true, nomor_wa: true },
      orderBy: { nama_lengkap: 'asc' },
    });
  }
}

export const pegawaiService = new PegawaiService();
