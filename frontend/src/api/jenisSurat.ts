import { api } from './axios';

export interface JenisSurat {
  id_jenis_surat: string;
  nama_jenis_surat: string;
  status: boolean;
  created_at: string;
  updated_at: string;
}

export const jenisSuratApi = {
  getAll: (search?: string) =>
    api.get('/jenis-surat', { params: { search } }),
  getById: (id: string) =>
    api.get(`/jenis-surat/${id}`),
  create: (data: Partial<JenisSurat>) =>
    api.post('/jenis-surat', data),
  update: (id: string, data: Partial<JenisSurat>) =>
    api.put(`/jenis-surat/${id}`, data),
  delete: (id: string) =>
    api.delete(`/jenis-surat/${id}`),
};
