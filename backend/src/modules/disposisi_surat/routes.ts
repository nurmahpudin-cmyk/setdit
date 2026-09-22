import { Router } from 'express';
import { disposisiSuratController } from './controller.js';
import { authMiddleware } from '../../middleware/auth.js';

const router = Router();
router.use(authMiddleware);

// Main CRUD routes
router.get('/', disposisiSuratController.findAll.bind(disposisiSuratController));
router.get('/stats', disposisiSuratController.getStats.bind(disposisiSuratController));
router.get('/options', disposisiSuratController.getDropdownOptions.bind(disposisiSuratController));
router.get('/:id', disposisiSuratController.findById.bind(disposisiSuratController));
router.post('/', disposisiSuratController.create.bind(disposisiSuratController));
router.put('/:id', disposisiSuratController.update.bind(disposisiSuratController));
router.delete('/:id', disposisiSuratController.delete.bind(disposisiSuratController));
router.patch('/:id/status-tl', disposisiSuratController.updateStatusTL.bind(disposisiSuratController));
router.post('/:id/notify', disposisiSuratController.sendNotification.bind(disposisiSuratController));

// Access management routes
router.get('/access/list', disposisiSuratController.getAccessList.bind(disposisiSuratController));
router.get('/access/my', disposisiSuratController.getUserAccess.bind(disposisiSuratController));
router.post('/access', disposisiSuratController.grantAccess.bind(disposisiSuratController));
router.delete('/access/:id', disposisiSuratController.revokeAccess.bind(disposisiSuratController));
router.get('/users', disposisiSuratController.getAllUsers.bind(disposisiSuratController));

export const disposisiSuratRouter = router;
