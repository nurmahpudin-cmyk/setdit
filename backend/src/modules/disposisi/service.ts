import { prisma } from '../../config/database.js';

// Workflow steps configuration for Disposisi
// Step 1-3: TU Setditjen PS, Step 4-8: UKE II (dynamic based on unit_tujuan)
export const DISPOSISI_WORKFLOW_STEPS = [
  { num: 1, name: 'Agenda Surat Masuk', jabatan: 'TU_SETDITJEN', action: 'INPUT' },
  { num: 2, name: 'Telaah & Disposisi Dirjen', jabatan: 'DIRJEN_PS', action: 'DISPOSISI' },
  { num: 3, name: 'Catat & Kirim ke UKE II', jabatan: 'TU_SETDITJEN', action: 'DISTRIBUSI' },
  { num: 4, name: 'Agenda Surat Masuk UKE II', jabatan: 'TU_UKE_II', action: 'INPUT' },
  { num: 5, name: 'Telaah & Tindak Lanjuti', jabatan: 'PIMPINAN_UKE_II', action: 'DISPOSISI' },
  { num: 6, name: 'Buat Konsep Surat TL', jabatan: 'TU_UKE_II', action: 'CREATE_TL' },
  { num: 7, name: 'Telaah & Setujui Konsep', jabatan: 'PIMPINAN_UKE_II', action: 'APPROVE' },
  { num: 8, name: 'Nomor Surat & Kirim', jabatan: 'TU_UKE_II', action: 'FINISH' },
];

export class DisposisiService {
  async findAll(query: {
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
    unit_tujuan?: string;
    jenis_surat_id?: string;
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
        { pengirim: { contains: query.search, mode: 'insensitive' } },
        { hal: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    if (query.status) {
      where.status = query.status;
    }

    if (query.unit_tujuan) {
      where.unit_tujuan = query.unit_tujuan;
    }

    if (query.jenis_surat_id) {
      where.jenis_surat_id = query.jenis_surat_id;
    }

    if (query.start_date && query.end_date) {
      where.tanggal_terima = {
        gte: new Date(query.start_date),
        lte: new Date(query.end_date + 'T23:59:59'),
      };
    }

    // Filter by user's workflow step based on jabatan_code
    if (query.jabatan_code) {
      const stepsForJabatan = DISPOSISI_WORKFLOW_STEPS.filter(s => s.jabatan === query.jabatan_code);

      if (stepsForJabatan.length > 0) {
        const stepNumbers = stepsForJabatan.map(s => s.num);

        // For TU_SETDITJEN: see steps 1, 3
        if (query.jabatan_code === 'TU_SETDITJEN') {
          where.current_step = { in: [1, 3] };
          where.status = { in: ['DRAFT', 'IN_PROGRESS'] };
        }
        // For DIRJEN_PS: see step 2
        else if (query.jabatan_code === 'DIRJEN_PS') {
          where.current_step = { in: [2] };
          where.status = { in: ['IN_PROGRESS', 'WAITING_DISPOSISI'] };
        }
        // For TU_UKE_II: see steps 4, 6, 8
        else if (query.jabatan_code === 'TU_UKE_II') {
          where.unit_tujuan = { not: undefined }; // Filter by user's assigned units
          where.current_step = { in: [4, 6, 8] };
          where.status = { in: ['IN_PROGRESS', 'WAITING_TL'] };
        }
        // For PIMPINAN_UKE_II: see steps 5, 7
        else if (query.jabatan_code === 'PIMPINAN_UKE_II') {
          where.unit_tujuan = { not: undefined }; // Filter by user's assigned units
          where.current_step = { in: [5, 7] };
          where.status = { in: ['IN_PROGRESS', 'WAITING_DISPOSISI'] };
        }
        // Others see their steps in IN_PROGRESS
        else {
          where.current_step = { in: stepNumbers };
          where.status = { in: ['IN_PROGRESS', 'WAITING_DISPOSISI', 'WAITING_TL'] };
        }
      }
    }

    const [disposisiList, total] = await Promise.all([
      prisma.tr_disposisi.findMany({
        where,
        include: {
          creator: { select: { id: true, fullname: true } },
          jenis_surat: true as any,
          workflow: {
            include: {
              assignee: { select: { id: true, fullname: true } },
            },
            orderBy: { step_num: 'asc' },
          },
          dispositions: {
            orderBy: { created_at: 'asc' },
          },
          tindak_lanjut: {
            orderBy: { created_at: 'desc' },
          },
        } as any,
        skip,
        take: limit,
        orderBy: { created_at: 'desc' },
      }),
      prisma.tr_disposisi.count({ where }),
    ]);

    return { items: disposisiList, pagination: { page, limit, total } };
  }

  async findById(id: number) {
    const disposisi = await prisma.tr_disposisi.findUnique({
      where: { id },
      include: {
        creator: { select: { id: true, fullname: true } },
        jenis_surat: true as any,
        workflow: {
          include: {
            assignee: { select: { id: true, fullname: true } },
          },
          orderBy: { step_num: 'asc' },
        },
        dispositions: {
          orderBy: { created_at: 'asc' },
        },
        tindak_lanjut: {
          orderBy: { created_at: 'desc' },
        },
      } as any,
    });

    if (!disposisi) {
      throw new Error('Disposisi not found');
    }

    return disposisi;
  }

  async create(data: {
    tanggal_surat: string;
    tanggal_terima: string;
    pengirim: string;
    hal: string;
    unit_tujuan: string;
    jenis_surat_id?: string;
  }, userId: number) {
    const disposisi = await prisma.tr_disposisi.create({
      data: {
        tanggal_surat: new Date(data.tanggal_surat),
        tanggal_terima: new Date(data.tanggal_terima),
        pengirim: data.pengirim,
        hal: data.hal,
        unit_tujuan: data.unit_tujuan,
        jenis_surat_id: data.jenis_surat_id || null,
        status: 'DRAFT',
        current_step: 1,
        created_by: userId,
      } as any,
    });

    // Create step 1 workflow record
    await prisma.tr_disposisi_workflow.create({
      data: {
        disposisi_id: disposisi.id,
        step_num: 1,
        step_name: 'Agenda Surat Masuk',
        jabatan_code: 'TU_SETDITJEN',
        action: 'INPUT',
      },
    });

    return disposisi;
  }

  async submit(id: number, userId: number) {
    const disposisi = await prisma.tr_disposisi.findUnique({ where: { id } });
    if (!disposisi) throw new Error('Disposisi not found');
    if (disposisi.status !== 'DRAFT') throw new Error('Disposisi sudah disubmit');

    // Update status
    const updated = await prisma.tr_disposisi.update({
      where: { id },
      data: {
        status: 'IN_PROGRESS',
        current_step: 2,
      },
    });

    // Create step 2 workflow record
    await prisma.tr_disposisi_workflow.create({
      data: {
        disposisi_id: id,
        step_num: 2,
        step_name: 'Telaah & Disposisi Dirjen',
        jabatan_code: 'DIRJEN_PS',
        action: 'DISPOSISI',
      },
    });

    // Create disposition record
    await prisma.tr_disposisi_disposition.create({
      data: {
        disposisi_id: id,
        step_num: 1,
        from_jabatan: 'TU_SETDITJEN',
        to_jabatan: 'DIRJEN_PS',
        created_by: userId,
      },
    });

    return updated;
  }

  async processStep(id: number, stepData: {
    catatan?: string;
    kesimpulan?: string;
    assignee_id?: number;
    unit_code?: string;
  }, userId: number, userJabatanCodes: string[]) {
    const disposisi = await prisma.tr_disposisi.findUnique({ where: { id } });
    if (!disposisi) throw new Error('Disposisi not found');

    const currentStepConfig = DISPOSISI_WORKFLOW_STEPS.find(s => s.num === disposisi.current_step);
    if (!currentStepConfig) throw new Error('Step configuration not found');

    // Authorization check
    if (!userJabatanCodes.includes(currentStepConfig.jabatan)) {
      throw new Error('Anda tidak memiliki hak untuk memproses step ini');
    }

    const nextStepConfig = DISPOSISI_WORKFLOW_STEPS.find(s => s.num === disposisi.current_step + 1);

    // Update current stage
    await prisma.tr_disposisi_workflow.updateMany({
      where: { disposisi_id: id, step_num: disposisi.current_step },
      data: {
        kesimpulan: stepData.kesimpulan,
        catatan: stepData.catatan,
        is_completed: true,
        completed_at: new Date(),
        completed_by: userId,
      },
    });

    // Handle specific steps
    if (disposisi.current_step === 2) {
      // DIRJEN_PS Disposisi
      if (stepData.kesimpulan === 'DISPOSISI') {
        // Lanjut ke step 3 (TU Setditjen kirim ke UKE II)
        await prisma.tr_disposisi.update({
          where: { id },
          data: {
            status: 'IN_PROGRESS',
            current_step: 3,
          },
        });

        await prisma.tr_disposisi_workflow.create({
          data: {
            disposisi_id: id,
            step_num: 3,
            step_name: 'Catat & Kirim ke UKE II',
            jabatan_code: 'TU_SETDITJEN',
            action: 'DISTRIBUSI',
            catatan: stepData.catatan,
          },
        });

        await prisma.tr_disposisi_disposition.create({
          data: {
            disposisi_id: id,
            step_num: 2,
            from_jabatan: 'DIRJEN_PS',
            to_jabatan: 'TU_SETDITJEN',
            catatan: stepData.catatan,
            created_by: userId,
          },
        });

        return { message: 'Dilanjut ke distribusi UKE II', new_step: 3 };
      }

      if (stepData.kesimpulan === 'TIDAK_TL') {
        // Selesai, tidak perlu tindak lanjut
        await prisma.tr_disposisi.update({
          where: { id },
          data: {
            status: 'COMPLETED',
          },
        });

        return { message: 'Disposisi selesai - tidak perlu TL', new_step: 2 };
      }
    }

    if (disposisi.current_step === 3) {
      // TU Setditjen kirim ke UKE II
      // Lanjut ke step 4 (TU UKE II agenda)
      await prisma.tr_disposisi.update({
        where: { id },
        data: {
          status: 'WAITING_DISPOSISI',
          current_step: 4,
        },
      });

      await prisma.tr_disposisi_workflow.create({
        data: {
          disposisi_id: id,
          step_num: 4,
          step_name: 'Agenda Surat Masuk UKE II',
          jabatan_code: 'TU_UKE_II',
          unit_code: disposisi.unit_tujuan,
          action: 'INPUT',
        },
      });

      await prisma.tr_disposisi_disposition.create({
        data: {
          disposisi_id: id,
          step_num: 3,
          from_jabatan: 'TU_SETDITJEN',
          to_jabatan: `TU_${disposisi.unit_tujuan}`,
          catatan: stepData.catatan,
          created_by: userId,
        },
      });

      return { message: 'Dikirim ke UKE II', new_step: 4 };
    }

    if (disposisi.current_step === 4) {
      // TU UKE II agenda
      // Lanjut ke step 5 (Pimpinan UKE II telaah)
      await prisma.tr_disposisi.update({
        where: { id },
        data: {
          status: 'IN_PROGRESS',
          current_step: 5,
        },
      });

      await prisma.tr_disposisi_workflow.create({
        data: {
          disposisi_id: id,
          step_num: 5,
          step_name: 'Telaah & Tindak Lanjuti',
          jabatan_code: 'PIMPINAN_UKE_II',
          unit_code: disposisi.unit_tujuan,
          action: 'DISPOSISI',
        },
      });

      return { message: 'Dilanjut ke Pimpinan UKE II', new_step: 5 };
    }

    if (disposisi.current_step === 5) {
      // Pimpinan UKE II telaah & disposisi
      if (stepData.kesimpulan === 'TINDAK_LANJUTI') {
        // Lanjut ke step 6 (TU UKE II buat konsep surat TL)
        await prisma.tr_disposisi.update({
          where: { id },
          data: {
            status: 'WAITING_TL',
            current_step: 6,
          },
        });

        await prisma.tr_disposisi_workflow.create({
          data: {
            disposisi_id: id,
            step_num: 6,
            step_name: 'Buat Konsep Surat TL',
            jabatan_code: 'TU_UKE_II',
            unit_code: disposisi.unit_tujuan,
            action: 'CREATE_TL',
            catatan: stepData.catatan,
          },
        });

        return { message: 'Dilanjut ke pembuatan konsep surat TL', new_step: 6 };
      }

      if (stepData.kesimpulan === 'SELESAI_TANPA_TL') {
        // Selesai tanpa TL
        await prisma.tr_disposisi.update({
          where: { id },
          data: {
            status: 'COMPLETED',
          },
        });

        return { message: 'Disposisi selesai tanpa TL', new_step: 5 };
      }
    }

    if (disposisi.current_step === 6) {
      // TU UKE II buat konsep surat TL
      // Lanjut ke step 7 (Pimpinan UKE II approve)
      await prisma.tr_disposisi.update({
        where: { id },
        data: {
          status: 'IN_PROGRESS',
          current_step: 7,
        },
      });

      await prisma.tr_disposisi_workflow.create({
        data: {
          disposisi_id: id,
          step_num: 7,
          step_name: 'Telaah & Setujui Konsep',
          jabatan_code: 'PIMPINAN_UKE_II',
          unit_code: disposisi.unit_tujuan,
          action: 'APPROVE',
        },
      });

      return { message: 'Dilanjut ke persetujuan pimpinan', new_step: 7 };
    }

    if (disposisi.current_step === 7) {
      // Pimpinan UKE II approve konsep
      if (stepData.kesimpulan === 'DISETUJUI') {
        // Lanjut ke step 8 (TU UKE II nomor surat & kirim)
        await prisma.tr_disposisi.update({
          where: { id },
          data: {
            status: 'IN_PROGRESS',
            current_step: 8,
          },
        });

        await prisma.tr_disposisi_workflow.create({
          data: {
            disposisi_id: id,
            step_num: 8,
            step_name: 'Nomor Surat & Kirim',
            jabatan_code: 'TU_UKE_II',
            unit_code: disposisi.unit_tujuan,
            action: 'FINISH',
          },
        });

        return { message: 'Konsep disetujui - lanjut ke penomoran surat', new_step: 8 };
      }

      if (stepData.kesimpulan === 'PERBAIKAN') {
        // Kembali ke step 6
        await prisma.tr_disposisi.update({
          where: { id },
          data: {
            status: 'WAITING_TL',
            current_step: 6,
          },
        });

        return { message: 'Dikembalikan untuk perbaikan konsep', new_step: 6 };
      }
    }

    if (disposisi.current_step === 8) {
      // TU UKE II nomor surat & kirim - workflow complete
      await prisma.tr_disposisi.update({
        where: { id },
        data: {
          status: 'COMPLETED',
        },
      });

      return { message: 'Workflow selesai', new_step: 8 };
    }

    // Check if workflow is complete
    if (!nextStepConfig) {
      await prisma.tr_disposisi.update({
        where: { id },
        data: {
          status: 'COMPLETED',
        },
      });

      return { message: 'Workflow completed', new_step: disposisi.current_step };
    }

    return { message: 'Moved to next step', new_step: disposisi.current_step + 1 };
  }

  async createTindakLanjut(id: number, data: {
    concept_letter: string;
    attachment?: string;
  }, userId: number) {
    const disposisi = await prisma.tr_disposisi.findUnique({ where: { id } });
    if (!disposisi) throw new Error('Disposisi not found');
    if (disposisi.current_step !== 6) throw new Error('Bukan tahap pembuatan konsep surat TL');

    const tl = await prisma.tr_disposisi_tl.create({
      data: {
        disposisi_id: id,
        unit_code: disposisi.unit_tujuan,
        concept_letter: data.concept_letter,
        attachment: data.attachment,
        created_by: userId,
      },
    });

    return tl;
  }

  async updateTindakLanjut(id: number, tlId: number, data: {
    concept_letter?: string;
    letter_number?: string;
    letter_date?: string;
    attachment?: string;
    approved_by?: number;
  }, userId: number) {
    const tl = await prisma.tr_disposisi_tl.findUnique({ where: { id: tlId } });
    if (!tl) throw new Error('Tindak lanjut not found');

    const updateData: any = { ...data };

    if (data.letter_date) {
      updateData.letter_date = new Date(data.letter_date);
    }

    if (data.approved_by) {
      updateData.approved_at = new Date();
    }

    const updated = await prisma.tr_disposisi_tl.update({
      where: { id: tlId },
      data: updateData,
    });

    return updated;
  }

  async getStats() {
    const [total, inProgress, waitingDisposisi, waitingTL, completed] = await Promise.all([
      prisma.tr_disposisi.count(),
      prisma.tr_disposisi.count({ where: { status: 'IN_PROGRESS' } }),
      prisma.tr_disposisi.count({ where: { status: 'WAITING_DISPOSISI' } }),
      prisma.tr_disposisi.count({ where: { status: 'WAITING_TL' } }),
      prisma.tr_disposisi.count({ where: { status: 'COMPLETED' } }),
    ]);

    return { total, inProgress, waitingDisposisi, waitingTL, completed };
  }

  async getUnits() {
    // Return list of UKE II units
    const units = await prisma.mst_units.findMany({
      where: {
        parent_id: { not: null }, // Eselon II units
        is_active: true,
      },
      select: {
        id: true,
        name: true,
        code: true,
      },
      orderBy: { name: 'asc' },
    });

    return units;
  }

  async getJenisSurat() {
    // Return list of active jenis surat
    const jenisSurat = await prisma.mst_jenis_surat.findMany({
      where: {
        status: true,
      },
      select: {
        id: true,
        nama_jenis_surat: true,
        status: true,
      },
      orderBy: { nama_jenis_surat: 'asc' },
    });

    return jenisSurat;
  }
}

export const disposisiService = new DisposisiService();
