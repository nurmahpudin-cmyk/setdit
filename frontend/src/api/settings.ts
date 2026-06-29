import { api } from './axios';

export interface Settings {
  id: number;
  app_name: string;
  app_fullname: string;
  tagline: string;
  description: string;
  logo: string;
  logo_initial: string;
  email: string;
  phone: string;
  address: string;
}

let cachedSettings: Settings | null = null;

export const settingsApi = {
  get: async (): Promise<Settings> => {
    if (cachedSettings) return cachedSettings;
    const res = await api.get('/settings');
    cachedSettings = res.data.data;
    return cachedSettings as Settings;
  },
  update: (data: Partial<Settings>) => api.put('/settings', data),
  clearCache: () => { cachedSettings = null; },
};

export const positionsApi = {
  getAll: (params?: { search?: string; is_active?: boolean }) =>
    api.get('/positions', { params }),
  create: (data: { name: string; code: string }) => api.post('/positions', data),
  update: (id: number, data: { name?: string; code?: string; is_active?: boolean }) =>
    api.put(`/positions/${id}`, data),
  delete: (id: number) => api.delete(`/positions/${id}`),
};

export const unitsApi = {
  getAll: (params?: { search?: string; is_active?: boolean; parent_id?: number }) =>
    api.get('/units', { params }),
  create: (data: { name: string; code: string; parent_id?: number }) =>
    api.post('/units', data),
  update: (id: number, data: { name?: string; code?: string; parent_id?: number | null; is_active?: boolean }) =>
    api.put(`/units/${id}`, data),
  delete: (id: number) => api.delete(`/units/${id}`),
};
