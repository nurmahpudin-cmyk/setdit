import { Router } from 'express';
import { jenisSuratController } from './controller.js';
import { authMiddleware } from '../../middleware/auth.js';
import { requirePermission } from '../../middleware/rbac.js';

const router = Router();
router.use(authMiddleware);

router.get('/', requirePermission('jenis_surat.view', 'jenis_surat.list'), jenisSuratController.findAll.bind(jenisSuratController));
router.get('/:id', requirePermission('jenis_surat.view', 'jenis_surat.list'), jenisSuratController.findById.bind(jenisSuratController));
router.post('/', requirePermission('jenis_surat.create', 'jenis_surat.manage'), jenisSuratController.create.bind(jenisSuratController));
router.put('/:id', requirePermission('jenis_surat.update', 'jenis_surat.manage'), jenisSuratController.update.bind(jenisSuratController));
router.delete('/:id', requirePermission('jenis_surat.delete', 'jenis_surat.manage'), jenisSuratController.delete.bind(jenisSuratController));

export const jenisSuratRouter = router;
