import { Router } from 'express';
import { provinsiController } from './controller.js';
import { authMiddleware } from '../../middleware/auth.js';

const router = Router();
router.use(authMiddleware);

router.get('/', provinsiController.findAll.bind(provinsiController));
router.get('/:id', provinsiController.findById.bind(provinsiController));
router.post('/', provinsiController.create.bind(provinsiController));
router.put('/:id', provinsiController.update.bind(provinsiController));
router.delete('/:id', provinsiController.delete.bind(provinsiController));

export const provinsiRouter = router;
