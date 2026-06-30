import { Router } from 'express';
import { provinsiController } from './controller.js';
import { authMiddleware } from '../../middleware/auth.js';

const router = Router();
router.use(authMiddleware);

/**
 * @swagger
 * /api/provinsi:
 *   get:
 *     tags: [Provinsi]
 *     summary: Get all provinsi
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of provinsi
 */
router.get('/', provinsiController.findAll.bind(provinsiController));

/**
 * @swagger
 * /api/provinsi/{id}:
 *   get:
 *     tags: [Provinsi]
 *     summary: Get provinsi by ID
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
 *         description: Provinsi details
 */
router.get('/:id', provinsiController.findById.bind(provinsiController));

/**
 * @swagger
 * /api/provinsi:
 *   post:
 *     tags: [Provinsi]
 *     summary: Create provinsi
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
 *     responses:
 *       201:
 *         description: Provinsi created
 */
router.post('/', provinsiController.create.bind(provinsiController));

/**
 * @swagger
 * /api/provinsi/{id}:
 *   put:
 *     tags: [Provinsi]
 *     summary: Update provinsi
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
 *     responses:
 *       200:
 *         description: Provinsi updated
 */
router.put('/:id', provinsiController.update.bind(provinsiController));

/**
 * @swagger
 * /api/provinsi/{id}:
 *   delete:
 *     tags: [Provinsi]
 *     summary: Delete provinsi
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
 *         description: Provinsi deleted
 */
router.delete('/:id', provinsiController.delete.bind(provinsiController));

export const provinsiRouter = router;
