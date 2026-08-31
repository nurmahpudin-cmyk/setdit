import { useState, useEffect } from 'react';
import { Form, Input, Button, message, Typography } from 'antd';
import {
  UserOutlined,
  LockOutlined,
  ReloadOutlined,
  SafetyCertificateOutlined,
  FileProtectOutlined,
  ThunderboltOutlined,
} from '@ant-design/icons';
import { Link, useNavigate } from 'react-router-dom';
import { authApi } from '../../api/auth';
import { settingsApi, Settings } from '../../api/settings';
import { useAppDispatch } from '../../hooks/useRedux';
import { setCredentials } from '../../store/authSlice';

const { Title, Text } = Typography;

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const getLogoUrl = (logo: string | undefined) => {
  if (!logo) return undefined;
  if (logo.startsWith('http')) return logo;
  return `${API_URL.replace('/api', '')}${logo}`;
};

interface CaptchaData {
  token: string;
  code: string;
}

const panelStyle: React.CSSProperties = {
  flex: '1 1 46%',
  background: 'linear-gradient(160deg, #0f766e 0%, #0d9488 45%, #14b8a6 100%)',
  color: '#fff',
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'center',
  padding: '56px 56px',
  position: 'relative',
  overflow: 'hidden',
};

const decoCircle = (size: number, top: string, left: string, opacity: number): React.CSSProperties => ({
  position: 'absolute',
  width: size,
  height: size,
  borderRadius: '50%',
  background: 'rgba(255,255,255,0.08)',
  top,
  left,
  opacity,
  pointerEvents: 'none',
});

export default function LoginPage() {
  const [loading, setLoading] = useState(false);
  const [captcha, setCaptcha] = useState<CaptchaData | null>(null);
  const [captchaLoading, setCaptchaLoading] = useState(false);
  const [settings, setSettings] = useState<Settings | null>(null);
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  const fetchSettings = async () => {
    try {
      const s = await settingsApi.get();
      setSettings(s);
      document.title = s.app_name;
    } catch { /* ignore */ }
  };

  const fetchCaptcha = async () => {
    setCaptchaLoading(true);
    try {
      const res = await authApi.getCaptcha();
      setCaptcha({ token: res.data.data.token, code: res.data.data.code });
    } catch {
      // silently fail
    } finally {
      setCaptchaLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
    fetchCaptcha();
  }, []);

  const handleLogin = async (values: { login: string; password: string; captcha: string }) => {
    if (!captcha) {
      message.error('Captcha belum dimuat');
      return;
    }

    setLoading(true);
    try {
      const verify = await authApi.verifyCaptcha(captcha.token, values.captcha);
      if (!verify.data.data.valid) {
        message.error('Captcha salah');
        fetchCaptcha();
        setLoading(false);
        return;
      }

      const res = await authApi.login(values);
      dispatch(
        setCredentials({
          user: res.data.data.user,
          accessToken: res.data.data.accessToken,
          refreshToken: res.data.data.refreshToken,
        })
      );
      message.success('Login berhasil!');
      navigate('/dashboard');
    } catch (err: any) {
      message.error(err.response?.data?.message || 'Login gagal');
      fetchCaptcha();
    } finally {
      setLoading(false);
    }
  };

  const highlights = [
    { icon: <FileProtectOutlined />, text: 'Manajemen SK Perhutanan Sosial terintegrasi' },
    { icon: <ThunderboltOutlined />, text: 'Alur disposisi & approval berjenjang' },
    { icon: <SafetyCertificateOutlined />, text: 'Aman dengan role & permission berlapis' },
  ];

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        background: '#f4f7f6',
      }}
    >
      {/* Branding Panel (hidden on mobile) */}
      <div style={{ ...panelStyle, display: window.innerWidth < 900 ? 'none' : 'flex' }}>
        <div style={decoCircle(420, '-120px', '-140px', 1)} />
        <div style={decoCircle(280, '60%', '55%', 1)} />
        <div style={decoCircle(160, '12%', '70%', 1)} />

        <div style={{ position: 'relative', zIndex: 1 }}>
          {settings?.logo ? (
            <img
              src={getLogoUrl(settings.logo)}
              alt={settings.app_name}
              style={{
                height: 56,
                maxWidth: 260,
                objectFit: 'contain',
                background: '#fff',
                borderRadius: 12,
                padding: '6px 12px',
                marginBottom: 32,
              }}
            />
          ) : (
            <div
              style={{
                width: 56,
                height: 56,
                background: 'rgba(255,255,255,0.2)',
                border: '1px solid rgba(255,255,255,0.35)',
                backdropFilter: 'blur(4px)',
                borderRadius: 16,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 32,
                color: '#fff',
                fontWeight: 800,
                fontSize: 24,
              }}
            >
              {settings?.logo_initial || settings?.app_name?.charAt(0) || 'S'}
            </div>
          )}

          <Title style={{ color: '#fff', fontSize: 38, fontWeight: 800, lineHeight: 1.2, marginBottom: 12 }}>
            {settings?.app_fullname || 'Sistem Informasi\nSetditjen Perhutanan Sosial'}
          </Title>
          <Text style={{ color: 'rgba(255,255,255,0.85)', fontSize: 16, display: 'block', marginBottom: 40 }}>
            {settings?.tagline || 'Satu platform untuk seluruh proses persuratan dan SK Perhutanan Sosial.'}
          </Text>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            {highlights.map((h) => (
              <div key={h.text} style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <div
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 12,
                    background: 'rgba(255,255,255,0.15)',
                    border: '1px solid rgba(255,255,255,0.25)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 18,
                    flexShrink: 0,
                  }}
                >
                  {h.icon}
                </div>
                <Text style={{ color: 'rgba(255,255,255,0.92)', fontSize: 15 }}>{h.text}</Text>
              </div>
            ))}
          </div>
        </div>

        <div style={{ position: 'relative', zIndex: 1, marginTop: 64, color: 'rgba(255,255,255,0.6)', fontSize: 13 }}>
          © {new Date().getFullYear()} {settings?.app_name || 'SETDIT'} — Direktorat Jenderal Perhutanan Sosial
        </div>
      </div>

      {/* Form Panel */}
      <div
        style={{
          flex: '1 1 54%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '40px 24px',
        }}
      >
        <div style={{ width: '100%', maxWidth: 400 }}>
          {/* Mobile logo */}
          <div style={{ textAlign: 'center', marginBottom: 32, display: window.innerWidth < 900 ? 'block' : 'none' }}>
            <div
              style={{
                width: 64,
                height: 64,
                background: 'linear-gradient(135deg, #14b8a6, #0d9488)',
                borderRadius: 18,
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
                fontWeight: 800,
                fontSize: 28,
                marginBottom: 12,
                boxShadow: '0 8px 20px rgba(13,148,136,0.35)',
              }}
            >
              {settings?.logo_initial || settings?.app_name?.charAt(0) || 'S'}
            </div>
            <Title level={3} style={{ margin: 0 }}>
              {settings?.app_name || 'SETDIT'}
            </Title>
          </div>

          <Title level={3} style={{ marginBottom: 4, fontWeight: 700 }}>
            Selamat Datang Kembali 👋
          </Title>
          <Text type="secondary" style={{ fontSize: 15, display: 'block', marginBottom: 32 }}>
            Masuk untuk melanjutkan pekerjaan Anda.
          </Text>

          <Form layout="vertical" onFinish={handleLogin} form={form} size="large">
            <Form.Item
              name="login"
              rules={[{ required: true, message: 'Email/Username wajib diisi' }]}
            >
              <Input prefix={<UserOutlined style={{ color: '#94a3b8' }} />} placeholder="Email atau Username" />
            </Form.Item>

            <Form.Item
              name="password"
              rules={[{ required: true, message: 'Password wajib diisi' }]}
            >
              <Input.Password prefix={<LockOutlined style={{ color: '#94a3b8' }} />} placeholder="Password" />
            </Form.Item>

            <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
              <Form.Item
                name="captcha"
                rules={[{ required: true, message: 'Captcha wajib diisi' }]}
                style={{ flex: 1, marginBottom: 0 }}
              >
                <Input
                  placeholder="Kode captcha"
                  maxLength={6}
                  style={{ fontFamily: 'monospace', letterSpacing: 3, textAlign: 'center' }}
                />
              </Form.Item>
              <Button
                icon={<ReloadOutlined spin={captchaLoading} />}
                onClick={fetchCaptcha}
                style={{ marginTop: 4, height: 40 }}
              >
                <span
                  style={{
                    fontFamily: 'monospace',
                    fontWeight: 700,
                    fontSize: 13,
                    letterSpacing: 2,
                    color: '#0d9488',
                    userSelect: 'none',
                    marginLeft: 4,
                  }}
                >
                  {captcha?.code || '·····'}
                </span>
              </Button>
            </div>

            <Form.Item style={{ marginBottom: 8, marginTop: 24 }}>
              <Button
                type="primary"
                htmlType="submit"
                loading={loading}
                block
                style={{
                  height: 48,
                  fontWeight: 600,
                  fontSize: 15,
                  background: 'linear-gradient(135deg, #14b8a6 0%, #0d9488 100%)',
                  border: 'none',
                  boxShadow: '0 6px 16px rgba(13,148,136,0.35)',
                }}
              >
                Masuk
              </Button>
            </Form.Item>

            <div style={{ textAlign: 'center', marginBottom: 16 }}>
              <Link to="/forgot-password" style={{ color: '#0d9488', fontSize: 13 }}>
                Lupa Password?
              </Link>
            </div>

            <div style={{ textAlign: 'center', paddingTop: 16, borderTop: '1px solid #f0f0f0' }}>
              <Text type="secondary" style={{ fontSize: 13 }}>Belum punya akun? </Text>
              <Link to="/register" style={{ color: '#0d9488', fontSize: 13, fontWeight: 600 }}>
                Daftar di sini
              </Link>
            </div>
          </Form>
        </div>
      </div>
    </div>
  );
}
