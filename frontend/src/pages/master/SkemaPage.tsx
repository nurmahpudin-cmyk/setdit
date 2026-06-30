import { useState, useEffect } from 'react';
import { Table, Button, Space, Input, Modal, Form, message, Card, Popconfirm } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, SearchOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { skemaApi, Skema } from '../../api/skema';

export default function SkemaPage() {
  const [data, setData] = useState<Skema[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [searchText, setSearchText] = useState('');
  const [form] = Form.useForm();

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await skemaApi.getAll(searchText || undefined);
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

  const handleEdit = (record: Skema) => {
    setEditingId(record.id_skema);
    form.setFieldsValue({ nama_skema: record.nama_skema });
    setModalVisible(true);
  };

  const handleDelete = async (id: number) => {
    try {
      await skemaApi.delete(id);
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
        await skemaApi.update(editingId, values);
        message.success('Berhasil diupdate');
      } else {
        await skemaApi.create(values);
        message.success('Berhasil dibuat');
      }
      setModalVisible(false);
      fetchData();
    } catch (error: any) {
      message.error(error?.response?.data?.message || 'Gagal menyimpan');
    }
  };

  const columns: ColumnsType<Skema> = [
    { title: 'ID', dataIndex: 'id_skema', key: 'id_skema', width: 80 },
    { title: 'Nama Skema', dataIndex: 'nama_skema', key: 'nama_skema' },
    {
      title: 'Aksi', key: 'action', width: 120,
      render: (_, record) => (
        <Space>
          <Button type="link" icon={<EditOutlined />} onClick={() => handleEdit(record)} />
          <Popconfirm title="Hapus?" onConfirm={() => handleDelete(record.id_skema)}>
            <Button type="link" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <Card
        title="Master Skema"
        extra={<Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>Tambah</Button>}
      >
        <div style={{ marginBottom: 16 }}>
          <Input placeholder="Cari..." prefix={<SearchOutlined />} value={searchText}
            onChange={(e) => setSearchText(e.target.value)} onPressEnd={fetchData} style={{ width: 300 }} />
          <Button style={{ marginLeft: 8 }} onClick={fetchData}>Cari</Button>
        </div>
        <Table columns={columns} dataSource={data} rowKey="id_skema" loading={loading}
          pagination={{ pageSize: 20, showSizeChanger: false }} />
      </Card>

      <Modal title={editingId ? 'Edit' : 'Tambah'} open={modalVisible} onOk={handleSubmit}
        onCancel={() => setModalVisible(false)} okText="Simpan" cancelText="Batal">
        <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item name="nama_skema" label="Nama Skema" rules={[{ required: true }]}>
            <Input placeholder="Contoh: HD" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
