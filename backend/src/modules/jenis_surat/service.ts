import { prisma } from '../../config/database.js';

export class JenisSuratService {
  async findAll(search?: string) {
    const where = search
      ? {
          OR: [
            { nama_jenis_surat: { contains: search, mode: 'insensitive' as const } },
          ],
        }
      : {};

    return prisma.mst_jenis_surat.findMany({
      where,
      orderBy: { nama_jenis_surat: 'asc' },
    });
  }

  async findById(id: string) {
    const jenisSurat = await prisma.mst_jenis_surat.findUnique({
      where: { id },
    });
    if (!jenisSurat) throw new Error('Jenis surat not found');
    return jenisSurat;
  }

  async create(data: { nama_jenis_surat: string; status?: boolean }) {
    const existing = await prisma.mst_jenis_surat.findFirst({
      where: { nama_jenis_surat: data.nama_jenis_surat },
    });
    if (existing) throw new Error('Jenis surat already exists');

    return prisma.mst_jenis_surat.create({
      data: {
        nama_jenis_surat: data.nama_jenis_surat,
        status: data.status ?? true,
      },
    });
  }

  async update(id: string, data: { nama_jenis_surat?: string; status?: boolean }) {
    const existing = await prisma.mst_jenis_surat.findUnique({ where: { id } });
    if (!existing) throw new Error('Jenis surat not found');

    if (data.nama_jenis_surat && data.nama_jenis_surat !== existing.nama_jenis_surat) {
      const duplicate = await prisma.mst_jenis_surat.findFirst({
        where: { nama_jenis_surat: data.nama_jenis_surat },
      });
      if (duplicate) throw new Error('Jenis surat already exists');
    }

    return prisma.mst_jenis_surat.update({
      where: { id },
      data,
    });
  }

  async delete(id: string) {
    const existing = await prisma.mst_jenis_surat.findUnique({ where: { id } });
    if (!existing) throw new Error('Jenis surat not found');

    await prisma.mst_jenis_surat.delete({ where: { id } });
    return { message: 'Jenis surat deleted' };
  }
}

export const jenisSuratService = new JenisSuratService();
