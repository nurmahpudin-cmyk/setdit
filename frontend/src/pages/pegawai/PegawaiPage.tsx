import { useState, useEffect } from 'react';
import {
  Table,
  Button,
  Space,
  Input,
  Modal,
  Form,
  Select,
  message,
  Popconfirm,
  Card,
  Tag,
  Upload,
  Table as TableAnt,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  SearchOutlined,
  UserOutlined,
  PhoneOutlined,
  UploadOutlined,
  DownloadOutlined,
  FileExcelOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import type { UploadProps } from 'antd';
import * as XLSX from 'xlsx';
import { pegawaiApi, Pegawai } from '../../api/pegawai';

export default function PegawaiPage() {
  const [data, setData] = useState<Pegawai[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [importModalVisible, setImportModalVisible] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form] = Form.useForm();
  const [searchText, setSearchText] = useState('');
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0 });
  const [previewData, setPreviewData] = useState<any[]>([]);
  const [importing, setImporting] = useState(false);

  useEffect(() => {
    fetchData();
  }, [pagination.page, pagination.limit]);

  const fetchData = async () => {
    setLoading(true);
    try {
      console.log('Fetching data...');
      const res = await pegawaiApi.findAll({
        page: pagination.page,
        limit: pagination.limit,
        search: searchText,
      });
      console.log('API Response:', res);
      setData(res.items);
      setPagination((prev) => ({ ...prev, total: res.pagination.total }));
    } catch (error) {
      console.error('Error fetching:', error);
      message.error('Gagal memuat data pegawai');
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = () => {
    setEditingId(null);
    form.resetFields();
    setModalVisible(true);
  };

  const handleEdit = (record: Pegawai) => {
    setEditingId(record.id);
    form.setFieldsValue({
      nama_lengkap: record.nama_lengkap,
      nama_panggilan: record.nama_panggilan,
      nip: record.nip,
      nomor_wa: record.nomor_wa,
      is_active: record.is_active,
    });
    setModalVisible(true);
  };

  const handleDelete = async (id: number) => {
    try {
      await pegawaiApi.delete(id);
      message.success('Pegawai berhasil dihapus');
      fetchData();
    } catch (error) {
      message.error('Gagal menghapus pegawai');
    }
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      if (editingId) {
        await pegawaiApi.update(editingId, values);
        message.success('Pegawai berhasil diperbarui');
      } else {
        await pegawaiApi.create(values);
        message.success('Pegawai berhasil ditambahkan');
      }
      setModalVisible(false);
      fetchData();
    } catch (error: any) {
      message.error(error?.response?.data?.message || (editingId ? 'Gagal memperbarui pegawai' : 'Gagal menambahkan pegawai'));
    }
  };

  const handleTableChange = (page: number, limit: number) => {
    setPagination({ ...pagination, page, limit });
  };

  // Excel Import Functions
  const downloadTemplate = () => {
    const template = [
      { nama_lengkap: 'Contoh Nama Lengkap', nama_panggilan: 'Panggilan', nip: '123456789', nomor_wa: '081234567890' },
    ];
    const ws = XLSX.utils.json_to_sheet(template);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Template');
    XLSX.writeFile(wb, 'template_pegawai.xlsx');
    message.success('Template berhasil didownload');
  };

  const handleExcelUpload: UploadProps['beforeUpload'] = async (file) => {
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);

        if (jsonData.length === 0) {
          message.warning('File Excel kosong');
          return false;
        }

        setPreviewData(jsonData);
        message.success(`Ditemukan ${jsonData.length} data untuk diimport`);
      } catch (error) {
        message.error('Gagal membaca file Excel');
      }
    };
    reader.readAsArrayBuffer(file);
    return false;
  };

  const handleImport = async () => {
    if (previewData.length === 0) {
      message.warning('Tidak ada data untuk diimport');
      return;
    }

    setImporting(true);
    let successCount = 0;
    let errorCount = 0;
    const errors: string[] = [];

    for (let i = 0; i < previewData.length; i++) {
      const row = previewData[i] as any;
      try {
        await pegawaiApi.create({
          nama_lengkap: row.nama_lengkap,
          nama_panggilan: row.nama_panggilan || undefined,
          nip: String(row.nip),
          nomor_wa: row.nomor_wa || undefined,
        });
        successCount++;
      } catch (error: any) {
        errorCount++;
        errors.push(`Baris ${i + 2}: ${error?.response?.data?.message || 'Gagal import'}`);
      }
    }

    setImporting(false);

    if (successCount > 0) {
      message.success(`${successCount} data berhasil diimport`);
    }
    if (errorCount > 0) {
      message.warning(`${errorCount} data gagal diimport`);
      console.error('Import errors:', errors);
    }

    setImportModalVisible(false);
    setPreviewData([]);
    fetchData();
  };

  const previewColumns = [
    { title: 'Nama Lengkap', dataIndex: 'nama_lengkap', key: 'nama_lengkap' },
    { title: 'Nama Panggilan', dataIndex: 'nama_panggilan', key: 'nama_panggilan' },
    { title: 'NIP', dataIndex: 'nip', key: 'nip' },
    { title: 'No. WhatsApp', dataIndex: 'nomor_wa', key: 'nomor_wa' },
  ];

  const columns: ColumnsType<Pegawai> = [
    {
      title: 'No',
      key: 'no',
      width: 60,
      render: (_, __, index) => (pagination.page - 1) * pagination.limit + index + 1,
    },
    {
      title: 'Nama Lengkap',
      dataIndex: 'nama_lengkap',
      key: 'nama_lengkap',
      sorter: (a, b) => a.nama_lengkap.localeCompare(b.nama_lengkap),
    },
    {
      title: 'Nama Panggilan',
      dataIndex: 'nama_panggilan',
      key: 'nama_panggilan',
      render: (text) => text || '-',
    },
    {
      title: 'NIP',
      dataIndex: 'nip',
      key: 'nip',
    },
    {
      title: 'No. WhatsApp',
      dataIndex: 'nomor_wa',
      key: 'nomor_wa',
      render: (text) => (
        <Space>
          <PhoneOutlined />
          {text || '-'}
        </Space>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'is_active',
      key: 'is_active',
      width: 100,
      render: (isActive) => (
        <Tag color={isActive ? 'green' : 'red'}>
          {isActive ? 'Aktif' : 'Nonaktif'}
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
          <Popconfirm
            title="Yakin hapus pegawai ini?"
            description="Pendamping jadwal terkait juga akan dihapus."
            onConfirm={() => handleDelete(record.id)}
            okText="Ya"
            cancelText="Batal"
          >
            <Button type="link" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const filteredData = searchText
    ? data.filter(
        (item) =>
          item.nama_lengkap.toLowerCase().includes(searchText.toLowerCase()) ||
          item.nama_panggilan?.toLowerCase().includes(searchText.toLowerCase()) ||
          item.nip.toLowerCase().includes(searchText.toLowerCase())
      )
    : data;

  return (
    <div>
      <Card
        title="Data Pegawai"
        extra={
          <Space>
            <Button icon={<UploadOutlined />} onClick={() => setImportModalVisible(true)}>
              Import Excel
            </Button>
            <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
              Tambah Pegawai
            </Button>
          </Space>
        }
      >
        <div style={{ marginBottom: 16 }}>
          <Input
            placeholder="Cari nama lengkap, nama panggilan, atau NIP..."
            prefix={<SearchOutlined />}
            value={searchText}
            onChange={(e) => {
              setSearchText(e.target.value);
              setPagination({ ...pagination, page: 1 });
            }}
            onPressEnter={() => setPagination({ ...pagination, page: 1 })}
            style={{ width: 350 }}
          />
        </div>

        <Table
          columns={columns}
          dataSource={filteredData}
          rowKey="id"
          loading={loading}
          pagination={{
            current: pagination.page,
            pageSize: pagination.limit,
            total: pagination.total,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => `Total ${total} pegawai`,
            onChange: handleTableChange,
          }}
        />
      </Card>

      {/* Add/Edit Modal */}
      <Modal
        title={editingId ? 'Edit Pegawai' : 'Tambah Pegawai Baru'}
        open={modalVisible}
        onOk={handleSubmit}
        onCancel={() => setModalVisible(false)}
        okText={editingId ? 'Simpan' : 'Tambah'}
        cancelText="Batal"
      >
        <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item
            name="nama_lengkap"
            label="Nama Lengkap"
            rules={[{ required: true, message: 'Harus diisi' }]}
          >
            <Input prefix={<UserOutlined />} placeholder="Nama lengkap" />
          </Form.Item>

          <Form.Item name="nama_panggilan" label="Nama Panggilan">
            <Input placeholder="Nama panggilan" />
          </Form.Item>

          <Form.Item
            name="nip"
            label="NIP"
            rules={[{ required: true, message: 'Harus diisi' }]}
          >
            <Input placeholder="Nomor Induk Pegawai" />
          </Form.Item>

          <Form.Item name="nomor_wa" label="Nomor WhatsApp">
            <Input prefix={<PhoneOutlined />} placeholder="08xxxxxxxxxx" />
          </Form.Item>

          {editingId && (
            <Form.Item name="is_active" label="Status" valuePropName="checked">
              <Select
                options={[
                  { label: 'Aktif', value: true },
                  { label: 'Nonaktif', value: false },
                ]}
              />
            </Form.Item>
          )}
        </Form>
      </Modal>

      {/* Import Excel Modal */}
      <Modal
        title="Import Data Pegawai dari Excel"
        open={importModalVisible}
        onCancel={() => {
          setImportModalVisible(false);
          setPreviewData([]);
        }}
        footer={[
          <Button key="cancel" onClick={() => {
            setImportModalVisible(false);
            setPreviewData([]);
          }}>
            Batal
          </Button>,
          <Button
            key="import"
            type="primary"
            icon={<FileExcelOutlined />}
            loading={importing}
            disabled={previewData.length === 0}
            onClick={handleImport}
          >
            Import {previewData.length > 0 ? `(${previewData.length} data)` : ''}
          </Button>,
        ]}
        width={800}
      >
        <div style={{ marginBottom: 16 }}>
          <h4>Format Excel:</h4>
          <table style={{ border: '1px solid #ddd', borderCollapse: 'collapse', width: '100%' }}>
            <thead>
              <tr style={{ background: '#f5f5f5' }}>
                <th style={{ border: '1px solid #ddd', padding: 8 }}>nama_lengkap</th>
                <th style={{ border: '1px solid #ddd', padding: 8 }}>nama_panggilan</th>
                <th style={{ border: '1px solid #ddd', padding: 8 }}>nip</th>
                <th style={{ border: '1px solid #ddd', padding: 8 }}>nomor_wa</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style={{ border: '1px solid #ddd', padding: 8 }}>Budi Santoso</td>
                <td style={{ border: '1px solid #ddd', padding: 8 }}>Budi</td>
                <td style={{ border: '1px solid #ddd', padding: 8 }}>123456789</td>
                <td style={{ border: '1px solid #ddd', padding: 8 }}>081234567890</td>
              </tr>
              <tr>
                <td style={{ border: '1px solid #ddd', padding: 8, color: '#999' }}>Wajib diisi</td>
                <td style={{ border: '1px solid #ddd', padding: 8, color: '#999' }}>Opsional</td>
                <td style={{ border: '1px solid #ddd', padding: 8, color: '#999' }}>Wajib & unik</td>
                <td style={{ border: '1px solid #ddd', padding: 8, color: '#999' }}>Opsional</td>
              </tr>
            </tbody>
          </table>
        </div>

        <Space style={{ marginBottom: 16 }}>
          <Upload
            accept=".xlsx,.xls"
            beforeUpload={handleExcelUpload}
            showUploadList={false}
          >
            <Button icon={<UploadOutlined />}>Pilih File Excel</Button>
          </Upload>
          <Button icon={<DownloadOutlined />} onClick={downloadTemplate}>
            Download Template
          </Button>
        </Space>

        {previewData.length > 0 && (
          <div>
            <h4>Preview Data ({previewData.length} baris):</h4>
            <TableAnt
              columns={previewColumns}
              dataSource={previewData}
              rowKey={(_, index) => String(index)}
              size="small"
              scroll={{ x: 'max-content' }}
              pagination={false}
              style={{ border: '1px solid #ddd' }}
            />
          </div>
        )}
      </Modal>
    </div>
  );
}
