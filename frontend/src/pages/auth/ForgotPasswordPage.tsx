import { useState, useEffect } from 'react';
import { Form, Input, Button, Card, message, Typography, Steps } from 'antd';
import { PhoneOutlined, LockOutlined, ArrowLeftOutlined, CheckCircleFilled, MessageOutlined } from '@ant-design/icons';
import { Link, useNavigate } from 'react-router-dom';
import { authApi } from '../../api/auth';
import { settingsApi, Settings } from '../../api/settings';

const { Title, Text, Paragraph } = Typography;

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const getLogoUrl = (logo: string | undefined) => {
  if (!logo) return undefined;
  if (logo.startsWith('http')) return logo;
  return `${API_URL.replace('/api', '')}${logo}`;
};

export default function ForgotPasswordPage() {
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [settings, setSettings] = useState<Settings | null>(null);
  const [userId, setUserId] = useState<number | null>(null);
  const [form] = Form.useForm();
  const [resetForm] = Form.useForm();
  const navigate = useNavigate();

  useEffect(() => {
    settingsApi.get().then(s => {
      setSettings(s);
      document.title = `Lupa Password - ${s.app_name}`;
    }).catch(() => {});
  }, []);

  const handleSendOTP = async (values: { phone: string }) => {
    setLoading(true);
    try {
      const res = await authApi.forgotPassword(values.phone);
      setUserId(res.data.data.user_id);
      setStep(1);
      message.success('Kode OTP telah dikirim via WhatsApp');
    } catch (err: any) {
      message.error(err.response?.data?.message || 'Gagal mengirim OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (values: { otp: string }) => {
    if (!userId) {
      console.log('[Frontend] No userId!');
      message.error('Session expired. Silakan ulangi dari awal.');
      setStep(0);
      return;
    }
    setLoading(true);
    try {
      // Clean OTP - remove any spaces or non-digits
      const cleanOtp = values.otp.replace(/\D/g, '');
      console.log(`[Frontend] Sending verify OTP: userId=${userId}, otp="${cleanOtp}"`);
      const result = await authApi.verifyOTP(userId, cleanOtp, 'FORGOT_PASSWORD');
      console.log(`[Frontend] Verify success:`, result.data);
      setStep(2);
    } catch (err: any) {
      console.log(`[Frontend] Verify error:`, err);
      message.error(err.response?.data?.message || 'Kode OTP tidak valid');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (values: { new_password: string; confirm_password: string }) => {
    if (!userId) return;
    if (values.new_password !== values.confirm_password) {
      message.error('Password tidak cocok');
      return;
    }
    setLoading(true);
    try {
      await authApi.resetPassword(userId, values.new_password);
      setStep(3);
    } catch (err: any) {
      message.error(err.response?.data?.message || 'Gagal reset password');
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
          maxWidth: 440,
          borderRadius: 16,
          boxShadow: '0 8px 32px rgba(0,0,0,0.15)',
        }}
        styles={{ body: { padding: '32px 24px' } }}
      >
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          {settings?.logo ? (
            <img
              src={getLogoUrl(settings.logo)}
              alt={settings.app_name}
              style={{ height: 48, maxWidth: '100%', marginBottom: 12, objectFit: 'contain' }}
            />
          ) : (
            <div
              style={{
                width: 48,
                height: 48,
                background: '#14b8a6',
                borderRadius: 12,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 12px',
                color: '#fff',
                fontWeight: 800,
                fontSize: 22,
              }}
            >
              {settings?.logo_initial || settings?.app_name?.charAt(0) || 'S'}
            </div>
          )}
          <Title level={4} style={{ margin: 0 }}>
            Reset Password
          </Title>
          <Text type="secondary">
            {step === 0 && 'Masukkan nomor HP untuk menerima kode OTP'}
            {step === 1 && 'Masukkan kode OTP yang telah dikirim'}
            {step === 2 && 'Buat password baru yang kuat'}
            {step === 3 && 'Password berhasil direset'}
          </Text>
        </div>

        <Steps
          current={step}
          size="small"
          style={{ marginBottom: 24 }}
          items={[
            { title: 'No. HP' },
            { title: 'Verifikasi' },
            { title: 'Password' },
            { title: 'Selesai' },
          ]}
        />

        {step === 0 && (
          <Form layout="vertical" onFinish={handleSendOTP} form={form} size="large">
            <Form.Item
              name="phone"
              rules={[
                { required: true, message: 'Nomor HP wajib diisi' },
                { min: 10, message: 'Minimal 10 digit' },
              ]}
            >
              <Input
                prefix={<PhoneOutlined style={{ color: '#14b8a6' }} />}
                placeholder="Nomor HP (08xxxxxxxxxx)"
              />
            </Form.Item>
            <Paragraph type="secondary" style={{ fontSize: 12, marginBottom: 16 }}>
              <MessageOutlined style={{ color: '#14b8a6' }} /> Kode OTP akan dikirim via WhatsApp
            </Paragraph>
            <Form.Item style={{ marginBottom: 0 }}>
              <Button
                type="primary"
                htmlType="submit"
                loading={loading}
                block
                style={{ background: '#14b8a6', borderColor: '#14b8a6', height: 44, fontWeight: 600 }}
              >
                Kirim Kode OTP
              </Button>
            </Form.Item>
          </Form>
        )}

        {step === 1 && (
          <Form layout="vertical" onFinish={handleVerifyOTP} size="large">
            <Paragraph type="secondary" style={{ textAlign: 'center', marginBottom: 16 }}>
              Kode OTP telah dikirim ke WhatsApp <strong>{form.getFieldValue('phone')}</strong>
            </Paragraph>
            <Form.Item
              name="otp"
              rules={[{ required: true, message: 'Kode OTP wajib diisi' }]}
            >
              <Input
                placeholder="Masukkan 6 digit OTP"
                maxLength={6}
                style={{ textAlign: 'center', fontFamily: 'monospace', fontSize: 18, letterSpacing: 8 }}
              />
            </Form.Item>
            <Form.Item style={{ marginBottom: 0 }}>
              <Button
                type="primary"
                htmlType="submit"
                loading={loading}
                block
                style={{ background: '#14b8a6', borderColor: '#14b8a6', height: 44, fontWeight: 600 }}
              >
                Verifikasi OTP
              </Button>
            </Form.Item>
          </Form>
        )}

        {step === 2 && (
          <Form layout="vertical" onFinish={handleResetPassword} form={resetForm} size="large">
            <Form.Item
              name="new_password"
              label="Password Baru"
              rules={[
                { required: true, message: 'Password wajib diisi' },
                { min: 8, message: 'Minimal 8 karakter' },
                { pattern: /^(?=.*[a-zA-Z])(?=.*[0-9])/, message: 'Harus mengandung huruf dan angka' },
              ]}
              hasFeedback
            >
              <Input.Password prefix={<LockOutlined />} placeholder="Password baru" />
            </Form.Item>
            <Form.Item
              name="confirm_password"
              label="Konfirmasi Password"
              dependencies={['new_password']}
              rules={[
                { required: true, message: 'Konfirmasi password wajib diisi' },
                ({ getFieldValue }) => ({
                  validator(_, value) {
                    if (!value || getFieldValue('new_password') === value) {
                      return Promise.resolve();
                    }
                    return Promise.reject(new Error('Password tidak cocok'));
                  },
                }),
              ]}
              hasFeedback
            >
              <Input.Password prefix={<LockOutlined />} placeholder="Konfirmasi password" />
            </Form.Item>
            <Form.Item style={{ marginBottom: 0 }}>
              <Button
                type="primary"
                htmlType="submit"
                loading={loading}
                block
                style={{ background: '#14b8a6', borderColor: '#14b8a6', height: 44, fontWeight: 600 }}
              >
                Reset Password
              </Button>
            </Form.Item>
          </Form>
        )}

        {step === 3 && (
          <div style={{ textAlign: 'center', padding: '16px 0' }}>
            <CheckCircleFilled style={{ fontSize: 64, color: '#52c41a', marginBottom: 16 }} />
            <Title level={4}>Berhasil!</Title>
            <Paragraph type="secondary">
              Password Anda berhasil direset. Silakan login dengan password baru.
            </Paragraph>
            <Button
              type="primary"
              onClick={() => navigate('/login')}
              style={{ background: '#14b8a6', borderColor: '#14b8a6', height: 44, fontWeight: 600 }}
              block
            >
              Kembali ke Login
            </Button>
          </div>
        )}

        <div style={{ textAlign: 'center', marginTop: 16 }}>
          {step < 3 ? (
            <Link to="/login" style={{ color: '#14b8a6' }}>
              <ArrowLeftOutlined /> Kembali ke Login
            </Link>
          ) : null}
        </div>
      </Card>
    </div>
  );
}
