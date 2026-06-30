import { Router } from 'express';
import { authMiddleware } from '../../middleware/auth.js';
import { requirePermission, requireAnyPermission } from '../../middleware/rbac.js';
import { jadwalPimpinanController } from './controller.js';

const router = Router();

// All routes require authentication
router.use(authMiddleware);

/**
 * @swagger
 * /api/jadwal-pimpinan:
 *   get:
 *     tags: [Jadwal Pimpinan]
 *     summary: Get all jadwal pimpinan
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
 *         name: tanggal
 *         schema:
 *           type: string
 *           format: date
 *     responses:
 *       200:
 *         description: List of jadwal
 */
router.get(
  '/',
  requireAnyPermission('jadwal.view', 'jadwal.manage', 'admin.manage'),
  jadwalPimpinanController.findAll.bind(jadwalPimpinanController)
);

/**
 * @swagger
 * /api/jadwal-pimpinan/upcoming:
 *   get:
 *     tags: [Jadwal Pimpinan]
 *     summary: Get upcoming jadwal
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Upcoming jadwal list
 */
router.get(
  '/upcoming',
  requireAnyPermission('jadwal.view', 'jadwal.manage', 'admin.manage'),
  jadwalPimpinanController.getUpcoming.bind(jadwalPimpinanController)
);

/**
 * @swagger
 * /api/jadwal-pimpinan/preview-notification:
 *   get:
 *     tags: [Jadwal Pimpinan]
 *     summary: Preview notification message
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: jadwal_id
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Preview message
 */
router.get(
  '/preview-notification',
  requireAnyPermission('jadwal.view', 'jadwal.manage', 'admin.manage'),
  jadwalPimpinanController.previewNotification.bind(jadwalPimpinanController)
);

/**
 * @swagger
 * /api/jadwal-pimpinan/pegawai:
 *   get:
 *     tags: [Jadwal Pimpinan]
 *     summary: Get list of pegawai
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Pegawai list
 */
router.get(
  '/pegawai',
  requireAnyPermission('jadwal.view', 'jadwal.manage', 'admin.manage'),
  jadwalPimpinanController.getPegawai.bind(jadwalPimpinanController)
);

/**
 * @swagger
 * /api/jadwal-pimpinan/{id}:
 *   get:
 *     tags: [Jadwal Pimpinan]
 *     summary: Get jadwal by ID
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
 *         description: Jadwal details
 */
router.get(
  '/:id',
  requireAnyPermission('jadwal.view', 'jadwal.manage', 'admin.manage'),
  jadwalPimpinanController.findById.bind(jadwalPimpinanController)
);

/**
 * @swagger
 * /api/jadwal-pimpinan:
 *   post:
 *     tags: [Jadwal Pimpinan]
 *     summary: Create new jadwal
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [tanggal, waktu_mulai, waktu_selesai, kegiatan, pimpinan_id]
 *             properties:
 *               tanggal:
 *                 type: string
 *                 format: date
 *               waktu_mulai:
 *                 type: string
 *                 example: "09:00"
 *               waktu_selesai:
 *                 type: string
 *                 example: "10:00"
 *               kegiatan:
 *                 type: string
 *               pimpinan_id:
 *                 type: integer
 *               tempat:
 *                 type: string
 *               peserta:
 *                 type: string
 *               keterangan:
 *                 type: string
 *     responses:
 *       201:
 *         description: Jadwal created
 */
router.post(
  '/',
  requireAnyPermission('jadwal.create', 'jadwal.manage', 'admin.manage'),
  jadwalPimpinanController.create.bind(jadwalPimpinanController)
);

/**
 * @swagger
 * /api/jadwal-pimpinan/{id}:
 *   put:
 *     tags: [Jadwal Pimpinan]
 *     summary: Update jadwal
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
 *               tanggal:
 *                 type: string
 *                 format: date
 *               waktu_mulai:
 *                 type: string
 *               waktu_selesai:
 *                 type: string
 *               kegiatan:
 *                 type: string
 *               pimpinan_id:
 *                 type: integer
 *               tempat:
 *                 type: string
 *               peserta:
 *                 type: string
 *               keterangan:
 *                 type: string
 *     responses:
 *       200:
 *         description: Jadwal updated
 */
router.put(
  '/:id',
  requireAnyPermission('jadwal.update', 'jadwal.manage', 'admin.manage'),
  jadwalPimpinanController.update.bind(jadwalPimpinanController)
);

/**
 * @swagger
 * /api/jadwal-pimpinan/{id}:
 *   delete:
 *     tags: [Jadwal Pimpinan]
 *     summary: Delete jadwal
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
 *         description: Jadwal deleted
 */
router.delete(
  '/:id',
  requireAnyPermission('jadwal.delete', 'jadwal.manage', 'admin.manage'),
  jadwalPimpinanController.delete.bind(jadwalPimpinanController)
);

/**
 * @swagger
 * /api/jadwal-pimpinan/send-notification:
 *   post:
 *     tags: [Jadwal Pimpinan]
 *     summary: Send notification for jadwal
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [jadwal_id]
 *             properties:
 *               jadwal_id:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Notification sent
 */
router.post(
  '/send-notification',
  requireAnyPermission('jadwal.manage', 'admin.manage'),
  jadwalPimpinanController.sendNotification.bind(jadwalPimpinanController)
);

export const jadwalPimpinanRouter = router;
