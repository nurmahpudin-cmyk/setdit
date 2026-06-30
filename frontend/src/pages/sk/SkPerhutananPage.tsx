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
  Card,
  Tag,
  Tabs,
  Timeline,
  Steps,
  DatePicker,
  InputNumber,
  Row,
  Col,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  SendOutlined,
  CheckOutlined,
  CloseOutlined,
  SearchOutlined,
  EyeOutlined,
  WarningOutlined,
  FileTextOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import { skPerhutananApi, SKPerhutanan, SKWorkflowStage } from '../../api/skPerhutanan';
import { provinsiApi, Provinsi } from '../../api/provinsi';
import { kabkotaApi, Kabkota } from '../../api/kabkota';
import { skemaApi, Skema } from '../../api/skema';
import { externalApi, KelompokPS } from '../../api/external';
import { useAppSelector } from '../../hooks/useRedux';

const { TextArea } = Input;

// Workflow steps display configuration
const WORKFLOW_STEPS = [
  { num: 1, name: 'Input Admin TU', color: '#1890ff' },
  { num: 2, name: 'Setditjen PS', color: '#1890ff' },
  { num: 3, name: 'Kabag PEHK', color: '#1890ff' },
  { num: 4, name: 'Ketua Pokja Hukum', color: '#1890ff' },
  { num: 5, name: 'Anggota Pokja', color: '#1890ff' },
  { num: 6, name: 'Ketua Pokja (Approve)', color: '#1890ff' },
  { num: 7, name: 'Kabag PEHK (Telaah)', color: '#1890ff' },
  { num: 8, name: 'TU Setditjen', color: '#1890ff' },
  { num: 9, name: 'Admin TU (ND)', color: '#1890ff' },
  { num: 10, name: 'Dirjen PS (TTD)', color: '#1890ff' },
  { num: 11, name: 'Admin TU (SK)', color: '#1890ff' },
  { num: 12, name: 'Ketua Pokja (Dist)', color: '#1890ff' },
  { num: 13, name: 'Anggota Pokja (Final)', color: '#1890ff' },
  { num: 14, name: 'Kabag PEHK (TTD)', color: '#1890ff' },
  { num: 15, name: 'Arsip & Scan', color: '#52c41a' },
];

export default function SkPerhutananPage() {
  const { user } = useAppSelector((state) => state.auth);
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

  useEffect(() => {
    const controller = new AbortController();
    fetchData(controller.signal);
    fetchMasterData(controller.signal);
    return () => controller.abort();
  }, [pagination.page, pagination.limit, statusFilter, unitFilter]);

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

  const fetchData = async (signal?: AbortSignal) => {
    setLoading(true);
    try {
      const res = await skPerhutananApi.getAll({
        page: pagination.page,
        limit: pagination.limit,
        search: searchText || undefined,
        status: statusFilter,
        unit_pengusul: unitFilter,
      });
      if (signal?.aborted) return;
      setData(res.data.items);
      setPagination((prev) => ({ ...prev, total: res.data.pagination.total }));
    } catch (error: any) {
      if (error.name === 'CanceledError' || error?.response?.status === 0) return;
      message.error('Gagal memuat data SK');
    } finally {
      setLoading(false);
    }
  };

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
      };
      delete submitData.konseptor;

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
      setSelectedSK(res.data);
      setDetailVisible(true);
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
      });
      message.success('Step berhasil diproses');
      setProcessModalVisible(false);
      processForm.resetFields();
      // Refresh detail
      const res = await skPerhutananApi.getById(selectedSK.id);
      setSelectedSK(res.data);
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

  const isOverdue = (deadline: string, status: string) => {
    if (status === 'COMPLETED') return false;
    return dayjs(deadline).isBefore(dayjs());
  };

  const columns: ColumnsType<SKPerhutanan> = [
    {
      title: 'No',
      key: 'no',
      width: 60,
      render: (_, __, index) => (pagination.page - 1) * pagination.limit + index + 1,
    },
    {
      title: 'Nomor Surat',
      dataIndex: 'nomor_surat',
      key: 'nomor_surat',
      render: (text) => text || '-',
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
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 130,
      render: (status) => (
        <Tag color={getStatusColor(status)}>{getStatusText(status)}</Tag>
      ),
    },
    {
      title: 'Tahap',
      dataIndex: 'current_step',
      key: 'current_step',
      width: 80,
      render: (step) => `${step}/15`,
    },
    {
      title: 'Deadline',
      dataIndex: 'tanggal_deadline',
      key: 'tanggal_deadline',
      width: 110,
      render: (deadline, record) => (
        <Space>
          {isOverdue(deadline, record.status) && (
            <WarningOutlined style={{ color: '#ff4d4f' }} />
          )}
          {dayjs(deadline).format('DD/MM/YYYY')}
        </Space>
      ),
    },
    {
      title: 'Aksi',
      key: 'action',
      width: 180,
      render: (_, record) => (
        <Space>
          <Button
            type="link"
            icon={<EyeOutlined />}
            onClick={() => handleView(record)}
          >
            Detail
          </Button>
          {record.status === 'DRAFT' && (
            <>
              <Button
                type="link"
                icon={<EditOutlined />}
                onClick={() => handleEdit(record)}
              />
              <Button
                type="link"
                icon={<SendOutlined />}
                onClick={() => handleSubmitWorkflow(record)}
              />
            </>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div>
      <Card
        title="SK Perhutanan Sosial"
        extra={
          <Space>
            <Select
              placeholder="Filter Status"
              allowClear
              style={{ width: 150 }}
              onChange={(val) => setStatusFilter(val)}
              options={[
                { label: 'Draft', value: 'DRAFT' },
                { label: 'Dalam Proses', value: 'IN_PROGRESS' },
                { label: 'Menunggu Revisi', value: 'WAITING_REVISION' },
                { label: 'Selesai', value: 'COMPLETED' },
              ]}
            />
            <Select
              placeholder="Filter Unit"
              allowClear
              style={{ width: 120 }}
              onChange={(val) => setUnitFilter(val)}
              options={[
                { label: 'PKPS', value: 'PKPS' },
                { label: 'PKTHA', value: 'PKTHA' },
              ]}
            />
            <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
              Input SK Baru
            </Button>
          </Space>
        }
      >
        <div style={{ marginBottom: 16 }}>
          <Input
            placeholder="Cari nomor surat, nomor SK, atau perihal..."
            prefix={<SearchOutlined />}
            value={searchText}
            onChange={(e) => {
              setSearchText(e.target.value);
              setPagination({ ...pagination, page: 1 });
            }}
            onPressEnter={fetchData}
            style={{ width: 350 }}
          />
          <Button style={{ marginLeft: 8 }} onClick={fetchData}>
            Cari
          </Button>
        </div>

        <Table
          columns={columns}
          dataSource={data}
          rowKey="id"
          loading={loading}
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
        width={800}
      >
        <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
          <Divider />
          <Title level={5}>Data Lokasi</Title>

          <Row gutter={16}>
            <Col span={8}>
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
            <Col span={8}>
              <Form.Item name="kabupaten" label="Kabupaten">
                <Select
                  allowClear showSearch optionFilterProp="label"
                  placeholder="Pilih Kabupaten/Kota"
                  disabled={!selectedProvinsi}
                  options={kabkotaList.map(k => ({ label: k.kabkota, value: k.kabid }))}
                />
              </Form.Item>
            </Col>
            <Col span={8}>
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

          <Row gutter={16}>
            <Col span={12}>
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
            <Col span={6}>
              <Form.Item name="kecamatan" label="Kecamatan">
                <Input placeholder="Kecamatan" />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item name="desa" label="Desa">
                <Input placeholder="Desa" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={8}>
              <Form.Item name="luas" label="Luas (Ha)">
                <InputNumber style={{ width: '100%' }} placeholder="Luas" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="jml_kk" label="Jumlah KK">
                <InputNumber style={{ width: '100%' }} placeholder="Jumlah KK" />
              </Form.Item>
            </Col>
          </Row>

          <Divider />
          <Title level={5}>Data Surat</Title>
          
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item name="nomor_surat" label="Nomor ND">
                <Input placeholder="Contoh: 123/ABC/2024" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="tanggal_surat" label="Tanggal ND">
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="tanggal_terima"
                label="Tanggal Terima"
                rules={[{ required: true, message: 'Harus diisi' }]}
              >
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>
          
          <Row gutter={16}>
            <Col span={8}>
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
            <Col span={8}>
              <Form.Item name="penandatangan" label="Penandatangan">
                <Input placeholder="Dirjen PS" />
              </Form.Item>
            </Col>
            <Col span={8}>
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
            Detail SK - {selectedSK?.nomor_surat || selectedSK?.nomor_sk || '-'}
          </Space>
        }
        open={detailVisible}
        onCancel={() => {
          setDetailVisible(false);
          setSelectedSK(null);
          setProcessModalVisible(false);
        }}
        footer={[
          selectedSK?.status === 'IN_PROGRESS' && selectedSK?.current_step !== 15 && (
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
                    <Row gutter={[16, 16]}>
                      <Col span={12}>
                        <b>Nomor Surat:</b> {selectedSK.nomor_surat || '-'}
                      </Col>
                      <Col span={12}>
                        <b>Nomor SK:</b> {selectedSK.nomor_sk || '-'}
                      </Col>
                      <Col span={12}>
                        <b>Tanggal Surat:</b>{' '}
                        {selectedSK.tanggal_surat
                          ? dayjs(selectedSK.tanggal_surat).format('DD/MM/YYYY')
                          : '-'}
                      </Col>
                      <Col span={12}>
                        <b>Tanggal SK:</b>{' '}
                        {selectedSK.tanggal_sk
                          ? dayjs(selectedSK.tanggal_sk).format('DD/MM/YYYY')
                          : '-'}
                      </Col>
                      <Col span={12}>
                        <b>Unit Pengusul:</b> {selectedSK.unit_pengusul}
                      </Col>
                      <Col span={12}>
                        <b>Status:</b>{' '}
                        <Tag color={getStatusColor(selectedSK.status)}>
                          {getStatusText(selectedSK.status)}
                        </Tag>
                      </Col>
                      <Col span={24}>
                        <b>Perihal:</b> {selectedSK.perihal}
                      </Col>
                      <Col span={24}>
                        <b>Tujuan Surat:</b> {selectedSK.tujuan_surat}
                      </Col>
                      <Col span={12}>
                        <b>Tanggal Terima:</b>{' '}
                        {dayjs(selectedSK.tanggal_terima).format('DD/MM/YYYY')}
                      </Col>
                      <Col span={12}>
                        <b>Deadline:</b>{' '}
                        <Space>
                          {dayjs(selectedSK.tanggal_deadline).format('DD/MM/YYYY')}
                          {isOverdue(selectedSK.tanggal_deadline, selectedSK.status) && (
                            <Tag color="error">LEWAT</Tag>
                          )}
                        </Space>
                      </Col>
                      <Col span={12}>
                        <b>Konseptor:</b> {selectedSK.creator?.fullname || '-'}
                      </Col>
                    </Row>

                    {selectedSK.nomor_nd_sk && (
                      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
                        <Col span={12}>
                          <b>Nomor ND:</b> {selectedSK.nomor_nd_sk}
                        </Col>
                        <Col span={12}>
                          <b>Tanggal ND:</b>{' '}
                          {selectedSK.tanggal_nd_sk
                            ? dayjs(selectedSK.tanggal_nd_sk).format('DD/MM/YYYY')
                            : '-'}
                        </Col>
                      </Row>
                    )}
                  </div>
                ),
              },
              {
                key: 'workflow',
                label: 'Workflow',
                children: (
                  <div>
                    <Steps
                      current={selectedSK.current_step - 1}
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

                    {selectedSK.stages && selectedSK.stages.length > 0 && (
                      <div style={{ marginTop: 24 }}>
                        <h4>Riwayat Proses:</h4>
                        <Timeline
                          items={selectedSK.stages
                            .filter((s) => s.is_completed)
                            .map((stage) => ({
                              color: 'green',
                              children: (
                                <div>
                                  <b>{stage.step_name}</b>
                                  <br />
                                  <Space>
                                    <span>
                                      {dayjs(stage.completed_at).format('DD/MM/YYYY HH:mm')}
                                    </span>
                                    {stage.kesimpulan && (
                                      <Tag
                                        color={stage.kesimpulan === 'DISETUJUI' ? 'green' : 'orange'}
                                      >
                                        {stage.kesimpulan}
                                      </Tag>
                                    )}
                                  </Space>
                                  {stage.catatan && (
                                    <div style={{ marginTop: 4, fontStyle: 'italic' }}>
                                      "{stage.catatan}"
                                    </div>
                                  )}
                                </div>
                              ),
                            }))}
                        />
                      </div>
                    )}
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
        }}
        okText="Proses"
        cancelText="Batal"
      >
        <Form form={processForm} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item
            name="kesimpulan"
            label="Kesimpulan"
            rules={[{ required: true, message: 'Harus dipilih' }]}
          >
            <Select
              options={[
                { label: 'DISETUJUI - Lanjut ke tahap berikutnya', value: 'DISETUJUI' },
                { label: 'PERBAIKAN - Kembalikan ke Anggota Pokja', value: 'PERBAIKAN' },
              ]}
            />
          </Form.Item>

          <Form.Item name="catatan" label="Catatan">
            <TextArea rows={4} placeholder="Masukkan catatan jika ada..." />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}

// Helper components
function Divider() {
  return <div style={{ height: 1, background: '#f0f0f0', margin: '16px 0' }} />;
}

function Title({ level, children }: { level: 1 | 2 | 3 | 4 | 5; children: React.ReactNode }) {
  const Tag = `h${level}` as keyof JSX.IntrinsicElements;
  return <Tag style={{ margin: '8px 0' }}>{children}</Tag>;
}
