import { api } from './axios';

export interface Skema {
  id_skema: number;
  nama_skema: string | null;
}

export const skemaApi = {
  getAll: (search?: string) => api.get('/skema', { params: { search } }),
  getById: (id: number) => api.get(`/skema/${id}`),
  create: (data: Partial<Skema>) => api.post('/skema', data),
  update: (id: number, data: Partial<Skema>) => api.put(`/skema/${id}`, data),
  delete: (id: number) => api.delete(`/skema/${id}`),
};
