import { Router } from 'express';
import { unitsController } from './controller.js';
import { authMiddleware } from '../../middleware/auth.js';
import { requirePermission } from '../../middleware/rbac.js';

const router = Router();
router.use(authMiddleware);

/**
 * @swagger
 * /api/units:
 *   get:
 *     tags: [Units]
 *     summary: Get all units
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of units
 */
router.get('/', requirePermission('unit.view', 'units.view'), unitsController.findAll.bind(unitsController));

/**
 * @swagger
 * /api/units/{id}:
 *   get:
 *     tags: [Units]
 *     summary: Get unit by ID
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
 *         description: Unit details
 */
router.get('/:id', requirePermission('unit.view', 'units.view'), unitsController.findById.bind(unitsController));

/**
 * @swagger
 * /api/units:
 *   post:
 *     tags: [Units]
 *     summary: Create unit
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
 *     responses:
 *       201:
 *         description: Unit created
 */
router.post('/', requirePermission('unit.create', 'units.create', 'unit.manage'), unitsController.create.bind(unitsController));

/**
 * @swagger
 * /api/units/{id}:
 *   put:
 *     tags: [Units]
 *     summary: Update unit
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
 *     responses:
 *       200:
 *         description: Unit updated
 */
router.put('/:id', requirePermission('unit.update', 'units.update', 'unit.manage'), unitsController.update.bind(unitsController));

/**
 * @swagger
 * /api/units/{id}:
 *   delete:
 *     tags: [Units]
 *     summary: Delete unit
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
 *         description: Unit deleted
 */
router.delete('/:id', requirePermission('unit.delete', 'units.delete', 'unit.manage'), unitsController.delete.bind(unitsController));

export const unitsRouter = router;