import { prisma } from '../../config/database.js';
import { Client, LocalAuth, MessageMedia } from 'whatsapp-web.js';
import * as QRCode from 'qrcode';
import NodeCache from 'node-cache';

// Store active WhatsApp client instances
const clients = new Map<number, Client>();
const qrCodes = new Map<number, string>();

export class WhatsAppService {
  private static instance: WhatsAppService;
  private cache: NodeCache;
  private initialized = false;

  private constructor() {
    this.cache = new NodeCache({ stdTTL: 300 });
  }

  static getInstance(): WhatsAppService {
    if (!WhatsAppService.instance) {
      WhatsAppService.instance = new WhatsAppService();
    }
    return WhatsAppService.instance;
  }

  // Auto-reconnect all sessions on startup
  async initializeSessions() {
    if (this.initialized) return;
    this.initialized = true;

    try {
      const sessions = await prisma.wa_sessions.findMany();
      console.log(`[WhatsApp] Found ${sessions.length} session(s) to reconnect...`);

      for (const session of sessions) {
        // Run each reconnect in isolated manner - don't let one crash affect others
        this.reconnectSession(session.id, session.name).catch((err) => {
          console.error(`[WhatsApp] Failed to reconnect session ${session.id}:`, err);
        });
      }
    } catch (err) {
      console.error('[WhatsApp] Error initializing sessions:', err);
    }
  }

  private async reconnectSession(sessionId: number, sessionName: string): Promise<void> {
    // Check if already connected
    if (clients.has(sessionId)) {
      console.log(`[WhatsApp] Session ${sessionId} already connected`);
      return;
    }

    console.log(`[WhatsApp] Reconnecting session ${sessionId} (${sessionName})...`);
    await this.initClient(sessionId, sessionName);
  }

  async getSessions() {
    const sessions = await prisma.wa_sessions.findMany({
      orderBy: { created_at: 'desc' },
    });

    return sessions.map((s) => ({
      id: s.id,
      name: s.name,
      is_active: clients.has(s.id),
      qr_code: qrCodes.get(s.id) || null,
      last_seen: s.last_seen,
      created_at: s.created_at,
    }));
  }

  async getSession(id: number) {
    const session = await prisma.wa_sessions.findUnique({
      where: { id },
    });

    if (!session) {
      throw new Error('Session not found');
    }

    return {
      id: session.id,
      name: session.name,
      is_active: clients.has(session.id),
      qr_code: qrCodes.get(session.id) || null,
      last_seen: session.last_seen,
      created_at: session.created_at,
    };
  }

  async createSession(name: string) {
    // Check if session name already exists
    const existing = await prisma.wa_sessions.findUnique({
      where: { name },
    });

    if (existing) {
      throw new Error('Session with this name already exists');
    }

    // Create session in database
    const session = await prisma.wa_sessions.create({
      data: { name },
    });

    // Initialize WhatsApp client
    await this.initClient(session.id, name);

    return {
      id: session.id,
      name: session.name,
      is_active: false,
      qr_code: qrCodes.get(session.id) || null,
      created_at: session.created_at,
    };
  }

  private async initClient(sessionId: number, sessionName: string) {
    // Check if session data exists and is valid
    const sessionPath = `.wwebjs_auth/session-${sessionId}`;
    const fs = await import('fs');
    const path = await import('path');

    let authStrategy;
    try {
      authStrategy = new LocalAuth({
        dataPath: sessionPath,
        clientId: `session-${sessionId}`,
      });
    } catch {
      // If session data is corrupted, delete and recreate
      console.log(`[WhatsApp] Removing corrupted session data for ${sessionId}`);
      const fullPath = path.join(process.cwd(), `.wwebjs_auth`, `session-${sessionId}`);
      if (fs.existsSync(fullPath)) {
        fs.rmSync(fullPath, { recursive: true, force: true });
      }
      authStrategy = new LocalAuth({
        dataPath: sessionPath,
        clientId: `session-${sessionId}`,
      });
    }

    const client = new Client({
      authStrategy,
      puppeteer: {
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
      },
    });

    client.on('qr', async (qr) => {
      console.log(`[WhatsApp] QR generated for session ${sessionId}`);
      const qrDataUrl = await QRCode.toDataURL(qr);
      qrCodes.set(sessionId, qrDataUrl);
    });

    client.on('ready', async () => {
      console.log(`[WhatsApp] Client ready for session ${sessionId}`);
      await prisma.wa_sessions.update({
        where: { id: sessionId },
        data: { is_active: true, last_seen: new Date() },
      });
    });

    client.on('disconnected', async (reason) => {
      console.log(`[WhatsApp] Client disconnected for session ${sessionId}:`, reason);
      clients.delete(sessionId);
      qrCodes.delete(sessionId);
      try {
        await prisma.wa_sessions.update({
          where: { id: sessionId },
          data: { is_active: false },
        });
      } catch (e) {
        console.error('[WhatsApp] Failed to update session status:', e);
      }
    });

    client.on('message', async (msg) => {
      // Only log incoming messages in development
      if (process.env.NODE_ENV === 'development') {
        console.log(`[WhatsApp] Message received in session ${sessionId}:`, msg.body);
      }
    });

    client.on('auth_failure', async (msg) => {
      console.error(`[WhatsApp] Auth failure for session ${sessionId}:`, msg);
      clients.delete(sessionId);
      qrCodes.delete(sessionId);
      try {
        await prisma.wa_sessions.update({
          where: { id: sessionId },
          data: { is_active: false },
        });
      } catch (e) {
        console.error('[WhatsApp] Failed to update session status:', e);
      }
    });

    client.on('change_state', (state) => {
      console.log(`[WhatsApp] State change for session ${sessionId}:`, state);
    });

    client.on('loading_screen', (percent, message) => {
      console.log(`[WhatsApp] Loading session ${sessionId}: ${percent}% - ${message}`);
    });

    client.on('error', (err) => {
      console.error(`[WhatsApp] Client error for session ${sessionId}:`, err);
    });

    clients.set(sessionId, client);
    client.initialize().catch((err) => {
      console.error(`[WhatsApp] Failed to initialize client ${sessionId}:`, err);
      clients.delete(sessionId);
    });
  }

  async deleteSession(id: number) {
    // Get client if exists
    const client = clients.get(id);

    if (client) {
      try {
        await client.destroy();
      } catch (e) {
        console.error('Error destroying client:', e);
      }
      clients.delete(id);
    }

    qrCodes.delete(id);

    // Delete from database
    await prisma.wa_logs.deleteMany({
      where: { session_id: id },
    });

    await prisma.wa_sessions.delete({
      where: { id },
    });

    return { message: 'Session deleted successfully' };
  }

  async getQRCode(id: number) {
    const qr = qrCodes.get(id);

    if (!qr) {
      const session = await prisma.wa_sessions.findUnique({ where: { id } });
      if (!session) throw new Error('Session not found');
      if (clients.has(id)) {
        return { qr_code: null, is_active: true };
      }
      throw new Error('QR code not available. Please create a new session.');
    }

    return { qr_code: qr, is_active: false };
  }

  async sendMessage(sessionId: number, phone: string, message: string, userId: number) {
    const client = clients.get(sessionId);

    if (!client) {
      throw new Error('WhatsApp client is not connected');
    }

    // Format phone number (ensure it has country code)
    const formattedPhone = this.formatPhoneNumber(phone);

    // Create log entry
    const log = await prisma.wa_logs.create({
      data: {
        session_id: sessionId,
        phone: formattedPhone,
        message,
        status: 'PENDING',
        created_by: userId,
      },
    });

    try {
      await client.sendMessage(formattedPhone, message);

      await prisma.wa_logs.update({
        where: { id: log.id },
        data: { status: 'SENT' },
      });

      // Update session last_seen
      await prisma.wa_sessions.update({
        where: { id: sessionId },
        data: { last_seen: new Date() },
      });

      return { message: 'Message sent successfully', log_id: log.id };
    } catch (error: any) {
      // Update log with error but don't crash
      try {
        await prisma.wa_logs.update({
          where: { id: log.id },
          data: { status: 'FAILED', error: error.message },
        });
      } catch (logError) {
        console.error('[WhatsApp] Failed to update log:', logError);
      }

      throw new Error(`Failed to send message: ${error.message}`);
    }
  }

  async getLogs(params: { session_id?: number; phone?: string; status?: string; page?: number; limit?: number }) {
    const page = params.page || 1;
    const limit = params.limit || 20;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (params.session_id) where.session_id = params.session_id;
    if (params.phone) where.phone = { contains: params.phone, mode: 'insensitive' };
    if (params.status) where.status = params.status;

    const [logs, total] = await Promise.all([
      prisma.wa_logs.findMany({
        where,
        include: {
          session: { select: { name: true } },
          creator: { select: { fullname: true } },
        },
        orderBy: { created_at: 'desc' },
        skip,
        take: limit,
      }),
      prisma.wa_logs.count({ where }),
    ]);

    return {
      items: logs,
      pagination: { page, limit, total },
    };
  }

  private formatPhoneNumber(phone: string): string {
    // Remove all non-digit characters
    let cleaned = phone.replace(/\D/g, '');

    // If starts with 0, replace with 62 (Indonesia country code)
    if (cleaned.startsWith('0')) {
      cleaned = '62' + cleaned.substring(1);
    }

    // If doesn't have country code, assume Indonesia (62)
    if (!cleaned.startsWith('62')) {
      cleaned = '62' + cleaned;
    }

    // Add @c.us suffix for WhatsApp
    return cleaned + '@c.us';
  }
}

export const whatsappService = WhatsAppService.getInstance();
