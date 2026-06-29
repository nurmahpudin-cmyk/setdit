import { Response, NextFunction } from 'express';
import { prisma } from '../config/database.js';
import { AuthRequest } from './auth.js';

export const requirePermission = (...permissions: string[]) => {
  return async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: 'Authentication required' });
        return;
      }

      const user = await prisma.mst_users.findUnique({
        where: { id: req.user.id },
        include: {
          roles: {
            include: {
              role: {
                include: {
                  permissions: {
                    include: { permission: true },
                  },
                },
              },
            },
          },
          permissions: {
            include: { permission: true },
          },
        },
      });

      if (!user) {
        res.status(401).json({ success: false, message: 'User not found' });
        return;
      }

      // Super Admin bypass
      const isSuperAdmin = user.roles.some((ur) => ur.role.is_super_admin);
      if (isSuperAdmin) {
        next();
        return;
      }

      // Get effective permissions
      const rolePermissions = user.roles.flatMap((ur) =>
        ur.role.permissions.map((rp) => rp.permission.code)
      );
      const directPermissions = user.permissions.map((up) => up.permission.code);
      const effectivePermissions = [...new Set([...rolePermissions, ...directPermissions])];

      // Check if user has ALL required permissions
      const hasAllPermissions = permissions.every((p) => effectivePermissions.includes(p));

      if (!hasAllPermissions) {
        res.status(403).json({
          success: false,
          message: 'You do not have permission to perform this action',
        });
        return;
      }

      next();
    } catch (error) {
      console.error('RBAC middleware error:', error);
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  };
};

export const requireAnyPermission = (...permissions: string[]) => {
  return async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: 'Authentication required' });
        return;
      }

      const user = await prisma.mst_users.findUnique({
        where: { id: req.user.id },
        include: {
          roles: {
            include: {
              role: {
                include: {
                  permissions: { include: { permission: true } },
                },
              },
            },
          },
          permissions: { include: { permission: true } },
        },
      });

      if (!user) {
        res.status(401).json({ success: false, message: 'User not found' });
        return;
      }

      const isSuperAdmin = user.roles.some((ur) => ur.role.is_super_admin);
      if (isSuperAdmin) {
        next();
        return;
      }

      const rolePermissions = user.roles.flatMap((ur) =>
        ur.role.permissions.map((rp) => rp.permission.code)
      );
      const directPermissions = user.permissions.map((up) => up.permission.code);
      const effectivePermissions = [...new Set([...rolePermissions, ...directPermissions])];

      const hasAnyPermission = permissions.some((p) => effectivePermissions.includes(p));

      if (!hasAnyPermission) {
        res.status(403).json({
          success: false,
          message: 'You do not have permission to perform this action',
        });
        return;
      }

      next();
    } catch (error) {
      console.error('RBAC middleware error:', error);
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  };
};
