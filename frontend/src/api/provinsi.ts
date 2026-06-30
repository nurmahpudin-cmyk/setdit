import { api } from './axios';

export interface Provinsi {
  proid: string;
  provinsi: string;
  id_sumber: number | null;
  nama_gubern: string | null;
  email: string | null;
  wilayah: string | null;
  nama_dinas: string | null;
  sk_perkembangan: string | null;
  tgl_sk_perkembangan: string | null;
  regional_id: number | null;
  deleted_at: string | null;
  pulau_id: number | null;
}

export const provinsiApi = {
  getAll: (search?: string) =>
    api.get('/provinsi', { params: { search } }),

  getById: (id: string) =>
    api.get(`/provinsi/${id}`),

  create: (data: Partial<Provinsi>) =>
    api.post('/provinsi', data),

  update: (id: string, data: Partial<Provinsi>) =>
    api.put(`/provinsi/${id}`, data),

  delete: (id: string) =>
    api.delete(`/provinsi/${id}`),
};
