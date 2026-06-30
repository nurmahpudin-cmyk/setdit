import { Router } from 'express';
import { positionsController } from './controller.js';
import { authMiddleware } from '../../middleware/auth.js';
import { requirePermission } from '../../middleware/rbac.js';

const router = Router();
router.use(authMiddleware);

/**
 * @swagger
 * /api/positions:
 *   get:
 *     tags: [Positions]
 *     summary: Get all positions
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of positions
 */
router.get('/', requirePermission('position.view', 'positions.view'), positionsController.findAll.bind(positionsController));

/**
 * @swagger
 * /api/positions/{id}:
 *   get:
 *     tags: [Positions]
 *     summary: Get position by ID
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
 *         description: Position details
 */
router.get('/:id', requirePermission('position.view', 'positions.view'), positionsController.findById.bind(positionsController));

/**
 * @swagger
 * /api/positions:
 *   post:
 *     tags: [Positions]
 *     summary: Create position
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
 *               code:
 *                 type: string
 *               role_id:
 *                 type: integer
 *     responses:
 *       201:
 *         description: Position created
 */
router.post('/', requirePermission('position.create', 'positions.create', 'position.manage'), positionsController.create.bind(positionsController));

/**
 * @swagger
 * /api/positions/{id}:
 *   put:
 *     tags: [Positions]
 *     summary: Update position
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
 *               role_id:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Position updated
 */
router.put('/:id', requirePermission('position.update', 'positions.update', 'position.manage'), positionsController.update.bind(positionsController));

/**
 * @swagger
 * /api/positions/{id}:
 *   delete:
 *     tags: [Positions]
 *     summary: Delete position
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
 *         description: Position deleted
 */
router.delete('/:id', requirePermission('position.delete', 'positions.delete', 'position.manage'), positionsController.delete.bind(positionsController));

export const positionsRouter = router;