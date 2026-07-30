import { useState, useEffect } from 'react';
import { Card, Row, Col, Statistic, Table, Select, Typography, Spin, Tabs } from 'antd';
import {
  FileTextOutlined,
  SafetyCertificateOutlined,
  FolderOutlined,
  CheckCircleOutlined,
  GlobalOutlined,
  TeamOutlined,
} from '@ant-design/icons';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
} from 'recharts';
import { skPerhutananApi, YearlyStatistics, MonthlyStatistics, SKStatistics, StatisticsQuery } from '../../api/skPerhutanan';

const { Title } = Typography;

const STATS_CONFIG = [
  {
    key: 'surat_ada',
    label: 'Surat Ada',
    suffix: '',
    icon: <FileTextOutlined />,
    color: '#1890ff',
    barColor: '#1890ff',
  },
  {
    key: 'nd_ada',
    label: 'ND Ada',
    suffix: '',
    icon: <SafetyCertificateOutlined />,
    color: '#52c41a',
    barColor: '#52c41a',
  },
  {
    key: 'sk_ada',
    label: 'SK Ada',
    suffix: '',
    icon: <FolderOutlined />,
    color: '#faad14',
    barColor: '#faad14',
  },
  {
    key: 'selesai',
    label: 'Selesai',
    suffix: '',
    icon: <CheckCircleOutlined />,
    color: '#722ed1',
    barColor: '#722ed1',
  },
  {
    key: 'total_luas',
    label: 'Total Luas',
    suffix: ' Ha',
    icon: <GlobalOutlined />,
    color: '#13c2c2',
    barColor: '#13c2c2',
  },
  {
    key: 'total_jml_kk',
    label: 'Total Jml KK',
    suffix: ' KK',
    icon: <TeamOutlined />,
    color: '#eb2f96',
    barColor: '#eb2f96',
  },
];

export default function StatsSKPage() {
  const [loading, setLoading] = useState(true);
  const [statistics, setStatistics] = useState<SKStatistics | null>(null);
  const [selectedYear, setSelectedYear] = useState<number | null>(null);

  const fetchStatistics = async (query?: StatisticsQuery) => {
    setLoading(true);
    try {
      const res = await skPerhutananApi.getStatistics(query);
      setStatistics(res.data?.data || { yearly: [], monthly: [], available_years: [] });
    } catch (err) {
      console.error('Failed to fetch statistics:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatistics();
  }, []);

  // Set default year when data loads
  useEffect(() => {
    if (statistics?.available_years.length && !selectedYear) {
      const currentYear = new Date().getFullYear();
      const defaultYear = statistics.available_years.includes(currentYear)
        ? currentYear
        : Math.max(...statistics.available_years);
      setSelectedYear(defaultYear);
    }
  }, [statistics]);

  const handleYearChange = (year: number) => {
    setSelectedYear(year);
    fetchStatistics({ year });
  };

  // Current year data for summary cards
  const currentYearData = statistics?.yearly.find(y => y.year === selectedYear);

  // Monthly data filtered by selected year
  const monthlyData = selectedYear
    ? statistics?.monthly.filter(m => m.year === selectedYear)
    : statistics?.monthly;

  const yearlyColumns = [
    { title: 'Tahun', dataIndex: 'year', key: 'year', width: 80 },
    { title: 'Surat Ada', dataIndex: 'surat_ada', key: 'surat_ada', width: 100 },
    { title: 'ND Ada', dataIndex: 'nd_ada', key: 'nd_ada', width: 100 },
    { title: 'SK Ada', dataIndex: 'sk_ada', key: 'sk_ada', width: 100 },
    { title: 'Selesai', dataIndex: 'selesai', key: 'selesai', width: 100 },
    {
      title: 'Total Luas (Ha)',
      dataIndex: 'total_luas',
      key: 'total_luas',
      width: 130,
      render: (v: number) => v?.toLocaleString('id-ID') ?? '-',
    },
    {
      title: 'Total Jml KK',
      dataIndex: 'total_jml_kk',
      key: 'total_jml_kk',
      width: 130,
      render: (v: number) => v?.toLocaleString('id-ID') ?? '-',
    },
  ];

  const monthlyColumns = [
    { title: 'Bulan', dataIndex: 'month_name', key: 'month_name' },
    { title: 'Surat Ada', dataIndex: 'surat_ada', key: 'surat_ada', width: 100 },
    { title: 'ND Ada', dataIndex: 'nd_ada', key: 'nd_ada', width: 100 },
    { title: 'SK Ada', dataIndex: 'sk_ada', key: 'sk_ada', width: 100 },
    { title: 'Selesai', dataIndex: 'selesai', key: 'selesai', width: 100 },
    {
      title: 'Total Luas (Ha)',
      dataIndex: 'total_luas',
      key: 'total_luas',
      width: 130,
      render: (v: number) => v?.toLocaleString('id-ID') ?? '-',
    },
    {
      title: 'Total Jml KK',
      dataIndex: 'total_jml_kk',
      key: 'total_jml_kk',
      width: 130,
      render: (v: number) => v?.toLocaleString('id-ID') ?? '-',
    },
  ];

  return (
    <div>
      <Title level={4} style={{ marginBottom: 16 }}>Statistik SK Perhutanan</Title>

      <Spin spinning={loading}>
        {/* Summary Cards */}
        <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
          {STATS_CONFIG.map(stat => (
            <Col xs={12} sm={8} md={4} key={stat.key}>
              <Card size="small" style={{ borderRadius: 12 }}>
                <Statistic
                  title={stat.label}
                  value={currentYearData?.[stat.key as keyof YearlyStatistics] as number ?? 0}
                  prefix={<span style={{ color: stat.color }}>{stat.icon}</span>}
                  valueStyle={{ color: stat.color, fontSize: 22 }}
                  suffix={stat.suffix}
                />
              </Card>
            </Col>
          ))}
        </Row>

        {/* Year Selector + Tabs */}
        <Card
          title="Detail Statistik"
          extra={
            <Select
              value={selectedYear}
              onChange={handleYearChange}
              style={{ width: 140 }}
              placeholder="Pilih Tahun"
            >
              {statistics?.available_years.map(y => (
                <Select.Option key={y} value={y}>{y}</Select.Option>
              ))}
            </Select>
          }
          style={{ borderRadius: 12 }}
        >
          <Tabs
            defaultActiveKey="yearly"
            items={[
              {
                key: 'yearly',
                label: 'Per Tahun',
                children: (
                  <>
                    {/* Yearly Bar Chart */}
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={statistics?.yearly} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="year" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="surat_ada" name="Surat Ada" fill="#1890ff" />
                        <Bar dataKey="nd_ada" name="ND Ada" fill="#52c41a" />
                        <Bar dataKey="sk_ada" name="SK Ada" fill="#faad14" />
                        <Bar dataKey="selesai" name="Selesai" fill="#722ed1" />
                      </BarChart>
                    </ResponsiveContainer>

                    {/* Luas & KK Line Chart */}
                    <ResponsiveContainer width="100%" height={250} style={{ marginTop: 16 }}>
                      <LineChart data={statistics?.yearly} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="year" />
                        <YAxis yAxisId="left" />
                        <YAxis yAxisId="right" orientation="right" />
                        <Tooltip />
                        <Legend />
                        <Line yAxisId="left" type="monotone" dataKey="total_luas" name="Total Luas (Ha)" stroke="#13c2c2" strokeWidth={2} dot={{ r: 4 }} />
                        <Line yAxisId="right" type="monotone" dataKey="total_jml_kk" name="Total Jml KK" stroke="#eb2f96" strokeWidth={2} dot={{ r: 4 }} />
                      </LineChart>
                    </ResponsiveContainer>

                    {/* Yearly Table */}
                    <Table
                      dataSource={statistics?.yearly}
                      rowKey="year"
                      size="small"
                      pagination={false}
                      style={{ marginTop: 16 }}
                      columns={yearlyColumns}
                    />
                  </>
                ),
              },
              {
                key: 'monthly',
                label: `Per Bulan (${selectedYear || '-'}):`,
                children: (
                  <>
                    {/* Monthly Bar Chart */}
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={monthlyData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="month_name" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="surat_ada" name="Surat Ada" fill="#1890ff" />
                        <Bar dataKey="nd_ada" name="ND Ada" fill="#52c41a" />
                        <Bar dataKey="sk_ada" name="SK Ada" fill="#faad14" />
                        <Bar dataKey="selesai" name="Selesai" fill="#722ed1" />
                      </BarChart>
                    </ResponsiveContainer>

                    {/* Luas & KK Line Chart */}
                    <ResponsiveContainer width="100%" height={250} style={{ marginTop: 16 }}>
                      <LineChart data={monthlyData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="month_name" />
                        <YAxis yAxisId="left" />
                        <YAxis yAxisId="right" orientation="right" />
                        <Tooltip />
                        <Legend />
                        <Line yAxisId="left" type="monotone" dataKey="total_luas" name="Total Luas (Ha)" stroke="#13c2c2" strokeWidth={2} dot={{ r: 4 }} />
                        <Line yAxisId="right" type="monotone" dataKey="total_jml_kk" name="Total Jml KK" stroke="#eb2f96" strokeWidth={2} dot={{ r: 4 }} />
                      </LineChart>
                    </ResponsiveContainer>

                    {/* Monthly Table */}
                    <Table
                      dataSource={monthlyData}
                      rowKey={(record) => `${record.year}-${record.month}`}
                      size="small"
                      pagination={false}
                      style={{ marginTop: 16 }}
                      columns={monthlyColumns}
                    />
                  </>
                ),
              },
            ]}
          />
        </Card>
      </Spin>
    </div>
  );
}
