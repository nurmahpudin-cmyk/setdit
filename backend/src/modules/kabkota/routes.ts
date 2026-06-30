import { Router } from 'express';
import { kabkotaController } from './controller.js';
import { authMiddleware } from '../../middleware/auth.js';

const router = Router();
router.use(authMiddleware);

/**
 * @swagger
 * /api/kabkota:
 *   get:
 *     tags: [Kabupaten/Kota]
 *     summary: Get all kabupaten/kota
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: provinsi_id
 *         schema:
 *           type: integer
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of kabkota
 */
router.get('/', kabkotaController.findAll.bind(kabkotaController));

/**
 * @swagger
 * /api/kabkota/{id}:
 *   get:
 *     tags: [Kabupaten/Kota]
 *     summary: Get kabkota by ID
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
 *         description: Kabkota details
 */
router.get('/:id', kabkotaController.findById.bind(kabkotaController));

/**
 * @swagger
 * /api/kabkota:
 *   post:
 *     tags: [Kabupaten/Kota]
 *     summary: Create kabkota
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [nama, provinsi_id]
 *             properties:
 *               nama:
 *                 type: string
 *               provinsi_id:
 *                 type: integer
 *     responses:
 *       201:
 *         description: Kabkota created
 */
router.post('/', kabkotaController.create.bind(kabkotaController));

/**
 * @swagger
 * /api/kabkota/{id}:
 *   put:
 *     tags: [Kabupaten/Kota]
 *     summary: Update kabkota
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
 *               provinsi_id:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Kabkota updated
 */
router.put('/:id', kabkotaController.update.bind(kabkotaController));

/**
 * @swagger
 * /api/kabkota/{id}:
 *   delete:
 *     tags: [Kabupaten/Kota]
 *     summary: Delete kabkota
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
 *         description: Kabkota deleted
 */
router.delete('/:id', kabkotaController.delete.bind(kabkotaController));

export const kabkotaRouter = router;
