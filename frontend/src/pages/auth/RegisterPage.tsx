import { useState, useEffect } from 'react';
import { Form, Input, Button, message, Typography, Select } from 'antd';
import {
  UserOutlined,
  MailOutlined,
  PhoneOutlined,
  LockOutlined,
  SafetyCertificateOutlined,
  FileProtectOutlined,
  ThunderboltOutlined,
  CheckCircleFilled,
} from '@ant-design/icons';
import { Link, useNavigate } from 'react-router-dom';
import { authApi } from '../../api/auth';
import { settingsApi, Settings } from '../../api/settings';

const { Title, Text } = Typography;

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const getLogoUrl = (logo: string | undefined) => {
  if (!logo) return undefined;
  if (logo.startsWith('http')) return logo;
  return `${API_URL.replace('/api', '')}${logo}`;
};

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

export default function RegisterPage() {
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [registeredName, setRegisteredName] = useState('');
  const [settings, setSettings] = useState<Settings | null>(null);
  const [positions, setPositions] = useState<{ id: number; name: string; code: string }[]>([]);
  const [form] = Form.useForm();
  const navigate = useNavigate();

  useEffect(() => {
    settingsApi.get().then(s => {
      setSettings(s);
      document.title = `Daftar - ${s.app_name}`;
    }).catch(() => {});

    authApi.getPositions().then(res => {
      setPositions(res.data.data || []);
    }).catch(() => {});
  }, []);

  const handleRegister = async (values: any) => {
    setLoading(true);
    try {
      const res = await authApi.register(values);
      setRegisteredName(values.fullname);
      setDone(true);
      message.success(res.data.message || 'Pendaftaran berhasil');
    } catch (err: any) {
      message.error(err.response?.data?.message || 'Pendaftaran gagal');
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
    <div style={{ minHeight: '100vh', display: 'flex', background: '#f4f7f6' }}>
      {/* Branding Panel */}
      <div style={{ ...panelStyle, display: window.innerWidth < 900 ? 'none' : 'flex' }}>
        <div style={decoCircle(420, '-120px', '-140px', 1)} />
        <div style={decoCircle(280, '60%', '55%', 1)} />
        <div style={decoCircle(160, '12%', '70%', 1)} />

        <div style={{ position: 'relative', zIndex: 1 }}>
          {settings?.logo ? (
            <img
              src={getLogoUrl(settings.logo)}
              alt={settings.app_name}
              style={{ height: 56, maxWidth: 260, objectFit: 'contain', background: '#fff', borderRadius: 12, padding: '6px 12px', marginBottom: 32 }}
            />
          ) : (
            <div style={{ width: 56, height: 56, background: 'rgba(255,255,255,0.2)', border: '1px solid rgba(255,255,255,0.35)', borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 32, color: '#fff', fontWeight: 800, fontSize: 24 }}>
              {settings?.logo_initial || settings?.app_name?.charAt(0) || 'S'}
            </div>
          )}

          <Title style={{ color: '#fff', fontSize: 38, fontWeight: 800, lineHeight: 1.2, marginBottom: 12 }}>
            Buat Akun Anda
          </Title>
          <Text style={{ color: 'rgba(255,255,255,0.85)', fontSize: 16, display: 'block', marginBottom: 40 }}>
            Daftar untuk mulai menggunakan {settings?.app_name || 'SETDIT'}. Akun Anda akan diverifikasi oleh admin.
          </Text>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            {highlights.map((h) => (
              <div key={h.text} style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <div style={{ width: 40, height: 40, borderRadius: 12, background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>
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
      <div style={{ flex: '1 1 54%', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 24px', overflowY: 'auto' }}>
        <div style={{ width: '100%', maxWidth: 440 }}>
          {/* Mobile logo */}
          <div style={{ textAlign: 'center', marginBottom: 32, display: window.innerWidth < 900 ? 'block' : 'none' }}>
            <div style={{ width: 64, height: 64, background: 'linear-gradient(135deg, #14b8a6, #0d9488)', borderRadius: 18, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 800, fontSize: 28, marginBottom: 12, boxShadow: '0 8px 20px rgba(13,148,136,0.35)' }}>
              {settings?.logo_initial || settings?.app_name?.charAt(0) || 'S'}
            </div>
            <Title level={3} style={{ margin: 0 }}>{settings?.app_name || 'SETDIT'}</Title>
          </div>

          {done ? (
            <div style={{ textAlign: 'center', padding: '24px 0' }}>
              <CheckCircleFilled style={{ fontSize: 72, color: '#0d9488', marginBottom: 16 }} />
              <Title level={3} style={{ marginBottom: 8 }}>Pendaftaran Berhasil!</Title>
              <Text type="secondary" style={{ display: 'block', marginBottom: 8 }}>
                Terima kasih <strong>{registeredName}</strong>. Akun Anda sedang menunggu persetujuan admin.
              </Text>
              <Text type="secondary" style={{ display: 'block', marginBottom: 24, fontSize: 13 }}>
                Anda akan menerima notifikasi via WhatsApp setelah akun disetujui.
              </Text>
              <Button
                type="primary"
                block
                onClick={() => navigate('/login')}
                style={{ height: 48, fontWeight: 600, background: 'linear-gradient(135deg, #14b8a6 0%, #0d9488 100%)', border: 'none', boxShadow: '0 6px 16px rgba(13,148,136,0.35)' }}
              >
                Kembali ke Login
              </Button>
            </div>
          ) : (
            <>
              <Title level={3} style={{ marginBottom: 4, fontWeight: 700 }}>Daftar Akun Baru</Title>
              <Text type="secondary" style={{ fontSize: 15, display: 'block', marginBottom: 32 }}>
                Isi data berikut untuk membuat akun Anda.
              </Text>

              <Form layout="vertical" onFinish={handleRegister} form={form} size="large">
                <Form.Item
                  name="fullname"
                  rules={[{ required: true, message: 'Nama lengkap wajib diisi' }, { min: 2, message: 'Minimal 2 karakter' }]}
                >
                  <Input prefix={<UserOutlined style={{ color: '#94a3b8' }} />} placeholder="Nama Lengkap" />
                </Form.Item>

                <Form.Item
                  name="username"
                  rules={[
                    { required: true, message: 'Username wajib diisi' },
                    { min: 3, message: 'Minimal 3 karakter' },
                    { pattern: /^[a-zA-Z0-9_]+$/, message: 'Hanya huruf, angka, dan underscore' },
                  ]}
                >
                  <Input prefix={<UserOutlined style={{ color: '#94a3b8' }} />} placeholder="Username" />
                </Form.Item>

                <Form.Item
                  name="email"
                  rules={[{ required: true, message: 'Email wajib diisi' }, { type: 'email', message: 'Email tidak valid' }]}
                >
                  <Input prefix={<MailOutlined style={{ color: '#94a3b8' }} />} placeholder="Email" />
                </Form.Item>

                <Form.Item
                  name="phone"
                  rules={[
                    { required: true, message: 'Nomor HP wajib diisi' },
                    { pattern: /^08[0-9]{8,13}$/, message: 'Format: 08xxxxxxxxxx' },
                  ]}
                >
                  <Input prefix={<PhoneOutlined style={{ color: '#94a3b8' }} />} placeholder="Nomor HP (08xxxxxxxxxx)" />
                </Form.Item>

                <Form.Item
                  name="position_id"
                  label="Posisi / Jabatan"
                  rules={[{ required: true, message: 'Posisi wajib dipilih' }]}
                >
                  <Select
                    placeholder="Pilih posisi / jabatan Anda"
                    options={positions.map((p) => ({ label: p.name, value: p.id }))}
                    showSearch
                    optionFilterProp="label"
                  />
                </Form.Item>

                <Form.Item
                  name="password"
                  rules={[
                    { required: true, message: 'Password wajib diisi' },
                    { min: 8, message: 'Minimal 8 karakter' },
                    { pattern: /^(?=.*[a-zA-Z])(?=.*[0-9])/, message: 'Harus mengandung huruf dan angka' },
                  ]}
                  hasFeedback
                >
                  <Input.Password prefix={<LockOutlined style={{ color: '#94a3b8' }} />} placeholder="Password" />
                </Form.Item>

                <Form.Item
                  name="confirm_password"
                  dependencies={['password']}
                  rules={[
                    { required: true, message: 'Konfirmasi password wajib diisi' },
                    ({ getFieldValue }) => ({
                      validator(_, value) {
                        if (!value || getFieldValue('password') === value) {
                          return Promise.resolve();
                        }
                        return Promise.reject(new Error('Password tidak cocok'));
                      },
                    }),
                  ]}
                  hasFeedback
                >
                  <Input.Password prefix={<LockOutlined style={{ color: '#94a3b8' }} />} placeholder="Konfirmasi Password" />
                </Form.Item>

                <Form.Item style={{ marginBottom: 8, marginTop: 8 }}>
                  <Button
                    type="primary"
                    htmlType="submit"
                    loading={loading}
                    block
                    style={{ height: 48, fontWeight: 600, fontSize: 15, background: 'linear-gradient(135deg, #14b8a6 0%, #0d9488 100%)', border: 'none', boxShadow: '0 6px 16px rgba(13,148,136,0.35)' }}
                  >
                    Daftar
                  </Button>
                </Form.Item>
              </Form>

              <div style={{ textAlign: 'center', marginTop: 16 }}>
                <Text type="secondary" style={{ fontSize: 13 }}>Sudah punya akun? </Text>
                <Link to="/login" style={{ color: '#0d9488', fontSize: 13, fontWeight: 600 }}>
                  Masuk di sini
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
