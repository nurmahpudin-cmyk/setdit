import { Router } from 'express';
import { authMiddleware } from '../../middleware/auth.js';
import { requireAnyPermission } from '../../middleware/rbac.js';
import { pegawaiController } from './controller.js';

const router = Router();

router.use(authMiddleware);

router.get('/', pegawaiController.findAll.bind(pegawaiController));
router.get('/all', pegawaiController.getAll.bind(pegawaiController));
router.get('/:id', pegawaiController.findById.bind(pegawaiController));

router.post('/', requireAnyPermission('pegawai.create', 'pegawai.manage', 'admin.manage'), pegawaiController.create.bind(pegawaiController));
router.put('/:id', requireAnyPermission('pegawai.update', 'pegawai.manage', 'admin.manage'), pegawaiController.update.bind(pegawaiController));
router.delete('/:id', requireAnyPermission('pegawai.delete', 'pegawai.manage', 'admin.manage'), pegawaiController.delete.bind(pegawaiController));

export const pegawaiRouter = router;
