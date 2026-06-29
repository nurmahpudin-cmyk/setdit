import { Router } from 'express';
import { authController } from './controller.js';
import { authMiddleware } from '../../middleware/auth.js';

const router = Router();

router.post('/register', authController.register.bind(authController));
router.post('/login', authController.login.bind(authController));
router.post('/refresh', authController.refresh.bind(authController));
router.post('/logout', authMiddleware, authController.logout.bind(authController));
router.post('/verify-otp', authController.verifyOTP.bind(authController));
router.post('/forgot-password', authController.forgotPassword.bind(authController));
router.post('/reset-password', authController.resetPassword.bind(authController));
router.get('/profile', authMiddleware, authController.getProfile.bind(authController));
router.get('/captcha', authController.getCaptcha.bind(authController));
router.post('/verify-captcha', authController.verifyCaptcha.bind(authController));

export const authRouter = router;