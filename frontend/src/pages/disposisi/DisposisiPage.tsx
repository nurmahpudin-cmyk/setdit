import React, { useState, useEffect } from 'react';
import {
  Table, Button, Input, Select, Space, Tag, Modal, Form, DatePicker,
  Steps, Timeline, Card, Typography, Badge, message, Popconfirm, Descriptions
} from 'antd';
import {
  PlusOutlined, SearchOutlined, EyeOutlined, CheckOutlined, SendOutlined
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import { disposisiApi, DISPOSISI_STEP_LABELS, DISPOSISI_STATUS_LABELS, DISPOSISI_STATUS_COLORS, JenisSurat } from '../../api/disposisi';
import type { Disposisi, DisposisiWorkflow } from '../../api/disposisi';
import { useAppSelector } from '../../hooks/useRedux';

const { Text, Title } = Typography;

const DisposisiPage: React.FC = () => {
  console.log('>>> DisposisiPage RENDERING');
  const [data, setData] = useState<Disposisi[]>([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 });
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState<string | undefined>();
  const [unitFilter, setUnitFilter] = useState<string | undefined>();
  const [jenisSuratFilter, setJenisSuratFilter] = useState<string | undefined>();

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isProcessModalOpen, setIsProcessModalOpen] = useState(false);
  const [isTLModalOpen, setIsTLModalOpen] = useState(false);
  const [selectedDisposisi, setSelectedDisposisi] = useState<Disposisi | null>(null);
  const [selectedWorkflow, setSelectedWorkflow] = useState<DisposisiWorkflow | null>(null);

  const [form] = Form.useForm();
  const [processForm] = Form.useForm();
  const [tlForm] = Form.useForm();
  const [units, setUnits] = useState<{ id: number; name: string; code: string }[]>([]);
  const [jenisSuratList, setJenisSuratList] = useState<JenisSurat[]>([]);

  const user = useAppSelector((state) => state.auth.user);

  useEffect(() => {
    fetchData();
    fetchUnits();
    fetchJenisSurat();
  }, [pagination.current, pagination.pageSize, statusFilter, unitFilter, jenisSuratFilter]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const response = await disposisiApi.getAll({
        page: pagination.current,
        limit: pagination.pageSize,
        search: searchText || undefined,
        status: statusFilter,
        unit_tujuan: unitFilter,
        jenis_surat_id: jenisSuratFilter,
        jabatan_code: user?.jabatan_codes?.[0],
      });
      setData(response.data.data);
      setPagination(prev => ({
        ...prev,
        total: response.data.pagination?.total || 0,
      }));
    } catch (error) {
      message.error('Gagal mengambil data');
    } finally {
      setLoading(false);
    }
  };

  const fetchUnits = async () => {
    try {
      const response = await disposisiApi.getUnits();
      setUnits(response.data.data);
    } catch (error) {
      console.error('Failed to fetch units:', error);
    }
  };

  const fetchJenisSurat = async () => {
    try {
      const response = await disposisiApi.getJenisSurat();
      setJenisSuratList(response.data.data);
    } catch (error) {
      console.error('Failed to fetch jenis surat:', error);
    }
  };

  const handleSearch = () => {
    setPagination(prev => ({ ...prev, current: 1 }));
    fetchData();
  };

  const handleTableChange = (newPagination: any) => {
    setPagination(newPagination);
  };

  const handleCreate = async (values: any) => {
    try {
      await disposisiApi.create({
        ...values,
        tanggal_surat: values.tanggal_surat.format('YYYY-MM-DD'),
        tanggal_terima: values.tanggal_terima.format('YYYY-MM-DD'),
      });
      message.success('Disposisi berhasil dibuat');
      setIsModalOpen(false);
      form.resetFields();
      fetchData();
    } catch (error: any) {
      message.error(error.response?.data?.message || error.response?.data?.error || 'Gagal membuat disposisi');
    }
  };

  const handleSubmit = async (id: number) => {
    try {
      await disposisiApi.submit(id);
      message.success('Disposisi berhasil disubmit');
      fetchData();
    } catch (error: any) {
      message.error(error.response?.data?.error || 'Gagal submit');
    }
  };

  const handleProcess = async (values: any) => {
    if (!selectedDisposisi) return;
    try {
      await disposisiApi.processStep(selectedDisposisi.id, values);
      message.success('Step berhasil diproses');
      setIsProcessModalOpen(false);
      processForm.resetFields();
      fetchData();
      setIsDetailModalOpen(false);
    } catch (error: any) {
      message.error(error.response?.data?.error || 'Gagal memproses step');
    }
  };

  const handleCreateTL = async (values: any) => {
    if (!selectedDisposisi) return;
    try {
      await disposisiApi.createTindakLanjut(selectedDisposisi.id, values);
      message.success('Konsep surat TL berhasil dibuat');
      setIsTLModalOpen(false);
      tlForm.resetFields();
      fetchData();
    } catch (error: any) {
      message.error(error.response?.data?.error || 'Gagal membuat konsep');
    }
  };

  const openDetail = async (id: number) => {
    try {
      const response = await disposisiApi.getById(id);
      setSelectedDisposisi(response.data.data);
      setIsDetailModalOpen(true);
    } catch (error) {
      message.error('Gagal mengambil detail');
    }
  };

  const openProcess = (disposisi: Disposisi, workflow: DisposisiWorkflow) => {
    setSelectedDisposisi(disposisi);
    setSelectedWorkflow(workflow);
    setIsProcessModalOpen(true);
  };

  const openTL = (disposisi: Disposisi) => {
    setSelectedDisposisi(disposisi);
    setIsTLModalOpen(true);
  };

  const getStepStatus = (step: DisposisiWorkflow, currentStep: number) => {
    if (step.is_completed) return 'finish';
    if (step.step_num === currentStep) return 'process';
    return 'wait';
  };

  const columns: ColumnsType<Disposisi> = [
    {
      title: 'No',
      key: 'no',
      width: 60,
      render: (_, __, index) => ((pagination.current - 1) * pagination.pageSize) + index + 1,
    },
    {
      title: 'No. Surat',
      dataIndex: 'nomor_surat',
      key: 'nomor_surat',
      render: (text) => text || '-',
    },
    {
      title: 'Tanggal Surat',
      dataIndex: 'tanggal_surat',
      key: 'tanggal_surat',
      render: (date) => date ? dayjs(date).format('DD/MM/YYYY') : '-',
    },
    {
      title: 'Pengirim',
      dataIndex: 'pengirim',
      key: 'pengirim',
    },
    {
      title: 'Perihal',
      dataIndex: 'hal',
      key: 'hal',
      ellipsis: true,
    },
    {
      title: 'Jenis Surat',
      dataIndex: 'jenis_surat',
      key: 'jenis_surat',
      render: (jenisSurat) => {
        if (jenisSurat) {
          return <Tag color="blue">{jenisSurat.nama_jenis_surat}</Tag>;
        }
        return <Tag color="default">-</Tag>;
      },
    },
    {
      title: 'Unit Tujuan',
      dataIndex: 'unit_tujuan',
      key: 'unit_tujuan',
      render: (unit) => {
        const unitName = units.find(u => u.code === unit)?.name || unit;
        return unitName;
      },
    },
    {
      title: 'Step Saat Ini',
      key: 'current_step',
      width: 180,
      render: (_, record) => {
        const step = record.workflow?.find(w => w.step_num === record.current_step);
        return (
          <Tag color="blue">
            {step?.step_name || DISPOSISI_STEP_LABELS[record.current_step] || `Step ${record.current_step}`}
          </Tag>
        );
      },
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 150,
      render: (status) => (
        <Tag color={DISPOSISI_STATUS_COLORS[status]}>
          {DISPOSISI_STATUS_LABELS[status] || status}
        </Tag>
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
            onClick={() => openDetail(record.id)}
          >
            Detail
          </Button>
          {record.status === 'DRAFT' && (
            <Button
              type="link"
              icon={<SendOutlined />}
              onClick={() => handleSubmit(record.id)}
            >
              Submit
            </Button>
          )}
        </Space>
      ),
    },
  ];

  const currentWorkflow = selectedDisposisi?.workflow || [];
  const currentStepNum = selectedDisposisi?.current_step || 1;

  return (
    <div className="p-6">
      <div className="mb-4">
        <Title level={4} className="m-0">Monitoring Tindak Lanjut Surat/Disposisi</Title>
      </div>

      <Card className="mb-4">
        <Space wrap>
          <Input
            placeholder="Cari surat..."
            prefix={<SearchOutlined />}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            onPressEnter={handleSearch}
            style={{ width: 250 }}
          />
          <Select
            placeholder="Status"
            allowClear
            style={{ width: 150 }}
            value={statusFilter}
            onChange={(val) => {
              setStatusFilter(val);
              setPagination(prev => ({ ...prev, current: 1 }));
            }}
            options={[
              { label: 'Draft', value: 'DRAFT' },
              { label: 'Dalam Proses', value: 'IN_PROGRESS' },
              { label: 'Menunggu Disposisi', value: 'WAITING_DISPOSISI' },
              { label: 'Menunggu TL', value: 'WAITING_TL' },
              { label: 'Selesai', value: 'COMPLETED' },
            ]}
          />
          <Select
            placeholder="Unit Tujuan"
            allowClear
            style={{ width: 200 }}
            value={unitFilter}
            onChange={(val) => {
              setUnitFilter(val);
              setPagination(prev => ({ ...prev, current: 1 }));
            }}
            options={units.map(u => ({ label: u.name, value: u.code }))}
          />
          <Select
            placeholder="Jenis Surat"
            allowClear
            style={{ width: 180 }}
            value={jenisSuratFilter}
            onChange={(val) => {
              setJenisSuratFilter(val);
              setPagination(prev => ({ ...prev, current: 1 }));
            }}
            options={jenisSuratList.map(js => ({ label: js.nama_jenis_surat, value: js.id }))}
          />
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setIsModalOpen(true)}>
            Input Surat Masuk
          </Button>
        </Space>
      </Card>

      <Card>
        <Table
          columns={columns}
          dataSource={data}
          rowKey="id"
          loading={loading}
          pagination={{
            current: pagination.current,
            pageSize: pagination.pageSize,
            total: pagination.total,
            showSizeChanger: true,
            showTotal: (total) => `Total ${total} surat`,
          }}
          onChange={handleTableChange}
        />
      </Card>

      {/* Modal Input Surat Masuk */}
      <Modal
        title="Input Surat Masuk Baru"
        open={isModalOpen}
        onCancel={() => {
          setIsModalOpen(false);
          form.resetFields();
        }}
        footer={null}
        width={600}
      >
        <Form form={form} layout="vertical" onFinish={handleCreate}>
          <Form.Item
            name="tanggal_surat"
            label="Tanggal Surat"
            rules={[{ required: true, message: 'Tanggal surat wajib diisi' }]}
          >
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item
            name="tanggal_terima"
            label="Tanggal Terima"
            rules={[{ required: true, message: 'Tanggal terima wajib diisi' }]}
          >
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item
            name="pengirim"
            label="Pengirim"
            rules={[{ required: true, message: 'Pengirim wajib diisi' }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="hal"
            label="Perihal"
            rules={[{ required: true, message: 'Perihal wajib diisi' }]}
          >
            <Input.TextArea rows={3} />
          </Form.Item>
          <Form.Item
            name="unit_tujuan"
            label="Unit Tujuan (UKE II)"
            rules={[{ required: true, message: 'Unit tujuan wajib diisi' }]}
          >
            <Select
              options={units.map(u => ({ label: u.name, value: u.code }))}
              placeholder="Pilih Unit Tujuan"
            />
          </Form.Item>
          <Form.Item
            name="jenis_surat_id"
            label="Jenis Surat"
          >
            <Select
              options={jenisSuratList.map(js => ({ label: js.nama_jenis_surat, value: js.id }))}
              placeholder="Pilih Jenis Surat (Opsional)"
              allowClear
            />
          </Form.Item>
          <Form.Item className="mb-0 text-right">
            <Space>
              <Button onClick={() => setIsModalOpen(false)}>Batal</Button>
              <Button type="primary" htmlType="submit">Simpan</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* Modal Detail */}
      <Modal
        title="Detail Disposisi"
        open={isDetailModalOpen}
        onCancel={() => {
          setIsDetailModalOpen(false);
          setSelectedDisposisi(null);
        }}
        footer={null}
        width={900}
      >
        {selectedDisposisi && (
          <div>
            <Descriptions bordered column={2} size="small" className="mb-4">
              <Descriptions.Item label="No. Surat">{selectedDisposisi.nomor_surat || '-'}</Descriptions.Item>
              <Descriptions.Item label="Unit Tujuan">{units.find(u => u.code === selectedDisposisi.unit_tujuan)?.name || selectedDisposisi.unit_tujuan}</Descriptions.Item>
              <Descriptions.Item label="Tanggal Surat">{dayjs(selectedDisposisi.tanggal_surat).format('DD/MM/YYYY')}</Descriptions.Item>
              <Descriptions.Item label="Tanggal Terima">{dayjs(selectedDisposisi.tanggal_terima).format('DD/MM/YYYY')}</Descriptions.Item>
              <Descriptions.Item label="Pengirim" span={2}>{selectedDisposisi.pengirim}</Descriptions.Item>
              <Descriptions.Item label="Perihal" span={2}>{selectedDisposisi.hal}</Descriptions.Item>
              <Descriptions.Item label="Jenis Surat">{selectedDisposisi.jenis_surat?.nama_jenis_surat || '-'}</Descriptions.Item>
              <Descriptions.Item label="Status">
                <Tag color={DISPOSISI_STATUS_COLORS[selectedDisposisi.status]}>
                  {DISPOSISI_STATUS_LABELS[selectedDisposisi.status]}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Step Saat Ini">
                {DISPOSISI_STEP_LABELS[selectedDisposisi.current_step]}
              </Descriptions.Item>
            </Descriptions>

            <Title level={5} className="mb-2">Timeline Workflow</Title>
            <Steps
              current={currentStepNum - 1}
              size="small"
              className="mb-4"
              items={currentWorkflow.map((step) => ({
                title: step.step_name,
                description: step.is_completed
                  ? `Selesai: ${dayjs(step.completed_at).format('DD/MM/YYYY HH:mm')}`
                  : step.step_num === currentStepNum
                    ? 'Sedang diproses'
                    : 'Menunggu',
                status: getStepStatus(step, currentStepNum),
              }))}
            />

            {selectedDisposisi.dispositions && selectedDisposisi.dispositions.length > 0 && (
              <>
                <Title level={5} className="mb-2">Riwayat Disposisi</Title>
                <Timeline
                  items={selectedDisposisi.dispositions.map((d, idx) => ({
                    key: idx,
                    children: (
                      <div>
                        <Text strong>{d.from_jabatan} → {d.to_jabatan}</Text>
                        <br />
                        <Text type="secondary" className="text-sm">
                          {dayjs(d.created_at).format('DD/MM/YYYY HH:mm')}
                        </Text>
                        {d.catatan && (
                          <>
                            <br />
                            <Text type="secondary">Catatan: {d.catatan}</Text>
                          </>
                        )}
                      </div>
                    ),
                  }))}
                  className="mb-4"
                />
              </>
            )}

            <Title level={5} className="mb-2">Aksi</Title>
            <Space wrap>
              {currentStepNum === 2 && selectedDisposisi.status !== 'COMPLETED' && (
                <Button
                  type="primary"
                  onClick={() => {
                    setSelectedWorkflow(currentWorkflow.find(w => w.step_num === currentStepNum) || null);
                    setIsProcessModalOpen(true);
                  }}
                >
                  Proses Disposisi
                </Button>
              )}
              {currentStepNum === 3 && (
                <Button
                  type="primary"
                  onClick={() => {
                    processForm.setFieldsValue({ kesimpulan: 'DISTRIBUSI' });
                    setSelectedWorkflow(currentWorkflow.find(w => w.step_num === currentStepNum) || null);
                    setIsProcessModalOpen(true);
                  }}
                >
                  Kirim ke UKE II
                </Button>
              )}
              {currentStepNum === 5 && (
                <Button
                  type="primary"
                  onClick={() => {
                    setSelectedWorkflow(currentWorkflow.find(w => w.step_num === currentStepNum) || null);
                    setIsProcessModalOpen(true);
                  }}
                >
                  Beri Arahan TL
                </Button>
              )}
              {currentStepNum === 6 && (
                <Button type="primary" onClick={() => openTL(selectedDisposisi)}>
                  Buat Konsep Surat TL
                </Button>
              )}
              {currentStepNum === 7 && (
                <Button
                  type="primary"
                  onClick={() => {
                    setSelectedWorkflow(currentWorkflow.find(w => w.step_num === currentStepNum) || null);
                    setIsProcessModalOpen(true);
                  }}
                >
                  Proses Persetujuan
                </Button>
              )}
              {currentStepNum === 8 && (
                <Button
                  type="primary"
                  onClick={() => {
                    processForm.setFieldsValue({ kesimpulan: 'SELESAI' });
                    setSelectedWorkflow(currentWorkflow.find(w => w.step_num === currentStepNum) || null);
                    setIsProcessModalOpen(true);
                  }}
                >
                  Selesaikan
                </Button>
              )}
            </Space>
          </div>
        )}
      </Modal>

      {/* Modal Process Step */}
      <Modal
        title={`Proses: ${selectedWorkflow?.step_name || 'Workflow'}`}
        open={isProcessModalOpen}
        onCancel={() => {
          setIsProcessModalOpen(false);
          processForm.resetFields();
        }}
        footer={null}
        width={600}
      >
        <Form form={processForm} layout="vertical" onFinish={handleProcess}>
          {currentStepNum === 2 && (
            <>
              <Form.Item name="kesimpulan" label="Kesimpulan" rules={[{ required: true }]}>
                <Select
                  options={[
                    { label: 'Disposisi untuk Ditindaklanjuti', value: 'DISPOSISI' },
                    { label: 'Tidak Perlu Ditindaklanjuti', value: 'TIDAK_TL' },
                  ]}
                />
              </Form.Item>
              <Form.Item name="catatan" label="Catatan/Arahan">
                <Input.TextArea rows={4} placeholder="Arahan dari Dirjen PS..." />
              </Form.Item>
            </>
          )}
          {currentStepNum === 3 && (
            <>
              <Form.Item name="catatan" label="Catatan">
                <Input.TextArea rows={3} placeholder="Catatan distribusi..." />
              </Form.Item>
            </>
          )}
          {currentStepNum === 5 && (
            <>
              <Form.Item name="kesimpulan" label="Keputusan" rules={[{ required: true }]}>
                <Select
                  options={[
                    { label: 'Ditindaklanjuti', value: 'TINDAK_LANJUTI' },
                    { label: 'Selesai Tanpa TL', value: 'SELESAI_TANPA_TL' },
                  ]}
                />
              </Form.Item>
              <Form.Item name="catatan" label="Catatan/Arahan">
                <Input.TextArea rows={4} placeholder="Arahan tindak lanjut..." />
              </Form.Item>
            </>
          )}
          {currentStepNum === 7 && (
            <>
              <Form.Item name="kesimpulan" label="Keputusan" rules={[{ required: true }]}>
                <Select
                  options={[
                    { label: 'Disetujui', value: 'DISETUJUI' },
                    { label: 'Perbaikan Konsep', value: 'PERBAIKAN' },
                  ]}
                />
              </Form.Item>
              <Form.Item name="catatan" label="Catatan">
                <Input.TextArea rows={3} />
              </Form.Item>
            </>
          )}
          {currentStepNum === 8 && (
            <Form.Item name="catatan" label="Catatan">
              <Input.TextArea rows={3} />
            </Form.Item>
          )}
          <Form.Item className="mb-0 text-right">
            <Space>
              <Button onClick={() => setIsProcessModalOpen(false)}>Batal</Button>
              <Button type="primary" htmlType="submit">Simpan</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* Modal Create TL */}
      <Modal
        title="Buat Konsep Surat Tindak Lanjut"
        open={isTLModalOpen}
        onCancel={() => {
          setIsTLModalOpen(false);
          tlForm.resetFields();
        }}
        footer={null}
        width={700}
      >
        <Form form={tlForm} layout="vertical" onFinish={handleCreateTL}>
          <Form.Item
            name="concept_letter"
            label="Konsep Surat"
            rules={[{ required: true, message: 'Konsep surat wajib diisi' }]}
          >
            <Input.TextArea rows={10} placeholder="Ketik konsep surat tindak lanjut di sini..." />
          </Form.Item>
          <Form.Item className="mb-0 text-right">
            <Space>
              <Button onClick={() => setIsTLModalOpen(false)}>Batal</Button>
              <Button type="primary" htmlType="submit">Simpan Konsep</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default DisposisiPage;
