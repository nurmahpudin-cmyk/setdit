import { Router } from 'express';
import { kabkotaController } from './controller.js';
import { authMiddleware } from '../../middleware/auth.js';

const router = Router();
router.use(authMiddleware);

router.get('/', kabkotaController.findAll.bind(kabkotaController));
router.get('/:id', kabkotaController.findById.bind(kabkotaController));
router.post('/', kabkotaController.create.bind(kabkotaController));
router.put('/:id', kabkotaController.update.bind(kabkotaController));
router.delete('/:id', kabkotaController.delete.bind(kabkotaController));

export const kabkotaRouter = router;
