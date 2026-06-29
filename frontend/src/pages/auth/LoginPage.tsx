import { useState, useEffect } from 'react';
import { Form, Input, Button, Card, message, Typography } from 'antd';
import { UserOutlined, LockOutlined, ReloadOutlined } from '@ant-design/icons';
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

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #14b8a6 0%, #0d9488 100%)',
        padding: 24,
      }}
    >
      <Card
        style={{
          width: '100%',
          maxWidth: 420,
          borderRadius: 16,
          boxShadow: '0 8px 32px rgba(0,0,0,0.15)',
        }}
        styles={{ body: { padding: '32px 24px' } }}
        className="login-card"
      >
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          {settings?.logo ? (
            <img
              src={getLogoUrl(settings.logo)}
              alt={settings.app_name}
              style={{ height: 64, maxWidth: '100%', marginBottom: 16, objectFit: 'contain', display: 'block', margin: '0 auto 16px' }}
            />
          ) : (
            <div
              style={{
                width: 64,
                height: 64,
                background: '#14b8a6',
                borderRadius: 16,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 16px',
                color: '#fff',
                fontWeight: 800,
                fontSize: 28,
              }}
            >
              {settings?.logo_initial || settings?.app_name?.charAt(0) || 'S'}
            </div>
          )}
          <Title level={3} style={{ margin: 0 }}>
            {settings?.app_name || 'SETDIT'}
          </Title>
          <Text type="secondary">{settings?.tagline || settings?.app_fullname || 'Sistem Terpadu'}</Text>
        </div>

        <Form layout="vertical" onFinish={handleLogin} form={form} size="large">
          <Form.Item
            name="login"
            rules={[{ required: true, message: 'Email/Username wajib diisi' }]}
          >
            <Input prefix={<UserOutlined />} placeholder="Email atau Username" />
          </Form.Item>

          <Form.Item
            name="password"
            rules={[{ required: true, message: 'Password wajib diisi' }]}
          >
            <Input.Password prefix={<LockOutlined />} placeholder="Password" />
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
                  color: '#14b8a6',
                  userSelect: 'none',
                  marginLeft: 4,
                }}
              >
                {captcha?.code || '·····'}
              </span>
            </Button>
          </div>

          <Form.Item style={{ marginBottom: 8 }}>
            <Button
              type="primary"
              htmlType="submit"
              loading={loading}
              block
              style={{
                background: '#14b8a6',
                borderColor: '#14b8a6',
                height: 44,
                fontWeight: 600,
              }}
            >
              Masuk
            </Button>
          </Form.Item>

          <div style={{ textAlign: 'center', marginBottom: 16 }}>
            <Link to="/forgot-password" style={{ color: '#14b8a6', fontSize: 13 }}>
              Lupa Password?
            </Link>
          </div>
        </Form>

        
      </Card>
    </div>
  );
}
