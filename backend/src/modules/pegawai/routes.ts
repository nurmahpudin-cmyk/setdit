import { Router } from 'express';
import { authMiddleware } from '../../middleware/auth.js';
import { requireAnyPermission } from '../../middleware/rbac.js';
import { pegawaiController } from './controller.js';

const router = Router();

router.use(authMiddleware);

/**
 * @swagger
 * /api/pegawai:
 *   get:
 *     tags: [Pegawai]
 *     summary: Get all pegawai
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
 *     responses:
 *       200:
 *         description: List of pegawai
 */
router.get('/', pegawaiController.findAll.bind(pegawaiController));

/**
 * @swagger
 * /api/pegawai/all:
 *   get:
 *     tags: [Pegawai]
 *     summary: Get all pegawai (no pagination)
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: All pegawai
 */
router.get('/all', pegawaiController.getAll.bind(pegawaiController));

/**
 * @swagger
 * /api/pegawai/{id}:
 *   get:
 *     tags: [Pegawai]
 *     summary: Get pegawai by ID
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
 *         description: Pegawai details
 */
router.get('/:id', pegawaiController.findById.bind(pegawaiController));

/**
 * @swagger
 * /api/pegawai:
 *   post:
 *     tags: [Pegawai]
 *     summary: Create pegawai
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [nama, nip, jabatan]
 *             properties:
 *               nama:
 *                 type: string
 *               nip:
 *                 type: string
 *               jabatan:
 *                 type: string
 *               unit_kerja:
 *                 type: string
 *               no_hp:
 *                 type: string
 *               email:
 *                 type: string
 *     responses:
 *       201:
 *         description: Pegawai created
 */
router.post('/', requireAnyPermission('pegawai.create', 'pegawai.manage', 'admin.manage'), pegawaiController.create.bind(pegawaiController));

/**
 * @swagger
 * /api/pegawai/{id}:
 *   put:
 *     tags: [Pegawai]
 *     summary: Update pegawai
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
 *               nip:
 *                 type: string
 *               jabatan:
 *                 type: string
 *               unit_kerja:
 *                 type: string
 *               no_hp:
 *                 type: string
 *               email:
 *                 type: string
 *     responses:
 *       200:
 *         description: Pegawai updated
 */
router.put('/:id', requireAnyPermission('pegawai.update', 'pegawai.manage', 'admin.manage'), pegawaiController.update.bind(pegawaiController));

/**
 * @swagger
 * /api/pegawai/{id}:
 *   delete:
 *     tags: [Pegawai]
 *     summary: Delete pegawai
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
 *         description: Pegawai deleted
 */
router.delete('/:id', requireAnyPermission('pegawai.delete', 'pegawai.manage', 'admin.manage'), pegawaiController.delete.bind(pegawaiController));

export const pegawaiRouter = router;
