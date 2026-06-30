import { useState, useEffect } from 'react';
import { Table, Button, Space, Input, Modal, Form, Select, message, Card, Popconfirm } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, SearchOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { kabkotaApi, Kabkota } from '../../api/kabkota';
import { provinsiApi, Provinsi } from '../../api/provinsi';

export default function KabkotaPage() {
  const [data, setData] = useState<Kabkota[]>([]);
  const [provinsiList, setProvinsiList] = useState<Provinsi[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchText, setSearchText] = useState('');
  const [form] = Form.useForm();

  useEffect(() => {
    fetchData();
    fetchProvinsi();
  }, []);

  const fetchProvinsi = async () => {
    try {
      const res = await provinsiApi.getAll();
      setProvinsiList(res.data.data);
    } catch { /* ignore */ }
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await kabkotaApi.getAll(searchText || undefined);
      setData(res.data.data);
    } catch {
      message.error('Gagal memuat data');
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = () => {
    setEditingId(null);
    form.resetFields();
    setModalVisible(true);
  };

  const handleEdit = (record: Kabkota) => {
    setEditingId(record.kabid);
    form.setFieldsValue({
      kabid: record.kabid,
      kabkota: record.kabkota,
      proid: record.proid,
      nama_walikota: record.nama_walikota,
      email: record.email,
    });
    setModalVisible(true);
  };

  const handleDelete = async (id: string) => {
    try {
      await kabkotaApi.delete(id);
      message.success('Berhasil dihapus');
      fetchData();
    } catch (error: any) {
      message.error(error?.response?.data?.message || 'Gagal menghapus');
    }
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      if (editingId) {
        await kabkotaApi.update(editingId, values);
        message.success('Berhasil diupdate');
      } else {
        await kabkotaApi.create(values);
        message.success('Berhasil dibuat');
      }
      setModalVisible(false);
      fetchData();
    } catch (error: any) {
      message.error(error?.response?.data?.message || 'Gagal menyimpan');
    }
  };

  const columns: ColumnsType<Kabkota> = [
    { title: 'ID', dataIndex: 'kabid', key: 'kabid', width: 80 },
    { title: 'Kabupaten/Kota', dataIndex: 'kabkota', key: 'kabkota' },
    { title: 'Provinsi ID', dataIndex: 'proid', key: 'proid', width: 100 },
    { title: 'Walikota', dataIndex: 'nama_walikota', key: 'nama_walikota', render: (t) => t || '-' },
    { title: 'Email', dataIndex: 'email', key: 'email', render: (t) => t || '-' },
    {
      title: 'Aksi', key: 'action', width: 120,
      render: (_, record) => (
        <Space>
          <Button type="link" icon={<EditOutlined />} onClick={() => handleEdit(record)} />
          <Popconfirm title="Hapus?" onConfirm={() => handleDelete(record.kabid)}>
            <Button type="link" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <Card
        title="Master Kabupaten/Kota"
        extra={<Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>Tambah</Button>}
      >
        <div style={{ marginBottom: 16 }}>
          <Input placeholder="Cari..." prefix={<SearchOutlined />} value={searchText}
            onChange={(e) => setSearchText(e.target.value)} onPressEnter={fetchData} style={{ width: 300 }} />
          <Button style={{ marginLeft: 8 }} onClick={fetchData}>Cari</Button>
        </div>
        <Table columns={columns} dataSource={data} rowKey="kabid" loading={loading}
          pagination={{ pageSize: 20, showSizeChanger: false }} />
      </Card>

      <Modal title={editingId ? 'Edit' : 'Tambah'} open={modalVisible} onOk={handleSubmit}
        onCancel={() => setModalVisible(false)} okText="Simpan" cancelText="Batal">
        <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item name="kabid" label="ID" rules={[{ required: true }]}>
            <Input disabled={!!editingId} />
          </Form.Item>
          <Form.Item name="kabkota" label="Nama Kabupaten/Kota" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="proid" label="Provinsi">
            <Select allowClear showSearch optionFilterProp="label"
              options={provinsiList.map(p => ({ label: p.provinsi, value: p.proid }))} />
          </Form.Item>
          <Form.Item name="nama_walikota" label="Nama Waltoni">
            <Input />
          </Form.Item>
          <Form.Item name="email" label="Email">
            <Input />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
