import { prisma } from '../../config/database.js';
import { whatsappService } from '../whatsapp/service.js';

// Workflow steps configuration
export const WORKFLOW_STEPS = [
  { num: 1,  name: 'Input Admin TU',          jabatan: null,              action: 'INPUT' },
  { num: 2,  name: 'Setditjen PS',            jabatan: 'SEKDITJEN_PS',     action: 'DISPOSISI' },
  { num: 3,  name: 'Kabag PEHK',              jabatan: 'KABAG_PEHKT',      action: 'DISPOSISI' },
  { num: 4,  name: 'Distribusi Ke Anggota',  jabatan: 'KETUA_POKJA_HUKUM', action: 'DISTRIBUSI' },
  { num: 5,  name: 'Telaah Anggota',          jabatan: 'ANGGOTA_POKJA_HUKUM', action: 'TELAAH' },
  { num: 6,  name: 'Approve Ketua',            jabatan: 'KETUA_POKJA_HUKUM', action: 'APPROVE' },
  { num: 7,  name: 'Kabag PEHK',              jabatan: 'KABAG_PEHKT',      action: 'TELAAH' },
  { num: 8,  name: 'Kasubbag TU',             jabatan: 'KASUBBAG_TU',      action: 'TELAAH' },
  { num: 9,  name: 'TTD Setditjen',           jabatan: 'SEKDITJEN_PS',     action: 'SIGN' },
  { num: 10, name: 'Admin TU Penomoran ND',   jabatan: null,              action: 'PENOMORAN' },
  { num: 11, name: 'Dirjen PS',               jabatan: 'DIRJEN_PS',        action: 'SIGN' },
  { num: 12, name: 'Admin TU Penomoran SK',   jabatan: null,              action: 'NOMOR_SK' },
  { num: 13, name: 'Distribusi SK',           jabatan: 'KETUA_POKJA_HUKUM', action: 'DISTRIBUSI' },
  { num: 14, name: 'Finalisasi Anggota',      jabatan: 'ANGGOTA_POKJA_HUKUM', action: 'FINALIZE' },
  { num: 15, name: 'Kabag PEHK TTD Salinan',  jabatan: 'KABAG_PEHKT',      action: 'SIGN_COPY' },
  { num: 16, name: 'Arsip & Scan',             jabatan: 'KETUA_POKJA_HUKUM', action: 'ARCHIVE' },
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
    jabatan_code?: string;
    userId?: number;
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

    // Filter by user's workflow step based on jabatan_code
    if (query.jabatan_code) {
      // Get all steps where this jabatan has a task
      const stepsForJabatan = WORKFLOW_STEPS.filter(s => s.jabatan === query.jabatan_code);

      if (stepsForJabatan.length > 0) {
        const stepNumbers = stepsForJabatan.map(s => s.num);

        // When no explicit status filter, show only relevant workflow stages
        if (!query.status) {
          if (query.jabatan_code === 'ANGGOTA_POKJA_HUKUM') {
            // ANGGOTA_POKJA_HUKUM sees SKs where they are assigned as assignee at step 4
            // AND current_step should be at their work step (5 or 13)
            where.stages = {
              some: {
                step_num: 4,
                assignee_id: query.userId,
              },
            };
            where.current_step = { in: stepNumbers }; // steps 5 and 13
            where.status = { in: ['IN_PROGRESS', 'WAITING_REVISION'] };
          } else if (query.jabatan_code === 'TU_SETDITJEN') {
            // TU_SETDITJEN can see ALL steps
            where.status = { in: ['DRAFT', 'IN_PROGRESS', 'WAITING_REVISION'] };
          } else {
            // Others only see their steps in IN_PROGRESS or WAITING_REVISION
            where.current_step = { in: stepNumbers };
            where.status = { in: ['IN_PROGRESS', 'WAITING_REVISION'] };
          }
        }
      }
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

    console.log('[DEBUG] Final WHERE:', JSON.stringify(where));

    const [skList, total] = await Promise.all([
      prisma.tr_sk_perhutanan.findMany({
        where,
        include: {
          creator: { select: { id: true, fullname: true } },
          stages: {
            include: {
              assignee: { select: { id: true, fullname: true } },
              completedByUser: { select: { id: true, fullname: true } },
              catatan_list: {
                include: {
                  user: { select: { id: true, fullname: true } },
                },
                orderBy: { created_at: 'asc' },
              },
            },
            orderBy: { step_num: 'asc' },
          },
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
            completedByUser: { select: { id: true, fullname: true } },
            catatan_list: {
              include: {
                user: { select: { id: true, fullname: true } },
              },
              orderBy: { created_at: 'asc' },
            },
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
        catatan_history: {
          include: {
            user: { select: { id: true, fullname: true } },
          },
          orderBy: { created_at: 'desc' }, // Urutkan berdasarkan waktu, terbaru dulu
        },
      },
    });

    if (!sk) {
      throw new Error('SK not found');
    }

    // Tambahkan step_name dan kesimpulan ke setiap catatan untuk konteks
    if (sk.catatan_history && sk.stages) {
      const stageMap = new Map(sk.stages.map(s => [s.step_num, s]));
      sk.catatan_history = sk.catatan_history.map(catatan => ({
        ...catatan,
        step_name: stageMap.get(catatan.step_num)?.step_name || `Step ${catatan.step_num}`,
        kesimpulan: stageMap.get(catatan.step_num)?.kesimpulan,
      }));
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
    konseptor?: string;
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

    // Simpan ID untuk provinsi, kabupaten, skema (bukan nama)

    const sk = await prisma.tr_sk_perhutanan.create({
      data: {
        nomor_surat: data.nomor_surat,
        tanggal_surat: data.tanggal_surat ? new Date(data.tanggal_surat) : null,
        tanggal_terima,
        tanggal_deadline,
        unit_pengusul: data.unit_pengusul,
        perihal: data.perihal,
        tujuan_surat: data.tujuan_surat,
        konseptor: data.konseptor,
        penandatangan: data.penandatangan,
        // Simpan ID saja
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
    konseptor: string;
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

    // Simpan ID untuk provinsi, kabupaten, skema (bukan nama)

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

    // Format tanggal
    const tanggalFormatted = sk.tanggal_surat
      ? new Date(sk.tanggal_surat).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })
      : '-';

    // Resolve nama skema dari ID
    let skemaName = sk.skema || '-';
    if (sk.skema) {
      const skemaId = parseInt(sk.skema);
      if (!isNaN(skemaId)) {
        const skema = await prisma.mst_skema.findUnique({ where: { id_skema: skemaId } });
        if (skema) skemaName = skema.nama_skema || sk.skema;
      }
    }

    // Notify SEKDITJEN_PS users
    await this.notifyJabatan(id, 'SEKDITJEN_PS', `Yth. Setditjen PS,

Terdapat usulan Naskah Dinas Draft SK Perhutanan Sosial yang telah diagenda dan diinput ke dalam sistem. Mohon dilakukan disposisi untuk proses lebih lanjut.

Nomor ND: ${sk.nomor_surat || '-'}
Tanggal: ${tanggalFormatted}
Perihal: ${sk.perihal}
Skema: ${skemaName}`);

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

    // Check if stage already has catatan (for appending history)
    const existingStage = await prisma.tr_sk_workflow.findFirst({
      where: { sk_id: id, step_num: sk.current_step },
    });

    // Save each catatan as separate entry with timestamp
    if (stepData.catatan) {
      await prisma.tr_sk_catatan.create({
        data: {
          sk_id: id,
          step_num: sk.current_step,
          user_id: userId,
          catatan: stepData.catatan,
        },
      });
    }

    // Update current stage (only kesimpulan and completion status)
    await prisma.tr_sk_workflow.updateMany({
      where: { sk_id: id, step_num: sk.current_step },
      data: {
        kesimpulan: stepData.kesimpulan,
        is_completed: true,
        completed_at: new Date(),
        completed_by: userId,
      },
    });

    // Handle step 5 (Telaah Anggota) specific kesimpulan
    if (sk.current_step === 5) {
      if (stepData.kesimpulan === 'PERBAIKAN_DIREKTORAT') {
        // Kembali ke step 5 - deadline dihentikan hitungannya
        await prisma.tr_sk_perhutanan.update({
          where: { id },
          data: {
            status: 'WAITING_REVISION',
            current_step: 5,
            deadline_paused_at: new Date(),
          },
        });

        return { message: 'Dikembalikan untuk perbaikan ke Direktorat', new_step: 5 };
      }

      if (stepData.kesimpulan === 'TELAAH') {
        let newDeadline: Date;

        if (sk.deadline_paused_at && sk.tanggal_deadline) {
          // Deadline pernah dihentikan
          const pausedAt = new Date(sk.deadline_paused_at);
          const originalDeadline = new Date(sk.tanggal_deadline);

          let remainingDays = 0;
          let tempDate = new Date(pausedAt);
          tempDate.setDate(tempDate.getDate() + 1);

          while (tempDate < originalDeadline) {
            const dayOfWeek = tempDate.getDay();
            if (dayOfWeek !== 0 && dayOfWeek !== 6) {
              remainingDays++;
            }
            tempDate.setDate(tempDate.getDate() + 1);
          }

          newDeadline = new Date();
          let addedDays = 0;
          while (addedDays < remainingDays) {
            newDeadline.setDate(newDeadline.getDate() + 1);
            const dayOfWeek = newDeadline.getDay();
            if (dayOfWeek !== 0 && dayOfWeek !== 6) {
              addedDays++;
            }
          }
        } else {
          newDeadline = new Date(sk.tanggal_deadline);
        }

        await prisma.tr_sk_perhutanan.update({
          where: { id },
          data: {
            status: 'IN_PROGRESS',
            current_step: 6,
            tanggal_deadline: newDeadline,
            deadline_paused_at: null,
          },
        });

        await this.createNextStage(id, 6);

        // Notify Ketua Pokja tentang hasil telaah
        const tanggalFormatted = sk.tanggal_surat
          ? new Date(sk.tanggal_surat).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })
          : '-';

        let skemaName = sk.skema || '-';
        if (sk.skema) {
          const skemaId = parseInt(sk.skema);
          if (!isNaN(skemaId)) {
            const skema = await prisma.mst_skema.findUnique({ where: { id_skema: skemaId } });
            if (skema) skemaName = skema.nama_skema || sk.skema;
          }
        }

        await this.notifyJabatan(id, 'KETUA_POKJA_HUKUM', `Pemberitahuan Hasil Telaah

Yth. Ketua Pokja Hukum,

anggota Pokja Hukum telah menyelesaikan telaah dan menyetujui draft SK Perhutanan Sosial. Mohon dilakukan review dan persetujuan untuk proses lebih lanjut.

Nomor ND: ${sk.nomor_surat || '-'}
Tanggal Telaah: ${tanggalFormatted}
Perihal: ${sk.perihal}
Skema: ${skemaName}
Catatan: ${stepData.catatan || '-'}
Status: Menunggu Approve Ketua Pokja Hukum.`);

        return { message: 'Dilanjut ke Approve Ketua dengan deadline baru', new_step: 6 };
      }
    }

    // Handle step 6 (Approve Ketua) specific kesimpulan
    if (sk.current_step === 6) {
      if (stepData.kesimpulan === 'DISETUJUI') {
        // Lanjut ke step 7
        await prisma.tr_sk_perhutanan.update({
          where: { id },
          data: {
            status: 'IN_PROGRESS',
            current_step: 7,
          },
        });
        await this.createNextStage(id, 7);

        // Notif ke Kabag PEHKT
        await this.notifyJabatan(id, 'KABAG_PEHKT', `Pemberitahuan Hasil Review

Yth. Kabag PEHK,

Ketua Pokja Hukum telah menyelesaikan review dan menyetujui draft SK. Mohon dilakukan telaah untuk proses lebih lanjut.

Nomor ND: ${sk.nomor_surat || '-'}
Perihal: ${sk.perihal}
Status: Menunggu Telaah Kabag PEHK.`);

        return { message: 'Dilanjut ke Telaah Kabag PEHK', new_step: 7 };
      }

      if (stepData.kesimpulan === 'PERBAIKAN_DRAFTER') {
        // Kembali ke step 5
        await prisma.tr_sk_perhutanan.update({
          where: { id },
          data: {
            status: 'WAITING_REVISION',
            current_step: 5,
          },
        });

        // Notif ke assignee step 4
        const assigneeStage = await prisma.tr_sk_workflow.findFirst({
          where: { sk_id: id, step_num: 4 },
          select: { assignee_id: true },
        });
        if (assigneeStage?.assignee_id) {
          const assignee = await prisma.mst_users.findUnique({
            where: { id: assigneeStage.assignee_id },
            select: { fullname: true },
          });
          await this.notifyUser(id, assigneeStage.assignee_id, `Pemberitahuan Perbaikan

Yth. ${assignee?.fullname || 'Anggota Pokja Hukum'},

SK Perhutanan Sosial berikut perlu diperbaiki sesuai catatan Ketua Pokja:

Perihal: ${sk.perihal}
Catatan: ${stepData.catatan || '-'}
Status: Menunggu Perbaikan.`);
        }

        return { message: 'Dikembalikan untuk perbaikan', new_step: 5 };
      }
    }

    // Handle step 7 (Kabag PEHK) specific kesimpulan
    if (sk.current_step === 7) {
      if (stepData.kesimpulan === 'DISETUJUI') {
        // Lanjut ke step 8
        await prisma.tr_sk_perhutanan.update({
          where: { id },
          data: {
            status: 'IN_PROGRESS',
            current_step: 8,
          },
        });
        await this.createNextStage(id, 8);

        // Notif ke Kasubbag TU
        await this.notifyJabatan(id, 'KASUBBAG_TU', `Pemberitahuan Hasil Telaah

Yth. Kasubbag TU,

Kabag PEHK telah menyelesaikan telaah dan menyetujui draft SK. Mohon dilakukan review untuk proses lebih lanjut.

Nomor ND: ${sk.nomor_surat || '-'}
Perihal: ${sk.perihal}
Status: Menunggu Review Kasubbag TU.`);

        return { message: 'Dilanjut ke Kasubbag TU', new_step: 8 };
      }

      if (stepData.kesimpulan === 'PERBAIKAN_DRAFTER') {
        // Kembali ke step 5
        await prisma.tr_sk_perhutanan.update({
          where: { id },
          data: {
            status: 'WAITING_REVISION',
            current_step: 5,
          },
        });

        // Notif ke assignee step 4
        const assigneeStage = await prisma.tr_sk_workflow.findFirst({
          where: { sk_id: id, step_num: 4 },
          select: { assignee_id: true },
        });
        if (assigneeStage?.assignee_id) {
          const assignee = await prisma.mst_users.findUnique({
            where: { id: assigneeStage.assignee_id },
            select: { fullname: true },
          });
          await this.notifyUser(id, assigneeStage.assignee_id, `Pemberitahuan Perbaikan

Yth. ${assignee?.fullname || 'Anggota Pokja Hukum'},

SK Perhutanan Sosial berikut perlu diperbaiki sesuai catatan Kabag PEHK:

Perihal: ${sk.perihal}
Catatan: ${stepData.catatan || '-'}
Status: Menunggu Perbaikan.`);
        }

        return { message: 'Dikembalikan untuk perbaikan', new_step: 5 };
      }
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

    // Step 8 (Kasubbag TU) continues to step 9 (TTD Setditjen)
    // Step 10 (Admin TU Penomoran ND) continues to step 11 (Dirjen PS)

    await prisma.tr_sk_perhutanan.update({
      where: { id },
      data: {
        status: 'IN_PROGRESS',
        current_step: newStep,
      },
    });

    // Create next stage if needed (MUST be before setting assignee_id)
    await this.createNextStage(id, newStep);

    // For step 4 (distribusi), set assignee_id on current step (step 4)
    if (sk.current_step === 4 && stepData.assignee_id) {
      await prisma.tr_sk_workflow.updateMany({
        where: { sk_id: id, step_num: sk.current_step },
        data: {
          assignee_id: stepData.assignee_id,
        },
      });
    }

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
      // For step 4 (distribusi), notify specific user with distribusi format
      if (sk.current_step === 4 && stepData.assignee_id) {
        const assignee = await prisma.mst_users.findUnique({
          where: { id: stepData.assignee_id },
          select: { fullname: true },
        });

        const tanggalFormatted = sk.tanggal_surat
          ? new Date(sk.tanggal_surat).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })
          : '-';

        let skemaName = sk.skema || '-';
        if (sk.skema) {
          const skemaId = parseInt(sk.skema);
          if (!isNaN(skemaId)) {
            const skema = await prisma.mst_skema.findUnique({ where: { id_skema: skemaId } });
            if (skema) skemaName = skema.nama_skema || sk.skema;
          }
        }

        const catatanText = stepData.catatan ? stepData.catatan : '-';
        const distribusiDari = this.getJabatanName(currentStepConfig.jabatan || 'ADMIN_TU');

        await this.notifyUser(id, stepData.assignee_id, `Pemberitahuan Distribusi SK

Yth. ${assignee?.fullname || 'Anggota Pokja Hukum'},

${distribusiDari} telah mendistribusikan Naskah Dinas Draft SK Perhutanan Sosial untuk dilakukan telaah SK.

Nomor ND: ${sk.nomor_surat || '-'}
Tanggal ND : ${tanggalFormatted}
Perihal: ${sk.perihal}
Skema: ${skemaName}
Catatan: ${catatanText}
Status: Menunggu Telaah Anggota Pokja Hukum.`);
      } else if (sk.current_step === 2 || sk.current_step === 3) {
        // Step 2 → 3 & Step 3 → 4: Notification Disposisi
        const tanggalFormatted = sk.tanggal_surat
          ? new Date(sk.tanggal_surat).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })
          : '-';

        let skemaName = sk.skema || '-';
        if (sk.skema) {
          const skemaId = parseInt(sk.skema);
          if (!isNaN(skemaId)) {
            const skema = await prisma.mst_skema.findUnique({ where: { id_skema: skemaId } });
            if (skema) skemaName = skema.nama_skema || sk.skema;
          }
        }

        const catatanText = stepData.catatan ? stepData.catatan : '-';
        const disposisiDari = this.getJabatanName(currentStepConfig.jabatan || 'ADMIN_TU');

        await this.notifyJabatan(id, nextJabatan, `Pemberitahuan Disposisi

Yth. ${this.getJabatanName(nextJabatan)},

Bersama ini disampaikan Naskah Dinas Draft SK Perhutanan Sosial yang telah didisposisikan oleh ${disposisiDari}. Mohon dilakukan telaah dan tindak lanjut sesuai kewenangan untuk proses lebih lanjut.

Nomor ND: ${sk.nomor_surat || '-'}
Tanggal ND: ${tanggalFormatted}
Perihal: ${sk.perihal}
Skema: ${skemaName}
Catatan: ${catatanText}`);
      } else {
        await this.notifyJabatan(id, nextJabatan, `SK perlu ditindaklanjuti:\n${sk.perihal}`);
      }
    }

    return { message: 'Moved to next step', new_step: newStep };
  }

  async addNomorND(id: number, data: { nomor_nd_sk: string; tanggal_nd_sk: string }, userId: number) {
    const sk = await prisma.tr_sk_perhutanan.findUnique({ where: { id } });
    if (!sk) throw new Error('SK not found');
    if (sk.current_step !== 10) throw new Error('Bukan tahap penomoran ND');

    await prisma.tr_sk_perhutanan.update({
      where: { id },
      data: {
        nomor_nd_sk: data.nomor_nd_sk,
        tanggal_nd_sk: new Date(data.tanggal_nd_sk),
      },
    });

    // Update workflow stage
    await prisma.tr_sk_workflow.updateMany({
      where: { sk_id: id, step_num: 10 },
      data: { is_completed: true, completed_at: new Date(), completed_by: userId },
    });

    // Move to step 11 (DIRJEN_PS)
    await prisma.tr_sk_perhutanan.update({
      where: { id },
      data: { current_step: 11 },
    });

    await this.createNextStage(id, 11);

    // Notify DIRJEN_PS
    await this.notifyJabatan(id, 'DIRJEN_PS', `SK siap untuk ditandatangani:\n${sk.perihal}`);

    return { message: 'ND berhasil ditambahkan' };
  }

  async signSK(id: number, userId: number) {
    const sk = await prisma.tr_sk_perhutanan.findUnique({ where: { id } });
    if (!sk) throw new Error('SK not found');
    if (sk.current_step !== 11) throw new Error('Bukan tahap penandatanganan');

    // Update workflow stage
    await prisma.tr_sk_workflow.updateMany({
      where: { sk_id: id, step_num: 11 },
      data: { is_completed: true, completed_at: new Date(), completed_by: userId, kesimpulan: 'DISETUJUI' },
    });

    // Move to step 12 (Admin TU Penomoran SK)
    await prisma.tr_sk_perhutanan.update({
      where: { id },
      data: {
        status: 'APPROVED',
        current_step: 12,
      },
    });

    await this.createNextStage(id, 12);

    return { message: 'SK ditandatangani' };
  }

  async addNomorSK(id: number, data: { nomor_sk: string; tanggal_sk: string }, userId: number) {
    const sk = await prisma.tr_sk_perhutanan.findUnique({ where: { id } });
    if (!sk) throw new Error('SK not found');
    if (sk.current_step !== 12) throw new Error('Bukan tahap penomoran SK');

    await prisma.tr_sk_perhutanan.update({
      where: { id },
      data: {
        nomor_sk: data.nomor_sk,
        tanggal_sk: new Date(data.tanggal_sk),
      },
    });

    // Update workflow stage
    await prisma.tr_sk_workflow.updateMany({
      where: { sk_id: id, step_num: 12 },
      data: { is_completed: true, completed_at: new Date(), completed_by: userId },
    });

    // Move to step 13 (Ketua Pokja)
    await prisma.tr_sk_perhutanan.update({
      where: { id },
      data: { current_step: 13 },
    });

    await this.createNextStage(id, 13);

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
        current_step: 16,
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

      // Check if already exists (handles retry cases)
      const existing = await prisma.tr_sk_workflow.findFirst({
        where: { sk_id: skId, step_num: step.num },
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

  // Helper: Get jabatan name from code
  private getJabatanName(jabatanCode: string): string {
    const names: Record<string, string> = {
      'SEKDITJEN_PS': 'Sekretaris Ditjen PS',
      'KABAG_PEHKT': 'Kabag PEHK',
      'KETUA_POKJA_HUKUM': 'Ketua Pokja Hukum',
      'ANGGOTA_POKJA_HUKUM': 'Anggota Pokja Hukum',
      'TU_SETDITJEN': 'TU Setditjen',
      'DIRJEN_PS': 'Dirjen PS',
    };
    return names[jabatanCode] || jabatanCode;
  }

  // Helper: Send WhatsApp notification to specific user
  private async notifyUser(skId: number, userId: number, message: string) {
    const user = await prisma.mst_users.findUnique({
      where: { id: userId },
      select: { id: true, fullname: true, phone: true },
    });

    if (!user || !user.phone) return;

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

export const skPerhutananService = new SkPerhutananService();
