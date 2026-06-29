import { Router } from 'express';
import { authMiddleware } from '../../middleware/auth.js';
import { requirePermission, requireAnyPermission } from '../../middleware/rbac.js';
import { jadwalPimpinanController } from './controller.js';

const router = Router();

// All routes require authentication
router.use(authMiddleware);

// Routes for jadwal pimpinan management (Admin and Aspri Dirjen only)
router.get(
  '/',
  requireAnyPermission('jadwal.view', 'jadwal.manage', 'admin.manage'),
  jadwalPimpinanController.findAll.bind(jadwalPimpinanController)
);

router.get(
  '/upcoming',
  requireAnyPermission('jadwal.view', 'jadwal.manage', 'admin.manage'),
  jadwalPimpinanController.getUpcoming.bind(jadwalPimpinanController)
);

router.get(
  '/preview-notification',
  requireAnyPermission('jadwal.view', 'jadwal.manage', 'admin.manage'),
  jadwalPimpinanController.previewNotification.bind(jadwalPimpinanController)
);

router.get(
  '/pegawai',
  requireAnyPermission('jadwal.view', 'jadwal.manage', 'admin.manage'),
  jadwalPimpinanController.getPegawai.bind(jadwalPimpinanController)
);

router.get(
  '/:id',
  requireAnyPermission('jadwal.view', 'jadwal.manage', 'admin.manage'),
  jadwalPimpinanController.findById.bind(jadwalPimpinanController)
);

router.post(
  '/',
  requireAnyPermission('jadwal.create', 'jadwal.manage', 'admin.manage'),
  jadwalPimpinanController.create.bind(jadwalPimpinanController)
);

router.put(
  '/:id',
  requireAnyPermission('jadwal.update', 'jadwal.manage', 'admin.manage'),
  jadwalPimpinanController.update.bind(jadwalPimpinanController)
);

router.delete(
  '/:id',
  requireAnyPermission('jadwal.delete', 'jadwal.manage', 'admin.manage'),
  jadwalPimpinanController.delete.bind(jadwalPimpinanController)
);

router.post(
  '/send-notification',
  requireAnyPermission('jadwal.manage', 'admin.manage'),
  jadwalPimpinanController.sendNotification.bind(jadwalPimpinanController)
);

export const jadwalPimpinanRouter = router;
