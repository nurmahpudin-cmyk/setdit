import { Router } from 'express';
import { skemaController } from './controller.js';
import { authMiddleware } from '../../middleware/auth.js';

const router = Router();
router.use(authMiddleware);

router.get('/', skemaController.findAll.bind(skemaController));
router.get('/:id', skemaController.findById.bind(skemaController));
router.post('/', skemaController.create.bind(skemaController));
router.put('/:id', skemaController.update.bind(skemaController));
router.delete('/:id', skemaController.delete.bind(skemaController));

export const skemaRouter = router;
