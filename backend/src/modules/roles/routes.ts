import { Router } from 'express';
import { rolesController } from './controller.js';
import { authMiddleware } from '../../middleware/auth.js';
import { requirePermission } from '../../middleware/rbac.js';

const router = Router();
router.use(authMiddleware);

/**
 * @swagger
 * /api/roles:
 *   get:
 *     tags: [Roles]
 *     summary: Get all roles
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of roles
 */
router.get('/', requirePermission('role.view', 'roles.view'), rolesController.findAll.bind(rolesController));

/**
 * @swagger
 * /api/roles/{id}:
 *   get:
 *     tags: [Roles]
 *     summary: Get role by ID
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
 *         description: Role details
 */
router.get('/:id', requirePermission('role.view', 'roles.view'), rolesController.findById.bind(rolesController));

/**
 * @swagger
 * /api/roles:
 *   post:
 *     tags: [Roles]
 *     summary: Create new role
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, code]
 *             properties:
 *               name:
 *                 type: string
 *                 example: Admin
 *               code:
 *                 type: string
 *                 example: ADMIN
 *               description:
 *                 type: string
 *     responses:
 *       201:
 *         description: Role created
 */
router.post('/', requirePermission('role.create', 'roles.create', 'role.manage'), rolesController.create.bind(rolesController));

/**
 * @swagger
 * /api/roles/{id}:
 *   put:
 *     tags: [Roles]
 *     summary: Update role
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
 *               description:
 *                 type: string
 *               is_active:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Role updated
 */
router.put('/:id', requirePermission('role.update', 'roles.update', 'role.manage'), rolesController.update.bind(rolesController));

/**
 * @swagger
 * /api/roles/{id}:
 *   delete:
 *     tags: [Roles]
 *     summary: Delete role
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
 *         description: Role deleted
 */
router.delete('/:id', requirePermission('role.delete', 'roles.delete', 'role.manage'), rolesController.delete.bind(rolesController));

/**
 * @swagger
 * /api/roles/{id}/permissions:
 *   put:
 *     tags: [Roles]
 *     summary: Assign permissions to role
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
 *             required: [permission_ids]
 *             properties:
 *               permission_ids:
 *                 type: array
 *                 items:
 *                   type: integer
 *     responses:
 *       200:
 *         description: Permissions assigned
 */
router.put('/:id/permissions', requirePermission('role.manage'), rolesController.assignPermissions.bind(rolesController));

/**
 * @swagger
 * /api/roles/{id}/permissions:
 *   get:
 *     tags: [Roles]
 *     summary: Get permissions for role
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
 *         description: Role permissions
 */
router.get('/:id/permissions', requirePermission('role.view', 'roles.view'), rolesController.getPermissions.bind(rolesController));

export const rolesRouter = router;