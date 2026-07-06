import { Request, Response } from 'express';
import { usersService } from './service.js';
import { apiResponse, apiError, paginatedResponse } from '../../utils/index.js';
import { z } from 'zod';

const createSchema = z.object({
  fullname: z.string().min(2).max(100),
  username: z.string().min(3).max(50).regex(/^[a-zA-Z0-9_]+$/),
  email: z.string().email(),
  phone: z.string().min(10).max(20),
  password: z.string().min(8),
  unit_id: z.number().int().positive().optional(),
  role_ids: z.array(z.number().int().positive()).optional(),
  jabatan_code: z.string().optional(),
});

const updateSchema = z.object({
  fullname: z.string().min(2).max(100).optional(),
  email: z.string().email().optional(),
  phone: z.string().min(10).max(20).optional(),
  unit_id: z.number().int().positive().optional().nullable(),
  role_ids: z.array(z.number().int().positive()).optional(),
  jabatan_code: z.string().optional().nullable(),
});

const assignRolesSchema = z.object({
  role_ids: z.array(z.number().int().positive()),
});

const approveSchema = z.object({
  status: z.enum(['APPROVED', 'REJECTED']),
  notes: z.string().optional(),
});

export class UsersController {
  async findAll(req: Request, res: Response) {
    try {
      const { page, limit, search, status, unit_id, position_id } = req.query;
      const result = await usersService.findAll({
        page: page ? parseInt(page as string) : undefined,
        limit: limit ? parseInt(limit as string) : undefined,
        search: search as string,
        status: status as string,
        unit_id: unit_id ? parseInt(unit_id as string) : undefined,
        position_id: position_id ? parseInt(position_id as string) : undefined,
      });
      paginatedResponse(res, result.users, result.pagination);
    } catch (error: any) {
      apiError(res, error.message, 400);
    }
  }

  async findById(req: Request, res: Response) {
    try {
      const user = await usersService.findById(parseInt(req.params.id));
      apiResponse(res, user);
    } catch (error: any) {
      apiError(res, error.message, 404);
    }
  }

  async create(req: Request, res: Response) {
    try {
      const data = createSchema.parse(req.body);
      const user = await usersService.create(data);
      apiResponse(res, user, 'User created', 201);
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        apiError(res, 'Validation error', 400, error.errors);
      } else {
        apiError(res, error.message, 400);
      }
    }
  }

  async update(req: Request, res: Response) {
    try {
      const data = updateSchema.parse(req.body);
      const user = await usersService.update(parseInt(req.params.id), data);
      apiResponse(res, user, 'User updated');
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        apiError(res, 'Validation error', 400, error.errors);
      } else {
        apiError(res, error.message, 400);
      }
    }
  }

  async delete(req: Request, res: Response) {
    try {
      const result = await usersService.delete(parseInt(req.params.id));
      apiResponse(res, result);
    } catch (error: any) {
      apiError(res, error.message, 400);
    }
  }

  async approve(req: Request, res: Response) {
    try {
      const authReq = req as any;
      const data = approveSchema.parse(req.body);
      const result = await usersService.approve(
        parseInt(req.params.id),
        authReq.user.id,
        data.status,
        data.notes
      );
      apiResponse(res, result);
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        apiError(res, 'Validation error', 400, error.errors);
      } else {
        apiError(res, error.message, 400);
      }
    }
  }

  async activate(req: Request, res: Response) {
    try {
      const result = await usersService.activate(parseInt(req.params.id));
      apiResponse(res, result);
    } catch (error: any) {
      apiError(res, error.message, 400);
    }
  }

  async deactivate(req: Request, res: Response) {
    try {
      const result = await usersService.deactivate(parseInt(req.params.id));
      apiResponse(res, result);
    } catch (error: any) {
      apiError(res, error.message, 400);
    }
  }

  async assignRoles(req: Request, res: Response) {
    try {
      const data = assignRolesSchema.parse(req.body);
      const result = await usersService.assignRoles(parseInt(req.params.id), data.role_ids);
      apiResponse(res, result);
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        apiError(res, 'Validation error', 400, error.errors);
      } else {
        apiError(res, error.message, 400);
      }
    }
  }

  async getEffectivePermissions(req: Request, res: Response) {
    try {
      const result = await usersService.getEffectivePermissions(parseInt(req.params.id));
      apiResponse(res, result);
    } catch (error: any) {
      apiError(res, error.message, 400);
    }
  }
}

export const usersController = new UsersController();