import { prisma } from '../../config/database.js';

export class LogsService {
  async activityLogs(query: {
    page?: number;
    limit?: number;
    user_id?: number;
    module?: string;
    action?: string;
    date_from?: string;
    date_to?: string;
  }) {
    const page = query.page || 1;
    const limit = query.limit || 20;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (query.user_id) {
      where.user_id = query.user_id;
    }
    if (query.module) {
      where.module = query.module;
    }
    if (query.action) {
      where.action = query.action;
    }
    if (query.date_from || query.date_to) {
      where.created_at = {};
      if (query.date_from) {
        where.created_at.gte = new Date(query.date_from);
      }
      if (query.date_to) {
        where.created_at.lte = new Date(query.date_to + 'T23:59:59');
      }
    }

    const [logs, total] = await Promise.all([
      prisma.activity_logs.findMany({
        where,
        include: { user: { select: { id: true, fullname: true, email: true } } },
        skip,
        take: limit,
        orderBy: { created_at: 'desc' },
      }),
      prisma.activity_logs.count({ where }),
    ]);

    return { logs, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } };
  }

  async waLogs(query: { page?: number; limit?: number; phone?: string; status?: string }) {
    const page = query.page || 1;
    const limit = query.limit || 20;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (query.phone) {
      where.phone = { contains: query.phone, mode: 'insensitive' };
    }
    if (query.status) {
      where.status = query.status;
    }

    const [logs, total] = await Promise.all([
      prisma.wa_logs.findMany({
        where,
        include: {
          session: { select: { id: true, name: true } },
          creator: { select: { id: true, fullname: true } },
        },
        skip,
        take: limit,
        orderBy: { created_at: 'desc' },
      }),
      prisma.wa_logs.count({ where }),
    ]);

    return { logs, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } };
  }
}

export const logsService = new LogsService();