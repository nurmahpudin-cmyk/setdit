import { useEffect, useState } from 'react';
import { Card, Table, Button, Tag, Modal, Input, message, Typography, Row, Col, Modal as ConfirmModal, Descriptions, QRCode, Dropdown, Grid } from 'antd';
import { PlusOutlined, DeleteOutlined, QrcodeOutlined, SendOutlined, ReloadOutlined, MoreOutlined } from '@ant-design/icons';
import { whatsappApi, WhatsAppSession, WhatsAppLog } from '../../api/whatsapp';

const { Title } = Typography;
const { useBreakpoint } = Grid;

export default function WhatsAppPage() {
  const [sessions, setSessions] = useState<WhatsAppSession[]>([]);
  const [logs, setLogs] = useState<WhatsAppLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [sessionsLoading, setSessionsLoading] = useState(false);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0 });
  const screens = useBreakpoint();

  const [qrModalVisible, setQrModalVisible] = useState(false);
  const [sendModalVisible, setSendModalVisible] = useState(false);
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);

  const [selectedSession, setSelectedSession] = useState<WhatsAppSession | null>(null);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [phone, setPhone] = useState('');
  const [messageText, setMessageText] = useState('');
  const [newSessionName, setNewSessionName] = useState('');
  const [sending, setSending] = useState(false);
  const [qrRefreshing, setQrRefreshing] = useState(false);

  useEffect(() => { fetchSessions(); fetchLogs(); }, []);

  const fetchSessions = async () => {
    setSessionsLoading(true);
    try {
      const res = await whatsappApi.getSessions();
      setSessions(res.data.data);
    } catch { message.error('Gagal memuat sesi WhatsApp'); }
    finally { setSessionsLoading(false); }
  };

  const fetchLogs = async (page = 1) => {
    setLoading(true);
    try {
      const res = await whatsappApi.getLogs({ page, limit: 20 });
      setLogs(res.data.data);
      setPagination(res.data.pagination);
    } catch { message.error('Gagal memuat log pesan'); }
    finally { setLoading(false); }
  };

  const handleCreateSession = async () => {
    if (!newSessionName.trim()) { message.error('Nama sesi wajib diisi'); return; }
    setLoading(true);
    try {
      await whatsappApi.createSession(newSessionName);
      message.success('Sesi dibuat. Silakan scan QR code.');
      setCreateModalVisible(false);
      setNewSessionName('');
      fetchSessions();
      const res = await whatsappApi.getSessions();
      const latest = res.data.data[0];
      if (latest) { setSelectedSession(latest); setQrModalVisible(true); refreshQR(latest.id); }
    } catch (err: any) { message.error(err.response?.data?.message || 'Gagal membuat sesi'); }
    finally { setLoading(false); }
  };

  const handleDeleteSession = async () => {
    if (!selectedSession) return;
    setLoading(true);
    try { await whatsappApi.deleteSession(selectedSession.id); message.success('Sesi dihapus'); setDeleteModalVisible(false); setSelectedSession(null); fetchSessions(); }
    catch { message.error('Gagal menghapus sesi'); }
    finally { setLoading(false); }
  };

  const refreshQR = async (sessionId: number) => {
    setQrRefreshing(true);
    try { const res = await whatsappApi.getQRCode(sessionId); setQrCode(res.data.data.qr_code); }
    catch (err: any) { message.error(err.response?.data?.message || 'QR tidak tersedia'); }
    finally { setQrRefreshing(false); }
  };

  const handleSendMessage = async () => {
    if (!selectedSession || !phone.trim() || !messageText.trim()) { message.error('Nomor HP dan pesan wajib diisi'); return; }
    setSending(true);
    try { await whatsappApi.sendMessage(selectedSession.id, phone, messageText); message.success('Pesan terkirim'); setSendModalVisible(false); setPhone(''); setMessageText(''); fetchLogs(); }
    catch (err: any) { message.error(err.response?.data?.message || 'Gagal mengirim pesan'); }
    finally { setSending(false); }
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sessionColumns: any[] = [
    { title: 'Nama', dataIndex: 'name', key: 'name', ellipsis: true },
    {
      title: 'Status',
      dataIndex: 'is_active',
      key: 'is_active',
      render: (active: boolean) => <Tag color={active ? 'green' : 'default'}>{active ? 'Terhubung' : 'Offline'}</Tag>,
    },
    {
      title: 'Terakhir Aktif',
      dataIndex: 'last_seen',
      key: 'last_seen',
      responsive: ['md'],
      render: (date: string | null) => date ? new Date(date).toLocaleString('id-ID') : '-',
    },
    {
      title: 'Aksi',
      key: 'action',
      width: screens.xs ? 100 : 140,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      render: (_: any, record: WhatsAppSession) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const items: any[] = [
          { key: 'qr', label: 'QR Code', icon: <QrcodeOutlined />, onClick: () => { setSelectedSession(record); setQrModalVisible(true); refreshQR(record.id); }},
          { key: 'send', label: 'Kirim Pesan', icon: <SendOutlined />, disabled: !record.is_active, onClick: () => openSendModal(record) },
          { key: 'delete', label: 'Hapus', icon: <DeleteOutlined />, danger: true, onClick: () => openDeleteModal(record) },
        ];
        return (
          <Dropdown menu={{ items }} trigger={['click']}>
            <Button size="small" icon={<MoreOutlined />}>Aksi</Button>
          </Dropdown>
        );
      },
    },
  ];

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const logColumns: any[] = [
    {
      title: 'Waktu',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 150,
      render: (date: string) => new Date(date).toLocaleString('id-ID'),
    },
    {
      title: 'Sesi',
      dataIndex: ['session', 'name'],
      key: 'session',
      responsive: ['md'],
    },
    {
      title: 'Nomor',
      dataIndex: 'phone',
      key: 'phone',
      responsive: ['sm'],
    },
    {
      title: 'Pesan',
      dataIndex: 'message',
      key: 'message',
      ellipsis: true,
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        const colors: Record<string, string> = { PENDING: 'orange', SENT: 'blue', DELIVERED: 'green', READ: 'green', FAILED: 'red' };
        const labels: Record<string, string> = { PENDING: 'Menunggu', SENT: 'Terkirim', DELIVERED: 'Diterima', READ: 'Dibaca', FAILED: 'Gagal' };
        return <Tag color={colors[status]}>{labels[status] || status}</Tag>;
      },
    },
  ];

  const openSendModal = (session: WhatsAppSession) => {
    if (!session.is_active) { message.warning('Sesi belum terhubung.'); return; }
    setSelectedSession(session);
    setSendModalVisible(true);
  };

  const openDeleteModal = (session: WhatsAppSession) => { setSelectedSession(session); setDeleteModalVisible(true); };

  return (
    <div>
      <Title level={4} style={{ marginBottom: 24 }}>WhatsApp Gateway</Title>

      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={24}>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setCreateModalVisible(true)}>Tambah Perangkat</Button>
        </Col>
      </Row>

      <Card title="Perangkat WhatsApp" style={{ marginBottom: 24 }}>
        <Table columns={sessionColumns} dataSource={sessions} rowKey="id" loading={sessionsLoading} pagination={false} scroll={{ x: 'max-content' }} />
      </Card>

      <Card title="Log Pesan">
        <Table
          columns={logColumns}
          dataSource={logs}
          rowKey="id"
          loading={loading}
          scroll={{ x: 'max-content' }}
          pagination={{ current: pagination.page, pageSize: pagination.limit, total: pagination.total, onChange: (page) => fetchLogs(page), showSizeChanger: false }}
        />
      </Card>

      <Modal title="Tambah Perangkat WhatsApp" open={createModalVisible} onCancel={() => setCreateModalVisible(false)} onOk={handleCreateSession} confirmLoading={loading}>
        <Input placeholder="Nama perangkat" value={newSessionName} onChange={(e) => setNewSessionName(e.target.value)} style={{ marginTop: 8 }} />
      </Modal>

      <Modal
        title={`Scan QR Code - ${selectedSession?.name}`}
        open={qrModalVisible}
        onCancel={() => setQrModalVisible(false)}
        footer={[<Button key="refresh" icon={<ReloadOutlined spin={qrRefreshing} />} onClick={() => selectedSession && refreshQR(selectedSession.id)}>Refresh QR</Button>]}
      >
        <div style={{ textAlign: 'center', padding: '20px 0' }}>
          {qrCode ? <img src={qrCode} alt="QR" style={{ maxWidth: '100%', borderRadius: 8 }} /> : qrRefreshing ? <p>Memuat...</p> : <p>QR belum tersedia.</p>}
        </div>
        <Descriptions column={1}>
          <Descriptions.Item label="Nama">{selectedSession?.name}</Descriptions.Item>
          <Descriptions.Item label="Status"><Tag color={selectedSession?.is_active ? 'green' : 'default'}>{selectedSession?.is_active ? 'Terhubung' : 'Offline'}</Tag></Descriptions.Item>
        </Descriptions>
      </Modal>

      <Modal title="Kirim Pesan WhatsApp" open={sendModalVisible} onCancel={() => setSendModalVisible(false)} onOk={handleSendMessage} confirmLoading={sending}>
        <p>Dari: <strong>{selectedSession?.name}</strong></p>
        <Input placeholder="Nomor HP" value={phone} onChange={(e) => setPhone(e.target.value)} style={{ marginBottom: 12, marginTop: 8 }} />
        <Input.TextArea placeholder="Isi pesan" value={messageText} onChange={(e) => setMessageText(e.target.value)} rows={4} />
      </Modal>

      <ConfirmModal title="Hapus Perangkat" open={deleteModalVisible} onCancel={() => setDeleteModalVisible(false)} onOk={handleDeleteSession} confirmLoading={loading} okText="Hapus" okButtonProps={{ danger: true }}>
        <p>Yakin hapus <strong>{selectedSession?.name}</strong>?</p>
        <p style={{ color: '#ff4d4f' }}>Semua log juga akan dihapus.</p>
      </ConfirmModal>
    </div>
  );
}
