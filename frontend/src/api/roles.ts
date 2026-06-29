import { api } from './axios';

export interface Role {
  id: number;
  name: string;
  code: string;
  description: string;
  is_active: boolean;
  is_super_admin: boolean;
  permissions?: { permission: { id: number; code: string; name: string } }[];
  _count?: { users: number; permissions: number };
}

export interface Permission {
  id: number;
  name: string;
  code: string;
  module: string;
  action: string;
  description: string;
  is_active: boolean;
}

export const rolesApi = {
  getAll: () => api.get('/roles'),
  getById: (id: number) => api.get(`/roles/${id}`),
  create: (data: Partial<Role>) => api.post('/roles', data),
  update: (id: number, data: Partial<Role>) => api.put(`/roles/${id}`, data),
  delete: (id: number) => api.delete(`/roles/${id}`),
  getPermissions: (id: number) => api.get(`/roles/${id}/permissions`),
  assignPermissions: (id: number, permissionIds: number[]) =>
    api.put(`/roles/${id}/permissions`, { permission_ids: permissionIds }),
};

export const permissionsApi = {
  getAll: (params?: { search?: string; module?: string }) => api.get('/permissions', { params }),
  getById: (id: number) => api.get(`/permissions/${id}`),
  create: (data: Partial<Permission>) => api.post('/permissions', data),
  update: (id: number, data: Partial<Permission>) => api.put(`/permissions/${id}`, data),
  delete: (id: number) => api.delete(`/permissions/${id}`),
  getModules: () => api.get('/permissions/modules'),
};
