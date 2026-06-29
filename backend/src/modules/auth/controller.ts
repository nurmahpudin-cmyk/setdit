import { Request, Response } from 'express';
import { authService } from './service.js';
import { apiResponse, apiError } from '../../utils/index.js';
import { z } from 'zod';

const registerSchema = z.object({
  fullname: z.string().min(2).max(100),
  username: z.string().min(3).max(50).regex(/^[a-zA-Z0-9_]+$/),
  email: z.string().email(),
  phone: z.string().min(10).max(20),
  password: z.string().min(8).regex(/^(?=.*[a-zA-Z])(?=.*[0-9])/),
});

const loginSchema = z.object({
  login: z.string().min(1),
  password: z.string().min(1),
});

const verifyOTPSchema = z.object({
  user_id: z.number().int().positive(),
  code: z.string().length(6),
  type: z.enum(['REGISTRATION', 'FORGOT_PASSWORD', 'LOGIN']),
});

const resetPasswordSchema = z.object({
  user_id: z.number().int().positive(),
  new_password: z.string().min(8),
});

export class AuthController {
  async register(req: Request, res: Response) {
    try {
      const data = registerSchema.parse(req.body);
      const result = await authService.register(data);
      apiResponse(res, result, 'Registration successful', 201);
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        apiError(res, 'Validation error', 400, error.errors);
      } else {
        apiError(res, error.message, 400);
      }
    }
  }

  async login(req: Request, res: Response) {
    console.log('[LOGIN DEBUG] Body:', req.body);
    try {
      const data = loginSchema.parse(req.body);
      console.log('[LOGIN DEBUG] Parsed:', data);
      const result = await authService.login(data, req);
      apiResponse(res, result, 'Login successful');
    } catch (error: any) {
      console.log('[LOGIN DEBUG] Error:', error.message);
      if (error instanceof z.ZodError) {
        apiError(res, 'Validation error', 400, error.errors);
      } else {
        apiError(res, error.message, 401);
      }
    }
  }

  async refresh(req: Request, res: Response) {
    try {
      const { refreshToken } = req.body;
      if (!refreshToken) {
        apiError(res, 'Refresh token is required', 400);
        return;
      }
      const result = await authService.refresh(refreshToken);
      apiResponse(res, result, 'Token refreshed');
    } catch (error: any) {
      apiError(res, error.message, 401);
    }
  }

  async logout(req: Request, res: Response) {
    try {
      const authReq = req as any;
      const userId = authReq.user?.id;
      if (userId) {
        await authService.logout(userId, authReq);
      }
      apiResponse(res, null, 'Logged out');
    } catch (error: any) {
      apiError(res, error.message, 400);
    }
  }

  async verifyOTP(req: Request, res: Response) {
    try {
      console.log(`[OTP Controller] Request body:`, req.body);
      const data = verifyOTPSchema.parse(req.body);
      console.log(`[OTP Controller] Parsed data:`, data);
      const result = await authService.verifyOTP(data.user_id, data.code, data.type);
      console.log(`[OTP Controller] Success!`);
      apiResponse(res, result, 'OTP verified');
    } catch (error: any) {
      console.log(`[OTP Controller] Error:`, error.message || error);
      if (error instanceof z.ZodError) {
        apiError(res, 'Validation error', 400, error.errors);
      } else {
        apiError(res, error.message, 400);
      }
    }
  }

  async forgotPassword(req: Request, res: Response) {
    try {
      const { phone } = req.body;
      if (!phone) {
        apiError(res, 'Nomor HP wajib diisi', 400);
        return;
      }
      const result = await authService.forgotPassword(phone);
      apiResponse(res, result, 'Kode OTP telah dikirim via WhatsApp');
    } catch (error: any) {
      apiError(res, error.message, 400);
    }
  }

  async resetPassword(req: Request, res: Response) {
    try {
      const data = resetPasswordSchema.parse(req.body);
      const result = await authService.resetPassword(data.user_id, data.new_password);
      apiResponse(res, result, 'Password reset successful');
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        apiError(res, 'Validation error', 400, error.errors);
      } else {
        apiError(res, error.message, 400);
      }
    }
  }

  async getProfile(req: Request, res: Response) {
    try {
      const authReq = req as any;
      if (!authReq.user?.id) {
        apiError(res, 'Unauthorized', 401);
        return;
      }
      const result = await authService.getProfile(authReq.user.id);
      apiResponse(res, result);
    } catch (error: any) {
      apiError(res, error.message, 400);
    }
  }

  getCaptcha(_req: Request, res: Response) {
    const { token, code } = authService.generateCaptcha();
    apiResponse(res, { token, code }, 'Captcha generated');
  }

  verifyCaptcha(req: Request, res: Response) {
    const { token, userInput } = req.body;
    if (!token || !userInput) {
      apiError(res, 'Token and userInput are required', 400);
      return;
    }
    const valid = authService.verifyCaptcha(token, userInput);
    if (!valid) {
      apiError(res, 'Invalid captcha', 400);
      return;
    }
    apiResponse(res, { valid: true }, 'Captcha verified');
  }
}

export const authController = new AuthController();