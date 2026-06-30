import { Router } from 'express';
import { authController } from './controller.js';
import { authMiddleware } from '../../middleware/auth.js';

const router = Router();

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     tags: [Auth]
 *     summary: Register new user
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [fullname, username, email, phone, password]
 *             properties:
 *               fullname:
 *                 type: string
 *                 example: John Doe
 *               username:
 *                 type: string
 *                 example: johndoe
 *               email:
 *                 type: string
 *                 format: email
 *                 example: john@example.com
 *               phone:
 *                 type: string
 *                 example: "081234567890"
 *               password:
 *                 type: string
 *                 minLength: 6
 *                 example: Password123!
 *     responses:
 *       201:
 *         description: User registered successfully
 *       400:
 *         description: Validation error or user already exists
 */
router.post('/register', authController.register.bind(authController));

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     tags: [Auth]
 *     summary: User login
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [login, password]
 *             properties:
 *               login:
 *                 type: string
 *                 description: Email, username, or phone number
 *                 example: admin@setdit.local
 *               password:
 *                 type: string
 *                 example: Admin123!
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     user:
 *                       $ref: '#/components/schemas/User'
 *                     accessToken:
 *                       type: string
 *                     refreshToken:
 *                       type: string
 *       401:
 *         description: Invalid credentials
 */
router.post('/login', authController.login.bind(authController));

/**
 * @swagger
 * /api/auth/refresh:
 *   post:
 *     tags: [Auth]
 *     summary: Refresh access token
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [refreshToken]
 *             properties:
 *               refreshToken:
 *                 type: string
 *     responses:
 *       200:
 *         description: Token refreshed successfully
 *       401:
 *         description: Invalid refresh token
 */
router.post('/refresh', authController.refresh.bind(authController));

/**
 * @swagger
 * /api/auth/logout:
 *   post:
 *     tags: [Auth]
 *     summary: User logout
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Logout successful
 */
router.post('/logout', authMiddleware, authController.logout.bind(authController));

/**
 * @swagger
 * /api/auth/verify-otp:
 *   post:
 *     tags: [Auth]
 *     summary: Verify OTP code
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [userId, code, type]
 *             properties:
 *               userId:
 *                 type: integer
 *                 example: 1
 *               code:
 *                 type: string
 *                 example: "123456"
 *               type:
 *                 type: string
 *                 enum: [REGISTRATION, FORGOT_PASSWORD, LOGIN]
 *                 example: FORGOT_PASSWORD
 *     responses:
 *       200:
 *         description: OTP verified successfully
 *       400:
 *         description: Invalid or expired OTP
 */
router.post('/verify-otp', authController.verifyOTP.bind(authController));

/**
 * @swagger
 * /api/auth/forgot-password:
 *   post:
 *     tags: [Auth]
 *     summary: Request password reset OTP
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [phone]
 *             properties:
 *               phone:
 *                 type: string
 *                 example: "081234567890"
 *     responses:
 *       200:
 *         description: OTP sent successfully
 *       404:
 *         description: Phone number not registered
 */
router.post('/forgot-password', authController.forgotPassword.bind(authController));

/**
 * @swagger
 * /api/auth/reset-password:
 *   post:
 *     tags: [Auth]
 *     summary: Reset password with OTP
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [userId, code, newPassword]
 *             properties:
 *               userId:
 *                 type: integer
 *                 example: 1
 *               code:
 *                 type: string
 *                 example: "123456"
 *               newPassword:
 *                 type: string
 *                 minLength: 6
 *                 example: NewPassword123!
 *     responses:
 *       200:
 *         description: Password reset successfully
 *       400:
 *         description: Invalid OTP
 */
router.post('/reset-password', authController.resetPassword.bind(authController));

/**
 * @swagger
 * /api/auth/profile:
 *   get:
 *     tags: [Auth]
 *     summary: Get current user profile
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User profile data
 *       401:
 *         description: Unauthorized
 */
router.get('/profile', authMiddleware, authController.getProfile.bind(authController));

/**
 * @swagger
 * /api/auth/captcha:
 *   get:
 *     tags: [Auth]
 *     summary: Get captcha image
 *     responses:
 *       200:
 *         description: Captcha data
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 token:
 *                   type: string
 *                 code:
 *                   type: string
 */
router.get('/captcha', authController.getCaptcha.bind(authController));

/**
 * @swagger
 * /api/auth/verify-captcha:
 *   post:
 *     tags: [Auth]
 *     summary: Verify captcha
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [token, code]
 *             properties:
 *               token:
 *                 type: string
 *               code:
 *                 type: string
 *     responses:
 *       200:
 *         description: Captcha verified
 *       400:
 *         description: Invalid captcha
 */
router.post('/verify-captcha', authController.verifyCaptcha.bind(authController));

export const authRouter = router;