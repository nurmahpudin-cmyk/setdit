import { Router } from 'express';
import { unitsController } from './controller.js';
import { authMiddleware } from '../../middleware/auth.js';
import { requirePermission } from '../../middleware/rbac.js';

const router = Router();
router.use(authMiddleware);

router.get('/', requirePermission('unit.view', 'units.view'), unitsController.findAll.bind(unitsController));
router.get('/:id', requirePermission('unit.view', 'units.view'), unitsController.findById.bind(unitsController));
router.post('/', requirePermission('unit.create', 'units.create', 'unit.manage'), unitsController.create.bind(unitsController));
router.put('/:id', requirePermission('unit.update', 'units.update', 'unit.manage'), unitsController.update.bind(unitsController));
router.delete('/:id', requirePermission('unit.delete', 'units.delete', 'unit.manage'), unitsController.delete.bind(unitsController));

export const unitsRouter = router;