import { Router } from 'express';
import { logsController } from './controller.js';
import { authMiddleware } from '../../middleware/auth.js';
import { requirePermission } from '../../middleware/rbac.js';

const router = Router();
router.use(authMiddleware);

/**
 * @swagger
 * /api/logs/activity:
 *   get:
 *     tags: [Logs]
 *     summary: Get activity logs
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *       - in: query
 *         name: module
 *         schema:
 *           type: string
 *       - in: query
 *         name: action
 *         schema:
 *           type: string
 *       - in: query
 *         name: user_id
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Activity logs
 */
router.get('/activity', requirePermission('log.view', 'logs.view', 'activity.view'), logsController.activityLogs.bind(logsController));

/**
 * @swagger
 * /api/logs/whatsapp:
 *   get:
 *     tags: [Logs]
 *     summary: Get WhatsApp logs
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *       - in: query
 *         name: session_id
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: WhatsApp logs
 */
router.get('/whatsapp', requirePermission('wa.view', 'wa.logs.view'), logsController.waLogs.bind(logsController));

export const logsRouter = router;