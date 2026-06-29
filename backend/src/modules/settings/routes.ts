import { Router } from 'express';
import { settingsController } from './controller.js';
import { authMiddleware } from '../../middleware/auth.js';
import { requirePermission } from '../../middleware/rbac.js';
import { upload } from '../../middleware/upload.js';

const router = Router();

router.get('/', settingsController.get.bind(settingsController));
router.put('/', authMiddleware, requirePermission('setting.update', 'settings.update', 'setting.manage'), settingsController.update.bind(settingsController));
router.post('/upload-logo', authMiddleware, requirePermission('setting.update', 'settings.update', 'setting.manage'), upload.single('logo'), settingsController.uploadLogo.bind(settingsController));

export const settingsRouter = router;