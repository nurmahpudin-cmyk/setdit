import { prisma } from '../../config/database.js';
import { config } from '../../config/index.js';
import {
  hashPassword,
  verifyPassword,
  generateOTP,
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
} from '../../utils/index.js';
import { createAuditLog } from '../../middleware/audit.js';
import { whatsappService } from '../whatsapp/service.js';
import NodeCache from 'node-cache';
import type { AuthRequest } from '../../middleware/auth.js';
import { randomBytes } from 'crypto';

const refreshTokenCache = new NodeCache();
const captchaCache = new NodeCache({ stdTTL: 300 }); // 5 minutes

export class AuthService {
  async register(data: {
    fullname: string;
    username: string;
    email: string;
    phone: string;
    password: string;
  }) {
    const existingUser = await prisma.mst_users.findFirst({
      where: {
        OR: [{ email: data.email }, { username: data.username }, { phone: data.phone }],
      },
    });

    if (existingUser) {
      throw new Error('User with this email, username, or phone already exists');
    }

    const hashedPassword = await hashPassword(data.password);

    const user = await prisma.mst_users.create({
      data: {
        fullname: data.fullname,
        username: data.username,
        email: data.email,
        phone: data.phone,
        password: hashedPassword,
        status: 'VERIFIED', // Auto-verify for now (OTP later)
        is_verified: true,
      },
    });

    // Create approval record
    await prisma.tr_user_approval.create({
      data: {
        user_id: user.id,
        action: 'REGISTER',
        status: 'PENDING',
      },
    });

    const tokens = this.generateTokens(user);

    return {
      user: this.sanitizeUser(user),
      ...tokens,
    };
  }

  async login(data: { login: string; password: string }, req: AuthRequest) {
    console.log('[SERVICE] Login attempt for:', data.login);
    console.log('[SERVICE] Password length:', data.password?.length);

    const user = await prisma.mst_users.findFirst({
      where: {
        OR: [{ email: data.login }, { username: data.login }, { phone: data.login }],
        deleted_at: null,
      },
    });

    console.log('[SERVICE] User found:', user ? `yes (id=${user.id}, email=${user.email})` : 'NO');

    if (!user) {
      throw new Error('Invalid credentials');
    }

    // Check lockout
    if (user.locked_until && user.locked_until > new Date()) {
      const minutesLeft = Math.ceil((user.locked_until.getTime() - Date.now()) / 60000);
      throw new Error(`Account is locked. Try again in ${minutesLeft} minutes`);
    }

    const isValid = await verifyPassword(data.password, user.password);
    if (!isValid) {
      await prisma.mst_users.update({
        where: { id: user.id },
        data: {
          failed_login: { increment: 1 },
          locked_until:
            user.failed_login + 1 >= config.login.maxAttempts
              ? new Date(Date.now() + config.login.lockoutDuration * 1000)
              : undefined,
        },
      });
      throw new Error('Invalid credentials');
    }

    // Reset failed attempts on successful login
    await prisma.mst_users.update({
      where: { id: user.id },
      data: { failed_login: 0, locked_until: null },
    });

    const tokens = this.generateTokens(user);

    // Store refresh token
    refreshTokenCache.set(`refresh:${user.id}`, tokens.refreshToken, 7 * 24 * 60 * 60);

    await createAuditLog(req, 'auth', 'login');

    return {
      user: this.sanitizeUser(user),
      ...tokens,
    };
  }

  async refresh(refreshToken: string) {
    const decoded = verifyRefreshToken(refreshToken);

    const storedToken = refreshTokenCache.get<string>(`refresh:${decoded.id}`);
    if (!storedToken || storedToken !== refreshToken) {
      throw new Error('Invalid refresh token');
    }

    const user = await prisma.mst_users.findUnique({
      where: { id: decoded.id, deleted_at: null },
    });

    if (!user) {
      throw new Error('User not found');
    }

    if (user.status !== 'ACTIVE') {
      throw new Error('Account is not active');
    }

    const tokens = this.generateTokens(user);
    refreshTokenCache.set(`refresh:${user.id}`, tokens.refreshToken, 7 * 24 * 60 * 60);

    return tokens;
  }

  async logout(userId: number, req: AuthRequest) {
    refreshTokenCache.del(`refresh:${userId}`);
    await createAuditLog(req, 'auth', 'logout');
    return { message: 'Logged out successfully' };
  }

  async sendOTP(userId: number, type: 'REGISTRATION' | 'FORGOT_PASSWORD' | 'LOGIN') {
    const otp = generateOTP(config.otp.length);
    const expiresAt = new Date(Date.now() + config.otp.expiresIn * 1000);

    await prisma.tr_otp.create({
      data: {
        user_id: userId,
        code: otp,
        type,
        expires_at: expiresAt,
      },
    });

    // Get user phone for WhatsApp
    const user = await prisma.mst_users.findUnique({
      where: { id: userId },
      select: { phone: true, fullname: true },
    });

    if (user?.phone) {
      try {
        // Get active WhatsApp session
        const sessions = await prisma.wa_sessions.findFirst({
          where: { is_active: true },
          orderBy: { created_at: 'desc' },
        });

        if (sessions) {
          const message = `Halo ${user.fullname}!\n\nKode OTP Anda adalah: *${otp}*\n\nKode ini berlaku selama 5 menit. Jangan bagikan kode ini kepada siapapun.`;
          console.log(`[OTP] Attempting to send WA to ${user.phone}, session ${sessions.id}`);
          await whatsappService.sendMessage(sessions.id, user.phone, message, userId);
          console.log(`[OTP] Successfully sent via WhatsApp to ${user.phone}`);
        } else {
          console.log(`[OTP] No active WhatsApp session!`);
          console.log(`[OTP] OTP shown in console (for testing): ${otp}`);
        }
      } catch (err: any) {
        console.error('[OTP] WhatsApp send error:', err?.message || err);
        console.log(`[OTP] OTP shown in console (fallback): ${otp}`);
      }
    } else {
      console.log(`[OTP] User ${userId} has no phone number`);
      console.log(`[OTP] OTP shown in console: ${otp}`);
    }

    return { message: 'OTP sent successfully', expires_in: config.otp.expiresIn };
  }

  async verifyOTP(userId: number, code: string, type: 'REGISTRATION' | 'FORGOT_PASSWORD' | 'LOGIN') {
    // Trim whitespace from code
    const trimmedCode = code.trim();

    console.log(`[OTP Verify] userId: ${userId}, type: ${type}`);
    console.log(`[OTP Verify] Input code: "${trimmedCode}" (length: ${trimmedCode.length})`);

    const otp = await prisma.tr_otp.findFirst({
      where: {
        user_id: userId,
        code: trimmedCode,
        type,
        is_used: false,
        expires_at: { gt: new Date() },
      },
      orderBy: { created_at: 'desc' },
    });

    if (!otp) {
      // Debug: check if there's an OTP with different status
      const allOtps = await prisma.tr_otp.findMany({
        where: { user_id: userId, type },
        orderBy: { created_at: 'desc' },
        take: 5,
      });
      console.log(`[OTP Verify] No matching OTP found. Checking all OTPs for this user/type:`);
      allOtps.forEach((o, i) => {
        console.log(`  [${i}] DB code: "${o.code}" (length: ${o.code.length}), is_used: ${o.is_used}, expires: ${o.expires_at}`);
        console.log(`  [${i}] Match: ${o.code === trimmedCode}`);
      });
      throw new Error('Invalid or expired OTP');
    }

    console.log(`[OTP Verify] OTP matched! Marking as used.`);

    await prisma.tr_otp.update({
      where: { id: otp.id },
      data: { is_used: true },
    });

    if (type === 'REGISTRATION') {
      await prisma.mst_users.update({
        where: { id: userId },
        data: { is_verified: true, status: 'ACTIVE' },
      });
    }

    return { message: 'OTP verified successfully' };
  }

  async forgotPassword(phone: string) {
    // Normalize phone number - convert all formats to 08xx format
    const cleaned = phone.replace(/[\s\-\+]/g, '');
    const normalizedPhone = cleaned.startsWith('62') ? `0${cleaned.substring(2)}` : cleaned;

    const user = await prisma.mst_users.findFirst({
      where: {
        OR: [
          { phone: normalizedPhone },
          { phone: `62${normalizedPhone.replace(/^0/, '')}` },
        ],
        deleted_at: null,
      },
    });

    if (!user) {
      throw new Error('Nomor HP tidak terdaftar');
    }

    const result = await this.sendOTP(user.id, 'FORGOT_PASSWORD');
    return { ...result, user_id: user.id };
  }

  async resetPassword(userId: number, newPassword: string) {
    const hashedPassword = await hashPassword(newPassword);

    await prisma.mst_users.update({
      where: { id: userId },
      data: { password: hashedPassword },
    });

    // Invalidate all OTPs for this user
    await prisma.tr_otp.updateMany({
      where: { user_id: userId, is_used: false },
      data: { is_used: true },
    });

    return { message: 'Password reset successfully' };
  }

  async getProfile(userId: number) {
    const user = await prisma.mst_users.findUnique({
      where: { id: userId },
      include: {
        position: true,
        unit: true,
        roles: {
          include: {
            role: {
              include: {
                permissions: { include: { permission: true } },
              },
            },
          },
        },
        permissions: { include: { permission: true } },
      },
    });

    if (!user) {
      throw new Error('User not found');
    }

    // Extract effective permission codes
    const rolePerms = user.roles.flatMap((ur) =>
      ur.role.permissions.map((rp) => rp.permission.code)
    );
    const directPerms = user.permissions.map((up) => up.permission.code);
    const effectivePermissions = [...new Set([...rolePerms, ...directPerms])];

    const sanitized = this.sanitizeUser(user);
    return { ...sanitized, effectivePermissions };
  }

  private generateTokens(user: any) {
    const payload = { id: user.id, email: user.email, username: user.username };
    return {
      accessToken: generateAccessToken(payload),
      refreshToken: generateRefreshToken(payload),
    };
  }

  private sanitizeUser(user: any) {
    const { password, ...sanitized } = user;
    return sanitized;
  }

  generateCaptcha() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    const code = Array.from({ length: 5 }, () =>
      chars[Math.floor(Math.random() * chars.length)]
    ).join('');
    const token = randomBytes(32).toString('hex');
    captchaCache.set(`captcha:${token}`, code.toLowerCase(), 300);
    return { token, code };
  }

  verifyCaptcha(token: string, userInput: string) {
    const stored = captchaCache.get<string>(`captcha:${token}`);
    if (!stored) return false;
    captchaCache.del(`captcha:${token}`);
    return stored === userInput.toLowerCase().trim();
  }
}

export const authService = new AuthService();