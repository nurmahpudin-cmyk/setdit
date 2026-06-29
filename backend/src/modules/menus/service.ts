import { prisma } from '../../config/database.js';

export class MenusService {
  async findAll() {
    return prisma.mst_menus.findMany({
      include: {
        permissions: { include: { permission: true } },
        _count: { select: { children: true } },
      },
      orderBy: [{ order_num: 'asc' }, { name: 'asc' }],
    });
  }

  async findById(id: number) {
    const menu = await prisma.mst_menus.findUnique({
      where: { id },
      include: {
        permissions: { include: { permission: true } },
        children: {
          include: { permissions: { include: { permission: true } } },
          orderBy: { order_num: 'asc' },
        },
        parent: true,
      },
    });
    if (!menu) throw new Error('Menu not found');
    return menu;
  }

  async create(data: {
    name: string;
    path?: string;
    module?: string;
    icon?: string;
    order_num?: number;
    parent_id?: number;
  }) {
    if (data.parent_id) {
      const parent = await prisma.mst_menus.findUnique({ where: { id: data.parent_id } });
      if (!parent) throw new Error('Parent menu not found');
    }

    return prisma.mst_menus.create({
      data: {
        name: data.name,
        path: data.path || '',
        module: data.module || 'admin',
        icon: data.icon || '',
        order_num: data.order_num || 0,
        parent_id: data.parent_id,
      },
    });
  }

  async update(
    id: number,
    data: {
      name?: string;
      path?: string;
      module?: string;
      icon?: string;
      order_num?: number;
      parent_id?: number | null;
      is_active?: boolean;
    }
  ) {
    const menu = await prisma.mst_menus.findUnique({ where: { id } });
    if (!menu) throw new Error('Menu not found');

    if (data.parent_id !== undefined && data.parent_id !== null) {
      if (data.parent_id === id) throw new Error('Menu cannot be its own parent');
      const parent = await prisma.mst_menus.findUnique({ where: { id: data.parent_id } });
      if (!parent) throw new Error('Parent menu not found');
    }

    return prisma.mst_menus.update({ where: { id }, data });
  }

  async delete(id: number) {
    const menu = await prisma.mst_menus.findUnique({ where: { id } });
    if (!menu) throw new Error('Menu not found');

    await prisma.mst_menus.delete({ where: { id } });
    return { message: 'Menu deleted' };
  }

  async assignPermissions(menuId: number, permissionIds: number[]) {
    const menu = await prisma.mst_menus.findUnique({ where: { id: menuId } });
    if (!menu) throw new Error('Menu not found');

    await prisma.tr_menu_permissions.deleteMany({ where: { menu_id: menuId } });

    if (permissionIds.length > 0) {
      await prisma.tr_menu_permissions.createMany({
        data: permissionIds.map((permission_id) => ({ menu_id: menuId, permission_id })),
      });
    }

    return { message: 'Menu permissions assigned' };
  }

  async getPermissions(menuId: number) {
    const menu = await prisma.mst_menus.findUnique({
      where: { id: menuId },
      include: { permissions: { include: { permission: true } } },
    });
    if (!menu) throw new Error('Menu not found');
    return menu.permissions.map((mp) => mp.permission);
  }

  async getVisibleMenus(effectivePermissions: string[]) {
    // Get all active menus
    const allMenus = await prisma.mst_menus.findMany({
      where: { is_active: true },
      include: {
        permissions: { include: { permission: true } },
        children: {
          where: { is_active: true },
          include: { permissions: { include: { permission: true } } },
          orderBy: { order_num: 'asc' },
        },
      },
      orderBy: [{ order_num: 'asc' }, { name: 'asc' }],
    });

    // Filter menus: show if no permissions required, or user has at least one required permission
    return allMenus
      .filter((menu) => {
        const requiredPerms = menu.permissions.map((mp) => mp.permission.code);
        // No permissions required = public within auth, or user has at least one
        if (requiredPerms.length === 0) return true;
        return requiredPerms.some((p) => effectivePermissions.includes(p));
      })
      .map((menu) => ({
        ...menu,
        children: menu.children.filter((child) => {
          const childPerms = child.permissions.map((mp) => mp.permission.code);
          if (childPerms.length === 0) return true;
          return childPerms.some((p) => effectivePermissions.includes(p));
        }),
      }));
  }
}

export const menusService = new MenusService();
