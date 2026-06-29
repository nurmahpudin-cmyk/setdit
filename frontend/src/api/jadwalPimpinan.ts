import { api } from './axios';

export interface PendampingPegawai {
  id?: number;
  pegawai_id: number;
  pegawai?: {
    id: number;
    nama_lengkap: string;
    nama_panggilan: string | null;
    nip: string;
    nomor_wa: string | null;
  };
}

export interface PendampingDirecteur {
  id?: number;
  kode_direktur: string;
  nama_direktur: string;
}

export interface JadwalPimpinan {
  id: number;
  acara: string;
  lokasi: string;
  sebagai: string;
  tanggal_awal: string;
  tanggal_akhir: string;
  is_notified: boolean;
  notified_at: string | null;
  created_by: number | null;
  creator?: { id: number; fullname: string };
  pendamping_pegawai: PendampingPegawai[];
  pendamping_direktur: PendampingDirecteur[];
  created_at: string;
  updated_at: string;
}

export interface Pegawai {
  id: number;
  nama_lengkap: string;
  nama_panggilan: string | null;
  nip: string;
  nomor_wa: string | null;
}

export interface CreateJadwalPayload {
  acara: string;
  lokasi: string;
  sebagai: string;
  tanggal_awal: string;
  tanggal_akhir: string;
  pendamping_pegawai?: { pegawai_id: number }[];
  pendamping_direktur?: { kode_direktur: string; nama_direktur: string }[];
}

export interface UpdateJadwalPayload extends Partial<CreateJadwalPayload> {}

export interface PaginationParams {
  page?: number;
  limit?: number;
  search?: string;
  tanggal_awal?: string;
  tanggal_akhir?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export const jadwalPimpinanApi = {
  findAll: async (params?: PaginationParams): Promise<PaginatedResponse<JadwalPimpinan>> => {
    const response = await api.get('/jadwal-pimpinan', { params });
    return response.data;
  },

  findById: async (id: number): Promise<JadwalPimpinan> => {
    const response = await api.get(`/jadwal-pimpinan/${id}`);
    return response.data.data;
  },

  create: async (data: CreateJadwalPayload): Promise<JadwalPimpinan> => {
    const response = await api.post('/jadwal-pimpinan', data);
    return response.data.data;
  },

  update: async (id: number, data: UpdateJadwalPayload): Promise<JadwalPimpinan> => {
    const response = await api.put(`/jadwal-pimpinan/${id}`, data);
    return response.data.data;
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`/jadwal-pimpinan/${id}`);
  },

  getUpcoming: async (type: 'weekly' | 'monthly'): Promise<JadwalPirman[]> => {
    const response = await api.get('/jadwal-pimpinan/upcoming', { params: { type } });
    return response.data.data;
  },

  getPegawai: async (): Promise<Pegawai[]> => {
    const response = await api.get('/jadwal-pimpinan/pegawai');
    return response.data.data;
  },

  previewNotification: async (type: 'weekly' | 'monthly'): Promise<{ preview: string; count: number }> => {
    const response = await api.get('/jadwal-pimpinan/preview-notification', { params: { type } });
    return response.data.data;
  },

  sendNotification: async (phone: string, type: 'weekly' | 'monthly'): Promise<void> => {
    await api.post('/jadwal-pimpinan/send-notification', { phone, type });
  },
};
