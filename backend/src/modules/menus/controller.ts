import { Request, Response } from 'express';
import { menusService } from './service.js';
import { apiResponse, apiError } from '../../utils/index.js';
import { z } from 'zod';
import { prisma } from '../../config/database.js';
import { AuthRequest } from '../../middleware/auth.js';

const createSchema = z.object({
  name: z.string().min(1).max(100),
  path: z.string().optional(),
  module: z.string().optional(),
  icon: z.string().optional(),
  order_num: z.union([z.number(), z.string()]).transform(v => typeof v === 'string' ? parseInt(v) : v).optional(),
  parent_id: z.union([z.number(), z.string()]).transform(v => typeof v === 'string' ? parseInt(v) : v).optional(),
});

const updateSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  path: z.string().optional(),
  module: z.string().optional(),
  icon: z.string().optional(),
  order_num: z.union([z.number(), z.string()]).transform(v => typeof v === 'string' ? parseInt(v) : v).optional(),
  parent_id: z.union([z.number(), z.string(), z.null()]).transform(v => v === null ? null : typeof v === 'string' ? parseInt(v) : v).optional(),
  is_active: z.boolean().optional(),
});

const assignPermissionsSchema = z.object({
  permission_ids: z.array(z.number().int().positive()),
});

export class MenusController {
  async findAll(_req: Request, res: Response) {
    try {
      const menus = await menusService.findAll();
      apiResponse(res, menus);
    } catch (error: any) {
      apiError(res, error.message, 400);
    }
  }

  async findById(req: Request, res: Response) {
    try {
      const menu = await menusService.findById(parseInt(req.params.id));
      apiResponse(res, menu);
    } catch (error: any) {
      apiError(res, error.message, 404);
    }
  }

  async create(req: Request, res: Response) {
    try {
      const data = createSchema.parse(req.body);
      const menu = await menusService.create(data);
      apiResponse(res, menu, 'Menu created', 201);
    } catch (error: any) {
      if (error instanceof z.ZodError) apiError(res, 'Validation error', 400, error.errors);
      else apiError(res, error.message, 400);
    }
  }

  async update(req: Request, res: Response) {
    try {
      const data = updateSchema.parse(req.body);
      const menu = await menusService.update(parseInt(req.params.id), data);
      apiResponse(res, menu, 'Menu updated');
    } catch (error: any) {
      if (error instanceof z.ZodError) apiError(res, 'Validation error', 400, error.errors);
      else apiError(res, error.message, 400);
    }
  }

  async delete(req: Request, res: Response) {
    try {
      const result = await menusService.delete(parseInt(req.params.id));
      apiResponse(res, result);
    } catch (error: any) {
      apiError(res, error.message, 400);
    }
  }

  async assignPermissions(req: Request, res: Response) {
    try {
      const data = assignPermissionsSchema.parse(req.body);
      const result = await menusService.assignPermissions(parseInt(req.params.id), data.permission_ids);
      apiResponse(res, result);
    } catch (error: any) {
      if (error instanceof z.ZodError) apiError(res, 'Validation error', 400, error.errors);
      else apiError(res, error.message, 400);
    }
  }

  async getPermissions(req: Request, res: Response) {
    try {
      const permissions = await menusService.getPermissions(parseInt(req.params.id));
      apiResponse(res, permissions);
    } catch (error: any) {
      apiError(res, error.message, 400);
    }
  }

  async getVisibleMenus(req: AuthRequest, res: Response) {
    try {
      const user = await prisma.mst_users.findUnique({
        where: { id: req.user!.id },
        include: {
          roles: { include: { role: { include: { permissions: { include: { permission: true } } } } } },
          permissions: { include: { permission: true } },
        },
      });
      if (!user) throw new Error('User not found');

      const isSuperAdmin = user.roles.some((ur) => ur.role.is_super_admin);
      if (isSuperAdmin) {
        const allMenus = await menusService.findAll();
        apiResponse(res, allMenus);
        return;
      }

      const rolePerms = user.roles.flatMap((ur) =>
        ur.role.permissions.map((rp) => rp.permission.code)
      );
      const directPerms = user.permissions.map((up) => up.permission.code);
      const effectivePermissions = [...new Set([...rolePerms, ...directPerms])];

      const menus = await menusService.getVisibleMenus(effectivePermissions);
      apiResponse(res, menus);
    } catch (error: any) {
      apiError(res, error.message, 400);
    }
  }
}

export const menusController = new MenusController();
