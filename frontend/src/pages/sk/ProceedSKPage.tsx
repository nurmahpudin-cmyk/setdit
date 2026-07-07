import { useState, useEffect } from 'react';
import {
  Card,
  Row,
  Col,
  Input,
  Select,
  Table,
  Timeline,
  Typography,
  Space,
  Tag,
  Spin,
  Empty,
  Descriptions,
  Modal,
  Drawer,
  Button,
  Grid,
  DatePicker,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import {
  SearchOutlined,
  FileTextOutlined,
  CheckCircleOutlined,
  UserOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { skPerhutananApi, SKPerhutanan } from '../../api/skPerhutanan';
import dayjs from 'dayjs';

const { Title, Text } = Typography;
const { useBreakpoint } = Grid;

const WORKFLOW_STEPS = [
  { num: 1, name: 'Input oleh Admin TU', color: '#1890ff' },
  { num: 2, name: 'Disposisi Setditjen PS', color: '#1890ff' },
  { num: 3, name: 'Disposisi Kabag PEHKT', color: '#1890ff' },
  { num: 4, name: 'Distribusi Ke Anggota oleh Ketua Pokja', color: '#1890ff' },
  { num: 5, name: 'Telaah Anggota', color: '#1890ff' },
  { num: 6, name: 'Approval Ketua Pokja', color: '#1890ff' },
  { num: 7, name: 'Approval Kabag PEHKT', color: '#1890ff' },
  { num: 8, name: 'Approval Kasubbag TU', color: '#1890ff' },
  { num: 9, name: 'Approval Setditjen', color: '#1890ff' },
  { num: 10, name: 'Penomoran ND Pengantar oleh Admin TU', color: '#1890ff' },
  { num: 11, name: 'Approval Dirjen PS', color: '#1890ff' },
  { num: 12, name: 'Penomoran SK oleh Admin TU', color: '#1890ff' },
  { num: 13, name: 'Distribusi SK ke Anggota', color: '#1890ff' },
  { num: 14, name: 'Proses Salin SK oleh Anggota', color: '#1890ff' },
  { num: 15, name: 'Approval Salinan SK oleh Ketua Pokja', color: '#1890ff' },
  { num: 16, name: 'Approval Salinan SK oleh Kabag PEHKT', color: '#1890ff' },
  { num: 17, name: 'Arsip & Scan', color: '#52c41a' },
];

const STATUS_COLORS: Record<string, string> = {
  DRAFT: 'default',
  IN_PROGRESS: 'processing',
  WAITING_REVISION: 'warning',
  APPROVED: 'success',
  SIGNED: 'blue',
  PROSES_SALINAN_SK: 'processing',
  COMPLETED: 'success',
};

const getStatusText = (status: string, currentStep?: number) => {
  if (status === 'COMPLETED') return 'Selesai';
  if (status === 'APPROVED' && currentStep === 11) return 'Disetujui';
  if (status === 'APPROVED') return 'Disetujui';
  if (status === 'PROSES_SALINAN_SK') return 'Proses Salinan SK';

  switch (status) {
    case 'DRAFT': return 'Draft';
    case 'IN_PROGRESS': return 'Dalam Proses';
    case 'WAITING_REVISION': return 'Menunggu Revisi';
    case 'SIGNED': return 'Ditandatangani';
    default: return status;
  }
};

export default function ProceedSKPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<SKPerhutanan[]>([]);
  const [selectedSK, setSelectedSK] = useState<SKPerhutanan | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const screens = useBreakpoint();

  const [searchType, setSearchType] = useState<'nama_kelompok' | 'nomor_surat' | 'no_nd' | 'no_sk' | 'tanggal_surat' | 'tanggal_nd' | 'tanggal_sk' | 'tahun_surat' | 'tahun_nd' | 'tahun_sk'>('nama_kelompok');
  const [searchValue, setSearchValue] = useState('');
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs | null, dayjs.Dayjs | null]>([null, null]);
  const [selectedYear, setSelectedYear] = useState<number | null>(null);

  const currentYear = new Date().getFullYear();
  const yearOptions = Array.from({ length: 10 }, (_, i) => currentYear - i);

  const handleSearch = async () => {
    const isDateSearch = ['tanggal_surat', 'tanggal_nd', 'tanggal_sk'].includes(searchType);
    const isYearSearch = ['tahun_surat', 'tahun_nd', 'tahun_sk'].includes(searchType);

    if (isDateSearch) {
      if (!dateRange[0] || !dateRange[1]) return;
    } else if (isYearSearch) {
      if (!selectedYear) return;
    } else {
      if (!searchValue.trim()) return;
    }

    setLoading(true);
    try {
      const query: any = { limit: 50 };

      if (isDateSearch) {
        query.start_date = dateRange[0]?.format('YYYY-MM-DD');
        query.end_date = dateRange[1]?.format('YYYY-MM-DD');
        if (searchType === 'tanggal_surat') {
          query.date_field = 'tanggal_surat';
        } else if (searchType === 'tanggal_nd') {
          query.date_field = 'tanggal_nd_sk';
        } else if (searchType === 'tanggal_sk') {
          query.date_field = 'tanggal_sk';
        }
      } else if (isYearSearch) {
        query.year = selectedYear;
        if (searchType === 'tahun_surat') {
          query.date_field = 'tanggal_surat';
        } else if (searchType === 'tahun_nd') {
          query.date_field = 'tanggal_nd_sk';
        } else if (searchType === 'tahun_sk') {
          query.date_field = 'tanggal_sk';
        }
      } else {
        query.search = searchValue;
        // Map frontend field names to backend field names
        const fieldMap: Record<string, string> = {
          'nama_kelompok': 'kelompok_ps',
          'no_nd': 'nomor_nd_sk',
          'no_sk': 'nomor_sk',
        };
        query.search_field = fieldMap[searchType] || searchType;
      }

      const res = await skPerhutananApi.getAll(query);
      setResults(res.data.data || []);
    } catch (err) {
      console.error('Search failed:', err);
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectSK = async (sk: SKPerhutanan) => {
    setSelectedSK(null);
    setDetailLoading(true);
    setModalVisible(true);
    try {
      const res = await skPerhutananApi.getById(sk.id);
      setSelectedSK(res.data.data);
    } catch (err) {
      console.error('Failed to fetch SK detail:', err);
    } finally {
      setDetailLoading(false);
    }
  };

  useEffect(() => {
    const isDateSearch = ['tanggal_surat', 'tanggal_nd', 'tanggal_sk'].includes(searchType);
    const isYearSearch = ['tahun_surat', 'tahun_nd', 'tahun_sk'].includes(searchType);

    if (isDateSearch) {
      if (dateRange[0] && dateRange[1]) {
        handleSearch();
      }
    } else if (isYearSearch) {
      if (selectedYear) {
        handleSearch();
      }
    } else {
      if (searchValue.length > 2) {
        handleSearch();
      } else if (searchValue.length === 0) {
        setResults([]);
      }
    }
  }, [searchValue, searchType, dateRange, selectedYear]);

  const isDateSearch = ['tanggal_surat', 'tanggal_nd', 'tanggal_sk'].includes(searchType);
  const isYearSearch = ['tahun_surat', 'tahun_nd', 'tahun_sk'].includes(searchType);

  const getWorkflowTimeline = () => {
    if (!selectedSK?.stages) return [];

    return WORKFLOW_STEPS.map((step) => {
      const stage = selectedSK.stages?.find((s) => s.step_num === step.num);
      const isCompleted = stage?.is_completed;
      const isCurrent = selectedSK.current_step === step.num;

      return {
        ...step,
        isCompleted,
        isCurrent,
        completedAt: stage?.completed_at,
        completedBy: stage?.completedByUser?.fullname || stage?.assignee?.fullname || '-',
        kesimpulan: stage?.kesimpulan,
      };
    });
  };

  const getCatatanHistory = () => {
    if (!selectedSK?.catatan_history) return [];
    return [...(selectedSK.catatan_history || [])].sort(
      (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    );
  };

  // Mobile columns
  const mobileColumns = [
    {
      title: 'Data SK',
      key: 'sk_data',
      render: (_: any, record: SKPerhutanan) => (
        <div>
          <Text strong style={{ fontSize: 14 }}>{record.nomor_surat || '-'}</Text>
          <div style={{ fontSize: 12, color: '#666', marginTop: 4 }}>
            <Text type="secondary">{record.perihal || '-'}</Text>
          </div>
          <div style={{ marginTop: 8 }}>
            <Tag color={STATUS_COLORS[record.status]}>{STATUS_TEXT[record.status] || record.status}</Tag>
            <Tag color="blue">{WORKFLOW_STEPS.find(s => s.num === record.current_step)?.name || `Step ${record.current_step}`}</Tag>
          </div>
        </div>
      ),
    },
    {
      title: 'Aksi',
      key: 'aksi',
      width: 80,
      render: (_: any, record: SKPerhutanan) => (
        <Button type="primary" size="small" onClick={() => handleSelectSK(record)} block>
          Detail
        </Button>
      ),
    },
  ];

  // Desktop columns
  const desktopColumns = [
    {
      title: 'No',
      key: 'no',
      width: 50,
      render: (_: any, __: any, index: number) => index + 1,
    },
    {
      title: 'Nomor Surat',
      dataIndex: 'nomor_surat',
      key: 'nomor_surat',
      width: screens.xs ? 100 : 150,
      render: (val: string) => val || '-',
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
      width: screens.xs ? 60 : 80,
      render: (val: string) => <Tag color="blue">{val}</Tag>,
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: screens.xs ? 100 : 130,
      render: (status: string) => (
        <Tag color={STATUS_COLORS[status]}>{STATUS_TEXT[status] || status}</Tag>
      ),
    },
    {
      title: 'Tahap',
      key: 'tahap',
      width: screens.xs ? 100 : 150,
      render: (_: any, record: SKPerhutanan) => {
        const step = WORKFLOW_STEPS.find((s) => s.num === record.current_step);
        return <Text>{step?.name || `Step ${record.current_step}`}</Text>;
      },
    },
    {
      title: 'Deadline',
      dataIndex: 'tanggal_deadline',
      key: 'tanggal_deadline',
      width: screens.xs ? 80 : 100,
      render: (date: string) => dayjs(date).format('DD/MM/YY'),
    },
    {
      title: 'Aksi',
      key: 'aksi',
      width: 70,
      render: (_: any, record: SKPerhutanan) => (
        <Button type="primary" size="small" onClick={() => handleSelectSK(record)}>
          Detail
        </Button>
      ),
    },
  ];

  const columns = screens.xs ? mobileColumns : desktopColumns;

  return (
    <div style={{ padding: 24 }}>
      <Title level={4} style={{ marginBottom: 24 }}>
        <FileTextOutlined style={{ marginRight: 8 }} />
        Pencarian Proses SK
      </Title>

      <Card style={{ marginBottom: 24, borderRadius: 12 }}>
        <Row gutter={16} align="middle">
          <Col flex="200px">
            <Select
              value={searchType}
              onChange={(val) => {
                setSearchType(val);
                setSearchValue('');
                setDateRange([null, null]);
                setSelectedYear(null);
              }}
              style={{ width: '100%' }}
              options={[
                { label: 'Nama Kelompok', value: 'nama_kelompok' },
                { label: 'Nomor Surat', value: 'nomor_surat' },
                { label: 'No. ND', value: 'no_nd' },
                { label: 'No. SK', value: 'no_sk' },
                { label: 'Tanggal Surat', value: 'tanggal_surat' },
                { label: 'Tanggal ND', value: 'tanggal_nd' },
                { label: 'Tanggal SK', value: 'tanggal_sk' },
                { label: 'Tahun Surat', value: 'tahun_surat' },
                { label: 'Tahun ND', value: 'tahun_nd' },
                { label: 'Tahun SK', value: 'tahun_sk' },
              ]}
            />
          </Col>
          <Col flex="auto">
            {isDateSearch ? (
              <DatePicker.RangePicker
                value={dateRange}
                onChange={(dates) => setDateRange(dates as [dayjs.Dayjs | null, dayjs.Dayjs | null])}
                style={{ width: '100%', height: 40 }}
                format="DD/MM/YYYY"
                placeholder={['Tanggal Mulai', 'Tanggal Akhir']}
              />
            ) : isYearSearch ? (
              <Select
                value={selectedYear}
                onChange={setSelectedYear}
                placeholder="Pilih Tahun"
                style={{ width: '100%', height: 40 }}
                options={yearOptions.map(y => ({ label: String(y), value: y }))}
              />
            ) : (
              <Input
                placeholder={`Cari...`}
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
                onPressEnter={handleSearch}
                prefix={<SearchOutlined />}
                allowClear
                size="large"
              />
            )}
          </Col>
          <Col>
            <Button type="primary" onClick={handleSearch} loading={loading}>
              Cari
            </Button>
          </Col>
        </Row>
      </Card>

      <Card title="Hasil Pencarian" extra={<Text type="secondary">{results.length} data</Text>} style={{ borderRadius: 12 }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: 40 }}>
            <Spin />
          </div>
        ) : results.length === 0 ? (
          <Empty description={isDateSearch ? "Pilih rentang tanggal untuk mencari" : isYearSearch ? "Pilih tahun untuk mencari" : "Ketik minimal 3 karakter untuk mencari"} />
        ) : (
          <Table
            dataSource={results}
            columns={columns}
            rowKey="id"
            size="small"
            pagination={{ pageSize: 10 }}
          />
        )}
      </Card>

      {screens.xs ? (
        <Drawer
          title="Detail Proses SK"
          placement="bottom"
          height="85vh"
          open={modalVisible}
          onClose={() => {
            setModalVisible(false);
            setSelectedSK(null);
          }}
          extra={
            selectedSK && (
              <Button type="primary" size="small" onClick={() => navigate(`/sk-perhutanan?detail=${selectedSK.id}`)}>
                Buka Halaman SK
              </Button>
            )
          }
        >
          {detailLoading ? (
            <div style={{ textAlign: 'center', padding: 40 }}>
              <Spin />
            </div>
          ) : selectedSK ? (
            <div>
              <Descriptions column={1} size="small" bordered style={{ marginBottom: 16 }}>
                <Descriptions.Item label="Nomor Surat">{selectedSK.nomor_surat || '-'}</Descriptions.Item>
                <Descriptions.Item label="Nomor ND">{selectedSK.nomor_nd_sk || '-'}</Descriptions.Item>
                <Descriptions.Item label="Nomor SK">{selectedSK.nomor_sk || '-'}</Descriptions.Item>
                <Descriptions.Item label="Unit">
                  <Tag color="blue">{selectedSK.unit_pengusul}</Tag>
                </Descriptions.Item>
                <Descriptions.Item label="Status">
                  <Tag color={STATUS_COLORS[selectedSK.status]}>
                    {getStatusText(selectedSK.status, selectedSK.current_step)}
                  </Tag>
                </Descriptions.Item>
                <Descriptions.Item label="Tahap">
                  {WORKFLOW_STEPS.find(s => s.num === selectedSK.current_step)?.name || `Step ${selectedSK.current_step}`}
                </Descriptions.Item>
                <Descriptions.Item label="Perihal">{selectedSK.perihal || '-'}</Descriptions.Item>
                <Descriptions.Item label="Drafter">
                  {selectedSK.stages?.find(s => s.step_num === 4)?.assignee?.fullname || '-'}
                </Descriptions.Item>
                <Descriptions.Item label="Finalisasi">
                  {selectedSK.stages?.find(s => s.step_num === 14)?.assignee?.fullname || '-'}
                </Descriptions.Item>
              </Descriptions>

              <Text strong>Workflow</Text>
              <div style={{ maxHeight: 200, overflowY: 'auto', marginTop: 8 }}>
                <Timeline
                  items={getWorkflowTimeline().map((step) => ({
                    color: step.isCompleted ? 'green' : step.isCurrent ? 'blue' : 'gray',
                    children: (
                      <div>
                        <Space>
                          <Text strong={step.isCurrent} style={{ color: step.isCurrent ? '#1890ff' : undefined }}>
                            {step.name}
                          </Text>
                          {step.isCurrent && <Tag color="blue">SEKARANG</Tag>}
                          {step.isCompleted && <CheckCircleOutlined style={{ color: 'green' }} />}
                        </Space>
                        {step.isCompleted && (
                          <div style={{ fontSize: 12, color: '#666' }}>
                            <div>{dayjs(step.completedAt).format('DD/MM/YYYY HH:mm')}</div>
                            <div>
                              <UserOutlined style={{ marginRight: 4 }} />
                              {step.completedBy}
                            </div>
                          </div>
                        )}
                      </div>
                    ),
                  }))}
                />
              </div>

              <Text strong style={{ marginTop: 16, display: 'block' }}>Riwayat Catatan</Text>
              <div style={{ maxHeight: 200, overflowY: 'auto', marginTop: 8 }}>
                {getCatatanHistory().length === 0 ? (
                  <Empty description="Belum ada catatan" image={Empty.PRESENTED_IMAGE_SIMPLE} />
                ) : (
                  <Timeline
                    items={getCatatanHistory().map((catatan: any) => ({
                      color: catatan.kesimpulan === 'DISETUJUI' ? 'green' : catatan.kesimpulan === 'PERBAIKAN' ? 'orange' : 'blue',
                      children: (
                        <div>
                          <Space>
                            <Tag>{catatan.step_name || `Step ${catatan.step_num}`}</Tag>
                            <Text type="secondary" style={{ fontSize: 12 }}>
                              {dayjs(catatan.created_at).format('DD/MM/YY HH:mm')}
                            </Text>
                          </Space>
                          <div style={{ fontSize: 12, marginTop: 2 }}>
                            <Text style={{ color: '#1890ff' }}>{catatan.user?.fullname || 'Unknown'}</Text>
                          </div>
                          <div style={{ fontStyle: 'italic', color: '#666', fontSize: 12 }}>
                            "{catatan.catatan}"
                          </div>
                        </div>
                      ),
                    }))}
                  />
                )}
              </div>
            </div>
          ) : null}
        </Drawer>
      ) : (
        <Modal
          title="Detail Proses SK"
          open={modalVisible}
          onCancel={() => {
            setModalVisible(false);
            setSelectedSK(null);
          }}
          footer={[
            <Button key="close" onClick={() => setModalVisible(false)}>
              Tutup
            </Button>,
            selectedSK && (
              <Button
                key="open"
                type="primary"
                onClick={() => navigate(`/sk-perhutanan?detail=${selectedSK.id}`)}
              >
                Buka Halaman SK
              </Button>
            ),
          ]}
          width={screens.md ? 800 : '95%'}
        >
          {detailLoading ? (
            <div style={{ textAlign: 'center', padding: 40 }}>
              <Spin />
            </div>
          ) : selectedSK ? (
            <div>
              <Descriptions column={2} size="small" bordered style={{ marginBottom: 16 }}>
                <Descriptions.Item label="Nomor Surat">{selectedSK.nomor_surat || '-'}</Descriptions.Item>
                <Descriptions.Item label="Nomor ND">{selectedSK.nomor_nd_sk || '-'}</Descriptions.Item>
                <Descriptions.Item label="Nomor SK">{selectedSK.nomor_sk || '-'}</Descriptions.Item>
                <Descriptions.Item label="Unit">
                  <Tag color="blue">{selectedSK.unit_pengusul}</Tag>
                </Descriptions.Item>
                <Descriptions.Item label="Status">
                  <Tag color={STATUS_COLORS[selectedSK.status]}>
                    {getStatusText(selectedSK.status, selectedSK.current_step)}
                  </Tag>
                </Descriptions.Item>
                <Descriptions.Item label="Tahap">
                  {WORKFLOW_STEPS.find(s => s.num === selectedSK.current_step)?.name || `Step ${selectedSK.current_step}`}
                </Descriptions.Item>
                <Descriptions.Item label="Drafter">
                  {selectedSK.stages?.find(s => s.step_num === 4)?.assignee?.fullname || '-'}
                </Descriptions.Item>
                <Descriptions.Item label="Finalisasi">
                  {selectedSK.stages?.find(s => s.step_num === 14)?.assignee?.fullname || '-'}
                </Descriptions.Item>
                <Descriptions.Item label="Perihal" span={2}>{selectedSK.perihal || '-'}</Descriptions.Item>
              </Descriptions>

              <Row gutter={16}>
                <Col span={12}>
                  <Text strong>Workflow</Text>
                  <div style={{ maxHeight: 300, overflowY: 'auto', marginTop: 8 }}>
                    <Timeline
                      items={getWorkflowTimeline().map((step) => ({
                        color: step.isCompleted ? 'green' : step.isCurrent ? 'blue' : 'gray',
                        children: (
                          <div>
                            <Space>
                              <Text strong={step.isCurrent} style={{ color: step.isCurrent ? '#1890ff' : undefined }}>
                                {step.name}
                              </Text>
                              {step.isCurrent && <Tag color="blue">SEKARANG</Tag>}
                              {step.isCompleted && <CheckCircleOutlined style={{ color: 'green' }} />}
                            </Space>
                            {step.isCompleted && (
                              <div style={{ fontSize: 12, color: '#666' }}>
                                <div>{dayjs(step.completedAt).format('DD/MM/YYYY HH:mm')}</div>
                                <div>
                                  <UserOutlined style={{ marginRight: 4 }} />
                                  {step.completedBy}
                                </div>
                              </div>
                            )}
                          </div>
                        ),
                      }))}
                    />
                  </div>
                </Col>
                <Col span={12}>
                  <Text strong>Riwayat Catatan</Text>
                  <div style={{ maxHeight: 300, overflowY: 'auto', marginTop: 8 }}>
                    {getCatatanHistory().length === 0 ? (
                      <Empty description="Belum ada catatan" image={Empty.PRESENTED_IMAGE_SIMPLE} />
                    ) : (
                      <Timeline
                        items={getCatatanHistory().map((catatan: any) => ({
                          color: catatan.kesimpulan === 'DISETUJUI' ? 'green' : catatan.kesimpulan === 'PERBAIKAN' ? 'orange' : 'blue',
                          children: (
                            <div>
                              <Space>
                                <Tag>{catatan.step_name || `Step ${catatan.step_num}`}</Tag>
                                <Text type="secondary" style={{ fontSize: 12 }}>
                                  {dayjs(catatan.created_at).format('DD/MM/YY HH:mm')}
                                </Text>
                              </Space>
                              <div style={{ fontSize: 12, marginTop: 2 }}>
                                <Text style={{ color: '#1890ff' }}>{catatan.user?.fullname || 'Unknown'}</Text>
                              </div>
                              <div style={{ fontStyle: 'italic', color: '#666', fontSize: 12 }}>
                                "{catatan.catatan}"
                              </div>
                            </div>
                          ),
                        }))}
                      />
                    )}
                  </div>
                </Col>
              </Row>
            </div>
          ) : null}
        </Modal>
      )}
    </div>
  );
}
