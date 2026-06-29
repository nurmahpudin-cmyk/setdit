import { Router } from 'express';
import { positionsController } from './controller.js';
import { authMiddleware } from '../../middleware/auth.js';
import { requirePermission } from '../../middleware/rbac.js';

const router = Router();
router.use(authMiddleware);

router.get('/', requirePermission('position.view', 'positions.view'), positionsController.findAll.bind(positionsController));
router.get('/:id', requirePermission('position.view', 'positions.view'), positionsController.findById.bind(positionsController));
router.post('/', requirePermission('position.create', 'positions.create', 'position.manage'), positionsController.create.bind(positionsController));
router.put('/:id', requirePermission('position.update', 'positions.update', 'position.manage'), positionsController.update.bind(positionsController));
router.delete('/:id', requirePermission('position.delete', 'positions.delete', 'position.manage'), positionsController.delete.bind(positionsController));

export const positionsRouter = router;