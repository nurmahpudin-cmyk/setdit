import { prisma } from '../../config/database.js';

export class UnitsService {
  async findAll(query?: { search?: string; is_active?: boolean; parent_id?: number }) {
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
    if (query?.parent_id !== undefined) {
      where.parent_id = query.parent_id;
    }

    return prisma.mst_units.findMany({
      where,
      include: {
        parent: { select: { id: true, name: true } },
        _count: { select: { users: true, children: true } },
      },
      orderBy: { name: 'asc' },
    });
  }

  async findById(id: number) {
    const unit = await prisma.mst_units.findUnique({
      where: { id },
      include: {
        parent: true,
        children: { select: { id: true, name: true, code: true } },
        _count: { select: { users: true } },
      },
    });
    if (!unit) throw new Error('Unit not found');
    return unit;
  }

  async create(data: { name: string; code: string; parent_id?: number }) {
    const existing = await prisma.mst_units.findFirst({
      where: { OR: [{ name: data.name }, { code: data.code }] },
    });
    if (existing) throw new Error('Unit already exists');

    return prisma.mst_units.create({ data });
  }

  async update(id: number, data: { name?: string; code?: string; parent_id?: number | null; is_active?: boolean }) {
    const unit = await prisma.mst_units.findUnique({ where: { id } });
    if (!unit) throw new Error('Unit not found');

    return prisma.mst_units.update({ where: { id }, data });
  }

  async delete(id: number) {
    const unit = await prisma.mst_units.findUnique({ where: { id } });
    if (!unit) throw new Error('Unit not found');

    await prisma.mst_units.delete({ where: { id } });
    return { message: 'Unit deleted' };
  }
}

export const unitsService = new UnitsService();