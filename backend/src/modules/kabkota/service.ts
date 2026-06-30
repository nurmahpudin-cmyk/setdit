import { prisma } from '../../config/database.js';

export class KabkotaService {
  async findAll(query?: { search?: string; proid?: string }) {
    const where: any = {};

    if (query?.search) {
      where.OR = [
        { kabkota: { contains: query.search, mode: 'insensitive' } },
        { kabid: { contains: query.search, mode: 'insensitive' } },
        { nama_walikota: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    if (query?.proid) {
      where.proid = query.proid;
    }

    return prisma.mst_kabkota.findMany({
      where,
      orderBy: { kabkota: 'asc' },
    });
  }

  async findById(kabid: string) {
    const kabkota = await prisma.mst_kabkota.findUnique({ where: { kabid } });
    if (!kabkota) throw new Error('Kabupaten/Kota not found');
    return kabkota;
  }

  async create(data: {
    kabid: string;
    kabkota: string;
    proid?: string;
    nama_walikota?: string;
    email?: string;
  }) {
    const existing = await prisma.mst_kabkota.findUnique({ where: { kabid: data.kabid } });
    if (existing) throw new Error('Kabupaten/Kota dengan ID ini sudah ada');

    return prisma.mst_kabkota.create({
      data: {
        kabid: data.kabid,
        kabkota: data.kabkota,
        proid: data.proid,
        nama_walikota: data.nama_walikota,
        email: data.email,
      },
    });
  }

  async update(kabid: string, data: Partial<{
    kabkota: string;
    proid: string;
    nama_walikota: string;
    email: string;
  }>) {
    const kabkota = await prisma.mst_kabkota.findUnique({ where: { kabid } });
    if (!kabkota) throw new Error('Kabupaten/Kota not found');

    return prisma.mst_kabkota.update({ where: { kabid }, data });
  }

  async delete(kabid: string) {
    const kabkota = await prisma.mst_kabkota.findUnique({ where: { kabid } });
    if (!kabkota) throw new Error('Kabupaten/Kota not found');

    return prisma.mst_kabkota.delete({ where: { kabid } });
  }
}

export const kabkotaService = new KabkotaService();
