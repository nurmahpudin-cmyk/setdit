import { Router } from 'express';
import { skPerhutananController } from './controller.js';
import { authMiddleware } from '../../middleware/auth.js';
import { requirePermission } from '../../middleware/rbac.js';

const router = Router();

router.use(authMiddleware);

/**
 * @swagger
 * /api/sk-perhutanan:
 *   get:
 *     tags: [SK Perhutanan]
 *     summary: Get all SK Perhutanan
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
 *       - in: query
 *         name: jabatan_code
 *         schema:
 *           type: string
 *         description: Filter by user's jabatan code (e.g., SEKDITJEN_PS, TU_SETDITJEN)
 *     responses:
 *       200:
 *         description: List of SK Perhutanan
 */
router.get('/', skPerhutananController.findAll.bind(skPerhutananController));

/**
 * @swagger
 * /api/sk-perhutanan/stats:
 *   get:
 *     tags: [SK Perhutanan]
 *     summary: Get SK statistics
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Statistics data
 */
router.get('/stats', skPerhutananController.getStats.bind(skPerhutananController));

/**
 * @swagger
 * /api/sk-perhutanan/pending/{jabatanCode}:
 *   get:
 *     tags: [SK Perhutanan]
 *     summary: Get pending SK by jabatan
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: jabatanCode
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Pending SK list
 */
router.get('/pending/:jabatanCode', skPerhutananController.getPendingByJabatan.bind(skPerhutananController));

/**
 * @swagger
 * /api/sk-perhutanan/jabatan/{jabatanCode}/users:
 *   get:
 *     tags: [SK Perhutanan]
 *     summary: Get users by jabatan code
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: jabatanCode
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Users list
 */
router.get('/jabatan/:jabatanCode/users', skPerhutananController.getUsersByJabatan.bind(skPerhutananController));

/**
 * @swagger
 * /api/sk-perhutanan/{id}:
 *   get:
 *     tags: [SK Perhutanan]
 *     summary: Get SK Perhutanan by ID
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
 *         description: SK details
 *       404:
 *         description: Not found
 */
router.get('/:id', skPerhutananController.findById.bind(skPerhutananController));

/**
 * @swagger
 * /api/sk-perhutanan:
 *   post:
 *     tags: [SK Perhutanan]
 *     summary: Create new SK Perhutanan
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [nomor_register, provinsi_id, kabkota_id, skema_id, pemohon_nama, pemohon_alamat, luas_ha]
 *             properties:
 *               nomor_register:
 *                 type: string
 *               provinsi_id:
 *                 type: integer
 *               kabkota_id:
 *                 type: integer
 *               skema_id:
 *                 type: integer
 *               pemohon_nama:
 *                 type: string
 *               pemohon_alamat:
 *                 type: string
 *               luas_ha:
 *                 type: number
 *     responses:
 *       201:
 *         description: SK created
 */
router.post('/', requirePermission('sk_perhutanan.create'), skPerhutananController.create.bind(skPerhutananController));

/**
 * @swagger
 * /api/sk-perhutanan/{id}:
 *   put:
 *     tags: [SK Perhutanan]
 *     summary: Update SK Perhutanan
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
 *               pemohon_nama:
 *                 type: string
 *               pemohon_alamat:
 *                 type: string
 *               luas_ha:
 *                 type: number
 *     responses:
 *       200:
 *         description: SK updated
 */
router.put('/:id', requirePermission('sk_perhutanan.edit'), skPerhutananController.update.bind(skPerhutananController));

/**
 * @swagger
 * /api/sk-perhutanan/{id}/submit:
 *   post:
 *     tags: [SK Perhutanan]
 *     summary: Submit SK for processing
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
 *         description: SK submitted
 */
router.post('/:id/submit', requirePermission('sk_perhutanan.submit'), skPerhutananController.submit.bind(skPerhutananController));

/**
 * @swagger
 * /api/sk-perhutanan/{id}/process:
 *   post:
 *     tags: [SK Perhutanan]
 *     summary: Process SK step
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
 *               action:
 *                 type: string
 *                 enum: [APPROVE, REJECT, REQUEST_REVISION]
 *               catatan:
 *                 type: string
 *     responses:
 *       200:
 *         description: SK processed
 */
router.post('/:id/process', requirePermission('sk_perhutanan.process'), skPerhutananController.processStep.bind(skPerhutananController));

/**
 * @swagger
 * /api/sk-perhutanan/{id}/nomor-nd:
 *   post:
 *     tags: [SK Perhutanan]
 *     summary: Add nomor nota dinas
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
 *             required: [nomor_nd]
 *             properties:
 *               nomor_nd:
 *                 type: string
 *     responses:
 *       200:
 *         description: Nomor ND added
 */
router.post('/:id/nomor-nd', requirePermission('sk_perhutanan.process'), skPerhutananController.addNomorND.bind(skPerhutananController));

/**
 * @swagger
 * /api/sk-perhutanan/{id}/sign:
 *   post:
 *     tags: [SK Perhutanan]
 *     summary: Sign SK
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
 *         description: SK signed
 */
router.post('/:id/sign', requirePermission('sk_perhutanan.process'), skPerhutananController.signSK.bind(skPerhutananController));

/**
 * @swagger
 * /api/sk-perhutanan/{id}/nomor-sk:
 *   post:
 *     tags: [SK Perhutanan]
 *     summary: Add nomor SK
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
 *             required: [nomor_sk]
 *             properties:
 *               nomor_sk:
 *                 type: string
 *     responses:
 *       200:
 *         description: Nomor SK added
 */
router.post('/:id/nomor-sk', requirePermission('sk_perhutanan.process'), skPerhutananController.addNomorSK.bind(skPerhutananController));

/**
 * @swagger
 * /api/sk-perhutanan/{id}/finalize:
 *   post:
 *     tags: [SK Perhutanan]
 *     summary: Finalize SK
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
 *         description: SK finalized
 */
router.post('/:id/finalize', requirePermission('sk_perhutanan.process'), skPerhutananController.finalize.bind(skPerhutananController));

export const skPerhutananRouter = router;
