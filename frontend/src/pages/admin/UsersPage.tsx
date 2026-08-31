import { useEffect, useState } from 'react';
import {
  Table, Card, Button, Input, Tag, Modal, Form, Select, message,
  Typography, Grid, Dropdown, Tabs, Space, Badge, Descriptions
} from 'antd';
import {
  PlusOutlined, EditOutlined, DeleteOutlined, CheckCircleOutlined,
  MoreOutlined, CheckOutlined, CloseOutlined, EyeOutlined
} from '@ant-design/icons';
import { usersApi, User } from '../../api/users';
import { rolesApi } from '../../api/roles';
import { unitsApi, positionsApi } from '../../api/settings';

const { useBreakpoint } = Grid;

const { Title } = Typography;

const statusColors: Record<string, string> = {
  PENDING: 'orange',
  VERIFIED: 'blue',
  ACTIVE: 'green',
  INACTIVE: 'red',
  REJECTED: 'default',
};

const JABATAN_OPTIONS = [
  { label: 'TU Setditjen', value: 'TU_SETDITJEN' },
  { label: 'Kasubbag TU', value: 'KASUBBAG_TU' },
  { label: 'Setditjen PS', value: 'SEKDITJEN_PS' },
  { label: 'Kabag PEHK', value: 'KABAG_PEHKT' },
  { label: 'Ketua Pokja Hukum', value: 'KETUA_POKJA_HUKUM' },
  { label: 'Anggota Pokja Hukum', value: 'ANGGOTA_POKJA_HUKUM' },
  { label: 'Dirjen PS', value: 'DIRJEN_PS' },
];

export default function UsersPage() {
  const [data, setData] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0 });
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [pendingCount, setPendingCount] = useState(0);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<User | null>(null);
  const [roles, setRoles] = useState<any[]>([]);
  const [units, setUnits] = useState<any[]>([]);
  const [positions, setPositions] = useState<any[]>([]);
  const [reviewUser, setReviewUser] = useState<User | null>(null);
  const [reviewPositionId, setReviewPositionId] = useState<number | undefined>();
  const [reviewSaving, setReviewSaving] = useState(false);
  const [rejectUser, setRejectUser] = useState<User | null>(null);
  const [rejectNotes, setRejectNotes] = useState('');
  const [rejectSaving, setRejectSaving] = useState(false);
  const [form] = Form.useForm();
  const screens = useBreakpoint();

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await usersApi.getAll({ page: pagination.page, limit: pagination.limit, search, status: statusFilter || undefined });
      setData(res.data.data);
      setPagination((p) => ({ ...p, total: res.data.pagination.total }));
      if (statusFilter === 'PENDING') setPendingCount(res.data.pagination.total);
    } catch { message.error('Gagal memuat data'); }
    finally { setLoading(false); }
  };

  const fetchPendingCount = async () => {
    try {
      const res = await usersApi.getAll({ page: 1, limit: 1, status: 'PENDING' });
      setPendingCount(res.data.pagination.total);
    } catch { /* ignore */ }
  };

  const fetchMeta = async () => {
    const [r, u, p] = await Promise.all([
      rolesApi.getAll().catch(() => ({ data: { data: [] } })),
      unitsApi.getAll().catch(() => ({ data: { data: [] } })),
      positionsApi.getAll().catch(() => ({ data: { data: [] } })),
    ]);
    setRoles(r.data.data);
    setUnits(u.data.data);
    setPositions(p.data.data);
  };

  useEffect(() => { fetchData(); }, [pagination.page, search, statusFilter]);
  useEffect(() => { fetchMeta(); fetchPendingCount(); }, []);

  const handleSave = async (values: any) => {
    try {
      if (editing) {
        await usersApi.update(editing.id, values);
        message.success('User diupdate');
      } else {
        await usersApi.create(values);
        message.success('User dibuat');
      }
      setOpen(false);
      setEditing(null);
      form.resetFields();
      fetchData();
    } catch (err: any) {
      message.error(err.response?.data?.message || 'Gagal menyimpan');
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await usersApi.delete(id);
      message.success('User dihapus');
      fetchData();
    } catch { message.error('Gagal hapus'); }
  };

  const handleReviewOpen = (record: User) => {
    setReviewUser(record);
    setReviewPositionId(record.position?.id);
  };

  const handleConfirmApprove = async () => {
    if (!reviewUser) return;
    setReviewSaving(true);
    try {
      await usersApi.approve(reviewUser.id, 'APPROVED', undefined, reviewPositionId);
      message.success('User disetujui');
      setReviewUser(null);
      fetchData();
      fetchPendingCount();
    } catch (err: any) {
      message.error(err.response?.data?.message || 'Gagal menyetujui');
    } finally {
      setReviewSaving(false);
    }
  };

  const handleRejectOpen = (record: User) => {
    setRejectUser(record);
    setRejectNotes('');
  };

  const handleConfirmReject = async () => {
    if (!rejectUser) return;
    setRejectSaving(true);
    try {
      await usersApi.approve(rejectUser.id, 'REJECTED', rejectNotes);
      message.success('User ditolak');
      setRejectUser(null);
      setRejectNotes('');
      fetchData();
      fetchPendingCount();
    } catch (err: any) {
      message.error(err.response?.data?.message || 'Gagal menolak');
    } finally {
      setRejectSaving(false);
    }
  };

  const handleActivate = async (id: number) => {
    try {
      await usersApi.activate(id);
      message.success('User diaktifkan');
      fetchData();
    } catch { message.error('Gagal aktivasi'); }
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const columns: any[] = [
    {
      title: 'Nama',
      dataIndex: 'fullname',
      key: 'fullname',
      ellipsis: true,
      responsive: ['sm'],
    },
    {
      title: 'Username',
      dataIndex: 'username',
      key: 'username',
      ellipsis: true,
      responsive: ['md'],
    },
    {
      title: 'Email',
      dataIndex: 'email',
      key: 'email',
      ellipsis: true,
      responsive: ['lg'],
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (s: string) => <Tag color={statusColors[s]}>{s}</Tag>,
    },
    {
      title: 'Unit',
      dataIndex: 'unit',
      key: 'unit',
      render: (u: any) => u?.name || '-',
      responsive: ['xl'],
    },
    {
      title: 'Role',
      dataIndex: 'roles',
      key: 'roles',
      responsive: ['lg'],
      render: (r: any[]) => r?.map((ur) => (
        <Tag key={ur.role.id}>{ur.role.name}</Tag>
      )),
    },
    {
      title: 'Kode Jabatan',
      dataIndex: 'jabatan_codes',
      key: 'jabatan_codes',
      responsive: ['lg'],
      render: (codes: string[]) => codes?.map((code) => (
        <Tag key={code} color="blue">{code}</Tag>
      )),
    },
    {
      title: 'Aksi',
      key: 'action',
      width: screens.xs ? 150 : 200,
      render: (_: any, record: User) => {
        // Pending users get direct review/reject buttons
        if (record.status === 'PENDING') {
          return (
            <Space size={4}>
              <Button size="small" type="primary" icon={<EyeOutlined />} onClick={() => handleReviewOpen(record)}>
                Review
              </Button>
              <Button size="small" danger icon={<CloseOutlined />} onClick={() => handleRejectOpen(record)}>
                Tolak
              </Button>
            </Space>
          );
        }

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const items: any[] = [
          { key: 'edit', label: 'Edit', icon: <EditOutlined />, onClick: () => {
            setEditing(record);
            // Get jabatan_code from assignments
            const jabatan_code = record.jabatan_codes?.[0];
            form.setFieldsValue({
              ...record,
              role_ids: record.roles?.map((r: any) => r.role.id),
              jabatan_code
            });
            setOpen(true);
          }},
          { key: 'delete', label: 'Hapus', icon: <DeleteOutlined />, danger: true, onClick: () => handleDelete(record.id) },
        ];

        if (record.status === 'INACTIVE') {
          items.unshift({ key: 'activate', label: 'Aktifkan', icon: <CheckCircleOutlined />, onClick: () => handleActivate(record.id) });
        }

        return (
          <Dropdown menu={{ items }} trigger={['click']}>
            <Button size="small" icon={<MoreOutlined />}>Aksi</Button>
          </Dropdown>
        );
      },
    },
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
        <Title level={4} style={{ margin: 0 }}>Manajemen Pengguna</Title>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => { setEditing(null); form.resetFields(); setOpen(true); }}>
          Tambah User
        </Button>
      </div>

      <Card>
        <Tabs
          activeKey={statusFilter}
          onChange={(key) => { setStatusFilter(key); setPagination((p) => ({ ...p, page: 1 })); }}
          items={[
            { key: '', label: 'Semua' },
            {
              key: 'PENDING',
              label: (
                <Badge count={pendingCount} size="small" offset={[8, 0]}>
                  <span style={{ paddingRight: 4 }}>Menunggu Persetujuan</span>
                </Badge>
              ),
            },
            { key: 'ACTIVE', label: 'Aktif' },
            { key: 'REJECTED', label: 'Ditolak' },
            { key: 'INACTIVE', label: 'Nonaktif' },
          ]}
        />
        <Input.Search
          placeholder="Cari nama, username, email..."
          style={{ width: 300, marginBottom: 16 }}
          onSearch={(v) => { setSearch(v); setPagination((p) => ({ ...p, page: 1 })); }}
          allowClear
        />
        <Table
          dataSource={data}
          columns={columns}
          rowKey="id"
          loading={loading}
          scroll={{ x: 'max-content' }}
          pagination={{
            current: pagination.page,
            pageSize: pagination.limit,
            total: pagination.total,
            showSizeChanger: true,
            showTotal: (t) => `Total ${t} data`,
            onChange: (p, s) => setPagination((prev) => ({ ...prev, page: p, limit: s || 10 })),
          }}
        />
      </Card>

      <Modal
        title={editing ? 'Edit User' : 'Tambah User'}
        open={open}
        onCancel={() => { setOpen(false); setEditing(null); form.resetFields(); }}
        onOk={() => form.submit()}
        width={560}
      >
        <Form form={form} layout="vertical" onFinish={handleSave}>
          <Form.Item name="fullname" label="Nama Lengkap" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="username" label="Username" rules={[{ required: true }]}>
            <Input disabled={!!editing} />
          </Form.Item>
          <Form.Item name="email" label="Email" rules={[{ required: true, type: 'email' }]}>
            <Input />
          </Form.Item>
          <Form.Item name="phone" label="Telepon" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          {!editing && (
            <Form.Item name="password" label="Password" rules={[{ required: true, min: 8 }]}>
              <Input.Password />
            </Form.Item>
          )}
          <Form.Item name="unit_id" label="Unit Kerja">
            <Select allowClear options={units.map((u) => ({ label: u.name, value: u.id }))} />
          </Form.Item>
          <Form.Item name="jabatan_code" label="Kode Jabatan">
            <Select allowClear options={JABATAN_OPTIONS} placeholder="Pilih Jabatan" />
          </Form.Item>
          <Form.Item name="role_ids" label="Role">
            <Select mode="multiple" options={roles.map((r) => ({ label: r.name, value: r.id }))} />
          </Form.Item>
        </Form>
      </Modal>

      {/* Review / Approve Modal */}
      <Modal
        title="Review Pendaftaran User"
        open={!!reviewUser}
        onCancel={() => setReviewUser(null)}
        onOk={handleConfirmApprove}
        okText="Setujui"
        okButtonProps={{ icon: <CheckOutlined />, loading: reviewSaving }}
        width={520}
      >
        {reviewUser && (
          <Space direction="vertical" size={16} style={{ width: '100%' }}>
            <Descriptions
              column={1}
              size="small"
              bordered
              items={[
                { key: 'fullname', label: 'Nama Lengkap', children: reviewUser.fullname },
                { key: 'username', label: 'Username', children: reviewUser.username },
                { key: 'email', label: 'Email', children: reviewUser.email },
                { key: 'phone', label: 'No. HP', children: reviewUser.phone },
              ]}
            />
            <div>
              <Typography.Text strong>Posisi / Jabatan</Typography.Text>
              <div style={{ marginTop: 4, color: '#94a3b8', fontSize: 12 }}>
                Klik untuk memindahkan posisi jika user salah memilih.
              </div>
              <Select
                style={{ width: '100%', marginTop: 8 }}
                value={reviewPositionId}
                onChange={(v) => setReviewPositionId(v)}
                options={positions.map((p) => ({ label: p.name, value: p.id }))}
                showSearch
                optionFilterProp="label"
                placeholder="Pilih posisi"
              />
            </div>
          </Space>
        )}
      </Modal>

      {/* Reject Modal */}
      <Modal
        title="Tolak Pendaftaran"
        open={!!rejectUser}
        onCancel={() => setRejectUser(null)}
        onOk={handleConfirmReject}
        okText="Tolak"
        okButtonProps={{ danger: true, loading: rejectSaving }}
        width={480}
      >
        <Space direction="vertical" size={12} style={{ width: '100%' }}>
          <Typography.Text>
            Tolak pendaftaran <strong>{rejectUser?.fullname}</strong>?
          </Typography.Text>
          <Input.TextArea
            rows={3}
            placeholder="Alasan penolakan (opsional, akan dikirim via WhatsApp)"
            value={rejectNotes}
            onChange={(e) => setRejectNotes(e.target.value)}
          />
        </Space>
      </Modal>
    </div>
  );
}