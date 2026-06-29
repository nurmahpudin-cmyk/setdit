import { Router } from 'express';
import { menusController } from './controller.js';
import { authMiddleware } from '../../middleware/auth.js';
import { requirePermission } from '../../middleware/rbac.js';

const router = Router();
router.use(authMiddleware);

// Specific routes first, parameterized routes last
router.get('/visible', menusController.getVisibleMenus.bind(menusController));
router.get('/', requirePermission('menu.view', 'menus.view'), menusController.findAll.bind(menusController));
router.post('/', requirePermission('menu.create', 'menus.create', 'menu.manage'), menusController.create.bind(menusController));
router.get('/:id', requirePermission('menu.view', 'menus.view'), menusController.findById.bind(menusController));
router.put('/:id', requirePermission('menu.update', 'menus.update', 'menu.manage'), menusController.update.bind(menusController));
router.delete('/:id', requirePermission('menu.delete', 'menus.delete', 'menu.manage'), menusController.delete.bind(menusController));
router.put('/:id/permissions', requirePermission('menu.manage'), menusController.assignPermissions.bind(menusController));
router.get('/:id/permissions', requirePermission('menu.view', 'menus.view'), menusController.getPermissions.bind(menusController));

export const menusRouter = router;
