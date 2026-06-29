import { api } from './axios';

export interface Pegawai {
  id: number;
  nama_lengkap: string;
  nama_panggilan: string | null;
  nip: string;
  nomor_wa: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  _count?: { jadwal_pendamping: number };
}

export interface CreatePegawaiPayload {
  nama_lengkap: string;
  nama_panggilan?: string;
  nip: string;
  nomor_wa?: string;
}

export interface UpdatePegawaiPayload extends Partial<CreatePegawaiPayload> {
  is_active?: boolean;
}

export interface PaginationResult {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface PaginatedResult<T> {
  items: T[];
  pagination: PaginationResult;
}

export const pegawaiApi = {
  findAll: async (params?: { page?: number; limit?: number; search?: string }): Promise<PaginatedResult<Pegawai>> => {
    const response = await api.get('/pegawai', { params });
    return {
      items: response.data.data,
      pagination: response.data.pagination,
    };
  },

  findById: async (id: number): Promise<Pegawai> => {
    const response = await api.get(`/pegawai/${id}`);
    return response.data.data;
  },

  create: async (data: CreatePegawaiPayload): Promise<Pegawai> => {
    const response = await api.post('/pegawai', data);
    return response.data.data;
  },

  update: async (id: number, data: UpdatePegawaiPayload): Promise<Pegawai> => {
    const response = await api.put(`/pegawai/${id}`, data);
    return response.data.data;
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`/pegawai/${id}`);
  },

  getAll: async (): Promise<Pegawai[]> => {
    const response = await api.get('/pegawai/all');
    return response.data.data;
  },
};
