import { Router } from 'express';
import { usersController } from './controller.js';
import { authMiddleware } from '../../middleware/auth.js';
import { requirePermission } from '../../middleware/rbac.js';

const router = Router();

router.use(authMiddleware);

/**
 * @swagger
 * /api/users:
 *   get:
 *     tags: [Users]
 *     summary: Get all users
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
 *           default: 10
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [ACTIVE, INACTIVE, PENDING, SUSPENDED]
 *     responses:
 *       200:
 *         description: List of users
 */
router.get('/', usersController.findAll.bind(usersController));

/**
 * @swagger
 * /api/users/{id}:
 *   get:
 *     tags: [Users]
 *     summary: Get user by ID
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
 *         description: User details
 *       404:
 *         description: User not found
 */
router.get('/:id', usersController.findById.bind(usersController));

/**
 * @swagger
 * /api/users:
 *   post:
 *     tags: [Users]
 *     summary: Create new user
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [fullname, username, email, phone, password]
 *             properties:
 *               fullname:
 *                 type: string
 *               username:
 *                 type: string
 *               email:
 *                 type: string
 *                 format: email
 *               phone:
 *                 type: string
 *               password:
 *                 type: string
 *               position_id:
 *                 type: integer
 *               role_ids:
 *                 type: array
 *                 items:
 *                   type: integer
 *     responses:
 *       201:
 *         description: User created
 *       400:
 *         description: Validation error
 */
router.post('/', requirePermission('user.create', 'users.create'), usersController.create.bind(usersController));

/**
 * @swagger
 * /api/users/{id}:
 *   put:
 *     tags: [Users]
 *     summary: Update user
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
 *               fullname:
 *                 type: string
 *               username:
 *                 type: string
 *               email:
 *                 type: string
 *               phone:
 *                 type: string
 *               position_id:
 *                 type: integer
 *     responses:
 *       200:
 *         description: User updated
 */
router.put('/:id', requirePermission('user.update', 'users.update'), usersController.update.bind(usersController));

/**
 * @swagger
 * /api/users/{id}:
 *   delete:
 *     tags: [Users]
 *     summary: Delete user (soft delete)
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
 *         description: User deleted
 */
router.delete('/:id', requirePermission('user.delete', 'users.delete'), usersController.delete.bind(usersController));

/**
 * @swagger
 * /api/users/{id}/approve:
 *   put:
 *     tags: [Users]
 *     summary: Approve user registration
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
 *         description: User approved
 */
router.put('/:id/approve', requirePermission('user.approve', 'users.approve'), usersController.approve.bind(usersController));

/**
 * @swagger
 * /api/users/{id}/activate:
 *   put:
 *     tags: [Users]
 *     summary: Activate user
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
 *         description: User activated
 */
router.put('/:id/activate', requirePermission('user.update', 'users.update'), usersController.activate.bind(usersController));

/**
 * @swagger
 * /api/users/{id}/deactivate:
 *   put:
 *     tags: [Users]
 *     summary: Deactivate user
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
 *         description: User deactivated
 */
router.put('/:id/deactivate', requirePermission('user.update', 'users.update'), usersController.deactivate.bind(usersController));

/**
 * @swagger
 * /api/users/{id}/roles:
 *   put:
 *     tags: [Users]
 *     summary: Assign roles to user
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
 *             required: [role_ids]
 *             properties:
 *               role_ids:
 *                 type: array
 *                 items:
 *                   type: integer
 *     responses:
 *       200:
 *         description: Roles assigned
 */
router.put('/:id/roles', requirePermission('user.update', 'users.update'), usersController.assignRoles.bind(usersController));

/**
 * @swagger
 * /api/users/{id}/permissions:
 *   get:
 *     tags: [Users]
 *     summary: Get user's effective permissions
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
 *         description: User permissions
 */
router.get('/:id/permissions', requirePermission('user.view', 'users.view'), usersController.getEffectivePermissions.bind(usersController));

export const usersRouter = router;