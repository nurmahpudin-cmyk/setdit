import { api } from './axios';

export interface Kabkota {
  kabid: string;
  proid: string | null;
  kabkota: string | null;
  id_sumber: number | null;
  nama_walikota: string | null;
  email: string | null;
}

export const kabkotaApi = {
  getAll: (search?: string, proid?: string) =>
    api.get('/kabkota', { params: { search, proid } }),
  getById: (id: string) => api.get(`/kabkota/${id}`),
  create: (data: Partial<Kabkota>) => api.post('/kabkota', data),
  update: (id: string, data: Partial<Kabkota>) => api.put(`/kabkota/${id}`, data),
  delete: (id: string) => api.delete(`/kabkota/${id}`),
};
