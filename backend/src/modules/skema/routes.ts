import { Router } from 'express';
import { skemaController } from './controller.js';
import { authMiddleware } from '../../middleware/auth.js';

const router = Router();
router.use(authMiddleware);

/**
 * @swagger
 * /api/skema:
 *   get:
 *     tags: [Skema]
 *     summary: Get all skema
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of skema
 */
router.get('/', skemaController.findAll.bind(skemaController));

/**
 * @swagger
 * /api/skema/{id}:
 *   get:
 *     tags: [Skema]
 *     summary: Get skema by ID
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
 *         description: Skema details
 */
router.get('/:id', skemaController.findById.bind(skemaController));

/**
 * @swagger
 * /api/skema:
 *   post:
 *     tags: [Skema]
 *     summary: Create skema
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [nama]
 *             properties:
 *               nama:
 *                 type: string
 *               kode:
 *                 type: string
 *               deskripsi:
 *                 type: string
 *     responses:
 *       201:
 *         description: Skema created
 */
router.post('/', skemaController.create.bind(skemaController));

/**
 * @swagger
 * /api/skema/{id}:
 *   put:
 *     tags: [Skema]
 *     summary: Update skema
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
 *               nama:
 *                 type: string
 *               kode:
 *                 type: string
 *               deskripsi:
 *                 type: string
 *     responses:
 *       200:
 *         description: Skema updated
 */
router.put('/:id', skemaController.update.bind(skemaController));

/**
 * @swagger
 * /api/skema/{id}:
 *   delete:
 *     tags: [Skema]
 *     summary: Delete skema
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
 *         description: Skema deleted
 */
router.delete('/:id', skemaController.delete.bind(skemaController));

export const skemaRouter = router;
