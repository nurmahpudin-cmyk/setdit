import { useEffect, useState } from 'react';
import {
  Table, Card, Button, Input, Tag, Modal, Form, message,
  Popconfirm, Typography, Select, Dropdown, Grid
} from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, MoreOutlined } from '@ant-design/icons';
import { permissionsApi, Permission } from '../../api/roles';

const { Title } = Typography;
const { useBreakpoint } = Grid;

export default function PermissionsPage() {
  const [data, setData] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [module, setModule] = useState('');
  const [modules, setModules] = useState<string[]>([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Permission | null>(null);
  const [form] = Form.useForm();
  const screens = useBreakpoint();

  const fetchData = async () => {
    setLoading(true);
    try {
      const [permRes, modRes] = await Promise.all([
        permissionsApi.getAll({ search, module }),
        permissionsApi.getModules(),
      ]);
      setData(permRes.data.data);
      setModules(modRes.data.data);
    } catch { message.error('Gagal memuat data'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, [search, module]);

  const handleSave = async (values: any) => {
    try {
      if (editing) {
        await permissionsApi.update(editing.id, values);
      } else {
        await permissionsApi.create(values);
      }
      message.success('Permission disimpan');
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
      await permissionsApi.delete(id);
      message.success('Permission dihapus');
      fetchData();
    } catch (err: any) {
      message.error(err.response?.data?.message || 'Gagal hapus');
    }
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const columns: any[] = [
    {
      title: 'Nama',
      dataIndex: 'name',
      key: 'name',
      ellipsis: true,
    },
    {
      title: 'Code',
      dataIndex: 'code',
      key: 'code',
      responsive: ['sm'],
      render: (c: string) => <Tag color="blue">{c}</Tag>,
    },
    {
      title: 'Module',
      dataIndex: 'module',
      key: 'module',
      responsive: ['md'],
      render: (m: string) => <Tag style={{ textTransform: 'capitalize' }}>{m}</Tag>,
    },
    {
      title: 'Action',
      dataIndex: 'action',
      key: 'action',
      responsive: ['lg'],
    },
    {
      title: 'Status',
      dataIndex: 'is_active',
      key: 'is_active',
      responsive: ['sm'],
      render: (v: boolean) => v ? <Tag color="green">Aktif</Tag> : <Tag>Nonaktif</Tag>,
    },
    {
      title: 'Aksi',
      key: 'action',
      width: screens.xs ? 100 : 120,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      render: (_: any, record: Permission) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const items: any[] = [
          { key: 'edit', label: 'Edit', icon: <EditOutlined />, onClick: () => {
            setEditing(record);
            form.setFieldsValue(record);
            setOpen(true);
          }},
          { key: 'delete', label: 'Hapus', icon: <DeleteOutlined />, danger: true, onClick: () => handleDelete(record.id) },
        ];

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
        <Title level={4} style={{ margin: 0 }}>Manajemen Permission</Title>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => { setEditing(null); form.resetFields(); setOpen(true); }}>
          Tambah Permission
        </Button>
      </div>

      <Card>
        <div style={{ marginBottom: 16, display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          <Input.Search placeholder="Cari..." onSearch={setSearch} allowClear />
          <Select allowClear placeholder="Filter module" style={{ width: 160 }}
            options={modules.map((m) => ({ label: m, value: m }))}
            onChange={(v) => setModule(v || '')} />
        </div>
        <Table dataSource={data} columns={columns} rowKey="id" loading={loading} scroll={{ x: 'max-content' }} />
      </Card>

      <Modal title={editing ? 'Edit Permission' : 'Tambah Permission'} open={open}
        onCancel={() => { setOpen(false); setEditing(null); form.resetFields(); }}
        onOk={() => form.submit()} width={480}>
        <Form form={form} layout="vertical" onFinish={handleSave}>
          <Form.Item name="name" label="Nama" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="code" label="Code" rules={[{ required: true }]}>
            <Input disabled={!!editing} placeholder="user.view" />
          </Form.Item>
          <div style={{ display: 'flex', gap: 16 }}>
            <Form.Item name="module" label="Module" rules={[{ required: true }]} style={{ flex: 1 }}>
              <Input placeholder="user" />
            </Form.Item>
            <Form.Item name="action" label="Action" rules={[{ required: true }]} style={{ flex: 1 }}>
              <Input placeholder="view" />
            </Form.Item>
          </div>
          <Form.Item name="description" label="Deskripsi">
            <Input.TextArea rows={2} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
