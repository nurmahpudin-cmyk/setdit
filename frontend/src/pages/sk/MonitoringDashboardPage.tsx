import { useState, useEffect } from 'react';
import {
  Card,
  Row,
  Col,
  Statistic,
  Table,
  Tag,
  Space,
  Spin,
  Typography,
  Alert,
  Progress,
  Badge,
} from 'antd';
import {
  FileTextOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  WarningOutlined,
  ExclamationCircleOutlined,
  AlertOutlined,
  AuditOutlined,
  SyncOutlined,
  SolutionOutlined,
} from '@ant-design/icons';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
} from 'recharts';
import dayjs from 'dayjs';
import {
  skPerhutananApi,
  DashboardStats,
  StatusDistribution,
  StageAverage,
  RecentSK,
  ProcessFlow,
  ExpiringSK,
} from '../../api/skPerhutanan';
import { useNavigate } from 'react-router-dom';

const { Title, Text } = Typography;

const STATUS_COLORS: Record<string, string> = {
  DRAFT: '#8c8c8c',
  IN_PROGRESS: '#1890ff',
  WAITING_REVISION: '#faad14',
  APPROVED: '#722ed1',
  PROSES_SALINAN_SK: '#13c2c2',
  COMPLETED: '#52c41a',
};

const STATUS_LABELS: Record<string, string> = {
  DRAFT: 'Draft',
  IN_PROGRESS: 'Dalam Proses',
  WAITING_REVISION: 'Menunggu Revisi',
  APPROVED: 'Disetujui',
  PROSES_SALINAN_SK: 'Proses Salinan SK',
  COMPLETED: 'Selesai',
};

const WORKFLOW_STEPS_SHORT = [
  { num: 1, name: 'Input SK', group: 'Input' },
  { num: 2, name: 'Disposisi', group: 'Disposisi' },
  { num: 5, name: 'Telaah', group: 'Telaah' },
  { num: 11, name: 'Approval', group: 'Approval' },
  { num: 12, name: 'Nomor SK', group: 'Approval' },
  { num: 14, name: 'Salinan SK', group: 'Arsip' },
  { num: 17, name: 'Arsip', group: 'Arsip' },
];

export default function MonitoringDashboardPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [statusDistribution, setStatusDistribution] = useState<StatusDistribution[]>([]);
  const [stageAverages, setStageAverages] = useState<StageAverage[]>([]);
  const [recentSK, setRecentSK] = useState<RecentSK[]>([]);
  const [processFlow, setProcessFlow] = useState<ProcessFlow | null>(null);
  const [expiringSK, setExpiringSK] = useState<ExpiringSK[]>([]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const [statsRes, distRes, avgRes, recentRes, flowRes, expiringRes] = await Promise.all([
        skPerhutananApi.getDashboardStats(),
        skPerhutananApi.getStatusDistribution(),
        skPerhutananApi.getStageAverages(),
        skPerhutananApi.getRecentSK(10),
        skPerhutananApi.getProcessFlow(),
        skPerhutananApi.getExpiringSK(10),
      ]);

      setStats(statsRes.data?.data);
      setStatusDistribution(distRes.data?.data || []);
      setStageAverages(avgRes.data?.data || []);
      setRecentSK(recentRes.data?.data || []);
      setProcessFlow(flowRes.data?.data);
      setExpiringSK(expiringRes.data?.data || []);
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const recentSKColumns = [
    {
      title: 'Nomor SK',
      dataIndex: 'nomor',
      key: 'nomor',
      width: 180,
      render: (text: string) => <Text strong>{text}</Text>,
    },
    {
      title: 'Perihal',
      dataIndex: 'perkara',
      key: 'perkara',
      ellipsis: true,
    },
    {
      title: 'Tahapan Saat Ini',
      dataIndex: 'currentStep',
      key: 'currentStep',
      width: 180,
      render: (text: string) => <Tag color="processing">{text}</Tag>,
    },
    {
      title: 'Lama Proses',
      dataIndex: 'lamaProses',
      key: 'lamaProses',
      width: 110,
      render: (days: number, record: RecentSK) => (
        <Space>
          {record.isOverdue && <WarningOutlined style={{ color: '#ff4d4f' }} />}
          <Text type={record.isOverdue ? 'danger' : undefined}>{days} hari</Text>
        </Space>
      ),
    },
    {
      title: 'Target Selesai',
      dataIndex: 'targetSelesai',
      key: 'targetSelesai',
      width: 110,
      render: (date: string) => dayjs(date).format('DD/MM/YY'),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 140,
      render: (status: string) => (
        <Tag color={STATUS_COLORS[status]}>
          {STATUS_LABELS[status] || status}
        </Tag>
      ),
    },
  ];

  const expiringSKColumns = [
    {
      title: 'Nomor SK',
      dataIndex: 'nomor',
      key: 'nomor',
      width: 150,
      render: (text: string) => <Text strong>{text}</Text>,
    },
    {
      title: 'Perihal',
      dataIndex: 'perkara',
      key: 'perkara',
      ellipsis: true,
    },
    {
      title: 'Tahapan',
      dataIndex: 'currentStep',
      key: 'currentStep',
      width: 150,
      render: (text: string) => <Tag color="processing">{text}</Tag>,
    },
    {
      title: 'Sisa Hari',
      dataIndex: 'daysRemaining',
      key: 'daysRemaining',
      width: 90,
      render: (days: number) => (
        <Tag color={days <= 0 ? 'error' : days <= 1 ? 'warning' : 'default'}>
          {days <= 0 ? 'LEWAT' : `${days} hari`}
        </Tag>
      ),
    },
    {
      title: 'Deadline',
      dataIndex: 'deadline',
      key: 'deadline',
      width: 100,
      render: (date: string) => dayjs(date).format('DD/MM/YYYY'),
    },
  ];

  const pieData = statusDistribution.map(d => ({
    name: d.label,
    value: d.count,
    status: d.status,
  })).filter(d => d.value > 0);

  const barData = stageAverages.map(d => ({
    name: d.stage,
    avgDays: d.avgDays,
    count: d.count,
  }));

  return (
    <div>
      <Title level={4} style={{ marginBottom: 24 }}>
        Monitoring Dashboard SK Perhutanan
      </Title>

      <Spin spinning={loading}>
        <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
          <Col xs={12} sm={6}>
            <Card style={{ borderRadius: 12, background: '#e6f4ff' }}>
              <Statistic
                valueStyle={{ fontSize: 28, fontWeight: 700, color: '#1890ff' }}
                value={stats?.total || 0}
                title={<Text type="secondary">Total SK</Text>}
                prefix={<FileTextOutlined />}
              />
            </Card>
          </Col>
          <Col xs={12} sm={6}>
            <Card style={{ borderRadius: 12, background: '#fff7e6' }}>
              <Statistic
                valueStyle={{ fontSize: 28, fontWeight: 700, color: '#fa8c16' }}
                value={(stats?.inProgress || 0) + (stats?.waitingRevision || 0)}
                title={<Text type="secondary">Sedang Diproses</Text>}
                prefix={<ClockCircleOutlined />}
              />
            </Card>
          </Col>
          <Col xs={12} sm={6}>
            <Card style={{ borderRadius: 12, background: '#fff2f0' }}>
              <Statistic
                valueStyle={{ fontSize: 28, fontWeight: 700, color: '#ff4d4f' }}
                value={stats?.overdue || 0}
                title={<Text type="secondary">Overdue (SLA)</Text>}
                prefix={<WarningOutlined />}
              />
            </Card>
          </Col>
          <Col xs={12} sm={6}>
            <Card style={{ borderRadius: 12, background: '#f6ffed' }}>
              <Statistic
                valueStyle={{ fontSize: 28, fontWeight: 700, color: '#52c41a' }}
                value={stats?.completed || 0}
                title={<Text type="secondary">Selesai</Text>}
                prefix={<CheckCircleOutlined />}
              />
            </Card>
          </Col>
        </Row>

        <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
          <Col xs={12} sm={6}>
            <Card style={{ borderRadius: 12, background: '#fffbe6' }}>
              <Statistic
                valueStyle={{ fontSize: 28, fontWeight: 700, color: '#faad14' }}
                value={stats?.expiringSoon || 0}
                title={<Text type="secondary">Akan Jatuh Tempo</Text>}
                prefix={<ExclamationCircleOutlined />}
              />
            </Card>
          </Col>
          <Col xs={12} sm={6}>
            <Card style={{ borderRadius: 12, background: '#f9f0ff' }}>
              <Statistic
                valueStyle={{ fontSize: 28, fontWeight: 700, color: '#722ed1' }}
                value={stats?.waitingRevision || 0}
                title={<Text type="secondary">Revisi</Text>}
                prefix={<AuditOutlined />}
              />
            </Card>
          </Col>
          <Col xs={12} sm={6}>
            <Card style={{ borderRadius: 12, background: '#e6f7ff' }}>
              <Statistic
                valueStyle={{ fontSize: 28, fontWeight: 700, color: '#1890ff' }}
                value={stats?.inProgress || 0}
                title={<Text type="secondary">Dalam Proses</Text>}
                prefix={<SyncOutlined />}
              />
            </Card>
          </Col>
          <Col xs={12} sm={6}>
            <Card style={{ borderRadius: 12, background: '#f6ffed' }}>
              <Statistic
                valueStyle={{ fontSize: 28, fontWeight: 700, color: '#13c2c2' }}
                value={stats?.completed || 0}
                title={<Text type="secondary">Proses Salinan SK</Text>}
                prefix={<SolutionOutlined />}
              />
            </Card>
          </Col>
        </Row>

        <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
          <Col xs={24} lg={10}>
            <Card title="Status SK" style={{ borderRadius: 12 }}>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={2}
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={STATUS_COLORS[entry.status] || '#8c8c8c'} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </Card>
          </Col>

          <Col xs={24} lg={14}>
            <Card title="Monitoring Progress - Rata-rata Durasi per Tahap" style={{ borderRadius: 12 }}>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={barData} layout="vertical">
                  <XAxis type="number" unit=" hari" />
                  <YAxis type="category" dataKey="name" width={120} tick={{ fontSize: 11 }} />
                  <Tooltip formatter={(value: number) => [`${value} hari`, 'Rata-rata']} />
                  <Bar dataKey="avgDays" fill="#1890ff" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
              <div style={{ marginTop: 16, padding: '12px 16px', background: '#f5f5f5', borderRadius: 8 }}>
                <Text strong>Total SLA: 14 hari kerja</Text>
                <br />
                <Text type="secondary" style={{ fontSize: 12 }}>
                  Tahap Telaah: 5 hari kerja | Tahap Arsip: 7 hari kerja
                </Text>
              </div>
            </Card>
          </Col>
        </Row>

        <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
          <Col xs={24} lg={12}>
            <Card
              title={
                <Space>
                  <WarningOutlined style={{ color: '#ff4d4f' }} />
                  <span>SK Melebihi SLA (Overdue)</span>
                </Space>
              }
              style={{ borderRadius: 12, borderColor: '#ff4d4f' }}
              extra={<Tag color="error">{stats?.overdue || 0} SK</Tag>}
            >
              {expiringSK.length > 0 ? (
                <Table
                  dataSource={expiringSK.filter(s => s.isOverdue)}
                  columns={expiringSKColumns}
                  rowKey="id"
                  pagination={false}
                  size="small"
                  onRow={(record) => ({
                    onClick: () => navigate(`/sk-perhutanan?detail=${record.id}`),
                    style: { cursor: 'pointer' },
                  })}
                />
              ) : (
                <div style={{ textAlign: 'center', padding: '40px 0' }}>
                  <CheckCircleOutlined style={{ fontSize: 48, color: '#52c41a' }} />
                  <div style={{ marginTop: 8 }}>Tidak ada SK yang melebihi SLA</div>
                </div>
              )}
            </Card>
          </Col>

          <Col xs={24} lg={12}>
            <Card
              title={
                <Space>
                  <ExclamationCircleOutlined style={{ color: '#faad14' }} />
                  <span>SK Akan Jatuh Tempo</span>
                </Space>
              }
              style={{ borderRadius: 12, borderColor: '#faad14' }}
              extra={<Tag color="warning">{stats?.expiringSoon || 0} SK</Tag>}
            >
              {expiringSK.length > 0 ? (
                <Table
                  dataSource={expiringSK.filter(s => !s.isOverdue)}
                  columns={expiringSKColumns}
                  rowKey="id"
                  pagination={false}
                  size="small"
                  onRow={(record) => ({
                    onClick: () => navigate(`/sk-perhutanan?detail=${record.id}`),
                    style: { cursor: 'pointer' },
                  })}
                />
              ) : (
                <div style={{ textAlign: 'center', padding: '40px 0' }}>
                  <CheckCircleOutlined style={{ fontSize: 48, color: '#52c41a' }} />
                  <div style={{ marginTop: 8 }}>Tidak ada SK yang akan jatuh tempo</div>
                </div>
              )}
            </Card>
          </Col>
        </Row>

        <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
          <Col xs={24} lg={14}>
            <Card
              title="Daftar SK Terbaru"
              style={{ borderRadius: 12 }}
              extra={<a onClick={() => navigate('/sk-perhutanan')}>Lihat Semua</a>}
            >
              <Table
                dataSource={recentSK}
                columns={recentSKColumns}
                rowKey="id"
                pagination={false}
                size="small"
                scroll={{ x: 800 }}
                onRow={(record) => ({
                  onClick: () => navigate(`/sk-perhutanan?detail=${record.id}`),
                  style: { cursor: 'pointer' },
                })}
              />
            </Card>
          </Col>

          <Col xs={24} lg={10}>
            <Card title="Monitoring Proses" style={{ borderRadius: 12 }}>
              {processFlow && (
                <div>
                  <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
                    <Col span={8}>
                      <Statistic
                        title="Draft"
                        value={processFlow.summary.draft}
                        valueStyle={{ color: '#8c8c8c' }}
                      />
                    </Col>
                    <Col span={8}>
                      <Statistic
                        title="Diproses"
                        value={processFlow.summary.inProgress}
                        valueStyle={{ color: '#1890ff' }}
                      />
                    </Col>
                    <Col span={8}>
                      <Statistic
                        title="Selesai"
                        value={processFlow.summary.completed}
                        valueStyle={{ color: '#52c41a' }}
                      />
                    </Col>
                  </Row>

                  <div style={{ marginBottom: 16 }}>
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      Distribusi per Tahap
                    </Text>
                  </div>

                  {WORKFLOW_STEPS_SHORT.map((step) => {
                    const flowStep = processFlow.byStep.find(f => f.step === step.num);
                    const count = flowStep?.count || 0;
                    const maxCount = Math.max(...processFlow.byStep.map(f => f.count), 1);
                    const percent = (count / maxCount) * 100;

                    return (
                      <div key={step.num} style={{ marginBottom: 12 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                          <Text style={{ fontSize: 12 }}>{step.name}</Text>
                          <Badge count={count} style={{ backgroundColor: '#1890ff' }} />
                        </div>
                        <Progress
                          percent={percent}
                          size="small"
                          showInfo={false}
                          strokeColor="#1890ff"
                        />
                      </div>
                    );
                  })}
                </div>
              )}
            </Card>
          </Col>
        </Row>

        <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
          <Col xs={24} lg={12}>
            <Card title="SLA (Service Level Agreement)" style={{ borderRadius: 12 }}>
              <Row gutter={[16, 16]}>
                <Col span={24}>
                  <Alert
                    message="Standar Waktu Penyelesaian"
                    description={
                      <div>
                        <p style={{ margin: '8px 0' }}>
                          <Text strong>Total SLA: </Text>
                          <Text>14 hari kerja</Text>
                        </p>
                      </div>
                    }
                    type="info"
                    style={{ marginBottom: 16 }}
                  />
                </Col>
                <Col span={12}>
                  <Card size="small" style={{ background: '#f6ffed', borderColor: '#52c41a' }}>
                    <Statistic
                      title="Tahap Telaah"
                      value={5}
                      suffix="hari kerja"
                      valueStyle={{ color: '#52c41a' }}
                    />
                  </Card>
                </Col>
                <Col span={12}>
                  <Card size="small" style={{ background: '#f9f0ff', borderColor: '#722ed1' }}>
                    <Statistic
                      title="Tahap Arsip"
                      value={7}
                      suffix="hari kerja"
                      valueStyle={{ color: '#722ed1' }}
                    />
                  </Card>
                </Col>
              </Row>
            </Card>
          </Col>

          <Col xs={24} lg={12}>
            <Card
              title={
                <Space>
                  <AlertOutlined />
                  <span>Notifikasi Otomatis</span>
                </Space>
              }
              style={{ borderRadius: 12 }}
            >
              <Alert
                message="Akan Jatuh Tempo"
                description="Sistem mengirimkan notifikasi 3 hari sebelum deadline"
                type="warning"
                showIcon
                style={{ marginBottom: 12 }}
              />
              <Alert
                message="Overdue"
                description="Sistem mengirimkan notifikasi saat SK melewati SLA"
                type="error"
                showIcon
                style={{ marginBottom: 12 }}
              />
              <Alert
                message="Perubahan Status"
                description="Notifikasi setiap perubahan tahapan proses"
                type="info"
                showIcon
                style={{ marginBottom: 12 }}
              />
              <Alert
                message="Dokumen Selesai"
                description="Notifikasi saat SK selesai diproses"
                type="success"
                showIcon
              />
            </Card>
          </Col>
        </Row>
      </Spin>
    </div>
  );
}
