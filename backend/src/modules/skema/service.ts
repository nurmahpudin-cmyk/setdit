import { prisma } from '../../config/database.js';

export class SkemaService {
  async findAll(query?: { search?: string }) {
    const where: any = {};

    if (query?.search) {
      where.OR = [
        { nama_skema: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    return prisma.mst_skema.findMany({
      where,
      orderBy: { nama_skema: 'asc' },
    });
  }

  async findById(id: number) {
    const skema = await prisma.mst_skema.findUnique({ where: { id_skema: id } });
    if (!skema) throw new Error('Skema not found');
    return skema;
  }

  async create(data: { nama_skema: string }) {
    return prisma.mst_skema.create({ data });
  }

  async update(id: number, data: { nama_skema: string }) {
    const skema = await prisma.mst_skema.findUnique({ where: { id_skema: id } });
    if (!skema) throw new Error('Skema not found');

    return prisma.mst_skema.update({ where: { id_skema: id }, data });
  }

  async delete(id: number) {
    const skema = await prisma.mst_skema.findUnique({ where: { id_skema: id } });
    if (!skema) throw new Error('Skema not found');

    return prisma.mst_skema.delete({ where: { id_skema: id } });
  }
}

export const skemaService = new SkemaService();
