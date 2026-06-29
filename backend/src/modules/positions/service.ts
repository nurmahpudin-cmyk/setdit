import { prisma } from '../../config/database.js';

export class PositionsService {
  async findAll(query?: { search?: string; is_active?: boolean }) {
    const where: any = {};
    if (query?.search) {
      where.OR = [
        { name: { contains: query.search, mode: 'insensitive' } },
        { code: { contains: query.search, mode: 'insensitive' } },
      ];
    }
    if (query?.is_active !== undefined) {
      where.is_active = query.is_active;
    }

    return prisma.mst_positions.findMany({
      where,
      include: { _count: { select: { users: true } } },
      orderBy: { name: 'asc' },
    });
  }

  async findById(id: number) {
    const position = await prisma.mst_positions.findUnique({
      where: { id },
      include: { _count: { select: { users: true } } },
    });
    if (!position) throw new Error('Position not found');
    return position;
  }

  async create(data: { name: string; code: string }) {
    const existing = await prisma.mst_positions.findFirst({
      where: { OR: [{ name: data.name }, { code: data.code }] },
    });
    if (existing) throw new Error('Position already exists');

    return prisma.mst_positions.create({ data });
  }

  async update(id: number, data: { name?: string; code?: string; is_active?: boolean }) {
    const position = await prisma.mst_positions.findUnique({ where: { id } });
    if (!position) throw new Error('Position not found');

    return prisma.mst_positions.update({ where: { id }, data });
  }

  async delete(id: number) {
    const position = await prisma.mst_positions.findUnique({ where: { id } });
    if (!position) throw new Error('Position not found');

    await prisma.mst_positions.delete({ where: { id } });
    return { message: 'Position deleted' };
  }
}

export const positionsService = new PositionsService();