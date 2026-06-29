import { api } from './axios';

export interface Menu {
  id: number;
  name: string;
  path: string;
  module: string;
  icon: string;
  order_num: number;
  parent_id: number | null;
  is_active: boolean;
  permissions?: { permission: { id: number; code: string; name: string } }[];
  _count?: { children: number };
}

export const menusApi = {
  getAll: () => api.get('/menus'),
  getById: (id: number) => api.get(`/menus/${id}`),
  create: (data: Partial<Menu>) => api.post('/menus', data),
  update: (id: number, data: Partial<Menu>) => api.put(`/menus/${id}`, data),
  delete: (id: number) => api.delete(`/menus/${id}`),
  getPermissions: (id: number) => api.get(`/menus/${id}/permissions`),
  assignPermissions: (id: number, permissionIds: number[]) =>
    api.put(`/menus/${id}/permissions`, { permission_ids: permissionIds }),
  getVisibleMenus: () => api.get('/menus/visible'),
};
