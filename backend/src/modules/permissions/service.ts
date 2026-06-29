import { prisma } from '../../config/database.js';

export class PermissionsService {
  async findAll(query?: { search?: string; module?: string }) {
    const where: any = {};
    if (query?.search) {
      where.OR = [
        { name: { contains: query.search, mode: 'insensitive' } },
        { code: { contains: query.search, mode: 'insensitive' } },
      ];
    }
    if (query?.module) {
      where.module = query.module;
    }

    return prisma.mst_permissions.findMany({
      where,
      orderBy: [{ module: 'asc' }, { action: 'asc' }],
    });
  }

  async findById(id: number) {
    const permission = await prisma.mst_permissions.findUnique({
      where: { id },
      include: {
        _count: { select: { role_permissions: true, user_permissions: true } },
      },
    });
    if (!permission) throw new Error('Permission not found');
    return permission;
  }

  async create(data: { name: string; code: string; module: string; action: string; description?: string }) {
    const existing = await prisma.mst_permissions.findFirst({
      where: { OR: [{ name: data.name }, { code: data.code }] },
    });
    if (existing) throw new Error('Permission already exists');

    return prisma.mst_permissions.create({
      data: {
        name: data.name,
        code: data.code,
        module: data.module,
        action: data.action,
        description: data.description || '',
      },
    });
  }

  async update(id: number, data: { name?: string; description?: string; is_active?: boolean }) {
    const permission = await prisma.mst_permissions.findUnique({ where: { id } });
    if (!permission) throw new Error('Permission not found');

    return prisma.mst_permissions.update({
      where: { id },
      data,
    });
  }

  async delete(id: number) {
    const permission = await prisma.mst_permissions.findUnique({ where: { id } });
    if (!permission) throw new Error('Permission not found');

    await prisma.mst_permissions.delete({ where: { id } });
    return { message: 'Permission deleted' };
  }

  async getModules() {
    const modules = await prisma.mst_permissions.findMany({
      select: { module: true },
      distinct: ['module'],
      orderBy: { module: 'asc' },
    });
    return modules.map((m) => m.module);
  }
}

export const permissionsService = new PermissionsService();