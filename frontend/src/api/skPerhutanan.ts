import { api } from './axios';

// Types
export interface SKPerhutanan {
  id: number;
  nomor_surat?: string;
  tanggal_surat?: string;
  tanggal_terima: string;
  tanggal_deadline: string;
  unit_pengusul: 'PKPS' | 'PKTHA';
  perihal: string;
  tujuan_surat: string;
  konseptor?: string;
  penandatangan?: string;
  nomor_nd_sk?: string;
  tanggal_nd_sk?: string;
  nomor_sk?: string;
  tanggal_sk?: string;
  provinsi?: string;
  kabupaten?: string;
  kecamatan?: string;
  desa?: string;
  skema?: string;
  kelompok_ps?: string;
  luas?: number;
  jml_kk?: number;
  status: 'DRAFT' | 'IN_PROGRESS' | 'WAITING_REVISION' | 'APPROVED' | 'SIGNED' | 'COMPLETED';
  current_step: number;
  created_by?: number;
  created_at: string;
  updated_at: string;
  creator?: { id: number; fullname: string };
  stages?: SKWorkflowStage[];
  dispositions?: SKDisposition[];
  catatan_history?: SKCatatanWithStep[];
}

export interface SKCatatanWithStep extends SKCatatan {
  step_name?: string;
  kesimpulan?: string;
}

export interface SKWorkflowStage {
  id: number;
  sk_id: number;
  step_num: number;
  step_name: string;
  jabatan_code: string;
  assignee_id?: number;
  action?: string;
  kesimpulan?: string;
  is_completed: boolean;
  completed_at?: string;
  completed_by?: number;
  created_at: string;
  assignee?: { id: number; fullname: string };
  completedByUser?: { id: number; fullname: string };
  catatan_list?: SKCatatan[];
}

export interface SKCatatan {
  id: number;
  sk_id: number;
  step_num: number;
  user_id: number;
  catatan: string;
  created_at: string;
  user?: { id: number; fullname: string };
}

export interface SKDisposition {
  id: number;
  sk_id: number;
  step_num: number;
  from_jabatan: string;
  to_jabatan: string;
  catatan?: string;
  created_at: string;
  created_by?: number;
}

export interface SKNotification {
  id: number;
  sk_id: number;
  recipient_id: number;
  phone: string;
  message: string;
  status: 'PENDING' | 'SENT' | 'FAILED';
  sent_at?: string;
  error?: string;
  created_at: string;
}

export interface SKStats {
  total: number;
  inProgress: number;
  waitingRevision: number;
  completed: number;
  overdue: number;
}

export interface SKQuery {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  unit_pengusul?: string;
  start_date?: string;
  end_date?: string;
  jabatan_code?: string;
  userId?: number;
}

// API Functions
export const skPerhutananApi = {
  // List
  getAll: (query?: SKQuery) => api.get('/sk-perhutanan', { params: query }),

  // Detail
  getById: (id: number) => api.get(`/sk-perhutanan/${id}`),

  // CRUD
  create: (data: Partial<SKPerhutanan>) => api.post('/sk-perhutanan', data),
  update: (id: number, data: Partial<SKPerhutanan>) => api.put(`/sk-perhutanan/${id}`, data),

  // Workflow Actions
  submit: (id: number) => api.post(`/sk-perhutanan/${id}/submit`),
  processStep: (id: number, data: {
    catatan?: string;
    kesimpulan?: string;
    assignee_id?: number;
    nomor_nd_sk?: string;
    tanggal_nd_sk?: string;
    nomor_sk?: string;
    tanggal_sk?: string;
  }) =>
    api.post(`/sk-perhutanan/${id}/process`, data),
  addNomorND: (id: number, data: { nomor_nd_sk: string; tanggal_nd_sk: string }) =>
    api.post(`/sk-perhutanan/${id}/nomor-nd`, data),
  signSK: (id: number) => api.post(`/sk-perhutanan/${id}/sign`),
  addNomorSK: (id: number, data: { nomor_sk: string; tanggal_sk: string }) =>
    api.post(`/sk-perhutanan/${id}/nomor-sk`, data),
  finalize: (id: number) => api.post(`/sk-perhutanan/${id}/finalize`),

  // Pending by Jabatan
  getPendingByJabatan: (jabatanCode: string) => api.get(`/sk-perhutanan/pending/${jabatanCode}`),

  // Stats
  getStats: () => api.get('/sk-perhutanan/stats'),

  // Users by Jabatan
  getUsersByJabatan: (jabatanCode: string) => api.get(`/sk-perhutanan/jabatan/${jabatanCode}/users`),
};
