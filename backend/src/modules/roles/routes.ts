import { Router } from 'express';
import { rolesController } from './controller.js';
import { authMiddleware } from '../../middleware/auth.js';
import { requirePermission } from '../../middleware/rbac.js';

const router = Router();
router.use(authMiddleware);

router.get('/', requirePermission('role.view', 'roles.view'), rolesController.findAll.bind(rolesController));
router.get('/:id', requirePermission('role.view', 'roles.view'), rolesController.findById.bind(rolesController));
router.post('/', requirePermission('role.create', 'roles.create', 'role.manage'), rolesController.create.bind(rolesController));
router.put('/:id', requirePermission('role.update', 'roles.update', 'role.manage'), rolesController.update.bind(rolesController));
router.delete('/:id', requirePermission('role.delete', 'roles.delete', 'role.manage'), rolesController.delete.bind(rolesController));
router.put('/:id/permissions', requirePermission('role.manage'), rolesController.assignPermissions.bind(rolesController));
router.get('/:id/permissions', requirePermission('role.view', 'roles.view'), rolesController.getPermissions.bind(rolesController));

export const rolesRouter = router;