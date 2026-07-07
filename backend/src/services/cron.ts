import cron from 'node-cron';
import { prisma } from '../config/database.js';
import { jadwalPimpinanService } from '../modules/jadwal_pimpinan/service.js';
import { whatsappService } from '../modules/whatsapp/service.js';

export class CronService {
  private isRunning = false;

  async sendWeeklyJadwalNotification() {
    if (this.isRunning) {
      console.log('[CRON] Weekly job already running, skipping...');
      return;
    }

    this.isRunning = true;
    console.log('[CRON] Starting weekly jadwal notification job...');

    try {
      // Get all users with ASPRI_DIRJEN position
      const aspriUsers = await prisma.mst_users.findMany({
        where: {
          status: 'ACTIVE',
          is_verified: true,
          position: {
            code: 'ASPRI_DIRJEN',
            is_active: true,
          },
        },
        select: {
          id: true,
          fullname: true,
          phone: true,
        },
      });

      if (aspriUsers.length === 0) {
        console.log('[CRON] No ASPRI_DIRJEN users found');
        return;
      }

      // Get weekly jadwal (7 days ahead)
      const jadwalList = await jadwalPimpinanService.getUpcomingJadwal({ type: 'weekly' });

      if (jadwalList.length === 0) {
        console.log('[CRON] No jadwal found for this week');
        return;
      }

      // Build message
      const message = this.buildWeeklyMessage(jadwalList);

      // Get active WhatsApp session
      const session = await prisma.wa_sessions.findFirst({
        where: { is_active: true },
      });

      if (!session) {
        console.log('[CRON] No active WhatsApp session');
        return;
      }

      // Send to each ASPRI user
      let successCount = 0;
      let failCount = 0;

      for (const user of aspriUsers) {
        if (!user.phone) {
          console.log(`[CRON] User ${user.fullname} has no WhatsApp number, skipping...`);
          failCount++;
          continue;
        }

        try {
          await whatsappService.sendMessage(
            session.id,
            user.phone,
            message,
            0 // system user
          );
          successCount++;
          console.log(`[CRON] Sent to ${user.fullname} (${user.phone})`);

          // Log activity
          await prisma.activity_logs.create({
            data: {
              user_id: 0,
              module: 'CRON_WEEKLY_JADWAL',
              action: 'SEND_WA',
              new_data: {
                user_id: user.id,
                phone: user.phone,
                jadwal_count: jadwalList.length,
              },
            },
          });
        } catch (error: any) {
          failCount++;
          console.error(`[CRON] Failed to send to ${user.fullname}:`, error.message);
        }
      }

      console.log(`[CRON] Weekly notification complete: ${successCount} sent, ${failCount} failed`);
    } catch (error: any) {
      console.error('[CRON] Error in weekly jadwal notification:', error);
    } finally {
      this.isRunning = false;
    }
  }

  private buildWeeklyMessage(jadwalList: any[]): string {
    const formatTgl = (d: Date) =>
      `${d.getDate().toString().padStart(2, '0')}-${(d.getMonth() + 1).toString().padStart(2, '0')}-${d.getFullYear()}`;

    let message = `*JADWAL MINGGUAN - H+7*\n\n`;
    message += `Izin kami sampaikan agenda Ibu Dirjen Bulan ${new Date().toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })} untuk:\n\n`;

    for (const j of jadwalList) {
      const tglAwal = new Date(j.tanggal_awal);
      const tglAkhir = new Date(j.tanggal_akhir);

      message += `Tanggal : ${formatTgl(tglAwal)}`;
      if (tglAwal.toDateString() !== tglAkhir.toDateString()) {
        message += ` - ${formatTgl(tglAkhir)}`;
      }
      message += `\n`;
      message += `${j.acara} (${j.lokasi})\n`;

      if (j.pendamping_pegawai.length > 0) {
        message += `Pendamping:\n`;
        j.pendamping_pegawai.forEach((p: any, idx: number) => {
          message += `${idx + 1}. ${p.pegawai?.nama_lengkap || '-'}\n`;
        });
      }

      if (j.pendamping_direktur.length > 0) {
        message += `Pendamping Direktorat:\n`;
        j.pendamping_direktur.forEach((d: any) => {
          message += `Dir ${d.nama_direktur}\n`;
        });
      }

      message += '\n';
    }

    message += `---\n*Disfiarkan oleh Sistem Jadwal*`;

    return message;
  }

  start() {
    // Run every Sunday at 08:00 AM
    // Cron: second(0) minute(0) hour(8) day-of-month(*) month(*) day-of-week(0=Sunday)
    cron.schedule('0 0 8 * * 0', async () => {
      await this.sendWeeklyJadwalNotification();
    }, {
      timezone: 'Asia/Jakarta',
    });

    console.log('[CRON] Weekly jadwal notification scheduled for Sunday 08:00 AM (Jakarta)');

    // Run every day at 08:00 AM for H-1 notifications
    cron.schedule('0 0 8 * * *', async () => {
      await this.sendHMinusOneNotification();
    }, {
      timezone: 'Asia/Jakarta',
    });

    console.log('[CRON] H-1 jadwal notification scheduled for daily 08:00 AM (Jakarta)');
  }

  async sendHMinusOneNotification() {
    console.log('[CRON] Starting H-1 jadwal notification job...');

    try {
      // Get tomorrow's date range
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(0, 0, 0, 0);

      const tomorrowEnd = new Date(tomorrow);
      tomorrowEnd.setHours(23, 59, 59, 999);

      // Get all users with ASPRI position
      const aspriUsers = await prisma.mst_users.findMany({
        where: {
          status: 'ACTIVE',
          is_verified: true,
          position: {
            code: 'ASPRI_DIRJEN',
            is_active: true,
          },
        },
        select: {
          id: true,
          fullname: true,
          phone: true,
        },
      });

      if (aspriUsers.length === 0) {
        console.log('[CRON] No ASPRI_DIRJEN users found');
        return;
      }

      // Get jadwal for tomorrow
      const jadwalList = await prisma.tr_jadwal_pimpinan.findMany({
        where: {
          tanggal_awal: {
            gte: tomorrow,
            lte: tomorrowEnd,
          },
        },
        include: {
          creator: { select: { id: true, fullname: true } },
          pendamping_pegawai: {
            include: { pegawai: true },
          },
          pendamping_direktur: true,
        },
        orderBy: { tanggal_awal: 'asc' },
      });

      if (jadwalList.length === 0) {
        console.log('[CRON] No jadwal found for tomorrow');
        return;
      }

      // Build message
      const message = this.buildHMinusOneMessage(jadwalList, tomorrow);

      // Get active WhatsApp session
      const session = await prisma.wa_sessions.findFirst({
        where: { is_active: true },
      });

      if (!session) {
        console.log('[CRON] No active WhatsApp session');
        return;
      }

      // Send to each ASPRI user
      let successCount = 0;
      let failCount = 0;

      for (const user of aspriUsers) {
        if (!user.phone) {
          console.log(`[CRON] User ${user.fullname} has no WhatsApp number, skipping...`);
          failCount++;
          continue;
        }

        try {
          await whatsappService.sendMessage(
            session.id,
            user.phone,
            message,
            0 // system user
          );
          successCount++;
          console.log(`[CRON] Sent H-1 to ${user.fullname} (${user.phone})`);

          // Log activity
          await prisma.activity_logs.create({
            data: {
              user_id: 0,
              module: 'CRON_HMINUS1_JADWAL',
              action: 'SEND_WA',
              new_data: {
                user_id: user.id,
                phone: user.phone,
                jadwal_count: jadwalList.length,
              },
            },
          });
        } catch (error: any) {
          failCount++;
          console.error(`[CRON] Failed to send H-1 to ${user.fullname}:`, error.message);
        }
      }

      console.log(`[CRON] H-1 notification complete: ${successCount} sent, ${failCount} failed`);
    } catch (error: any) {
      console.error('[CRON] Error in H-1 jadwal notification:', error);
    }
  }

  private buildHMinusOneMessage(jadwalList: any[], tomorrow: Date): string {
    const hariNames = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
    const bulanNames = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];

    const formatTglFull = (d: Date) => {
      const hari = hariNames[d.getDay()];
      const tanggal = d.getDate();
      const bulan = bulanNames[d.getMonth()];
      const tahun = d.getFullYear();
      return `${hari}, ${tanggal} ${bulan} ${tahun}`;
    };

    const formatTglShort = (d: Date) => hariNames[d.getDay()];

    let message = `*REMINDER - BESOK (${formatTglFull(tomorrow)})*\n\n`;
    message += `Yth. Ibu Dirjen,\n\n`;
    message += `Berikut agenda besok untuk Ibu:\n\n`;

    for (const j of jadwalList) {
      const tglAwal = new Date(j.tanggal_awal);
      const tglAkhir = new Date(j.tanggal_akhir);
      const isSameDay = tglAwal.toDateString() === tglAkhir.toDateString();

      let tanggalText = formatTglFull(tglAwal);
      if (!isSameDay) {
        tanggalText = `${formatTglShort(tglAwal)} - ${formatTglShort(tglAkhir)}, ${tglAwal.getDate()} - ${tglAkhir.getDate()} ${bulanNames[tglAwal.getMonth()]} ${tglAwal.getFullYear()}`;
      }

      message += `📅 Tanggal : ${tanggalText}\n`;
      if (j.waktu) {
        message += `🕐 Waktu   : ${j.waktu}\n`;
      }
      message += `📋 Acara  : ${j.acara}\n`;
      message += `📍 Lokasi : ${j.lokasi}\n`;
      message += `👤 Sebagai: ${j.sebagai}\n`;
      message += `📱 Metode  : ${j.model_rapat}\n`;
      if (j.catatan) {
        message += `📝 Catatan : ${j.catatan}\n`;
      }

      if (j.pendamping_pegawai.length > 0) {
        message += `Pendamping:\n`;
        j.pendamping_pegawai.forEach((p: any, idx: number) => {
          message += `${idx + 1}. ${p.pegawai?.nama_lengkap || '-'}\n`;
        });
      }

      if (j.pendamping_direktur.length > 0) {
        message += `Pendamping Direktorat:\n`;
        j.pendamping_direktur.forEach((d: any) => {
          message += `Dir ${d.nama_direktur}\n`;
        });
      }

      message += '\n';
    }

    message += `Mengingat pentingnya agenda ini, dimohon kehadiran tepat waktu.\n\n`;
    message += `Terima kasih.\n\n`;
    message += `*Scheduler SETDIT*`;

    return message;
  }
}

export const cronService = new CronService();
