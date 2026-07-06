import { prisma } from '../../config/database.js';
import { hashPassword } from '../../utils/index.js';
import type { AuthRequest } from '../../middleware/auth.js';

export class UsersService {
  async findAll(query: {
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
    unit_id?: number;
    position_id?: number;
  }) {
    const page = query.page || 1;
    const limit = query.limit || 10;
    const skip = (page - 1) * limit;

    const where: any = {
      deleted_at: null,
    };

    if (query.search) {
      where.OR = [
        { fullname: { contains: query.search, mode: 'insensitive' } },
        { username: { contains: query.search, mode: 'insensitive' } },
        { email: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    if (query.status) {
      where.status = query.status;
    }

    if (query.unit_id) {
      where.unit_id = query.unit_id;
    }

    if (query.position_id) {
      where.position_id = query.position_id;
    }

    const [users, total] = await Promise.all([
      prisma.mst_users.findMany({
        where,
        include: {
          position: true,
          unit: true,
          roles: { include: { role: true } },
          jabatan_assignments: { where: { is_active: true }, select: { jabatan_code: true } },
        },
        skip,
        take: limit,
        orderBy: { created_at: 'desc' },
      }),
      prisma.mst_users.count({ where }),
    ]);

    const sanitized = users.map((u) => {
      const { password, jabatan_assignments, ...rest } = u;
      return {
        ...rest,
        jabatan_codes: jabatan_assignments.map((ja) => ja.jabatan_code),
      };
    });

    return { users: sanitized, pagination: { page, limit, total } };
  }

  async findById(id: number) {
    const user = await prisma.mst_users.findUnique({
      where: { id, deleted_at: null },
      include: {
        position: true,
        unit: true,
        roles: { include: { role: true } },
        permissions: { include: { permission: true } },
        jabatan_assignments: { where: { is_active: true }, select: { jabatan_code: true } },
      },
    });

    if (!user) {
      throw new Error('User not found');
    }

    const { password, jabatan_assignments, ...rest } = user;
    return {
      ...rest,
      jabatan_codes: jabatan_assignments.map((ja) => ja.jabatan_code),
    };
  }

  async create(data: {
    fullname: string;
    username: string;
    email: string;
    phone: string;
    password: string;
    unit_id?: number;
    role_ids?: number[];
    jabatan_code?: string;
  }) {
    const existing = await prisma.mst_users.findFirst({
      where: {
        OR: [{ email: data.email }, { username: data.username }],
      },
    });

    if (existing) {
      throw new Error('User already exists');
    }

    const hashedPassword = await hashPassword(data.password);

    // Create user first
    const user = await prisma.mst_users.create({
      data: {
        fullname: data.fullname,
        username: data.username,
        email: data.email,
        phone: data.phone,
        password: hashedPassword,
        unit_id: data.unit_id,
        status: 'ACTIVE',
        is_verified: true,
        roles: data.role_ids?.length
          ? { create: data.role_ids.map((role_id) => ({ role_id })) }
          : undefined,
      },
      include: {
        unit: true,
        roles: { include: { role: true } },
      },
    });

    // Assign jabatan if provided
    if (data.jabatan_code) {
      await prisma.tr_jabatan_assignment.create({
        data: {
          user_id: user.id,
          jabatan_code: data.jabatan_code,
          is_active: true,
        },
      });
    }

    const { password, ...rest } = user;
    return {
      ...rest,
      jabatan_codes: data.jabatan_code ? [data.jabatan_code] : [],
    };
  }

  async update(id: number, data: Partial<{
    fullname: string;
    email: string;
    phone: string;
    position_id: number;
    unit_id: number;
    role_ids: number[];
    jabatan_code: string | null;
  }>) {
    const user = await prisma.mst_users.findUnique({ where: { id, deleted_at: null } });
    if (!user) throw new Error('User not found');

    const { role_ids, jabatan_code, ...userData } = data;

    const updated = await prisma.mst_users.update({
      where: { id },
      data: userData,
      include: {
        position: true,
        unit: true,
        roles: { include: { role: true } },
      },
    });

    // Handle role_ids assignment
    if (role_ids !== undefined) {
      await prisma.tr_user_roles.deleteMany({ where: { user_id: id } });
      if (role_ids.length > 0) {
        await prisma.tr_user_roles.createMany({
          data: role_ids.map((role_id) => ({ user_id: id, role_id })),
        });
      }
    }

    // Handle jabatan_code assignment
    if (jabatan_code !== undefined) {
      // Delete existing assignments
      await prisma.tr_jabatan_assignment.deleteMany({
        where: { user_id: id },
      });

      // Create new assignment if provided
      if (jabatan_code) {
        await prisma.tr_jabatan_assignment.create({
          data: {
            user_id: id,
            jabatan_code: jabatan_code,
            is_active: true,
          },
        });
      }
    }

    // Get updated jabatan_codes
    const assignments = await prisma.tr_jabatan_assignment.findMany({
      where: { user_id: id, is_active: true },
      select: { jabatan_code: true },
    });

    // Get updated roles
    const roles = await prisma.tr_user_roles.findMany({
      where: { user_id: id },
      include: { role: true },
    });

    const { password, ...rest } = updated;
    return {
      ...rest,
      roles,
      jabatan_codes: assignments.map((a) => a.jabatan_code),
    };
  }

  async delete(id: number) {
    await prisma.mst_users.update({
      where: { id },
      data: { deleted_at: new Date() },
    });
    return { message: 'User deleted successfully' };
  }

  async approve(id: number, approverId: number, status: 'APPROVED' | 'REJECTED', notes?: string) {
    const user = await prisma.mst_users.findUnique({ where: { id, deleted_at: null } });
    if (!user) throw new Error('User not found');

    await prisma.tr_user_approval.updateMany({
      where: { user_id: id, status: 'PENDING' },
      data: { status, approver_id: approverId, notes },
    });

    if (status === 'APPROVED') {
      await prisma.mst_users.update({
        where: { id },
        data: { status: 'ACTIVE' },
      });
    } else {
      await prisma.mst_users.update({
        where: { id },
        data: { status: 'REJECTED' },
      });
    }

    return { message: `User ${status.toLowerCase()}` };
  }

  async activate(id: number) {
    await prisma.mst_users.update({
      where: { id, deleted_at: null },
      data: { status: 'ACTIVE' },
    });
    return { message: 'User activated' };
  }

  async deactivate(id: number) {
    await prisma.mst_users.update({
      where: { id, deleted_at: null },
      data: { status: 'INACTIVE' },
    });
    return { message: 'User deactivated' };
  }

  async assignRoles(userId: number, roleIds: number[]) {
    await prisma.tr_user_roles.deleteMany({ where: { user_id: userId } });

    if (roleIds.length > 0) {
      await prisma.tr_user_roles.createMany({
        data: roleIds.map((role_id) => ({ user_id: userId, role_id })),
      });
    }

    return { message: 'Roles assigned' };
  }

  async getEffectivePermissions(userId: number) {
    const user = await prisma.mst_users.findUnique({
      where: { id: userId, deleted_at: null },
      include: {
        roles: {
          include: {
            role: {
              include: { permissions: { include: { permission: true } } },
            },
          },
        },
        permissions: { include: { permission: true } },
      },
    });

    if (!user) throw new Error('User not found');

    const rolePermissions = user.roles.flatMap((ur) =>
      ur.role.permissions.map((rp) => rp.permission.code)
    );
    const directPermissions = user.permissions.map((up) => up.permission.code);
    const effective = [...new Set([...rolePermissions, ...directPermissions])];

    const isSuperAdmin = user.roles.some((ur) => ur.role.is_super_admin);

    return { permissions: effective, is_super_admin: isSuperAdmin };
  }
}

export const usersService = new UsersService();