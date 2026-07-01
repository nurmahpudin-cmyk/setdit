import { useEffect, useState, useCallback } from 'react';
import {
  Table, Card, Button, Input, Tag, Modal, Form, message,
  Popconfirm, Typography, Checkbox, Dropdown, Grid
} from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, LockOutlined, MoreOutlined } from '@ant-design/icons';
import { rolesApi, permissionsApi, Role, Permission } from '../../api/roles';

const { Title } = Typography;
const { useBreakpoint } = Grid;

export default function RolesPage() {
  const [data, setData] = useState<Role[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [permOpen, setPermOpen] = useState(false);
  const [editing, setEditing] = useState<Role | null>(null);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [selectedPerms, setSelectedPerms] = useState<number[]>([]);
  const [currentRoleId, setCurrentRoleId] = useState<number | null>(null);
  const [form] = Form.useForm();
  const screens = useBreakpoint();

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await rolesApi.getAll();
      setData(res.data.data);
    } catch { message.error('Gagal memuat data'); }
    finally { setLoading(false); }
  };

  const fetchPermissions = async () => {
    try {
      const res = await permissionsApi.getAll();
      setPermissions(res.data.data);
    } catch { /* ignore */ }
  };

  useEffect(() => { fetchData(); }, []);
  useEffect(() => { fetchPermissions(); }, []);

  const handleSave = async (values: any) => {
    try {
      if (editing) {
        await rolesApi.update(editing.id, values);
      } else {
        await rolesApi.create(values);
      }
      message.success('Role disimpan');
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
      await rolesApi.delete(id);
      message.success('Role dihapus');
      fetchData();
    } catch (err: any) {
      message.error(err.response?.data?.message || 'Gagal hapus');
    }
  };

  const openPermissions = async (role: Role) => {
    setCurrentRoleId(role.id);
    try {
      const res = await rolesApi.getPermissions(role.id);
      setSelectedPerms(res.data.data.map((p: Permission) => p.id));
    } catch {
      setSelectedPerms([]);
    }
    setPermOpen(true);
  };

  const togglePermission = useCallback((permId: number) => {
    setSelectedPerms(prev => {
      if (prev.includes(permId)) {
        return prev.filter(id => id !== permId);
      } else {
        return [...prev, permId];
      }
    });
  }, []);

  const savePermissions = async () => {
    try {
      await rolesApi.assignPermissions(currentRoleId!, selectedPerms);
      message.success('Permission disimpan');
      setPermOpen(false);
      fetchData();
    } catch { message.error('Gagal menyimpan permission'); }
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
      responsive: ['md'],
      render: (c: string) => <Tag>{c}</Tag>,
    },
    {
      title: 'Deskripsi',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true,
      responsive: ['lg'],
    },
    {
      title: 'Super Admin',
      dataIndex: 'is_super_admin',
      key: 'is_super_admin',
      responsive: ['sm'],
      render: (v: boolean) => v ? <Tag color="gold">Ya</Tag> : <Tag>Tidak</Tag>,
    },
    {
      title: 'Users',
      dataIndex: '_count',
      key: 'users',
      responsive: ['md'],
      render: (c: any) => c?.users || 0,
    },
    {
      title: 'Permission',
      dataIndex: '_count',
      key: 'perms',
      responsive: ['lg'],
      render: (c: any) => c?.permissions || 0,
    },
    {
      title: 'Aksi',
      key: 'action',
      width: screens.xs ? 100 : 160,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      render: (_: any, record: Role) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const items: any[] = [
          { key: 'perm', label: `Permission (${record._count?.permissions || 0})`, icon: <LockOutlined />, onClick: () => openPermissions(record) },
        ];

        if (!record.is_super_admin) {
          items.push(
            { key: 'edit', label: 'Edit', icon: <EditOutlined />, onClick: () => {
              setEditing(record);
              form.setFieldsValue(record);
              setOpen(true);
            }},
            { key: 'delete', label: 'Hapus', icon: <DeleteOutlined />, danger: true, onClick: () => handleDelete(record.id) }
          );
        }

        return (
          <Dropdown menu={{ items }} trigger={['click']}>
            <Button size="small" icon={<MoreOutlined />}>Aksi</Button>
          </Dropdown>
        );
      },
    },
  ];

  // Group permissions by module
  const groupedPerms = permissions.reduce((acc, p) => {
    if (!acc[p.module]) acc[p.module] = [];
    acc[p.module].push(p);
    return acc;
  }, {} as Record<string, Permission[]>);

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
        <Title level={4} style={{ margin: 0 }}>Manajemen Role</Title>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => { setEditing(null); form.resetFields(); setOpen(true); }}>
          Tambah Role
        </Button>
      </div>

      <Card>
        <Table dataSource={data} columns={columns} rowKey="id" loading={loading} scroll={{ x: 'max-content' }} />
      </Card>

      <Modal title={editing ? 'Edit Role' : 'Tambah Role'} open={open}
        onCancel={() => { setOpen(false); setEditing(null); form.resetFields(); }}
        onOk={() => form.submit()} width={400}>
        <Form form={form} layout="vertical" onFinish={handleSave}>
          <Form.Item name="name" label="Nama" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="code" label="Code" rules={[{ required: true }]}>
            <Input disabled={!!editing} placeholder="SUPER_ADMIN" />
          </Form.Item>
          <Form.Item name="description" label="Deskripsi">
            <Input.TextArea rows={2} />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="Assign Permissions"
        open={permOpen}
        onCancel={() => setPermOpen(false)}
        onOk={savePermissions}
        width={600}
      >
        {Object.entries(groupedPerms).map(([module, perms]) => (
          <div key={module} style={{ marginBottom: 16 }}>
            <Title level={5} style={{ textTransform: 'capitalize' }}>{module}</Title>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {perms.map((p) => (
                <Checkbox
                  key={p.id}
                  checked={selectedPerms.includes(p.id)}
                  onChange={() => togglePermission(p.id)}
                >
                  {p.action} <Tag style={{ fontSize: 10 }}>{p.code}</Tag>
                </Checkbox>
              ))}
            </div>
          </div>
        ))}
      </Modal>
    </div>
  );
}
