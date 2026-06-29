import { api } from './axios';

export interface WhatsAppSession {
  id: number;
  name: string;
  is_active: boolean;
  qr_code: string | null;
  last_seen: string | null;
  created_at: string;
}

export interface WhatsAppLog {
  id: number;
  session_id: number | null;
  phone: string;
  message: string;
  status: 'PENDING' | 'SENT' | 'DELIVERED' | 'READ' | 'FAILED';
  error: string | null;
  created_by: number | null;
  created_at: string;
  session?: { name: string };
  creator?: { fullname: string };
}

export const whatsappApi = {
  getSessions: () => api.get<{ data: WhatsAppSession[] }>('/whatsapp/sessions'),

  getSession: (id: number) => api.get<{ data: WhatsAppSession }>(`/whatsapp/sessions/${id}`),

  createSession: (name: string) =>
    api.post<{ data: WhatsAppSession }>('/whatsapp/sessions', { name }),

  deleteSession: (id: number) =>
    api.delete(`/whatsapp/sessions/${id}`),

  getQRCode: (id: number) =>
    api.get<{ data: { qr_code: string | null; is_active: boolean } }>(`/whatsapp/sessions/${id}/qr`),

  sendMessage: (sessionId: number, phone: string, message: string) =>
    api.post(`/whatsapp/sessions/${sessionId}/send`, { phone, message }),

  getLogs: (params?: {
    session_id?: number;
    phone?: string;
    status?: string;
    page?: number;
    limit?: number;
  }) => api.get<{ data: WhatsAppLog[]; pagination: { page: number; limit: number; total: number } }>('/whatsapp/logs', { params }),
};
