import { prisma } from '../../config/database.js';

export class RolesService {
  async findAll() {
    return prisma.mst_roles.findMany({
      include: {
        _count: { select: { users: true, permissions: true } },
      },
      orderBy: { name: 'asc' },
    });
  }

  async findById(id: number) {
    const role = await prisma.mst_roles.findUnique({
      where: { id },
      include: {
        permissions: { include: { permission: true } },
        users: { include: { user: { select: { id: true, fullname: true, email: true } } } },
      },
    });
    if (!role) throw new Error('Role not found');
    return role;
  }

  async create(data: { name: string; code: string; description?: string; is_super_admin?: boolean }) {
    const existing = await prisma.mst_roles.findFirst({
      where: { OR: [{ name: data.name }, { code: data.code }] },
    });
    if (existing) throw new Error('Role already exists');

    return prisma.mst_roles.create({
      data: {
        name: data.name,
        code: data.code,
        description: data.description || '',
        is_super_admin: data.is_super_admin || false,
      },
    });
  }

  async update(id: number, data: { name?: string; description?: string; is_active?: boolean }) {
    const role = await prisma.mst_roles.findUnique({ where: { id } });
    if (!role) throw new Error('Role not found');
    if (role.is_super_admin) throw new Error('Cannot modify Super Admin role');

    return prisma.mst_roles.update({
      where: { id },
      data,
    });
  }

  async delete(id: number) {
    const role = await prisma.mst_roles.findUnique({ where: { id } });
    if (!role) throw new Error('Role not found');
    if (role.is_super_admin) throw new Error('Cannot delete Super Admin role');

    await prisma.mst_roles.delete({ where: { id } });
    return { message: 'Role deleted' };
  }

  async assignPermissions(roleId: number, permissionIds: number[]) {
    await prisma.tr_role_permissions.deleteMany({ where: { role_id: roleId } });

    if (permissionIds.length > 0) {
      await prisma.tr_role_permissions.createMany({
        data: permissionIds.map((permission_id) => ({ role_id: roleId, permission_id })),
      });
    }

    return { message: 'Permissions assigned' };
  }

  async getPermissions(roleId: number) {
    const role = await prisma.mst_roles.findUnique({
      where: { id: roleId },
      include: {
        permissions: { include: { permission: true } },
      },
    });
    if (!role) throw new Error('Role not found');
    return role.permissions.map((rp) => rp.permission);
  }
}

export const rolesService = new RolesService();