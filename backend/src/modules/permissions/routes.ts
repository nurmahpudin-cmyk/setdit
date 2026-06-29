import { Router } from 'express';
import { permissionsController } from './controller.js';
import { authMiddleware } from '../../middleware/auth.js';
import { requirePermission } from '../../middleware/rbac.js';

const router = Router();
router.use(authMiddleware);

router.get('/', requirePermission('permission.view', 'permissions.view'), permissionsController.findAll.bind(permissionsController));
router.get('/modules', requirePermission('permission.view', 'permissions.view'), permissionsController.getModules.bind(permissionsController));
router.get('/:id', requirePermission('permission.view', 'permissions.view'), permissionsController.findById.bind(permissionsController));
router.post('/', requirePermission('permission.create', 'permissions.create', 'permission.manage'), permissionsController.create.bind(permissionsController));
router.put('/:id', requirePermission('permission.update', 'permissions.update', 'permission.manage'), permissionsController.update.bind(permissionsController));
router.delete('/:id', requirePermission('permission.delete', 'permissions.delete', 'permission.manage'), permissionsController.delete.bind(permissionsController));

export const permissionsRouter = router;