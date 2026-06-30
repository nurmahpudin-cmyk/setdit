import { Router } from 'express';
import { settingsController } from './controller.js';
import { authMiddleware } from '../../middleware/auth.js';
import { requirePermission } from '../../middleware/rbac.js';
import { upload } from '../../middleware/upload.js';

const router = Router();

/**
 * @swagger
 * /api/settings:
 *   get:
 *     tags: [Settings]
 *     summary: Get application settings
 *     responses:
 *       200:
 *         description: Settings data
 */
router.get('/', settingsController.get.bind(settingsController));

/**
 * @swagger
 * /api/settings:
 *   put:
 *     tags: [Settings]
 *     summary: Update settings
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               app_name:
 *                 type: string
 *               app_fullname:
 *                 type: string
 *               tagline:
 *                 type: string
 *               description:
 *                 type: string
 *               email:
 *                 type: string
 *               phone:
 *                 type: string
 *               address:
 *                 type: string
 *     responses:
 *       200:
 *         description: Settings updated
 */
router.put('/', authMiddleware, requirePermission('setting.update', 'settings.update', 'setting.manage'), settingsController.update.bind(settingsController));

/**
 * @swagger
 * /api/settings/upload-logo:
 *   post:
 *     tags: [Settings]
 *     summary: Upload logo
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               logo:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Logo uploaded
 */
router.post('/upload-logo', authMiddleware, requirePermission('setting.update', 'settings.update', 'setting.manage'), upload.single('logo'), settingsController.uploadLogo.bind(settingsController));

export const settingsRouter = router;