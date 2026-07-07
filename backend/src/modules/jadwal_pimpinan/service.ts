import { prisma } from '../../config/database.js';

export class JadwalPimpinanService {
  async findAll(query: {
    page?: number;
    limit?: number;
    search?: string;
    tanggal_awal?: string;
    tanggal_akhir?: string;
  }) {
    const page = query.page || 1;
    const limit = query.limit || 10;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (query.search) {
      where.OR = [
        { acara: { contains: query.search, mode: 'insensitive' } },
        { lokasi: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    if (query.tanggal_awal) {
      where.tanggal_awal = { gte: new Date(query.tanggal_awal) };
    }

    if (query.tanggal_akhir) {
      where.tanggal_akhir = { lte: new Date(query.tanggal_akhir) };
    }

    const [jadwal, total] = await Promise.all([
      prisma.tr_jadwal_pimpinan.findMany({
        where,
        include: {
          creator: { select: { id: true, fullname: true } },
          pendamping_pegawai: {
            include: { pegawai: true },
          },
          pendamping_direktur: true,
        },
        skip,
        take: limit,
        orderBy: { tanggal_awal: 'desc' },
      }),
      prisma.tr_jadwal_pimpinan.count({ where }),
    ]);

    return { jadwal, pagination: { page, limit, total } };
  }

  async findById(id: number) {
    const jadwal = await prisma.tr_jadwal_pimpinan.findUnique({
      where: { id },
      include: {
        creator: { select: { id: true, fullname: true } },
        pendamping_pegawai: {
          include: { pegawai: true },
        },
        pendamping_direktur: true,
      },
    });

    if (!jadwal) {
      throw new Error('Jadwal tidak ditemukan');
    }

    return jadwal;
  }

  async create(data: {
    acara: string;
    lokasi: string;
    sebagai: string;
    tanggal_awal: Date;
    tanggal_akhir: Date;
    waktu?: string;
    hadir_sendiri?: boolean;
    model_rapat?: 'FAKTUAL' | 'HYBRID' | 'VIRTUAL';
    catatan?: string;
    created_by: number;
    pendamping_pegawai?: { pegawai_id: number }[];
    pendamping_direktur?: { kode_direktur: string; nama_direktur: string }[];
  }) {
    const jadwal = await prisma.tr_jadwal_pimpinan.create({
      data: {
        acara: data.acara,
        lokasi: data.lokasi,
        sebagai: data.sebagai,
        tanggal_awal: data.tanggal_awal,
        tanggal_akhir: data.tanggal_akhir,
        waktu: data.waktu,
        hadir_sendiri: data.hadir_sendiri ?? true,
        model_rapat: data.model_rapat ?? 'FAKTUAL',
        catatan: data.catatan,
        created_by: data.created_by,
        pendamping_pegawai: data.pendamping_pegawai?.length
          ? {
              create: data.pendamping_pegawai.map((p) => ({
                pegawai_id: p.pegawai_id,
              })),
            }
          : undefined,
        pendamping_direktur: data.pendamping_direktur?.length
          ? {
              create: data.pendamping_direktur.map((d) => ({
                kode_direktur: d.kode_direktur,
                nama_direktur: d.nama_direktur,
              })),
            }
          : undefined,
      },
      include: {
        creator: { select: { id: true, fullname: true } },
        pendamping_pegawai: {
          include: { pegawai: true },
        },
        pendamping_direktur: true,
      },
    });

    return jadwal;
  }

  async update(
    id: number,
    data: {
      acara?: string;
      lokasi?: string;
      sebagai?: string;
      tanggal_awal?: Date;
      tanggal_akhir?: Date;
      waktu?: string;
      hadir_sendiri?: boolean;
      model_rapat?: 'FAKTUAL' | 'HYBRID' | 'VIRTUAL';
      catatan?: string;
      pendamping_pegawai?: { pegawai_id: number }[];
      pendamping_direktur?: { kode_direktur: string; nama_direktur: string }[];
    }
  ) {
    const existing = await prisma.tr_jadwal_pimpinan.findUnique({ where: { id } });
    if (!existing) {
      throw new Error('Jadwal tidak ditemukan');
    }

    // Delete existing companions
    await prisma.tr_jadwal_pendamping_pegawai.deleteMany({ where: { jadwal_id: id } });
    await prisma.tr_jadwal_pendamping_direktur.deleteMany({ where: { jadwal_id: id } });

    const jadwal = await prisma.tr_jadwal_pimpinan.update({
      where: { id },
      data: {
        acara: data.acara,
        lokasi: data.lokasi,
        sebagai: data.sebagai,
        tanggal_awal: data.tanggal_awal,
        tanggal_akhir: data.tanggal_akhir,
        waktu: data.waktu,
        hadir_sendiri: data.hadir_sendiri,
        model_rapat: data.model_rapat,
        catatan: data.catatan,
        pendamping_pegawai: data.pendamping_pegawai?.length
          ? {
              create: data.pendamping_pegawai.map((p) => ({
                pegawai_id: p.pegawai_id,
              })),
            }
          : undefined,
        pendamping_direktur: data.pendamping_direktur?.length
          ? {
              create: data.pendamping_direktur.map((d) => ({
                kode_direktur: d.kode_direktur,
                nama_direktur: d.nama_direktur,
              })),
            }
          : undefined,
      },
      include: {
        creator: { select: { id: true, fullname: true } },
        pendamping_pegawai: {
          include: { pegawai: true },
        },
        pendamping_direktur: true,
      },
    });

    return jadwal;
  }

  async delete(id: number) {
    const existing = await prisma.tr_jadwal_pimpinan.findUnique({ where: { id } });
    if (!existing) {
      throw new Error('Jadwal tidak ditemukan');
    }

    await prisma.tr_jadwal_pimpinan.delete({ where: { id } });
    return { message: 'Jadwal berhasil dihapus' };
  }

  async getUpcomingJadwal(params: { type: 'weekly' | 'monthly' }) {
    const now = new Date();
    let startDate: Date;
    let endDate: Date;

    if (params.type === 'weekly') {
      startDate = new Date(now);
      startDate.setHours(0, 0, 0, 0);
      endDate = new Date(now);
      endDate.setDate(endDate.getDate() + 7);
      endDate.setHours(23, 59, 59, 999);
    } else {
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
    }

    const jadwal = await prisma.tr_jadwal_pimpinan.findMany({
      where: {
        tanggal_awal: { gte: startDate },
        tanggal_akhir: { lte: endDate },
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

    return jadwal;
  }

  async getPegawai() {
    const pegawai = await prisma.mst_pegawai.findMany({
      where: { is_active: true },
      select: { id: true, nama_lengkap: true, nama_panggilan: true, nip: true, nomor_wa: true },
      orderBy: { nama_lengkap: 'asc' },
    });
    return pegawai;
  }

  async sendNotificationToPendamping(jadwalId: number, userId: number) {
    const jadwal = await prisma.tr_jadwal_pimpinan.findUnique({
      where: { id: jadwalId },
      include: {
        creator: { select: { id: true, fullname: true } },
        pendamping_pegawai: {
          include: { pegawai: true },
        },
      },
    });

    if (!jadwal) {
      throw new Error('Jadwal tidak ditemukan');
    }

    if (jadwal.pendamping_pegawai.length === 0) {
      throw new Error('Tidak ada pendamping pegawai untuk jadwal ini');
    }

    const { whatsappService } = await import('../whatsapp/service.js');

    const session = await prisma.wa_sessions.findFirst({ where: { is_active: true } });
    if (!session) {
      throw new Error('Tidak ada sesi WhatsApp yang aktif');
    }

    const hariNames = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
    const bulanNames = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];

    const formatTglFull = (d: Date) => {
      const hari = hariNames[d.getDay()];
      const tanggal = d.getDate();
      const bulan = bulanNames[d.getMonth()];
      const tahun = d.getFullYear();
      return `${hari}, ${tanggal} ${bulan} ${tahun}`;
    };

    const formatTglShort = (d: Date) => {
      const hari = hariNames[d.getDay()];
      return hari;
    };

    const results: { nama: string; phone: string; status: string }[] = [];

    for (const p of jadwal.pendamping_pegawai) {
      const phone = p.pegawai?.nomor_wa;
      const namaLengkap = p.pegawai?.nama_lengkap || '-';
      const namaPanggilan = p.pegawai?.nama_panggilan || namaLengkap;

      if (!phone) {
        results.push({
          nama: namaLengkap,
          phone: '-',
          status: 'gagal - nomor WA tidak ada',
        });
        continue;
      }

      const tglAwal = new Date(jadwal.tanggal_awal);
      const tglAkhir = new Date(jadwal.tanggal_akhir);
      const isSameDay = tglAwal.toDateString() === tglAkhir.toDateString();

      let tanggalText = formatTglFull(tglAwal);
      if (!isSameDay) {
        tanggalText = `${formatTglShort(tglAwal)} - ${formatTglShort(tglAkhir)}, ${tglAwal.getDate()} - ${tglAkhir.getDate()} ${bulanNames[tglAwal.getMonth()]} ${tglAwal.getFullYear()}`;
      }

      let message = `Yth. ${namaPanggilan},\n\n`;
      message += `Diharapkan kehadirannya pada :\n\n`;
      message += `📅 Tanggal : ${tanggalText}\n`;
      if (jadwal.waktu) {
        message += `🕐 Waktu   : ${jadwal.waktu}\n`;
      }
      message += `📋 Acara  : ${jadwal.acara}\n`;
      message += `📍 Lokasi : ${jadwal.lokasi}\n`;
      message += `👤 Sebagai: ${jadwal.sebagai}\n`;
      message += `📱 Metode  : ${jadwal.model_rapat}\n`;
      if (jadwal.catatan) {
        message += `📝 Catatan : ${jadwal.catatan}\n`;
      }
      message += `\nMengingat pentingnya acara ini, dimohon kehadiran tepat waktu.\n\n`;
      message += `Terima kasih.\n\n`;
      message += `- Scheduler SETDIT`;

      try {
        await whatsappService.sendMessage(session.id, phone, message, userId);
        results.push({
          nama: namaLengkap,
          phone,
          status: 'berhasil',
        });
      } catch (error: any) {
        results.push({
          nama: namaLengkap,
          phone,
          status: `gagal - ${error.message}`,
        });
      }
    }

    return {
      message: `Notifikasi dikirim ke ${results.filter((r) => r.status === 'berhasil').length} pendamping`,
      results,
    };
  }
}

export const jadwalPimpinanService = new JadwalPimpinanService();
