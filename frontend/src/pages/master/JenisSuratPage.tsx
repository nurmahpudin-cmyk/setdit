import { useState, useEffect } from 'react';
import { Table, Button, Space, Input, Modal, Form, message, Card, Popconfirm, Tag, Switch } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, SearchOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { jenisSuratApi, JenisSurat } from '../../api/jenisSurat';

export default function JenisSuratPage() {
  const [data, setData] = useState<JenisSurat[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchText, setSearchText] = useState('');
  const [form] = Form.useForm();

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await jenisSuratApi.getAll(searchText || undefined);
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

  const handleEdit = (record: JenisSurat) => {
    setEditingId(record.id_jenis_surat);
    form.setFieldsValue({
      nama_jenis_surat: record.nama_jenis_surat,
      status: record.status,
    });
    setModalVisible(true);
  };

  const handleDelete = async (id: string) => {
    try {
      await jenisSuratApi.delete(id);
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
        await jenisSuratApi.update(editingId, values);
        message.success('Berhasil diupdate');
      } else {
        await jenisSuratApi.create(values);
        message.success('Berhasil dibuat');
      }
      setModalVisible(false);
      fetchData();
    } catch (error: any) {
      message.error(error?.response?.data?.message || 'Gagal menyimpan');
    }
  };

  const columns: ColumnsType<JenisSurat> = [
    {
      title: 'ID',
      dataIndex: 'id_jenis_surat',
      key: 'id_jenis_surat',
      width: 280,
      ellipsis: true,
    },
    {
      title: 'Nama Jenis Surat',
      dataIndex: 'nama_jenis_surat',
      key: 'nama_jenis_surat',
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (status: boolean) => (
        <Tag color={status ? 'green' : 'red'}>
          {status ? 'Aktif' : 'Tidak Aktif'}
        </Tag>
      ),
    },
    {
      title: 'Aksi',
      key: 'action',
      width: 120,
      render: (_, record) => (
        <Space>
          <Button type="link" icon={<EditOutlined />} onClick={() => handleEdit(record)} />
          <Popconfirm title="Hapus?" onConfirm={() => handleDelete(record.id_jenis_surat)}>
            <Button type="link" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <Card
        title="Master Jenis Surat"
        extra={<Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>Tambah</Button>}
      >
        <div style={{ marginBottom: 16 }}>
          <Input
            placeholder="Cari..."
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
          rowKey="id_jenis_surat"
          loading={loading}
          pagination={{ pageSize: 20, showSizeChanger: false }}
        />
      </Card>

      <Modal
        title={editingId ? 'Edit Jenis Surat' : 'Tambah Jenis Surat'}
        open={modalVisible}
        onOk={handleSubmit}
        onCancel={() => setModalVisible(false)}
        okText="Simpan"
        cancelText="Batal"
      >
        <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item
            name="nama_jenis_surat"
            label="Nama Jenis Surat"
            rules={[{ required: true, message: 'Nama jenis surat wajib diisi' }]}
          >
            <Input placeholder="Contoh: Surat Masuk" />
          </Form.Item>
          <Form.Item
            name="status"
            label="Status"
            valuePropName="checked"
            initialValue={true}
          >
            <Switch checkedChildren="Aktif" unCheckedChildren="Tidak Aktif" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
