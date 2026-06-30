import { Router } from 'express';
import { permissionsController } from './controller.js';
import { authMiddleware } from '../../middleware/auth.js';
import { requirePermission } from '../../middleware/rbac.js';

const router = Router();
router.use(authMiddleware);

/**
 * @swagger
 * /api/permissions:
 *   get:
 *     tags: [Permissions]
 *     summary: Get all permissions
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: module
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of permissions
 */
router.get('/', requirePermission('permission.view', 'permissions.view'), permissionsController.findAll.bind(permissionsController));

/**
 * @swagger
 * /api/permissions/modules:
 *   get:
 *     tags: [Permissions]
 *     summary: Get permissions grouped by module
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Permissions by module
 */
router.get('/modules', requirePermission('permission.view', 'permissions.view'), permissionsController.getModules.bind(permissionsController));

/**
 * @swagger
 * /api/permissions/{id}:
 *   get:
 *     tags: [Permissions]
 *     summary: Get permission by ID
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
 *         description: Permission details
 */
router.get('/:id', requirePermission('permission.view', 'permissions.view'), permissionsController.findById.bind(permissionsController));

/**
 * @swagger
 * /api/permissions:
 *   post:
 *     tags: [Permissions]
 *     summary: Create permission
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, code, module, action]
 *             properties:
 *               name:
 *                 type: string
 *               code:
 *                 type: string
 *               module:
 *                 type: string
 *               action:
 *                 type: string
 *     responses:
 *       201:
 *         description: Permission created
 */
router.post('/', requirePermission('permission.create', 'permissions.create', 'permission.manage'), permissionsController.create.bind(permissionsController));

/**
 * @swagger
 * /api/permissions/{id}:
 *   put:
 *     tags: [Permissions]
 *     summary: Update permission
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
 *             properties:
 *               name:
 *                 type: string
 *               code:
 *                 type: string
 *               is_active:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Permission updated
 */
router.put('/:id', requirePermission('permission.update', 'permissions.update', 'permission.manage'), permissionsController.update.bind(permissionsController));

/**
 * @swagger
 * /api/permissions/{id}:
 *   delete:
 *     tags: [Permissions]
 *     summary: Delete permission
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
 *         description: Permission deleted
 */
router.delete('/:id', requirePermission('permission.delete', 'permissions.delete', 'permission.manage'), permissionsController.delete.bind(permissionsController));

export const permissionsRouter = router;