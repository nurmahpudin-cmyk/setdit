import { useEffect, useState } from 'react';
import {
  Table, Card, Button, Input, Modal, Form, message,
  Typography, Tag, Select, TreeSelect, Dropdown, Grid
} from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, LockOutlined, MoreOutlined } from '@ant-design/icons';
import { menusApi, Menu } from '../../api/menus';
import { permissionsApi, Permission } from '../../api/roles';

const { useBreakpoint } = Grid;

export default function MenuPage() {
  const [data, setData] = useState<Menu[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [permOpen, setPermOpen] = useState(false);
  const [editing, setEditing] = useState<Menu | null>(null);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [selectedPerms, setSelectedPerms] = useState<number[]>([]);
  const [currentMenuId, setCurrentMenuId] = useState<number | null>(null);
  const [form] = Form.useForm();
  const screens = useBreakpoint();

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await menusApi.getAll();
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
        await menusApi.update(editing.id, values);
      } else {
        await menusApi.create(values);
      }
      message.success('Menu disimpan');
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
      await menusApi.delete(id);
      message.success('Menu dihapus');
      fetchData();
    } catch (err: any) {
      message.error(err.response?.data?.message || 'Gagal hapus');
    }
  };

  const openPermissions = async (menu: Menu) => {
    setCurrentMenuId(menu.id);
    setPermOpen(true);
    try {
      const res = await menusApi.getPermissions(menu.id);
      setSelectedPerms(res.data.data.map((p: Permission) => p.id));
    } catch {
      setSelectedPerms([]);
    }
  };

  const savePermissions = async () => {
    try {
      await menusApi.assignPermissions(currentMenuId!, selectedPerms);
      message.success('Permission disimpan');
      setPermOpen(false);
      fetchData();
    } catch { message.error('Gagal menyimpan permission'); }
  };

  // Tree data for parent_id selector (exclude self & descendants)
  const treeData = data
    .filter((m) => m.id !== editing?.id)
    .map((m) => ({ value: m.id, label: m.name, children: [] }));

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const columns: any[] = [
    {
      title: 'Nama',
      dataIndex: 'name',
      key: 'name',
      ellipsis: true,
      render: (name: string, r: Menu) => (
        <span style={{ fontWeight: r.parent_id ? 400 : 600 }}>
          {r.parent_id ? `    └─ ${name}` : name}
        </span>
      ),
    },
    {
      title: 'Path',
      dataIndex: 'path',
      key: 'path',
      ellipsis: true,
      responsive: ['md'],
      render: (p: string) => <Tag>{p || '-'}</Tag>,
    },
    {
      title: 'Module',
      dataIndex: 'module',
      key: 'module',
      responsive: ['lg'],
      render: (m: string) => <Tag color="blue">{m}</Tag>,
    },
    {
      title: 'Icon',
      dataIndex: 'icon',
      key: 'icon',
      responsive: ['xl'],
      render: (i: string) => i || '-',
    },
    {
      title: 'Order',
      dataIndex: 'order_num',
      key: 'order_num',
      width: 70,
      responsive: ['sm'],
    },
    {
      title: 'Sub',
      key: 'children',
      width: 60,
      responsive: ['md'],
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      render: (_: any, r: Menu) => r._count?.children || 0,
    },
    {
      title: 'Status',
      dataIndex: 'is_active',
      key: 'is_active',
      responsive: ['sm'],
      render: (v: boolean) => v ? <Tag color="green">Aktif</Tag> : <Tag color="red">Nonaktif</Tag>,
    },
    {
      title: 'Aksi',
      key: 'action',
      width: screens.xs ? 100 : 160,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      render: (_: any, record: Menu) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const items: any[] = [
          { key: 'perm', label: 'Permission', icon: <LockOutlined />, onClick: () => openPermissions(record) },
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

  // Group permissions by module
  const groupedPerms = permissions.reduce((acc, p) => {
    if (!acc[p.module]) acc[p.module] = [];
    acc[p.module].push(p);
    return acc;
  }, {} as Record<string, Permission[]>);

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
        <Typography.Title level={4} style={{ margin: 0 }}>Manajemen Menu</Typography.Title>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => { setEditing(null); form.resetFields(); setOpen(true); }}
        >
          Tambah Menu
        </Button>
      </div>

      <Card>
        <Table
          dataSource={data}
          columns={columns}
          rowKey="id"
          loading={loading}
          pagination={false}
          scroll={{ x: 'max-content' }}
        />
      </Card>

      {/* Create / Edit Modal */}
      <Modal
        title={editing ? 'Edit Menu' : 'Tambah Menu'}
        open={open}
        onCancel={() => { setOpen(false); setEditing(null); form.resetFields(); }}
        onOk={() => form.submit()}
        width={480}
      >
        <Form form={form} layout="vertical" onFinish={handleSave}>
          <Form.Item name="name" label="Nama Menu" rules={[{ required: true, message: 'Wajib diisi' }]}>
            <Input placeholder="Dashboard" />
          </Form.Item>
          <Form.Item name="path" label="Path URL" rules={[{ required: true, message: 'Wajib diisi' }]}>
            <Input placeholder="/dashboard" />
          </Form.Item>
          <Form.Item name="module" label="Module" initialValue="admin">
            <Select
              options={[
                { value: 'admin', label: 'Admin' },
                { value: 'app', label: 'Aplikasi' },
                { value: 'training', label: 'Training' },
                { value: 'report', label: 'Report' },
              ]}
            />
          </Form.Item>
          <Form.Item name="icon" label="Icon (Ant Design)">
            <Input placeholder="DashboardOutlined" />
          </Form.Item>
          <Form.Item name="order_num" label="Urutan" initialValue={0}>
            <Input type="number" min={0} />
          </Form.Item>
          <Form.Item name="parent_id" label="Menu Induk (opsional)">
            <TreeSelect
              allowClear
              treeData={treeData}
              placeholder="Pilih menu induk"
              treeDefaultExpandAll
            />
          </Form.Item>
          {editing && (
            <Form.Item name="is_active" label="Status">
              <Select
                options={[
                  { value: true, label: 'Aktif' },
                  { value: false, label: 'Nonaktif' },
                ]}
              />
            </Form.Item>
          )}
        </Form>
      </Modal>

      {/* Permission Assignment Modal */}
      <Modal
        title="Assign Permissions"
        open={permOpen}
        onCancel={() => setPermOpen(false)}
        onOk={savePermissions}
        width={600}
      >
        {Object.entries(groupedPerms).map(([module, perms]) => (
          <div key={module} style={{ marginBottom: 16 }}>
            <Typography.Title level={5} style={{ textTransform: 'capitalize' }}>{module}</Typography.Title>
            {perms.map((p) => (
              <div key={p.id} style={{ marginBottom: 4 }}>
                <label>
                  <input
                    type="checkbox"
                    checked={selectedPerms.includes(p.id)}
                    onChange={(e) => {
                      if (e.target.checked) setSelectedPerms([...selectedPerms, p.id]);
                      else setSelectedPerms(selectedPerms.filter((id) => id !== p.id));
                    }}
                    style={{ marginRight: 8 }}
                  />
                  {p.action} <Tag style={{ fontSize: 10 }}>{p.code}</Tag>
                </label>
              </div>
            ))}
          </div>
        ))}
      </Modal>
    </div>
  );
}
