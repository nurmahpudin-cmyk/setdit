import { api } from './axios';

export interface User {
  id: number;
  fullname: string;
  username: string;
  email: string;
  phone: string;
  status: string;
  is_verified: boolean;
  position?: { id: number; name: string };
  unit?: { id: number; name: string };
  roles?: { role: { id: number; name: string } }[];
  jabatan_codes?: string[];
  created_at: string;
  updated_at: string;
}

export interface UserQuery {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  unit_id?: number;
  position_id?: number;
}

export const usersApi = {
  getAll: (query?: UserQuery) => api.get('/users', { params: query }),
  getById: (id: number) => api.get(`/users/${id}`),
  create: (data: Partial<User> & { password: string; role_ids?: number[] }) =>
    api.post('/users', data),
  update: (id: number, data: Partial<User> & { role_ids?: number[]; jabatan_code?: string }) =>
    api.put(`/users/${id}`, data),
  delete: (id: number) => api.delete(`/users/${id}`),
  approve: (id: number, status: 'APPROVED' | 'REJECTED', notes?: string) =>
    api.put(`/users/${id}/approve`, { status, notes }),
  activate: (id: number) => api.put(`/users/${id}/activate`),
  deactivate: (id: number) => api.put(`/users/${id}/deactivate`),
  assignRoles: (id: number, roleIds: number[]) =>
    api.put(`/users/${id}/roles`, { role_ids: roleIds }),
  getPermissions: (id: number) => api.get(`/users/${id}/permissions`),
};
