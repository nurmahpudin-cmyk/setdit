import { Request, Response } from 'express';
import { rolesService } from './service.js';
import { apiResponse, apiError } from '../../utils/index.js';
import { z } from 'zod';

const createSchema = z.object({
  name: z.string().min(2).max(100),
  code: z.string().min(2).max(50).regex(/^[A-Z_]+$/),
  description: z.string().optional(),
  is_super_admin: z.boolean().optional(),
});

const updateSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  description: z.string().optional(),
  is_active: z.boolean().optional(),
});

const assignPermissionsSchema = z.object({
  permission_ids: z.array(z.number().int().positive()),
});

export class RolesController {
  async findAll(_req: Request, res: Response) {
    try {
      const roles = await rolesService.findAll();
      apiResponse(res, roles);
    } catch (error: any) {
      apiError(res, error.message, 400);
    }
  }

  async findById(req: Request, res: Response) {
    try {
      const role = await rolesService.findById(parseInt(req.params.id));
      apiResponse(res, role);
    } catch (error: any) {
      apiError(res, error.message, 404);
    }
  }

  async create(req: Request, res: Response) {
    try {
      const data = createSchema.parse(req.body);
      const role = await rolesService.create(data);
      apiResponse(res, role, 'Role created', 201);
    } catch (error: any) {
      if (error instanceof z.ZodError) apiError(res, 'Validation error', 400, error.errors);
      else apiError(res, error.message, 400);
    }
  }

  async update(req: Request, res: Response) {
    try {
      const data = updateSchema.parse(req.body);
      const role = await rolesService.update(parseInt(req.params.id), data);
      apiResponse(res, role, 'Role updated');
    } catch (error: any) {
      if (error instanceof z.ZodError) apiError(res, 'Validation error', 400, error.errors);
      else apiError(res, error.message, 400);
    }
  }

  async delete(req: Request, res: Response) {
    try {
      const result = await rolesService.delete(parseInt(req.params.id));
      apiResponse(res, result);
    } catch (error: any) {
      apiError(res, error.message, 400);
    }
  }

  async assignPermissions(req: Request, res: Response) {
    try {
      const data = assignPermissionsSchema.parse(req.body);
      const result = await rolesService.assignPermissions(parseInt(req.params.id), data.permission_ids);
      apiResponse(res, result);
    } catch (error: any) {
      if (error instanceof z.ZodError) apiError(res, 'Validation error', 400, error.errors);
      else apiError(res, error.message, 400);
    }
  }

  async getPermissions(req: Request, res: Response) {
    try {
      const permissions = await rolesService.getPermissions(parseInt(req.params.id));
      apiResponse(res, permissions);
    } catch (error: any) {
      apiError(res, error.message, 400);
    }
  }
}

export const rolesController = new RolesController();