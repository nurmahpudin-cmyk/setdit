import { Router } from 'express';
import { whatsappController } from './controller.js';
import { authMiddleware } from '../../middleware/auth.js';
import { requirePermission } from '../../middleware/rbac.js';

const router = Router();

router.use(authMiddleware);

/**
 * @swagger
 * /api/whatsapp/sessions:
 *   get:
 *     tags: [WhatsApp]
 *     summary: Get all WhatsApp sessions
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of sessions
 */
router.get('/sessions', requirePermission('wa.view'), whatsappController.findAll.bind(whatsappController));

/**
 * @swagger
 * /api/whatsapp/sessions/{id}:
 *   get:
 *     tags: [WhatsApp]
 *     summary: Get session by ID
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Session details
 */
router.get('/sessions/:id', requirePermission('wa.view'), whatsappController.findById.bind(whatsappController));

/**
 * @swagger
 * /api/whatsapp/sessions:
 *   post:
 *     tags: [WhatsApp]
 *     summary: Create new WhatsApp session
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name]
 *             properties:
 *               name:
 *                 type: string
 *                 example: Primary
 *     responses:
 *       201:
 *         description: Session created
 */
router.post('/sessions', requirePermission('wa.manage'), whatsappController.create.bind(whatsappController));

/**
 * @swagger
 * /api/whatsapp/sessions/{id}:
 *   delete:
 *     tags: [WhatsApp]
 *     summary: Delete WhatsApp session
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Session deleted
 */
router.delete('/sessions/:id', requirePermission('wa.manage'), whatsappController.delete.bind(whatsappController));

/**
 * @swagger
 * /api/whatsapp/sessions/{id}/qr:
 *   get:
 *     tags: [WhatsApp]
 *     summary: Get QR code for session
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: QR code data
 */
router.get('/sessions/:id/qr', requirePermission('wa.view'), whatsappController.getQRCode.bind(whatsappController));

/**
 * @swagger
 * /api/whatsapp/sessions/{id}/send:
 *   post:
 *     tags: [WhatsApp]
 *     summary: Send WhatsApp message
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [phone, message]
 *             properties:
 *               phone:
 *                 type: string
 *                 example: "081234567890"
 *               message:
 *                 type: string
 *     responses:
 *       200:
 *         description: Message sent
 */
router.post('/sessions/:id/send', requirePermission('wa.send'), whatsappController.sendMessage.bind(whatsappController));

/**
 * @swagger
 * /api/whatsapp/logs:
 *   get:
 *     tags: [WhatsApp]
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
router.get('/logs', requirePermission('wa.view'), whatsappController.getLogs.bind(whatsappController));

export const whatsappRouter = router;
