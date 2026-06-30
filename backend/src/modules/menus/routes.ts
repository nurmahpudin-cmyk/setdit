import { Router } from 'express';
import { menusController } from './controller.js';
import { authMiddleware } from '../../middleware/auth.js';
import { requirePermission } from '../../middleware/rbac.js';

const router = Router();
router.use(authMiddleware);

/**
 * @swagger
 * /api/menus/visible:
 *   get:
 *     tags: [Menus]
 *     summary: Get visible menus for current user
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Visible menus
 */
router.get('/visible', menusController.getVisibleMenus.bind(menusController));

/**
 * @swagger
 * /api/menus:
 *   get:
 *     tags: [Menus]
 *     summary: Get all menus
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: module
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of menus
 */
router.get('/', requirePermission('menu.view', 'menus.view'), menusController.findAll.bind(menusController));

/**
 * @swagger
 * /api/menus:
 *   post:
 *     tags: [Menus]
 *     summary: Create menu
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, path]
 *             properties:
 *               name:
 *                 type: string
 *               path:
 *                 type: string
 *               icon:
 *                 type: string
 *               module:
 *                 type: string
 *               order_num:
 *                 type: integer
 *     responses:
 *       201:
 *         description: Menu created
 */
router.post('/', requirePermission('menu.create', 'menus.create', 'menu.manage'), menusController.create.bind(menusController));

/**
 * @swagger
 * /api/menus/{id}:
 *   get:
 *     tags: [Menus]
 *     summary: Get menu by ID
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
 *         description: Menu details
 */
router.get('/:id', requirePermission('menu.view', 'menus.view'), menusController.findById.bind(menusController));

/**
 * @swagger
 * /api/menus/{id}:
 *   put:
 *     tags: [Menus]
 *     summary: Update menu
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
 *               path:
 *                 type: string
 *               icon:
 *                 type: string
 *               module:
 *                 type: string
 *               order_num:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Menu updated
 */
router.put('/:id', requirePermission('menu.update', 'menus.update', 'menu.manage'), menusController.update.bind(menusController));

/**
 * @swagger
 * /api/menus/{id}:
 *   delete:
 *     tags: [Menus]
 *     summary: Delete menu
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
 *         description: Menu deleted
 */
router.delete('/:id', requirePermission('menu.delete', 'menus.delete', 'menu.manage'), menusController.delete.bind(menusController));

/**
 * @swagger
 * /api/menus/{id}/permissions:
 *   put:
 *     tags: [Menus]
 *     summary: Assign permissions to menu
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
router.put('/:id/permissions', requirePermission('menu.manage'), menusController.assignPermissions.bind(menusController));

/**
 * @swagger
 * /api/menus/{id}/permissions:
 *   get:
 *     tags: [Menus]
 *     summary: Get permissions for menu
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
 *         description: Menu permissions
 */
router.get('/:id/permissions', requirePermission('menu.view', 'menus.view'), menusController.getPermissions.bind(menusController));

export const menusRouter = router;
