import { useState, useEffect, useCallback } from 'react';
import {
  Table,
  Button,
  Space,
  Input,
  Modal,
  Form,
  Select,
  message,
  Card,
  Tag,
  Tabs,
  Timeline,
  Steps,
  DatePicker,
  InputNumber,
  Row,
  Col,
  Grid,
  Dropdown,
  Typography,
  Divider as AntDivider,
} from 'antd';
import {
  PlusOutlined,
  CheckOutlined,
  CloseOutlined,
  SearchOutlined,
  WarningOutlined,
  FileTextOutlined,
  MoreOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import { skPerhutananApi, SKPerhutanan, SKWorkflowStage } from '../../api/skPerhutanan';
import { provinsiApi, Provinsi } from '../../api/provinsi';
import { kabkotaApi, Kabkota } from '../../api/kabkota';
import { skemaApi, Skema } from '../../api/skema';
import { externalApi, KelompokPS } from '../../api/external';
import { useAppSelector } from '../../hooks/useRedux';

const { useBreakpoint } = Grid;
const { Text, Title } = Typography;
const { TextArea } = Input;

// Workflow steps display configuration
const WORKFLOW_STEPS = [
  { num: 1, name: 'Input Admin TU', color: '#1890ff' },
  { num: 2, name: 'Setditjen PS', color: '#1890ff' },
  { num: 3, name: 'Kabag PEHK', color: '#1890ff' },
  { num: 4, name: 'Distribusi Ke Anggota', color: '#1890ff' },
  { num: 5, name: 'Telaah Anggota', color: '#1890ff' },
  { num: 6, name: 'Approve Ketua', color: '#1890ff' },
  { num: 7, name: 'Kabag PEHK', color: '#1890ff' },
  { num: 8, name: 'TU Setditjen', color: '#1890ff' },
  { num: 9, name: 'Admin TU Penomoran ND', color: '#1890ff' },
  { num: 10, name: 'Dirjen PS', color: '#1890ff' },
  { num: 11, name: 'Admin TU Penomoran SK', color: '#1890ff' },
  { num: 12, name: 'Distribusi SK', color: '#1890ff' },
  { num: 13, name: 'Finalisasi Anggota', color: '#1890ff' },
  { num: 14, name: 'Kabag PEHK TTD Salinan', color: '#1890ff' },
  { num: 15, name: 'Arsip & Scan', color: '#52c41a' },
];

export default function SkPerhutananPage() {
  const { user } = useAppSelector((state) => state.auth);
  const screens = useBreakpoint();
  const [data, setData] = useState<SKPerhutanan[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [detailVisible, setDetailVisible] = useState(false);
  const [processModalVisible, setProcessModalVisible] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [selectedSK, setSelectedSK] = useState<SKPerhutanan | null>(null);
  const [form] = Form.useForm();
  const [processForm] = Form.useForm();
  const [searchText, setSearchText] = useState('');
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0 });
  const [statusFilter, setStatusFilter] = useState<string | undefined>();
  const [unitFilter, setUnitFilter] = useState<string | undefined>();
  const [provinsiList, setProvinsiList] = useState<Provinsi[]>([]);
  const [kabkotaList, setKabkotaList] = useState<Kabkota[]>([]);
  const [skemaList, setSkemaList] = useState<Skema[]>([]);
  const [selectedProvinsi, setSelectedProvinsi] = useState<string | undefined>();
  const [kelompokPSList, setKelompokPSList] = useState<KelompokPS[]>([]);
  const [anggotaUsers, setAnggotaUsers] = useState<{ id: number; fullname: string }[]>([]);

  useEffect(() => {
    const controller = new AbortController();
    fetchData(controller.signal);
    fetchMasterData(controller.signal);
    return () => controller.abort();
  }, [pagination.page, pagination.limit, statusFilter, unitFilter, user]);

  const fetchMasterData = async (signal?: AbortSignal) => {
    try {
      const [provRes, skmRes] = await Promise.all([
        provinsiApi.getAll(),
        skemaApi.getAll(),
      ]);
      setProvinsiList(provRes.data.data);
      setSkemaList(skmRes.data.data);
    } catch { /* ignore */ }
  };

  const fetchKabkotaByProvinsi = async (proid: string) => {
    try {
      const res = await kabkotaApi.getAll(undefined, proid);
      setKabkotaList(res.data.data);
    } catch { /* ignore */ }
  };

  const fetchKelompokPSByParams = async (provId: string, kabId: string, skema: string | number) => {
    try {
      const data = await externalApi.getKelompokPS(provId, kabId, skema);
      setKelompokPSList(data || []);
    } catch {
      setKelompokPSList([]);
    }
  };

  const fetchData = useCallback(async (signal?: AbortSignal) => {
    setLoading(true);
    try {
      // Get user's primary jabatan_code (first one if multiple)
      const userJabatan = user?.jabatan_codes?.[0];
      console.log('[DEBUG] User jabatan_codes:', user?.jabatan_codes);
      console.log('[DEBUG] Using jabatan_code:', userJabatan);

      const res = await skPerhutananApi.getAll({
        page: pagination.page,
        limit: pagination.limit,
        search: searchText || undefined,
        status: statusFilter,
        unit_pengusul: unitFilter,
        jabatan_code: userJabatan,
        userId: user?.id,
      });
      console.log('[DEBUG] API Response:', res.data);
      if (signal?.aborted) return;
      setData(res.data.data || []);
      setPagination((prev) => ({ ...prev, total: res.data.pagination?.total || 0 }));
    } catch (error: any) {
      if (error.name === 'CanceledError' || error?.response?.status === 0) return;
      // Don't show error when data is empty - just show empty table
      setData([]);
      setPagination((prev) => ({ ...prev, total: 0 }));
    } finally {
      setLoading(false);
    }
  }, [user, pagination.page, pagination.limit, searchText, statusFilter, unitFilter]);

  const handleAdd = () => {
    setEditingId(null);
    setSelectedProvinsi(undefined);
    setKabkotaList([]);
    setKelompokPSList([]);
    form.resetFields();
    form.setFieldsValue({
      tanggal_terima: dayjs(),
      unit_pengusul: 'PKPS',
    });
    setModalVisible(true);
  };

  const handleEdit = (record: SKPerhutanan) => {
    if (record.status !== 'DRAFT') {
      message.warning('Hanya SK Draft yang bisa diedit');
      return;
    }
    setEditingId(record.id);
    const provId = record.provinsi;
    setSelectedProvinsi(provId);
    setKelompokPSList([]);
    if (provId) fetchKabkotaByProvinsi(provId);
    if (provId && record.kabupaten && record.skema) {
      fetchKelompokPSByParams(provId, record.kabupaten, record.skema);
    }
    form.setFieldsValue({
      nomor_surat: record.nomor_surat,
      tanggal_surat: record.tanggal_surat ? dayjs(record.tanggal_surat) : undefined,
      tanggal_terima: dayjs(record.tanggal_terima),
      unit_pengusul: record.unit_pengusul,
      perihal: record.perihal,
      tujuan_surat: record.tujuan_surat,
      penandatangan: record.penandatangan,
      provinsi: provId,
      kabupaten: record.kabupaten,
      kecamatan: record.kecamatan,
      desa: record.desa,
      skema: Number(record.skema) || record.skema,
      kelompok_ps: record.kelompok_ps,
      luas: record.luas,
      jml_kk: record.jml_kk,
    });
    setModalVisible(true);
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      const submitData = {
        ...values,
        skema: values.skema ? String(values.skema) : undefined,
        tanggal_terima: values.tanggal_terima.format('YYYY-MM-DD'),
        tanggal_surat: values.tanggal_surat?.format('YYYY-MM-DD'),
        kelompok_ps: Array.isArray(values.kelompok_ps) ? values.kelompok_ps[values.kelompok_ps.length - 1] : values.kelompok_ps,
      };

      if (editingId) {
        await skPerhutananApi.update(editingId, submitData);
        message.success('SK berhasil diupdate');
      } else {
        await skPerhutananApi.create(submitData);
        message.success('SK berhasil dibuat');
      }
      setModalVisible(false);
      fetchData();
    } catch (error: any) {
      message.error(error?.response?.data?.message || 'Gagal menyimpan SK');
    }
  };

  const handleView = async (record: SKPerhutanan) => {
    try {
      const res = await skPerhutananApi.getById(record.id);
      const skData = res.data.data;
      setSelectedSK(skData);
      setDetailVisible(true);

      // Fetch kabkota if provinsi is set
      if (skData.provinsi) {
        fetchKabkotaByProvinsi(skData.provinsi);
      }

      // Fetch users for distribusi step
      if (skData.current_step === 4) {
        const usersRes = await skPerhutananApi.getUsersByJabatan('ANGGOTA_POKJA_HUKUM');
        setAnggotaUsers(usersRes.data.data || []);
      }
    } catch (error) {
      message.error('Gagal memuat detail SK');
    }
  };

  const handleProcess = async () => {
    if (!selectedSK) return;
    try {
      const values = await processForm.validateFields();
      await skPerhutananApi.processStep(selectedSK.id, {
        catatan: values.catatan,
        kesimpulan: values.kesimpulan,
        assignee_id: values.assignee_id,
      });
      message.success('Step berhasil diproses');
      setProcessModalVisible(false);
      processForm.resetFields();
      setAnggotaUsers([]);
      // Refresh detail
      const res = await skPerhutananApi.getById(selectedSK.id);
      setSelectedSK(res.data.data);
    } catch (error: any) {
      message.error(error?.response?.data?.message || 'Gagal memproses');
    }
  };

  const handleSubmitWorkflow = async (record: SKPerhutanan) => {
    try {
      await skPerhutananApi.submit(record.id);
      message.success('SK berhasil disubmit ke workflow');
      fetchData();
    } catch (error: any) {
      message.error(error?.response?.data?.message || 'Gagal submit');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'DRAFT': return 'default';
      case 'IN_PROGRESS': return 'processing';
      case 'WAITING_REVISION': return 'warning';
      case 'APPROVED': return 'success';
      case 'SIGNED': return 'success';
      case 'COMPLETED': return 'success';
      default: return 'default';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'DRAFT': return 'Draft';
      case 'IN_PROGRESS': return 'Dalam Proses';
      case 'WAITING_REVISION': return 'Menunggu Revisi';
      case 'APPROVED': return 'Disetujui';
      case 'SIGNED': return 'Ditandatangani';
      case 'COMPLETED': return 'Selesai';
      default: return status;
    }
  };

  const getStepName = (stepNum: number) => {
    const step = WORKFLOW_STEPS.find(s => s.num === stepNum);
    return step?.name || `Step ${stepNum}`;
  };

  const getProvinsiName = (proid: string) => {
    const prov = provinsiList.find(p => p.proid === proid);
    return prov?.provinsi || proid;
  };

  const getKabkotaName = (kabid: string) => {
    const kab = kabkotaList.find(k => k.kabid === kabid);
    return kab?.kabkota || kabid;
  };

  const getSkemaName = (skemaId: string | number) => {
    const skema = skemaList.find(s => String(s.id_skema) === String(skemaId));
    return skema?.nama_skema || skemaId;
  };

  const isOverdue = (deadline: string, status: string) => {
    if (status === 'COMPLETED') return false;
    return dayjs(deadline).isBefore(dayjs());
  };

  const columns: ColumnsType<SKPerhutanan> = [
    {
      title: 'No',
      key: 'no',
      width: screens.xs ? 50 : 60,
      render: (_, __, index) => (pagination.page - 1) * pagination.limit + index + 1,
    },
    {
      title: 'Nomor Surat',
      dataIndex: 'nomor_surat',
      key: 'nomor_surat',
      render: (text) => text || '-',
      responsive: ['md'],
    },
    {
      title: 'Perihal',
      dataIndex: 'perihal',
      key: 'perihal',
      ellipsis: true,
    },
    {
      title: 'Unit',
      dataIndex: 'unit_pengusul',
      key: 'unit_pengusul',
      width: 100,
      responsive: ['sm'],
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: screens.xs ? 100 : 130,
      render: (status) => (
        <Tag color={getStatusColor(status)}>{getStatusText(status)}</Tag>
      ),
    },
    {
      title: 'Tahap',
      dataIndex: 'current_step',
      key: 'current_step',
      width: 140,
      responsive: ['md'],
      render: (step) => getStepName(step),
    },
    {
      title: 'Deadline',
      dataIndex: 'tanggal_deadline',
      key: 'tanggal_deadline',
      width: screens.xs ? 90 : 110,
      responsive: ['lg'],
      render: (deadline, record) => (
        <Space size={4}>
          {isOverdue(deadline, record.status) && (
            <WarningOutlined style={{ color: '#ff4d4f' }} />
          )}
          {dayjs(deadline).format('DD/MM/YY')}
        </Space>
      ),
    },
    {
      title: 'Aksi',
      key: 'action',
      width: screens.xs ? 100 : 180,
      fixed: screens.xs ? 'right' : undefined,
      render: (_, record) => {
        const items: { key: string; label: string; onClick: () => void }[] = [
          { key: 'view', label: 'Detail', onClick: () => handleView(record) },
        ];
        if (record.status === 'DRAFT') {
          items.push(
            { key: 'edit', label: 'Edit', onClick: () => handleEdit(record) },
            { key: 'submit', label: 'Submit', onClick: () => handleSubmitWorkflow(record) }
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

  return (
    <div>
      <Card
        title="SK Perhutanan Sosial"
        extra={
          <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
            Input SK Baru
          </Button>
        }
      >
        <Row gutter={[8, 8]} style={{ marginBottom: 16 }}>
          <Col xs={24} sm={12} md={8}>
            <Input
              placeholder="Cari..."
              prefix={<SearchOutlined />}
              value={searchText}
              onChange={(e) => {
                setSearchText(e.target.value);
                setPagination({ ...pagination, page: 1 });
              }}
              onPressEnter={() => fetchData()}
              allowClear
            />
          </Col>
          <Col xs={12} sm={6} md={4}>
            <Select
              placeholder="Status"
              allowClear
              style={{ width: '100%' }}
              onChange={(val) => setStatusFilter(val)}
              options={[
                { label: 'Draft', value: 'DRAFT' },
                { label: 'Proses', value: 'IN_PROGRESS' },
                { label: 'Revisi', value: 'WAITING_REVISION' },
                { label: 'Selesai', value: 'COMPLETED' },
              ]}
            />
          </Col>
          <Col xs={12} sm={6} md={4}>
            <Select
              placeholder="Unit"
              allowClear
              style={{ width: '100%' }}
              onChange={(val) => setUnitFilter(val)}
              options={[
                { label: 'PKPS', value: 'PKPS' },
                { label: 'PKTHA', value: 'PKTHA' },
              ]}
            />
          </Col>
        </Row>

        <Table
          columns={columns}
          dataSource={data}
          rowKey="id"
          loading={loading}
          scroll={{ x: 600 }}
          pagination={{
            current: pagination.page,
            pageSize: pagination.limit,
            total: pagination.total,
            showSizeChanger: true,
            showTotal: (total) => `Total ${total} SK`,
            onChange: (page, limit) => setPagination({ ...pagination, page, limit }),
          }}
        />
      </Card>

      {/* Add/Edit Modal */}
      <Modal
        title={editingId ? 'Edit SK' : 'Input SK Baru'}
        open={modalVisible}
        onOk={handleSubmit}
        onCancel={() => setModalVisible(false)}
        okText="Simpan"
        cancelText="Batal"
        width={screens.md ? 800 : '95%'}
        styles={{ body: { maxHeight: '70vh', overflow: 'auto' } }}
      >
        <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
          <Divider />
          <Title level={5}>Data Lokasi</Title>

          <Row gutter={[16, 0]}>
            <Col xs={24} sm={8}>
              <Form.Item name="provinsi" label="Provinsi">
                <Select
                  allowClear showSearch optionFilterProp="label"
                  placeholder="Pilih Provinsi"
                  onChange={(val) => {
                    setSelectedProvinsi(val);
                    form.setFieldValue('kabupaten', undefined);
                    setKabkotaList([]);
                    if (val) fetchKabkotaByProvinsi(val);
                  }}
                  options={provinsiList.map(p => ({ label: p.provinsi, value: p.proid }))}
                />
              </Form.Item>
            </Col>
            <Col xs={24} sm={8}>
              <Form.Item name="kabupaten" label="Kabupaten">
                <Select
                  allowClear showSearch optionFilterProp="label"
                  placeholder="Pilih Kabupaten/Kota"
                  disabled={!selectedProvinsi}
                  options={kabkotaList.map(k => ({ label: k.kabkota, value: k.kabid }))}
                />
              </Form.Item>
            </Col>
            <Col xs={24} sm={8}>
              <Form.Item name="skema" label="Skema">
                <Select
                  allowClear showSearch optionFilterProp="label"
                  placeholder="Pilih Skema"
                  onChange={(val) => {
                    form.setFieldValue('kelompok_ps', undefined);
                    setKelompokPSList([]);
                    const provId = form.getFieldValue('provinsi');
                    const kabId = form.getFieldValue('kabupaten');
                    if (provId && kabId && val) fetchKelompokPSByParams(provId, kabId, val);
                  }}
                  options={skemaList.map(s => ({ label: s.nama_skema, value: s.id_skema }))}
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={[16, 0]}>
            <Col xs={24} sm={12}>
              <Form.Item
                name="kelompok_ps"
                label="Kelompok PS"
                extra={kelompokPSList.length === 0 ? 'Tidak ada data di server. Silakan ketik manual.' : undefined}
              >
                <Select
                  showSearch
                  mode="tags"
                  optionFilterProp="label"
                  placeholder="Pilih atau ketik manual"
                  onSelect={(val) => {
                    const selected = kelompokPSList.find(k => k.id_us === val);
                    if (selected) {
                      form.setFieldsValue({
                        kelompok_ps: selected.nama_kelompok,
                        kecamatan: selected.kecamatan,
                        desa: selected.desa,
                        luas: Number(selected.luas) || undefined,
                        jml_kk: Number(selected.jml_kk) || undefined,
                        nomor_surat: selected.no_nd || undefined,
                        tanggal_surat: selected.tgl_nd ? dayjs(selected.tgl_nd) : undefined,
                      });
                    }
                  }}
                  options={kelompokPSList.map((k) => ({
                    label: k.nama_kelompok,
                    value: k.id_us,
                  }))}
                />
              </Form.Item>
            </Col>
            <Col xs={12} sm={6}>
              <Form.Item name="kecamatan" label="Kecamatan">
                <Input placeholder="Kecamatan" />
              </Form.Item>
            </Col>
            <Col xs={12} sm={6}>
              <Form.Item name="desa" label="Desa">
                <Input placeholder="Desa" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={[16, 0]}>
            <Col xs={12} sm={8}>
              <Form.Item name="luas" label="Luas (Ha)">
                <InputNumber style={{ width: '100%' }} placeholder="Luas" />
              </Form.Item>
            </Col>
            <Col xs={12} sm={8}>
              <Form.Item name="jml_kk" label="Jumlah KK">
                <InputNumber style={{ width: '100%' }} placeholder="Jumlah KK" />
              </Form.Item>
            </Col>
          </Row>

          <Divider />
          <Title level={5}>Data Surat</Title>

          <Row gutter={[16, 0]}>
            <Col xs={24} sm={8}>
              <Form.Item name="nomor_surat" label="Nomor ND">
                <Input placeholder="Contoh: 123/ABC/2024" />
              </Form.Item>
            </Col>
            <Col xs={24} sm={8}>
              <Form.Item name="tanggal_surat" label="Tanggal ND">
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col xs={24} sm={8}>
              <Form.Item
                name="tanggal_terima"
                label="Tanggal Terima"
                rules={[{ required: true, message: 'Harus diisi' }]}
              >
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={[16, 0]}>
            <Col xs={24} sm={8}>
              <Form.Item
                name="unit_pengusul"
                label="Unit Pengusul"
                rules={[{ required: true, message: 'Harus diisi' }]}
              >
                <Select
                  options={[
                    { label: 'PKPS', value: 'PKPS' },
                    { label: 'PKTHA', value: 'PKTHA' },
                  ]}
                />
              </Form.Item>
            </Col>
            <Col xs={24} sm={8}>
              <Form.Item name="penandatangan" label="Penandatangan">
                <Input placeholder="Dirjen PS" />
              </Form.Item>
            </Col>
            <Col xs={24} sm={8}>
              <Form.Item name="konseptor" label="Konseptor">
                <Input placeholder="Nama Konseptor" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="perihal"
            label="Perihal"
            rules={[{ required: true, message: 'Harus diisi' }]}
          >
            <Input placeholder="Perihal surat" />
          </Form.Item>

          <Form.Item name="tujuan_surat" label="Tujuan Surat">
            <Input placeholder="Tujuan surat" />
          </Form.Item>

          
        </Form>
      </Modal>

      {/* Detail Modal */}
      <Modal
        title={
          <Space>
            <FileTextOutlined />
            Detail Proses SK - {selectedSK?.nomor_surat || selectedSK?.nomor_sk || '-'}
          </Space>
        }
        open={detailVisible}
        onCancel={() => {
          setDetailVisible(false);
          setSelectedSK(null);
          setProcessModalVisible(false);
        }}
        footer={[
          (selectedSK?.status === 'IN_PROGRESS' || selectedSK?.status === 'WAITING_REVISION') && selectedSK?.current_step !== 15 && (
            <Button
              key="process"
              type="primary"
              icon={<CheckOutlined />}
              onClick={() => setProcessModalVisible(true)}
            >
              Proses Workflow
            </Button>
          ),
          <Button key="close" onClick={() => setDetailVisible(false)}>
            Tutup
          </Button>,
        ]}
        width={900}
      >
        {selectedSK && (
          <Tabs
            items={[
              {
                key: 'info',
                label: 'Informasi',
                children: (
                  <div>
                    {/* Data Lokasi */}
                    <Title level={5} style={{ marginBottom: 12 }}>Data Lokasi</Title>
                    <Row gutter={[16, 8]}>
                      <Col xs={24} sm={12}>
                        <Text type="secondary">Provinsi:</Text>
                        <div>{selectedSK.provinsi ? getProvinsiName(selectedSK.provinsi) : '-'}</div>
                      </Col>
                      <Col xs={24} sm={12}>
                        <Text type="secondary">Kabupaten/Kota:</Text>
                        <div>{selectedSK.kabupaten ? getKabkotaName(selectedSK.kabupaten) : '-'}</div>
                      </Col>
                      <Col xs={24} sm={12}>
                        <Text type="secondary">Kecamatan:</Text>
                        <div>{selectedSK.kecamatan || '-'}</div>
                      </Col>
                      <Col xs={24} sm={12}>
                        <Text type="secondary">Desa:</Text>
                        <div>{selectedSK.desa || '-'}</div>
                      </Col>
                      <Col xs={24} sm={12}>
                        <Text type="secondary">Skema:</Text>
                        <div>{selectedSK.skema ? getSkemaName(selectedSK.skema) : '-'}</div>
                      </Col>
                      <Col xs={24} sm={12}>
                        <Text type="secondary">Kelompok PS:</Text>
                        <div>{selectedSK.kelompok_ps || '-'}</div>
                      </Col>
                      <Col xs={24} sm={8}>
                        <Text type="secondary">Luas (Ha):</Text>
                        <div>{selectedSK.luas ? `${selectedSK.luas} Ha` : '-'}</div>
                      </Col>
                      <Col xs={24} sm={8}>
                        <Text type="secondary">Jumlah KK:</Text>
                        <div>{selectedSK.jml_kk || '-'}</div>
                      </Col>
                    </Row>

                    <Divider />

                    {/* Data Surat */}
                    <Title level={5} style={{ marginBottom: 12 }}>Data Surat</Title>
                    <Row gutter={[16, 8]}>
                      <Col xs={24} sm={12}>
                        <Text type="secondary">Nomor Surat/ND:</Text>
                        <div>{selectedSK.nomor_surat || '-'}</div>
                      </Col>
                      <Col xs={24} sm={12}>
                        <Text type="secondary">Tanggal Surat/ND:</Text>
                        <div>{selectedSK.tanggal_surat ? dayjs(selectedSK.tanggal_surat).format('DD/MM/YYYY') : '-'}</div>
                      </Col>
                      <Col xs={24} sm={12}>
                        <Text type="secondary">Unit Pengusul:</Text>
                        <div>{selectedSK.unit_pengusul}</div>
                      </Col>
                      <Col xs={24} sm={12}>
                        <Text type="secondary">Tanggal Terima:</Text>
                        <div>{dayjs(selectedSK.tanggal_terima).format('DD/MM/YYYY')}</div>
                      </Col>
                      <Col xs={24} sm={12}>
                        <Text type="secondary">Deadline:</Text>
                        <div>
                          <Space>
                            {dayjs(selectedSK.tanggal_deadline).format('DD/MM/YYYY')}
                            {isOverdue(selectedSK.tanggal_deadline, selectedSK.status) && (
                              <Tag color="error">LEWAT DEADLINE</Tag>
                            )}
                          </Space>
                        </div>
                      </Col>
                      <Col xs={24} sm={12}>
                        <Text type="secondary">Status:</Text>
                        <div>
                          <Tag color={getStatusColor(selectedSK.status)}>
                            {getStatusText(selectedSK.status)}
                          </Tag>
                          <span style={{ marginLeft: 8 }}>{getStepName(selectedSK.current_step)}</span>
                        </div>
                      </Col>
                      <Col xs={24}>
                        <Text type="secondary">Perihal:</Text>
                        <div>{selectedSK.perihal}</div>
                      </Col>
                      <Col xs={24}>
                        <Text type="secondary">Tujuan Surat:</Text>
                        <div>{selectedSK.tujuan_surat || '-'}</div>
                      </Col>
                      <Col xs={24} sm={12}>
                        <Text type="secondary">Penandatangan:</Text>
                        <div>{selectedSK.penandatangan || '-'}</div>
                      </Col>
                      <Col xs={24} sm={12}>
                        <Text type="secondary">Konseptor:</Text>
                        <div>{selectedSK.creator?.fullname || '-'}</div>
                      </Col>
                    </Row>

                    {selectedSK.nomor_nd_sk && (
                      <>
                        <Divider />
                        <Title level={5} style={{ marginBottom: 12 }}>Nomor ND & SK</Title>
                        <Row gutter={[16, 8]}>
                          <Col xs={24} sm={12}>
                            <Text type="secondary">Nomor ND:</Text>
                            <div>{selectedSK.nomor_nd_sk}</div>
                          </Col>
                          <Col xs={24} sm={12}>
                            <Text type="secondary">Tanggal ND:</Text>
                            <div>{selectedSK.tanggal_nd_sk ? dayjs(selectedSK.tanggal_nd_sk).format('DD/MM/YYYY') : '-'}</div>
                          </Col>
                          <Col xs={24} sm={12}>
                            <Text type="secondary">Nomor SK:</Text>
                            <div>{selectedSK.nomor_sk || '-'}</div>
                          </Col>
                          <Col xs={24} sm={12}>
                            <Text type="secondary">Tanggal SK:</Text>
                            <div>{selectedSK.tanggal_sk ? dayjs(selectedSK.tanggal_sk).format('DD/MM/YYYY') : '-'}</div>
                          </Col>
                        </Row>
                      </>
                    )}

                    {/* Riwayat Catatan - Diurutkan berdasarkan waktu */}
                    {selectedSK.catatan_history && selectedSK.catatan_history.length > 0 && (
                      <>
                        <Divider />
                        <Title level={5} style={{ marginBottom: 12 }}>Riwayat Catatan</Title>
                        <Timeline
                          items={selectedSK.catatan_history.map((c: any) => ({
                            color: c.kesimpulan === 'DISETUJUI' ? 'green' : c.kesimpulan === 'PERBAIKAN' || c.kesimpulan === 'PERBAIKAN_DIREKTORAT' ? 'orange' : 'blue',
                            children: (
                              <div>
                                <Space>
                                  <Tag color={c.kesimpulan === 'DISETUJUI' ? 'success' : c.kesimpulan === 'PERBAIKAN' || c.kesimpulan === 'PERBAIKAN_DIREKTORAT' ? 'warning' : 'processing'}>
                                    {c.step_name || `Step ${c.step_num}`}
                                  </Tag>
                                  <Text type="secondary" style={{ fontSize: 12 }}>
                                    {dayjs(c.created_at).format('DD/MM/YYYY HH:mm')}
                                  </Text>
                                </Space>
                                <div style={{ marginTop: 4, fontWeight: 500, color: '#1890ff' }}>
                                  {c.user?.fullname || 'Unknown'}
                                </div>
                                <div style={{ marginTop: 4, fontStyle: 'italic', color: '#666' }}>
                                  "{c.catatan}"
                                </div>
                              </div>
                            ),
                          }))}
                        />
                      </>
                    )}
                  </div>
                ),
              },
              {
                key: 'workflow',
                label: 'Workflow',
                children: (
                  <div style={{ padding: '16px 0' }}>
                    {/* Vertical Steps */}
                    <Steps
                      current={selectedSK.current_step - 1}
                      direction="vertical"
                      size="small"
                      items={WORKFLOW_STEPS.map((step) => ({
                        title: step.name,
                        status:
                          step.num < selectedSK.current_step
                            ? 'finish'
                            : step.num === selectedSK.current_step
                            ? 'process'
                            : 'wait',
                      }))}
                    />

                    {/* Current Step Info */}
                    <Card size="small" style={{ marginTop: 24, background: '#f5f5f5' }}>
                      <Row gutter={16} align="middle">
                        <Col>
                          <Tag color="processing" style={{ fontSize: 14, padding: '4px 12px' }}>
                            Step {selectedSK.current_step}
                          </Tag>
                        </Col>
                        <Col>
                          <Text strong>{WORKFLOW_STEPS.find(s => s.num === selectedSK.current_step)?.name}</Text>
                        </Col>
                      </Row>
                    </Card>

                    {/* Detail per Step - Tabel Riwayat */}
                    <div style={{ marginTop: 24 }}>
                      <Title level={5}>Riwayat Proses</Title>
                      <div style={{ overflowX: 'auto' }}>
                        <Table
                          dataSource={selectedSK.stages?.filter(s => s.is_completed).map((stage, idx) => ({
                            ...stage,
                            key: stage.id,
                            no: idx + 1,
                          }))}
                          columns={[
                            {
                              title: 'No',
                              dataIndex: 'no',
                              width: 50,
                              responsive: ['sm'],
                            },
                            {
                              title: 'Tanggal',
                              dataIndex: 'completed_at',
                              width: 140,
                              render: (val: string) => dayjs(val).format('DD/MM/YYYY HH:mm'),
                            },
                            {
                              title: 'User - Jabatan',
                              width: 180,
                              render: (_: any, record: any) => (
                                <div>
                                  <div>{record.completedByUser?.fullname || record.assignee?.fullname || '-'}</div>
                                  <Text type="secondary" style={{ fontSize: 11 }}>
                                    {record.step_name}
                                  </Text>
                                </div>
                              ),
                            },
                            {
                              title: 'Kesimpulan',
                              dataIndex: 'kesimpulan',
                              width: 120,
                              render: (val: string) => {
                                const color = val === 'DISETUJUI' ? 'success' : val === 'PERBAIKAN' || val === 'PERBAIKAN_DIREKTORAT' ? 'warning' : 'default';
                                const label = val === 'DISETUJUI' ? 'OK' : val === 'PERBAIKAN' ? 'Revisi' : val === 'PERBAIKAN_DIREKTORAT' ? 'Perbaikan' : '-';
                                return <Tag color={color}>{label}</Tag>;
                              },
                            },
                            {
                              title: 'Catatan',
                              dataIndex: 'catatan',
                              width: 300,
                              render: (_: any, record: any) => {
                                const catatanList = record.catatan || [];
                                if (catatanList.length === 0) return '-';
                                return (
                                  <div style={{ fontSize: 11, maxHeight: 150, overflowY: 'auto' }}>
                                    {catatanList.map((c: any, idx: number) => (
                                      <div key={c.id || idx} style={{ marginBottom: 6, padding: '4px 8px', background: '#f5f5f5', borderRadius: 4 }}>
                                        <div style={{ fontWeight: 500, color: '#1890ff' }}>
                                          {c.user?.fullname || 'Unknown'}
                                        </div>
                                        <div style={{ color: '#666', fontSize: 10, marginBottom: 2 }}>
                                          {dayjs(c.created_at).format('DD/MM/YYYY HH:mm')}
                                        </div>
                                        <div>{c.catatan}</div>
                                      </div>
                                    ))}
                                  </div>
                                );
                              },
                            },
                          ]}
                          pagination={false}
                          size="small"
                          scroll={{ x: 600 }}
                          locale={{ emptyText: 'Belum ada proses workflow' }}
                        />
                      </div>
                    </div>
                  </div>
                ),
              },
            ]}
          />
        )}
      </Modal>

      {/* Process Modal */}
      <Modal
        title="Proses Workflow"
        open={processModalVisible}
        onOk={handleProcess}
        onCancel={() => {
          setProcessModalVisible(false);
          processForm.resetFields();
          setAnggotaUsers([]);
        }}
        okText="Proses"
        cancelText="Batal"
      >
        <Form form={processForm} layout="vertical" style={{ marginTop: 16 }}>
          {selectedSK?.current_step === 4 && (
            <Form.Item
              name="assignee_id"
              label="Distribusikan Ke"
              rules={[{ required: true, message: 'Harus dipilih' }]}
            >
              <Select
                placeholder="Pilih Anggota Pokja Hukum"
                options={anggotaUsers.map(u => ({ label: u.fullname, value: u.id }))}
              />
            </Form.Item>
          )}

          {selectedSK?.current_step === 5 && (
            <Form.Item
              name="kesimpulan"
              label="Kesimpulan"
              rules={[{ required: true, message: 'Harus dipilih' }]}
            >
              <Select
                options={[
                  { label: 'Lanjut ke tahap berikutnya', value: 'TELAAH_SUBSTANSI' },
                  { label: 'Perbaikan ke Direktorat', value: 'PERBAIKAN_DIREKTORAT' },
                ]}
              />
            </Form.Item>
          )}

          {selectedSK?.current_step === 2 && (
            <Form.Item
              name="kesimpulan"
              label="Kesimpulan"
              initialValue="DISPOSISI"
              rules={[{ required: true, message: 'Harus dipilih' }]}
            >
              <Select
                options={[
                  { label: 'Disposisi', value: 'DISPOSISI' }
                ]}
              />
            </Form.Item>
          )}

          {selectedSK?.current_step === 3 && (
            <Form.Item
              name="kesimpulan"
              label="Kesimpulan"
              initialValue="DISPOSISI"
              rules={[{ required: true, message: 'Harus dipilih' }]}
            >
              <Select
                options={[
                  { label: 'Disposisi', value: 'DISPOSISI' },
                ]}
              />
            </Form.Item>
          )}

          {selectedSK?.current_step === 4 && (
            <Form.Item
              name="kesimpulan"
              label="Kesimpulan"
              initialValue="DISTRIBUSI"
              rules={[{ required: true, message: 'Harus dipilih' }]}
            >
              <Select
                options={[
                  { label: 'Distribusi', value: 'DISTRIBUSI' },
                ]}
              />
            </Form.Item>
          )}

          {selectedSK?.current_step === 6 && (
            <Form.Item
              name="kesimpulan"
              label="Kesimpulan"
              rules={[{ required: true, message: 'Harus dipilih' }]}
            >
              <Select
                options={[
                  { label: 'Disetujui - Lanjut ke tahap berikutnya', value: 'DISETUJUI' },
                  { label: 'Perbaikan ke Drafter', value: 'PERBAIKAN' },
                ]}
              />
            </Form.Item>
          )}

          {selectedSK?.current_step === 7 && (
            <Form.Item
              name="kesimpulan"
              label="Kesimpulan"
              initialValue="DISETUJUI"
              rules={[{ required: true, message: 'Harus dipilih' }]}
            >
              <Select
                options={[
                  { label: 'Disetujui - Lanjut ke tahap berikutnya', value: 'DISETUJUI' },
                  { label: 'Perbaikan ke Drafter', value: 'PERBAIKAN' },
                ]}
              />
            </Form.Item>
          )}

          <Form.Item name="catatan" label="Catatan">
            <Input.TextArea rows={4} placeholder="Masukkan catatan jika ada..." />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}

// Helper components
function Divider() {
  return <AntDivider />;
}
