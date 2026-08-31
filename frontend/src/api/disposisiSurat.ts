import { api } from './axios';

// Types
export interface DisposisiSurat {
  id: number;
  nomor_surat?: string;
  tanggal_surat: string;
  hal: string;
  jenis_surat: 'Undangan' | 'Surat Dinas';
  disposisi: string;
  isi_disposisi?: string;
  tujuan_disposisi: string;
  unit_code: string;
  tanggal_disposisi: string;
  tanggal_deadline?: string;
  pic: string;
  status_tl: 'PROSES_TINDAK_LANJUT' | 'TINDAK_LANJUT_SELESAI';
  created_by?: number;
  created_at: string;
  updated_at: string;
  creator?: { id: number; fullname: string };
}

export interface DisposisiSuratStats {
  total: number;
  proses: number;
  selesai: number;
}

export interface DropdownOptions {
  disposisi: string[];
  tujuan_disposisi: string[];
  unit_codes: { label: string; value: string }[];
  pic: string[];
  jenis_surat: string[];
}

export interface DisposisiAccess {
  id: number;
  user_id: number;
  unit_code: string;
  role: 'INPUTER' | 'DISPOSITOR' | 'ADMIN';
  created_at: string;
  user?: { id: number; fullname: string; email: string };
}

// API functions
export const disposisiSuratApi = {
  getAll: (params?: {
    page?: number;
    limit?: number;
    search?: string;
    status_tl?: string;
    tujuan_disposisi?: string;
    unit_code?: string;
    pic?: string;
    jenis_surat?: string;
    start_date?: string;
    end_date?: string;
  }) => {
    return api.get('/disposisi-surat', { params });
  },

  getById: (id: number) => {
    return api.get(`/disposisi-surat/${id}`);
  },

  create: (data: {
    nomor_surat?: string;
    tanggal_surat: string;
    hal: string;
    jenis_surat: string;
    disposisi: string;
    isi_disposisi?: string;
    tujuan_disposisi: string;
    unit_code: string;
    tanggal_disposisi: string;
    tanggal_deadline?: string;
    pic: string;
  }) => {
    return api.post('/disposisi-surat', data);
  },

  update: (id: number, data: Partial<{
    nomor_surat?: string;
    tanggal_surat?: string;
    hal?: string;
    jenis_surat?: string;
    disposisi?: string;
    isi_disposisi?: string;
    tujuan_disposisi?: string;
    unit_code?: string;
    tanggal_disposisi?: string;
    tanggal_deadline?: string;
    pic?: string;
    status_tl?: string;
  }>) => {
    return api.put(`/disposisi-surat/${id}`, data);
  },

  delete: (id: number) => {
    return api.delete(`/disposisi-surat/${id}`);
  },

  updateStatusTL: (id: number, status_tl: 'PROSES_TINDAK_LANJUT' | 'TINDAK_LANJUT_SELESAI') => {
    return api.patch(`/disposisi-surat/${id}/status-tl`, { status_tl });
  },

  getStats: () => {
    return api.get('/disposisi-surat/stats');
  },

  getDropdownOptions: () => {
    return api.get('/disposisi-surat/options');
  },

  // Access management
  getAccessList: () => {
    return api.get('/disposisi-surat/access/list');
  },

  getUserAccess: () => {
    return api.get('/disposisi-surat/access/my');
  },

  grantAccess: (data: { user_id: number; unit_code: string; role?: string }) => {
    return api.post('/disposisi-surat/access', data);
  },

  revokeAccess: (id: number) => {
    return api.delete(`/disposisi-surat/access/${id}`);
  },

  getAllUsers: () => {
    return api.get('/disposisi-surat/users');
  },
};

// Status TL labels
export const STATUS_TL_LABELS: Record<string, string> = {
  PROSES_TINDAK_LANJUT: 'Proses Tindak Lanjut',
  TINDAK_LANJUT_SELESAI: 'Tindak Lanjut Selesai',
};

// Status TL colors
export const STATUS_TL_COLORS: Record<string, string> = {
  PROSES_TINDAK_LANJUT: 'orange',
  TINDAK_LANJUT_SELESAI: 'green',
};

// Unit display mapping
export const UNIT_DISPLAY: Record<string, string> = {
  SESDIT_PS: 'Sesdit PS',
  DIT_PKPS: 'Dit. PKPS',
  DIT_PKTHA: 'Dit. PKTHA',
  DIT_PUPS: 'Dit. PUPS',
  DIT_PPS: 'Dit. PPS',
};

export const getUnitDisplay = (code: string): string => {
  return UNIT_DISPLAY[code] || code;
};
