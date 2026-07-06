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
  }
}

export const cronService = new CronService();
