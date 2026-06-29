import { Response, NextFunction } from 'express';
import { AuthRequest } from './auth.js';
import { prisma } from '../config/database.js';

export const createAuditLog = async (
  req: AuthRequest,
  module: string,
  action: string,
  oldData?: any,
  newData?: any
) => {
  try {
    await prisma.activity_logs.create({
      data: {
        user_id: req.user?.id,
        module,
        action,
        old_data: oldData || undefined,
        new_data: newData || undefined,
        ip_address: req.ip || req.socket.remoteAddress,
        user_agent: req.headers['user-agent'] || '',
      },
    });
  } catch (error) {
    console.error('Failed to create audit log:', error);
  }
};

export const auditMiddleware = (module: string) => {
  return async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    const originalJson = res.json.bind(res);

    res.json = function (body: any) {
      if (res.statusCode >= 200 && res.statusCode < 300 && body?.success) {
        const action = getActionFromMethod(req.method, module);
        if (action) {
          createAuditLog(req, module, action, undefined, body.data);
        }
      }
      return originalJson(body);
    };

    next();
  };
};

function getActionFromMethod(method: string, module: string): string {
  switch (method) {
    case 'POST':
      return `${module}.create`;
    case 'PUT':
    case 'PATCH':
      return `${module}.update`;
    case 'DELETE':
      return `${module}.delete`;
    default:
      return `${module}.view`;
  }
}
