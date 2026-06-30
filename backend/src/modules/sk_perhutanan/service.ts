import { prisma } from '../../config/database.js';
import { whatsappService } from '../whatsapp/service.js';

// Workflow steps configuration
export const WORKFLOW_STEPS = [
  { num: 1,  name: 'Input Admin TU',          jabatan: null,           action: 'INPUT' },
  { num: 2,  name: 'Setditjen PS',            jabatan: 'SEKDITJEN_PS',  action: 'DISPOSISI' },
  { num: 3,  name: 'Kabag PEHK',              jabatan: 'KABAG_PEHKT',   action: 'DISPOSISI' },
  { num: 4,  name: 'Ketua Pokja Hukum',        jabatan: 'KETUA_POKJA_HUKUM', action: 'DISTRIBUSI' },
  { num: 5,  name: 'Anggota Pokja Hukum',      jabatan: 'ANGGOTA_POKJA_HUKUM', action: 'TELAAH' },
  { num: 6,  name: 'Ketua Pokja Hukum',        jabatan: 'KETUA_POKJA_HUKUM', action: 'APPROVE' },
  { num: 7,  name: 'Kabag PEHK',              jabatan: 'KABAG_PEHKT',   action: 'TELAAH' },
  { num: 8,  name: 'TU Setditjen',            jabatan: 'TU_SETDITJEN',  action: 'TELAAH' },
  { num: 9,  name: 'Admin TU Penomoran ND',   jabatan: null,           action: 'PENOMORAN' },
  { num: 10, name: 'Dirjen PS',               jabatan: 'DIRJEN_PS',     action: 'SIGN' },
  { num: 11, name: 'Admin TU Penomoran SK',   jabatan: null,           action: 'NOMOR_SK' },
  { num: 12, name: 'Ketua Pokja Hukum',        jabatan: 'KETUA_POKJA_HUKUM', action: 'DISTRIBUSI' },
  { num: 13, name: 'Anggota Pokja Hukum',      jabatan: 'ANGGOTA_POKJA_HUKUM', action: 'FINALIZE' },
  { num: 14, name: 'Kabag PEHK TTD Salinan',  jabatan: 'KABAG_PEHKT',   action: 'SIGN_COPY' },
  { num: 15, name: 'Arsip & Scan',             jabatan: 'KETUA_POKJA_HUKUM', action: 'ARCHIVE' },
];

// Calculate 14 working days from received date
function addWorkingDays(date: Date, days: number): Date {
  const result = new Date(date);
  let addedDays = 0;

  while (addedDays < days) {
    result.setDate(result.getDate() + 1);
    const dayOfWeek = result.getDay();
    if (dayOfWeek !== 0 && dayOfWeek !== 6) {
      addedDays++;
    }
  }

  return result;
}

export class SkPerhutananService {
  async findAll(query: {
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
    unit_pengusul?: string;
    start_date?: string;
    end_date?: string;
  }) {
    const page = query.page || 1;
    const limit = query.limit || 10;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (query.search) {
      where.OR = [
        { nomor_surat: { contains: query.search, mode: 'insensitive' } },
        { nomor_sk: { contains: query.search, mode: 'insensitive' } },
        { perihal: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    if (query.status) {
      where.status = query.status;
    }

    if (query.unit_pengusul) {
      where.unit_pengusul = query.unit_pengusul;
    }

    if (query.start_date) {
      where.tanggal_surat = { ...where.tanggal_surat, gte: new Date(query.start_date) };
    }

    if (query.end_date) {
      where.tanggal_surat = { ...where.tanggal_surat, lte: new Date(query.end_date) };
    }

    const [skList, total] = await Promise.all([
      prisma.tr_sk_perhutanan.findMany({
        where,
        include: {
          creator: { select: { id: true, fullname: true } },
          stages: { orderBy: { step_num: 'asc' } },
        },
        skip,
        take: limit,
        orderBy: { created_at: 'desc' },
      }),
      prisma.tr_sk_perhutanan.count({ where }),
    ]);

    return { items: skList, pagination: { page, limit, total } };
  }

  async findById(id: number) {
    const sk = await prisma.tr_sk_perhutanan.findUnique({
      where: { id },
      include: {
        creator: { select: { id: true, fullname: true, phone: true } },
        stages: {
          include: {
            assignee: { select: { id: true, fullname: true } },
          },
          orderBy: { step_num: 'asc' },
        },
        dispositions: {
          orderBy: { created_at: 'asc' },
        },
        notifications: {
          orderBy: { created_at: 'desc' },
          take: 20,
        },
      },
    });

    if (!sk) {
      throw new Error('SK not found');
    }

    return sk;
  }

  async create(data: {
    nomor_surat?: string;
    tanggal_surat?: string;
    tanggal_terima: string;
    unit_pengusul: string;
    perihal: string;
    tujuan_surat: string;
    konseptor_id?: number;
    penandatangan?: string;
    provinsi?: string;
    kabupaten?: string;
    kecamatan?: string;
    desa?: string;
    skema?: string;
    kelompok_ps?: string;
    luas?: number;
    jml_kk?: number;
  }, userId: number) {
    const tanggal_terima = new Date(data.tanggal_terima);
    const tanggal_deadline = addWorkingDays(tanggal_terima, 14);

    const sk = await prisma.tr_sk_perhutanan.create({
      data: {
        nomor_surat: data.nomor_surat,
        tanggal_surat: data.tanggal_surat ? new Date(data.tanggal_surat) : null,
        tanggal_terima,
        tanggal_deadline,
        unit_pengusul: data.unit_pengusul,
        perihal: data.perihal,
        tujuan_surat: data.tujuan_surat,
        konseptor_id: data.konseptor_id ?? userId,
        penandatangan: data.penandatangan,
        provinsi: data.provinsi,
        kabupaten: data.kabupaten,
        kecamatan: data.kecamatan,
        desa: data.desa,
        skema: data.skema,
        kelompok_ps: data.kelompok_ps,
        luas: data.luas,
        jml_kk: data.jml_kk,
        status: 'DRAFT',
        current_step: 1,
        created_by: userId,
      },
    });

    return sk;
  }

  async update(id: number, data: Partial<{
    nomor_surat: string;
    tanggal_surat: string;
    unit_pengusul: string;
    perihal: string;
    tujuan_surat: string;
    konseptor_id: number;
    penandatangan: string;
    provinsi: string;
    kabupaten: string;
    kecamatan: string;
    desa: string;
    skema: string;
    kelompok_ps: string;
    luas: number;
    jml_kk: number;
  }>) {
    const sk = await prisma.tr_sk_perhutanan.findUnique({ where: { id } });
    if (!sk) throw new Error('SK not found');

    const updateData: any = { ...data };
    if (data.tanggal_surat) {
      updateData.tanggal_surat = new Date(data.tanggal_surat);
    }

    const updated = await prisma.tr_sk_perhutanan.update({
      where: { id },
      data: updateData,
    });

    return updated;
  }

  async submit(id: number, userId: number) {
    const sk = await prisma.tr_sk_perhutanan.findUnique({ where: { id } });
    if (!sk) throw new Error('SK not found');
    if (sk.status !== 'DRAFT') throw new Error('SK sudah submitted');

    // Create initial workflow stages
    await this.createWorkflowStages(id);

    // Update status
    const updated = await prisma.tr_sk_perhutanan.update({
      where: { id },
      data: {
        status: 'IN_PROGRESS',
        current_step: 2,
      },
    });

    // Create disposition record
    await prisma.tr_sk_disposition.create({
      data: {
        sk_id: id,
        step_num: 1,
        from_jabatan: 'ADMIN_TU',
        to_jabatan: 'SEKDITJEN_PS',
        created_by: userId,
      },
    });

    // Notify SEKDITJEN_PS users
    await this.notifyJabatan(id, 'SEKDITJEN_PS', `SK baru perlu didisposisi:\n${sk.perihal}`);

    return updated;
  }

  async processStep(id: number, stepData: {
    catatan?: string;
    kesimpulan?: string;
    assignee_id?: number;
  }, userId: number) {
    const sk = await prisma.tr_sk_perhutanan.findUnique({ where: { id } });
    if (!sk) throw new Error('SK not found');

    const currentStepConfig = WORKFLOW_STEPS.find(s => s.num === sk.current_step);
    if (!currentStepConfig) throw new Error('Step configuration not found');

    const nextStepConfig = WORKFLOW_STEPS.find(s => s.num === sk.current_step + 1);

    // Update current stage
    await prisma.tr_sk_workflow.updateMany({
      where: { sk_id: id, step_num: sk.current_step },
      data: {
        catatan: stepData.catatan,
        kesimpulan: stepData.kesimpulan,
        assignee_id: stepData.assignee_id,
        is_completed: true,
        completed_at: new Date(),
        completed_by: userId,
      },
    });

    // Handle based on kesimpulan
    if (stepData.kesimpulan === 'PERBAIKAN') {
      // Go back to step 5 (Anggota Pokja Hukum)
      const step5Config = WORKFLOW_STEPS.find(s => s.num === 5)!;

      await prisma.tr_sk_perhutanan.update({
        where: { id },
        data: {
          status: 'WAITING_REVISION',
          current_step: 5,
        },
      });

      // Notify ANGGOTA_POKJA_HUKUM
      await this.notifyJabatan(id, 'ANGGOTA_POKJA_HUKUM', `SK perlu direvisi:\n${sk.perihal}\n\nCatatan: ${stepData.catatan}`);

      return { message: 'Dikembalikan untuk perbaikan', new_step: 5 };
    }

    // Check if workflow is complete
    if (!nextStepConfig || sk.current_step === 15) {
      await prisma.tr_sk_perhutanan.update({
        where: { id },
        data: {
          status: 'COMPLETED',
          current_step: 15,
        },
      });

      return { message: 'Workflow completed', new_step: 15 };
    }

    // Move to next step
    let newStep = sk.current_step + 1;

    // Special handling for step 9 (Admin TU Penomoran) - stays at Admin_TU
    if (sk.current_step === 8) {
      newStep = 9;
    }

    // Special handling for step 11 (Admin TU Penomoran SK) - goes to DIRJEN_PS
    if (sk.current_step === 10) {
      newStep = 11;
    }

    await prisma.tr_sk_perhutanan.update({
      where: { id },
      data: {
        status: 'IN_PROGRESS',
        current_step: newStep,
      },
    });

    // Create next stage if needed
    await this.createNextStage(id, newStep);

    // Create disposition
    await prisma.tr_sk_disposition.create({
      data: {
        sk_id: id,
        step_num: sk.current_step,
        from_jabatan: currentStepConfig.jabatan || 'ADMIN_TU',
        to_jabatan: nextStepConfig.jabatan || 'ADMIN_TU',
        catatan: stepData.catatan,
        created_by: userId,
      },
    });

    // Notify next assignee
    const nextJabatan = nextStepConfig.jabatan || currentStepConfig.jabatan;
    if (nextJabatan) {
      await this.notifyJabatan(id, nextJabatan, `SK perlu ditindaklanjuti:\n${sk.perihal}`);
    }

    return { message: 'Moved to next step', new_step: newStep };
  }

  async addNomorND(id: number, data: { nomor_nd_sk: string; tanggal_nd_sk: string }, userId: number) {
    const sk = await prisma.tr_sk_perhutanan.findUnique({ where: { id } });
    if (!sk) throw new Error('SK not found');
    if (sk.current_step !== 9) throw new Error('Bukan tahap penomoran ND');

    await prisma.tr_sk_perhutanan.update({
      where: { id },
      data: {
        nomor_nd_sk: data.nomor_nd_sk,
        tanggal_nd_sk: new Date(data.tanggal_nd_sk),
      },
    });

    // Update workflow stage
    await prisma.tr_sk_workflow.updateMany({
      where: { sk_id: id, step_num: 9 },
      data: { is_completed: true, completed_at: new Date(), completed_by: userId },
    });

    // Move to step 10 (DIRJEN_PS)
    await prisma.tr_sk_perhutanan.update({
      where: { id },
      data: { current_step: 10 },
    });

    await this.createNextStage(id, 10);

    // Notify DIRJEN_PS
    await this.notifyJabatan(id, 'DIRJEN_PS', `SK siap untuk ditandatangani:\n${sk.perihal}`);

    return { message: 'ND berhasil ditambahkan' };
  }

  async signSK(id: number, userId: number) {
    const sk = await prisma.tr_sk_perhutanan.findUnique({ where: { id } });
    if (!sk) throw new Error('SK not found');
    if (sk.current_step !== 10) throw new Error('Bukan tahap penandatanganan');

    // Update workflow stage
    await prisma.tr_sk_workflow.updateMany({
      where: { sk_id: id, step_num: 10 },
      data: { is_completed: true, completed_at: new Date(), completed_by: userId, kesimpulan: 'DISETUJUI' },
    });

    // Move to step 11 (Admin TU Penomoran SK)
    await prisma.tr_sk_perhutanan.update({
      where: { id },
      data: {
        status: 'APPROVED',
        current_step: 11,
      },
    });

    await this.createNextStage(id, 11);

    return { message: 'SK ditandatangani' };
  }

  async addNomorSK(id: number, data: { nomor_sk: string; tanggal_sk: string }, userId: number) {
    const sk = await prisma.tr_sk_perhutanan.findUnique({ where: { id } });
    if (!sk) throw new Error('SK not found');
    if (sk.current_step !== 11) throw new Error('Bukan tahap penomoran SK');

    await prisma.tr_sk_perhutanan.update({
      where: { id },
      data: {
        nomor_sk: data.nomor_sk,
        tanggal_sk: new Date(data.tanggal_sk),
      },
    });

    // Update workflow stage
    await prisma.tr_sk_workflow.updateMany({
      where: { sk_id: id, step_num: 11 },
      data: { is_completed: true, completed_at: new Date(), completed_by: userId },
    });

    // Move to step 12 (Ketua Pokja)
    await prisma.tr_sk_perhutanan.update({
      where: { id },
      data: { current_step: 12 },
    });

    await this.createNextStage(id, 12);

    // Notify KETUA_POKJA_HUKUM
    await this.notifyJabatan(id, 'KETUA_POKJA_HUKUM', `SK siap didistribusikan:\n${sk.perihal}`);

    return { message: 'Nomor SK berhasil ditambahkan' };
  }

  async finalize(id: number, userId: number) {
    const sk = await prisma.tr_sk_perhutanan.findUnique({ where: { id } });
    if (!sk) throw new Error('SK not found');

    // Complete all remaining stages
    await prisma.tr_sk_workflow.updateMany({
      where: { sk_id: id, is_completed: false },
      data: { is_completed: true, completed_at: new Date(), completed_by: userId },
    });

    await prisma.tr_sk_perhutanan.update({
      where: { id },
      data: {
        status: 'COMPLETED',
        current_step: 15,
      },
    });

    return { message: 'SK completed' };
  }

  async getPendingByJabatan(jabatanCode: string) {
    const assignments = await prisma.tr_jabatan_assignment.findMany({
      where: { jabatan_code: jabatanCode, is_active: true },
    });

    const userIds = assignments.map(a => a.user_id);

    if (userIds.length === 0) {
      return [];
    }

    const skList = await prisma.tr_sk_perhutanan.findMany({
      where: {
        status: { in: ['IN_PROGRESS', 'WAITING_REVISION'] },
        stages: {
          some: {
            jabatan_code: jabatanCode,
            is_completed: false,
          },
        },
      },
      include: {
        creator: { select: { fullname: true } },
        stages: { orderBy: { step_num: 'asc' } },
      },
      orderBy: { created_at: 'desc' },
    });

    return skList;
  }

  async getStats() {
    const [total, inProgress, waitingRevision, completed, overdue] = await Promise.all([
      prisma.tr_sk_perhutanan.count(),
      prisma.tr_sk_perhutanan.count({ where: { status: 'IN_PROGRESS' } }),
      prisma.tr_sk_perhutanan.count({ where: { status: 'WAITING_REVISION' } }),
      prisma.tr_sk_perhutanan.count({ where: { status: 'COMPLETED' } }),
      prisma.tr_sk_perhutanan.count({
        where: {
          tanggal_deadline: { lt: new Date() },
          status: { notIn: ['COMPLETED'] },
        },
      }),
    ]);

    return { total, inProgress, waitingRevision, completed, overdue };
  }

  async getUsersByJabatan(jabatanCode: string) {
    const assignments = await prisma.tr_jabatan_assignment.findMany({
      where: { jabatan_code: jabatanCode, is_active: true },
      include: { user: { select: { id: true, fullname: true, phone: true } } },
    });

    return assignments.map(a => a.user);
  }

  // Helper: Create workflow stages for all 15 steps
  private async createWorkflowStages(skId: number) {
    for (const step of WORKFLOW_STEPS) {
      if (step.num === 1) continue; // Skip step 1 (already created by user)

      await prisma.tr_sk_workflow.create({
        data: {
          sk_id: skId,
          step_num: step.num,
          step_name: step.name,
          jabatan_code: step.jabatan || '',
          action: step.action,
        },
      });
    }
  }

  // Helper: Create next workflow stage
  private async createNextStage(skId: number, stepNum: number) {
    const step = WORKFLOW_STEPS.find(s => s.num === stepNum);
    if (!step) return;

    const existing = await prisma.tr_sk_workflow.findFirst({
      where: { sk_id: skId, step_num: stepNum },
    });

    if (!existing) {
      await prisma.tr_sk_workflow.create({
        data: {
          sk_id: skId,
          step_num: step.num,
          step_name: step.name,
          jabatan_code: step.jabatan || '',
          action: step.action,
        },
      });
    }
  }

  // Helper: Send WhatsApp notification
  private async notifyJabatan(skId: number, jabatanCode: string, message: string) {
    const users = await this.getUsersByJabatan(jabatanCode);

    for (const user of users) {
      if (user.phone) {
        // Log notification
        await prisma.tr_sk_notification.create({
          data: {
            sk_id: skId,
            recipient_id: user.id,
            phone: user.phone,
            message,
            status: 'PENDING',
          },
        });

        // Send via WhatsApp
        try {
          const session = await prisma.wa_sessions.findFirst({
            where: { is_active: true },
          });

          if (session) {
            await whatsappService.sendMessage(session.id, user.phone, message, user.id);

            await prisma.tr_sk_notification.updateMany({
              where: { sk_id: skId, recipient_id: user.id, status: 'PENDING' },
              data: { status: 'SENT', sent_at: new Date() },
            });
          }
        } catch (error: any) {
          await prisma.tr_sk_notification.updateMany({
            where: { sk_id: skId, recipient_id: user.id, status: 'PENDING' },
            data: { status: 'FAILED', error: error.message },
          });
        }
      }
    }
  }
}

export const skPerhutananService = new SkPerhutananService();
