import { useEffect, useState } from 'react';
import { Card, Form, Input, Button, message, Typography, Row, Col, Grid, Upload } from 'antd';
import { SaveOutlined, UploadOutlined } from '@ant-design/icons';
import { settingsApi, Settings } from '../../api/settings';

const { Title } = Typography;
const { useBreakpoint } = Grid;
const Dragger = Upload.Dragger;

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export default function SettingsPage() {
  const [data, setData] = useState<Settings | null>(null);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [logoPreview, setLogoPreview] = useState<string>('');
  const [form] = Form.useForm();
  const screens = useBreakpoint();

  useEffect(() => {
    settingsApi.get().then((s) => {
      setData(s);
      form.setFieldsValue(s);
      if (s.logo) {
        setLogoPreview(s.logo.startsWith('http') ? s.logo : `${API_URL.replace('/api', '')}${s.logo}`);
      }
    }).catch(() => message.error('Gagal memuat settings'));
  }, []);

  const handleSave = async (values: any) => {
    setLoading(true);
    try {
      const res = await settingsApi.update(values);
      setData(res.data.data);
      form.setFieldsValue(res.data.data);
      settingsApi.clearCache();
      message.success('Pengaturan disimpan');
    } catch { message.error('Gagal menyimpan'); }
    finally { setLoading(false); }
  };

  const handleLogoUpload = async (file: File) => {
    setUploading(true);
    const formData = new FormData();
    formData.append('logo', file);

    try {
      const res = await fetch(`${API_URL}/settings/upload-logo`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
        },
        body: formData,
      });

      if (!res.ok) throw new Error('Upload gagal');

      const result = await res.json();
      const newLogo = result.data.logo;
      setLogoPreview(`${API_URL.replace('/api', '')}${newLogo}`);
      form.setFieldsValue({ logo: newLogo });
      setData((prev: any) => ({ ...prev, logo: newLogo }));
      message.success('Logo berhasil diupload');
    } catch (err: any) {
      message.error(err.message || 'Gagal upload logo');
    } finally {
      setUploading(false);
    }

    return false; // Prevent default upload
  };

  const colSpan = screens.sm ? 12 : 24;

  return (
    <div>
      <Title level={4} style={{ marginBottom: 24 }}>Pengaturan Aplikasi</Title>
      <Card>
        <Form form={form} layout="vertical" onFinish={handleSave}>
          {/* Logo Upload Section */}
          <div style={{ marginBottom: 24 }}>
            <Row gutter={[16, 16]} align="middle">
              <Col>
                {logoPreview ? (
                  <div style={{ textAlign: 'center' }}>
                    <img
                      src={logoPreview}
                      alt="Logo"
                      style={{ maxWidth: 120, maxHeight: 120, borderRadius: 8, objectFit: 'contain' }}
                    />
                    <div style={{ marginTop: 8 }}>
                      <Button size="small" onClick={() => {
                        setLogoPreview('');
                        form.setFieldsValue({ logo: '' });
                      }}>Hapus</Button>
                    </div>
                  </div>
                ) : (
                  <Dragger
                    accept="image/*"
                    showUploadList={false}
                    beforeUpload={handleLogoUpload}
                    disabled={uploading}
                    style={{ width: 200, height: 120 }}
                  >
                    <p className="ant-upload-drag-icon"><UploadOutlined /></p>
                    <p className="ant-upload-text">Klik atau drag logo</p>
                    <p className="ant-upload-hint">PNG, JPG, GIF, WEBP (max 2MB)</p>
                  </Dragger>
                )}
              </Col>
              <Col flex="auto">
                <Form.Item name="logo" label="URL Logo" style={{ marginBottom: 8 }}>
                  <Input placeholder="atau paste URL logo" />
                </Form.Item>
                <Form.Item name="logo_initial" label="Inisial Logo (1 Karakter)" style={{ marginBottom: 0 }}>
                  <Input maxLength={1} placeholder="S" style={{ width: 60, textAlign: 'center', fontSize: 24, fontWeight: 'bold' }} />
                </Form.Item>
              </Col>
            </Row>
          </div>

          <Row gutter={screens.xs ? 8 : 16}>
            <Col span={colSpan}>
              <Form.Item name="app_name" label="Nama Aplikasi (Singkat)">
                <Input />
              </Form.Item>
            </Col>
            <Col span={colSpan}>
              <Form.Item name="app_fullname" label="Nama Aplikasi (Lengkap)">
                <Input />
              </Form.Item>
            </Col>
            <Col span={colSpan}>
              <Form.Item name="tagline" label="Tagline">
                <Input />
              </Form.Item>
            </Col>
            <Col span={colSpan}>
              <Form.Item name="email" label="Email">
                <Input />
              </Form.Item>
            </Col>
            <Col span={colSpan}>
              <Form.Item name="phone" label="Telepon">
                <Input />
              </Form.Item>
            </Col>
            <Col span={24}>
              <Form.Item name="description" label="Deskripsi">
                <Input.TextArea rows={3} />
              </Form.Item>
            </Col>
            <Col span={24}>
              <Form.Item name="address" label="Alamat">
                <Input.TextArea rows={2} />
              </Form.Item>
            </Col>
          </Row>
          <Button type="primary" htmlType="submit" loading={loading} icon={<SaveOutlined />}>
            Simpan
          </Button>
        </Form>
      </Card>
    </div>
  );
}
