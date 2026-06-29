import { Router } from 'express';
import { logsController } from './controller.js';
import { authMiddleware } from '../../middleware/auth.js';
import { requirePermission } from '../../middleware/rbac.js';

const router = Router();
router.use(authMiddleware);

router.get('/activity', requirePermission('log.view', 'logs.view', 'activity.view'), logsController.activityLogs.bind(logsController));
router.get('/whatsapp', requirePermission('wa.view', 'wa.logs.view'), logsController.waLogs.bind(logsController));

export const logsRouter = router;