import { Router } from 'express';
import { disposisiController } from './controller.js';
import { authMiddleware } from '../../middleware/auth.js';

const router = Router();
router.use(authMiddleware);

router.get('/', disposisiController.findAll.bind(disposisiController));
router.get('/stats', disposisiController.getStats.bind(disposisiController));
router.get('/units', disposisiController.getUnits.bind(disposisiController));
router.get('/jenis-surat', disposisiController.getJenisSurat.bind(disposisiController));
router.get('/:id', disposisiController.findById.bind(disposisiController));
router.post('/', disposisiController.create.bind(disposisiController));
router.post('/:id/submit', disposisiController.submit.bind(disposisiController));
router.post('/:id/process', disposisiController.processStep.bind(disposisiController));
router.post('/:id/tindak-lanjut', disposisiController.createTindakLanjut.bind(disposisiController));
router.put('/:id/tindak-lanjut/:tlId', disposisiController.updateTindakLanjut.bind(disposisiController));

export const disposisiRouter = router;
