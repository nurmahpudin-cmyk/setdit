import { api } from './axios';

// Types
export interface Disposisi {
  id: number;
  nomor_surat?: string;
  tanggal_surat: string;
  tanggal_terima: string;
  pengirim: string;
  hal: string;
  unit_tujuan: string;
  jenis_surat_id?: string;
  status: 'DRAFT' | 'IN_PROGRESS' | 'WAITING_DISPOSISI' | 'WAITING_TL' | 'COMPLETED';
  current_step: number;
  created_by?: number;
  created_at: string;
  updated_at: string;
  creator?: { id: number; fullname: string };
  jenis_surat?: { id: string; nama_jenis_surat: string; status: boolean };
  workflow?: DisposisiWorkflow[];
  dispositions?: DisposisiAction[];
  tindak_lanjut?: DisposisiTL[];
}

export interface DisposisiWorkflow {
  id: number;
  disposisi_id: number;
  step_num: number;
  step_name: string;
  jabatan_code: string;
  unit_code?: string;
  assignee_id?: number;
  action?: string;
  kesimpulan?: string;
  catatan?: string;
  is_completed: boolean;
  completed_at?: string;
  completed_by?: number;
  created_at: string;
  assignee?: { id: number; fullname: string };
}

export interface DisposisiAction {
  id: number;
  disposisi_id: number;
  step_num: number;
  from_jabatan: string;
  to_jabatan: string;
  catatan?: string;
  created_at: string;
  created_by?: number;
}

export interface DisposisiTL {
  id: number;
  disposisi_id: number;
  unit_code: string;
  concept_letter?: string;
  letter_number?: string;
  letter_date?: string;
  attachment?: string;
  created_by?: number;
  approved_by?: number;
  approved_at?: string;
  created_at: string;
}

export interface Unit {
  id: number;
  name: string;
  code: string;
}

export interface JenisSurat {
  id: string;
  nama_jenis_surat: string;
  status: boolean;
}

export interface DisposisiStats {
  total: number;
  inProgress: number;
  waitingDisposisi: number;
  waitingTL: number;
  completed: number;
}

export interface DisposisiStatsResponse {
  total: number;
  in_progress: number;
  waitingDisposisi: number;
  waiting_tl: number;
  completed: number;
}

// API functions
export const disposisiApi = {
  getAll: (params?: {
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
    unit_tujuan?: string;
    jenis_surat_id?: string;
    start_date?: string;
    end_date?: string;
    jabatan_code?: string;
  }) => {
    return api.get('/disposisi', { params });
  },

  getById: (id: number) => {
    return api.get(`/disposisi/${id}`);
  },

  create: (data: {
    tanggal_surat: string;
    tanggal_terima: string;
    pengirim: string;
    hal: string;
    unit_tujuan: string;
    jenis_surat_id?: string;
  }) => {
    return api.post('/disposisi', data);
  },

  submit: (id: number) => {
    return api.post(`/disposisi/${id}/submit`);
  },

  processStep: (id: number, data: {
    catatan?: string;
    kesimpulan?: string;
    assignee_id?: number;
    unit_code?: string;
  }) => {
    return api.post(`/disposisi/${id}/process`, data);
  },

  createTindakLanjut: (id: number, data: {
    concept_letter: string;
    attachment?: string;
  }) => {
    return api.post(`/disposisi/${id}/tindak-lanjut`, data);
  },

  updateTindakLanjut: (id: number, tlId: number, data: {
    concept_letter?: string;
    letter_number?: string;
    letter_date?: string;
    attachment?: string;
    approved_by?: number;
  }) => {
    return api.put(`/disposisi/${id}/tindak-lanjut/${tlId}`, data);
  },

  getStats: () => {
    return api.get('/disposisi/stats');
  },

  getUnits: () => {
    return api.get('/disposisi/units');
  },

  getJenisSurat: () => {
    return api.get('/disposisi/jenis-surat');
  },
};

// Workflow step labels
export const DISPOSISI_STEP_LABELS: Record<number, string> = {
  1: 'Agenda Surat Masuk',
  2: 'Telaah & Disposisi Dirjen',
  3: 'Catat & Kirim ke UKE II',
  4: 'Agenda Surat Masuk UKE II',
  5: 'Telaah & Tindak Lanjuti',
  6: 'Buat Konsep Surat TL',
  7: 'Telaah & Setujui Konsep',
  8: 'Nomor Surat & Kirim',
};

// Status labels
export const DISPOSISI_STATUS_LABELS: Record<string, string> = {
  DRAFT: 'Draft',
  IN_PROGRESS: 'Dalam Proses',
  WAITING_DISPOSISI: 'Menunggu Disposisi',
  WAITING_TL: 'Menunggu Tindak Lanjut',
  COMPLETED: 'Selesai',
};

// Status colors
export const DISPOSISI_STATUS_COLORS: Record<string, string> = {
  DRAFT: '#8c8c8c',
  IN_PROGRESS: '#1890ff',
  WAITING_DISPOSISI: '#faad14',
  WAITING_TL: '#722ed1',
  COMPLETED: '#52c41a',
};
