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
  TimePicker,
  Checkbox,
  Radio,
  message,
  Popconfirm,
  Card,
  Tag,
  Row,
  Col,
  Alert,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  SendOutlined,
  EyeOutlined,
  SearchOutlined,
  WhatsAppOutlined,
  FilePdfOutlined,
} from '@ant-design/icons';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { ColumnsType } from 'antd/es/table';
import { jadwalPimpinanApi } from '../../api/jadwalPimpinan';
import type { JadwalPimpinan, Pegawai } from '../../api/jadwalPimpinan';
import dayjs from 'dayjs';

const { RangePicker } = DatePicker;

const DIREKTUR_OPTIONS = [
  { label: 'Sekditjen PS', value: 'Sekditjen PS' },
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
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs | null, dayjs.Dayjs | null] | null>(null);
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

  const handleEdit = (record: JadwalPimpinan) => {
    setEditingId(record.id);
    form.setFieldsValue({
      acara: record.acara,
      lokasi: record.lokasi,
      sebagai: record.sebagai,
      tanggal_awal: dayjs(record.tanggal_awal),
      tanggal_akhir: dayjs(record.tanggal_akhir),
      waktu: record.waktu ? dayjs(record.waktu, 'HH:mm') : undefined,
      hadir_sendiri: record.hadir_sendiri,
      model_rapat: record.model_rapat,
      catatan: record.catatan,
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

  const handleSendWaToPendamping = async (record: JadwalPimpinan) => {
    if (record.pendamping_pegawai.length === 0) {
      message.warning('Tidak ada pendamping pegawai untuk jadwal ini');
      return;
    }
    try {
      const res = await jadwalPimpinanApi.sendNotificationToPendamping(record.id);
      const successCount = res.results.filter((r) => r.status === 'berhasil').length;
      message.success(`${res.message} (${successCount}/${res.results.length})`);
    } catch (error: any) {
      message.error(error.message || 'Gagal mengirim notifikasi');
    }
  };

  const handleExportPDF = () => {
    if (filteredData.length === 0) {
      message.warning('Tidak ada data untuk di-export');
      return;
    }

    // Landscape orientation for more width
    const doc = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: 'a4',
    });

    const pageWidth = doc.internal.pageSize.getWidth();

    // Header
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('JADWAL PIMPINAN', pageWidth / 2, 12, { align: 'center' });

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    let headerY = 18;
    if (dateRange && dateRange[0] && dateRange[1]) {
      doc.text(`Periode: ${dateRange[0].format('DD/MM/YYYY')} - ${dateRange[1].format('DD/MM/YYYY')}`, pageWidth / 2, headerY, { align: 'center' });
      headerY += 5;
    }
    if (searchText) {
      doc.text(`Filter: ${searchText}`, pageWidth / 2, headerY, { align: 'center' });
      headerY += 5;
    }

    // Table
    const tableData = filteredData.map((item, index) => {
      const tanggal = item.tanggal_awal === item.tanggal_akhir
        ? dayjs(item.tanggal_awal).format('DD/MM/YYYY')
        : `${dayjs(item.tanggal_awal).format('DD/MM/YYYY')} - ${dayjs(item.tanggal_akhir).format('DD/MM/YYYY')}`;
      const pendampingPegawai = item.pendamping_pegawai.map(p => p.pegawai?.nama_lengkap || '-').join(', ');
      const pendampingDir = item.pendamping_direktur.map(d => d.nama_direktur).join(', ');

      return [
        (index + 1).toString(),
        tanggal,
        item.acara,
        item.lokasi,
        item.sebagai,
        item.waktu || '-',
        item.model_rapat,
        item.hadir_sendiri ? 'Hadir' : 'Diwakilkan',
        item.catatan || '-',
        pendampingPegawai || '-',
        pendampingDir || '-',
      ];
    });

    autoTable(doc, {
      head: [['No', 'Tanggal', 'Acara', 'Lokasi', 'Sebagai', 'Waktu', 'Model', 'Kehadiran', 'Catatan', 'Pendamping Pegawai', 'Pendamping Direktur']],
      body: tableData,
      startY: headerY,
      styles: { fontSize: 7, cellPadding: 2 },
      headStyles: { fillColor: [41, 128, 185], fontSize: 7 },
      columnStyles: {
        0: { cellWidth: 10 },
        1: { cellWidth: 25 },
        2: { cellWidth: 45 },
        3: { cellWidth: 35 },
        4: { cellWidth: 20 },
        5: { cellWidth: 15 },
        6: { cellWidth: 18 },
        7: { cellWidth: 18 },
        8: { cellWidth: 25 },
        9: { cellWidth: 35 },
        10: { cellWidth: 35 },
      },
      didDrawPage: function (data) {
        // Footer on each page
        doc.setFontSize(7);
        doc.setFont('helvetica', 'normal');
        const pageHeight = doc.internal.pageSize.getHeight();
        doc.text(`Dicetak: ${dayjs().format('DD/MM/YYYY HH:mm')}`, 10, pageHeight - 5);
        doc.text(`Halaman ${data.pageNumber} dari ${doc.getNumberOfPages()}`, pageWidth - 10, pageHeight - 5, { align: 'right' });
      },
    });

    doc.save(`jadwal-pimpinan-${dayjs().format('YYYY-MM-DD')}.pdf`);
    message.success('PDF berhasil di-export');
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
        waktu: values.waktu?.format('HH:mm'),
        hadir_sendiri: values.hadir_sendiri ?? true,
        model_rapat: values.model_rapat || 'FAKTUAL',
        catatan: values.catatan,
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
      width: 50,
      render: (_, __, index) => index + 1,
    },
    {
      title: 'Acara',
      dataIndex: 'acara',
      key: 'acara',
      width: 250,
    },
    {
      title: 'Lokasi',
      dataIndex: 'lokasi',
      key: 'lokasi',
      width: 200,
    },
    {
      title: 'Sebagai',
      dataIndex: 'sebagai',
      key: 'sebagai',
      width: 120,
    },
    {
      title: 'Tanggal',
      key: 'tanggal',
      width: 150,
      render: (_, record) => (
        <span>
          {dayjs(record.tanggal_awal).format('DD/MM/YYYY')}
          {record.tanggal_awal !== record.tanggal_akhir &&
            ` - ${dayjs(record.tanggal_akhir).format('DD/MM/YYYY')}`}
        </span>
      ),
    },
    {
      title: 'Waktu',
      dataIndex: 'waktu',
      key: 'waktu',
      width: 80,
      render: (waktu) => waktu || '-',
    },
    {
      title: 'Model',
      dataIndex: 'model_rapat',
      key: 'model_rapat',
      width: 100,
      render: (val) => <Tag color={val === 'FAKTUAL' ? 'blue' : val === 'HYBRID' ? 'green' : 'purple'}>{val}</Tag>,
    },
    {
      title: 'Kehadiran',
      key: 'kehadiran',
      width: 120,
      render: (_, record) => (
        <Tag color={record.hadir_sendiri ? 'success' : 'warning'}>
          {record.hadir_sendiri ? 'Hadir Langsung' : 'Diwakilkan'}
        </Tag>
      ),
    },
    {
      title: 'Pendamping Pegawai',
      key: 'pendamping_pegawai',
      width: 200,
      render: (_, record) => (
        <div style={{ wordWrap: 'break-word', wordBreak: 'break-word' }}>
          {record.pendamping_pegawai.length === 0 ? (
            <span style={{ color: '#999' }}>-</span>
          ) : (
            record.pendamping_pegawai.map((p) => (
              <Tag key={p.id} color="blue" style={{ marginBottom: 2 }}>{p.pegawai?.nama_lengkap || '-'}</Tag>
            ))
          )}
        </div>
      ),
    },
    {
      title: 'Pendamping Direktur',
      key: 'pendamping_direktur',
      width: 180,
      render: (_, record) => (
        <div style={{ wordWrap: 'break-word', wordBreak: 'break-word' }}>
          {record.pendamping_direktur.length === 0 ? (
            <span style={{ color: '#999' }}>-</span>
          ) : (
            record.pendamping_direktur.map((d) => (
              <Tag key={d.id} color="green" style={{ marginBottom: 2 }}>{d.nama_direktur}</Tag>
            ))
          )}
        </div>
      ),
    },
    {
      title: 'Aksi',
      key: 'action',
      width: 150,
      fixed: 'right',
      render: (_, record) => (
        <Space size={4}>
          <Button
            size="small"
            type="link"
            icon={<WhatsAppOutlined style={{ color: '#25D366' }} />}
            onClick={() => handleSendWaToPendamping(record)}
            style={{ padding: '4px 8px' }}
            title="Kirim WA ke Pendamping"
          />
          <Button
            size="small"
            type="link"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
            style={{ padding: '4px 8px' }}
          />
          <Popconfirm
            title="Yakin hapus jadwal ini?"
            onConfirm={() => handleDelete(record.id)}
            okText="Ya"
            cancelText="Batal"
          >
            <Button
              size="small"
              type="link"
              danger
              icon={<DeleteOutlined />}
              style={{ padding: '4px 8px' }}
            />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const filteredData = searchText
    ? data.filter((item) => {
        const keyword = searchText.toLowerCase();
        const searchableText = [
          item.acara,
          item.lokasi,
          item.sebagai,
          item.model_rapat,
          item.hadir_sendiri ? 'hadir langsung' : 'diwakilkan',
          item.waktu || '',
          dayjs(item.tanggal_awal).format('DD/MM/YYYY'),
          dayjs(item.tanggal_akhir).format('DD/MM/YYYY'),
          ...item.pendamping_pegawai.map((p) => p.pegawai?.nama_lengkap || ''),
          ...item.pendamping_direktur.map((d) => d.nama_direktur),
        ].join(' ').toLowerCase();
        const matchText = searchableText.includes(keyword);

        // Filter tanggal
        if (dateRange && dateRange[0] && dateRange[1]) {
          const itemStart = dayjs(item.tanggal_awal);
          const itemEnd = dayjs(item.tanggal_akhir);
          const filterStart = dateRange[0].startOf('day');
          const filterEnd = dateRange[1].endOf('day');

          // Item match jika overlap dengan range filter
          const matchDate = itemStart.isBefore(filterEnd) && itemEnd.isAfter(filterStart.subtract(1, 'day'));
          return matchText && matchDate;
        }

        return matchText;
      })
    : data;

  return (
    <div>
      <Card
        title="Jadwal Pimpinan"
        extra={
          <Space wrap>
            <Button icon={<SendOutlined />} onClick={() => setNotificationModalVisible(true)}>
              Kirim Notifikasi WA
            </Button>
            <Button icon={<FilePdfOutlined />} onClick={handleExportPDF}>
              Export PDF
            </Button>
            <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
              Tambah Jadwal
            </Button>
          </Space>
        }
      >
        <Row gutter={[8, 8]} style={{ marginBottom: 16 }}>
          <Col xs={24} sm={12} md={8}>
            <Input
              placeholder="Cari..."
              prefix={<SearchOutlined />}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              allowClear
            />
          </Col>
          <Col xs={24} sm={12} md={10}>
            <RangePicker
              style={{ width: '100%' }}
              placeholder={['Tanggal Mulai', 'Tanggal Selesai']}
              value={dateRange}
              onChange={(dates) => setDateRange(dates as [dayjs.Dayjs | null, dayjs.Dayjs | null] | null)}
              format="DD/MM/YYYY"
              allowClear
            />
          </Col>
        </Row>

        <Table
          columns={columns}
          dataSource={filteredData}
          rowKey="id"
          loading={loading}
          scroll={{ x: 600 }}
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
            <Input.TextArea placeholder="Nama acara" autoSize={{ minRows: 2, maxRows: 4 }} />
          </Form.Item>

          <Form.Item
            name="lokasi"
            label="Lokasi"
            rules={[{ required: true, message: 'Harus diisi' }]}
          >
            <Input.TextArea placeholder="Tempat pelaksanaan" autoSize={{ minRows: 2, maxRows: 3 }} />
          </Form.Item>

          <Form.Item
            name="sebagai"
            label="Sebagai"
            rules={[{ required: true, message: 'Harus diisi' }]}
          >
            <Input placeholder="Contoh: Pembicara, Tamu Undangan" />
          </Form.Item>

          <Row gutter={[16, 0]}>
            <Col xs={24} sm={12}>
              <Form.Item
                name="tanggal_awal"
                label="Tanggal Awal"
                rules={[{ required: true, message: 'Harus diisi' }]}
              >
                <DatePicker format="YYYY-MM-DD" style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item
                name="tanggal_akhir"
                label="Tanggal Akhir"
                rules={[{ required: true, message: 'Harus diisi' }]}
              >
                <DatePicker format="YYYY-MM-DD" style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={[16, 0]}>
            <Col xs={24} sm={12}>
              <Form.Item
                name="waktu"
                label="Waktu"
              >
                <TimePicker format="HH:mm" style={{ width: '100%' }} placeholder="Jam pelaksanaan" />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item
                name="model_rapat"
                label="Model Rapat"
                rules={[{ required: true, message: 'Harus dipilih' }]}
              >
                <Select
                  placeholder="Pilih model"
                  options={[
                    { label: 'Faktual', value: 'FAKTUAL' },
                    { label: 'Hybrid', value: 'HYBRID' },
                    { label: 'Virtual', value: 'VIRTUAL' },
                  ]}
                />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="hadir_sendiri"
            label="Kehadiran"
            initialValue={true}
          >
            <Radio.Group>
              <Radio value={true}>Hadir Langsung</Radio>
              <Radio value={false}>Diwakilkan</Radio>
            </Radio.Group>
          </Form.Item>

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

          <Form.Item name="catatan" label="Catatan">
            <Input.TextArea placeholder="Contoh: Dresscode menggunakan batik Korpri" autoSize={{ minRows: 2, maxRows: 4 }} />
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
