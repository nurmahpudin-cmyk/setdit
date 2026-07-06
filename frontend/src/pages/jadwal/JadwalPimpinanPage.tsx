import { useState, useEffect } from 'react';
import {
  Table,
  Button,
  Space,
  Input,
  Modal,
  Form,
  Select,
  DatePicker,
  Checkbox,
  Radio,
  message,
  Popconfirm,
  Card,
  Tag,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  SendOutlined,
  EyeOutlined,
  SearchOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { jadwalPimpinanApi } from '../../api/jadwalPimpinan';
import type { JadwalPimpinan, Pegawai } from '../../api/jadwalPimpinan';
import dayjs from 'dayjs';

const { RangePicker } = DatePicker;

const DIREKTUR_OPTIONS = [
  { label: 'Dir. PKPS', value: 'PKPS' },
  { label: 'Dir. PKTHA', value: 'PKTHA' },
  { label: 'Dir. PUPS', value: 'PUPS' },
  { label: 'Dir. PPS', value: 'PPS' },
];

export default function JadwalPimpinanPage() {
  const [data, setData] = useState<JadwalPimpinan[]>([]);
  const [pegawai, setPegawai] = useState<Pegawai[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [notificationModalVisible, setNotificationModalVisible] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form] = Form.useForm();
  const [searchText, setSearchText] = useState('');
  const [previewMessage, setPreviewMessage] = useState('');
  const [notificationType, setNotificationType] = useState<'weekly' | 'monthly'>('weekly');
  const [phoneNumber, setPhoneNumber] = useState('');

  useEffect(() => {
    fetchData();
    fetchPegawai();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await jadwalPimpinanApi.findAll();
      setData(res.items);
    } catch (error) {
      message.error('Gagal memuat data jadwal');
    } finally {
      setLoading(false);
    }
  };

  const fetchPegawai = async () => {
    try {
      const res = await jadwalPimpinanApi.getPegawai();
      setPegawai(res);
    } catch (error) {
      console.error('Gagal memuat pegawai');
    }
  };

  const handleAdd = () => {
    setEditingId(null);
    form.resetFields();
    setModalVisible(true);
  };

  const handleEdit = (record: JadwalPirman) => {
    setEditingId(record.id);
    form.setFieldsValue({
      acara: record.acara,
      lokasi: record.lokasi,
      sebagai: record.sebagai,
      tanggal_awal: dayjs(record.tanggal_awal),
      tanggal_akhir: dayjs(record.tanggal_akhir),
      pendamping_pegawai: record.pendamping_pegawai.map((p) => p.pegawai_id),
      pendamping_direktur: record.pendamping_direktur.map((d) => d.kode_direktur),
    });
    setModalVisible(true);
  };

  const handleDelete = async (id: number) => {
    try {
      await jadwalPimpinanApi.delete(id);
      message.success('Jadwal berhasil dihapus');
      fetchData();
    } catch (error) {
      message.error('Gagal menghapus jadwal');
    }
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      const payload = {
        acara: values.acara,
        lokasi: values.lokasi,
        sebagai: values.sebagai,
        tanggal_awal: values.tanggal_awal.toISOString(),
        tanggal_akhir: values.tanggal_akhir.toISOString(),
        pendamping_pegawai: values.pendamping_pegawai?.map((pegawaiId: number) => ({
          pegawai_id: pegawaiId,
        })) || [],
        pendamping_direktur: values.pendamping_direktur?.map((kode: string) => {
          const dir = DIREKTUR_OPTIONS.find((d) => d.value === kode);
          return { kode_direktur: kode, nama_direktur: dir?.label || kode };
        }) || [],
      };

      if (editingId) {
        await jadwalPimpinanApi.update(editingId, payload);
        message.success('Jadwal berhasil diperbarui');
      } else {
        await jadwalPimpinanApi.create(payload);
        message.success('Jadwal berhasil ditambahkan');
      }
      setModalVisible(false);
      fetchData();
    } catch (error) {
      message.error(editingId ? 'Gagal memperbarui jadwal' : 'Gagal menambahkan jadwal');
    }
  };

  const handlePreviewNotification = async () => {
    try {
      const res = await jadwalPimpinanApi.previewNotification(notificationType);
      setPreviewMessage(res.preview);
    } catch (error) {
      message.error('Gagal membuat preview');
    }
  };

  const handleSendNotification = async () => {
    if (!phoneNumber) {
      message.error('Mohon masukkan nomor WhatsApp');
      return;
    }
    try {
      await jadwalPimpinanApi.sendNotification(phoneNumber, notificationType);
      message.success('Notifikasi berhasil dikirim');
      setNotificationModalVisible(false);
      setPhoneNumber('');
      setPreviewMessage('');
    } catch (error) {
      message.error('Gagal mengirim notifikasi');
    }
  };

  const columns: ColumnsType<JadwalPimpinan> = [
    {
      title: 'No',
      key: 'no',
      width: 60,
      render: (_, __, index) => index + 1,
    },
    {
      title: 'Acara',
      dataIndex: 'acara',
      key: 'acara',
      ellipsis: true,
    },
    {
      title: 'Lokasi',
      dataIndex: 'lokasi',
      key: 'lokasi',
      ellipsis: true,
    },
    {
      title: 'Sebagai',
      dataIndex: 'sebagai',
      key: 'sebagai',
      ellipsis: true,
    },
    {
      title: 'Tanggal',
      key: 'tanggal',
      render: (_, record) => (
        <span>
          {dayjs(record.tanggal_awal).format('DD/MM/YYYY')}
          {record.tanggal_awal !== record.tanggal_akhir &&
            ` - ${dayjs(record.tanggal_akhir).format('DD/MM/YYYY')}`}
        </span>
      ),
    },
    {
      title: 'Pendamping',
      key: 'pendamping',
      render: (_, record) => (
        <div>
          {record.pendamping_pegawai.slice(0, 2).map((p) => (
            <Tag key={p.id} color="blue">{p.pegawai?.nama_lengkap || '-'}</Tag>
          ))}
          {record.pendamping_pegawai.length > 2 && (
            <Tag color="default">+{record.pendamping_pegawai.length - 2}</Tag>
          )}
          {record.pendamping_direktur.map((d) => (
            <Tag key={d.id} color="green">{d.nama_direktur}</Tag>
          ))}
        </div>
      ),
    },
    {
      title: 'Aksi',
      key: 'action',
      width: 120,
      render: (_, record) => (
        <Space>
          <Button
            type="link"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          />
          <Popconfirm
            title="Yakin hapus jadwal ini?"
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
          item.acara.toLowerCase().includes(searchText.toLowerCase()) ||
          item.lokasi.toLowerCase().includes(searchText.toLowerCase())
      )
    : data;

  return (
    <div>
      <Card
        title="Jadwal Pimpinan"
        extra={
          <Space>
            <Button icon={<SendOutlined />} onClick={() => setNotificationModalVisible(true)}>
              Kirim Notifikasi WA
            </Button>
            <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
              Tambah Jadwal
            </Button>
          </Space>
        }
      >
        <div style={{ marginBottom: 16 }}>
          <Input
            placeholder="Cari acara atau lokasi..."
            prefix={<SearchOutlined />}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            style={{ width: 300 }}
          />
        </div>

        <Table
          columns={columns}
          dataSource={filteredData}
          rowKey="id"
          loading={loading}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showTotal: (total) => `Total ${total} jadwal`,
          }}
        />
      </Card>

      {/* Add/Edit Modal */}
      <Modal
        title={editingId ? 'Edit Jadwal' : 'Tambah Jadwal Baru'}
        open={modalVisible}
        onOk={handleSubmit}
        onCancel={() => setModalVisible(false)}
        width={600}
        okText={editingId ? 'Simpan' : 'Tambah'}
        cancelText="Batal"
      >
        <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item
            name="acara"
            label="Acara"
            rules={[{ required: true, message: 'Harus diisi' }]}
          >
            <Input placeholder="Nama acara" />
          </Form.Item>

          <Form.Item
            name="lokasi"
            label="Lokasi"
            rules={[{ required: true, message: 'Harus diisi' }]}
          >
            <Input placeholder="Tempat pelaksanaan" />
          </Form.Item>

          <Form.Item
            name="sebagai"
            label="Sebagai"
            rules={[{ required: true, message: 'Harus diisi' }]}
          >
            <Input placeholder="Contoh: Pembicara, Tamu Undangan" />
          </Form.Item>

          <Space style={{ width: '100%' }}>
            <Form.Item
              name="tanggal_awal"
              label="Tanggal Awal"
              rules={[{ required: true, message: 'Harus diisi' }]}
              style={{ width: 200 }}
            >
              <DatePicker format="YYYY-MM-DD" />
            </Form.Item>
            <Form.Item
              name="tanggal_akhir"
              label="Tanggal Akhir"
              rules={[{ required: true, message: 'Harus diisi' }]}
              style={{ width: 200 }}
            >
              <DatePicker format="YYYY-MM-DD" />
            </Form.Item>
          </Space>

          <Form.Item name="pendamping_pegawai" label="Pendamping Pegawai">
            <Select
              mode="multiple"
              placeholder="Pilih pegawai..."
              allowClear
              options={pegawai.map((p) => ({ label: `${p.nama_lengkap} (${p.nip})`, value: p.id }))}
            />
          </Form.Item>

          <Form.Item name="pendamping_direktur" label="Pendamping Direktur">
            <Checkbox.Group options={DIREKTUR_OPTIONS} />
          </Form.Item>
        </Form>
      </Modal>

      {/* Notification Modal */}
      <Modal
        title="Kirim Notifikasi WhatsApp"
        open={notificationModalVisible}
        onCancel={() => setNotificationModalVisible(false)}
        footer={[
          <Button key="back" onClick={() => setNotificationModalVisible(false)}>
            Tutup
          </Button>,
          <Button
            key="send"
            type="primary"
            icon={<SendOutlined />}
            onClick={handleSendNotification}
            disabled={!phoneNumber}
          >
            Kirim Notifikasi
          </Button>,
        ]}
        width={600}
      >
        <div style={{ marginTop: 16 }}>
          <Form layout="vertical">
            <Form.Item label="Periode">
              <Radio.Group
                value={notificationType}
                onChange={(e) => {
                  setNotificationType(e.target.value);
                  setPreviewMessage('');
                }}
              >
                <Radio.Button value="weekly">Mingguan (7 hari ke depan)</Radio.Button>
                <Radio.Button value="monthly" style={{ marginLeft: 8 }}>
                  Bulanan (bulan ini)
                </Radio.Button>
              </Radio.Group>
            </Form.Item>

            <Form.Item label="Nomor WhatsApp Aspri">
              <Input
                placeholder="08xxxxxxxxxx"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
              />
            </Form.Item>

            <Button
              icon={<EyeOutlined />}
              onClick={handlePreviewNotification}
              style={{ marginBottom: 16 }}
            >
              Lihat Preview Pesan
            </Button>

            {previewMessage && (
              <Form.Item label="Preview Pesan">
                <Input.TextArea
                  value={previewMessage}
                  readOnly
                  rows={12}
                  style={{ fontFamily: 'monospace' }}
                />
              </Form.Item>
            )}
          </Form>
        </div>
      </Modal>
    </div>
  );
}
