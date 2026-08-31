import { prisma } from '../../config/database.js';

export class NotificationsService {
  // Create a notification for a user (used by other modules)
  async create(userId: number, type: string, title: string, message: string, link?: string) {
    try {
      await prisma.mst_notifications.create({
        data: { user_id: userId, type, title, message, link },
      });
    } catch (err: any) {
      console.error('[Notifications] Failed to create:', err?.message || err);
    }
  }

  async findByUser(userId: number, query: { page?: number; limit?: number; unread_only?: boolean }) {
    const page = query.page || 1;
    const limit = query.limit || 20;
    const skip = (page - 1) * limit;

    const where: any = { user_id: userId };
    if (query.unread_only) {
      where.is_read = false;
    }

    const [items, total, unreadCount] = await Promise.all([
      prisma.mst_notifications.findMany({
        where,
        skip,
        take: limit,
        orderBy: { created_at: 'desc' },
      }),
      prisma.mst_notifications.count({ where }),
      prisma.mst_notifications.count({ where: { user_id: userId, is_read: false } }),
    ]);

    return {
      items,
      unread_count: unreadCount,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async unreadCount(userId: number) {
    const count = await prisma.mst_notifications.count({
      where: { user_id: userId, is_read: false },
    });
    return { unread_count: count };
  }

  async markRead(userId: number, id: number) {
    await prisma.mst_notifications.updateMany({
      where: { id, user_id: userId },
      data: { is_read: true },
    });
    return { message: 'Notification marked as read' };
  }

  async markAllRead(userId: number) {
    await prisma.mst_notifications.updateMany({
      where: { user_id: userId, is_read: false },
      data: { is_read: true },
    });
    return { message: 'All notifications marked as read' };
  }
}

export const notificationsService = new NotificationsService();
