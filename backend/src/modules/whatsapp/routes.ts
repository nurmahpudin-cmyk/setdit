import { Router } from 'express';
import { whatsappController } from './controller.js';
import { authMiddleware } from '../../middleware/auth.js';
import { requirePermission } from '../../middleware/rbac.js';

const router = Router();

router.use(authMiddleware);

// Sessions
router.get('/sessions', requirePermission('wa.view'), whatsappController.findAll.bind(whatsappController));
router.get('/sessions/:id', requirePermission('wa.view'), whatsappController.findById.bind(whatsappController));
router.post('/sessions', requirePermission('wa.manage'), whatsappController.create.bind(whatsappController));
router.delete('/sessions/:id', requirePermission('wa.manage'), whatsappController.delete.bind(whatsappController));
router.get('/sessions/:id/qr', requirePermission('wa.view'), whatsappController.getQRCode.bind(whatsappController));
router.post('/sessions/:id/send', requirePermission('wa.send'), whatsappController.sendMessage.bind(whatsappController));

// Logs
router.get('/logs', requirePermission('wa.view'), whatsappController.getLogs.bind(whatsappController));

export const whatsappRouter = router;
