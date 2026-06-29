import { Router } from 'express';
import { usersController } from './controller.js';
import { authMiddleware } from '../../middleware/auth.js';
import { requirePermission } from '../../middleware/rbac.js';

const router = Router();

router.use(authMiddleware);

router.get('/', requirePermission('user.view', 'users.view'), usersController.findAll.bind(usersController));
router.get('/:id', requirePermission('user.view', 'users.view'), usersController.findById.bind(usersController));
router.post('/', requirePermission('user.create', 'users.create'), usersController.create.bind(usersController));
router.put('/:id', requirePermission('user.update', 'users.update'), usersController.update.bind(usersController));
router.delete('/:id', requirePermission('user.delete', 'users.delete'), usersController.delete.bind(usersController));
router.put('/:id/approve', requirePermission('user.approve', 'users.approve'), usersController.approve.bind(usersController));
router.put('/:id/activate', requirePermission('user.update', 'users.update'), usersController.activate.bind(usersController));
router.put('/:id/deactivate', requirePermission('user.update', 'users.update'), usersController.deactivate.bind(usersController));
router.put('/:id/roles', requirePermission('user.update', 'users.update'), usersController.assignRoles.bind(usersController));
router.get('/:id/permissions', requirePermission('user.view', 'users.view'), usersController.getEffectivePermissions.bind(usersController));

export const usersRouter = router;