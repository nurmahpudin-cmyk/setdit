import { Router } from 'express';
import { skPerhutananController } from './controller.js';
import { authMiddleware } from '../../middleware/auth.js';
import { requirePermission } from '../../middleware/rbac.js';

const router = Router();

router.use(authMiddleware);

// List & Detail
router.get('/', requirePermission('sk_perhutanan.view'), skPerhutananController.findAll.bind(skPerhutananController));
router.get('/stats', skPerhutananController.getStats.bind(skPerhutananController));
router.get('/pending/:jabatanCode', skPerhutananController.getPendingByJabatan.bind(skPerhutananController));
router.get('/jabatan/:jabatanCode/users', skPerhutananController.getUsersByJabatan.bind(skPerhutananController));
router.get('/:id', requirePermission('sk_perhutanan.view'), skPerhutananController.findById.bind(skPerhutananController));

// CRUD
router.post('/', requirePermission('sk_perhutanan.create'), skPerhutananController.create.bind(skPerhutananController));
router.put('/:id', requirePermission('sk_perhutanan.edit'), skPerhutananController.update.bind(skPerhutananController));

// Workflow Actions
router.post('/:id/submit', requirePermission('sk_perhutanan.submit'), skPerhutananController.submit.bind(skPerhutananController));
router.post('/:id/process', requirePermission('sk_perhutanan.process'), skPerhutananController.processStep.bind(skPerhutananController));
router.post('/:id/nomor-nd', requirePermission('sk_perhutanan.process'), skPerhutananController.addNomorND.bind(skPerhutananController));
router.post('/:id/sign', requirePermission('sk_perhutanan.process'), skPerhutananController.signSK.bind(skPerhutananController));
router.post('/:id/nomor-sk', requirePermission('sk_perhutanan.process'), skPerhutananController.addNomorSK.bind(skPerhutananController));
router.post('/:id/finalize', requirePermission('sk_perhutanan.process'), skPerhutananController.finalize.bind(skPerhutananController));

export const skPerhutananRouter = router;
