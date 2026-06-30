import { useState, useEffect } from 'react';
import { Table, Button, Space, Input, Modal, Form, Select, message, Card, Popconfirm } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, SearchOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { provinsiApi, Provinsi } from '../../api/provinsi';

export default function ProvinsiPage() {
  const [data, setData] = useState<Provinsi[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchText, setSearchText] = useState('');
  const [form] = Form.useForm();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await provinsiApi.getAll(searchText || undefined);
      setData(res.data.data);
    } catch (error: any) {
      message.error('Gagal memuat data provinsi');
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = () => {
    setEditingId(null);
    form.resetFields();
    setModalVisible(true);
  };

  const handleEdit = (record: Provinsi) => {
    setEditingId(record.proid);
    form.setFieldsValue({
      proid: record.proid,
      provinsi: record.provinsi,
      nama_gubern: record.nama_gubern,
      email: record.email,
      wilayah: record.wilayah,
      nama_dinas: record.nama_dinas,
    });
    setModalVisible(true);
  };

  const handleDelete = async (id: string) => {
    try {
      await provinsiApi.delete(id);
      message.success('Provinsi berhasil dihapus');
      fetchData();
    } catch (error: any) {
      message.error(error?.response?.data?.message || 'Gagal menghapus provinsi');
    }
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      if (editingId) {
        await provinsiApi.update(editingId, values);
        message.success('Provinsi berhasil diupdate');
      } else {
        await provinsiApi.create(values);
        message.success('Provinsi berhasil dibuat');
      }
      setModalVisible(false);
      fetchData();
    } catch (error: any) {
      message.error(error?.response?.data?.message || 'Gagal menyimpan');
    }
  };

  const columns: ColumnsType<Provinsi> = [
    {
      title: 'ID',
      dataIndex: 'proid',
      key: 'proid',
      width: 100,
    },
    {
      title: 'Provinsi',
      dataIndex: 'provinsi',
      key: 'provinsi',
    },
    {
      title: 'Gubernur',
      dataIndex: 'nama_gubern',
      key: 'nama_gubern',
      render: (text) => text || '-',
    },
    {
      title: 'Email',
      dataIndex: 'email',
      key: 'email',
      render: (text) => text || '-',
    },
    {
      title: 'Wilayah',
      dataIndex: 'wilayah',
      key: 'wilayah',
      render: (text) => text || '-',
    },
    {
      title: 'Aksi',
      key: 'action',
      width: 120,
      render: (_, record) => (
        <Space>
          <Button type="link" icon={<EditOutlined />} onClick={() => handleEdit(record)} />
          <Popconfirm title="Hapus provinsi ini?" onConfirm={() => handleDelete(record.proid)}>
            <Button type="link" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <Card
        title="Master Provinsi"
        extra={
          <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
            Tambah Provinsi
          </Button>
        }
      >
        <div style={{ marginBottom: 16 }}>
          <Input
            placeholder="Cari provinsi..."
            prefix={<SearchOutlined />}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            onPressEnter={fetchData}
            style={{ width: 300 }}
          />
          <Button style={{ marginLeft: 8 }} onClick={fetchData}>Cari</Button>
        </div>

        <Table
          columns={columns}
          dataSource={data}
          rowKey="proid"
          loading={loading}
          pagination={{ pageSize: 20, showSizeChanger: false }}
        />
      </Card>

      <Modal
        title={editingId ? 'Edit Provinsi' : 'Tambah Provinsi'}
        open={modalVisible}
        onOk={handleSubmit}
        onCancel={() => setModalVisible(false)}
        okText="Simpan"
        cancelText="Batal"
      >
        <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item
            name="proid"
            label="ID Provinsi"
            rules={[{ required: true, message: 'Harus diisi' }]}
          >
            <Input placeholder="Contoh: 01" disabled={!!editingId} />
          </Form.Item>
          <Form.Item
            name="provinsi"
            label="Nama Provinsi"
            rules={[{ required: true, message: 'Harus diisi' }]}
          >
            <Input placeholder="Contoh: Jawa Barat" />
          </Form.Item>
          <Form.Item name="nama_gubern" label="Nama Gubernur">
            <Input placeholder="Nama Gubernur" />
          </Form.Item>
          <Form.Item name="email" label="Email">
            <Input placeholder="email@domain.com" />
          </Form.Item>
          <Form.Item name="wilayah" label="Wilayah">
            <Select
              allowClear
              options={[
                { label: 'Barat', value: 'Barat' },
                { label: 'Tengah', value: 'Tengah' },
                { label: 'Timur', value: 'Timur' },
              ]}
            />
          </Form.Item>
          <Form.Item name="nama_dinas" label="Nama Dinas">
            <Input placeholder="Nama Dinas" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
