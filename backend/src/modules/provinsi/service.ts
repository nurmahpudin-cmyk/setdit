import { prisma } from '../../config/database.js';

export class ProvinsiService {
  async findAll(query?: { search?: string }) {
    const where: any = {
      deleted_at: null,
    };

    if (query?.search) {
      where.OR = [
        { provinsi: { contains: query.search, mode: 'insensitive' } },
        { proid: { contains: query.search, mode: 'insensitive' } },
        { nama_gubernur: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    return prisma.mst_provinsi.findMany({
      where,
      orderBy: { provinsi: 'asc' },
    });
  }

  async findById(proid: string) {
    const provinsi = await prisma.mst_provinsi.findUnique({
      where: { proid },
    });
    if (!provinsi) throw new Error('Provinsi not found');
    return provinsi;
  }

  async create(data: {
    proid: string;
    provinsi: string;
    nama_gubern?: string;
    email?: string;
    wilayah?: string;
    nama_dinas?: string;
    sk_perkembangan?: string;
    tgl_sk_perkembangan?: Date;
  }) {
    const existing = await prisma.mst_provinsi.findUnique({ where: { proid: data.proid } });
    if (existing) throw new Error('Provinsi dengan ID ini sudah ada');

    return prisma.mst_provinsi.create({
      data: {
        proid: data.proid,
        provinsi: data.provinsi,
        nama_gubern: data.nama_gubern,
        email: data.email,
        wilayah: data.wilayah,
        nama_dinas: data.nama_dinas,
        sk_perkembangan: data.sk_perkembangan,
        tgl_sk_perkembangan: data.tgl_sk_perkembangan,
      },
    });
  }

  async update(proid: string, data: Partial<{
    provinsi: string;
    nama_gubern: string;
    email: string;
    wilayah: string;
    nama_dinas: string;
    sk_perkembangan: string;
    tgl_sk_perkembangan: Date;
  }>) {
    const provinsi = await prisma.mst_provinsi.findUnique({ where: { proid } });
    if (!provinsi) throw new Error('Provinsi not found');

    return prisma.mst_provinsi.update({ where: { proid }, data });
  }

  async delete(proid: string) {
    const provinsi = await prisma.mst_provinsi.findUnique({ where: { proid } });
    if (!provinsi) throw new Error('Provinsi not found');

    return prisma.mst_provinsi.update({
      where: { proid },
      data: { deleted_at: new Date() },
    });
  }
}

export const provinsiService = new ProvinsiService();
