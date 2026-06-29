import { Request, Response } from 'express';
import { permissionsService } from './service.js';
import { apiResponse, apiError } from '../../utils/index.js';
import { z } from 'zod';

const createSchema = z.object({
  name: z.string().min(2).max(100),
  code: z.string().min(2).max(100).regex(/^[a-z_]+\.[a-z_]+$/),
  module: z.string().min(2).max(50),
  action: z.string().min(2).max(50),
  description: z.string().optional(),
});

const updateSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  description: z.string().optional(),
  is_active: z.boolean().optional(),
});

export class PermissionsController {
  async findAll(req: Request, res: Response) {
    try {
      const { search, module } = req.query;
      const permissions = await permissionsService.findAll({
        search: search as string,
        module: module as string,
      });
      apiResponse(res, permissions);
    } catch (error: any) {
      apiError(res, error.message, 400);
    }
  }

  async findById(req: Request, res: Response) {
    try {
      const permission = await permissionsService.findById(parseInt(req.params.id));
      apiResponse(res, permission);
    } catch (error: any) {
      apiError(res, error.message, 404);
    }
  }

  async create(req: Request, res: Response) {
    try {
      const data = createSchema.parse(req.body);
      const permission = await permissionsService.create(data);
      apiResponse(res, permission, 'Permission created', 201);
    } catch (error: any) {
      if (error instanceof z.ZodError) apiError(res, 'Validation error', 400, error.errors);
      else apiError(res, error.message, 400);
    }
  }

  async update(req: Request, res: Response) {
    try {
      const data = updateSchema.parse(req.body);
      const permission = await permissionsService.update(parseInt(req.params.id), data);
      apiResponse(res, permission, 'Permission updated');
    } catch (error: any) {
      if (error instanceof z.ZodError) apiError(res, 'Validation error', 400, error.errors);
      else apiError(res, error.message, 400);
    }
  }

  async delete(req: Request, res: Response) {
    try {
      const result = await permissionsService.delete(parseInt(req.params.id));
      apiResponse(res, result);
    } catch (error: any) {
      apiError(res, error.message, 400);
    }
  }

  async getModules(_req: Request, res: Response) {
    try {
      const modules = await permissionsService.getModules();
      apiResponse(res, modules);
    } catch (error: any) {
      apiError(res, error.message, 400);
    }
  }
}

export const permissionsController = new PermissionsController();