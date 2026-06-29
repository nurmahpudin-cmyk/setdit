import { useEffect, useState } from 'react';
import { Table, Card, Input, Select, Space, Typography, Button, Grid } from 'antd';
import { ReloadOutlined } from '@ant-design/icons';
import { api } from '../../api/axios';

const { Title } = Typography;
const { useBreakpoint } = Grid;

export default function ActivityLogsPage() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0 });
  const [filters, setFilters] = useState({ search: '', module: '', action: '' });
  const screens = useBreakpoint();

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await api.get('/logs/activity', {
        params: { page: pagination.page, limit: pagination.limit, ...filters },
      });
      setData(res.data.data);
      setPagination((p) => ({ ...p, total: res.data.pagination.total }));
    } catch { /* ignore */ }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, [pagination.page, filters]);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const columns: any[] = [
    {
      title: 'Waktu',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 150,
      render: (d: string) => new Date(d).toLocaleString('id-ID'),
    },
    {
      title: 'User',
      dataIndex: 'user',
      key: 'user',
      responsive: ['md'],
      render: (u: any) => u?.fullname || '-',
    },
    {
      title: 'Module',
      dataIndex: 'module',
      key: 'module',
      responsive: ['sm'],
      render: (m: string) => <code style={{ fontSize: 11 }}>{m}</code>,
    },
    {
      title: 'Action',
      dataIndex: 'action',
      key: 'action',
      responsive: ['lg'],
    },
    {
      title: 'IP Address',
      dataIndex: 'ip_address',
      key: 'ip_address',
      responsive: ['xl'],
      width: 130,
    },
    {
      title: 'Old Data',
      dataIndex: 'old_data',
      key: 'old_data',
      responsive: ['xl'],
      render: (v: any) => v ? <code style={{ fontSize: 11 }}>{JSON.stringify(v).slice(0, 40)}...</code> : '-',
    },
    {
      title: 'New Data',
      dataIndex: 'new_data',
      key: 'new_data',
      responsive: ['xl'],
      render: (v: any) => v ? <code style={{ fontSize: 11 }}>{JSON.stringify(v).slice(0, 40)}...</code> : '-',
    },
  ];

  return (
    <div>
      <Title level={4} style={{ marginBottom: 16 }}>Log Aktivitas</Title>
      <Card>
        <Space style={{ marginBottom: 16 }} wrap>
          <Input.Search
            placeholder="Search..."
            onSearch={(v) => { setFilters((f) => ({ ...f, search: v })); setPagination((p) => ({ ...p, page: 1 })); }}
          />
          <Select
            allowClear
            placeholder="Module"
            style={{ width: 140 }}
            options={['auth', 'user', 'role', 'permission', 'position', 'unit', 'setting'].map((m) => ({ label: m, value: m }))}
            onChange={(v) => { setFilters((f) => ({ ...f, module: v || '' })); setPagination((p) => ({ ...p, page: 1 })); }}
          />
          <Button onClick={fetchData} icon={<ReloadOutlined />}>Refresh</Button>
        </Space>
        <Table
          dataSource={data}
          columns={columns}
          rowKey="id"
          loading={loading}
          scroll={{ x: 'max-content' }}
          pagination={{
            current: pagination.page,
            pageSize: pagination.limit,
            total: pagination.total,
            showSizeChanger: true,
            showTotal: (t) => `Total ${t}`,
            onChange: (p, s) => setPagination((prev) => ({ ...prev, page: p, limit: s || 20 })),
          }}
        />
      </Card>
    </div>
  );
}
