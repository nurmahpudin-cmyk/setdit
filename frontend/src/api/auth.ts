import { api } from './axios';

export interface LoginData {
  login: string;
  password: string;
}

export interface RegisterData {
  fullname: string;
  username: string;
  email: string;
  phone: string;
  password: string;
}

export const authApi = {
  login: (data: LoginData) => api.post('/auth/login', data),
  register: (data: RegisterData) => api.post('/auth/register', data),
  refresh: (refreshToken: string) => api.post('/auth/refresh', { refreshToken }),
  logout: () => api.post('/auth/logout'),
  getProfile: () => api.get('/auth/profile'),
  forgotPassword: (phone: string) => api.post('/auth/forgot-password', { phone }),
  verifyOTP: (userId: number, code: string, type: string) =>
    api.post('/auth/verify-otp', { user_id: userId, code, type }),
  resetPassword: (userId: number, newPassword: string) =>
    api.post('/auth/reset-password', { user_id: userId, new_password: newPassword }),
  getCaptcha: () => api.get('/auth/captcha'),
  verifyCaptcha: (token: string, userInput: string) =>
    api.post('/auth/verify-captcha', { token, userInput }),
};
