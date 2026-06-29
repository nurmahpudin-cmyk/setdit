import { useEffect, useState } from 'react';
import { Table, Card, Button, Input, Modal, Form, message, Typography, Dropdown, Grid, Select } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, MoreOutlined } from '@ant-design/icons';
import { positionsApi } from '../../api/settings';
import { rolesApi } from '../../api/roles';

const { Title } = Typography;
const { useBreakpoint } = Grid;

export default function PositionsPage() {
  const [data, setData] = useState<any[]>([]);
  const [roles, setRoles] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<any | null>(null);
  const [form] = Form.useForm();
  const screens = useBreakpoint();

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await positionsApi.getAll();
      setData(res.data.data);
    } catch { message.error('Gagal memuat'); }
    finally { setLoading(false); }
  };

  const fetchRoles = async () => {
    try {
      const res = await rolesApi.getAll();
      setRoles(res.data.data);
    } catch { /* ignore */ }
  };

  useEffect(() => { fetchData(); }, []);
  useEffect(() => { fetchRoles(); }, []);

  const handleSave = async (values: any) => {
    try {
      if (editing) await positionsApi.update(editing.id, values);
      else await positionsApi.create(values);
      message.success('Disimpan');
      setOpen(false);
      setEditing(null);
      form.resetFields();
      fetchData();
    } catch (err: any) { message.error(err.response?.data?.message || 'Gagal'); }
  };

  const handleDelete = async (id: number) => {
    try { await positionsApi.delete(id); message.success('Dihapus'); fetchData(); }
    catch (err: any) { message.error(err.response?.data?.message || 'Gagal'); }
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const columns: any[] = [
    { title: 'Nama', dataIndex: 'name', key: 'name', ellipsis: true },
    {
      title: 'Code',
      dataIndex: 'code',
      key: 'code',
      responsive: ['sm'],
      render: (c: string) => <code>{c}</code>,
    },
    {
      title: 'Role',
      dataIndex: 'role',
      key: 'role',
      responsive: ['md'],
      render: (r: any) => r?.name || '-',
    },
    {
      title: 'Users',
      dataIndex: '_count',
      key: 'users',
      responsive: ['sm'],
      render: (c: any) => c?.users || 0,
    },
    {
      title: 'Aksi',
      key: 'action',
      width: screens.xs ? 100 : 120,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      render: (_: any, r: any) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const items: any[] = [
          { key: 'edit', label: 'Edit', icon: <EditOutlined />, onClick: () => {
            setEditing(r);
            form.setFieldsValue({ ...r, role_id: r.role?.id });
            setOpen(true);
          }},
          { key: 'delete', label: 'Hapus', icon: <DeleteOutlined />, danger: true, onClick: () => handleDelete(r.id) },
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
        <Title level={4} style={{ margin: 0 }}>Jabatan</Title>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => { setEditing(null); form.resetFields(); setOpen(true); }}>Tambah</Button>
      </div>
      <Card><Table dataSource={data} columns={columns} rowKey="id" loading={loading} scroll={{ x: 'max-content' }} /></Card>
      <Modal title={editing ? 'Edit' : 'Tambah'} open={open} onCancel={() => { setOpen(false); setEditing(null); form.resetFields(); }} onOk={() => form.submit()}>
        <Form form={form} layout="vertical" onFinish={handleSave}>
          <Form.Item name="name" label="Nama" rules={[{ required: true }]}><Input /></Form.Item>
          <Form.Item name="code" label="Code" rules={[{ required: true }]}><Input disabled={!!editing} /></Form.Item>
          <Form.Item name="role_id" label="Role">
            <Select allowClear placeholder="Pilih role" options={roles.map((r) => ({ label: r.name, value: r.id }))} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
